// Parse Armor_Sets_Comparison_Table (already fetched: armor_comparison_raw.html)
// into armor_sets.json: {name, image, localImage, rarity, rank, defense,
// resistances:{fire,water,thunder,ice,dragon}, decoSlots:[n,n,...], equipmentSkills:[{name,level}]}
const fs = require('fs');
const path = require('path');
const OUT_DIR = __dirname;

const html = fs.readFileSync(path.join(OUT_DIR, 'armor_comparison_raw.html'), 'utf8');
const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const sets = [];
for (const row of rows) {
  const nameMatch = row.match(/<a href="\/[^"]+" title="([^"]+)"><img[^>]*src="([^"]+)"[\s\S]{0,600}?<\/a><\/span><br \/>\s*<a href="\/[^"]+" title="[^"]+">([^<]+)<\/a>/);
  if (!nameMatch) continue; // header row or malformed
  const name = nameMatch[3];
  const image = nameMatch[2];

  const cells = row.match(/<td[\s\S]*?<\/td>/g) || [];
  if (cells.length < 10) continue;

  const rarity = stripTags(cells[1]).replace(/^Rarity\s*/, '');
  const rank = stripTags(cells[2]);

  const slotNums = [...cells[3].matchAll(/(\d+)x<span/g)].map(m => Number(m[1]));
  // slotNums are counts per icon in order found; the icon alt text has the slot size ("2 slots", "1 slots")
  const slotSizes = [...cells[3].matchAll(/alt="(\d+) slots? armor/g)].map(m => Number(m[1]));
  const decoSlots = [];
  for (let i = 0; i < slotSizes.length; i++) {
    const count = slotNums[i] || 1;
    for (let j = 0; j < count; j++) decoSlots.push(slotSizes[i]);
  }

  const defense = Number(stripTags(cells[4])) || 0;
  const resistances = {
    fire: Number(stripTags(cells[5])) || 0,
    water: Number(stripTags(cells[6])) || 0,
    thunder: Number(stripTags(cells[7])) || 0,
    ice: Number(stripTags(cells[8])) || 0,
    dragon: Number(stripTags(cells[9])) || 0,
  };

  const skillsCell = cells[11] || cells[cells.length - 1];
  const equipmentSkills = [];
  if (skillsCell) {
    for (const m of skillsCell.matchAll(/<a href="\/[^"]+" title="[^"]+">([^<]+) Lv(\d+)<\/a>/g)) {
      equipmentSkills.push({ name: m[1], level: Number(m[2]) });
    }
  }

  sets.push({ name, image, rarity, rank, defense, resistances, decoSlots, equipmentSkills });
}

fs.writeFileSync(path.join(OUT_DIR, 'armor_sets_comparison.json'), JSON.stringify(sets, null, 1));
console.log('parsed sets:', sets.length);
console.log(JSON.stringify(sets[0], null, 1));
