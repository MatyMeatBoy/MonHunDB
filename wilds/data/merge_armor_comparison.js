// Merge armor_sets_comparison.json (clean set-level stats+image) into
// armor_sets.json by exact name match. Downloads full-body images locally.
// Does NOT touch the existing "pieces" array (that needs per-set page
// scraping, out of scope here -- some entries have garbled piece names
// from a previous session's scrape, left as-is/documented, not fixed).
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
  return u.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');
}

async function main() {
  const comparison = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'armor_sets_comparison.json'), 'utf8'));
  const existing = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'armor_sets.json'), 'utf8'));
  const byName = new Map(existing.map(s => [s.name, s]));

  const IMG_DIR = path.join(OUT_DIR, 'images', 'armor_sets_full');
  fs.mkdirSync(IMG_DIR, { recursive: true });

  let updated = 0, added = 0, imgOk = 0, imgFail = 0;
  for (const c of comparison) {
    let target = byName.get(c.name);
    if (!target) {
      target = { name: c.name, pieces: [] };
      byName.set(c.name, target);
      added++;
    } else {
      updated++;
    }
    target.rarity = c.rarity;
    target.rank = c.rank;
    target.defense = c.defense;
    target.resistances = c.resistances;
    target.decoSlots = c.decoSlots;
    target.equipmentSkills = c.equipmentSkills;

    const file = slugify(c.name) + '.png';
    const dest = path.join(IMG_DIR, file);
    if (!fs.existsSync(dest)) {
      try {
        await download(fullSizeUrl(c.image), dest).catch(() => download(c.image, dest));
        imgOk++;
      } catch (e) {
        imgFail++;
        continue;
      }
    } else imgOk++;
    target.localImageFull = 'data/images/armor_sets_full/' + file;
  }

  const merged = [...byName.values()];
  fs.writeFileSync(path.join(OUT_DIR, 'armor_sets.json'), JSON.stringify(merged, null, 1));
  console.log('sets total:', merged.length, '(updated', updated, ', added', added, ')');
  console.log('images ok:', imgOk, 'fail:', imgFail);
}

main().catch(e => { console.error(e); process.exit(1); });
