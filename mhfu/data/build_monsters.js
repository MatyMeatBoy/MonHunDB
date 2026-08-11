// Transforms Riperino/MHFU raw tables into mhfu/data/monsters.json, matching
// rise/data/monsters.json's field shape (name, species, locations, weaknesses,
// resistances, materials, hitzones, image) so rise/app.js's monster rendering
// works with minimal changes. MHFU's source tables are per-monster + per-part,
// which happens to map cleanly onto Rise's hitzone table concept -- values
// are 0-100 hitzone percentages in both games, confirmed against Rathalos
// (Fire 0 = immune, Ice 40 = known real weakness).
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/MHFU";
const OUT = __dirname;

const monsters = JSON.parse(fs.readFileSync(path.join(SRC, "monsters/monsters.json"), "utf8"));
const weaponEff = JSON.parse(fs.readFileSync(path.join(SRC, "monsters/weapon-effectiveness.json"), "utf8"));
const elementEff = JSON.parse(fs.readFileSync(path.join(SRC, "monsters/element-effectiveness.json"), "utf8"));
const statusEff = JSON.parse(fs.readFileSync(path.join(SRC, "monsters/status-effectiveness.json"), "utf8"));
const materialsRaw = JSON.parse(fs.readFileSync(path.join(SRC, "monsters/monsters-material.json"), "utf8"));
const rendersIndex = JSON.parse(fs.readFileSync(path.join(SRC, "images/monsters/renders/_renders-index.json"), "utf8"));
const alphaOk = new Set(JSON.parse(fs.readFileSync(path.join(SRC, "images/monsters/renders/_alpha_ok.json"), "utf8")));

const byName = arr => new Map(arr.map(x => [x.monster, x]));
const weaponByName = byName(weaponEff);
const elementByName = byName(elementEff);
const statusByName = byName(statusEff);
const materialsByName = new Map(materialsRaw.map(x => [x.monster, x]));

const OUT_IMG_DIR = path.join(OUT, "images", "monsters");
fs.mkdirSync(OUT_IMG_DIR, { recursive: true });

const RANK_LABEL = {
  "hall-beginner": "Village",
  "low-rank": "Low Rank",
  "high-rank": "High Rank",
  "g-rank": "G Rank",
  "Epic Hunting": "Epic Hunting",
};
const BREAK_TYPES = new Set([
  "ear", "tail", "mouth", "back", "wing", "wings", "play-dead", "comb", "beak", "head", "claw",
  "body", "stomach", "horn", "spike", "fang", "feet", "jaw", "fin", "face", "shell",
  "shell-wyvern", "shell-gravios", "foreleg", "hindleg", "head-break", "right-shoulder",
  "left-shoulder", "back-break", "waist", "upper-body", "lower-body", "horn-left", "horn-right",
  "eye", "chest",
]);
const CARVE_TYPES = new Set(["carving", "shell-carving", "carving-dropped"]);
const DROP_TYPES = new Set(["dropping", "dropping-mushroom", "dropping-ore", "dropping-bone"]);

function buildMaterials(monsterName) {
  const raw = materialsByName.get(monsterName);
  if (!raw) return {};
  const byRank = {};
  for (const t of raw.types) {
    const rankLabel = RANK_LABEL[t.condition];
    if (!rankLabel) continue; // skip training/treasure -- not real hunt rewards
    if (!byRank[rankLabel]) byRank[rankLabel] = new Map();
    const bucket = byRank[rankLabel];
    for (const m of t.materials) {
      if (!bucket.has(m.name)) bucket.set(m.name, { material: m.name, carves: [], capture: [], breakParts: [], dropped: [] });
      const row = bucket.get(m.name);
      // small monsters (Anteka, Felyne, etc) carve/drop with chance:null in
      // the source -- it's a guaranteed reward there, not a missing value.
      const pct = m.chance == null ? "100%" : `${m.chance}%`;
      if (CARVE_TYPES.has(t.type)) row.carves.push(pct);
      else if (t.type === "capture") row.capture.push(pct);
      else if (DROP_TYPES.has(t.type)) row.dropped.push(pct);
      else if (BREAK_TYPES.has(t.type)) row.breakParts.push(`${pct} (${t.type})`);
    }
  }
  const result = {};
  for (const [rankLabel, bucket] of Object.entries(byRank)) {
    result[rankLabel] = [...bucket.values()].map(r => ({
      material: r.material,
      rarity: null,
      targetReward: null,
      capture: r.capture.join(", ") || null,
      breakParts: r.breakParts.join(", ") || null,
      carves: r.carves.join(", ") || null,
      dropped: r.dropped.join(", ") || null,
    }));
  }
  return result;
}

function mergeParts(wParts, eParts) {
  const byPart = new Map();
  for (const p of wParts || []) {
    byPart.set(p.part, { part: p.part, sever: p.slash, blunt: p.strike, projectile: p.shooting });
  }
  for (const p of eParts || []) {
    const row = byPart.get(p.part) || { part: p.part };
    row.fire = p.fire; row.water = p.water; row.thunder = p.thundr; row.ice = p.ice; row.dragon = p.dragon;
    byPart.set(p.part, row);
  }
  return [...byPart.values()];
}

function deriveWeaknesses(hitzones) {
  const maxByElement = {};
  for (const el of ["fire", "water", "thunder", "ice", "dragon"]) {
    const vals = hitzones.map(r => r[el]).filter(v => v != null);
    if (vals.length) maxByElement[el] = Math.max(...vals);
  }
  const nonZero = Object.entries(maxByElement).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const weaknesses = nonZero.slice(0, 3).map(([element, v], i) => ({
    element: element[0].toUpperCase() + element.slice(1),
    stars: i === 0 ? 3 : i === 1 ? 2 : 1,
  }));
  const resistances = Object.entries(maxByElement).filter(([, v]) => v === 0).map(([element]) => ({
    element: element[0].toUpperCase() + element.slice(1), immune: true,
  }));
  return { weaknesses, resistances };
}

function deriveAilments(monsterName) {
  const raw = statusByName.get(monsterName);
  if (!raw) return [];
  return raw.types.map(t => {
    // lower initial-tolerance == easier to inflict -- bucket into 1-3 stars
    const tol = t["initial-tolerance"];
    const stars = tol <= 100 ? 3 : tol <= 150 ? 2 : 1;
    return { ailment: t.type[0].toUpperCase() + t.type.slice(1), stars };
  });
}

const out = [];
let withImage = 0;
for (const m of monsters) {
  const wp = weaponByName.get(m.name);
  const ep = elementByName.get(m.name);
  const hitzones = mergeParts(wp && wp.parts, ep && ep.parts);
  const { weaknesses, resistances } = deriveWeaknesses(hitzones);
  const renders = rendersIndex[m.name];
  let image = null;
  if (renders && renders.length) {
    // several primary renders were baked with an opaque white/solid
    // background (no alpha channel); _alpha_ok.json (built with PIL --
    // some files are WebP mislabeled with a .png extension, so a raw PNG
    // signature check is unreliable) lists which files actually have real
    // transparency. Prefer one of those over the listed-first render.
    let chosen = renders.find(f => alphaOk.has(f)) || renders[0];
    const srcPath = path.join(SRC, "images/monsters/renders", chosen);
    if (fs.existsSync(srcPath)) {
      const destName = chosen.replace(/[^a-zA-Z0-9._-]/g, "_");
      fs.copyFileSync(srcPath, path.join(OUT_IMG_DIR, destName));
      image = `data/images/monsters/${destName}`;
      withImage++;
    }
  }
  out.push({
    name: m.name,
    species: m.type || null,
    description: m.description || null,
    locations: [],
    weaknesses,
    resistances,
    ailmentSusceptibility: deriveAilments(m.name),
    materials: buildMaterials(m.name),
    hitzones,
    image,
  });
}

fs.writeFileSync(path.join(OUT, "monsters.json"), JSON.stringify(out, null, 1));
console.log(`Wrote ${out.length} monsters, ${withImage} with images.`);
