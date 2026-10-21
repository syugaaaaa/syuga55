# 合同会社シュガーラッシュ 公式サイト・会員サイト（SUGAR RUSH）

美容・健康・生活習慣の記事、記録ツール（PDF）、個別振り返りレポートを提供する会員制Webサービスのサイトです。
GitHub（Private リポジトリ）と Netlify で運用します。

## 手順書

| ファイル | 内容 |
|---|---|
| `docs/01_GitHub反映手順.md` | リポジトリへのアップロード、削除が必要なファイル |
| `docs/03_Netlify環境変数設定手順.md` | Netlify のサイト作成、`SESSION_SECRET`、Forms、管理用の値 |
| `docs/02_管理者向け運用マニュアル.md` | 申込み〜入金確認〜会員発行〜レポート納品、会員管理、記事の更新、メール文例 |
| `docs/04_実装状況と公開前チェックリスト.md` | 実装済み・未検証・未実装の一覧、公開前の確認事項 |
| `docs/申込管理台帳.csv` | 申込み状況を管理する台帳のひな形 |

## しくみ

```
公開ページ   src/ → npm run build → dist/（Netlify が公開）
会員ページ   /members/*  → Netlify Edge Function（netlify/edge-functions/members.js）
                           └ edge-lib/app.mjs でログイン確認 → 会員ごとの権限を確認 → ページ・PDFを返す
保存先       Netlify Blobs（会員情報・個別レポート・提出記録・ログイン失敗記録）
秘密情報     Netlify の環境変数 SESSION_SECRET（リポジトリには含めません）
```

- 会員記事とPDFは `dist/` に出力されません。ビルド時に `edge-lib/generated/` にまとめられ、Edge Function が認証後にだけ返します。
- `netlify/edge-functions/` には実行ファイル `members.js` だけを置きます。補助ファイルは `edge-lib/` にあります。
- 自動生成されるもの（`dist/`、`edge-lib/generated/`、`.netlify/`、`node_modules/`）は Git に含めません。

## コマンド

```bash
npm install          # 初回のみ
npm run build        # サイトを生成（公開前の確認事項があれば警告を表示）
npm test             # 会員認証の自動テスト（build のあとに実行）
npm run member -- …      # 会員の登録・期限変更・パスワード再発行
npm run report -- …      # 個別レポートの掲載
npm run submissions -- … # 提出された記録の確認
```

管理用コマンドには環境変数 `NETLIFY_SITE_ID` と `NETLIFY_AUTH_TOKEN` が必要です。

## フォルダ

| フォルダ | 内容 |
|---|---|
| `src/content/site.mjs` | 会社情報・料金・記録ツール・運用条件（ここを直すと全ページに反映） |
| `src/content/free/` `src/content/members/` | 公開記事・会員限定記事（Markdown） |
| `src/static/` | CSS・JavaScript・画像・公開サンプルPDF |
| `protected/tools/` | 会員用の記録ツールPDF（公開されません） |
| `scripts/` | ビルド・ページの組み立て・管理用コマンド |
| `edge-lib/` | 認証・会員ページの処理 |
| `tools/report-maker/` | レポート作成ツール（管理者がパソコンで使用。公開されません） |
| `tools/pdf-src/` | 記録ツールPDF・サンプル・画像の生成スクリプト（開発用） |
| `tools/pamphlet/` | 会社案内パンフレット（A4巻き三つ折り）の生成スクリプトと印刷用画像 |
| `tests/` | 認証の自動テスト |

## 表記上の方針

医療行為・診断・治療・個別の医療／栄養指導は行わず、効果を保証しません。記事・レポートでは根拠を確認できない数値を使わず、利用者の声や実績を創作しません。
