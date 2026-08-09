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

function parseDecorationList(html) {
  const decos = [];
  const regex = /<a href="\/data\/decorations\/([^"]+)">([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    decos.push({ slug: match[1], name: match[2].trim() });
  }
  return decos;
}

async function scrapeDecorationList(lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/decorations` : `${BASE}/data/decorations`;
  const html = await fetchHtml(url);
  return parseDecorationList(html);
}

function parseDecorationDetail(html) {
  const data = { id: '', name: '', slotLevel: 1, description: '', skills: [], materials: [] };

  const idMatch = html.match(/\/data\/decorations\/([^\/]+)\/?$/);
  if (idMatch) data.id = idMatch[1];

  const nameMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
  if (nameMatch) data.name = nameMatch[1].trim();

  const slotMatch = html.match(/\[(\d+)\]/);
  if (slotMatch) data.slotLevel = parseInt(slotMatch[1], 10);

  const descMatch = html.match(/<blockquote[^>]*>([^<]+)<\/blockquote>/);
  if (descMatch) data.description = descMatch[1].trim();

  const skillRegex = /<a href="\/data\/skills\/([^"]+)">([^<]+)<\/a>/g;
  let skillMatch;
  while ((skillMatch = skillRegex.exec(html)) !== null) {
    data.skills.push({ slug: skillMatch[1], name: skillMatch[2].trim() });
  }

  const matRegex = /<a href="\/data\/items\/([^"]+)">([^<]+)<\/a>/g;
  let matMatch;
  while ((matMatch = matRegex.exec(html)) !== null) {
    data.materials.push({ slug: matMatch[1], name: matMatch[2].trim() });
  }

  return data;
}

async function scrapeDecorationDetail(slug, lang = 'en') {
  const url = lang === 'es' ? `${BASE}/es/data/decorations/${slug}` : `${BASE}/data/decorations/${slug}`;
  const html = await fetchHtml(url);
  return parseDecorationDetail(html);
}

async function main() {
  console.log('Scraping decoration list (EN)...');
  const decosEn = await scrapeDecorationList('en');
  console.log(`Found ${decosEn.length} decorations`);

  console.log('Scraping decoration list (ES)...');
  const decosEs = await scrapeDecorationList('es');
  const esMap = new Map(decosEs.map(d => [d.slug, d.name]));

  const results = [];
  for (let i = 0; i < decosEn.length; i++) {
    const d = decosEn[i];
    console.log(`[${i+1}/${decosEn.length}] Scraping ${d.name}...`);
    try {
      const [detailEn, detailEs] = await Promise.all([
        scrapeDecorationDetail(d.slug, 'en'),
        scrapeDecorationDetail(d.slug, 'es'),
      ]);
      results.push({
        id: detailEn.id || d.slug,
        name: d.name,
        nameEs: esMap.get(d.slug) || d.name,
        slotLevel: detailEn.slotLevel,
        description: detailEn.description,
        descriptionEs: detailEs.description,
        skills: detailEn.skills.map(s => ({ ...s, nameEs: s.name })),
        materials: detailEn.materials.map(m => ({ ...m, nameEs: m.name })),
      });
      await new Promise(r => setTimeout(r, 150));
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'decorations.json'), JSON.stringify(results, null, 2));
  console.log('Done! Saved to wilds_raw/decorations.json');
}

main().catch(console.error);