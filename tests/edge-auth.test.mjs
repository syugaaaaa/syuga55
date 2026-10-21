// 会員認証・認可のテスト（npm run build のあとに npm test）
// Edge Function と同じ edge-lib/app.mjs を読み込み、Netlify Blobs の代わりにメモリ上のストアで動作を確認します。
import assert from "node:assert/strict";
import { createHandler, COOKIE } from "../edge-lib/app.mjs";
import { hashPassword, randomB64url } from "../edge-lib/crypto.mjs";

// ---- Netlify Blobs の代用（メモリ） ----
function memoryBlobs() {
  const stores = new Map();
  return (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name);
    return {
      async get(key, opt = {}) { const e = m.get(key); if (!e) return null; if (opt.type === "json") return JSON.parse(new TextDecoder().decode(e.data)); if (opt.type === "arrayBuffer") return e.data.buffer.slice(0); return new TextDecoder().decode(e.data); },
      async set(key, data, opt = {}) { m.set(key, { data: data instanceof Uint8Array ? data : new TextEncoder().encode(String(data)), metadata: opt.metadata || {} }); return { modified: true }; },
      async setJSON(key, obj, opt = {}) { return this.set(key, new TextEncoder().encode(JSON.stringify(obj)), opt); },
      async delete(key) { m.delete(key); },
      async list({ prefix = "" } = {}) { return { blobs: [...m.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key, etag: "x" })), directories: [] }; },
      async getMetadata(key) { const e = m.get(key); return e ? { etag: "x", metadata: e.metadata } : null; },
      async getWithMetadata(key, opt = {}) { const e = m.get(key); if (!e) return null; return { data: opt.type === "arrayBuffer" ? e.data.buffer.slice(0) : e.data, etag: "x", metadata: e.metadata }; },
    };
  };
}

const SECRET = "test-secret-0123456789-abcdefghijklmnop";
let NOW = Date.parse("2026-10-20T03:00:00Z"); // 2026-10-20 12:00 JST
const getStore = memoryBlobs();
const env = (k) => (k === "SESSION_SECRET" ? SECRET : undefined);
const handle = createHandler({ getStore, env, now: () => NOW });
const ORIGIN = "https://sugar-rush.example";

async function addMember(id, plan, start, end, password, status = "active") {
  const salt = randomB64url(16);
  await getStore("members").setJSON(id, { id, displayName: id + "様", plan, start, end, status, salt, iter: 20000, hash: await hashPassword(password, salt, 20000), pv: 1 });
}
const req = (path, { method = "GET", cookie, body, origin = ORIGIN, headers = {} } = {}) =>
  new Request(ORIGIN + path, { method, body, headers: { ...(cookie ? { cookie: `${COOKIE}=${cookie}` } : {}), ...(origin ? { origin } : {}), ...headers } });
const form = (o) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };
async function login(id, pw, ip = "198.51.100.1") {
  const r = await handle(req("/members/login", { method: "POST", body: form({ member_id: id, password: pw, next: "/members/" }) }), { ip });
  const sc = r.headers.get("set-cookie") || "";
  return { r, sc, token: (sc.match(new RegExp(`${COOKIE}=([^;]*)`)) || [])[1] };
}

let passed = 0;
const results = [];
async function t(name, fn) {
  try { await fn(); passed++; results.push("  ✔ " + name); }
  catch (e) { results.push("  ✘ " + name + "\n     " + e.message); process.exitCode = 1; }
}

await addMember("SR0001", "basic", "2026-10-10", "2026-11-08", "basic-pass-1111");
await addMember("SR0002", "standard", "2026-10-01", "2026-10-30", "std-pass-2222");
await addMember("SR0003", "standard", "2026-10-01", "2026-10-30", "std-pass-3333");
await addMember("SR0004", "p90", "2026-09-01", "2026-11-29", "p90-pass-4444");
await addMember("SR0005", "standard", "2026-08-01", "2026-08-30", "old-pass-5555");     // 期限切れ（猶予も終了）
await addMember("SR0006", "standard", "2026-09-01", "2026-09-30", "grace-pass-6666");   // 猶予期間中
await addMember("SR0007", "basic", "2026-10-01", "2026-10-30", "susp-pass-7777", "suspended");

// --- 未認証 ---
await t("SESSION_SECRET 未設定なら 503（会員ページを出さない）", async () => {
  const h = createHandler({ getStore, env: () => undefined, now: () => NOW });
  const r = await h(req("/members/articles/"), {});
  assert.equal(r.status, 503);
});
await t("未認証で /members/ はログイン画面へリダイレクト", async () => {
  const r = await handle(req("/members/"), {});
  assert.equal(r.status, 303);
  assert.match(r.headers.get("location"), /^\/members\/login\?next=/);
});
for (const p of ["/members/articles/article-01/", "/members/tools/record-30days.pdf", "/members/reports/x.pdf", "/members/program-90/", "/members/submit/"]) {
  await t(`未認証の直接アクセスで内容を返さない：${p}`, async () => {
    const r = await handle(req(p), {});
    assert.equal(r.status, 303);
    assert.equal(await r.text(), "");
  });
}
await t("未認証の POST（記録提出）は 401", async () => {
  const r = await handle(req("/members/submit/", { method: "POST", body: form({ round: "1" }) }), {});
  assert.equal(r.status, 401);
});
await t("ログイン画面は表示でき、キャッシュされない", async () => {
  const r = await handle(req("/members/login"), {});
  assert.equal(r.status, 200);
  assert.match(await r.text(), /会員ログイン/);
  assert.match(r.headers.get("cache-control"), /no-store/);
});

// --- ログイン ---
await t("パスワード誤りは 401（Cookie を発行しない）", async () => {
  const { r, sc } = await login("SR0001", "wrong", "198.51.100.9");
  assert.equal(r.status, 401); assert.equal(sc, "");
});
await t("存在しない会員IDも同じエラー文言", async () => {
  const { r } = await login("SR9999", "whatever", "198.51.100.9");
  assert.equal(r.status, 401);
  assert.match(await r.text(), /会員IDまたはパスワードが正しくありません/);
});
await t("他サイトからのログイン POST は 403（Origin 検証）", async () => {
  const r = await handle(req("/members/login", { method: "POST", origin: "https://evil.example", body: form({ member_id: "SR0001", password: "basic-pass-1111" }) }), { ip: "1.1.1.1" });
  assert.equal(r.status, 403);
});
await t("同じ会員IDで5回失敗するとロック（正しいパスワードでも 429）", async () => {
  for (let i = 0; i < 5; i++) await login("SR0003", "bad" + i, "203.0.113." + i);
  const { r } = await login("SR0003", "std-pass-3333", "203.0.113.50");
  assert.equal(r.status, 429);
});
await t("ロックは15分後に解除される", async () => {
  NOW += 16 * 60 * 1000;
  const { r } = await login("SR0003", "std-pass-3333", "203.0.113.51");
  assert.equal(r.status, 303);
  NOW -= 16 * 60 * 1000;
});
let basicTok;
await t("正しい認証で署名付きCookie（HttpOnly・Secure・SameSite=Lax・Path=/members）", async () => {
  const { r, sc, token } = await login("SR0001", "basic-pass-1111");
  assert.equal(r.status, 303);
  for (const a of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/members", "Max-Age="]) assert.ok(sc.includes(a), "属性がありません: " + a);
  assert.ok(token && token.includes("."));
  basicTok = token;
});
await t("停止中の会員はログインできない", async () => {
  const { r } = await login("SR0007", "susp-pass-7777");
  assert.equal(r.status, 403);
});
await t("利用期限切れ（猶予終了）の会員はログインできない", async () => {
  const { r } = await login("SR0005", "old-pass-5555");
  assert.equal(r.status, 403);
});

// --- 認証後（ベーシック） ---
await t("会員トップ・記事一覧・記事詳細を表示できる", async () => {
  for (const p of ["/members/", "/members/articles/", "/members/articles/article-01/"]) {
    const r = await handle(req(p, { cookie: basicTok }), {});
    assert.equal(r.status, 200, p);
  }
});
await t("プランで使えるPDFはダウンロードできる（application/pdf）", async () => {
  const r = await handle(req("/members/tools/record-30days.pdf", { cookie: basicTok }), {});
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/pdf");
  const head = new Uint8Array(await r.arrayBuffer()).slice(0, 4);
  assert.equal(new TextDecoder().decode(head), "%PDF");
});
await t("プラン外のPDF（ベーシックで90日シート）は 403", async () => {
  const r = await handle(req("/members/tools/record-90days.pdf", { cookie: basicTok }), {});
  assert.equal(r.status, 403);
});
await t("ベーシックは記録提出・レポート・90日サポートを使えない", async () => {
  for (const p of ["/members/submit/", "/members/reports/", "/members/program-90/"]) {
    const r = await handle(req(p, { cookie: basicTok }), {});
    assert.equal(r.status, 403, p);
  }
});
await t("改ざんしたCookieは無効", async () => {
  const [body, sig] = basicTok.split(".");
  const forged = Buffer.from(JSON.stringify({ sub: "SR0004", pv: 1, iat: 0, exp: 9999999999 })).toString("base64url") + "." + sig;
  const r = await handle(req("/members/", { cookie: forged }), {});
  assert.equal(r.status, 303);
});

// --- 個別レポートの分離 ---
let tokA, tokB;
await t("個別レポート：本人のファイルだけ取得できる", async () => {
  tokA = (await login("SR0002", "std-pass-2222")).token;
  tokB = (await login("SR0003", "std-pass-3333", "203.0.113.99")).token;
  await getStore("reports").set("SR0002/2026-10-monthly.pdf", new TextEncoder().encode("%PDF-1.4 A"), { metadata: { title: "A のレポート", uploadedAt: "2026-10-15T00:00:00Z" } });
  const ra = await handle(req("/members/reports/2026-10-monthly.pdf", { cookie: tokA }), {});
  assert.equal(ra.status, 200);
  const rb = await handle(req("/members/reports/2026-10-monthly.pdf", { cookie: tokB }), {});
  assert.equal(rb.status, 404, "他の会員のレポートが見えてはいけない");
  const listB = await (await handle(req("/members/reports/", { cookie: tokB }), {})).text();
  assert.ok(!listB.includes("A のレポート"));
  const listA = await (await handle(req("/members/reports/", { cookie: tokA }), {})).text();
  assert.ok(listA.includes("A のレポート"));
});
await t("パス操作（../ など）で他の会員のファイルに届かない", async () => {
  for (const p of ["/members/reports/..%2FSR0002%2F2026-10-monthly.pdf", "/members/reports/../SR0002/2026-10-monthly.pdf", "/members/reports/%2E%2E%2FSR0002%2F2026-10-monthly.pdf"]) {
    const r = await handle(req(p, { cookie: tokB }), {});
    assert.notEqual(r.status, 200, p);
  }
});

// --- 記録提出 ---
await t("記録提出：JPEGを受け付け、本人の領域に保存する", async () => {
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
  const f = form({ round: "1", days: "24", sleep: "平日はそろっていた", no_medical: "yes" });
  f.append("files", new Blob([jpg], { type: "image/jpeg" }), "sheet.jpg");
  const r = await handle(req("/members/submit/", { method: "POST", cookie: tokA, body: f }), {});
  assert.equal(r.status, 200);
  assert.match(await r.text(), /提出を受け付けました/);
  const { blobs } = await getStore("submissions").list({ prefix: "SR0002/" });
  assert.equal(blobs.length, 2);
});
await t("記録提出：画像・PDF以外は拒否", async () => {
  const f = form({ round: "1", days: "10", no_medical: "yes" });
  f.append("files", new Blob([new TextEncoder().encode("MZ fake exe")], { type: "image/jpeg" }), "x.jpg");
  const r = await handle(req("/members/submit/", { method: "POST", cookie: tokA, body: f }), {});
  assert.equal(r.status, 400);
});
await t("記録提出：医療情報なしの確認がないと拒否", async () => {
  const f = form({ round: "1", days: "10" });
  f.append("files", new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])]), "x.pdf");
  const r = await handle(req("/members/submit/", { method: "POST", cookie: tokA, body: f }), {});
  assert.equal(r.status, 400);
});
await t("記録提出：他サイトからの POST は 403", async () => {
  const r = await handle(req("/members/submit/", { method: "POST", cookie: tokA, origin: "https://evil.example", body: form({ round: "1" }) }), {});
  assert.equal(r.status, 403);
});

// --- 90日プラン ---
await t("90日プランは90日シート・90日サポートを使える", async () => {
  const tok = (await login("SR0004", "p90-pass-4444")).token;
  assert.equal((await handle(req("/members/tools/record-90days.pdf", { cookie: tok }), {})).status, 200);
  assert.equal((await handle(req("/members/program-90/", { cookie: tok }), {})).status, 200);
});

// --- 期限・猶予 ---
await t("猶予期間中はレポートのみ（記事・シートは 403）", async () => {
  const { r, token } = await login("SR0006", "grace-pass-6666");
  assert.equal(r.status, 303);
  assert.equal((await handle(req("/members/reports/", { cookie: token }), {})).status, 200);
  assert.equal((await handle(req("/members/articles/", { cookie: token }), {})).status, 403);
  assert.equal((await handle(req("/members/tools/guide.pdf", { cookie: token }), {})).status, 403);
});
await t("利用期限を過ぎると既存のCookieでも見られない", async () => {
  const saved = NOW;
  NOW = Date.parse("2026-11-09T03:00:00Z"); // SR0001 の終了日（11/8）の翌日
  const r = await handle(req("/members/articles/", { cookie: basicTok }), {});
  assert.equal(r.status, 303);
  NOW = saved;
});
await t("パスワード再発行（pv更新）で既存のログインが無効になる", async () => {
  const m = await getStore("members").get("SR0002", { type: "json" });
  m.pv += 1; await getStore("members").setJSON("SR0002", m);
  const r = await handle(req("/members/", { cookie: tokA }), {});
  assert.equal(r.status, 303);
});

// --- ログアウト ---
await t("ログアウトで Cookie を削除（Max-Age=0）", async () => {
  const r = await handle(req("/members/logout", { method: "POST", cookie: basicTok }), {});
  assert.equal(r.status, 303);
  assert.match(r.headers.get("set-cookie"), /Max-Age=0/);
  assert.match(r.headers.get("location"), /out=1/);
});
await t("GET でのログアウトは無効（CSRF対策）", async () => {
  const r = await handle(req("/members/logout", { cookie: basicTok }), {});
  assert.equal(r.headers.get("set-cookie"), null);
});
await t("ログイン後の遷移先は /members/ 配下のみ（オープンリダイレクト防止）", async () => {
  const r = await handle(req("/members/login", { method: "POST", body: form({ member_id: "SR0004", password: "p90-pass-4444", next: "https://evil.example/" }) }), { ip: "192.0.2.77" });
  assert.equal(r.headers.get("location"), "/members/");
});


// --- 共通パスワード（MEMBER_PASSWORD） ---
{
  const MP = "shared-pass-0001";
  let envShared = { SESSION_SECRET: SECRET, MEMBER_PASSWORD: MP };
  const hS = createHandler({ getStore, env: (k) => envShared[k], now: () => NOW });
  const sharedLogin = async (pw, ip = "198.18.0.1", h = hS) => {
    const r = await h(req("/members/login", { method: "POST", body: form({ member_id: "", password: pw, next: "/members/articles/" }) }), { ip });
    return { r, token: ((r.headers.get("set-cookie") || "").match(new RegExp(`${COOKIE}=([^;]+)`)) || [])[1] };
  };
  let sTok;
  await t("共通パスワード：会員ID空欄＋正しいパスワードでログインできる", async () => {
    const { r, token } = await sharedLogin(MP);
    assert.equal(r.status, 303); assert.equal(r.headers.get("location"), "/members/articles/");
    sTok = token; assert.ok(sTok);
  });
  await t("共通パスワード：会員限定記事・すべての記録シートを使える", async () => {
    assert.equal((await hS(req("/members/articles/article-12/", { cookie: sTok }), {})).status, 200);
    assert.equal((await hS(req("/members/tools/record-90days.pdf", { cookie: sTok }), {})).status, 200);
    assert.equal((await hS(req("/members/tools/record-30days-simple.pdf", { cookie: sTok }), {})).status, 200);
  });
  await t("共通パスワード：記録提出・個別レポートは使えない（会員IDが必要）", async () => {
    assert.equal((await hS(req("/members/submit/", { cookie: sTok }), {})).status, 403);
    assert.equal((await hS(req("/members/reports/2026-10-monthly.pdf", { cookie: sTok }), {})).status, 403);
  });
  await t("共通パスワード：誤りは 401、10回でロック", async () => {
    const { r } = await sharedLogin("wrong-pass", "198.18.0.9");
    assert.equal(r.status, 401);
    for (let i = 0; i < 10; i++) await sharedLogin("wrong-" + i, "198.18.0.10");
    assert.equal((await sharedLogin(MP, "198.18.0.10")).r.status, 429);
  });
  await t("共通パスワード：パスワードを変更すると既存のログインは無効", async () => {
    envShared = { SESSION_SECRET: SECRET, MEMBER_PASSWORD: "changed-pass-0002" };
    assert.equal((await hS(req("/members/articles/", { cookie: sTok }), {})).status, 303);
    envShared = { SESSION_SECRET: SECRET, MEMBER_PASSWORD: MP };
  });
  await t("SESSION_SECRET なし・MEMBER_PASSWORD のみでも共通ログインは動き、会員IDログインは無効", async () => {
    const hOnly = createHandler({ getStore, env: (k) => (k === "MEMBER_PASSWORD" ? MP : undefined), now: () => NOW });
    const { r, token } = await sharedLogin(MP, "198.18.0.20", hOnly);
    assert.equal(r.status, 303);
    assert.equal((await hOnly(req("/members/articles/", { cookie: token }), {})).status, 200);
    const r2 = await hOnly(req("/members/login", { method: "POST", body: form({ member_id: "SR0004", password: "p90-pass-4444" }) }), { ip: "198.18.0.21" });
    assert.equal(r2.status, 400);
    // 会員IDでのセッション（SESSION_SECRET で署名）は受け付けない
    const idTok = (await login("SR0004", "p90-pass-4444", "198.18.0.22")).token;
    assert.equal((await hOnly(req("/members/", { cookie: idTok }), {})).status, 303);
  });
  await t("共通パスワードで作ったCookieを改ざんしても会員ID扱いにはならない", async () => {
    const [body, sig] = sTok.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "SR0004", pv: 1, iat: 0, exp: 9999999999 })).toString("base64url") + "." + sig;
    assert.equal((await hS(req("/members/reports/", { cookie: forged }), {})).status, 303);
  });
}

console.log(results.join("\n"));
console.log(`\n${passed} / ${results.length} 件 成功`);
