const fs = require("fs");
const path = require("path");
const SRC = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/MHFU";
const OUT = __dirname;

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
fs.writeFileSync(path.join(OUT, "decorations.json"), JSON.stringify(decorations, null, 1));

// ---- skills (group flat point-tiers into pools, Rise-style levels[]) ----
const skillsRaw = JSON.parse(fs.readFileSync(path.join(SRC, "skills/skills.json"), "utf8"));
const pools = new Map();
for (const s of skillsRaw) {
  const pool = s["skill-point"];
  if (!pools.has(pool)) pools.set(pool, []);
  pools.get(pool).push(s);
}
const skills = [...pools.entries()].map(([pool, tiers], i) => {
  tiers.sort((a, b) => b.points - a.points);
  return {
    id: `mhfus${i + 1}`,
    name: pool,
    nameEs: pool,
    descEn: "", // no MHFU skill description text in the source -- "" (not null) so templates that skip the ${null}-literal guard don't print "null"
    descEs: "",
    levels: tiers.map((t, j) => ({ level: j + 1, effectEn: `${t.name} (${t.points >= 0 ? "+" : ""}${t.points} pts)`, effectEs: null, points: t.points })),
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
fs.writeFileSync(path.join(OUT, "items.json"), JSON.stringify(items, null, 1));

console.log(`Wrote ${decorations.length} decorations, ${skills.length} skills (from ${skillsRaw.length} tiers), ${items.length} items.`);
