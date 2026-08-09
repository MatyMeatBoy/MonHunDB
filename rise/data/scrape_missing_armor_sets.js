// scrape_missing_armor_sets.js
// 1. Carga sets existentes de armor_sets.json
// 2. Genera entries para sets FALTANTES buscando piezas en armor_pieces.json
// 3. Para piezas que no existen: las lista para scrape manual
// 4. Los sets con <3 piezas se saltan (incompletos)
//
// NO usa red (sin fetch a Fextralife). El matcheo es 100% local.
// La lista de sets de Fextralife se pasa como string inline (copiada del HTML).
//
// Uso: node rise/data/scrape_missing_armor_sets.js

const fs = require("fs");
const path = require("path");

const PIECES_PATH = path.join(__dirname, "armor_pieces.json");
const SETS_PATH = path.join(__dirname, "armor_sets.json");
const OUT_PATH = path.join(__dirname, "_new_armor_sets.json");

const pieces = JSON.parse(fs.readFileSync(PIECES_PATH, "utf8"));
const existingSets = JSON.parse(fs.readFileSync(SETS_PATH, "utf8"));
const existingNames = new Set(existingSets.map(s => s.name));

// Índice: "mosgharl vizor" → [piece, piece] (duplicados M/F, tomamos el menor rarity)
//   "mosgharl vizor s" → [piece...]
const pieceIndex = new Map();
for (const p of pieces) {
  const key = (p.name || "").toLowerCase();
  if (!pieceIndex.has(key)) pieceIndex.set(key, []);
  pieceIndex.get(key).push(p);
}

// Lista COMPLETA de sets de Fextralife (copiada de la barra lateral de
// https://monsterhunterrise.wiki.fextralife.com/Armor+Sets)
const FEXTRALIFE_SETS = [
  // --- Master Rank (X / Sunbreak) ---
  "Aelucanth X Set","Aknosom X Set","Alloy X Set","Almudron X Set","Anjanath X Set",
  "Arc Set","Archfiend Armor Set","Arzuros X Set","Astalos Set","Auroracanth Set",
  "Baggi X Set","Barbania Set","Barioth X Set","Barroth X Set","Basarios X Set",
  "Base Commander Set","Bazelgeuse X Set","Bishaten X Set","Bnahabra X Set",
  "Bone X Set","Brigade X Set","Bullfango Mask X Set","Ceanataur Set",
  "Chainmail X Set","Channeler (Spring) Set","Chaotic Gore Set","Charite Set",
  "Chrome Metal Set X","Commission Set","Crimson Valstrax - Epoch Set",
  "Damascus X Set","Death Stench X Set","Diablos X Set","Dignified Set",
  "Dober X Set","Droth X Set","Edel X Set","Espinas Set","Five Element Set",
  "Flaming Espinas Set","Garangolm Set","Gargwa X Set","Golden Lune Set",
  "Gore Magala Set","Goss Harag X Set","Grand Chaos Set","Grand Divine Ire Set",
  "Grand God's Peer Set","Grand Mizuha Set","Guardian Set","Guild Bard Set",
  "Guild Palace Set","Hawk Set","Heavy Knight Set","Hermitaur Set","Hornetaur Set",
  "Hunter X Set","Ibushi - Pure Set","Ingot X Set","Izuchi X Set","Jaggi Mask X Set",
  "Jaggi X Set","Jelly X Set","Jyuratodus X Set","Kaiser X Set","Kamura Legacy Set",
  "Khezu X Set","Knight Squire Set","Kulu-Ya-Ku X Set","Kushala X Set",
  "Lagombi X Set","Leather X Set","Lecture Set","Lucent Narga Set","Lunagaron Set",
  "Magmadron Set","Makluva X Set","Malzeno Set","Medium (Light) Set",
  "Melahoa X Set","Mizutsune X Set","Mosgharl X Set","Nargacuga X Set",
  "Narwa - Pure Set","Onmyo Set","Orangaten Set","Pride Set","Primordial Set",
  "Professor Set","Prudence Set","Pukei-Pukei X Set","Pyre-Kadaki Set",
  "Rakna-Kadaki X Set","Rathalos X Set","Rathian X Set","Remobra X Set",
  "Rhenoplos X Set","Rhopessa X Set","Rimeguard Set","Risen Kaiser Set",
  "Risen Kushala Set","Risen Mizuha Set","Royal Ludroth X Set","Sailor Set",
  "Scholar Set","Scholarly Set","Seregios Set","Silver Sol Set",
  "Sinister Demon Set","Sinister Grudge Set","Skalda X Set","Skull X Set",
  "Slagtoth X Set","Snowshear Set","Somnacanth X Set","Storge Set",
  "Tempest Set","Tetranadon X Set","Tigrex X Set","Tobi-Kadachi X Set",
  "Uroktor X Set","Utsushi True (Hidden) Set","Utsushi True (Visible) Set",
  "Vaik X Set","Velociprey Set","Vespoid Set","Virtue Set","Volvidon X Set",
  "Wroggi X Set","Yukumo Sky Set","Zinogre Set X",
  // --- High Rank (S) ---
  "Aelucanth S Set","Aknosom S Set","Alloy S Set","Almudron S Set","Anja S Set",
  "Arzuros S Set","Azur Age Set","Baggi S Set","Barioth S Set","Barroth S Set",
  "Basarios S Set","Bazel Set","Bishaten S Set","Black Leather Set",
  "Bnahabra S Set","Bone S Set","Brigade S Set","Bullfango S Set",
  "Chainmail S Set","Channeler S Set","Chaos S Set","Chrome Metal Set",
  "Damascus Set","Death Stench S Set","Diablos S Set","Dober Set","Droth S Set",
  "Edel S Set","Gargwa S Set","Golden Set","Goss Harag S Set","Hunter S Set",
  "Ibushi Set","Ingot S Set","Izuchi S Set","Jaggi Mask S Set","Jaggi S Set",
  "Jelly S Set","Jyura Set","Kadachi S Set","Kamura S Set","Kaiser Set",
  "Khezu S Set","Kulu S Set","Kushala Set","Lagombi S Set","Leather S Set",
  "Ludroth S Set","Makluva S Set","Medium S Set","Melahoa S Set",
  "Mighty Bow Feather Set","Mizuha Set","Mizutsune S Set","Mosgharl S Set",
  "Nargacuga S Set","Narwa Set","Pukei S Set","Rakna-Kadaki Set",
  "Rathalos S Set","Rathian S Set","Remobra S Set","Rhenoplos S Set",
  "Rhopessa S Set","Shell-Studded S Set","Sinister S Set","Skull S Set",
  "Slagtoth S Set","Somnacanth S Set","Spio S Set","Skalda S Set",
  "Tetranadon S Set","Tigrex S Set","Uroktor S Set","Utsushi S Set (Hidden)",
  "Utsushi S Set (Visible)","Vaik S Set","Volvidon S Set","Wroggi S Set",
  "Zinogre S Set",
  // --- Low Rank (base) ---
  "Aelucanth Set","Aknosom Set","Alloy Set","Almudron Set","Anja Set",
  "Arzuros Set","Baggi Set","Barioth Set","Barroth Set","Basarios Set",
  "Bishaten Set","Bnahabra Set","Bone Set","Brigade Set","Bullfango Set",
  "Chainmail Set","Channeler Set","Chaos Set","Death Stench Set","Diablos Set",
  "Droth Set","Edel Set","Gargwa Set","Goss Harag Set","Hunter Set","Ingot Set",
  "Izuchi Set","Jaggi Mask Set","Jaggi Set","Jelly Set","Kadachi Set",
  "Kamura Set","Khezu Set","Kulu Set","Lagombi Set","Leather Set","Ludroth Set",
  "Makluva Set","Medium Set","Melahoa Set","Mizutsune Set","Mosgharl Set",
  "Nargacuga Set","Pukei Set","Rathalos Set","Rathian Set","Remobra Set",
  "Rhenoplos Set","Rhopessa Set","Shell-Studded Set","Sinister Set","Skull Set",
  "Slagtoth Set","Spio Set","Skalda Set","Somnacanth Set","Tetranadon Set",
  "Tigrex Set","Uroktor Set","Utsushi Set (Hidden)","Utsushi Set (Visible)",
  "Vaik Set","Volvidon Set","Wroggi Set","Zinogre Set",
  // --- Varios / corregidos ---
  "Chaotic Gore Set","Risen Kaiser Set","Risen Kushala Set","Virtue Set",
  "Primordial Set","Valstrax Set"
];

// HELPERS

function normalizePieceName(n) {
  return (n || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function findPiece(name) {
  const key = normalizePieceName(name);
  const candidates = pieceIndex.get(key) || [];
  if (!candidates.length) return null;
  // preferir el de menor rarity (M/F dupes)
  candidates.sort((a, b) => (a.rarity || 99) - (b.rarity || 99));
  return candidates[0];
}

// Interpreta un nombre de set de Fextralife y da:
// - setName: nombre que va en armor_sets.json
// - pieceSuffix: "" | " S" | " X" para armar nombres de pieza
// - rankLabel: "Low", "High", "Master" para el orden
function parseSetName(fextraName) {
  let name = fextraName.replace(/\s+Set$/i, "");
  let suffix = "";
  let rank = "Low";

  // Detectar X / S al final
  if (/\sX$/i.test(name)) {
    suffix = " X";
    name = name.replace(/\sX$/i, "");
    rank = "Master";
  } else if (/\sS$/i.test(name)) {
    suffix = " S";
    name = name.replace(/\sS$/i, "");
    rank = "High";
  }

  // Sets que SIEMPRE son Master Rank (Sunbreak) aunque no tengan X
  const mrOnly = new Set([
    "Arc","Archfiend Armor","Astalos","Auroracanth","Barbania",
    "Ceanataur","Crimson Valstrax - Epoch","Dignified","Espinas",
    "Five Element","Flaming Espinas","Garangolm","Golden Lune",
    "Gore Magala","Grand Chaos","Grand Divine Ire","Grand God's Peer",
    "Grand Mizuha","Guardian","Guild Bard","Guild Palace","Hawk",
    "Heavy Knight","Hermitaur","Hornetaur","Lucent Narga","Lunagaron",
    "Magmadron","Malzeno","Onmyo","Orangaten","Pride","Primordial",
    "Professor","Prudence","Pyre-Kadaki","Rimeguard","Risen Kaiser",
    "Risen Kushala","Risen Mizuha","Seregios","Silver Sol",
    "Sinister Demon","Sinister Grudge","Snowshear","Storge","Tempest",
    "Velociprey","Vespoid","Virtue","Yukumo Sky",
  ]);
  if (mrOnly.has(name) && rank === "Low") rank = "Master";

  // Sets que son High Rank sin S
  const hrOnly = new Set([
    "Bazel","Shell-Studded","Black Leather","Mighty Bow Feather",
    "Azur Age","Golden","Mizuha","Spio","Valstrax","Kaiser S",
  ]);
  if (hrOnly.has(name) && rank === "Low") rank = "High";
  // "Kaiser S" tiene S → ya tiene rank High por suffix, bien.
  // "Valstrax" sin S en fextra → High Rank

  const setName = fextraName.replace(/\s+Set$/i, " Set").trim();

  return { setName, baseName: name, suffix, rank };
}

// Las 5 partes de cabeza a pies, ASÍ como aparecen en Fextralife
const PART_ORDER_SLOTS = ["head", "chest", "arms", "waist", "legs"];

// Para cada set, intenta inferir los nombres de pieza
function inferPieceNames(baseName, suffix) {
  // Los nombres de pieza suelen seguir un patrón, pero hay muchos irregulares.
  // Acá ponemos una tabla de mapeo baseName → [Visor, Ribplate, Creeper, Folia, Roots]
  // Para sets que no están en la tabla, tratamos de buscar piezas por el baseName
  // en el índice y ordenarlas por parte estándar.
  return null; // se busca en el índice directo
}

function findPiecesForSet(baseName, suffix) {
  const bn = baseName.toLowerCase();
  const su = suffix.toLowerCase().replace(/^\s/, ""); // "x", "s", ""

  // Buscar TODAS las piezas cuyo name empiece con baseName
  // y cuyo name termine con suffix (o sin suffix para base)
  const candidates = [];
  for (const [key, plist] of pieceIndex) {
    if (!key.startsWith(bn)) continue;
    for (const p of plist) {
      const pname = p.name.toLowerCase();
      if (!pname.startsWith(bn)) continue;
      // Verificar el suffix: si su="" buscamos piezas SIN " s" ni " x" al final
      // (o que terminen exactamente con el baseName)
      if (su === "") {
        // Pieza base: su nombre no debe contener " s" ni " x" como palabra final
        // Ej: "Mosgharl Vizor" → ok, "Mosgharl Vizor S" → no
        const rest = pname.slice(bn.length).trim();
        if (rest.endsWith(" s") || rest.endsWith(" x")) continue;
      } else if (su === "s") {
        // Pieza S: debe terminar en " s"
        const rest = pname.slice(bn.length).trim();
        if (!rest.endsWith(" s")) continue;
      } else if (su === "x") {
        // Pieza X: debe terminar en " x"
        const rest = pname.slice(bn.length).trim();
        if (!rest.endsWith(" x")) continue;
      }
      // Solo piezas con materials y defense (descartar layered)
      if (!p.materials || !p.materials.length || !p.defense) continue;
      candidates.push(p);
    }
  }

  if (!candidates.length) return null;

  // Agrupar por part
  const byPart = {};
  for (const p of candidates) {
    if (!byPart[p.part]) byPart[p.part] = p;
    else if ((p.rarity || 99) < (byPart[p.part].rarity || 99)) byPart[p.part] = p;
  }

  // Si el sufijo es S o X y nos faltan partes, intentar cross-referenciar
  // con el set base (sin sufijo) para corregir partes mal etiquetadas en Kiranico
  if ((su === "s" || su === "x") && Object.keys(byPart).length < 5) {
    const baseCandidates = [];
    for (const [key, plist] of pieceIndex) {
      if (!key.startsWith(bn)) continue;
      for (const p of plist) {
        const pname = p.name.toLowerCase();
        if (!pname.startsWith(bn)) continue;
        const rest = pname.slice(bn.length).trim();
        if (rest.endsWith(" s") || rest.endsWith(" x")) continue;
        if (!p.materials || !p.materials.length || !p.defense) continue;
        baseCandidates.push(p);
      }
    }
    const baseParts = {};
    for (const p of baseCandidates) {
      if (!baseParts[p.part] || (p.rarity || 99) < (baseParts[p.part].rarity || 99)) {
        baseParts[p.part] = p;
      }
    }
    // Mapa: nombre base → parte correcta
    const baseNameToPart = {};
    for (const [part, p] of Object.entries(baseParts)) {
      const baseRest = p.name.toLowerCase().slice(bn.length).trim();
      baseNameToPart[baseRest] = part;
    }
    // Reasignar partes de S/X según el mapeo del base
    const corrected = {};
    for (const p of candidates) {
      const pname = p.name.toLowerCase();
      let rest = pname.slice(bn.length).trim();
      rest = rest.replace(/\s[sx]$/i, ""); // quitar " s" o " x"
      const correctPart = baseNameToPart[rest];
      if (correctPart) {
        if (!corrected[correctPart] || (p.rarity || 99) < (corrected[correctPart].rarity || 99)) {
          corrected[correctPart] = p;
        }
      }
    }
    // Mantener partes que no se pudieron corregir
    for (const [part, p] of Object.entries(byPart)) {
      if (!corrected[part]) corrected[part] = p;
    }
    // Reescribir byPart
    for (const k of Object.keys(byPart)) delete byPart[k];
    Object.assign(byPart, corrected);
  }

  // Si tenemos las 5 partes, genial
  const result = [];
  for (const part of PART_ORDER_SLOTS) {
    const p = byPart[part];
    if (p) result.push({ part, id: String(p.id), name: p.name });
  }

  if (result.length >= 3) return result;
  return null;
}

// ---- MAIN ----

const newSets = [];
const skipped = [];
const missingPieces = [];

const fextraSeen = new Set();
for (const fn of FEXTRALIFE_SETS) {
  if (fextraSeen.has(fn)) continue;
  fextraSeen.add(fn);
  if (existingNames.has(fn)) continue;

  const { setName, baseName, suffix } = parseSetName(fn);
  const pieces = findPiecesForSet(baseName, suffix);

  if (pieces && pieces.length >= 3) {
    const slug = setName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const image = `https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/${slug}.png`;
    newSets.push({ name: setName, image, localImage: null, pieces });
    console.log(`  ✓ ${setName} (${pieces.length}p)`);
  } else {
    skipped.push(fn);
    if (!pieces) missingPieces.push(fn);
  }
}

// Escribir
const allSets = [...existingSets, ...newSets];
fs.writeFileSync(OUT_PATH, JSON.stringify(allSets, null, 2));

console.log(`\n=== RESULTADO ===`);
console.log(`Nuevos sets: ${newSets.length}`);
console.log(`Faltantes (sin piezas o <3): ${skipped.length}`);
if (skipped.length) {
  console.log(`  ${skipped.join(", ")}`);
}
console.log(`\nOutput: ${OUT_PATH}`);
console.log(`Revisar y luego: copy ${OUT_PATH} ${SETS_PATH}`);
