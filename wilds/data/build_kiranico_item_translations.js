// Builds wilds/data/kiranico_item_translations.json (EN name -> ES name),
// covering BOTH sources translateMaterial() draws from: items_wilds.json
// (Fextralife /Items catalog) and every monster-drop material name in
// monsters.json. Source: the locally scraped Kiranico EN/ES item list living
// in the standalone webscraper tool's output (../../Apps/claude/webscraper).
//
// Kiranico spells the "+" tier as a literal "+" ("Whetfish Fin+"); Fextralife
// items_wilds.json spells it "Plus" ("Whetfish Fin Plus") while monsters.json
// already uses "+" (sometimes with a stray space, "Name +"). Normalize both
// sides to match, but key the output dict by normalizeMaterialKey(name) --
// the exact same normalization translateMaterial() applies before its
// lookup (see i18n_wilds.js) -- so both sources hit correctly at runtime.
const fs = require('fs');
const path = require('path');

const ITEMS_PATH = path.join(__dirname, 'items_wilds.json');
const MONSTERS_PATH = path.join(__dirname, 'monsters.json');
const OUT_PATH = path.join(__dirname, 'kiranico_item_translations.json');
const KIRANICO_PATH = path.join(__dirname, '../../../../Apps/claude/webscraper/out/wilds/items.json');

// Mirrors i18n_wilds.js's normalizeMaterialKey() exactly.
const MATERIAL_NAME_ALIASES = {
  'Volvidon Rickrack': 'Volvi Rickrack',
  'Volvidon Carapace': 'Volvi Carapace',
  'Magnamalo Soulprism': 'Magna Soulprism',
  'Magnamalo Soulprism+': 'Magna Soulprism+',
};
function normalizeMaterialKey(s) {
  const key = s.replace(/\s+\+/g, '+').trim();
  return MATERIAL_NAME_ALIASES[key] || key;
}

function decodeEntities(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, '&').trim();
}

// Loose match key for pairing against Kiranico: decode entities, collapse
// the "Plus"/" +" tier spelling to a bare "+", lowercase. Also covers two
// Guardian-monster certificate spelling mismatches found by hand (Fextralife
// vs Kiranico disagree on how to abbreviate "Guardian" and "Gamma"):
//   items_wilds.json "G Doshaguma Certificate"   vs Kiranico "G. Doshaguma Certificate"
//   items_wilds.json "Rey Dau Certificate Gamma" vs Kiranico "Rey Dau Certificate γ"
function matchKey(s) {
  let v = decodeEntities(s).replace(/\s+\+/, '+').replace(/\s+Plus$/i, '+').trim();
  v = v.replace(/^G ([A-Z])/, 'G. $1').replace(/\bGamma\b/, 'γ');
  return v.toLowerCase();
}

const items = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));
const monsters = JSON.parse(fs.readFileSync(MONSTERS_PATH, 'utf8'));
const kiranico = JSON.parse(fs.readFileSync(KIRANICO_PATH, 'utf8'));

const esByMatchKey = new Map();
for (const k of kiranico) {
  if (k.en && k.es) esByMatchKey.set(matchKey(k.en.name), k.es.name);
}

const wanted = new Map(); // normalizeMaterialKey(name) -> original name (for logging)
for (const it of items) wanted.set(normalizeMaterialKey(it.name), it.name);
for (const mo of monsters) {
  for (const rank in (mo.materials || {})) {
    for (const row of mo.materials[rank]) {
      if (!row.material) continue;
      wanted.set(normalizeMaterialKey(row.material), row.material);
    }
  }
}

const dict = {};
let hit = 0;
const missing = [];
for (const [key, original] of wanted) {
  const es = esByMatchKey.get(matchKey(key));
  if (es) { dict[key] = es; hit++; }
  else missing.push(original);
}

fs.writeFileSync(OUT_PATH, JSON.stringify(dict, null, 1));
console.log('translated', hit, '/', wanted.size, '-> ', OUT_PATH);
console.log('missing:', missing.length ? missing.join(', ') : '(none)');
