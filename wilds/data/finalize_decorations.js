// Download decoration icons (361/361 matched) + enrich decorations.json with
// rarity + sources (how to obtain) from monsterhunterwiki.org.
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
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function fullSizeUrl(u) {
  // monsterhunterwiki.org thumb pattern: images/thumb/X/YY/File.webp/24px-File.webp -> images/X/YY/File.webp
  return u.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');
}

async function main() {
  const wiki = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'mhwikiorg_decoration_data.json'), 'utf8'));
  const decorations = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'decorations.json'), 'utf8'));
  const IMG_DIR = path.join(OUT_DIR, 'images', 'decorations');
  fs.mkdirSync(IMG_DIR, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'decoration_icon_manifest.json'), 'utf8'));
  let ok = 0, fail = 0, enriched = 0;
  const CONC = 10;
  const entries = Object.entries(wiki);
  for (let i = 0; i < entries.length; i += CONC) {
    const chunk = entries.slice(i, i + CONC);
    await Promise.all(chunk.map(async ([name, d]) => {
      if (d.icon) {
        const file = slugify(name) + '.png';
        const dest = path.join(IMG_DIR, file);
        if (!fs.existsSync(dest)) {
          try {
            await download(fullSizeUrl(d.icon), dest).catch(() => download(d.icon, dest));
          } catch (e) { fail++; return; }
        }
        manifest[name] = 'images/decorations/' + file;
        ok++;
      }
    }));
  }

  for (const dec of decorations) {
    const d = wiki[dec.name];
    if (!d) continue;
    if (d.rarity && !dec.rarity) dec.rarity = d.rarity;
    if (d.sources) { dec.sources = d.sources; enriched++; }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'decoration_icon_manifest.json'), JSON.stringify(manifest, null, 1));
  fs.writeFileSync(path.join(OUT_DIR, 'decorations.json'), JSON.stringify(decorations, null, 1));
  console.log('icons ok:', ok, 'fail:', fail, 'manifest total:', Object.keys(manifest).length);
  console.log('decorations enriched with sources:', enriched);
}

main().catch(e => { console.error(e); process.exit(1); });
