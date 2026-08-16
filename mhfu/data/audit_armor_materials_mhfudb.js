/* Audit the MHFU armor-piece recipes against the local mhfu-db source.
 * The source has no armor-set key; piece name + slot is the authoritative key.
 * Usage: node mhfu/data/audit_armor_materials_mhfudb.js
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const sourceFile = path.join(ROOT, "sources/mhfu-db-main/mhfu-db-main/armors.json");
const localFile = path.join(__dirname, "armor_pieces.json");
const source = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const local = JSON.parse(fs.readFileSync(localFile, "utf8"));
const partKey = (part) => ({ head: "helmet", arms: "gauntlet", waist: "waist", legs: "legging", chest: "plate" }[part] || part || "");
const key = (x) => `${String(x.name || "").trim().toLowerCase()}|${partKey(x.part)}`;
const sourceByKey = new Map(source.map(x => [key(x), x]));
let exact = 0, recipes = 0, localEmptyWithSourceRecipe = 0;
const missing = [], mismatches = [];
for (const piece of local) {
  const row = sourceByKey.get(key(piece));
  if (!row) { missing.push(piece.name); continue; }
  exact++;
  const sourceMaterials = row.materials || [];
  if (sourceMaterials.length) recipes++;
  if (sourceMaterials.length && !(piece.materials || []).length) {
    localEmptyWithSourceRecipe++;
    mismatches.push({ name: piece.name, part: piece.part, sourceMaterials });
  }
}
const report = {
  source: "sources/mhfu-db-main/mhfu-db-main/armors.json",
  sourcePieces: source.length,
  localPieces: local.length,
  exactPieceMatches: exact,
  sourcePiecesWithRecipes: source.filter(x => (x.materials || []).length).length,
  localPiecesWithMaterials: local.filter(x => (x.materials || []).length).length,
  localEmptyWithSourceRecipe,
  localEntriesWithoutSourceName: missing,
  mismatches,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(__dirname, "armor_materials_mhfudb_audit.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`MHFU armor audit: ${exact}/${local.length} exact piece matches; ${recipes} source recipes; ${localEmptyWithSourceRecipe} local recipes missing.`);
