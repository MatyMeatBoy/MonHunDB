// Barrido UI con Playwright: recorre la app del mhrise-bestiario (servida localmente)
// en ES y EN, captura el texto visible de cada vista, y compara ambos idiomas línea a línea.
const fs = require("fs");
const path = require("path");
const http = require("http");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..", "..", "mhrise-bestiario");
const DATA = path.join(ROOT, "data");
const OUTBASE = path.join(__dirname, "..", "sweep_out", "ui");
const PORT = 4567;

fs.mkdirSync(path.join(OUTBASE, "es"), { recursive: true });
fs.mkdirSync(path.join(OUTBASE, "en"), { recursive: true });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p === "/") p = "/index.html";
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "Content-Type": mime[path.extname(fp)] || "application/octet-stream" });
    res.end(data);
  });
});

function load(f) {
  return JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
}

async function main() {
  await new Promise((r) => server.listen(PORT, r));

  const monsters = load("monsters.json");
  const small = load("small_monsters.json");
  const decorations = load("decorations.json");
  const weapons = load("weapons.json");
  const armorSets = load("armor_sets.json");
  const skills = load("skills.json");

  // URLs a barrer, con un "label" para el diff
  const pages = [];
  for (const m of monsters) pages.push({ label: `monster_${m.name}`, url: `/?m=${encodeURIComponent(m.name)}`, sel: "#detail" });
  for (const m of small) pages.push({ label: `monster_${m.name}`, url: `/?m=${encodeURIComponent(m.name)}`, sel: "#detail" });
  pages.push({ label: "home", url: "/", sel: "#home-view" });
  pages.push({ label: "view_decorations", url: "/?view=decorations", sel: "#decorations-view" });
  pages.push({ label: "view_weapons", url: "/?view=weapons", sel: "#weapons-view" });
  pages.push({ label: "view_armor", url: "/?view=armor", sel: "#armor-view" });
  pages.push({ label: "view_materials", url: "/?view=materials", sel: "#materials-view" });
  pages.push({ label: "view_skills", url: "/?view=skills", sel: "#skills-view" });

  // detalles representativos
  const deco = decorations[0]; // con nameEs completo
  const decoNoEs = decorations.find((d) => (d.skills || []).some((s) => !s.nameEs)) || deco;
  pages.push({ label: `deco_${decoNoEs.name}`, url: `/?view=decorations&d=${decoNoEs.id}`, sel: "#decoration-detail" });
  const w = weapons.find((x) => x) || weapons[0];
  pages.push({ label: `weapon_${w.name}`, url: `/?view=weapons&w=${encodeURIComponent(w.id)}`, sel: "#weapon-detail" });
  const set = armorSets[0];
  pages.push({ label: `armor_set_${set.name}`, url: `/?view=armor&set=${encodeURIComponent(set.name)}`, sel: "#armor-set-detail" });
  pages.push({ label: "material_Afflicted_Shell", url: `/?view=materials&mat=${encodeURIComponent("Afflicted Shell")}`, sel: "#material-detail" });
  pages.push({ label: `skill_${skills[0].name}`, url: `/?view=skills&skill=${encodeURIComponent(skills[0].id)}`, sel: "#skill-detail" });

  const browser = await chromium.launch();

  for (const lang of ["es", "en"]) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    await ctx.addInitScript((l) => localStorage.setItem("mh-lang", l), lang);
    const page = await ctx.newPage();

    for (const pg of pages) {
      await page.goto(`http://127.0.0.1:${PORT}${pg.url}`, { waitUntil: "networkidle" });
      try {
        await page.waitForSelector(pg.sel, { timeout: 8000 });
      } catch { /* si el selector no existe, seguir igual */ }
      await page.waitForTimeout(250);
      let txt = "";
      try { txt = await page.locator(pg.sel).innerText(); } catch { txt = ""; }
      const htmlLang = await page.evaluate(() => document.documentElement.lang);
      if (htmlLang !== lang) txt += `\n[LANG-MISMATCH htmlLang=${htmlLang}]`;
      fs.writeFileSync(path.join(OUTBASE, lang, `${slug(pg.label)}.txt`), txt);
    }

    // búsqueda global
    for (const q of ["rath", "soul"]) {
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
      await page.click("#global-search-toggle");
      await page.waitForSelector("#global-search-input:not([hidden])", { timeout: 5000 }).catch(() => {});
      await page.fill("#global-search-input", q);
      await page.waitForTimeout(400);
      const txt = await page.locator("#global-search-results").innerText().catch(() => "");
      fs.writeFileSync(path.join(OUTBASE, lang, `gs_${q}.txt`), txt);
      await page.close();
    }

    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log("barrido UI completo; textos en", OUTBASE);
}

function slug(s) {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 80);
}

main().catch((e) => { console.error(e); process.exit(1); });