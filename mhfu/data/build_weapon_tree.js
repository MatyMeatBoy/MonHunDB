// Builds the complete MHFU upgrade graph from the imported weapon data.
// `nextId` can only hold one child, while MHFU weapon lines branch frequently;
// this file preserves every `prevId` edge for the visual tree in the site.
const fs = require("fs");
const path = require("path");

const dataDir = __dirname;
const weapons = JSON.parse(fs.readFileSync(path.join(dataDir, "weapons.json"), "utf8"));
const byId = new Map(weapons.map(w => [w.id, w]));
const parents = {};
const order = weapons.map(w => w.name);
const childIds = new Set();

for (const weapon of weapons) {
  const parent = weapon.prevId && byId.get(weapon.prevId);
  if (!parent || parent.type !== weapon.type) continue;
  parents[weapon.name] = parent.name;
  childIds.add(parent.id);
}

const finals = weapons
  .filter(weapon => !childIds.has(weapon.id))
  .map(weapon => weapon.name);

const out = { parents, finals, order };
fs.writeFileSync(path.join(dataDir, "weapon_tree.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${Object.keys(parents).length} upgrade links and ${finals.length} final weapons.`);
