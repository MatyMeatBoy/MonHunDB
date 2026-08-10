// Match decoIcons/skillIcons (from Fextralife Decorations page) against our
// decorations.json / skills.json exact names, download, build manifests.
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
function normDeco(name) {
  return name.replace(/[\[\]]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}
function fullSizeUrl(u) {
  return u.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '').replace(/(_\d+px)(\.\w+)$/, '$2');
}

async function main() {
  const decoIcons = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'decoration_icon_urls.json'), 'utf8'));
  const skillIconUrls = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'skill_icon_urls.json'), 'utf8'));
  const decorations = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'decorations.json'), 'utf8'));
  const skills = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'skills.json'), 'utf8'));

  const decoByNorm = new Map();
  for (const [name, icon] of Object.entries(decoIcons)) decoByNorm.set(normDeco(name), icon);

  const DECO_DIR = path.join(OUT_DIR, 'images', 'decorations');
  const SKILL_DIR = path.join(OUT_DIR, 'images', 'skills');
  fs.mkdirSync(DECO_DIR, { recursive: true });
  fs.mkdirSync(SKILL_DIR, { recursive: true });

  const decoManifest = {};
  let decoHit = 0;
  for (const dec of decorations) {
    const icon = decoByNorm.get(normDeco(dec.name));
    if (!icon) continue;
    const file = slugify(dec.name) + '.png';
    const dest = path.join(DECO_DIR, file);
    if (!fs.existsSync(dest)) {
      try { await download(fullSizeUrl(icon), dest).catch(() => download(icon, dest)); }
      catch (e) { console.log('  deco FAIL', dec.name, e.message); continue; }
    }
    decoManifest[dec.name] = 'images/decorations/' + file;
    decoHit++;
  }
  fs.writeFileSync(path.join(OUT_DIR, 'decoration_icon_manifest.json'), JSON.stringify(decoManifest, null, 1));
  console.log('decorations matched:', decoHit, '/', decorations.length);

  const skillManifest = {};
  let skillHit = 0;
  const skillNames = new Set(skills.map(s => s.name));
  for (const [name, icon] of Object.entries(skillIconUrls)) {
    if (!skillNames.has(name)) continue;
    const file = slugify(name) + '.png';
    const dest = path.join(SKILL_DIR, file);
    if (!fs.existsSync(dest)) {
      try { await download(fullSizeUrl(icon), dest).catch(() => download(icon, dest)); }
      catch (e) { console.log('  skill FAIL', name, e.message); continue; }
    }
    skillManifest[name] = 'images/skills/' + file;
    skillHit++;
  }
  fs.writeFileSync(path.join(OUT_DIR, 'skill_icon_manifest.json'), JSON.stringify(skillManifest, null, 1));
  console.log('skills matched:', skillHit, '/', skills.length, '(from', Object.keys(skillIconUrls).length, 'scraped)');
}

main().catch(e => { console.error(e); process.exit(1); });
