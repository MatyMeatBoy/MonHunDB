# Wilds — Handoff para el otro bot

**Proyecto:** `C:\Users\MP\Documents\00 Claude\mhrise-bestiario\wilds\`
**Servir:** `npx serve .` desde `mhrise-bestiario/`, abrir `http://localhost:3000/wilds/`
**Última actualización:** 2026-08-10 (2da pasada) — arreglos post-verificación en navegador real.

---

## 0. Arreglos de esta pasada (bugs que el usuario encontró probando en vivo)

- **Íconos de materiales/decoraciones/skills rotos**: los 3 manifiestos (`item_icon_manifest.json`, `decoration_icon_manifest.json`, `skill_icon_manifest.json`) guardaban la ruta sin el prefijo `data/` (ej. `"images/items/x.png"` en vez de `"data/images/items/x.png"`) — rompía TODOS los íconos. Corregido en los 3.
- **Piezas de set no se vinculaban**: `set.pieces[]` (scrapeado de Fextralife) no tenía `id`, así que `armorPieces.find(p => p.id === ref.id)` nunca encontraba nada → detalle de set mostraba el separador `<hr>` pero cero contenido de pieza. Corregido: el `id` sintético ("wp1", "wp2"...) ahora se escribe en AMBOS lugares (`armor_pieces.json` Y `set.pieces[].id`) al generarlos juntos.
- **"undefined Lv1" en decoraciones**: leía `skill.nameEs`/`skill.effectEs`, campos que no existen en el shape de Wilds (`{name, level}` nomás). Nueva función `decoSkillEffectText()` cruza contra `skills.json` (que sí tiene niveles reales) en vez de leer campos inexistentes.
- **"Cómo conseguirlo" en vez de "Materiales para crear"** en decoraciones: Wilds no craftea decoraciones, se consiguen de baúles/orbes. Si `dec.sources` existe (scrapeado de monsterhunterwiki.org), se muestra esa sección en vez de la de materiales (que queda vacía a propósito).
- **Íconos de decoración recoloreados correctamente**: el ícono base de monsterhunterwiki.org es un gema gris con sombreado/facetas ya dibujadas (no un par silueta+detalle como el sistema de Rise) — un `mask-image` simple aplana todo a un color sólido y pierde las facetas. Fix: `mix-blend-mode: color` sobre una capa superpuesta preserva la luminosidad (facetas visibles) y solo cambia el tono. Detalle en `data/decoration_color_manifest.json` + `data/images/deco_masks/level{1,2,3}.webp` (solo 3 shapes reales, uno por nivel de ranura).
  - Ojo con el bug que salió de esto: `.material-icon { background: var(--bg-panel-alt) }` (shorthand) pisaba `background-size/position/repeat` de una regla `.deco-mask-icon` con la MISMA especificidad declarada antes en el archivo — el shorthand ganaba por orden de cascada. Fix: subir especificidad a `.material-icon.deco-mask-icon` en vez de solo `.deco-mask-icon`.
- **Galería de armaduras: pares Alpha/Beta fusionados** (pedido explícito) — un set que tiene versión α y β (40 casos) ahora es UNA sola card con la imagen + dos botones abajo ("α" / "β") en vez de dos cards separadas. Lógica en `renderArmorIndex()`, agrupa por nombre base (sin el símbolo griego).
- **2 monstruos duplicados fusionados** y **convención α/β** — ver sección 2 y `DATA_NOTES.md`, sin cambios desde la primera pasada.

---

## 1. Qué hay completo ahora

### Estructura multi-página — igual a Rise ✅
8 páginas (Rise tiene 7): `index.html`, `monster.html`, `decorations.html`, `weapons.html`, `armor.html`, `materials.html`, `skills.html`, **`charms.html`** (nueva, Wilds no comparte esto con Rise). Nav de 6 íconos en las 8. Sin botón "Volver a monstruos" (se sacó de las 2 webs esta sesión, el combobox del topbar ya cubre eso).

### `data/monsters.json` — 53 monstruos ✅
Fusionados 2 duplicados reales esta sesión: Ceratonoth (Male)/(Female) eran 100% idénticos en stats → un solo "Ceratonoth". "Dalthydon (Livestock)" era duplicado exacto de "Dalthydon" → eliminado. Ícono de barra: 132/136 monstruos con ícono (copiados de `bestiario-nemo/exportv1/wilds/images/`), faltan Ceratonoth (ya resuelto con ícono unificado). La entrada "High Purrformance Barrel Puncher" queda descartada del catálogo final: solo existe en el listado bruto histórico y no está en `monsters.json` ni en el manifiesto usado por la app.

### `data/decorations.json` — 361/361 con ícono ✅ (100%)
Fuente: `monsterhunterwiki.org/wiki/MHWilds/Decorations` — match perfecto 361/361 por nombre exacto. Trae también `rarity` y `sources` (texto de dónde se consigue: baúles, minijefes, %). Materiales de crafteo siguen vacíos **a propósito** — confirmado que en Wilds las decoraciones no se craftean con partes de monstruo.

### `data/skills.json` — 177 skills, 147 con ícono único ✅
A diferencia de Rise (1 sola máscara+color para todas), **cada skill de Wilds tiene su propio ícono real**. Scrapeados de `monsterhunterwilds.wiki.fextralife.com/{Decorations,Skills,Group_Skills,Set_Bonus_Skills}`. 30 sin ícono (esas páginas no las cubren todavía).

### `data/armor_sets.json` — 159 sets ✅ (mejora grande)
Fuente principal: `Armor_Sets_Comparison_Table` de Fextralife (stats de set completo) + página individual de cada set (piezas) + `monsterhunterwiki.org` (materiales de forja). Por set: `name` (con **α/β** en vez de "Alpha"/"Beta", igual que en el juego — ver sección 2), `image`/`localImage` (cuerpo completo real, 157/159), `rarity`, `rank`, `defense`, `resistances`, `decoSlots`, `equipmentSkills`, `pieces[]` (158/159 con desglose, 130 con las 5 piezas completas), `materials[]` (148/159 con materiales de forja reales).

### `data/armor_pieces.json` — 685 piezas ✅ (antes: 0, vacío)
Reconstruido desde `armor_sets.json[].pieces`. Cada pieza: `name`, `part` (head/chest/arms/waist/legs), `defense`, `resistances`, `decoSlots`, `icon`. **`skills` y `materials` por pieza siguen vacíos** — solo se consiguió el material agregado a nivel de SET (arriba), no desglosado por pieza individual. Si se necesita por pieza, hay que entrar a cada página de Fextralife de nuevo con otro parser (no investigado).

### `data/weapons.json` — 1146 armas ✅ (antes: 87, todas sin `type`, inservibles)
Scrapeadas las Comparison Table embebidas (tabs) de las 14 páginas de tipo de arma en Fextralife (`/Great_Sword`, `/Long_Sword`, etc. — el link es a la MISMA página, la tabla vive en un tab, no en una URL de "_Comparison_Table" separada). Cada arma: `name`, `type` (real, 14 categorías), `icon` (local, descargado), `rarity`, `attack`, `element`, `materials[]`, `cost` (zenny). **No hay árbol de mejora** (prevId/nextId/weapon_tree) — Fextralife da lista plana por tipo, no cadena de crafteo. El catálogo actual muestra las 1146 sin filtrar a "solo finales" porque no hay dato de árbol para decidir cuál es final.

### `data/items_wilds.json` + `item_icon_manifest.json` — 629 items con ícono ✅
Ampliado esta sesión con Materials/Ingredients/Bowgun_Ammo/Special_Item-Other de Fextralife (antes solo `/Items`). Cobertura de íconos de materiales que aparecen en `monsters.json`: **252/286 (88%)**, con fallback automático de tier "+" (ítem base y su versión "+" comparten ícono).

### Charms — solo nombres, 185 entradas
`data/charms.json` conserva el esquema `{id, name, rarity, skills, materials, decoSlots}`; las 185 fichas tienen ahora descripción de Kiranico, y 181/185 tienen además habilidad, nivel y efecto, con nombre y efecto en español. Los 4 registros restantes son entradas especiales sin habilidad publicable en la fuente. Materiales e íconos siguen vacíos porque Kiranico no los expone para estos talismanes.

---

## 2. Convención α/β (pedido explícito del usuario esta sesión)

Los nombres de sets/piezas con "Alpha"/"Beta" ahora usan los símbolos griegos **α**/**β** (así aparecen en el juego real) — aplicado a `armor_sets.json` y `armor_pieces.json`. `monsterhunterwiki.org` ya usa esta convención nativamente, confirma que es correcta.

**Búsqueda sigue funcionando con texto**: `normalizeSearch()` en `app.js` (Rise Y Wilds, se aplicó a ambos) mapea `α→"alpha"` y `β→"beta"` antes de comparar, así que buscar "alpha" encuentra "α" igual. Mismo patrón que ya existía para el símbolo "+".

## 3. Bugs reales encontrados y corregidos esta sesión (no repetir)

- **Mojibake (UTF-8 mal decodificado) en ~15 archivos**: `i18n_wilds.js` y 10 HTML de Rise+Wilds tenían texto tipo "â€" ElegÃ­" en vez de "— Elige". Arreglado con reconstrucción byte-a-byte (encode cp1252 → decode utf-8). Si aparece de nuevo, ese es el mecanismo — no es un problema de este proyecto, es contenido pegado con la codificación equivocada en algún momento.
- **`charmsNav`/`charmsSearchPlaceholder` en inglés pegados DENTRO del bloque `es:` de `i18n_wilds.js`** (clave duplicada, JS se queda con el último valor → mostraba "Charms" en español). Corregido, movidas al bloque `en:` real.
- **Catálogo de armas vacío**: `weaponFinalNames` se inicializaba como `Set` vacío-pero-no-null cuando `weapon_tree.json` está vacío (caso Wilds) → `isWeaponTrueFinal()` confiaba en él como fuente autoritativa y marcaba TODO como no-final. Fix en `initWeaponTree()`: solo asignar `weaponFinalNames` si `tree.finals` tiene contenido real, si no dejarlo `null` para que caiga al heurístico de `nextId`.
- **Galería de armaduras vacía**: `armorPieces.json` estaba vacío al momento de calcular el rango de cada set (`setRank()` cruzaba `s.pieces` contra `armorPieces` por `id`, no encontraba nada, devolvía rango 99 que no matchea ningún bucket). Fix: `setRankWilds()` nuevo, usa el `rank` que ya viene directo en el dato scrapeado de Wilds en vez de inferirlo.
- **Voseo**: "Elegí"/"podés"/"carvees" → "Elige"/"puedes"/"carveas" en ambos juegos (pedido explícito, español neutro).

## 4. Lo que falta (para retomar)

- 🔴 **Materiales por pieza de armadura** (solo hay a nivel de set) — si se necesita desglose, re-scrapear página individual de cada pieza.
- 🟢 **Habilidades por pieza**: 690/690 piezas completadas. Las cinco piezas de `Arkveld γ` se completaron desde Game8 mediante `data/enrich_arkveld_gamma_game8.js`; las 20 piezas especiales restantes (`Sororal`, `Azure Age`, `Gala Suit` y `Duna`) se completaron desde sus tablas individuales de Game8 mediante `data/enrich_special_armor_skills_game8.js`. Los resúmenes de set quedaron completos: 159/159, reconstruyendo los que no tenían resumen únicamente desde sus piezas ya matcheadas. También se normalizaron nombres `Diver's` y Guardian que venían abreviados o con entidades HTML literales.
- 🟢 **Materiales de sets**: 159/159 documentados desde tablas de forja de Game8 mediante `data/enrich_armor_set_materials_game8.js`; 156 tienen materiales y los tres sets iniciales (`Chainmail`, `Hope`, `Leather`) están confirmados como coste únicamente en zenny por la fuente.
- 🔴 **Árbol de mejora de armas** (prevId/nextId) — sin esto el catálogo no puede mostrar "solo finales". Buscar otra fuente (quizás `monsterhunterwiki.org` tenga cadena de crafteo, no probado).
- 🟡 **Talismanes**: habilidades cubiertas en 181/185; quedan sin ícono/materiales y 4 entradas especiales sin habilidad en la fuente.
- 🟡 **34/286 materiales** y **30/177 skills** sin ícono — las páginas ya scrapeadas no los cubren.
- ✅ **"High Purrformance Barrel Puncher"** — verificado como entrada ajena al catálogo y descartado del dataset final.
- 🟢 Todo lo demás (monstruos, decoraciones, sets de armadura, catálogo de armas) es usable y verificado en navegador sin errores de consola.
