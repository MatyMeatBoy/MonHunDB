# Graph Report - mhrise-bestiario  (2026-08-09)

## Corpus Check
- 94 files · ~3,757,951 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 590 nodes · 937 edges · 47 communities (43 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `557dca10`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- runGlobalSearch
- renderMonster
- normalizeWeaponName
- Progreso del proyecto
- build_weapon_tree.js
- Notas de calidad de datos — casos a revisar
- scrape_renders.js
- init
- build_small_monsters.js
- Schemas de datos — referencia rápida
- Guía de anatomía — referencia para trazar vectores/siluetas
- scrape_armor.js
- scrape_grindosaur.js
- CLAUDE.md
- scrape_weapons.js
- scrape_skills.js
- scrape_weapon_trees.js
- match_armor_sets.js
- scrape_small_renders.js
- scrape_decorations.js
- scrape_material_obtain.js
- add_small_material_icons.js
- download_status_icons.js
- enrich_deco_slots.js
- scrape_decoration_icons.js
- scrape_grindosaur_quickfacts.js
- fix_material_icon_collisions.js
- scrape_anomaly_materials.js
- scrape_material_icons.js
- scrape_weapon_trees_fandom.js
- Resumen de sesión — 2026-08-08
- opencode.json
- SKILL.md
- download_anomaly_icons.js
- download_armor_fextra_icons.js
- download_equip_icons.js
- download_icons.js
- scrape_armor_set_skills.js
- buildImpliedArmorGroups
- initCombobox
- _test_obtain.js
- preview_final_parts.py
- annotate_regions.py
- normalize_small_parts.js
- trace_silhouette.py

## God Nodes (most connected - your core abstractions)
1. `Progreso del proyecto` - 26 edges
2. `ui()` - 25 edges
3. `runGlobalSearch()` - 25 edges
4. `showWeaponDetail()` - 23 edges
5. `renderMonster()` - 20 edges
6. `showDecorationDetail()` - 18 edges
7. `showArmorSetDetail()` - 16 edges
8. `init()` - 15 edges
9. `renderArmorIndex()` - 15 edges
10. `Guía de anatomía — referencia para trazar vectores/siluetas` - 14 edges

## Surprising Connections (you probably didn't know these)
- `weaponTokens()` --indirect_call--> `t()`  [INFERRED]
  rise/app.js → rise/data/i18n.js
- `weaponSameFamily()` --indirect_call--> `t()`  [INFERRED]
  rise/app.js → rise/data/i18n.js

## Import Cycles
- None detected.

## Communities (47 total, 4 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.02
Nodes (79): ANOMALY_LEVEL_RANGE, ARMOR_PART_ORDER, ARMOR_SET_DISPLAY_MAP, ARMOR_SET_IMG_OVERRIDES, armorBackEl, armorFextraIcons, armorIndexEl, armorNavToggleEl (+71 more)

### Community 1 - "runGlobalSearch"
Cohesion: 0.09
Nodes (71): annotateAnomalyLevel(), armorIconTag(), armorPieceMaterialsHtml(), armorPieceSkillsHtml(), armorSetDisplayName(), armorSetImg(), bootArmor(), bootDecorations() (+63 more)

### Community 2 - "renderMonster"
Cohesion: 0.13
Nodes (23): alignInflictsDivider(), capitalize(), ELEMENT_ORDER, elementIconTag(), HITZONE_ELEMENT_COLS, HITZONE_PHYSICAL_COLS, hzStatIconTag(), hzStatLabel() (+15 more)

### Community 3 - "normalizeWeaponName"
Cohesion: 0.16
Nodes (14): escapeXml(), getWeaponChain(), getWeaponCrossLinks(), initWeaponTree(), normalizeWeaponName(), renderWeaponTreeSVG(), WEAPON_STOP_WORDS, weaponSameFamily() (+6 more)

### Community 4 - "Progreso del proyecto"
Cohesion: 0.07
Nodes (26): 3 monstruos nuevos con silueta de golpe: Basarios, Chameleos, Diablos (2026-08-07), Batches de recolección (13 monstruos c/u), Correcciones aplicadas manualmente, Estado general, Feature: Cadena de armas limpia (solo la rama normal) + traducción de tipos (2026-08-09), Feature: Catálogo de armas con SOLO la versión final (re-datos de árbol real) (2026-08-08), Feature: Decoraciones / Adornos (2026-08-07), Feature: Estructura multi-página por juego (2026-08-09) (+18 more)

### Community 5 - "build_weapon_tree.js"
Cohesion: 0.17
Nodes (9): { chromium }, FANDOM_BASE, FEXTRA_CACHE, fextraFile(), fextraSlug(), FINALS, fs, path (+1 more)

### Community 6 - "Notas de calidad de datos — casos a revisar"
Cohesion: 0.11
Nodes (17): Ampliación (2026-08-07): vínculo a monstruos + desplegable, Armas y Armaduras: fuentes, scripts y decisiones (2026-08-07), Bug de íconos de materiales corregido (2026-08-06), Confirmados y corregidos, Corrección de nombres de zonas de aparición (2026-08-06), Decoraciones / Adornos (2026-08-06), Descripción de "cómo obtener" para materiales sin monstruo (2026-08-07), Elementos que inflige cada monstruo (2026-08-05) (+9 more)

### Community 7 - "scrape_renders.js"
Cohesion: 0.23
Nodes (12): curlBinary(), curlText(), downloadImage(), { execFileSync }, fetchPage(), fileSlug(), fs, IMG_DIR (+4 more)

### Community 8 - "init"
Cohesion: 0.17
Nodes (12): applyI18nText(), applyUiStrings(), closeGlobalSearch(), init(), initGlobalSearch(), loadArmorFextraIcons(), loadIconManifest(), loadMaterialIconManifest() (+4 more)

### Community 9 - "build_small_monsters.js"
Cohesion: 0.18
Nodes (8): deriveWeakRes(), ELEM, fs, out, path, RAW, SPECIES, stars()

### Community 10 - "Schemas de datos — referencia rápida"
Cohesion: 0.12
Nodes (15): `armor_pieces.json` — piezas individuales de armadura, `armor_sets.json` — sets matcheados contra Fextralife (solo 62/87), `decorations.json` — 243 adornos (joyas), `i18n.js` — TODOS los strings de UI (no JSON, es un archivo JS con `const I18N = {...}`), `material_mhrice_icons.json` / `decoration_mhrice_icons.json` — mapa de íconos reales, `monsters.json` — 78 monstruos (dataset core), Otros JSON de soporte (no hace falta memorizar el shape, son internos de un solo script), Schemas de datos — referencia rápida (+7 more)

### Community 11 - "Guía de anatomía — referencia para trazar vectores/siluetas"
Cohesion: 0.05
Nodes (40): 0. QuÃ© es este proyecto, en una frase, 1. Mapa de archivos (quÃ© tocar segÃºn lo que se pida), 2. CÃ³mo estÃ¡ armado `rise/app.js`, 3.1 Pipeline tÃ©cnico (mecÃ¡nico, ya funciona, no hace falta rediseÃ±arlo), 3.2 La parte difÃ­cil: identificar quÃ© regiÃ³n es quÃ© parte del cuerpo, 3.3 FusionZonal â€” fusionar 2+ shapes de una misma parte en un solo contorno, 3.4 Estado actual, 3.5 Ãconos de armadura rotos y verificaciÃ³n de traducciones ES (patrÃ³n reutilizable) (+32 more)

### Community 12 - "scrape_armor.js"
Cohesion: 0.26
Nodes (11): fetchText(), fs, guessSlot(), main(), mapLimit(), OUT_PATH, parseDetail(), parseListing() (+3 more)

### Community 13 - "scrape_grindosaur.js"
Cohesion: 0.23
Nodes (10): fs, grindLinks, main(), monsterList, parseAilmentEffectiveness(), parsePhysiology(), path, scrapeOne() (+2 more)

### Community 15 - "scrape_weapons.js"
Cohesion: 0.24
Nodes (11): ELEMENT_NAMES, fetchText(), fs, main(), mapLimit(), OUT_PATH, parseDetail(), parseListing() (+3 more)

### Community 16 - "scrape_skills.js"
Cohesion: 0.31
Nodes (10): fetchText(), fs, langTextFromBlock(), main(), mapLimit(), nameByLang(), OUT_PATH, parseSkillDetail() (+2 more)

### Community 17 - "scrape_weapon_trees.js"
Cohesion: 0.20
Nodes (8): CACHE, cacheFile(), { chromium }, { execFileSync }, fs, path, TYPES, urlSlug()

### Community 18 - "match_armor_sets.js"
Cohesion: 0.20
Nodes (7): armor, fs, html, path, rawSets, sets, unmatched

### Community 19 - "scrape_small_renders.js"
Cohesion: 0.20
Nodes (6): { execFileSync }, fs, ICON_DIR, IMG_DIR, path, smalls

### Community 20 - "scrape_decorations.js"
Cohesion: 0.31
Nodes (7): fs, main(), OUT_DIR, parseDetailMaterials(), parseGrindosaurIcons(), parseListing(), path

### Community 21 - "scrape_material_obtain.js"
Cohesion: 0.36
Nodes (8): capLen(), extractCol(), fs, main(), parseObtainInfo(), path, stripHtml(), wikiUrlFor()

### Community 22 - "add_small_material_icons.js"
Cohesion: 0.25
Nodes (7): fs, manifest, mhriceByName, mhriceItems, path, rawSm, smMats

### Community 23 - "download_status_icons.js"
Cohesion: 0.29
Nodes (7): BASE_MAP, fs, main(), MAP, OUT_DIR, path, slugify()

### Community 24 - "enrich_deco_slots.js"
Cohesion: 0.36
Nodes (7): fetchText(), fs, main(), mapLimit(), OUT_PATH, parseDecoSlots(), path

### Community 25 - "scrape_decoration_icons.js"
Cohesion: 0.39
Nodes (7): fetchText(), fs, main(), mapLimit(), parseDecorationIcons(), path, unescapeHtml()

### Community 26 - "scrape_grindosaur_quickfacts.js"
Cohesion: 0.32
Nodes (7): curlText(), { execFileSync }, fs, links, main(), parseQuickFacts(), path

### Community 27 - "fix_material_icon_collisions.js"
Cohesion: 0.38
Nodes (6): fs, main(), oldSlugify(), OUT_DIR, path, slugify()

### Community 28 - "scrape_anomaly_materials.js"
Cohesion: 0.38
Nodes (6): buildMaterialRows(), fs, main(), METHOD_TO_COL, parseMasterRankAnomalyRows(), path

### Community 29 - "scrape_material_icons.js"
Cohesion: 0.38
Nodes (6): fs, main(), OUT_DIR, parseMaterialIcons(), path, slugify()

### Community 30 - "scrape_weapon_trees_fandom.js"
Cohesion: 0.29
Nodes (5): CACHE, { chromium }, fs, path, TYPES

### Community 31 - "Resumen de sesión — 2026-08-08"
Cohesion: 0.29
Nodes (6): Errores encontrados y cómo se resolvieron (vale la pena no repetir), Instrucciones explícitas del usuario que quedaron como reglas permanentes, Qué quedó pendiente / sin cerrar, Qué se construyó en esta sesión (orden cronológico), Resumen de sesión — 2026-08-08, Último estado de git al cerrar esta sesión

### Community 32 - "opencode.json"
Cohesion: 0.33
Nodes (5): permission, edit, plugin, $schema, @0xsero/open-queue

### Community 33 - "SKILL.md"
Cohesion: 0.33
Nodes (5): Auto-Clarity, Boundaries, Intensity, Persistence, Rules

### Community 34 - "download_anomaly_icons.js"
Cohesion: 0.40
Nodes (5): fs, main(), OUT_DIR, path, slugify()

### Community 35 - "download_armor_fextra_icons.js"
Cohesion: 0.47
Nodes (5): download(), fs, main(), mapLimit(), path

### Community 36 - "download_equip_icons.js"
Cohesion: 0.47
Nodes (5): download(), fs, main(), mapLimit(), path

### Community 37 - "download_icons.js"
Cohesion: 0.40
Nodes (5): fs, main(), OUT_DIR, path, slugify()

### Community 38 - "scrape_armor_set_skills.js"
Cohesion: 0.47
Nodes (5): download(), fs, main(), path, slugify()

### Community 39 - "buildImpliedArmorGroups"
Cohesion: 0.60
Nodes (5): ARMOR_SET_HIDDEN, armorSetPrefix(), buildImpliedArmorGroups(), buildPartialArmorGroups(), coreArmorNameForGrouping()

### Community 40 - "initCombobox"
Cohesion: 0.60
Nodes (5): closePanel(), filterOptions(), initCombobox(), openPanel(), selectFirstVisibleOption()

### Community 41 - "_test_obtain.js"
Cohesion: 0.50
Nodes (4): fs, html, parseObtainInfo(), stripHtml()

### Community 42 - "preview_final_parts.py"
Cohesion: 0.67
Nodes (3): main(), parse_points(), Debug helper: renders the CURRENT HITZONE_SHAPES mapping for a monster (as…

## Knowledge Gaps
- **288 isolated node(s):** `$schema`, `edit`, `@0xsero/open-queue`, `GROUP_OVERRIDES`, `RANK_ORDER` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `weaponSameFamily()` connect `normalizeWeaponName` to `app.js`, `runGlobalSearch`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `weaponTokens()` connect `normalizeWeaponName` to `app.js`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `$schema`, `edit`, `@0xsero/open-queue` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.024691358024691357 - nodes in this community are weakly interconnected._
- **Should `runGlobalSearch` be split into smaller, more focused modules?**
  _Cohesion score 0.08772635814889336 - nodes in this community are weakly interconnected._
- **Should `renderMonster` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `Progreso del proyecto` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._