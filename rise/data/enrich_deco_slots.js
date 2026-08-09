// Adds `decoSlots` (array of decoration slot levels, e.g. [4,2]) to
// data/weapons.json and data/armor_pieces.json by re-visiting each detail
// page and reading the deco{N}.png icons in the stats row. Resumable: skips
// entries that already have a decoSlots field.
// Usage: node data/enrich_deco_slots.js weapons|armor
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const CONCURRENCY = 6;
const BATCH_SIZE = 50;

const kind = process.argv[2];
if (!["weapons", "armor"].includes(kind)) { console.error("usage: node enrich_deco_slots.js weapons|armor"); process.exit(1); }
const OUT_PATH = path.join(__dirname, kind === "weapons" ? "weapons.json" : "armor_pieces.json");
const urlBase = kind === "weapons" ? "https://mhrise.kiranico.com/data/weapons/" : "https://mhrise.kiranico.com/data/armors/";

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

function parseDecoSlots(html) {
  // deco icons appear grouped together right before the "Defense"/"attack"
  // stat cell; grab the first such cluster on the page
  const m = html.match(/(?:<img[^>]*images\/ui\/deco(\d)\.png[^>]*>\s*)+/);
  if (!m) return [];
  const cluster = m[0];
  return [...cluster.matchAll(/deco(\d)\.png/g)].map(x => parseInt(x[1], 10));
}

async function mapLimit(items, limit, fn) {
  let i = 0;
  async function worker() { while (i < items.length) { const idx = i++; await fn(items[idx]); } }
  await Promise.all(new Array(limit).fill(0).map(worker));
}

async function main() {
  const items = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
  const todo = items.filter(x => x.decoSlots === undefined);
  console.log(`${kind}: ${items.length} total, ${todo.length} need decoSlots`);
  let done = 0;
  for (let b = 0; b < todo.length; b += BATCH_SIZE) {
    const batch = todo.slice(b, b + BATCH_SIZE);
    await mapLimit(batch, CONCURRENCY, async (x) => {
      const html = await fetchText(urlBase + x.id);
      x.decoSlots = html ? parseDecoSlots(html) : [];
      done++;
    });
    fs.writeFileSync(OUT_PATH, JSON.stringify(items));
    console.log(`progress: ${done}/${todo.length}`);
  }
  console.log("DONE enriching", kind);
}

main().catch(e => { console.error(e); process.exit(1); });
