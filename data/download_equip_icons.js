// Downloads weapon/armor icon images referenced in weapons.json /
// armor_pieces.json to data/images/{weapons,armor}/, resumable (skips files
// that already exist on disk). Usage: node data/download_equip_icons.js
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const CONCURRENCY = 8;
const ROOT = __dirname;

async function download(url, destPath) {
  if (fs.existsSync(destPath)) return true;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    return true;
  } catch (e) {
    return false;
  }
}

async function mapLimit(items, limit, fn) {
  let i = 0, ok = 0, fail = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      const r = await fn(items[idx]);
      if (r) ok++; else fail++;
      if ((ok + fail) % 200 === 0) console.log(`  ${ok + fail}/${items.length} (ok=${ok} fail=${fail})`);
    }
  }
  await Promise.all(new Array(limit).fill(0).map(worker));
  return { ok, fail };
}

async function main() {
  const weapons = JSON.parse(fs.readFileSync(path.join(ROOT, "weapons.json"), "utf8"));
  const armor = JSON.parse(fs.readFileSync(path.join(ROOT, "armor_pieces.json"), "utf8"));

  console.log("downloading weapon icons...");
  const wJobs = weapons.filter(w => w.icon).map(w => ({ url: w.icon.replace(/^http:/, "https:"), dest: path.join(ROOT, "images", "weapons", `${w.id}.webp`) }));
  const wRes = await mapLimit(wJobs, CONCURRENCY, (j) => download(j.url, j.dest));
  console.log("weapons done:", wRes);

  console.log("downloading armor icons (M+F)...");
  const aJobs = [];
  for (const a of armor) {
    if (a.iconM) aJobs.push({ url: a.iconM.replace(/^http:/, "https:"), dest: path.join(ROOT, "images", "armor", `${a.id}_m.webp`) });
    if (a.iconF) aJobs.push({ url: a.iconF.replace(/^http:/, "https:"), dest: path.join(ROOT, "images", "armor", `${a.id}_f.webp`) });
  }
  const aRes = await mapLimit(aJobs, CONCURRENCY, (j) => download(j.url, j.dest));
  console.log("armor done:", aRes);

  console.log("downloading deco slot level icons...");
  for (let lvl = 1; lvl <= 4; lvl++) {
    await download(`https://cdn.kiranico.net/file/kiranico/mhrise-web/images/ui/deco${lvl}.png`, path.join(ROOT, "images", "icons", `deco${lvl}.png`));
  }
  console.log("ALL DONE");
}

main().catch(e => { console.error(e); process.exit(1); });
