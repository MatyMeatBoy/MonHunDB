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

const ITEM_VIEWS = ['material', 'consume', 'scrap', 'mystery', 'hub', 'village', 'decoration', 'ammo', 'coating', 'other'];

function parseItemList(html) {
  const items = [];
  const regex = /<a href="\/data\/items\/([^"]+)">([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    items.push({ slug: match[1], name: match[2].trim() });
  }
  return items;
}

async function scrapeItemView(view, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/items?view=${view}` : `${BASE}/data/items?view=${view}`;
  const html = await fetchHtml(url);
  return parseItemList(html);
}

function parseItemDetail(html) {
  const data = { id: '', name: '', rarity: 0, icon: '', description: '', category: '' };

  const idMatch = html.match(/\/data\/items\/([^\/]+)\/?$/);
  if (idMatch) data.id = idMatch[1];

  const nameMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
  if (nameMatch) data.name = nameMatch[1].trim();

  const rarityMatch = html.match(/Rarity[^<]*<td[^>]*>(\d+)<\/td>/i);
  if (rarityMatch) data.rarity = parseInt(rarityMatch[1], 10);

  const iconMatch = html.match(/<img[^>]*src="([^"]*items[^"]*)"[^>]*>/);
  if (iconMatch) data.icon = iconMatch[1];

  const descMatch = html.match(/<blockquote[^>]*>([^<]+)<\/blockquote>/);
  if (descMatch) data.description = descMatch[1].trim();

  const catMatch = html.match(/Category[^<]*<td[^>]*>([^<]+)<\/td>/i);
  if (catMatch) data.category = catMatch[1].trim();

  return data;
}

async function scrapeItemDetail(slug, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/items/${slug}` : `${BASE}/data/items/${slug}`;
  const html = await fetchHtml(url);
  return parseItemDetail(html);
}

async function main() {
  const allItems = new Map();

  for (const view of ITEM_VIEWS) {
    console.log(`Scraping items view: ${view} (EN)...`);
    const itemsEn = await scrapeItemView(view, 'en');
    console.log(`  Found ${itemsEn.length} items`);

    console.log(`Scraping items view: ${view} (ES)...`);
    const itemsEs = await scrapeItemView(view, 'es');
    const esMap = new Map(itemsEs.map(i => [i.slug, i.name]));

    for (let i = 0; i < itemsEn.length; i++) {
      const item = itemsEn[i];
      if (allItems.has(item.slug)) continue;

      console.log(`  [${i+1}/${itemsEn.length}] Scraping ${item.name}...`);
      try {
        const [detailEn, detailEs] = await Promise.all([
          scrapeItemDetail(item.slug, 'en'),
          scrapeItemDetail(item.slug, 'es'),
        ]);
        allItems.set(item.slug, {
          id: detailEn.id || item.slug,
          name: item.name,
          nameEs: esMap.get(item.slug) || item.name,
          rarity: detailEn.rarity,
          icon: detailEn.icon,
          description: detailEn.description,
          descriptionEs: detailEs.description,
          category: detailEn.category,
        });
        await new Promise(r => setTimeout(r, 80));
      } catch (e) {
        console.error(`    ERROR: ${e.message}`);
      }
    }
  }

  const results = Array.from(allItems.values());
  fs.writeFileSync(path.join(OUT_DIR, 'items.json'), JSON.stringify(results, null, 2));
  console.log(`Done! Saved ${results.length} unique items to wilds_raw/items.json`);
}

main().catch(console.error);