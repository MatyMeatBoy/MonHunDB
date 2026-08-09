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

const ARMOR_RARITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function parseArmorList(html) {
  const pieces = [];
  const regex = /<a href="\/data\/armor\/([^"]+)">([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    pieces.push({ slug: match[1], name: match[2].trim() });
  }
  return pieces;
}

async function scrapeArmorRarity(rarity, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/armor?rarity=${rarity}` : `${BASE}/data/armor?rarity=${rarity}`;
  const html = await fetchHtml(url);
  return parseArmorList(html);
}

function parseArmorDetail(html) {
  const data = { id: '', name: '', rarity: 0, defense: 0, part: '', skills: [], materials: [], decoSlots: [], iconM: '', iconF: '' };

  const idMatch = html.match(/\/data\/armor\/([^\/]+)\/?$/);
  if (idMatch) data.id = idMatch[1];

  const nameMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
  if (nameMatch) data.name = nameMatch[1].trim();

  const rarityMatch = html.match(/Rarity[^<]*<td[^>]*>(\d+)<\/td>/i);
  if (rarityMatch) data.rarity = parseInt(rarityMatch[1], 10);

  const defMatch = html.match(/Defense[^<]*<td[^>]*>([\d,]+)<\/td>/i);
  if (defMatch) data.defense = parseInt(defMatch[1].replace(/,/g, ''), 10);

  const partMatch = html.match(/(Head|Chest|Arms|Waist|Legs|Headgear|Body|Gloves|Coil|Greaves)/i);
  if (partMatch) data.part = partMatch[1].toLowerCase();

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

  const iconMMatch = html.match(/iconM["']?\s*:\s*["']([^"']+)["']/);
  if (iconMMatch) data.iconM = iconMMatch[1];

  const iconFMatch = html.match(/iconF["']?\s*:\s*["']([^"']+)["']/);
  if (iconFMatch) data.iconF = iconFMatch[1];

  return data;
}

async function scrapeArmorDetail(slug, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/armor/${slug}` : `${BASE}/data/armor/${slug}`;
  const html = await fetchHtml(url);
  return parseArmorDetail(html);
}

async function main() {
  const allArmor = [];

  for (const rarity of ARMOR_RARITIES) {
    console.log(`Scraping armor rarity ${rarity} (EN)...`);
    const armorEn = await scrapeArmorRarity(rarity, 'en');
    console.log(`  Found ${armorEn.length} pieces`);

    console.log(`Scraping armor rarity ${rarity} (ES)...`);
    const armorEs = await scrapeArmorRarity(rarity, 'es');
    const esMap = new Map(armorEs.map(a => [a.slug, a.name]));

    for (let i = 0; i < armorEn.length; i++) {
      const a = armorEn[i];
      console.log(`  [${i+1}/${armorEn.length}] Scraping ${a.name}...`);
      try {
        const [detailEn, detailEs] = await Promise.all([
          scrapeArmorDetail(a.slug, 'en'),
          scrapeArmorDetail(a.slug, 'es'),
        ]);
        allArmor.push({
          id: detailEn.id || a.slug,
          name: a.name,
          nameEs: esMap.get(a.slug) || a.name,
          rarity: detailEn.rarity,
          defense: detailEn.defense,
          part: detailEn.part,
          skills: detailEn.skills.map(s => ({ ...s, nameEs: s.name })),
          materials: detailEn.materials.map(m => ({ ...m, nameEs: m.name })),
          decoSlots: detailEn.decoSlots,
          iconM: detailEn.iconM,
          iconF: detailEn.iconF,
        });
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`    ERROR: ${e.message}`);
      }
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'armor_pieces.json'), JSON.stringify(allArmor, null, 2));
  console.log(`Done! Saved ${allArmor.length} armor pieces to wilds_raw/armor_pieces.json`);
}

main().catch(console.error);