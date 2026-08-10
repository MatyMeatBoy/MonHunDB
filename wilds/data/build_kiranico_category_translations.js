// Populates nameEs (+ description translations where the field exists) for
// decorations/skills/charms/armor pieces+sets/weapons, from the locally
// scraped Kiranico EN/ES data in the standalone ScraperinoRiperino tool
// (../../Apps/claude/scraperino-riperino/Riperino/wilds/). Mirrors the same
// pattern as build_kiranico_item_translations.js but writes straight into
// each record instead of building a shared lookup dict, since these fields
// are per-record (nameEs on the object itself), not a shared materials map.
const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const RIPERINO_DIR = path.join(__dirname, '../../../../Apps/claude/scraperino-riperino/Riperino/wilds');

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .trim();
}
// Same Guardian-abbreviation and Gamma/γ mismatches found in
// build_kiranico_item_translations.js -- Fextralife/our-scrape spelling vs
// Kiranico's.
function norm(s) {
  let v = decodeEntities(s).replace(/\s+\+/, '+').replace(/\s+Plus$/i, '+').trim();
  v = v.replace(/^G ([A-Z])/, 'G. $1').replace(/\bGamma\b/, 'γ');
  return v.toLowerCase();
}
function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 1)); }

function report(label, hit, total, missing) {
  console.log(`${label}: ${hit}/${total} translated`);
  if (missing.length) console.log('  missing:', missing.slice(0, 15).join(', ') + (missing.length > 15 ? ` (+${missing.length - 15} more)` : ''));
}

// --- simple list-level categories: decorations, skills, charms ---
function translateSimpleCategory({ label, projectFile, riperinoFile, nameField = 'name', nameEsField = 'nameEs', descField, descEsField }) {
  const projectPath = path.join(DATA_DIR, projectFile);
  const items = loadJson(projectPath);
  const kiranico = loadJson(path.join(RIPERINO_DIR, riperinoFile));

  const esByKey = new Map();
  for (const k of kiranico) {
    if (k.en && k.es) esByKey.set(norm(k.en.name), { name: k.es.name, desc: k.es.cols && k.es.cols[1] });
  }

  let hit = 0;
  const missing = [];
  for (const it of items) {
    const match = esByKey.get(norm(it[nameField]));
    if (match) {
      it[nameEsField] = match.name;
      if (descField && descEsField && match.desc && !it[descEsField]) it[descEsField] = match.desc;
      hit++;
    } else missing.push(it[nameField]);
  }
  writeJson(projectPath, items);
  report(label, hit, items.length, missing);
}

translateSimpleCategory({
  label: 'decorations',
  projectFile: 'decorations.json',
  riperinoFile: 'decorations.json',
  descField: 'description',
  descEsField: 'descriptionEs',
});

translateSimpleCategory({
  label: 'charms',
  projectFile: 'charms.json',
  riperinoFile: 'charms.json',
});

// --- skills: also fill descEn->descEs (level-by-level text isn't available
// from Kiranico's list page, only the base skill description) ---
{
  const projectPath = path.join(DATA_DIR, 'skills.json');
  const skills = loadJson(projectPath);
  const kiranico = loadJson(path.join(RIPERINO_DIR, 'skills.json'));
  const esByKey = new Map();
  for (const k of kiranico) if (k.en && k.es) esByKey.set(norm(k.en.name), { name: k.es.name, desc: k.es.cols && k.es.cols[1] });
  let hit = 0;
  const missing = [];
  for (const s of skills) {
    const match = esByKey.get(norm(s.name));
    if (match) {
      s.nameEs = match.name;
      if (match.desc && !s.descEs) s.descEs = match.desc;
      hit++;
    } else missing.push(s.name);
  }
  writeJson(projectPath, skills);
  report('skills', hit, skills.length, missing);
}

// --- weapons: Kiranico's weapons list (87) is far smaller than the
// project's full per-tier catalog (1146) -- best-effort name match, report
// honestly instead of pretending full coverage. ---
{
  const projectPath = path.join(DATA_DIR, 'weapons.json');
  const weapons = loadJson(projectPath);
  const kiranico = loadJson(path.join(RIPERINO_DIR, 'weapons.json'));
  const esByKey = new Map();
  for (const k of kiranico) if (k.en && k.es) esByKey.set(norm(k.en.name), k.es.name);
  let hit = 0;
  const missing = [];
  for (const w of weapons) {
    const es = esByKey.get(norm(w.name));
    if (es) { w.nameEs = es; hit++; } else missing.push(w.name);
  }
  writeJson(projectPath, weapons);
  console.log(`weapons: ${hit}/${weapons.length} translated (Kiranico only lists ${kiranico.length} named weapons -- expected low coverage, not a bug)`);
}

// --- armor: sets from armor-series list, pieces from every series detail
// page's first table (name+description pairs, already tier-suffixed with
// the same "α"/"β" the project uses). ---
{
  const seriesList = loadJson(path.join(RIPERINO_DIR, 'armor-series.json'));

  // Sets: Kiranico "Hope α" <-> project "Hope α Set"
  const setsPath = path.join(DATA_DIR, 'armor_sets.json');
  const sets = loadJson(setsPath);
  const esSetByKey = new Map();
  for (const s of seriesList) if (s.en && s.es) esSetByKey.set(norm(s.en.name + ' Set'), s.es.name + ' Set');
  let setHit = 0;
  const setMissing = [];
  for (const s of sets) {
    const es = esSetByKey.get(norm(s.name));
    if (es) { s.nameEs = es; setHit++; } else setMissing.push(s.name);
  }
  writeJson(setsPath, sets);
  report('armor_sets', setHit, sets.length, setMissing);

  // Pieces: walk every series detail file's table[0] (piece name/desc pairs).
  const piecesPath = path.join(DATA_DIR, 'armor_pieces.json');
  const pieces = loadJson(piecesPath);
  const esPieceByKey = new Map();
  let seriesRead = 0, seriesSkipped = 0;
  for (const s of seriesList) {
    if (!s.en || !s.en.slug) continue;
    const detailPath = path.join(RIPERINO_DIR, 'armor-series', `${s.en.slug}.json`);
    if (!fs.existsSync(detailPath)) { seriesSkipped++; continue; }
    const detail = loadJson(detailPath);
    const enRows = detail.en && detail.en.tables && detail.en.tables[0];
    const esRows = detail.es && detail.es.tables && detail.es.tables[0];
    if (!enRows || !esRows || enRows.length !== esRows.length) { seriesSkipped++; continue; }
    for (let i = 0; i < enRows.length; i++) {
      const [enName, enDesc] = enRows[i];
      const [esName, esDesc] = esRows[i];
      if (enName && esName) esPieceByKey.set(norm(enName), { name: esName, desc: esDesc });
    }
    seriesRead++;
  }
  let pieceHit = 0;
  const pieceMissing = [];
  for (const p of pieces) {
    const match = esPieceByKey.get(norm(p.name));
    if (match) { p.nameEs = match.name; pieceHit++; } else pieceMissing.push(p.name);
  }
  writeJson(piecesPath, pieces);
  console.log(`armor_pieces: ${pieceHit}/${pieces.length} translated (read ${seriesRead}/${seriesList.length} series detail pages, ${seriesSkipped} skipped)`);
  if (pieceMissing.length) console.log('  missing sample:', pieceMissing.slice(0, 15).join(', ') + (pieceMissing.length > 15 ? ` (+${pieceMissing.length - 15} more)` : ''));
}
