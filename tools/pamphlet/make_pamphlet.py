"""
合同会社シュガーラッシュ 会社案内パンフレット（A4横・巻き三つ折り）生成スクリプト

  python3 tools/pamphlet/make_pamphlet.py            # src/content/site.mjs の url をQRコードに使用
  python3 tools/pamphlet/make_pamphlet.py --url https://example.com

出力（tools/pamphlet/out/）
  pamphlet_print.pdf    入稿用：303×216mm（仕上がり297×210mm＋塗り足し各3mm）、2ページ（表面・中面）
  pamphlet_preview.pdf  確認用：仕上がりサイズ、折り位置の点線入り
  preview_outside.png / preview_inside.png

折り（巻き三つ折り）：表面 左から 97mm（内側に折り込む面）｜100mm（裏表紙）｜100mm（表紙）
                     中面 左から 100mm｜100mm｜97mm
必要なもの：Python 3、segno、playwright（Chromium）、Noto Sans/Serif CJK JP フォント
"""
import argparse, base64, re
from pathlib import Path
import segno
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)

ap = argparse.ArgumentParser()
ap.add_argument("--url")
args = ap.parse_args()
site_src = (ROOT / "src/content/site.mjs").read_text(encoding="utf-8")
URL = args.url or re.search(r'url:\s*"([^"]+)"', site_src).group(1)

def data_uri(p, mime="image/jpeg"):
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()

IMG_TEA = data_uri(HERE / "images/tea-sea.jpg")
IMG_FLOW = data_uri(HERE / "images/flow-report.jpg")
IMG_REPORT = data_uri(ROOT / "src/static/img/sample-report-monthly-p1.png", "image/png")

qr = segno.make(URL, error="m")
QR_SVG = qr.svg_inline(scale=1, border=0, dark="#2F3E39", omitsize=True)
QR_SVG = QR_SVG.replace("<svg ", '<svg width="100%" height="100%" ', 1)

LOGO = '<svg viewBox="0 0 48 48" width="100%" height="100%"><circle cx="24" cy="24" r="22.5" fill="none" stroke="#D9C8AD" stroke-width="1"/><path d="M33.5 13.5c-3.6-4.4-15.4-4.6-16.6 2.4-1.3 7.6 17.3 7.4 16.4 15.6-.8 7.2-13.7 8.3-18.8 3" fill="none" stroke="#48675D" stroke-width="2.6" stroke-linecap="round"/><circle cx="14.5" cy="34.5" r="1.6" fill="#48675D"/><circle cx="11.6" cy="31.4" r="1.15" fill="#48675D" opacity=".7"/><circle cx="9.9" cy="27.8" r=".8" fill="#48675D" opacity=".45"/><circle cx="33.5" cy="13.5" r="2.4" fill="#B88783"/></svg>'

B = 3  # 塗り足し
def X(v): return v + B
def Y(v): return v + B

def thread_svg(w, h, pts, color="#48675D", end_rose=True, dots=True, op=0.55):
    """mm 座標の点列を通る曲線と記録の点"""
    d = f"M{pts[0][0]} {pts[0][1]}"
    for i in range(1, len(pts)):
        x0, y0 = pts[i - 1]; x1, y1 = pts[i]; cx = (x0 + x1) / 2
        d += f" C{cx} {y0} {cx} {y1} {x1} {y1}"
    circles = ""
    if dots:
        for i, (x, y) in enumerate(pts):
            last = i == len(pts) - 1
            circles += f'<circle cx="{x}" cy="{y}" r="{1.5 if last and end_rose else .9}" fill="{"#B88783" if last and end_rose else color}" fill-opacity="{1 if last else op}"/>'
    return f'<svg class="abs" style="left:0;top:0;width:{w}mm;height:{h}mm" viewBox="0 0 {w} {h}" fill="none"><path d="{d}" stroke="{color}" stroke-opacity="{op}" stroke-width=".35"/>{circles}</svg>'

CSS = """
@page { margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Noto Sans CJK JP", sans-serif; color: #333B37; background: #DDD; }
.sheet { position: relative; width: 303mm; height: 216mm; overflow: hidden; background: #FAF8F3; page-break-after: always; break-after: page; }
.sheet:last-child { page-break-after: auto; }
.abs { position: absolute; }
.mincho, h1, h2, h3 { font-family: "Noto Serif CJK JP", serif; font-weight: 600; letter-spacing: .06em; }
.latin { font-family: "Lora", serif; font-style: italic; color: #8E5F5B; letter-spacing: .03em; }
p, li, dd, dt, td, th { font-size: 7.6pt; line-height: 1.75; }
.lbl { font-family: "Lora", serif; font-style: italic; font-size: 9pt; color: #8E5F5B; display: block; margin-bottom: 1mm; }
.h2 { font-family: "Noto Serif CJK JP", serif; font-size: 12pt; font-weight: 600; letter-spacing: .08em; line-height: 1.5; }
.soft { color: #5B635F; }
.photo { position: absolute; overflow: hidden; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rule { border-top: .25mm solid #C9D1CB; }
.num { font-family: "Lora", serif; color: #48675D; font-size: 15pt; line-height: 1; }
.tag { display: inline-block; font-size: 6.2pt; padding: .1mm 1.6mm; border-radius: 3mm; vertical-align: .2mm; letter-spacing: .04em; }
.tag.c { border: .2mm solid #9FB0A7; color: #5B635F; }
.tag.s { background: #48675D; color: #fff; }
.tag.r { background: #B88783; color: #fff; }
/* preview */
.pv-wrap { position: relative; width: 297mm; height: 210mm; overflow: hidden; page-break-after: always; break-after: page; }
.pv-wrap .sheet { position: absolute; left: -3mm; top: -3mm; }
.fold { position: absolute; top: 0; bottom: 0; border-left: .3mm dashed #B88783; z-index: 50; }
.fold span { position: absolute; top: 2mm; left: 1mm; font-size: 6pt; color: #B88783; background: rgba(255,255,255,.8); padding: 0 1mm; white-space: nowrap; }
"""

# ------------------------------------------------------------------ 表面（外側）
# 左：折り込み面 0–97 / 中央：裏表紙 97–197 / 右：表紙 197–297
outside = f"""
<section class="sheet">
  <!-- 3面を横断する写真の帯 -->
  <div class="photo" style="left:0;top:0;width:303mm;height:{Y(86)}mm"><img src="{IMG_TEA}" style="object-position:50% 62%"></div>
  <div class="abs" style="left:0;top:{Y(70)}mm;width:303mm;height:19mm;background:linear-gradient(to bottom, rgba(250,248,243,0), #FAF8F3)"></div>
  <!-- 3面を横断する記録の線 -->
  <div class="abs" style="left:0;top:{Y(84)}mm;width:303mm;height:14mm">{thread_svg(303, 14, [(0,11),(30,9.5),(64,10.5),(100,7),(140,8.5),(176,5.5),(214,6.8),(250,3.6),(270,4.2)])}</div>

  <!-- 折り込み面：ABOUT / STRENGTH -->
  <div class="abs" style="left:{X(9)}mm;top:{Y(100)}mm;width:80mm">
    <span class="lbl">About us</span>
    <h2 class="h2">自分の毎日を知ることから、<br>美容と健康を。</h2>
    <p style="margin-top:2.6mm">合同会社シュガーラッシュは、一般の個人のお客様に向けて、美容・健康・生活習慣に関するWebコンテンツを企画・制作・販売しています。会員専用サイトで記事と記録ツールを提供し、お客様の記録を整理した振り返りレポートを制作・納品します。</p>
    <div class="rule" style="margin:4mm 0 3mm"></div>
    <span class="lbl">Strength｜選ばれる理由</span>
    <div style="display:grid;grid-template-columns:8mm 1fr;row-gap:2.6mm;margin-top:1.4mm">
      <span class="num">1</span><div><p class="mincho" style="font-size:8.6pt;font-weight:600">読む・記録する・振り返るが、ひとつの流れに</p><p class="soft">記事で考え方を知り、シートで毎日を記録し、月末にレポートで見渡す。情報提供だけで終わらない設計です。</p></div>
      <span class="num">2</span><div><p class="mincho" style="font-size:8.6pt;font-weight:600">記録ツールと個別レポートを自社で制作</p><p class="soft">A4で印刷できる記録シート9種類と、記録を集計・グラフ化した個別レポートを、会員ごとに制作します。</p></div>
      <span class="num">3</span><div><p class="mincho" style="font-size:8.6pt;font-weight:600">期間固定・前払いの分かりやすい料金</p><p class="soft">30日・90日の期間制で自動更新はありません。申込受付・入金確認・会員権限付与を区別して管理しています。</p></div>
    </div>
  </div>

  <!-- 裏表紙：COMPANY + QR -->
  <div class="abs" style="left:{X(104)}mm;top:{Y(100)}mm;width:86mm">
    <span class="lbl">Company｜会社概要</span>
    <table style="border-collapse:collapse;width:100%;margin-top:1mm">
      {"".join(f'<tr><th style="text-align:left;font-weight:700;white-space:nowrap;padding:.6mm 3mm .6mm 0;vertical-align:top;border-bottom:.2mm solid #D8DED8">{k}</th><td style="padding:.6mm 0;border-bottom:.2mm solid #D8DED8">{v}</td></tr>' for k, v in [
        ("会社名", "合同会社シュガーラッシュ"), ("英語表記", "SUGAR RUSH"), ("代表者", "代表社員　青木 さとみ"),
        ("所在地", "〒343-0816<br>埼玉県越谷市弥生町1-7 エヌステージ101"), ("設立", "2025年6月11日"), ("資本金", "430万円"),
        ("事業内容", "Webコンテンツの企画・制作・販売（美容・健康・生活習慣分野）、会員専用サイトの運営"),
        ("電話", "050-6861-4745"), ("メール", "sugar5502@gmail.com")])}
    </table>
    <div style="display:flex;gap:4mm;align-items:center;margin-top:4.5mm">
      <div style="background:#fff;padding:2.6mm;border-radius:1mm;width:27mm;height:27mm;flex:none">{QR_SVG}</div>
      <div><p class="latin" style="font-size:9pt;letter-spacing:.12em">Official website</p><p class="mincho" style="font-size:9pt">Webサイトはこちら</p><p class="soft" style="font-size:6.6pt;word-break:break-all">{URL}</p><p class="soft" style="font-size:6.4pt;margin-top:1mm">料金・サービス内容・特定商取引法に基づく表記を掲載しています。</p></div>
    </div>
  </div>

  <!-- 表紙 -->
  <div class="abs" style="left:{X(207)}mm;top:{Y(102)}mm;width:82mm">
    <div style="display:flex;align-items:center;gap:2.4mm"><div style="width:11mm;height:11mm">{LOGO}</div><div><div style="font-family:Lora,serif;font-size:13pt;letter-spacing:.18em">SUGAR RUSH</div><div style="font-size:6.4pt;letter-spacing:.16em" class="soft">合同会社シュガーラッシュ</div></div></div>
    <h1 class="mincho" style="font-size:16.5pt;font-weight:500;line-height:1.75;letter-spacing:.08em;margin-top:9mm">毎日の小さな記録が、<br><span style="padding-left:1em">これからの自分をつくる。</span></h1>
    <p style="margin-top:4mm;font-size:8pt" class="soft">美容・健康・生活習慣の<br>記事・記録ツール・振り返りレポート</p>
    <p class="latin" style="margin-top:9mm;font-size:10pt;letter-spacing:.14em">Company profile</p>
  </div>
  <div class="abs" style="left:{X(207)}mm;top:{Y(200)}mm;width:82mm"><p class="soft" style="font-size:6pt">掲載している写真はイメージです。</p></div>
</section>
"""

# ------------------------------------------------------------------ 中面（内側）
# 左 0–100 / 中央 100–200 / 右 200–297
flow_steps = [
    ("お問い合わせフォームからお申込み", "お客様", "申込受付"),
    ("受付のご連絡・お振込先のご案内", "当社", ""),
    ("プラン料金のお振込み（前払い）", "お客様", ""),
    ("入金を確認し、会員ID・パスワードを発行", "当社", "入金確認 → 会員権限付与"),
    ("会員サイトで記事を読み、記録シートで記録", "お客様", ""),
    ("記録シートの写真・PDFを提出", "お客様", ""),
    ("記録を集計・整理し、レポートを制作", "当社", ""),
    ("会員サイトでレポートを納品", "当社", ""),
]
flow_html = "".join(
    f'<li style="position:relative;padding:0 0 3.1mm 9mm"><span class="abs" style="left:0;top:.2mm;width:5.6mm;height:5.6mm;border-radius:50%;border:.25mm solid #48675D;background:#FAF8F3;display:flex;align-items:center;justify-content:center;font-family:Lora,serif;font-size:7.6pt;color:#48675D">{i+1}</span>'
    f'<p style="font-weight:700;font-size:7.8pt;line-height:1.5">{t}</p><p><span class="tag c">{who}</span>{f" <span class=\'tag s\'>{st}</span>" if st else ""}</p></li>'
    for i, (t, who, st) in enumerate(flow_steps))

plans = [("ベーシック", "3,300", "30日間", "会員限定記事・セルフチェック・30日記録シート・利用ガイド"),
         ("スタンダード", "9,800", "30日間", "ベーシックの内容＋記録の集計・整理、個別月間レポート1回、翌月の目標整理シート"),
         ("90日継続", "27,800", "90日間", "会員限定記事・90日記録シート、月間レポート3回＋90日総括レポート、行動計画シート")]
plans_html = "".join(
    f'<div style="display:grid;grid-template-columns:27mm 1fr;gap:0 3mm;padding:1.6mm 0;border-bottom:.2mm solid #C9D1CB">'
    f'<div><p class="mincho" style="font-weight:600;font-size:8pt;line-height:1.4">{n}</p><p style="font-family:Lora,serif;color:#48675D;font-size:13pt;line-height:1.2">{p}<span style="font-family:Noto Sans CJK JP;font-size:5.8pt;color:#5B635F;white-space:nowrap"> 円（税込）</span></p><p style="font-size:6.4pt;white-space:nowrap" class="soft">{d}・期間固定</p></div>'
    f'<p class="soft" style="font-size:7pt;line-height:1.65">{c}</p></div>' for n, p, d, c in plans)

inside = f"""
<section class="sheet">
  <!-- 左・中央を横断する写真 -->
  <div class="photo" style="left:0;top:0;width:{X(200)}mm;height:{Y(72)}mm"><img src="{IMG_FLOW}" style="object-position:50% 55%"></div>
  <!-- 背景の英字（折り目を横断） -->
  <p class="abs latin" style="left:{X(4)}mm;top:{Y(178)}mm;font-size:40pt;color:rgba(72,103,93,.07);white-space:nowrap;letter-spacing:.02em">Record, reflect, continue.</p>
  <!-- 3面を横断する記録の線 -->
  <div class="abs" style="left:0;top:{Y(73)}mm;width:303mm;height:12mm">{thread_svg(303, 12, [(0,8),(22,8.6),(50,6.2),(90,7.4),(128,4.6),(166,5.8),(194,3.4)])}</div>

  <!-- 右面上部：見出し -->
  <div class="abs" style="left:{X(207)}mm;top:{Y(12)}mm;width:84mm">
    <span class="lbl">Business flow｜取引の流れ</span>
    <h2 class="h2">お申込みから<br>レポート納品まで</h2>
    <p class="soft" style="margin-top:2mm">申込受付・入金確認・会員権限付与を、それぞれ別の段階として管理しています。</p>
  </div>
  <ol class="abs" style="list-style:none;left:{X(207)}mm;top:{Y(52)}mm;width:83mm">{flow_html}</ol>
  <div class="abs" style="left:{X(207)}mm;top:{Y(150)}mm;width:83mm;border-top:.25mm solid #C9D1CB;padding-top:2.4mm">
    <span class="lbl" style="font-size:8pt">Policy｜大切にしていること</span>
    <p class="soft" style="font-size:7pt">根拠のない効果をうたわないこと。医療の領域に立ち入らないこと。お預かりする記録を会員ごとに分けて、ていねいに扱うこと。</p>
    <span class="lbl" style="font-size:8pt;margin-top:2.6mm">Activity｜事業の状況</span>
    <p class="soft" style="font-size:7pt">2026年8月より、美容・健康分野のWebコンテンツの提供を本格的に開始しました。</p>
  </div>

  <!-- 左面：WHO / WHAT -->
  <div class="abs" style="left:{X(9)}mm;top:{Y(86)}mm;width:83mm">
    <span class="lbl">Who｜お客様</span>
    <p class="mincho" style="font-size:9.6pt;font-weight:600;line-height:1.55">40〜60代の女性を中心とした、<br>一般の個人のお客様</p>
    <p class="soft" style="margin-top:1mm">美容や生活習慣を見直したい方、食事・睡眠・運動を記録して自分の傾向を知りたい方、記録をまとめる時間がなく整理されたレポートを受け取りたい方。</p>
    <span class="lbl" style="margin-top:4mm">What｜提供しているもの</span>
    <div style="display:grid;grid-template-columns:8mm 1fr;row-gap:2.4mm">
      <span class="num">1</span><div><p class="mincho" style="font-size:8.6pt;font-weight:600">会員限定記事</p><p class="soft">美容・体型管理・食生活・睡眠・運動など8テーマ・40本。どなたでも読める公開記事12本も掲載。</p></div>
      <span class="num">2</span><div><p class="mincho" style="font-size:8.6pt;font-weight:600">記録ツール（PDF・A4）</p><p class="soft">30日・90日の生活習慣記録シート、睡眠・運動、食生活、セルフチェック、月末振り返りなど9種類。</p></div>
      <span class="num">3</span><div><p class="mincho" style="font-size:8.6pt;font-weight:600">個別振り返りレポート（PDF・A4）</p><p class="soft">提出された記録を集計・整理し、グラフと文章でまとめる月間レポートと90日総括レポート。</p></div>
    </div>
  </div>

  <!-- 中央面：HOW / REVENUE -->
  <div class="abs" style="left:{X(108)}mm;top:{Y(86)}mm;width:84mm">
    <span class="lbl">How｜提供方法</span>
    <p>すべてオンラインで完結します。会員専用サイト（会員ID・パスワードでご本人のみ閲覧）で記事を読み、記録シートをダウンロード。ご自宅で記録し、写真やPDFで提出していただいた記録をもとに、当社がレポートを制作して会員サイトに掲載します。郵送物はありません。</p>
    <span class="lbl" style="margin-top:3.6mm">Revenue｜料金と売上の仕組み</span>
    <p>売上は、会員サービスの<b>プラン利用料</b>です。期間固定・自動更新なし、銀行振込による前払いで、入金確認後にご利用いただけます。</p>
    <div style="margin-top:1.4mm;border-top:.25mm solid #333B37">{plans_html}</div>
  </div>
  <!-- 中央面：レポート見本 -->
  <div class="abs" style="left:{X(160)}mm;top:{Y(36)}mm;width:30mm;height:42.4mm;background:#fff;box-shadow:0 1.2mm 3mm rgba(51,59,55,.25);transform:rotate(3deg);padding:.8mm"><img src="{IMG_REPORT}" style="width:100%;height:100%;object-fit:cover;border:.15mm solid #D8DED8"></div>
  <p class="abs" style="left:{X(156)}mm;top:{Y(30.5)}mm"><span class="tag r">レポート見本（架空サンプル）</span></p>

  <p class="abs soft" style="left:{X(9)}mm;top:{Y(193)}mm;width:83mm;font-size:6.2pt;line-height:1.6">当社のサービスは記録の整理と情報提供を目的としており、医療行為・診断・治療・個別の医療／栄養指導は行いません。効果を保証するものではありません。</p>
</section>
"""

def page_html(body):
    return f'<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>'

folds_out = '<div class="fold" style="left:97mm"><span>折り 97mm</span></div><div class="fold" style="left:197mm"><span>折り 197mm（表紙｜裏表紙）</span></div>'
folds_in = '<div class="fold" style="left:100mm"><span>折り 100mm</span></div><div class="fold" style="left:200mm"><span>折り 200mm</span></div>'
print_html = page_html(outside + inside)
preview_html = page_html(f'<div class="pv-wrap">{outside}{folds_out}</div><div class="pv-wrap">{inside}{folds_in}</div>')

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.set_content(print_html, wait_until="load")
    pg.pdf(path=str(OUT / "pamphlet_print.pdf"), width="303mm", height="216mm", print_background=True)
    pg.set_content(preview_html, wait_until="load")
    pg.pdf(path=str(OUT / "pamphlet_preview.pdf"), width="297mm", height="210mm", print_background=True)
    pg.set_viewport_size({"width": 1123, "height": 794})
    for i, name in enumerate(["outside", "inside"]):
        pg.locator(".pv-wrap").nth(i).screenshot(path=str(OUT / f"preview_{name}.png"))
    b.close()
# Chromium は mm を px に丸めるため、ページサイズを正確な値に合わせる（下端・右端の塗り足しを0.4mm以内で調整）
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject
for name, (W, H) in {"pamphlet_print.pdf": (303, 216), "pamphlet_preview.pdf": (297, 210)}.items():
    r = PdfReader(OUT / name); wr = PdfWriter()
    for pg in r.pages:
        top = float(pg.mediabox.top); box = RectangleObject([0, top - H * 72 / 25.4, W * 72 / 25.4, top])
        pg.mediabox = box; pg.cropbox = box; pg.trimbox = box
        wr.add_page(pg)
    wr.write(OUT / name)
print("QR:", URL)
print("done")
