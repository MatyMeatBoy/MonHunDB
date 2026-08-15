// Fills the Wilds set-level forging materials that Kiranico does not expose.
// The source tables list materials per piece; this script preserves those rows
// as one aggregate set list (duplicates are intentionally retained).
const fs = require('fs');
const sources = [
  ['Azure Age α Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/584418'],
  ['Gala Suit α Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/583632'],
  ['Arkveld γ Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/580835'],
  ['Dahaad γ Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/572237'],
  ['Bale α Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/553652'],
  ['Nu Udra γ Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/559725'],
  ['Chainmail α Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/501900'],
  ['Hope α Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/501894'],
  ['Leather α Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/501899'],
  ['Rey Dau γ Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/514827'],
  ['Chainmail Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/501359'],
  ['Hope Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/483472'],
  ['Leather Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/501358'],
  ['Uth Duna γ Set', 'https://game8.co/games/Monster-Hunter-Wilds/archives/536399']
];
const sets = JSON.parse(fs.readFileSync(__dirname + '/armor_sets.json', 'utf8'));
const byName = new Map(sets.map(set => [set.name, set]));

async function main() {
  const updated = [];
  for (const [name, url] of sources) {
    const set = byName.get(name);
    if (!set || set.materials?.length) continue;
    const html = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } }).then(r => r.text());
    const marker = html.indexOf('Forging Materials</h2>');
    if (marker < 0) throw new Error(`No forging table: ${name}`);
    const end = html.indexOf('<h2', marker + 10);
    const section = html.slice(marker, end < 0 ? undefined : end);
    const materials = [];
    for (const row of section.matchAll(/<tr>[\s\S]*?<\/tr>/g)) {
      for (const match of row[0].matchAll(/<a class='a-link'[^>]*>([\s\S]*?)<\/a>\s*(?:×|&times;)\s*(\d+)/g)) {
        const material = match[1].replace(/<[^>]+>/g, '').trim();
        materials.push({ material, qty: Number(match[2]) });
      }
    }
    // Basic LR starter sets can be forged for zenny alone; an empty list is
    // meaningful here and is different from an uncollected materials field.
    set.materials = materials;
    set.materialsSource = url;
    set.materialsNote = materials.length ? undefined : 'Only zenny cost listed by source';
    if (!materials.length) delete set.materialsNote;
    updated.push({ name, count: materials.length, source: url });
  }
  fs.writeFileSync(__dirname + '/armor_sets.json', JSON.stringify(sets, null, 2) + '\n');
  console.log(JSON.stringify({ updated, remaining: sets.filter(s => !s.materials && !s.materialsSource).map(s => s.name) }, null, 2));
}
main().catch(error => { console.error(error); process.exit(1); });
