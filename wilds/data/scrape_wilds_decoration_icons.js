// Parse wilds_decorations_raw.html (already fetched) into:
//  - decoration_icon_manifest.json  { decorationName: iconUrl }
//  - skill_icon_manifest.json       { skillName: iconUrl }  (unique per skill in Wilds)
const fs = require('fs');
const path = require('path');
const OUT_DIR = __dirname;

const html = fs.readFileSync(path.join(OUT_DIR, 'wilds_decorations_raw.html'), 'utf8');

// one <tr> per decoration row
const rowPat = /<tr>\s*<td><span typeof="mw:File"><a href="\/[^"]+" title="([^"]+)"><img[^>]*src="([^"]+)"[\s\S]*?<\/tr>/g;
const decoIcons = {};
const skillIcons = {};
let count = 0;
for (const m of html.matchAll(rowPat)) {
  const row = m[0];
  const decoName = m[1];
  const decoIcon = m[2];
  if (!decoIcons[decoName]) decoIcons[decoName] = decoIcon;
  const skillMatch = row.match(/<td><span typeof="mw:File"><a href="\/[^"]+" title="([^"]+)"><img[^>]*src="([^"]+)"[\s\S]*?<\/span>\s*<a href="\/[^"]+" title="[^"]+">[^<]+<\/a> Lv \d+/);
  if (skillMatch) {
    const skillName = skillMatch[1];
    const skillIcon = skillMatch[2];
    if (!skillIcons[skillName]) skillIcons[skillName] = skillIcon;
  }
  count++;
}

fs.writeFileSync(path.join(OUT_DIR, 'decoration_icon_urls.json'), JSON.stringify(decoIcons, null, 1));
fs.writeFileSync(path.join(OUT_DIR, 'skill_icon_urls.json'), JSON.stringify(skillIcons, null, 1));
console.log('rows:', count, 'decorations:', Object.keys(decoIcons).length, 'unique skills:', Object.keys(skillIcons).length);
