// オリジナルのロゴ・アイコン（SVG）
export const logoMark = (title = "SUGAR RUSH") => `<svg viewBox="0 0 48 48" role="img" aria-label="${title}"><circle cx="24" cy="24" r="22.5" fill="none" stroke="#D9C8AD" stroke-width="1"/><path d="M33.5 13.5c-3.6-4.4-15.4-4.6-16.6 2.4-1.3 7.6 17.3 7.4 16.4 15.6-.8 7.2-13.7 8.3-18.8 3" fill="none" stroke="#48675D" stroke-width="2.6" stroke-linecap="round"/><circle cx="14.5" cy="34.5" r="1.6" fill="#48675D"/><circle cx="11.6" cy="31.4" r="1.15" fill="#48675D" opacity=".7"/><circle cx="9.9" cy="27.8" r=".8" fill="#48675D" opacity=".45"/><circle cx="33.5" cy="13.5" r="2.4" fill="#B88783"/></svg>`;

const wrap = (inner, label) => `<svg viewBox="0 0 96 96" role="img" aria-label="${label}" fill="none" stroke="#48675D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const icons = {
  notice: (l = "気づく") => wrap(`<circle cx="48" cy="48" r="34" stroke="#D9C8AD"/><path d="M26 50c8-12 36-12 44 0-8 12-36 12-44 0z"/><circle cx="48" cy="50" r="6"/><circle cx="66" cy="28" r="3" fill="#B88783" stroke="none"/>`, l),
  record: (l = "記録する") => wrap(`<rect x="26" y="18" width="44" height="60" rx="3"/><path d="M34 32h28M34 42h28M34 52h18"/><path d="M34 64l5 5 9-10" stroke="#B88783"/><circle cx="62" cy="64" r="2" fill="#48675D" stroke="none"/>`, l),
  organize: (l = "整理する") => wrap(`<path d="M22 74h52"/><rect x="28" y="52" width="8" height="22" rx="1.5"/><rect x="44" y="40" width="8" height="34" rx="1.5"/><rect x="60" y="30" width="8" height="44" rx="1.5" stroke="#B88783"/><path d="M24 40c10-6 22-14 46-20" stroke="#D9C8AD"/>`, l),
  reflect: (l = "振り返る") => wrap(`<path d="M70 48a22 22 0 1 1-8-17"/><path d="M63 22v10h-10"/><circle cx="48" cy="48" r="3" fill="#B88783" stroke="none"/><path d="M48 36v12l8 6"/>`, l),
  continue: (l = "続ける") => wrap(`<path d="M18 66c14-2 18-26 30-26s16 18 30-6" /><circle cx="18" cy="66" r="2.5" fill="#48675D" stroke="none"/><circle cx="33" cy="56" r="2.5" fill="#48675D" stroke="none"/><circle cx="48" cy="40" r="2.5" fill="#48675D" stroke="none"/><circle cx="63" cy="46" r="2.5" fill="#48675D" stroke="none"/><circle cx="78" cy="34" r="3.5" fill="#B88783" stroke="none"/>`, l),
  article: (l = "記事") => wrap(`<path d="M20 24h24a6 6 0 0 1 6 6v46a5 5 0 0 0-5-5H20z"/><path d="M76 24H56a6 6 0 0 0-6 6v46a5 5 0 0 1 5-5h21z"/><path d="M27 36h14M27 45h14M57 36h12M57 45h12" stroke="#D9C8AD"/>`, l),
  report: (l = "レポート") => wrap(`<rect x="24" y="16" width="48" height="64" rx="3"/><path d="M32 30h20" /><path d="M32 62l9-10 8 6 14-16" stroke="#B88783"/><path d="M32 70h32" stroke="#D9C8AD"/>`, l),
  sheet: (l = "記録シート") => wrap(`<rect x="22" y="14" width="52" height="68" rx="3"/><path d="M22 28h52M22 40h52M22 52h52M22 64h52M38 14v68" stroke="#D9C8AD"/><path d="M28 34l3 3 4-5M28 46l3 3 4-5" stroke="#B88783"/><path d="M44 34h22M44 46h16M44 58h20"/>`, l),
};

// 曲線（ページ見出しや帯の装飾）
export const thread = (stroke = "#48675D", op = 0.5) => `<svg class="thread" viewBox="0 0 560 300" aria-hidden="true" fill="none"><path d="M10 260C120 250 150 140 260 130S420 60 550 20" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1.1"/><path d="M40 290C170 270 210 190 300 180S470 120 560 90" stroke="${stroke}" stroke-opacity="${op * 0.5}" stroke-width=".8"/>${[0.12,0.24,0.36,0.48,0.6,0.72,0.84].map((t,i)=>{const x=10+540*t;const y=260-240*Math.pow(t,0.9)+ (i%2?6:-4);return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${i===6?3.4:2.2}" fill="${i===6?"#B88783":stroke}" fill-opacity="${i===6?0.9:op}"/>`}).join("")}</svg>`;

export const curve = (cls = "") => `<svg class="curve ${cls}" viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden="true"><path d="M0 56V30C240 4 480 0 720 18s480 34 720 6v32z"/></svg>`;
