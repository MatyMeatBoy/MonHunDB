/* Translation-only MH4U source collector. It never mutates the MHFU item list. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const URLS = {
  en: "https://kiranico.com/en/mh4u/item",
  es: "https://kiranico.com/es/mh4u/%C3%ADtem",
};
const OUT = path.join(__dirname, "kiranico_item_translations.json");
const MHFU_OUT = path.join(ROOT, "mhfu/data/mh4u_item_translations.json");

function decode(s) {
  return String(s || "").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, (_, n) => ({ aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", ntilde: "ñ", ü: "ü", uuml: "ü", iquest: "¿", iexcl: "¡", ordf: "ª", ordm: "º", middot: "·", amp: "&", quot: '"', apos: "'" }[n.toLowerCase()] || `&${n};`))
    .replace(/&nbsp;/gi, " ");
}
function clean(s) { return decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(); }
function key(s) { return clean(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s*\+\s*/g, "+").replace(/[^a-z0-9+]+/g, " ").trim(); }
async function fetchPage(url) {
  const res = await fetch(url, { headers: { "user-agent": "MonHunDB-Scraperino/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.text();
}
function parseList(html, locale) {
  const segment = locale === "es" ? "es/mh4u/%C3%ADtem" : "en/mh4u/item";
  const re = new RegExp(`<a\\s+href="https://kiranico\\.com/${segment}/([^"/]+)"[^>]*>([\\s\\S]*?)</a>`, "gi");
  const skip = new Set(["wyporium", "combo", "veggie-elder", "veggie-anciano"]);
  return [...html.matchAll(re)].map(m => ({ slug: m[1], name: clean(m[2]) })).filter(row => !skip.has(row.slug));
}
(async () => {
  const [enHtml, esHtml] = await Promise.all([fetchPage(URLS.en), fetchPage(URLS.es)]);
  const en = parseList(enHtml, "en");
  const es = parseList(esHtml, "es");
  if (!en.length || !es.length) throw new Error(`Could not parse item lists (en=${en.length}, es=${es.length})`);
  const count = Math.min(en.length, es.length);
  const source = [];
  for (let i = 0; i < count; i++) source.push({ index: i, en: en[i].name, es: es[i].name, enSlug: en[i].slug, esSlug: es[i].slug });
  fs.writeFileSync(OUT, JSON.stringify({ source: URLS, generatedAt: new Date().toISOString(), itemCount: source.length, items: source }, null, 2) + "\n");

  const mhfuItems = JSON.parse(fs.readFileSync(path.join(ROOT, "mhfu/data/items.json"), "utf8"));
  const exact = new Map(source.map(row => [key(row.en), row]));
  const translations = {};
  for (const item of mhfuItems) {
    const row = exact.get(key(item.name));
    if (row && row.en === item.name && row.es && row.es !== row.en) translations[item.name] = row.es;
  }
  fs.writeFileSync(MHFU_OUT, JSON.stringify({ source: URLS, generatedAt: new Date().toISOString(), matchedItems: Object.keys(translations).length, translations }, null, 2) + "\n");
  console.log(`Saved ${source.length} MH4U source names and ${Object.keys(translations).length} exact MHFU matches.`);
})();
