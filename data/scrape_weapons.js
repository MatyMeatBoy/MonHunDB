// Scrapes ALL Monster Hunter Rise: Sunbreak weapons from Kiranico (14 weapon
// type listings + one detail page per weapon for materials + tree links).
// ~3950 weapons total -- this is a big, slow, resumable job:
//   - writes data/weapons.json incrementally (every BATCH_SIZE items) so a
//     crash/rate-limit doesn't lose progress
//   - on restart, skips ids already present in the output file
// Usage: node data/scrape_weapons.js
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT_PATH = path.join(__dirname, "weapons.json");
const CONCURRENCY = 6;
const BATCH_SIZE = 40;

const TYPES = ["Great Sword", "Sword & Shield", "Dual Blades", "Long Sword", "Hammer", "Hunting Horn", "Lance", "Gunlance", "Switch Axe", "Charge Blade", "Insect Glaive", "Bow", "Heavy Bowgun", "Light Bowgun"];

const ELEMENT_NAMES = { 1: "fire", 2: "water", 3: "thunder", 4: "ice", 5: "dragon", 6: "poison", 7: "sleep", 8: "paralysis", 9: "blast" };

async function fetchText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return await res.text();
      if (res.status === 429 || res.status >= 500) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
      else return null;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

function parseListing(html, type) {
  const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
  const out = [];
  for (const row of rows) {
    const idMatch = row.match(/data\/weapons\/(\d+)">([^<]+)</);
    if (!idMatch) continue;
    const iconMatch = row.match(/src="([^"]+avatar\/weapons\/[^"]+)"/);
    const attackMatch = row.match(/data-key="attack">(\d+)</);
    const rarityMatch = row.match(/Rare (\d+)/);
    const elemMatches = [...row.matchAll(/data-key="element" data-value="(\d)">[\s\S]*?data-key="elementAttack" data-value="(\d+)"/g)];
    const elements = elemMatches
      .map(m => ({ type: ELEMENT_NAMES[m[1]] || null, value: parseInt(m[2], 10) }))
      .filter(e => e.type && e.value > 0);
    out.push({
      id: idMatch[1],
      name: idMatch[2].trim(),
      type,
      icon: iconMatch ? iconMatch[1] : null,
      attack: attackMatch ? parseInt(attackMatch[1], 10) : null,
      rarity: rarityMatch ? parseInt(rarityMatch[1], 10) : null,
      elements,
    });
  }
  return out;
}

function parseNameMap(html) {
  const map = {};
  for (const m of html.matchAll(/data\/weapons\/(\d+)">([^<]+)</g)) map[m[1]] = m[2].trim();
  return map;
}

function parseDetail(html) {
  const result = { materials: [], materialsSource: null, nextId: null, prevId: null };
  const nextM = html.match(/rel="next"[\s\S]*?data\/weapons\/(\d+)"/);
  if (nextM) result.nextId = nextM[1];
  const prevM = html.match(/rel="prev"[\s\S]*?data\/weapons\/(\d+)"/);
  if (prevM) result.prevId = prevM[1];

  const forgeM = html.match(/Forging Materials\s*<\/h2>[\s\S]*?<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  const upgradeM = html.match(/Upgrade Materials\s*<\/h2>[\s\S]*?<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  const parseRows = (tbodyHtml) => {
    const rows = [];
    for (const m of tbodyHtml.matchAll(/data\/items\/\d+">([^<]+)<\/a>[\s\S]*?<td[^>]*>x(\d+)<\/td>/g)) {
      rows.push({ material: m[1].trim(), qty: parseInt(m[2], 10) });
    }
    return rows;
  };
  const forgeRows = forgeM ? parseRows(forgeM[1]) : [];
  const upgradeRows = upgradeM ? parseRows(upgradeM[1]) : [];
  if (forgeRows.length) {
    result.materials = forgeRows;
    result.materialsSource = "forge";
  } else if (upgradeRows.length) {
    result.materials = upgradeRows;
    result.materialsSource = "upgrade";
  }
  return result;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(new Array(limit).fill(0).map(worker));
  return results;
}

async function main() {
  let weapons = [];
  const doneIds = new Set();
  if (fs.existsSync(OUT_PATH)) {
    weapons = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
    for (const w of weapons) if (w.materialsSource !== undefined) doneIds.add(w.id);
    console.log(`resuming: ${weapons.length} weapons already saved, ${doneIds.size} with detail data`);
  }

  const byId = new Map(weapons.map(w => [w.id, w]));

  // 1. listings (EN) -- only needed if we don't already have the full set
  if (weapons.length === 0) {
    for (let i = 0; i < TYPES.length; i++) {
      const html = await fetchText(`https://mhrise.kiranico.com/data/weapons?view=${i}`);
      if (!html) { console.log("FAILED listing", TYPES[i]); continue; }
      const items = parseListing(html, TYPES[i]);
      console.log(TYPES[i], items.length);
      for (const it of items) byId.set(it.id, it);
      await new Promise(r => setTimeout(r, 250));
    }
    weapons = [...byId.values()];
    fs.writeFileSync(OUT_PATH, JSON.stringify(weapons));
  }

  // 2. ES name translations
  if (!weapons[0] || !weapons[0].nameEs) {
    for (let i = 0; i < TYPES.length; i++) {
      const html = await fetchText(`https://mhrise.kiranico.com/es/data/weapons?view=${i}`);
      if (!html) { console.log("FAILED ES listing", TYPES[i]); continue; }
      const nameMap = parseNameMap(html);
      for (const w of weapons) if (nameMap[w.id]) w.nameEs = nameMap[w.id];
      await new Promise(r => setTimeout(r, 250));
    }
    fs.writeFileSync(OUT_PATH, JSON.stringify(weapons));
    console.log("ES names done");
  }

  // 3. detail pages (materials + tree links), resumable, batched saves
  const todo = weapons.filter(w => !doneIds.has(w.id));
  console.log(`fetching detail for ${todo.length} weapons...`);
  let done = 0;
  for (let b = 0; b < todo.length; b += BATCH_SIZE) {
    const batch = todo.slice(b, b + BATCH_SIZE);
    await mapLimit(batch, CONCURRENCY, async (w) => {
      const html = await fetchText(`https://mhrise.kiranico.com/data/weapons/${w.id}`);
      if (html) {
        const detail = parseDetail(html);
        Object.assign(w, detail);
      } else {
        w.materials = [];
        w.materialsSource = null;
      }
      done++;
    });
    fs.writeFileSync(OUT_PATH, JSON.stringify(weapons));
    console.log(`progress: ${done}/${todo.length}`);
  }

  console.log("DONE", weapons.length, "weapons saved to", OUT_PATH);
}

main().catch(e => { console.error(e); process.exit(1); });
