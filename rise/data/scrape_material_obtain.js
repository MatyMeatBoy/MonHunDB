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
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'")
    // the wiki's own template leaves literal placeholder tokens on some
    // pages when a field is unset (ex. "__monster__", "??") -- strip those
    // rather than showing them to the user
    .replace(/__\w+__/g, " ").replace(/\?\?/g, " ")
    .replace(/\s+/g, " ").trim();
}
// long extractions are a sign the column grabbed an unrelated block (some
// pages nest an extra weapon-crafting-tree table before the real content) --
// cap length so contamination doesn't dominate the shown text
function capLen(s, max = 160) {
  return s.length > max ? s.slice(0, max).replace(/\s\S*$/, "") + "…" : s;
}

// each of the 3 sub-sections ("Quests & Rewards for X", "Monsters that drop
// X", "Locations with X") sometimes uses <p> for its content, sometimes
// <ul>, sometimes both -- so counting/grabbing <ul> tags globally misaligns
// as soon as one section skips the list (ex. Boggi Shard's "Quests" section
// is <p>-only). Slicing by the 3 fixed <div class="col-sm-4"> boundaries
// instead is robust regardless of what's inside each one.
function extractCol(html, start, end) {
  const chunk = html.slice(start, end);
  const hIdx = chunk.indexOf("</h3>");
  const body = hIdx === -1 ? chunk : chunk.slice(hIdx + 5);
  return stripHtml(body);
}
function parseObtainInfo(html, name) {
  const marker = `How to get ${name}`;
  const idx = html.indexOf(marker);
  if (idx === -1) return null;
  const rowIdx = html.indexOf(`<div class="row">`, idx);
  if (rowIdx === -1) return null;
  const col1 = html.indexOf(`<div class="col-sm-4">`, rowIdx);
  const col2 = html.indexOf(`<div class="col-sm-4">`, col1 + 1);
  const col3 = html.indexOf(`<div class="col-sm-4">`, col2 + 1);
  if (col1 === -1 || col2 === -1 || col3 === -1) return null;
  let rowEnd = html.indexOf(`<h3 class="bonfire"`, col3);
  if (rowEnd === -1) rowEnd = col3 + 2000;

  const quests = capLen(extractCol(html, col1, col2));
  const monsters = capLen(extractCol(html, col2, col3));
  const locations = capLen(extractCol(html, col3, rowEnd));

  const isEmpty = (s) => !s || /^(N\/A|None)$/i.test(s);
  const parts = [];
  if (!isEmpty(quests)) parts.push(quests);
  if (!isEmpty(monsters)) parts.push(`Dropped by: ${monsters}`);
  if (!isEmpty(locations)) parts.push(locations);

  return parts.length ? parts.join(" | ") : null;
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
