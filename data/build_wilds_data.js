const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'wilds_raw');
const OUT_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function loadJson(file) {
  const p = path.join(RAW_DIR, file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeMaterialKey(name) {
  return (name || '').trim().replace(/\s*\+\s*/g, '+').replace(/\s+/g, ' ').toLowerCase();
}

function buildMonsters() {
  console.log('Building monsters.json...');
  const monstersEn = loadJson('monsters.json') || [];
  const hitzonesData = loadJson('monster_hitzones.json') || [];
  const itemsData = loadJson('items.json') || [];

  const itemsByName = new Map(itemsData.map(i => [normalizeMaterialKey(i.name), i]));
  const itemsByNameEs = new Map(itemsData.map(i => [normalizeMaterialKey(i.nameEs), i]));

  const hzByName = new Map(hitzonesData.map(h => [h.name.toLowerCase(), h]));

  const results = [];

  for (const m of monstersEn) {
    const hz = hzByName.get(m.name.toLowerCase()) || hzByName.get(m.slug.toLowerCase());

    const weaknesses = [];
    const resistances = [];

    if (hz && hz.hitzones.length > 0) {
      const elements = ['fire', 'water', 'thunder', 'ice', 'dragon'];
      for (const el of elements) {
        const maxVal = Math.max(...hz.hitzones.map(p => p[el] || 0));
        if (maxVal > 0) {
          if (maxVal >= 20) weaknesses.push({ element: el.charAt(0).toUpperCase() + el.slice(1), stars: Math.min(3, Math.ceil(maxVal / 15)) });
          else resistances.push({ element: el.charAt(0).toUpperCase() + el.slice(1), stars: 1 });
        } else if (maxVal === 0) {
          resistances.push({ element: el.charAt(0).toUpperCase() + el.slice(1), immune: true });
        }
      }
    }

    const ailmentSusceptibility = [];
    if (hz && hz.ailments.length > 0) {
      for (const a of hz.ailments) {
        const initial = a.initial_tolerance || a.initial_tolerance || 0;
        const max = a.max_tolerance || 0;
        let stars = 1;
        if (initial && max) {
          const ratio = initial / max;
          if (ratio < 0.3) stars = 3;
          else if (ratio < 0.6) stars = 2;
        }
        ailmentSusceptibility.push({
          ailment: a.name.charAt(0).toUpperCase() + a.name.slice(1).toLowerCase(),
          stars,
          buildup: initial ? [{ label: 'Initial', value: initial, max }] : [],
        });
      }
    }

    const inflicts = [];
    if (hz && hz.hitzones.length > 0) {
      const elements = ['fire', 'water', 'thunder', 'ice', 'dragon'];
      for (const el of elements) {
        const maxVal = Math.max(...hz.hitzones.map(p => p[el] || 0));
        if (maxVal > 0) inflicts.push(el.charAt(0).toUpperCase() + el.slice(1));
      }
    }

    const locations = ['Wildspire Waste', 'Scarlet Forest', 'Oilwell Basin', 'Iceshard Cliffs', 'Ruins of Wyveria'];
    const materials = { 'Low Rank': [], 'High Rank': [], 'Master Rank': [] };

    results.push({
      name: m.name,
      nameEs: m.nameEs,
      species: m.species,
      speciesEs: m.speciesEs,
      locations,
      weaknesses,
      resistances,
      ailmentSusceptibility,
      inflicts,
      materials,
      image: `data/images/${slugify(m.name)}.webp`,
      hitzones: hz?.hitzones || [],
      parts: hz?.parts || [],
      partBreaks: hz?.hitzones.filter(p => p.breakHP && p.breakHP.length > 0).map(p => ({
        part: p.part,
        hp: p.breakHP[0],
        breakInfo: p.breakHP.length > 1 ? `x${p.breakHP.length}` : '',
      })) || [],
      ailmentBuildup: hz?.ailments || [],
      attackElements: inflicts,
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'monsters_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} monsters`);
  return results;
}

function buildDecorations() {
  console.log('Building decorations.json...');
  const decos = loadJson('decorations.json') || [];

  const results = decos.map(d => ({
    id: d.id,
    name: d.name,
    nameEs: d.nameEs,
    slotLevel: d.slotLevel,
    description: d.description,
    descriptionEs: d.descriptionEs,
    skills: d.skills.map(s => ({
      name: s.name,
      nameEs: s.nameEs,
      level: s.level || 1,
      effect: '',
      effectEs: '',
    })),
    materials: d.materials.map(m => ({
      material: m.name,
      qty: 1,
    })),
  }));

  fs.writeFileSync(path.join(OUT_DIR, 'decorations_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} decorations`);
  return results;
}

function buildSkills() {
  console.log('Building skills.json...');
  const skills = loadJson('skills.json') || [];

  const results = skills.map((s, idx) => ({
    id: s.id || `PlayerSkill_${idx}`,
    name: s.name,
    nameEs: s.nameEs,
    descEn: s.description,
    descEs: s.descriptionEs,
    levels: s.levels.map(l => ({
      level: l.level,
      effectEn: l.effect,
      effectEs: l.effectEs,
    })),
    colorIndex: idx % 20,
  }));

  fs.writeFileSync(path.join(OUT_DIR, 'skills_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} skills`);
  return results;
}

function buildWeapons() {
  console.log('Building weapons.json...');
  const weapons = loadJson('weapons.json') || [];

  const results = weapons.map(w => ({
    id: w.id,
    name: w.name,
    nameEs: w.nameEs,
    type: w.type,
    attack: w.attack,
    rarity: w.rarity,
    element: w.element ? { type: w.element.type, value: w.element.value } : null,
    affinity: w.affinity,
    materials: w.materials.map(m => ({ material: m.name, qty: parseInt(m.qty) || 1 })),
    decoSlots: w.decoSlots || [],
    isFinal: false,
    prevId: null,
    nextId: null,
  }));

  fs.writeFileSync(path.join(OUT_DIR, 'weapons_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} weapons`);
  return results;
}

function buildArmorPieces() {
  console.log('Building armor_pieces.json...');
  const armor = loadJson('armor_pieces.json') || [];

  const partMap = {
    'head': 'head', 'headgear': 'head',
    'chest': 'chest', 'body': 'chest',
    'arms': 'arms', 'gloves': 'arms',
    'waist': 'waist', 'coil': 'waist',
    'legs': 'legs', 'greaves': 'legs',
  };

  const results = armor.map(a => ({
    id: a.id,
    name: a.name,
    nameEs: a.nameEs,
    rarity: a.rarity,
    defense: a.defense,
    part: partMap[a.part?.toLowerCase()] || a.part,
    skills: a.skills.map(s => ({ name: s.name, nameEs: s.nameEs, level: s.level || 1 })),
    materials: a.materials.map(m => ({ material: m.name, qty: parseInt(m.qty) || 1 })),
    decoSlots: a.decoSlots || [],
    iconM: a.iconM,
    iconF: a.iconF,
  }));

  fs.writeFileSync(path.join(OUT_DIR, 'armor_pieces_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} armor pieces`);
  return results;
}

function buildCharms() {
  console.log('Building charms.json...');
  const charms = loadJson('charms.json') || [];

  const results = charms.map(c => ({
    id: c.id,
    name: c.name,
    nameEs: c.nameEs,
    rarity: c.rarity,
    skills: c.skills.map(s => ({ name: s.name, nameEs: s.nameEs, level: s.level || 1 })),
    materials: c.materials.map(m => ({ material: m.name, qty: parseInt(m.qty) || 1 })),
    decoSlots: c.decoSlots || [],
  }));

  fs.writeFileSync(path.join(OUT_DIR, 'charms_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} charms`);
  return results;
}

function buildItems() {
  console.log('Building items translations...');
  const items = loadJson('items.json') || [];

  const translations = {};
  for (const item of items) {
    translations[normalizeMaterialKey(item.name)] = {
      en: item.name,
      es: item.nameEs,
    };
  }

  fs.writeFileSync(path.join(OUT_DIR, 'kiranico_item_translations_wilds.json'), JSON.stringify(translations, null, 2));
  console.log(`Built ${Object.keys(translations).length} item translations`);
  return translations;
}

function buildManifests() {
  console.log('Building icon manifests...');
  const monsters = loadJson('monsters.json') || [];
  const items = loadJson('items.json') || [];

  const iconManifest = {};
  for (const m of monsters) {
    iconManifest[m.name] = `data/images/${slugify(m.name)}.webp`;
  }

  const materialIconManifest = {};
  for (const item of items) {
    if (item.icon) {
      materialIconManifest[normalizeMaterialKey(item.name)] = item.icon;
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'icon_manifest_wilds.json'), JSON.stringify(iconManifest, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'material_icon_manifest_wilds.json'), JSON.stringify(materialIconManifest, null, 2));
  console.log('Built manifests');
}

function main() {
  buildMonsters();
  buildDecorations();
  buildSkills();
  buildWeapons();
  buildArmorPieces();
  buildCharms();
  buildItems();
  buildManifests();
  console.log('All done!');
}

main();