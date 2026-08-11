// Applies the Riperino v2 patch (Fextralife armor set images, 158 sets / 685
// pieces, 200px transparent PNG) as the armorFextraIcons fallback layer for
// wilds armor pieces, which currently have ZERO local icons (iconM/iconF
// never populated, so every piece renders a blank placeholder).
//
// Matching: site's armor_pieces.json piece.name uses Greek suffix (" α"/" β"/" γ"),
// Riperino's armor/<Slug>.json piece.piece uses spelled-out (" Alpha"/" Beta"/" Gamma").
// Normalize both to base name (no variant) + variant letter, then match by
// (setBaseName, variant) using the set's own pieces list -- position/part is
// NOT reliable across sources, so match by normalized piece name within the
// matched set.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const RIPERINO_ARMOR = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/armor";
const RIPERINO_ASSETS = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/assets/armor";
const OUT_IMG_DIR = path.join(ROOT, "images", "armor_fextra");
const DRY_RUN = process.argv.includes("--dry-run");

const GREEK = { alpha: "α", beta: "β", gamma: "γ" };

function normVariant(name) {
  // returns { base, variant } -- variant is 'alpha'|'beta'|'gamma'|null.
  // Handles both set names ("Rathalos Alpha Set" / "Sororal α Set" / "Bone Set")
  // and piece names ("Rathalos Helm Alpha" / "Sororal Earrings α").
  let n = name.trim().replace(/\s+Set$/i, ""); // strip trailing "Set" if present
  n = n.replace(/^(?:helm|chest|arms|waist|legs)image\d+/i, ""); // scrape junk prefix
  n = n.replace(/[’']/g, "").replace(/&#39;/g, ""); // possessive apostrophe inconsistency (Diver's vs Diver)
  n = n.replace(/Gammaa$/i, "Gamma"); // scrape typo (doubled trailing 'a')
  n = n.replace(/(?<=[a-z])y$/i, "γ"); // mangled unicode gamma -> literal 'y' (no space)
  n = n.replace(/\by$/i, "γ"); // mangled unicode gamma -> standalone 'y' word (e.g. "Sandhelm y")
  n = n.replace(/^Arkvulcan\b/i, "Arkveld"); // Fextralife's gamma-tier alias for Arkveld
  const m = n.match(/^(.*?)\s*(Alpha|Beta|Gamma|α|β|γ)$/i);
  let base = n, variant = null;
  if (m) {
    base = m[1].trim();
    const tail = m[2].toLowerCase();
    variant = tail === "alpha" || tail === "α" ? "alpha"
      : tail === "beta" || tail === "β" ? "beta"
      : "gamma";
  }
  return { base: base.toLowerCase(), variant };
}

const sets = JSON.parse(fs.readFileSync(path.join(ROOT, "armor_sets.json"), "utf8"));
const pieces = JSON.parse(fs.readFileSync(path.join(ROOT, "armor_pieces.json"), "utf8"));

// index site pieces by (setName norm, piece norm)
const siteBySetAndPiece = new Map();
for (const p of pieces) {
  const key = p.setName + "||" + JSON.stringify(normVariant(p.name));
  if (!siteBySetAndPiece.has(p.setName)) siteBySetAndPiece.set(p.setName, []);
  siteBySetAndPiece.get(p.setName).push(p);
}

const setFiles = fs.readdirSync(RIPERINO_ARMOR).filter(f => f.endsWith(".json") && f !== "_index.json");

let matchedPieces = 0, unmatchedRiperino = [], unmatchedSets = [];
const idToLocalFile = {}; // piece.id -> absolute source path

for (const f of setFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(RIPERINO_ARMOR, f), "utf8"));
  const slug = data.slug || f.replace(/\.json$/, "");
  const { base: rBase, variant: rVariant } = normVariant(data.name);

  // find candidate site sets whose normalized (base,variant) matches
  const candidateSets = sets.filter(s => {
    const { base, variant } = normVariant(s.name);
    return base === rBase && variant === rVariant;
  });
  if (!candidateSets.length) { unmatchedSets.push(data.name); continue; }
  const siteSet = candidateSets[0];

  for (const rp of (data.pieces || [])) {
    const { base: pBase, variant: pVariant } = normVariant(rp.piece);
    // part-word (Helm/Mail/Vambraces/Coil/Greaves) is part of pBase already
    const sitePieces = siteBySetAndPiece.get(siteSet.name) || [];
    const match = sitePieces.find(sp => {
      const { base: spBase, variant: spVariant } = normVariant(sp.name);
      return spBase === pBase && spVariant === pVariant;
    });
    if (!match) { unmatchedRiperino.push(`${data.name} :: ${rp.piece}`); continue; }
    if (!rp.imgFull) { unmatchedRiperino.push(`${data.name} :: ${rp.piece} (no imgFull)`); continue; }

    const basename = path.basename(new URL(rp.imgFull).pathname);
    const localSrc = path.join(RIPERINO_ASSETS, slug, basename);
    if (!fs.existsSync(localSrc)) { unmatchedRiperino.push(`${data.name} :: ${rp.piece} (no local file ${basename})`); continue; }

    idToLocalFile[match.id] = localSrc;
    matchedPieces++;
  }
}

console.log(`Matched ${matchedPieces} / ${pieces.length} site pieces.`);
console.log(`Unmatched sets (Riperino->site): ${unmatchedSets.length}`, unmatchedSets.slice(0, 20));
console.log(`Unmatched pieces: ${unmatchedRiperino.length}`);
if (unmatchedRiperino.length) console.log(unmatchedRiperino.slice(0, 30));

if (!DRY_RUN) {
  fs.mkdirSync(OUT_IMG_DIR, { recursive: true });
  const manifest = {};
  for (const [id, src] of Object.entries(idToLocalFile)) {
    fs.copyFileSync(src, path.join(OUT_IMG_DIR, `${id}.png`));
    manifest[id] = true;
  }
  fs.writeFileSync(path.join(ROOT, "armor_fextra_icons.json"), JSON.stringify(manifest, null, 1));
  console.log(`Wrote ${Object.keys(manifest).length} images + manifest.`);
} else {
  console.log("(dry run, no files written)");
}
