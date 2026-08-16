/*
 * Spanish terminology collector for the MHFU pages on ElOtroLado.
 * It is deliberately translation-only: it never creates MHFU items/weapons.
 *
 * Usage: node mhfu/data/scrape_elotrolado_mhfu.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const CACHE = path.join(__dirname, "sources", "elotrolado_mhfu");
const OUT = path.join(__dirname, "elotrolado_mhfu_terms.json");
fs.mkdirSync(CACHE, { recursive: true });

const PAGES = [
  "Monster_Hunter_Freedom_Unite_-_%C3%81rbol_Grandes_Espadas_y_Espadas_Largas",
  "MHFU_Arbol_GSLS_G",
  "Monster_Hunter_Freedom_Unite_-_%C3%81rbol_Espadas_con_Escudo_y_Espadas_Duales",
  "Monster_Hunter_Freedom_Unite_-_%C3%81rbol_de_las_Espadas_con_Escudo_y_Espadas_Dobles_G",
  "MHFU_Arbol_Lanza_y_LanzaPistola",
  "Monster_Hunter_Freedom_Unite_-_%C3%81rbol_Lanza_y_Lanza_Pistola_G",
  "MHFU_Arbol_Martillo_y_CuernoDeCaza",
  "Monster_Hunter_Freedom_Unite_-_%C3%81rbol_Martillo_y_Cuerno_de_Caza_G",
  "Monster_Hunter_Freedom_Unite_-_%C3%81rbol_Arcos",
  "Monster_Hunter_Freedom_Unite_-_%C3%81rbol_Arcos_G",
  "Monster_Hunter_Freedom_Unite_-_Tabla_de_Objetos_por_Wyvern",
  "Monster_Hunter_Freedom_Unite_-_Combinaciones",
  "Monster_Hunter_Freedom_Unite_-_Granja",
];
const EXTRA_SOURCES = [
  "https://www.elotrolado.net/hilo_hilo-oficial-monster-hunter-freedom-2-7_937584",
];

function decode(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}
function plain(html) { return decode(html.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(); }
function norm(value) { return plain(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
function add(map, value, page, kind) {
  const text = plain(value);
  if (!/[a-záéíóúñ]/i.test(text) || text.length < 3 || text.length > 80) return;
  const key = norm(text);
  const item = map.get(key) || { name: text, count: 0, pages: [], kinds: [] };
  item.count++;
  if (!item.pages.includes(page)) item.pages.push(page);
  if (!item.kinds.includes(kind)) item.kinds.push(kind);
  map.set(key, item);
}
async function page(slug) {
  const file = path.join(CACHE, `${slug.replace(/[^a-z0-9]+/gi, "_")}.html`);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const url = `https://www.elotrolado.net/wiki/${slug}`;
  const res = await fetch(url, { headers: { "user-agent": "MonHunDB-Scraperino/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const html = await res.text();
  fs.writeFileSync(file, html);
  return html;
}
async function externalPage(url) {
  const file = path.join(CACHE, `external_${Buffer.from(url).toString("base64url")}.html`);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  const res = await fetch(url, { headers: { "user-agent": "MonHunDB-Scraperino/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const html = await res.text();
  fs.writeFileSync(file, html);
  return html;
}
(async () => {
  const terms = new Map(), weapons = new Map();
  for (const slug of PAGES) {
    const html = await page(slug);
    // Recipes and drop tables: preserve complete cells, including the compact
    // in-game abbreviations used by the original Spanish localization.
    for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => plain(m[1]));
      for (const cell of cells) add(terms, cell, slug, "table");
    }
    // Weapon labels live in colored spans next to their weapon-type icon.
    for (const span of html.matchAll(/<span[^>]*color:#[0-9a-f]{6}[^>]*>([\s\S]*?)<\/span>/gi)) add(weapons, span[1], slug, "weapon-tree");
  }
  for (const url of EXTRA_SOURCES) {
    const html = await externalPage(url);
    for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      for (const cell of [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]) add(terms, cell[1], url, "forum-table");
    }
    // The guide is written as preformatted exchange rows rather than HTML
    // tables, so retain its short text lines as potential source terms.
    for (const line of plain(html).split(/\s{2,}|\|/)) add(terms, line, url, "forum-guide");
  }
  const sort = map => [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), sources: [...PAGES.map(s => `https://www.elotrolado.net/wiki/${s}`), ...EXTRA_SOURCES], terms: sort(terms), weaponTerms: sort(weapons) }, null, 2) + "\n");
  console.log(`Collected ${terms.size} table terms and ${weapons.size} weapon-tree labels from ${PAGES.length + EXTRA_SOURCES.length} ElOtroLado sources.`);
})();
