# Graph Report - mhrise-bestiario  (2026-08-07)

## Corpus Check
- 52 files · ~2,075,851 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 269 nodes · 401 edges · 26 communities (24 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b9793067`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- showDecorationDetail
- scrape_renders.js
- scrape_grindosaur.js
- Progreso del proyecto
- renderMonster
- Notas de calidad de datos — casos a revisar
- scrape_grindosaur_quickfacts.js
- Guía de anatomía — referencia para trazar vectores/siluetas
- download_icons.js
- Bestiario — Monster Hunter Rise: Sunbreak
- Fuentes usadas en el proyecto
- renderHitzones
- i18n.js
- CLAUDE.md
- renderHitzoneSilhouette
- scrape_decorations.js
- scrape_material_obtain.js
- download_status_icons.js
- fix_material_icon_collisions.js
- scrape_anomaly_materials.js
- scrape_material_icons.js
- download_anomaly_icons.js
- Guía: siluetas de hitzones (vectorizado + identificación de partes)
- _test_obtain.js
- trace_silhouette.py

## God Nodes (most connected - your core abstractions)
1. `renderMonster()` - 20 edges
2. `showDecorationDetail()` - 18 edges
3. `runGlobalSearch()` - 17 edges
4. `init()` - 16 edges
5. `Progreso del proyecto` - 15 edges
6. `Guía de anatomía — referencia para trazar vectores/siluetas` - 14 edges
7. `ui()` - 13 edges
8. `Notas de calidad de datos — casos a revisar` - 10 edges
9. `selectMonster()` - 9 edges
10. `renderDecorationsIndex()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `buildSelector()` --calls--> `groupFor()`  [EXTRACTED]
  app.js → app.js  _Bridges community 0 → community 1_
- `hzStatLabel()` --calls--> `ui()`  [EXTRACTED]
  app.js → app.js  _Bridges community 1 → community 15_
- `renderHitzones()` --calls--> `ui()`  [EXTRACTED]
  app.js → app.js  _Bridges community 1 → community 12_
- `renderMonster()` --calls--> `ui()`  [EXTRACTED]
  app.js → app.js  _Bridges community 1 → community 5_
- `renderHitzones()` --calls--> `trElement()`  [EXTRACTED]
  app.js → app.js  _Bridges community 15 → community 12_

## Import Cycles
- None detected.

## Communities (26 total, 2 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.05
Nodes (41): ANOMALY_LEVEL_RANGE, comboboxEl, decorationDetailEl, decorations, decorationsBackEl, decorationsIndexEl, decorationsNavToggleEl, decorationsSearchEl (+33 more)

### Community 1 - "showDecorationDetail"
Cohesion: 0.15
Nodes (31): annotateAnomalyLevel(), applyUiStrings(), buildMaterialIndex(), buildSelector(), closeGlobalSearch(), closePanel(), decorationIconTag(), filterOptions() (+23 more)

### Community 2 - "scrape_renders.js"
Cohesion: 0.23
Nodes (12): curlBinary(), curlText(), downloadImage(), { execFileSync }, fetchPage(), fileSlug(), fs, IMG_DIR (+4 more)

### Community 3 - "scrape_grindosaur.js"
Cohesion: 0.23
Nodes (10): fs, grindLinks, main(), monsterList, parseAilmentEffectiveness(), parsePhysiology(), path, scrapeOne() (+2 more)

### Community 4 - "Progreso del proyecto"
Cohesion: 0.12
Nodes (15): Batches de recolección (13 monstruos c/u), Correcciones aplicadas manualmente, Estado general, Feature: Decoraciones / Adornos (2026-08-07), Feature: Hitzones por parte del cuerpo + detalle de acumulación de estados (2026-08-05), Feature: renders de monstruos + correcciones varias (2026-08-05), Feature: Selector de idioma ES/EN (2026-08-05), Feature: Silueta de hitzones coloreada — Rathalos + Corte (2026-08-06/07, CERRADA) (+7 more)

### Community 5 - "renderMonster"
Cohesion: 0.22
Nodes (9): alignInflictsDivider(), applyI18nText(), ELEMENT_ORDER, renderMonster(), starString(), trAilment(), trBuildupLabel(), trLocation() (+1 more)

### Community 6 - "Notas de calidad de datos — casos a revisar"
Cohesion: 0.12
Nodes (15): Ampliación (2026-08-07): vínculo a monstruos + desplegable, Bug de íconos de materiales corregido (2026-08-06), Confirmados y corregidos, Corrección de nombres de zonas de aparición (2026-08-06), Decoraciones / Adornos (2026-08-06), Descripción de "cómo obtener" para materiales sin monstruo (2026-08-07), Elementos que inflige cada monstruo (2026-08-05), Filas corruptas de materiales afligidos eliminadas (2026-08-07) (+7 more)

### Community 7 - "scrape_grindosaur_quickfacts.js"
Cohesion: 0.32
Nodes (7): curlText(), { execFileSync }, fs, links, main(), parseQuickFacts(), path

### Community 8 - "Guía de anatomía — referencia para trazar vectores/siluetas"
Cohesion: 0.13
Nodes (14): Anfibio (Amphibian), Bestia con Colmillos (Fanged Beast), Carapaceon (crustáceo/artrópodo grande), Cómo usar esto en la práctica, Desconocida (Unknown, según nuestros datos), Dragón Anciano (Elder Dragon), Guía de anatomía — referencia para trazar vectores/siluetas, Leviatán (Leviathan) (+6 more)

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
Nodes (6): elementIconTag(), hzStatIconTag(), rankElementColumns(), renderHitzones(), statusIconTag(), trBodyPart()

### Community 13 - "i18n.js"
Cohesion: 0.50
Nodes (3): I18N, normalizeMaterialKey(), translateMaterial()

### Community 15 - "renderHitzoneSilhouette"
Cohesion: 0.31
Nodes (9): capitalize(), escapeAttr(), HITZONE_ELEMENT_COLS, hzStatLabel(), hzStatLabelFull(), renderHitzoneSilhouette(), tierColorsByPart(), trElement() (+1 more)

### Community 16 - "scrape_decorations.js"
Cohesion: 0.31
Nodes (7): fs, main(), OUT_DIR, parseDetailMaterials(), parseGrindosaurIcons(), parseListing(), path

### Community 17 - "scrape_material_obtain.js"
Cohesion: 0.36
Nodes (8): capLen(), extractCol(), fs, main(), parseObtainInfo(), path, stripHtml(), wikiUrlFor()

### Community 18 - "download_status_icons.js"
Cohesion: 0.29
Nodes (7): BASE_MAP, fs, main(), MAP, OUT_DIR, path, slugify()

### Community 19 - "fix_material_icon_collisions.js"
Cohesion: 0.38
Nodes (6): fs, main(), oldSlugify(), OUT_DIR, path, slugify()

### Community 20 - "scrape_anomaly_materials.js"
Cohesion: 0.38
Nodes (6): buildMaterialRows(), fs, main(), METHOD_TO_COL, parseMasterRankAnomalyRows(), path

### Community 21 - "scrape_material_icons.js"
Cohesion: 0.38
Nodes (6): fs, main(), OUT_DIR, parseMaterialIcons(), path, slugify()

### Community 22 - "download_anomaly_icons.js"
Cohesion: 0.40
Nodes (5): fs, main(), OUT_DIR, path, slugify()

### Community 23 - "Guía: siluetas de hitzones (vectorizado + identificación de partes)"
Cohesion: 0.33
Nodes (5): Checklist para el próximo monstruo, Estado actual: Rathalos (referencia completa, confirmada por el usuario), Guía: siluetas de hitzones (vectorizado + identificación de partes), Lo que most importa: la identificación anatómica, NO el trazado, Pipeline técnico (ya resuelto, reutilizar tal cual)

### Community 24 - "_test_obtain.js"
Cohesion: 0.50
Nodes (4): fs, html, parseObtainInfo(), stripHtml()

## Knowledge Gaps
- **128 isolated node(s):** `GROUP_OVERRIDES`, `RANK_ORDER`, `monsters`, `comboboxEl`, `triggerEl` (+123 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `GROUP_OVERRIDES`, `RANK_ORDER`, `monsters` to the rest of the system?**
  _128 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `Progreso del proyecto` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `Notas de calidad de datos — casos a revisar` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `Guía de anatomía — referencia para trazar vectores/siluetas` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._