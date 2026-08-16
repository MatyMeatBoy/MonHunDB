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
  Antiseptic: { en: "Prevents or worsens the effects of being covered in foul stench.", es: "Previene o empeora los efectos de quedar cubierto de hedor." },
  Fatigue: { en: "Changes how easily monsters become exhausted from your attacks.", es: "Modifica la facilidad con la que los monstruos se agotan por tus ataques." },
  "Snow Res": { en: "Prevents or worsens movement penalties caused by deep snow.", es: "Previene o empeora las penalizaciones de movimiento por nieve profunda." },
  "Quake Res": { en: "Prevents or worsens the stagger caused by strong ground tremors.", es: "Previene o empeora el tambaleo causado por temblores fuertes." },
  HearProtct: { en: "Reduces or removes the opening caused by monster roars.", es: "Reduce o elimina la apertura que provocan los rugidos de monstruo." },
  "Wind Press": { en: "Reduces or removes the stagger caused by a monster's wind pressure.", es: "Reduce o elimina el tambaleo causado por la presión de viento de un monstruo." },
  "Anti-Theft": { en: "Prevents or increases the chance that a Felyne steals an item.", es: "Evita o aumenta la posibilidad de que un Felyne robe un objeto." },
  ResistSts: { en: "Changes resistance to status ailments such as poison, sleep, paralysis and stun.", es: "Modifica la resistencia a estados como veneno, sueño, parálisis y aturdimiento." },
  AntiFirDrg: { en: "Changes resistance to Fire Wyvern fireballs and similar attacks.", es: "Modifica la resistencia a bolas de fuego de wyverns de fuego y ataques similares." },
  AntiDaora: { en: "Changes resistance to Kushala Daora's wind effects.", es: "Modifica la resistencia a los efectos de viento de Kushala Daora." },
  AntiChamel: { en: "Changes resistance to Chameleos's theft and concealment effects.", es: "Modifica la resistencia a los efectos de robo y ocultación de Chameleos." },
  Fencing: { en: "Prevents melee attacks from bouncing so weapon combos are not interrupted.", es: "Evita que los ataques cuerpo a cuerpo reboten y corten los combos." },
  SwdShrpner: { en: "Changes whetstone speed and how much sharpness is restored.", es: "Modifica la velocidad de uso de la piedra de afilar y el filo restaurado." },
  "Auto-Guard": { en: "Automatically blocks attacks when the equipped weapon can guard.", es: "Bloquea ataques automáticamente cuando el arma equipada permite defenderse." },
  "Sword Draw": { en: "Makes draw attacks critical hits.", es: "Hace que los ataques al desenvainar sean golpes críticos." },
  Edgemaster: { en: "Combines a sharpness benefit with an attack benefit.", es: "Combina una mejora de filo con una mejora de ataque." },
  "NormalS Up": { en: "Changes damage dealt by Normal Shots.", es: "Modifica el daño de los Disparos Normales." },
  "PierceS Up": { en: "Changes damage dealt by Pierce Shots.", es: "Modifica el daño de los Disparos Perforantes." },
  "PelletS Up": { en: "Changes damage dealt by Pellet Shots.", es: "Modifica el daño de los Disparos de Perdigón." },
  NormalSAdd: { en: "Adds or removes compatible Normal Shot ammunition.", es: "Añade o elimina munición compatible de Disparo Normal." },
  PierceSAdd: { en: "Adds or removes compatible Pierce Shot ammunition.", es: "Añade o elimina munición compatible de Disparo Perforante." },
  PelletSAdd: { en: "Adds or removes compatible Pellet Shot ammunition.", es: "Añade o elimina munición compatible de Disparo de Perdigón." },
  CragSAdd: { en: "Adds or removes compatible Crag Shot ammunition.", es: "Añade o elimina munición compatible de Disparo Explosivo." },
  ClustSAdd: { en: "Adds or removes compatible Clust Shot ammunition.", es: "Añade o elimina munición compatible de Disparo de Grupo." },
  Reload: { en: "Changes bowgun reload speed.", es: "Modifica la velocidad de recarga de la ballesta." },
  AutoReload: { en: "Automatically reloads a bowgun, with the corresponding recoil tradeoff.", es: "Recarga la ballesta automáticamente, con el coste de retroceso correspondiente." },
  Recoil: { en: "Changes recoil after firing bowgun ammunition.", es: "Modifica el retroceso tras disparar munición de ballesta." },
  Precision: { en: "Changes bowgun deviation and shot precision.", es: "Modifica la desviación de la ballesta y la precisión de los disparos." },
  PoisonCAdd: { en: "Adds or removes compatible Poison Coatings for bows.", es: "Añade o elimina Revestimientos de Veneno compatibles para arcos." },
  ParalyCAdd: { en: "Adds or removes compatible Paralysis Coatings for bows.", es: "Añade o elimina Revestimientos de Parálisis compatibles para arcos." },
  SleepCAdd: { en: "Adds or removes compatible Sleep Coatings for bows.", es: "Añade o elimina Revestimientos de Sueño compatibles para arcos." },
  PowerCAdd: { en: "Adds or removes compatible Power Coatings for bows.", es: "Añade o elimina Revestimientos de Poder compatibles para arcos." },
  ClsRngCAdd: { en: "Adds or removes compatible Close-range Coatings for bows.", es: "Añade o elimina Revestimientos de Rango Corto compatibles para arcos." },
  SteadyHand: { en: "Changes the handling and deviation of bowgun shots.", es: "Modifica el manejo y la desviación de los disparos de ballesta." },
  "Spc Attack": { en: "Changes the power of a weapon's special attack property.", es: "Modifica la potencia de la propiedad de ataque especial del arma." },
  ElementAtk: { en: "Changes elemental damage dealt by weapons.", es: "Modifica el daño elemental infligido por las armas." },
  "Rec Speed": { en: "Changes how quickly the hunter recovers after being knocked down.", es: "Modifica la rapidez con la que el cazador se recupera tras caer." },
  Protection: { en: "Changes the chance of reducing damage from an incoming hit.", es: "Modifica la probabilidad de reducir el daño de un golpe recibido." },
  Gunnery: { en: "Changes the strength of ballistae, cannons and certain explosive attacks.", es: "Modifica la potencia de ballestas, cañones y ciertos ataques explosivos." },
  Capacity: { en: "Changes weapon capacity, such as bowgun loading or bow coatings.", es: "Modifica la capacidad del arma, como la carga de ballesta o revestimientos del arco." },
  ShortCharg: { en: "Changes the time required to charge a weapon attack.", es: "Modifica el tiempo necesario para cargar un ataque de arma." },
  Guts: { en: "Can prevent a lethal hit when the hunter has enough health.", es: "Puede evitar un golpe letal cuando el cazador tiene suficiente salud." },
  Fury: { en: "Changes the attack bonus gained when the hunter is enraged.", es: "Modifica el bonus de ataque obtenido cuando el cazador entra en furia." },
  Map: { en: "Shows or hides the map at the start of a quest.", es: "Muestra u oculta el mapa al inicio de una misión." },
  PsychicVis: { en: "Shows large monsters on the map for a period of time.", es: "Muestra temporalmente a los monstruos grandes en el mapa." },
  HiSpdGathr: { en: "Increases the speed of carving, mining, gathering and bug catching.", es: "Aumenta la velocidad de carvear, minar, recolectar y capturar insectos." },
  Backpackng: { en: "Improves movement and fall safety while carrying an egg.", es: "Mejora el movimiento y la seguridad al caer mientras llevas un huevo." },
  Whim: { en: "Changes the chance that pickaxes, bugnets and flutes break.", es: "Modifica la posibilidad de que se rompan picos, redes de insectos y flautas." },
  Terrain: { en: "Changes damage and movement penalties from hazardous terrain.", es: "Modifica el daño y las penalizaciones de movimiento por terreno peligroso." },
  Constitutn: { en: "Changes the stamina cost of actions such as evading and blocking.", es: "Modifica el coste de resistencia de acciones como evadir y bloquear." },
  Sneak: { en: "Changes how likely monsters are to notice and target the hunter.", es: "Modifica la probabilidad de que los monstruos detecten y ataquen al cazador." },
  Fate: { en: "Changes the number and quality of quest rewards.", es: "Modifica la cantidad y calidad de las recompensas de misión." },
  SpeedSetup: { en: "Changes the speed of placing traps and using certain field items.", es: "Modifica la velocidad al colocar trampas y usar ciertos objetos de campo." },
  Tranquilzr: { en: "Changes the effectiveness of tranquilizers used for capture.", es: "Modifica la eficacia de los tranquilizantes usados para capturar." },
  Perceive: { en: "Changes the information displayed about a monster's condition.", es: "Modifica la información mostrada sobre el estado de un monstruo." },
  Recovery: { en: "Changes the amount of health restored by recovery items.", es: "Modifica la cantidad de salud restaurada por objetos de curación." },
  Everlastng: { en: "Changes the duration of beneficial item effects.", es: "Modifica la duración de los efectos beneficiosos de objetos." },
  Throw: { en: "Changes the range and handling of thrown items.", es: "Modifica el alcance y manejo de los objetos arrojados." },
  Gluttony: { en: "Changes the effect and risk of eating food items.", es: "Modifica el efecto y el riesgo de comer objetos de comida." },
  Horn: { en: "Changes the effectiveness of Hunting Horn melodies.", es: "Modifica la eficacia de las melodías de la Cornamusa." },
  MixSucRate: { en: "Changes the success rate when combining items.", es: "Modifica la tasa de éxito al combinar objetos." },
  "Shot Mix": { en: "Changes the result of combining ammunition.", es: "Modifica el resultado de combinar munición." },
  Alchemy: { en: "Enables special alchemy combinations.", es: "Permite combinaciones especiales de alquimia." },
  ComrdGuide: { en: "Changes the guidance and support provided by the Felyne companion.", es: "Modifica la guía y apoyo proporcionados por el camarada Felyne." },
  ComradeAtk: { en: "Changes the attack strength of the Felyne companion.", es: "Modifica la fuerza de ataque del camarada Felyne." },
  ComradeDef: { en: "Changes the defense of the Felyne companion.", es: "Modifica la defensa del camarada Felyne." },
  "Torso Inc": { en: "Doubles the skill points on the torso armor piece.", es: "Duplica los puntos de habilidad de la pieza de torso." },
};

function skillDescription(pool) {
  if (MHFU_SKILL_DESCRIPTIONS[pool]) return MHFU_SKILL_DESCRIPTIONS[pool];
  return {
    en: "Describes the effects granted by this armor-skill point pool.",
    es: "Describe los efectos que activa este grupo de puntos de habilidad.",
  };
}

// Keep the explanation next to every signed threshold as well.  MHFU does
// not use skill "levels": this tells the player what a particular +/− row
// actually turns on, while the pool description explains the underlying
// mechanic.
function activationDescription(pool, tier, language) {
  const desc = skillDescription(pool);
  const name = language === "es"
    ? (tier["name-es"] || tier.name)
    : tier.name;

  if (pool === "Gathering") {
    const amount = Math.abs(tier.points) >= 15 ? 2 : 1;
    if (tier.points > 0) {
      return language === "es"
        ? `Permite ${amount} recolecci${amount === 1 ? "ón" : "ones"} adicional${amount === 1 ? "" : "es"} en cada punto de recolección.`
        : `Allows ${amount} additional gather${amount === 1 ? "" : "s"} at each gathering point.`;
    }
    return language === "es"
      ? `Reduce en ${amount} la${amount === 1 ? "" : "s"} recolecci${amount === 1 ? "ón" : "ones"} disponible${amount === 1 ? "" : "s"} en cada punto.`
      : `Removes ${amount} gather${amount === 1 ? "" : "s"} from each gathering point.`;
  }

  const pointText = `${tier.points > 0 ? "+" : ""}${tier.points}`;
  return language === "es"
    ? `Con ${pointText} puntos activa «${name}». ${desc.es}`
    : `At ${pointText} points, activates “${name}”. ${desc.en}`;
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
      descEn: activationDescription(pool, t, "en"),
      descEs: activationDescription(pool, t, "es"),
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
