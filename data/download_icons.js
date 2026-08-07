const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const SCRATCH = "C:/Users/MP/AppData/Local/Temp/claude/C--Users-MP-Documents-00-Claude/2f7a79bb-0efa-4fdf-86fb-6aac472b0545/scratchpad/mhdata";
const OUT_DIR = path.join(__dirname, "images", "icons");

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const matched = JSON.parse(fs.readFileSync(path.join(SCRATCH, "icons_matched.json"), "utf8"));
  const manifest = {};
  let i = 0;
  for (const { name, src } of matched) {
    i++;
    const ext = src.includes(".webp") ? "webp" : (path.extname(src.split("?")[0]) || ".png");
    const filename = `${slugify(name)}.${ext.replace(".", "")}`;
    const outPath = path.join(OUT_DIR, filename);
    try {
      const res = await fetch(src, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      manifest[name] = `data/images/icons/${filename}`;
      console.log(`[${i}/${matched.length}] OK ${name} (${buf.length}b)`);
    } catch (e) {
      console.log(`[${i}/${matched.length}] FAIL ${name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 120));
  }
  fs.writeFileSync(path.join(__dirname, "icon_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${Object.keys(manifest).length}/${matched.length} downloaded.`);
}

main();
