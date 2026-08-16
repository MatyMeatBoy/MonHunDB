/*
 * Cross-match the Spanish MHFU material names documented by ElOtroLado with
 * our English item catalogue.  The source uses the same in-game names, but
 * sometimes abbreviates them (e.g. "Colm. de Akantor"); those are retained in
 * a report and are never guessed into the catalogue.
 *
 * Usage: node mhfu/data/crossmatch_spanish_materials.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const CACHE = path.join(DATA, "sources");
fs.mkdirSync(CACHE, { recursive: true });

const SOURCES = {
  combinations: "https://www.elotrolado.net/wiki/MHFU_Combinaciones",
  wyvernDrops: "https://www.elotrolado.net/wiki/Monster_Hunter_Freedom_Unite_-_Tabla_de_Objetos_por_Wyvern",
};

function decodeHtml(s) {
  return s.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
function text(html) {
  return decodeHtml(html.replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function norm(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[+.,:;()\[\]"']/g, " ")
    .replace(/\s+/g, " ").trim();
}
function cells(row) {
  return [...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => text(m[1]));
}
function materialish(s) {
  const n = norm(s);
  if (!n || /^x?\d/.test(n) || /^(aldea|rango|captura|despiece|porrotura|deja caer|cuerpo|cola|pecho|espalda|garra|estomago|no puede|no suelta)/.test(n)) return false;
  return /[a-záéíóúñ]/i.test(s);
}

async function fetchSource(name, url) {
  const file = path.join(CACHE, `${name}.html`);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const res = await fetch(url, { headers: { "user-agent": "MonHunDB-data-research/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const body = await res.text();
  fs.writeFileSync(file, body);
  return body;
}

function parseSource(html) {
  const terms = new Map();
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const c = cells(m[1]);
    // Combination tables put both ingredients in the last two columns.
    const candidates = c.length >= 6 ? c.slice(-2) : [];
    // Wyvern table: the material is the sixth column ("Pieza").
    if (c.length >= 7) candidates.push(c[5]);
    for (const value of candidates) {
      const clean = value.replace(/\s*x\s*\d+\s*$/i, "").trim();
      if (!materialish(clean)) continue;
      const key = norm(clean);
      const old = terms.get(key) || { name: clean, count: 0 };
      old.count++;
      terms.set(key, old);
    }
  }
  return [...terms.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

const PARTS = {
  scale: ["escama", "escamas"], shell: ["concha", "conchas"], claw: ["garra", "garras"],
  fang: ["colmillo", "colmillos"], pelt: ["piel", "piel"], hide: ["piel", "piel"],
  bone: ["hueso", "huesos"], ore: ["mineral", "min."], stone: ["piedra", "piedras"],
  sac: ["bolsa", "bolsas"], wing: ["ala", "alas"], tail: ["cola", "colas"],
  spike: ["pua", "pua"], horn: ["cuerno", "cuernos"], plate: ["placa", "placas"],
  webbing: ["membrana", "membrana"], fluid: ["fluido", "fluidos"], extract: ["extracto", "extractos"],
  marrow: ["tuetano", "tuetano"], shell: ["concha", "conchas"],
};
function candidateNames(english) {
  const words = english.split(/\s+/);
  if (words.length < 2) return [];
  const part = PARTS[words.at(-1).toLowerCase()];
  if (!part) return [];
  const creature = words.slice(0, -1).join(" ");
  return part.map(p => `${p} de ${creature}`).concat(part.map(p => `${p} ${creature}`));
}

(async () => {
  const [combos, wyvern] = await Promise.all([
    fetchSource("elotrolado_combinaciones", SOURCES.combinations),
    fetchSource("elotrolado_wyvern_drops", SOURCES.wyvernDrops),
  ]);
  const sourceTerms = parseSource(combos).concat(parseSource(wyvern));
  const termMap = new Map();
  for (const t of sourceTerms) termMap.set(norm(t.name), { ...t, count: (termMap.get(norm(t.name))?.count || 0) + t.count });

  const itemsFile = path.join(DATA, "items.json");
  const items = JSON.parse(fs.readFileSync(itemsFile, "utf8"));
  const sourceKeys = new Set(termMap.keys());
  let updated = 0;
  const matches = [];
  for (const item of items) {
    const candidates = candidateNames(item.name).map(norm).filter(sourceKeys.has, sourceKeys);
    if (candidates.length !== 1) continue;
    const match = termMap.get(candidates[0]);
    const wasMissing = !item.nameEs;
    if (wasMissing) item.nameEs = match.name;
    if (norm(item.nameEs) !== norm(match.name)) continue;
    updated++;
    matches.push({ english: item.name, spanish: match.name, occurrences: match.count, updated: wasMissing });
  }
  fs.writeFileSync(itemsFile, JSON.stringify(items, null, 1) + "\n");
  const report = {
    generatedAt: new Date().toISOString(),
    sources: SOURCES,
    sourceTerms: termMap.size,
    matchedItems: matches.length,
    matches,
    unmatchedSourceTerms: [...termMap.values()].filter(t => !items.some(i => norm(i.nameEs) === norm(t.name))).slice(0, 500),
  };
  fs.writeFileSync(path.join(DATA, "spanish_material_crossmatch.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(`Spanish material cross-match: ${updated} item names updated; ${termMap.size} source terms indexed.`);
})();
