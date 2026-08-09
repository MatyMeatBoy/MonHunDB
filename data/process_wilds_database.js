const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const INPUT_FILE = path.join(__dirname, '..', '..', 'MHWilds-Database', 'monster', 'assets', 'json', 'MHWilds_Data_compact.json.gz');
const OUT_DIR = path.join(__dirname, 'wilds_raw');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function loadGzJson(filePath) {
  const compressed = fs.readFileSync(filePath);
  const decompressed = zlib.gunzipSync(compressed);
  return JSON.parse(decompressed.toString('utf-8'));
}

function parseHitzones(hitzonesData) {
  if (!hitzonesData || !hitzonesData.Rows) return [];

  const rows = hitzonesData.Rows;
  const partsMap = new Map();

  for (const row of rows) {
    const partName = row.Part || row.Name || '';
    if (!partName) continue;

    if (!partsMap.has(partName)) {
      partsMap.set(partName, {
        part: partName,
        sever: 0,
        blunt: 0,
        projectile: 0,
        fire: 0,
        water: 0,
        thunder: 0,
        ice: 0,
        dragon: 0,
        stun: 0,
        wounds: [],
        breakHP: [],
        flinchHP: [],
        scar: null,
      });
    }

    const part = partsMap.get(partName);

    const meat = row.Meat || {};
    const scarMeat = row.ScarMeat || {};

    if (meat.Slash !== undefined) part.sever = Math.max(part.sever, meat.Slash);
    if (meat.Blow !== undefined) part.blunt = Math.max(part.blunt, meat.Blow);
    if (meat.Shot !== undefined) part.projectile = Math.max(part.projectile, meat.Shot);
    if (meat.Fire !== undefined) part.fire = Math.max(part.fire, meat.Fire);
    if (meat.Water !== undefined) part.water = Math.max(part.water, meat.Water);
    if (meat.Thunder !== undefined) part.thunder = Math.max(part.thunder, meat.Thunder);
    if (meat.Ice !== undefined) part.ice = Math.max(part.ice, meat.Ice);
    if (meat.Dragon !== undefined) part.dragon = Math.max(part.dragon, meat.Dragon);
    if (meat.Stun !== undefined) part.stun = Math.max(part.stun, meat.Stun);

    // Also consider scar meat values (wounded state)
    if (scarMeat.Slash !== undefined) part.sever = Math.max(part.sever, scarMeat.Slash);
    if (scarMeat.Blow !== undefined) part.blunt = Math.max(part.blunt, scarMeat.Blow);
    if (scarMeat.Shot !== undefined) part.projectile = Math.max(part.projectile, scarMeat.Shot);
    if (scarMeat.Fire !== undefined) part.fire = Math.max(part.fire, scarMeat.Fire);
    if (scarMeat.Water !== undefined) part.water = Math.max(part.water, scarMeat.Water);
    if (scarMeat.Thunder !== undefined) part.thunder = Math.max(part.thunder, scarMeat.Thunder);
    if (scarMeat.Ice !== undefined) part.ice = Math.max(part.ice, scarMeat.Ice);
    if (scarMeat.Dragon !== undefined) part.dragon = Math.max(part.dragon, scarMeat.Dragon);
    if (scarMeat.Stun !== undefined) part.stun = Math.max(part.stun, scarMeat.Stun);

    if (row.Break && Array.isArray(row.Break)) {
      part.breakHP.push(...row.Break.map(b => Number(b)));
    }
    if (row.Flinch && Array.isArray(row.Flinch)) {
      part.flinchHP.push(...row.Flinch.map(f => Number(f)));
    }
    if (row.Legendary && row.Legendary.Scar) {
      part.scar = row.Legendary.Scar;
    }
  }

  return Array.from(partsMap.values());
}

function parseConditions(conditionData) {
  if (!conditionData || !conditionData.Rows) return [];

  const rows = conditionData.Rows;
  if (rows.length < 2) return [];

  const ailmentNames = ['Poison', 'Paralyze', 'Sleep', 'Blast', 'Exhaust', 'ConEle', 'Flayer', 'Mount', 'Stun', 'Parry'];
  const stats = ['Status', 'Duration', 'Initial Tolerance', 'Tolerance Increase', 'Max Tolerance', 'Build-up Decay', 'Damage'];

  const ailments = [];

  for (let i = 0; i < ailmentNames.length; i++) {
    const name = ailmentNames[i];
    const values = {};
    for (let j = 0; j < stats.length; j++) {
      if (rows[j] && rows[j][name] !== undefined) {
        values[stats[j].toLowerCase().replace(/\s+/g, '_')] = rows[j][name];
      }
    }
    if (Object.keys(values).length > 0) {
      ailments.push({ name, ...values });
    }
  }

  return ailments;
}

function parseParts(partsData) {
  if (!partsData || !partsData.Rows) return [];

  return partsData.Rows.map(row => ({
    part: row.Part || row.Name || '',
    hp: row.HP || 0,
    wounds: row.Wounds || '',
    color: row.Color || '',
  }));
}

function parseMonsterNames(monsterNamesData) {
  const map = new Map();
  for (const [name, id] of Object.entries(monsterNamesData)) {
    map.set(String(id), name);
  }
  return map;
}

function main() {
  console.log('Loading MHWilds_Database...');
  const data = loadGzJson(INPUT_FILE);

  const monsterData = data['Monster Data'] || {};
  const monsterNamesData = data['Monster Names'] || {};
  const monsterNamesMap = parseMonsterNames(monsterNamesData);

  console.log(`Monster Names entries: ${monsterNamesMap.size}`);
  console.log(`Monster Data entries: ${Object.keys(monsterData).length}`);

  const results = [];

  for (const [key, monster] of Object.entries(monsterData)) {
    if (!monster || typeof monster !== 'object') continue;

    const name = monsterNamesMap.get(key) || key;

    const hitzones = parseHitzones(monster.Hitzones);
    const ailments = parseConditions(monster.ConditionTable);
    const parts = parseParts(monster.Parts);

    results.push({
      key,
      name,
      baseHealth: monster.BHP || 0,
      hrp: monster.HunterRankPoint || 0,
      cantCap: monster.CantCap || false,
      hitzones,
      ailments,
      parts,
      angryTable: monster.AngryTable || [],
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'monster_hitzones.json'), JSON.stringify(results, null, 2));
  console.log(`Done! Saved ${results.length} monsters with hitzones/ailments to wilds_raw/monster_hitzones.json`);
}

main();