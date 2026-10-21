// =============================================================
// ビルド：src/ → dist/（公開ページ）と edge-lib/generated/（会員ページ用データ）
//   - dist/ には会員向けのページ・PDFを一切出力しません。
//   - 会員ページのHTMLとPDFは edge-lib/generated/member-content.mjs にまとめ、
//     Edge Function から認証後にだけ返します。
//   - netlify/edge-functions/ には何も書き込みません。
// =============================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFile, render, parseRefs, esc } from "./lib/markdown.mjs";
import { page, pageHead, header, footer, head, ctaBand } from "./lib/layout.mjs";
import { icons, curve } from "./lib/icons.mjs";
import { site, company, plans, tools, terms, freeCategories } from "../src/content/site.mjs";
import * as P from "./pages-main.mjs";
import * as L from "./pages-legal.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const GEN = path.join(ROOT, "edge-lib", "generated");
const warnings = [];

// ---------- 準備 ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.rmSync(GEN, { recursive: true, force: true });
fs.mkdirSync(GEN, { recursive: true });

function write(rel, html) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
const FREE_PHOTO = { beauty: "circles", food: "food", sleep: "curtain", exercise: "stones", selfcare: "tea-books", rhythm: "landscape" };
const MEMBER_PHOTO = { beauty: "circles", body: "stones", food: "food", sleep: "curtain", movement: "path", selfcare: "tea-books", habit: "journal", program: "flow-report" };
const photo = (name, alt = "", cls = "") => `<img src="/assets/img/photos/${name}.jpg" alt="${esc(alt)}" loading="lazy" decoding="async"${cls ? ` class="${cls}"` : ""}>`;
const memberMeta = JSON.parse(fs.readFileSync(path.join(ROOT, "src/content/members/_meta.json"), "utf8"));
const dateJa = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${y}年${m}月${dd}日`; };
const toolById = (id) => tools.find((t) => t.id === id);

// ---------- 記事の読み込み ----------
function loadDir(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const { meta, body } = parseFile(fs.readFileSync(path.join(dir, f), "utf8"));
    const r = render(body);
    for (const k of ["slug", "title", "summary", "tool"]) if (!meta[k]) throw new Error(`${f}: ${k} がありません`);
    if (!toolById(meta.tool)) throw new Error(`${f}: tool "${meta.tool}" は site.mjs にありません`);
    return { ...meta, ...r, refs: parseRefs(meta.refs), file: f, minutes: Math.max(3, Math.round(r.chars / 500)) };
  });
}
const free = loadDir(path.join(ROOT, "src/content/free")).map((a) => {
  const cat = freeCategories.find((c) => c.id === a.category);
  if (!cat) throw new Error(`${a.file}: category "${a.category}" が不正です`);
  return { ...a, categoryName: cat.name, dateJa: dateJa(a.date) };
});
const members = loadDir(path.join(ROOT, "src/content/members")).sort((a, b) => Number(a.order) - Number(b.order));
const slugs = new Set();
for (const a of [...free, ...members]) { if (slugs.has(a.slug)) throw new Error(`slug重複: ${a.slug}`); slugs.add(a.slug); }

// ---------- 静的ファイル ----------
copyDir(path.join(ROOT, "src/static/css"), path.join(DIST, "assets/css"));
copyDir(path.join(ROOT, "src/static/js"), path.join(DIST, "assets/js"));
copyDir(path.join(ROOT, "src/static/img"), path.join(DIST, "assets/img")); // photos/ を含む
copyDir(path.join(ROOT, "src/static/samples"), path.join(DIST, "samples"));

// ---------- 公開ページ ----------
const pages = [
  ["/", null, P.home(free), site.description],
  ["/service/", "サービス紹介", P.service(), "記事・記録ツール・振り返りレポートを組み合わせた、美容・健康・生活習慣の会員制Webサービスの内容です。"],
  ["/pricing/", "料金プラン", P.pricing(), "ベーシック3,300円、スタンダード9,800円、90日継続27,800円（いずれも税込・期間固定・自動更新なし）。"],
  ["/tools/", "記録ツール紹介", P.toolsPage(), "A4で印刷して使う生活習慣の記録シート、セルフチェック、振り返りシートの一覧と見本です。"],
  ["/report/", "振り返りレポート紹介", P.reportPage(), "提出された記録を整理した、月間振り返りレポートと90日総括レポートの構成と架空サンプルです。"],
  ["/flow/", "ご利用の流れ", P.flowPage(), "お申込み、お支払い、会員情報の発行から、記録の提出、レポートの納品までの流れです。"],
  ["/company/", "会社概要", P.companyPage(), `${company.name}の会社概要です。`],
  ["/faq/", "よくある質問", P.faqPage(), "サービス、お支払い、記録とレポート、会員サイトに関するよくある質問です。"],
  ["/contact/", "お問い合わせ・お申込み", P.contactPage(), "サービスへのご質問、お申込みのフォームです。"],
  ["/tokushoho/", "特定商取引法に基づく表記", L.tokushoho(), null],
  ["/privacy/", "プライバシーポリシー", L.privacy(), null],
  ["/terms/", "利用規約", L.termsPage(), null],
];
for (const [p, title, main, description] of pages) write(p + "index.html", page({ title, description, path: p, main }));
write("contact/thanks/index.html", page({ title: "送信完了", path: "/contact/thanks/", main: P.thanksPage(), noindex: true }));
write("404.html", page({ title: "ページが見つかりません", path: "/404", main: P.notFoundPage(), noindex: true }));

// ---------- 公開記事 ----------
function toc(a) {
  return a.headings.length > 2 ? `<nav class="toc" aria-label="目次"><p>目次</p><ol>${a.headings.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol></nav>` : "";
}
function refsHtml(a) {
  return a.refs.length ? `<aside class="refs"><h2>参考資料</h2><ul>${a.refs.map((r) => `<li>${esc(r.publisher)}「${esc(r.title)}」${r.url ? `（<a href="${esc(r.url)}" rel="noopener" target="_blank">${esc(r.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>）` : ""}</li>`).join("")}</ul></aside>` : "";
}
const DISCLAIMER = `<p class="disclaimer">この記事は一般的な情報提供を目的としており、医療上の助言・診断・治療に代わるものではありません。体調や持病に関するご不安は、医療機関にご相談ください。</p>`;

write("articles/index.html", page({
  title: "美容・健康記事一覧", path: "/articles/",
  description: "美容習慣・食生活・睡眠・運動・セルフケア・生活リズムの6つのテーマで、記録と振り返りにつながる記事を公開しています。",
  main: `${pageHead({ title: "美容・健康記事", latin: "Journal", lead: "6つのテーマで、毎日の記録と振り返りにつながる記事を公開しています。会員の方は、8つのテーマ・40本の会員限定記事もお読みいただけます。", crumbs: [[null, "記事一覧"]] })}
<section class="section" style="padding-top:0"><div class="wrap">
<figure class="themes-figure"><img src="/assets/img/photos/three-themes.jpg" width="1600" height="900" alt="睡眠：質の良い睡眠で心と体を整える。食生活：バランスの取れた食事で内側からキレイに。運動：適度な運動で体も心も軽やかに。" loading="lazy" decoding="async"></figure>
<nav class="cat-nav" aria-label="カテゴリー">${freeCategories.map((c) => `<a href="#cat-${c.id}">${esc(c.name)}</a>`).join("")}</nav>
${freeCategories.map((c) => `<section class="index-group" id="cat-${c.id}"><div><h2>${esc(c.name)}<small>${{ beauty: "Beauty", food: "Food", sleep: "Sleep", exercise: "Movement", selfcare: "Self-care", rhythm: "Daily rhythm" }[c.id]}</small></h2><div class="cat-photo">${photo(FREE_PHOTO[c.id])}</div></div><div>${free.filter((a) => a.category === c.id).map((a) => `<a class="entry" href="/articles/${a.slug}/"><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><span class="meta"><span>${a.dateJa}</span><span>約${a.minutes}分で読めます</span></span></a>`).join("")}</div></section>`).join("")}
</div></section>
${curve()}
<section class="section tint"><div class="wrap split"><div><div class="sec-head"><h2>会員限定記事</h2><span class="latin">For members</span></div></div><div><p>会員限定記事は、8つのテーマ×5本、全40本。チェックリストや記録項目の例を交えて、日々の記録と振り返りに使える内容です。各記事から関連する記録シートへ移動できます。</p><ul class="file-list">${memberMeta.categories.map((c) => `<li><span class="t"><b>${esc(c.name)}</b><span class="desc">${members.filter((m) => m.category === c.id).map((m) => esc(m.title)).join("／")}</span></span><span class="locked">会員限定・5本</span></li>`).join("")}</ul></div></div></section>
${curve("c-ivory")}
${ctaBand()}`,
}));

for (const a of free) {
  const t = toolById(a.tool);
  const related = free.filter((x) => x.slug !== a.slug && (x.category === a.category || x.tool === a.tool)).slice(0, 3);
  write(`articles/${a.slug}/index.html`, page({
    title: a.title, description: a.summary, path: `/articles/${a.slug}/`, ogType: "article",
    main: `<article>
<header class="article-head"><div class="wrap narrow">
<nav class="breadcrumb" aria-label="パンくずリスト"><ol><li><a href="/">ホーム</a></li><li><a href="/articles/">記事一覧</a></li><li aria-current="page">${esc(a.categoryName)}</li></ol></nav>
<a class="cat" href="/articles/#cat-${a.category}">${esc(a.categoryName)}</a>
<h1>${esc(a.title)}</h1>
<p class="meta"><span>公開日 <time datetime="${a.date}">${a.dateJa}</time></span><span>約${a.minutes}分で読めます</span></p>
</div></header>
<div class="wrap narrow article-body prose">
<figure class="article-eyecatch">${photo(FREE_PHOTO[a.category], "", "")}</figure>
<div class="article-lead">${a.lead}</div>
${toc(a)}
${a.html}
<a class="tool-link" href="/tools/#${t.id}">${icons.sheet("")}<span><b>関連する記録ツール：${esc(t.title)}</b><span>${esc(t.desc)} 会員ページからPDFでダウンロードできます。</span></span></a>
${refsHtml(a)}
${DISCLAIMER}
${related.length ? `<nav class="related" aria-label="関連記事"><h2>あわせて読みたい記事</h2>${related.map((r) => `<a href="/articles/${r.slug}/">${esc(r.title)}</a>`).join("")}</nav>` : ""}
</div>
</article>
${ctaBand()}`,
  }));
}

// ---------- sitemap / robots ----------
const urls = [...pages.map((p) => p[0]), "/articles/", ...free.map((a) => `/articles/${a.slug}/`)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nDisallow: /members/\nDisallow: /contact/thanks/\nSitemap: ${site.url}/sitemap.xml\n`);

// ---------- 会員ページ（Edge Function 用データ） ----------
const memberShell = `${head({ title: "{{TITLE}}", path: "/members/", noindex: true }).replace(`{{TITLE}}｜${site.nameJa}`, `{{TITLE}}｜会員ページ｜${site.nameJa}`)}
<body>
${header("/members/", { members: true })}
{{MEMBER_BAR}}
<main id="main" class="member-main"><div class="wrap">
{{MEMBER_NAV}}
{{MAIN}}
</div></main>
${footer()}
<script src="/assets/js/main.js" defer></script>
</body>
</html>`;

const memberPages = {};
const introHtml = (() => {
  const it = memberMeta.intro; let h = "", inList = false;
  for (const b of it) {
    if (b.style === "List Paragraph") { if (!inList) { h += "<ol>"; inList = true; } h += `<li>${esc(b.text)}</li>`; continue; }
    if (inList) { h += "</ol>"; inList = false; }
    if (b.style === "Heading 3") { if (b.text === "目次") break; h += `<h3 style="font-size:1rem;margin-top:1.2em">${esc(b.text)}</h3>`; }
    else h += `<p>${esc(b.text)}</p>`;
  }
  if (inList) h += "</ol>";
  return h.replace(/記事(\d{1,2})「/g, (m, n) => `<a href="/members/articles/article-${String(n).padStart(2, "0")}/">記事${n}</a>「`);
})();
const catOf = (id) => memberMeta.categories.find((c) => c.id === id);
memberPages["/members/articles/"] = {
  title: "会員限定記事",
  main: `<h1>会員限定記事</h1>
<div class="panel reading-guide">${introHtml}</div>
${memberMeta.categories.map((c, ci) => `<section class="member-cat" id="cat-${c.id}"><div class="split center" style="gap:24px;grid-template-columns:minmax(0,2fr) minmax(0,5fr)"><div class="photo" style="aspect-ratio:3/2">${photo(MEMBER_PHOTO[c.id])}</div><h2>${"①②③④⑤⑥⑦⑧"[ci]} ${esc(c.name)}<small>${esc(c.latin)}</small></h2></div>
<div>${members.filter((m) => m.category === c.id).map((m) => `<a class="entry" href="/members/articles/${m.slug}/"><h3><span class="num">${m.order}</span>${esc(m.title)}</h3><p>${esc(m.summary)}</p><span class="meta"><span>約${m.minutes}分</span><span>関連シート：${esc(toolById(m.tool).title)}</span></span></a>`).join("")}</div></section>`).join("")}`,
};
members.forEach((m, i) => {
  const t = toolById(m.tool);
  const prev = members[i - 1], next = members[i + 1];
  memberPages[`/members/articles/${m.slug}/`] = {
    title: m.title,
    main: `<article class="prose" style="max-width:800px">
<p class="meta" style="font-size:.82rem;color:var(--ink-soft);margin:0"><a href="/members/articles/">会員限定記事</a>　<a href="/members/articles/#cat-${m.category}">${esc(catOf(m.category).name)}</a>　記事${m.order}／全${members.length}本</p>
<h1 style="font-size:clamp(1.5rem,3vw,2.1rem);margin-top:.4em">${esc(m.title)}</h1>
<p style="font-size:.85rem;color:var(--ink-soft)">読了時間の目安：約${m.minutes}分</p>
<figure class="article-eyecatch" style="margin-top:1.4em">${photo(MEMBER_PHOTO[m.category])}</figure>
<div class="article-lead">${m.lead}</div>
${toc(m)}
${m.html}
<a class="tool-link" href="/members/tools/#${t.id}">${icons.sheet("")}<span><b>この記事で使う記録シート：${esc(t.title)}</b><span>${esc(t.desc)}</span></span></a>
${refsHtml(m)}
${DISCLAIMER}
<nav class="related" aria-label="前後の記事">${prev ? `<a href="/members/articles/${prev.slug}/">前の記事：${esc(prev.title)}</a>` : ""}${next ? `<a href="/members/articles/${next.slug}/">次の記事：${esc(next.title)}</a>` : ""}</nav>
</article>`,
  };
});

memberPages["/members/program-90/"] = {
  title: "90日記録サポート",
  plans: ["p90"],
  main: `<h1>90日記録サポート</h1>
<p>90日継続プランの進め方です。90日を3つの期間に分け、期間ごとに記録を提出し、月間振り返りレポートを受け取りながら進めます。</p>
<div class="panel"><h2>3つの期間</h2>
<ol class="flow">
<li><h3>1〜30日目：知る</h3><p>生活を変えずに、今の様子を90日記録シートに書き留めます。30日目に月末振り返りシートを書き、記録を提出してください。→ 1回目の月間振り返りレポート</p></li>
<li><h3>31〜60日目：試す</h3><p>1回目のレポートをもとに、試すことを1〜2つ決め、90日 行動計画シートの「期間2」に書き込みます。60日目に記録を提出してください。→ 2回目の月間振り返りレポート</p></li>
<li><h3>61〜90日目：定着させる</h3><p>続けられたことを中心に記録を続けます。90日目に記録を提出してください。→ 3回目の月間振り返りレポートと90日総括レポート</p></li>
</ol></div>
<div class="grid-2">
<div class="panel"><h2>使うシート</h2><ul class="file-list">
<li><span class="t"><b>90日生活習慣記録シート</b></span><a class="btn btn-ghost btn-sm" href="/members/tools/record-90days.pdf">ダウンロード</a></li>
<li><span class="t"><b>90日 行動計画シート</b></span><a class="btn btn-ghost btn-sm" href="/members/tools/action-plan-90.pdf">ダウンロード</a></li>
<li><span class="t"><b>月末振り返りシート</b></span><a class="btn btn-ghost btn-sm" href="/members/tools/monthly-review.pdf">ダウンロード</a></li>
</ul></div>
<div class="panel"><h2>提出とレポート</h2><p>各期間の最終日から7日以内を目安に、<a href="/members/submit/">記録提出</a>から送信してください。レポートは<a href="/members/reports/">個別レポート</a>に掲載されます。</p><p>進め方の詳しい解説は、会員限定記事「<a href="/members/articles/article-39/">${esc(members.find((m) => m.order === "39")?.title || "90日間の生活習慣サポート")}</a>」と「<a href="/members/articles/article-40/">${esc(members.find((m) => m.order === "40")?.title || "")}</a>」をご覧ください。</p></div>
</div>
<p class="note">期間の途中で記録が途切れても、再開した日に「再開」と書いて続けてください。ご不明な点は、お問い合わせフォームの「会員サイト・ログインについて」からご連絡ください。</p>`,
};

// PDF（保護対象）を読み込む
const toolFiles = {};
for (const t of tools) {
  const f = path.join(ROOT, "protected/tools", t.file);
  if (!fs.existsSync(f)) throw new Error(`記録ツールのPDFがありません: protected/tools/${t.file}`);
  toolFiles[t.file] = fs.readFileSync(f).toString("base64");
}

const gen = `// 自動生成ファイル（npm run build）。編集しないでください。Git にも含めません。
export const memberShell = ${JSON.stringify(memberShell)};
export const memberPages = ${JSON.stringify(memberPages)};
export const tools = ${JSON.stringify(tools)};
export const plans = ${JSON.stringify(plans.map(({ id, name, days, report }) => ({ id, name, days, report })))};
export const reportGraceDays = ${Number(terms.reportGraceDays)};
export const toolFiles = ${JSON.stringify(toolFiles)};
`;
fs.writeFileSync(path.join(GEN, "member-content.mjs"), gen);

// ---------- 安全確認 ----------
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const distFiles = walk(DIST).map((f) => path.relative(DIST, f).split(path.sep).join("/"));
const leaked = distFiles.filter((f) => f.startsWith("members/") || tools.some((t) => f.endsWith("/" + t.file) || f === t.file));
if (leaked.length) throw new Error("保護対象のファイルが dist に含まれています: " + leaked.join(", "));
// 参照しているファイルがすべて存在するか（GitHub へのアップロード漏れの検出）
const refMissing = new Set();
const checkRefs = (html, from) => {
  for (const m of html.matchAll(/(?:src|href)="(\/(?:assets|samples)\/[^"#?]+)"/g)) {
    if (!fs.existsSync(path.join(DIST, m[1]))) refMissing.add(`${m[1]}（${from}）`);
  }
};
for (const f of distFiles.filter((f) => f.endsWith(".html"))) checkRefs(fs.readFileSync(path.join(DIST, f), "utf8"), f);
for (const [p, v] of Object.entries(memberPages)) checkRefs(v.main, p);
checkRefs(memberShell, "会員ページ共通");
if (refMissing.size) throw new Error("ページが参照しているファイルが見つかりません。GitHub にアップロードされているか確認してください：\n  " + [...refMissing].join("\n  "));
const forms = distFiles.filter((f) => f.endsWith(".html")).filter((f) => fs.readFileSync(path.join(DIST, f), "utf8").includes('data-netlify="true"'));

// ---------- 公開前の確認事項 ----------
if (!company.corporateNumberConfirmed) warnings.push("法人番号が未照合です（src/content/site.mjs の corporateNumberConfirmed）");
for (const [k, v] of Object.entries(terms)) if (v && typeof v === "object" && v.confirmed === false) warnings.push(`運用条件「${k}」が未確定です：${v.text}`);
if (site.url.includes("netlify.app")) warnings.push(`サイトURLが仮の値です：${site.url}`);

console.log(`✔ 公開ページ ${distFiles.filter((f) => f.endsWith(".html")).length} 件、公開記事 ${free.length} 本、会員記事 ${members.length} 本、記録ツール ${tools.length} 件`);
console.log(`✔ Netlify Forms を含むページ: ${forms.join(", ")}`);
console.log(`✔ 会員データ: edge-lib/generated/member-content.mjs (${(Buffer.byteLength(gen) / 1024).toFixed(0)} KB)`);
if (warnings.length) { console.log("\n⚠ 公開前に確認が必要な項目:"); for (const w of warnings) console.log("  - " + w); }
