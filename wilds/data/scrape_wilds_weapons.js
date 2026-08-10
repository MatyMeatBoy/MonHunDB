// Scrape MH Wilds weapons list from Kiranico.
// Output: wilds/data/weapons.json
const https = require('https');
const fs = require('fs');
const path = require('path');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); get(res.headers.location).then(resolve, reject); return;
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching weapons list...');
  const html = await get('https://mhwilds.kiranico.com/data/weapons');
  fs.writeFileSync(path.join(__dirname, 'weapons_raw.html'), html);

  // Parse table rows: <td><a href="/data/weapons/slug"><span>Name</span></a></td><td>...</td>
  const weapons = [];
  const rowRe = /<tr[^>]*>[\s\S]*?<a[^>]*href="\/data\/weapons\/([^"]+)"[^>]*>[\s\S]*?(?:<span[^>]*>)?([^<]+)(?:<\/span>)?<\/a>/gi;
  let m;
  const seen = new Set();
  while ((m = rowRe.exec(html))) {
    const slug = m[1];
    const name = m[2].replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
    if (!name || seen.has(slug)) continue;
    seen.add(slug);
    weapons.push({ id: slug, name, nameEs: '', type: '', attack: 0, rarity: 0, element: null, materials: [], icon: '' });
  }

  console.log('weapons:', weapons.length);
  fs.writeFileSync(path.join(__dirname, 'weapons.json'), JSON.stringify(weapons, null, 1));
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
