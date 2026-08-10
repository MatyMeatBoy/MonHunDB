// Sources ALL Wilds item icons from monsterhunterwiki.org's individual item
// detail pages (https://monsterhunterwiki.org/wiki/<Name>_(MHWilds)) per the
// user's request, and expands items_wilds.json with any item Kiranico knows
// about that this project doesn't have yet (adds, never replaces/removes).
//
// Note: monsterhunterwiki.org/wiki/MHWilds/Items (the category INDEX page)
// is behind a Cloudflare JS challenge and returns only a ~29KB shell to a
// plain HTTP client -- confirmed by hand, not something to try to defeat.
// Individual item detail pages are NOT gated (verified against several),
// so this scrapes those instead: same source domain/icon set, no bot-
// detection to fight.
const fs = require('fs');
const path = require('path');
const https = require('https');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const DATA_DIR = __dirname;
const ICON_DIR = path.join(DATA_DIR, 'images', 'items_mhwikiorg');
fs.mkdirSync(ICON_DIR, { recursive: true });

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode === 404) { resolve(null); return; }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => (res.statusCode === 200 ? resolve(data) : reject(new Error('HTTP ' + res.statusCode))));
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error('HTTP ' + res.statusCode)); return; }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function wikiUrl(name) {
  const slug = name.replace(/ /g, '_');
  return `https://monsterhunterwiki.org/wiki/${encodeURIComponent(slug).replace(/%2F/g, '/')}_(MHWilds)`;
}

// First <img> after the two Ornament_Script.png banner occurrences is the
// item's own icon (full-size, not the 24px thumb -- higher resolution).
function extractIconUrl(html) {
  const imgs = [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  const real = imgs.find((u) => !/Ornament_Script|wikilogo|licenses|poweredby/.test(u));
  if (!real) return null;
  // thumb URLs look like /images/thumb/X/YY/Name.png/24px-Name.png.webp --
  // the full-size original is /images/X/YY/Name.png
  const m = real.match(/\/images\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+\.png)\//);
  if (m) return `https://monsterhunterwiki.org/images/${m[1]}/${m[2]}/${m[3]}`;
  return real.startsWith('http') ? real : `https://monsterhunterwiki.org${real}`;
}

async function main() {
  const kiranicoItems = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../../../../Apps/claude/scraperino-riperino/Riperino/wilds/items.json'), 'utf8'));
  const projectPath = path.join(DATA_DIR, 'items_wilds.json');
  const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  const byNameLower = new Map(project.map((it) => [it.name.trim().toLowerCase(), it]));

  const names = [...new Set(kiranicoItems.filter((k) => k.en).map((k) => k.en.name))];
  console.log('candidate item names from Kiranico:', names.length);

  let added = 0, iconOk = 0, iconFail = 0, notFound = 0;
  let i = 0;
  for (const name of names) {
    i++;
    let entry = byNameLower.get(name.trim().toLowerCase());
    if (!entry) {
      entry = { name };
      project.push(entry);
      byNameLower.set(name.trim().toLowerCase(), entry);
      added++;
    }
    try {
      const html = await fetchUrl(wikiUrl(name));
      if (!html) { notFound++; continue; }
      const iconUrl = extractIconUrl(html);
      if (!iconUrl) { iconFail++; continue; }
      const base = decodeURIComponent(path.basename(iconUrl));
      const dest = path.join(ICON_DIR, base);
      if (!fs.existsSync(dest)) await downloadFile(iconUrl, dest);
      entry.icon = `data/images/items_mhwikiorg/${base}`;
      iconOk++;
    } catch (e) {
      iconFail++;
    }
    if (i % 25 === 0) console.log(`  ${i}/${names.length} (added ${added}, icons ${iconOk}, notFound ${notFound}, fail ${iconFail})`);
    await sleep(120);
  }

  fs.writeFileSync(projectPath, JSON.stringify(project, null, 1));
  console.log('DONE. total items:', project.length, '| added:', added, '| icons set:', iconOk, '| not found on wiki:', notFound, '| icon fetch failed:', iconFail);
}

main().catch((e) => { console.error(e); process.exit(1); });
