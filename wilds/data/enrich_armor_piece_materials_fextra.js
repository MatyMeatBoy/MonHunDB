/*
 * Fextralife double scraper for Wilds armor materials:
 * Armor_Sets index -> set page -> individual piece page.
 *
 * The set pages already cached in armor_set_pages_raw contain the canonical
 * links to each piece. This script follows those links, caches each response,
 * and only writes a piece when its own page exposes a material list. It never
 * copies the aggregate set cost into a piece.
 *
 * Usage: node wilds/data/enrich_armor_piece_materials_fextra.js
 */
const fs = require("fs");
const path = require("path");

const DATA = __dirname;
const RAW_SETS = path.join(DATA, "armor_set_pages_raw");
const RAW_PIECES = path.join(DATA, "armor_piece_pages_raw");
const BASE = "https://monsterhunterwilds.wiki.fextralife.com";
fs.mkdirSync(RAW_PIECES, { recursive: true });

const sets = JSON.parse(fs.readFileSync(path.join(DATA, "armor_set_list.json"), "utf8"));
const pieces = JSON.parse(fs.readFileSync(path.join(DATA, "armor_pieces.json"), "utf8"));
const byName = new Map(pieces.map(p => [norm(p.name), p]));

function norm(v) {
  return String(v || "").normalize("NFKC").replace(/[αΑ]/g, "Alpha").replace(/[βΒ]/g, "Beta").replace(/[γΓ]/g, "Gamma")
    .replace(/\s+/g, " ").trim().toLowerCase();
}
function decode(v) {
  return v.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function strip(v) {
  return decode(v.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}
function links(html) {
  const out = new Map();
  for (const m of html.matchAll(/<a\s+href="\/([^"#]+)"[^>]*title="([^"]+)"[^>]*>/gi)) {
    const href = decode(m[1]);
    const title = strip(m[2]);
    if (!/(Alpha|Beta|Gamma|α|β|γ)$/i.test(href) || /_Set$/i.test(href)) continue;
    if (!/(Crown|Head|Top|Mail|Coil|Wrap|Armguards|Gauntlets|Gloves|Sandals|Greaves|Leg|Waist|Chest|Helm|Vambraces|Tassets|Spurs|Boots)/i.test(href)) continue;
    out.set(href, { href, title });
  }
  return [...out.values()];
}
function materials(html) {
  const marker = /crafted(?: using| with) the following[\s\S]{0,300}?Materials/i.exec(html);
  if (!marker) return [];
  const tail = html.slice(marker.index, marker.index + 10000);
  const ul = /<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(tail)?.[1] || "";
  const out = [];
  for (const li of ul.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const value = strip(li[1]).replace(/\s*[×x]\s*(\d+)\s*$/i, "");
    const qty = Number(li[1].match(/\s*[×x]\s*(\d+)\s*$/i)?.[1] || 1);
    const name = value.replace(/^\d+z\s*$/i, "").trim();
    if (name && !/^\d+z$/i.test(name)) out.push({ name, quantity: qty });
  }
  return out;
}
async function fetchWithRetry(url, file) {
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "MonHunDB-research/1.0", accept: "text/html" } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const body = await res.text();
      fs.writeFileSync(file, body);
      return body;
    } catch (e) { last = e; await new Promise(r => setTimeout(r, attempt * 800)); }
  }
  throw last;
}

(async () => {
  const discovered = new Map();
  for (const set of sets) {
    const file = path.join(RAW_SETS, `${set.href}.html`);
    if (!fs.existsSync(file)) continue;
    for (const link of links(fs.readFileSync(file, "utf8"))) discovered.set(link.href, link);
  }
  const report = { source: `${BASE}/Armor_Sets`, discovered: discovered.size, fetched: 0, parsed: 0, updated: 0, failed: [] };
  for (const link of discovered.values()) {
    const local = byName.get(norm(link.title));
    if (!local) continue;
    const file = path.join(RAW_PIECES, `${link.href}.html`);
    try {
      const html = await fetchWithRetry(`${BASE}/${link.href}`, file);
      report.fetched++;
      const rows = materials(html);
      if (!rows.length) continue;
      report.parsed++;
      if (!local.materials?.length) { local.materials = rows; local.materialsSource = `${BASE}/${link.href}`; report.updated++; }
    } catch (e) { report.failed.push({ href: link.href, error: String(e.message || e) }); }
  }
  fs.writeFileSync(path.join(DATA, "armor_pieces.json"), JSON.stringify(pieces, null, 1) + "\n");
  fs.writeFileSync(path.join(DATA, "armor_piece_materials_fextra_report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`Fextralife piece scrape: ${report.discovered} links, ${report.parsed} pages with materials, ${report.updated} updates, ${report.failed.length} failures.`);
})();
