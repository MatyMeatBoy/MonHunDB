// Classifies Wilds catalog entries without an item icon. No data is guessed.
const fs = require('fs');
const items = JSON.parse(fs.readFileSync(__dirname + '/items_wilds.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync(__dirname + '/item_icon_manifest.json', 'utf8'));
const missing = items.filter(item => !item.icon && !manifest[item.name]).map(item => ({
  name: item.name,
  status: item.id == null ? 'special-entry-without-item-id' : 'item-without-icon'
}));
const byStatus = Object.fromEntries([...new Set(missing.map(x => x.status))].map(status => [status, missing.filter(x => x.status === status).length]));
const out = { totalMissing: missing.length, byStatus, entries: missing };
fs.writeFileSync(__dirname + '/missing_item_icons_audit.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
