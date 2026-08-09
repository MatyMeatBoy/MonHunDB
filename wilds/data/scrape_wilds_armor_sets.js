// Scrape MH Wilds armor sets from Fextralife.
// Step 1: extract the list of set page URLs from the Armor index page.
// Output: wilds/data/armor_set_list.json
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
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

function extractSetUrls(html) {
  const urls = [];
  const seen = new Set();
  // links to individual set pages: /<Name>_Set, /<Name>_Alpha_Set, /<Name>_Beta_Set, /<Name>_Gamma_Set, plus base LR sets
  for (const m of html.matchAll(/href="\/([A-Za-z0-9_%'-]+_Set)"\s+title="([^"]+)"/g)) {
    const href = m[1];
    const title = m[2];
    if (seen.has(href)) continue;
    seen.add(href);
    urls.push({ href, title, url: 'https://monsterhunterwilds.wiki.fextralife.com/' + href });
  }
  return urls;
}

async function main() {
  console.log('Fetching Armor index...');
  const html = await fetchUrl('https://monsterhunterwilds.wiki.fextralife.com/Armor');
  fs.writeFileSync(path.join(OUT_DIR, 'armor_raw.html'), html);
  const sets = extractSetUrls(html);
  fs.writeFileSync(path.join(OUT_DIR, 'armor_set_list.json'), JSON.stringify(sets, null, 1));
  console.log('set urls:', sets.length);
  console.log(sets.map(s => s.title).join(' | '));
}

main().catch(e => { console.error(e); process.exit(1); });
