# Netlify 設定・環境変数設定手順

## 1. サイトを作成する（GitHub 連携）

1. Netlify にログイン →「Add new project（Add new site）」→「Import an existing project」。
2. 「GitHub」を選び、リポジトリ（Private）へのアクセスを許可して選択。
3. ビルド設定は `netlify.toml` から自動で読み込まれます。画面に表示される値が次のとおりか確認して「Deploy」。
   - Build command：`npm run build`
   - Publish directory：`dist`
   - Functions / Edge Functions directory：`netlify/edge-functions`

> **ドラッグ＆ドロップでの公開は使わないでください。** その方法では Edge Functions（会員認証）が動かず、会員ページが表示されません。

## 2. 環境変数 `SESSION_SECRET`（必須）

会員ログインの Cookie に署名するための秘密の文字列です。**設定するまで会員ページは「準備中」と表示されます**（保護ページが見えてしまうことはありません）。

1. 次のどちらかで、ランダムな文字列（48文字以上を推奨）を作ります。
   - パソコンで：`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
   - またはパスワード管理ソフトで、記号なし・64文字のパスワードを生成
2. Netlify の「Project configuration（Site configuration）」→「Environment variables」→「Add a variable」。
   - Key：`SESSION_SECRET`
   - Value：作成した文字列
   - 「Contains secret values（秘密の値）」にチェック
   - Scopes：すべて（少なくとも Functions を含める）
3. 保存後、「Deploys」→「Trigger deploy」→「Deploy site」で再デプロイします（環境変数は再デプロイ後に反映）。

**注意**
- この値をメール・チャット・GitHub に貼り付けないでください。
- 値を変更すると、ログイン中の全会員が自動的にログアウトされます（漏えいが疑われるときの対処にもなります）。

## 3. Netlify Forms（お問い合わせ）

1. 「Forms」を開き、フォーム検出が無効になっている場合は「Enable form detection」を押して有効にし、再デプロイします。
2. 「contact」フォームが一覧に表示されることを確認します。
3. 「Forms」→「Form notifications」→「Add notification」→「Email notification」で、通知先に `sugar5502@gmail.com` を設定します。
4. 公開後、実際にフォームから1件送信し、完了ページ（/contact/thanks/）が表示されること、Forms に記録されること、通知メールが届くことを確認してください。
5. スパム対策：ハニーポット項目を設置済みです。Netlify 側のスパムフィルターも自動で働きます。

## 4. Netlify Blobs（会員情報・レポート・提出記録の保存先）

追加の契約・設定は不要です。Netlify のサイトに付属する保存領域を使います。保存領域（ストア）は最初の書き込み時に自動で作られます。

| ストア名 | 内容 |
|---|---|
| `members` | 会員情報（パスワードはハッシュ値のみ） |
| `reports` | 個別レポートのPDF（会員IDごとに分けて保存） |
| `submissions` | 会員が提出した記録とファイル |
| `login-attempts` | ログイン失敗の記録（ロック用） |

保存内容は、Netlify の管理画面「Blobs」でも確認できます。

## 5. 管理用コマンドを使うための設定（管理者のパソコン）

会員の登録やレポートの掲載は、管理者のパソコンからコマンドで行います（`docs/02_管理者向け運用マニュアル.md`）。そのために2つの値が必要です。**どちらもファイルに保存したり GitHub に入れたりしないでください。**

| 名前 | 取得場所 |
|---|---|
| `NETLIFY_SITE_ID` | Netlify の「Project configuration」→「General」→「Project details」の Project ID（Site ID） |
| `NETLIFY_AUTH_TOKEN` | Netlify 右上のアカウント →「User settings」→「Applications」→「Personal access tokens」→「New access token」（有効期限を設定してください） |

作業のたびに、ターミナル（Windows は PowerShell）で次のように設定してからコマンドを実行します。

```bash
# Mac
export NETLIFY_SITE_ID="ここにSite ID"
export NETLIFY_AUTH_TOKEN="ここにトークン"
```
```powershell
# Windows（PowerShell）
$env:NETLIFY_SITE_ID="ここにSite ID"
$env:NETLIFY_AUTH_TOKEN="ここにトークン"
```

トークンが漏れた可能性があるときは、同じ画面ですぐに削除（Revoke）してください。

## 6. 独自ドメイン（任意）

「Domain management」でドメインを追加すると、HTTPS 証明書は自動で発行されます。ドメインが決まったら `src/content/site.mjs` の `url` を変更してコミットしてください（OGP・canonical・サイトマップに使われます）。

## 7. 費用について

このサイトで必要な外部サービスは Netlify のみです（Edge Functions・Forms・Blobs はいずれも Netlify の機能）。決済サービス・認証サービス・データベースの別契約は不要です。
Netlify の無料・有料プランの上限や料金体系は変更されることがあるため、利用規模（会員数・アクセス数・フォーム送信数）に応じて、契約前に Netlify の料金ページ（netlify.com/pricing）で最新の条件を確認してください。会員数が少ない立ち上げ期は、まず無料プランで運用を始め、使用量を「Usage」画面で確認する方法をおすすめします。
