# Graph Report - mhrise-bestiario  (2026-08-10)

## Corpus Check
- 157 files · ~11,045,393 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1094 nodes · 1810 edges · 84 communities (81 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `06e0c761`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- rise/app.js
- showWeaponDetail
- ui
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
- Project structure (multi-page per game, since 2026-08-09)
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
- renderArmorIndex
- wilds/app.js
- _test_obtain.js
- preview_final_parts.py
- annotate_regions.py
- normalize_small_parts.js
- trace_silhouette.py
- showArmorSetDetail
- init
- ui
- scrape_missing_armor_sets.js
- renderMonster
- runGlobalSearch
- parse_weapon_type_tables.js
- 1. Qué hay completo ahora
- renderWeaponsIndex
- complete_monsters_from_wiki.js
- fix_guardian_arkveld.js
- complete_monsters_v2.js
- fix_last_2_monsters.js
- scrape_armor_pieces.js
- scrape_mhwikiorg_armor_materials.js
- build_deco_skill_icons.js
- normalize_wilds_monsters.js
- parse_mhwikiorg_decorations.js
- scrape_decos_skills_charms.js
- scrape_wilds_armor_sets_detail.js
- scrape_wilds_monster_wiki.js
- scrape_wilds_monsters.js
- renderCharmsIndex
- download_wilds_item_icons.js
- finalize_decorations.js
- fix_materials.js
- merge_armor_comparison.js
- scrape_wilds_items_more.js
- finalize_weapons.js
- scrape_skill_levels.js
- scrape_wilds_armor_sets.js
- scrape_wilds_items.js
- parse_armor_comparison.js
- scrape_wilds_decoration_icons.js
- scrape_wilds_weapons.js
- i18n.js
- test_deco_skill_pw.js

## God Nodes (most connected - your core abstractions)
1. `ui()` - 27 edges
2. `Progreso del proyecto` - 27 edges
3. `ui()` - 25 edges
4. `runGlobalSearch()` - 25 edges
5. `runGlobalSearch()` - 25 edges
6. `showWeaponDetail()` - 23 edges
7. `showWeaponDetail()` - 23 edges
8. `renderMonster()` - 19 edges
9. `renderMonster()` - 19 edges
10. `showDecorationDetail()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `weaponTokens()` --indirect_call--> `t()`  [INFERRED]
  rise/app.js → rise/data/i18n.js
- `weaponSameFamily()` --indirect_call--> `t()`  [INFERRED]
  rise/app.js → rise/data/i18n.js
- `weaponTokens()` --indirect_call--> `t()`  [INFERRED]
  wilds/app.js → wilds/data/i18n_wilds.js
- `weaponSameFamily()` --indirect_call--> `t()`  [INFERRED]
  wilds/app.js → wilds/data/i18n_wilds.js
- `parseType()` --indirect_call--> `t()`  [INFERRED]
  wilds/data/parse_weapon_type_tables.js → wilds/data/i18n_wilds.js

## Import Cycles
- None detected.

## Communities (84 total, 3 thin omitted)

### Community 0 - "rise/app.js"
Cohesion: 0.02
Nodes (85): ANOMALY_LEVEL_RANGE, ARMOR_PART_ORDER, ARMOR_SET_DISPLAY_MAP, ARMOR_SET_HIDDEN, ARMOR_SET_IMG_OVERRIDES, armorBackEl, armorFextraIcons, armorIndexEl (+77 more)

### Community 1 - "showWeaponDetail"
Cohesion: 0.22
Nodes (25): annotateAnomalyLevel(), armorPieceMaterialsHtml(), bootMaterials(), buildMaterialIndex(), escapeAttr(), getMaterialSources(), iconPath(), materialIconTag() (+17 more)

### Community 2 - "ui"
Cohesion: 0.13
Nodes (24): alignInflictsDivider(), applyI18nText(), applyUiStrings(), capitalize(), elementIconTag(), hzStatIconTag(), hzStatLabel(), hzStatLabelFull() (+16 more)

### Community 3 - "normalizeWeaponName"
Cohesion: 0.28
Nodes (9): escapeXml(), getWeaponChain(), getWeaponCrossLinks(), initWeaponTree(), normalizeWeaponName(), renderWeaponTreeSVG(), weaponSameFamily(), weaponTokens() (+1 more)

### Community 4 - "Progreso del proyecto"
Cohesion: 0.07
Nodes (27): 3 monstruos nuevos con silueta de golpe: Basarios, Chameleos, Diablos (2026-08-07), Batches de recolección (13 monstruos c/u), Correcciones aplicadas manualmente, Estado general, Feature: Cadena de armas limpia (solo la rama normal) + traducción de tipos (2026-08-09), Feature: Catálogo de armas con SOLO la versión final (re-datos de árbol real) (2026-08-08), Feature: Decoraciones / Adornos (2026-08-07), Feature: Estructura multi-página por juego (2026-08-09) (+19 more)

### Community 5 - "build_weapon_tree.js"
Cohesion: 0.17
Nodes (9): { chromium }, FANDOM_BASE, FEXTRA_CACHE, fextraFile(), fextraSlug(), FINALS, fs, path (+1 more)

### Community 6 - "Notas de calidad de datos — casos a revisar"
Cohesion: 0.11
Nodes (18): Ampliación (2026-08-07): vínculo a monstruos + desplegable, Armas y Armaduras: fuentes, scripts y decisiones (2026-08-07), Bug de íconos de materiales corregido (2026-08-06), Confirmados y corregidos, Corrección de nombres de zonas de aparición (2026-08-06), Decoraciones / Adornos (2026-08-06), Descripción de "cómo obtener" para materiales sin monstruo (2026-08-07), Elementos que inflige cada monstruo (2026-08-05) (+10 more)

### Community 7 - "scrape_renders.js"
Cohesion: 0.23
Nodes (12): curlBinary(), curlText(), downloadImage(), { execFileSync }, fetchPage(), fileSlug(), fs, IMG_DIR (+4 more)

### Community 8 - "init"
Cohesion: 0.13
Nodes (20): bootDecorations(), bootPage(), buildSelector(), closePanel(), filterOptions(), groupFor(), hideViews(), init() (+12 more)

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

### Community 14 - "Project structure (multi-page per game, since 2026-08-09)"
Cohesion: 0.22
Nodes (8): Adding a new game (e.g. Wilds), Common tasks, graphify, How the app boots (`rise/app.js`), Key files to read first, Project structure (multi-page per game, since 2026-08-09), Where files live, Why extensionless URLs

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

### Community 39 - "renderArmorIndex"
Cohesion: 0.14
Nodes (26): armorPieceSkillsHtml(), armorSetDisplayName(), armorSetImg(), armorSetPrefix(), bootArmor(), bootSkills(), buildImpliedArmorGroups(), buildPartialArmorGroups() (+18 more)

### Community 40 - "wilds/app.js"
Cohesion: 0.02
Nodes (93): ANOMALY_LEVEL_RANGE, ARMOR_PART_ORDER, ARMOR_SET_DISPLAY_MAP, ARMOR_SET_HIDDEN, ARMOR_SET_IMG_OVERRIDES, armorBackEl, armorFextraIcons, armorIndexEl (+85 more)

### Community 41 - "_test_obtain.js"
Cohesion: 0.50
Nodes (4): fs, html, parseObtainInfo(), stripHtml()

### Community 42 - "preview_final_parts.py"
Cohesion: 0.67
Nodes (3): main(), parse_points(), Debug helper: renders the CURRENT HITZONE_SHAPES mapping for a monster (as…

### Community 47 - "showArmorSetDetail"
Cohesion: 0.12
Nodes (30): armorIconTag(), armorPieceSkillsHtml(), armorSetDisplayName(), armorSetImg(), armorSetPrefix(), bootArmor(), buildImpliedArmorGroups(), buildMonsterEquipmentIndex() (+22 more)

### Community 48 - "init"
Cohesion: 0.10
Nodes (29): applyI18nText(), applyUiStrings(), bootDecorations(), bootPage(), bootSkills(), buildSelector(), closePanel(), filterOptions() (+21 more)

### Community 49 - "ui"
Cohesion: 0.23
Nodes (28): annotateAnomalyLevel(), armorPieceMaterialsHtml(), bootMaterials(), buildMaterialIndex(), decorationIconTag(), escapeAttr(), getMaterialSources(), iconPath() (+20 more)

### Community 50 - "scrape_missing_armor_sets.js"
Cohesion: 0.10
Nodes (18): allSets, existingNames, existingSets, FEXTRALIFE_SETS, fextraSeen, findPiece(), fs, missingPieces (+10 more)

### Community 51 - "renderMonster"
Cohesion: 0.15
Nodes (20): alignInflictsDivider(), capitalize(), elementIconTag(), hzStatIconTag(), hzStatLabel(), hzStatLabelFull(), rankElementColumns(), rankPhysicalCellsByColumn() (+12 more)

### Community 52 - "runGlobalSearch"
Cohesion: 0.19
Nodes (19): armorIconTag(), bootWeapons(), buildMonsterEquipmentIndex(), decorationIconTag(), isWeaponTrueFinal(), itemMaskIconTag(), navArmorSet(), navDecoration() (+11 more)

### Community 53 - "parse_weapon_type_tables.js"
Cohesion: 0.16
Nodes (14): weaponSameFamily(), weaponTokens(), I18N_WILDS, MATERIAL_NAME_ALIASES, normalizeMaterialKey(), t(), translateMaterial(), all (+6 more)

### Community 54 - "1. Qué hay completo ahora"
Cohesion: 0.13
Nodes (14): 1. Qué hay completo ahora, 2. Convención α/β (pedido explícito del usuario esta sesión), 3. Bugs reales encontrados y corregidos esta sesión (no repetir), 4. Lo que falta (para retomar), Charms — solo nombres, 185 entradas, `data/armor_pieces.json` — 685 piezas ✅ (antes: 0, vacío), `data/armor_sets.json` — 159 sets ✅ (mejora grande), `data/decorations.json` — 361/361 con ícono ✅ (100%) (+6 more)

### Community 55 - "renderWeaponsIndex"
Cohesion: 0.19
Nodes (13): bootWeapons(), escapeXml(), getWeaponChain(), getWeaponCrossLinks(), initWeaponTree(), isWeaponTrueFinal(), normalizeWeaponName(), renderWeaponsIndex() (+5 more)

### Community 56 - "complete_monsters_from_wiki.js"
Cohesion: 0.29
Nodes (10): clean(), convertMaterials(), fs, get(), https, main(), parseWiki(), path (+2 more)

### Community 57 - "fix_guardian_arkveld.js"
Cohesion: 0.18
Nodes (10): fs, materials, mon, MONSTERS, OUT, path, result, sections (+2 more)

### Community 58 - "complete_monsters_v2.js"
Cohesion: 0.29
Nodes (9): apiGet(), convertMaterials(), fs, https, main(), parseWikitext(), path, slugToWikiTitle() (+1 more)

### Community 59 - "fix_last_2_monsters.js"
Cohesion: 0.31
Nodes (9): apiGet(), convertMaterials(), fs, https, main(), parseAilments(), parseDropRates(), parseLocales() (+1 more)

### Community 60 - "scrape_armor_pieces.js"
Cohesion: 0.27
Nodes (9): fetchUrl(), fs, https, main(), parseSetPage(), PART_ORDER, path, RAW_DIR (+1 more)

### Community 61 - "scrape_mhwikiorg_armor_materials.js"
Cohesion: 0.29
Nodes (9): decodeEntities(), fetchUrl(), fs, https, main(), normName(), parseMaterials(), path (+1 more)

### Community 62 - "build_deco_skill_icons.js"
Cohesion: 0.33
Nodes (8): download(), fs, fullSizeUrl(), https, main(), normDeco(), path, slugify()

### Community 63 - "normalize_wilds_monsters.js"
Cohesion: 0.39
Nodes (8): ELEMENTS, fs, main(), normalizeElement(), OUT, path, SMALL, splitInflicts()

### Community 64 - "parse_mhwikiorg_decorations.js"
Cohesion: 0.25
Nodes (8): armorHtml, decoData, decodeEntities(), fs, html, path, skillIconUrls, stripTags()

### Community 65 - "scrape_decos_skills_charms.js"
Cohesion: 0.33
Nodes (8): fs, get(), https, main(), parseCharms(), parseDecorations(), parseSkills(), path

### Community 66 - "scrape_wilds_armor_sets_detail.js"
Cohesion: 0.31
Nodes (8): clean(), fetchUrl(), fs, https, main(), parseSetPage(), path, RAW_DIR

### Community 67 - "scrape_wilds_monster_wiki.js"
Cohesion: 0.31
Nodes (8): fetchUrl(), fs, https, main(), parseInfobox(), path, RAW_DIR, slugToWikiTitle()

### Community 68 - "scrape_wilds_monsters.js"
Cohesion: 0.28
Nodes (8): { chromium }, fs, getMonsterList(), main(), path, NOTE: shadcn tables have no <thead>; <th> cells live in the first <tbody> row., RAW_DIR, scrapeMonster()

### Community 69 - "renderCharmsIndex"
Cohesion: 0.36
Nodes (8): bootCharms(), charmIconTag(), itemIconSrcWilds(), navCharm(), renderCharmsIndex(), showCharmDetail(), showCharmsView(), trCharmName()

### Community 70 - "download_wilds_item_icons.js"
Cohesion: 0.32
Nodes (7): download(), fs, https, IMG_DIR, main(), path, slugify()

### Community 71 - "finalize_decorations.js"
Cohesion: 0.36
Nodes (7): download(), fs, fullSizeUrl(), https, main(), path, slugify()

### Community 72 - "fix_materials.js"
Cohesion: 0.32
Nodes (7): append(), clean(), fs, main(), MONSTERS, path, RAW

### Community 73 - "merge_armor_comparison.js"
Cohesion: 0.36
Nodes (7): download(), fs, fullSizeUrl(), https, main(), path, slugify()

### Community 74 - "scrape_wilds_items_more.js"
Cohesion: 0.32
Nodes (7): fetchUrl(), fs, https, main(), PAGES, parseItems(), path

### Community 75 - "finalize_weapons.js"
Cohesion: 0.38
Nodes (6): download(), fs, fullSizeUrl(), https, main(), path

### Community 76 - "scrape_skill_levels.js"
Cohesion: 0.33
Nodes (6): { chromium }, fs, main(), parseSkillLevels(), path, RAW

### Community 77 - "scrape_wilds_armor_sets.js"
Cohesion: 0.38
Nodes (6): extractSetUrls(), fetchUrl(), fs, https, main(), path

### Community 78 - "scrape_wilds_items.js"
Cohesion: 0.38
Nodes (6): fetchUrl(), fs, https, main(), parseItems(), path

### Community 79 - "parse_armor_comparison.js"
Cohesion: 0.33
Nodes (4): fs, html, path, sets

### Community 80 - "scrape_wilds_decoration_icons.js"
Cohesion: 0.33
Nodes (5): decoIcons, fs, html, path, skillIcons

### Community 81 - "scrape_wilds_weapons.js"
Cohesion: 0.40
Nodes (5): fs, get(), https, main(), path

### Community 82 - "i18n.js"
Cohesion: 0.50
Nodes (4): I18N, MATERIAL_NAME_ALIASES, normalizeMaterialKey(), translateMaterial()

### Community 83 - "test_deco_skill_pw.js"
Cohesion: 0.40
Nodes (3): { chromium }, fs, path

## Knowledge Gaps
- **530 isolated node(s):** `$schema`, `edit`, `@0xsero/open-queue`, `GROUP_OVERRIDES`, `ELEMENT_ORDER` (+525 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `weaponSameFamily()` connect `parse_weapon_type_tables.js` to `wilds/app.js`, `renderWeaponsIndex`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `weaponTokens()` connect `parse_weapon_type_tables.js` to `wilds/app.js`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `$schema`, `edit`, `@0xsero/open-queue` to the rest of the system?**
  _530 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `rise/app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.023523122159850307 - nodes in this community are weakly interconnected._
- **Should `ui` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Should `Progreso del proyecto` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Notas de calidad de datos — casos a revisar` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._