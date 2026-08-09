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

function parseMonsterList(html) {
  const monsters = [];
  const regex = /<a href="\/data\/monsters\/([^"]+)">([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    monsters.push({ slug: match[1], name: match[2].trim() });
  }
  return monsters;
}

async function scrapeMonsterList(lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/monsters` : `${BASE}/data/monsters`;
  const html = await fetchHtml(url);
  return parseMonsterList(html);
}

function parseMonsterDetail(html, lang) {
  const data = { name: '', species: '', baseHealth: 0, hrp: 0, hitzones: [], parts: [], ailments: [], materials: {} };

  const nameMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
  if (nameMatch) data.name = nameMatch[1].trim();

  const speciesMatch = html.match(/Species[^<]*<td[^>]*>([^<]+)<\/td>/i);
  if (speciesMatch) data.species = speciesMatch[1].trim();

  const hpMatch = html.match(/BaseHealth[^<]*<td[^>]*>([\d,]+)<\/td>/i);
  if (hpMatch) data.baseHealth = parseInt(hpMatch[1].replace(/,/g, ''), 10);

  const hrpMatch = html.match(/HunterRankPoint[^<]*<td[^>]*>([\d,]+)<\/td>/i);
  if (hrpMatch) data.hrp = parseInt(hrpMatch[1].replace(/,/g, ''), 10);

  return data;
}

async function scrapeMonsterDetail(slug, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/monsters/${slug}` : `${BASE}/data/monsters/${slug}`;
  const html = await fetchHtml(url);
  return parseMonsterDetail(html, lang);
}

async function main() {
  console.log('Scraping monster list (EN)...');
  const monstersEn = await scrapeMonsterList('en');
  console.log(`Found ${monstersEn.length} monsters`);

  console.log('Scraping monster list (ES)...');
  const monstersEs = await scrapeMonsterList('es');
  const esMap = new Map(monstersEs.map(m => [m.slug, m.name]));

  const results = [];
  for (let i = 0; i < monstersEn.length; i++) {
    const m = monstersEn[i];
    console.log(`[${i+1}/${monstersEn.length}] Scraping ${m.name}...`);
    try {
      const [detailEn, detailEs] = await Promise.all([
        scrapeMonsterDetail(m.slug, 'en'),
        scrapeMonsterDetail(m.slug, 'es'),
      ]);
      results.push({
        slug: m.slug,
        name: m.name,
        nameEs: esMap.get(m.slug) || m.name,
        species: detailEn.species,
        speciesEs: detailEs.species,
        baseHealth: detailEn.baseHealth,
        hrp: detailEn.hrp,
      });
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'monsters.json'), JSON.stringify(results, null, 2));
  console.log('Done! Saved to wilds_raw/monsters.json');
}

main().catch(console.error);