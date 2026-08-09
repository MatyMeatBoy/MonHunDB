// Matches small-monster material names against MHRice's item list
// (_mhrice_items_raw.json) and adds {iconId, color} entries to
// material_mhrice_icons.json for any that are currently missing.
const fs = require("fs");
const path = require("path");
const DATA = __dirname;

const mhriceItems = JSON.parse(fs.readFileSync(path.join(DATA, "_mhrice_items_raw.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(DATA, "material_mhrice_icons.json"), "utf8"));
const rawSm = JSON.parse(fs.readFileSync(path.join(DATA, "small_monsters_raw.json"), "utf8"));

// collect small monster material names
const smMats = new Set();
for (const r of rawSm) {
  for (const row of (r.materialRows || [])) {
    const m = (row[0] || "").trim();
    if (m) smMats.add(m);
  }
}
console.log("small monster material names:", smMats.size);
console.log("already in manifest:", [...smMats].filter(n => manifest[n]).length);

const mhriceByName = {};
for (const it of mhriceItems) {
  if (!mhriceByName[it.name]) mhriceByName[it.name] = it;
}

let added = 0, notFound = 0;
for (const name of smMats) {
  if (manifest[name]) continue;
  const it = mhriceByName[name];
  if (it) { manifest[name] = { iconId: it.iconId, color: it.color }; added++; }
  else { notFound++; console.log("  NOT FOUND:", name); }
}

fs.writeFileSync(path.join(DATA, "material_mhrice_icons.json"), JSON.stringify(manifest));
console.log("added:", added, "not found:", notFound);
console.log("total manifest entries:", Object.keys(manifest).length);
