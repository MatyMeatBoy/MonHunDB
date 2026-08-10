// Parse monsterhunterwiki.org/wiki/MHWilds/Decorations: name, icon, rarity,
// granted skill, sources (acquisition). Also cross-mine skill icon URLs
// from armor_comparison_raw.html's equipmentSkills cells (extra coverage).
const fs = require('fs');
const path = require('path');
const OUT_DIR = __dirname;

function decodeEntities(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&').trim();
}
function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

const html = fs.readFileSync(path.join(OUT_DIR, 'mhwikiorg_decorations_raw.html'), 'utf8');
const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];

const decoData = {}; // name -> {icon, rarity, skill, sources}
let count = 0;
for (const row of rows) {
  const cells = row.match(/<td[\s\S]*?<\/td>/g);
  if (!cells || cells.length < 5) continue;
  const name = stripTags(cells[0]);
  if (!name) continue;
  const iconMatch = cells[0].match(/src="([^"]+)"/);
  const icon = iconMatch ? iconMatch[1] : null;
  const rarity = Number(stripTags(cells[1])) || null;
  const skill = stripTags(cells[2]);
  const sources = stripTags(cells[4]);
  decoData[name] = { icon, rarity, skill, sources };
  count++;
}
fs.writeFileSync(path.join(OUT_DIR, 'mhwikiorg_decoration_data.json'), JSON.stringify(decoData, null, 1));
console.log('mhwikiorg decorations parsed:', count);

// extra skill icons from the armor comparison table's equipmentSkills cells
const armorHtml = fs.readFileSync(path.join(OUT_DIR, 'armor_comparison_raw.html'), 'utf8');
const skillIconUrls = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'skill_icon_urls.json'), 'utf8'));
let added = 0;
const skillImgPat = /<a href="\/[^"]+" title="([^"]+)"><img[^>]*src="([^"]+)"[^>]*\/?><\/a><\/span>\s*<a href="\/[^"]+" title="[^"]+">[^<]+ Lv\d+<\/a>/g;
for (const m of armorHtml.matchAll(skillImgPat)) {
  if (!skillIconUrls[m[1]]) { skillIconUrls[m[1]] = m[2]; added++; }
}
fs.writeFileSync(path.join(OUT_DIR, 'skill_icon_urls.json'), JSON.stringify(skillIconUrls, null, 1));
console.log('extra skill icons from armor comparison table:', added, '-- total now:', Object.keys(skillIconUrls).length);
