// Scrapes all Monster Hunter Rise: Sunbreak decorations (armor accessories
// that grant a skill when slotted): EN+ES names/skill from Kiranico's
// decorations list (one fetch each, fully SSR'd, no pagination), then the
// required crafting materials from each decoration's own Kiranico detail
// page (not present in the list view). Icons come from grindosaur.com's
// decorations list, which reuses a small set of generic color/slot-level gem
// images rather than one icon per decoration.
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;
const OUT_DIR = path.join(DATA_DIR, "images", "decorations");

function slugify(name) {
  const plus = name.endsWith("+") ? "-plus" : "";
  const base = name.replace(/\+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}${plus}`;
}

function parseListing(html, langPrefix) {
  const re = new RegExp(
    `href="https://mhrise\\.kiranico\\.com${langPrefix}/data/decorations/(\\d+)">([^<]+)</a></td>\\s*<td[^>]*><div>\\s*<a[^>]*href="https://mhrise\\.kiranico\\.com${langPrefix}/data/skills/\\d+">([^<]+)</a>\\s*(Lv|Nv) (\\d+)\\s*</div></td>\\s*<td[^>]*>([^<]*)</td>`,
    "g"
  );
  let m;
  const out = new Map();
  while ((m = re.exec(html))) {
    out.set(m[1], { name: m[2].trim(), skillName: m[3].trim(), skillLevel: Number(m[5]), skillDesc: m[6].trim() });
  }
  return out;
}

function parseDetailMaterials(html) {
  const idx = html.indexOf("Required Materials");
  if (idx === -1) return { materials: [], description: "" };
  const section = html.slice(idx, idx + 6000);
  const rowRe = /<img[^>]*src="([^"]+)">\s*<a[^>]*href="https:\/\/mhrise\.kiranico\.com\/data\/items\/\d+">([^<]+)<\/a>\s*x(\d+)<\/td>/g;
  let m;
  const materials = [];
  while ((m = rowRe.exec(section))) {
    materials.push({ material: m[2].trim(), qty: Number(m[3]) });
  }
  const h1Idx = html.indexOf("<h1");
  let description = "";
  if (h1Idx !== -1) {
    const pMatch = html.slice(h1Idx, h1Idx + 600).match(/<p>([^<]*)<\/p>/);
    if (pMatch) description = pMatch[1].trim();
  }
  return { materials, description };
}

function parseGrindosaurIcons(html) {
  const re = /<img alt="[^"]*"[^>]*src="([^"]+)"[^>]*title="([^"]+)"[^>]*><\/td><td[^>]*><a[^>]*>([^<]+)<\/a><\/td>/g;
  let m;
  const byName = new Map();
  while ((m = re.exec(html))) {
    byName.set(m[3].trim(), m[1]);
  }
  return byName;
}

async function main() {
  console.log("Fetching EN listing...");
  const enListHtml = await (await fetch("https://mhrise.kiranico.com/data/decorations", { headers: { "User-Agent": UA } })).text();
  const enList = parseListing(enListHtml, "");
  console.log(`  ${enList.size} decorations (EN)`);

  console.log("Fetching ES listing...");
  const esListHtml = await (await fetch("https://mhrise.kiranico.com/es/data/decorations", { headers: { "User-Agent": UA } })).text();
  const esList = parseListing(esListHtml, "/es");
  console.log(`  ${esList.size} decorations (ES)`);

  console.log("Fetching grindosaur icon list...");
  const grindoHtml = await (await fetch("https://www.grindosaur.com/en/games/monster-hunter-rise/decorations", { headers: { "User-Agent": UA } })).text();
  const iconByName = parseGrindosaurIcons(grindoHtml);
  console.log(`  ${iconByName.size} icon entries`);

  const decorations = [];
  let i = 0;
  for (const [id, en] of enList) {
    i++;
    const es = esList.get(id);
    try {
      const res = await fetch(`https://mhrise.kiranico.com/data/decorations/${id}`, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const { materials, description } = parseDetailMaterials(html);
      const slotMatch = en.name.match(/(\d)$/);
      decorations.push({
        id,
        name: en.name,
        nameEs: es ? es.name : null,
        slotLevel: slotMatch ? Number(slotMatch[1]) : null,
        description,
        skills: [{ name: en.skillName, nameEs: es ? es.skillName : null, level: en.skillLevel, effect: en.skillDesc, effectEs: es ? es.skillDesc : null }],
        materials,
        iconSrc: iconByName.get(en.name) || null,
      });
      console.log(`[${i}/${enList.size}] OK ${en.name} (${materials.length} materials)`);
    } catch (e) {
      console.log(`[${i}/${enList.size}] FAIL ${en.name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }

  // download the distinct icon files
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const iconManifest = {};
  const uniqueIconSrcs = new Set(decorations.map(d => d.iconSrc).filter(Boolean));
  console.log(`\nDownloading ${uniqueIconSrcs.size} distinct decoration icons...`);
  for (const src of uniqueIconSrcs) {
    const filename = path.basename(new URL(src).pathname);
    const outPath = path.join(OUT_DIR, filename);
    try {
      const res = await fetch(src, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      iconManifest[src] = `data/images/decorations/${filename}`;
    } catch (e) {
      console.log(`  FAIL icon ${src}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 80));
  }
  for (const d of decorations) {
    d.icon = d.iconSrc && iconManifest[d.iconSrc] ? iconManifest[d.iconSrc] : null;
    delete d.iconSrc;
  }

  fs.writeFileSync(path.join(DATA_DIR, "decorations.json"), JSON.stringify(decorations, null, 2));
  console.log(`\nDone. ${decorations.length} decorations saved to decorations.json.`);
}

main();
