// Transforms Riperino/MHFU weapons.json (1500, flat with a "type" field) +
// weapons-craft.json (upgrade-from chain + materials) + sharpness.json into
// mhfu/data/weapons.json matching rise/data/weapons.json's shape.
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/MHFU";
const OUT = __dirname;
const OUT_IMG_DIR = path.join(OUT, "images", "weapons");
fs.mkdirSync(OUT_IMG_DIR, { recursive: true });

const TYPE_MAP = {
  "great-swd": "Great Sword", "sword": "Sword & Shield", "dual-blades": "Dual Blades",
  "long-swd": "Long Sword", "hammer": "Hammer", "hunting-horn": "Hunting Horn",
  "lance": "Lance", "gunlance": "Gunlance", "light-bowgun": "Light Bowgun",
  "heavy-bowgun": "Heavy Bowgun", "bow": "Bow",
};

const weapons = JSON.parse(fs.readFileSync(path.join(SRC, "weapons/weapons.json"), "utf8"));
const craft = JSON.parse(fs.readFileSync(path.join(SRC, "weapons/weapons-craft.json"), "utf8"));
const sharpnessArr = JSON.parse(fs.readFileSync(path.join(SRC, "weapons/sharpness.json"), "utf8"));

const craftByName = new Map();
for (const c of craft) {
  if (!craftByName.has(c.name)) craftByName.set(c.name, []);
  craftByName.get(c.name).push(c);
}
const sharpnessByName = new Map(sharpnessArr.map(s => [s.name, s]));

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// assign sequential ids, then wire prevId/nextId from upgrade-from chains
const idByName = new Map(weapons.map((w, i) => [w.name, `mhfu${i + 1}`]));

const out = weapons.map(w => {
  const id = idByName.get(w.name);
  const craftEntries = craftByName.get(w.name) || [];
  const materials = [];
  const seen = new Set();
  for (const c of craftEntries) for (const m of (c.materials || [])) {
    const key = m.name;
    if (seen.has(key)) continue;
    seen.add(key);
    materials.push({ material: m.name, qty: m.amount });
  }
  const prevName = craftEntries.find(c => c.upgradeFrom || c["upgrade-from"])?.["upgrade-from"] || null;
  const prevId = prevName && idByName.has(prevName) ? idByName.get(prevName) : null;

  let icon = null;
  if (w.image) {
    const srcPath = path.join(SRC, w.image);
    if (fs.existsSync(srcPath)) {
      const destName = `${id}.png`;
      fs.copyFileSync(srcPath, path.join(OUT_IMG_DIR, destName));
      icon = `data/images/weapons/${destName}`; // converted to .webp by a separate pass -- see PROGRESS notes
    }
  }

  const sharp = sharpnessByName.get(w.name);

  return {
    id,
    name: w.name,
    type: TYPE_MAP[w.type] || w.type,
    icon,
    attack: w.attack,
    rarity: w.rare,
    affinity: w.affinity || 0,
    defense: w.defense || 0,
    elements: (w.elements || []).map(e => ({ type: e.name.toLowerCase(), value: e.attack })),
    description: w.description || null,
    materials,
    materialsSource: materials.length ? "craft" : null,
    sharpness: sharp ? sharp.sharpness : null,
    sharpnessArtisan: sharp ? sharp["sharpness-artisan"] : null,
    prevId,
    nextId: null, // filled below
    isFinal: true, // corrected below
    decoSlots: Array.from({ length: w.slots || 0 }, () => 1),
  };
});

// second pass: nextId = reverse of prevId, isFinal = nothing points away from it as a prev of another AND no further upgrade exists
// NOTE: MHFU's forging trees genuinely branch (one weapon can be the
// "upgrade-from" base for 2+ different next weapons) but Rise's schema
// (single prevId/nextId) only supports a linear chain, unlike Wilds' tree
// file. First branch encountered wins here -- a known simplification, not
// a bug: the other branch(es) just won't show as this weapon's "next".
const byId = new Map(out.map(w => [w.id, w]));
for (const w of out) {
  if (w.prevId && byId.has(w.prevId) && !byId.get(w.prevId).nextId) {
    byId.get(w.prevId).nextId = w.id;
    byId.get(w.prevId).isFinal = false;
  }
}
for (const w of out) w.isFinal = !w.nextId;

fs.writeFileSync(path.join(OUT, "weapons.json"), JSON.stringify(out, null, 1));
console.log(`Wrote ${out.length} weapons, ${out.filter(w => w.icon).length} with icons, ${out.filter(w => w.prevId).length} with prevId.`);
