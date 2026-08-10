// Parse each weapon type's embedded Comparison Table tab (weapon_type_pages/*.html)
// into a flat weapons.json: {id, name, type, icon, rarity, attack, element,
// affinity, defense, materials:[{material,qty}], nameEs:""}
const fs = require('fs');
const path = require('path');
const OUT_DIR = __dirname;
const PAGES_DIR = path.join(OUT_DIR, 'weapon_type_pages');

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&#160;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseType(typeName, html) {
  const tabId = `tabber-${typeName}_Comparison_Table`;
  const panelIdx = html.indexOf(`id="${tabId}"`, html.indexOf('tabber__panel'));
  if (panelIdx === -1) { console.log('  NO TAB for', typeName); return []; }
  const tableIdx = html.indexOf('<table', panelIdx);
  const tableEnd = html.indexOf('</table>', tableIdx);
  const table = html.slice(tableIdx, tableEnd);
  const rows = table.match(/<tr>[\s\S]*?<\/tr>/g) || [];

  const weapons = [];
  for (let i = 1; i < rows.length; i++) { // skip header row
    const row = rows[i];
    const nameMatch = row.match(/<a href="\/([^"]+)" title="([^"]+)"><img[^>]*src="([^"]+)"/);
    if (!nameMatch) continue;
    const id = nameMatch[1];
    const name = nameMatch[2];
    const icon = nameMatch[3];

    const cells = row.match(/<td[\s\S]*?<\/td>/g) || [];
    if (cells.length < 3) continue;

    // column order differs per weapon type (melee: Name,Rarity,Attack,...;
    // bow/bowgun: Name,Attack,Elem,Affinity,Defense,...,Rarity,...) -- find
    // rarity by its "Rarity N" text anywhere, attack as the largest bare
    // integer cell (attack values, 100-2000+, dwarf rarity/defense/slots)
    const cellTexts = cells.map(stripTags);
    let rarity = 0;
    for (const t of cellTexts) {
      const m = t.match(/^Rarity (\d+)$/);
      if (m) { rarity = Number(m[1]); break; }
    }
    let attack = 0;
    for (const t of cellTexts) {
      if (/^\d+$/.test(t)) attack = Math.max(attack, Number(t));
    }
    const elementText = cellTexts.find(t => /^(Fire|Water|Thunder|Ice|Dragon|Poison|Sleep|Paralysis|Blast) \d+/.test(t)) || '';

    const materialsCell = cells[cells.length - 1] || '';
    const materials = [];
    for (const m of materialsCell.matchAll(/<a href="\/[^"]+" title="[^"]+">([^<]+)<\/a> x(\d+)<\/li>/g)) {
      materials.push({ material: m[1], qty: Number(m[2]) });
    }
    const zennyMatch = materialsCell.match(/>(\d+)z<\/li>/);
    const cost = zennyMatch ? Number(zennyMatch[1]) : null;

    weapons.push({
      id, name, type: typeName.replace(/_/g, ' '), icon, rarity, attack,
      element: elementText && elementText !== '-' ? elementText : null,
      materials, cost, nameEs: "",
    });
  }
  return weapons;
}

const types = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''));
let all = [];
for (const t of types) {
  const html = fs.readFileSync(path.join(PAGES_DIR, `${t}.html`), 'utf8');
  const parsed = parseType(t, html);
  console.log(t, '->', parsed.length);
  all = all.concat(parsed);
}

fs.writeFileSync(path.join(OUT_DIR, 'weapons_fextralife.json'), JSON.stringify(all, null, 1));
console.log('TOTAL:', all.length);
