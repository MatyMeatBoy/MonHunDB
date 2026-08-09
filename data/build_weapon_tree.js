// Builds the complete per-type weapon upgrade tree for the app.
//
// Merges two sources:
//   - Fandom (data/weapon_tree_base.json): clean base-game tree per type
//     (each weapon row's indent depth = tree depth, DFS order -> exact parent).
//     Fandom faithfully models the unlock/cross-tree branches (e.g. Red Wing I
//     branches from Jyura Mudblade I, which branches from Golem Blade I...).
//   - Fextralife (data/weapon_tree_raw/ via .tree.well DOM): supplies the
//     Master Rank weapons (Rise base pages don't list MR) + the true finals.
//
// Output: data/weapon_tree.json
//   { parents: { Child: Parent }, order: [ ...tree order... ], finals: [ ... ] }
//
// Usage:
//   node data/build_weapon_tree.js
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const FEXTRA_CACHE = path.join(__dirname, "weapon_tree_raw");
const FANDOM_BASE = JSON.parse(fs.readFileSync(path.join(__dirname, "weapon_tree_base.json"), "utf8"));
const FINALS = JSON.parse(fs.readFileSync(path.join(__dirname, "weapon_finals.json"), "utf8"));

const TYPES = ["Great Sword", "Sword & Shield", "Dual Blades", "Long Sword", "Hammer",
  "Hunting Horn", "Lance", "Gunlance", "Switch Axe", "Charge Blade",
  "Insect Glaive", "Bow", "Heavy Bowgun", "Light Bowgun"];

const norm = (s) => (s || "").toLowerCase().replace(/\s*\+\s*/g, "+").replace(/\s+/g, " ").trim();
function fextraSlug(type) { return type.replace(/ /g, "+") + "+Weapon+Tree"; }
function fextraFile(type) { return path.join(FEXTRA_CACHE, fextraSlug(type).replace(/\+/g, "_") + ".html"); }

async function parseFextra(page, html) {
  await page.setContent(html);
  return page.evaluate(() => {
    const out = [];
    for (const well of document.querySelectorAll(".tree.well")) {
      for (const li of well.querySelectorAll("li")) {
        const a = li.querySelector(":scope > a.wiki_link");
        if (!a) continue;
        const name = a.textContent.trim().replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
        if (!name) continue;
        let parent = null;
        let anc = li.parentElement;
        while (anc && anc !== well && anc.parentElement) {
          if (anc.tagName === "LI") {
            const pa = anc.querySelector(":scope > a.wiki_link");
            if (pa) { parent = pa.textContent.trim().replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); break; }
          }
          anc = anc.parentElement;
        }
        out.push({ name, parent });
      }
    }
    return out;
  });
}

function baseParents(rows) {
  const parents = {};
  const stack = [];
  for (const r of rows) {
    while (stack.length && stack[stack.length - 1].depth >= r.depth) stack.pop();
    if (stack.length && stack[stack.length - 1].depth === r.depth - 1) parents[r.name] = stack[stack.length - 1].name;
    stack.push({ depth: r.depth, name: r.name });
  }
  return parents;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const allParents = {};
  const allOrder = [];
  const STOP = new Set(["sword", "blade", "great", "small", "long", "dual", "bow", "lance", "gunlance", "axe", "charge", "hammer", "hunting", "horn", "switch", "insect", "glaive", "light", "heavy", "bowgun", "i", "ii", "iii", "iv", "v", "s"]);
  const famTokens = (n) => (n || "").toLowerCase().replace(/\s*\+\s*/g, "+").split(/\s+/).filter(t => t && !STOP.has(t));
  const sameFam = (a, b) => { const ta = new Set(famTokens(a)); for (const t of famTokens(b)) if (ta.has(t)) return true; return false; };

  for (const type of TYPES) {
    const fextra = await parseFextra(page, fs.readFileSync(fextraFile(type), "utf8"));
    const fextraOrder = fextra.map(n => n.name);

    const baseRows = FANDOM_BASE.types[type.replace(/&/g, "and")] || [];
    let parents = baseRows.length ? baseParents(baseRows) : {};
    const inBase = new Set(Object.keys(parents).concat(baseRows.map(r => r.name)));

    // attach non-base weapons (mostly Master Rank) to the nearest same-family
    // anchored weapon via Fextralife. Family-token guard drops the Fextralife
    // DOM's wrong cross-tree nesting for base weapons (which Fandom models cleanly).
    const anchored = new Set(Object.keys(parents));
    for (const w of fextra) {
      if (inBase.has(w.name)) continue;
      let cur = w, seen = 0, attach = null;
      while (cur && cur.parent && seen++ < 30) {
        const p = cur.parent;
        if (anchored.has(p) && sameFam(cur.name, p)) { attach = p; break; }
        cur = fextra.find(x => x.name === p) || null;
      }
      if (attach) { parents[w.name] = attach; anchored.add(w.name); }
    }
    // reconnect orphan roots (Fandom omits some tier-1, e.g. Kamura starts at II)
    for (const w of fextra) {
      if (w.name in parents) continue;
      if (!w.parent) continue;
      if (!sameFam(w.name, w.parent)) continue;
      parents[w.name] = w.parent;
    }

    let order = baseRows.map(r => r.name);
    for (const n of fextraOrder) if (!order.includes(n)) order.push(n);
    for (const c of Object.keys(parents)) if (!(c in allParents)) allParents[c] = parents[c];
    for (const n of order) if (!allOrder.includes(n)) allOrder.push(n);
    console.log(type.padEnd(16) + " parents=" + Object.keys(parents).length);
  }

  fs.writeFileSync(path.join(__dirname, "weapon_tree.json"), JSON.stringify({ parents: allParents, order: allOrder, finals: FINALS }));
  console.log("TOTAL order:", allOrder.length, "parents:", Object.keys(allParents).length, "finals:", FINALS.length);
  await browser.close();
})();
