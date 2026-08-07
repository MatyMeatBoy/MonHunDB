// Scrapes material icon URLs from each monster's grindosaur.com "Materials"
// section (works across all its rank tabs), dedupes by material name, and
// downloads every unique icon locally.
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;
const OUT_DIR = path.join(DATA_DIR, "images", "materials");

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseMaterialIcons(html) {
  const idx = html.indexOf('id="materials"');
  if (idx === -1) return [];
  const sectionEnd = html.indexOf('id="wyvern-riding"', idx);
  const section = html.slice(idx, sectionEnd === -1 ? idx + 200000 : sectionEnd);

  const rows = [...section.matchAll(
    /<img alt="[^"]*" height="\d+" loading="lazy" src="([^"]+)" title="([^"]+)" width="\d+">/g
  )];
  const map = new Map();
  for (const r of rows) {
    const src = r[1];
    const name = r[2].replace(/&amp;/g, "&").trim();
    if (!map.has(name)) map.set(name, src);
  }
  return [...map.entries()].map(([name, src]) => ({ name, src }));
}

async function main() {
  const links = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "grindosaur_links_raw.json"), "utf8"));
  const globalMap = new Map();
  let i = 0;
  for (const { text: name, url } of links) {
    i++;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const mats = parseMaterialIcons(html);
      for (const m of mats) if (!globalMap.has(m.name)) globalMap.set(m.name, m.src);
      console.log(`[${i}/${links.length}] OK ${name} (+${mats.length} materials, total unique so far: ${globalMap.size})`);
    } catch (e) {
      console.log(`[${i}/${links.length}] FAIL ${name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(path.join(DATA_DIR, "material_icons_raw.json"), JSON.stringify([...globalMap.entries()], null, 2));
  console.log(`\nScraped ${globalMap.size} unique material icon URLs. Downloading...`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = {};
  let j = 0;
  const entries = [...globalMap.entries()];
  for (const [name, src] of entries) {
    j++;
    const filename = `${slugify(name)}.png`;
    const outPath = path.join(OUT_DIR, filename);
    try {
      const res = await fetch(src, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      manifest[name] = `data/images/materials/${filename}`;
      if (j % 50 === 0 || j === entries.length) console.log(`  downloaded ${j}/${entries.length}`);
    } catch (e) {
      console.log(`  FAIL download ${name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 80));
  }

  fs.writeFileSync(path.join(DATA_DIR, "material_icon_manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${Object.keys(manifest).length}/${entries.length} icons downloaded.`);
}

main();
