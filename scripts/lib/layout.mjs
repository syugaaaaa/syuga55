import { esc } from "./markdown.mjs";
import { logoMark, thread } from "./icons.mjs";
import { site, company } from "../../src/content/site.mjs";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
// CSS・JS の内容から版番号を作り、URL に付ける（更新すると必ず新しいファイルが読み込まれる）
const ver = (rel) => crypto.createHash("sha1").update(fs.readFileSync(fileURLToPath(new URL("../../src/static/" + rel, import.meta.url)))).digest("hex").slice(0, 10);
export const CSS_V = ver("css/style.css");
export const JS_V = ver("js/main.js");

export const NAV_EXTRA = [["/flow/", "ご利用の流れ"], ["/faq/", "よくある質問"]];
export const NAV = [
  ["/service/", "サービス"],
  ["/pricing/", "料金"],
  ["/articles/", "記事"],
  ["/tools/", "記録ツール"],
  ["/report/", "レポート"],
  ["/company/", "会社概要"],
  ["/contact/", "お問い合わせ"],
];

const FONTS = "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Cormorant+Garamond:ital,wght@0,500;1,400;1,500&family=Zen+Old+Mincho:wght@500;600&display=swap";

export function head({ title, description, path, noindex = false, ogType = "website" }) {
  const full = title ? `${title}｜${site.nameJa}` : `${site.nameJa}｜${site.copy}`;
  const desc = description || site.description;
  const url = site.url + path;
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="${esc(url)}">`}
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(site.url)}/assets/img/ogp.png">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#48675D">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/css/style.css?v=${CSS_V}">
</head>`;
}

export function header(path, { members = false } = {}) {
  const li = (cls) => ([href, label]) => {
    const cur = path === href || (href !== "/" && path.startsWith(href));
    return `<li${cls ? ` class="${cls}"` : ""}><a href="${href}"${cur ? ' aria-current="page"' : ""}>${label}</a></li>`;
  };
  const items = NAV.map(li("")).join("") + NAV_EXTRA.map(li("nav-sub")).join("");
  const login = members ? "" : `<li class="nav-login"><a href="/members/login">会員ログイン</a></li>`;
  return `<a class="skip" href="#main">本文へ移動</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="${esc(company.name)} トップページ">${logoMark("")}<span class="brand-text"><span class="brand-en">SUGAR RUSH</span><span class="brand-ja">合同会社シュガーラッシュ</span></span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="gnav"><span class="bars" aria-hidden="true"></span>メニュー</button>
    <nav class="gnav" id="gnav" aria-label="メインメニュー"><ul>${items}${login}</ul></nav>
  </div>
</header>`;
}

export function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="brand" href="/">${logoMark("")}<span class="brand-text"><span class="brand-en">SUGAR RUSH</span><span class="brand-ja">合同会社シュガーラッシュ</span></span></a>
        <address>${esc(company.postal)}<br>${esc(company.address)}<br>TEL ${esc(company.tel)}<br>${esc(company.email)}</address>
      </div>
      <div class="footer-links">
        <div><h2>サービス</h2><ul><li><a href="/service/">サービス紹介</a></li><li><a href="/pricing/">料金プラン</a></li><li><a href="/tools/">記録ツール</a></li><li><a href="/report/">振り返りレポート</a></li><li><a href="/flow/">ご利用の流れ</a></li></ul></div>
        <div><h2>読みもの・サポート</h2><ul><li><a href="/articles/">記事一覧</a></li><li><a href="/faq/">よくある質問</a></li><li><a href="/contact/">お問い合わせ</a></li><li><a href="/members/login">会員ログイン</a></li></ul></div>
        <div><h2>会社・規約</h2><ul><li><a href="/company/">会社概要</a></li><li><a href="/tokushoho/">特定商取引法に基づく表記</a></li><li><a href="/privacy/">プライバシーポリシー</a></li><li><a href="/terms/">利用規約</a></li></ul></div>
      </div>
    </div>
    <div class="copyright"><p>当サイトの情報は医療上の助言・診断・治療に代わるものではありません。掲載している写真はイメージです。</p><p>&copy; ${new Date().getFullYear()} ${esc(company.name)}</p></div>
  </div>
</footer>`;
}

export function page({ title, description, path, main, noindex = false, ogType }) {
  return `${head({ title, description, path, noindex, ogType })}
<body>
${header(path)}
<main id="main">
${main}
</main>
${footer()}
<script src="/assets/js/main.js?v=${JS_V}" defer></script>
</body>
</html>
`;
}

export function pageHead({ title, latin, lead, crumbs = [] }) {
  const bc = crumbs.length
    ? `<nav class="breadcrumb" aria-label="パンくずリスト"><ol><li><a href="/">ホーム</a></li>${crumbs.map(([h, t]) => (h ? `<li><a href="${h}">${esc(t)}</a></li>` : `<li aria-current="page">${esc(t)}</li>`)).join("")}</ol></nav>`
    : "";
  return `<section class="page-head">${thread()}<div class="wrap">${bc}<h1>${esc(title)}</h1>${latin ? `<span class="latin">${esc(latin)}</span>` : ""}${lead ? `<p class="lead">${lead}</p>` : ""}</div></section>`;
}

export function ctaBand({ title = "まずは、料金とサービス内容をご確認ください。", text = "ご不明な点は、お申込み前にお問い合わせフォームからご質問いただけます。決済は銀行振込のみで、自動更新はありません。" } = {}) {
  return `<section class="cta-band">${thread("#FAF8F3", 0.6)}<div class="wrap cta-inner"><div><h2>${title}</h2><p>${text}</p></div><div class="btn-row"><a class="btn" href="/pricing/">料金プランを見る</a><a class="btn btn-ghost" href="/contact/">お問い合わせ・お申込み</a></div></div></section>`;
}

export const yen = (n) => n.toLocaleString("ja-JP");
