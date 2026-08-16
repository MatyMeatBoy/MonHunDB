/* Fill materials for existing Wilds charms from their Fextralife detail pages. */
const fs = require("fs");
const https = require("https");
const path = require("path");
const dir = __dirname;
const charmsPath = path.join(dir, "charms.json");
const charms = JSON.parse(fs.readFileSync(charmsPath, "utf8"));
const items = JSON.parse(fs.readFileSync(path.join(dir, "items_wilds.json"), "utf8"));
const decode = value => String(value || "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const get = url => new Promise((resolve, reject) => https.get(url, { headers: { "user-agent": "MonHunDB-Scraperino/1.0" } }, response => {
  let body = ""; response.on("data", chunk => body += chunk);
  response.on("end", () => response.statusCode === 200 ? resolve(body) : resolve(""));
}).on("error", reject));
const norm = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const itemNames = [...new Set(items.map(item => item.name).filter(Boolean))].sort((a, b) => b.length - a.length);
const itemPattern = new RegExp(`(${itemNames.map(name => name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("|")})\\s+x(\\d+)`, "gi");
const slug = name => name.replace(/['’]/g, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
(async () => {
  let updated = 0;
  for (const charm of charms) {
    const urls = [`https://monsterhunterwilds.wiki.fextralife.com/${encodeURIComponent(slug(charm.name)).replace(/%5F/g, "_")}`, `https://monsterhunterwilds.wiki.fextralife.com/${encodeURIComponent(charm.name.replace(/\s+/g, "+"))}`];
    let html = "";
    for (const url of urls) { html = await get(url); if (html.includes("In order to craft")) break; }
    const text = decode(html);
    const section = text.match(/In order to craft[\s\S]*?(?:Notes|Talismans)/i)?.[0] || "";
    const materials = []; const seen = new Set();
    for (const match of section.matchAll(itemPattern)) {
      const material = itemNames.find(name => norm(name) === norm(match[1]));
      if (!material || seen.has(material)) continue;
      seen.add(material); materials.push({ material, qty: Number(match[2]) });
    }
    if (materials.length) { charm.materials = materials; updated++; }
  }
  fs.writeFileSync(charmsPath, JSON.stringify(charms, null, 2) + "\n");
  console.log(`Added materials to ${updated}/${charms.length} existing Wilds charms.`);
})();
