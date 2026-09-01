#!/usr/bin/env node
/*
 * Read-only integrity audit for the three public game catalogs.
 * It checks references actually used by the UI: material names, skill names,
 * quest monster names, armor-set piece IDs and weapon tree neighbors.
 */
const fs = require('fs');
const path = require('path');

const games = ['mhfu', 'rise', 'wilds'];
const read = (game, name) => JSON.parse(fs.readFileSync(path.join(__dirname, game, 'data', `${name}.json`), 'utf8'));
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/&(?:#39|apos);/gi, "'").replace(/[^a-z0-9+]/gi, '').toLowerCase();
const names = (rows, key = 'name') => new Set(rows.map(row => normalize(row[key])).filter(Boolean));
const materialRows = row => {
  if (Array.isArray(row?.materials)) return row.materials;
  if (row?.materials && typeof row.materials === 'object') return Object.values(row.materials).flat();
  return [];
};
const sample = (set, amount = 25) => [...set].sort().slice(0, amount);

for (const game of games) {
  const items = read(game, game === 'wilds' ? 'items_wilds' : 'items');
  let monsters = read(game, 'monsters');
  try { monsters = monsters.concat(read(game, 'small_monsters')); } catch { /* no separate small-monster catalog */ }
  const pieces = read(game, 'armor_pieces');
  const sets = read(game, 'armor_sets');
  const weapons = read(game, 'weapons');
  const decorations = read(game, 'decorations');
  const skills = read(game, 'skills');
  // A material page is backed either by an item-catalog record or by a
  // monster-drop record (the Materials view indexes both). Requiring every
  // monster drop to duplicate an item entry produced false broken-link
  // reports for legitimate drop-only materials.
  const itemNames = names(items);
  const monsterMaterialNames = new Set();
  for (const monster of monsters) for (const material of materialRows(monster)) {
    const label = typeof material === 'string' ? material : material?.material;
    if (label) monsterMaterialNames.add(normalize(label));
  }
  const materialCatalogNames = new Set([...itemNames, ...monsterMaterialNames]);
  const monsterNames = names(monsters);
  const skillNames = names(skills);
  const pieceIds = new Set(pieces.map(row => String(row.id)));
  const weaponIds = new Set(weapons.map(row => String(row.id)));
  const unresolvedMaterials = new Set();
  const unresolvedSkills = new Set();
  const unresolvedQuestMonsters = new Set();
  const missingPieceRefs = new Set();
  const visibleMissingPieceRefs = new Set();
  const sourceOnlyArmorSets = new Set();
  const missingWeaponRefs = new Set();

  for (const row of [...pieces, ...weapons, ...decorations, ...monsters]) {
    for (const material of materialRows(row)) {
      const label = typeof material === 'string' ? material : material?.material;
      if (label && !materialCatalogNames.has(normalize(label))) unresolvedMaterials.add(label);
    }
  }
  for (const row of [...pieces, ...decorations]) for (const skill of row.skills || []) {
    const label = typeof skill === 'string' ? skill : skill?.name;
    if (label && !skillNames.has(normalize(label))) unresolvedSkills.add(label);
  }
  for (const set of sets) {
    const refs = set.pieces || [];
    const hasUsablePiece = refs.some(ref => ref?.id != null && pieceIds.has(String(ref.id)));
    if (!hasUsablePiece) sourceOnlyArmorSets.add(set.name);
    for (const ref of refs) {
      if (ref?.id == null || pieceIds.has(String(ref.id))) continue;
      const label = `${set.name} :: ${ref.name || ref.id}`;
      missingPieceRefs.add(label);
      // The galleries and global search deliberately omit sets without a
      // single usable piece; only a missing ref inside a visible card can
      // produce a broken public armor link.
      if (hasUsablePiece) visibleMissingPieceRefs.add(label);
    }
  }
  for (const weapon of weapons) for (const ref of [weapon.prevId, weapon.nextId]) {
    if (ref != null && !weaponIds.has(String(ref))) missingWeaponRefs.add(`${weapon.name} :: ${ref}`);
  }
  for (const source of ['quests', 'missions']) {
    try {
      for (const quest of read(game, source)) for (const monster of quest.mainMonsters || []) {
        if (monster && !monsterNames.has(normalize(monster))) unresolvedQuestMonsters.add(monster);
      }
    } catch { /* game has no file for this quest format */ }
  }

  const report = {
    game,
    unresolvedMaterials: { count: unresolvedMaterials.size, sample: sample(unresolvedMaterials) },
    unresolvedSkills: { count: unresolvedSkills.size, sample: sample(unresolvedSkills) },
    unresolvedQuestMonsters: { count: unresolvedQuestMonsters.size, sample: sample(unresolvedQuestMonsters) },
    missingArmorPieceReferences: { count: visibleMissingPieceRefs.size, sample: sample(visibleMissingPieceRefs) },
    sourceOnlyArmorSets: { count: sourceOnlyArmorSets.size, sample: sample(sourceOnlyArmorSets) },
    sourceOnlyArmorPieceReferences: { count: missingPieceRefs.size - visibleMissingPieceRefs.size, sample: sample(new Set([...missingPieceRefs].filter(x => !visibleMissingPieceRefs.has(x)))) },
    missingWeaponReferences: { count: missingWeaponRefs.size, sample: sample(missingWeaponRefs) },
  };
  console.log(JSON.stringify(report, null, 2));
}
