// build.mjs: dependency free. Reads posts/*.md (frontmatter + markdown), writes blog/<slug>/index.html,
// blog/index.html and sitemap.xml. Run: node build.mjs
import fs from "node:fs";
import path from "node:path";
const cfg = JSON.parse(fs.readFileSync("site.json", "utf8"));
const base = cfg.base_url.replace(/\/+$/, "");
const posts = [];
for (const f of fs.existsSync("posts") ? fs.readdirSync("posts").filter(x => x.endsWith(".md")).sort() : []) {
  const raw = fs.readFileSync(path.join("posts", f), "utf8").replace(/^﻿/, "");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) { console.error("skip, no frontmatter:", f); continue; }
  const fm = {}; for (const line of m[1].split(/\r?\n/)) { const i = line.indexOf(":"); if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, ""); }
  const slug = fm.slug || f.replace(/\.md$/, "");
  if (fm.draft === "true") continue;
  posts.push({ slug, title: fm.title || slug, description: fm.description || "", date: fm.date || "", lang: fm.lang || "en", body: md(m[2]) });
}
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function md(src) {
  const lines = src.replace(/\r/g, "").split("\n"); let out = [], para = [], list = null;
  const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>').replace(/`([^`]+)`/g, "<code>$1</code>");
  const flush = () => { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } if (list) { out.push("</" + list + ">"); list = null; } };
  for (const l of lines) {
    const h = l.match(/^(#{1,4})\s+(.*)$/); const li = l.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    if (h) { flush(); out.push(`<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`); }
    else if (li) { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } const kind = /^\s*\d+\./.test(l) ? "ol" : "ul"; if (list !== kind) { if (list) out.push("</" + list + ">"); out.push("<" + kind + ">"); list = kind; } out.push("<li>" + inline(li[1]) + "</li>"); }
    else if (!l.trim()) flush();
    else { if (list) { out.push("</" + list + ">"); list = null; } para.push(l.trim()); }
  }
  flush(); return out.join("\n");
}
const shell = (p, inner, canon) => `<!doctype html><html lang="${p.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}"><link rel="canonical" href="${canon}"><link rel="stylesheet" href="${base}/style.css"></head><body><main${p.lang === "ar" ? ' class="ar"' : ""}><nav><a href="${base}/">Wakeel</a><a href="${base}/blog/">Notes</a></nav>${inner}</main></body></html>\n`;
fs.mkdirSync("blog", { recursive: true });
for (const p of posts) {
  fs.mkdirSync(path.join("blog", p.slug), { recursive: true });
  fs.writeFileSync(path.join("blog", p.slug, "index.html"), shell(p, `<article><h1>${esc(p.title)}</h1><p class="muted">${esc(p.date)}</p>${p.body}</article>`, `${base}/blog/${p.slug}/`));
}
const list = posts.slice().sort((a, b) => (b.date > a.date ? 1 : -1)).map(p => `<li><a href="${base}/blog/${p.slug}/">${esc(p.title)}</a> <span class="muted">${esc(p.date)}</span></li>`).join("\n");
fs.writeFileSync("blog/index.html", shell({ lang: "en", title: "Notes", description: "Notes on running scheduled AI employees for small businesses in Egypt and the Gulf." }, `<h1>Notes</h1><ul>${list || "<li>No notes yet.</li>"}</ul>`, `${base}/blog/`));
const urls = [`${base}/`, `${base}/blog/`, ...posts.map(p => `${base}/blog/${p.slug}/`)];
fs.writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
fs.writeFileSync("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
console.log(`built ${posts.length} post(s), ${urls.length} sitemap urls`);
