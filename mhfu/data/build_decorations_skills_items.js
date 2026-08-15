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
  Attack: { en: "Increases or decreases the hunter's attack power.", es: "Aumenta o reduce el poder de ataque del cazador." },
  Defense: { en: "Increases or decreases the hunter's defense.", es: "Aumenta o reduce la defensa del cazador." },
  Health: { en: "Increases or decreases the hunter's maximum health.", es: "Aumenta o reduce la salud máxima del cazador." },
  "All Resist": { en: "Increases or decreases all elemental resistances.", es: "Aumenta o reduce todas las resistencias elementales." },
  "Fire Res": { en: "Changes resistance to fire damage.", es: "Modifica la resistencia al daño de fuego." },
  "Water Res": { en: "Changes resistance to water damage.", es: "Modifica la resistencia al daño de agua." },
  ThunderRes: { en: "Changes resistance to thunder damage.", es: "Modifica la resistencia al daño de rayo." },
  "Ice Res": { en: "Changes resistance to ice damage.", es: "Modifica la resistencia al daño de hielo." },
  "Dragon Res": { en: "Changes resistance to dragon damage.", es: "Modifica la resistencia al daño de dragón." },
  Faint: { en: "Changes how easily the hunter faints after taking damage.", es: "Modifica la facilidad con la que el cazador se desmaya al recibir daño." },
  Poison: { en: "Changes resistance to poison and its effects.", es: "Modifica la resistencia al veneno y sus efectos." },
  Paralysis: { en: "Changes resistance to paralysis and its effects.", es: "Modifica la resistencia a la parálisis y sus efectos." },
  Sleep: { en: "Changes resistance to sleep and its effects.", es: "Modifica la resistencia al sueño y sus efectos." },
  Hunger: { en: "Affects the rate at which the hunter's stamina bar decreases.", es: "Afecta la velocidad a la que disminuye la barra de resistencia." },
  "Heat Res": { en: "Affects how quickly heat drains the hunter's health.", es: "Afecta la velocidad a la que el calor reduce la salud." },
  "Cold Res": { en: "Affects how quickly cold drains the hunter's stamina.", es: "Afecta la velocidad a la que el frío reduce la resistencia." },
  Gathering: { en: "Affects how many times materials can be gathered at a single gathering point.", es: "Afecta cuántas veces se pueden recoger materiales en un mismo punto de recolección." },
  Carving: { en: "Affects the number of times materials can be carved from a monster.", es: "Afecta cuántas veces se pueden extraer materiales de un monstruo." },
  Fishing: { en: "Improves fishing and reduces the chance of a fish escaping.", es: "Mejora la pesca y reduce la posibilidad de que escape el pez." },
  Artisan: { en: "Improves weapon sharpness and can add a higher sharpness level.", es: "Mejora el afilado del arma y puede añadir un nivel superior de filo." },
  Sharpness: { en: "Changes the weapon's sharpness and sharpening speed.", es: "Modifica el filo del arma y la velocidad de afilado." },
  Guard: { en: "Reduces stamina loss and knockback while guarding.", es: "Reduce la pérdida de resistencia y el retroceso al protegerse." },
  "Guard Up": { en: "Allows guarding attacks that normally cannot be blocked.", es: "Permite protegerse de ataques que normalmente no se pueden bloquear." },
  Evade: { en: "Extends the invulnerability window during an evade.", es: "Amplía la ventana de invulnerabilidad durante una evasión." },
  "Evade Dist": { en: "Changes the distance covered by evades.", es: "Modifica la distancia recorrida al evadir." },
  Expert: { en: "Changes affinity, affecting the chance of a critical hit.", es: "Modifica la afinidad, que afecta a la probabilidad de golpe crítico." },
  Potential: { en: "Activates stronger effects when the hunter's health is low.", es: "Activa efectos más fuertes cuando la salud del cazador es baja." },
  Stamina: { en: "Changes stamina consumption and recovery.", es: "Modifica el consumo y la recuperación de resistencia." },
  "Wide Area": { en: "Shares the effects of certain consumable items with nearby hunters.", es: "Comparte los efectos de ciertos consumibles con cazadores cercanos." },
  BombStrUp: { en: "Increases the damage dealt by bombs.", es: "Aumenta el daño infligido por las bombas." },
  Cooking: { en: "Changes the results of cooking and meal preparation.", es: "Modifica los resultados de cocinar y preparar comidas." },
  BBQ: { en: "Improves the timing and results of cooking meat.", es: "Mejora el tiempo y los resultados al cocinar carne." },
};

function skillDescription(pool) {
  if (MHFU_SKILL_DESCRIPTIONS[pool]) return MHFU_SKILL_DESCRIPTIONS[pool];
  return {
    en: "Describes the effects granted by this armor-skill point pool.",
    es: "Describe los efectos que activa este grupo de puntos de habilidad.",
  };
}

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
  const description = skillDescription(pool);
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
