// Downloads each monster's official render (infobox image) from the English
// Monster Hunter Fandom wiki, saved locally so the app never hotlinks images.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DATA_DIR = __dirname;

// Fandom's CDN 403s Node's built-in fetch() (likely TLS/JA3 fingerprinting),
// but plain curl works fine — shell out instead.
function curlText(url) {
  return execFileSync("curl", ["-sL", "-A", UA, url], { maxBuffer: 1024 * 1024 * 50 }).toString("utf8");
}
function curlBinary(url) {
  return execFileSync("curl", ["-sL", "-A", UA, url], { maxBuffer: 1024 * 1024 * 50 });
}
const IMG_DIR = path.join(DATA_DIR, "images");
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

const monsterList = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "monster_list.json"), "utf8"));

function slugify(name) {
  return name.replace(/ /g, "_");
}

function fileSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function fetchPage(name) {
  const url = `https://monsterhunter.fandom.com/wiki/${slugify(name)}`;
  const html = curlText(url);
  if (html.includes("<title>404") || html.length < 500) return { ok: false, status: "fetch-failed", url };

  // The infobox wraps its thumbnail in an <a href="...full-res-url"> —
  // grab that directly instead of reconstructing from the scaled <img src>,
  // and anchor the search to the infobox so we don't pick up the wiki
  // theme's background CSS image (same CDN URL shape, appears earlier).
  const infoboxIdx = html.indexOf("portable-infobox");
  if (infoboxIdx === -1) return { ok: false, status: "no-infobox", url };
  const after = html.slice(infoboxIdx, infoboxIdx + 4000);
  const m = after.match(/<a href="(https:\/\/static\.wikia\.nocookie\.net\/monsterhunter\/images\/[^"]+\/revision\/latest[^"]*)"/);
  if (!m) return { ok: false, status: "no-image-found", url };
  return { ok: true, imageUrl: m[1], url };
}

async function downloadImage(url, destPath) {
  const buf = curlBinary(url);
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  const results = [];
  let i = 0;
  for (const m of monsterList) {
    i++;
    const slug = fileSlug(m.name);
    const dest = path.join(IMG_DIR, `${slug}.png`);
    try {
      const page = await fetchPage(m.name);
      if (!page.ok) {
        results.push({ name: m.name, ok: false, reason: page.status, pageUrl: page.url });
        console.log(`[${i}/${monsterList.length}] MISS ${m.name} (${page.status})`);
      } else {
        const bytes = await downloadImage(page.imageUrl, dest);
        results.push({ name: m.name, ok: true, file: `data/images/${slug}.png`, sourceUrl: page.imageUrl, bytes });
        console.log(`[${i}/${monsterList.length}] OK ${m.name} (${(bytes / 1024).toFixed(0)} KB)`);
      }
    } catch (e) {
      results.push({ name: m.name, ok: false, reason: String(e) });
      console.log(`[${i}/${monsterList.length}] ERROR ${m.name}: ${e}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  fs.writeFileSync(path.join(DATA_DIR, "renders_manifest.json"), JSON.stringify(results, null, 2));
  const misses = results.filter(r => !r.ok);
  console.log(`\nDone. ${results.length - misses.length}/${results.length} downloaded. ${misses.length} misses.`);
  if (misses.length) console.log(misses.map(m => m.name).join(", "));
}

main();
