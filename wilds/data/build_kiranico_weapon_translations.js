// Populates weapons.json's nameEs from Kiranico's PER-WEAPON-TYPE data
// (Riperino/wilds/weapons/<type-slug>.json), not the old flat
// Riperino/wilds/weapons.json list (which only had 87 entries -- Kiranico's
// /data/weapons page is a client-side tab SPA; the other 13 weapon types
// never render into the page's initial HTML at all, they only exist in the
// Next.js RSC "flight" payload. See export-patch.md in the scraper repo for
// the full writeup of how scrape_weapon_types.js gets at that data).
const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const RIPERINO_WEAPONS_DIR = path.join(__dirname, '../../../../Apps/claude/scraperino-riperino/Riperino/wilds/weapons');

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .trim();
}
function norm(s) {
  let v = decodeEntities(s).replace(/\s+\+/, '+').replace(/\s+Plus$/i, '+').trim();
  v = v.replace(/^G ([A-Z])/, 'G. $1').replace(/\bGamma\b/, 'γ');
  return v.toLowerCase();
}

// Only the 14 TYPE-level files (has {type, rows}) -- the same directory
// also holds per-weapon DETAIL files ({id, en:{...}, es:{...}}) from a
// separate earlier pass; those have a different shape and aren't a source
// of a name pair list, so they're skipped automatically by the shape check.
const files = fs.readdirSync(RIPERINO_WEAPONS_DIR);
const esByKey = new Map();
let typeFileCount = 0;
for (const f of files) {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(RIPERINO_WEAPONS_DIR, f), 'utf8')); } catch (e) { continue; }
  if (!d.type || !Array.isArray(d.rows)) continue;
  typeFileCount++;
  for (const row of d.rows) {
    if (row.name && row.name.en && row.name.es) {
      esByKey.set(norm(row.name.en), row.name.es);
    }
  }
}
console.log(`read ${typeFileCount} weapon-type files, ${esByKey.size} unique EN->ES name pairs`);

const weaponsPath = path.join(DATA_DIR, 'weapons.json');
const weapons = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));
let hit = 0;
const missing = [];
for (const w of weapons) {
  const es = esByKey.get(norm(w.name));
  if (es) { w.nameEs = es; hit++; } else missing.push(w.name);
}
fs.writeFileSync(weaponsPath, JSON.stringify(weapons, null, 1));
console.log(`weapons: ${hit}/${weapons.length} translated`);
if (missing.length) {
  console.log('missing sample:', missing.slice(0, 20).join(', ') + (missing.length > 20 ? ` (+${missing.length - 20} more)` : ''));
}
