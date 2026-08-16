const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const out = path.join(__dirname, 'bow_stats.json');
const weapons = JSON.parse(fs.readFileSync(path.join(__dirname, 'weapons.json'), 'utf8'));
const localBows = new Map(weapons.filter(w => w.type === 'Bow').map(w => [w.name, w]));

function clean(s) { return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function normalize(s) { return s.replace(/[’']/g, "'").replace(/\s+/g, ' ').trim().toLowerCase(); }
function shotName(s) { return ({ Rapd: 'Rapid', Sctr: 'Scatter', Prce: 'Pierce' }[s] || s); }
function parseRows(wikitext) {
  const result = {};
  for (const block of wikitext.split(/\n\|-/)) {
    const links = [...block.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(m => clean(m[1]));
    const name = links.find(n => localBows.has(n) || localBows.has(n.replace(/[’']/g, "'")));
    if (!name) continue;
    const localName = localBows.has(name) ? name : [...localBows.keys()].find(k => normalize(k) === normalize(name));
    if (!localName) continue;
    const fields = block.split(/\n\|/).map(x => x.replace(/^\s+|\s+$/g, ''));
    const shotField = fields.find(f => /(?:Rapid|Scatter|Pierce)\s+[1-5]/.test(f));
    const charge = shotField ? [...shotField.matchAll(/(Rapid|Scatter|Pierce)\s+([1-5])/g)].map(m => ({ name: m[1], level: Number(m[2]) })) : [];
    const icons = [...block.matchAll(/ItemIcon040([a-e]?)\.png/gi)].map(m => m[1].toLowerCase());
    const coatingMap = { '': 'Power Coating', a: 'Poison Coating', b: 'Paralysis Coating', c: 'Sleep Coating', d: 'Paint Coating', e: 'Close Range Coating' };
    const coatings = [...new Set([...icons.map(s => coatingMap[s]), 'Paint Coating'].filter(Boolean))];
    result[localName] = { charge, coatings, source: 'MHFU: Bow Weapon Tree' };
  }
  return result;
}
(async () => {
  const url = 'https://monsterhunter.fandom.com/api.php?action=parse&page=MHFU%3A_Bow_Weapon_Tree&prop=wikitext&format=json';
  const res = await fetch(url, { headers: { 'user-agent': 'MonHunDB-Scraperino/1.0' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  const text = json.parse?.wikitext?.['*'] || '';
  const bows = parseRows(text);
  // Keep charge data from the local extraction where the wiki row is absent.
  const localSource = JSON.parse(fs.readFileSync(path.join(root, 'sources/mhfu-db-main/mhfu-db-main/Weapons/bows.json'), 'utf8'));
  const localCharges = new Map(localSource.map(b => [normalize(b.name), b.charge || []]));
  for (const name of localBows.keys()) {
    if (!bows[name]) bows[name] = { charge: localCharges.get(normalize(name)) || [], coatings: ['Paint Coating'], source: 'MHFU DB + Fandom' };
    const extracted = localCharges.get(normalize(name))?.map(x => ({ name: shotName(x.name), level: x.level })) || [];
    // The local MHFU extraction includes Load Up (fourth charge), which the
    // wiki table may omit from its compact row. Prefer it when available.
    if (extracted.length >= 4) bows[name].charge = extracted;
  }
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), source: url, coatings: ['Power Coating', 'Poison Coating', 'Paralysis Coating', 'Sleep Coating', 'Paint Coating', 'Close Range Coating'], bows }, null, 2) + '\n');
  console.log(`Saved ${Object.keys(bows).length} bow records (local bows: ${localBows.size}).`);
})();
