const fs = require("fs");
function stripHtml(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
function parseObtainInfo(html, name) {
  const marker = `How to get ${name}`;
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const section = html.slice(idx, idx + 3000);
  const questsMatch = section.match(/Quests & Rewards for [^<]*<\/[^>]+>(.*?)Monsters that drop/s);
  const monstersMatch = section.match(/Monsters that drop [^<]*<\/[^>]+>(.*?)Locations with/s);
  const locationsMatch = section.match(/Locations with [^<]*<\/[^>]+>(.*?)(?:<h3|<div class="col-)/s);
  const quests = questsMatch ? stripHtml(questsMatch[1]) : "";
  const monsters = monstersMatch ? stripHtml(monstersMatch[1]) : "";
  const locations = locationsMatch ? stripHtml(locationsMatch[1]) : "";
  const parts = [];
  if (quests && !/^N\/A$/i.test(quests)) parts.push(quests);
  if (monsters && !/^N\/A$/i.test(monsters)) parts.push(`Dropped by: ${monsters}`);
  if (locations && !/^N\/A$/i.test(locations)) parts.push(locations);
  return parts.length ? parts.join(" ") : null;
}
const html = fs.readFileSync("C:/Users/MP/AppData/Local/Temp/anomaly_jewel.html", "utf8");
console.log(parseObtainInfo(html, "Anomaly Jewel"));
