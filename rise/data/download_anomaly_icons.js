const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;
const OUT_DIR = path.join(DATA_DIR, "images", "materials");

function slugify(name) {
  // same convention as fix_material_icon_collisions.js: preserve trailing "+"
  const plus = name.endsWith("+");
  const base = name.replace(/\+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return plus ? `${base}-plus` : base;
}

async function main() {
  const entries = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "_anomaly_new_icons.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "material_icon_manifest.json"), "utf8"));

  let downloaded = 0, skipped = 0;
  for (const [name, src] of entries) {
    if (manifest[name]) { skipped++; continue; } // already has an icon (ex. "Afflicted Dire Scale" from earlier test run)
    const filename = `${slugify(name)}.png`;
    const outPath = path.join(OUT_DIR, filename);
    try {
      const res = await fetch(src, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      manifest[name] = `data/images/materials/${filename}`;
      downloaded++;
      console.log(`OK ${name} -> ${filename}`);
    } catch (e) {
      console.log(`FAIL ${name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  fs.writeFileSync(path.join(DATA_DIR, "material_icon_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Downloaded ${downloaded}, skipped ${skipped} (already had an icon).`);
}

main();
