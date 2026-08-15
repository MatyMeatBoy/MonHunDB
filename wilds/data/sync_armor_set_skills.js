// Backfill armor-set skill summaries only when the set source is empty and
// every available skill comes from its matched armor pieces. Existing set
// skill data is authoritative and is never overwritten.
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const sets = JSON.parse(fs.readFileSync(path.join(dir, "armor_sets.json"), "utf8"));
const pieces = JSON.parse(fs.readFileSync(path.join(dir, "armor_pieces.json"), "utf8"));
const byName = new Map(pieces.map(p => [p.name, p]));
let updated = 0;
for (const set of sets) {
  if ((set.equipmentSkills || []).length) continue;
  const levels = new Map();
  for (const ref of set.pieces || []) {
    for (const skill of byName.get(ref.name)?.skills || []) {
      levels.set(skill.name, Math.max(levels.get(skill.name) || 0, skill.level));
    }
  }
  if (!levels.size) continue;
  set.equipmentSkills = [...levels].map(([name, level]) => ({ name, level }));
  updated++;
}
fs.writeFileSync(path.join(dir, "armor_sets.json"), JSON.stringify(sets, null, 2));
console.log(`Updated ${updated} armor sets.`);
