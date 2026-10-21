// 会員が提出した記録の確認・ダウンロード
//   npm run submissions -- list [--id SR0001]
//   npm run submissions -- download --id SR0001 [--out ./submissions]
//   npm run submissions -- delete --id SR0001        （会員の提出記録をすべて削除）
import fs from "node:fs";
import path from "node:path";
import { adminStore, args } from "./lib/blobs-admin.mjs";

const a = args();
const cmd = a._[0];
const id = typeof a.id === "string" ? a.id.toUpperCase() : "";
const store = adminStore("submissions");
const prefix = id ? id + "/" : undefined;

if (cmd === "list") {
  const { blobs } = await store.list(prefix ? { prefix } : {});
  const metas = blobs.filter((b) => b.key.endsWith(".json"));
  for (const b of metas) { const s = await store.get(b.key, { type: "json" }); console.log(`${s.submittedAtJST}\t${s.memberId}\t${s.round}回目\t記録${s.days}日\t添付${s.files.length}件\t${b.key}`); }
  if (!metas.length) console.log("提出はありません");
} else if (cmd === "download") {
  if (!id) { console.error("--id を指定してください"); process.exit(1); }
  const out = path.resolve(typeof a.out === "string" ? a.out : "./submissions-download", id);
  fs.mkdirSync(out, { recursive: true });
  const { blobs } = await store.list({ prefix });
  for (const b of blobs) {
    const data = await store.get(b.key, { type: "arrayBuffer" });
    fs.writeFileSync(path.join(out, b.key.slice(prefix.length)), Buffer.from(data));
  }
  console.log(`${blobs.length} 件を ${out} に保存しました。作業後は手元のファイルも適切に削除してください。`);
} else if (cmd === "delete") {
  if (!id) { console.error("--id を指定してください"); process.exit(1); }
  const { blobs } = await store.list({ prefix });
  for (const b of blobs) await store.delete(b.key);
  console.log(`${blobs.length} 件を削除しました`);
} else console.log("list / download / delete のいずれかを指定してください");
