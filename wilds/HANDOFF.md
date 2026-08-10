# Wilds — Handoff para el otro bot

**Proyecto:** `C:\Users\MP\Documents\00 Claude\mhrise-bestiario\wilds\`  
**Servir:** `npx serve .` desde `mhrise-bestiario/`, abrir `http://localhost:3000/wilds/`  
**Hub:** `C:\Users\MP\Documents\00 Claude\mhrise-bestiario\index.html` (falta agregar la card de Wilds)

---

## 1. Lo que YA está completo (70%)

### `data/monsters.json` — 55 monstruos, formato Rise ✅
Todos los campos que tiene `rise/data/monsters.json`:
- `name`, `species`, `image`, `locations[]`
- `weaknesses[]` → `{element, stars}` (derivado de hitzones)
- `resistances[]` → `{element, immune: true}`
- `ailmentSusceptibility[]` → `{ailment, stars, buildup: [{label, value, max}]}`
- `inflicts` → `{elements: [], ailments: []}`
- `attackElements[]`, `hitzones[]` (con `wounds: 0/1` para tenderized)
- `materials` → `{ "High Rank": [{material, rarity, targetReward, capture, breakParts, carves, dropped}] }`
- `partBreaks[]`, `isSmall` (35 grandes, 20 pequeños)
- **Fuentes:** Kiranico (hitzones+mats+parts+ailments) + monsterhunterwiki.org API wikitext (image+locations+ailmentSusceptibility+inflicts+elements)

### `data/decorations.json` — 361 adornos ✅
- `{id, name, slotLevel, description, skills: [{name, level}], materials: []}`
- Skills parseados desde la descripción de Kiranico (173 multi-skill). Solo falta scrapear los materiales de crafteo (visitar cada página individual).
- Fuente: `mhwilds.kiranico.com/data/decorations`

### `data/skills.json` — 177 habilidades ✅
- `{id, name, descEn, levels: []}` — levels vacíos (Kiranico no los muestra en la lista; requieren scrape individual).
- Fuente: `mhwilds.kiranico.com/data/skills`

### `data/charms.json` — 185 talismanes ✅
- `{id, name, rarity: 0, skills: [], materials: [], decoSlots: []}` — arrays vacíos, scrape pendiente.
- Fuente: `mhwilds.kiranico.com/data/charms`

### `data/armor_sets.json` — 159 sets ✅
- `{name, image, derivedFrom, strongerElement, weakestElement, materials[], equipmentSkills[], setBonus[]}`
- **124/159 con las 5 piezas** (nombre, defensa, resistencias fire/water/thunder/ice/dragon)
- 12 sets sin piezas (eventos/DLC sin tabla en Fextralife)
- Fuente: `monsterhunterwilds.wiki.fextralife.com/Armor`

### `data/items_wilds.json` + `item_icon_manifest.json` + `images/items/` — 607 items + iconos ✅
- 607 iconos PNG descargados de Fextralife
- Manifest: `name → images/items/slug.png`
- Fuente: `monsterhunterwilds.wiki.fextralife.com/Items`

### `data/i18n_wilds.js` ✅
- Alias `const I18N = I18N_WILDS;` al final → las 21 referencias a `I18N.` en app.js resuelven sin cambios.
- Claves de UI para ES/EN.

### HTML + branding ✅
- 7 páginas (`index.html`, `monster.html`, `decorations.html`, `weapons.html`, `armor.html`, `materials.html`, `skills.html`) con:
  - `<title>Monster Hunter Wilds</title>`
  - Logo: `data/images/logo_mhwilds.png` (814KB, oficial)
  - Script: `data/i18n_wilds.js`
- `style.css` copiado de rise (1583 líneas, dark MH theme)

### `app.js` — copiado de rise, **pendiente de adaptar** ⚠️
- 155KB, ~3000 líneas, todas las funciones de Rise.
- Carga `data/i18n_wilds.js` y usa `I18N` (resuelve vía alias).
- **NO se adaptaron las funciones para Wilds.** La referencia completa está en `bestiario-nemo/wilds/app.js` (sesión anterior) que tiene todas las funciones Wilds andando.

---

## 2. Lo que FALTA (30%)

### 🔴 CRÍTICO — Adaptar `app.js`
- Cambiar los `fetch()` para que apunten a los JSON correctos (ya lo hacen, mismo nombre).
- Agregar las funciones Wilds: `initGlobalSearchWilds`, `initDecorationsWilds`, `initCharmsWilds`, `initWeaponsWilds`, `initArmorWilds`, `initSkillsWilds`, `render*Wilds`, `show*DetailWilds`, etc.
- Agregar `loadIconManifestWilds()`, `loadMaterialIconManifestWilds()`, boot `initWilds()`.
- **Referencia funcional:** `C:\Users\MP\Documents\00 Claude\bestiario-nemo\wilds\app.js` (ya tiene todo andando).
- Cambiar `data-page` en cada HTML si el app.js usa nombres distintos.

### 🔴 CRÍTICO — Iconos de monstruos (132 webp)
- Están en `C:\Users\MP\Documents\00 Claude\bestiario-nemo\exportv1\wilds\images\`
- Copiarlos a `wilds/images/` (o `wilds/data/images/` según cómo apunte `iconPathWilds`).
- El manifest `data/icon_manifest.json` (3KB) ya existe con 132 entradas → `images/slug.webp`.

### 🔴 CRÍTICO — Agregar card de Wilds al hub
- En `C:\Users\MP\Documents\00 Claude\mhrise-bestiario\index.html`, dentro de `<section class="hub-games">`, agregar:
```html
<a class="hub-card" href="wilds/">
  <img class="hub-card-logo" src="wilds/data/images/logo_mhwilds.png" alt="" />
  <div class="hub-card-body">
    <h3 class="hub-card-title">Monster Hunter Wilds</h3>
    <p class="hub-card-desc">Monstruos, debilidades, hitzones, materiales, decoraciones, armas, armaduras y habilidades.</p>
    <span class="hub-card-enter">Entrar →</span>
  </div>
</a>
```

### 🟡 Armas (`weapons.json`) — solo 87 de ~1000
- Se scrapearon 87 armas (árbol Great Sword) de `mhwilds.kiranico.com/data/weapons`.
- Faltan las otras 13 categorías. Kiranico tiene una página por tipo de arma.
- Cada arma tiene: `id, name, type, attack, rarity, element, slots, materials`.
- También falta `armor_pieces.json` (0 piezas) y `weapon_tree.json`.

### 🟡 `small_monsters.json` — vacío
- 20 monstruos pequeños están en `monsters.json` (con `isSmall: true`).
- Rise tiene un `small_monsters.json` separado con partes (`{part, carveItems[]}`).
- Se necesita scrapear las partes de monstruos pequeños.

### 🟡 Skills con niveles, decoraciones con materiales, charms con datos
- `skills.json`: falta scrapear los niveles de cada habilidad (visitar 177 páginas individuales en Kiranico).
- `decorations.json`: falta scrapear los materiales de crafteo (visitar 361 páginas individuales).
- `charms.json`: falta scrapear skills, materiales, rareza (visitar 185 páginas).

### 🟢 JSONs vacíos (no rompen, app.js los maneja con `res.ok`)
- `weapons.json` (87), `armor_pieces.json` (0), `weapon_tree.json` (0), `weapon_finals.json` (0)
- `material_icon_manifest.json` (0), `status_icon_manifest.json` (0)
- `kiranico_item_translations.json` (0), `material_obtain_notes.json` (0)
- `armor_fextra_icons.json` (0), `material_mhrice_icons.json` (0), `decoration_mhrice_icons.json` (0)
- `monster_list.json` (0), `renders_manifest.json` (0)

---

## 3. Scripts de scrape reutilizables (en `wilds/data/`)

| Script | Output |
|---|---|
| `scrape_wilds_monsters.js` | `monsters_raw/*.html` → parsea hitzones, materials, parts, ailments de Kiranico (reanudable) |
| `scrape_wilds_monster_wiki.js` | `monster_wiki_raw/*.html` → elements, inflicts, weaknesses de la wiki |
| `normalize_wilds_monsters.js` | Postprocesa isSmall, attackElements, weaknesses/resistances |
| `complete_monsters_v2.js` | API wikitext → image, locations, ailmentSusceptibility |
| `fix_materials.js` | Convierte materiales Kiranico → formato Rise |
| `scrape_decos_skills_charms.js` | Listas de Kiranico → decorations, skills, charms |
| `scrape_wilds_items.js` | Fextralife Items → items_wilds.json |
| `download_wilds_item_icons.js` | Descarga 607 iconos + manifest |
| `scrape_wilds_armor_sets.js` + `_detail.js` | Fextralife Armor → armor_sets.json (159 con imágenes + piezas) |
| `scrape_wilds_weapons.js` | Kiranico weapons → weapons.json (87) |

---

## 4. Orden recomendado para el otro bot

1. **Copiar los 132 iconos de monstruos** de `bestiario-nemo/exportv1/wilds/images/` a `wilds/images/`
2. **Adaptar `app.js`** usando `bestiario-nemo/wilds/app.js` como referencia (cambiar boot, funciones Wilds, data loading)
3. **Agregar la card de Wilds al hub** (`index.html` raíz)
4. **Probar:** `npx serve .` → abrir `http://localhost:3000/wilds/?m=Rathalos`
5. **Scrapear armas** (14 tipos desde Kiranico) y `armor_pieces.json`
6. **Scrapear small_monsters** con partes de carneo
7. **Completar skills/decorations/charms** (scrape individual por página)
