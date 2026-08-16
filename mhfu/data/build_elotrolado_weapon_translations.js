/* Build high-confidence MHFU weapon translations from ElOtroLado weapon trees.
 * A Spanish label is accepted only when its weapon type + displayed attack
 * identifies exactly one existing local weapon. This is translation-only. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const CACHE = path.join(__dirname, "sources", "elotrolado_mhfu");
const OUT = path.join(__dirname, "elotrolado_weapon_translations.json");
const weapons = JSON.parse(fs.readFileSync(path.join(__dirname, "weapons.json"), "utf8"));
const ICON_TYPES = { "MhfuGs.png": "Great Sword", "MhfuLs.png": "Long Sword", "Sns.png": "Sword & Shield", "Ds.png": "Dual Blades", "Hm.png": "Hammer", "Hh.png": "Hunting Horn", "Lc.png": "Lance", "Gl.png": "Gunlance", "Bw.png": "Bow" };
const ELEMENTS = { "Fuego.png": "fire", "Agua.png": "water", "Rayo.png": "thunder", "Trueno.png": "thunder", "Hielo.png": "ice", "Dragon.png": "dragon", "Veneno.png": "poison", "Paralisis.png": "paralysis", "Sueno.png": "sleep" };
// These labels remain tied after every published stat is compared, but their
// English and Spanish series names make the source correspondence explicit.
// Keep this small, source-audited list rather than guessing from materials.
const MANUAL_SOURCE_TRANSLATIONS = {
  "Buster Blade G": "Hoja vengadora G", "Bone Blade G": "Hoja de hueso G", "Decapitator G": "Decapitador G", "Carbalite Sword G": "Espada Carbalita G", "Wyvern Agito G": "Agito dragón G", "Enforcer's Axe": "Hacha vengadora", "Ceanataur Blade": "Hoja Ceanataur", "Blue Claw Blade": "Hoja Garra azul", "Tiger Agito": "Agito de tigre", "Rusted Great Sword": "Gran Espada oxidada",
  "Iron Gunlance": "Lanza Pist. hierro", "Tigrex Gunlance": "Lan. Pis. Tigrex", "Crimson Lance": "Lanza carmesí", "Tarnished Lance": "Lanza deslustrada", "Worn Spear": "Venablo desgastado", "Iron Lance G": "Lanza de hierro G",
  "Iron Striker+": "Ariete de hierro+", "Ceanataur Head Axe": "Hacha cab. Ceanataur", "Spiked Hammer": "Martillo con púas", "Spiked Hammer+": "Martillo con púas+", "Bone Club": "Garrote de hueso", "Rusted Hammer": "Martillo oxidado", "Worn Hammer": "Martillo desgastado", "Tigrex Hammer": "Martillo Tigrex", "War Hammer G": "Martillo de guerra G", "Atlas Hammer G": "Martillo Atlas G", "Kut-Ku Pick G": "Mandíbula Kut-Ku G", "Hard Bone Hammer G": "Mart. hueso duro G",
  "Hunter's Bow I": "Arco de caz. I", "Hunter's Bow II": "Arco de caz. II", "Hunter's Bow III": "Arco de caz. III", "Hunter's Bow IV": "Arco de caz. IV", "Wild Bow I": "Arco salvaje I", "Wild Bow II": "Arco salvaje II", "Jungle Bow I": "Arco jungla I", "Jungle Bow II": "Arco jungla II", "Abominable Bow II": "Arco abominable II", "Wolf Bow": "Arco \"Lobo\"", "Crow Bow": "Arco \"Cuervo\"", "Wing Bow II": "Arco ala II", "Blue Blade Bow I": "Arco hoja azul I", "Blue Blade Bow II": "Arco hoja azul II", "Queen Blaster I": "Arco de reina I", "Queen Blaster II": "Arco de reina II", "Queen Blaster III": "Arco de reina III", "Queen Blaster IV": "Arco de reina IV", "Queen Blaster V": "Arco de reina V", "Heartshot Bow I": "Arco tir. cor. I", "Heartshot Bow II": "Arco tir. cor. II", "Tiger Arrow I": "Arco tigre I", "Tiger Arrow II": "Arco tigre II", "Tigrex Whisker": "Bigote Tigrex", "Hidden Bow": "Arco oculto", "Midnight Bow": "Arco medianoche", "Hunter's Bow G": "Arco de cazador G", "Wild Power Bow G": "Arco poder salvaj.G",
  "Chief Kris G": "Kris Jefe G", "Snake Bite G": "Mordedura serp. G", "Monoblos Club G": "Garrote Monoblos G", "Assassin's Dagger": "Daga de asesino", "Iron Chefblade": "Hoja chef hierro", "Sandman Spike": "Púa nana", "Rusted Sword": "Espada oxidada", "Rex Talon": "Garra Rex", "Tigrex Sword": "Espada Tigrex",
  "Rex Slicers": "Cortadores Rex", "Tigrex Claws": "Garras Tigrex", "Worn Blades": "Hojas desgastadas", "Tigrex Katana": "Katana Tigrex"
};
function decode(s) { return String(s || "").replace(/<[^>]+>/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&aacute;/g, "á").replace(/&eacute;/g, "é").replace(/&iacute;/g, "í").replace(/&oacute;/g, "ó").replace(/&uacute;/g, "ú").replace(/&ntilde;/g, "ñ").replace(/\s+/g, " ").trim(); }
function nameKey(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
const records = [];
for (const file of fs.readdirSync(CACHE).filter(file => file.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(CACHE, file), "utf8");
  const re = /<img[^>]+alt="([^"]+)"[^>]*>\s*<span[^>]*color:#[0-9a-f]{6}[^>]*>([\s\S]*?)<\/span>/gi;
  const matches = [...html.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const icon = matches[i][1], type = ICON_TYPES[icon];
    if (!type) continue;
    const nameEs = decode(matches[i][2]);
    const segment = html.slice(matches[i].index + matches[i][0].length, matches[i + 1]?.index || html.length);
    const attack = Number(segment.match(/<td>(\d+)z[\s\S]*?<\/td>\s*<td>(\d+)/i)?.[2]);
    const elementMatch = segment.match(/alt="([^"]+)"\s*\/?>\s*(\d+)/i);
    const element = elementMatch && ELEMENTS[elementMatch[1]] ? { type: ELEMENTS[elementMatch[1]], value: Number(elementMatch[2]) } : null;
    const affinity = Number(segment.match(/<td>\s*(-?\d+)%\s*<\/td>/i)?.[1]);
    const defense = Number(segment.match(/alt="Def\.png"[^>]*>\s*\+?(\d+)/i)?.[1] || 0);
    // The first sharpness bar is the normal sharpness; EOL encodes every
    // in-game point as two CSS pixels.  It is a direct stat, unlike a recipe
    // description, so it can safely separate otherwise identical entries.
    const sharpnessHtml = segment.match(/margin-top:0px;?">([\s\S]*?)margin-bottom:-1px/i)?.[1] || "";
    const sharpness = [...sharpnessHtml.matchAll(/width:(\d+)px/gi)].map(match => Number(match[1]) / 2);
    const slotPattern = segment.match(/<td>\s*([O-]{3})\s*<\/td>/)?.[1] || null;
    const slots = slotPattern ? [...slotPattern].filter(slot => slot === "O").length : null;
    if (!nameEs || !attack || nameEs === "dummy") continue;
    records.push({ file, type, nameEs, attack, element, affinity, defense, sharpness, slots });
  }
}
const translations = {}, ambiguous = [], unmatched = [];
for (const record of records) {
  let candidates = weapons.filter(w => w.type === record.type && Number(w.attack) === record.attack);
  if (record.element) {
    const elemental = candidates.filter(w => (w.elements || []).some(e => e.type === record.element.type && Number(e.value) === record.element.value));
    if (elemental.length) candidates = elemental;
  }
  if (candidates.length > 1 && Number.isFinite(record.affinity)) {
    const affinityMatches = candidates.filter(w => Number(w.affinity || 0) === record.affinity);
    if (affinityMatches.length) candidates = affinityMatches;
  }
  if (candidates.length > 1) {
    const defenseMatches = candidates.filter(w => Number(w.defense || 0) === record.defense);
    if (defenseMatches.length) candidates = defenseMatches;
  }
  if (candidates.length > 1 && record.sharpness.length >= 3) {
    const sharpnessMatches = candidates.filter(w =>
      (w.sharpness || []).length === record.sharpness.length &&
      w.sharpness.every((value, index) => Number(value) === record.sharpness[index])
    );
    if (sharpnessMatches.length) candidates = sharpnessMatches;
  }
  if (candidates.length > 1 && record.slots !== null) {
    const slotMatches = candidates.filter(w => (w.decoSlots || []).length === record.slots);
    if (slotMatches.length) candidates = slotMatches;
  }
  if (candidates.length === 1) {
    const [weapon] = candidates;
    // Identical local weapon can appear in normal/G pages; preserve first
    // label because both pages use the same official Spanish name.
    if (!translations[weapon.name]) translations[weapon.name] = record.nameEs;
  } else if (candidates.length) {
    // Some official Spanish names are deliberately unchanged (proper names,
    // series titles, etc.). Attack/type may collide, but an exact normalized
    // label identifies that local weapon without relying on a guess.
    const sameName = candidates.filter(w => nameKey(w.name) === nameKey(record.nameEs));
    if (sameName.length === 1) {
      if (!translations[sameName[0].name]) translations[sameName[0].name] = record.nameEs;
    } else ambiguous.push({ ...record, candidates: candidates.map(w => w.name) });
  } else unmatched.push(record);
}
for (const [weaponName, nameEs] of Object.entries(MANUAL_SOURCE_TRANSLATIONS)) {
  if (!weapons.some(weapon => weapon.name === weaponName)) throw new Error(`Unknown manual MHFU weapon: ${weaponName}`);
  if (!translations[weaponName]) translations[weaponName] = nameEs;
}
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), source: "https://www.elotrolado.net/wiki/Especial:Buscar?fulltext=Search&search=Monster+Hunter+Freedom+Unite", matchedWeapons: Object.keys(translations).length, translations, ambiguous, unmatched }, null, 2) + "\n");
console.log(`Matched ${Object.keys(translations).length} weapons; ${ambiguous.length} ambiguous, ${unmatched.length} unmatched labels retained for review.`);
