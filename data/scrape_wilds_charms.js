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

function parseCharmList(html) {
  const charms = [];
  const regex = /<a href="\/data\/charms\/([^"]+)">([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    charms.push({ slug: match[1], name: match[2].trim() });
  }
  return charms;
}

async function scrapeCharmList(lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/charms` : `${BASE}/data/charms`;
  const html = await fetchHtml(url);
  return parseCharmList(html);
}

function parseCharmDetail(html) {
  const data = { id: '', name: '', rarity: 0, skills: [], materials: [], decoSlots: [] };

  const idMatch = html.match(/\/data\/charms\/([^\/]+)\/?$/);
  if (idMatch) data.id = idMatch[1];

  const nameMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
  if (nameMatch) data.name = nameMatch[1].trim();

  const rarityMatch = html.match(/Rarity[^<]*<td[^>]*>(\d+)<\/td>/i);
  if (rarityMatch) data.rarity = parseInt(rarityMatch[1], 10);

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

async function scrapeCharmDetail(slug, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/charms/${slug}` : `${BASE}/data/charms/${slug}`;
  const html = await fetchHtml(url);
  return parseCharmDetail(html);
}

async function main() {
  console.log('Scraping charm list (EN)...');
  const charmsEn = await scrapeCharmList('en');
  console.log(`Found ${charmsEn.length} charms`);

  console.log('Scraping charm list (ES)...');
  const charmsEs = await scrapeCharmList('es');
  const esMap = new Map(charmsEs.map(c => [c.slug, c.name]));

  const results = [];
  for (let i = 0; i < charmsEn.length; i++) {
    const c = charmsEn[i];
    console.log(`[${i+1}/${charmsEn.length}] Scraping ${c.name}...`);
    try {
      const [detailEn, detailEs] = await Promise.all([
        scrapeCharmDetail(c.slug, 'en'),
        scrapeCharmDetail(c.slug, 'es'),
      ]);
      results.push({
        id: detailEn.id || c.slug,
        name: c.name,
        nameEs: esMap.get(c.slug) || c.name,
        rarity: detailEn.rarity,
        skills: detailEn.skills.map(s => ({ ...s, nameEs: s.name })),
        materials: detailEn.materials.map(m => ({ ...m, nameEs: m.name })),
        decoSlots: detailEn.decoSlots,
      });
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'charms.json'), JSON.stringify(results, null, 2));
  console.log(`Done! Saved ${results.length} charms to wilds_raw/charms.json`);
}

main().catch(console.error);