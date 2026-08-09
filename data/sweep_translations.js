// Barrido estático de traducciones ES/EN contra los datasets del mhrise-bestiario.
// SOLO LECTURA sobre el proyecto principal; outputs en bestiario-nemo/sweep_out/.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.join(__dirname, "..", "..", "mhrise-bestiario", "data");
const OUT = path.join(__dirname, "..", "sweep_out");
fs.mkdirSync(OUT, { recursive: true });

function loadJson(p) {
  return JSON.parse(fs.readFileSync(path.join(SRC, p), "utf8"));
}

const i18nCode = fs.readFileSync(path.join(SRC, "i18n.js"), "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  i18nCode + "\n;globalThis.__I18N = I18N; globalThis.__aliases = MATERIAL_NAME_ALIASES;",
  sandbox
);
const I18N = sandbox.__I18N;
const ALIASES = sandbox.__aliases || {};
function normKey(s) {
  const k = String(s).replace(/\s+\+/g, "+").trim();
  return ALIASES[k] || k;
}
function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

const R = { issues: [], reports: {} };
function issue(cat, entry, note) {
  R.issues.push({ cat, entry, note });
}

// ---------- 1. Diccionarios por categoría ----------
function dictCheck(cat, dict, usedKeys) {
  const used = unique(usedKeys);
  const missing = used.filter((k) => !(k in dict));
  const identicalES = Object.entries(dict).filter(([en, es]) => en === es && en.length > 7).map(([en]) => en);
  R.reports[cat] = { used, missingFromDict: missing, identicalES, totalEntries: Object.keys(dict).length };
  for (const m of missing) issue(cat, m, `usado y sin entrada en I18N.${cat} (cae a inglés en modo ES)`);
}

// ---------- 2. Monstruos ----------
const monsters = [...loadJson("monsters.json"), ...loadJson("small_monsters.json")];
const materialNames = new Set();
const hitzonePartKeys = new Set();
const ailmentKeys = new Set();
const parenTokens = new Set();

dictCheck("monsterNames", I18N.monsterNames, monsters.map((m) => m.name));
dictCheck("species", I18N.species, monsters.map((m) => m.species));
dictCheck("locations", I18N.locations, monsters.flatMap((m) => m.locations || []));

for (const m of monsters) {
  for (const w of [...(m.weaknesses || []), ...(m.resistances || [])]) {
    if (w.element && !(w.element in I18N.elements)) issue("elements", w.element, "elemento sin entrada");
  }
  for (const a of [...(m.ailmentSusceptibility || []), ...(m.ailmentBuildup || [])]) {
    if (a.ailment) ailmentKeys.add(a.ailment);
    if (a.label) ailmentKeys.add(a.label);
    if (a.key) ailmentKeys.add(a.key);
  }
  for (const a of m.inflicts || []) ailmentKeys.add(a);
  for (const h of m.hitzones || []) hitzonePartKeys.add(h.part);
  for (const rankRows of Object.values(m.materials || {})) {
    for (const row of rankRows || []) {
      materialNames.add(row.material);
      for (const cell of ["targetReward", "capture", "breakParts", "carves", "dropped"]) {
        for (const tok of (row[cell] || "").match(/\(([^)]+)\)/g) || []) {
          for (const t of tok.slice(1, -1).split(",")) {
            const x = t.trim();
            if (x && !/^\d+%$/.test(x) && !/^\d+$/.test(x)) parenTokens.add(x);
          }
        }
      }
    }
  }
}

R.reports.ailmentsUsed = [...ailmentKeys];
for (const a of ailmentKeys) if (!(a in I18N.ailments)) issue("ailments", a, "sin entrada en I18N.ailments");
R.reports.hitzonePartsUsed = [...hitzonePartKeys];
for (const p of hitzonePartKeys) if (!(p in I18N.bodyParts)) issue("bodyParts", p, "parte de hitzone sin entrada");
R.reports.materialParenTokens = [...parenTokens];
for (const t of parenTokens) if (!(t in I18N.bodyParts)) issue("bodyParts", t, "token de materiales sin entrada");

// ---------- 3. Materiales: cobertura del diccionario Kiranico ----------
const translations = loadJson("kiranico_item_translations.json");
const decorations = loadJson("decorations.json");
const weapons = loadJson("weapons.json");
const armorPieces = loadJson("armor_pieces.json");

const seen = new Set();
for (const d of decorations) for (const mt of d.materials || []) seen.add(normKey(mt.material));
for (const w of weapons) for (const mt of w.materials || []) seen.add(normKey(mt.material));
for (const a of armorPieces) for (const mt of a.materials || []) seen.add(normKey(mt.material));
for (const mn of materialNames) seen.add(normKey(mn));

const missingMat = [...seen].filter((k) => !(k in translations));
R.reports.materials = { totalUsed: seen.size, missingES: unique(missingMat) };
for (const m of missingMat) issue("materials", m, "material sin traducción ES en kiranico_item_translations.json");

const selfMatched = Object.entries(translations).filter(
  ([en, es]) => String(en).trim().toLowerCase() === String(es).trim().toLowerCase()
);
R.reports.materialsSelfMatch = selfMatched.map(([en, es]) => es);
if (selfMatched.length) issue("materialsDict", "ver materialsSelfMatch", `${selfMatched.length} entradas con ES idéntico a EN`);

// ---------- 4. Campos inline ES/EN ----------
function inlineCat(list, checkers, label) {
  const bad = [];
  for (const item of list) {
    const problems = checkers.filter((c) => c.c(item)).map((c) => c.label);
    if (problems.length) bad.push({ id: item.id || item.name || item.nameEs, name: item.name, problems });
  }
  R.reports[label] = bad;
  for (const b of bad) issue(label, b.name, `campos faltantes: ${b.problems.join(", ")}`);
}

inlineCat(
  decorations,
  [
    { label: "nameEs", c: (x) => !x.nameEs },
    { label: "skills.nameEs/effectEs", c: (x) => (x.skills || []).some((s) => !s.nameEs || !s.effectEs) },
  ],
  "decorations_inline"
);
inlineCat(weapons, [{ label: "nameEs", c: (x) => !x.nameEs }], "weapons_inline");
inlineCat(armorPieces, [{ label: "nameEs", c: (x) => !x.nameEs }], "armor_inline");

const skills = loadJson("skills.json");
inlineCat(
  skills,
  [
    { label: "nameEs", c: (x) => !x.nameEs },
    { label: "descEs", c: (x) => !x.descEs },
    { label: "levels.effectEs", c: (x) => (x.levels || []).some((l) => !l.effectEs) },
  ],
  "skills_inline"
);

const armorSets = loadJson("armor_sets.json");
for (const s of armorSets) {
  let hasEs = false;
  for (const p of s.pieces || []) {
    const piece = armorPieces.find((ap) => ap.id === p.id) || armorPieces.find((ap) => ap.name === p.name);
    if (piece && piece.nameEs) { hasEs = piece.nameEs !== piece.name; break; }
  }
  if (!hasEs) issue("armor_sets", s.name, "set sin evidencia de nombre ES (los sets no tienen campo nameEs propio)");
}
R.reports.armorSets = { total: armorSets.length, hasNameEsField: false, note: "el set no trae nameEs: el nombre del set se muestra tal cual viene del JSON en ambos idiomas" };

// ---------- 5. Notas de obtención ----------
const obtain = loadJson("material_obtain_notes.json");
const obtainMissing = Object.entries(obtain).filter(([, v]) => !v || !v.es || !v.en);
R.reports.obtainNotes = { total: Object.keys(obtain).length, missingLang: obtainMissing.map(([k]) => k) };
for (const o of obtainMissing) issue("obtain_notes", o[0], "le falta es y/o en");

// ---------- 6. UI: claves es vs en ----------
const esKeys = Object.keys(I18N.ui.es);
const enKeys = Object.keys(I18N.ui.en);
R.reports.ui = {
  missingInEn: esKeys.filter((k) => !(k in I18N.ui.en)),
  missingInEs: enKeys.filter((k) => !(k in I18N.ui.es)),
  totalEs: esKeys.length,
  totalEn: enKeys.length,
};
for (const k of R.reports.ui.missingInEn) issue("ui", k, "clave solo en ES");
for (const k of R.reports.ui.missingInEs) issue("ui", k, "clave solo en EN");

const enBlockValues = new Set(Object.values(I18N.ui.en).filter((v) => typeof v === "string"));
const esEnglishLike = Object.entries(I18N.ui.es).filter(([k, v]) => {
  if (typeof v !== "string" || !v) return false;
  if (enBlockValues.has(v)) return v !== "Idioma / Language" && v !== "MH Rise · Sunbreak";
  return false;
});
R.reports.uiEsEnglishValues = esEnglishLike.map(([k, v]) => `${k}: "${v}"`);
for (const [k, v] of esEnglishLike) issue("ui", k, `valor ES en inglés: "${v}"`);

// ---------- Resumen ----------
fs.writeFileSync(path.join(OUT, "static_report.json"), JSON.stringify(R, null, 2));
const counts = {};
for (const i of R.issues) counts[i.cat] = (counts[i.cat] || 0) + 1;
console.log(JSON.stringify({ totalIssues: R.issues.length, categories: counts }, null, 2));