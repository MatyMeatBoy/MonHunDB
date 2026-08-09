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
  console.log('Building monsters_wilds.json...');
  const monstersEn = loadJson('monsters_kiranico.json') || [];
  const hitzonesData = loadJson('monster_hitzones.json') || [];
  const decorations = loadJson('decorations_pw.json') || [];
  const skills = loadJson('skills_pw.json') || [];
  const charms = loadJson('charms_pw.json') || [];

  const hzByName = new Map(hitzonesData.map(h => [h.name.toLowerCase(), h]));

  const results = [];

  for (const m of monstersEn) {
    const hz = hzByName.get(m.name.toLowerCase());

    const weaknesses = [];
    const resistances = [];

    if (hz && hz.hitzones.length > 0) {
      const elements = ['fire', 'water', 'thunder', 'ice', 'dragon'];
      for (const el of elements) {
        const maxVal = Math.max(...hz.hitzones.map(p => p[el] || 0));
        if (maxVal >= 20) weaknesses.push({ element: el.charAt(0).toUpperCase() + el.slice(1), stars: Math.min(3, Math.ceil(maxVal / 15)) });
        else if (maxVal > 0) resistances.push({ element: el.charAt(0).toUpperCase() + el.slice(1), stars: 1 });
        else if (maxVal === 0) resistances.push({ element: el.charAt(0).toUpperCase() + el.slice(1), immune: true });
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
      nameEs: m.name, // TODO: add ES names
      species: hz?.parts?.[0]?.part || 'Unknown',
      speciesEs: hz?.parts?.[0]?.part || 'Desconocido',
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
  console.log('Building decorations_wilds.json...');
  const decos = loadJson('decorations_pw.json') || [];

  const results = decos.map(d => {
    const stats = d.stats || {};
    let slotLevel = 1;
    const slotMatch = d.name.match(/\[(\d+)\]/);
    if (slotMatch) slotLevel = parseInt(slotMatch[1], 10);

    const skillName = stats['Skill'] || stats['Grants'] || '';
    const materials = [];
    // Parse materials from stats if available

    return {
      id: d.slug,
      name: d.name,
      nameEs: d.name,
      slotLevel,
      description: d.description || '',
      descriptionEs: '',
      skills: skillName ? [{ name: skillName, nameEs: skillName, level: 1, effect: '', effectEs: '' }] : [],
      materials,
    };
  });

  fs.writeFileSync(path.join(OUT_DIR, 'decorations_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} decorations`);
  return results;
}

function buildSkills() {
  console.log('Building skills_wilds.json...');
  const skills = loadJson('skills_pw.json') || [];

  const results = skills.map((s, idx) => {
    const stats = s.stats || {};
    const levels = [];
    for (let i = 1; i <= 7; i++) {
      const key = `Level ${i}` || `Lv${i}`;
      if (stats[key]) {
        levels.push({ level: i, effectEn: stats[key], effectEs: '' });
      }
    }
    if (levels.length === 0 && stats['Effect']) {
      levels.push({ level: 1, effectEn: stats['Effect'], effectEs: '' });
    }

    return {
      id: s.slug || `PlayerSkill_${idx}`,
      name: s.name,
      nameEs: s.name,
      descEn: s.description || '',
      descEs: '',
      levels,
      colorIndex: idx % 20,
    };
  });

  fs.writeFileSync(path.join(OUT_DIR, 'skills_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} skills`);
  return results;
}

function buildCharms() {
  console.log('Building charms_wilds.json...');
  const charms = loadJson('charms_pw.json') || [];

  const results = charms.map(c => {
    const stats = c.stats || {};
    const skills = [];
    // Parse skills from stats
    for (const [key, value] of Object.entries(stats)) {
      if (key.toLowerCase().includes('skill') || key.toLowerCase().includes('grants')) {
        skills.push({ name: value, nameEs: value, level: 1 });
      }
    }
    const materials = [];
    // Parse materials from stats

    return {
      id: c.slug,
      name: c.name,
      nameEs: c.name,
      rarity: 1,
      skills,
      materials,
      decoSlots: [],
    };
  });

  fs.writeFileSync(path.join(OUT_DIR, 'charms_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} charms`);
  return results;
}

function buildWeapons() {
  console.log('Building weapons_wilds.json (placeholder from MHWilds-Database)...');
  // Weapons will be populated from MHWilds-Database later
  const results = [];
  fs.writeFileSync(path.join(OUT_DIR, 'weapons_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} weapons (placeholder)`);
  return results;
}

function buildArmorPieces() {
  console.log('Building armor_pieces_wilds.json (placeholder)...');
  const results = [];
  fs.writeFileSync(path.join(OUT_DIR, 'armor_pieces_wilds.json'), JSON.stringify(results, null, 2));
  console.log(`Built ${results.length} armor pieces (placeholder)`);
  return results;
}

function buildItems() {
  console.log('Building items translations...');
  const items = loadJson('items_pw.json') || [];

  const translations = {};
  for (const item of items) {
    if (item.name) {
      translations[normalizeMaterialKey(item.name)] = {
        en: item.name,
        es: item.name, // TODO: add ES
      };
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'kiranico_item_translations_wilds.json'), JSON.stringify(translations, null, 2));
  console.log(`Built ${Object.keys(translations).length} item translations`);
  return translations;
}

function buildManifests() {
  console.log('Building icon manifests...');
  const monsters = loadJson('monsters_kiranico.json') || [];

  const iconManifest = {};
  for (const m of monsters) {
    iconManifest[m.name] = `data/images/${slugify(m.name)}.webp`;
  }

  fs.writeFileSync(path.join(OUT_DIR, 'icon_manifest_wilds.json'), JSON.stringify(iconManifest, null, 2));
  console.log('Built manifests');
}

function main() {
  buildMonsters();
  buildDecorations();
  buildSkills();
  buildCharms();
  buildWeapons();
  buildArmorPieces();
  buildItems();
  buildManifests();
  console.log('All done!');
}

main();