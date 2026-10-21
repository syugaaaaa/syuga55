// 共通パスワードの「初期値」を設定する（Netlify の環境変数 MEMBER_PASSWORD が未設定のときに使われます）
//   npm run shared-password -- 新しいパスワード
// パスワードそのものは保存せず、元に戻せない形（PBKDF2 ハッシュ）だけを edge-lib/shared-default.mjs に書き込みます。
// 書き込んだら GitHub にコミットして再デプロイしてください。環境変数 MEMBER_PASSWORD を設定した場合はそちらが優先されます。
import fs from "node:fs";
import { hashPassword, randomB64url } from "../edge-lib/crypto.mjs";
const pw = process.argv[2];
if (!pw || pw.length < 8) { console.error("8文字以上のパスワードを指定してください：npm run shared-password -- パスワード"); process.exit(1); }
const salt = randomB64url(16), iter = 20000;
const hash = await hashPassword(pw, salt, iter);
const key = randomB64url(32);
fs.writeFileSync(new URL("../edge-lib/shared-default.mjs", import.meta.url), `// 共通パスワードの初期値（自動生成：npm run shared-password）。パスワード本体は含みません。
// Netlify の環境変数 MEMBER_PASSWORD を設定すると、そちらが優先されます。
export const sharedDefault = ${JSON.stringify({ salt, iter, hash, key, createdAt: new Date().toISOString() }, null, 2)};
`);
console.log("edge-lib/shared-default.mjs を更新しました。GitHub にコミットして再デプロイしてください。");
