// Extract material name -> icon URL from each fetched monster page's item
// tables (Carves/Rewards/Breaks) on monsterhunterwiki.org, merge into
// item_icon_manifest.json for any name still missing an icon.
const fs = require('fs');
const path = require('path');
const OUT_DIR = __dirname;
const RAW_DIR = path.join(OUT_DIR, 'monster_pages_raw');

const pat = /<a href="\/wiki\/[^"]+" title="([^"]+?) \(MHWilds\)"><picture>[\s\S]{0,400}?<img[^>]*src="([^"]+)"/g;

const found = {};
for (const file of fs.readdirSync(RAW_DIR)) {
  const html = fs.readFileSync(path.join(RAW_DIR, file), 'utf8');
  for (const m of html.matchAll(pat)) {
    const name = m[1].replace(/%2B/g, '+');
    if (!found[name]) found[name] = m[2];
  }
}
fs.writeFileSync(path.join(OUT_DIR, 'monster_material_icon_urls.json'), JSON.stringify(found, null, 1));
console.log('extracted', Object.keys(found).length, 'unique item names across', fs.readdirSync(RAW_DIR).length, 'monster pages');
