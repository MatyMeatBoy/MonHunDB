const fs = require('fs');
const path = require('path');

const BASE = 'https://mhwilds.kiranico.com';
const OUT_DIR = path.join(__dirname, 'wilds_raw');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

async function fetchHtml(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

const WEAPON_TYPES = [
  'great-sword', 'long-sword', 'sword-and-shield', 'dual-blades', 'hammer',
  'hunting-horn', 'lance', 'gunlance', 'switch-axe', 'charge-blade',
  'insect-glaive', 'light-bowgun', 'heavy-bowgun', 'bow'
];

function parseWeaponList(html) {
  const weapons = [];
  const regex = /<a href="\/data\/weapons\/([^"]+)">([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    weapons.push({ slug: match[1], name: match[2].trim() });
  }
  return weapons;
}

async function scrapeWeaponType(type, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/weapons/${type}` : `${BASE}/data/weapons/${type}`;
  const html = await fetchHtml(url);
  return parseWeaponList(html);
}

function parseWeaponDetail(html) {
  const data = { id: '', name: '', type: '', attack: 0, rarity: 0, element: null, affinity: 0, sharpness: '', skills: [], materials: [], decoSlots: [] };

  const idMatch = html.match(/\/data\/weapons\/([^\/]+)\/?$/);
  if (idMatch) data.id = idMatch[1];

  const nameMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
  if (nameMatch) data.name = nameMatch[1].trim();

  const typeMatch = html.match(/Type[^<]*<td[^>]*>([^<]+)<\/td>/i);
  if (typeMatch) data.type = typeMatch[1].trim();

  const attackMatch = html.match(/Attack[^<]*<td[^>]*>([\d,]+)<\/td>/i);
  if (attackMatch) data.attack = parseInt(attackMatch[1].replace(/,/g, ''), 10);

  const rarityMatch = html.match(/Rarity[^<]*<td[^>]*>(\d+)<\/td>/i);
  if (rarityMatch) data.rarity = parseInt(rarityMatch[1], 10);

  const affinityMatch = html.match(/Affinity[^<]*<td[^>]*>([+-]?\d+)%<\/td>/i);
  if (affinityMatch) data.affinity = parseInt(affinityMatch[1], 10);

  const elementRegex = /<img[^>]*alt="([^"]+)"[^>]*>[^<]*<td[^>]*>(\d+)<\/td>/gi;
  let elementMatch;
  while ((elementMatch = elementRegex.exec(html)) !== null) {
    data.element = { type: elementMatch[1].toLowerCase(), value: parseInt(elementMatch[2], 10) };
  }

  const skillRegex = /<a href="\/data\/skills\/([^"]+)">([^<]+)<\/a>[^<]*<td[^>]*>([^<]+)<\/td>/g;
  let skillMatch;
  while ((skillMatch = skillRegex.exec(html)) !== null) {
    data.skills.push({ slug: skillMatch[1], name: skillMatch[2].trim(), level: skillMatch[3].trim() });
  }

  const matRegex = /<a href="\/data\/items\/([^"]+)">([^<]+)<\/a>[^<]*<td[^>]*>([^<]+)<\/td>/g;
  let matMatch;
  while ((matMatch = matRegex.exec(html)) !== null) {
    data.materials.push({ slug: matMatch[1], name: matMatch[2].trim(), qty: matMatch[3].trim() });
  }

  const slotRegex = /deco(\d)\.png/gi;
  let slotMatch;
  while ((slotMatch = slotRegex.exec(html)) !== null) {
    data.decoSlots.push(parseInt(slotMatch[1], 10));
  }

  return data;
}

async function scrapeWeaponDetail(slug, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/weapons/${slug}` : `${BASE}/data/weapons/${slug}`;
  const html = await fetchHtml(url);
  return parseWeaponDetail(html);
}

async function main() {
  const allWeapons = [];

  for (const type of WEAPON_TYPES) {
    console.log(`Scraping weapon type: ${type} (EN)...`);
    const weaponsEn = await scrapeWeaponType(type, 'en');
    console.log(`  Found ${weaponsEn.length} weapons`);

    console.log(`Scraping weapon type: ${type} (ES)...`);
    const weaponsEs = await scrapeWeaponType(type, 'es');
    const esMap = new Map(weaponsEs.map(w => [w.slug, w.name]));

    for (let i = 0; i < weaponsEn.length; i++) {
      const w = weaponsEn[i];
      console.log(`  [${i+1}/${weaponsEn.length}] Scraping ${w.name}...`);
      try {
        const [detailEn, detailEs] = await Promise.all([
          scrapeWeaponDetail(w.slug, 'en'),
          scrapeWeaponDetail(w.slug, 'es'),
        ]);
        allWeapons.push({
          id: detailEn.id || w.slug,
          name: w.name,
          nameEs: esMap.get(w.slug) || w.name,
          type: detailEn.type,
          attack: detailEn.attack,
          rarity: detailEn.rarity,
          element: detailEn.element,
          affinity: detailEn.affinity,
          skills: detailEn.skills.map(s => ({ ...s, nameEs: s.name })),
          materials: detailEn.materials.map(m => ({ ...m, nameEs: m.name })),
          decoSlots: detailEn.decoSlots,
        });
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`    ERROR: ${e.message}`);
      }
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'weapons.json'), JSON.stringify(allWeapons, null, 2));
  console.log(`Done! Saved ${allWeapons.length} weapons to wilds_raw/weapons.json`);
}

main().catch(console.error);