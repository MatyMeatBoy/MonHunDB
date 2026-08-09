// Post-process wilds/data/monsters.json into the rise/ schema shape:
// - adds isSmall flag (from the wiki's large/small split)
// - attackElements = elements (what the monster attacks with)
// - inflicts = { elements:[], ailments:[] } (what it inflicts)
// - weaknesses = [{ element, stars }] derived from max hitzone value per element
//   (best element gets 3 stars, 70%+ gets 2, else 1; 0 = excluded)
// - resistances = [{ element, immune|stars }] derived from hitzones (0 value = immune)
// Keeps hitzones (with wounds rows for tenderized) and materials/parts/ailments from Kiranico.
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'monsters.json');

const SMALL = new Set([
  'Vespoid', 'Conga', 'Blango', 'Ceratonoth (Male)', 'Ceratonoth (Female)',
  'Dalthydon', 'Dalthydon (Livestock)', 'Bulaqchi', 'Talioth', 'Baunos',
  'Gajios', 'Piragill', 'Harpios', 'Kranodath', 'Comaqchi', 'Gelidron',
  'Rafma', 'Porkeplume', 'Nerscylla Hatchling', 'Guardian Seikret', 'Omega Micros',
]);

const ELEMENTS = ['Fire', 'Water', 'Thunder', 'Ice', 'Dragon'];

function normalizeElement(e) {
  const s = String(e || '').replace(' Element', '').replace(' Ailment', '').trim();
  return ELEMENTS.find(el => el.toLowerCase() === s.toLowerCase()) || s;
}

// ailment tokens (from the wiki's Status Effects cell) that are statuses, not elements
const AILMENT_TOKENS = /blight|poison|paralysis|sleep|blast|stun|exhaust|bleed|web|frenzy|soiled|snow|bubble|tar|defense|hp penalty|mount|parry|noxious|frost|dragonblight|thunderblight|waterblight|iceblight|fireblight/i;

function splitInflicts(inflictsArr) {
  const elements = [];
  const ailments = [];
  for (const raw of inflictsArr || []) {
    const s = String(raw);
    if (/Attribute|Ailment|blight|Status/i.test(s)) {
      let name = s.replace(/ Attribute$/, '').replace(/ Ailment$/, '').trim();
      ailments.push(name);
    } else if (/Element$/i.test(s)) {
      elements.push(normalizeElement(s));
    } else if (AILMENT_TOKENS.test(s)) {
      ailments.push(s);
    } else if (ELEMENTS.some(el => s.toLowerCase().includes(el.toLowerCase()))) {
      elements.push(normalizeElement(s));
    } else {
      ailments.push(s);
    }
  }
  return { elements: [...new Set(elements)], ailments: [...new Set(ailments)] };
}

function main() {
  const monsters = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  for (const mo of monsters) {
    mo.isSmall = SMALL.has(mo.name);

    // attackElements: from infobox "Elements" (what the monster uses)
    mo.attackElements = (mo.elements || []).map(normalizeElement).filter(Boolean);
    delete mo.elements;

    // inflicts -> structured
    mo.inflicts = splitInflicts(mo.inflicts || []);

    // weaknesses/resistances from hitzones (rows where wounds==0, part=best values)
    // best per part: use max across parts for each element
    const hz = (mo.hitzones || []).filter(h => !h.wounds);
    const elMax = {};
    for (const el of ELEMENTS) {
      const key = el.toLowerCase();
      elMax[el] = Math.max(0, ...hz.map(h => h[key] || 0));
    }
    const bestEl = Math.max(...ELEMENTS.map(el => elMax[el]));
    mo.weaknesses = ELEMENTS.filter(el => elMax[el] > 0).map(el => {
      const v = elMax[el];
      const stars = v === bestEl ? 3 : v >= bestEl * 0.7 ? 2 : 1;
      return { element: el, stars };
    });
    mo.resistances = ELEMENTS.filter(el => elMax[el] === 0).map(el => ({ element: el, immune: true }));
  }
  fs.writeFileSync(OUT, JSON.stringify(monsters, null, 1));
  console.log('normalized', monsters.length, 'monsters');
}

main();
