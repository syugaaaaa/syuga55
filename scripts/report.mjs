// 個別レポートの掲載・確認・削除
//   npm run report -- upload --id SR0001 --file ./report.pdf --title "2026年11月 月間振り返りレポート" [--name 2026-11-monthly]
//   npm run report -- list --id SR0001
//   npm run report -- delete --id SR0001 --name 2026-11-monthly
import fs from "node:fs";
import path from "node:path";
import { adminStore, args } from "./lib/blobs-admin.mjs";

const a = args();
const cmd = a._[0];
const id = typeof a.id === "string" ? a.id.toUpperCase() : "";
if (!/^[A-Z0-9-]{3,20}$/.test(id)) { console.error("--id（会員ID）を指定してください"); process.exit(1); }
const store = adminStore("reports");

if (cmd === "upload") {
  const file = a.file;
  if (typeof file !== "string" || !fs.existsSync(file)) { console.error("--file にPDFのパスを指定してください"); process.exit(1); }
  const buf = fs.readFileSync(file);
  if (buf.subarray(0, 4).toString() !== "%PDF") { console.error("PDFファイルではありません"); process.exit(1); }
  const name = (typeof a.name === "string" ? a.name : path.basename(file, ".pdf")).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 76);
  const members = adminStore("members");
  if (!(await members.get(id))) { console.error(`会員 ${id} は登録されていません`); process.exit(1); }
  const title = typeof a.title === "string" ? a.title : "振り返りレポート";
  await store.set(`${id}/${name}.pdf`, new Uint8Array(buf), { metadata: { title, uploadedAt: new Date().toISOString() } });
  console.log(`掲載しました：${id}/${name}.pdf「${title}」`);
} else if (cmd === "list") {
  const { blobs } = await store.list({ prefix: id + "/" });
  for (const b of blobs) { const m = await store.getMetadata(b.key); console.log(`${b.key}\t${m?.metadata?.title || ""}\t${m?.metadata?.uploadedAt || ""}`); }
  if (!blobs.length) console.log("レポートはありません");
} else if (cmd === "delete") {
  if (typeof a.name !== "string") { console.error("--name を指定してください（list で表示されるファイル名から .pdf を除いたもの）"); process.exit(1); }
  await store.delete(`${id}/${a.name.replace(/\.pdf$/, "")}.pdf`);
  console.log("削除しました");
} else console.log("upload / list / delete のいずれかを指定してください");
