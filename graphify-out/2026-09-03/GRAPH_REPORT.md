# Graph Report - mhrise-bestiario  (2026-09-02)

## Corpus Check
- 271 files · ~10,013,347 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2146 nodes · 3570 edges · 160 communities (155 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `317b8a75`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- rise/app.js
- ui
- renderMonster
- renderWeaponsIndex
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
- renderArmorIndex
- showSkillDetail
- ui
- scrape_missing_armor_sets.js
- renderMonster
- mhfu/app.js
- parse_weapon_type_tables.js
- 1. Qué hay completo ahora
- runGlobalSearch
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
- showCharmDetail
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
- escapeAttr
- ui
- runGlobalSearch
- showSkillDetail
- quests.js
- renderMonster
- build_monsters.js
- missions.js
- build_kiranico_item_translations.js
- scrape_fandom_mhfu_quest_translations.js
- build_elotrolado_weapon_translations.js
- crossmatch_spanish_materials.js
- wilds/data/build_weapon_tree.js
- init
- build_decorations_skills_items.js
- build_weapons.js
- enrich_quest_meta.js
- scrape_quest_types_game8.js
- update_item_icons_mhwikiorg_tables.js
- audit_armor_materials_mhfudb.js
- apply_armor_fextra_patch.js
- enrich_armor_piece_materials_fextra.js
- scrape_elotrolado_mhfu.js
- mhgu/data/scrape_kiranico_item_translations.js
- scrape_fextralife_talisman_materials.js
- mh4u/data/scrape_kiranico_item_translations.js
- build_palico_pieces_join.js
- build_palico_weapons_join.js
- build_bow_stats.js
- mhfu/data/i18n.js
- repair_armor_set_references.js
- build_kiranico_weapon_translations.js
- scrape_mhwikiorg_item_icons.js
- normalizeWeaponName
- apply_decoration_spanish_names.js
- mhfu/data/build_weapon_tree.js
- create_rathalos_pedestal.py
- Informe gráfico de completitud de MonHunDB
- selectMonster
- apply_charm_renders_patch.js
- build_kiranico_category_translations.js
- enrich_mission_board.js
- audit_catalog_links.js
- build_gathering_sources.js
- enrich_quests_kiranico.js
- enrich_armor_set_materials_game8.js
- enrich_charms_kiranico.js
- enrich_armor_piece_skills_kiranico.js
- enrich_kiranico_missions.js
- fix_plus_tier_icon_duplicates.js
- build_armor.js
- scrape_quests_kiranico.js
- audit_missing_item_icons.js
- enrich_armor_piece_materials_mhdb_api.js
- enrich_special_armor_skills_game8.js
- rebuild_item_icon_manifest.js
- audit_missing_armor_renders.js
- build_material_obtain_notes.py
- fix_glb_alpha_mask.js
- enrich_missing_weapon_rarities.js
- scrape_rampage_skills.js
- build_palico_armor.js
- sync_armor_set_skills.js
- build_quests.js
- i18n_wilds.js
- parse_monster_material_icons.js
- scrape_kiranico_missions.js
- Desarrollo local y modo admin
- normalize_skill_references.js
- enrich_arkveld_gamma_game8.js
- vecmon-bridge.js
- repair_charms_metadata.js

## God Nodes (most connected - your core abstractions)
1. `ui()` - 46 edges
2. `escapeAttr()` - 35 edges
3. `runGlobalSearch()` - 35 edges
4. `ui()` - 33 edges
5. `ui()` - 31 edges
6. `runGlobalSearch()` - 30 edges
7. `Progreso del proyecto` - 30 edges
8. `showWeaponDetail()` - 29 edges
9. `runGlobalSearch()` - 28 edges
10. `showWeaponDetail()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `main()` --indirect_call--> `page()`  [INFERRED]
  wilds/data/update_item_icons_mhwikiorg_tables.js → mhfu/data/scrape_elotrolado_mhfu.js
- `main()` --indirect_call--> `page()`  [INFERRED]
  wilds/data/scrape_wilds_items_more.js → mhfu/data/scrape_elotrolado_mhfu.js
- `renderWeaponsTypeFilter()` --indirect_call--> `t()`  [INFERRED]
  mhfu/app.js → mhfu/data/i18n.js
- `bootMaterials()` --indirect_call--> `key()`  [INFERRED]
  mhfu/app.js → mhfu/data/audit_armor_materials_mhfudb.js
- `renderHitzoneSilhouette()` --indirect_call--> `key()`  [INFERRED]
  mhfu/app.js → mhfu/data/audit_armor_materials_mhfudb.js

## Import Cycles
- None detected.

## Communities (160 total, 5 thin omitted)

### Community 0 - "rise/app.js"
Cohesion: 0.02
Nodes (101): ANOMALY_LEVEL_RANGE, ARMOR_PART_ORDER, ARMOR_SET_DISPLAY_MAP, ARMOR_SET_HIDDEN, ARMOR_SET_IMG_OVERRIDES, armorBackEl, armorFextraIcons, armorIndexEl (+93 more)

### Community 1 - "ui"
Cohesion: 0.16
Nodes (38): ammoTableHtml(), annotateAnomalyLevel(), applyUiStrings(), armorPieceMaterialsHtml(), bootMaterials(), buildMaterialIndex(), escapeAttr(), getMaterialSources() (+30 more)

### Community 2 - "renderMonster"
Cohesion: 0.14
Nodes (21): alignInflictsDivider(), applyI18nText(), capitalize(), elementIconTag(), hzStatIconTag(), hzStatLabel(), hzStatLabelFull(), rankElementColumns() (+13 more)

### Community 3 - "renderWeaponsIndex"
Cohesion: 0.19
Nodes (17): bootWeapons(), escapeXml(), getWeaponChain(), getWeaponCrossLinks(), initWeaponTree(), isWeaponTrueFinal(), normalizeWeaponName(), renderWeaponsIndex() (+9 more)

### Community 4 - "Progreso del proyecto"
Cohesion: 0.06
Nodes (30): 3 monstruos nuevos con silueta de golpe: Basarios, Chameleos, Diablos (2026-08-07), Batches de recolección (13 monstruos c/u), Cierre MHFU: puntos de habilidades y ramas de armas (2026-08-15), Correcciones aplicadas manualmente, Estado general, Feature: Cadena de armas limpia (solo la rama normal) + traducción de tipos (2026-08-09), Feature: Catálogo de armas con SOLO la versión final (re-datos de árbol real) (2026-08-08), Feature: Decoraciones / Adornos (2026-08-07) (+22 more)

### Community 5 - "build_weapon_tree.js"
Cohesion: 0.17
Nodes (9): { chromium }, FANDOM_BASE, FEXTRA_CACHE, fextraFile(), fextraSlug(), FINALS, fs, path (+1 more)

### Community 6 - "Notas de calidad de datos — casos a revisar"
Cohesion: 0.10
Nodes (20): Ampliación (2026-08-07): vínculo a monstruos + desplegable, Armas y Armaduras: fuentes, scripts y decisiones (2026-08-07), Bug de íconos de materiales corregido (2026-08-06), Confirmados y corregidos, Corrección de nombres de zonas de aparición (2026-08-06), Decoraciones / Adornos (2026-08-06), Descripción de "cómo obtener" para materiales sin monstruo (2026-08-07), Elementos que inflige cada monstruo (2026-08-05) (+12 more)

### Community 7 - "scrape_renders.js"
Cohesion: 0.23
Nodes (12): curlBinary(), curlText(), downloadImage(), { execFileSync }, fetchPage(), fileSlug(), fs, IMG_DIR (+4 more)

### Community 8 - "init"
Cohesion: 0.10
Nodes (28): bootDecorations(), bootPage(), bootSkills(), buildSelector(), closeGlobalSearch(), closePanel(), filterOptions(), groupFor() (+20 more)

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
Cohesion: 0.12
Nodes (31): armorIconTag(), armorPieceSkillsHtml(), armorSetDisplayName(), armorSetImg(), armorSetPrefix(), bootArmor(), buildImpliedArmorGroups(), buildMonsterEquipmentIndex() (+23 more)

### Community 40 - "wilds/app.js"
Cohesion: 0.02
Nodes (122): ANOMALY_LEVEL_RANGE, ARMOR_PART_ORDER, ARMOR_SET_DISPLAY_MAP, ARMOR_SET_HIDDEN, ARMOR_SET_IMG_OVERRIDES, armorBackEl, armorFextraIcons, armorIndexEl (+114 more)

### Community 41 - "_test_obtain.js"
Cohesion: 0.50
Nodes (4): fs, html, parseObtainInfo(), stripHtml()

### Community 42 - "preview_final_parts.py"
Cohesion: 0.67
Nodes (3): main(), parse_points(), Debug helper: renders the CURRENT HITZONE_SHAPES mapping for a monster (as…

### Community 47 - "renderArmorIndex"
Cohesion: 0.19
Nodes (21): armorIconTag(), armorPieceSkillsHtml(), armorSetDisplayName(), armorSetImg(), armorSetPrefix(), bootArmor(), buildImpliedArmorGroups(), buildPartialArmorGroups() (+13 more)

### Community 48 - "showSkillDetail"
Cohesion: 0.17
Nodes (18): bootDecorations(), bootPage(), bootSkills(), buildSkillGrantIndex(), decorationIconTag(), decorationMaskIconTag(), hideViews(), itemMaskIconTag() (+10 more)

### Community 49 - "ui"
Cohesion: 0.20
Nodes (30): ammoTableHtml(), annotateAnomalyLevel(), applyUiStrings(), armorPieceMaterialsHtml(), bootMaterials(), buildMaterialIndex(), decorationSourceIconTag(), escapeAttr() (+22 more)

### Community 50 - "scrape_missing_armor_sets.js"
Cohesion: 0.10
Nodes (18): allSets, existingNames, existingSets, FEXTRALIFE_SETS, fextraSeen, findPiece(), fs, missingPieces (+10 more)

### Community 51 - "renderMonster"
Cohesion: 0.13
Nodes (22): alignInflictsDivider(), applyI18nText(), capitalize(), elementIconTag(), hzStatIconTag(), hzStatLabel(), hzStatLabelFull(), normalizeWildsHitzoneParts() (+14 more)

### Community 52 - "mhfu/app.js"
Cohesion: 0.02
Nodes (121): ANOMALY_LEVEL_RANGE, ARMOR_PART_ORDER, ARMOR_SET_DISPLAY_MAP, ARMOR_SET_HIDDEN, ARMOR_SET_IMG_OVERRIDES, armorBackEl, armorFextraIcons, armorHunterTypeToggleEl (+113 more)

### Community 53 - "parse_weapon_type_tables.js"
Cohesion: 0.29
Nodes (7): all, fs, PAGES_DIR, parseType(), path, stripTags(), types

### Community 54 - "1. Qué hay completo ahora"
Cohesion: 0.12
Nodes (15): 0. Arreglos de esta pasada (bugs que el usuario encontró probando en vivo), 1. Qué hay completo ahora, 2. Convención α/β (pedido explícito del usuario esta sesión), 3. Bugs reales encontrados y corregidos esta sesión (no repetir), 4. Lo que falta (para retomar), Charms — solo nombres, 185 entradas, `data/armor_pieces.json` — 685 piezas ✅ (antes: 0, vacío), `data/armor_sets.json` — 159 sets ✅ (mejora grande) (+7 more)

### Community 55 - "runGlobalSearch"
Cohesion: 0.14
Nodes (26): bootWeapons(), buildMonsterEquipmentIndex(), decoSkillEffectText(), escapeXml(), getArmorSetPieceIds(), getWeaponChain(), getWeaponCrossLinks(), initWeaponTree() (+18 more)

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
Cohesion: 0.33
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

### Community 69 - "showCharmDetail"
Cohesion: 0.29
Nodes (11): bootCharms(), charmBaseAndTier(), charmChain(), charmIconTag(), isCharmTrueFinal(), itemIconSrcWilds(), navCharm(), renderCharmsIndex() (+3 more)

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
Cohesion: 0.24
Nodes (9): page(), getPage(), fetchUrl(), fs, https, main(), PAGES, parseItems() (+1 more)

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

### Community 84 - "escapeAttr"
Cohesion: 0.14
Nodes (38): ammoTableHtml(), annotateAnomalyLevel(), armorPieceMaterialsHtml(), bowStatsHtml(), buildMaterialIndex(), buildSelector(), combinationItemHtml(), decorationForItemName() (+30 more)

### Community 85 - "ui"
Cohesion: 0.12
Nodes (35): applyI18nText(), applyUiStrings(), bootQuests(), farmGuideSourcesHtml(), gatheringAccountItem(), gatheringRankHint(), gatheringSourcesHtml(), isKeyQuest() (+27 more)

### Community 86 - "runGlobalSearch"
Cohesion: 0.13
Nodes (32): armorGalleryLabel(), armorGalleryVariantLabel(), armorHunterTypeBadge(), armorIconTag(), armorSetDisplayName(), armorSetHunterTypeSummary(), armorSetImg(), armorSetPrefix() (+24 more)

### Community 87 - "showSkillDetail"
Cohesion: 0.11
Nodes (29): armorPieceSkillsHtml(), bootArmor(), bootDecorations(), bootMaterials(), bootPage(), bootSkills(), bootWeapons(), buildSkillGrantIndex() (+21 more)

### Community 88 - "quests.js"
Cohesion: 0.17
Nodes (26): categoriesEl, categoryFor(), categoryInfo, detailEl, esc(), filtered(), indexEl, init() (+18 more)

### Community 89 - "renderMonster"
Cohesion: 0.11
Nodes (26): alignInflictsDivider(), capitalize(), elementIconTag(), HITZONE_STAT_KEYS, humanizeMhfuPart(), hzStatIconTag(), hzStatLabel(), hzStatLabelFull() (+18 more)

### Community 90 - "build_monsters.js"
Cohesion: 0.09
Nodes (20): alphaOk, BREAK_TYPES, buildMaterials(), CARVE_TYPES, DROP_TYPES, elementByName, elementEff, fs (+12 more)

### Community 91 - "missions.js"
Cohesion: 0.22
Nodes (18): all, detailEl, esc(), filtered(), indexEl, init(), modeFor(), monsterIconFor() (+10 more)

### Community 92 - "build_kiranico_item_translations.js"
Cohesion: 0.12
Nodes (16): decodeEntities(), dict, esByMatchKey, fs, items, ITEMS_PATH, kiranico, KIRANICO_PATH (+8 more)

### Community 93 - "scrape_fandom_mhfu_quest_translations.js"
Cohesion: 0.15
Nodes (14): clean(), fs, https, items, locationMap, monsterByEs, monsters, norm() (+6 more)

### Community 94 - "build_elotrolado_weapon_translations.js"
Cohesion: 0.12
Nodes (13): ambiguous, CACHE, ELEMENTS, fs, ICON_TYPES, MANUAL_SOURCE_TRANSLATIONS, OUT, path (+5 more)

### Community 95 - "crossmatch_spanish_materials.js"
Cohesion: 0.18
Nodes (14): CACHE, cells(), DATA, decodeHtml(), fetchSource(), fs, materialish(), norm() (+6 more)

### Community 96 - "wilds/data/build_weapon_tree.js"
Cohesion: 0.14
Nodes (15): canonical, decodeEntities(), finals, fs, norm(), order, out, OUT_PATH (+7 more)

### Community 97 - "init"
Cohesion: 0.15
Nodes (15): buildFarmGuideIndex(), buildMapGatheringIndex(), buildVeggieElderIndex(), closeGlobalSearch(), closePanel(), filterOptions(), init(), initCombobox() (+7 more)

### Community 98 - "build_decorations_skills_items.js"
Cohesion: 0.14
Nodes (14): activationDescription(), decorations, decosRaw, fs, items, itemsRaw, MHFU_SKILL_DESCRIPTIONS, path (+6 more)

### Community 99 - "build_weapons.js"
Cohesion: 0.13
Nodes (13): byId, craft, craftByName, fs, idByName, out, OUT_IMG_DIR, path (+5 more)

### Community 100 - "enrich_quest_meta.js"
Cohesion: 0.24
Nodes (14): decode(), englishNames(), fetchText(), fs, keyNames(), keySources, loadI18n(), main() (+6 more)

### Community 101 - "scrape_quest_types_game8.js"
Cohesion: 0.19
Nodes (14): byName, cleanTitle(), extraSources, fetchText(), fs, main(), normalize(), overrides (+6 more)

### Community 102 - "update_item_icons_mhwikiorg_tables.js"
Cohesion: 0.18
Nodes (14): { Cache }, cheerio, decodeEntities(), downloadFile(), extractCatalogRows(), { fetchHtml }, fs, fullSizeUrl() (+6 more)

### Community 103 - "audit_armor_materials_mhfudb.js"
Cohesion: 0.15
Nodes (13): fs, key(), local, localFile, mismatches, missing, partKey(), path (+5 more)

### Community 104 - "apply_armor_fextra_patch.js"
Cohesion: 0.14
Nodes (12): DRY_RUN, fs, GREEK, idToLocalFile, OUT_IMG_DIR, path, pieces, setFiles (+4 more)

### Community 105 - "enrich_armor_piece_materials_fextra.js"
Cohesion: 0.19
Nodes (11): byName, decode(), fs, links(), materials(), path, pieces, RAW_PIECES (+3 more)

### Community 106 - "scrape_elotrolado_mhfu.js"
Cohesion: 0.21
Nodes (11): add(), CACHE, decode(), EXTRA_SOURCES, fs, norm(), OUT, PAGES (+3 more)

### Community 107 - "mhgu/data/scrape_kiranico_item_translations.js"
Cohesion: 0.19
Nodes (11): clean(), decode(), fs, key(), mhfuItemsPath, outMatches, outSource, parseItems() (+3 more)

### Community 108 - "scrape_fextralife_talisman_materials.js"
Cohesion: 0.15
Nodes (8): charms, charmsPath, fs, https, itemNames, itemPattern, items, path

### Community 109 - "mh4u/data/scrape_kiranico_item_translations.js"
Cohesion: 0.21
Nodes (10): clean(), decode(), fs, key(), MHFU_OUT, OUT, parseList(), path (+2 more)

### Community 110 - "build_palico_pieces_join.js"
Cohesion: 0.17
Nodes (8): armorSets, DRY_RUN, fs, OUT_IMG_DIR, path, pieces, setKeys, unmatched

### Community 111 - "build_palico_weapons_join.js"
Cohesion: 0.17
Nodes (8): armorSets, DRY_RUN, fs, OUT_IMG_DIR, path, results, setKeys, weapons

### Community 112 - "build_bow_stats.js"
Cohesion: 0.22
Nodes (9): clean(), fs, localBows, normalize(), out, parseRows(), path, root (+1 more)

### Community 113 - "mhfu/data/i18n.js"
Cohesion: 0.24
Nodes (10): I18N, MATERIAL_NAME_ALIASES, MHFU_ITEM_DESCRIPTION_CATEGORY_ES, MHFU_ITEM_DESCRIPTION_ES, MHFU_MATERIAL_NAME_ES, MHFU_PLUS_NAME_ES, MHFU_PLUS_SUFFIX_ES, normalizeMaterialKey() (+2 more)

### Community 114 - "repair_armor_set_references.js"
Cohesion: 0.18
Nodes (9): byId, byName, fs, path, pieces, sets, setsPath, ucamulbas (+1 more)

### Community 115 - "build_kiranico_weapon_translations.js"
Cohesion: 0.20
Nodes (10): decodeEntities(), esByKey, files, fs, missing, norm(), path, RIPERINO_WEAPONS_DIR (+2 more)

### Community 116 - "scrape_mhwikiorg_item_icons.js"
Cohesion: 0.27
Nodes (10): downloadFile(), extractIconUrl(), fetchUrl(), fs, https, ICON_DIR, main(), path (+2 more)

### Community 117 - "normalizeWeaponName"
Cohesion: 0.24
Nodes (10): escapeXml(), getWeaponChain(), getWeaponCrossLinks(), initWeaponTree(), isWeaponTrueFinal(), normalizeWeaponName(), renderWeaponTreeSVG(), weaponSameFamily() (+2 more)

### Community 118 - "apply_decoration_spanish_names.js"
Cohesion: 0.20
Nodes (9): decorations, decorationsPath, fs, items, itemsPath, labels, path, skillEs (+1 more)

### Community 119 - "mhfu/data/build_weapon_tree.js"
Cohesion: 0.20
Nodes (9): byId, childIds, finals, fs, order, out, parents, path (+1 more)

### Community 120 - "create_rathalos_pedestal.py"
Cohesion: 0.22
Nodes (4): apply_pose(), pose_node(), Build a local Rathalos display stand into a second GLB., Rotate a mesh around its local bounding-box center, preserving placement.

### Community 121 - "Informe gráfico de completitud de MonHunDB"
Cohesion: 0.20
Nodes (9): Gráfico de deuda prioritaria, Informe gráfico de completitud de MonHunDB, Lectura rápida, Lo que falta, medido, MHFU, Orden recomendado para llegar al completionismo, Resumen visual, Rise (+1 more)

### Community 122 - "selectMonster"
Cohesion: 0.29
Nodes (10): buildSelector(), closePanel(), filterOptions(), groupFor(), iconPath(), initCombobox(), openPanel(), selectFirstVisibleOption() (+2 more)

### Community 123 - "apply_charm_renders_patch.js"
Cohesion: 0.20
Nodes (8): charms, fs, idsInSite, manifest, OUT_IMG_DIR, path, renderFiles, unmatched

### Community 124 - "build_kiranico_category_translations.js"
Cohesion: 0.31
Nodes (9): decodeEntities(), fs, loadJson(), norm(), path, report(), RIPERINO_DIR, translateSimpleCategory() (+1 more)

### Community 125 - "enrich_mission_board.js"
Cohesion: 0.27
Nodes (9): byId, decode(), file, fs, giverFor(), main(), path, rows (+1 more)

### Community 126 - "audit_catalog_links.js"
Cohesion: 0.25
Nodes (5): fs, games, names(), normalize(), path

### Community 127 - "build_gathering_sources.js"
Cohesion: 0.25
Nodes (8): fs, merchant(), merchantDir, OUT, path, read(), ROOT, SRC

### Community 128 - "enrich_quests_kiranico.js"
Cohesion: 0.33
Nodes (8): enrich(), field(), file, fs, main(), path, quests, strip()

### Community 129 - "enrich_armor_set_materials_game8.js"
Cohesion: 0.25
Nodes (8): byName, byPieceName, fs, main(), normalizePieceName(), pieces, sets, sources

### Community 130 - "enrich_charms_kiranico.js"
Cohesion: 0.42
Nodes (8): decode(), fetchOne(), fs, main(), parseLocalizedLevels(), parseMetaDescription(), parseSkill(), path

### Community 131 - "enrich_armor_piece_skills_kiranico.js"
Cohesion: 0.43
Nodes (7): clean(), fetchText(), fs, main(), parseLinks(), parseRows(), path

### Community 132 - "enrich_kiranico_missions.js"
Cohesion: 0.32
Nodes (7): decode(), file, fs, main(), one(), path, rows

### Community 133 - "fix_plus_tier_icon_duplicates.js"
Cohesion: 0.25
Nodes (7): byLower, fs, items, ITEMS_PATH, path, result, toRemove

### Community 134 - "build_armor.js"
Cohesion: 0.29
Nodes (6): armors, fs, out, OUT_IMG_DIR, PART_MAP, path

### Community 135 - "scrape_quests_kiranico.js"
Cohesion: 0.38
Nodes (6): fs, get(), main(), path, strip(), views

### Community 136 - "audit_missing_item_icons.js"
Cohesion: 0.29
Nodes (6): byStatus, fs, items, manifest, missing, out

### Community 137 - "enrich_armor_piece_materials_mhdb_api.js"
Cohesion: 0.29
Nodes (4): fs, out, path, pieces

### Community 138 - "enrich_special_armor_skills_game8.js"
Cohesion: 0.33
Nodes (6): byName, clean(), fs, main(), pieces, SOURCES

### Community 139 - "rebuild_item_icon_manifest.js"
Cohesion: 0.29
Nodes (6): fs, items, ITEMS_PATH, manifest, MANIFEST_PATH, path

### Community 140 - "audit_missing_armor_renders.js"
Cohesion: 0.33
Nodes (5): byStatus, fs, missing, out, pieces

### Community 141 - "build_material_obtain_notes.py"
Cohesion: 0.60
Nodes (5): clean_text(), main(), norm(), spanish(), used_materials()

### Community 142 - "fix_glb_alpha_mask.js"
Cohesion: 0.40
Nodes (5): files, fixAlphaMask(), fs, pad4(), path

### Community 143 - "enrich_missing_weapon_rarities.js"
Cohesion: 0.33
Nodes (3): file, fs, path

### Community 144 - "scrape_rampage_skills.js"
Cohesion: 0.40
Nodes (4): clean(), fs, parse(), path

### Community 145 - "build_palico_armor.js"
Cohesion: 0.33
Nodes (5): files, fs, OUT_IMG_DIR, path, sets

### Community 146 - "sync_armor_set_skills.js"
Cohesion: 0.33
Nodes (5): byName, fs, path, pieces, sets

### Community 147 - "build_quests.js"
Cohesion: 0.40
Nodes (4): fs, out, path, RANK_LABEL

### Community 148 - "i18n_wilds.js"
Cohesion: 0.50
Nodes (4): I18N_WILDS, MATERIAL_NAME_ALIASES, normalizeMaterialKey(), translateMaterial()

### Community 149 - "parse_monster_material_icons.js"
Cohesion: 0.40
Nodes (4): found, fs, path, RAW_DIR

### Community 150 - "scrape_kiranico_missions.js"
Cohesion: 0.50
Nodes (4): fs, main(), path, strip()

### Community 151 - "Desarrollo local y modo admin"
Cohesion: 0.50
Nodes (3): Desarrollo local y modo admin, Lanzamiento, VecMon · Admin local

### Community 152 - "normalize_skill_references.js"
Cohesion: 0.50
Nodes (3): ALIASES, fs, path

### Community 153 - "enrich_arkveld_gamma_game8.js"
Cohesion: 0.67
Nodes (3): decode(), fs, main()

## Knowledge Gaps
- **1073 isolated node(s):** `fs`, `path`, `games`, `fs`, `path` (+1068 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `key()` connect `audit_armor_materials_mhfudb.js` to `renderMonster`, `showSkillDetail`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `renderHitzoneSilhouette()` connect `renderMonster` to `audit_armor_materials_mhfudb.js`, `mhfu/app.js`, `ui`, `escapeAttr`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `bootMaterials()` connect `showSkillDetail` to `mhfu/app.js`, `audit_armor_materials_mhfudb.js`, `escapeAttr`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `games` to the rest of the system?**
  _1073 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `rise/app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.019413919413919414 - nodes in this community are weakly interconnected._
- **Should `renderMonster` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Should `Progreso del proyecto` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._