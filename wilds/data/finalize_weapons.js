// Download weapon icons from weapons_fextralife.json, write final weapons.json
// with local icon paths (data/images/weapons_fextra/<id>.png).
const https = require('https');
const fs = require('fs');
const path = require('path');
const OUT_DIR = __dirname;
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
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}
function fullSizeUrl(u) {
  return u.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');
}

async function main() {
  const weapons = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'weapons_fextralife.json'), 'utf8'));
  const IMG_DIR = path.join(OUT_DIR, 'images', 'weapons_fextra');
  fs.mkdirSync(IMG_DIR, { recursive: true });

  let ok = 0, fail = 0;
  const CONC = 10;
  for (let i = 0; i < weapons.length; i += CONC) {
    const chunk = weapons.slice(i, i + CONC);
    await Promise.all(chunk.map(async (w) => {
      const file = w.id + '.png';
      const dest = path.join(IMG_DIR, file);
      if (fs.existsSync(dest)) { w.icon = 'data/images/weapons_fextra/' + file; ok++; return; }
      try {
        await download(fullSizeUrl(w.icon), dest).catch(() => download(w.icon, dest));
        w.icon = 'data/images/weapons_fextra/' + file;
        ok++;
      } catch (e) {
        fail++;
        w.icon = null;
      }
    }));
    process.stdout.write(`\r${Math.min(i + CONC, weapons.length)}/${weapons.length}`);
  }
  console.log('');
  fs.writeFileSync(path.join(OUT_DIR, 'weapons.json'), JSON.stringify(weapons, null, 1));
  console.log('done. ok:', ok, 'fail:', fail);
}

main().catch(e => { console.error(e); process.exit(1); });
