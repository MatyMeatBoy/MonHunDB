const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = 'C:\\Users\\MP\\Documents\\00 Claude\\bestiario-nemo\\por agregar';
const BASE_URL = 'https://monsterhunterrise.wiki.fextralife.com/file/Monster-Hunter-Rise/';

const impliedSets = [
  "Leather X", "Chainmail X", "Hunter's X", "Alloy X", "Bone X", "Rhenoplos X",
  "Bnahabra X", "Hornetaur", "Vespoid", "Velociprey", "Izuchi X", "Baggi X",
  "Kulu-Ya-Ku X", "Wroggi X", "Arzuros X", "Lagombi X", "Volvidon X", "Aknosom X",
  "Ludroth X", "Barroth X", "Hermitaur", "Ingot X", "Skalda X", "Spio X",
  "S. Studded X", "Five Element", "Squire's", "Yukumo Sky", "Khezu X", "Bishaten X",
  "Orangaten", "Jyuratodus X", "Basarios X", "Somnacanth X", "Auroracanth",
  "Rathian X", "Anjanath X", "Dober X", "Vaik X", "Makluva X", "Aelucanth X",
  "Rhopessa X", "Artillery Corps", "Guild Bard", "Scholar's", "Guardian", "Brigade X",
  "Barioth X", "Sinister Demon", "Nargacuga X", "Goss Harag X", "Golm", "Ceanataur",
  "Almudron X", "Rakna X", "Magmadron", "Pyre-Kadaki", "Utsushi True", "Remobra X",
  "Mizutsune X", "Rathalos X", "Zinogre X", "Tigrex X", "Diablos X", "Gore",
  "Regios", "Astalos", "Lunagaron", "Espinas", "Hoplite's", "Dignified", "Barbania",
  "Snowshear", "Grand God's Peer", "Bazelgeuse X", "Damascus X", "Kushala X",
  "Kaiser X", "Arc", "Storge", "Malzeno", "Professor's", "Charité", "Scholarly",
  "Commission", "Jelly X", "Sailor", "Guild Palace", "Archfiend Armor",
  "Ibushi's Pure", "Narwa's Pure", "Valstrax", "Sinister Grudge", "Outpost HQ",
  "Pride", "Golden", "Silver", "Lambent", "Onmyo", "Flaming Espinas",
  "Risen Mizuha", "Chaotic", "Nephilim", "Risen Kushala", "Risen Kaiser",
  "Rimeguard", "Tempest", "Virtue", "Prudence", "Primordial", "Leather S",
  "Chainmail S", "Hunter's S", "Alloy S", "Ingot S", "Skalda S", "Spio S",
  "Aknosom S", "Tetranadon S", "Izuchi S", "Rhenoplos S", "Bnahabra S",
  "Wroggi S", "Baggi S", "Arzuros S", "Volvidon S", "Ludroth S", "Barroth S",
  "Khezu S", "Kulu-Ya-Ku S", "Lagombi S", "Bone S", "Dober", "Makluva S",
  "Vaik S", "Channeler's S", "Medium's S", "S. Studded S", "Bishaten S",
  "Somnacanth S", "Remobra S", "Barioth S", "Rathian S", "Basarios S",
  "Jyuratodus", "Aelucanth S", "Rhopessa S", "Jelly S", "Rakna", "Goss Harag S",
  "Almudron S", "Nargacuga S", "Rathalos S", "Tigrex S", "Diablos S", "Zinogre S",
  "Anjanath S", "Sinister S", "Mizutsune S", "Brigade S", "Damascus", "Ibushi's",
  "Narwa's", "Kushala", "Kaiser", "Bazelgeuse", "Leather", "Chainmail", "Hunter's",
  "Izuchi", "Baggi", "Arzuros", "Lagombi", "Alloy", "Ingot", "Melahoa",
  "Death Stench", "Mosgharl", "Vaik", "Edel", "Skalda", "Spio", "S. Studded",
  "Bishaten", "Aknosom", "Tetranadon", "Somnacanth", "Rhenoplos", "Bnahabra",
  "Remobra", "Wroggi", "Volvidon", "Ludroth", "Barroth", "Khezu", "Barioth",
  "Rathian", "Basarios", "Kulu-Ya-Ku", "Bone", "Makluva", "Aelucanth", "Rhopessa",
  "Utsushi", "Channeler's", "Medium's", "Jelly", "Goss Harag", "Almudron",
  "Nargacuga", "Rathalos", "Tigrex", "Diablos", "Zinogre", "Anjanath", "Sinister",
  "Mizutsune", "Brigade"
];

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getImageUrls(name) {
  const base = slugify(name);
  const urls = [];

  if (name.endsWith(' X')) {
    const baseName = base.replace('-x', '');
    urls.push(`${BASE_URL}${baseName}_x-male-set-mhr-wiki-guide.png`);
    urls.push(`${BASE_URL}${baseName}-male-set-mhr-wiki-guide.png`);
  } else if (name.endsWith(' S')) {
    const baseName = base.replace('-s', '');
    urls.push(`${BASE_URL}${baseName}_s-male-set-mhr-wiki-guide.png`);
    urls.push(`${BASE_URL}${baseName}-male-set-mhr-wiki-guide.png`);
    urls.push(`${BASE_URL}${baseName}_set-mhr-wiki-guide.png`);
  } else {
    urls.push(`${BASE_URL}${base}_set-mhr-wiki-guide.png`);
    urls.push(`${BASE_URL}${base}-male-set-mhr-wiki-guide.png`);
    urls.push(`${BASE_URL}${base}_male-set-mhr-wiki-guide.png`);
  }

  return urls;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => file.close(() => resolve(true)));
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      } else {
        file.close(() => fs.unlink(dest, () => resolve(false)));
      }
    }).on('error', (err) => {
      file.close(() => fs.unlink(dest, () => reject(err)));
    });
  });
}

async function downloadAll() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Total sets to check: ${impliedSets.length}`);
  let success = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < impliedSets.length; i++) {
    const name = impliedSets[i];
    const urls = getImageUrls(name);
    let downloaded = false;

    for (const url of urls) {
      const filename = `${slugify(name)}.png`;
      const dest = path.join(OUTPUT_DIR, filename);

      if (fs.existsSync(dest)) {
        console.log(`[${i+1}/${impliedSets.length}] SKIP: ${name} (already exists)`);
        downloaded = true;
        break;
      }

      try {
        const ok = await downloadFile(url, dest);
        if (ok) {
          console.log(`[${i+1}/${impliedSets.length}] OK: ${name} -> ${filename}`);
          downloaded = true;
          success++;
          break;
        }
      } catch (e) {
        // try next URL
      }
    }

    if (!downloaded) {
      console.log(`[${i+1}/${impliedSets.length}] FAIL: ${name}`);
      failed++;
      results.push({ name, status: 'failed' });
    } else {
      results.push({ name, status: 'ok' });
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`Exitosos: ${success}`);
  console.log(`Fallidos: ${failed}`);
  console.log(`Total: ${impliedSets.length}`);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'download_report.json'), JSON.stringify(results, null, 2));
}

downloadAll().catch(console.error);