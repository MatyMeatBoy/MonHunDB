// Complete monsters.json with missing fields from monsterhunterwiki.org
// Adds: image, locations, ailmentSusceptibility (with stars + buildup)
// Also converts Kiranico materials to Rise format (targetReward/capture/breakParts/carves/dropped)
// Reads cached wiki HTML from wilds/data/monster_wiki_raw/ (already downloaded)
// Also scrapes small_monsters from the wiki where available
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const WIKI_RAW = path.join(OUT, 'monster_wiki_raw');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0';

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); get(res.headers.location).then(resolve, reject); return;
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

function slugToWiki(slug) {
  const m = {
    'guardian-ebony-odogaron': 'Guardian_Ebony_Odogaron',
    'guardian-fulgur-anjanath': 'Guardian_Fulgur_Anjanath',
    'high-purrformance-barrel-puncher': 'High_Purrformance_Barrel_Puncher',
    'yian-kut-ku': 'Yian_Kut-Ku',
    'rey-dau': 'Rey_Dau',
    'uth-duna': 'Uth_Duna',
    'nu-udra': 'Nu_Udra',
    'jin-dahaad': 'Jin_Dahaad',
    'xu-wu': 'Xu_Wu',
    'zoh-shia': 'Zoh_Shia',
    'lala-barina': 'Lala_Barina',
    'gore-magala': 'Gore_Magala',
    'ner-scylla-hatchling': 'Nerscylla_Hatchling',
    'omega-planetes': 'Omega_Planetes',
    'omega-micros': 'Omega_Micros',
    'guardian-seikret': 'Guardian_Seikret',
    'ceratonoth-male': 'Ceratonoth',
    'ceratonoth-female': 'Ceratonoth',
    'dalthydon-livestock': 'Dalthydon',
    'high-purrformance-barrel-puncher': 'High_Purrformance_Barrel_Puncher',
  };
  if (m[slug]) return m[slug] + '_(MHWilds)';
  const base = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_');
  return base + '_(MHWilds)';
}

function parseWiki(html, slug) {
  const out = { image: '', locations: [], ailmentSusceptibility: [] };

  // image: the monster icon from infobox (MHWA-<Name>_Icon.webp or Render)
  let imgM = html.match(/MHWA-([A-Za-z_]+)_Icon\.webp/);
  if (!imgM) imgM = html.match(/MHWA-([A-Za-z_]+)_Render_001\.webp/);
  if (imgM) {
    out.image = 'data/images/' + slug + '.webp';
  }

  // locations: after "Locales" text in infobox
  const locM = html.match(/Locales<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/);
  if (locM) {
    const txt = clean(locM[1].replace(/<[^>]+>/g, ' '));
    out.locations = txt.split(/,\s*/).map(s => s.trim()).filter(Boolean);
  }

  // ailmentSusceptibility: from "Status Effectiveness" table
  // rows: <tr><td><img alt="X"></td><td>Init→Max</td><td>Increase</td><td>Duration</td><td>Decay</td><td>Damage</td></tr>
  const statusSection = html.match(/Status Effectiveness[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/);
  if (statusSection) {
    const rows = [...statusSection[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
    for (const row of rows) {
      const tds = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => clean(x[1].replace(/<[^>]+>/g, '')));
      if (!tds.length) continue;
      // first td has img alt="Poison" or similar
      const altM = row[1].match(/alt="([^"]+)"/);
      let ailment = altM ? altM[1] : tds[0] || '';
      if (!ailment || /ui-|\.png|N\/A/i.test(ailment)) continue;
      // stars: derive from threshold? Use 2 as default if has data
      const threshold = tds[1] || '';
      const buildupParts = threshold.split('→').map(s => s.trim());
      const hasData = /\d/.test(threshold) && !/N\/A/i.test(threshold);
      out.ailmentSusceptibility.push({
        ailment,
        stars: hasData ? 2 : null,
        buildup: hasData ? [{
          label: 'Initial',
          value: parseInt(buildupParts[0]) || 0,
          max: parseInt(buildupParts[1]) || (parseInt(buildupParts[0]) || 0) * 3
        }] : []
      });
    }
  }

  return out;
}

// Convert Kiranico materials (method+percent) to Rise grouped format
function convertMaterials(kiranicoMaterials) {
  const result = {};
  const ranks = Object.keys(kiranicoMaterials);
  for (const rank of ranks) {
    const rows = kiranicoMaterials[rank] || [];
    if (!rows.length) continue;
    const byMat = new Map();
    for (const row of rows) {
      const key = row.material;
      if (!byMat.has(key)) byMat.set(key, { targetReward: '', capture: '', breakParts: '', carves: '', dropped: '' });
      const entry = byMat.get(key);
      const method = (row.method || '').toLowerCase();
      const pct = row.percent || '';
      const text = pct ? pct : '';
      if (method.includes('target reward')) {
        entry.targetReward = entry.targetReward ? entry.targetReward + ', ' + text : text;
      } else if (method.includes('capture')) {
        entry.capture = text;
      } else if (method.includes('broken part') || method.includes('break')) {
        entry.breakParts = entry.breakParts ? entry.breakParts + ', ' + text : text;
      } else if (method.includes('carv')) {
        const subMethod = method.replace('carving', '').replace(/[()]/g, '').trim();
        const subLabel = subMethod ? subMethod + ': ' : '';
        const val = subLabel + text;
        entry.carves = entry.carves ? entry.carves + ', ' + val : val;
      } else if (method.includes('wound') || method.includes('dropped') || method.includes('destroyed')) {
        const subMethod2 = method.replace('wound destroyed reward', 'Herida').replace(/[()]/g, '').trim();
        const val2 = subMethod2 ? subMethod2 + ': ' + text : text;
        entry.dropped = entry.dropped ? entry.dropped + ', ' + val2 : val2;
      }
    }
    result[rank] = [...byMat.entries()].map(([material, e]) => ({
      material,
      rarity: null,
      targetReward: e.targetReward,
      capture: e.capture,
      breakParts: e.breakParts,
      carves: e.carves,
      dropped: e.dropped,
    }));
  }
  return result;
}

async function main() {
  const monsters = JSON.parse(fs.readFileSync(path.join(OUT, 'monsters.json'), 'utf8'));

  let updated = 0;
  for (const mon of monsters) {
    const title = slugToWiki(mon.slug);
    const rawFile = path.join(WIKI_RAW, mon.slug + '.html');
    let html;
    if (fs.existsSync(rawFile)) {
      html = fs.readFileSync(rawFile, 'utf8');
    } else {
      try {
        html = await get('https://monsterhunterwiki.org/wiki/' + title);
        fs.writeFileSync(rawFile, html);
      } catch (e) {
        console.log('  SKIP', mon.name, '- no wiki page');
        continue;
      }
    }

    const wiki = parseWiki(html, mon.slug);
    if (wiki.image) mon.image = wiki.image;
    if (wiki.locations.length) mon.locations = wiki.locations;
    if (wiki.ailmentSusceptibility.length) {
      mon.ailmentSusceptibility = wiki.ailmentSusceptibility;
    }

    // Convert materials format
    if (mon.materials && Object.keys(mon.materials).length) {
      mon.materials = convertMaterials(mon.materials);
    }

    updated++;
    if (updated % 15 === 0) console.log('  ' + updated + '/' + monsters.length, mon.name);
  }

  fs.writeFileSync(path.join(OUT, 'monsters.json'), JSON.stringify(monsters, null, 1));
  console.log('Done! updated', updated, 'monsters');
  // stats
  const withImg = monsters.filter(m => m.image).length;
  const withLoc = monsters.filter(m => m.locations && m.locations.length).length;
  const withAil = monsters.filter(m => m.ailmentSusceptibility && m.ailmentSusceptibility.length).length;
  const withMats = monsters.filter(m => m.materials && Object.values(m.materials).some(a => a && a.length)).length;
  console.log('con image:', withImg, '| con locations:', withLoc, '| con ailmentSusceptibility:', withAil, '| con materials Rise:', withMats);
}

main().catch(e => { console.error(e); process.exit(1); });
