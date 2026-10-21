// =============================================================
// サイト全体の設定（会社情報・料金・記録ツール・運用条件）
// 変更したら `npm run build` で全ページに反映されます。
// 「confirmed: false」の項目は公開前に必ず確認してください（ビルド時に警告が出ます）。
// =============================================================

export const site = {
  url: "https://sugar-rush.netlify.app", // ★独自ドメイン取得後に変更
  name: "SUGAR RUSH",
  nameJa: "合同会社シュガーラッシュ",
  copy: "毎日の小さな記録が、これからの自分をつくる。",
  subCopy: "美容も、健康も、まずは自分の毎日を知ることから。",
  description:
    "合同会社シュガーラッシュは、美容・健康・生活習慣に関するWebコンテンツの企画・制作・販売と、記録ツール・個別振り返りレポートを提供する会員専用サイトを運営しています。",
};

export const company = {
  name: "合同会社シュガーラッシュ",
  nameEn: "SUGAR RUSH",
  representative: "代表社員　青木 さとみ",
  postal: "〒343-0816",
  address: "埼玉県越谷市弥生町1-7 エヌステージ101",
  tel: "050-6861-4745",
  email: "sugar5502@gmail.com",
  founded: "2025年6月11日",
  capital: "430万円",
  corporateNumber: "1030003027004",
  corporateNumberConfirmed: false, // ★登記情報・国税庁法人番号公表サイトと照合後に true
  business: [
    "Webコンテンツの企画・制作・販売（美容・健康・生活習慣分野）",
    "パスワード付き会員専用サイトの企画・運営",
    "生活習慣の記録ツール（PDF）の制作・提供",
    "利用者の記録内容を整理した振り返りレポートの制作・納品",
  ],
  history: [
    ["2025年6月", "合同会社シュガーラッシュ設立（埼玉県越谷市）"],
    ["2026年8月", "美容・健康分野のWebコンテンツの提供を本格的に開始"],
  ],
};

// 料金プラン（税込・期間固定・自動更新なし）
export const plans = [
  {
    id: "basic",
    name: "ベーシックプラン",
    price: 3300,
    days: 30,
    lead: "記事を読みながら、自分で記録を始める方へ。",
    items: ["会員限定記事の閲覧", "美容・生活習慣セルフチェック", "30日間記録シート", "記録ツールの使い方ガイド"],
    report: false,
  },
  {
    id: "standard",
    name: "スタンダードプラン",
    price: 9800,
    days: 30,
    lead: "記録を提出し、整理されたレポートで1か月を振り返りたい方へ。",
    items: [
      "ベーシックプランの全内容",
      "記録内容の集計・整理",
      "個別月間振り返りレポート 1回",
      "翌月の記録目標整理シート",
    ],
    report: true,
  },
  {
    id: "p90",
    name: "90日継続プラン",
    price: 27800,
    days: 90,
    lead: "3か月かけて記録を続け、変化の流れを見渡したい方へ。",
    items: [
      "会員限定記事の閲覧",
      "90日間記録シート",
      "月間振り返りレポート 3回",
      "90日総括レポート 1回",
      "継続記録のための行動計画シート",
    ],
    report: true,
  },
];

// 記録ツール（PDF）。plans: 利用できるプラン
export const tools = [
  { id: "guide", file: "guide.pdf", title: "記録ツール利用ガイド", pages: 4, plans: ["basic", "standard", "p90"],
    desc: "各シートの役割、記録の始め方、続かなくなったときの考え方をまとめた手引きです。" },
  { id: "check", file: "self-check.pdf", title: "美容・生活習慣セルフチェック", pages: 2, plans: ["basic", "standard", "p90"],
    desc: "6つの分野・30項目で、今の習慣を見渡すチェックシートです。月に1回の記入を想定しています。" },
  { id: "sheet30", file: "record-30days.pdf", title: "30日生活習慣記録シート", pages: 4, plans: ["basic", "standard", "p90"],
    desc: "睡眠・食事・運動・美容習慣を1日1行で記録する、30日分のシートです。" },
  { id: "sheet90", file: "record-90days.pdf", title: "90日生活習慣記録シート", pages: 13, plans: ["p90"],
    desc: "30日ごとの区切りページ付き。90日分を同じ形式で記録できます。" },
  { id: "sleep", file: "sleep-exercise.pdf", title: "睡眠・運動記録シート", pages: 5, plans: ["basic", "standard", "p90"],
    desc: "1週間1ページ。眠っていた時間帯を塗りつぶす方式と、運動・歩数の記録欄があります。" },
  { id: "food", file: "food.pdf", title: "食生活の記録シート", pages: 5, plans: ["basic", "standard", "p90"],
    desc: "1週間1ページ。食事の時刻と、主食・主菜・副菜のそろい方を記録します。" },
  { id: "review", file: "monthly-review.pdf", title: "月末振り返りシート", pages: 2, plans: ["basic", "standard", "p90"],
    desc: "1か月の記録を、事実・気づき・次の一歩の順に整理するシートです。" },
  { id: "goals", file: "next-month-goals.pdf", title: "翌月の記録目標整理シート", pages: 1, plans: ["standard", "p90"],
    desc: "振り返りレポートを受け取ったあと、翌月に記録する項目と目標を整理します。" },
  { id: "plan90", file: "action-plan-90.pdf", title: "90日 行動計画シート", pages: 2, plans: ["p90"],
    desc: "90日を3つの期間に分け、期間ごとの重点項目と確認日を決めるシートです。" },
];

export const freeCategories = [
  { id: "beauty", name: "美容習慣" },
  { id: "food", name: "食生活" },
  { id: "sleep", name: "睡眠" },
  { id: "exercise", name: "運動" },
  { id: "selfcare", name: "セルフケア" },
  { id: "rhythm", name: "生活リズム" },
];

// 運用条件（特定商取引法に基づく表記・利用規約・FAQで使用）
// ★confirmed: false のものは「提案値」です。正式な運用条件を決めてから true にしてください。
export const terms = {
  payment: { text: "銀行振込（お申込み受付後、お振込先をメールでご案内します）", confirmed: true },
  paymentDue: { text: "お申込み受付のご案内メール送信日から7日以内", confirmed: false },
  extraFee: { text: "振込手数料はお客様のご負担となります。インターネット接続・通信料金、記録シートの印刷費用もお客様のご負担です。", confirmed: true },
  delivery: { text: "ご入金を確認した日から3営業日以内に、会員IDとパスワードをメールでお送りします。利用期間は会員情報をお送りした日を1日目として数えます。", confirmed: false },
  submitDeadline: { text: "各30日間の最終日から7日以内に、会員ページの記録提出フォームから提出してください。", confirmed: false },
  reportDeadline: { text: "記録の提出を受けた日から10営業日以内に、会員ページへ掲載します。", confirmed: false },
  cancel: { text: "ご入金前であれば、メールでのご連絡によりお申込みを取り消せます。デジタルコンテンツの性質上、会員情報の発行後はお客様のご都合による返金はいたしません。", confirmed: false },
  defect: { text: "当社の責めによりサービスを提供できない場合や、レポートを期限内に納品できない場合は、未提供分に相当する金額を返金します。", confirmed: false },
  businessHours: { text: "平日 10:00〜17:00（土日祝日・年末年始を除く）", confirmed: false },
  reportGraceDays: 30, // 利用期間終了後もレポートのみ閲覧できる日数（Edge Function でも同じ値を使用）
};
