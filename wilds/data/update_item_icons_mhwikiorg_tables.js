// Icon-only update pass for items_wilds.json, from monsterhunterwiki.org's
// real item-catalog subpages (NOT the /Items hub, which is Cloudflare-gated
// -- the hub's "tabs" are actually links to these plain, fully scrapable
// subpages: /Items/Consumables, /Items/Materials, /Items/Ammo_&_Coatings,
// /Items/Facility_Items, /Items/Appraisal_Items, /Items/Account_items).
//
// Per explicit instruction: this does NOT add new items. It only updates
// the `icon` field on items that already exist in items_wilds.json, matched
// by name. Anything scraped that doesn't match an existing item is logged,
// never appended -- the item list itself is considered already complete.
const fs = require('fs');
const path = require('path');
// Reuse Scriperino's cheerio install rather than adding a dependency here.
const cheerio = require('../../../../Apps/claude/scraperino-riperino/node_modules/cheerio');
const { fetchHtml } = require('../../../../Apps/claude/scraperino-riperino/lib/fetch');
const { Cache } = require('../../../../Apps/claude/scraperino-riperino/lib/cache');

const cache = new Cache(path.join(__dirname, '../../../../Apps/claude/scraperino-riperino/.cache'));
const ITEMS_PATH = path.join(__dirname, 'items_wilds.json');
const ICON_DIR = path.join(__dirname, 'images', 'items_mhwikiorg');
fs.mkdirSync(ICON_DIR, { recursive: true });

const PAGES = [
  'MHWilds/Items/Consumables',
  'MHWilds/Items/Materials',
  'MHWilds/Items/Ammo_%26_Coatings',
  'MHWilds/Items/Facility_Items',
  'MHWilds/Items/Appraisal_Items',
  'MHWilds/Items/Account_items',
];

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .trim();
}
function norm(s) {
  return decodeEntities(s)
    .replace(/\s*\(MHWilds\)\s*$/i, '')
    .replace(/\s+\+/, '+')
    .replace(/\s+Plus$/i, '+')
    .trim()
    .toLowerCase();
}
function fullSizeUrl(thumbUrl) {
  const m = thumbUrl.match(/\/images\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+\.png)\//);
  if (m) return `https://monsterhunterwiki.org/images/${m[1]}/${m[2]}/${m[3]}`;
  return thumbUrl.startsWith('http') ? thumbUrl : `https://monsterhunterwiki.org${thumbUrl}`;
}

function downloadFile(url, dest) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

// Extracts {name, icon} from every TOP-LEVEL table.wikitable's first-column
// links (the real catalog rows) -- explicitly excludes nested tables
// (per-item source/detail breakdowns embedded inside a row), which is what
// made the raw <table> count on these pages look 100x too high at first.
function extractCatalogRows(html) {
  const $ = cheerio.load(html);
  const rows = [];
  $('table.wikitable').filter((i, t) => $(t).parents('table').length === 0).each((_, table) => {
    $(table).find('> tbody > tr').each((__, tr) => {
      const firstCell = $(tr).find('> td').first();
      if (!firstCell.length) return;
      const a = firstCell.find('a[title]').first();
      const img = firstCell.find('img').first();
      if (!a.length || !img.length) return;
      rows.push({ name: a.attr('title'), icon: img.attr('src') });
    });
  });
  return rows;
}

async function main() {
  const scraped = new Map(); // norm(name) -> {name, icon}
  for (const page of PAGES) {
    const url = `https://monsterhunterwiki.org/wiki/${page}`;
    let html;
    try {
      html = await fetchHtml(url, { cache });
    } catch (e) {
      console.warn('FAILED', page, e.message);
      continue;
    }
    const rows = extractCatalogRows(html);
    console.log(page, '->', rows.length, 'catalog rows');
    for (const r of rows) if (!scraped.has(norm(r.name))) scraped.set(norm(r.name), r);
  }
  console.log('total unique scraped names:', scraped.size);

  const items = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));
  let updated = 0, alreadyGood = 0, skippedNoMatch = 0;
  const unmatched = [];
  for (const [key, row] of scraped) {
    const match = items.find((it) => norm(it.name) === key);
    if (!match) { unmatched.push(row.name); continue; }
    if (match.icon && match.icon.startsWith('data/images/items_mhwikiorg/')) { alreadyGood++; continue; }
    const fullUrl = fullSizeUrl(row.icon);
    const base = decodeURIComponent(path.basename(fullUrl));
    const dest = path.join(ICON_DIR, base);
    try {
      if (!fs.existsSync(dest)) await downloadFile(fullUrl, dest);
      match.icon = `data/images/items_mhwikiorg/${base}`;
      updated++;
    } catch (e) {
      console.warn('  icon download failed for', match.name, e.message);
    }
  }
  skippedNoMatch = unmatched.length;

  fs.writeFileSync(ITEMS_PATH, JSON.stringify(items, null, 1));
  console.log('DONE. icons updated:', updated, '| already good:', alreadyGood, '| scraped names with no matching item (NOT added):', skippedNoMatch);
  if (unmatched.length) {
    fs.writeFileSync(path.join(__dirname, 'mhwikiorg_unmatched_items.json'), JSON.stringify(unmatched, null, 1));
    console.log('  unmatched list written to wilds/data/mhwikiorg_unmatched_items.json for review');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
