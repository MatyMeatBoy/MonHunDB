// Fills in missing "Afflicted"/"Risen" (Anomaly Research) material rows in
// monsters.json by scraping each monster's grindosaur.com Master Rank
// materials table, which -- unlike the original Fextralife scrape -- lists
// these rows explicitly. Only ADDS rows for materials a monster doesn't
// already have (exact name match); never touches/removes existing rows.
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;

const METHOD_TO_COL = {
  "Target Rewards": "targetReward",
  "Capture Rewards": "capture",
  "Broken Part Rewards": "breakParts",
  "Carves": "carves",
  "Dropped Materials": "dropped",
};

function parseMasterRankAnomalyRows(html) {
  const start = html.indexOf('id="materials-master-rank"');
  if (start === -1) return [];
  const section = html.slice(start, start + 400000);
  const rowRe = /<img alt="([^"]*) icon[^"]*"[^>]*src="([^"]+)"[^>]*>.*?<a[^>]*>([^<]+)<\/a><\/td><td class="text--left">([^<]*)<\/td><td>([^<]*)<\/td><td>(\d+)<\/td><td>([\d.]+)%<\/td>/g;
  let m;
  const rows = [];
  while ((m = rowRe.exec(section))) {
    const name = m[3];
    if (!/^(Afflicted|Risen)\b/.test(name)) continue;
    const method = m[4];
    const col = METHOD_TO_COL[method];
    if (!col) continue; // e.g. "Buddy Gathering", not part of our schema
    rows.push({ name, iconSrc: m[2], col, chance: m[7] });
  }
  return rows;
}

// collapses duplicate (name, col) pairs -- grindosaur lists "Anomaly Quests"
// and "Anomaly Investigations" as separate rows with the same chance -- and
// formats to match the existing convention in monsters.json exactly
function buildMaterialRows(rawRows) {
  const byName = new Map();
  for (const r of rawRows) {
    if (!byName.has(r.name)) byName.set(r.name, { iconSrc: r.iconSrc, cols: {} });
    const entry = byName.get(r.name);
    if (!(r.col in entry.cols)) entry.cols[r.col] = `${r.chance}% (Anomaly Quests)`;
  }
  return byName;
}

async function main() {
  const links = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "grindosaur_links_raw.json"), "utf8"));
  const monsters = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "monsters.json"), "utf8"));
  const byMonsterName = new Map(monsters.map(m => [m.name, m]));

  const newMaterialIcons = new Map(); // name -> iconSrc, for materials we added anywhere
  let totalAdded = 0;
  const report = [];

  let i = 0;
  for (const { text: name, url } of links) {
    i++;
    const monster = byMonsterName.get(name);
    if (!monster) {
      console.log(`[${i}/${links.length}] SKIP ${name}: no matching monster in monsters.json`);
      continue;
    }
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const rawRows = parseMasterRankAnomalyRows(html);
      const byName = buildMaterialRows(rawRows);

      if (!monster.materials) monster.materials = {};
      if (!monster.materials["Master Rank"]) monster.materials["Master Rank"] = [];
      const existingNames = new Set(monster.materials["Master Rank"].map(r => r.material));

      let addedHere = 0;
      for (const [matName, { iconSrc, cols }] of byName) {
        if (existingNames.has(matName)) continue;
        monster.materials["Master Rank"].push({
          material: matName,
          rarity: null,
          targetReward: cols.targetReward || "",
          capture: cols.capture || "",
          breakParts: cols.breakParts || "",
          carves: cols.carves || "",
          dropped: cols.dropped || "",
        });
        existingNames.add(matName);
        if (!newMaterialIcons.has(matName)) newMaterialIcons.set(matName, iconSrc);
        addedHere++;
        totalAdded++;
      }
      if (addedHere > 0) report.push(`${name}: +${addedHere} (${[...byName.keys()].filter(n => !Array.from(existingNames).slice(0, -addedHere).includes(n)).join(", ")})`);
      console.log(`[${i}/${links.length}] OK ${name}: +${addedHere} anomaly material row(s)`);
    } catch (e) {
      console.log(`[${i}/${links.length}] FAIL ${name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }

  fs.writeFileSync(path.join(DATA_DIR, "monsters.json"), JSON.stringify(monsters, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "_anomaly_new_icons.json"), JSON.stringify([...newMaterialIcons.entries()], null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "_anomaly_report.json"), JSON.stringify(report, null, 2));
  console.log(`\nDone. Added ${totalAdded} material rows across all monsters. ${newMaterialIcons.size} distinct new material names (icons saved to _anomaly_new_icons.json for the next step).`);
}

main();
