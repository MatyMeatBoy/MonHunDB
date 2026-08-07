const GROUP_OVERRIDES = {
  "Apex Arzuros": "Arzuros",
  "Apex Diablos": "Diablos",
  "Apex Mizutsune": "Mizutsune",
  "Violet Mizutsune": "Mizutsune",
  "Apex Rathalos": "Rathalos",
  "Silver Rathalos": "Rathalos",
  "Apex Rathian": "Rathian",
  "Gold Rathian": "Rathian",
  "Apex Zinogre": "Zinogre",
  "Blood Orange Bishaten": "Bishaten",
  "Chaotic Gore Magala": "Gore Magala",
  "Risen Shagaru Magala": "Shagaru Magala",
  "Risen Crimson Glow Valstrax": "Crimson Glow Valstrax",
  "Primordial Malzeno": "Malzeno",
  "Risen Kushala Daora": "Kushala Daora",
  "Risen Teostra": "Teostra",
  "Risen Chameleos": "Chameleos",
  "Furious Rajang": "Rajang",
  "Seething Bazelgeuse": "Bazelgeuse",
  "Lucent Nargacuga": "Nargacuga",
  "Aurora Somnacanth": "Somnacanth",
  "Magma Almudron": "Almudron",
  "Pyre Rakna-Kadaki": "Rakna-Kadaki",
  "Flaming Espinas": "Espinas",
  "Scorned Magnamalo": "Magnamalo",
  "Narwa the Allmother": "Narwa / Ibushi",
  "Thunder Serpent Narwa": "Narwa / Ibushi",
  "Wind Serpent Ibushi": "Narwa / Ibushi",
};

const ELEMENT_ORDER = ["fire", "water", "thunder", "ice", "dragon", "blast", "poison", "paralysis", "sleep", "stun", "exhaust"];
const RANK_ORDER = ["Low Rank", "High Rank", "Master Rank"];

let monsters = [];
let currentRank = null;
let lang = localStorage.getItem("mh-lang") || "es";

let selectedMonster = "";
const comboboxEl = document.getElementById("monster-combobox");
const triggerEl = document.getElementById("monster-trigger");
const triggerIconEl = triggerEl.querySelector(".trigger-icon");
const triggerLabelEl = triggerEl.querySelector(".trigger-label");
const panelEl = document.getElementById("monster-panel");
const searchEl = document.getElementById("monster-search");
const listEl = document.getElementById("monster-list");
const detailEl = document.getElementById("detail");
const tpl = document.getElementById("tpl-detail");
const langToggleEl = document.getElementById("lang-toggle");
const gsWrapEl = document.getElementById("global-search-wrap");
const gsToggleEl = document.getElementById("global-search-toggle");
const gsPanelEl = document.getElementById("global-search-panel");
const gsInputEl = document.getElementById("global-search-input");
const gsResultsEl = document.getElementById("global-search-results");
const decorationsNavToggleEl = document.getElementById("decorations-nav-toggle");
const decorationsViewEl = document.getElementById("decorations-view");
const decorationsBackEl = document.getElementById("decorations-back");
const decorationsSearchEl = document.getElementById("decorations-search");
const decorationsIndexEl = document.getElementById("decorations-index");
const decorationDetailEl = document.getElementById("decoration-detail");
let decorations = [];

function normalizeSearch(s) {
  // strip accents, then "+" (ex. "Attack Jewel+ 4") so a query typed without
  // it ("attack jewel 4") still matches -- most people don't type the plus
  return (s || "").normalize("NFD").replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase().replace(/\+/g, " ").replace(/\s+/g, " ").trim();
}

function groupFor(name) {
  return GROUP_OVERRIDES[name] || name;
}

function ui(key) {
  return I18N.ui[lang][key];
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function trElement(name) {
  return lang === "es" ? t(I18N.elements, name) : capitalize(name);
}
function trAilment(name) {
  return lang === "es" ? t(I18N.ailments, name) : name;
}
function trBuildupLabel(name) {
  return lang === "es" ? t(I18N.buildupLabels, name) : name;
}
function trRank(name) {
  return lang === "es" ? t(I18N.ranks, name) : name;
}
function trSpecies(name) {
  return lang === "es" ? t(I18N.species, name) : name;
}
function trLocation(name) {
  return lang === "es" ? t(I18N.locations, name) : name;
}
function trBodyPart(name) {
  return lang === "es" ? t(I18N.bodyParts, name) : name;
}
function trMonsterName(name) {
  return lang === "es" ? t(I18N.monsterNames, name) : name;
}
function trMaterial(name) {
  return lang === "es" ? translateMaterial(name) : name;
}

// Anomaly Research level RANGE (EX1-EX9 tier chain) each "(Anomaly)"/
// "(Anomaly Quests)" material actually requires -- Fextralife's material
// tables never carried this, only the generic "(Anomaly Quests)" token.
// {min} only (no max) means the top tier of its chain, open-ended in the
// source table (ex. "Lv161~"). Sourced from the EX1-EX9 reference table the
// user provided as an image (maps EX group + min level to each
// "Afflicted X -> Afflicted X+ -> Afflicted Hard-X" material chain),
// cross-checked against game8.co/games/Monster-Hunter-Rise/archives/381534
// for the base-tier numbers. Keys are the normalizeMaterialKey()'d form
// (no space before a trailing "+") since monsters.json has both "Name +"
// and "Name+" for the same material from an inconsistent original scrape.
const ANOMALY_LEVEL_RANGE = {
  "Afflicted Bone": { min: 1, max: 30 },
  "Afflicted Hardbone": { min: 31, max: 100 },
  "Afflicted Slogbone": { min: 101 },
  "Afflicted Pelt": { min: 1, max: 30 },
  "Afflicted Hide+": { min: 31, max: 100 },
  "Afflicted Thickhide": { min: 101 },
  "Afflicted Monster Bone": { min: 11, max: 30 },
  "Afflicted Monster Hardbone": { min: 31, max: 100 },
  "Afflicted Monster Slogbone": { min: 101 },
  "Afflicted Blood": { min: 11, max: 30 },
  "Afflicted Dragon Blood": { min: 31, max: 100 },
  "Afflicted Pure Blood": { min: 101 },
  "Afflicted Scale": { min: 21, max: 30 },
  "Afflicted Scale+": { min: 31, max: 100 },
  "Afflicted Shard": { min: 101 },
  "Afflicted Shell": { min: 21, max: 30 },
  "Afflicted Carapace": { min: 31, max: 100 },
  "Afflicted Cortex": { min: 101 },
  "Afflicted Fang": { min: 31, max: 100 },
  "Afflicted Fang+": { min: 31, max: 100 },
  "Afflicted Hardfang": { min: 101 },
  "Afflicted Claw": { min: 31, max: 100 },
  "Afflicted Claw+": { min: 31, max: 100 },
  "Afflicted Hardclaw": { min: 101 },
  "Afflicted Dire Horn": { min: 51, max: 100 },
  "Afflicted Dire Horn+": { min: 101, max: 160 },
  "Afflicted Dire Hardhorn": { min: 161 },
  "Afflicted Dire Bone": { min: 51, max: 100 },
  "Afflicted Dire Hardbone": { min: 101, max: 160 },
  "Afflicted Dire Slogbone": { min: 161 },
  "Afflicted Dire Scale": { min: 51, max: 100 },
  "Afflicted Dire Scale+": { min: 101, max: 160 },
  "Afflicted Dire Shard": { min: 161 },
  "Afflicted Dire Shell": { min: 71, max: 110 },
  "Afflicted Dire Carapace": { min: 111, max: 180 },
  "Afflicted Dire Cortex": { min: 181 },
  "Afflicted Dire Claw": { min: 71, max: 110 },
  "Afflicted Dire Claw+": { min: 111, max: 180 },
  "Afflicted Dire Hardclaw": { min: 181 },
  "Afflicted Dire Fang": { min: 91, max: 140 },
  "Afflicted Dire Fang+": { min: 141, max: 200 },
  "Afflicted Dire Hardfang": { min: 201 },
  "Afflicted Dire Wing": { min: 91, max: 140 },
  "Afflicted Dire Wing+": { min: 141, max: 200 },
  "Afflicted Dire Fellwing": { min: 201 },
  "Afflicted Dire Blood": { min: 91, max: 140 },
  "Afflicted Dire Dragon Blood": { min: 141, max: 200 },
  "Afflicted Dire Darkblood": { min: 201 },
  "Risen Dragonbone": { min: 111, max: 160 },
  "Risen Dragonbone+": { min: 161, max: 220 },
  "Risen Slogbone": { min: 221 },
  "Risen Dragon Blood": { min: 131, max: 200 },
  "Risen Dragon Pureblood": { min: 201, max: 240 },
  "Risen Dragon Thickblood": { min: 241 },
};

// Appends the Anomaly level range to the "(Anomaly)"/"(Anomaly Quests)"
// token in a materials-table cell, ex. "40% (Misiones de Anomalía)" ->
// "40% (Misiones de Anomalía, Nvl. 111-160)" or "...Nvl. 241+)" for an
// open-ended top tier. No-op for materials/cells that don't carry that
// token, or that aren't in ANOMALY_LEVEL_RANGE above.
function annotateAnomalyLevel(text, material) {
  const range = ANOMALY_LEVEL_RANGE[normalizeMaterialKey(material)];
  if (!text || !range || !/Anomal/.test(text)) return text;
  const levelStr = range.max ? `${range.min}-${range.max}` : `${range.min}+`;
  const suffix = lang === "es" ? `Nvl. ${levelStr}` : `Lv. ${levelStr}`;
  return text.replace(/(Anomal[^),]*)\)/, (whole, inner) => `${inner}, ${suffix})`);
}

function trPartTokens(str) {
  if (lang !== "es" || !str) return str;
  return str.replace(/\(([^)]+)\)/g, (whole, inner) => {
    const translated = inner.split(/([,/])/).map(piece => {
      const trimmed = piece.trim();
      if (trimmed === "," || trimmed === "/" || trimmed === "") return piece;
      return I18N.bodyParts[trimmed] || piece;
    }).join("");
    return `(${translated})`;
  });
}

function applyI18nText(root) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const val = I18N.ui[lang][key];
    if (typeof val === "string") el.textContent = val;
  });
}

function applyUiStrings() {
  applyI18nText(document);
  document.title = lang === "es"
    ? "Bestiario — Monster Hunter Rise: Sunbreak"
    : "Bestiary — Monster Hunter Rise: Sunbreak";
  document.documentElement.lang = lang;
  triggerEl.setAttribute("aria-label", ui("selectPlaceholder"));
  if (searchEl) searchEl.placeholder = ui("searchPlaceholder");
  if (gsInputEl) gsInputEl.placeholder = ui("globalSearchPlaceholder");
  if (decorationsSearchEl) decorationsSearchEl.placeholder = ui("decorationsSearchPlaceholder");
  if (!selectedMonster) triggerLabelEl.textContent = ui("selectPlaceholder");
  langToggleEl.querySelectorAll(".lang-opt").forEach(el => {
    el.classList.toggle("active", el.dataset.lang === lang);
  });
}

async function loadMaterialTranslations() {
  try {
    const res = await fetch("data/kiranico_item_translations.json");
    if (res.ok) I18N.materials = await res.json();
  } catch (e) {
    console.warn("No se pudieron cargar las traducciones de materiales", e);
  }
}

async function init() {
  applyUiStrings();

  try {
    const [monstersRes, decorationsRes] = await Promise.all([
      fetch("data/monsters.json"),
      fetch("data/decorations.json"),
      loadMaterialTranslations(),
      loadIconManifest(),
      loadStatusIconManifest(),
      loadMaterialIconManifest(),
    ]);
    if (!monstersRes.ok) throw new Error("HTTP " + monstersRes.status);
    monsters = await monstersRes.json();
    decorations = decorationsRes.ok ? await decorationsRes.json() : [];
  } catch (err) {
    triggerLabelEl.textContent = ui("selectError");
    detailEl.innerHTML = `<p class="empty-state">${I18N.ui[lang].loadError(err.message)}</p>`;
    return;
  }

  buildSelector();
  initCombobox();
  buildMaterialIndex();
  initGlobalSearch();
  initDecorations();

  const params = new URLSearchParams(location.search);
  const initial = params.get("m");
  if (initial && monsters.some(m => m.name === initial)) {
    selectMonster(initial, { skipUrl: true });
  }

  langToggleEl.addEventListener("click", () => {
    lang = lang === "es" ? "en" : "es";
    localStorage.setItem("mh-lang", lang);
    applyUiStrings();
    buildSelector();
    if (selectedMonster) renderMonster(selectedMonster);
    if (!decorationsViewEl.hidden) {
      if (!decorationDetailEl.hidden) {
        const params = new URLSearchParams(location.search);
        const decId = params.get("d");
        if (decId) showDecorationDetail(decId);
      } else {
        renderDecorationsIndex(decorationsSearchEl.value);
      }
    }
  });
}

let iconManifest = {};
function iconPath(name) {
  return iconManifest[name] || `data/images/icons/${slugify(name)}.png`;
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
async function loadIconManifest() {
  try {
    const res = await fetch("data/icon_manifest.json");
    if (res.ok) iconManifest = await res.json();
  } catch (e) {
    console.warn("No se pudo cargar el manifiesto de íconos", e);
  }
}

let statusIconManifest = {};
async function loadStatusIconManifest() {
  try {
    const res = await fetch("data/status_icon_manifest.json");
    if (res.ok) statusIconManifest = await res.json();
  } catch (e) {
    console.warn("No se pudo cargar el manifiesto de íconos de estado", e);
  }
}
function statusIconTag(name) {
  const src = statusIconManifest[name];
  return src ? `<img class="status-icon" src="${src}" alt="" loading="lazy">` : "";
}

const ELEMENT_TO_BLIGHT = {
  fire: "Fireblight", water: "Waterblight", thunder: "Thunderblight",
  ice: "Iceblight", dragon: "Dragonblight",
};
function elementIconTag(elementName) {
  const blight = ELEMENT_TO_BLIGHT[(elementName || "").toLowerCase()];
  return blight ? statusIconTag(blight) : "";
}

let materialIconManifest = {};
async function loadMaterialIconManifest() {
  try {
    const res = await fetch("data/material_icon_manifest.json");
    if (res.ok) materialIconManifest = await res.json();
  } catch (e) {
    console.warn("No se pudo cargar el manifiesto de íconos de materiales", e);
  }
}
function materialIconTag(name) {
  // manifest keys were built without a space before "+" (ex. "Narwa Claw+"),
  // but some monsters.json rows have the same material with a space before
  // it ("Narwa Claw +") from an inconsistent original scrape -- normalize
  // the same way translateMaterial() already does so both forms hit the icon
  const src = materialIconManifest[name] || materialIconManifest[normalizeMaterialKey(name)];
  return src
    ? `<img class="material-icon" src="${src}" alt="" loading="lazy">`
    : `<span class="material-icon material-icon--placeholder"></span>`;
}

function selectMonster(name, opts = {}) {
  selectedMonster = name;
  const monster = monsters.find(m => m.name === name);
  if (monster) {
    triggerIconEl.src = iconPath(name);
    triggerIconEl.hidden = false;
    triggerIconEl.onerror = () => { triggerIconEl.hidden = true; };
    triggerLabelEl.textContent = trMonsterName(name);
    renderMonster(name);
    if (!opts.skipUrl) {
      const url = new URL(location.href);
      url.searchParams.set("m", name);
      history.replaceState(null, "", url);
    }
  }
  closePanel();
  listEl.querySelectorAll(".monster-option").forEach(el => {
    el.classList.toggle("selected", el.dataset.name === name);
  });
}

function openPanel() {
  panelEl.hidden = false;
  triggerEl.setAttribute("aria-expanded", "true");
  searchEl.value = "";
  filterOptions("");
  searchEl.focus();
  if (selectedMonster) {
    const selectedOpt = listEl.querySelector(`.monster-option[data-name="${CSS.escape(selectedMonster)}"]`);
    if (selectedOpt) selectedOpt.scrollIntoView({ block: "center" });
  }
}

function closePanel() {
  panelEl.hidden = true;
  triggerEl.setAttribute("aria-expanded", "false");
}

function filterOptions(query) {
  const q = normalizeSearch(query.trim());
  let anyVisible = false;
  listEl.querySelectorAll(".monster-group").forEach(group => {
    let groupHasVisible = false;
    group.querySelectorAll(".monster-option").forEach(opt => {
      const match = !q || opt.dataset.search.includes(q);
      opt.hidden = !match;
      if (match) groupHasVisible = true;
    });
    group.hidden = !groupHasVisible;
    if (groupHasVisible) anyVisible = true;
  });
  const noResults = listEl.querySelector(".no-results");
  if (noResults) noResults.hidden = anyVisible;
}

function initCombobox() {
  triggerEl.addEventListener("click", () => {
    if (panelEl.hidden) openPanel();
    else closePanel();
  });

  searchEl.addEventListener("input", () => filterOptions(searchEl.value));

  document.addEventListener("click", (e) => {
    if (!comboboxEl.contains(e.target)) closePanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panelEl.hidden) {
      closePanel();
      triggerEl.focus();
    }
  });
}

let materialIndex = null;
function buildMaterialIndex() {
  materialIndex = new Map();
  for (const mo of monsters) {
    for (const rank in (mo.materials || {})) {
      for (const row of mo.materials[rank]) {
        if (!row.material) continue;
        // normalize the same way translateMaterial()/materialIconTag() do —
        // some rows have "Name +" (space before plus) from an inconsistent
        // original scrape, which would otherwise silently miss lookups from
        // decorations.json (which uses the no-space "Name+" form)
        const key = normalizeMaterialKey(row.material);
        if (!materialIndex.has(key)) materialIndex.set(key, []);
        materialIndex.get(key).push({ monster: mo.name, rank, row });
      }
    }
  }
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function wrapXn(str) {
  if (!str) return str;
  return str.replace(/\(x(\d+)\)|\[x(\d+)\]/g, (whole, a, b) => {
    const n = a || b;
    return `<span class="gs-xn" title="${escapeAttr(I18N.ui[lang].gsXnTooltip(n))}">(x${n})</span>`;
  });
}

function summarizeRow(row) {
  const parts = [];
  if (row.targetReward) parts.push(`${ui("colTarget")} ${wrapXn(trPartTokens(row.targetReward))}`);
  if (row.capture) parts.push(`${ui("colCapture")} ${wrapXn(trPartTokens(row.capture))}`);
  if (row.breakParts) parts.push(`${ui("colBreak")} ${wrapXn(trPartTokens(row.breakParts))}`);
  if (row.carves) parts.push(`${ui("colCarve")} ${wrapXn(trPartTokens(row.carves))}`);
  if (row.dropped) parts.push(`${ui("colDropped")} ${wrapXn(trPartTokens(row.dropped))}`);
  return parts.join(" • ");
}

function openGlobalSearch() {
  gsPanelEl.hidden = false;
  gsToggleEl.setAttribute("aria-expanded", "true");
  gsInputEl.value = "";
  gsResultsEl.innerHTML = "";
  gsInputEl.focus();
}
function closeGlobalSearch() {
  gsPanelEl.hidden = true;
  gsToggleEl.setAttribute("aria-expanded", "false");
}

function runGlobalSearch(query) {
  const q = normalizeSearch(query.trim());
  if (!q) { gsResultsEl.innerHTML = ""; return; }
  if (!materialIndex) buildMaterialIndex();

  const monsterMatches = monsters.filter(m =>
    normalizeSearch(m.name).includes(q) || normalizeSearch(trMonsterName(m.name)).includes(q)
  ).slice(0, 8);

  const materialMatches = [];
  for (const [matName, sources] of materialIndex.entries()) {
    const esName = trMaterial(matName);
    if (normalizeSearch(matName).includes(q) || normalizeSearch(esName).includes(q)) {
      materialMatches.push({ matName, esName, sources });
    }
  }

  const decorationMatches = (decorations || []).filter(dec => {
    const skill = dec.skills[0];
    return normalizeSearch(dec.name).includes(q)
      || normalizeSearch(dec.nameEs || "").includes(q)
      || normalizeSearch(skill.name).includes(q)
      || normalizeSearch(skill.nameEs || "").includes(q);
  }).slice(0, 8);

  let html = "";

  if (monsterMatches.length) {
    html += `<div class="gs-section"><div class="gs-section-title">${ui("gsMonstersSection")}</div>`;
    html += monsterMatches.map(m => `
      <button type="button" class="gs-monster-row" data-name="${m.name}">
        <img src="${iconPath(m.name)}" alt="" loading="lazy">
        <span>${trMonsterName(m.name)}</span>
      </button>
    `).join("");
    html += `</div>`;
  }

  if (decorationMatches.length) {
    html += `<div class="gs-section"><div class="gs-section-title">${ui("gsDecorationsSection")}</div>`;
    html += decorationMatches.slice(0, 6).map(dec => {
      const skill = dec.skills[0];
      return `<div class="gs-material-block">
        <button type="button" class="gs-decoration-header" data-decoration-id="${dec.id}">
          ${decorationIconTag(dec)}
          <span>${trDecorationName(dec)}</span>
        </button>
        <p class="gs-decoration-skill">${lang === "es" ? skill.nameEs : skill.name} Lv${skill.level} — ${lang === "es" ? skill.effectEs : skill.effect}</p>
        <p class="gs-material-intro">${ui("decorationsMaterialsHeading")}:</p>
        <ul class="gs-decoration-materials">
          ${dec.materials.map(m => `
            <li>${materialIconTag(m.material)}<span>${trMaterial(m.material)}</span><span class="gs-decoration-qty">x${m.qty}</span></li>
          `).join("")}
        </ul>
      </div>`;
    }).join("");
    html += `</div>`;
  }

  if (materialMatches.length) {
    for (const mm of materialMatches.slice(0, 6)) {
      html += `<div class="gs-material-block">
        <div class="gs-material-header">${materialIconTag(mm.matName)}<span>${mm.esName}</span></div>
        <p class="gs-material-intro">${ui("gsMaterialIntro")}</p>
        ${mm.sources.map(s => `
          <button type="button" class="gs-source-row" data-name="${s.monster}" data-rank="${s.rank}">
            <span class="gs-source-top">
              <img src="${iconPath(s.monster)}" alt="" loading="lazy">
              <span class="gs-source-name">${trMonsterName(s.monster)}</span>
              <span class="gs-source-rank">${trRank(s.rank)}</span>
            </span>
            <span class="gs-source-summary">${summarizeRow(s.row) || "—"}</span>
          </button>
        `).join("")}
      </div>`;
    }
  }

  if (!monsterMatches.length && !materialMatches.length && !decorationMatches.length) {
    html = `<p class="gs-no-results">${ui("gsNoResults")}</p>`;
  }

  gsResultsEl.innerHTML = html;

  gsResultsEl.querySelectorAll(".gs-monster-row").forEach(btn => {
    btn.addEventListener("click", () => {
      selectMonster(btn.dataset.name);
      closeGlobalSearch();
    });
  });
  gsResultsEl.querySelectorAll(".gs-decoration-header").forEach(btn => {
    btn.addEventListener("click", () => {
      showDecorationsView();
      showDecorationDetail(btn.dataset.decorationId);
      closeGlobalSearch();
    });
  });
  gsResultsEl.querySelectorAll(".gs-source-row").forEach(btn => {
    btn.addEventListener("click", () => {
      currentRank = btn.dataset.rank;
      selectMonster(btn.dataset.name);
      closeGlobalSearch();
    });
  });
}

function initGlobalSearch() {
  gsToggleEl.addEventListener("click", () => {
    if (gsPanelEl.hidden) openGlobalSearch();
    else closeGlobalSearch();
  });
  gsInputEl.addEventListener("input", () => runGlobalSearch(gsInputEl.value));
  document.addEventListener("click", (e) => {
    if (!gsWrapEl.contains(e.target)) closeGlobalSearch();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !gsPanelEl.hidden) {
      closeGlobalSearch();
      gsToggleEl.focus();
    }
  });
}

function trDecorationName(dec) {
  return lang === "es" && dec.nameEs ? dec.nameEs : dec.name;
}
function decorationIconTag(dec) {
  return dec.icon
    ? `<img class="material-icon" src="${dec.icon}" alt="" loading="lazy">`
    : `<span class="material-icon material-icon--placeholder"></span>`;
}

function showDecorationsView() {
  detailEl.hidden = true;
  comboboxEl.hidden = true;
  decorationsViewEl.hidden = false;
  decorationDetailEl.hidden = true;
  decorationsIndexEl.hidden = false;
  decorationsSearchEl.value = "";
  renderDecorationsIndex("");
  const url = new URL(location.href);
  url.searchParams.set("view", "decorations");
  url.searchParams.delete("m");
  history.replaceState(null, "", url);
}

function hideDecorationsView() {
  decorationsViewEl.hidden = true;
  comboboxEl.hidden = false;
  detailEl.hidden = false;
  const url = new URL(location.href);
  url.searchParams.delete("view");
  history.replaceState(null, "", url);
}

function renderDecorationsIndex(query) {
  const q = normalizeSearch((query || "").trim());
  const filtered = !q ? decorations : decorations.filter(dec => {
    const skill = dec.skills[0];
    return normalizeSearch(dec.name).includes(q)
      || normalizeSearch(dec.nameEs || "").includes(q)
      || normalizeSearch(skill.name).includes(q)
      || normalizeSearch(skill.nameEs || "").includes(q);
  });

  if (!filtered.length) {
    decorationsIndexEl.innerHTML = `<p class="no-data">${ui("decorationsNoResults")}</p>`;
    return;
  }

  // group by slot level (1-4), matching how players actually shop for these
  const bySlot = new Map();
  for (const dec of filtered) {
    const slot = dec.slotLevel || 0;
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot).push(dec);
  }

  decorationsIndexEl.innerHTML = [...bySlot.keys()].sort((a, b) => a - b).map(slot => `
    <div class="decorations-slot-group">
      <h3 class="decorations-slot-heading">${ui("decorationsSlot")(slot)}</h3>
      <div class="decorations-grid">
        ${bySlot.get(slot).map(dec => `
          <button type="button" class="decoration-card" data-id="${dec.id}">
            ${decorationIconTag(dec)}
            <span class="decoration-card-name">${trDecorationName(dec)}</span>
            <span class="decoration-card-skill">${lang === "es" ? dec.skills[0].nameEs : dec.skills[0].name} Lv${dec.skills[0].level}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `).join("");

  decorationsIndexEl.querySelectorAll(".decoration-card").forEach(btn => {
    btn.addEventListener("click", () => showDecorationDetail(btn.dataset.id));
  });
}

function showDecorationDetail(id) {
  const dec = decorations.find(d => d.id === id);
  if (!dec) return;
  decorationsIndexEl.hidden = true;
  decorationDetailEl.hidden = false;

  const skillsHtml = dec.skills.map(s => `
    <li class="stat-list-item">
      <span class="stat-name">${lang === "es" ? s.nameEs : s.name} Lv${s.level}</span>
      <span class="decoration-skill-effect">${lang === "es" ? s.effectEs : s.effect}</span>
    </li>
  `).join("");

  if (!materialIndex) buildMaterialIndex();
  const materialsHtml = dec.materials.map(m => {
    const sources = materialIndex.get(normalizeMaterialKey(m.material)) || [];
    const monsterCount = new Set(sources.map(s => s.monster)).size;
    return `<div class="gs-material-block decoration-material-block">
      <div class="gs-material-header">
        ${materialIconTag(m.material)}
        <span>${trMaterial(m.material)}</span>
        <span class="decoration-material-qty">x${m.qty}</span>
      </div>
      ${sources.length ? `
        <details class="decoration-material-sources">
          <summary>${ui("decorationsSeeMonsters")(monsterCount)}</summary>
          ${sources.map(s => `
          <button type="button" class="gs-source-row" data-name="${s.monster}" data-rank="${s.rank}">
            <span class="gs-source-top">
              <img src="${iconPath(s.monster)}" alt="" loading="lazy">
              <span class="gs-source-name">${trMonsterName(s.monster)}</span>
              <span class="gs-source-rank">${trRank(s.rank)}</span>
            </span>
            <span class="gs-source-summary">${summarizeRow(s.row) || "—"}</span>
          </button>`).join("")}
        </details>
      ` : `<p class="gs-material-intro">${ui("decorationsMaterialNoMonster")}</p>`}
    </div>`;
  }).join("");

  decorationDetailEl.innerHTML = `
    <button type="button" class="decorations-back" id="decoration-detail-back">${ui("decorationsBack")}</button>
    <div class="decoration-detail-header">
      ${decorationIconTag(dec)}
      <h2>${trDecorationName(dec)}</h2>
      <span class="decoration-detail-slot">${ui("decorationsSlot")(dec.slotLevel)}</span>
    </div>
    <section class="block">
      <h3>${ui("decorationsSkillsHeading")}</h3>
      <ul class="stat-list decoration-skills-list">${skillsHtml}</ul>
    </section>
    <section class="block">
      <h3>${ui("decorationsMaterialsHeading")}</h3>
      <div class="decoration-materials-blocks">${materialsHtml}</div>
    </section>
  `;
  decorationDetailEl.querySelector("#decoration-detail-back").addEventListener("click", () => {
    decorationDetailEl.hidden = true;
    decorationsIndexEl.hidden = false;
  });
  decorationDetailEl.querySelectorAll(".gs-source-row").forEach(btn => {
    btn.addEventListener("click", () => {
      currentRank = btn.dataset.rank;
      hideDecorationsView();
      selectMonster(btn.dataset.name);
    });
  });

  const url = new URL(location.href);
  url.searchParams.set("view", "decorations");
  url.searchParams.set("d", id);
  history.replaceState(null, "", url);
}

function initDecorations() {
  decorationsNavToggleEl.addEventListener("click", showDecorationsView);
  decorationsBackEl.addEventListener("click", hideDecorationsView);
  decorationsSearchEl.addEventListener("input", () => renderDecorationsIndex(decorationsSearchEl.value));

  const params = new URLSearchParams(location.search);
  if (params.get("view") === "decorations") {
    showDecorationsView();
    const decId = params.get("d");
    if (decId && decorations.some(d => d.id === decId)) showDecorationDetail(decId);
  }
}

function buildSelector() {
  const groups = new Map();
  for (const m of monsters) {
    const g = groupFor(m.name);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(m);
  }

  const sortedGroupNames = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  listEl.innerHTML = "";

  for (const groupName of sortedGroupNames) {
    const items = groups.get(groupName).sort((a, b) => a.name.localeCompare(b.name));
    // Put the base monster (the one whose own name equals the group name)
    // first, so variants can be listed as indented sub-items under it.
    const baseIdx = items.findIndex(it => it.name === groupName);
    if (baseIdx > 0) items.unshift(items.splice(baseIdx, 1)[0]);
    const hasBase = baseIdx !== -1;

    const groupEl = document.createElement("div");
    groupEl.className = "monster-group";

    items.forEach((it, i) => {
      const displayName = trMonsterName(it.name);
      const isVariant = hasBase && i > 0;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "monster-option" + (isVariant ? " monster-option--variant" : "");
      btn.dataset.name = it.name;
      btn.dataset.search = normalizeSearch(it.name + " " + displayName);
      btn.setAttribute("role", "option");
      btn.innerHTML = `${isVariant ? '<span class="variant-dash">—</span>' : ""}<img src="${iconPath(it.name)}" alt="" loading="lazy" onerror="this.classList.add('icon-missing')"><span>${displayName}</span>`;
      btn.addEventListener("click", () => selectMonster(it.name));
      groupEl.appendChild(btn);
    });

    listEl.appendChild(groupEl);
  }

  const noResults = document.createElement("div");
  noResults.className = "no-results";
  noResults.hidden = true;
  noResults.textContent = ui("noSearchResults");
  listEl.appendChild(noResults);
}

function starString(stars, max = 3) {
  const n = Math.max(0, Math.min(max, Number(stars) || 0));
  let out = "";
  for (let i = 0; i < max; i++) {
    out += `<span class="${i < n ? "on" : "off"}">★</span>`;
  }
  return out;
}

function renderMonster(name) {
  const monster = monsters.find(m => m.name === name);
  if (!monster) return;

  const node = tpl.content.cloneNode(true);
  applyI18nText(node);

  node.querySelector(".monster-name").textContent = trMonsterName(monster.name);
  node.querySelector(".monster-species").textContent = trSpecies(monster.species || "");

  const mhElementEl = node.querySelector('[data-mh="element"] .mh-info-value');
  const mainEls = monster.attackElements || [];
  mhElementEl.innerHTML = mainEls.length
    ? mainEls.map(e => `${elementIconTag(e)}<span>${trElement(e)}</span>`).join(" ")
    : `<span class="mh-info-none">${ui("none")}</span>`;

  const renderImg = node.querySelector(".monster-render");
  if (monster.image) {
    renderImg.src = monster.image;
    renderImg.alt = trMonsterName(monster.name);
    renderImg.hidden = false;
  } else {
    renderImg.hidden = true;
  }

  const locList = node.querySelector(".locations-list");
  if (monster.locations && monster.locations.length) {
    locList.innerHTML = monster.locations.map(l => `<li>${trLocation(l)}</li>`).join("");
  } else {
    locList.innerHTML = `<li class="no-data">${ui("noData")}</li>`;
  }

  const weakList = node.querySelector(".weaknesses-list");
  const weaknesses = (monster.weaknesses || []).slice().sort(
    (a, b) => ELEMENT_ORDER.indexOf(a.element.toLowerCase()) - ELEMENT_ORDER.indexOf(b.element.toLowerCase())
  );
  weakList.innerHTML = weaknesses.length
    ? weaknesses.map(w => `<li>${elementIconTag(w.element)}<span class="stat-name">${trElement(w.element)}</span>${
        w.stars === null || w.stars === undefined
          ? `<span class="badge-resistant">${ui("weak")}</span>`
          : `<span class="stars">${starString(w.stars)}</span>`
      }</li>`).join("")
    : `<li class="no-data">${ui("noData")}</li>`;

  const resList = node.querySelector(".resistances-list");
  const resistances = monster.resistances || [];
  const conditionalRes = monster.conditionalResistances || [];
  const resRows = resistances.map(r => {
    let right;
    if (r.immune) right = `<span class="badge-immune">${ui("immune")}</span>`;
    else if (r.stars === null || r.stars === undefined) right = `<span class="badge-resistant">${ui("resistant")}</span>`;
    else right = `<span class="stars">${starString(r.stars)}</span>`;
    return `<li>${elementIconTag(r.element)}<span class="stat-name">${trElement(r.element)}</span>${right}</li>`;
  });
  const condRows = conditionalRes.map(c => {
    const label = lang === "es" ? c.labelEs : c.labelEn;
    const right = c.immune
      ? `<span class="badge-immune">${ui("immune")}</span>`
      : `<span class="badge-resistant">${ui("weak")}</span>`;
    const titleText = c.confirmed ? ui("specialCaseTitle") : ui("specialCaseUnconfirmedTitle");
    const matchedEl = Object.keys(ELEMENT_TO_BLIGHT).find(el => c.labelEn.toLowerCase().startsWith(el));
    return `<li class="res-cond" title="${titleText}">${elementIconTag(matchedEl)}<span class="stat-name">${label}</span>${right}</li>`;
  });
  resList.innerHTML = (resRows.length || condRows.length)
    ? resRows.join("") + condRows.join("")
    : `<li class="no-data">${ui("noData")}</li>`;

  renderHitzones(node.querySelector(".hitzones-table-wrap"), monster.hitzones);
  renderHitzoneSilhouette(node.querySelector(".hz-silhouette-wrap"), monster);

  const ailList = node.querySelector(".ailments-list");
  const ailments = monster.ailmentBuildup && monster.ailmentBuildup.length
    ? monster.ailmentBuildup
    : (monster.ailmentSusceptibility || []).map(a => ({ label: a.ailment, stars: a.stars, buildup: [] }));
  ailList.innerHTML = ailments.length
    ? ailments.map(a => `
        <li class="ailment-item">
          <details>
            <summary>
              ${statusIconTag(a.label)}<span class="stat-name">${trAilment(a.label)}</span>
              ${a.stars === null || a.stars === undefined
                ? `<span class="badge-resistant">${ui("susceptible")}</span>`
                : `<span class="stars">${starString(a.stars)}</span>`}
            </summary>
            ${a.buildup && a.buildup.length
              ? `<div class="buildup-bars">${a.buildup.map(b => `
                  <div class="buildup-row">
                    <span class="buildup-label">${trBuildupLabel(b.label)}</span>
                    <div class="buildup-track"><div class="buildup-fill" style="width:${b.max ? (b.value / b.max * 100) : 0}%"></div></div>
                  </div>
                `).join("")}</div>`
              : `<p class="no-data">${ui("noBuildupDetail")}</p>`}
          </details>
        </li>
      `).join("")
    : `<li class="no-data">${ui("noData")}</li>`;

  const attackElList = node.querySelector(".attack-elements-list");
  const attackEls = monster.attackElements || [];
  attackElList.innerHTML = attackEls.length
    ? attackEls.map(e => `<li>${elementIconTag(e)}${trElement(e)}</li>`).join("")
    : `<li class="no-data">${ui("none")}</li>`;

  const inflictsList = node.querySelector(".inflicts-list");
  const inflicts = monster.inflicts || [];
  inflictsList.innerHTML = inflicts.length
    ? inflicts.map(i => `<li>${statusIconTag(i)}${trAilment(i)}</li>`).join("")
    : `<li class="no-data">${ui("none")}</li>`;

  const materials = monster.materials || {};
  const availableRanks = RANK_ORDER.filter(r => materials[r] && materials[r].length);
  const tabsEl = node.querySelector(".rank-tabs");
  const tbody = node.querySelector(".materials-table tbody");

  if (!availableRanks.length) {
    tabsEl.innerHTML = "";
    tbody.innerHTML = `<tr><td colspan="7" class="no-data">${ui("noMaterialsYet")}</td></tr>`;
  } else {
    currentRank = availableRanks.includes(currentRank) ? currentRank : availableRanks[0];
    tabsEl.innerHTML = availableRanks
      .map(r => `<button type="button" class="rank-tab${r === currentRank ? " active" : ""}" data-rank="${r}">${trRank(r)}</button>`)
      .join("");
    renderMaterialsTable(tbody, materials[currentRank]);

    tabsEl.querySelectorAll(".rank-tab").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        currentRank = availableRanks[i];
        tabsEl.querySelectorAll(".rank-tab").forEach(b => b.classList.toggle("active", b === btn));
        renderMaterialsTable(tbody, materials[currentRank]);
      });
    });
  }

  detailEl.innerHTML = "";
  detailEl.appendChild(node);

  // the "Daño que inflige" divider has no natural reason to land at the same
  // x as the header's name/info divider (their content is unrelated), so it
  // only visually lines up with it if we measure the header's real rendered
  // position and copy it -- a fixed 1fr/1fr split lines up by luck at best
  requestAnimationFrame(alignInflictsDivider);
  if (renderImg.complete === false) {
    renderImg.addEventListener("load", alignInflictsDivider, { once: true });
  }
}

function alignInflictsDivider() {
  const divider = document.querySelector(".monster-header-divider");
  const cols = document.querySelector(".inflicts-columns");
  if (!divider || !cols) return;
  if (getComputedStyle(divider).display === "none") {
    cols.style.removeProperty("grid-template-columns");
    return;
  }
  const x = divider.getBoundingClientRect().left - cols.getBoundingClientRect().left;
  if (x > 0 && x < cols.getBoundingClientRect().width) {
    cols.style.gridTemplateColumns = `${x}px auto 1fr`;
  }
}
window.addEventListener("resize", () => requestAnimationFrame(alignInflictsDivider));

const HITZONE_ELEMENT_COLS = ["fire", "water", "thunder", "ice", "dragon"];
const HITZONE_PHYSICAL_COLS = ["sever", "blunt", "projectile"];
const HITZONE_HIGHLIGHT_LIMIT = 3;

// Highlighting rule:
// - Columns whose max is 0 across every body part -> always red (hz-zero).
// - Elements tied for the single highest value -> green + glow (hz-best),
//   even if that's more than 3 of them (e.g. a 4-way tie) — the tie always
//   shows in full, that's the only way the 3-column cap gets exceeded.
// - Remaining slots up to the cap of 3 are filled with the next best
//   elements (yellow, hz-ok), regardless of whether they tie with each other.
function rankElementColumns(hitzones) {
  const maxByKey = {};
  for (const key of HITZONE_ELEMENT_COLS) {
    maxByKey[key] = Math.max(0, ...hitzones.map(r => r[key] || 0));
  }

  const classByKey = {};
  for (const key of HITZONE_ELEMENT_COLS) {
    if (maxByKey[key] === 0) classByKey[key] = "hz-zero";
  }

  const nonZero = HITZONE_ELEMENT_COLS
    .filter(k => maxByKey[k] > 0)
    .sort((a, b) => maxByKey[b] - maxByKey[a]);
  if (!nonZero.length) return classByKey;

  const topVal = maxByKey[nonZero[0]];
  const topGroup = nonZero.filter(k => maxByKey[k] === topVal);
  for (const key of topGroup) classByKey[key] = "hz-best";

  let remaining = HITZONE_HIGHLIGHT_LIMIT - topGroup.length;
  if (remaining > 0) {
    const rest = nonZero.filter(k => !topGroup.includes(k)).slice(0, remaining);
    for (const key of rest) classByKey[key] = "hz-ok";
  }

  return classByKey;
}

// Prototype: colors a monster silhouette by hitzone value instead of a table.
// Scoped to Rathalos + Sever (cut) damage only for now — the shape data is a
// simplified hand-drawn approximation (not a traced sprite), and only one
// entry exists in HITZONE_SHAPES on purpose, per the user's ask to validate
// the idea on a single monster before spending more effort drawing others.
// A future damage-type selector would just swap which stat (sever/blunt/
// projectile/element) feeds heatColor() below.
const HITZONE_SHAPES = {
  // Traced from the user's own reference silhouette (vectores/rathalos.png)
  // via data/trace_silhouette.py (OpenCV connected-components + contour
  // detection) — these are real vector points from that image, not hand-
  // guessed. The image only visually separates 6 regions + a flame, one
  // short of our 7 hitzone parts, so "Back" has no region of its own in
  // this art and currently reuses the Neck shape as the closest stand-in —
  // flag/replace if the user has a better source for that part specifically.
  Rathalos: {
    viewBox: "0 0 569 500",
    parts: {
      Head: [
        // the flame/mouth region, previously rendered as fixed decoration —
        // the user identified this small red area as the real Head hitzone
        // (open, fire-breathing mouth); the big crest is the Wing, not Head
        "490,374 491,379 501,393 498,394 489,389 486,389 486,391 497,402 496,403 486,403 486,405 493,412 484,418 482,418 475,425 475,427 478,427 481,425 490,423 495,426 496,431 499,431 500,432 500,435 492,444 492,448 504,463 506,463 511,467 514,467 511,458 511,455 512,454 515,454 515,451 513,448 520,443 525,452 532,461 533,466 536,466 537,462 544,456 546,456 546,453 544,453 542,451 543,448 541,446 542,445 545,446 549,445 549,442 544,440 538,433 540,431 541,432 548,433 550,430 551,433 554,433 556,431 558,433 561,432 568,433 568,417 553,403 550,397 547,397 547,399 545,401 535,391 526,387 524,385 521,385 521,388 520,389 513,384 492,374",
      ],
      // the big crest — the user identified this large shape as the Wing
      Wing: ["238,0 275,32 276,38 256,31 250,36 308,103 311,126 274,111 260,115 259,123 272,127 265,131 265,137 296,160 268,171 237,162 224,166 225,174 262,191 269,206 268,210 246,208 241,220 267,226 274,234 262,252 236,270 215,271 204,276 200,289 217,289 216,298 221,303 245,300 294,354 329,351 394,354 422,342 451,339 492,326 529,325 539,334 545,334 547,322 540,311 524,304 482,297 515,285 511,277 478,274 502,266 503,258 460,255 481,247 482,240 452,237 449,232 460,224 460,218 438,220 435,216 440,203 423,204 418,199 420,190 411,189 394,167 330,61 268,3"],
      Neck: ["410,353 410,357 414,367 413,371 415,373 415,379 412,387 402,398 403,416 405,420 417,421 418,422 424,422 425,423 433,424 438,426 443,426 444,427 448,427 449,428 454,428 455,429 464,430 465,431 476,433 494,440 496,440 499,437 500,432 498,432 496,429 496,427 492,424 483,424 476,427 474,426 482,418 492,413 492,410 483,401 477,399 469,388 466,388 466,394 463,396 459,392 455,382 452,382 452,385 453,386 453,389 452,390 447,385 444,384 442,382 442,380 439,375 439,373 436,373 436,379 434,380 430,376 430,375 426,371 426,370 422,366 412,353"],
      // the band right after the head crest — the user identified this as
      // the Back, not a duplicate/second Wing shape
      Back: ["265,362 265,365 271,373 276,385 280,390 281,403 282,404 286,404 287,405 298,405 304,400 311,396 331,390 337,387 340,387 341,388 351,388 352,389 361,389 362,390 373,392 377,394 384,395 388,397 391,397 396,399 401,399 412,387 413,380 414,379 414,372 410,364 408,362 405,355 403,353 400,353 399,352 393,352 392,351 386,351 385,350 378,350 377,349 331,349 330,350 319,350 318,351 307,351 306,352 293,352 292,351 290,351 290,354 293,358 292,360 282,360 281,361 271,361 270,362"],
      Tail: ["0,428 23,426 41,421 44,422 26,433 13,449 38,444 60,434 62,435 60,438 60,453 63,453 83,435 110,447 153,448 231,426 276,422 280,405 278,388 273,385 267,369 261,367 239,370 240,375 238,377 214,383 214,387 191,396 189,400 170,405 170,409 150,404 147,402 157,399 158,396 149,390 109,390 107,387 97,382 92,382 90,380 89,371 81,364 71,326 68,325 65,346 65,385 51,396 47,402 11,415 0,425"],
      Abdomen: ["278,423 280,423 290,428 292,428 298,431 300,433 306,436 308,438 313,438 314,439 325,439 326,440 335,440 336,441 347,441 348,442 355,442 356,441 358,441 361,439 363,439 368,436 370,436 373,434 375,434 381,431 391,423 394,423 395,422 399,422 400,421 402,421 403,420 403,408 402,407 402,402 398,400 395,400 394,399 387,398 383,396 380,396 379,395 372,394 371,393 369,393 368,392 365,392 364,391 355,391 354,390 344,390 343,389 336,389 335,390 333,390 332,391 330,391 329,392 327,392 326,393 324,393 323,394 321,394 320,395 318,395 317,396 315,396 314,397 309,398 295,407 293,406 286,406 285,405 281,405 281,408 280,409 280,413 279,414 279,418 278,419"],
      Leg: ["272,467 272,470 276,478 278,488 281,490 294,491 318,496 322,496 325,494 328,496 331,496 331,490 328,486 322,487 303,471 302,460 308,448 315,454 317,464 320,464 323,462 326,465 327,470 340,489 350,498 396,499 399,496 406,494 411,499 414,499 416,492 419,498 421,498 425,492 425,486 423,482 420,481 406,480 403,482 394,481 393,482 382,482 380,483 373,480 365,471 357,465 352,453 353,443 338,443 337,442 311,440 299,432 292,429 287,429 281,444 279,459"],
    },
  },
};

// Maps a 0-100 hitzone value to a heat-map color: blue (cold/low damage) up
// through yellow to red (hot/high damage). Same idea as the table's green/
// yellow/red highlight, just continuous instead of ranked.
// Ranks a monster's own hitzone values (relative, not absolute) into up to
// 3 tiers — red (top distinct value), orange (next), yellow (next) — with
// everything else falling to a neutral gray ("no particular bonus damage
// there"). Ties within a tier share that tier's color, same tie-handling
// idea as rankElementColumns() for the table above.
const HZ_SILHOUETTE_TIER_COLORS = ["#c93a2e", "#d9832a", "#d9c94a"];
const HZ_SILHOUETTE_NEUTRAL = "#4a4038";

function tierColorsByPart(hitzones, statKey) {
  // red = highest distinct value, orange = 2nd highest, yellow = everything
  // else EXCEPT the single lowest distinct value, gray = that lowest value
  // only (the "doesn't take extra damage" baseline). Confirmed with the user
  // using Rathalos: 65=red, 50=orange, 45 & 35=yellow, 25(the minimum)=gray.
  const distinctValues = [...new Set(hitzones.map(h => h[statKey] || 0))]
    .filter(v => v > 0)
    .sort((a, b) => b - a);
  const colorByValue = {};
  distinctValues.forEach((v, i) => {
    if (i === 0) colorByValue[v] = HZ_SILHOUETTE_TIER_COLORS[0];
    else if (i === 1) colorByValue[v] = HZ_SILHOUETTE_TIER_COLORS[1];
    else if (i === distinctValues.length - 1) colorByValue[v] = HZ_SILHOUETTE_NEUTRAL;
    else colorByValue[v] = HZ_SILHOUETTE_TIER_COLORS[2];
  });
  const result = {};
  for (const h of hitzones) {
    result[h.part] = colorByValue[h[statKey] || 0] || HZ_SILHOUETTE_NEUTRAL;
  }
  return result;
}

// which stat column feeds the silhouette colors — shared across renders so
// the choice survives a monster switch, even though only Rathalos has a
// shape to show it on right now
let hzSilhouetteStat = "sever";

// physical damage-type icons (sourced from the MHWorld wiki, since MH Rise's
// own wiki doesn't have standalone cut/blunt/ammo icons) -- elements and
// stun already have icons via elementIconTag()/statusIconTag(), only these
// 3 needed their own local files
const HZ_PHYS_ICONS = {
  sever: "data/images/icons/dmg-sever.png",
  blunt: "data/images/icons/dmg-blunt.png",
  projectile: "data/images/icons/dmg-projectile.png",
};
function hzStatIconTag(key) {
  if (HZ_PHYS_ICONS[key]) return `<img class="status-icon" src="${HZ_PHYS_ICONS[key]}" alt="" loading="lazy">`;
  if (HITZONE_ELEMENT_COLS.includes(key)) return elementIconTag(key);
  if (key === "stun") return statusIconTag("Stun");
  return "";
}

function hzStatLabel(key) {
  return HITZONE_ELEMENT_COLS.includes(key) ? trElement(key) : ui("hz" + key[0].toUpperCase() + key.slice(1));
}
// full (non-abbreviated) version, used by the silhouette toggle buttons —
// the hitzone table stays abbreviated ("Contund.") since its columns are
// narrow, but the toggle has room to spell it out ("Contundente")
function hzStatLabelFull(key) {
  const capitalized = "hz" + key[0].toUpperCase() + key.slice(1) + "Full";
  return HITZONE_ELEMENT_COLS.includes(key) ? trElement(key) : (I18N.ui[lang][capitalized] || hzStatLabel(key));
}

function renderHitzoneSilhouette(container, monster) {
  const shape = HITZONE_SHAPES[monster.name];
  if (!shape || !monster.hitzones || !monster.hitzones.length) {
    container.innerHTML = "";
    return;
  }

  const statKey = hzSilhouetteStat;
  const byPart = {};
  for (const h of monster.hitzones) byPart[h.part] = h;
  const colorByPart = tierColorsByPart(monster.hitzones, statKey);

  const polys = Object.entries(shape.parts).map(([part, pointSets]) => {
    const hz = byPart[part];
    const val = hz ? (hz[statKey] ?? 0) : 0;
    const color = colorByPart[part] || HZ_SILHOUETTE_NEUTRAL;
    const label = `${trBodyPart(part)}: ${hzStatLabel(statKey)} ${val}%`;
    return pointSets.map(pts => `
      <polygon points="${pts}" fill="${color}" stroke="#14110f" stroke-width="2" data-part="${part}">
        <title>${escapeAttr(label)}</title>
      </polygon>
    `).join("");
  }).join("");

  const statOptions = [...HITZONE_PHYSICAL_COLS, ...HITZONE_ELEMENT_COLS, "stun"];
  const tabButtons = statOptions.map(key =>
    `<button type="button" class="hz-silhouette-stat-tab${key === statKey ? " active" : ""}" data-stat="${key}">${hzStatIconTag(key)}${escapeAttr(hzStatLabelFull(key))}</button>`
  ).join("");

  container.innerHTML = `
    <div class="hz-silhouette-stat-picker">
      <span class="hz-silhouette-stat-picker-label">${ui("hzSilhouetteStatLabel")}</span>
      <div class="hz-silhouette-stat-tabs">${tabButtons}</div>
    </div>
    <svg class="hz-silhouette" viewBox="${shape.viewBox}" xmlns="http://www.w3.org/2000/svg">
      ${polys}
      ${shape.decor || ""}
    </svg>
  `;

  container.querySelectorAll(".hz-silhouette-stat-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      hzSilhouetteStat = btn.dataset.stat;
      renderHitzoneSilhouette(container, monster);
    });
  });
}

function renderHitzones(container, hitzones) {
  if (!hitzones || !hitzones.length) {
    container.innerHTML = `<p class="no-data">${ui("noDataYet")}</p>`;
    return;
  }
  const colClass = rankElementColumns(hitzones);
  const cols = [
    ...HITZONE_PHYSICAL_COLS.map(k => ({ key: k, label: ui("hz" + k[0].toUpperCase() + k.slice(1)) })),
    ...HITZONE_ELEMENT_COLS.map(k => ({ key: k, label: trElement(k) })),
    { key: "stun", label: ui("hzStun") },
  ];

  const theadCells = cols.map(c => `<th class="${colClass[c.key] || ""}">${hzStatIconTag(c.key)}${c.label}</th>`).join("");
  const bodyRows = hitzones.map(row => {
    const cells = cols.map(c => `<td class="${colClass[c.key] || ""}">${row[c.key] ?? "—"}%</td>`).join("");
    return `<tr><td class="material-name">${trBodyPart(row.part)}</td>${cells}</tr>`;
  }).join("");

  container.innerHTML = `
    <div class="hitzones-table-scroll">
      <table class="hitzones-table">
        <thead><tr><th>${ui("hzPart")}</th>${theadCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `;
}

function renderMaterialsTable(tbody, rows) {
  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="no-data">${ui("noMaterialsForRank")}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="material-name">${materialIconTag(r.material)}${trMaterial(r.material) || ""}</td>
      <td>${r.rarity ?? "—"}</td>
      <td>${annotateAnomalyLevel(trPartTokens(r.targetReward), r.material) || "—"}</td>
      <td>${annotateAnomalyLevel(trPartTokens(r.capture), r.material) || "—"}</td>
      <td>${annotateAnomalyLevel(trPartTokens(r.breakParts), r.material) || "—"}</td>
      <td>${annotateAnomalyLevel(trPartTokens(r.carves), r.material) || "—"}</td>
      <td>${annotateAnomalyLevel(trPartTokens(r.dropped), r.material) || "—"}</td>
    </tr>
  `).join("");
}

init();
