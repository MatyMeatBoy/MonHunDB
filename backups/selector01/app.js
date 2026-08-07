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

const selectEl = document.getElementById("monster-select");
const detailEl = document.getElementById("detail");
const tpl = document.getElementById("tpl-detail");
const langToggleEl = document.getElementById("lang-toggle");

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
  selectEl.setAttribute("aria-label", ui("selectPlaceholder"));
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
    const [monstersRes] = await Promise.all([
      fetch("data/monsters.json"),
      loadMaterialTranslations(),
    ]);
    if (!monstersRes.ok) throw new Error("HTTP " + monstersRes.status);
    monsters = await monstersRes.json();
  } catch (err) {
    selectEl.innerHTML = `<option value="">${ui("selectError")}</option>`;
    detailEl.innerHTML = `<p class="empty-state">${I18N.ui[lang].loadError(err.message)}</p>`;
    return;
  }

  buildSelector();

  const params = new URLSearchParams(location.search);
  const initial = params.get("m");
  if (initial && monsters.some(m => m.name === initial)) {
    selectEl.value = initial;
    renderMonster(initial);
  }

  selectEl.addEventListener("change", () => {
    if (selectEl.value) {
      renderMonster(selectEl.value);
      const url = new URL(location.href);
      url.searchParams.set("m", selectEl.value);
      history.replaceState(null, "", url);
    }
  });

  langToggleEl.addEventListener("click", () => {
    lang = lang === "es" ? "en" : "es";
    localStorage.setItem("mh-lang", lang);
    applyUiStrings();
    buildSelector();
    if (selectEl.value) renderMonster(selectEl.value);
  });
}

function buildSelector() {
  const groups = new Map();
  for (const m of monsters) {
    const g = groupFor(m.name);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(m);
  }

  const sortedGroupNames = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const prevValue = selectEl.value;

  selectEl.innerHTML = `<option value="">${ui("selectPlaceholder")}</option>`;

  for (const groupName of sortedGroupNames) {
    const items = groups.get(groupName).sort((a, b) => a.name.localeCompare(b.name));
    if (items.length === 1) {
      const opt = document.createElement("option");
      opt.value = items[0].name;
      opt.textContent = trMonsterName(items[0].name);
      selectEl.appendChild(opt);
    } else {
      const optgroup = document.createElement("optgroup");
      optgroup.label = trMonsterName(groupName);
      for (const it of items) {
        const opt = document.createElement("option");
        opt.value = it.name;
        opt.textContent = trMonsterName(it.name);
        optgroup.appendChild(opt);
      }
      selectEl.appendChild(optgroup);
    }
  }

  if (prevValue) selectEl.value = prevValue;
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
    ? weaknesses.map(w => `<li><span class="stat-name">${trElement(w.element)}</span>${
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
    return `<li><span class="stat-name">${trElement(r.element)}</span>${right}</li>`;
  });
  const condRows = conditionalRes.map(c => {
    const label = lang === "es" ? c.labelEs : c.labelEn;
    const right = c.immune
      ? `<span class="badge-immune">${ui("immune")}</span>`
      : `<span class="badge-resistant">${ui("weak")}</span>`;
    const titleText = c.confirmed ? ui("specialCaseTitle") : ui("specialCaseUnconfirmedTitle");
    return `<li class="res-cond" title="${titleText}"><span class="stat-name">${label}</span>${right}</li>`;
  });
  resList.innerHTML = (resRows.length || condRows.length)
    ? resRows.join("") + condRows.join("")
    : `<li class="no-data">${ui("noData")}</li>`;

  renderHitzones(node.querySelector(".hitzones-table-wrap"), monster.hitzones);

  const ailList = node.querySelector(".ailments-list");
  const ailments = monster.ailmentBuildup && monster.ailmentBuildup.length
    ? monster.ailmentBuildup
    : (monster.ailmentSusceptibility || []).map(a => ({ label: a.ailment, stars: a.stars, buildup: [] }));
  ailList.innerHTML = ailments.length
    ? ailments.map(a => `
        <li class="ailment-item">
          <details>
            <summary>
              <span class="stat-name">${trAilment(a.label)}</span>
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
    ? attackEls.map(e => `<li>${trElement(e)}</li>`).join("")
    : `<li class="no-data">${ui("none")}</li>`;

  const inflictsList = node.querySelector(".inflicts-list");
  const inflicts = monster.inflicts || [];
  inflictsList.innerHTML = inflicts.length
    ? inflicts.map(i => `<li>${trAilment(i)}</li>`).join("")
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
}

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

  const theadCells = cols.map(c => `<th class="${colClass[c.key] || ""}">${c.label}</th>`).join("");
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
      <td class="material-name">${trMaterial(r.material) || ""}</td>
      <td>${r.rarity ?? "—"}</td>
      <td>${trPartTokens(r.targetReward) || "—"}</td>
      <td>${trPartTokens(r.capture) || "—"}</td>
      <td>${trPartTokens(r.breakParts) || "—"}</td>
      <td>${trPartTokens(r.carves) || "—"}</td>
      <td>${trPartTokens(r.dropped) || "—"}</td>
    </tr>
  `).join("");
}

init();
