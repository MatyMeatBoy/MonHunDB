# Schemas de datos — referencia rápida

Forma resumida de cada JSON en `data/` que consume `app.js`, para no tener que abrir archivos
grandes y adivinar la estructura. Son ejemplos reales recortados, no el schema completo campo
por campo — para casos límite/nulos, ver `DATA_NOTES.md` o leer el archivo real.

## `monsters.json` — 78 monstruos (dataset core)

Ver el schema completo con comentarios en [`README.md`](README.md). Resumen: `name`, `species`,
`locations[]`, `weaknesses[]`/`resistances[]` (`{element, stars|null, immune?}`),
`ailmentSusceptibility[]`, `inflicts[]`, `materials: {"Low Rank"|"High Rank"|"Master Rank": [{material, rarity, targetReward, capture, breakParts, carves, dropped}]}`.
`rarity` siempre `null` (Fextralife no lo expone). Rangos ausentes = el monstruo no dropea en ese rango.

## `decorations.json` — 243 adornos (joyas)

```jsonc
{
  "id": "422304422",
  "name": "Mastery Jewel 2", "nameEs": "Joya de maestría 2",
  "slotLevel": 2,
  "description": "...",
  "skills": [{ "name": "Master's Touch", "nameEs": "...", "level": 1, "effect": "...", "effectEs": "..." }],
  "materials": [{ "material": "Lazurite Jewel", "qty": 8 }]
}
```
`materials[].material` es el string que se cruza contra `materialIndex` (ver `HANDOFF_GUIDE.md` §2) para saber qué monstruo lo dropea.

## `weapons.json` — árbol de crafteo de armas

```jsonc
{
  "id": "184112174", "name": "Defender Great Sword I", "type": "Great Sword",
  "icon": "http://cdn.kiranico.net/.../184112174.webp",
  "attack": 110, "rarity": 1, "elements": [],
  "nameEs": "G. espada defensora I",
  "materials": [], "materialsSource": null,
  "nextId": "198360015", "prevId": null, "isFinal": true,
  "decoSlots": []
}
```
Es una lista plana; `nextId`/`prevId` arman la cadena de mejora dentro de un mismo `type`. `isFinal: true` = punta del árbol (las que participan en `buildMonsterEquipmentIndex()`, ver `HANDOFF_GUIDE.md` §2). No hay campo de "monstruo origen" — se infiere.

## `armor_pieces.json` — piezas individuales de armadura

```jsonc
{
  "id": "518775850", "name": "Kamura Head Scarf", "rarity": 1,
  "iconM": ".../518775850_m.webp", "iconF": ".../518775850_f.webp",
  "nameEs": "Bandana Kamura",
  "materials": [{ "material": "Iron Ore", "qty": 1 }],
  "defense": 1,
  "skills": [{ "name": "Divine Blessing", "level": 1 }],
  "part": "head",  // head | chest | arms | waist | legs
  "decoSlots": []
}
```
Lista plana de TODAS las piezas del juego (no agrupadas en sets). `buildImpliedArmorGroups()` en `app.js` las reagrupa de a 5 por prefijo de nombre compartido para reconstruir sets que `armor_sets.json` no tiene.

## `armor_sets.json` — sets matcheados contra Fextralife (solo 62/87)

```jsonc
{
  "name": "Kamura Legacy Set",
  "image": "https://monsterhunterrise.wiki.fextralife.com/file/.../kamura_legacy-male-set-...png",
  "fextraHref": "https://monsterhunterrise.wiki.fextralife.com/Kamura+Legacy+Set",
  "pieces": [{ "part": "head", "id": "2006843270", "name": "Kamura Legacy Head Scarf" }, /* ...hasta 5 */]
}
```
No cubre todos los sets — sets sin match acá (ej. Tempest de Amatsu) solo existen vía `buildImpliedArmorGroups()` sobre `armor_pieces.json`, y no tienen `image` real (fallback a ícono de pieza suelta).

## `skills.json` — 147 habilidades de armadura (scrapeado de MHRice)

```jsonc
{
  "id": "PlayerSkill_208",
  "name": "Adrenaline Rush", "nameEs": "Subida de adrenalina",
  "descEn": "...", "descEs": "...",
  "levels": [{ "level": 1, "effectEn": "...", "effectEs": "..." }, /* hasta 7 niveles */],
  "colorIndex": 4  // índice en la paleta MH_ITEM_COLOR de app.js (rareza del ícono)
}
```
Todas comparten el mismo par de máscaras de ícono (`skill.r.png`/`skill.a.png`); solo cambia `colorIndex`. Ver `HANDOFF_GUIDE.md` §2-3.

## `material_mhrice_icons.json` / `decoration_mhrice_icons.json` — mapa de íconos reales

```jsonc
// {"NombreExactoDelMaterialOAdorno": {"iconId": "031", "color": 1}}
{ "Aknosom Scale": { "iconId": "031", "color": 1 }, "Flame Sac": { "iconId": "043", "color": 7 } }
```
Clave = nombre EN exacto (match directo contra `monsters.json`/`decorations.json`, sin fuzzy matching). `iconId` apunta a `data/images/item_masks/{iconId}.r.png` / `.a.png`. `color` es índice en `MH_ITEM_COLOR` (app.js). Solo **27 pares de máscaras únicos** cubren los ~1074 materiales+decoraciones matcheados — el juego reusa formas, diferencia por color. Materiales sin match (7 de 838) caen a `material_icon_manifest.json` (sistema viejo, `<img>` plano) como fallback automático.

## `i18n.js` — TODOS los strings de UI (no JSON, es un archivo JS con `const I18N = {...}`)

```jsonc
I18N.ui.es / I18N.ui.en   // strings fijos de la interfaz (botones, headers, placeholders)
// valores pueden ser string o función: (arg) => `texto con ${arg}`
```
Antes de hardcodear un string nuevo en `app.js`, agregarlo acá primero (ES y EN) y llamarlo vía `ui("clave")`.

## Otros JSON de soporte (no hace falta memorizar el shape, son internos de un solo script)

- `material_icon_manifest.json`, `status_icon_manifest.json`, `icon_manifest.json` — manifiestos del sistema de íconos VIEJO (pre-MHRice), siguen usándose como fallback.
- `_mhrice_items_raw.json` — dump crudo de los 1764 ítems de MHRice, guardado como referencia para trabajo futuro (ej. íconos de armas), no consumido por `app.js`.
- `grindosaur_raw.json`, `grindosaur_quickfacts.json`, `kiranico_item_translations.json` — outputs intermedios de scraping, ya fusionados en `monsters.json`/traducciones, no se leen en runtime.
- `monster_list.json` — listado maestro de 78 monstruos + URL Fextralife, usado solo por scrapers, no por la app.
