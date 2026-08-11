// Transforms Riperino/MHFU armor/armors.json (2170 pieces, point-based skills,
// no explicit "set" grouping) into mhfu/data/armor_pieces.json matching
// rise/data/armor_pieces.json's shape. No armor_sets.json is written on
// purpose -- rise/app.js already has buildImpliedArmorGroups(), a fallback
// that groups pieces by shared name prefix when there's no explicit set,
// which is exactly MHFU's situation here (this source has no set field at
// all). Images are written as PNG here; a separate pass converts them to
// the .webp the app expects (data/images/armor/<id>_m.webp / _f.webp).
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/MHFU";
const OUT = __dirname;
const OUT_IMG_DIR = path.join(OUT, "images", "armor");
fs.mkdirSync(OUT_IMG_DIR, { recursive: true });

const PART_MAP = { helmet: "head", plate: "chest", gauntlet: "arms", waist: "waist", legging: "legs" };

const armors = JSON.parse(fs.readFileSync(path.join(SRC, "armor/armors.json"), "utf8"));

const out = armors.map((a, i) => {
  const id = `mhfua${i + 1}`;
  let iconM = false, iconF = false;
  if (a["image-male"]) {
    const srcPath = path.join(SRC, a["image-male"]);
    if (fs.existsSync(srcPath)) { fs.copyFileSync(srcPath, path.join(OUT_IMG_DIR, `${id}_m.png`)); iconM = true; }
  }
  if (a["image-female"]) {
    const srcPath = path.join(SRC, a["image-female"]);
    if (fs.existsSync(srcPath)) { fs.copyFileSync(srcPath, path.join(OUT_IMG_DIR, `${id}_f.png`)); iconF = true; }
  }
  return {
    id,
    name: a.name,
    rarity: a.rare ?? null,
    iconM, iconF,
    materials: (a.materials || []).map(m => ({ material: m.name, qty: m.amount })),
    defense: a.defense ?? null,
    resistances: {
      fire: a["fire-res"] ?? 0, water: a["water-res"] ?? 0, thunder: a["thundr-res"] ?? 0,
      ice: a["ice-res"] ?? 0, dragon: a["dragon-res"] ?? 0,
    },
    skills: (a["skill-points"] || []).map(s => ({ name: s.name, level: s.points })),
    part: PART_MAP[a.part] || a.part,
    decoSlots: Array.from({ length: a.slots || 0 }, () => 1),
    hunterType: a["hunter-type"] || null,
  };
});

fs.writeFileSync(path.join(OUT, "armor_pieces.json"), JSON.stringify(out, null, 1));
console.log(`Wrote ${out.length} armor pieces, ${out.filter(x => x.iconM).length} male / ${out.filter(x => x.iconF).length} female icons copied as PNG (convert pass next).`);
