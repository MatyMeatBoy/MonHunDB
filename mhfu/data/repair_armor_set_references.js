// Repairs legacy MHFU armor-set references whose old source used a different
// English spelling than the piece catalog.  Every replacement is checked
// against armor_pieces.json before it is written; unverified refs stay intact.
const fs = require('fs');
const path = require('path');
const root = __dirname;
const setsPath = path.join(root, 'armor_sets.json');
const sets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
const pieces = JSON.parse(fs.readFileSync(path.join(root, 'armor_pieces.json'), 'utf8'));
const byId = new Set(pieces.map(piece => piece.id));
const byName = new Map(pieces.map(piece => [piece.name, piece]));

const ucamulbas = {
  'Ucamulbas Gauntlets': 'DarkUkanlosGauntlet',
  'Ucamulbas Mask': 'Dark Ukanlos Mask',
  'Ucamulbas Boots': 'Dark Ukanlos Boots',
  'Ucamulbas Plate': 'Dark Ukanlos Plate',
  'Ucamulbas Sash': 'Dark Ukanlos Sash',
  'Ucamulbas Aegis': 'Dark Ukanlos Aegis',
  'Ucamulbas Cincture': 'DarkUkanlosCincture',
  'Ucamulbas Claw': 'Dark Ukanlos Claw',
  'Ucamulbas Fangs': 'Dark Ukanlos Fangs',
  'Ucamulbas Hessian': 'Dark Ukanlos Hessian',
};

function canonicalName(setName, name) {
  if (setName === 'Hunter Set') return name.replace(/^Hunter /, "Hunter's ");
  if (setName === 'Hypnoc Set') return name.replace(/^Hypnoc /, 'Hypno ');
  if (setName === 'Naruga Set') return name.replace(/^Naruga /, 'Narga ');
  if (setName === 'Red Lobster Set') {
    const rest = name.replace(/^Red Lobster /, 'Lobster ');
    return rest === 'Lobster Braces' ? 'Lobster Vambraces' : rest.replace('Lobster Tasset', 'Lobster Coil');
  }
  if (setName === 'Volganos Set') return name.replace(/^Volganos /, 'Lava ');
  if (setName === 'Wht Fatalis Set') return name.replace(/^Wht Fatalis /, 'White Fatalis ');
  if (setName === 'Ucamulbas Set') return ucamulbas[name] || name;
  const truePrefix = /^(True Carnage|True Golden|True Indra|True Mizuha|True Steadfast) Set$/;
  if (truePrefix.test(setName)) {
    const base = name.replace(/^True /, '');
    // The PSP database omitted the separator in this one canonical name.
    return base === 'SteadfastGuards' ? 'SteadfastGuardsShin' : `${base} Shin`;
  }
  return name;
}

let fixed = 0;
let removedInvalidPlaceholders = 0;
const unresolved = [];
for (const set of sets) {
  // The legacy source occasionally emitted a table's empty cell as a real
  // `{ name: "None" }` reference. It is not an armor piece and must never be
  // rendered as one; leave the set visibly partial until a documented source
  // supplies the missing slot.
  set.pieces = (set.pieces || []).filter(ref => {
    if (ref?.name !== 'None') return true;
    removedInvalidPlaceholders += 1;
    return false;
  });
  for (const ref of set.pieces) {
    if (byId.has(ref.id)) continue;
    const target = byName.get(canonicalName(set.name, ref.name));
    if (!target) {
      unresolved.push(`${set.name} :: ${ref.name}`);
      continue;
    }
    ref.id = target.id;
    ref.name = target.name;
    fixed += 1;
  }
}
// armor_sets.json historically uses one-space indentation; preserve it so
// this mechanical repair remains a compact, reviewable data diff.
fs.writeFileSync(setsPath, JSON.stringify(sets, null, 1) + '\n');
console.log(`Repaired ${fixed} references; removed ${removedInvalidPlaceholders} invalid placeholders; ${unresolved.length} remain unverified.`);
if (unresolved.length) console.log(unresolved.join('\n'));
