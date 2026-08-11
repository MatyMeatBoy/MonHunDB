// New MHFU-only page (no Rise/Wilds equivalent): consolidates the 10 quest
// tables from Riperino/MHFU/quests into one flat mhfu/data/quests.json,
// tagging each with a rank label derived from its source file.
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/MP/Documents/Apps/claude/scraperino-riperino/Riperino/MHFU/quests";
const OUT = __dirname;

const RANK_LABEL = {
  "elder": "Elder Hall",
  "guild-1": "Guild Hall 1★",
  "guild-2": "Guild Hall 2★",
  "guild-3": "Guild Hall 3★",
  "nekoht": "Nekoht Hunter's Hall",
  "training-1": "Training Hall 1★",
  "training-2": "Training Hall 2★",
  "training-3": "Training Hall 3★",
  "training-group": "Training Hall (Group)",
  "treasure-hunt": "Treasure Hunt",
};

const out = [];
let id = 1;
for (const [file, rankLabel] of Object.entries(RANK_LABEL)) {
  const p = path.join(SRC, `${file}.json`);
  if (!fs.existsSync(p)) continue;
  const quests = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const q of quests) {
    out.push({
      id: `mhfuq${id++}`,
      name: q.name,
      rank: rankLabel,
      questType: q["quest-type"] || null,
      reward: q.reward ?? null,
      contractFee: q["contract-fee"] ?? null,
      timeLimit: q["time-limit"] ?? null,
      location: q.location || null,
      mainMonsters: q["main-monsters"] || [],
      goalCondition: q["goal-condition"] || null,
      client: q.client || null,
      details: q["quest-details"] || null,
      difficulty: q.difficulty ?? null,
    });
  }
}

fs.writeFileSync(path.join(OUT, "quests.json"), JSON.stringify(out, null, 1));
console.log(`Wrote ${out.length} quests across ${Object.keys(RANK_LABEL).length} ranks.`);
