"""
記録ツールPDF・架空サンプルレポート・プレビュー画像・ファビコン・OGP画像の生成スクリプト
（開発用。サイトのビルドには不要です。生成物はリポジトリに含めています）

  python3 tools/pdf-src/make_assets.py

必要なもの：Python 3、playwright（Chromium）、日本語フォント（Noto Sans/Serif CJK JP）
出力：
  protected/tools/*.pdf          … 会員専用の記録ツール（dist には出力されません）
  src/static/samples/*.pdf       … 公開用の見本・架空サンプル
  src/static/img/*.png, *.svg    … 見本画像・ロゴ・ファビコン・OGP
  tools/report-maker/sample-*.json … レポート作成ツールの入力例
"""
import json, random, datetime as dt
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PROT = ROOT / "protected/tools"
SAMPLES = ROOT / "src/static/samples"
IMG = ROOT / "src/static/img"
RM = ROOT / "tools/report-maker"
for d in (PROT, SAMPLES, IMG):
    d.mkdir(parents=True, exist_ok=True)

LOGO_PATH = 'M33.5 13.5c-3.6-4.4-15.4-4.6-16.6 2.4-1.3 7.6 17.3 7.4 16.4 15.6-.8 7.2-13.7 8.3-18.8 3'
LOGO_SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22.5" fill="none" stroke="#D9C8AD" stroke-width="1"/><path d="{LOGO_PATH}" fill="none" stroke="#48675D" stroke-width="2.6" stroke-linecap="round"/><circle cx="14.5" cy="34.5" r="1.6" fill="#48675D"/><circle cx="11.6" cy="31.4" r="1.15" fill="#48675D" opacity=".7"/><circle cx="9.9" cy="27.8" r=".8" fill="#48675D" opacity=".45"/><circle cx="33.5" cy="13.5" r="2.4" fill="#B88783"/></svg>'''
FAVICON_SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#FAF8F3"/><path d="{LOGO_PATH}" fill="none" stroke="#48675D" stroke-width="3.6" stroke-linecap="round"/><circle cx="33.5" cy="13.5" r="3.2" fill="#B88783"/></svg>'''
SMALL_LOGO = f'<svg viewBox="0 0 48 48" width="15" height="15"><path d="{LOGO_PATH}" fill="none" stroke="#48675D" stroke-width="3" stroke-linecap="round"/><circle cx="33.5" cy="13.5" r="2.6" fill="#B88783"/></svg>'

CSS = """
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; color: #333B37; font-family: "Noto Sans CJK JP", sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: #E9E6DE; }
.page { width: 210mm; height: 297mm; padding: 13mm 14mm 13mm; position: relative; overflow: hidden; background: #fff; page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
h1, h2, h3, .mincho { font-family: "Noto Serif CJK JP", serif; font-weight: 600; letter-spacing: .06em; margin: 0; }
h1 { font-size: 20pt; font-weight: 500; }
h2 { font-size: 12pt; padding-left: 3mm; border-left: 1mm solid #48675D; margin: 0 0 2.5mm; line-height: 1.4; }
h3 { font-size: 10.5pt; margin: 0 0 1.5mm; }
p, li, td, th, dd, dt { font-size: 8.8pt; line-height: 1.7; }
p { margin: 0 0 2mm; }
.head { display: flex; justify-content: space-between; align-items: center; border-bottom: .3mm solid #D8DED8; padding-bottom: 2mm; margin-bottom: 4.5mm; font-size: 7.6pt; color: #5B635F; }
.head .b { display: flex; gap: 1.6mm; align-items: center; letter-spacing: .14em; }
.foot { position: absolute; left: 14mm; right: 14mm; bottom: 7mm; display: flex; justify-content: space-between; font-size: 6.8pt; color: #5B635F; border-top: .3mm solid #D8DED8; padding-top: 1.6mm; }
table { border-collapse: collapse; width: 100%; }
.grid td, .grid th { border: .3mm solid #9FB0A7; padding: 0 1mm; text-align: center; font-size: 7.6pt; }
.grid thead th { background: #E8EEE8; font-weight: 700; height: 8mm; line-height: 1.25; }
.grid .sub th { background: #F3F6F3; font-weight: 400; font-size: 6.8pt; height: 5mm; }
.grid td.l { text-align: left; }
.line-table td, .line-table th { border-bottom: .3mm solid #D8DED8; padding: 1.4mm 1.8mm; text-align: left; vertical-align: top; }
.line-table th { background: #E8EEE8; white-space: nowrap; font-weight: 700; }
.box { border: .3mm solid #9FB0A7; border-radius: 2mm; padding: 3mm 4mm; }
.box.tint { background: #FAF8F3; border-color: #D9C8AD; }
.box .lbl { font-size: 8pt; font-weight: 700; color: #48675D; margin-bottom: 1mm; display: block; }
.ruled { background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 7.6mm, #C9D1CB 7.6mm, #C9D1CB 7.9mm); }
.cover { background: #FAF8F3; margin: -13mm -14mm 6mm; padding: 18mm 14mm 10mm; position: relative; }
.cover .kind { font-size: 8.6pt; color: #48675D; letter-spacing: .2em; }
.cover h1 { margin-top: 2mm; }
.cover svg.deco { position: absolute; right: 0; top: 4mm; width: 92mm; }
.legend { display: flex; flex-wrap: wrap; gap: 1mm 5mm; font-size: 7.8pt; color: #5B635F; }
.legend b { color: #333B37; }
.cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
.cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
.fieldline { display: inline-block; min-width: 38mm; border-bottom: .3mm solid #9FB0A7; height: 6mm; vertical-align: bottom; }
.cb { display: inline-block; width: 3.4mm; height: 3.4mm; border: .3mm solid #48675D; border-radius: .5mm; vertical-align: -0.6mm; margin-right: 1mm; }
.mini { font-size: 7.2pt; color: #5B635F; }
.mark-sample { position: absolute; right: 14mm; top: 100mm; transform: rotate(-16deg); font-family: "Noto Serif CJK JP", serif; font-size: 64pt; color: rgba(184,135,131,.14); letter-spacing: .3em; pointer-events: none; }
ul.d { margin: 0; padding-left: 4.4mm; } ul.d li { margin: .6mm 0; } ul.d li::marker { color: #B88783; }
"""

DECO = '<svg class="deco" viewBox="0 0 360 160" fill="none"><path d="M0 150C90 140 120 70 200 62S320 20 360 6" stroke="#48675D" stroke-opacity=".45"/><path d="M20 160C120 150 160 100 230 96S330 64 360 52" stroke="#48675D" stroke-opacity=".2"/>' + "".join(f'<circle cx="{x}" cy="{150 - x*0.39 - (i%2)*4:.0f}" r="2.4" fill="#48675D" fill-opacity=".5"/>' for i, x in enumerate([40, 90, 140, 190, 240, 290])) + '<circle cx="340" cy="13" r="3.6" fill="#B88783"/></svg>'


def doc(pages_html, sample=False):
    mark = '<div class="mark-sample">見本</div>' if sample else ""
    pages = "".join(p.replace("<!--MARK-->", mark) for p in pages_html)
    return f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{pages}</body></html>'


def page(tool, inner, no, total, cover=False):
    head = "" if cover else f'<div class="head"><span class="b">{SMALL_LOGO}SUGAR RUSH</span><span>{tool}</span></div>'
    return f'<section class="page"><!--MARK-->{head}{inner}<div class="foot"><span>合同会社シュガーラッシュ｜会員の私的利用に限ります。複製・再配布はご遠慮ください。</span><span>{tool}　{no} / {total}</span></div></section>'


def cover(kind, title, lead, extra=""):
    return f'<div class="cover">{DECO}<div class="kind">{kind}</div><h1>{title}</h1><p style="margin-top:3mm;max-width:120mm">{lead}</p>{extra}</div>'


SYMBOLS = '<div class="legend"><span><b>目覚め</b> ◎すっきり ○ふつう △つらい</span><span><b>食事</b> 時刻を記入／食べなかったら「—」</span><span><b>ケア</b> ✓基本手順どおり △一部省いた —しなかった</span><span><b>空欄</b>＝書き忘れ（「—」と区別）</span></div>'


# ---------------------------------------------------------------- 30日・90日記録シート
def record_rows(start_day, n=10):
    head = """<thead><tr><th rowspan="2" style="width:8mm">日目</th><th rowspan="2" style="width:12mm">日付</th><th colspan="3">睡眠</th><th colspan="4">食事（時刻）</th><th colspan="2">運動・活動</th><th colspan="2">美容習慣</th><th rowspan="2">ひとこと</th></tr>
<tr class="sub"><th style="width:10mm">起床</th><th style="width:10.5mm;white-space:nowrap">目覚め</th><th style="width:10mm">就寝</th><th style="width:9mm">朝</th><th style="width:9mm">昼</th><th style="width:9mm">夕</th><th style="width:6mm">間</th><th style="width:12mm">歩数</th><th style="width:15mm">運動</th><th style="width:10.5mm;white-space:nowrap">朝ケア</th><th style="width:10.5mm;white-space:nowrap">夜ケア</th></tr></thead>"""
    rows = "".join(f'<tr style="height:18.6mm"><td><span class="mincho" style="font-size:11pt">{start_day+i}</span></td><td style="font-size:7pt;color:#9FB0A7;vertical-align:bottom">／</td>' + '<td></td>' * 11 + '<td></td></tr>' for i in range(n))
    return f'<table class="grid">{head}<tbody>{rows}</tbody></table>'


def sheet_record_page(tool, start, no, total):
    inner = f'<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2mm"><h2>{start}〜{start+9}日目</h2><span class="mini">期間 <span class="fieldline" style="min-width:24mm"></span>〜<span class="fieldline" style="min-width:24mm"></span></span></div>{record_rows(start)}<div class="box" style="margin-top:3mm;height:16mm"><span class="lbl">この10日間で気づいたこと</span></div>'
    return page(tool, inner, no, total)


def guide_columns():
    return """<table class="line-table" style="margin-top:2mm"><tbody>
<tr><th>就寝・起床</th><td>起床＝その日の朝に寝床を出た時刻、就寝＝その日の夜に寝床に入った時刻（例 6:40 / 23:30）</td></tr>
<tr><th>目覚め</th><td>その日の朝の目覚め。◎すっきり ○ふつう △つらい。迷ったら ○</td></tr>
<tr><th>朝・昼・夕・間</th><td>食べ始めた時刻。食べなかったら「—」。間（間食）は回数</td></tr>
<tr><th>歩数・運動</th><td>歩数計やスマートフォンの数字。測っていない日は「多・普・少」。運動は内容と時間（例 散歩20分）</td></tr>
<tr><th>朝ケア・夜ケア</th><td>基本手順どおり ✓／一部省いた △／しなかった —</td></tr>
<tr><th>ひとこと</th><td>出来事・気づき・天気など20字程度。月末の振り返りで最も役立つ列です</td></tr>
</tbody></table>"""


def make_30(sample=False):
    tool = "30日生活習慣記録シート"
    c = page(tool, cover("記録シート／30日", "30日生活習慣記録シート", "睡眠・食事・運動・美容習慣を、1日1行で記録するシートです。最初の7日間は「就寝」「起床」「ひとこと」の3列だけを埋め、慣れてきたら列を増やしてください。",
             '<p style="margin-top:4mm">お名前 <span class="fieldline"></span>　記録開始日 <span class="fieldline" style="min-width:30mm"></span></p>') +
             '<h2>列の書き方</h2>' + guide_columns() + '<h2 style="margin-top:5mm">記号のルール</h2>' + SYMBOLS +
             '<div class="box tint" style="margin-top:5mm"><span class="lbl">はじめる前に決めること</span><p>書く場所：<span class="fieldline"></span>　書く時刻：<span class="fieldline"></span></p><p>最初の7日間に書く列：就寝・起床・ひとこと　　7日目に見返す日：<span class="fieldline" style="min-width:30mm"></span></p></div>'
             '<p class="mini" style="margin-top:4mm">※ 記録には病名・服薬・検査結果など医療に関する情報を書かないでください。体調に不安がある場合は医療機関にご相談ください。</p>', 1, 4, cover=True)
    pages = [c] + [sheet_record_page(tool, s, i + 2, 4) for i, s in enumerate([1, 11, 21])]
    if sample:
        pages = pages[:2]
        pages = [p.replace(" / 4</span>", " / 4（見本）</span>") for p in pages]
    return doc(pages, sample)


def make_90():
    tool = "90日生活習慣記録シート"
    total = 13
    pages = [page(tool, cover("記録シート／90日", "90日生活習慣記録シート", "30日ごとに区切りページがあります。区切りページで期間の重点を確かめてから、記録ページに進んでください。列の書き方は30日シートと同じです。",
                              '<p style="margin-top:4mm">お名前 <span class="fieldline"></span>　記録開始日 <span class="fieldline" style="min-width:30mm"></span></p>') +
                  '<h2>90日の進め方</h2><table class="line-table"><tbody><tr><th>期間1（1〜30日目）</th><td>知る：生活を変えずに、今の様子をそのまま記録する</td></tr><tr><th>期間2（31〜60日目）</th><td>試す：1回目のレポートをもとに、試すことを1〜2つ決めて記録する</td></tr><tr><th>期間3（61〜90日目）</th><td>定着させる：続けられたことを中心に記録する</td></tr></tbody></table>'
                  '<h2 style="margin-top:5mm">列の書き方</h2>' + guide_columns() + '<div style="margin-top:4mm">' + SYMBOLS + '</div>', 1, total, cover=True)]
    no = 2
    for k, (name, theme) in enumerate([("期間1　知る", "今の生活を、変えずに記録する"), ("期間2　試す", "決めたことを、記録で確かめる"), ("期間3　定着させる", "続いたことを、安定させる")]):
        s = k * 30 + 1
        inner = f'<div style="padding-top:30mm"><p class="mincho" style="color:#B88783;font-size:10pt;letter-spacing:.2em">{s}〜{s+29}日目</p><h1 style="margin:2mm 0 4mm">{name}</h1><p style="font-size:11pt">{theme}</p></div>' \
                f'<div class="box tint" style="margin-top:12mm"><span class="lbl">この期間の重点（90日 行動計画シートから書き写す）</span><div class="ruled" style="height:24mm"></div></div>' \
                f'<div class="cols2" style="margin-top:5mm"><div class="box"><span class="lbl">確かめる列</span><div class="ruled" style="height:16mm"></div></div><div class="box"><span class="lbl">中間の確認日</span><div class="ruled" style="height:16mm"></div></div></div>' \
                f'<div class="box" style="margin-top:5mm"><span class="lbl">期間の終わりに：続いたこと／途切れたこと</span><div class="ruled" style="height:40mm"></div></div>' \
                f'<p class="mini" style="margin-top:4mm">期間の最終日から7日以内を目安に、会員ページの「記録提出」から記録を送ってください。</p>'
        pages.append(page(tool, inner, no, total)); no += 1
        for j in range(3):
            pages.append(sheet_record_page(tool, s + j * 10, no, total)); no += 1
    return doc(pages)


# ---------------------------------------------------------------- セルフチェック
CHECK = [
    ("美容習慣", ["朝のスキンケアの手順が決まっている", "夜のスキンケアを省く日は少ない", "外出するときに日差しへの備えをしている", "季節に合わせてケアの内容を見直している", "使っているアイテムの種類を把握している"]),
    ("食生活", ["朝食をとる日が多い", "主食・主菜・副菜がそろう食事が1日1回以上ある", "食事の時刻がおおむね決まっている", "間食をとる時間帯を把握している", "水分をこまめにとっている"]),
    ("睡眠", ["起きる時刻がおおむね一定している", "寝る前の1時間に画面を見る時間は短い", "目覚めがすっきりしている日が多い", "休日と平日で起きる時刻の差が小さい", "寝室を暗く、静かに整えている"]),
    ("運動", ["1日の中で歩く時間がある", "座りっぱなしの時間に区切りを入れている", "筋力づくりの運動を週1日以上している", "階段や遠回りなど、意識して動くことがある", "体を動かす時間を楽しめている"]),
    ("セルフケア", ["疲れを感じたときに休む時間をとれている", "体調や気分の小さな変化に気づくことがある", "自分なりの気分転換の方法がある", "困ったときに相談できる人や場所がある", "自分をいたわる言葉をかけられる"]),
    ("生活リズム", ["朝に外の光を浴びている", "食事・睡眠・活動の時刻が日によって大きく変わらない", "1日の予定を把握して過ごしている", "自分のための時間を確保できている", "記録を書く時間が決まっている"]),
]


def make_check(sample=False):
    tool = "美容・生活習慣セルフチェック"
    rows = ""
    for cat, items in CHECK:
        for i, it in enumerate(items):
            rows += f'<tr style="height:6.9mm">{f"<th rowspan=5 style=\'width:17mm;writing-mode:vertical-rl;letter-spacing:.2em;background:#E8EEE8\'>{cat}</th>" if i == 0 else ""}<td class="l">{it}</td><td><span class="cb"></span></td><td><span class="cb"></span></td><td><span class="cb"></span></td><td><span class="cb" style="border-color:#B88783"></span></td></tr>'
    p1 = f'<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:3mm"><div><h1 style="font-size:16pt">美容・生活習慣セルフチェック</h1><p class="mini" style="margin:1mm 0 0">今の自分にどれくらい当てはまるかを選びます。迷ったら「ときどき」。点数や判定はありません。</p></div><p style="margin:0">記入日 <span class="fieldline" style="min-width:30mm"></span></p></div>' \
         f'<table class="grid"><thead><tr><th>分野</th><th>項目</th><th style="width:17mm">あてはまる</th><th style="width:15mm">ときどき</th><th style="width:19mm">あてはまらない</th><th style="width:17mm;color:#8E5F5B">前月から<br>変わった</th></tr></thead><tbody>{rows}</tbody></table>' \
         '<p class="mini" style="margin-top:2mm">「前月から変わった」欄は、前月のシートと比べて答えが変わった項目に印をつけます。チェックの結果から体の状態を判断することはできません。</p>'
    p2 = '<h2>わたしの基本手順</h2><p class="mini">今実際に行っているスキンケアの手順を書きます。30日記録シートの「朝ケア」「夜ケア」の ✓ の基準になります。</p><div class="cols2"><div class="box"><span class="lbl">朝</span><div class="ruled" style="height:46mm"></div></div><div class="box"><span class="lbl">夜</span><div class="ruled" style="height:46mm"></div></div></div>' \
         '<h2 style="margin-top:6mm">今月、答えが変わった項目と思い当たること</h2><div class="box"><div class="ruled" style="height:46mm"></div></div>' \
         '<h2 style="margin-top:6mm">来月、記録で注目したい分野</h2><p>' + "　".join(f'<span class="cb"></span>{c}' for c, _ in CHECK) + '</p><div class="box" style="margin-top:2mm"><span class="lbl">理由・メモ</span><div class="ruled" style="height:32mm"></div></div>'
    return doc([page(tool, p1, 1, 2), page(tool, p2, 2, 2)], sample)


# ---------------------------------------------------------------- 睡眠・運動
def make_sleep():
    tool = "睡眠・運動記録シート"
    hours = list(range(18, 24)) + list(range(0, 13))
    hdr = "".join(f'<th colspan="2" style="font-size:6.4pt;font-weight:400;padding:0">{h}</th>' for h in hours[:-1])
    cells = "".join(f'<td style="padding:0;border-left:{".3mm solid #9FB0A7" if i % 2 == 0 else ".15mm dotted #C9D1CB"}"></td>' for i in range(36))
    days = ["月", "火", "水", "木", "金", "土", "日"]
    sleep_rows = "".join(f'<tr style="height:9mm"><td>{d}<br><span style="font-size:6.4pt;color:#9FB0A7">／</span></td>{cells}<td></td><td></td></tr>' for d in days)
    act_rows = "".join(f'<tr style="height:9.2mm"><td>{d}</td><td></td><td></td><td></td><td></td><td></td><td class="l"></td><td><span class="cb"></span></td></tr>' for d in days)
    pages = []
    for w in range(1, 6):
        inner = f'<div style="display:flex;justify-content:space-between;align-items:baseline"><h2>第{w}週</h2><span class="mini">期間 <span class="fieldline" style="min-width:24mm"></span>〜<span class="fieldline" style="min-width:24mm"></span></span></div>' \
                f'<h3>睡眠：寝床にいた時間帯を塗りつぶす</h3><table class="grid" style="table-layout:fixed"><thead><tr><th style="width:9mm">曜日</th>{hdr}<th style="width:9mm">目覚め</th><th style="width:9mm">昼寝<br>(分)</th></tr></thead><tbody>{sleep_rows}</tbody></table>' \
                f'<p class="mini" style="margin:1mm 0 3mm">18時〜翌12時。1目盛り30分。夜中に起き上がった時間は空けておきます。目覚め：◎すっきり ○ふつう △つらい</p>' \
                f'<h3>運動・活動：時間帯ごとの動き</h3><table class="grid"><thead><tr><th style="width:9mm">曜日</th><th>朝</th><th>昼</th><th>夕方</th><th>夜</th><th style="width:16mm">歩数</th><th style="width:44mm">運動の内容・時間</th><th style="width:15mm">ためす<br>こと</th></tr></thead><tbody>{act_rows}</tbody></table>' \
                f'<p class="mini" style="margin:1mm 0 3mm">時間帯ごとに ◎よく動いた ○ふつう ・ほとんど座っていた。朝＝起床〜昼食前、昼＝昼食〜15時ごろ、夕方＝15時ごろ〜夕食、夜＝夕食〜就寝</p>' \
                f'<div class="cols2"><div class="box"><span class="lbl">今週ためすこと</span><div class="ruled" style="height:20mm"></div></div><div class="box tint"><span class="lbl">今週の気づき</span><div class="ruled" style="height:20mm"></div></div></div>'
        pages.append(page(tool, inner, w, 5))
    return doc(pages)


# ---------------------------------------------------------------- 食生活
def make_food():
    tool = "食生活の記録シート"
    days = ["月", "火", "水", "木", "金", "土", "日"]
    meal_cells = '<td></td><td></td><td style="font-size:6.6pt;color:#5B635F">主<span class="cb" style="margin:0 .6mm 0 .3mm"></span>菜<span class="cb" style="margin:0 .6mm 0 .3mm"></span>副<span class="cb" style="margin:0 0 0 .3mm"></span></td>'
    rows = "".join(f'<tr style="height:15mm"><td>{d}<br><span style="font-size:6.4pt;color:#9FB0A7">／</span></td>{meal_cells*3}<td></td><td></td></tr>' for d in days)
    pages = []
    for w in range(1, 6):
        inner = f'<div style="display:flex;justify-content:space-between;align-items:baseline"><h2>第{w}週</h2><span class="mini">期間 <span class="fieldline" style="min-width:24mm"></span>〜<span class="fieldline" style="min-width:24mm"></span></span></div>' \
                f'<table class="grid"><thead><tr><th rowspan="2" style="width:9mm">曜日</th><th colspan="3">朝</th><th colspan="3">昼</th><th colspan="3">夕</th><th colspan="2">間食</th></tr><tr class="sub">' + '<th style="width:10mm">時刻</th><th style="width:10mm">場面</th><th>組み合わせ</th>' * 3 + '<th style="width:9mm">回数</th><th style="width:13mm">時間帯</th></tr></thead>' \
                f'<tbody>{rows}</tbody></table>' \
                f'<p class="mini" style="margin:1mm 0 3mm">時刻：食べ始めた時刻（食べなかったら「—」）。場面：家・外（外食）・持（持ち帰り・お弁当）・ながら（何かをしながら）。組み合わせ：主食・主菜・副菜に当たるものがあれば印（迷ったら「？」）。</p>' \
                f'<h3>今週の集計</h3><table class="grid"><thead><tr><th style="width:16mm"></th><th>3つそろった回数</th><th>副菜がなかった回数</th><th>「—」の回数</th><th>「ながら」の回数</th></tr></thead><tbody>' + "".join(f'<tr style="height:8mm"><td>{m}</td><td></td><td></td><td></td><td></td></tr>' for m in ["朝", "昼", "夕"]) + '</tbody></table>' \
                f'<div class="cols2" style="margin-top:3mm"><div class="box tint"><span class="lbl">今週の気づき</span><div class="ruled" style="height:15mm"></div></div><div class="box"><span class="lbl">翌週ためすこと（ひとつだけ）</span><div class="ruled" style="height:15mm"></div></div></div>'
        pages.append(page(tool, inner, w, 5))
    return doc(pages)


# ---------------------------------------------------------------- 月末振り返り・翌月目標・90日計画
def make_review():
    tool = "月末振り返りシート"
    facts = [("記録全体", "記録を書いた日数　　　　日 ／　　　日"), ("睡眠", "入床の幅　　：　〜　　：　　起床の幅　　：　〜　　：　　◎の日数　　日"), ("食生活", "「—」になった食事　　回　　3つそろった食事　　回　　「ながら」　　回"), ("運動・活動", "運動の印がついた日　　日　　平均的な歩数　　　　歩"), ("美容習慣", "✓　　日　　△　　日　　—　　日（朝・夜それぞれ）")]
    p1 = '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4mm"><div><h1 style="font-size:16pt">月末振り返りシート</h1><p class="mini" style="margin:1mm 0 0">事実 → 気づき → 次の一歩 の順に、各10分を目安に進めます。</p></div><p style="margin:0">対象期間 <span class="fieldline" style="min-width:24mm"></span>〜<span class="fieldline" style="min-width:24mm"></span></p></div>' \
         '<h2>段階1　事実（記録から数えられること）</h2><p class="mini">評価や感想は書きません。30日記録シートを10日ずつ見て数えます。</p><table class="line-table">' + "".join(f'<tr style="height:15mm"><th style="width:26mm">{k}</th><td style="color:#9FB0A7">{v}</td></tr>' for k, v in facts) + '</table>' \
         '<div class="box" style="margin-top:4mm"><span class="lbl">ひとことの列によく出てきた言葉</span><div class="ruled" style="height:24mm"></div></div>' \
         '<div class="box" style="margin-top:4mm"><span class="lbl">セルフチェックで前月から変わった項目</span><div class="ruled" style="height:24mm"></div></div>'
    p2 = '<h2>段階2　気づき（記録から言えること・3つまで）</h2><p class="mini">「〜だった」「〜が多かった」の形で。「〜のせいだ」と原因を決めつけない。</p>' + "".join(f'<div class="box" style="margin-bottom:3mm"><span class="lbl">気づき {i}</span><div class="ruled" style="height:17mm"></div></div>' for i in (1, 2, 3)) + \
         '<h2 style="margin-top:4mm">段階3　次の一歩（翌月に試すこと・1〜2つ）</h2><table class="grid"><thead><tr><th style="width:8mm"></th><th>試すこと（記録で確かめられる形で）</th><th style="width:44mm">確かめるシートと列</th></tr></thead><tbody>' + "".join(f'<tr style="height:16mm"><td>{i}</td><td></td><td></td></tr>' for i in (1, 2)) + '</tbody></table>' \
         '<h3 style="margin-top:5mm">書き終えたら確認</h3><p><span class="cb"></span>事実の欄に感想が混ざっていない　<span class="cb"></span>気づきの欄に原因の決めつけがない　<span class="cb"></span>次の一歩は記録の列で確かめられる</p>' \
         '<p class="mini">スタンダードプラン・90日継続プランの方は、このシートも記録提出フォームから一緒に提出してください。</p>'
    return doc([page(tool, p1, 1, 2), page(tool, p2, 2, 2)])


def make_goals():
    tool = "翌月の記録目標整理シート"
    goal = lambda n: f'<div class="box" style="margin-bottom:4mm"><span class="lbl">目標 {n}</span><p>型：<span class="cb"></span>回数型（週に○日以上）　<span class="cb"></span>時刻型（○時までに）　<span class="cb"></span>記録型（○○を毎日書く）</p><div class="ruled" style="height:16mm"></div><div class="cols2" style="margin-top:2mm"><p>確かめるシート・列：<span class="fieldline"></span></p><p>分野：<span class="fieldline"></span></p></div></div>'
    p = '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4mm"><div><h1 style="font-size:16pt">翌月の記録目標整理シート</h1><p class="mini" style="margin:1mm 0 0">振り返りレポートを読んだあとに記入します。目標は2つまで。</p></div><p style="margin:0">対象月 <span class="fieldline" style="min-width:30mm"></span></p></div>' \
        '<div class="box tint" style="margin-bottom:4mm"><span class="lbl">レポートの「次月に向けた振り返り項目」から選んだこと</span><div class="ruled" style="height:24mm"></div></div>' + goal(1) + goal(2) + \
        '<div class="cols2"><div class="box"><span class="lbl">月の中間に見直す日</span><div class="ruled" style="height:9mm"></div></div><div class="box"><span class="lbl">見直したときのメモ（修正したら日付も）</span><div class="ruled" style="height:9mm"></div></div></div>' \
        '<p class="mini" style="margin-top:3mm">言いかえの例：「よく眠る」→「目覚めを毎朝書き、◎の日の前夜の過ごし方を書き添える」／「野菜を食べる」→「朝食で副菜の印がつく日を週3日以上」</p>'
    return doc([page(tool, p, 1, 1)])


def make_plan90():
    tool = "90日 行動計画シート"
    per = lambda n, name, rng: f'<div class="box" style="margin-bottom:4mm"><div style="display:flex;justify-content:space-between"><span class="lbl">期間{n}　{name}</span><span class="mini">{rng}日目　<span class="fieldline" style="min-width:22mm"></span>〜<span class="fieldline" style="min-width:22mm"></span></span></div><table class="line-table"><tr style="height:13mm"><th style="width:24mm">重点</th><td></td></tr><tr style="height:9mm"><th>記録する列</th><td></td></tr><tr style="height:9mm"><th>確認日</th><td></td></tr><tr style="height:13mm"><th>続いたこと</th><td></td></tr><tr style="height:13mm"><th>途切れたこと</th><td></td></tr></table></div>'
    p1 = '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:4mm"><div><h1 style="font-size:16pt">90日 行動計画シート</h1><p class="mini" style="margin:1mm 0 0">期間2・期間3の欄は、前の期間が終わってから書き込みます。</p></div><p style="margin:0">開始日 <span class="fieldline" style="min-width:30mm"></span></p></div>' + per(1, "知る", "1〜30") + per(2, "試す", "31〜60")
    p2 = per(3, "定着させる", "61〜90") + '<h2 style="margin-top:4mm">90日を終えて</h2><div class="box tint"><span class="lbl">90日間で続いたこと・これからも続けたいこと</span><div class="ruled" style="height:40mm"></div></div><div class="box" style="margin-top:4mm"><span class="lbl">90日総括レポートを読んで決めた、今後の記録目標</span><div class="ruled" style="height:32mm"></div></div>'
    return doc([page(tool, p1, 1, 2), page(tool, p2, 2, 2)])


def make_guide():
    tool = "記録ツール利用ガイド"
    tl = [("1〜7日目", "30日記録シートの「就寝」「起床」「ひとこと」の3列だけを書く。7日目に、書けた日数と書く場所・時刻が合っていたかを確かめる。"),
          ("8〜14日目", "5日以上書けていれば、関心のある分野の列をひとつかふたつ増やす。睡眠・運動記録シート、食生活の記録シートは週1ページ。"),
          ("毎週末", "週のシートの「今週の気づき」を書く。会員限定記事の「読み解き方」を参考に、三文で要約しておく。"),
          ("月末", "セルフチェック → 月末振り返りシートの順に記入。スタンダード・90日プランの方は記録を提出。"),
          ("レポート受け取り後", "翌月の記録目標整理シートで、翌月の目標を2つまで決める。")]
    p1 = page(tool, cover("はじめに", "記録ツール利用ガイド", "SUGAR RUSHの記録ツールは、A4に印刷して手書きで使うシートです。このガイドでは、シートの役割、記号のルール、1か月の進め方、続かなくなったときの考え方をまとめています。") +
              '<h2>はじめる前のメモ</h2><div class="box tint"><table class="line-table"><tr style="height:12mm"><th style="width:40mm">書く場所</th><td class="mini">例：寝室のサイドテーブル、洗面所</td></tr><tr style="height:12mm"><th>書く時刻</th><td class="mini">例：寝る前、朝食のあと</td></tr><tr style="height:12mm"><th>最初の7日間に書く列</th><td>就寝・起床・ひとこと</td></tr><tr style="height:12mm"><th>7日目に見返す日</th><td></td></tr></table></div>'
              '<p class="mini" style="margin-top:3mm">書く場所は、書く時刻にいる場所と同じにするのがコツです。</p>', 1, 4, cover=True)
    from_site = [("記録ツール利用ガイド", "この冊子。最初に読む", "全プラン"), ("美容・生活習慣セルフチェック", "月1回。今の習慣を見渡す", "全プラン"), ("30日生活習慣記録シート", "毎日1行。記録の中心", "ベーシック・スタンダード"), ("90日生活習慣記録シート", "毎日1行。30日ごとの区切り付き", "90日継続"),
                 ("睡眠・運動記録シート", "週1ページ。眠った時間帯を塗る", "全プラン"), ("食生活の記録シート", "週1ページ。時刻・場面・組み合わせ", "全プラン"), ("月末振り返りシート", "月1回。事実・気づき・次の一歩", "全プラン"), ("翌月の記録目標整理シート", "レポートのあとに目標を決める", "スタンダード・90日継続"), ("90日 行動計画シート", "期間ごとの重点と確認日", "90日継続")]
    p2 = page(tool, '<h2>シートの一覧と役割</h2><table class="line-table"><thead><tr><th>シート</th><th>使い方</th><th>プラン</th></tr></thead><tbody>' + "".join(f'<tr><td>{a}</td><td>{b}</td><td class="mini">{c}</td></tr>' for a, b, c in from_site) + '</tbody></table>'
              '<h2 style="margin-top:6mm">記号のルール</h2><table class="line-table"><tbody><tr><th>目覚め</th><td>◎すっきり起きられた　○ふつう　△起きるのがつらかった（迷ったら ○）</td></tr><tr><th>ケア</th><td>✓ 基本手順をすべて行った　△ 一部を省いた　— 行わなかった</td></tr><tr><th>食事</th><td>時刻を書く。食べなかったら「—」</td></tr><tr><th>空欄と「—」</th><td>空欄は「書き忘れ」、「—」は「していない」。この2つを区別すると、記録の課題と生活の課題を分けて見られます。</td></tr></tbody></table>', 2, 4)
    p3 = page(tool, '<h2>1か月の進め方</h2><table class="line-table"><tbody>' + "".join(f'<tr><th style="width:32mm">{a}</th><td>{b}</td></tr>' for a, b in tl) + '</tbody></table>'
              '<h2 style="margin-top:6mm">記録の提出（スタンダード・90日継続プラン）</h2><ul class="d"><li>会員ページの「記録提出」から、記入したシートの写真（JPEG・PNG）またはPDFを添付して送信します（最大4ファイル・合計5MB）。</li><li>写真は明るい場所で、シート全体が写るように撮影してください。</li><li>各30日間の最終日から7日以内を目安に提出してください。</li><li>レポートは、制作後に会員ページの「個別レポート」に掲載されます。</li></ul>', 3, 4)
    p4 = page(tool, '<h2>続かなくなったときは</h2><ul class="d"><li>書けなかった日は、空欄のままで大丈夫です。理由をひとこと（外出・体調・忘れた）書いておくと、あとで役に立ちます。</li><li>忙しい日は「起床時刻」「目覚め」「ひとこと」の3つだけを書きます。</li><li>思い出して書くのは2〜3日前まで。それより前は空欄のままにします。</li><li>しばらく離れていたら、再開した日に「再開」と書いて続けます。</li></ul>'
              '<h2 style="margin-top:6mm">ご注意</h2><ul class="d"><li>記録には、病名・服薬・検査結果など医療に関する情報を書かないでください。</li><li>記録やレポートは、体の状態を判断するものではありません。体調に不安がある場合や、気になる状態が続く場合は医療機関にご相談ください。</li><li>持病のある方は、生活習慣を変える前に医師にご相談ください。</li><li>シートは会員ご本人の私的利用に限ります。複製・再配布はご遠慮ください。</li></ul>'
              '<div class="box tint" style="margin-top:8mm"><span class="lbl">お問い合わせ</span><p>合同会社シュガーラッシュ　お問い合わせフォーム（サイトの「お問い合わせ」）／ sugar5502@gmail.com</p></div>', 4, 4)
    return doc([p1, p2, p3, p4])


# ---------------------------------------------------------------- 架空サンプルデータ
def gen_days(start, n, rnd, shift=0, ex_rate=0.33, bal_boost=0.0, missing=()):
    """1行＝その日の朝の起床・目覚め、その日の夜の就寝。目覚めと朝食は前夜の就寝時刻とつながるように作る"""
    days = []
    d0 = dt.date.fromisoformat(start)
    prev_bed = 23 * 60 + 15
    fmt = lambda m: f"{(m // 60) % 24}:{m % 60:02d}"
    for i in range(n):
        d = d0 + dt.timedelta(days=i)
        wd = d.weekday()  # 0=月
        late_night = wd in (4, 5)  # 金・土の夜
        bed = 23 * 60 + 15 - shift + rnd.randint(-25, 30) + (65 if late_night else 0)
        if wd in (1, 3) and rnd.random() < 0.35: bed += 40
        if i + 1 in missing:
            days.append({"d": d.isoformat(), "recorded": False}); prev_bed = bed; continue
        wake = (7 * 60 + 40 if wd in (5, 6) else 6 * 60 + 30) + rnd.randint(-15, 20) - (shift // 3)
        feel = "◎" if prev_bed < 23 * 60 + 20 else ("△" if prev_bed > 24 * 60 + 5 and wd not in (5, 6) else "○")
        ex = (wd in (1, 3, 5) and rnd.random() < ex_rate * 2.2) or rnd.random() < 0.06
        steps = rnd.randint(4300, 7600) + (2600 if ex else 0)
        skip_bf = wd < 5 and prev_bed > 23 * 60 + 50 and rnd.random() < 0.7
        bb = 2 if rnd.random() < 0.3 + bal_boost else 1
        meals = {"b": not skip_bf, "l": True, "d": True}
        bal = {"b": bb if not skip_bf else None, "l": 3 if rnd.random() < 0.45 + bal_boost else 2, "d": 3 if rnd.random() < 0.75 + bal_boost / 2 else 2}
        days.append({"d": d.isoformat(), "recorded": True, "bed": fmt(bed), "wake": fmt(wake), "wakeFeel": feel,
                     "meals": meals, "balance": bal, "steps": steps, "exercise": ex,
                     "careAM": "✓" if rnd.random() < 0.9 else "△", "carePM": "△" if bed > 23 * 60 + 50 else ("✓" if rnd.random() < 0.92 else "—")})
        prev_bed = bed
    return days


def sample_monthly():
    rnd = random.Random(20260901)
    return {"type": "monthly", "sample": True, "title": "月間振り返りレポート", "round": "1",
            "memberName": "見本 さくら", "memberId": "SAMPLE-01", "plan": "スタンダードプラン",
            "periodStart": "2026-09-01", "periodEnd": "2026-09-30", "issued": "2026-10-09",
            "days": gen_days("2026-09-01", 30, rnd, missing=(15, 16, 17, 23)),
            "text": {
                "trend": ["記録した{{recorded}}日のうち、目覚めが◎だった日は{{wakeGood}}日でした。◎の日は、前夜に寝床に入った時刻が比較的早い日に多く記録されています。",
                          "起きた時刻は平日にそろっており、土曜・日曜は平日より1時間ほど遅くなる傾向が記録されています。寝床に入った時刻は、金曜・土曜の夜に遅くなっています。",
                          "朝食が「—」だった日は{{bfSkip}}回で、いずれも前夜に寝床に入った時刻が遅かった平日でした。",
                          "夜ケアを一部省いた（△）日は、寝床に入った時刻が遅かった日に重なって記録されています。"],
                "continued": ["睡眠の記録は、旅行中の3日間を含む4日間を除いて続けられています。",
                              "朝のスキンケアは{{careAM}}日で ✓ がつき、基本手順として続いている様子が記録から確認できます。",
                              "火曜・木曜・土曜を中心に、意識して運動した日の記録があります（計{{exDays}}日）。"],
                "nextItems": ["平日に寝床に入る時刻の目安を決め、30日記録シートの「就寝」の列で確かめる（時刻型）",
                              "朝食が「—」になった日の前夜について、過ごし方をひとことの列に書き添える（記録型）",
                              "夜ケアが △ の日に省いた手順を書き留め、基本手順の順番や置き場所を見直すか検討する"],
                "summary": "1回目の今月は、生活を大きく変えずに記録を続ける期間でした。{{recorded}}日分の記録から、寝床に入る時刻と目覚めの感覚、朝食や夜のケアとのつながりが見えてきています。翌月は、平日の就寝時刻をひとつの目安として記録してみることが候補になります。どの項目に取り組むかは、翌月の記録目標整理シートでご自身で決めてください。"}}


def sample_90():
    rnd = random.Random(20260701)
    m1 = gen_days("2026-07-01", 30, rnd, shift=0, ex_rate=0.25, missing=(9, 21, 22))
    m2 = gen_days("2026-07-31", 30, rnd, shift=25, ex_rate=0.33, bal_boost=0.08, missing=(13, 14, 15, 16))
    m3 = gen_days("2026-08-30", 30, rnd, shift=35, ex_rate=0.4, bal_boost=0.12, missing=(28,))
    return {"type": "total90", "sample": True, "title": "90日総括レポート", "memberName": "見本 さくら", "memberId": "SAMPLE-02", "plan": "90日継続プラン",
            "periodStart": "2026-07-01", "periodEnd": "2026-09-28", "issued": "2026-10-09",
            "months": [{"label": "1か月目", "periodStart": "2026-07-01", "periodEnd": "2026-07-30", "days": m1, "reportNote": "期間1「知る」"},
                       {"label": "2か月目", "periodStart": "2026-07-31", "periodEnd": "2026-08-29", "days": m2, "reportNote": "期間2「試す」：平日の入床時刻の目安を記録"},
                       {"label": "3か月目", "periodStart": "2026-08-30", "periodEnd": "2026-09-28", "days": m3, "reportNote": "期間3「定着させる」"}],
            "text": {
                "overview": "90日間のうち{{recorded}}日に記録がありました。記録がなかったのは、お盆の帰省中の4日間を含む8日間です。1か月目は生活を変えずに記録し、2か月目からは「平日は24時までに寝床に入る」ことを試す項目として記録しています。",
                "continued": ["朝のスキンケアの記録は、90日を通して高い割合で ✓ がついています。",
                              "2か月目に試した「平日は24時までに寝床に入る」は、3か月目も同じ列で記録が続いています。",
                              "意識して運動した日の記録は、火曜・木曜・土曜を中心に続いています。"],
                "trends": ["寝床に入った時刻の平均は、記録上、1か月目から3か月目にかけて少しずつ早くなっています。",
                           "目覚めが◎の日は、寝床に入った時刻が早い日に多く記録される傾向が、3か月を通して見られます。",
                           "記録がなかった日は、帰省や予定の多い時期に集中していました。"],
                "goals": ["平日の入床時刻の記録を、引き続き30日記録シートで続ける（時刻型）",
                          "週末の起床時刻を記録し、平日との差を月に1回見返す（記録型）",
                          "意識して運動した日に印をつける記録を、週3日を目安に続ける（回数型）"],
                "summary": "90日間、記録を続けてこられました。1か月目に見えた「寝床に入る時刻と目覚めの感覚」の関係をもとに、2か月目から平日の入床時刻を試す項目として記録し、3か月目もその記録が続いています。ここに整理したのは記録から数えられる事実であり、今後どの項目を続けるかはご自身で選んでください。記録の形式は、これからも同じシートで続けられます。"}}


# ---------------------------------------------------------------- 実行
def html_to_pdf(ctx, html, out):
    pg = ctx.new_page()
    pg.set_content(html, wait_until="load")
    pg.pdf(path=str(out), format="A4", print_background=True, prefer_css_page_size=True)
    pg.close()


def shot(ctx, html_or_url, index, out, *, is_url=False, prep=None):
    pg = ctx.new_page(); pg.set_viewport_size({"width": 1000, "height": 1200})
    if is_url: pg.goto(html_or_url)
    else: pg.set_content(html_or_url, wait_until="load")
    if prep: prep(pg)
    pg.add_style_tag(content=".page{margin:0 !important}.panel{display:none !important}body{background:#fff !important}")
    pg.locator(".page").nth(index).screenshot(path=str(out))
    pg.close()


def main():
    sheets = {"guide.pdf": make_guide(), "self-check.pdf": make_check(), "record-30days.pdf": make_30(), "record-90days.pdf": make_90(),
              "sleep-exercise.pdf": make_sleep(), "food.pdf": make_food(), "monthly-review.pdf": make_review(),
              "next-month-goals.pdf": make_goals(), "action-plan-90.pdf": make_plan90()}
    mdata, tdata = sample_monthly(), sample_90()
    (RM / "sample-monthly.json").write_text(json.dumps(mdata, ensure_ascii=False, indent=1), encoding="utf-8")
    (RM / "sample-90days.json").write_text(json.dumps(tdata, ensure_ascii=False, indent=1), encoding="utf-8")
    (IMG / "logo.svg").write_text(LOGO_SVG, encoding="utf-8")
    (IMG / "favicon.svg").write_text(FAVICON_SVG, encoding="utf-8")

    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context()
        for name, html in sheets.items():
            html_to_pdf(ctx, html, PROT / name)
            print("tool", name)
        # 公開用の見本（sample-record-30days.pdf / sample-self-check.pdf / sample-monthly-report.pdf と
        # そのプレビュー画像）は、お客様ご提供のデザインを使用しているため、ここでは生成しません。

        url = (RM / "report.html").as_uri()
        for data, pdf, pngs in [(tdata, "sample-90day-report.pdf", [(0, "sample-report-90-p1.png")])]:
            pg = ctx.new_page(); pg.goto(url); pg.evaluate("d => renderReport(d)", data)
            pg.pdf(path=str(SAMPLES / pdf), format="A4", print_background=True, prefer_css_page_size=True); pg.close()
            for idx, png in pngs:
                shot(ctx, url, idx, IMG / png, is_url=True, prep=lambda pg, d=data: pg.evaluate("d => renderReport(d)", d))
            print("report", pdf)

        # ファビコン PNG
        for size, name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png")]:
            pg = ctx.new_page(); pg.set_viewport_size({"width": size, "height": size})
            pg.set_content(f'<html><body style="margin:0">{FAVICON_SVG.replace("<svg ", f"<svg width={size} height={size} ")}</body></html>')
            pg.screenshot(path=str(IMG / name), omit_background=True); pg.close()
        # OGP
        og = f'''<html><body style="margin:0"><div style="width:1200px;height:630px;background:#FAF8F3;position:relative;overflow:hidden;font-family:'Noto Serif CJK JP',serif;color:#333B37">
<svg viewBox="0 0 560 300" style="position:absolute;right:-40px;top:40px;width:760px" fill="none"><path d="M10 260C120 250 150 140 260 130S420 60 550 20" stroke="#48675D" stroke-opacity=".5" stroke-width="1.2"/><path d="M40 290C170 270 210 190 300 180S470 120 560 90" stroke="#48675D" stroke-opacity=".25"/>{"".join(f'<circle cx="{10+540*t:.0f}" cy="{260-240*t**0.9:.0f}" r="{3.4 if i==6 else 2.2}" fill="{"#B88783" if i==6 else "#48675D"}" fill-opacity="{0.9 if i==6 else 0.5}"/>' for i,t in enumerate([0.12,0.24,0.36,0.48,0.6,0.72,0.84]))}</svg>
<div style="position:absolute;left:90px;top:90px;display:flex;align-items:center;gap:18px">{LOGO_SVG.replace("<svg ", "<svg width=72 height=72 ")}<div><div style="font-family:Lora,serif;font-size:34px;letter-spacing:.16em">SUGAR RUSH</div><div style="font-family:'Noto Sans CJK JP';font-size:16px;letter-spacing:.14em;color:#5B635F">合同会社シュガーラッシュ</div></div></div>
<div style="position:absolute;left:90px;top:270px;font-size:52px;line-height:1.6;letter-spacing:.08em;font-weight:500">毎日の小さな記録が、<br><span style="padding-left:1.4em">これからの自分をつくる。</span></div>
<div style="position:absolute;left:90px;bottom:60px;font-family:'Noto Sans CJK JP';font-size:20px;color:#48675D;letter-spacing:.1em">美容・健康・生活習慣の記録と振り返り</div></div></body></html>'''
        pg = ctx.new_page(); pg.set_viewport_size({"width": 1200, "height": 630}); pg.set_content(og); pg.screenshot(path=str(IMG / "ogp.png")); pg.close()
        b.close()
    print("done")


if __name__ == "__main__":
    main()
