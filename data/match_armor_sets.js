// Matches Fextralife's 87 armor sets (name + full-body image) to the real
// Kiranico armor pieces already in data/armor_pieces.json, since Fextralife
// doesn't list individual piece names on the set-index page. Kiranico names
// pieces as "{Monster} {SlotWord}[ RankToken]" (ex. "Rathalos Helm X"), while
// Fextralife names sets as "{Monster}[ RankToken] Set" or "{Monster} Set
// RankToken" or "{Monster} - RankToken" -- rank token position varies, so it
// gets extracted and searched for independently rather than assumed fixed.
// Usage: node data/match_armor_sets.js
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;

const armor = JSON.parse(fs.readFileSync(path.join(ROOT, "armor_pieces.json"), "utf8"));
const html = fs.readFileSync("C:/Users/MP/AppData/Local/Temp/fextra_armorsets.html", "utf8");

const re = /<h4><a class="wiki_link wiki_tooltip" title="[^"]*" href="(\/[^"]+)"><img src="(\/file\/[^"]+)"[^>]*>(?:<br>)?(?:<img[^>]*>)?([^<]+)<\/a><\/h4>/g;
const rawSets = [...html.matchAll(re)].map(m => ({ href: m[1], image: "https://monsterhunterrise.wiki.fextralife.com" + m[2], fextraName: m[3].trim() }));

function parseSetName(fextraName) {
  let name = fextraName.replace(/\s*Set\s*/g, " ").replace(/\s+/g, " ").trim();
  // dash-suffix rank token, ex. "Crimson Valstrax - Eclipse" -> core "Crimson Valstrax", rank "Eclipse"
  const dashM = name.match(/^(.*?)\s+-\s+(\w+)$/);
  if (dashM) return { core: dashM[1].trim(), rank: dashM[2].trim(), rankStyle: "dash" };
  // trailing single-token rank (X/S), ex. "Rathalos X" -> core "Rathalos", rank "X"
  const words = name.split(" ");
  const last = words[words.length - 1];
  if (/^(X|S)$/.test(last) && words.length > 1) {
    return { core: words.slice(0, -1).join(" "), rank: last, rankStyle: "suffix" };
  }
  return { core: name, rank: null, rankStyle: "none" };
}

function findPieces(core, rank, rankStyle) {
  const parts = ["head", "chest", "arms", "waist", "legs"];
  const byPart = {};
  for (const piece of armor) {
    // some sets concatenate monster+slot with no space (ex. "Hawkhat"), most use a space
    const withSpace = piece.name.startsWith(core + " ");
    const noSpace = piece.name.startsWith(core) && piece.name.length > core.length && piece.name[core.length] !== " ";
    if (!withSpace && !noSpace) continue;
    let matches;
    if (rankStyle === "none") {
      matches = !/ (X|S)$/.test(piece.name) && !/ - \w+$/.test(piece.name);
    } else if (rankStyle === "suffix") {
      matches = piece.name.endsWith(" " + rank);
    } else {
      matches = piece.name.endsWith(" - " + rank);
    }
    if (matches && piece.part && !byPart[piece.part]) byPart[piece.part] = piece;
  }
  const found = parts.map(p => byPart[p]).filter(Boolean);
  return found.length === 5 ? parts.map(p => byPart[p]) : null;
}

const sets = [];
const unmatched = [];
for (const raw of rawSets) {
  const { core, rank, rankStyle } = parseSetName(raw.fextraName);
  const pieces = findPieces(core, rank, rankStyle);
  if (pieces) {
    sets.push({
      name: raw.fextraName,
      image: raw.image,
      fextraHref: "https://monsterhunterrise.wiki.fextralife.com" + raw.href,
      pieces: pieces.map(p => ({ part: p.part, id: p.id, name: p.name })),
    });
  } else {
    unmatched.push(raw.fextraName + `  (core="${core}" rank=${rank})`);
  }
}

console.log(`matched ${sets.length}/${rawSets.length} sets`);
console.log("unmatched:\n" + unmatched.join("\n"));
fs.writeFileSync(path.join(ROOT, "armor_sets.json"), JSON.stringify(sets, null, 2));
fs.writeFileSync(path.join(ROOT, "_armor_sets_unmatched.json"), JSON.stringify(unmatched, null, 2));
