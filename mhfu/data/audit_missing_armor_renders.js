// Classifies MHFU armor pieces that have no male or female render.
// This is an audit only: it never invents a render or changes catalog data.
const fs = require('fs');
const pieces = JSON.parse(fs.readFileSync(__dirname + '/armor_pieces.json', 'utf8'));
const missing = pieces.filter(piece => !piece.iconM && !piece.iconF).map(piece => {
  let status = 'named-piece-without-source';
  if (piece.name === 'None') status = 'invalid-placeholder';
  else if (/Piercing/.test(piece.name)) status = 'special-piercing-without-source';
  else if (piece.id.startsWith('mhfuaY')) status = 'partial-source-entry';
  return { id: piece.id, name: piece.name, status };
});
const byStatus = Object.fromEntries([...new Set(missing.map(x => x.status))].map(status => [status, missing.filter(x => x.status === status).length]));
const out = { totalMissing: missing.length, byStatus, entries: missing };
fs.writeFileSync(__dirname + '/missing_armor_renders_audit.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
