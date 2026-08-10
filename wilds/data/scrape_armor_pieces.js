// Fetch each armor set's individual Fextralife page and parse its 5 pieces
// (name, icon, part, defense, decoSlots, resistances). Builds armor_pieces.json.
// Rate-limited (small concurrency) since this hits 159 pages.
const https = require('https');
const fs = require('fs');
const path = require('path');
const OUT_DIR = __dirname;
const RAW_DIR = path.join(OUT_DIR, 'armor_set_pages_raw');
fs.mkdirSync(RAW_DIR, { recursive: true });
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

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const PART_ORDER = ['head', 'chest', 'arms', 'waist', 'legs'];

function parseSetPage(html) {
  // split on every "Piece & Icon"-style column header cell too -- it has no
  // anchor+img right after so nameMatch naturally fails and gets skipped;
  // part is assigned by ORDER AMONG SUCCESSFUL matches, not raw block index
  // (block 0 is consistently the header, not a piece)
  const pieceBlocks = html.split(/<tr>\s*<td colspan="5"[^>]*><h4[^>]*id="/).slice(1);
  const pieces = [];
  for (const block of pieceBlocks) {
    const nameMatch = block.match(/^[^"]+"[\s\S]{0,400}?<a href="\/[^"]+" title="([^"]+)"><img[^>]*src="([^"]+)"/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const icon = nameMatch[2];
    const cells7 = (block.match(/<td[\s\S]*?<\/td>/g) || []);
    const defense = Number(stripTags(cells7[0] || '')) || 0;
    const slotSizes = [...(cells7[1] || '').matchAll(/(\d+)_slots_armor/g)].map(m => Number(m[1]));
    const nums = cells7.slice(2, 7).map(c => Number(stripTags(c).replace(/[^\d.-]/g, '')) || 0);
    const [fire = 0, water = 0, thunder = 0, ice = 0, dragon = 0] = nums;
    if (pieces.length >= 5) continue; // safety cap, some pages list a 6th cosmetic/layered row
    pieces.push({
      name, icon, part: PART_ORDER[pieces.length] || null, defense, decoSlots: slotSizes,
      resistances: { fire, water, thunder, ice, dragon },
    });
  }
  return pieces;
}

async function main() {
  const sets = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'armor_sets.json'), 'utf8'));
  const CONC = 5;
  let done = 0, failCount = 0;
  for (let i = 0; i < sets.length; i += CONC) {
    const chunk = sets.slice(i, i + CONC);
    await Promise.all(chunk.map(async (s) => {
      if (!s.url) return;
      const file = path.join(RAW_DIR, s.name.replace(/[^a-zA-Z0-9]+/g, '_') + '.html');
      let html;
      if (fs.existsSync(file)) {
        html = fs.readFileSync(file, 'utf8');
      } else {
        try {
          html = await fetchUrl(s.url);
          fs.writeFileSync(file, html);
        } catch (e) {
          failCount++;
          return;
        }
      }
      const pieces = parseSetPage(html);
      if (pieces.length) s.pieces = pieces;
      done++;
    }));
    process.stdout.write(`\r${Math.min(i + CONC, sets.length)}/${sets.length}`);
  }
  console.log('');
  fs.writeFileSync(path.join(OUT_DIR, 'armor_sets.json'), JSON.stringify(sets, null, 1));
  console.log('done:', done, 'fail:', failCount);
  console.log('sample:', JSON.stringify(sets.find(s => s.pieces && s.pieces.length === 5 && s.pieces[0].part), null, 1));
}

main().catch(e => { console.error(e); process.exit(1); });
