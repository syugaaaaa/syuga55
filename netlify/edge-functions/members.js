// 会員ページ（/members 以下）の Edge Function。
// 処理の本体は edge-lib/app.mjs にあります（このフォルダには実行ファイルだけを置きます）。
import { getStore } from "@netlify/blobs";
import { createHandler } from "../../edge-lib/app.mjs";

const handle = createHandler({
  getStore: (name) => getStore({ name, consistency: "strong" }),
  env: (key) => Netlify.env.get(key),
});

export default async (request, context) => handle(request, { ip: context.ip });

// 対象パスは netlify.toml の [[edge_functions]] で指定しています（ここでは指定しません）。
