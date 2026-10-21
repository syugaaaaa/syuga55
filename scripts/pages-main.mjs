// 公開ページ（HOME・サービス・料金・記録ツール・レポート・流れ・会社概要・FAQ・お問い合わせ）
import { esc } from "./lib/markdown.mjs";
import { icons, curve, thread } from "./lib/icons.mjs";
import { pageHead, ctaBand, yen } from "./lib/layout.mjs";
import { site, company, plans, tools, terms } from "../src/content/site.mjs";

const planName = (id) => plans.find((p) => p.id === id).name;

export function planList({ compact = false } = {}) {
  return `<div class="plan-list">${plans.map((p) => `
  <article class="plan${p.id === "standard" ? " featured" : ""}">
    <div><h3>${esc(p.name)}${p.id === "standard" ? '<span class="tag">レポート付き</span>' : ""}</h3><p class="lead">${esc(p.lead)}</p></div>
    <ul>${p.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    <div><p class="price">${yen(p.price)}<small>円（税込）</small></p><span class="term">${p.days}日間・期間固定（自動更新なし）</span></div>
  </article>`).join("")}</div>${compact ? "" : ""}`;
}

function sampleFigures() {
  return `<div class="sample-pair">
  <figure class="sample-figure"><img src="/assets/img/sample-report-monthly-p1.png" width="794" height="1123" loading="lazy" alt="月間振り返りレポートの架空サンプル。表紙と記録実施日数のページ"><figcaption><span class="badge-sample">架空サンプル</span> 月間振り返りレポート（1ページ目）。実在の利用者のデータではありません。</figcaption></figure>
  <figure class="sample-figure"><img src="/assets/img/sample-sheet30-p2.png" width="794" height="1123" loading="lazy" alt="30日生活習慣記録シートの見本。1日1行で睡眠・食事・運動・美容習慣を記録する表"><figcaption><span class="badge-sample">見本</span> 30日生活習慣記録シート（シンプル版・記録ページ）。</figcaption></figure>
</div>`;
}

export function home(freeArticles) {
  const latest = freeArticles.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4);
  const steps = [
    ["気づく", "記事を読み、自分の毎日に目を向ける"],
    ["記録する", "シートに1日1行、生活の様子を書く"],
    ["整理する", "記録を集計し、数えられる形にする"],
    ["振り返る", "レポートで1か月の流れを見渡す"],
    ["続ける", "翌月の記録目標を決めて、また始める"],
  ];
  return `
<section class="hero">
  <div class="hero-glow" aria-hidden="true"></div>
  <svg class="hero-thread" viewBox="0 0 1440 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <path class="echo" fill="none" stroke="#D9C8AD" stroke-opacity=".16" pathLength="1" d="M-40 520C200 540 330 410 520 430S860 500 1010 360S1250 140 1480 110"/>
    <path class="main" fill="none" stroke="#48675D" stroke-opacity=".34" pathLength="1" d="M-40 480C190 510 360 380 560 405S880 470 1040 320S1270 100 1480 60"/>
    <g class="dots"></g>
  </svg>
  <div class="wrap">
    <div class="hero-grid">
      <div class="hero-copy">
        <h1><span class="line">毎日の小さな記録が、</span><span class="line">これからの自分をつくる。</span></h1>
        <p class="hero-sub">${esc(site.subCopy)}<br>SUGAR RUSHは、美容・健康・生活習慣についての記事と記録ツール、そして記録を整理した振り返りレポートを、会員専用サイトでお届けするWebサービスです。</p>
        <div class="btn-row"><a class="btn" href="/service/">サービス内容を見る</a><a class="btn btn-ghost" href="/pricing/">料金プラン</a></div>
      </div>
      <figure class="hero-figure"><canvas id="hero-canvas" role="img" aria-label="小さな点が一つずつ線上に増えていき、日々の記録が積み重なる様子を表したアニメーション"></canvas><figcaption>one line a day</figcaption></figure>
    </div>
    <div class="hero-steps-wrap"><svg class="steps-line" viewBox="0 0 1000 14" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="none" stroke="#D9C8AD" pathLength="1" d="M0 7C120 2 220 12 330 7S560 2 660 7S880 12 1000 7"/></svg><ol class="hero-steps" aria-label="サービスの流れ">${steps.map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join("")}</ol></div>
  </div>
</section>
<figure class="brand-visual"><div class="wrap"><img src="/assets/img/photos/brand-visual.jpg" alt="毎日の小さな積み重ねが、未来のわたしをつくる。美容と生活習慣を整えて、心も体も自分らしく輝く毎日へ。睡眠・食生活・運動・美容習慣・セルフケアのイメージと、記録シート・振り返りレポートのイメージ" loading="lazy" decoding="async"><figcaption>イメージ画像です。実際の記録シート・レポートは<a href="/tools/">記録ツール</a>・<a href="/report/">振り返りレポート</a>の見本をご覧ください。</figcaption></div></figure>

${curve()}
<section class="section tint">
  <div class="wrap split center">
    <div>
      <div class="sec-head"><h2>読む、書く、見渡す。</h2><span class="latin">About</span></div>
      <figure class="photo"><img src="/assets/img/photos/journal.jpg" alt="ノートと、生活の場面を写した写真が並ぶ机の上" loading="lazy" decoding="async"></figure>
    </div>
    <div>
      <p>美容や健康の情報は、世の中にたくさんあります。けれども、それを自分の生活にどう当てはめればよいかは、自分の毎日を知らないと分かりません。</p>
      <p>SUGAR RUSHでは、記事で考え方を知り、記録シートで毎日の様子を書き留め、月末にその記録を整理して振り返ります。記事・記録・振り返りをひとつの流れとして、ご自宅から自分のペースで続けられるように設計しています。</p>
      <p class="note">当社のサービスは、記録の整理と情報提供を目的としています。医療行為、診断、治療、個別の医療・栄養指導は行わず、体重の減少などの効果を保証するものではありません。</p>
    </div>
  </div>
</section>
${curve("c-ivory")}

<section class="section">
  <div class="wrap">
    <div class="sec-head"><h2>提供しているもの</h2><span class="latin">What we offer</span></div>
    <div class="feature">${icons.article()}<div><h3>美容・健康・生活習慣の記事</h3><p>無料で読める公開記事12本と、8つのテーマで記録の付け方や振り返り方まで踏み込んだ会員限定記事40本。公的機関の資料を参照し、効果を断定しない誠実な内容を心がけています。</p><a class="more-link" href="/articles/">公開記事を読む</a></div></div>
    <div class="feature">${icons.sheet()}<div><h3>A4で印刷できる記録ツール</h3><p>30日・90日の生活習慣記録シート、睡眠・運動、食生活、美容習慣のセルフチェック、月末振り返りシートなど。会員ページからPDFでダウンロードできます。</p><a class="more-link" href="/tools/">記録ツールを見る</a></div></div>
    <div class="feature">${icons.report()}<div><h3>個別の振り返りレポート</h3><p>提出いただいた記録を集計・整理し、グラフと文章でまとめたA4のレポートをお届けします（スタンダードプラン・90日継続プラン）。診断や指導ではなく、記録を見渡すための資料です。</p><a class="more-link" href="/report/">レポートの内容を見る</a></div></div>
  </div>
</section>

<section class="section paper">
  <div class="wrap">
    <div class="sec-head"><h2>料金プラン</h2><span class="latin">Plans</span></div>
    <p class="sec-lead">すべて期間固定の買い切りです。自動更新や継続課金はありません。お支払いは銀行振込で、ご入金の確認後に会員情報をお送りします。</p>
    ${planList()}
    <p class="more"><a class="btn btn-ghost" href="/pricing/">料金と提供内容の詳細</a></p>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div>
      <div class="sec-head"><h2>納品物の見本</h2><span class="latin">Samples</span></div>
      <p>お申込み前に、実際にお届けする記録シートとレポートの形式をご確認いただけます。レポートは架空のデータで作成したサンプルです。</p>
      <div class="btn-row"><a class="btn btn-ghost" href="/report/">レポートの詳細</a><a class="btn btn-ghost" href="/tools/">記録ツールの詳細</a></div>
    </div>
    ${sampleFigures()}
  </div>
</section>

${curve()}
<section class="section tint">
  <div class="wrap">
    <div class="sec-head"><h2>新しい公開記事</h2><span class="latin">Journal</span></div>
    <div>${latest.map((a) => `<a class="entry" href="/articles/${a.slug}/"><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><span class="meta"><span>${esc(a.categoryName)}</span><span>${a.dateJa}</span></span></a>`).join("")}</div>
    <p class="more"><a class="btn btn-ghost" href="/articles/">記事一覧へ</a></p>
  </div>
</section>
${curve("c-ivory")}

<section class="section">
  <div class="wrap split">
    <div><div class="sec-head"><h2>運営会社</h2><span class="latin">Company</span></div><p>Webコンテンツの企画・制作・販売と、会員専用サイトの運営を行っています。</p><a class="btn btn-ghost" href="/company/">会社概要</a></div>
    <dl class="dl">
      <dt>会社名</dt><dd>${esc(company.name)}</dd>
      <dt>代表者</dt><dd>${esc(company.representative)}</dd>
      <dt>所在地</dt><dd>${esc(company.postal)} ${esc(company.address)}</dd>
      <dt>事業内容</dt><dd>Webコンテンツの企画・制作・販売、会員専用サイトの運営</dd>
    </dl>
  </div>
</section>
${ctaBand()}`;
}

export function service() {
  return `${pageHead({ title: "サービス紹介", latin: "Service", lead: "記事で考え方を知り、記録で毎日を書き留め、レポートで見渡す。3つの要素をつないだ、会員制のWebサービスです。", crumbs: [[null, "サービス紹介"]] })}
<figure class="photo-band"><img src="/assets/img/photos/still-life.jpg" alt="明るいテーブルに、サラダ、ヨガマット、スキンケア用品、ハーブティー、開いたノートが並んでいる" loading="lazy" decoding="async"></figure>
<section class="section" style="padding-top:0">
  <div class="wrap split">
    <div><div class="sec-head"><h2>サービスの概要</h2></div></div>
    <div class="prose">
      <p>合同会社シュガーラッシュは、美容・健康・生活習慣に関するWebコンテンツを企画・制作し、パスワードで保護された会員専用サイトで提供しています。</p>
      <p>会員の方は、期間中いつでも会員限定記事を読み、記録ツール（PDF）をダウンロードして日々の記録を続けられます。スタンダードプランと90日継続プランでは、提出いただいた記録を当社で集計・整理し、個別の振り返りレポートを制作して会員ページに掲載します。</p>
      <table><tbody>
        <tr><th>提供形態</th><td>Webサイト（会員専用ページ）とPDFファイル。郵送物はありません。</td></tr>
        <tr><th>利用期間</th><td>30日間または90日間の期間固定。自動更新はありません。</td></tr>
        <tr><th>利用環境</th><td>インターネットに接続できるパソコン・スマートフォン・タブレット。記録シートはA4で印刷して使うことを想定しています。</td></tr>
        <tr><th>お支払い</th><td>銀行振込（前払い）</td></tr>
      </tbody></table>
    </div>
  </div>
</section>

${curve()}
<section class="section tint">
  <div class="wrap">
    <div class="sec-head"><h2>3つの提供内容</h2><span class="latin">Contents</span></div>
    <div class="feature">${icons.article()}<div><h3>会員限定記事（40本）</h3><p>美容・エイジングケア、体型管理、食生活、睡眠・休息、運動・身体活動、セルフケア、生活習慣記録、継続プログラムの8テーマ×5本。チェックリストや記録項目の例を交えた、実際に手を動かすための記事で、各記事から関連する記録シートへ移動できます。どなたでも読める公開記事12本もご用意しています。</p><a class="more-link" href="/articles/">公開記事の一覧</a></div></div>
    <div class="feature">${icons.sheet()}<div><h3>記録ツール（PDF・A4）</h3><p>30日・90日の生活習慣記録シート、睡眠・運動記録シート、食生活の記録シート、美容・生活習慣セルフチェック、月末振り返りシート、利用ガイドなど。プランに応じて会員ページからダウンロードできます。</p><a class="more-link" href="/tools/">記録ツールの一覧</a></div></div>
    <div class="feature">${icons.report()}<div><h3>個別振り返りレポート（PDF・A4）</h3><p>会員ページの提出フォームから送られた記録をもとに、記録実施日数、分野ごとの記録状況、グラフ、継続できた取り組み、次月に向けた振り返り項目をまとめます。90日継続プランでは、3回の月間レポートに加えて90日総括レポートをお届けします。</p><a class="more-link" href="/report/">レポートの構成と見本</a></div></div>
  </div>
</section>
${curve("c-ivory")}

<section class="section">
  <div class="wrap split">
    <div><div class="sec-head"><h2>このような方に</h2><span class="latin">For you</span></div></div>
    <div class="prose"><ul>
      <li>年齢とともに、美容や生活習慣を見直したいと考えている方</li>
      <li>食生活や運動を記録して、自分の生活の傾向を知りたい方</li>
      <li>美容や健康に関する情報を、自分のペースで学びたい方</li>
      <li>日々の生活習慣を、継続的に振り返る仕組みがほしい方</li>
      <li>体型管理のための生活記録を始めたい方</li>
      <li>記録をまとめる時間がなく、整理されたレポートを受け取りたい方</li>
    </ul></div>
  </div>
</section>

<section class="section paper">
  <div class="wrap split">
    <div><div class="sec-head"><h2>行わないこと</h2><span class="latin">Our boundaries</span></div></div>
    <div class="prose">
      <p>SUGAR RUSHは、ご自身の記録を整理して振り返るためのサービスです。次のことは行いません。</p>
      <ul>
        <li>医療行為、診断、治療、またはそれに類する助言</li>
        <li>個別の医療指導・栄養指導、減量の指示</li>
        <li>体重の減少、肌の改善などの効果の保証</li>
        <li>医薬品・健康食品・化粧品などの販売や推奨</li>
      </ul>
      <p>持病のある方、通院中の方、体調に不安のある方は、記録を始める前に医師にご相談ください。記録やレポートの内容は、医療機関を受診する際の説明資料としてお使いいただくこともできます。</p>
    </div>
  </div>
</section>
${ctaBand()}`;
}

export function pricing() {
  const rows = [
    ["会員限定記事の閲覧", ["basic", "standard", "p90"]],
    ["美容・生活習慣セルフチェック", ["basic", "standard", "p90"]],
    ["記録ツール利用ガイド", ["basic", "standard", "p90"]],
    ["30日間記録シート", ["basic", "standard"]],
    ["90日間記録シート", ["p90"]],
    ["睡眠・運動／食生活の記録シート、月末振り返りシート", ["basic", "standard", "p90"]],
    ["記録の提出と、記録内容の集計・整理", ["standard", "p90"]],
    ["個別月間振り返りレポート", { standard: "1回", p90: "3回" }],
    ["90日総括レポート", { p90: "1回" }],
    ["翌月の記録目標整理シート", ["standard", "p90"]],
    ["90日 行動計画シート", ["p90"]],
  ];
  const cell = (r, id) => {
    const v = r[1];
    const has = Array.isArray(v) ? v.includes(id) : v[id];
    if (!has) return `<td class="no"><span aria-hidden="true">—</span><span class="sr-only">なし</span></td>`;
    return `<td class="yes">${Array.isArray(v) ? '<span aria-hidden="true">●</span><span class="sr-only">あり</span>' : esc(v[id])}</td>`;
  };
  return `${pageHead({ title: "料金プラン", latin: "Plans & Pricing", lead: "3つのプランはすべて期間固定の前払いです。自動更新・継続課金はありません。表示価格はすべて税込です。", crumbs: [[null, "料金プラン"]] })}
<section class="section" style="padding-top:0"><div class="wrap">${planList()}</div></section>

${curve("c-paper")}
<section class="section paper">
  <div class="wrap">
    <div class="sec-head"><h2>プランごとの提供内容</h2><span class="latin">Compare</span></div>
    <div class="table-scroll prose"><table class="compare">
      <thead><tr><th scope="col">提供内容</th>${plans.map((p) => `<th scope="col">${esc(p.name)}<br><small>${yen(p.price)}円／${p.days}日間</small></th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr><th scope="row">${esc(r[0])}</th>${plans.map((p) => cell(r, p.id)).join("")}</tr>`).join("")}</tbody>
    </table></div>
  </div>
</section>
${curve("c-ivory")}

<section class="section">
  <div class="wrap split">
    <div><div class="sec-head"><h2>お支払いと期間</h2><span class="latin">Payment</span></div></div>
    <div class="prose">
      <table><tbody>
        <tr><th>お支払い方法</th><td>${esc(terms.payment.text)}</td></tr>
        <tr><th>お支払い期限</th><td>${esc(terms.paymentDue.text)}</td></tr>
        <tr><th>料金以外の費用</th><td>${esc(terms.extraFee.text)}</td></tr>
        <tr><th>利用開始</th><td>${esc(terms.delivery.text)}</td></tr>
        <tr><th>更新</th><td>自動更新はありません。期間終了後に続けて利用したい場合は、改めてお申込みください。</td></tr>
        <tr><th>キャンセル</th><td>${esc(terms.cancel.text)}</td></tr>
      </tbody></table>
      <p class="note">クレジットカード等のオンライン決済には現在対応していません。お申込みはお問い合わせフォームの「サービスのお申込み」から受け付けています。</p>
    </div>
  </div>
</section>
${ctaBand({ title: "お申込みは、お問い合わせフォームから。", text: "希望のプランを選んで送信してください。内容を確認のうえ、お支払い方法をメールでご案内します。" })}`;
}

export function toolsPage() {
  const chips = (t) => `<span class="plan-chips">${t.plans.map((id) => `<span class="plan-chip">${esc(planName(id))}</span>`).join("")}</span>`;
  return `${pageHead({ title: "記録ツール紹介", latin: "Record tools", lead: "記録ツールは、A4用紙に印刷して手書きで使うPDFです。会員ページからダウンロードでき、プランによって利用できるシートが異なります。", crumbs: [[null, "記録ツール"]] })}
<figure class="photo-band"><img src="/assets/img/photos/tracker.jpg" alt="ノートに書かれた30日間の生活習慣の記録表と、レモン水、フルーツ、ヨガマット" loading="lazy" decoding="async"></figure>
<p class="photo-note">写真はイメージです。実際のシートは下の見本をご覧ください。</p>
<section class="section" style="padding-top:0">
  <div class="wrap">
    <ul class="file-list">${tools.map((t) => `<li id="${t.id}"><span class="t"><b>${esc(t.title)}</b><span class="desc">${esc(t.desc)}（A4・${t.pages}ページ）</span></span>${chips(t)}</li>`).join("")}</ul>
  </div>
</section>

${curve()}
<section class="section tint">
  <div class="wrap split">
    <div>
      <div class="sec-head"><h2>見本をご覧ください</h2><span class="latin">Preview</span></div>
      <p>記録シートは、1日1行で睡眠・食生活・運動・美容習慣などを書き込む形式です。項目をしぼった「シンプル版」と、時刻や記号で細かく記録する「詳細版」があり、どちらも会員ページからダウンロードできます。</p>
      <p class="btn-row"><a class="btn btn-ghost" href="/samples/sample-record-30days.pdf">30日記録シートの見本（PDF）</a><a class="btn btn-ghost" href="/samples/sample-self-check.pdf">セルフチェックの見本（PDF）</a></p>
      <p class="note">見本は「30日生活習慣記録シート（シンプル版）」と「美容・生活習慣セルフチェック（5分野版）」です。</p>
    </div>
    <div class="sample-pair">
      <figure class="sample-figure"><img src="/assets/img/sample-sheet30-p2.png" width="794" height="1123" loading="lazy" alt="30日生活習慣記録シートの記録ページ見本。日付・睡眠・食生活・運動・活動・美容習慣・気分・ひとことの欄がある表"><figcaption><span class="badge-sample">見本</span> 30日生活習慣記録シート（シンプル版）</figcaption></figure>
      <figure class="sample-figure"><img src="/assets/img/sample-selfcheck-p1.png" width="794" height="1123" loading="lazy" alt="美容・生活習慣セルフチェックの見本"><figcaption><span class="badge-sample">見本</span> 美容・生活習慣セルフチェック（5分野版）</figcaption></figure>
    </div>
  </div>
</section>
${curve("c-ivory")}

<section class="section">
  <div class="wrap split">
    <div><div class="sec-head"><h2>記録の提出について</h2><span class="latin">Submit</span></div></div>
    <div class="prose">
      <p>スタンダードプランと90日継続プランでは、記入したシートを会員ページの「記録提出」から送信していただきます。シートを撮影した写真（JPEG・PNG）またはスキャンしたPDFを添付し、記録の要点を入力欄に書いていただく形式です。</p>
      <p>提出された記録は、ログインした会員ご本人と当社の担当者だけが扱います。記録には、病名・服薬・検査結果など、医療に関する情報は書かないでください。</p>
      <p class="note">Webフォームに毎日の記録を直接入力する機能は、現在提供していません。記録は紙のシート（またはPDFへの書き込み）で行い、月末にまとめて提出していただく運用です。</p>
    </div>
  </div>
</section>
${ctaBand()}`;
}

export function reportPage() {
  const monthly = ["表紙・対象期間", "記録実施日数", "睡眠・運動・食生活・美容習慣の記録状況", "記録内容のグラフ", "生活習慣の傾向", "継続できた取り組み", "次月に向けた振り返り項目", "まとめ"];
  const total = ["90日間の記録概要", "月別の記録実施状況", "習慣の変化を示すグラフ", "継続しやすかった取り組み", "記録から確認できた傾向", "今後の記録目標", "総括"];
  return `${pageHead({ title: "振り返りレポート紹介", latin: "Reflection report", lead: "提出いただいた記録を当社で集計・整理し、A4のレポートにまとめてお届けします。診断書や評価書ではなく、ご自身の記録を見渡すための資料です。", crumbs: [[null, "振り返りレポート"]] })}
<section class="section" style="padding-top:0">
  <div class="wrap split">
    <div class="prose">
      <h2>月間振り返りレポート</h2>
      <p>A4縦・2〜3ページ。スタンダードプランで1回、90日継続プランで3回お届けします。</p>
      <ol>${monthly.map((m) => `<li>${m}</li>`).join("")}</ol>
      <h2>90日総括レポート</h2>
      <p>A4縦・3〜4ページ。90日継続プランで、3回目の月間レポートとあわせてお届けします。</p>
      <ol>${total.map((m) => `<li>${m}</li>`).join("")}</ol>
      <p class="btn-row"><a class="btn btn-ghost" href="/samples/sample-monthly-report.pdf">月間レポートの架空サンプル（PDF・1〜2ページ）</a><a class="btn btn-ghost" href="/samples/sample-90day-report.pdf">90日総括レポートの架空サンプル（PDF）</a></p>
    </div>
    <div class="sample-pair">
      <figure class="sample-figure"><img src="/assets/img/sample-report-monthly-p1.png" width="794" height="1123" loading="lazy" alt="月間振り返りレポートの架空サンプル1ページ目"><figcaption><span class="badge-sample">架空サンプル</span> 月間レポート 1ページ目</figcaption></figure>
      <figure class="sample-figure"><img src="/assets/img/sample-report-monthly-p2.png" width="794" height="1123" loading="lazy" alt="月間振り返りレポートの架空サンプル2ページ目。記録内容のグラフ"><figcaption><span class="badge-sample">架空サンプル</span> 月間レポート 2ページ目</figcaption></figure>
    </div>
  </div>
</section>

${curve()}
<section class="section tint">
  <div class="wrap split">
    <div><div class="sec-head"><h2>レポートができるまで</h2><span class="latin">Process</span></div></div>
    <ol class="flow">
      <li><h3>記録を提出する<span class="who">会員</span></h3><p>${esc(terms.submitDeadline.text)}</p></li>
      <li><h3>記録を集計する<span class="who">当社</span></h3><p>記録シートから、記録した日数、各項目の記入状況、時刻や回数などの数えられる情報を集計します。</p></li>
      <li><h3>整理して文章にまとめる<span class="who">当社</span></h3><p>集計結果をグラフにし、記録から読み取れる傾向、続いた取り組み、次月に確認したい項目を文章で整理します。</p></li>
      <li><h3>会員ページに掲載する<span class="who">当社</span></h3><p>${esc(terms.reportDeadline.text)} レポートはご本人のログインでのみ閲覧・ダウンロードできます。</p></li>
    </ol>
  </div>
</section>
${curve("c-ivory")}

<section class="section">
  <div class="wrap split">
    <div><div class="sec-head"><h2>レポートに書かないこと</h2></div></div>
    <div class="prose">
      <p>レポートは、記録された情報を整理したものです。次の内容は含みません。</p>
      <ul><li>健康状態や病気に関する判断</li><li>減量や食事制限などの指示</li><li>治療方針や医療機関の選び方に関する提案</li><li>記録されていない事柄についての推測</li></ul>
      <p>記録から気になる点が見つかった場合でも、当社から医学的な判断はお伝えしません。体調に関するご不安は、医療機関にご相談ください。</p>
    </div>
  </div>
</section>
${ctaBand()}`;
}

export function flowPage() {
  const steps = [
    ["サービス・料金を確認する", "会員", "", "サービス紹介、料金プラン、記録ツール・レポートの見本をご確認ください。"],
    ["希望のプランを選ぶ", "会員", "", "ベーシック・スタンダード・90日継続の3つから選びます。迷う場合はお問い合わせください。"],
    ["お問い合わせフォームから申し込む", "会員", "申込受付", "お問い合わせ種別で「サービスのお申込み」を選び、希望のプランを選んで送信します。当社から、受付のご連絡とお振込先をメールでお送りします。"],
    ["料金を振り込む", "会員", "", `${terms.paymentDue.text}にお振り込みください。振込手数料はお客様のご負担です。`],
    ["入金を確認し、会員情報を発行する", "当社", "入金確認 → 会員権限付与", terms.delivery.text],
    ["会員限定記事・記録ツールを使う", "会員", "", "会員ページにログインし、記事を読み、記録シートをダウンロードして記録を始めます。"],
    ["記録を提出する", "会員", "", "スタンダードプラン・90日継続プランの方は、会員ページの記録提出フォームから記録を送信します。"],
    ["個別レポートを受け取る", "当社", "", `${terms.reportDeadline.text}`],
  ];
  return `${pageHead({ title: "ご利用の流れ", latin: "How it works", lead: "お申込みから会員情報の発行、レポートの納品までの流れです。お申込みの受付、ご入金の確認、会員権限の付与は、それぞれ別の段階として管理しています。", crumbs: [[null, "ご利用の流れ"]] })}
<figure class="photo-band"><img src="/assets/img/photos/flow-report.jpg" alt="若葉、ノート、お茶、運動用具、グラフの用紙が机の上に順に並んでいる" loading="lazy" decoding="async"></figure>
<section class="section" style="padding-top:0">
  <div class="wrap narrow">
    <ol class="flow">${steps.map(([h, who, state, p]) => `<li><h3>${esc(h)}<span class="who">${who}</span>${state ? `<span class="state">${esc(state)}</span>` : ""}</h3><p>${esc(p)}</p></li>`).join("")}</ol>
    <div class="note"><p>会員権限は、ご入金を当社で確認してから付与します。お申込みの送信だけでは会員ページは利用できません。利用期間は会員情報をお送りした日から数え、期間の終了日を過ぎると会員ページは閲覧できなくなります（作成済みのレポートは、終了日から${terms.reportGraceDays}日間ダウンロードできます）。</p></div>
  </div>
</section>
${ctaBand()}`;
}

export function companyPage() {
  return `${pageHead({ title: "会社概要", latin: "Company", crumbs: [[null, "会社概要"]] })}
<figure class="photo-band"><img src="/assets/img/photos/tea-sea.jpg" alt="海と山を望むテラスのテーブルに、ハーブティーと本が置かれている" loading="lazy" decoding="async"></figure>
<section class="section" style="padding-top:0">
  <div class="wrap narrow">
    <dl class="dl">
      <dt>会社名</dt><dd>${esc(company.name)}</dd>
      <dt>英語表記</dt><dd>${esc(company.nameEn)}</dd>
      <dt>代表者</dt><dd>${esc(company.representative)}</dd>
      <dt>本店所在地</dt><dd>${esc(company.postal)}<br>${esc(company.address)}</dd>
      <dt>電話番号</dt><dd>${esc(company.tel)}<small>受付時間：${esc(terms.businessHours.text)}</small></dd>
      <dt>メールアドレス</dt><dd><a href="mailto:${esc(company.email)}">${esc(company.email)}</a></dd>
      <dt>設立</dt><dd>${esc(company.founded)}</dd>
      <dt>資本金</dt><dd>${esc(company.capital)}</dd>
      <dt>法人番号</dt><dd>${esc(company.corporateNumber)}</dd>
      <dt>事業内容</dt><dd><ul>${company.business.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></dd>
      <dt>主なサービス</dt><dd>会員制Webサービス「SUGAR RUSH」（会員限定記事、記録ツール、個別振り返りレポート）</dd>
    </dl>
  </div>
</section>
${curve()}
<section class="section tint">
  <div class="wrap narrow">
    <div class="sec-head"><h2>沿革</h2><span class="latin">History</span></div>
    <dl class="dl">${company.history.map(([d, t]) => `<dt>${esc(d)}</dt><dd>${esc(t)}</dd>`).join("")}</dl>
  </div>
</section>
${curve("c-ivory")}
<section class="section">
  <div class="wrap narrow prose">
    <div class="sec-head"><h2>運営にあたって大切にしていること</h2><span class="latin">Policy</span></div>
    <h3>根拠のない効果をうたわない</h3>
    <p>美容・健康の分野では、効果を強く打ち出す表現が多く見られます。当社は、効果の保証や、根拠を確認できない数値・研究結果の掲載を行いません。記事の作成にあたっては、厚生労働省などの公的機関が公表している資料を参照しています。</p>
    <h3>医療の領域に立ち入らない</h3>
    <p>当社のサービスは、記録の整理と情報提供です。診断、治療、個別の医療・栄養指導は行いません。</p>
    <h3>記録をていねいに扱う</h3>
    <p>会員の皆さまからお預かりする記録は、ご本人と当社の担当者だけが扱います。個人ごとのレポートは会員ごとに管理し、他の方が閲覧できない仕組みで提供しています。詳しくは<a href="/privacy/">プライバシーポリシー</a>をご覧ください。</p>
  </div>
</section>
${ctaBand({ title: "サービスについてのご質問は、お気軽に。", text: "お問い合わせフォームから受け付けています。通常、2営業日以内にメールでご返信します。" })}`;
}

export function faqPage() {
  const groups = [
    ["サービスについて", [
      ["どのようなサービスですか？", "美容・健康・生活習慣に関する記事、記録ツール（PDF）、提出された記録を整理した振り返りレポートを、会員専用サイトで提供するサービスです。"],
      ["ダイエットや美容の効果はありますか？", "当社のサービスは記録の整理と情報提供を目的としており、体重の減少や肌の改善などの効果を保証するものではありません。"],
      ["医師や管理栄養士に相談できますか？", "医療・栄養に関する個別の相談や指導は行っていません。持病のある方や体調に不安のある方は、医療機関にご相談ください。"],
      ["パソコンがなくても利用できますか？", "スマートフォンでも記事の閲覧、シートのダウンロード、記録の提出ができます。記録シートはA4で印刷して使う想定のため、ご自宅にプリンターがない場合はコンビニエンスストアのプリントサービスなどをご利用ください。"],
    ]],
    ["料金・お支払い", [
      ["支払い方法は何がありますか？", "銀行振込のみです。お申込み後、お振込先をメールでご案内します。"],
      ["自動で更新されますか？", "されません。すべてのプランが期間固定の買い切りです。続けて利用したい場合は、改めてお申込みください。"],
      ["キャンセルや返金はできますか？", terms.cancel.text + " " + terms.defect.text],
      ["領収書は発行できますか？", "ご希望の場合は、お問い合わせフォームからご連絡ください。PDFでお送りします。"],
    ]],
    ["記録とレポート", [
      ["記録はどのように提出しますか？", "会員ページの「記録提出」から、記入したシートの写真またはPDFを添付し、記録の要点を入力して送信します。"],
      ["記録が少なくてもレポートは作れますか？", "記録が少ない場合も、記録された範囲で整理します。記録できなかった期間も、レポートの中で事実として扱います。"],
      ["レポートはいつ届きますか？", terms.reportDeadline.text],
      ["レポートは他の人に見られませんか？", "レポートは会員IDごとに管理し、ご本人のログインでのみ閲覧・ダウンロードできます。会員IDとパスワードは、ほかの方と共有しないでください。"],
    ]],
    ["会員サイト・ログイン", [
      ["パスワードを忘れました。", "お問い合わせフォームの「会員サイト・ログインについて」からご連絡ください。ご本人確認のうえ、新しいパスワードを発行します。"],
      ["ログインできなくなりました。", "パスワードを続けて間違えると、一定時間ログインできなくなります。時間をおいて再度お試しください。利用期間が終了している場合もログインできません。"],
      ["利用期間が終わったら、記録やレポートはどうなりますか？", `会員ページは閲覧できなくなりますが、作成済みのレポートは終了日から${terms.reportGraceDays}日間ダウンロードできます。必要なファイルは期間中に保存してください。`],
    ]],
  ];
  return `${pageHead({ title: "よくある質問", latin: "FAQ", crumbs: [[null, "よくある質問"]] })}
<section class="section" style="padding-top:0">
  <div class="wrap narrow faq">${groups.map(([g, qs]) => `<h2>${esc(g)}</h2>${qs.map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join("")}`).join("")}
    <p class="note" style="margin-top:3em">ここにないご質問は、<a href="/contact/">お問い合わせフォーム</a>からお寄せください。</p>
  </div>
</section>`;
}

export function contactPage() {
  return `${pageHead({ title: "お問い合わせ・お申込み", latin: "Contact", lead: "サービスへのご質問、お申込みはこちらのフォームから受け付けています。通常、2営業日以内にメールでご返信します。", crumbs: [[null, "お問い合わせ"]] })}
<section class="section" style="padding-top:0">
  <div class="wrap narrow">
    <div class="form-box">
      <form class="form" name="contact" method="POST" action="/contact/thanks/" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="contact">
        <p class="hp" aria-hidden="true"><label>この欄は入力しないでください<input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        <div class="field"><label for="f-name">お名前<span class="req">必須</span></label><input id="f-name" type="text" name="name" autocomplete="name" required maxlength="80"></div>
        <div class="field"><label for="f-email">メールアドレス<span class="req">必須</span></label><input id="f-email" type="email" name="email" autocomplete="email" required maxlength="200"><p class="hint">${esc(company.email)} からのメールを受信できるよう設定してください。</p></div>
        <div class="field"><label for="f-type">お問い合わせ種別<span class="req">必須</span></label>
          <select id="f-type" name="inquiry_type" required>
            <option value="">選択してください</option>
            <option>サービス内容について</option>
            <option>サービスのお申込み</option>
            <option>料金・お支払いについて</option>
            <option>会員サイト・ログインについて</option>
            <option>取材・お取引について</option>
            <option>その他</option>
          </select></div>
        <div class="field"><label for="f-plan">希望するサービス<span class="opt">任意</span></label>
          <select id="f-plan" name="plan">
            <option value="">未定・該当なし</option>
            ${plans.map((p) => `<option>${esc(p.name)}（${yen(p.price)}円・${p.days}日間）</option>`).join("")}
          </select><p class="hint">お申込みの場合は必ずお選びください。</p></div>
        <div class="field"><label for="f-msg">お問い合わせ内容<span class="req">必須</span></label><textarea id="f-msg" name="message" required maxlength="3000"></textarea><p class="hint">体重、病歴、服薬、健康状態など、からだに関する情報は書かないでください。このフォームでは取得していません。</p></div>
        <div class="field"><label class="check"><input type="checkbox" name="privacy_agree" value="同意する" required><span><a href="/privacy/" target="_blank" rel="noopener">プライバシーポリシー</a>に記載の個人情報の取扱いに同意します。<span class="req">必須</span></span></label></div>
        <div><button class="btn" type="submit">内容を送信する</button></div>
      </form>
    </div>
    <p class="note">お電話でのお問い合わせ：${esc(company.tel)}（${esc(terms.businessHours.text)}）。不在の場合がありますので、フォームでのご連絡をおすすめします。</p>
  </div>
</section>`;
}

export function thanksPage() {
  return `${pageHead({ title: "送信が完了しました", latin: "Thank you" })}
<section class="section" style="padding-top:0">
  <div class="wrap narrow prose">
    <p>お問い合わせいただき、ありがとうございます。内容を確認のうえ、通常2営業日以内にメールでご返信します。</p>
    <p>お申込みの場合は、受付のご連絡とあわせて、お支払い方法をご案内します。ご入金の確認後に会員情報をお送りします。</p>
    <p class="note">数日たっても返信が届かない場合は、迷惑メールフォルダをご確認のうえ、${esc(company.email)} までご連絡ください。</p>
    <p><a class="btn btn-ghost" href="/">トップページへ戻る</a></p>
  </div>
</section>`;
}

export function notFoundPage() {
  return `${pageHead({ title: "ページが見つかりません", latin: "Not found" })}
<section class="section" style="padding-top:0"><div class="wrap narrow prose"><p>お探しのページは、移動または削除された可能性があります。URLをご確認いただくか、トップページからお探しください。</p><p><a class="btn btn-ghost" href="/">トップページへ</a></p></div></section>`;
}
