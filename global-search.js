/*
 * Cross-game search for the MonHunDB hub.
 *
 * The source registry is intentionally data-driven: adding a future game only
 * requires one entry with its JSON paths and route prefix. Records are never
 * merged, so an identical monster/material in two games remains two distinct
 * navigable results.
 */
(function () {
  "use strict";

  const sources = [
    {
      id: "mhfu", label: "MHFU", base: "mhfu",
      monsterFiles: ["data/monsters.json"], itemFile: "data/items.json",
      monsterUrl: n => `mhfu/monster?m=${encodeURIComponent(n)}`,
      itemUrl: n => `mhfu/materials?mat=${encodeURIComponent(n)}`,
    },
    {
      id: "rise", label: "MH Rise", base: "rise",
      monsterFiles: ["data/monsters.json", "data/small_monsters.json"], itemFile: "data/items.json",
      monsterUrl: n => `rise/monster?m=${encodeURIComponent(n)}`,
      itemUrl: n => `rise/materials?mat=${encodeURIComponent(n)}`,
    },
    {
      id: "wilds", label: "MH Wilds", base: "wilds",
      monsterFiles: ["data/monsters.json", "data/small_monsters.json"], itemFile: "data/items_wilds.json",
      monsterUrl: n => `wilds/monster?m=${encodeURIComponent(n)}`,
      itemUrl: n => `wilds/materials?mat=${encodeURIComponent(n)}`,
    },
  ];

  const els = {
    wrap: document.getElementById("hub-global-search-wrap"),
    toggle: document.getElementById("hub-global-search-toggle"),
    panel: document.getElementById("hub-global-search-panel"),
    input: document.getElementById("hub-global-search-input"),
    status: document.getElementById("hub-global-search-status"),
    results: document.getElementById("hub-global-search-results"),
  };
  if (!els.wrap || !els.toggle || !els.panel || !els.input || !els.results) return;

  const state = { ready: false, loading: null, monsters: [], items: [] };
  const text = {
    es: { placeholder: "Buscar monstruo o item en todos los juegos…", loading: "Cargando los catálogos…", monsters: "Monstruos", items: "Materiales e items", no: "Sin resultados para esa búsqueda", hint: "Escribe al menos 2 caracteres para buscar en los tres juegos." },
    en: { placeholder: "Search monsters or items across all games…", loading: "Loading catalogs…", monsters: "Monsters", items: "Materials & items", no: "No results for that search", hint: "Type at least 2 characters to search all three games." },
  };
  const currentLang = () => localStorage.getItem("mh-lang") === "en" ? "en" : "es";
  const ui = key => text[currentLang()][key];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const normalize = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  const translated = name => {
    const names = typeof I18N !== "undefined" && I18N.monsterNames ? I18N.monsterNames : null;
    return (currentLang() === "es" && names && names[name]) || name;
  };
  const itemLabel = item => currentLang() === "es" && item.nameEs ? item.nameEs : item.name;
  const itemName = item => item.name || item.nameEs || "";
  const imageUrl = (source, value) => {
    if (!value) return "";
    if (/^(https?:|data:|\/)/i.test(value)) return value;
    return `${source.base}/${value.replace(/^\.\//, "")}`;
  };
  const score = (name, q) => {
    const n = normalize(name);
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    return n.includes(q) ? 2 : 9;
  };

  function collectMaterials(monster) {
    const out = [];
    const mats = monster && monster.materials;
    if (!mats) return out;
    if (Array.isArray(mats)) {
      for (const row of mats) if (typeof row === "string") out.push(row); else if (row?.material) out.push(row.material);
      return out;
    }
    for (const rows of Object.values(mats)) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows) if (typeof row === "string") out.push(row); else if (row?.material) out.push(row.material);
    }
    return [...new Set(out.filter(Boolean))];
  }

  async function loadSource(source) {
    const monsterRows = (await Promise.all(source.monsterFiles.map(async file => {
      try { const response = await fetch(`${source.base}/${file}`); return response.ok ? await response.json() : []; }
      catch (_) { return []; }
    }))).flat();
    let itemRows = [];
    try {
      const response = await fetch(`${source.base}/${source.itemFile}`);
      if (response.ok) itemRows = await response.json();
    } catch (_) { /* a future game may not publish an item catalog yet */ }
    const monsters = [];
    const seen = new Set();
    for (const row of monsterRows) {
      const name = row?.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      monsters.push({ source, row, name, label: translated(name), materials: collectMaterials(row) });
    }
    return { monsters, items: itemRows.filter(row => itemName(row)).map(row => ({ source, row, name: itemName(row), label: itemLabel(row) })) };
  }

  async function ensureLoaded() {
    if (state.ready) return;
    if (!state.loading) {
      state.loading = Promise.all(sources.map(loadSource)).then(groups => {
        state.monsters = groups.flatMap(group => group.monsters);
        state.items = groups.flatMap(group => group.items);
        state.ready = true;
      }).catch(error => {
        console.warn("No se pudo preparar el buscador global", error);
        state.ready = true;
      });
    }
    await state.loading;
  }

  function render(query) {
    const q = normalize(query);
    els.status.textContent = "";
    els.results.innerHTML = "";
    if (q.length < 2) {
      els.status.textContent = ui("hint");
      return;
    }
    if (!state.ready) {
      els.status.textContent = ui("loading");
      ensureLoaded().then(() => { if (normalize(els.input.value) === q) render(els.input.value); });
      return;
    }

    const monsterMatches = state.monsters.filter(m => {
      const names = [m.name, m.label];
      return names.some(name => normalize(name).includes(q));
    }).sort((a, b) => score(a.name, q) - score(b.name, q) || a.source.id.localeCompare(b.source.id) || a.name.localeCompare(b.name)).slice(0, 40);

    const matchedMonsterNames = new Set(monsterMatches.map(m => `${m.source.id}\u0000${normalize(m.name)}`));
    const itemMatches = [];
    for (const item of state.items) {
      const direct = normalize(item.name).includes(q) || normalize(item.label).includes(q);
      const related = state.monsters.filter(m => m.source.id === item.source.id && matchedMonsterNames.has(`${m.source.id}\u0000${normalize(m.name)}`) && m.materials.some(mat => normalize(mat) === normalize(item.name) || normalize(mat).includes(normalize(item.name)) || normalize(item.name).includes(normalize(mat))));
      if (!direct && !related.length) continue;
      itemMatches.push({ item, related, rank: direct ? score(item.label, q) : 4 });
    }
    itemMatches.sort((a, b) => a.rank - b.rank || a.item.source.id.localeCompare(b.item.source.id) || a.item.label.localeCompare(b.item.label));

    const parts = [];
    if (monsterMatches.length) {
      parts.push(`<section class="hub-gs-section"><div class="hub-gs-section-title">${ui("monsters")} <span>(${monsterMatches.length})</span></div>${monsterMatches.map(m => {
        const img = imageUrl(m.source, m.row.image);
        return `<button type="button" class="hub-gs-row" data-href="${esc(m.source.monsterUrl(m.name))}">${img ? `<img class="hub-gs-thumb" src="${esc(img)}" alt="" loading="lazy">` : `<span class="hub-gs-thumb" aria-hidden="true"></span>`}<span class="hub-gs-main"><span class="hub-gs-name">${esc(m.label)}</span><span class="hub-gs-meta">${esc(m.name)}${m.row.isSmall ? " · " + (currentLang() === "es" ? "pequeño" : "small") : ""}</span></span><span class="hub-gs-game">${esc(m.source.label)}</span></button>`;
      }).join("")}</section>`);
    }
    if (itemMatches.length) {
      parts.push(`<section class="hub-gs-section"><div class="hub-gs-section-title">${ui("items")} <span>(${itemMatches.length})</span></div>${itemMatches.slice(0, 50).map(({ item, related }) => {
        const img = imageUrl(item.source, item.row.icon);
        const relation = related.length ? (currentLang() === "es" ? `Relacionado con ${related.slice(0, 2).map(m => translated(m.name)).join(", ")}` : `Related to ${related.slice(0, 2).map(m => m.name).join(", ")}`) : (item.row.category || "");
        return `<button type="button" class="hub-gs-row" data-href="${esc(item.source.itemUrl(item.name))}">${img ? `<img class="hub-gs-thumb" src="${esc(img)}" alt="" loading="lazy">` : `<span class="hub-gs-thumb" aria-hidden="true"></span>`}<span class="hub-gs-main"><span class="hub-gs-name">${esc(item.label)}</span><span class="hub-gs-meta">${esc(relation)}</span></span><span class="hub-gs-game">${esc(item.source.label)}</span></button>`;
      }).join("")}</section>`);
    }
    els.results.innerHTML = parts.join("") || `<p class="hub-gs-empty">${ui("no")}</p>`;
    els.results.querySelectorAll("[data-href]").forEach(button => button.addEventListener("click", () => { location.href = button.dataset.href; }));
  }

  function open() {
    els.panel.hidden = false;
    els.toggle.setAttribute("aria-expanded", "true");
    els.input.focus();
    render(els.input.value);
    ensureLoaded();
  }
  function close() {
    els.panel.hidden = true;
    els.toggle.setAttribute("aria-expanded", "false");
  }
  els.input.placeholder = ui("placeholder");
  els.toggle.addEventListener("click", () => els.panel.hidden ? open() : close());
  els.input.addEventListener("input", () => render(els.input.value));
  document.addEventListener("click", event => { if (!els.wrap.contains(event.target)) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !els.panel.hidden) { close(); els.toggle.focus(); } });
  window.MonHunGlobalSearch = { sources, ensureLoaded, search: query => { open(); els.input.value = query || ""; render(els.input.value); } };
})();
