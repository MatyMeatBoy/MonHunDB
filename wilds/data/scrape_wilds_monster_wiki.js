// Scrape MH Wilds monster info (Elements, Status Effects, Weakest To) from
// monsterhunterwiki.org for each monster page, and merge into monsters.json.
// Only fills the fields Kiranico doesn't provide. Raw HTML cached in wilds/data/monster_wiki_raw/.
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = __dirname;
const RAW_DIR = path.join(OUT_DIR, 'monster_wiki_raw');
if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

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

function slugToWikiTitle(slug) {
  // special names where the wiki uses a parenthesized suffix
  const specials = {
    'high-purrformance-barrel-puncher': 'High_Purrformance_Barrel_Puncher_(MHWilds)',
    'ceratonoth-male': 'Ceratonoth_(MHWilds)',
    'ceratonoth-female': 'Ceratonoth_(MHWilds)',
    'dalthydon-livestock': 'Dalthydon_(MHWilds)',
    'omega-planetes': 'Omega_Planetes_(MHWilds)',
    'omega-micros': 'Omega_Micros_(MHWilds)',
    'guardian-seikret': 'Guardian_Seikret_(MHWilds)',
    'nerscylla-hatchling': 'Nerscylla_Hatchling_(MHWilds)',
  };
  if (specials[slug]) return specials[slug];
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
}

function parseInfobox(html) {
  const info = { elements: [], inflicts: [], weaknesses: [] };
  // Infobox: a <table class="wikitable ..."> whose rows are <th>label</th><td>value</td>.
  // Match each row's label cell, then its value cell.
  const ws = (s) => s.replace(/\s+/g, ' ').trim();
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(x => x[1]);
  const parseCell = (c) => {
    const out = [];
    for (const a of c.matchAll(/<a href="\/wiki\/[^"]*"[^>]*title="([^"]+)"[^>]*>/g)) out.push(a[1]);
    // fallback: element/status named text without link
    return [...new Set(out)];
  };
  for (const row of rows) {
    const thm = row.match(/<th[^>]*>([\s\S]*?)<\/th>/);
    const tdm = row.match(/<td[^>]*>([\s\S]*?)<\/td>/);
    if (!thm || !tdm) continue;
    const label = ws(thm[1]);
    if (label === 'Elements') info.elements = parseCell(tdm[1]);
    else if (label === 'Status Effects') info.inflicts = parseCell(tdm[1]);
    else if (label === 'Weakest To') info.weaknesses = parseCell(tdm[1]);
  }
  return info;
}

async function main() {
  const monsters = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'monsters.json'), 'utf8'));
  const chunks = [];
  const concurrency = 4;
  for (let i = 0; i < monsters.length; i += concurrency) {
    chunks.push(monsters.slice(i, i + concurrency));
  }

  let n = 0;
  for (const chunk of chunks) {
    await Promise.all(chunk.map(async (mon) => {
      const title = slugToWikiTitle(mon.slug);
      const rawFile = path.join(RAW_DIR, mon.slug + '.html');
      let html;
      if (fs.existsSync(rawFile)) {
        html = fs.readFileSync(rawFile, 'utf8');
      } else {
        try {
          html = await fetchUrl('https://monsterhunterwiki.org/wiki/' + title);
          fs.writeFileSync(rawFile, html);
        } catch (e) {
          console.log('  ERR', mon.slug, e.message);
          return;
        }
      }
      const info = parseInfobox(html);
      mon.elements = info.elements;
      mon.inflicts = info.inflicts;
      mon.weaknesses = info.weaknesses;
      n++;
      console.log('  =>', mon.name, '| elements:', info.elements.join(','), '| inflicts:', info.inflicts.join(','), '| weakest:', info.weaknesses.join(','));
    }));
  }

  fs.writeFileSync(path.join(OUT_DIR, 'monsters.json'), JSON.stringify(monsters, null, 1));
  console.log('Done. Filled', n, 'monsters.');
}

main().catch(e => { console.error(e); process.exit(1); });
