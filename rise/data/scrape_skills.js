// Scrapes all Monster Hunter Rise: Sunbreak armor skills from MHRice
// (mhrise.mhrice.info), a data-mining project that extracts text directly
// from the game files (not a fan transcription) -- recommended by the user
// as a reliable source, same project behind the zone_charts reference the
// user found earlier (github.com/wwylele/mhrice).
// Usage: node data/scrape_skills.js
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BASE = "https://mhrise.mhrice.info/";
const OUT_PATH = path.join(__dirname, "skills.json");
const CONCURRENCY = 6;

async function fetchText(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return await res.text();
      if (res.status === 429 || res.status >= 500) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
      else return null;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

// the source HTML entity-encodes text (ex. "Master&#39;s Touch"), which
// broke exact-name matching against decorations.json/armor_pieces.json
// (those already have real apostrophes) -- decode before storing
function unescapeHtml(str) {
  if (!str) return str;
  return str
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function nameByLang(html, lang) {
  const re = new RegExp(`content="([^"]*)" itemprop="title-${lang}"`);
  const m = html.match(re);
  return m ? unescapeHtml(m[1]) : null;
}

function langTextFromBlock(block, lang) {
  const re = new RegExp(`lang="${lang}"><span>(.*?)</span></span>`, "s");
  const m = block.match(re);
  return m ? unescapeHtml(m[1].replace(/\s*\n\s*/g, " ").trim()) : null;
}

function parseSkillDetail(html, id) {
  const nameEn = nameByLang(html, "en");
  const nameEs = nameByLang(html, "es") || nameByLang(html, "es-419");
  // MHRice has no unique per-skill icon (all skills share the same
  // skill.r.png/skill.a.png mask pair) -- the only thing that varies is
  // this rarity-tier color class, matched against resources/item_color.css
  const colorM = html.match(/mh-item-color-(\d+)" style="mask-image: url\(&#39;resources\/skill\.r\.png/);
  const colorIndex = colorM ? parseInt(colorM[1], 10) : null;

  const ulIdx = html.indexOf("<ul><li><span>Level");
  const descBlock = ulIdx > 0 ? html.slice(Math.max(0, ulIdx - 2000), ulIdx) : "";
  const descEn = langTextFromBlock(descBlock, "en");
  const descEs = langTextFromBlock(descBlock, "es") || langTextFromBlock(descBlock, "es-419");

  const levels = [];
  for (const m of html.matchAll(/<li><span>Level (\d+): <\/span>([\s\S]*?)<\/li>/g)) {
    levels.push({
      level: parseInt(m[1], 10),
      effectEn: langTextFromBlock(m[2], "en"),
      effectEs: langTextFromBlock(m[2], "es") || langTextFromBlock(m[2], "es-419"),
    });
  }

  return { id, name: nameEn, nameEs, descEn, descEs, levels, colorIndex };
}

async function mapLimit(items, limit, fn) {
  let i = 0;
  async function worker() { while (i < items.length) { const idx = i++; await fn(items[idx]); } }
  await Promise.all(new Array(limit).fill(0).map(worker));
}

async function main() {
  const listHtml = await fetchText(BASE + "skill.html");
  if (!listHtml) throw new Error("could not fetch skill.html");
  const ids = [...new Set([...listHtml.matchAll(/href="skill\/(PlayerSkill_\d+)\.html"/g)].map(m => m[1]))];
  console.log(`found ${ids.length} skills`);

  const skills = [];
  let done = 0;
  await mapLimit(ids, CONCURRENCY, async (id) => {
    const html = await fetchText(`${BASE}skill/${id}.html`);
    if (html) skills.push(parseSkillDetail(html, id));
    done++;
    if (done % 20 === 0) console.log(`progress: ${done}/${ids.length}`);
  });

  skills.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  fs.writeFileSync(OUT_PATH, JSON.stringify(skills, null, 2));
  console.log("DONE", skills.length, "skills saved to", OUT_PATH);
  console.log("missing name:", skills.filter(s => !s.name).length, "missing levels:", skills.filter(s => !s.levels.length).length);
}

main().catch(e => { console.error(e); process.exit(1); });
