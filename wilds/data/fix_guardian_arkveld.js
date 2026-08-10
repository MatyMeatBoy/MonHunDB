// Direct fix: parse Guardian Arkveld materials from wikitext and update monsters.json
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname);
const WIKI = path.join(OUT, 'monster_wiki_raw', 'guardian-arkveld.txt');
const MONSTERS = path.join(OUT, 'monsters.json');

const w = fs.readFileSync(WIKI, 'utf8');
const monsters = JSON.parse(fs.readFileSync(MONSTERS, 'utf8'));
const mon = monsters.find(m => m.slug === 'guardian-arkveld');
if (!mon) { console.log('not found'); process.exit(); }

const materials = {};

// Extract all GenericItemLink entries with their ranks and methods
const sections = w.split(/\|- .* Rank\s*=/);
for (const sec of sections) {
  // detect rank
  let rank = 'High Rank';
  const rankMatch = sec.match(/^\s*(Low|High|Master)\s/);
  if (rankMatch) rank = rankMatch[1] + ' Rank';
  else if (!sec.includes('GenericItemLink')) continue;

  // Find table header to determine method
  const methodBlocks = sec.split(/! colspan/);
  for (const block of methodBlocks) {
    let method = 'Target Rewards';
    const headerMatch = block.match(/>([^<]+)</) || block.match(/^\|\s*([A-Za-z].+)/m);
    if (headerMatch) {
      const h = headerMatch[0].replace(/[<>|!\s]/g, '').trim();
      if (/Carve/i.test(h)) method = 'Carving';
      else if (/Break/i.test(h)) method = 'Broken Part Rewards';
      else if (/Hunt|Target|Reward/i.test(h)) method = 'Target Rewards';
      else if (/Wound/i.test(h)) method = 'Wound Destroyed Reward';
      else continue; // skip unknown headers
    }

    const rows = [...block.matchAll(/GenericItemLink\|MHWilds\|([^|]+)/g)];
    for (const rm of rows) {
      const name = rm[1].trim();
      // find percent on next line
      const pos = block.indexOf(rm[0]);
      const pctMatch = block.slice(pos).match(/\|\s*(\d+%?)\s*[\n\|]/);
      if (!pctMatch) continue;
      if (!materials[rank]) materials[rank] = [];
      materials[rank].push({ material: name, method, percent: pctMatch[1].replace('%', '') + '%' });
    }
  }
}

// Convert to Rise format
const result = {};
for (const rank of Object.keys(materials)) {
  const byMat = {};
  for (const r of materials[rank]) {
    if (!byMat[r.material]) byMat[r.material] = { targetReward: '', capture: '', breakParts: '', carves: '', dropped: '' };
    const e = byMat[r.material];
    const add = (a, b) => a ? a + ', ' + b : b;
    if (/carv/i.test(r.method)) e.carves = add(e.carves, r.percent);
    else if (/break/i.test(r.method)) e.breakParts = add(e.breakParts, r.percent);
    else if (/wound/i.test(r.method)) e.dropped = add(e.dropped, r.percent);
    else e.targetReward = add(e.targetReward, r.percent);
  }
  result[rank] = Object.entries(byMat).map(([material, e]) => ({ material, rarity: null, ...e }));
}

mon.materials = result;
fs.writeFileSync(MONSTERS, JSON.stringify(monsters, null, 1));
console.log('DONE. Ranks:', Object.keys(result), '| Low items:', (result['Low Rank'] || []).length, '| High items:', (result['High Rank'] || []).length);
console.log('Sample:', JSON.stringify(result['Low Rank']?.slice(0, 2), null, 1));
