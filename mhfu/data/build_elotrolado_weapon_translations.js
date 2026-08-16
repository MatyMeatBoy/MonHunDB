/* Build high-confidence MHFU weapon translations from ElOtroLado weapon trees.
 * A Spanish label is accepted only when its weapon type + displayed attack
 * identifies exactly one existing local weapon. This is translation-only. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "../..");
const CACHE = path.join(__dirname, "sources", "elotrolado_mhfu");
const OUT = path.join(__dirname, "elotrolado_weapon_translations.json");
const weapons = JSON.parse(fs.readFileSync(path.join(__dirname, "weapons.json"), "utf8"));
const items = JSON.parse(fs.readFileSync(path.join(__dirname, "items.json"), "utf8"));
const mhguTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, "mhgu_item_translations.json"), "utf8")).translations || {};
const mh4uTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, "mh4u_item_translations.json"), "utf8")).translations || {};
const ICON_TYPES = { "MhfuGs.png": "Great Sword", "MhfuLs.png": "Long Sword", "Sns.png": "Sword & Shield", "Ds.png": "Dual Blades", "Hm.png": "Hammer", "Hh.png": "Hunting Horn", "Lc.png": "Lance", "Gl.png": "Gunlance", "Bw.png": "Bow" };
const ELEMENTS = { "Fuego.png": "fire", "Agua.png": "water", "Rayo.png": "thunder", "Hielo.png": "ice", "Dragon.png": "dragon", "Veneno.png": "poison", "Paralisis.png": "paralysis", "Sueno.png": "sleep" };
function decode(s) { return String(s || "").replace(/<[^>]+>/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&aacute;/g, "á").replace(/&eacute;/g, "é").replace(/&iacute;/g, "í").replace(/&oacute;/g, "ó").replace(/&uacute;/g, "ú").replace(/&ntilde;/g, "ñ").replace(/\s+/g, " ").trim(); }
function nameKey(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
const i18nContext = { itemsByName: new Map(items.map(item => [item.name, item])), globalThis: { injected: { ...mhguTranslations, ...mh4uTranslations } } };
vm.createContext(i18nContext);
vm.runInContext(fs.readFileSync(path.join(__dirname, "i18n.js"), "utf8") + "; I18N.materials = {...I18N.materials, ...globalThis.injected}; globalThis.translateMaterial = translateMaterial;", i18nContext);
const translateMaterial = i18nContext.globalThis.translateMaterial;
function materialScore(weapon, sourceText) {
  const source = nameKey(sourceText);
  return (weapon.materials || []).reduce((score, { material }) => {
    const translated = nameKey(translateMaterial(material));
    // Short/generic pieces ("Hueso", "Piel") cannot distinguish a branch.
    return translated.length > 7 && source.includes(translated) ? score + 1 : score;
  }, 0);
}
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
    if (!nameEs || !attack || nameEs === "dummy") continue;
    records.push({ file, type, nameEs, attack, element, sourceText: decode(segment) });
  }
}
const translations = {}, ambiguous = [], unmatched = [];
let materialResolved = 0;
for (const record of records) {
  let candidates = weapons.filter(w => w.type === record.type && Number(w.attack) === record.attack);
  if (record.element) {
    const elemental = candidates.filter(w => (w.elements || []).some(e => e.type === record.element.type && Number(e.value) === record.element.value));
    if (elemental.length) candidates = elemental;
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
    } else {
      const scored = candidates.map(weapon => ({ weapon, score: materialScore(weapon, record.sourceText) })).sort((a, b) => b.score - a.score);
      // A pair of translated upgrade materials, with a clear lead over every
      // other same-stat weapon, is enough evidence to resolve the branch.
      if (scored[0].score >= 2 && scored[0].score > (scored[1]?.score || 0)) {
        if (!translations[scored[0].weapon.name]) translations[scored[0].weapon.name] = record.nameEs;
        materialResolved++;
      } else ambiguous.push({ ...record, candidates: candidates.map(w => w.name) });
    }
  } else unmatched.push(record);
}
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), source: "https://www.elotrolado.net/wiki/Especial:Buscar?fulltext=Search&search=Monster+Hunter+Freedom+Unite", matchedWeapons: Object.keys(translations).length, materialResolved, translations, ambiguous, unmatched }, null, 2) + "\n");
console.log(`Matched ${Object.keys(translations).length} weapons (${materialResolved} resolved by upgrade materials); ${ambiguous.length} ambiguous, ${unmatched.length} unmatched labels retained for review.`);
