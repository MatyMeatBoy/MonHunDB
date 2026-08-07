// Scrapes "How to get <item>" info from the MH Rise Fextralife wiki for
// materials that don't drop from any of our 78 large monsters (decoration
// crafting materials like base jewels, endemic life, bone-pile items, quest
// rewards). Used to show a short "how do I get this" note in the decoration
// detail page instead of a dead-end "not a monster drop" message.
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;

function wikiUrlFor(name) {
  return `https://monsterhunterrise.wiki.fextralife.com/${encodeURIComponent(name.replace(/ /g, "+"))}`;
}

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

async function main() {
  const names = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "_no_monster_materials.json"), "utf8"));
  const out = {};
  let i = 0;
  for (const name of names) {
    i++;
    try {
      const res = await fetch(wikiUrlFor(name), { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const info = parseObtainInfo(html, name);
      if (info) {
        out[name] = info;
        console.log(`[${i}/${names.length}] OK ${name}: ${info.slice(0, 80)}`);
      } else {
        console.log(`[${i}/${names.length}] NO MATCH ${name}`);
      }
    } catch (e) {
      console.log(`[${i}/${names.length}] FAIL ${name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  fs.writeFileSync(path.join(DATA_DIR, "material_obtain_notes.json"), JSON.stringify(out, null, 2));
  console.log(`\nDone. ${Object.keys(out).length}/${names.length} resolved.`);
}

main();
