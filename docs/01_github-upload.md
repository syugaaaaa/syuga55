# GitHub 反映手順

## 0. 事前に確認すること

- **リポジトリは必ず「Private（非公開）」にしてください。** 会員限定記事の原稿（`src/content/members/`）と記録ツールのPDF（`protected/tools/`）がリポジトリに含まれます。Public にすると、会員でない人も読めてしまいます。
- ZIP を展開すると、`package.json` や `netlify.toml` が**いちばん上の階層に直接**並んでいます。この状態のままリポジトリ直下にアップロードしてください（フォルダごと入れて二重フォルダにしない）。

## 1. 新しくリポジトリを作る場合

1. GitHub にログインし、右上の「＋」→「New repository」。
2. Repository name（例：`sugar-rush-site`）を入力し、**Private** を選択。README などは追加せずに「Create repository」。
3. 次のどちらかでファイルを入れます。

**方法A：GitHub Desktop（おすすめ）**
1. GitHub Desktop で「Clone a repository」から作成したリポジトリをパソコンに取得。
2. 取得したフォルダに、ZIP を展開した中身（`package.json` などが並んだ状態）をすべてコピー。
3. 左下の Summary に「初回アップロード」などと入力し「Commit to main」→「Push origin」。

**方法B：ブラウザでアップロード**
1. リポジトリ画面の「uploading an existing file」をクリック。
2. 展開した中身をすべて選んでドラッグ＆ドロップ（フォルダ構造は保たれます）。
3. 「Commit changes」。
   - ブラウザからは一度に100ファイルまでです。超える場合は、`src` フォルダと、それ以外のファイル・フォルダの2回に分けてアップロードしてください。
   - 隠しファイル（`.gitignore`、`.nvmrc`）は、パソコンの設定によってはドラッグ時に含まれません。含まれなかった場合は「Add file」→「Create new file」で同じ名前・内容のファイルを作ってください。

## 2. 既存のリポジトリを更新する場合（以前のサイトから入れ替える）

以前のサイトのファイルが残っていると、ビルドや Edge Functions が失敗する原因になります。次のファイル・フォルダは**削除**してから、新しいファイルを入れてください。

| 削除するもの | 理由 |
|---|---|
| ルート直下の古い `*.html`（`index.html`、`thank-you.html`、`service.html` など） | 新サイトは `dist/` に自動生成します。古いファイルは使われず、混乱の元になります |
| `netlify/edge-functions/` 内の `members.js` 以外のファイル | 補助ファイルが Edge Function と誤認され、ビルドエラーになります |
| `dist/`、`node_modules/`、`.netlify/`、`edge-lib/generated/` がコミットされている場合 | ビルドで毎回作り直すため、リポジトリに含めません（`.gitignore` 済み） |
| `.env` などのパスワード・秘密情報を含むファイル | 秘密情報は Netlify の環境変数で管理します |
| 古い `netlify.toml`、`_redirects`、`_headers` | 新しい `netlify.toml` と設定が競合します |

## 3. アップロード後のフォルダ構成（確認用）

```
（リポジトリ直下）
├─ package.json / package-lock.json / netlify.toml / .gitignore / .nvmrc / README.md
├─ src/          公開ページの原稿・設定・CSS・JS・画像
│   └─ content/  site.mjs（会社情報・料金・運用条件）、free/（公開記事）、members/（会員記事）
├─ protected/tools/   会員用PDF（公開フォルダには出力されません）
├─ netlify/edge-functions/members.js   Edge Function（実行ファイルはこれ1つだけ）
├─ edge-lib/     認証・会員ページの処理（Edge Function から読み込む補助ファイル）
├─ scripts/      ビルドと管理用コマンド
├─ tools/        レポート作成ツール・PDF生成スクリプト（サイトには公開されません）
├─ tests/        認証の自動テスト
└─ docs/         この手順書など
```

## 4. アップロード漏れの確認

ブラウザからのアップロードは一度に100ファイルまでのため、ファイルが漏れることがあります（画像が表示されない原因になります）。
現在は、ページが参照している画像やPDFが1つでも足りないと、Netlify のビルドが失敗し、ログに不足しているファイル名が表示されます。その場合は、表示されたファイルを GitHub の同じ場所にアップロードしてください。

## 5. 以後の更新

ファイルを変更して GitHub にコミットすると、Netlify が自動でビルド・公開します。変更が反映されたかは、Netlify の「Deploys」で確認できます。
