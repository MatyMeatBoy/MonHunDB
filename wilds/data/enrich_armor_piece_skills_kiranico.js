// Fill Wilds armor-piece skill levels from Kiranico armor-series pages.
// Kiranico does not expose per-piece materials in this source, so this script
// intentionally changes skills only.
const fs = require("fs");
const path = require("path");
const DATA = __dirname;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

function clean(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function parseLinks(html) {
  const out = [];
  const re = /<a[^>]*href="\/data\/armor-series\/([^"?]+)"[^>]*><span>([\s\S]*?)<\/span><\/a>/g;
  for (const m of html.matchAll(re)) out.push({ slug: m[1], name: clean(m[2]) });
  return out;
}
function parseRows(html) {
  const out = [];
  const marker = html.indexOf("Equipment Skills</th>");
  if (marker < 0) return out;
  const table = html.slice(marker, marker + 120000);
  for (const m of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const row = m[1];
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(x => x[1]);
    if (cells.length < 4) continue;
    const piece = clean(cells[1]).replace(/^G\.\s+/, "Guardian ");
    if (!piece || /^(Head|Chest|Arms|Waist|Legs)$/.test(piece)) continue;
    const skills = [];
    for (const s of cells[3].matchAll(/<a[^>]*href="\/data\/skills\/[^"?]+"[^>]*>([^<]+)<\/a>/g)) {
      const text = clean(s[1]);
      const lv = text.match(/\s\+(\d+)$/);
      skills.push({ name: text.replace(/\s\+\d+$/, ""), level: lv ? Number(lv[1]) : 1 });
    }
    if (skills.length) out.push({ piece, skills });
  }
  return out;
}
async function fetchText(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { headers: { "User-Agent": UA } }); if (r.ok) return await r.text(); } catch {}
    await new Promise(r => setTimeout(r, 250 * (i + 1)));
  }
  return "";
}
async function main() {
  const pieces = JSON.parse(fs.readFileSync(path.join(DATA, "armor_pieces.json"), "utf8"));
  const index = await fetchText("https://mhwilds.kiranico.com/data/armor-series");
  const links = parseLinks(index);
  const byName = new Map(pieces.map(p => [p.name, p]));
  let matched = 0;
  for (let i = 0; i < links.length; i += 8) {
    await Promise.all(links.slice(i, i + 8).map(async link => {
      const rows = parseRows(await fetchText(`https://mhwilds.kiranico.com/data/armor-series/${link.slug}`));
      for (const row of rows) {
        const piece = byName.get(row.piece);
        if (!piece) continue;
        piece.skills = row.skills;
        matched++;
      }
    }));
    console.log(`Processed ${Math.min(i + 8, links.length)}/${links.length}`);
  }
  fs.writeFileSync(path.join(DATA, "armor_pieces.json"), JSON.stringify(pieces, null, 2));
  console.log(`Matched ${matched} piece rows from ${links.length} armor series.`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
