/*
 * Translation-only crossmatch for MHFU.
 * This intentionally never imports MHGU items into MonHunDB: it stores the
 * English/Spanish Kiranico names separately, then emits only translations for
 * names that already exist in mhfu/data/items.json.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const mhfuItemsPath = path.join(ROOT, "mhfu/data/items.json");
const outSource = path.join(__dirname, "kiranico_item_translations.json");
const outMatches = path.join(ROOT, "mhfu/data/mhgu_item_translations.json");
const URLS = {
  en: "https://mhgu.kiranico.com/item",
  es: "https://mhgu.kiranico.com/es/item",
};

function decode(s) {
  return String(s || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'").replace(/&apos;/gi, "'");
}
function clean(s) { return decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(); }
function key(s) {
  return clean(String(s || "")).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s*\+\s*/g, "+").replace(/[^a-z0-9+]+/g, " ").trim();
}
async function fetchPage(url) {
  const res = await fetch(url, { headers: { "user-agent": "MonHunDB-Scraperino/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.text();
}
function parseItems(html) {
  const out = [];
  const re = /<a\s+href="https:\/\/mhgu\.kiranico\.com\/(?:es\/)?item\/([a-z0-9]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    const name = clean(match[2]);
    if (name) out.push({ id: match[1], name });
  }
  return out;
}

(async () => {
  const [enHtml, esHtml] = await Promise.all([fetchPage(URLS.en), fetchPage(URLS.es)]);
  const en = parseItems(enHtml);
  const es = parseItems(esHtml);
  const esById = new Map(es.map(row => [row.id, row.name]));
  const source = en.map(row => ({ id: row.id, en: row.name, es: esById.get(row.id) || row.name }))
    .filter(row => row.en && row.es);
  fs.writeFileSync(outSource, JSON.stringify({ source: URLS, generatedAt: new Date().toISOString(), items: source }, null, 2) + "\n");

  const mhfuItems = JSON.parse(fs.readFileSync(mhfuItemsPath, "utf8"));
  const byKey = new Map(source.map(row => [key(row.en), row]));
  const matches = {};
  for (const item of mhfuItems) {
    const row = byKey.get(key(item.name));
    if (!row || key(row.en) !== key(item.name) || row.en === row.es) continue;
    matches[item.name] = row.es;
  }
  fs.writeFileSync(outMatches, JSON.stringify({ source: URLS, generatedAt: new Date().toISOString(), matchedItems: Object.keys(matches).length, translations: matches }, null, 2) + "\n");
  console.log(`Saved ${source.length} MHGU source names and ${Object.keys(matches).length} MHFU translation matches.`);
})();
