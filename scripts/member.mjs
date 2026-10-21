// 会員の登録・確認・期限変更・パスワード再発行
//   npm run member -- create --id SR0001 --name "山田" --plan standard [--start 2026-10-21] [--dry-run]
//   npm run member -- list
//   npm run member -- show --id SR0001
//   npm run member -- extend --id SR0001 --end 2026-12-31
//   npm run member -- reset-password --id SR0001
//   npm run member -- suspend --id SR0001   /  activate --id SR0001
//   npm run member -- delete --id SR0001
import { adminStore, args, todayJST, addDays } from "./lib/blobs-admin.mjs";
import { hashPassword, randomB64url, generatePassword, DEFAULT_ITERATIONS } from "../edge-lib/crypto.mjs";
import { plans } from "../src/content/site.mjs";

const a = args();
const cmd = a._[0];
const id = typeof a.id === "string" ? a.id.toUpperCase() : "";
const needId = () => { if (!/^[A-Z0-9-]{3,20}$/.test(id)) { console.error("--id は半角英大文字・数字・ハイフン 3〜20 文字で指定してください（例：SR0001）"); process.exit(1); } };
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const pub = (m) => ({ id: m.id, displayName: m.displayName, plan: m.plan, start: m.start, end: m.end, status: m.status, createdAt: m.createdAt });

async function newPassword(m) {
  const password = generatePassword();
  m.salt = randomB64url(16);
  m.iter = DEFAULT_ITERATIONS;
  m.hash = await hashPassword(password, m.salt, m.iter);
  m.pv = (m.pv || 0) + 1; // 変更するとそれまでのログイン状態は無効になります
  return password;
}

if (cmd === "create") {
  needId();
  const plan = plans.find((p) => p.id === a.plan);
  if (!plan) { console.error(`--plan は ${plans.map((p) => p.id).join(" / ")} のいずれかです`); process.exit(1); }
  const start = isDate(a.start) ? a.start : todayJST();
  const m = { id, displayName: typeof a.name === "string" ? a.name : "", plan: plan.id, start, end: addDays(start, plan.days - 1), status: "active", createdAt: new Date().toISOString() };
  const password = await newPassword(m);
  if (!a["dry-run"]) {
    const store = adminStore("members");
    if (await store.get(id)) { console.error(`${id} はすでに登録されています`); process.exit(1); }
    await store.setJSON(id, m);
  }
  console.log(JSON.stringify(pub(m), null, 2));
  console.log(`\n会員ID：${id}\n初期パスワード：${password}\n（このパスワードは再表示できません。会員へのメールに記載してください）${a["dry-run"] ? "\n※ --dry-run のため保存していません" : ""}`);
} else if (cmd === "list") {
  const store = adminStore("members");
  const { blobs } = await store.list();
  for (const b of blobs) { const m = await store.get(b.key, { type: "json" }); console.log(`${m.id}\t${m.plan}\t${m.start}〜${m.end}\t${m.status}\t${m.displayName || ""}`); }
  if (!blobs.length) console.log("登録された会員はいません");
} else if (["show", "extend", "reset-password", "suspend", "activate", "delete"].includes(cmd)) {
  needId();
  const store = adminStore("members");
  const m = await store.get(id, { type: "json" });
  if (!m) { console.error(`${id} は登録されていません`); process.exit(1); }
  if (cmd === "show") console.log(JSON.stringify(pub(m), null, 2));
  if (cmd === "extend") { if (!isDate(a.end)) { console.error("--end YYYY-MM-DD を指定してください"); process.exit(1); } m.end = a.end; await store.setJSON(id, m); console.log(`${id} の利用期限を ${m.end} に変更しました`); }
  if (cmd === "reset-password") { const pw = await newPassword(m); await store.setJSON(id, m); console.log(`${id} の新しいパスワード：${pw}\n（以前のログイン状態はすべて無効になりました）`); }
  if (cmd === "suspend" || cmd === "activate") { m.status = cmd === "suspend" ? "suspended" : "active"; m.pv = (m.pv || 0) + 1; await store.setJSON(id, m); console.log(`${id} を ${m.status} にしました`); }
  if (cmd === "delete") { await store.delete(id); console.log(`${id} を削除しました（レポート・提出記録は別途 npm run report / submissions で削除してください）`); }
} else {
  console.log("使い方は scripts/member.mjs の先頭、または docs/02_admin-manual.md を参照してください。");
}
