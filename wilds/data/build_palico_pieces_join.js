// Joins Riperino's palico-armor.json (169 Kiranico head/chest pieces, EN+ES
// names + icons) to wilds/data/palico_armor_sets.json (85 Fextralife sets)
// using the same longest-common-substring monster-key technique proven in
// build_palico_weapons_join.js. Adds a "pieces" array (head/chest) to each
// matched set, on top of the "weapon" field already written.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const RIPERINO_PIECES = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/palico-armor.json";
const RIPERINO_ICONS_DIR = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/images/palico-armor";
const OUT_IMG_DIR = path.join(ROOT, "images", "palico_pieces");
const DRY_RUN = process.argv.includes("--dry-run");

const HEAD_WORDS = /(helm|hood|wig|head|mask|brain|cap|veil|crest|tiara|crown|corona)$/i;

function normVariant(name) {
  let n = name.trim().replace(/\s+Set$/i, "");
  n = n.replace(/[’']/g, "").replace(/&#39;|&#x27;/gi, "");
  const m = n.match(/^(.*?)\s*(Alpha|Beta|Gamma|α|β|γ)$/i);
  let base = n, variant = null;
  if (m) {
    base = m[1].trim();
    const tail = m[2].toLowerCase();
    variant = tail === "alpha" || tail === "α" ? "alpha" : tail === "beta" || tail === "β" ? "beta" : "gamma";
  }
  return { base: base.toLowerCase(), variant };
}
function coreKey(base) {
  return base.replace(/^Felyne\s+/i, "").replace(/^F\s+/i, "").replace(/^G\s+/i, "Guardian ")
    .toLowerCase().replace(/[^a-z]/g, "");
}
function longestCommonSubstring(a, b) {
  let best = 0;
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++) {
      let k = 0;
      while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++;
      if (k > best) best = k;
    }
  return best;
}

const armorSets = JSON.parse(fs.readFileSync(path.join(ROOT, "palico_armor_sets.json"), "utf8"));
const pieces = JSON.parse(fs.readFileSync(RIPERINO_PIECES, "utf8"));

const setKeys = armorSets.map(s => {
  const { base, variant } = normVariant(s.name);
  return { set: s, core: coreKey(base), variant };
});

fs.mkdirSync(OUT_IMG_DIR, { recursive: true });
let matched = 0;
const unmatched = [];
for (const p of pieces) {
  const enName = p.en.name; // e.g. "Felyne Hope Helm", "F Guardian Dosha Helm α"
  const { base, variant } = normVariant(enName);
  const part = HEAD_WORDS.test(base.trim()) ? "head" : "chest";
  // strip the trailing part word (last token) before computing the core
  const wCore = coreKey(base.replace(/\s+\S+$/, ""));
  let best = null, bestScore = 0;
  for (const sk of setKeys) {
    if (sk.variant !== variant) continue;
    const score = longestCommonSubstring(wCore, sk.core);
    if (score > bestScore) { bestScore = score; best = sk; }
  }
  // score>=4 is the normal bar; a 3-char match is only trusted when the
  // ENTIRE remaining piece core is those 3 chars (short monster names like
  // "Dau"/"Afi"/"Gog") -- avoids the coincidental-substring problem seen in
  // the weapons join (Kut-Ku/Fiendlyne falsely matching "Butterfly").
  const ok = best && (bestScore >= 4 || (bestScore === 3 && bestScore === wCore.length));
  if (!ok) { unmatched.push(enName); continue; }
  matched++;
  let iconFile = null;
  if (p.en.iconLocal) {
    const srcName = path.basename(p.en.iconLocal);
    const srcPath = path.join(RIPERINO_ICONS_DIR, srcName);
    if (fs.existsSync(srcPath)) {
      const destName = `${p.id}.webp`;
      if (!DRY_RUN) fs.copyFileSync(srcPath, path.join(OUT_IMG_DIR, destName));
      iconFile = `data/images/palico_pieces/${destName}`;
    }
  }
  if (!DRY_RUN) {
    if (!best.set.pieces) best.set.pieces = [];
    // avoid dupes if the same set already got a head or chest piece
    if (!best.set.pieces.some(x => x.part === part)) {
      best.set.pieces.push({ part, name: p.en.name, nameEs: p.es.name, icon: iconFile });
    }
  }
}

console.log(`Matched ${matched} / ${pieces.length} pieces to sets.`);
console.log(`Unmatched (${unmatched.length}):`, unmatched);
if (!DRY_RUN) {
  fs.writeFileSync(path.join(ROOT, "palico_armor_sets.json"), JSON.stringify(armorSets, null, 1));
  console.log("Wrote palico_armor_sets.json with .pieces field.");
}
