// Fix the 2 remaining monsters (Guardian Arkveld + Barrel Puncher) using wiki API
const https = require('https');
const fs = require('fs');
const path = require('path');
const UA = 'Mozilla/5.0 Chrome/126.0';

function apiGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); res.resume(); return; }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function parseLocales(w) {
  const m = w.match(/\|Locales\s*=\s*([^\|\n]+)/);
  if (!m) return [];
  return [...m[1].matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(x => x[1].trim()).filter(Boolean);
}

function parseAilments(w) {
  const out = [];
  const block = (w.match(/MHWIStatusData([\s\S]*?)(?:==|$)/) || [])[1];
  if (!block) return out;
  for (const ail of ['Poison','Paralysis','Sleep','Blast','Stun','Exhaust','Mount']) {
    const tM = block.match(new RegExp('\\|' + ail + ' Threshold\\s*=\\s*([^\\|\\n]+)'));
    if (!tM || /N\/A/i.test(tM[1])) continue;
    const parts = tM[1].trim().split('→');
    out.push({
      ailment: ail,
      stars: 2,
      buildup: [{ label: 'Initial', value: parseInt(parts[0]) || 0, max: parseInt(parts[1]) || 0 }]
    });
  }
  return out;
}

function parseDropRates(w) {
  const out = { 'High Rank': [], 'Low Rank': [] };
  const sec = w.match(/Drop Rates[\s\S]*?(?:=Sources|=References|\{\{MonsterLists)/);
  if (!sec) return out;
  let rank = 'High Rank';
  // split by rank tabbers
  const sections = sec[0].split(/\|- Rank\s*=/);
  let tableSection = 'Carving';
  for (const chunk of sections) {
    const rM = chunk.match(/^\s*(Low|High|Master)/);
    if (rM) rank = rM[1] + ' Rank';

    // each row: {{GenericItemLink|MHWilds|Name|Type|Color}}
    // |Chance%
    const rows = [...chunk.matchAll(/GenericItemLink\|MHWilds\|([^|]+)\|[^|}]*\|[^|}]*\}\}/g)];
    for (const rm of rows) {
      const name = rm[1].trim();
      // find the percent in the same line or next
      const line = chunk.slice(chunk.indexOf(rm[0]), chunk.indexOf('\n', chunk.indexOf(rm[0])));
      const pctM = line.match(/\|\s*(\d+%?)\s*$/m);
      if (!pctM) continue;
      const pct = pctM[1];
      // determine method from headers before this row
      const before = chunk.slice(0, chunk.indexOf(rm[0]));
      const headerM = before.match(/!\s*colspan[^|]*\|\s*(?:<big>)?\s*([^<]+)/i) ||
                      before.match(/![\s\|]*([Cc]arv[ei]s?|[Bb]reak|[Hh]unt|[Ww]ound|[Tt]arget)/);
      let method = 'Target Rewards';
      if (headerM) {
        const h = headerM[1].trim();
        if (/Carve/i.test(h)) method = 'Carving';
        else if (/Break/i.test(h)) method = 'Broken Part Rewards';
        else if (/Hunt/i.test(h) || /Target/i.test(h)) method = 'Target Rewards';
        else if (/Wound/i.test(h)) method = 'Wound Destroyed Reward';
        else if (/Capture/i.test(h)) method = 'Capture';
      }
      out[rank].push({ material: name, method, percent: pct.replace('%','') + '%' });
    }
  }
  return out;
}

function convertMaterials(raw) {
  const result = {};
  for (const rank of Object.keys(raw)) {
    if (!raw[rank].length) continue;
    const byMat = {};
    for (const r of raw[rank]) {
      if (!byMat[r.material]) byMat[r.material] = { targetReward: '', capture: '', breakParts: '', carves: '', dropped: '' };
      const e = byMat[r.material];
      const m = r.method || '';
      const p = r.percent || '';
      const add = (a,b) => a ? a + ', ' + b : b;
      if (/target/i.test(m)) e.targetReward = add(e.targetReward, p);
      else if (/capture/i.test(m)) e.capture = add(e.capture, p);
      else if (/break/i.test(m)) e.breakParts = add(e.breakParts, p);
      else if (/carv/i.test(m)) e.carves = add(e.carves, p);
      else if (/wound/i.test(m)) e.dropped = add(e.dropped, p);
    }
    result[rank] = Object.entries(byMat).map(([material, e]) => ({ material, rarity: null, ...e }));
  }
  return result;
}

async function main() {
  const monsters = JSON.parse(fs.readFileSync(path.join(__dirname, 'monsters.json'), 'utf8'));
  const targets = [
    { slug: 'guardian-arkveld', title: 'Guardian_Arkveld_(MHWA)' },
    { slug: 'high-purrformance-barrel-puncher', title: 'High_Purrformance_Barrel_Puncher_(MHWA)' },
  ];

  for (const t of targets) {
    const mon = monsters.find(m => m.slug === t.slug);
    if (!mon) continue;
    try {
      const json = JSON.parse(await apiGet('https://monsterhunterwiki.org/api.php?action=parse&page=' + t.title + '&prop=wikitext&format=json'));
      const w = json.parse.wikitext['*'];
      if (!mon.image) mon.image = 'data/images/' + t.slug + '.webp';
      const locs = parseLocales(w);
      if (locs.length) mon.locations = locs;
      const ailments = parseAilments(w);
      if (ailments.length) mon.ailmentSusceptibility = ailments;
      // if no Kiranico materials, use wiki Drop Rates
      const hasMats = mon.materials && Object.values(mon.materials).some(a => a && a.length);
      if (!hasMats) {
        const raw = parseDropRates(w);
        mon.materials = convertMaterials(raw);
      }
      console.log('Fixed', mon.name, '| loc:', locs.length, '| ail:', ailments.length, '| mats:', Object.keys(mon.materials||{}).join(','));
    } catch (e) {
      console.log('FAIL', t.slug, e.message);
    }
  }
  fs.writeFileSync(path.join(__dirname, 'monsters.json'), JSON.stringify(monsters, null, 1));
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
