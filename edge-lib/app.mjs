// =============================================================
// 会員サイトの本体（認証・認可・ページ配信）
// netlify/edge-functions/members.js から呼び出されます。
// テスト（tests/edge-auth.test.mjs）からも同じコードを直接読み込みます。
// =============================================================
import { memberPages, tools, toolFiles, reportGraceDays } from "./generated/member-content.mjs";
import { signSession, verifySession, hashPassword, sha256Hex, timingSafeEqual, b64urlDecode, DEFAULT_ITERATIONS } from "./crypto.mjs";
import { renderPage, esc, fmtDate, planName, planHasReport } from "./render.mjs";

export const COOKIE = "sr_session";
export const STORES = { members: "members", attempts: "login-attempts", reports: "reports", submissions: "submissions" };
const SESSION_HOURS = 12;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAIL_ID = 5;
const MAX_FAIL_IP = 20;
const LOCK_MS = 15 * 60 * 1000;
const MAX_UPLOAD_FILES = 4;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const DUMMY_SALT = "c3VnYXJydXNoLWR1bW15";

// ---- 日付（日本時間） ----
export function todayJST(nowMs) {
  return new Date(nowMs + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
function addDays(ymd, n) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
// 日本時間の ymd 23:59:59 を UNIX 秒で
function endOfDayJSTSec(ymd) {
  return Math.floor(new Date(ymd + "T23:59:59+09:00").getTime() / 1000);
}
export function accessLevel(member, nowMs) {
  if (!member || member.status !== "active") return null;
  const today = todayJST(nowMs);
  if (member.start && today < member.start) return null;
  if (today <= member.end) return "active";
  if (today <= addDays(member.end, reportGraceDays)) return "grace";
  return null;
}

// ---- レスポンス ----
const SEC_HEADERS = {
  "cache-control": "private, no-store, max-age=0",
  "x-robots-tag": "noindex, nofollow",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "same-origin",
  "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'",
};
function html(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: { ...SEC_HEADERS, "content-type": "text/html; charset=utf-8", ...extra } });
}
function redirect(location, extra = {}) {
  return new Response(null, { status: 303, headers: { ...SEC_HEADERS, location, ...extra } });
}
function cookieHeader(value, maxAge) {
  return `${COOKIE}=${value}; Path=/members; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return null;
}
function safeNext(next) {
  return typeof next === "string" && /^\/members\/[A-Za-z0-9\-_/.]*$/.test(next) && !next.includes("..") ? next : "/members/";
}
function sameOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) { try { return new URL(origin).host === url.host; } catch { return false; } }
  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin";
}

// ---- 画面 ----
function loginView({ error = "", info = "", next = "/members/", id = "" } = {}) {
  return `<div class="login-box"><h1>会員ログイン</h1>
${error ? `<p class="alert alert-error" role="alert">${esc(error)}</p>` : ""}${info ? `<p class="alert alert-ok" role="status">${esc(info)}</p>` : ""}
<div class="form-box"><form class="form" method="POST" action="/members/login">
<input type="hidden" name="next" value="${esc(next)}">
<div class="field"><label for="m-id">会員ID</label><input id="m-id" type="text" name="member_id" value="${esc(id)}" autocomplete="username" autocapitalize="characters" required maxlength="20" inputmode="latin"></div>
<div class="field"><label for="m-pw">パスワード</label><input id="m-pw" type="password" name="password" autocomplete="current-password" required maxlength="100"></div>
<div><button class="btn" type="submit">ログインする</button></div>
</form></div>
<p class="note">会員IDとパスワードは、ご入金の確認後にメールでお送りしています。パスワードを忘れた場合は、<a href="/contact/">お問い合わせフォーム</a>の「会員サイト・ログインについて」からご連絡ください。</p></div>`;
}

const notFound = (member, access) => html(renderPage({ title: "ページが見つかりません", member, access, main: `<h1>ページが見つかりません</h1><p>URLをご確認ください。</p><p><a href="/members/">会員トップへ</a></p>` }), 404);
const forbidden = (member, access, msg) => html(renderPage({ title: "ご利用いただけません", member, access, main: `<h1>このページはご利用いただけません</h1><p>${esc(msg)}</p><p><a href="/members/">会員トップへ</a></p>` }), 403);

// =============================================================
export function createHandler({ getStore, env, now = () => Date.now() }) {
  const store = (name) => getStore(name);

  async function loadMember(id) {
    if (!/^[A-Z0-9-]{3,20}$/.test(id || "")) return null;
    try { return await store(STORES.members).get(id, { type: "json" }); } catch { return null; }
  }

  async function currentSession(request, secret) {
    const token = readCookie(request, COOKIE);
    const p = await verifySession(secret, token, Math.floor(now() / 1000));
    if (!p) return null;
    const member = await loadMember(p.sub);
    if (!member || member.pv !== p.pv) return null;
    const access = accessLevel(member, now());
    if (!access) return null;
    return { member, access };
  }

  // ---- ログイン試行の制限 ----
  async function attemptState(key) {
    try { return (await store(STORES.attempts).get(key, { type: "json" })) || null; } catch { return null; }
  }
  function isLocked(s, t) { return s && s.lockUntil && s.lockUntil > t; }
  async function recordFail(key, max) {
    const t = now();
    let s = await attemptState(key);
    if (!s || t - s.first > WINDOW_MS) s = { fails: 0, first: t };
    s.fails += 1;
    if (s.fails >= max) s.lockUntil = t + LOCK_MS;
    await store(STORES.attempts).setJSON(key, s);
  }

  async function handleLogin(request, secret, ip) {
    if (!sameOrigin(request)) return html(renderPage({ title: "会員ログイン", main: loginView({ error: "ページを再読み込みしてから、もう一度お試しください。" }) }), 403);
    let form;
    try { form = await request.formData(); } catch { return html(renderPage({ title: "会員ログイン", main: loginView({ error: "入力内容を読み取れませんでした。" }) }), 400); }
    const id = String(form.get("member_id") || "").trim().toUpperCase().slice(0, 20);
    const pw = String(form.get("password") || "").slice(0, 100);
    const next = safeNext(String(form.get("next") || ""));
    const ipKey = "ip-" + (await sha256Hex(secret + "|" + (ip || "unknown"))).slice(0, 32);
    const idKey = "id-" + (await sha256Hex(secret + "|" + id)).slice(0, 32);
    const t = now();
    const [ipS, idS] = await Promise.all([attemptState(ipKey), attemptState(idKey)]);
    if (isLocked(ipS, t) || isLocked(idS, t)) {
      return html(renderPage({ title: "会員ログイン", main: loginView({ error: "ログインの失敗が続いたため、一時的にログインを制限しています。15分ほど時間をおいてからお試しください。", next, id }) }), 429);
    }
    const member = await loadMember(id);
    const salt = member?.salt || DUMMY_SALT;
    const iter = member?.iter || DEFAULT_ITERATIONS;
    const hash = await hashPassword(pw, salt, iter); // 会員が存在しない場合も同じ処理時間をかける
    const ok = !!member && timingSafeEqual(hash, member.hash || "");
    if (!ok) {
      await Promise.all([recordFail(ipKey, MAX_FAIL_IP), recordFail(idKey, MAX_FAIL_ID)]);
      return html(renderPage({ title: "会員ログイン", main: loginView({ error: "会員IDまたはパスワードが正しくありません。", next, id }) }), 401);
    }
    const access = accessLevel(member, t);
    if (!access) {
      const msg = member.status !== "active" ? "この会員IDは現在ご利用いただけません。お問い合わせフォームからご連絡ください。" : "ご利用期間外のため、ログインできません。";
      return html(renderPage({ title: "会員ログイン", main: loginView({ error: msg, id }) }), 403);
    }
    try { await store(STORES.attempts).delete(idKey); } catch {}
    const nowSec = Math.floor(t / 1000);
    const limit = endOfDayJSTSec(access === "active" ? member.end : addDays(member.end, reportGraceDays));
    const exp = Math.min(nowSec + SESSION_HOURS * 3600, limit);
    const token = await signSession(secret, { sub: member.id, pv: member.pv, iat: nowSec, exp });
    return redirect(access === "grace" ? "/members/" : next, { "set-cookie": cookieHeader(token, exp - nowSec) });
  }

  // ---- 会員トップ ----
  function topView(member, access, nowMs) {
    const today = todayJST(nowMs);
    const remain = Math.round((new Date(member.end + "T00:00:00Z") - new Date(today + "T00:00:00Z")) / 86400000) + 1;
    const links = [];
    if (access === "active") {
      links.push(["/members/articles/", "会員限定記事", "8つのテーマ・40本の記事。記録の始め方から90日間の振り返りまで。"]);
      links.push(["/members/tools/", "記録シートのダウンロード", "ご利用のプランで使える記録シート（PDF・A4）の一覧です。"]);
      if (planHasReport(member.plan)) {
        links.push(["/members/submit/", "記録を提出する", "記入したシートの写真またはPDFを送信します。"]);
        links.push(["/members/reports/", "個別レポート", "お届けしたレポートの確認とダウンロード。"]);
      }
      if (member.plan === "p90") links.push(["/members/program-90/", "90日記録サポート", "3つの期間の進め方と、提出の目安です。"]);
    } else {
      links.push(["/members/reports/", "個別レポート", "作成済みのレポートをダウンロードできます。"]);
    }
    return `<h1>会員トップ</h1>
${access === "grace" ? `<p class="alert alert-ok" role="status">ご利用期間は ${esc(fmtDate(member.end))} で終了しました。作成済みのレポートは ${esc(fmtDate(addDays(member.end, reportGraceDays)))} までダウンロードできます。</p>` : ""}
<div class="panel"><h2>ご利用状況</h2><dl class="status-dl">
<dt>会員ID</dt><dd>${esc(member.id)}</dd>
<dt>プラン</dt><dd>${esc(planName(member.plan))}</dd>
<dt>利用期間</dt><dd>${esc(fmtDate(member.start))} 〜 ${esc(fmtDate(member.end))}</dd>
${access === "active" ? `<dt>残り日数</dt><dd>${remain}日</dd>` : ""}
</dl></div>
<div class="panel"><h2>メニュー</h2><ul class="file-list">${links.map(([h, t, d]) => `<li><span class="t"><b>${t}</b><span class="desc">${d}</span></span><a class="btn btn-ghost btn-sm" href="${h}">開く</a></li>`).join("")}</ul></div>
${access === "active" ? `<p class="note">はじめての方は、会員限定記事の<a href="/members/articles/article-31/">記事31「はじめての生活習慣記録」</a>と<a href="/members/articles/article-36/">記事36「7日間セルフチェックプログラム」</a>、記録シートの「記録ツール利用ガイド」からお読みください。</p>` : ""}`;
  }

  // ---- 記録シート ----
  function toolsView(member) {
    return `<h1>記録シートのダウンロード</h1><p>PDFをA4用紙に印刷してお使いください。ご利用のプランで使えるシートにはダウンロードボタンが表示されます。</p>
<ul class="file-list">${tools.map((t) => {
      const ok = t.plans.includes(member.plan);
      return `<li id="${t.id}"><span class="t"><b>${esc(t.title)}</b><span class="desc">${esc(t.desc)}（A4・${t.pages}ページ）</span></span>${ok ? `<a class="btn btn-ghost btn-sm" href="/members/tools/${t.file}" download>PDFをダウンロード</a>` : `<span class="locked">${esc(t.plans.map(planName).join("・"))}で利用できます</span>`}</li>`;
    }).join("")}</ul>`;
  }

  // ---- 記録提出 ----
  function submitView(member, { error = "", ok = "", history = [] } = {}) {
    return `<h1>記録の提出</h1>
${error ? `<p class="alert alert-error" role="alert">${esc(error)}</p>` : ""}${ok ? `<p class="alert alert-ok" role="status">${esc(ok)}</p>` : ""}
<p>記入した記録シートの写真（JPEG・PNG）またはPDFを添付し、各分野の要点をご記入ください。提出内容はご本人と当社の担当者だけが確認します。</p>
<div class="form-box"><form class="form" method="POST" action="/members/submit/" enctype="multipart/form-data">
<div class="field"><label for="s-round">提出する回<span class="req">必須</span></label><select id="s-round" name="round" required><option value="">選択してください</option><option value="1">1回目（1〜30日目）</option>${member.plan === "p90" ? '<option value="2">2回目（31〜60日目）</option><option value="3">3回目（61〜90日目）</option>' : ""}<option value="extra">追加・差し替え</option></select></div>
<div class="field"><label for="s-days">記録を書いた日数<span class="req">必須</span></label><input id="s-days" type="number" name="days" min="0" max="31" required inputmode="numeric"><p class="hint">一部でも書いた日を数えてください。</p></div>
<div class="field"><label for="s-sleep">睡眠について<span class="opt">任意</span></label><textarea id="s-sleep" name="sleep" maxlength="1000" style="min-height:100px"></textarea></div>
<div class="field"><label for="s-move">運動・活動について<span class="opt">任意</span></label><textarea id="s-move" name="activity" maxlength="1000" style="min-height:100px"></textarea></div>
<div class="field"><label for="s-food">食生活について<span class="opt">任意</span></label><textarea id="s-food" name="food" maxlength="1000" style="min-height:100px"></textarea></div>
<div class="field"><label for="s-beauty">美容習慣について<span class="opt">任意</span></label><textarea id="s-beauty" name="beauty" maxlength="1000" style="min-height:100px"></textarea></div>
<div class="field"><label for="s-note">気づいたこと・レポートで見てほしいこと<span class="opt">任意</span></label><textarea id="s-note" name="note" maxlength="2000" style="min-height:120px"></textarea></div>
<div class="field"><label for="s-files">記録シートの画像・PDF<span class="req">必須</span></label><input id="s-files" type="file" name="files" accept="image/jpeg,image/png,application/pdf" multiple required><p class="hint">最大${MAX_UPLOAD_FILES}ファイル、合計5MBまで。写真は明るい場所で、シート全体が写るように撮影してください。</p></div>
<div class="field"><label class="check"><input type="checkbox" name="no_medical" value="yes" required><span>病名・服薬・検査結果など、医療に関する情報を含んでいないことを確認しました。<span class="req">必須</span></span></label></div>
<div><button class="btn" type="submit">記録を提出する</button></div>
</form></div>
<div class="panel" style="margin-top:28px"><h2>提出履歴</h2>${history.length ? `<ul class="file-list">${history.map((h) => `<li><span class="t"><b>${esc(h.label)}</b><span class="desc">${esc(h.when)}・添付${h.files}件</span></span></li>`).join("")}</ul>` : `<p class="empty">まだ提出はありません。</p>`}</div>`;
  }

  async function submissionHistory(member) {
    try {
      const { blobs } = await store(STORES.submissions).list({ prefix: member.id + "/" });
      const metas = blobs.filter((b) => b.key.endsWith(".json")).map((b) => b.key).sort().reverse().slice(0, 12);
      const items = await Promise.all(metas.map((k) => store(STORES.submissions).get(k, { type: "json" })));
      return items.filter(Boolean).map((s) => ({ label: s.round === "extra" ? "追加・差し替え" : `${s.round}回目`, when: s.submittedAtJST, files: (s.files || []).length }));
    } catch { return []; }
  }

  function sniff(u8) {
    if (u8.length > 4 && u8[0] === 0x25 && u8[1] === 0x50 && u8[2] === 0x44 && u8[3] === 0x46) return { ext: "pdf", type: "application/pdf" };
    if (u8.length > 3 && u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
    if (u8.length > 8 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return { ext: "png", type: "image/png" };
    return null;
  }

  async function handleSubmit(request, member, access) {
    if (!sameOrigin(request)) return forbidden(member, access, "ページを再読み込みしてから、もう一度お試しください。");
    const len = Number(request.headers.get("content-length") || 0);
    if (len > MAX_UPLOAD_BYTES + 200 * 1024) return html(renderPage({ title: "記録の提出", path: "/members/submit/", member, access, main: submitView(member, { error: "ファイルの合計サイズが5MBを超えています。枚数を減らすか、画像を小さくしてから提出してください。", history: await submissionHistory(member) }) }), 413);
    let form;
    try { form = await request.formData(); } catch { return html(renderPage({ title: "記録の提出", path: "/members/submit/", member, access, main: submitView(member, { error: "送信内容を読み取れませんでした。もう一度お試しください。" }) }), 400); }
    const round = String(form.get("round") || "");
    const allowedRounds = member.plan === "p90" ? ["1", "2", "3", "extra"] : ["1", "extra"];
    const days = Number(form.get("days"));
    const files = form.getAll("files").filter((f) => f && typeof f === "object" && f.size > 0);
    let error = "";
    if (!allowedRounds.includes(round)) error = "提出する回を選択してください。";
    else if (!Number.isInteger(days) || days < 0 || days > 31) error = "記録を書いた日数を0〜31で入力してください。";
    else if (form.get("no_medical") !== "yes") error = "医療に関する情報を含まないことを確認してください。";
    else if (!files.length) error = "記録シートの画像またはPDFを添付してください。";
    else if (files.length > MAX_UPLOAD_FILES) error = `添付できるファイルは${MAX_UPLOAD_FILES}件までです。`;
    else if (files.reduce((a, f) => a + f.size, 0) > MAX_UPLOAD_BYTES) error = "ファイルの合計サイズが5MBを超えています。";
    const bufs = [];
    if (!error) {
      for (const f of files) {
        const u8 = new Uint8Array(await f.arrayBuffer());
        const kind = sniff(u8);
        if (!kind) { error = "JPEG・PNG・PDF以外のファイルは提出できません。iPhoneの写真は「互換性優先」の設定で撮影するか、PDFに変換してください。"; break; }
        bufs.push({ u8, kind });
      }
    }
    if (error) return html(renderPage({ title: "記録の提出", path: "/members/submit/", member, access, main: submitView(member, { error, history: await submissionHistory(member) }) }), 400);

    const t = now();
    const stamp = new Date(t).toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
    const base = `${member.id}/${stamp}`;
    const s = store(STORES.submissions);
    const fileKeys = [];
    for (let i = 0; i < bufs.length; i++) {
      const key = `${base}-${i + 1}.${bufs[i].kind.ext}`;
      await s.set(key, bufs[i].u8, { metadata: { contentType: bufs[i].kind.type } });
      fileKeys.push(key);
    }
    const text = (k, n) => String(form.get(k) || "").slice(0, n);
    const jst = new Date(t + 9 * 3600 * 1000).toISOString().replace("T", " ").slice(0, 16);
    await s.setJSON(`${base}.json`, {
      memberId: member.id, plan: member.plan, round, days,
      sleep: text("sleep", 1000), activity: text("activity", 1000), food: text("food", 1000), beauty: text("beauty", 1000), note: text("note", 2000),
      files: fileKeys, submittedAt: new Date(t).toISOString(), submittedAtJST: jst,
    });
    return html(renderPage({ title: "記録の提出", path: "/members/submit/", member, access, main: submitView(member, { ok: `提出を受け付けました（${jst}）。レポートの準備ができましたら「個別レポート」に掲載します。`, history: await submissionHistory(member) }) }));
  }

  // ---- 個別レポート ----
  async function reportsView(member, access) {
    let items = [];
    try {
      const { blobs } = await store(STORES.reports).list({ prefix: member.id + "/" });
      items = await Promise.all(blobs.map(async (b) => {
        const m = await store(STORES.reports).getMetadata(b.key);
        return { id: b.key.slice(member.id.length + 1), title: m?.metadata?.title || "振り返りレポート", date: m?.metadata?.uploadedAt || "" };
      }));
      items.sort((a, b) => (a.date < b.date ? 1 : -1));
    } catch { items = []; }
    return `<h1>個別レポート</h1><p>お届けしたレポートは、ご本人のみ閲覧・ダウンロードできます。${access === "grace" ? "" : `利用期間の終了後も${reportGraceDays}日間はダウンロードできます。`}</p>
${items.length ? `<ul class="file-list">${items.map((r) => `<li><span class="t"><b>${esc(r.title)}</b><span class="desc">${r.date ? "掲載日：" + esc(fmtDate(r.date.slice(0, 10))) : ""}</span></span><a class="btn btn-ghost btn-sm" href="/members/reports/${encodeURIComponent(r.id)}">PDFを開く</a></li>`).join("")}</ul>` : `<p class="empty">現在、掲載中のレポートはありません。${planHasReport(member.plan) ? "記録を提出していただくと、制作後にこちらに掲載されます。" : ""}</p>`}
<p class="note">レポートは、記録された情報を整理した資料であり、医学的な判断や指示を含むものではありません。</p>`;
  }

  async function reportFile(member, id) {
    if (!/^[A-Za-z0-9_-]{1,80}\.pdf$/.test(id)) return null;
    const key = `${member.id}/${id}`; // 会員IDはセッションから取るため、他の会員のファイルには届かない
    try {
      const r = await store(STORES.reports).getWithMetadata(key, { type: "arrayBuffer" });
      if (!r) return null;
      return new Response(r.data, { status: 200, headers: { ...SEC_HEADERS, "content-type": "application/pdf", "content-disposition": `inline; filename="${id}"` } });
    } catch { return null; }
  }

  // =========================================================
  return async function handle(request, { ip } = {}) {
    const url = new URL(request.url);
    let path = url.pathname;
    const method = request.method.toUpperCase();
    const secret = env("SESSION_SECRET");
    if (!secret || secret.length < 32) {
      return html(renderPage({ title: "準備中", main: `<h1>会員ページは準備中です</h1><p>現在、会員ページの設定を行っています。しばらくしてから再度アクセスしてください。</p>` }), 503);
    }
    if (path === "/members") return redirect("/members/");

    // ログイン・ログアウト
    if (path === "/members/login" || path === "/members/login/") {
      if (method === "POST") return handleLogin(request, secret, ip);
      if (method !== "GET" && method !== "HEAD") return new Response(null, { status: 405, headers: SEC_HEADERS });
      const s = await currentSession(request, secret);
      if (s) return redirect("/members/");
      const info = url.searchParams.get("out") ? "ログアウトしました。" : "";
      return html(renderPage({ title: "会員ログイン", main: loginView({ info, next: safeNext(url.searchParams.get("next") || "") }) }));
    }
    if (path === "/members/logout" || path === "/members/logout/") {
      if (method !== "POST") return redirect("/members/");
      if (!sameOrigin(request)) return new Response("Forbidden", { status: 403, headers: SEC_HEADERS });
      return redirect("/members/login?out=1", { "set-cookie": cookieHeader("", 0) });
    }

    // ここから先は認証必須
    const session = await currentSession(request, secret);
    if (!session) {
      const clear = readCookie(request, COOKIE) ? { "set-cookie": cookieHeader("", 0) } : {};
      if (method === "GET" || method === "HEAD") return redirect("/members/login?next=" + encodeURIComponent(safeNext(path)), clear);
      return new Response("Unauthorized", { status: 401, headers: { ...SEC_HEADERS, ...clear } });
    }
    const { member, access } = session;

    // 末尾スラッシュをそろえる（ファイルを除く）
    if (!path.endsWith("/") && !/\.[a-z0-9]+$/i.test(path)) return redirect(path + "/");

    if (path === "/members/") return html(renderPage({ title: "会員トップ", path, member, access, main: topView(member, access, now()) }));

    // 個別レポート（利用期間終了後の猶予期間も可）
    if (path === "/members/reports/") {
      if (!planHasReport(member.plan)) return forbidden(member, access, "個別レポートは、スタンダードプラン・90日継続プランでご利用いただけます。");
      return html(renderPage({ title: "個別レポート", path, member, access, main: await reportsView(member, access) }));
    }
    if (path.startsWith("/members/reports/")) {
      const res = await reportFile(member, decodeURIComponent(path.slice("/members/reports/".length)));
      return res || notFound(member, access);
    }

    if (access !== "active") return forbidden(member, access, "ご利用期間が終了しています。作成済みのレポートのみダウンロードできます。");

    if (path === "/members/tools/") return html(renderPage({ title: "記録シート", path, member, access, main: toolsView(member) }));
    if (path.startsWith("/members/tools/")) {
      const file = path.slice("/members/tools/".length);
      const t = tools.find((x) => x.file === file);
      if (!t) return notFound(member, access);
      if (!t.plans.includes(member.plan)) return forbidden(member, access, `このシートは${t.plans.map(planName).join("・")}でご利用いただけます。`);
      const bytes = b64urlDecode(toolFiles[t.file].replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
      return new Response(bytes, { status: 200, headers: { ...SEC_HEADERS, "content-type": "application/pdf", "content-disposition": `attachment; filename="${t.file}"` } });
    }

    if (path === "/members/submit/") {
      if (!planHasReport(member.plan)) return forbidden(member, access, "記録の提出は、スタンダードプラン・90日継続プランでご利用いただけます。");
      if (method === "POST") return handleSubmit(request, member, access);
      return html(renderPage({ title: "記録の提出", path, member, access, main: submitView(member, { history: await submissionHistory(member) }) }));
    }

    const pg = memberPages[path];
    if (pg) {
      if (pg.plans && !pg.plans.includes(member.plan)) return forbidden(member, access, `このページは${pg.plans.map(planName).join("・")}の方向けです。`);
      return html(renderPage({ title: pg.title, path, member, access, main: pg.main }));
    }
    return notFound(member, access);
  };
}
