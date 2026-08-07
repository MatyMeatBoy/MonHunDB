// Scrapes ALL Monster Hunter Rise: Sunbreak armor pieces from Kiranico
// (10 rarity-tier listings + one detail page per piece for materials,
// defense, and skills). ~1590 pieces total. Resumable like scrape_weapons.js:
// writes data/armor_pieces.json incrementally, skips ids already fetched.
// Usage: node data/scrape_armor.js
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const OUT_PATH = path.join(__dirname, "armor_pieces.json");
const CONCURRENCY = 6;
const BATCH_SIZE = 40;
const RARITY_COUNT = 10;

// Standard MH armor-name suffix -> slot convention. Checked against
// Kamura Head Scarf(head)/Garb(chest)/Lagombi Coil(waist)/Vambraces(arms)/
// Greaves(legs) samples -- consistent across the series.
const SLOT_SUFFIXES = [
  [/(Head|Helm|Hood|Mask|Cap|Scarf|Crown|Circlet|Headgear)$/i, "head"],
  [/(Mail|Vest|Garb|Suit|Coat|Robe|Jacket|Armor|Plate|Chestplate|Hide)$/i, "chest"],
  [/(Vambraces|Braces|Guards|Gloves|Gauntlets|Claws|Arms)$/i, "arms"],
  [/(Coil|Belt|Faulds|Waist|Sash|Obi)$/i, "waist"],
  [/(Greaves|Leggings|Boots|Legs|Feet|Pants)$/i, "legs"],
];
function guessSlot(name) {
  for (const [re, slot] of SLOT_SUFFIXES) if (re.test(name.trim())) return slot;
  return null;
}

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

function parseListing(html, rarity) {
  const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
  const out = [];
  for (const row of rows) {
    const idMatch = row.match(/data\/armors\/(\d+)">([^<]+)</);
    if (!idMatch) continue;
    const iconMs = [...row.matchAll(/src="([^"]+avatar\/armors\/[^"]+)"/g)];
    out.push({
      id: idMatch[1],
      name: idMatch[2].trim(),
      slot: guessSlot(idMatch[2].trim()),
      rarity,
      iconM: iconMs[0] ? iconMs[0][1] : null,
      iconF: iconMs[1] ? iconMs[1][1] : null,
    });
  }
  return out;
}

function parseNameMap(html) {
  const map = {};
  for (const m of html.matchAll(/data\/armors\/(\d+)">([^<]+)</g)) map[m[1]] = m[2].trim();
  return map;
}

function parseDetail(html) {
  const result = { materials: [], defense: null, skills: [] };
  const matM = html.match(/Forging Materials\s*<\/h2>[\s\S]*?<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (matM) {
    for (const m of matM[1].matchAll(/data\/items\/\d+">([^<]+)<\/a>[\s\S]*?<td[^>]*>x(\d+)<\/td>/g)) {
      result.materials.push({ material: m[1].trim(), qty: parseInt(m[2], 10) });
    }
  }
  const defM = html.match(/(\d+)\s*Defense/);
  if (defM) result.defense = parseInt(defM[1], 10);
  for (const m of html.matchAll(/data\/skills\/\d+">([^<]+)<\/a>\s*Lv\s*(\d+)/g)) {
    result.skills.push({ name: m[1].trim(), level: parseInt(m[2], 10) });
  }
  return result;
}

async function mapLimit(items, limit, fn) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  }
  await Promise.all(new Array(limit).fill(0).map(worker));
}

async function main() {
  let pieces = [];
  if (fs.existsSync(OUT_PATH)) {
    pieces = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
    console.log(`resuming: ${pieces.length} pieces already saved`);
  }
  const byId = new Map(pieces.map(p => [p.id, p]));

  if (pieces.length === 0) {
    for (let i = 0; i < RARITY_COUNT; i++) {
      const html = await fetchText(`https://mhrise.kiranico.com/data/armors?view=${i}`);
      if (!html) { console.log("FAILED listing rarity", i + 1); continue; }
      const items = parseListing(html, i + 1);
      console.log("Rarity", i + 1, items.length);
      for (const it of items) byId.set(it.id, it);
      await new Promise(r => setTimeout(r, 250));
    }
    pieces = [...byId.values()];
    fs.writeFileSync(OUT_PATH, JSON.stringify(pieces));
  }

  if (!pieces[0] || !pieces[0].nameEs) {
    for (let i = 0; i < RARITY_COUNT; i++) {
      const html = await fetchText(`https://mhrise.kiranico.com/es/data/armors?view=${i}`);
      if (!html) { console.log("FAILED ES listing rarity", i + 1); continue; }
      const nameMap = parseNameMap(html);
      for (const p of pieces) if (nameMap[p.id]) p.nameEs = nameMap[p.id];
      await new Promise(r => setTimeout(r, 250));
    }
    fs.writeFileSync(OUT_PATH, JSON.stringify(pieces));
    console.log("ES names done");
  }

  const doneIds = new Set(pieces.filter(p => p.defense !== undefined).map(p => p.id));
  const todo = pieces.filter(p => !doneIds.has(p.id));
  console.log(`fetching detail for ${todo.length} armor pieces...`);
  let done = 0;
  for (let b = 0; b < todo.length; b += BATCH_SIZE) {
    const batch = todo.slice(b, b + BATCH_SIZE);
    await mapLimit(batch, CONCURRENCY, async (p) => {
      const html = await fetchText(`https://mhrise.kiranico.com/data/armors/${p.id}`);
      if (html) Object.assign(p, parseDetail(html));
      else { p.materials = []; p.defense = null; p.skills = []; }
      done++;
    });
    fs.writeFileSync(OUT_PATH, JSON.stringify(pieces));
    console.log(`progress: ${done}/${todo.length}`);
  }

  const noSlot = pieces.filter(p => !p.slot);
  console.log("DONE", pieces.length, "pieces saved. Unresolved slot guesses:", noSlot.length);
  if (noSlot.length) fs.writeFileSync(path.join(__dirname, "_armor_unresolved_slots.json"), JSON.stringify(noSlot.map(p => p.name), null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
