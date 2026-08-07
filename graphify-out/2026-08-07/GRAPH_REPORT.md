# Graph Report - mhrise-bestiario  (2026-08-06)

## Corpus Check
- 34 files · ~1,875,035 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 126 nodes · 174 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- app.js
- init
- scrape_renders.js
- scrape_grindosaur.js
- Progreso del proyecto
- renderMonster
- Notas de calidad de datos — casos a revisar
- scrape_grindosaur_quickfacts.js
- ui
- download_icons.js
- Bestiario — Monster Hunter Rise: Sunbreak
- Fuentes usadas en el proyecto
- renderHitzones
- i18n.js
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `renderMonster()` - 16 edges
2. `Progreso del proyecto` - 10 edges
3. `init()` - 9 edges
4. `ui()` - 7 edges
5. `selectMonster()` - 7 edges
6. `buildSelector()` - 7 edges
7. `Notas de calidad de datos — casos a revisar` - 7 edges
8. `renderHitzones()` - 6 edges
9. `initCombobox()` - 5 edges
10. `renderMaterialsTable()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `buildSelector()` --calls--> `ui()`  [EXTRACTED]
  app.js → app.js  _Bridges community 8 → community 1_
- `renderHitzones()` --calls--> `ui()`  [EXTRACTED]
  app.js → app.js  _Bridges community 8 → community 12_
- `renderMonster()` --calls--> `ui()`  [EXTRACTED]
  app.js → app.js  _Bridges community 8 → community 5_
- `renderMonster()` --calls--> `trElement()`  [EXTRACTED]
  app.js → app.js  _Bridges community 12 → community 5_
- `renderMonster()` --calls--> `trMonsterName()`  [EXTRACTED]
  app.js → app.js  _Bridges community 1 → community 5_

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.12
Nodes (16): comboboxEl, detailEl, GROUP_OVERRIDES, HITZONE_ELEMENT_COLS, HITZONE_PHYSICAL_COLS, iconManifest, langToggleEl, listEl (+8 more)

### Community 1 - "init"
Cohesion: 0.22
Nodes (13): buildSelector(), closePanel(), filterOptions(), groupFor(), iconPath(), init(), initCombobox(), loadIconManifest() (+5 more)

### Community 2 - "scrape_renders.js"
Cohesion: 0.23
Nodes (12): curlBinary(), curlText(), downloadImage(), { execFileSync }, fetchPage(), fileSlug(), fs, IMG_DIR (+4 more)

### Community 3 - "scrape_grindosaur.js"
Cohesion: 0.23
Nodes (10): fs, grindLinks, main(), monsterList, parseAilmentEffectiveness(), parsePhysiology(), path, scrapeOne() (+2 more)

### Community 4 - "Progreso del proyecto"
Cohesion: 0.18
Nodes (10): Batches de recolección (13 monstruos c/u), Correcciones aplicadas manualmente, Estado general, Feature: Hitzones por parte del cuerpo + detalle de acumulación de estados (2026-08-05), Feature: renders de monstruos + correcciones varias (2026-08-05), Feature: Selector de idioma ES/EN (2026-08-05), Progreso del proyecto, Próximos pasos (+2 more)

### Community 5 - "renderMonster"
Cohesion: 0.25
Nodes (8): ELEMENT_ORDER, renderMonster(), starString(), trAilment(), trBuildupLabel(), trLocation(), trRank(), trSpecies()

### Community 6 - "Notas de calidad de datos — casos a revisar"
Cohesion: 0.25
Nodes (7): Confirmados y corregidos, Elementos que inflige cada monstruo (2026-08-05), Inmunidades condicionales (barro/magma) (2026-08-05, corregido el mismo día), Limitación conocida (afecta a todos los monstruos), Notas de calidad de datos — casos a revisar, Pendientes de verificación manual, Sistema de idioma ES/EN (2026-08-05)

### Community 7 - "scrape_grindosaur_quickfacts.js"
Cohesion: 0.32
Nodes (7): curlText(), { execFileSync }, fs, links, main(), parseQuickFacts(), path

### Community 8 - "ui"
Cohesion: 0.33
Nodes (6): applyI18nText(), applyUiStrings(), renderMaterialsTable(), trMaterial(), trPartTokens(), ui()

### Community 9 - "download_icons.js"
Cohesion: 0.40
Nodes (5): fs, main(), OUT_DIR, path, slugify()

### Community 10 - "Bestiario — Monster Hunter Rise: Sunbreak"
Cohesion: 0.33
Nodes (5): Bestiario — Monster Hunter Rise: Sunbreak, Cómo correrlo, Estructura, Fuente de datos, Schema de `data/monsters.json`

### Community 11 - "Fuentes usadas en el proyecto"
Cohesion: 0.33
Nodes (5): Datos de monstruos (inglés), Descartadas (evaluadas pero no usadas), Fuentes usadas en el proyecto, Renders de monstruos, Traducciones al español

### Community 12 - "renderHitzones"
Cohesion: 0.40
Nodes (5): capitalize(), rankElementColumns(), renderHitzones(), trBodyPart(), trElement()

### Community 13 - "i18n.js"
Cohesion: 0.50
Nodes (3): I18N, normalizeMaterialKey(), translateMaterial()

## Knowledge Gaps
- **58 isolated node(s):** `GROUP_OVERRIDES`, `RANK_ORDER`, `monsters`, `comboboxEl`, `triggerEl` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderMonster()` connect `renderMonster` to `app.js`, `init`, `renderHitzones`, `ui`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `GROUP_OVERRIDES`, `RANK_ORDER`, `monsters` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._