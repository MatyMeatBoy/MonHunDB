// Scrape each MH Wilds armor set page from Fextralife: set image, derived monster,
// elements, materials, skills, set bonus, and 5 pieces (name, defense, res, slots).
// Caches raw HTML in wilds/data/armor_sets_raw/ and resumes if re-run.
// Output: wilds/data/armor_sets.json
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const RAW_DIR = path.join(OUT_DIR, 'armor_sets_raw');
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        fetchUrl(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    });
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

function parseSetPage(html, title) {
  const out = { name: title };
  // set image: first <img class="mw-file-element" ... src=".../250px-...png"> whose alt mentions "set"
  const imgM = html.match(/<img[^>]*alt="([^"]*set[^"]*)"[^>]*src="([^"]+)"/i) ||
               html.match(/<img[^>]*src="([^"]+\/(?:[A-Za-z0-9_%-]+)-?set[^"]*\.png)"/i);
  if (imgM) {
    const raw = imgM[2] || imgM[1];
    out.image = raw.replace(/\/thumb\//, '/').replace(/\/\d+px-/, '/');
  }
  // Derived from / Stronger Element / Weakest Element
  const derivedM = html.match(/Derived from ([A-Za-z ]+?) monster/i);
  if (derivedM) out.derivedFrom = clean(derivedM[1]);
  const strongerM = html.match(/Stronger Element\s*:\s*([A-Za-z]+)/i);
  if (strongerM) out.strongerElement = strongerM[1];
  const weakestM = html.match(/Weakest Element\s*:\s*([A-Za-z]+)/i);
  if (weakestM) out.weakestElement = weakestM[1];
  // materials list between "crafted using the following Materials :" and "Equipment Skills"
  const matM = html.match(/following Materials\s*:([\s\S]*?)Equipment Skills/i);
  if (matM) {
    out.materials = [...matM[1].matchAll(/>([A-Za-z][A-Za-z '+-]+?) x(\d+)<\/?/g)].map(x => ({ material: clean(x[1]), qty: parseInt(x[2]) }));
    if (!out.materials.length) {
      // fallback: text tokens "Name xN"
      const txt = clean(matM[1]);
      const toks = [...txt.matchAll(/([A-Za-z][A-Za-z '+\-]+?) (?:x(\d+))/g)].map(x => ({ material: clean(x[1]), qty: parseInt(x[2]) }));
      out.materials = toks;
    }
  }
  // equipment skills
  const skillsM = html.match(/Equipment Skills([\s\S]*?)Set Bonus Skills/i);
  if (skillsM) {
    out.equipmentSkills = [...skillsM[1].matchAll(/([A-Za-z][A-Za-z '&+\-]+?) Lv(\d+)/g)].map(x => ({ name: clean(x[1]), level: parseInt(x[2]) }));
  }
  // set bonus
  const bonusM = html.match(/Set Bonus Skills([\s\S]*?)Groups Skills/i);
  if (bonusM) {
    out.setBonus = [...bonusM[1].matchAll(/([A-Za-z][A-Za-z '&+\-]+?) (?:x|Lv)(\d+)/g)].map(x => ({ name: clean(x[1]), threshold: parseInt(x[2]) }));
  }
  // pieces: table after "is comprised of 5 pieces" or "Set Pieces"
  // Pattern: Piece & Icon {Name} {Defense} {Fire} {Water} {Thunder} {Ice} {Dragon}
  // Use text extraction instead of table parsing
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').replace(/&amp;/g, '&');
  const piecesIdx = txt.search(/Piece\s*&?\s*Icon\s*(?:G\s*)?([A-Z][a-z]+)\s+(\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/i);
  if (piecesIdx >= 0) {
    const pieceRe = /\b([A-Z][A-Za-z0-9 '&-]+?)\s+(Alpha|Beta|Gamma)?\s+(\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/g;
    let pm;
    const pieceNames = new Set();
    // Restrict to the area after "Piece & Icon" and before next h2/h1 or end of content
    const section = txt.slice(piecesIdx, piecesIdx + 10000);
    while ((pm = pieceRe.exec(section))) {
      let name = pm[1].trim();
      if (pieceNames.has(name)) continue;
      pieceNames.add(name);
      const def = parseInt(pm[3]) || 0;
      pieces.push({
        name,
        defense: def,
        res: {
          fire: parseInt(pm[4]) || 0,
          water: parseInt(pm[5]) || 0,
          thunder: parseInt(pm[6]) || 0,
          ice: parseInt(pm[7]) || 0,
          dragon: parseInt(pm[8]) || 0,
        },
        slots: [],
      });
    }
    // dedupe and limit to 5 pieces per set
    if (pieces.length > 5) pieces.splice(5);
  }
  }
  out.pieces = pieces;
  return out;
}

async function main() {
  const list = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'armor_set_list.json'), 'utf8'));
  const results = [];
  let i = 0;
  for (const s of list) {
    const slug = s.href;
    const rawFile = path.join(RAW_DIR, slug + '.html');
    let html;
    if (fs.existsSync(rawFile)) {
      html = fs.readFileSync(rawFile, 'utf8');
    } else {
      try {
        html = await fetchUrl(s.url);
        fs.writeFileSync(rawFile, html);
      } catch (e) {
        console.log('  ERR', s.title, e.message);
        continue;
      }
    }
    const parsed = parseSetPage(html, s.title);
    parsed.url = s.url;
    results.push(parsed);
    i++;
    if (i % 20 === 0) console.log('  ' + i + '/' + list.length, s.title);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'armor_sets.json'), JSON.stringify(results, null, 1));
  console.log('Done:', results.length, 'sets');
  const withImg = results.filter(r => r.image).length;
  const withPieces = results.filter(r => r.pieces && r.pieces.length).length;
  console.log('con imagen:', withImg, '| con piezas:', withPieces);
}

main().catch(e => { console.error(e); process.exit(1); });
