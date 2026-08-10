// Complete monsters.json using MediaWiki API wikitext
// Extracts: image, locations, ailmentSusceptibility (stars+buildUp), materials (Rise format)
// Uses https://monsterhunterwiki.org/api.php?action=parse&page=Name_(MHWilds)&prop=wikitext
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const WIKI_RAW = path.join(OUT, 'monster_wiki_raw');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0';

function apiGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

function slugToWikiTitle(slug) {
  const m = {
    'guardian-ebony-odogaron': 'Guardian_Ebony_Odogaron',
    'guardian-fulgur-anjanath': 'Guardian_Fulgur_Anjanath',
    'yian-kut-ku': 'Yian_Kut-Ku', 'rey-dau': 'Rey_Dau', 'uth-duna': 'Uth_Duna',
    'nu-udra': 'Nu_Udra', 'jin-dahaad': 'Jin_Dahaad', 'xu-wu': 'Xu_Wu',
    'zoh-shia': 'Zoh_Shia', 'lala-barina': 'Lala_Barina', 'gore-magala': 'Gore_Magala',
    'nerscylla-hatchling': 'Nerscylla_Hatchling',
    'omega-planetes': 'Omega_Planetes', 'omega-micros': 'Omega_Micros',
    'guardian-seikret': 'Guardian_Seikret',
    'ceratonoth-male': 'Ceratonoth', 'ceratonoth-female': 'Ceratonoth',
    'dalthydon-livestock': 'Dalthydon',
    'high-purrformance-barrel-puncher': 'High_Purrformance_Barrel_Puncher',
  };
  if (m[slug]) return m[slug] + '_(MHWilds)';
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('_') + '_(MHWilds)';
}

function parseWikitext(w, slug) {
  const out = { image: '', locations: [], ailmentSusceptibility: [], materials: {} };

  // image: Icon=... or Image=...
  let icon = (w.match(/\|Icon\s*=\s*([^\|\n]+)/) || [])[1];
  let img = (w.match(/\|Image\s*=\s*([^\|\n]+)/) || [])[1];
  if (icon) out.image = 'data/images/' + slug + '.webp';
  else if (img) out.image = img.trim();
  // also MetaImage
  const metaImg = (w.match(/\|MetaImage\s*=\s*File:([^\|\n]+)/) || [])[1];
  if (!out.image && metaImg) out.image = metaImg.trim();

  // locations: |Locales = [[A]], [[B]]
  const locM = w.match(/\|Locales\s*=\s*([^\|\n]+)/);
  if (locM) {
    out.locations = [...locM[1].matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(x => x[1].trim()).filter(Boolean);
  }

  // ailmentSusceptibility from MHWIStatusData template
  const statusBlock = w.match(/MHWIStatusData([\s\S]*?)(?:==|$)/);
  if (statusBlock) {
    const block = statusBlock[1];
    const ailNames = ['Poison','Paralysis','Sleep','Blast','Stun','Exhaust','Mount','Elderseal'];
    for (const ail of ailNames) {
      const thresholdM = block.match(new RegExp('\\|' + ail + ' Threshold\\s*=\\s*([^\\|\\n]+)'));
      const starM = block.match(new RegExp('\\|' + ail + ' ★ number\\s*=\\s*([^\\|\\n]+)'));
      if (!thresholdM) continue;
      const threshold = thresholdM[1].trim();
      if (/N\/A/i.test(threshold) || !threshold) continue;
      const parts = threshold.split('→').map(s => s.trim());
      const stars = starM ? starM[1].trim() : '';
      out.ailmentSusceptibility.push({
        ailment: ail,
        stars: stars.includes('★') ? stars.split('★').length - 1 : (/\d/.test(threshold) ? 2 : null),
        buildup: /\d/.test(parts[0] || '') ? [{ label: 'Initial', value: parseInt(parts[0]) || 0, max: parseInt(parts[1]) || 0 }] : []
      });
    }
  }

  // materials from Drop Rates section (wikitext tables with GenericItemLink)
  const dropSection = w.match(/Drop Rates[\s\S]*?(?:==|$)/);
  if (dropSection) {
    const drops = dropSection[0];
    // each table row: |{{GenericItemLink|MHWilds|Item Name|Type|Color}} |Chance%
    // rank is in the tabber: |-| High Rank =  or |-| Low Rank =
    let currentRank = 'High Rank';
    const rankM = drops.match(/- Rank\s*=/g);
    const rows = [...drops.matchAll(/\{\{GenericItemLink\|MHWilds\|([^|]+)\|([^|}]*)\|([^|}]*)\}\}\s*\|\|\s*([^\n|]+)/g)];
    if (rows.length) {
      // try to detect rank sections
      const sections = drops.split(/- Rank\s*=/);
      for (const sec of sections) {
        const rankLabel = (sec.match(/^\s*([\w\s]+)/) || [])[1] || '';
        if (/High/i.test(rankLabel)) currentRank = 'High Rank';
        else if (/Low/i.test(rankLabel)) currentRank = 'Low Rank';
        else if (/Master/i.test(rankLabel)) currentRank = 'Master Rank';
        if (!out.materials[currentRank]) out.materials[currentRank] = [];
        const secRows = [...sec.matchAll(/\{\{GenericItemLink\|MHWilds\|([^|]+)\|([^|}]*)\|([^|}]*)\}\}\s*\|\|\s*([^\n|]+)/g)];
        for (const r of secRows) {
          const name = r[1].trim();
          if (!name) continue;
          let pct = r[4].trim();
          // guess method from table header context
          const context = sec.slice(0, sec.indexOf(r[0])).slice(-300);
          let method = '';
          if (/Carve/i.test(context) && !/Capture/i.test(context)) method = 'Carving';
          else if (/Capture/i.test(context) || /Reward/i.test(context) && /Target/i.test(context)) method = 'Target Rewards';
          else if (/Break/i.test(context)) method = 'Broken Part Rewards';
          else if (/Wound/i.test(context)) method = 'Wound Destroyed Reward';
          else method = 'Target Rewards';
          out.materials[currentRank].push({ material: name, method, percent: pct });
        }
      }
    }
  }

  return out;
}

// Convert Kiranico materials format to Rise grouped format
function convertMaterials(kiranicoMaterials) {
  const result = {};
  for (const rank of Object.keys(kiranicoMaterials)) {
    const rows = kiranicoMaterials[rank] || [];
    if (!rows.length) continue;
    const byMat = new Map();
    for (const row of rows) {
      const key = row.material;
      if (!byMat.has(key)) byMat.set(key, { targetReward: '', capture: '', breakParts: '', carves: '', dropped: '' });
      const e = byMat.get(key);
      const method = (row.method || '').toLowerCase();
      const pct = row.percent || '';
      const text = pct;
      if (method.includes('target reward')) e.targetReward = e.targetReward ? e.targetReward + ', ' + text : text;
      else if (method.includes('capture')) e.capture = text;
      else if (method.includes('broken part') || method.includes('break')) e.breakParts = e.breakParts ? e.breakParts + ', ' + text : text;
      else if (method.includes('carv')) {
        const sub = method.replace('carving', '').replace(/[()]/g, '').trim();
        if (sub) e.carves = e.carves ? e.carves + ', ' + sub + ': ' + text : sub + ': ' + text;
        else e.carves = e.carves ? e.carves + ', ' + text : text;
      } else if (method.includes('wound') || method.includes('destroyed') || method.includes('dropped')) {
        const sub2 = method.replace('wound destroyed reward', 'Herida').replace(/[()]/g, '').trim();
        if (sub2) e.dropped = e.dropped ? e.dropped + ', ' + sub2 + ': ' + text : sub2 + ': ' + text;
        else e.dropped = e.dropped ? e.dropped + ', ' + text : text;
      }
    }
    result[rank] = [...byMat.entries()].map(([material, e]) => ({
      material, rarity: null, ...e
    }));
  }
  return result;
}

async function main() {
  const monsters = JSON.parse(fs.readFileSync(path.join(OUT, 'monsters.json'), 'utf8'));
  let updated = 0, locOk = 0, ailOk = 0;
  for (const mon of monsters) {
    const title = slugToWikiTitle(mon.slug);
    const rawFile = path.join(WIKI_RAW, mon.slug + '.txt');
    let wikitext;
    if (fs.existsSync(rawFile)) {
      wikitext = fs.readFileSync(rawFile, 'utf8');
    } else {
      try {
        const url = 'https://monsterhunterwiki.org/api.php?action=parse&page=' + title + '&prop=wikitext&format=json';
        const json = JSON.parse(await apiGet(url));
        wikitext = json.parse.wikitext['*'];
        fs.writeFileSync(rawFile, wikitext);
      } catch (e) {
        console.log('  SKIP', mon.name, e.message);
        continue;
      }
    }

    const wiki = parseWikitext(wikitext, mon.slug);

    if (wiki.image) mon.image = wiki.image;
    if (wiki.locations.length) { mon.locations = wiki.locations; locOk++; }
    if (wiki.ailmentSusceptibility.length) { mon.ailmentSusceptibility = wiki.ailmentSusceptibility; ailOk++; }

    // Convert materials
    if (mon.materials && Object.keys(mon.materials).length) {
      mon.materials = convertMaterials(mon.materials);
    }

    updated++;
    if (updated % 20 === 0) console.log('  ' + updated + '/' + monsters.length);
  }

  fs.writeFileSync(path.join(OUT, 'monsters.json'), JSON.stringify(monsters, null, 1));
  const m = JSON.parse(fs.readFileSync(path.join(OUT, 'monsters.json'), 'utf8'));
  console.log('DONE', m.length, 'monsters');
  console.log('con image:', m.filter(x=>x.image).length);
  console.log('con locations:', m.filter(x=>x.locations&&x.locations.length).length);
  console.log('con ailmentSusceptibility:', m.filter(x=>x.ailmentSusceptibility&&x.ailmentSusceptibility.length).length);
  console.log('con materials Rise:', m.filter(x=>x.materials&&Object.values(x.materials).some(a=>a&&a.length)).length);
}

main().catch(e => { console.error(e); process.exit(1); });
