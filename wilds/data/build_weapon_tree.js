// Builds wilds/data/weapon_tree.json ({ parents, order, finals }, same
// shape rise/data/weapon_tree.json already uses) from the Fextralife weapon
// tree Scriperino scraped (Riperino/wilds/weapon_tree.json). Names are
// re-keyed to match this project's own weapons.json spelling (decoding the
// occasional unescaped HTML entity), so wilds/app.js's normalizeWeaponName()
// lookups hit correctly at runtime -- mirrors the exact structure/consumer
// pattern already proven working in rise/app.js (initWeaponTree,
// isWeaponTrueFinal, getWeaponChain).
const fs = require('fs');
const path = require('path');

const RIPERINO_TREE = path.join(__dirname, '../../../../Apps/claude/scraperino-riperino/Riperino/wilds/weapon_tree.json');
const WEAPONS_PATH = path.join(__dirname, 'weapons.json');
const OUT_PATH = path.join(__dirname, 'weapon_tree.json');

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .trim();
}
function norm(s) { return decodeEntities(s).trim().toLowerCase(); }

const tree = JSON.parse(fs.readFileSync(RIPERINO_TREE, 'utf8'));
const weapons = JSON.parse(fs.readFileSync(WEAPONS_PATH, 'utf8'));

// project's canonical spelling, keyed by normalized form
const canonical = new Map(weapons.map((w) => [norm(w.name), w.name]));

function resolve(name) {
  return canonical.get(norm(name)) || null;
}

const parents = {};
let parentHit = 0, parentMiss = 0;
for (const [child, parent] of Object.entries(tree.parents)) {
  const c = resolve(child), p = resolve(parent);
  if (c && p) { parents[c] = p; parentHit++; } else parentMiss++;
}

const order = [];
let orderMiss = 0;
for (const n of tree.order) {
  const r = resolve(n);
  if (r) order.push(r); else orderMiss++;
}

const finals = [];
for (const n of tree.finals) {
  const r = resolve(n);
  if (r) finals.push(r);
}

const out = { parents, order: [...new Set(order)], finals: [...new Set(finals)] };
fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 1));
console.log('order:', out.order.length, '/', tree.order.length, `(${orderMiss} unmatched)`);
console.log('parents:', parentHit, '/', Object.keys(tree.parents).length, `(${parentMiss} unmatched)`);
console.log('finals:', out.finals.length, '/', tree.finals.length);
console.log('-> ', OUT_PATH);
