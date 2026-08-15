// Re-fetches only Rise weapons whose listing did not expose rarity.
// Kiranico's detail pages expose the canonical "Rarity N" link.
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'weapons.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';

async function fetchRarity(id) {
  const response = await fetch(`https://mhrise.kiranico.com/data/weapons/${id}`, { headers: { 'user-agent': UA } });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const html = await response.text();
  const match = html.match(/Rarity\s+(\d+)/);
  return match ? Number(match[1]) : null;
}

async function main() {
  const weapons = JSON.parse(fs.readFileSync(file, 'utf8'));
  const missing = weapons.filter(weapon => weapon.rarity == null);
  let index = 0; let updated = 0; const failures = [];
  async function worker() {
    while (index < missing.length) {
      const weapon = missing[index++];
      try {
        const rarity = await fetchRarity(weapon.id);
        if (rarity != null) { weapon.rarity = rarity; updated++; }
        else failures.push({ id: weapon.id, name: weapon.name, reason: 'No rarity field' });
      } catch (error) { failures.push({ id: weapon.id, name: weapon.name, reason: String(error.message || error) }); }
      if ((updated + failures.length) % 50 === 0) console.log(`progress ${updated + failures.length}/${missing.length}`);
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  fs.writeFileSync(file, JSON.stringify(weapons));
  console.log(JSON.stringify({ requested: missing.length, updated, failures }, null, 2));
  if (failures.length) process.exitCode = 2;
}
main().catch(error => { console.error(error); process.exit(1); });
