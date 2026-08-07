// Fixes a real bug: slugify() stripped "+" entirely, so e.g. "Aknosom Scale"
// and "Aknosom Scale+" both slugified to "aknosom-scale" and fought over the
// same downloaded file — the manifest ended up mapping both names to
// whichever one was written last. This re-downloads every affected pair
// (113 collision groups / ~226 items) with a filename that preserves the
// "+" distinction, then rebuilds just those manifest entries.
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;
const OUT_DIR = path.join(DATA_DIR, "images", "materials");

// same as before, but a trailing "+" becomes "-plus" instead of vanishing
function slugify(name) {
  const hasPlus = /\+\s*$/.test(name.trim());
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return hasPlus ? `${base}-plus` : base;
}
function oldSlugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const raw = new Map(JSON.parse(fs.readFileSync(path.join(DATA_DIR, "material_icons_raw.json"), "utf8")));
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "material_icon_manifest.json"), "utf8"));

  const bySlug = new Map();
  for (const name of raw.keys()) {
    const s = oldSlugify(name);
    if (!bySlug.has(s)) bySlug.set(s, []);
    bySlug.get(s).push(name);
  }
  const affected = [...bySlug.values()].filter(names => names.length > 1).flat();
  console.log(`Re-downloading ${affected.length} affected items...`);

  let i = 0;
  for (const name of affected) {
    i++;
    const src = raw.get(name);
    const filename = `${slugify(name)}.png`;
    const outPath = path.join(OUT_DIR, filename);
    try {
      const res = await fetch(src, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      manifest[name] = `data/images/materials/${filename}`;
      if (i % 25 === 0 || i === affected.length) console.log(`  ${i}/${affected.length}`);
    } catch (e) {
      console.log(`  FAIL ${name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 70));
  }

  fs.writeFileSync(path.join(DATA_DIR, "material_icon_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("Done.");
}

main();
