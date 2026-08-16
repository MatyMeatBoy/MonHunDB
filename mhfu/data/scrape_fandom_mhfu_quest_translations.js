/* Cross-match existing MHFU quests against the Spanish Fandom tables. */
const fs = require("fs");
const https = require("https");
const path = require("path");
const questsPath = path.join(__dirname, "quests.json");
const quests = JSON.parse(fs.readFileSync(questsPath, "utf8"));
const monsters = JSON.parse(fs.readFileSync(path.join(__dirname, "monsters.json"), "utf8"));
const items = JSON.parse(fs.readFileSync(path.join(__dirname, "items.json"), "utf8"));
const pages = ["MHFU:_Misiones_Aldea", "MHFU:_Misiones_Nekoth", "MHFU:_Misiones_Gremio"];
const getPage = page => new Promise((resolve, reject) => {
  const url = `https://monsterhunter.fandom.com/es/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json`;
  https.get(url, response => { let body = ""; response.on("data", chunk => body += chunk); response.on("end", () => resolve(JSON.parse(body).parse.wikitext["*"])); }).on("error", reject);
});
const clean = value => String(value || "").replace(/<br\s*\/?>(\s*)/gi, " ").replace(/'''|''/g, "").replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const norm = value => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const monsterByEs = new Map(monsters.flatMap(monster => [[norm(monster.name), monster.name], [norm(monster.nameEs), monster.name]]));
const locationMap = [["Montañas Nevadas", "SnwyMntains"], ["Jungla", "Jungle"], ["Desierto", "Desert"], ["Pantano", "Swamp"], ["Bosque y Colinas", "ForestHills"], ["Volcán", "Volcano"], ["Volcan", "Volcano"], ["Torre", "Tower"], ["Arena", "Arena"], ["Gran Bosque", "GreatForest"]];
function rankFromHeading(page, heading) {
  if (page === "MHFU:_Misiones_Aldea") return "Elder Hall";
  if (page === "MHFU:_Misiones_Nekoth") return "Nekoht Hunter's Hall";
  const stars = (heading.match(/★/g) || []).length;
  return stars <= 3 ? `Guild Hall ${stars}★` : stars <= 6 ? "Guild Hall 3★" : "Guild Hall 3★";
}
function rows(wikitext, page) {
  const result = []; let rank = rankFromHeading(page, "");
  for (const block of wikitext.split("\n|-").slice(1)) {
    const lines = block.split("\n");
    const heading = lines.find(line => /^={2,4}/.test(line));
    if (heading) rank = rankFromHeading(page, heading);
    if (!block.includes("Lugar")) continue;
    const cells = lines.filter(line => /^\|/.test(line));
    if (cells.length < 3) continue;
    const name = clean(cells[0].replace(/^\|(?:[^|]*\|)?/, ""));
    const objective = clean(cells[1].replace(/^\|(?:[^|]*\|)?/, ""));
    const data = clean(cells[2].replace(/^\|(?:[^|]*\|)?/, ""));
    const time = Number(data.match(/Tiempo\s*:\s*(\d+)/i)?.[1] || 0);
    const fee = Number(data.match(/Tarifa\s*:\s*(\d+)/i)?.[1] || 0);
    const reward = Number(data.match(/Recompensa\s*:\s*(\d+)/i)?.[1] || 0);
    const place = data.match(/Lugar\s*:\s*([^()]+?)(?:\s*\(([^)]+)\))?\s+Tiempo/i)?.[1]?.trim() || "";
    const location = locationMap.find(([spanish]) => norm(place).includes(norm(spanish)))?.[1] || place;
    const mainMonsters = [...objective.matchAll(/\[\[([^\]|]+)/g)].map(match => monsterByEs.get(norm(match[1])) || match[1]);
    result.push({ name, rank, time, fee, reward, location, mainMonsters });
  }
  return result;
}
function candidates(source) {
  let list = quests.filter(quest => quest.rank === source.rank && quest.timeLimit === source.time && quest.contractFee === source.fee && quest.reward === source.reward);
  if (source.location) list = list.filter(quest => quest.location.includes(source.location));
  if (source.mainMonsters.length) list = list.filter(quest => source.mainMonsters.some(monster => quest.mainMonsters.includes(monster)));
  return list;
}
function relaxedCandidates(source) {
  if (!source.mainMonsters.length) return [];
  return quests.filter(quest => quest.rank === source.rank && quest.timeLimit === source.time && quest.contractFee === source.fee && quest.reward === source.reward && source.mainMonsters.some(monster => quest.mainMonsters.includes(monster)));
}
(async () => {
  let matched = 0;
  for (const page of pages) for (const source of rows(await getPage(page), page)) {
    const strict = candidates(source);
    const list = strict.length ? strict : relaxedCandidates(source);
    if (list.length !== 1) continue;
    if (!list[0].nameEs) { list[0].nameEs = source.name; matched++; }
  }
  fs.writeFileSync(questsPath, JSON.stringify(quests, null, 2) + "\n");
  console.log(`Added ${matched} unambiguous Spanish quest names.`);
})();
