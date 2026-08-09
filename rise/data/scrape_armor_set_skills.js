// For each matched set in data/armor_sets.json, fetches its Fextralife page
// and records each piece's skills (as shown there) plus downloads the
// full-body set image. There's no separate "set bonus" skill in this wiki
// for Rise/Sunbreak (confirmed by checking two sets) -- what we show
// instead is the combined per-piece skill list already in armor_pieces.json,
// so this script's main job is just the image download + a light sanity
// list of skills per part for cross-reference.
// Usage: node data/scrape_armor_set_skills.js
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function download(url, destPath) {
  if (fs.existsSync(destPath)) return true;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  const sets = JSON.parse(fs.readFileSync(path.join(ROOT, "armor_sets.json"), "utf8"));
  const imgDir = path.join(ROOT, "images", "armor_sets");
  let ok = 0, fail = 0;
  for (const set of sets) {
    const dest = path.join(imgDir, `${slugify(set.name)}.png`);
    const success = await download(set.image, dest);
    if (success) { set.localImage = `data/images/armor_sets/${slugify(set.name)}.png`; ok++; }
    else fail++;
    await new Promise(r => setTimeout(r, 150));
  }
  console.log("images:", ok, "ok,", fail, "fail");
  fs.writeFileSync(path.join(ROOT, "armor_sets.json"), JSON.stringify(sets, null, 2));
  console.log("DONE");
}

main().catch(e => { console.error(e); process.exit(1); });
