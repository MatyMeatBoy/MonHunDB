// Genera artefactos listos para sumar al proyecto principal (NO toca el proyecto):
//  1) decoration_skills_fill.json   - para cada decoración con skill sin ES/effectES,
//                                     el par {nameEs, effectEs} oficial sacado de skills.json
//  2) armor_set_es_candidates.json  - candidato de nombre ES por set, derivado del prefijo
//     común de las nameEs de sus piezas (revisar a mano, es un candidato, no oficial)
//  3) missing_todos.json            - lista de entradas faltantes por agregar con verificación
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "sweep_out", "artifacts");
fs.mkdirSync(OUT, { recursive: true });
const D = path.join(__dirname, "..", "..", "mhrise-bestiario", "data");
const load = (f) => JSON.parse(fs.readFileSync(path.join(D, f), "utf8"));

const decorations = load("decorations.json");
const skills = load("skills.json");
const armorSets = load("armor_sets.json");
const armorPieces = load("armor_pieces.json");
const i18nCode = fs.readFileSync(path.join(D, "i18n.js"), "utf8");
const vm = require("vm");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(i18nCode + "\n;globalThis.__ALIASES = MATERIAL_NAME_ALIASES;", sandbox);

// 1) decoración -> skill con ES faltante + su traducción desde skills.json
const skillsByName = new Map(skills.filter((s) => s.name).map((s) => [s.name, s]));
const decoFill = {};
for (const d of decorations) {
  for (const s of d.skills || []) {
    if (!s.nameEs || !s.effectEs) {
      const src = skillsByName.get(s.name);
      decoFill[d.name] = {
        skill: s.name,
        fill: src
          ? { nameEs: src.nameEs, effectEs: src.levels && src.levels[0] ? src.levels[0].effectEs : null, fromSkill: src.id }
          : null,
      };
    }
  }
}
fs.writeFileSync(path.join(OUT, "decoration_skills_fill.json"), JSON.stringify(decoFill, null, 2));

// 2) candidatos de nombre ES de set (basado en el prefijo común de nameEs de sus piezas)
function commonPrefix(parts) {
  let p = parts[0] || "";
  for (const x of parts) {
    while (x.indexOf(p) !== 0) p = p.slice(0, -1);
  }
  return p.trim();
}
function hasESName(name) {
  const p = armorPieces.find((ap) => ap.name === name);
  return !!(p && p.nameEs && p.nameEs !== p.name);
}
const setCandidates = {};
for (const s of armorSets) {
  const pieceNames = (s.pieces || []).map((p) => p.name);
  let cand = null;
  const p = armorPieces.find((ap) => ap.id === s.pieces?.[0]?.id || ap.name === s.pieces?.[0]?.name) || armorPieces.find((ap) => ap.name === pieceNames[0]);
  const head = s.pieces?.[0];
  const find = (nm) => armorPieces.find((ap) => ap.name === nm);
  const headPiece = head && (find(head.name) || find(head.id) || armorPieces.find((ap) => ap.id === head.id));
  // Candidato: prefijo común de los nameEs de los pieces (si todos traen nameEs real)
  const esNames = pieceNames.map((nm) => find(nm)).filter(Boolean).map((p) => p.nameEs).filter(Boolean);
  const allReal = esNames.length >= 2 && esNames.every((n) => n && n !== pieceNames[esNames.indexOf(n)]);
  if (esNames.length >= 2) {
    const common = commonPrefixOf(esNames);
    if (common && common.length > 2) cand = common;
  }
  if (!cand && headPiece && headPiece.nameEs && headPiece.nameEs !== headPiece.name) {
    // último recurso: palabras significativas del nameEs de la pieza de cabeza
    const words = headPiece.nameEs.split(" ").slice(0, -1);
    if (words.length > 1) cand = words.join(" ");
  }
  setCandidates[s.name] = { candidate: cand, headPieceEs: headPiece && headPiece.nameEs, esNames };
}
function commonPrefixOf(arr) {
  let p = arr[0] || "";
  for (const s of arr) while (s && p.length && p.indexOf(s.slice(0, p.length)) !== 0 && p.length) p = p.slice(0, -1);
  // limpio
  return p.split(" ").slice(0, -1).join(" ").trim() || p;
}
fs.writeFileSync(path.join(OUT, "armor_set_es_candidates.json"), JSON.stringify(setCandidates, null, 2));

// 3) resumen de todo lo faltante (reporte corto reutilizable)
fs.writeFileSync(
  path.join(OUT, "missing_todos.json"),
  JSON.stringify(
    {
      materials: ["Volvi Carapace", "Volvi Rickrack", "Magna Soulprism+", "Somnacanth Talon", "Somnacanth Talon+"],
      ailmentsLowercase: ["poison", "sleep", "paralysis", "blast", "stun", "exhaust", "fireblight", "waterblight", "thunderblight", "iceblight"],
      bodyPartsLookupAfterDataFix: ["(hitzones de small_monsters.json: partes en ES y JP → normalizar a claves EN)"],
      partBreaksSmallMonsters: "(small_monsters.json partBreaks: 'Cuerpo'/'Cabeza' y hasta japonés; requiere normalización de datos)",
    },
    null,
    2
  )
);
console.log("artefactos generados en", OUT);
console.log("decos a llenar:", Object.keys(decoFill).length, "| sets con candidato:", Object.keys(setCandidates).length);