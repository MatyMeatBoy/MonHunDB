// Joins Riperino's palico-weapons.json (73 Kiranico-sourced Felyne weapons)
// to wilds/data/palico_armor_sets.json (85 Fextralife-sourced sets) by
// longest-common-substring on the normalized monster name + matching
// alpha/beta/gamma variant suffix -- there's no shared id/slug between the
// two sources (different scrape origins), so this is a fuzzy join, same
// technique family as the armor gear -> set matching problem.
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const RIPERINO_WEAPONS = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/palico-weapons.json";
const RIPERINO_ICONS_DIR = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/wilds/images/palico-weapons";
const OUT_IMG_DIR = path.join(ROOT, "images", "palico_weapons");
const DRY_RUN = process.argv.includes("--dry-run");

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
  // strip common non-monster tokens, collapse to a-z only
  return base
    .replace(/^Felyne\s+/i, "")
    .replace(/^F\s+/i, "")
    .replace(/^G\s+/i, "Guardian ")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
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
const weapons = JSON.parse(fs.readFileSync(RIPERINO_WEAPONS, "utf8"));

// precompute set keys (monster core, no "Felyne"/"F" prefix, no variant)
const setKeys = armorSets.map(s => {
  const { base, variant } = normVariant(s.name);
  return { set: s, core: coreKey(base), variant };
});

fs.mkdirSync(OUT_IMG_DIR, { recursive: true });
const results = [];
let matched = 0;
for (const w of weapons) {
  const enName = w.en.name;
  const { base, variant } = normVariant(enName);
  const wCore = coreKey(base.replace(/\s+(Spear|Hammer|Knuckle|Needle|Wedge|Drill|Sword|Fan|Sickle|Blaster|Tambourine|Clobberer|Hinge Blade|Blade)s?$/i, ""));
  // find best matching set: same variant, longest common substring >= 4
  let best = null, bestScore = 0;
  for (const sk of setKeys) {
    if (sk.variant !== variant) continue;
    const score = longestCommonSubstring(wCore, sk.core);
    if (score > bestScore) { bestScore = score; best = sk; }
  }
  // "Kut-Ku Cutter" and "Fiendlyne Fetter" are collab/event weapons with no
  // matching Felyne armor set in this data (same "no set" pattern as the
  // Kut-Ku Mask / Cabra Hood / Papier-Mache gear noted in the v3 patch) --
  // both spuriously scored 4-5 against "Butterfly" on coincidental
  // substrings, so they're excluded explicitly rather than by a fragile
  // length heuristic that also rejected genuine short matches (Xu Wu, Udra).
  const noSetWeapon = /kut-ku|fiendlyne/i.test(enName);
  const ok = !noSetWeapon && best && bestScore >= 4;
  results.push({ weapon: enName, wCore, matchedSet: ok ? best.set.name : null, score: bestScore });
  if (ok) {
    matched++;
    let iconFile = null;
    if (w.en.iconLocal) {
      const srcName = path.basename(w.en.iconLocal);
      const srcPath = path.join(RIPERINO_ICONS_DIR, srcName);
      if (fs.existsSync(srcPath)) {
        const destName = `${w.id}.webp`;
        if (!DRY_RUN) fs.copyFileSync(srcPath, path.join(OUT_IMG_DIR, destName));
        iconFile = `data/images/palico_weapons/${destName}`;
      }
    }
    if (!DRY_RUN) {
      if (!best.set.weapon) best.set.weapon = [];
      best.set.weapon = { name: enName, nameEs: w.es.name, icon: iconFile };
    }
  }
}

console.log(`Matched ${matched} / ${weapons.length} weapons to sets.`);
console.log("Unmatched weapons:", results.filter(r => !r.matchedSet).map(r => r.weapon));
if (!DRY_RUN) {
  fs.writeFileSync(path.join(ROOT, "palico_armor_sets.json"), JSON.stringify(armorSets, null, 1));
  console.log("Wrote palico_armor_sets.json with .weapon field on matched sets.");
} else {
  console.log("(dry run)");
  console.log(results.filter(r=>r.matchedSet).map(r=>`${r.weapon}  ->  ${r.matchedSet}  (score ${r.score})`).join("\n"));
}
