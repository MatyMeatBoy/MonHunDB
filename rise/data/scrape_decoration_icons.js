// Decorations aren't listed on MHRice's item.html (no "decoration" filter
// tab there), but every decoration's icon+color IS shown inline on the
// skill page it grants (the "Decoration" table section) -- so this
// re-visits all 147 skill pages already scraped by scrape_skills.js and
// pulls the icon references out of that section instead.
// Usage: node data/scrape_decoration_icons.js
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BASE = "https://mhrise.mhrice.info/";
const CONCURRENCY = 6;

function unescapeHtml(str) {
  if (!str) return str;
  return str.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

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

function parseDecorationIcons(html) {
  const secIdx = html.indexOf('id="s-decoration"');
  if (secIdx < 0) return [];
  const nextSecIdx = html.indexOf('id="s-qurious"', secIdx);
  const block = html.slice(secIdx, nextSecIdx > 0 ? nextSecIdx : secIdx + 20000);
  const re = /mh-item-color-(\d+)" style="mask-image: url\(&#39;resources\/item\/(\d+)\.r\.png[^]*?<span class="lang-default mh-lang" lang="en"><span>([^<]*)<\/span>/g;
  const out = [];
  for (const m of block.matchAll(re)) {
    out.push({ color: parseInt(m[1], 10), iconId: m[2], name: unescapeHtml(m[3]) });
  }
  return out;
}

async function mapLimit(items, limit, fn) {
  let i = 0;
  async function worker() { while (i < items.length) { const idx = i++; await fn(items[idx]); } }
  await Promise.all(new Array(limit).fill(0).map(worker));
}

async function main() {
  const listHtml = await fetchText(BASE + "skill.html");
  const ids = [...new Set([...listHtml.matchAll(/href="skill\/(PlayerSkill_\d+)\.html"/g)].map(m => m[1]))];
  console.log(`scanning ${ids.length} skill pages for decoration icons...`);

  const byName = new Map();
  let done = 0;
  await mapLimit(ids, CONCURRENCY, async (id) => {
    const html = await fetchText(`${BASE}skill/${id}.html`);
    if (html) {
      for (const d of parseDecorationIcons(html)) byName.set(d.name, d);
    }
    done++;
    if (done % 20 === 0) console.log(`progress: ${done}/${ids.length}`);
  });

  const result = [...byName.values()];
  fs.writeFileSync(path.join(__dirname, "_mhrice_decoration_icons.json"), JSON.stringify(result));
  console.log("DONE", result.length, "unique decoration icons found");
}

main().catch(e => { console.error(e); process.exit(1); });
