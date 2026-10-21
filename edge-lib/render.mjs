// 会員ページの組み立て（生成済みのシェルに差し込む）
import { memberShell, plans } from "./generated/member-content.mjs";

export function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
export const planName = (id) => (plans.find((p) => p.id === id) || {}).name || id;
export const planHasReport = (id) => !!(plans.find((p) => p.id === id) || {}).report;

export function fmtDate(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export function navItems(member, access) {
  if (!member) return [];
  if (access === "grace") return [["/members/", "会員トップ"], ["/members/reports/", "個別レポート"]];
  const items = [["/members/", "会員トップ"], ["/members/articles/", "会員限定記事"], ["/members/tools/", "記録シート"]];
  if (planHasReport(member.plan)) items.push(["/members/submit/", "記録提出"], ["/members/reports/", "個別レポート"]);
  if (member.plan === "p90") items.push(["/members/program-90/", "90日記録サポート"]);
  return items;
}

export function renderPage({ title, main, path = "", member = null, access = null }) {
  let bar = "", nav = "";
  if (member) {
    bar = `<div class="member-bar"><div class="wrap"><span>${esc(member.displayName || member.id)} さん（${esc(planName(member.plan))}・利用期限 ${esc(fmtDate(member.end))}）</span><form method="POST" action="/members/logout"><button type="submit">ログアウト</button></form></div></div>`;
    const items = navItems(member, access);
    nav = `<nav class="member-nav" aria-label="会員メニュー"><ul>${items.map(([h, t]) => {
      const cur = h === "/members/" ? path === "/members/" : path.startsWith(h);
      return `<li><a href="${h}"${cur ? ' aria-current="page"' : ""}>${t}</a></li>`;
    }).join("")}</ul></nav>`;
  }
  return memberShell
    .replace(/\{\{TITLE\}\}/g, () => esc(title))
    .replace("{{MEMBER_BAR}}", () => bar)
    .replace("{{MEMBER_NAV}}", () => nav)
    .replace("{{MAIN}}", () => main);
}
