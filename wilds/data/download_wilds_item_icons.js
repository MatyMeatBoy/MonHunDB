// Download item icons referenced by items_wilds.json into wilds/data/images/items/
// and build an icon manifest mapping item name -> local path.
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const IMG_DIR = path.join(OUT_DIR, 'images', 'items');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => { fs.writeFileSync(dest, Buffer.concat(chunks)); resolve(true); });
    });
    req.setTimeout(20000, () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
  });
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  const items = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'items_wilds.json'), 'utf8'));
  const manifest = {};
  let ok = 0, fail = 0;
  const CONC = 8;
  for (let i = 0; i < items.length; i += CONC) {
    const chunk = items.slice(i, i + CONC);
    await Promise.all(chunk.map(async (it) => {
      const file = slugify(it.name) + '.png';
      const dest = path.join(IMG_DIR, file);
      if (fs.existsSync(dest)) { manifest[it.name] = 'images/items/' + file; ok++; return; }
      try {
        // try the full-size base first, fall back to the 20px thumbnail
        const base = it.icon.replace(/\/thumb\//, '/').replace(/\/\d+px-/, '/');
        await download(base, dest).catch(() => download(it.icon, dest));
        manifest[it.name] = 'images/items/' + file;
        ok++;
      } catch (e) {
        fail++;
        console.log('  FAIL', it.name, e.message);
      }
    }));
  }
  fs.writeFileSync(path.join(OUT_DIR, 'item_icon_manifest.json'), JSON.stringify(manifest, null, 1));
  console.log('downloaded ok:', ok, 'fail:', fail, 'manifest entries:', Object.keys(manifest).length);
}

main().catch(e => { console.error(e); process.exit(1); });
