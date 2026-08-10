// Scrape Materials/Ingredients/Bowgun_Ammo/Special_Item-Other from Fextralife
// and merge (dedup by name) into items_wilds.json.
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const PAGES = ['Materials', 'Ingredients', 'Bowgun_Ammo', 'Special_Item-Other'];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve, reject);
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode !== 200) reject(new Error('HTTP ' + res.statusCode));
        else resolve(data);
      });
    }).on('error', reject);
  });
}

function parseItems(html) {
  const items = [];
  const seen = new Set();
  for (const m of html.matchAll(/<li>\s*<span typeof="mw:File">\s*<a href="\/[^"]+" title="([^"]+)">[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<\/a>/g)) {
    const name = m[1];
    const icon = m[2];
    if (seen.has(name)) continue;
    seen.add(name);
    items.push({ name, icon });
  }
  return items;
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'items_wilds.json'), 'utf8'));
  const byName = new Map(existing.map(it => [it.name, it]));
  let added = 0;

  for (const page of PAGES) {
    console.log('Fetching', page, '...');
    const html = await fetchUrl(`https://monsterhunterwilds.wiki.fextralife.com/${page}`);
    fs.writeFileSync(path.join(OUT_DIR, `${page.toLowerCase()}_raw.html`), html);
    const items = parseItems(html);
    console.log(' ', page, '->', items.length, 'found');
    for (const it of items) {
      if (!byName.has(it.name)) {
        byName.set(it.name, it);
        added++;
      }
    }
  }

  const merged = [...byName.values()];
  fs.writeFileSync(path.join(OUT_DIR, 'items_wilds.json'), JSON.stringify(merged, null, 1));
  console.log('Total items now:', merged.length, '(added', added, 'new)');
}

main().catch(e => { console.error(e); process.exit(1); });
