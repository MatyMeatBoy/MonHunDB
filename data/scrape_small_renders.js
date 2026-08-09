// Downloads official renders for the 34 small monsters from the English
// Monster Hunter Fandom wiki (same pattern as data/scrape_renders.js), saves
// them to data/images/<slug>.png (detail page) + data/images/icons/<slug>.png
// (selector/search icon), and writes the `image` field into
// data/small_monsters.json.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;
const IMG_DIR = path.join(DATA_DIR, "images");
const ICON_DIR = path.join(IMG_DIR, "icons");
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
if (!fs.existsSync(ICON_DIR)) fs.mkdirSync(ICON_DIR, { recursive: true });

function curl(url, binary = false) {
  const args = ["-sL", "-A", UA, url];
  const out = execFileSync("curl", args, { maxBuffer: 1024 * 1024 * 50 });
  return binary ? out : out.toString("utf8");
}
function fileSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const smalls = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "small_monsters.json"), "utf8"));

(async () => {
  const results = [];
  for (let i = 0; i < smalls.length; i++) {
    const m = smalls[i];
    const slug = fileSlug(m.name);
    const dest = path.join(IMG_DIR, `${slug}.png`);
    if (fs.existsSync(dest)) { console.log(`[${i + 1}/${smalls.length}] SKIP ${m.name}`); continue; }
    try {
      const url = `https://monsterhunter.fandom.com/wiki/${m.name.replace(/ /g, "_")}`;
      const html = curl(url);
      if (html.includes("<title>404") || html.length < 500) { results.push({ name: m.name, ok: false, reason: "fetch-failed" }); console.log(`[${i + 1}/${smalls.length}] MISS ${m.name}`); continue; }
      const infoboxIdx = html.indexOf("portable-infobox");
      if (infoboxIdx === -1) { results.push({ name: m.name, ok: false, reason: "no-infobox" }); console.log(`[${i + 1}/${smalls.length}] MISS ${m.name} (no infobox)`); continue; }
      const after = html.slice(infoboxIdx, infoboxIdx + 4000);
      const m2 = after.match(/<a href="(https:\/\/static\.wikia\.nocookie\.net\/monsterhunter\/images\/[^"]+\/revision\/latest[^"]*)"/);
      if (!m2) { results.push({ name: m.name, ok: false, reason: "no-image" }); console.log(`[${i + 1}/${smalls.length}] MISS ${m.name} (no img)`); continue; }
      const imgUrl = m2[1];
      const buf = curl(imgUrl, true);
      fs.writeFileSync(dest, buf);
      fs.writeFileSync(path.join(ICON_DIR, `${slug}.png`), buf);
      m.image = `data/images/${slug}.png`;
      results.push({ name: m.name, ok: true, file: m.image, bytes: buf.length });
      console.log(`[${i + 1}/${smalls.length}] OK ${m.name} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      results.push({ name: m.name, ok: false, reason: String(e) });
      console.log(`[${i + 1}/${smalls.length}] ERROR ${m.name}: ${e}`);
    }
    await sleep(300);
  }
  fs.writeFileSync(path.join(DATA_DIR, "small_monsters.json"), JSON.stringify(smalls, null, 1));
  const misses = results.filter(r => !r.ok);
  console.log(`\nDone. ${smalls.length - misses.length}/${smalls.length} have renders. Misses: ${misses.map(r => r.name).join(", ") || "none"}`);
})();
