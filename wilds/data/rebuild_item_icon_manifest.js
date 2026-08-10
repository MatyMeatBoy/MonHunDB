// Rebuilds item_icon_manifest.json from items_wilds.json's own `icon`
// field. Root cause of "icons still look bad" reports surviving every prior
// fix: materialIconTag() -> itemIconSrcWilds() reads from THIS separate
// manifest file, not from items_wilds.json directly -- so every icon fix
// applied to items_wilds.json this whole session never actually reached
// the screen. All 648 manifest entries were still pointing at the original
// Fextralife-era "data/images/items/<slug>.png" paths (confirmed: 0/648
// had been updated). This makes the manifest a generated artifact of
// items_wilds.json going forward instead of an independent, driftable copy.
const fs = require('fs');
const path = require('path');

const ITEMS_PATH = path.join(__dirname, 'items_wilds.json');
const MANIFEST_PATH = path.join(__dirname, 'item_icon_manifest.json');

const items = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));
const manifest = {};
for (const it of items) {
  if (!it.icon) continue;
  manifest[it.name] = it.icon;
  // monsters.json's material rows spell the "+" tier as a literal "+"
  // ("Blangonga Fang+"), never as items_wilds.json's "Plus" word -- alias
  // both forms so itemIconSrcWilds() (which is fed either spelling
  // depending on caller) resolves regardless of which one it's given.
  if (/\s+Plus$/i.test(it.name)) {
    const plusForm = it.name.replace(/\s+Plus$/i, '+');
    if (!manifest[plusForm]) manifest[plusForm] = it.icon;
  }
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 1));
console.log('rebuilt item_icon_manifest.json:', Object.keys(manifest).length, 'entries');
