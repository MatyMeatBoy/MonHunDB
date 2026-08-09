// Scrape MH Wilds monsters from mhwilds.kiranico.com
// Output: wilds/data/monsters.json in the same schema as rise/data/monsters.json
// plus raw HTML pages in wilds/data/monsters_raw/ for debugging/reparse.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const RAW_DIR = path.join(OUT_DIR, 'monsters_raw');
const MONSTER_LIST_URL = 'https://mhwilds.kiranico.com/data/monsters';

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function getMonsterList(page) {
  await page.goto(MONSTER_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  const items = await page.evaluate(() => {
    const out = [];
    const seen = new Set();
    document.querySelectorAll('a[href*="/data/monsters/"]').forEach(a => {
      const href = a.getAttribute('href') || '';
      const m = href.match(/\/data\/monsters\/([a-z0-9-]+)\/?$/);
      if (!m) return;
      const slug = m[1];
      if (seen.has(slug)) return;
      seen.add(slug);
      const text = (a.textContent || '').trim();
      if (text) out.push({ slug, name: text, href: 'https://mhwilds.kiranico.com' + href });
    });
    return out;
  });
  return items;
}

async function scrapeMonster(page, mon) {
  const rawFile = path.join(RAW_DIR, mon.slug + '.html');
  let html;
  if (fs.existsSync(rawFile)) {
    console.log('  reusing cached', mon.slug);
    html = fs.readFileSync(rawFile, 'utf8');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
  } else {
    console.log('  fetching', mon.slug);
    await page.goto(mon.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    html = await page.content();
    fs.writeFileSync(rawFile, html);
  }

  const data = await page.evaluate(() => {
    const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const doc = document;

    // ---- title / species ----
    const name = clean(doc.querySelector('h1')?.textContent || doc.title.split('|')[0]);
    // Species: an info table with a label cell "Species" followed by the value
    let species = '';
    doc.querySelectorAll('table').forEach(tbl => {
      tbl.querySelectorAll('tr').forEach(tr => {
        const tds = Array.from(tr.querySelectorAll('td')).map(td => clean(td.textContent));
        if (tds.length >= 2 && tds[0] === 'Species' && !species) species = tds[1];
      });
    });

    // ---- tables classification ----
    const hitzones = [];
    const partBreaks = [];
    const ailments = [];
    const materials = {};

    // headings with document offsets (h4 has "X-rank Materials"; h3 others)
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4')).map(h => ({
      text: clean(h.textContent),
      offset: (() => {
        let n = h, off = 0;
        while (n) { off += (n.offsetTop || 0); n = n.offsetParent; }
        return off;
      })(),
    }));

    const tables = doc.querySelectorAll('table');
    tables.forEach((tbl) => {
      const rows = Array.from(tbl.querySelectorAll('tbody tr'));
      if (!rows.length) return;

      // Header images tell us the hitzone table (icons hit_slash/hit_strike/...)
      // NOTE: shadcn tables have no <thead>; <th> cells live in the first <tbody> row.
      const thImgs = Array.from(tbl.querySelectorAll('th img, th')).map(th =>
        (th.getAttribute('src') || '') + ' ' + clean(th.textContent)
      ).join('|');
      const isHitzoneTable = /hit_slash|hit_strike|hit_shell/.test(thImgs) && /element_fire/.test(thImgs);

      if (isHitzoneTable) {
        rows.forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => clean(td.textContent));
          if (tds.length < 11) return;
          // row shape: [part, wounds-marker, sever, blunt, projectile, fire, water, thunder, ice, dragon, stun]
          const [partRaw, woundsMark, sever, blunt, proj, fire, water, thunder, ice, dragon, stun] = tds;
          const isWounds = /wound/i.test(woundsMark);
          const part = partRaw.replace(/\s*wounds?\s*/i, '').trim();
          if (!part) return;
          const n = (s) => parseInt(s) || 0;
          hitzones.push({
            part,
            wounds: isWounds ? 1 : 0,
            sever: n(sever), blunt: n(blunt), projectile: n(proj),
            fire: n(fire), water: n(water), thunder: n(thunder),
            ice: n(ice), dragon: n(dragon), stun: n(stun),
          });
        });
        return;
      }

      // Ailments table: rows with 4 cells, 2nd cell matches "N (+N) -> N"
      const ailmentRows = rows.filter(tr => {
        const tds = Array.from(tr.querySelectorAll('td')).map(td => clean(td.textContent));
        return tds.length >= 4 && /^\d+\s*\(\+\d+\)/.test(tds[1]);
      });
      if (ailmentRows.length) {
        ailmentRows.forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => clean(td.textContent));
          ailments.push({ name: tds[0], buildup: tds[1], damage: tds[2], decay: tds[3] });
        });
        return;
      }

      // Materials table: rows with 3 cells where first cell has a link to /data/items/
      const materialRows = rows.filter(tr => {
        const a = tr.querySelector('a[href*="/data/items/"]');
        const tds = Array.from(tr.querySelectorAll('td')).map(td => clean(td.textContent));
        return a && tds.length >= 3;
      });
      if (materialRows.length) {
        // find the closest preceding "X-rank Materials" heading by document offset
        const tblOffset = (() => {
          let n = tbl, off = 0;
          while (n) { off += (n.offsetTop || 0); n = n.offsetParent; }
          return off;
        })();
        let rank = 'unknown';
        let best = -1;
        for (const h of headings) {
          if (h.offset <= tblOffset && /(low|high|master)[-\s]?rank/i.test(h.text) && h.offset > best) {
            best = h.offset;
            rank = h.text.match(/(low|high|master)/i)[1].toLowerCase();
          }
        }
        if (!materials[rank]) materials[rank] = [];
        materialRows.forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => clean(td.textContent));
          const a = tr.querySelector('a[href*="/data/items/"]');
          materials[rank].push({
            material: a ? clean(a.textContent) : tds[0],
            method: tds[1] || '',
            percent: tds[2] || '',
          });
        });
        return;
      }

      // Part break table: rows with 2+ cells, 1st = part name, 2nd = "NNN HP"
      const partRows = rows.filter(tr => {
        const tds = Array.from(tr.querySelectorAll('td')).map(td => clean(td.textContent));
        return tds.length >= 2 && /\d+\s*HP/i.test(tds[1]);
      });
      if (partRows.length) {
        partRows.forEach(tr => {
          const tds = Array.from(tr.querySelectorAll('td')).map(td => clean(td.textContent));
          partBreaks.push({
            part: tds[0],
            hp: parseInt(tds[1]) || 0,
            notes: tds[2] || '',
          });
        });
        return;
      }
    });

    return { name, species, hitzones, partBreaks, ailments, materials };
  });

  return { slug: mon.slug, href: mon.href, ...data };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ userAgent: UA, viewport: { width: 1366, height: 900 } });
  try {
    console.log('Fetching monster list...');
    const list = await getMonsterList(page);
    console.log('Found', list.length, 'monsters');
    fs.writeFileSync(path.join(OUT_DIR, 'monster_list_raw.json'), JSON.stringify(list, null, 1));

    const monsters = [];
    for (const mon of list) {
      try {
        const data = await scrapeMonster(page, mon);
        monsters.push(data);
        const rankKeys = Object.keys(data.materials);
        console.log('   =>', data.name, '| hz:', data.hitzones.length, '| parts:', data.partBreaks.length, '| ailments:', data.ailments.length, '| mats:', JSON.stringify(rankKeys), rankKeys.map(k => data.materials[k].length));
      } catch (e) {
        console.log('  ERROR', mon.slug, e.message);
      }
    }

    fs.writeFileSync(path.join(OUT_DIR, 'monsters.json'), JSON.stringify(monsters, null, 1));
    console.log('Saved', monsters.length, 'monsters to wilds/data/monsters.json');
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
