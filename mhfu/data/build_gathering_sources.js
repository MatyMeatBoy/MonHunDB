/* Rebuild MHFU gathering source data from the local mhfu-db snapshot.
 * The snapshot is intentionally kept under sources/ and this generated JSON
 * is the only copy consumed by the public site. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "sources/mhfu-db-main/mhfu-db-main");
const OUT = path.join(__dirname, "gathering_sources.json");
const read = file => JSON.parse(fs.readFileSync(path.join(SRC, file), "utf8"));
const current = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const merchantDir = path.join(SRC, "Merchants");
const merchant = name => fs.existsSync(path.join(merchantDir, name)) ? read(`Merchants/${name}`) : [];

current.mapSources = read("maps.json");
current.veggieElder = read("veggie_elder.json");
current.vendors = {
  peddlingGranny: {
    regular: merchant("peddling-granny.json"),
    discount: merchant("peddling-granny-discount.json"),
    dlc: merchant("merchant.json")
  }
};
current.farmRaw = {
  fieldRows: read("Farm/farmfield.json"),
  seeds: read("Farm/seeds.json"),
  additionalPlants: read("Farm/plants-addition.json"),
  insects: read("Farm/bug-catch.json"),
  bugTree: read("Farm/bug-tree.json"),
  mining: read("Farm/mining-spot.json"),
  miningBomb: read("Farm/mining-bomb.json"),
  fishing: read("Farm/fishing-spot.json"),
  casting: read("Farm/casting-machine.json"),
  beehive: read("Farm/beehive.json"),
  mushrooms: read("Farm/mushroom-tree.json"),
  cave: read("Farm/cave.json"),
  upgrades: read("Farm/farm-renovate.json")
};
fs.writeFileSync(OUT, JSON.stringify(current, null, 1) + "\n");
console.log(`Wrote ${current.mapSources.length} maps, ${current.veggieElder.length} Veggie Elder tables and ${current.vendors.peddlingGranny.regular.length} regular shop entries.`);
