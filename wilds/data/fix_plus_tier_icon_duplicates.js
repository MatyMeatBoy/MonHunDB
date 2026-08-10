// Repairs a bug from scrape_mhwikiorg_item_icons.js: it iterated Kiranico's
// item names, which spell the "+" tier as a literal "+" ("Whetfish Fin+"),
// and matched against this project's items by exact lowercase name --
// but items_wilds.json spells it "Plus" ("Whetfish Fin Plus"). The mismatch
// meant every "+" item got pushed as a NEW duplicate entry (with the fresh
// monsterhunterwiki.org icon) instead of updating the existing "Plus" entry,
// which is the one translateMaterial()/materialIconTag() actually look up
// (normalizeMaterialKey only touches "Name +" -> "Name+" spacing, it never
// touches the word "Plus") -- so the real entry kept its old, tiny (25x25)
// Fextralife icon while an orphaned unused duplicate got the good one.
const fs = require('fs');
const path = require('path');

const ITEMS_PATH = path.join(__dirname, 'items_wilds.json');
const items = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));

const byLower = new Map();
for (const it of items) {
  const k = it.name.trim().toLowerCase();
  if (!byLower.has(k)) byLower.set(k, []);
  byLower.get(k).push(it);
}

let merged = 0, removedNoIcon = 0;
const toRemove = new Set();
for (const it of items) {
  if (!it.name.endsWith('+')) continue;
  const base = it.name.slice(0, -1).trim();
  const plusEntries = byLower.get((base + ' Plus').toLowerCase());
  if (!plusEntries || !plusEntries.length) continue;
  const canonical = plusEntries[0];
  const dupHasGoodIcon = it.icon && it.icon.startsWith('data/images/items_mhwikiorg/');
  const canonicalHasGoodIcon = canonical.icon && canonical.icon.startsWith('data/images/items_mhwikiorg/');
  if (dupHasGoodIcon && !canonicalHasGoodIcon) {
    canonical.icon = it.icon;
    merged++;
  } else if (!dupHasGoodIcon && !it.icon) {
    removedNoIcon++;
  }
  toRemove.add(it);
}

const result = items.filter((it) => !toRemove.has(it));
fs.writeFileSync(ITEMS_PATH, JSON.stringify(result, null, 1));
console.log('duplicates removed:', toRemove.size, '| icons merged into canonical "Plus" entry:', merged, '| total items now:', result.length);
