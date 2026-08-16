const fs = require('fs');
const file = __dirname + '/charms.json';
const charms = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const charm of charms) {
  charm.name = charm.name.replace(/&#x27;/g, "'");
  if (/^(Glutton|Light Eater)/.test(charm.name)) {
    charm.materialsStatus = 'No crafting recipe listed in the available sources';
    charm.materialsSource = 'Fextralife Talismans';
  }
  if (charm.id === 'hope-charm') charm.materialsStatus = 'Recipe listed as N/A';
}
fs.writeFileSync(file, JSON.stringify(charms, null, 2) + '\n', 'utf8');
console.log(`Updated ${charms.length} charms`);
