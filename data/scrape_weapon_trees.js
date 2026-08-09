// Extracts the real MH Rise/Sunbreak FINAL weapons (leaves of each upgrade
// tree) from Fextralife's per-type "Weapon Tree" pages.
//
// Fextralife's HTML is malformed (missing </li>/</ul> in places), so a regex/
// stack parser mis-nests sibling trees. Chromium's HTML parser auto-corrects
// the structure reliably, so this script loads each cached raw page into a
// headless browser and reads the real tree from the DOM. A final weapon is a
// <li> that has no <li> descendant.
//
// Raw HTML is cached in data/weapon_tree_raw/ (resumable via curl). Output:
//   data/weapon_finals.json = [ "Fine Kamura Cleaver", ... ]  (true final names)
//
// Usage:
//   node data/scrape_weapon_trees.js      (needs Playwright + chromium installed)
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const BASE = "https://monsterhunterrise.wiki.fextralife.com";
const CACHE = path.join(__dirname, "weapon_tree_raw");

const TYPES = [
  "Great Sword", "Sword & Shield", "Dual Blades", "Long Sword", "Hammer",
  "Hunting Horn", "Lance", "Gunlance", "Switch Axe", "Charge Blade",
  "Insect Glaive", "Bow", "Heavy Bowgun", "Light Bowgun",
];

function urlSlug(type) {
  return type.replace(/ /g, "+") + "+Weapon+Tree";
}
function cacheFile(type) {
  return path.join(CACHE, urlSlug(type).replace(/\+/g, "_") + ".html");
}
function curl(url, dest) {
  if (fs.existsSync(dest)) return;
  const out = execFileSync("curl.exe", ["-s", "-A", UA, url], { maxBuffer: 64 * 1024 * 1024 });
  fs.writeFileSync(dest, out);
}

async function extractFinals(page, html) {
  await page.setContent(html);
  return page.evaluate(() => {
    const wells = document.querySelectorAll("div.tree.well");
    const leaves = [];
    for (const well of wells) {
      const lis = well.querySelectorAll("li");
      for (const li of lis) {
        const a = li.querySelector(":scope > a.wiki_link");
        if (!a) continue;
        const name = a.textContent.trim();
        if (!name) continue;
        if (!li.querySelector(":scope > ul li")) leaves.push(name);
      }
    }
    return leaves;
  });
}

(async () => {
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const allFinals = new Set();
  for (const type of TYPES) {
    curl(BASE + "/" + urlSlug(type), cacheFile(type));
    const html = fs.readFileSync(cacheFile(type), "utf8");
    let leaves;
    try {
      leaves = await extractFinals(page, html);
    } catch (e) {
      console.log("FAILED " + type + ": " + e.message.slice(0, 100));
      continue;
    }
    console.log(type.padEnd(16) + " finals=" + leaves.length);
    for (const n of leaves) allFinals.add(n);
  }
  await browser.close();
  const out = [...allFinals].sort();
  fs.writeFileSync(path.join(__dirname, "weapon_finals.json"), JSON.stringify(out));
  console.log("\nTOTAL finals:", out.length, "-> data/weapon_finals.json");
})();
