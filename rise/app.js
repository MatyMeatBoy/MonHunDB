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
const homeViewEl = document.getElementById("home-view");
const brandHomeEl = document.getElementById("brand-home");
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
let materialObtainNotes = {};

const weaponsNavToggleEl = document.getElementById("weapons-nav-toggle");
const weaponsViewEl = document.getElementById("weapons-view");
const weaponsBackEl = document.getElementById("weapons-back");
const weaponsSearchEl = document.getElementById("weapons-search");
const weaponsIndexEl = document.getElementById("weapons-index");
const weaponDetailEl = document.getElementById("weapon-detail");
const armorNavToggleEl = document.getElementById("armor-nav-toggle");
const armorViewEl = document.getElementById("armor-view");
const armorBackEl = document.getElementById("armor-back");
const armorSearchEl = document.getElementById("armor-search");
const armorIndexEl = document.getElementById("armor-index");
const armorSetDetailEl = document.getElementById("armor-set-detail");
const materialsNavToggleEl = document.getElementById("materials-nav-toggle");
const materialsViewEl = document.getElementById("materials-view");
const materialsBackEl = document.getElementById("materials-back");
const materialsSearchEl = document.getElementById("materials-search");
const materialsIndexEl = document.getElementById("materials-index");
const materialDetailEl = document.getElementById("material-detail");
const skillsNavToggleEl = document.getElementById("skills-nav-toggle");
const skillsViewEl = document.getElementById("skills-view");
const skillsBackEl = document.getElementById("skills-back");
const skillsSearchEl = document.getElementById("skills-search");
const skillsIndexEl = document.getElementById("skills-index");
const skillDetailEl = document.getElementById("skill-detail");
let skills = [];
let skillsByName = new Map();
let weapons = [];
let armorPieces = [];
let armorSets = [];
let weaponsById = new Map();
const ARMOR_PART_ORDER = ["head", "chest", "arms", "waist", "legs"];

function hideViews(...els) {
  for (const el of els) if (el) el.hidden = true;
}

function navMonster(name, rank) {
  const u = new URL("monster", location.href);
  u.searchParams.set("m", name);
  if (rank) u.searchParams.set("rank", rank);
  location.href = u.href;
}
function navMaterial(key) {
  const u = new URL("materials", location.href);
  u.searchParams.set("mat", key);
  location.href = u.href;
}
function navDecoration(id) {
  const u = new URL("decorations", location.href);
  u.searchParams.set("d", id);
  location.href = u.href;
}
function navWeapon(id) {
  const u = new URL("weapons", location.href);
  u.searchParams.set("w", id);
  location.href = u.href;
}
function navArmorSet(name) {
  const u = new URL("armor", location.href);
  u.searchParams.set("set", name);
  location.href = u.href;
}
function navArmorPiece(id) {
  const u = new URL("armor", location.href);
  u.searchParams.set("piece", id);
  location.href = u.href;
}
function navSkill(idOrName) {
  const u = new URL("skills", location.href);
  u.searchParams.set("skill", idOrName);
  location.href = u.href;
}

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
  root.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.dataset.i18nTitle;
    const val = I18N.ui[lang][key];
    if (typeof val === "string") el.setAttribute("title", val);
  });
}

function applyUiStrings() {
  applyI18nText(document);
  document.documentElement.lang = lang;
  triggerEl.setAttribute("aria-label", ui("selectPlaceholder"));
  if (searchEl) searchEl.placeholder = ui("searchPlaceholder");
  if (gsInputEl) gsInputEl.placeholder = ui("globalSearchPlaceholder");
  if (decorationsSearchEl) decorationsSearchEl.placeholder = ui("decorationsSearchPlaceholder");
  if (weaponsSearchEl) weaponsSearchEl.placeholder = ui("weaponsSearchPlaceholder");
  if (armorSearchEl) armorSearchEl.placeholder = ui("armorSearchPlaceholder");
  if (materialsSearchEl) materialsSearchEl.placeholder = ui("materialsSearchPlaceholder");
  if (skillsSearchEl) skillsSearchEl.placeholder = ui("skillsSearchPlaceholder");
  if (!selectedMonster) triggerLabelEl.textContent = ui("selectPlaceholder");
  langToggleEl.querySelectorAll(".lang-opt").forEach(el => {
    el.classList.toggle("active", el.dataset.lang === lang);
  });
  langToggleEl.dataset.lang = lang;
  brandHomeEl.setAttribute("aria-label", ui("brandHomeLabel"));
  renderNews();
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
    const [monstersRes, smallRes, decorationsRes, obtainNotesRes, weaponsRes, armorPiecesRes, armorSetsRes, skillsRes, weaponTreeRes] = await Promise.all([
      fetch("data/monsters.json"),
      fetch("data/small_monsters.json"),
      fetch("data/decorations.json"),
      fetch("data/material_obtain_notes.json"),
      fetch("data/weapons.json"),
      fetch("data/armor_pieces.json"),
      fetch("data/armor_sets.json"),
      fetch("data/skills.json"),
      fetch("data/weapon_tree.json"),
      loadMaterialTranslations(),
      loadIconManifest(),
      loadStatusIconManifest(),
      loadMaterialIconManifest(),
      loadMhriceIconMaps(),
      loadArmorFextraIcons(),
    ]);
    if (!monstersRes.ok) throw new Error("HTTP " + monstersRes.status);
    monsters = await monstersRes.json();
    if (smallRes.ok) monsters = monsters.concat(await smallRes.json());
    decorations = decorationsRes.ok ? await decorationsRes.json() : [];
    materialObtainNotes = obtainNotesRes.ok ? await obtainNotesRes.json() : {};
    weapons = weaponsRes.ok ? await weaponsRes.json() : [];
    armorPieces = armorPiecesRes.ok ? await armorPiecesRes.json() : [];
    armorSets = armorSetsRes.ok ? await armorSetsRes.json() : [];
    skills = skillsRes.ok ? await skillsRes.json() : [];
    weaponsById = new Map(weapons.map(w => [w.id, w]));
    skillsByName = new Map(skills.filter(s => s.name).map(s => [s.name, s]));
    if (weaponTreeRes.ok) initWeaponTree(await weaponTreeRes.json());
  } catch (err) {
    triggerLabelEl.textContent = ui("selectError");
    if (detailEl) detailEl.innerHTML = `<p class="empty-state">${I18N.ui[lang].loadError(err.message)}</p>`;
    return;
  }

  buildSelector();
  initCombobox();
  buildMaterialIndex();
  initGlobalSearch();
  bootPage();

  langToggleEl.addEventListener("click", () => {
    lang = lang === "es" ? "en" : "es";
    localStorage.setItem("mh-lang", lang);
    location.reload();
  });
}

const PAGE = document.body.dataset.page || "home";

function bootPage() {
  if (PAGE === "monster") {
    const params = new URLSearchParams(location.search);
    const m = params.get("m");
    const rank = params.get("rank");
    if (rank) currentRank = rank;
    if (m && monsters.some(x => x.name === m)) {
      selectMonster(m, { render: true });
    } else if (detailEl) {
      detailEl.innerHTML = `<p class="empty-state">${I18N.ui[lang].emptyState}</p>`;
    }
  } else if (PAGE === "decorations") {
    bootDecorations();
  } else if (PAGE === "weapons") {
    bootWeapons();
  } else if (PAGE === "armor") {
    bootArmor();
  } else if (PAGE === "materials") {
    bootMaterials();
  } else if (PAGE === "skills") {
    bootSkills();
  } else {
    renderNews();
  }
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

let materialMhriceIcons = {};
let decorationMhriceIcons = {};
async function loadMhriceIconMaps() {
  try {
    const [mRes, dRes] = await Promise.all([
      fetch("data/material_mhrice_icons.json"),
      fetch("data/decoration_mhrice_icons.json"),
    ]);
    if (mRes.ok) materialMhriceIcons = await mRes.json();
    if (dRes.ok) decorationMhriceIcons = await dRes.json();
  } catch (e) {
    console.warn("No se pudieron cargar los mapeos de íconos MHRice", e);
  }
}

// Fallback icon source for armor pieces whose Kiranico icon 404s (Kiranico
// never rendered ~233 pieces, mostly Buddy/layered/collab gear). Maps
// armor piece id -> local filename in data/images/armor_fextra/, sourced
// from Fextralife (see data/download_armor_fextra_icons.js). Kiranico
// stays the primary/first choice always -- armorIconTag() only falls back
// to this on the Kiranico <img> onerror.
let armorFextraIcons = {};
async function loadArmorFextraIcons() {
  try {
    const res = await fetch("data/armor_fextra_icons.json");
    if (res.ok) {
      const manifest = await res.json();
      armorFextraIcons = {};
      for (const id of Object.keys(manifest)) armorFextraIcons[id] = true;
    }
  } catch (e) {
    console.warn("No se pudo cargar el manifiesto de íconos de armadura (Fextralife fallback)", e);
  }
}

// same 2-layer mask+color technique as skillIconTag() -- MHRice materials
// and decorations DO have real per-item icon art (unlike skills), but a
// small set of icon shapes gets reused across many items (ex. 27 unique
// shapes cover all 831+243 matched materials/decorations), differentiated
// by the mh-item-color-N tint, same as the game's own UI does it
function itemMaskIconTag(iconId, colorIndex, sizeClass) {
  const hex = MH_ITEM_COLOR[colorIndex] ?? "#AEAEAE";
  const cls = sizeClass ? `item-mask-icon ${sizeClass}` : "item-mask-icon";
  return `<span class="${cls}"><span class="item-mask-icon-r" style="background-color:${hex};-webkit-mask-image:url('data/images/item_masks/${iconId}.r.png');mask-image:url('data/images/item_masks/${iconId}.r.png')"></span><span class="item-mask-icon-a" style="-webkit-mask-image:url('data/images/item_masks/${iconId}.a.png');mask-image:url('data/images/item_masks/${iconId}.a.png')"></span></span>`;
}

function materialIconTag(name) {
  const mh = materialMhriceIcons[name] || materialMhriceIcons[normalizeMaterialKey(name)];
  if (mh) return itemMaskIconTag(mh.iconId, mh.color, "material-icon");
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
  closePanel();
  listEl.querySelectorAll(".monster-option").forEach(el => {
    el.classList.toggle("selected", el.dataset.name === name);
  });
  if (opts.render) {
    const monster = monsters.find(m => m.name === name);
    if (!monster) return;
    hideViews(homeViewEl, decorationsViewEl, weaponsViewEl, armorViewEl, materialsViewEl, skillsViewEl);
    detailEl.hidden = false;
    triggerIconEl.src = iconPath(name);
    triggerIconEl.hidden = false;
    triggerIconEl.onerror = () => { triggerIconEl.hidden = true; };
    triggerLabelEl.textContent = trMonsterName(name);
    renderMonster(name);
  } else {
    navMonster(name);
  }
}

function openPanel() {
  triggerEl.hidden = true;
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
  triggerEl.hidden = false;
  panelEl.hidden = true;
  triggerEl.setAttribute("aria-expanded", "false");
}

function filterOptions(query) {
  const q = normalizeSearch(query.trim());
  let anyVisible = false;
  let anyGroupVisible = false;
  listEl.querySelectorAll(".monster-group").forEach(group => {
    let groupHasVisible = false;
    group.querySelectorAll(".monster-option").forEach(opt => {
      const match = !q || (opt.dataset.search || "").includes(q);
      opt.hidden = !match;
      if (match) groupHasVisible = true;
    });
    group.hidden = !groupHasVisible;
    if (groupHasVisible) anyVisible = anyGroupVisible = true;
  });
  // Small monsters are direct .monster-option siblings (not inside a .monster-group)
  let anySmallVisible = false;
  listEl.querySelectorAll(":scope > .monster-option").forEach(opt => {
    const match = !q || (opt.dataset.search || "").includes(q);
    opt.hidden = !match;
    if (match) anyVisible = anySmallVisible = true;
  });
  listEl.querySelectorAll(".monster-section-heading").forEach(heading => {
    const isBig = heading.dataset.section === "big";
    heading.hidden = q && (isBig ? !anyGroupVisible : !anySmallVisible);
  });
  const noResults = listEl.querySelector(".no-results");
  if (noResults) noResults.hidden = anyVisible;
}

function selectFirstVisibleOption() {
  const visible = [...listEl.querySelectorAll(".monster-option")].find(o => !o.hidden);
  if (visible) {
    selectMonster(visible.dataset.name);
    closePanel();
  }
}

function initCombobox() {
  triggerEl.addEventListener("click", () => {
    if (panelEl.hidden) openPanel();
    else closePanel();
  });

  searchEl.addEventListener("input", () => filterOptions(searchEl.value));

  searchEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      selectFirstVisibleOption();
    }
  });

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

// Equipment (decorations/weapons/armor) sometimes crafts with the "+" tier
// of a material (ex. "Great Wroggi Brace +") that never appears as its own
// row in monsters.json -- our scrape only has drop tables for base-rank
// materials, not the Anomaly-Investigation-only "+" upgrades. Those "+"
// materials still come from the exact same monster as their base version
// (just via Anomaly Investigations instead of a normal hunt), so falling
// back to the base material's sources is more accurate than showing "no
// monster gives this" for a material we can clearly attribute.
function getMaterialSources(materialName) {
  if (!materialIndex) buildMaterialIndex();
  const key = normalizeMaterialKey(materialName);
  let sources = materialIndex.get(key) || [];
  let isPlusTierFallback = false;
  if (!sources.length && key.endsWith("+")) {
    const baseSources = materialIndex.get(key.slice(0, -1));
    if (baseSources && baseSources.length) {
      sources = baseSources;
      isPlusTierFallback = true;
    }
  }
  return { sources, isPlusTierFallback };
}

let skillGrantIndex = null;
function buildSkillGrantIndex() {
  skillGrantIndex = new Map();
  const add = (skillName, entry) => {
    if (!skillGrantIndex.has(skillName)) skillGrantIndex.set(skillName, { decorations: [], armorPieces: [] });
    skillGrantIndex.get(skillName)[entry.kind === "decoration" ? "decorations" : "armorPieces"].push(entry);
  };
  for (const dec of decorations) {
    for (const s of dec.skills || []) {
      if (!s.name) continue;
      add(s.name, { kind: "decoration", id: dec.id, level: s.level });
    }
  }
  for (const p of armorPieces) {
    for (const s of p.skills || []) {
      if (!s.name) continue;
      add(s.name, { kind: "armorPiece", id: p.id, level: s.level });
    }
  }
}

// ---------- Monster <-> Weapon/Armor associations ----------
// Neither weapons.json nor armor_pieces.json name the monster they're crafted
// from directly (set names are often flavor text, ex. "Tempest Set" for
// Amatsu, not "Amatsu Set") -- so the association is inferred from which
// monster supplies most of the crafting materials, using materialIndex
// (already built from monsters.json) as the source of truth.

// same rank-suffix stripping as scrape_armor.js's slot classifier, needed
// here to re-group armor_pieces.json into 5-piece sets: armor_sets.json only
// has the 62 sets matched to a Fextralife image, but plenty of real sets
// (like Tempest) never matched due to inconsistent Fextralife naming -- this
// reconstructs ALL sets straight from the pieces themselves, image or not
function coreArmorNameForGrouping(name) {
  let n = name;
  let changed = true;
  while (changed) {
    changed = false;
    const stripped = n
      .replace(/\s*-\s*[A-Za-z]+$/, "")
      .replace(/\s*\([^)]*\)\s*$/, "");
    if (stripped !== n) { n = stripped; changed = true; }
  }
  return n.trim();
}
// armor-set prefix: strips trailing armor-part words (some multi-word like
// "Head Scarf") and normalizes Pukei-Pukei->Pukei (base/S). Result is the set
// name alone (no part word), ready for display/grouping.
const ARMOR_PART_WORDS = /^(Head|Mail|Vambraces|Braces|Armguards|Coil|Greaves|Garb|Obi|Leggings|Scarf|Crown|Robe|Sleeves|Hakama|Mask|Hat|Hood|Suit|Gloves|Skirt|Socks|Boots|Earrings|Cuirass|Belt|Faulds|Sash|Sandals|Vest|Helm|Cap|Shawl|Arms|Chest|Legs|Waist|Haori|Kote|Jersey|Shoes|Shirt|Pants|Cover|Tassets|Lobos|Patch|Headdress|Choker|Headgear|Hair-tie|Hair|Tie|Hope|Prayer|Feet|Barrette|Leg|Wrap|Guards|Jacket)$/i;
const ARMOR_SET_HIDDEN = new Set(["Swallow", "Sonic", "Floral", "Buff", "Buff Body", "Elgado", "Akuma's", "Arlow", "Azure", "Azure Age", "Blossom", "Dragonsbane", "Fall", "Fiorayne", "Formal Dragon", "Guild Cross", "Hinoa", "Kamura Cloak", "Lance Gunn", "Minoto", "Orion", "Ran Page", "Summer", "Wild"]);
function armorSetPrefix(name) {
  // keep female variants (Spring)/(Light) as their own set — capture before
  // core() strips trailing "(text)"
  const v = name.match(/\s*\((Spring|Light)\)\s*$/);
  const vSuffix = v ? " (" + v[1] + ")" : "";
  let n = coreArmorNameForGrouping(name);
  const m = n.match(/\s+(S|X|SP)$/);
  const suffix = m ? " " + m[1] : "";
  if (m) n = n.slice(0, m.index);
  let prev = "";
  while (prev !== n) {
    prev = n;
    const words = n.split(" ");
    if (words.length > 1 && ARMOR_PART_WORDS.test(words[words.length - 1])) n = words.slice(0, -1).join(" ");
  }
  n = n.replace(/^Pukei-Pukei(?! X)/, "Pukei");
  if (suffix === " X") n = n.replace(/^Pukei$/, "Pukei-Pukei");
  n = n.replace(/^Kadachi/, "Tobi-Kadachi").replace(/^Lecturer's$/, "Lecturer").replace(/^Holy Ire/, "Divine Ire");
  return (n.trim() + suffix).trim() + vSuffix;
}

// Map implicit-set prefix (the `prefix` before "Set") to the actual image file
// basename in data/images/armor_sets/. Covers special cases where the Fextralife
// image name differs from the implicit prefix.
const ARMOR_SET_IMG_OVERRIDES = {
  "Silver Set": "silver-sol", "Silver S Set": "silver-sol", "Silver X Set": "silver-sol",
  "Golden S Set": "golden", "Golden Set": "golden", "Golden Lune Set": "golden-lune-x", "Golden Lune X Set": "golden-lune-x",
  "Ibushi S Set": "ibushi", "Ibushi X Set": "ibushi", "Ibushi Set": "ibushi", "Ibushi - Pure Set": "ibushi-pure",
  "Narwa S Set": "narwa", "Narwa X Set": "narwa", "Narwa Set": "narwa", "Narwa - Pure Set": "narwa-pure",
  "Skalda Set": "skalda-x", "Skalda S Set": "skalda-x", "Skalda X Set": "skalda-x",
  "Spio X Set": "spio",
  "Kamura Set": "kamura", "Kamura S Set": "kamura", "Kamura Legacy Set": "kamura-legacy",
  "Uroktor Set": "uroktor", "Uroktor S Set": "uroktor", "Uroktor X Set": "uroktor",
  "Edel Set": "edel", "Edel S Set": "edel", "Edel X Set": "edel",
  "Royal Ludroth Set": "royal-ludroth", "Royal Ludroth S Set": "royal-ludroth", "Royal Ludroth X Set": "royal-ludroth",
  "Brigade Set": "brigade", "Brigade S Set": "brigade", "Brigade X Set": "brigade",
  "Medium Set": "medium", "Medium S Set": "medium", "Medium (Light) Set": "medium",
  "Lambent Set": "lucent-narga", "Nephilim Set": "chaotic-gore",
  "Bazelgeuse Set": "bazelgeuse", "Bazel Set": "bazelgeuse",
  "Jyuratodus Set": "jyuratodus", "Jyura Set": "jyuratodus",
  "Bullfango Mask Set": "bullfango-mask",
  "Hunter's Set": "hunter", "Hunter's S Set": "hunter-s", "Hunter's X Set": "hunter-x",
  "Channeler's Set": "channeler", "Channeler's S Set": "channeler", "Channeler (Spring) Set": "channeler",
  "Knight Squire Set": "knight-squire", "Heavy Knight Set": "heavy-knight",
  "Base Commander Set": "base-commander", "Garangolm Set": "garangolm",
  "Royal Artillery Corps Set": "royal-artillery", "Artillery Corps Set": "royal-artillery",
  "Gore Magala Set": "gore-magala", "Seregios Set": "seregios",
  "Rakna-Kadaki Set": "rakna-kadaki", "Rakna-Kadaki X Set": "rakna-kadaki-x",
  "Chaotic Gore Set": "chaotic-gore", "Chaotic Gore Magala Set": "chaotic-gore",
  "Silver Sol Set": "silver-sol", "Silver Sol S Set": "silver-sol-s", "Silver Sol X Set": "silver-sol-x",
  "Arc Set": "arc", "Auroracanth Set": "auroracanth", "Espinas Set": "espinas",
  "Flaming Espinas Set": "flaming-espinas", "Lucent Narga Set": "lucent-narga",
  "Charite Set": "charite", "Charité Set": "charite",
  "Primordial Set": "primordial", "Risen Kaiser Set": "risen-kaiser", "Risen Kushala Set": "risen-kushala",
  "Risen Mizuha Set": "risen-mizuha",
  "Squire's Set": "knight-squire", "Knight Squire Set": "knight-squire",
  "Scholar's Set": "scholar", "Scholarly Set": "scholarly-set",
  "Golm Set": "garangolm", "Garangolm Set": "garangolm",
  "Rakna Set": "rakna-kadaki", "Rakna X Set": "rakna-kadaki-x", "Rakna-Kadaki X Set": "rakna-kadaki-x",
  "Utsushi Set": "utsushi-visible", "Utsushi True Set": "utsushi-true-visible", "Utsushi True (Hidden) Set": "utsushi-true-hidden", "Utsushi True (Visible) Set": "utsushi-true-visible", "Utsushi (Hidden) Set": "utsushi-hidden", "Utsushi (Visible) Set": "utsushi-visible",
  "S. Studded Set": "", "S. Studded S Set": "", "S. Studded X Set": "",
  "Pukei-Pukei X Set": "pukei-pukei-x", "Pukei-Pukei Set": "pukei", "Pukei-Pukei S Set": "pukei-s",
  "Tobi-Kadachi Set": "tobi-kadachi-x", "Tobi-Kadachi S Set": "tobi-kadachi-x", "Tobi-Kadachi X Set": "tobi-kadachi-x",
};
const ARMOR_SET_DISPLAY_MAP = { "S. Studded": "Shell Studded", "Squire's": "Knight Squire", "Scholar's": "Scholar", "Golm": "Garangolm", "Rakna": "Rakna-Kadaki", "Artillery Corps": "Royal Artillery Corps", "Chaotic": "Chaotic Gore Magala", "Gore": "Gore Magala", "Hoplite's": "Heavy Knight", "Professor's": "Professor", "Regios": "Seregios", "Outpost HQ": "Base Commander", "Ibushi's": "Ibushi", "Ibushi's Pure": "Ibushi - Pure", "Narwa's": "Narwa", "Narwa's Pure": "Narwa - Pure", "Lecturer": "Lecture", "Lecturer's": "Lecture", "Divine Ire": "Grand Divine Ire", "Channeler's": "Channeler", "Channeler's (Spring)": "Channeler (Spring)", "Medium's": "Medium", "Medium's (Light)": "Medium (Light)", "Charité": "Charite" };
function armorSetDisplayName(prefix) {
  // split optional rank suffix (S/X) so it maps + reapplies for ALL variants
  const m = prefix.match(/^(.*?)\s+(S|X)$/);
  const base = m ? m[1] : prefix;
  const rank = m ? " " + m[2] : "";
  return (ARMOR_SET_DISPLAY_MAP[base] || base) + rank + " Set";
}
function armorSetImg(name) {
  const override = ARMOR_SET_IMG_OVERRIDES[name];
  if (override) return `data/images/armor_sets/${override}.png`;
  // S and X variants reuse the base (vanilla) image: "X Set" -> try x file,
  // else fall back to the base file
  const m = name.match(/^(.+?)\s+([SX]) Set$/);
  if (m) {
    const base = m[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `data/images/armor_sets/${base}.png`;
  }
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").replace(/-set$/, "");
  return `data/images/armor_sets/${s}.png`;
}

let impliedArmorGroupsCache = null;
function buildImpliedArmorGroups() {
  if (impliedArmorGroupsCache) return impliedArmorGroupsCache;
  const groups = [];
  let i = 0;
  while (i < armorPieces.length) {
    const prefix = armorSetPrefix(armorPieces[i].name);
    let j = i;
    const bucket = [];
    while (j < armorPieces.length && bucket.length < 5) {
      const p = armorPieces[j];
      const pPrefix = armorSetPrefix(p.name);
      if (pPrefix !== prefix) break;
      bucket.push(p);
      j++;
    }
    if (bucket.length === 5 && new Set(bucket.map(x => x.part)).size === 5 && prefix) {
      groups.push({ prefix, pieces: bucket });
    }
    i = j > i ? j : i + 1;
  }
  // dedupe by prefix+pieces: armor_pieces.json lists some sets twice (Rakna,
  // Utsushi, Valstrax, Mosgharl, Ibushi's, Narwa's, Golden, etc.) and hide
  // layered-armor-only sets (Swallow, Sonic, Floral, Buff, Elgado, ...)
  // dedupe by prefix only (M/F variants produce duplicate groups with different IDs)
  const seen = new Set();
  impliedArmorGroupsCache = groups.filter(g => {
    if (ARMOR_SET_HIDDEN.has(g.prefix)) return false;
    if (seen.has(g.prefix)) return false;
    seen.add(g.prefix);
    return true;
  });
  return impliedArmorGroupsCache;
}

let partialArmorGroupsCache = null;
function buildPartialArmorGroups() {
  if (partialArmorGroupsCache) return partialArmorGroupsCache;
  // sets that have some pieces but not the full 5 (e.g. Jaggi Set)
  const buckets = new Map();
  for (const p of armorPieces) {
    const prefix = armorSetPrefix(p.name);
    if (!prefix) continue;
    if (!buckets.has(prefix)) buckets.set(prefix, []);
    if (!buckets.get(prefix).some(x => x.id === p.id)) buckets.get(prefix).push(p);
  }
  const partial = [];
  for (const [prefix, pieces] of buckets) {
    if (pieces.length >= 2 && pieces.length < 5 && new Set(pieces.map(x => x.part)).size >= 2 && prefix) {
      partial.push({ prefix, pieces });
    }
  }
  // exclude sets already fully represented (implied groups use the same pieces)
  // and hide layered-armor-only sets. Also exclude sets that have an explicit
  // entry in armor_sets.json to prevent duplicates.
  const fullKeys = new Set(buildImpliedArmorGroups().map(g => g.prefix));
  const explicitPrefixes = new Set(armorSets.map(s => s.name.replace(/\s+Set$/i, "")));
  partialArmorGroupsCache = partial.filter(g => !fullKeys.has(g.prefix) && !explicitPrefixes.has(g.prefix) && !ARMOR_SET_HIDDEN.has(g.prefix));
  return partialArmorGroupsCache;
}

// tallies, across a list of {material, qty} rows, how many reference each
// monster as a source (via materialIndex) -- returns [[monsterName, count]]
// sorted descending
function tallyMonstersForMaterials(materials) {
  if (!materialIndex) buildMaterialIndex();
  const counts = new Map();
  for (const m of materials || []) {
    const { sources } = getMaterialSources(m.material);
    const seenForThisMat = new Set();
    for (const s of sources) {
      if (seenForThisMat.has(s.monster)) continue;
      seenForThisMat.add(s.monster);
      counts.set(s.monster, (counts.get(s.monster) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

let monsterEquipmentIndexCache = null;
function buildMonsterEquipmentIndex() {
  if (monsterEquipmentIndexCache) return monsterEquipmentIndexCache;
  const index = new Map();
  const add = (monsterName, kind, item) => {
    if (!index.has(monsterName)) index.set(monsterName, { weapons: [], armorGroups: [] });
    index.get(monsterName)[kind].push(item);
  };

  for (const w of weapons) {
    if (!isWeaponTrueFinal(w) || !w.materials || !w.materials.length) continue;
    const tally = tallyMonstersForMaterials(w.materials);
    if (!tally.length) continue;
    const [topMonster, topCount] = tally[0];
    // require the top monster to clearly dominate this weapon's material
    // list, not just be one of several incidental sources
    if (topCount >= 2 && topCount >= w.materials.length * 0.4) add(topMonster, "weapons", w);
  }

  for (const group of buildImpliedArmorGroups()) {
    const allMats = group.pieces.flatMap(p => p.materials || []);
    if (!allMats.length) continue;
    const tally = tallyMonstersForMaterials(allMats);
    if (!tally.length) continue;
    const [topMonster, topCount] = tally[0];
    if (topCount >= 3) {
      // prefer a matching real armor_sets.json entry (has a Fextralife
      // image) if its pieces overlap this group, else fall back to the
      // group's own piece list with no set image
      const pieceIds = new Set(group.pieces.map(p => p.id));
      const matchedSet = armorSets.find(s => s.pieces.filter(ref => pieceIds.has(ref.id)).length >= 3);
      add(topMonster, "armorGroups", matchedSet ? { name: matchedSet.name, image: matchedSet.localImage || matchedSet.image, isRealSet: true } : { name: armorSetDisplayName(group.prefix), image: armorSetImg(armorSetDisplayName(group.prefix)), pieces: group.pieces, isRealSet: false });
    }
  }

  monsterEquipmentIndexCache = index;
  return index;
}

function renderRelatedEquipment(monsterName, container, sectionEl) {
  const index = buildMonsterEquipmentIndex();
  const entry = index.get(monsterName);
  if (!entry || (!entry.weapons.length && !entry.armorGroups.length)) {
    sectionEl.hidden = true;
    return;
  }
  sectionEl.hidden = false;

  let html = "";
  if (entry.weapons.length) {
    html += `<h4 class="subhead">${ui("relatedEquipmentWeapons")}</h4><div class="decorations-grid">`;
    html += entry.weapons.map(w => `
      <button type="button" class="decoration-card" data-related-weapon="${w.id}">
        ${weaponIconTag(w)}
        <span class="decoration-card-name">${trWeaponName(w)}</span>
        <span class="decoration-card-skill">${w.type}</span>
      </button>
    `).join("");
    html += `</div>`;
  }
  if (entry.armorGroups.length) {
    html += `<h4 class="subhead">${ui("relatedEquipmentArmor")}</h4><div class="decorations-grid">`;
    html += entry.armorGroups.map((g, i) => `
      <button type="button" class="decoration-card armor-set-card" data-related-armor="${i}">
        ${g.image ? `<img class="armor-set-thumb" src="${g.image}" alt="" loading="lazy" onerror="this.style.display='none'">` : armorIconTag(g.pieces[0])}
        <span class="decoration-card-name">${g.name}</span>
      </button>
    `).join("");
    html += `</div>`;
  }
  container.innerHTML = html;

  container.querySelectorAll("[data-related-weapon]").forEach(btn => {
    btn.addEventListener("click", () => navWeapon(btn.dataset.relatedWeapon));
  });
  container.querySelectorAll("[data-related-armor]").forEach(btn => {
    btn.addEventListener("click", () => {
      const g = entry.armorGroups[btn.dataset.relatedArmor];
      navArmorSet(g.name);
    });
  });
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function wrapXn(str) {
  if (!str) return str;
  // Normalize: remove redundant x1, convert bare xN to [xN]
  str = str.replace(/\bx1\b/g, "").replace(/\s+/g, " ").trim();
  str = str.replace(/\bx(\d+)\b/g, "[x$1]");
  return str.replace(/\(x(\d+)\)|\[x(\d+)\]/g, (whole, a, b) => {
    const n = a || b;
    return `<span class="gs-xn" title="${escapeAttr(I18N.ui[lang].gsXnTooltip(n))}">(x${n})</span>`;
  });
}

function summarizeRow(row, material) {
  // annotate with the Anomaly level range (ex. "Nvl. 51-100") the same way
  // the monster's own materials table does, so searching straight to an
  // Afflicted material shows which level it drops at without having to
  // click through to that monster's page first
  const ann = (text) => material ? annotateAnomalyLevel(trPartTokens(text), material) : trPartTokens(text);
  const parts = [];
  if (row.targetReward) parts.push(`${ui("colTarget")} ${wrapXn(ann(row.targetReward))}`);
  if (row.capture) parts.push(`${ui("colCapture")} ${wrapXn(ann(row.capture))}`);
  if (row.breakParts) parts.push(`${ui("colBreak")} ${wrapXn(ann(row.breakParts))}`);
  if (row.carves) parts.push(`${ui("colCarve")} ${wrapXn(ann(row.carves))}`);
  if (row.dropped) parts.push(`${ui("colDropped")} ${wrapXn(ann(row.dropped))}`);
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
  const matchedMonsterSet = new Set(monsterMatches.map(m => m.name));
  for (const [matName, sources] of materialIndex.entries()) {
    const esName = trMaterial(matName);
    if (normalizeSearch(matName).includes(q) || normalizeSearch(esName).includes(q)) {
      materialMatches.push({ matName, esName, sources });
    }
  }
  // also include materials dropped by the matched monsters (e.g. searching
  // "magnamalo" surfaces "Sinister Scale" from Scorned Magnamalo even though
  // the material name doesn't contain the query)
  if (monsterMatches.length) {
    for (const [matName, sources] of materialIndex.entries()) {
      if (materialMatches.some(x => x.matName === matName)) continue;
      if (sources.some(s => matchedMonsterSet.has(s.monster))) {
        materialMatches.push({ matName, esName: trMaterial(matName), sources });
      }
    }
  }

  const decorationMatches = (decorations || []).filter(dec => {
    const skill = dec.skills[0];
    return normalizeSearch(dec.name).includes(q)
      || normalizeSearch(dec.nameEs || "").includes(q)
      || normalizeSearch(skill.name).includes(q)
      || normalizeSearch(skill.nameEs || "").includes(q);
  }).slice(0, 8);

  const weaponMatches = (weapons || []).filter(w => isWeaponTrueFinal(w) && (
    normalizeSearch(w.name).includes(q) || normalizeSearch(w.nameEs || "").includes(q)
  )).slice(0, 6);

  const armorSetMatches = (armorSets || []).filter(s => normalizeSearch(s.name).includes(q)).slice(0, 4);

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

  if (materialMatches.length) {
    for (const mm of materialMatches.slice(0, 6)) {
      html += `<div class="gs-material-block">
        <button type="button" class="gs-material-header" data-mat-key="${escapeAttr(mm.matName)}">${materialIconTag(mm.matName)}<span>${mm.esName}</span></button>
        <p class="gs-material-intro">${ui("gsMaterialIntro")}</p>
        ${mm.sources.map(s => `
          <button type="button" class="gs-source-row" data-name="${s.monster}" data-rank="${s.rank}">
            <span class="gs-source-top">
              <img src="${iconPath(s.monster)}" alt="" loading="lazy">
              <span class="gs-source-name">${trMonsterName(s.monster)}</span>
              <span class="gs-source-rank">${trRank(s.rank)}</span>
            </span>
            <span class="gs-source-summary">${summarizeRow(s.row, mm.matName) || "—"}</span>
          </button>
        `).join("")}
      </div>`;
    }
  }

  if (monsterMatches.length) {
    // related armor sets + weapons for the matched monsters -- shown after the
    // monster's own materials (sets first, then weapons, per earlier ask)
    const equipIndex = buildMonsterEquipmentIndex();
    for (const m of monsterMatches.slice(0, 3)) {
      const entry = equipIndex.get(m.name);
      if (!entry || (!entry.armorGroups.length && !entry.weapons.length)) continue;
      html += `<div class="gs-section"><div class="gs-section-title">${ui("relatedEquipment")} — ${trMonsterName(m.name)}</div>`;
      if (entry.armorGroups.length) {
        html += entry.armorGroups.map(g => `
          <button type="button" class="gs-monster-row" data-gs-related-armor="${escapeAttr(g.name)}">
            ${g.image ? `<img src="${g.image}" alt="" loading="lazy" onerror="this.style.display='none'">` : armorIconTag(g.pieces[0])}
            <span>${g.name}</span>
          </button>
        `).join("");
      }
      if (entry.weapons.length) {
        html += entry.weapons.map(w => `
          <button type="button" class="gs-monster-row" data-gs-related-weapon="${w.id}">
            ${weaponIconTag(w)}
            <span>${trWeaponName(w)} <span class="gs-source-rank">${w.type}</span></span>
          </button>
        `).join("");
      }
      html += `</div>`;
    }
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

  if (weaponMatches.length) {
    html += `<div class="gs-section"><div class="gs-section-title">${ui("gsWeaponsSection")}</div>`;
    html += weaponMatches.map(w => `
      <button type="button" class="gs-monster-row" data-weapon-id="${w.id}">
        ${weaponIconTag(w)}
        <span>${trWeaponName(w)}</span>
      </button>
    `).join("");
    html += `</div>`;
  }

  if (armorSetMatches.length) {
    html += `<div class="gs-section"><div class="gs-section-title">${ui("gsArmorSection")}</div>`;
    html += armorSetMatches.map(s => {
      const skillsSet = new Map();
      for (const ref of s.pieces) {
        const p = armorPieces.find(x => x.id === ref.id);
        for (const sk of (p && p.skills) || []) skillsSet.set(sk.name, sk.level);
      }
      const skillsText = [...skillsSet.entries()].map(([n, lv]) => `${n} Lv${lv}`).join(", ");
      return `<div class="gs-material-block">
        <button type="button" class="gs-decoration-header" data-armor-set="${s.name}">
          <img class="armor-set-thumb-sm" src="${s.localImage || s.image}" alt="" loading="lazy">
          <span>${s.name}</span>
        </button>
        ${skillsText ? `<p class="gs-decoration-skill">${skillsText}</p>` : ""}
        <ul class="gs-decoration-materials">
          ${s.pieces.map(ref => `<li>${trArmorPart(ref.part)}: ${ref.name}</li>`).join("")}
        </ul>
      </div>`;
    }).join("");
    html += `</div>`;
  }

  if (!monsterMatches.length && !materialMatches.length && !decorationMatches.length && !weaponMatches.length && !armorSetMatches.length) {
    html = `<p class="gs-no-results">${ui("gsNoResults")}</p>`;
  }

  gsResultsEl.innerHTML = html;

  gsResultsEl.querySelectorAll(".gs-monster-row[data-name]").forEach(btn => {
    btn.addEventListener("click", () => navMonster(btn.dataset.name));
  });
  gsResultsEl.querySelectorAll(".gs-decoration-header").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.decorationId) navDecoration(btn.dataset.decorationId);
      else if (btn.dataset.armorSet) navArmorSet(btn.dataset.armorSet);
    });
  });
  gsResultsEl.querySelectorAll(".gs-source-row").forEach(btn => {
    btn.addEventListener("click", () => navMonster(btn.dataset.name, btn.dataset.rank));
  });
  gsResultsEl.querySelectorAll("[data-mat-key]").forEach(btn => {
    btn.addEventListener("click", () => navMaterial(btn.dataset.matKey));
  });
  gsResultsEl.querySelectorAll("[data-weapon-id]").forEach(btn => {
    btn.addEventListener("click", () => navWeapon(btn.dataset.weaponId));
  });
  gsResultsEl.querySelectorAll("[data-armor-set]").forEach(btn => {
    btn.addEventListener("click", () => navArmorSet(btn.dataset.armorSet));
  });
  gsResultsEl.querySelectorAll("[data-gs-related-armor]").forEach(btn => {
    btn.addEventListener("click", () => navArmorSet(btn.dataset.gsRelatedArmor));
  });
  gsResultsEl.querySelectorAll("[data-gs-related-weapon]").forEach(btn => {
    btn.addEventListener("click", () => navWeapon(btn.dataset.gsRelatedWeapon));
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
  const mh = decorationMhriceIcons[dec.name];
  if (mh) return itemMaskIconTag(mh.iconId, mh.color, "material-icon");
  return dec.icon
    ? `<img class="material-icon" src="${dec.icon}" alt="" loading="lazy">`
    : `<span class="material-icon material-icon--placeholder"></span>`;
}

function showDecorationsView() {
  hideViews(detailEl, homeViewEl, weaponsViewEl, armorViewEl, materialsViewEl, skillsViewEl);
  decorationsViewEl.hidden = false;
  decorationDetailEl.hidden = true;
  decorationsIndexEl.hidden = false;
  decorationsSearchEl.value = "";
  window.scrollTo(0,0);
  renderDecorationsIndex("");
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
    btn.addEventListener("click", () => navDecoration(btn.dataset.id));
  });
}

function showDecorationDetail(id) {
  const dec = decorations.find(d => d.id === id);
  if (!dec) return;
  decorationsIndexEl.hidden = true;
  decorationDetailEl.hidden = false;

  const skillsHtml = dec.skills.map(s => `
    <li class="stat-list-item">
      <button type="button" class="stat-name skill-name-link" data-skill-name="${escapeAttr(s.name)}">${skillIconTagByName(s.name)}${lang === "es" ? s.nameEs : s.name} Lv${s.level}</button>
      <span class="decoration-skill-effect">${lang === "es" ? s.effectEs : s.effect}</span>
    </li>
  `).join("");

  if (!materialIndex) buildMaterialIndex();
  const materialsHtml = dec.materials.map(m => {
    const { sources, isPlusTierFallback } = getMaterialSources(m.material);
    const monsterCount = new Set(sources.map(s => s.monster)).size;
    return `<div class="gs-material-block decoration-material-block">
      <button type="button" class="gs-material-header" data-mat-key="${escapeAttr(m.material)}">
        ${materialIconTag(m.material)}
        <span>${trMaterial(m.material)}</span>
        <span class="decoration-material-qty">x${m.qty}</span>
      </button>
      ${sources.length ? `
        ${isPlusTierFallback ? `<p class="material-plus-tier-note">${ui("materialsPlusTierNote")}</p>` : ""}
        <div class="decoration-material-sources">
          ${sources.map(s => `
          <button type="button" class="gs-source-row" data-name="${s.monster}" data-rank="${s.rank}">
            <span class="gs-source-top">
              <img src="${iconPath(s.monster)}" alt="" loading="lazy">
              <span class="gs-source-name">${trMonsterName(s.monster)}</span>
              <span class="gs-source-rank">${trRank(s.rank)}</span>
            </span>
            <span class="gs-source-summary">${isPlusTierFallback ? "—" : (summarizeRow(s.row, m.material) || "—")}</span>
          </button>`).join("")}
        </div>
      ` : `<p class="gs-material-intro">${materialObtainNotes[m.material]
          ? escapeAttr(materialObtainNotes[m.material][lang])
          : ui("decorationsMaterialNoMonster")}</p>`}
    </div>`;
  }).join("");

  decorationDetailEl.innerHTML = `
    <a class="decorations-back" href="decorations">${ui("decorationsBack")}</a>
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
  decorationDetailEl.querySelectorAll(".gs-source-row").forEach(btn => {
    btn.addEventListener("click", () => navMonster(btn.dataset.name, btn.dataset.rank));
  });
  decorationDetailEl.querySelectorAll("[data-mat-key]").forEach(btn => {
    btn.addEventListener("click", () => navMaterial(btn.dataset.matKey));
  });
  decorationDetailEl.querySelectorAll("[data-skill-name]").forEach(btn => {
    btn.addEventListener("click", () => navSkill(btn.dataset.skillName));
  });
}

function bootDecorations() {
  decorationsSearchEl.addEventListener("input", () => renderDecorationsIndex(decorationsSearchEl.value));
  const params = new URLSearchParams(location.search);
  const decId = params.get("d");
  if (decId && decorations.some(d => d.id === decId)) {
    showDecorationsView();
    showDecorationDetail(decId);
  } else {
    showDecorationsView();
  }
}

// ---------- Weapons ----------

function trWeaponName(w) {
  return lang === "es" && w.nameEs ? w.nameEs : w.name;
}
function trWeaponType(type) {
  return lang === "es" && I18N.weaponTypes ? (I18N.weaponTypes[type] || type) : type;
}
function weaponIconTag(w) {
  return `<img class="material-icon" src="data/images/weapons/${w.id}.webp" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'material-icon material-icon--placeholder'}))">`;
}
// Words that don't identify a weapon family (they appear in almost every
// name of a type) — ignored when deciding whether two consecutive weapons
// belong to the same upgrade tree. The Kiranico prev/next links are a global
// table order, not a real craft tree, so same-type + shared meaningful token
// is the best signal available to bound each family run.
const WEAPON_STOP_WORDS = new Set([
  "Sword", "Blade", "Great", "Small", "Long", "Dual", "Bow", "Lance",
  "Gunlance", "Axe", "Charge", "Hammer", "Hunting", "Horn", "Switch",
  "Insect", "Glaive", "Light", "Heavy", "Bowgun", "Kamura", "Royal", "Order", "S",
]);
function weaponTokens(name) {
  return (name || "").replace(/\+/g, "").trim().split(/\s+/)
    .filter(t => t && !WEAPON_STOP_WORDS.has(t));
}
function weaponSameFamily(a, b) {
  if (a.type !== b.type) return false;
  const ta = new Set(weaponTokens(a.name));
  for (const t of weaponTokens(b.name)) if (ta.has(t)) return true;
  return false;
}
// A weapon is the true final of its tree when it's a leaf in the real
// upgrade graph. The scraped `isFinal` field used a fragile first-word
// heuristic and Kiranico's prev/next links are just a table pager (not a
// tree), so the UI computes this from the real Fextralife weapon trees
// (data/weapon_tree.json, see data/scrape_weapon_trees.js) once loaded.
function normalizeWeaponName(name) {
  return (name || "").toLowerCase().replace(/\s*\+\s*/g, "+").replace(/\s+/g, " ").trim();
}
let weaponFinalNames = null;   // Set<normalized name> of true final weapons
let weaponParentOf = null;     // Map<normalized child, normalized parent>
let weaponChildrenOf = null;   // Map<normalized parent, [normalized children]> (ordered)
let weaponOrder = [];          // weapon names in tree order
let weaponOrderIdx = null;     // Map<normalized name, order index>
let weaponsByNameNorm = null;  // Map<normalized name, weapon>
function initWeaponTree(tree) {
  weaponFinalNames = new Set((tree.finals || []).map(normalizeWeaponName));
  weaponParentOf = new Map();
  weaponChildrenOf = new Map();
  for (const child of Object.keys(tree.parents || {})) {
    const c = normalizeWeaponName(child), p = normalizeWeaponName(tree.parents[child]);
    weaponParentOf.set(c, p);
    if (!weaponChildrenOf.has(p)) weaponChildrenOf.set(p, []);
    weaponChildrenOf.get(p).push(c);
  }
  weaponOrder = tree.order || [];
  weaponOrderIdx = new Map();
  weaponOrder.forEach((n, i) => { if (!weaponOrderIdx.has(normalizeWeaponName(n))) weaponOrderIdx.set(normalizeWeaponName(n), i); });
  weaponsByNameNorm = new Map();
  for (const w of weapons) if (!weaponsByNameNorm.has(normalizeWeaponName(w.name))) weaponsByNameNorm.set(normalizeWeaponName(w.name), w);
}
function isWeaponTrueFinal(w) {
  if (weaponFinalNames) return weaponFinalNames.has(normalizeWeaponName(w.name));
  if (!w.nextId || !weaponsById.has(w.nextId)) return true;
  return !weaponSameFamily(w, weaponsById.get(w.nextId));
}
function decoSlotsTag(levels) {
  if (!levels || !levels.length) return "";
  return `<span class="deco-slots">${levels.map(l => `<img class="deco-slot-icon" src="data/images/icons/deco${l}.png" alt="Lv${l}" title="Lv${l}">`).join("")}</span>`;
}
function getWeaponChain(w) {
  if (weaponParentOf && weaponsByNameNorm) {
    // normal upgrade branch: ancestors + descendants that share the weapon's
    // family. Cross-tree unlock links (a different-family parent/child) are NOT
    // part of this branch -- they're reported separately via getWeaponCrossLinks().
    const key = normalizeWeaponName(w.name);
    const sameFam = (a, b) => {
      const wa = weaponsByNameNorm.get(a), wb = weaponsByNameNorm.get(b);
      return wa && wb ? weaponSameFamily(wa, wb) : false;
    };
    const anc = [];
    let cur = key, guard = 0;
    while (weaponParentOf.has(cur) && guard++ < 60) {
      const p = weaponParentOf.get(cur);
      if (!sameFam(p, cur)) break;
      anc.unshift(p);
      cur = p;
    }
    const desc = [];
    const dfs = (n) => { for (const c of (weaponChildrenOf.get(n) || [])) { if (sameFam(c, n)) { desc.push(c); dfs(c); } } };
    dfs(key);
    const names = anc.concat([key], desc);
    return names.map(n => weaponsByNameNorm.get(n)).filter(Boolean);
  }
  const chain = [];
  const seen = new Set([w.id]);
  let cur = w;
  while (cur.prevId && weaponsById.has(cur.prevId)) {
    const prev = weaponsById.get(cur.prevId);
    if (seen.has(prev.id) || !weaponSameFamily(cur, prev)) break;
    seen.add(prev.id);
    chain.unshift(prev);
    cur = prev;
  }
  chain.push(w);
  cur = w;
  while (cur.nextId && weaponsById.has(cur.nextId)) {
    const next = weaponsById.get(cur.nextId);
    if (seen.has(next.id) || !weaponSameFamily(cur, next)) break;
    seen.add(next.id);
    chain.push(next);
    cur = next;
  }
  return chain;
}
// Cross-tree upgrade links for a weapon: which weapon line it branches FROM
// (from) and which branch off it (to) -- these are NOT the normal upgrade path.
function getWeaponCrossLinks(w) {
  if (!weaponParentOf || !weaponChildrenOf || !weaponsByNameNorm) return { from: null, to: [] };
  const key = normalizeWeaponName(w.name);
  const sameFam = (a, b) => {
    const wa = weaponsByNameNorm.get(a), wb = weaponsByNameNorm.get(b);
    return wa && wb ? weaponSameFamily(wa, wb) : false;
  };
  let from = null;
  let cur = key, guard = 0;
  while (weaponParentOf.has(cur) && guard++ < 60) {
    const p = weaponParentOf.get(cur);
    if (!sameFam(p, cur)) { from = p; break; }
    cur = p;
  }
  const to = (weaponChildrenOf.get(key) || []).filter(c => !sameFam(c, key));
  return { from, to };
}

// Renders the weapon's family upgrade tree as an SVG diagram (nodes + lines),
// like the in-game weapon tree. Only active when the real tree is loaded.
function renderWeaponTreeSVG(w) {
  if (!weaponChildrenOf || !weaponParentOf) return "";
  const key = normalizeWeaponName(w.name);
  let root = key, guard = 0;
  while (weaponParentOf.has(root) && guard++ < 80) root = weaponParentOf.get(root);
  const children = (n) => weaponChildrenOf.get(n) || [];
  const leafCount = {};
  (function sz(n) {
    const c = children(n);
    if (!c.length) { leafCount[n] = 1; return 1; }
    leafCount[n] = c.reduce((a, k) => a + sz(k), 0);
    return leafCount[n];
  })(root);
  const xPos = {}, yPos = {};
  let cursor = 0;
  (function assign(n, depth) {
    yPos[n] = depth;
    const c = children(n);
    if (!c.length) { xPos[n] = cursor + 0.5; cursor += 1; }
    else { c.forEach(k => assign(k, depth + 1)); xPos[n] = (xPos[c[0]] + xPos[c[c.length - 1]]) / 2; }
  })(root, 0);
  const total = leafCount[root];
  const ROW = 62, COL = 210, NW = 195, NH = 40, M = 14, TOH = 18;
  const W = total * COL + M * 2;
  const H = (yPos[root] + depthOfTree(root) + 1) * ROW + M * 2;
  function depthOfTree(n) { const c = children(n); return c.length ? 1 + Math.max(...c.map(depthOfTree)) : 0; }
  const cx = (n) => M + xPos[n] * COL - NW / 2;
  const cy = (n) => M + yPos[n] * ROW;
  let svg = `<div class="weapon-tree-svg"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin meet" style="max-width:100%;height:auto;">`;
  // connecting lines (elbow from parent bottom to child top)
  const lines = [];
  for (const p of Object.keys(xPos)) {
    for (const c of children(p)) {
      const x1 = M + xPos[p] * COL, y1 = cy(p) + NH;
      const x2 = M + xPos[c] * COL, y2 = cy(c);
      const mid = (y1 + y2) / 2;
      lines.push(`<path d="M${x1},${y1} L${x1},${mid} L${x2},${mid} L${x2},${y2}" fill="none" stroke="var(--mh-line,#8a7f6e)" stroke-width="2"/>`);
    }
  }
  svg += lines.join("");
  // nodes
  for (const n of Object.keys(xPos)) {
    const wep = weaponsByNameNorm.get(n);
    const label = wep ? trWeaponName(wep) : n;
    const isCur = n === key;
    const isFinal = weaponFinalNames ? weaponFinalNames.has(n) : false;
    const tx = M + xPos[n] * COL;
    const wid = wep ? ` data-wid="${wep.id}"` : "";
    svg += `<g class="weapon-tree-node${isCur ? " current" : ""}"${wid}>`;
    svg += `<rect x="${cx(n)}" y="${cy(n)}" width="${NW}" height="${NH}" rx="8" fill="${isCur ? "var(--mh-node-cur,#6b5d43)" : "var(--mh-node,#3a352c)"}" stroke="${isFinal ? "var(--mh-node-final,#c8a24a)" : "var(--mh-line,#8a7f6e)"}" stroke-width="${isCur ? 2.5 : 1.5}"/>`;
    svg += `<text x="${tx}" y="${cy(n) + NH / 2 + 4}" text-anchor="middle" font-size="12" fill="var(--mh-text,#e8e2d6)">${escapeXml(label)}${isFinal ? " ★" : ""}</text>`;
    svg += `</g>`;
  }
  svg += `</svg></div>`;
  return svg;
}
function escapeXml(s) { return String(s).replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])); }


function showWeaponsView() {
  hideViews(detailEl, homeViewEl, decorationsViewEl, armorViewEl, materialsViewEl, skillsViewEl);
  weaponsViewEl.hidden = false;
  weaponDetailEl.hidden = true;
  weaponsIndexEl.hidden = false;
  weaponsSearchEl.value = "";
  window.scrollTo(0, 0);
  renderWeaponsIndex("");
}

function renderWeaponsIndex(query) {
  const q = normalizeSearch((query || "").trim());
  let filtered = weapons.filter(w => isWeaponTrueFinal(w) && (
    !q || normalizeSearch(w.name).includes(q) || normalizeSearch(w.nameEs || "").includes(q)
  ));
  // order finals by their position in the real upgrade tree (per type)
  if (weaponOrderIdx) {
    filtered = filtered.slice().sort((a, b) => {
      const ia = weaponOrderIdx.get(normalizeWeaponName(a.name)) ?? Number.MAX_SAFE_INTEGER;
      const ib = weaponOrderIdx.get(normalizeWeaponName(b.name)) ?? Number.MAX_SAFE_INTEGER;
      return ia - ib;
    });
  }

  if (!filtered.length) {
    weaponsIndexEl.innerHTML = `<p class="no-data">${ui("weaponsNoResults")}</p>`;
    return;
  }

  const byType = new Map();
  for (const w of filtered) {
    if (!byType.has(w.type)) byType.set(w.type, []);
    byType.get(w.type).push(w);
  }

  weaponsIndexEl.innerHTML = [...byType.keys()].map(type => `
    <div class="decorations-slot-group">
      <h3 class="decorations-slot-heading">${trWeaponType(type)}</h3>
      <div class="decorations-grid">
        ${byType.get(type).map(w => `
          <button type="button" class="decoration-card" data-id="${w.id}">
            ${weaponIconTag(w)}
            <span class="decoration-card-name">${trWeaponName(w)}</span>
            <span class="decoration-card-skill">${ui("weaponsAttack")} ${w.attack ?? "—"}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `).join("");

  weaponsIndexEl.querySelectorAll(".decoration-card").forEach(btn => {
    btn.addEventListener("click", () => navWeapon(btn.dataset.id));
  });
}

function showWeaponDetail(id) {
  window.scrollTo(0, 0);
  const w = weaponsById.get(id);
  if (!w) return;
  weaponsIndexEl.hidden = true;
  weaponDetailEl.hidden = false;

  if (!materialIndex) buildMaterialIndex();
  const materialsHtml = (w.materials || []).map(m => {
    const { sources, isPlusTierFallback } = getMaterialSources(m.material);
    const monsterCount = new Set(sources.map(s => s.monster)).size;
    return `<div class="gs-material-block decoration-material-block">
      <button type="button" class="gs-material-header" data-mat-key="${escapeAttr(m.material)}">
        ${materialIconTag(m.material)}
        <span>${trMaterial(m.material)}</span>
        <span class="decoration-material-qty">x${m.qty}</span>
      </button>
      ${sources.length ? `
        ${isPlusTierFallback ? `<p class="material-plus-tier-note">${ui("materialsPlusTierNote")}</p>` : ""}
        <div class="decoration-material-sources">
          ${sources.map(s => `
          <button type="button" class="gs-source-row" data-name="${s.monster}" data-rank="${s.rank}">
            <span class="gs-source-top">
              <img src="${iconPath(s.monster)}" alt="" loading="lazy">
              <span class="gs-source-name">${trMonsterName(s.monster)}</span>
              <span class="gs-source-rank">${trRank(s.rank)}</span>
            </span>
            <span class="gs-source-summary">${isPlusTierFallback ? "—" : (summarizeRow(s.row, m.material) || "—")}</span>
          </button>`).join("")}
        </div>
      ` : `<p class="gs-material-intro">${materialObtainNotes[m.material] ? escapeAttr(materialObtainNotes[m.material][lang]) : ui("decorationsMaterialNoMonster")}</p>`}
    </div>`;
  }).join("") || `<p class="no-data">${ui("noMaterialsYet")}</p>`;

  const chain = getWeaponChain(w);
  const chainHtml = chain.length > 1 ? `
    <section class="block">
      <h3>${ui("weaponsEarlierVersions")}</h3>
      <div class="decorations-grid">
        ${chain.map(cw => `
          <button type="button" class="decoration-card${cw.id === w.id ? " selected" : ""}" data-id="${cw.id}">
            ${weaponIconTag(cw)}
            <span class="decoration-card-name">${trWeaponName(cw)}</span>
            <span class="decoration-card-skill">${isWeaponTrueFinal(cw) ? ui("weaponsFinalVersion") : ("R" + cw.rarity)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  ` : "";

  const elementsHtml = (w.elements || []).map(e => `<span class="mh-info-value">${elementIconTag(e.type)}${trElement(e.type)} ${e.value}</span>`).join(" ");

  weaponDetailEl.innerHTML = `
    <a class="decorations-back" href="weapons">${ui("weaponsBack")}</a>
    <div class="decoration-detail-header">
      ${weaponIconTag(w)}
      <h2>${trWeaponName(w)}</h2>
      <span class="decoration-detail-slot">${trWeaponType(w.type)}</span>
    </div>
    <section class="block">
      <ul class="stat-list">
        <li class="stat-list-item"><span class="stat-name">${ui("weaponsAttack")}</span><span>${w.attack ?? "—"}</span></li>
        <li class="stat-list-item"><span class="stat-name">${ui("weaponsRarity")}</span><span>${w.rarity ?? "—"}</span></li>
        ${elementsHtml ? `<li class="stat-list-item"><span class="stat-name">${ui("weaponsElement")}</span><span>${elementsHtml}</span></li>` : ""}
        ${w.decoSlots && w.decoSlots.length ? `<li class="stat-list-item"><span class="stat-name">${ui("weaponsDecoSlots")}</span>${decoSlotsTag(w.decoSlots)}</li>` : ""}
      </ul>
    </section>
    ${chainHtml}
    <section class="block">
      <h3>${ui("weaponsMaterialsHeading")}</h3>
      <div class="decoration-materials-blocks">${materialsHtml}</div>
    </section>
  `;
  weaponDetailEl.querySelectorAll(".decoration-card").forEach(btn => {
    btn.addEventListener("click", () => navWeapon(btn.dataset.id));
  });
  weaponDetailEl.querySelectorAll(".weapon-tree-node[data-wid]").forEach(g => {
    g.addEventListener("click", () => navWeapon(g.dataset.wid));
  });
  weaponDetailEl.querySelectorAll(".gs-source-row").forEach(btn => {
    btn.addEventListener("click", () => navMonster(btn.dataset.name, btn.dataset.rank));
  });
  weaponDetailEl.querySelectorAll("[data-mat-key]").forEach(btn => {
    btn.addEventListener("click", () => navMaterial(btn.dataset.matKey));
  });
}

function bootWeapons() {
  weaponsSearchEl.addEventListener("input", () => renderWeaponsIndex(weaponsSearchEl.value));
  const params = new URLSearchParams(location.search);
  const wId = params.get("w");
  if (wId && weaponsById.has(wId)) {
    showWeaponsView();
    showWeaponDetail(wId);
  } else {
    showWeaponsView();
  }
}

// ---------- Armor ----------

function trArmorName(p) {
  return lang === "es" && p.nameEs ? p.nameEs : p.name;
}
function trArmorPart(part) {
  const key = "armorPart" + part.charAt(0).toUpperCase() + part.slice(1);
  return I18N.ui[lang][key] || part;
}
function armorIconTag(p) {
  const src = p.iconM ? `data/images/armor/${p.id}_m.webp` : (p.iconF ? `data/images/armor/${p.id}_f.webp` : null);
  const fallbackSrc = armorFextraIcons[p.id] ? `data/images/armor_fextra/${p.id}.png` : null;
  if (!src) {
    if (fallbackSrc) return `<img class="material-icon" src="${fallbackSrc}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'material-icon material-icon--placeholder'}))">`;
    return `<span class="material-icon material-icon--placeholder"></span>`;
  }
  const onerror = fallbackSrc
    ? `if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${fallbackSrc}';}else{this.replaceWith(Object.assign(document.createElement('span'),{className:'material-icon material-icon--placeholder'}));}`
    : `this.replaceWith(Object.assign(document.createElement('span'),{className:'material-icon material-icon--placeholder'}))`;
  return `<img class="material-icon" src="${src}" alt="" loading="lazy" onerror="${onerror}">`;
}
let armorSetPieceIds = null;
function getArmorSetPieceIds() {
  if (!armorSetPieceIds) {
    armorSetPieceIds = new Set();
    const names = new Set();
    for (const s of armorSets) for (const p of s.pieces) {
      armorSetPieceIds.add(p.id);
      names.add(p.name.toLowerCase());
    }
    // Also include M/F variant duplicates (different ID, same name)
    for (const ap of armorPieces) {
      if (names.has(ap.name.toLowerCase())) armorSetPieceIds.add(ap.id);
    }
  }
  return armorSetPieceIds;
}
function armorPieceMaterialsHtml(p) {
  if (!materialIndex) buildMaterialIndex();
  return (p.materials || []).map(m => {
    const { sources, isPlusTierFallback } = getMaterialSources(m.material);
    const monsterCount = new Set(sources.map(s => s.monster)).size;
    return `<div class="gs-material-block decoration-material-block">
      <button type="button" class="gs-material-header" data-mat-key="${escapeAttr(m.material)}">
        ${materialIconTag(m.material)}
        <span>${trMaterial(m.material)}</span>
        <span class="decoration-material-qty">x${m.qty}</span>
      </button>
      ${sources.length ? `
        ${isPlusTierFallback ? `<p class="material-plus-tier-note">${ui("materialsPlusTierNote")}</p>` : ""}
        <div class="decoration-material-sources">
          ${sources.map(s => `
          <button type="button" class="gs-source-row" data-name="${s.monster}" data-rank="${s.rank}">
            <span class="gs-source-top">
              <img src="${iconPath(s.monster)}" alt="" loading="lazy">
              <span class="gs-source-name">${trMonsterName(s.monster)}</span>
              <span class="gs-source-rank">${trRank(s.rank)}</span>
            </span>
            <span class="gs-source-summary">${isPlusTierFallback ? "—" : (summarizeRow(s.row, m.material) || "—")}</span>
          </button>`).join("")}
        </div>
      ` : `<p class="gs-material-intro">${materialObtainNotes[m.material] ? escapeAttr(materialObtainNotes[m.material][lang]) : ui("decorationsMaterialNoMonster")}</p>`}
    </div>`;
  }).join("") || `<p class="no-data">${ui("noMaterialsYet")}</p>`;
}
function armorPieceSkillsHtml(p) {
  if (!p.skills || !p.skills.length) return "";
  return `<ul class="chips">${p.skills.map(s => `<li class="chip"><button type="button" class="skill-name-link" data-skill-name="${escapeAttr(s.name)}">${skillIconTagByName(s.name)}${trSkillName(skillsByName.get(s.name) || s)} Lv${s.level}</button></li>`).join("")}</ul>`;
}

function showArmorView() {
  hideViews(detailEl, homeViewEl, decorationsViewEl, weaponsViewEl, materialsViewEl, skillsViewEl);
  armorViewEl.hidden = false;
  armorSetDetailEl.hidden = true;
  armorIndexEl.hidden = false;
  armorSearchEl.value = "";
  window.scrollTo(0, 0);
  renderArmorIndex("");
}

function renderArmorIndex(query) {
  const q = normalizeSearch((query || "").trim());
  const setMatches = !q ? armorSets : armorSets.filter(s => normalizeSearch(s.name).includes(q));
  const implied = buildImpliedArmorGroups().filter(g => !q || normalizeSearch(g.prefix).includes(q))
    .filter(g => g.pieces.some(p => p.materials && p.materials.length && p.defense));
  const usedIds = getArmorSetPieceIds();
  for (const g of implied) for (const p of g.pieces) usedIds.add(p.id);
  // Also exclude pieces whose name matches one already in an explicit or implied set
  // (handles M/F duplicates with different IDs but same name)
  const usedNames = new Set();
  for (const s of setMatches) for (const p of s.pieces) usedNames.add(p.name.toLowerCase());
  for (const g of implied) for (const p of g.pieces) usedNames.add(p.name.toLowerCase());
  const looseMatches = armorPieces.filter(p => !usedIds.has(p.id) && !usedNames.has(p.name.toLowerCase()) && (!q ||
    normalizeSearch(p.name).includes(q) || normalizeSearch(p.nameEs || "").includes(q)))
    .filter(p => p.materials && p.materials.length && p.defense);

  // merge explicit and implied sets into one list, tagged by rank
  function setRank(items) {
    const rarities = items.map(p => p.rarity).filter(r => r != null);
    if (!rarities.length) return 99;
    const avg = rarities.reduce((a, b) => a + b, 0) / rarities.length;
    if (avg >= 8) return 2; // Master
    if (avg >= 4) return 1; // High
    return 0; // Low
  }
  const explicitNames = new Set(setMatches.map(s => s.name));
  const allSets = [
    ...setMatches.map(s => ({ name: s.name, image: s.localImage || s.image, rank: setRank(s.pieces.map(r => armorPieces.find(x => x.id === r.id)).filter(Boolean)), isSet: true })),
    ...implied.filter(g => !explicitNames.has(armorSetDisplayName(g.prefix))).map(g => ({ name: armorSetDisplayName(g.prefix), image: armorSetImg(armorSetDisplayName(g.prefix)), rank: setRank(g.pieces), isImplied: true })),
  ];

  if (!allSets.length && !looseMatches.length) {
    armorIndexEl.innerHTML = `<p class="no-data">${ui("armorNoResults")}</p>`;
    return;
  }

  const ranks = [
    { key: 2, label: ui("armorRankMaster") },
    { key: 1, label: ui("armorRankHigh") },
    { key: 0, label: ui("armorRankLow") },
  ];
  let html = "";
  for (const r of ranks) {
    const items = allSets.filter(s => s.rank === r.key);
    if (!items.length) continue;
    html += `<div class="decorations-slot-group">
      <h3 class="decorations-slot-heading">${r.label}</h3>
      <div class="decorations-grid">
        ${items.map(s => `
          <button type="button" class="decoration-card armor-set-card" data-${s.isSet ? "set" : "implied"}="${s.isSet ? s.name : s.name.replace(/\s+Set$/, "")}">
            <img class="armor-set-thumb" src="${s.image}" alt="" loading="lazy" onerror="this.style.display='none'">
            <span class="decoration-card-name">${s.name}</span>
          </button>
        `).join("")}
      </div>
    </div>`;
  }
  const partialGroups = !q ? buildPartialArmorGroups() : buildPartialArmorGroups().filter(g => normalizeSearch(g.prefix).includes(q));
  // Exclude partial groups that are already covered by explicit or implied sets
  const allSetNames = new Set(explicitNames);
  for (const s of implied) allSetNames.add(armorSetDisplayName(s.prefix));
  const filteredPartial = partialGroups.filter(g => !allSetNames.has(armorSetDisplayName(g.prefix)));
  if (filteredPartial.length) {
    html += `<div class="decorations-slot-group">
      <h3 class="decorations-slot-heading">${ui("armorPartialSets")}</h3>
      <div class="decorations-grid">
        ${filteredPartial.map(g => `
          <button type="button" class="decoration-card armor-set-card" data-implied="${g.prefix}">
            <img class="armor-set-thumb" src="${armorSetImg(armorSetDisplayName(g.prefix))}" alt="" loading="lazy" onerror="this.style.display='none'">
            <span class="decoration-card-name">${armorSetDisplayName(g.prefix)}</span>
            <span class="decoration-card-skill">${g.pieces.length} ${ui("armorPiecesCount")}</span>
          </button>
        `).join("")}
      </div>
    </div>`;
  }
  if (looseMatches.length) {
    html += `<div class="decorations-slot-group">
      <h3 class="decorations-slot-heading">${ui("armorLoosePieces")}</h3>
      <div class="decorations-grid">
        ${looseMatches.map(p => `
          <button type="button" class="decoration-card" data-piece="${p.id}">
            ${armorIconTag(p)}
            <span class="decoration-card-name">${trArmorName(p)}</span>
            <span class="decoration-card-skill">${p.part ? trArmorPart(p.part) : ""}</span>
          </button>
        `).join("")}
      </div>
    </div>`;
  }
  armorIndexEl.innerHTML = html;

  armorIndexEl.querySelectorAll("[data-set]").forEach(btn => {
    btn.addEventListener("click", () => navArmorSet(btn.dataset.set));
  });
  armorIndexEl.querySelectorAll("[data-implied]").forEach(btn => {
    btn.addEventListener("click", () => navArmorSet(btn.dataset.implied));
  });
  armorIndexEl.querySelectorAll("[data-piece]").forEach(btn => {
    btn.addEventListener("click", () => navArmorPiece(btn.dataset.piece));
  });
}

function showArmorSetDetail(setName) {
  window.scrollTo(0, 0);
  let set = armorSets.find(s => s.name === setName);
  let impliedGroup = null;
  let partialGroup = null;
  if (!set) {
    let prefix = setName.replace(/\s+Set$/, "");
    const m = prefix.match(/^(.*?)\s+(S|X)$/);
    const base = m ? m[1] : prefix;
    const rank = m ? " " + m[2] : "";
    const reverse = { "Shell Studded": "S. Studded", "Knight Squire": "Squire's", "Scholar": "Scholar's", "Garangolm": "Golm", "Rakna-Kadaki": "Rakna", "Royal Artillery Corps": "Artillery Corps", "Chaotic Gore Magala": "Chaotic", "Gore Magala": "Gore", "Heavy Knight": "Hoplite's", "Professor": "Professor's", "Seregios": "Regios", "Base Commander": "Outpost HQ", "Ibushi": "Ibushi's", "Ibushi - Pure": "Ibushi's Pure", "Narwa": "Narwa's", "Narwa - Pure": "Narwa's Pure", "Lecture": "Lecturer", "Grand Divine Ire": "Divine Ire", "Channeler": "Channeler's", "Channeler (Spring)": "Channeler's (Spring)", "Medium": "Medium's", "Medium (Light)": "Medium's (Light)", "Charite": "Charité" };
    if (reverse[base]) prefix = reverse[base] + rank;
    impliedGroup = buildImpliedArmorGroups().find(g => g.prefix === prefix);
    if (!impliedGroup) partialGroup = buildPartialArmorGroups().find(g => g.prefix === prefix);
  }
  if (!set && !impliedGroup && !partialGroup) return;

  armorIndexEl.hidden = true;
  armorSetDetailEl.hidden = false;

  const pieces = set ? set.pieces : (impliedGroup || partialGroup).pieces;
  const piecesHtml = ARMOR_PART_ORDER.map(part => {
    const ref = set ? set.pieces.find(p => p.part === part) : null;
    const p = ref
      ? armorPieces.find(x => x.id === ref.id)
      : ((impliedGroup || partialGroup) ? (impliedGroup || partialGroup).pieces.find(x => x.part === part) : null);
    if (!p) return "";
    return `
      <div class="decoration-detail-header armor-piece-header">
        <button type="button" class="armor-piece-link" data-piece="${p.id}">
          ${armorIconTag(p)}
          <h3>${trArmorName(p)}</h3>
          <span class="decoration-detail-slot">${trArmorPart(part)}</span>
        </button>
      </div>
      ${p.defense ? `<p class="gs-material-intro"><img src="data/images/icons/defense.svg" alt="" class="defense-icon" loading="lazy">${ui("armorDefense")}: ${p.defense}</p>` : ""}
      ${armorPieceSkillsHtml(p)}
      <div class="decoration-materials-blocks">${armorPieceMaterialsHtml(p)}</div>
    `;
  }).join("<hr class='armor-piece-divider'>");

  const displayName = set ? set.name : armorSetDisplayName((impliedGroup || partialGroup).prefix);
  armorSetDetailEl.innerHTML = `
    <a class="decorations-back" href="armor">${ui("armorBack")}</a>
    <div class="armor-set-detail-header">
      ${set ? `<img class="armor-set-full-image" src="${set.localImage || set.image}" alt="">` : `<img class="armor-set-full-image" src="${armorSetImg(displayName)}" alt="" onerror="this.style.display='none'">`}
      <h2>${displayName}</h2>
    </div>
    <section class="block">
      <h3>${ui("armorPiecesHeading")}</h3>
      ${piecesHtml}
    </section>
  `;
  armorSetDetailEl.querySelectorAll(".gs-source-row").forEach(btn => {
    btn.addEventListener("click", () => navMonster(btn.dataset.name, btn.dataset.rank));
  });
  armorSetDetailEl.querySelectorAll("[data-mat-key]").forEach(btn => {
    btn.addEventListener("click", () => navMaterial(btn.dataset.matKey));
  });
  armorSetDetailEl.querySelectorAll("[data-skill-name]").forEach(btn => {
    btn.addEventListener("click", () => navSkill(btn.dataset.skillName));
  });
  armorSetDetailEl.querySelectorAll(".armor-piece-link[data-piece]").forEach(btn => {
    btn.addEventListener("click", () => navArmorPiece(btn.dataset.piece));
  });
}

function showArmorPieceDetail(id) {
  window.scrollTo(0, 0);
  const p = armorPieces.find(x => x.id === id);
  if (!p) return;
  armorIndexEl.hidden = true;
  armorSetDetailEl.hidden = false;
  armorSetDetailEl.innerHTML = `
    <a class="decorations-back" href="armor">${ui("armorBack")}</a>
    <div class="decoration-detail-header">
      ${armorIconTag(p)}
      <h2>${trArmorName(p)}</h2>
      ${p.part ? `<span class="decoration-detail-slot">${trArmorPart(p.part)}</span>` : ""}
    </div>
    ${p.defense ? `<p class="gs-material-intro">${ui("armorDefense")}: ${p.defense}</p>` : ""}
    ${p.decoSlots && p.decoSlots.length ? `<p class="gs-material-intro">${ui("weaponsDecoSlots")} ${decoSlotsTag(p.decoSlots)}</p>` : ""}
    <section class="block">
      <h3>${ui("armorSkillsHeading")}</h3>
      ${armorPieceSkillsHtml(p) || `<p class="no-data">${ui("noData")}</p>`}
    </section>
    <section class="block">
      <h3>${ui("armorMaterialsHeading")}</h3>
      <div class="decoration-materials-blocks">${armorPieceMaterialsHtml(p)}</div>
    </section>
  `;
  armorSetDetailEl.querySelectorAll(".gs-source-row").forEach(btn => {
    btn.addEventListener("click", () => navMonster(btn.dataset.name, btn.dataset.rank));
  });
  armorSetDetailEl.querySelectorAll("[data-mat-key]").forEach(btn => {
    btn.addEventListener("click", () => navMaterial(btn.dataset.matKey));
  });
  armorSetDetailEl.querySelectorAll("[data-skill-name]").forEach(btn => {
    btn.addEventListener("click", () => navSkill(btn.dataset.skillName));
  });
}

function bootArmor() {
  armorSearchEl.addEventListener("input", () => renderArmorIndex(armorSearchEl.value));
  const params = new URLSearchParams(location.search);
  const setName = params.get("set");
  const pieceId = params.get("piece");
  if (setName && armorSets.some(s => s.name === setName)) {
    showArmorView();
    showArmorSetDetail(setName);
  } else if (pieceId && armorPieces.some(p => p.id === pieceId)) {
    showArmorView();
    showArmorPieceDetail(pieceId);
  } else {
    showArmorView();
  }
}

// ---------- Materials ----------

function showMaterialsView() {
  hideViews(detailEl, homeViewEl, decorationsViewEl, weaponsViewEl, armorViewEl, skillsViewEl);
  materialsViewEl.hidden = false;
  materialDetailEl.hidden = true;
  materialsIndexEl.hidden = false;
  materialsSearchEl.value = "";
  window.scrollTo(0,0);
  renderMaterialsIndex("");
}

function renderMaterialsIndex(query) {
  if (!materialIndex) buildMaterialIndex();
  const q = normalizeSearch((query || "").trim());
  const keys = [...materialIndex.keys()].sort((a, b) => trMaterial(a).localeCompare(trMaterial(b)));
  const filtered = !q ? keys : keys.filter(k => normalizeSearch(k).includes(q) || normalizeSearch(trMaterial(k)).includes(q));

  if (!filtered.length) {
    materialsIndexEl.innerHTML = `<p class="no-data">${ui("materialsNoResults")}</p>`;
    return;
  }

  materialsIndexEl.innerHTML = `
    <div class="decorations-slot-group">
      <div class="decorations-grid">
        ${filtered.map(k => `
          <button type="button" class="decoration-card" data-key="${escapeAttr(k)}">
            ${materialIconTag(k)}
            <span class="decoration-card-name">${trMaterial(k)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
  materialsIndexEl.querySelectorAll(".decoration-card").forEach(btn => {
    btn.addEventListener("click", () => navMaterial(btn.dataset.key));
  });
}

function showMaterialDetail(matKey) {
  if (!materialIndex) buildMaterialIndex();
  const key = normalizeMaterialKey(matKey);
  const { sources, isPlusTierFallback } = getMaterialSources(matKey);
  materialsIndexEl.hidden = true;
  materialDetailEl.hidden = false;

  const range = ANOMALY_LEVEL_RANGE[key];
  const rangeStr = range ? (range.max ? `${range.min}-${range.max}` : `${range.min}+`) : null;

  const sourcesHtml = sources.length ? `
    ${isPlusTierFallback ? `<p class="material-plus-tier-note">${ui("materialsPlusTierNote")}</p>` : ""}
    ${sources.map(s => `
    <button type="button" class="gs-source-row" data-name="${s.monster}" data-rank="${s.rank}">
      <span class="gs-source-top">
        <img src="${iconPath(s.monster)}" alt="" loading="lazy">
        <span class="gs-source-name">${trMonsterName(s.monster)}</span>
        <span class="gs-source-rank">${trRank(s.rank)}</span>
      </span>
      <span class="gs-source-summary">${isPlusTierFallback ? "—" : (summarizeRow(s.row, matKey) || "—")}</span>
    </button>
  `).join("")}` : `<p class="gs-material-intro">${materialObtainNotes[matKey] ? escapeAttr(materialObtainNotes[matKey][lang]) : ui("decorationsMaterialNoMonster")}</p>`;

  materialDetailEl.innerHTML = `
    <a class="decorations-back" href="materials">${ui("materialsBack")}</a>
    <div class="decoration-detail-header">
      ${materialIconTag(matKey)}
      <h2>${trMaterial(matKey)}</h2>
      ${rangeStr ? `<span class="decoration-detail-slot">${ui("materialsAnomalyLevel")(rangeStr)}</span>` : ""}
    </div>
    <section class="block">
      <h3>${ui("materialsSourcesHeading")}</h3>
      <div class="decoration-materials-blocks">${sourcesHtml}</div>
    </section>
  `;
  materialDetailEl.querySelectorAll(".gs-source-row").forEach(btn => {
    btn.addEventListener("click", () => navMonster(btn.dataset.name, btn.dataset.rank));
  });
}

function bootMaterials() {
  materialsSearchEl.addEventListener("input", () => renderMaterialsIndex(materialsSearchEl.value));
  const params = new URLSearchParams(location.search);
  const matKey = params.get("mat");
  if (matKey && materialIndex && materialIndex.has(normalizeMaterialKey(matKey))) {
    showMaterialsView();
    showMaterialDetail(matKey);
  } else {
    showMaterialsView();
  }
}

function trSkillName(s) {
  return lang === "es" && s.nameEs ? s.nameEs : s.name;
}

// MHRice's rarity-tier palette (resources/item_color.css) -- skills have no
// unique icon per skill (see scrape_skills.js's comment), just this color
// class applied to the same shared skill.r.png/skill.a.png mask pair
const MH_ITEM_COLOR = {
  0: "#FFFFFF", 1: "#FFFFFF", 2: "#AEAEAE", 3: "#F072B8", 4: "#FFFF70",
  5: "#FFB356", 6: "#FF721F", 7: "#FF4C17", 8: "#2CE095", 9: "#A443E0",
  10: "#486EFF", 11: "#5AA9FF", 12: "#9FCCFF", 13: "#9A7751", 14: "#9AC183",
  15: "#CA0000", 16: "#007BCA", 17: "#A800A8", 50: "#F3EED1", 51: "#FF5687",
};
function skillIconTag(s) {
  const hex = MH_ITEM_COLOR[s.colorIndex] || "#AEAEAE";
  return `<span class="skill-icon"><span class="skill-icon-r" style="background-color:${hex}"></span><span class="skill-icon-a"></span></span>`;
}
// decorations.json/armor_pieces.json skills only carry name+level (no
// colorIndex), so cross-referencing to a full skills.json record is needed
// to draw the icon on those pill/list rows
function skillIconTagByName(name) {
  const s = skillsByName.get(name);
  return s ? skillIconTag(s) : "";
}

function showSkillsView() {
  hideViews(detailEl, homeViewEl, decorationsViewEl, weaponsViewEl, armorViewEl, materialsViewEl);
  skillsViewEl.hidden = false;
  skillDetailEl.hidden = true;
  skillsIndexEl.hidden = false;
  skillsSearchEl.value = "";
  window.scrollTo(0,0);
  renderSkillsIndex("");
}

function renderSkillsIndex(query) {
  const q = normalizeSearch((query || "").trim());
  const sorted = [...skills].sort((a, b) => trSkillName(a).localeCompare(trSkillName(b)));
  const filtered = !q ? sorted : sorted.filter(s =>
    normalizeSearch(s.name || "").includes(q) || normalizeSearch(s.nameEs || "").includes(q)
  );

  if (!filtered.length) {
    skillsIndexEl.innerHTML = `<p class="no-data">${ui("skillsNoResults")}</p>`;
    return;
  }

  skillsIndexEl.innerHTML = `
    <div class="decorations-slot-group">
      <div class="decorations-grid">
        ${filtered.map(s => `
          <button type="button" class="decoration-card skill-card" data-skill-id="${s.id}">
            <span class="skill-card-top">${skillIconTag(s)}<span class="decoration-card-name">${trSkillName(s)}</span></span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
  skillsIndexEl.querySelectorAll("[data-skill-id]").forEach(btn => {
    btn.addEventListener("click", () => navSkill(btn.dataset.skillId));
  });
}

function showSkillDetail(idOrName) {
  const s = skills.find(x => x.id === idOrName || x.name === idOrName);
  if (!s) return;
  skillsIndexEl.hidden = true;
  skillDetailEl.hidden = false;

  const levelsHtml = s.levels.map(lv => `
    <li class="stat-list-item">
      <span class="stat-name">${lang === "es" ? "Nv." : "Lv."} ${lv.level}</span>
      <span class="decoration-skill-effect">${lang === "es" ? (lv.effectEs || lv.effectEn) : lv.effectEn}</span>
    </li>
  `).join("");

  if (!skillGrantIndex) buildSkillGrantIndex();
  const grantedBy = skillGrantIndex.get(s.name) || { decorations: [], armorPieces: [] };
  const grantedDecorations = grantedBy.decorations
    .map(g => ({ ...g, dec: decorations.find(d => d.id === g.id) }))
    .filter(g => g.dec);
  const grantedArmorPieces = grantedBy.armorPieces
    .map(g => ({ ...g, piece: armorPieces.find(p => p.id === g.id) }))
    .filter(g => g.piece);

  const grantedByHtml = (grantedDecorations.length || grantedArmorPieces.length) ? `
    ${grantedDecorations.length ? `
      <h4 class="skills-granted-subheading">${ui("skillsGrantedByDecorations")}</h4>
      <div class="decorations-grid">
        ${grantedDecorations.map(g => `
          <button type="button" class="decoration-card" data-granted-decoration="${g.dec.id}">
            ${decorationIconTag(g.dec)}
            <span class="decoration-card-name">${trDecorationName(g.dec)} Lv${g.level}</span>
          </button>
        `).join("")}
      </div>
    ` : ""}
    ${grantedArmorPieces.length ? `
      <h4 class="skills-granted-subheading">${ui("skillsGrantedByArmor")}</h4>
      <div class="decorations-grid">
        ${grantedArmorPieces.map(g => `
          <button type="button" class="decoration-card" data-granted-armor-piece="${g.piece.id}">
            ${armorIconTag(g.piece)}
            <span class="decoration-card-name">${trArmorName(g.piece)} Lv${g.level}</span>
          </button>
        `).join("")}
      </div>
    ` : ""}
  ` : `<p class="no-data">${ui("skillsGrantedByNone")}</p>`;

  skillDetailEl.innerHTML = `
    <a class="decorations-back" href="skills">${ui("skillsBack")}</a>
    <div class="decoration-detail-header">
      ${skillIconTag(s)}
      <h2>${trSkillName(s)}</h2>
    </div>
    <p class="gs-material-intro">${lang === "es" ? (s.descEs || s.descEn) : s.descEn}</p>
    <section class="block">
      <h3>${ui("skillsLevelsHeading")}</h3>
      <ul class="stat-list decoration-skills-list">${levelsHtml}</ul>
    </section>
    <section class="block">
      <h3>${ui("skillsGrantedByHeading")}</h3>
      ${grantedByHtml}
    </section>
  `;
  skillDetailEl.querySelectorAll("[data-granted-decoration]").forEach(btn => {
    btn.addEventListener("click", () => navDecoration(btn.dataset.grantedDecoration));
  });
  skillDetailEl.querySelectorAll("[data-granted-armor-piece]").forEach(btn => {
    btn.addEventListener("click", () => navArmorPiece(btn.dataset.grantedArmorPiece));
  });
}

function bootSkills() {
  skillsSearchEl.addEventListener("input", () => renderSkillsIndex(skillsSearchEl.value));
  const params = new URLSearchParams(location.search);
  const skillId = params.get("skill");
  if (skillId && skills.some(s => s.id === skillId || s.name === skillId)) {
    showSkillsView();
    showSkillDetail(skillId);
  } else {
    showSkillsView();
  }
}

function buildSelector() {
  const big = monsters.filter(m => !m.isSmall);
  const small = monsters.filter(m => m.isSmall);
  const bigGroups = new Map();
  for (const m of big) {
    const g = groupFor(m.name);
    if (!bigGroups.has(g)) bigGroups.set(g, []);
    bigGroups.get(g).push(m);
  }
  const sortedBig = [...bigGroups.keys()].sort((a, b) => a.localeCompare(b));
  listEl.innerHTML = "";

  if (big.length) {
    const bigHeading = document.createElement("div");
    bigHeading.className = "monster-section-heading";
    bigHeading.dataset.section = "big";
    bigHeading.textContent = ui("selectorBigMonsters");
    listEl.appendChild(bigHeading);
  }
  for (const groupName of sortedBig) {
    const items = bigGroups.get(groupName).sort((a, b) => a.name.localeCompare(b.name));
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

  if (small.length) {
    const smHeading = document.createElement("div");
    smHeading.className = "monster-section-heading";
    smHeading.dataset.section = "small";
    smHeading.textContent = ui("selectorSmallMonsters");
    listEl.appendChild(smHeading);
    const sortedSmall = small.slice().sort((a, b) => a.name.localeCompare(b.name));
    for (const m of sortedSmall) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "monster-option";
      btn.dataset.name = m.name;
      btn.dataset.search = normalizeSearch(m.name + " " + trMonsterName(m.name));
      btn.setAttribute("role", "option");
      btn.innerHTML = `<img src="${iconPath(m.name)}" alt="" loading="lazy" onerror="this.classList.add('icon-missing')"><span>${trMonsterName(m.name)}</span>`;
      btn.addEventListener("click", () => selectMonster(m.name));
      listEl.appendChild(btn);
    }
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

  const relatedEquipmentSection = node.querySelector('[data-block="related-equipment"]');
  renderRelatedEquipment(monster.name, node.querySelector(".related-equipment-wrap"), relatedEquipmentSection);

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
  // Traced from the user's reference silhouette (vectores/barioth.png,
  // itself recolored from a Monster Hunter Frontier hitzone chart — colors
  // in the source image are Frontier's own tiering, NOT ours; only the
  // outline/regions were used). Head confirmed on the right side per the
  // user. Our real hitzone part names (Head/Neck-Back/Foreleg/Thorns/
  // Abdomen/Wing/Hind Leg/Tail/Tail Tip) don't map 1:1 to the art's 7 flat-
  // color regions, so two pairs double up on one shape (documented per key
  // below) — same "reuse the closest region" pattern as Rathalos's Back.
  Barioth: {
    viewBox: "0 0 943 500",
    parts: {
      // key order follows Kiranico's hitzone table order for this monster:
      // Head, Neck/Back, Abdomen, Thorns, Wing, Hind Leg, Foreleg, Tail, Tail Tip
      Head: ["556,20 556,52 550,70 546,112 549,153 556,171 562,171 564,167 565,129 568,109 573,95 579,100 581,106 585,110 592,112 599,111 613,116 620,128 628,137 625,146 626,149 630,151 652,150 674,156 705,157 732,150 752,142 760,145 764,143 765,138 757,114 756,101 767,100 769,96 768,93 751,73 753,68 751,63 733,48 721,41 718,35 712,33 708,28 689,17 689,4 687,0 588,0 575,5"],
      "Neck/Back": ["749,143 734,149 704,157 671,155 656,150 628,151 628,153 618,163 618,167 614,171 614,174 608,178 609,190 606,211 586,253 587,290 575,308 560,326 560,329 572,345 574,345 591,329 602,314 610,286 624,263 647,248 663,228 680,238 688,241 694,241 722,233 734,224 747,242 750,243 751,223 742,184 745,170 753,168 753,152"],
      // Abdomen has a small second sliver (region9) that's fully inside the
      // left Foreleg's bounding box -- it looked like a stray foot detail
      // at first, but the user confirmed it's actually a bit of exposed
      // belly peeking out, not part of the leg.
      Abdomen: [
        "735,229 732,229 726,234 712,240 691,245 677,240 666,233 663,233 657,242 649,250 626,265 614,285 605,314 595,328 574,348 550,403 552,421 555,421 568,413 576,403 588,397 603,383 608,383 620,370 640,364 657,364 679,353 681,354 692,353 712,348 719,342 727,332 729,321 750,262 748,248",
        "561,334 558,334 558,337 557,338 557,345 556,346 556,352 555,353 555,355 551,359 551,360 542,370 542,371 540,374 540,376 539,377 539,379 537,382 537,384 536,385 536,387 535,388 535,390 533,393 533,395 532,396 532,398 531,399 531,402 530,403 530,404 529,405 529,407 528,408 528,411 527,412 527,415 526,416 526,419 525,420 525,423 524,424 524,428 523,429 523,434 527,438 529,438 529,437 531,435 534,434 536,432 539,431 541,429 542,429 543,428 544,428 546,426 549,425 549,420 548,419 548,413 547,412 547,407 546,406 546,405 547,404 547,402 548,401 548,399 550,396 550,394 551,393 551,391 552,390 552,389 553,388 553,387 554,386 554,385 558,378 558,376 559,375 559,374 563,367 563,365 564,364 564,363 568,356 568,354 570,351 570,347 569,346 569,345 563,338 563,337 561,335",
      ],
      // the two ice-blade spikes on the forearms -- this art has no
      // separate wing membrane shape, and anatomically the wing's leading
      // edge IS these blades on a flying wyvern, so Wing reuses the same
      // two shapes rather than borrowing something visually unrelated
      Thorns: [
        "431,54 421,65 392,141 387,142 385,166 376,168 374,172 378,195 370,197 368,201 372,225 370,228 363,228 361,232 370,255 369,258 355,250 350,252 349,257 364,310 359,318 381,364 380,371 388,392 411,434 413,448 421,453 439,486 443,488 447,486 453,471 459,444 460,426 479,369 480,338 486,298 506,260 498,252 477,217 462,212 452,212 428,202 423,198 423,190 414,184 415,175 427,168 429,164 427,159 419,156 427,107 437,69 436,56",
        "781,115 783,131 813,218 812,221 808,222 808,230 818,236 812,254 808,257 802,256 797,273 796,291 803,317 819,358 825,397 833,427 845,442 863,443 889,450 892,432 940,383 940,381 936,381 902,396 899,395 900,391 939,349 942,342 907,357 901,357 903,338 921,304 889,320 886,318 884,311 899,285 878,292 873,280 880,258 867,264 858,249 865,231 854,236 850,233 842,221 844,204 835,206 790,122",
      ],
      Wing: [
        "431,54 421,65 392,141 387,142 385,166 376,168 374,172 378,195 370,197 368,201 372,225 370,228 363,228 361,232 370,255 369,258 355,250 350,252 349,257 364,310 359,318 381,364 380,371 388,392 411,434 413,448 421,453 439,486 443,488 447,486 453,471 459,444 460,426 479,369 480,338 486,298 506,260 498,252 477,217 462,212 452,212 428,202 423,198 423,190 414,184 415,175 427,168 429,164 427,159 419,156 427,107 437,69 436,56",
        "781,115 783,131 813,218 812,221 808,222 808,230 818,236 812,254 808,257 802,256 797,273 796,291 803,317 819,358 825,397 833,427 845,442 863,443 889,450 892,432 940,383 940,381 936,381 902,396 899,395 900,391 939,349 942,342 907,357 901,357 903,338 921,304 889,320 886,318 884,311 899,285 878,292 873,280 880,258 867,264 858,249 865,231 854,236 850,233 842,221 844,204 835,206 790,122",
      ],
      // the real Hind Leg -- smaller/partly hidden, sitting in the gap
      // between the two front legs (only one of the two "extra" shapes
      // found there was a Foreleg duplicate; this one is the genuine thing)
      "Hind Leg": ["612,382 612,385 616,386 614,389 611,400 613,409 615,413 625,421 633,436 634,444 642,455 642,457 644,460 644,464 650,469 653,469 659,462 658,459 659,457 663,457 667,464 672,465 676,468 682,468 683,469 697,469 698,466 699,467 712,467 714,469 716,469 719,466 725,466 726,465 726,462 719,452 713,449 710,449 709,452 705,450 702,451 692,443 682,439 678,434 668,429 666,426 665,421 660,415 659,401 661,398 665,399 670,403 672,403 675,400 678,405 678,408 681,408 685,404 686,391 687,390 687,376 686,375 684,360 682,357 677,357 656,368 642,367 621,373"],
      // both of these are Forelegs (Barioth is drawn facing the viewer, 3/4
      // front-on, not in profile -- the user confirmed the bigger one isn't
      // further back, it's the OTHER front leg spread apart/foreshortened
      // by the pose)
      Foreleg: [
        "607,176 599,175 579,178 566,173 562,175 558,188 543,195 536,196 531,205 533,210 531,225 522,247 515,255 509,254 502,259 482,297 476,336 474,373 456,426 455,443 449,470 441,489 443,494 452,499 470,499 481,493 492,499 520,499 523,495 544,498 551,496 553,489 548,479 555,476 555,469 547,455 538,450 533,451 529,447 523,431 528,409 540,375 555,356 559,329 576,308 588,288 587,252 607,209 610,186",
        "746,183 754,220 754,261 733,319 727,345 739,367 758,390 782,438 791,467 806,487 804,493 830,496 840,492 844,498 847,498 850,494 866,495 870,499 877,497 886,498 896,493 939,497 935,489 915,476 903,472 891,454 865,447 845,446 830,428 822,399 816,359 799,315 793,292 793,275 803,238 808,230 808,223 785,203 780,188 776,189 774,183 769,186 768,184 757,186",
      ],
      // the traced Tail was one single region -- the user asked for a real
      // split, not just a duplicate label, so this cuts the polygon at
      // x=100 (a vertex already exists there on the bottom/serrated edge;
      // the matching point on the smooth top edge is interpolated between
      // its two nearest vertices) into a small tip piece and the rest of
      // the tail. Provisional cut point -- nudge it if the boundary looks
      // off once rendered.
      Tail: ["100,347 106,348 113,365 119,365 125,343 132,344 134,350 138,352 145,348 159,350 161,356 165,358 173,352 180,356 192,354 199,359 205,356 211,362 218,357 243,359 247,367 252,370 261,362 280,369 285,383 291,383 298,377 305,382 306,388 317,389 320,392 323,407 344,406 357,414 363,421 366,432 372,432 378,426 406,436 411,435 413,431 385,373 385,363 370,332 359,328 343,316 307,302 273,293 190,285 159,285 150,288 127,289 100,299"],
      "Tail Tip": ["0,348 0,362 17,360 27,369 31,367 33,359 47,374 52,372 54,354 66,373 72,373 77,351 86,368 94,369 96,349 100,347 100,299 54,315"],
    },
  },
  // Traced from vectores/basarios.png. Head/Neck were the opposite of the
  // first guess by position: the small pointy sliver at the very tip is the
  // Head (not the chunky jagged shape behind it, which is Lower Neck) --
  // confirmed by the user. Wing = the long thin strip that runs almost the
  // whole body length under the rock shell (its front-facing view) PLUS the
  // 3 small rock-blade slivers near the shoulder, which the user clarified
  // are the SAME wing seen from behind, just partly hidden by Basarios's own
  // body -- not a separate part. Abdomen is only the belly bulge near the
  // legs (the long strip was originally mis-grouped here). Lower Tail/Tail
  // Tip is a real geometric split (same technique as Barioth's tail) since
  // the real data has a big gap between them (sever 15 vs 28) -- cut at
  // x=952, using an existing vertex on the top edge and interpolating the
  // bottom.
  Basarios: {
    viewBox: "0 0 1134 500",
    parts: {
      Head: ["4,175 0,211 11,238 12,252 18,264 20,281 25,290 27,299 27,305 18,317 18,325 35,326 49,332 65,331 69,333 82,332 80,327 71,317 74,316 80,317 88,329 89,333 92,334 100,327 102,318 87,295 89,279 92,277 100,276 105,265 105,258 83,254 75,249 77,246 85,242 92,233 93,195 90,186 84,185 77,187 61,218 53,225 49,225 47,219 43,218 40,215 36,201 21,181 17,179 16,192 14,193 7,175"],
      "Lower Neck": ["214,134 201,128 196,129 178,141 173,152 162,136 156,136 133,166 130,162 127,161 121,163 109,172 93,189 93,200 91,204 93,231 86,241 79,244 78,248 79,251 83,254 105,259 105,267 99,277 91,278 88,284 89,298 105,321 112,322 202,311 225,303 235,290 238,275 236,253 240,246 242,238 242,204 246,184 239,166 232,162"],
      Back: ["511,20 474,0 446,0 401,15 397,20 378,72 370,75 363,86 365,66 363,57 339,56 293,59 281,86 272,100 251,124 234,159 246,186 241,208 240,247 234,257 236,268 235,290 243,291 262,276 304,250 333,223 353,212 365,195 402,163 435,144 480,146 499,126 523,117 527,103 509,74"],
      Wing: [
        "899,69 890,68 668,154 652,150 634,157 611,151 687,103 684,94 606,129 579,129 630,89 625,84 573,110 541,103 495,123 477,141 429,142 397,160 349,209 221,303 219,313 206,324 203,341 183,354 167,388 167,437 175,437 184,413 196,399 199,421 206,422 216,400 233,385 250,388 257,378 280,371 309,349 371,321 430,303 436,289 447,288 591,221 672,194 679,181 898,76",
        "593,67 590,67 589,68 585,68 584,69 581,69 580,70 577,70 576,71 573,71 572,72 569,72 568,73 565,73 564,74 560,74 559,75 557,75 556,76 552,76 551,77 548,77 547,78 544,78 543,79 541,79 540,80 540,81 539,82 539,83 537,85 537,86 536,87 536,88 535,89 535,90 533,92 533,94 532,95 532,97 531,98 531,100 530,101 530,103 529,104 529,109 531,109 532,108 533,108 536,106 538,106 539,105 540,105 541,104 542,104 545,102 547,102 548,103 548,104 549,105 549,106 551,109 554,109 555,108 563,108 564,109 571,109 572,110 575,110 576,109 577,109 579,107 580,107 581,106 582,106 583,105 584,105 585,104 586,104 587,103 588,103 589,102 590,102 591,101 592,101 593,100 594,100 595,99 595,86 594,85 594,75 593,74",
        "696,123 695,122 694,119 690,115 690,114 687,111 672,111 669,114 668,114 666,116 665,116 662,119 661,119 659,121 658,121 656,123 655,123 653,125 652,125 649,128 648,128 646,130 645,130 643,132 642,132 639,135 638,135 636,137 635,137 633,139 632,139 629,142 628,142 626,144 625,144 624,145 622,145 619,147 617,147 614,149 612,149 611,150 611,152 612,152 613,153 617,153 618,154 623,154 624,155 628,155 629,156 634,156 635,157 638,157 639,156 640,156 641,155 642,155 643,154 644,154 645,153 646,153 647,152 648,152 653,149 654,149 655,150 657,150 658,151 660,151 663,153 669,153 670,152 672,152 673,151 675,151 678,149 680,149 683,147 685,147 688,145 690,145 691,144 693,144 694,143 695,143 696,142 698,142 699,141 699,138 697,136 697,135 696,134",
        "606,125 604,123 604,122 603,121 603,120 602,119 602,118 598,118 597,119 596,119 595,120 594,120 592,122 591,122 590,123 589,123 588,124 587,124 586,125 585,125 584,126 583,126 582,127 581,127 580,128 579,128 579,131 584,131 585,130 597,130 598,129 606,129",
      ],
      Abdomen: [
        "644,313 629,279 601,248 598,224 591,221 543,238 449,284 434,286 430,297 426,302 365,320 300,351 298,356 300,360 344,383 402,405 453,408 511,404 524,401 571,382 613,337 641,320",
      ],
      Leg: [
        "436,410 435,409 428,409 427,408 421,408 420,407 413,407 412,406 405,406 404,405 399,405 392,415 392,416 371,437 368,438 364,441 348,441 347,442 336,443 334,446 334,449 332,453 330,455 322,455 317,459 311,462 304,475 304,478 307,478 308,477 311,477 312,478 329,478 330,477 336,478 341,472 346,470 348,468 357,464 366,463 370,460 373,455 375,455 378,453 380,453 386,450 391,449 394,447 402,448 403,449 412,449 413,448 417,448 427,441 430,434 432,432 435,426",
        "511,405 442,409 439,426 429,443 422,449 417,452 404,452 403,451 387,452 382,457 379,456 373,458 369,464 352,468 343,475 343,482 352,482 353,483 349,491 349,495 355,495 363,493 383,493 387,497 403,497 411,492 412,493 411,499 444,499 451,497 468,497 469,498 498,497 512,483 512,476 508,460 508,443 509,442",
      ],
      "Lower Tail": ["594,222 600,253 628,283 642,314 646,316 672,301 730,280 791,269 952,268 952,174 921,171 914,175 909,185 903,184 902,157 894,151 862,145 837,145 828,148 814,167 813,156 807,145 807,124 802,119 735,151 722,166 712,162 679,178 669,194 596,218"],
      "Tail Tip": ["952,268 991,268 1133,259 1132,249 1036,217 977,201 978,191 952,174"],
    },
  },
  // Traced from vectores/chameleos.png. Head includes the long prehensile
  // tongue (one connected shape, not decoration). Wing = the two big black
  // shapes spread on each side. Tail = the curled shape, matches the
  // "chameleon tail curls" body trait. Foreleg/Abdomen/Back/Hind Leg (the
  // torso + leg cluster) were lower confidence -- flagged provisional, user
  // said the whole monster "looked fine" but hasn't confirmed this cluster
  // specifically by hex yet.
  Chameleos: {
    viewBox: "0 0 539 500",
    parts: {
      Head: ["346,8 331,9 312,23 254,101 242,125 229,170 214,199 208,190 205,146 188,67 183,62 178,65 152,174 131,188 116,210 116,220 79,243 83,262 59,281 59,288 76,303 63,323 63,330 78,333 82,347 89,347 119,334 135,337 154,348 182,345 218,335 241,313 237,299 244,288 256,283 260,278 272,275 272,265 279,256 262,243 263,226 240,220 255,153 264,129 289,95 339,56 351,43 356,33 356,20"],
      Wing: [
        "527,1 496,0 484,7 464,11 436,32 389,87 347,146 331,192 327,223 323,231 314,240 278,299 280,303 309,316 320,334 323,335 328,332 352,300 376,275 383,261 417,212 420,202 426,196 440,173 458,136 473,83 476,61 498,36 508,20 523,22 538,29 538,13 535,7",
        "137,2 126,3 114,10 85,39 47,86 21,124 6,157 0,187 0,234 4,237 6,242 33,245 79,268 87,268 89,262 84,247 106,237 116,227 122,226 125,221 122,213 135,192 157,179 163,148 149,106 138,81 134,76 126,73 123,61 133,30 136,35 142,35 148,21 147,15 142,5",
      ],
      Tail: ["463,239 455,240 437,249 414,280 404,307 392,329 359,364 353,364 353,366 367,370 382,391 382,399 386,417 418,432 426,439 431,450 435,452 448,450 449,430 441,418 443,415 459,403 462,403 463,410 471,417 477,418 487,414 491,399 479,386 465,383 460,380 454,357 457,355 464,355 470,345 470,341 464,335 450,331 448,329 437,306 441,294 435,286 442,272 444,290 452,301 468,301 480,289 485,276 483,256 473,243"],
      Back: ["241,313 241,315 242,316 242,317 243,318 243,319 244,320 244,321 245,322 245,323 246,324 246,325 247,326 247,327 248,328 248,329 249,330 249,331 250,332 250,333 251,334 251,335 252,336 252,337 253,338 253,339 260,352 263,352 267,348 270,348 271,349 275,349 276,350 278,350 285,354 287,354 288,355 297,359 298,360 299,363 301,365 301,366 304,366 309,362 322,362 323,363 332,363 335,361 335,359 329,353 326,352 324,350 324,346 323,345 323,338 322,337 322,333 321,332 318,325 316,323 313,316 308,312 307,312 298,307 296,307 289,303 287,303 284,301 277,301 276,302 271,302 270,303 264,303 263,304 257,304 256,305 252,305 248,308 247,308"],
      // this shape used to be one of the 2 "Hind Leg" guesses (the bigger
      // one) -- the user corrected it to the real Foreleg. Second polygon
      // is the RIGHT lobe of the shape that used to be "Abdomen" (left half
      // of that split, see Abdomen's comment below): the user asked, as a
      // follow-up test, to carve the lower-left lobe of this piece (the bit
      // bordering Abdomen/Hind Leg further down) into Abdomen too, keeping
      // just this toe/claw-shaped remainder as Foreleg. Cut at the natural
      // x~270 vertical seam already present in the trace (270,437/270,453).
      Foreleg: [
        "170,364 167,364 167,365 159,373 154,383 153,387 148,392 141,397 141,399 139,402 137,409 127,428 127,433 128,434 128,449 129,450 129,456 130,458 119,465 114,465 107,468 99,469 92,475 90,475 86,477 82,482 82,489 84,489 85,487 88,485 89,487 107,488 109,492 111,492 113,489 135,489 141,485 143,487 143,489 145,489 146,488 149,491 152,491 157,487 160,482 169,473 169,471 174,462 174,460 171,453 171,450 170,449 175,439 175,425 174,424 174,420 184,403 184,401 182,398 178,385 176,382 173,372 171,369",
        "270,453 267,458 257,465 251,476 251,482 254,485 257,483 259,490 265,491 267,495 271,493 285,493 286,491 304,497 308,493 308,485 298,475 300,469 305,465 311,449 311,428 313,421 316,418 323,423 327,423 330,421 330,364 310,363 302,369 297,361 278,352 268,351 270,453",
      ],
      // this shape used to be the "Foreleg" guess (small orange shape near
      // the front legs) -- the user corrected it to Abdomen, then asked to
      // fuse it with the lower-left lobe carved out of the leg-split piece
      // (see Foreleg's comment above) into one seamless shape. Unlike
      // Diablos's wing merge, these two pieces came from independently
      // traced regions with a ~2-8px mismatch along their shared edge, not
      // one polygon that I'd cut myself -- so a real geometric union was
      // needed (shapely: buffer(2.5, mitre) both shapes, union, buffer back
      // by -2.5, simplify(0.75)) instead of just reusing original points.
      Abdomen: ["171,366 181,390 183,398 188,408 193,408 194,411 225,424 269,421 268,351 260,356 240,315 237,315 217,334 182,344 157,345 157,348 161,353 163,358 164,359 171,359"],
      // this shape used to be the OTHER "Hind Leg" guess (the smaller one)
      // -- confirmed correct, kept as-is. Second polygon is the right half
      // of the split former-"Abdomen" shape (see Foreleg comment above).
      "Hind Leg": [
        "202,415 202,418 208,430 212,431 226,438 228,440 235,443 237,445 240,446 241,447 241,449 240,450 240,454 238,457 231,458 230,459 228,459 224,461 216,461 215,462 211,462 207,464 198,464 194,468 194,474 196,474 198,472 199,472 201,476 209,480 238,480 239,479 248,478 253,475 253,473 255,470 256,466 259,463 264,461 269,454 269,443 268,442 268,440 272,432 272,428 270,424 268,422 261,422 260,423 252,423 251,424 243,424 242,425 235,425 233,426 232,425 227,425 226,424 224,424 214,419 212,419 209,417 207,417 204,415",
        "330,421 344,414 342,428 344,450 361,475 376,480 393,492 420,492 434,496 461,495 464,499 467,499 466,488 457,479 413,468 387,451 388,445 384,439 384,412 379,390 367,372 347,365 330,364",
      ],
    },
  },
  // Traced from vectores/diablos.png. First-pass guess was wrong on almost
  // every part except Head/Abdomen/Leg -- corrected against the user's
  // numbered index (see the "N:PartName" labels the annotated preview used):
  // what looked like the neck (2) is actually Back, what looked like Back
  // (3) is actually Neck, the tail-shaped elongated piece (old Tail+Tail
  // Tip, 6/7) is actually Wing (folded against the body, not a tail), and
  // what was guessed as the horn tip (1) is actually the Tail. Horn itself
  // has no dedicated traced region at all -- it's the smooth curling
  // protrusion at the top of the Head shape, so it's cut out of Head's own
  // polygon (same technique as the Basarios/Diablos tail-tip splits): the
  // cut runs from the vertex where the horn's front edge meets the jaw
  // (391,139) straight to the nearest vertex on the horn's back edge
  // (461,46). Tail Tip has no dedicated region either (the new Tail source
  // is a single unsplit shape) -- reuses the full Tail shape for now,
  // flagged here since the real data wants it split (sever 50 vs 23) same
  // as the others once there's a clear cut point to use.
  Diablos: {
    viewBox: "0 0 629 500",
    parts: {
      Head: ["391,139 332,119 306,116 292,120 272,113 266,118 275,129 272,140 288,156 323,166 334,177 335,193 317,208 292,216 291,223 301,230 317,233 354,214 353,230 345,244 350,249 363,249 359,265 364,282 378,285 394,279 435,234 452,238 461,236 463,231 455,213 483,224 506,255 524,255 562,245 562,238 548,226 548,222 563,211 569,196 530,193 537,183 537,176 520,174 523,164 511,162 514,149 505,146 511,139 511,132 491,131 489,113 478,112 476,89 461,46"],
      Horn: ["219,1 224,24 239,45 284,72 344,88 382,88 393,97 401,118 391,139 461,46 411,15 349,33 304,37 266,29 240,15 230,0"],
      Neck: ["436,231 435,232 431,233 418,245 418,250 416,252 416,253 411,258 411,259 395,274 394,276 388,279 383,280 382,281 374,282 372,283 372,286 375,288 383,290 407,315 407,316 412,321 414,326 417,330 425,330 426,329 428,329 431,333 433,333 440,329 443,333 446,333 448,331 448,326 452,323 456,315 459,311 459,307 460,306 460,301 461,300 461,296 462,295 462,287 460,285 461,284 461,282 462,281 462,279 464,275 464,248 463,247 463,245 462,244 462,242 461,241 461,239 459,235 454,235 453,236 452,235 450,235 449,234 447,234 446,233 444,233 440,231"],
      Back: ["267,263 264,274 262,277 262,283 284,320 284,324 283,325 283,333 288,333 289,332 305,332 306,331 309,331 310,330 316,329 320,327 323,327 324,326 327,326 331,324 337,323 340,320 344,318 347,315 348,315 351,312 360,306 360,300 361,299 361,293 362,292 362,286 363,285 363,272 362,271 362,264 361,262 363,261 363,255 366,251 367,245 360,245 359,246 346,246 345,247 343,247 339,249 336,249 335,250 330,248 328,246 327,243 323,237 319,238 317,240 317,245 313,247 305,238 295,239 290,236 287,236 287,238 290,241 288,243 284,244"],
      Wing: [
        "455,221 455,225 461,234 461,240 465,251 464,275 461,282 463,292 460,306 460,314 473,325 505,334 552,373 570,391 594,405 599,410 605,420 609,420 619,428 623,429 627,422 623,408 626,407 628,403 628,396 625,392 626,391 625,386 621,382 619,376 615,377 609,374 605,370 601,360 597,357 598,351 589,343 580,329 558,287 546,276 527,251 506,252 504,250 504,246 486,221 472,215 468,215 466,220 458,219",
        // was cut into 2 pieces earlier (a leftover from when this shape was
        // mapped to Tail/Tail Tip) -- now both sides are Wing, so it's back
        // to the single original traced outline, no internal seam
        "0,220 1,253 59,289 123,335 216,366 222,383 229,383 238,371 257,367 263,350 274,338 283,335 286,323 285,318 264,281 269,269 268,265 207,234 165,230 156,224 143,224 136,227 125,224 113,225 107,223 101,227 93,227 80,221 67,223 63,229 51,219 34,217 30,213 29,206 33,196 32,193 28,191 24,192 9,207",
      ],
      Abdomen: ["443,334 441,330 439,330 431,335 429,331 417,332 410,320 385,292 374,289 366,282 364,282 363,284 363,292 362,293 362,305 335,325 328,326 302,334 272,335 261,348 259,362 263,362 269,364 276,364 284,362 300,364 307,372 309,383 320,394 329,397 344,396 345,395 349,395 364,387 373,384 400,366 402,368 406,368 411,362 414,366 417,366 435,350 443,339"],
      // real geometric split (sever 50 vs 23) -- the user clarified the
      // jagged crown-shaped mass is the Tail Tip, the thin pointed
      // extension trailing off it is the normal Tail, cut at the two
      // vertices where the thin part meets the crown (160,203 / 207,217)
      Tail: ["160,203 187,236 206,237 263,267 266,267 267,260 234,242 207,217"],
      "Tail Tip": ["207,217 191,195 200,191 204,187 205,173 213,165 213,162 203,162 201,153 211,138 211,135 193,142 187,136 192,117 189,117 180,125 175,127 169,123 169,109 166,109 157,117 130,98 130,101 146,132 146,139 142,142 142,154 139,160 138,155 140,143 132,148 125,138 126,122 123,122 118,127 115,111 109,115 98,103 91,99 96,111 96,134 92,137 92,143 97,160 97,170 103,180 105,193 114,193 123,201 125,209 128,209 137,203 160,203"],
      Leg: [
        "374,383 375,386 385,392 394,392 400,394 400,401 405,415 416,424 417,427 418,442 422,447 422,467 429,472 434,478 454,486 474,490 474,488 466,480 470,477 483,472 489,479 494,481 495,485 509,484 509,475 506,471 506,462 494,451 489,449 478,449 473,451 458,448 455,446 447,435 436,412 434,405 435,404 450,405 451,403 455,408 457,408 458,398 456,395 455,390 455,382 443,362 431,357 426,357 416,366 413,363 410,363 404,369 402,366 400,366",
        "301,365 283,364 282,365 271,366 265,364 257,364 250,367 250,378 248,383 248,387 238,401 236,418 226,437 218,446 217,456 213,461 202,463 197,469 197,477 196,478 197,485 200,485 204,482 206,484 205,485 205,493 206,494 215,493 217,491 217,488 219,486 223,485 225,488 225,499 234,498 236,497 236,494 240,489 240,487 241,486 246,486 252,476 259,481 265,483 267,488 267,495 270,494 274,487 274,467 272,464 266,462 262,459 259,450 256,447 257,446 257,439 268,436 269,441 271,441 275,439 278,434 284,431 292,432 297,419 301,416 311,401 312,394 307,378 306,371",
      ],
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

// how close (relative to the max) a value has to be to count as "tied for
// red" -- ex. Barioth Head=65/Tail Tip=60 is a 7.7% gap, close enough that
// the user wants both shown as the top tier instead of just the exact max.
// Confirmed as a general rule (checked it doesn't change Rathalos: its 2nd
// value, 50, is 23% below max 65, well outside this threshold).
const HZ_RED_TIER_RELATIVE_THRESHOLD = 0.10;

function tierColorsByPart(hitzones, statKey) {
  // red = highest distinct value AND any other value within ~10% relative
  // of it, orange = highest of what's left, yellow = everything else
  // EXCEPT the single lowest distinct value, gray = that lowest value only
  // (the "doesn't take extra damage" baseline). Confirmed with the user
  // using Rathalos: 65=red, 50=orange, 45 & 35=yellow, 25(the minimum)=gray.
  const distinctValues = [...new Set(hitzones.map(h => h[statKey] || 0))]
    .filter(v => v > 0)
    .sort((a, b) => b - a);
  const colorByValue = {};
  const max = distinctValues[0];
  const redCount = distinctValues.filter(v => v >= max * (1 - HZ_RED_TIER_RELATIVE_THRESHOLD)).length;
  distinctValues.forEach((v, i) => {
    if (i < redCount) colorByValue[v] = HZ_SILHOUETTE_TIER_COLORS[0];
    else if (i === redCount) colorByValue[v] = HZ_SILHOUETTE_TIER_COLORS[1];
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

// Small decorative preview for a home-page news card: reuses the traced
// silhouette shapes but with a single flat fill (no per-part stat coloring,
// no tooltips/interactivity) since it's just illustrating "we added these".
function newsSilhouettePreviewHtml() {
  const names = ["Rathalos", "Barioth"];
  return names.map(name => {
    const shape = HITZONE_SHAPES[name];
    if (!shape) return "";
    const polys = Object.values(shape.parts).flat().map(pts =>
      `<polygon points="${pts}" fill="var(--news-preview-fill, #b8531f)" stroke="#14110f" stroke-width="2"></polygon>`
    ).join("");
    return `<svg class="news-preview-svg" viewBox="${shape.viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${polys}</svg>`;
  }).join("");
}

// Patch-notes-style news feed on the Home page. Each entry has a short intro
// (title + text, shown collapsed) and a longer bullet list (shown on click).
// Kept as a plain array instead of a JSON file since it's small, hand-written,
// and tied 1:1 to the i18n keys that hold its translated text.
const NEWS = [
  {
    id: "v04",
    tagKey: "newsV04Tag",
    titleKey: "newsV04Title",
    textKey: "newsV04Text",
    bulletsKey: "newsV04Bullets",
    imageHtml: () => `
      <img src="data/images/armor_sets/rathalos-x-set.png" alt="" loading="lazy">
      <img src="data/images/armor_sets/zinogre-set-x.png" alt="" loading="lazy">
    `,
  },
  {
    id: "v03",
    tagKey: "newsV03Tag",
    titleKey: "newsV03Title",
    textKey: "newsV03Text",
    bulletsKey: "newsV03Bullets",
    imageHtml: () => `
      ${itemMaskIconTag("065", 4, "news-item-icon")}
      ${itemMaskIconTag("031", 11, "news-item-icon")}
    `,
  },
  {
    id: "v02",
    tagKey: null,
    tag: "v0.2 Alpha",
    titleKey: "newsV02Title",
    textKey: "newsV02Text",
    bulletsKey: "newsV02Bullets",
    imageHtml: () => `
      <img src="data/images/weapons/1953968039.webp" alt="" loading="lazy">
      <img src="data/images/armor_sets/rathalos-x-set.png" alt="" loading="lazy">
    `,
  },
  {
    id: "v01",
    tagKey: null,
    tag: "v0.1 Alpha",
    titleKey: "newsV01Title",
    textKey: "newsV01Text",
    bulletsKey: "newsV01Bullets",
    imageHtml: () => newsSilhouettePreviewHtml(),
  },
];

let newsExpanded = new Set();
function renderNews() {
  const el = document.getElementById("news-list");
  if (!el) return;
  el.innerHTML = NEWS.map(n => {
    const tag = n.tagKey ? ui(n.tagKey) : n.tag;
    const bullets = ui(n.bulletsKey) || [];
    const expanded = newsExpanded.has(n.id);
    return `
      <article class="news-item${expanded ? " expanded" : ""}">
        <button type="button" class="news-item-toggle" data-news-id="${n.id}" aria-expanded="${expanded}">
          <div class="news-item-image${n.id === "v02" ? " news-item-image--split" : ""}">${n.imageHtml()}</div>
          <div class="news-item-body">
            <span class="news-item-tag">${escapeAttr(tag)}</span>
            <h3 class="news-item-title">${escapeAttr(ui(n.titleKey))}</h3>
            <p class="news-item-text">${escapeAttr(ui(n.textKey))}</p>
            <span class="news-item-toggle-label">${expanded ? ui("newsHideDetails") : ui("newsSeeDetails")}</span>
          </div>
        </button>
        ${bullets.length ? `
          <div class="news-item-detail" ${expanded ? "" : "hidden"}>
            <ul>${bullets.map(b => `<li>${escapeAttr(b)}</li>`).join("")}</ul>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");

  el.querySelectorAll("[data-news-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.newsId;
      if (newsExpanded.has(id)) newsExpanded.delete(id);
      else newsExpanded.add(id);
      renderNews();
    });
  });
}

// Per physical column (sever/blunt/projectile), highlight only the body
// part(s) tied for the single highest value in THAT column -- ex. if Wing is
// the only 50% under Sever, only Wing's Sever cell lights up, not every part
// that happens to be a row-local max. Mirrors rankElementColumns's "best"
// tier but scoped per column instead of picking one column overall, since
// each physical type is its own independent comparison across body parts.
function rankPhysicalCellsByColumn(hitzones) {
  const maxByKey = {};
  for (const key of HITZONE_PHYSICAL_COLS) {
    maxByKey[key] = Math.max(0, ...hitzones.map(r => r[key] || 0));
  }
  return hitzones.map(row => {
    const classByKey = {};
    for (const key of HITZONE_PHYSICAL_COLS) {
      if (maxByKey[key] > 0 && (row[key] || 0) === maxByKey[key]) classByKey[key] = "hz-best";
    }
    return classByKey;
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

  // headers stay unstyled -- only the value cells glow, same as the
  // physical damage columns, per the user's request to keep it consistent
  const theadCells = cols.map(c => `<th>${hzStatIconTag(c.key)}${c.label}</th>`).join("");
  const physClassByRow = rankPhysicalCellsByColumn(hitzones);
  const bodyRows = hitzones.map((row, i) => {
    const physClass = physClassByRow[i];
    const cells = cols.map(c => {
      const cls = HITZONE_PHYSICAL_COLS.includes(c.key) ? (physClass[c.key] || "") : (colClass[c.key] || "");
      return `<td class="${cls}">${row[c.key] ?? "—"}%</td>`;
    }).join("");
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

function normalizeDropText(text) {
  if (!text) return text;
  return text.replace(/\bPalico\s*/gi, "").replace(/\bx1\b/g, "").replace(/\s+/g, " ").replace(/\bx(\d+)\b/g, "[x$1]").trim();
}

function renderMaterialsTable(tbody, rows) {
  if (!rows || !rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="no-data">${ui("noMaterialsForRank")}</td></tr>`;
    return;
  }
  const fmt = (text, mat) => annotateAnomalyLevel(trPartTokens(normalizeDropText(text)), mat) || "—";
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="material-name">
        <button type="button" class="material-name-link" data-mat-key="${escapeAttr(r.material)}">
          ${materialIconTag(r.material)}${trMaterial(r.material) || ""}
        </button>
      </td>
      <td>${r.rarity ?? "—"}</td>
      <td>${fmt(r.targetReward, r.material)}</td>
      <td>${fmt(r.capture, r.material)}</td>
      <td>${fmt(r.breakParts, r.material)}</td>
      <td>${fmt(r.carves, r.material)}</td>
      <td>${fmt(r.dropped, r.material)}</td>
    </tr>
  `).join("");
  tbody.querySelectorAll("[data-mat-key]").forEach(btn => {
    btn.addEventListener("click", () => navMaterial(btn.dataset.matKey));
  });
}

init();
