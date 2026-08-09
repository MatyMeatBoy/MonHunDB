// Scrape all MH Wilds items (name + icon URL) from the Fextralife Items page.
// Output: wilds/data/items_wilds.json  [{ name, icon }]  (+ items_raw for reference)
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

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
  // each <li> has <a href="/Name" title="Name"><img src="...icon..."></a>
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
  console.log('Fetching Items page...');
  const html = await fetchUrl('https://monsterhunterwilds.wiki.fextralife.com/Items');
  fs.writeFileSync(path.join(OUT_DIR, 'items_raw.html'), html);
  const items = parseItems(html);
  fs.writeFileSync(path.join(OUT_DIR, 'items_wilds.json'), JSON.stringify(items, null, 1));
  console.log('items:', items.length);
  console.log('sample:', JSON.stringify(items.slice(0, 5), null, 1));
  // also derive icon manifest: name -> local path key (downloaded later by the integrator)
}

main().catch(e => { console.error(e); process.exit(1); });
