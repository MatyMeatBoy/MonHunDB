const fs = require("fs");
const path = require("path");
// Scraperino is kept as a local working tool, outside the public site data.
// Resolve it from this repository's ignored develop folder rather than from
// the old Claude-specific path, which no longer exists on this machine.
const SRC = path.resolve(__dirname, "../../develop/scraperino-riperinoopencode/Riperino/MHFU");
const OUT = __dirname;
const skillsOnly = process.argv.includes("--skills-only");

// Short pool descriptions transcribed as concise, original-language
// paraphrases from the MHFU skill guide. More pools can be added here without
// changing the schema or hand-editing the generated JSON.
const MHFU_SKILL_DESCRIPTIONS = {
  Gathering: {
    en: "Affects how many times materials can be gathered at a single gathering point.",
    es: "Afecta cuántas veces se pueden recoger materiales en un mismo punto de recolección.",
  },
};

// ---- decorations ----
const decosRaw = JSON.parse(fs.readFileSync(path.join(SRC, "decorations/decorations.json"), "utf8"));
const decorations = decosRaw.map((d, i) => ({
  id: `mhfud${i + 1}`,
  name: d.name,
  slotLevel: d.slots,
  description: null,
  // nameEs/effect/effectEs fall back to English text (no MHFU translations
  // exist yet) -- several templates read these fields unconditionally with
  // no undefined guard, so none of them can be omitted.
  skills: (d["skill-points"] || []).map(s => {
    const effect = `${s.points >= 0 ? "+" : ""}${s.points} pts`;
    return { name: s.name, nameEs: s.name, level: s.points, effect, effectEs: effect };
  }),
  materials: (d.materials || []).map(m => ({ material: m.name, qty: m.amount })),
  icon: null,
}));
if (!skillsOnly) fs.writeFileSync(path.join(OUT, "decorations.json"), JSON.stringify(decorations, null, 1));

// ---- skills (MHFU uses point pools, not numbered skill levels) ----
const skillsRaw = JSON.parse(fs.readFileSync(path.join(SRC, "skills/skills.json"), "utf8"));
// Scraperino's source is complete for the regular skill pools, except for
// Gathering -2. GameFAQs' MHFU skill guide documents it at -15 points.
if (!skillsRaw.some(s => s["skill-point"] === "Gathering" && s.points === -15)) {
  skillsRaw.push({
    name: "Gathering -2",
    "skill-point": "Gathering",
    points: -15,
    "name-es": "Recogida -2",
    "skill-point-es": "Recogida",
  });
}
const pools = new Map();
for (const s of skillsRaw) {
  const pool = s["skill-point"];
  if (!pools.has(pool)) pools.set(pool, []);
  pools.get(pool).push(s);
}
const skills = [...pools.entries()].map(([pool, tiers], i) => {
  tiers.sort((a, b) => b.points - a.points);
  const poolEs = tiers.find(t => t["skill-point-es"])?.["skill-point-es"] || pool;
  const description = MHFU_SKILL_DESCRIPTIONS[pool];
  return {
    id: `mhfus${i + 1}`,
    name: pool,
    nameEs: poolEs,
    descEn: description?.en || "",
    descEs: description?.es || "",
    // An activation has a required point threshold and a name. It is not a
    // "level": armor and decorations contribute points to this pool.
    activations: tiers.map(t => ({
      points: t.points,
      nameEn: t.name,
      // Scraperino has partial Spanish activation names. When an activation
      // is simply "Pool +N/-N", translate its pool even if its row lacks a
      // duplicate name-es field (Gathering +1/-1 are the key example).
      nameEs: t["name-es"] || (t.name.startsWith(pool) ? `${poolEs}${t.name.slice(pool.length)}` : t.name),
    })),
    colorIndex: i % 12,
  };
});
fs.writeFileSync(path.join(OUT, "skills.json"), JSON.stringify(skills, null, 1));

// ---- items / materials ----
const itemsRaw = JSON.parse(fs.readFileSync(path.join(SRC, "items/items.json"), "utf8"));
const items = itemsRaw.map((it, i) => ({
  id: `mhfui${i + 1}`,
  name: it.name,
  nameEs: null,
  category: it.icon || "material", // MHFU's "icon" field is a shape name (book/potion/…), reused as a rough category since there's no other category field
  iconId: null, // no MHFU-specific icon mask set exists yet -- materialIconTag() degrades to a placeholder
  color: null,
  description: it.description || null,
  rarity: it.rare ?? null,
  sellingPrice: it["selling-price"] ?? null,
  carryMax: it["carry-max"] ?? null,
}));
if (!skillsOnly) fs.writeFileSync(path.join(OUT, "items.json"), JSON.stringify(items, null, 1));

console.log(`Wrote ${skills.length} MHFU point-skill pools (from ${skillsRaw.length} activations).`);
