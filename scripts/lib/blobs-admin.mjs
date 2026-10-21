// 管理用スクリプトから Netlify Blobs に接続する
import { getStore } from "@netlify/blobs";

export function adminStore(name) {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!siteID || !token) {
    console.error("環境変数 NETLIFY_SITE_ID と NETLIFY_AUTH_TOKEN を設定してください（docs/03_netlify-settings.md 参照）。");
    process.exit(1);
  }
  return getStore({ name, siteID, token, consistency: "strong" });
}

export function args() {
  const a = process.argv.slice(2);
  const out = { _: [] };
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith("--")) {
      const k = a[i].slice(2);
      const v = a[i + 1] && !a[i + 1].startsWith("--") ? a[++i] : true;
      out[k] = v;
    } else out._.push(a[i]);
  }
  return out;
}

export const todayJST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
export function addDays(ymd, n) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
