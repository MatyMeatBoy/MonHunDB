// Builds wilds/data/palico_armor_sets.json from the Riperino v3 patch
// (Fextralife Palico/Felyne armor: 85 sets, set-level stats only -- no
// clean per-piece stat breakdown exists in any source, see
// EXPORT-PATCH-CONSOLIDADO.md v3, so this is set-granularity only, same
// as how the hunter armor list view already shows a full-body render
// per set before drilling into pieces).
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const RIPERINO_PALICO = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/palico";
const RIPERINO_ASSETS = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/assets/palico/sets";
const OUT_IMG_DIR = path.join(ROOT, "images", "palico_armor");

const files = fs.readdirSync(RIPERINO_PALICO).filter(f => f.endsWith(".json") && f !== "_index.json");
fs.mkdirSync(OUT_IMG_DIR, { recursive: true });

const sets = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(RIPERINO_PALICO, f), "utf8"));
  const assetDir = path.join(RIPERINO_ASSETS, d.slug);
  let localImage = null;
  if (fs.existsSync(assetDir)) {
    const imgs = fs.readdirSync(assetDir);
    if (imgs.length) {
      const destName = `${d.slug}.png`;
      fs.copyFileSync(path.join(assetDir, imgs[0]), path.join(OUT_IMG_DIR, destName));
      localImage = `data/images/palico_armor/${destName}`;
    }
  }
  sets.push({
    slug: d.slug,
    name: d.name,
    rarity: d.rarity ? parseInt(d.rarity, 10) : null,
    defense: d.defense ? parseInt(d.defense, 10) : null,
    resistances: d.resists || {},
    image: localImage,
  });
}

sets.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(path.join(ROOT, "palico_armor_sets.json"), JSON.stringify(sets, null, 1));
console.log(`Wrote ${sets.length} palico armor sets, ${sets.filter(s => s.image).length} with images.`);
