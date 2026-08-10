// Fix materials: re-parse from Kiranico raw HTML, convert to Rise format,
// and update monsters.json preserving all other fields.
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const RAW = path.join(OUT, 'monsters_raw');
const MONSTERS = path.join(OUT, 'monsters.json');

function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

async function main() {
  const monsters = JSON.parse(fs.readFileSync(MONSTERS, 'utf8'));
  let fixed = 0;
  for (const mon of monsters) {
    const rawFile = path.join(RAW, mon.slug + '.html');
    if (!fs.existsSync(rawFile)) continue;
    const html = fs.readFileSync(rawFile, 'utf8');

    // Re-parse materials from Kiranico HTML
    const materials = {};
    // find all tables and look for material sections
    // Materials: rows with 3 tds, first has <a href="/data/items/...">
    const tables = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi) || [];
    for (const tbl of tables) {
      // detect material table: rows with item links
      const hasItems = /href="\/data\/items\//.test(tbl);
      if (!hasItems) continue;
      const rows = [...tbl.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
      const matRows = [];
      for (const row of rows) {
        const tdMatch = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
        const tds = tdMatch.map(x => clean(x[1].replace(/<[^>]+>/g, '')));
        if (tds.length < 3) continue;
        const link = row[1].match(/href="\/data\/items\/[^"]*"[^>]*>([^<]+)</);
        const material = link ? clean(link[1]) : tds[0];
        if (!material) continue;
        matRows.push({ material, method: tds[1], percent: tds[2] });
      }
      if (!matRows.length) continue;

      // find rank heading
      let rank = 'High Rank'; // default for Wilds
      // search backwards from the table for h3/h4 with "X-rank Materials"
      // simpler: try to find in the last 5000 chars before this table
      const tIdx = html.lastIndexOf(tbl.slice(0, 100), 0); // approximate
      // just try matching headings in order
      const headingM = html.match(/<h[3-4][^>]*>([^<]*)<\/h[3-4]>/gi) || [];
      for (const h of headingM) {
        const text = clean(h.replace(/<[^>]+>/g, ''));
        if (/low.rank materials/i.test(text)) rank = 'Low Rank';
        else if (/high.rank materials/i.test(text)) rank = 'High Rank';
        else if (/master.rank materials/i.test(text)) rank = 'Master Rank';
      }

      if (!materials[rank]) materials[rank] = [];
      materials[rank].push(...matRows);
    }

    // Now convert to Rise format
    const converted = {};
    for (const rank of Object.keys(materials)) {
      const rows = materials[rank];
      const byMat = {};
      for (const r of rows) {
        const key = r.material;
        if (!byMat[key]) byMat[key] = { targetReward: '', capture: '', breakParts: '', carves: '', dropped: '' };
        const e = byMat[key];
        const m = r.method || '';
        const p = r.percent || '';

        if (/target reward/i.test(m)) {
          e.targetReward = append(e.targetReward, p);
        } else if (/capture/i.test(m)) {
          e.capture = append(e.capture, p);
        } else if (/broken part|break part/i.test(m)) {
          const src = m.replace(/broken part rewards?/i, '').replace(/[()]/g, '').trim();
          e.breakParts = append(e.breakParts, src ? src + ': ' + p : p);
        } else if (/carv/i.test(m)) {
          const src = m.replace(/carving/i, '').replace(/[()]/g, '').replace(/rotten severed part/i, 'Parte cortada podrida').replace(/rotten monster carcass/i, 'Cuerpo podrido').replace(/severed part/i, 'Parte cortada').trim();
          e.carves = append(e.carves, src ? src + ': ' + p : p);
        } else if (/wound/i.test(m)) {
          const src = m.replace(/wound destroyed reward/i, 'Herida').replace(/[()]/g, '').trim();
          e.dropped = append(e.dropped, src ? src + ': ' + p : p);
        } else if (/tempered/i.test(m)) {
          e.dropped = append(e.dropped, 'Templado: ' + p);
        }
      }
      converted[rank] = Object.entries(byMat).map(([material, e]) => ({
        material, rarity: null, ...e
      }));
    }

    mon.materials = converted;
    fixed++;
  }
  fs.writeFileSync(MONSTERS, JSON.stringify(monsters, null, 1));
  console.log('Fixed materials for', fixed, 'monsters');
  const hasData = monsters.filter(m => m.materials && Object.values(m.materials).some(a => a && a.length));
  console.log('con materiales Rise:', hasData.length);
}

function append(existing, add) {
  if (!add) return existing || '';
  return existing ? (existing + ', ' + add) : add;
}

main().catch(e => { console.error(e); process.exit(1); });
