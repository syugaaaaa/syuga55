// 記事用の小さな Markdown 変換（外部依存なし）
// 対応：frontmatter（key: value / リスト）、## / ###、段落、- リスト、1. リスト、**強調**、[リンク](URL)

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function inline(s) {
  let out = esc(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (m, t, u) => {
    const ext = u.startsWith("http");
    return `<a href="${u}"${ext ? ' rel="noopener" target="_blank"' : ""}>${t}</a>`;
  });
  return out;
}

export function parseFile(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error("frontmatter がありません");
  const meta = {};
  let listKey = null;
  for (const line of m[1].split("\n")) {
    if (/^\s+- /.test(line) && listKey) { meta[listKey].push(line.replace(/^\s+- /, "").trim()); continue; }
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!kv) continue;
    if (kv[2] === "") { meta[kv[1]] = []; listKey = kv[1]; }
    else { meta[kv[1]] = kv[2].trim(); listKey = null; }
  }
  return { meta, body: m[2] };
}

// 本文 → { lead（最初の見出しまでの段落）, html, headings, text }
export function render(body) {
  const lines = body.replace(/\r/g, "").split("\n");
  const blocks = [];
  let para = [], list = null;
  const flushPara = () => { if (para.length) { blocks.push({ t: "p", v: para.join("") }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushPara(); flushList(); continue; }
    let mm;
    if (/^\|.*\|$/.test(line.trim())) {
      flushPara(); flushList();
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) continue;
      const last = blocks[blocks.length - 1];
      if (last && last.t === "table") last.rows.push(cells); else blocks.push({ t: "table", rows: [cells] });
      continue;
    }
    if ((mm = line.match(/^-\s+\[ \]\s+(.*)$/))) { flushPara(); if (!list || list.t !== "check") { flushList(); list = { t: "check", items: [] }; } list.items.push(mm[1]); continue; }
    if ((mm = line.match(/^(#{2,3})\s+(.*)$/))) { flushPara(); flushList(); blocks.push({ t: "h" + mm[1].length, v: mm[2] }); continue; }
    if ((mm = line.match(/^-\s+(.*)$/))) { flushPara(); if (!list || list.t !== "ul") { flushList(); list = { t: "ul", items: [] }; } list.items.push(mm[1]); continue; }
    if ((mm = line.match(/^\d+\.\s+(.*)$/))) { flushPara(); if (!list || list.t !== "ol") { flushList(); list = { t: "ol", items: [] }; } list.items.push(mm[1]); continue; }
    flushList(); para.push(line.trim());
  }
  flushPara(); flushList();

  const headings = [];
  const leadParts = [], bodyParts = [];
  let seenHeading = false, hi = 0, plain = "";
  for (const b of blocks) {
    let html = "";
    if (b.t === "h2") { seenHeading = true; hi++; const id = `s${hi}`; headings.push({ id, text: b.v }); html = `<h2 id="${id}">${inline(b.v)}</h2>`; plain += b.v; }
    else if (b.t === "h3") { seenHeading = true; html = `<h3>${inline(b.v)}</h3>`; plain += b.v; }
    else if (b.t === "p") { html = `<p>${inline(b.v)}</p>`; plain += b.v; }
    else if (b.t === "table") {
      const [h, ...rows] = b.rows;
      html = `<div class="table-scroll"><table class="data"><thead><tr>${h.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      plain += b.rows.flat().join("");
    }
    else if (b.t === "check") { html = `<ul class="checklist">${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`; plain += b.items.join(""); }
    else { html = `<${b.t}>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${b.t}>`; plain += b.items.join(""); }
    (seenHeading ? bodyParts : leadParts).push(html);
  }
  return { lead: leadParts.join("\n"), html: bodyParts.join("\n"), headings, chars: plain.length };
}

export function parseRefs(list) {
  return (list || []).map((r) => {
    const [title, publisher, url] = r.split("｜").map((s) => (s || "").trim());
    return { title, publisher, url };
  });
}
