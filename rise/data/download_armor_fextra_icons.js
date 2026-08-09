// Fallback icon source for armor pieces whose Kiranico icon URL 404s (see
// download_equip_icons.js for the primary/Kiranico download). Downloads
// Fextralife thumbnail images for the pieces listed in
// armor_fextra_icons.json to data/images/armor_fextra/{id}.png, resumable
// (skips files that already exist on disk). Usage:
//   node data/download_armor_fextra_icons.js
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const CONCURRENCY = 6;
const ROOT = __dirname;
const FEXTRA_BASE = "https://monsterhunterrise.wiki.fextralife.com";

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
    }
  }
  await Promise.all(new Array(limit).fill(0).map(worker));
  return { ok, fail };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "armor_fextra_icons.json"), "utf8"));
  const outDir = path.join(ROOT, "images", "armor_fextra");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const jobs = Object.entries(manifest).map(([id, imagePath]) => ({
    url: FEXTRA_BASE + imagePath,
    dest: path.join(outDir, `${id}.png`),
  }));

  console.log(`downloading ${jobs.length} fextralife fallback armor icons...`);
  const res = await mapLimit(jobs, CONCURRENCY, (j) => download(j.url, j.dest));
  console.log("done:", res);
}

main().catch(e => { console.error(e); process.exit(1); });
