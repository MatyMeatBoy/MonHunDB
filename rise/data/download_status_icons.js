// Downloads MHRise status-effect icons from the Fandom category page for
// the ailments/blights that actually appear in our monster data. A few
// ailments (Bleed, Bloodblight, Exhaust, Frenzy Virus) have no dedicated
// MHRise icon in that category and are skipped — the UI falls back to no
// icon for those, same as the untranslated-material fallback.
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const OUT_DIR = path.join(__dirname, "images", "status");

const MAP = {
  "Blast": "Status_Effect-Blastblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024843",
  "Blastblight": "Status_Effect-Blastblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024843",
  "Bubble": "Status_Effect-Bubbleblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024844",
  "Defense Down": "Status_Effect-Defense_Down_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024844",
  "Dragonblight": "Status_Effect-Dragonblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024845",
  "Fireblight": "Status_Effect-Fireblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024847",
  "Hellfireblight": "Status_Effect-Fireblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024847",
  "Iceblight": "Status_Effect-Iceblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024848",
  "Paralysis": "Status_Effect-Paralysis_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024905",
  "Poison": "Status_Effect-Poison_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024906",
  "Sleep": "Status_Effect-Sleep_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024907",
  "Stench": "Status_Effect-Stench_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024908",
  "Stun": "Status_Effect-Stun_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024909",
  "Thunderblight": "Status_Effect-Thunderblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328024926",
  "Venom": "Status_Effect-Venom_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328025010",
  "Waterblight": "Status_Effect-Waterblight_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328025030",
  "Webbed": "Status_Effect-Webbed_MHRise_Icon.svg/revision/latest/smart/width/64/height/48?cb=20210328025048",
};

const BASE_MAP = {
  "Status_Effect-Blastblight_MHRise_Icon.svg": "e/eb",
  "Status_Effect-Bubbleblight_MHRise_Icon.svg": "4/47",
  "Status_Effect-Defense_Down_MHRise_Icon.svg": "0/07",
  "Status_Effect-Dragonblight_MHRise_Icon.svg": "3/32",
  "Status_Effect-Fireblight_MHRise_Icon.svg": "8/81",
  "Status_Effect-Iceblight_MHRise_Icon.svg": "2/27",
  "Status_Effect-Paralysis_MHRise_Icon.svg": "c/c5",
  "Status_Effect-Poison_MHRise_Icon.svg": "5/5f",
  "Status_Effect-Sleep_MHRise_Icon.svg": "a/a8",
  "Status_Effect-Stench_MHRise_Icon.svg": "4/44",
  "Status_Effect-Stun_MHRise_Icon.svg": "c/c0",
  "Status_Effect-Thunderblight_MHRise_Icon.svg": "4/48",
  "Status_Effect-Venom_MHRise_Icon.svg": "3/3b",
  "Status_Effect-Waterblight_MHRise_Icon.svg": "5/5a",
  "Status_Effect-Webbed_MHRise_Icon.svg": "e/e7",
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = {};
  let i = 0;
  const entries = Object.entries(MAP);
  for (const [key, tail] of entries) {
    i++;
    const filenamePart = tail.split("/")[0];
    const dir = BASE_MAP[filenamePart];
    const url = `https://static.wikia.nocookie.net/monsterhunter/images/${dir}/${tail}`;
    const outFile = `${slugify(key)}.svg`;
    const outPath = path.join(OUT_DIR, outFile);
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      manifest[key] = `data/images/status/${outFile}`;
      console.log(`[${i}/${entries.length}] OK ${key} (${buf.length}b)`);
    } catch (e) {
      console.log(`[${i}/${entries.length}] FAIL ${key}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }
  fs.writeFileSync(path.join(__dirname, "status_icon_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${Object.keys(manifest).length}/${entries.length} downloaded.`);
}

main();
