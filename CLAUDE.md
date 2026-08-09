## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Project structure (multi-page per game, since 2026-08-09)

This is a static HTML/CSS/JS Monster Hunter bestiary. **No SPA, no framework, no build step.**
Real HTML pages with plain links. The old SPA (one index.html juggling hidden views) was
retired because it caused bugs (mutual-exclusion omissions, lang re-render misses).

```
index.html              ← Hub: game selector (brand + card per game, links to rise/)
hub.css                 ← Hub-only CSS
favicon.webp
rise/                   ← Self-contained game folder (reference to copy for future Wilds)
  index.html            ← Bestiary home: news + monster combobox
  monster               ← Monster detail (?m=Name&rank=Rank)
  decorations           ← Decorations list + detail (?d=ID)
  weapons               ← Weapons list + detail (?w=ID)
  armor                 ← Armor sets + pieces (?set=Name | ?piece=ID)
  materials             ← Materials list + detail (?mat=Key)
  skills                ← Skills list + detail (?skill=ID)
  app.js                ← ~3000 lines, ALL game logic. Boots per <body data-page="…">
  style.css             ← ~1500 lines, dark MH theme
  data/                 ← All JSON datasets + scrape scripts + i18n.js + images/
```

### Why extensionless URLs

`npx serve .` (the documented way to run) has cleanUrls ON by default: it **301-redirects**
`monster.html?m=X` → `monster` and **drops the query string**. So every internal link is
extensionless (`monster?m=`, `decorations?d=`, etc.). `serve` resolves `rise/monster` →
`rise/monster.html` with 200 (no redirect), preserving the query. Do NOT add `.html` back.

### How the app boots (`rise/app.js`)

```js
init()                         // loads ALL data once (monsters, weapons, armor, skills, icons…)
  → bootPage()                 // reads document.body.dataset.page
    "home"       → renderNews()
    "monster"    → ?m=X → selectMonster(name, {render:true}) → renderMonster()
    "decorations" → bootDecorations() → showDecorationsView() or showDecorationDetail(?d=)
    …same for weapons/armor/materials/skills…
```

- Each page has `<body data-page="decorations">` (one of: home, monster, decorations, weapons, armor, materials, skills)
- `bootPage()` reads `location.search` params and renders list or detail — **no view juggling, no pushState**
- All cross-page navigation goes through helpers: `navMonster(name, rank?)`, `navMaterial(key)`, `navDecoration(id)`, `navWeapon(id)`, `navArmorSet(name)`, `navArmorPiece(id)`, `navSkill(idOrName)` — they build extensionless URLs and set `location.href`
- Language toggle: localStorage + `location.reload()` (re-render on fresh boot, no manual re-render per view)
- `hideViews(...els)` — null-safe helper used by `showXView()` functions; each page has only ONE view container (no exclusivity rule)

### Where files live

| What | Path | Notes |
|------|------|-------|
| Datasets (monsters, weapons, …) | `rise/data/*.json` | Loaded by fetch("data/…") relative to rise/ |
| Icons & renders | `rise/data/images/` | icon_manifest.json, renders_manifest.json etc. map names→paths |
| i18n strings | `rise/data/i18n.js` | `I18N.ui[lang]` for UI, `I18N.monsterNames/Elements/…` for terms |
| Scrape scripts | `rise/data/scrape_*.js` | One-off Node scripts; use `__dirname`-relative paths, still functional |
| Silhouette tracer | `rise/data/trace_silhouette.py` | `python rise/data/trace_silhouette.py <png> <output.json>` |
| Anatomy reference | `rise/data/MONSTER_ANATOMY.md` | Read before mapping silhouette regions to body parts |
| Silhouette guide | `rise/data/SILHOUETTE_GUIDE.md` | Checklist + known pitfalls |

### Adding a new game (e.g. Wilds)

1. Copy `rise/` → `wilds/`
2. Replace JSONs in `wilds/data/` with Wilds data (same format, similar structure)
3. Update `<body data-page="…">` and `<title>` per page if needed
4. Add a card in root `index.html` hub: `<a class="hub-card" href="wilds/">…</a>`
5. They share NOTHING — each game's app.js loads its own data.

### Common tasks

**Add a monster silhouette**: see `rise/data/SILHOUETTE_GUIDE.md`. User leaves a PNG in `vectores/`.
Run `python rise/data/trace_silhouette.py vectores/<monster>.png rise/data/<monster>_traced.json`.
Map regions to HITZONE_SHAPES in app.js (read `rise/data/MONSTER_ANATOMY.md` first — do NOT guess by shape).

**Add a new section**: create a new HTML page in `rise/` with `<body data-page="newsection">`,
add its boot in `rise/app.js` (`bootNewSection()` + `bootPage()` case), and add a nav link in
the topbar of all 7 pages.

**Fix armor icons**: `rise/data/download_equip_icons.js` downloads from Kiranico's CDN.
~233/1574 pieces returned 404 (documented). Fextralife fallback in `armorFextraIcons`.

**Run the site**: `npx serve .` at project root. Open `http://localhost:3000/`.

### Key files to read first

1. `CLAUDE.md` ← you are here
2. `HANDOFF_GUIDE.md` — full architecture, i18n patterns, historical context
3. `PROGRESS.md` — chronological feature log (newest first)
4. `DATA_NOTES.md` — ambiguous data cases found during scraping
5. `SOURCES.md` — which site was scraped for what, and why
