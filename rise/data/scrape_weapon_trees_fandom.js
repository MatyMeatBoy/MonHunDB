// Scrapes the clean MH Rise weapon trees from Fandom (one page per weapon type).
// Each weapon is a table row; the number of "Indent" spacer images in its cell
// is its depth in the tree, and rows are in DFS order -- so parent-child can be
// reconstructed exactly (parent = nearest previous row with depth-1).
//
// Fandom serves a Cloudflare JS challenge to plain curl intermittently, so this
// downloads each page with a real (headless) browser via Playwright, which
// passes the challenge. Resumable via data/weapon_tree_raw_fandom/<slug>.html.
//
// Fandom's per-type pages only cover the base game (Rise), NOT Master Rank.
// Master Rank weapons/finals are completed from Fextralife in a later merge.
// This script outputs the BASE tree only.
//
// Output: data/weapon_tree_base.json
//   { "types": { "<Type>": [ { "name": "Kamura Sword II", "depth": 1 }, ... ] } }
//
// Usage:
//   node data/scrape_weapon_trees_fandom.js
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE = "https://monsterhunter.fandom.com/wiki/MHRise:_";
const CACHE = path.join(__dirname, "weapon_tree_raw_fandom");

const TYPES = [
  "Great_Sword", "Sword_and_Shield", "Dual_Blades", "Long_Sword", "Hammer",
  "Hunting_Horn", "Lance", "Gunlance", "Switch_Axe", "Charge_Blade",
  "Insect_Glaive", "Bow", "Heavy_Bowgun", "Light_Bowgun",
];

function isChallenge(html) {
  return /Just a moment|Verify you are human|cf-challenge|challenge-platform/i.test(html.slice(0, 20000));
}

(async () => {
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" });
  const page = await ctx.newPage();
  const out = { types: {} };
  for (const slug of TYPES) {
    const cachePath = path.join(CACHE, slug + ".html");
    if (!fs.existsSync(cachePath) || isChallenge(fs.readFileSync(cachePath, "utf8"))) {
      const url = BASE + slug + "_Weapon_Tree";
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(4000);
        await page.waitForSelector('img[alt^="Indent"], .mw-parser-output', { timeout: 30000 }).catch(() => {});
        fs.writeFileSync(cachePath, await page.content());
      } catch (e) {
        console.log("FETCH FAILED " + slug + ": " + e.message.slice(0, 120));
        continue;
      }
    }
    const html = fs.readFileSync(cachePath, "utf8");
    if (isChallenge(html)) { console.log("CHALLENGE " + slug); continue; }
    await page.setContent(html);
    const rows = await page.evaluate(() => {
      const res = [];
      const tds = document.querySelectorAll("td");
      for (const td of tds) {
        const img = td.querySelector('img[alt^="Indent"]');
        if (!img) continue;
        const a = td.querySelector("a[title]");
        if (!a) continue;
        const name = (a.getAttribute("title") || "").replace(/^MHRise:\s*/, "").replace(/\s*\(MHRise\)$/, "").trim();
        if (!name) continue;
        res.push({ name, depth: td.querySelectorAll('img[alt^="Indent"]').length });
      }
      return res;
    });
    out.types[slug.replace(/_/g, " ")] = rows;
    console.log(slug.padEnd(18) + " rows=" + rows.length);
    await page.waitForTimeout(1500);
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, "weapon_tree_base.json"), JSON.stringify(out));
  console.log("Wrote data/weapon_tree_base.json");
})();

