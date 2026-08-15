// Normalizes the few skill-pool spellings emitted by different MHFU sources.
// The canonical names are the pools in skills.json (from Scraperino).
// Run after importing armor/decorations so UI links and point totals always
// resolve to a real skill detail page.
const fs = require("fs");
const path = require("path");

const ALIASES = {
  WindPress: "Wind Press",
  "Crag S Add": "CragSAdd",
  "ClustS Add": "ClustSAdd",
};

for (const filename of ["armor_pieces.json", "decorations.json"]) {
  const file = path.join(__dirname, filename);
  const records = JSON.parse(fs.readFileSync(file, "utf8"));
  let changed = 0;
  for (const record of records) {
    for (const skill of record.skills || []) {
      const canonical = ALIASES[skill.name];
      if (canonical) {
        skill.name = canonical;
        changed++;
      }
    }
  }
  fs.writeFileSync(file, JSON.stringify(records, null, 1) + "\n");
  console.log(`${filename}: normalized ${changed} skill references`);
}
