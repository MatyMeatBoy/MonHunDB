// Applies the Riperino v4 patch (Fextralife talisman/charm renders, 182 PNG)
// as local icons for wilds/charms.json (185 entries, currently 0 with any
// icon -- charmIconTag() falls back to the generic item-icon manifest,
// which never matches a charm name). Render filenames are already
// `<Base>_<RomanLevel>.png`, and charms.json ids are already
// slugify(`${name}`) e.g. "Marathon Charm I" -> "marathon-charm-i" --
// same slugify() as app.js, so this is a direct 1:1 match, no fuzzy join.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const RENDERS_DIR = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/assets/talismans/renders";
const OUT_IMG_DIR = path.join(ROOT, "images", "charms");

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const charms = JSON.parse(fs.readFileSync(path.join(ROOT, "charms.json"), "utf8"));
const idsInSite = new Set(charms.map(c => c.id));

fs.mkdirSync(OUT_IMG_DIR, { recursive: true });
const renderFiles = fs.readdirSync(RENDERS_DIR).filter(f => f.endsWith(".png"));

let matched = 0;
const unmatched = [];
const manifest = {};
for (const f of renderFiles) {
  let raw = f.replace(/\.png$/, "");
  raw = raw.replace(/_s_/g, "s_"); // apostrophe-s squeeze: "Glutton_s_Charm" -> "Gluttons_Charm" (site strips the apostrophe the same way)
  const base = raw.replace(/_/g, " "); // "Blast Charm I"
  const id = slugify(base);
  if (!idsInSite.has(id)) { unmatched.push(f); continue; }
  fs.copyFileSync(path.join(RENDERS_DIR, f), path.join(OUT_IMG_DIR, `${id}.png`));
  manifest[id] = `data/images/charms/${id}.png`;
  matched++;
}

fs.writeFileSync(path.join(ROOT, "charm_icon_manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`Matched ${matched} / ${renderFiles.length} renders (${idsInSite.size} charm entries in site).`);
console.log(`Site charm ids with NO render: ${[...idsInSite].filter(id => !manifest[id]).length}`);
if (unmatched.length) console.log("Unmatched render files:", unmatched);
