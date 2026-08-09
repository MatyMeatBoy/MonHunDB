# GuÃ­a de traspaso â€” Bestiario MH Rise/Sunbreak

Escrita para que otra IA (ej. DeepSeek, u otro asistente sin memoria de este proyecto) pueda
entender la web y, sobre todo, el generador de vectores de siluetas (la parte mÃ¡s compleja)
sin tener que redescubrir nada por prueba y error. No reemplaza a `CLAUDE.md`, `PROGRESS.md`,
`DATA_NOTES.md` ni `SOURCES.md` â€” es el punto de entrada que enlaza a todos ellos.

## 0. QuÃ© es este proyecto, en una frase

App web estÃ¡tica (HTML/CSS/JS plano, sin build, sin frameworks, sin backend) que muestra
info de los 78 monstruos grandes de Monster Hunter Rise + Sunbreak: zonas, debilidades,
resistencias, hitzones, materiales, y secciones enlazadas de Decoraciones, Armas, Armaduras,
Materiales y Habilidades. BilingÃ¼e ES/EN. **Estructura multi-pÃ¡gina por juego** (desde
2026-08-09): `index.html` en la raÃ­z es el hub de juegos, y cada juego vive en su propia
carpeta autocontenida (`rise/` hoy; `wilds/` copiarÃ­a la estructura despuÃ©s). Todo el dato
vive en archivos JSON dentro de `rise/data/`, cargados por `fetch()` en tiempo de ejecuciÃ³n
â€” por eso **no se puede abrir los HTML con doble-click**, hay que servirlo por HTTP:

```bash
npx serve .
```

Ojo: `serve` con cleanUrls redirige `.html` â†’ sin extensiÃ³n y **pierde el query string**,
por eso TODAS las URLs internas son sin extensiÃ³n (`rise/monster?m=X`, `rise/decorations?d=Y`,
etc.) y cada pÃ¡gina es un HTML real con links normales (nada de pushState ni router por hash).

## 1. Mapa de archivos (quÃ© tocar segÃºn lo que se pida)

```
mhrise-bestiario/
  index.html        hub de juegos (selector por card, link a rise/) â€” CSS propio en hub.css
  rise/             carpeta autocontenida de Monster Hunter Rise: Sunbreak
    index.html      home del bestiario (novedades + combobox de monstruos)
    monster         ficha de monstruo (template tpl-detail) â€” ?m=Nombre[&rank=Rank]
    decorations     ?d=ID       weapons   ?w=ID       armor   ?set=Nombre | ?piece=ID
    materials       ?mat=Key    skills    ?skill=ID
    app.js          TODA la lÃ³gica del juego (~3000 lÃ­neas, sin mÃ³dulos). Boot por
                    <body data-page="...">: cada pÃ¡gina corre solo su secciÃ³n (bootPage()).
    style.css       tema oscuro estilo MH (~1500 lÃ­neas)
    data/           datasets + scrapers + docs internos del juego (monsters.json,
                    decorations.json, weapons.json, armor_pieces.json, armor_sets.json,
                    skills.json, material_mhrice_icons.json / decoration_mhrice_icons.json,
                    i18n.js, scrape_*.js, trace_silhouette.py, MONSTER_ANATOMY.md,
                    SILHOUETTE_GUIDE.md, images/, batches/, weapon_tree_raw*/)
  vectores/
    <monstruo>.png              imÃ¡genes de referencia (silueta de colores planos) que el usuario deja para trazar
    mhrice/                     clon de github.com/wwylele/mhrice (data-miner del juego), gitignored, solo referencia local
  .claude/skills/monster-vector-anatomy/   skill que se autoinvoca antes de trazar una silueta nueva (repite la regla de la secciÃ³n 3)
  PROGRESS.md        historial cronolÃ³gico de features, con fecha, en orden de mÃ¡s reciente arriba
  DATA_NOTES.md       casos ambiguos/dudosos encontrados en la recolecciÃ³n de datos, a revisar
  SOURCES.md           quÃ© sitio se usÃ³ para quÃ© dato, y por quÃ© (incluye fuentes descartadas y por quÃ©)
  CLAUDE.md             instrucciones cortas: usar graphify (ver secciÃ³n 5) para preguntas de arquitectura del cÃ³digo
```

## 2. CÃ³mo estÃ¡ armado `rise/app.js`

No hay build step ni mÃ³dulos â€” es un solo archivo por juego cargado como `<script src="app.js" defer>`.
Cada secciÃ³n navegable (Decoraciones, Armas, Armaduras, Materiales, Habilidades) es una **pÃ¡gina HTML
real** con: toolbar (link volver + buscador) + `#X-index` (grid de tarjetas) + `#X-detail` (panel de
detalle). El boot (`init()` â†’ `bootPage()` en `app.js`) lee `document.body.dataset.page` y el query
string, y renderiza lista o detalle sin conmutar vistas.

- **Links reales, no pushState**: todos los "navegar a otra secciÃ³n" son `location.href` vÃ­a helpers
  `navMonster()/navMaterial()/navDecoration()/navWeapon()/navArmorSet()/navArmorPiece()/navSkill()`
  (URLs sin extensiÃ³n). No existe la regla de exclusiÃ³n mutua de antes (cada pÃ¡gina tiene una sola vista).
- **NavegaciÃ³n cruzada**: el combobox va a `monster?m=X`; los materiales/equipo/sources del buscador
  global y de los detalles van a la URL de su secciÃ³n. El `?rank=` en monster setea la pestaÃ±a de rango.
- **Idioma**: el toggle escribe `localStorage` y hace `location.reload()` â€” no hay re-render por vista.
- **Botones "volver"**: toolbar â†’ `index.html` (home del juego); dentro de un detalle â†’ la lista de la
  misma secciÃ³n (`decorations`, `weapons`, ...). El brand del topbar â†’ hub (`../index.html`).
- Los nombres de material/decoraciÃ³n/habilidad son `<button data-*>` clickeables en todos lados (tabla
  de materiales, buscador global, detalle de adorno/arma/armadura) que navegan a la pÃ¡gina de detalle
  correspondiente â€” el patrÃ³n siempre es: guardar el nombre en un `data-*` attr (con `escapeAttr()`
  porque hay apÃ³strofes), y wiring con `querySelectorAll("[data-*]").forEach(...)` justo despuÃ©s de
  setear el `innerHTML`.
- **Ãconos por mÃ¡scara CSS de 2 capas**: material/decoraciÃ³n/habilidad usan el mismo truco visual que
  el sitio fuente (MHRice): dos `<span>` superpuestos vÃ­a CSS grid, cada uno con `mask-image`
  apuntando a un PNG en blanco/negro (`.r.png` = capa coloreada por CSS `background-color`, `.a.png` =
  capa negra fija atrÃ¡s). El color sale de una paleta fija por Ã­ndice (`MH_ITEM_COLOR`, ~20 colores)
  segÃºn rareza. Ver `itemMaskIconTag()` / `skillIconTag()` en `app.js`.
- **Inferencia monstruoâ†”equipo**: ni `weapons.json` ni `armor_pieces.json` dicen de quÃ© monstruo sale
  un arma/set (el nombre es temÃ¡tico, ej. "Tempest Set" para Amatsu). Se infiere tallando quÃ© monstruo
  aparece mÃ¡s en la lista de materiales de crafteo de esa arma/set (`materialIndex`), exigiendo
  dominancia clara antes de asociar (ver `buildMonsterEquipmentIndex()`).

**Para agregar un juego nuevo (ej. Wilds)**: copiar la carpeta `rise/` â†’ `wilds/`, reemplazar los
JSON de `wilds/data/` por los del juego nuevo, ajustar `data-page`/tÃ­tulos/links si hace falta, y
agregar una card en el hub (`index.html` raÃ­z). No comparten nada con Rise â€” no se ven entre ellos.

Antes de hacer cambios de arquitectura o buscar "dÃ³nde estÃ¡ X", correr graphify (secciÃ³n 5) en vez de leer `app.js` entero.

## 3. El generador de vectores de siluetas (la parte mÃ¡s compleja)

Esto dibuja el hitzone interactivo (mapa de color por parte del cuerpo, con tooltip al pasar el mouse) que aparece en la ficha de cada monstruo, usando `HITZONE_SHAPES` en `app.js` (~lÃ­nea 2192).

**DocumentaciÃ³n completa y ya resuelta**: [`rise/data/SILHOUETTE_GUIDE.md`](rise/data/SILHOUETTE_GUIDE.md) â€” leer ese archivo entero antes de tocar esto, es una checklist corta a propÃ³sito. Resumen:

### 3.1 Pipeline tÃ©cnico (mecÃ¡nico, ya funciona, no hace falta rediseÃ±arlo)

1. El usuario deja una imagen en `vectores/<monstruo>.png`: silueta de colores planos (sin degradÃ©), regiones separadas por lÃ­neas blancas o transparentes.
2. `python rise/data/trace_silhouette.py <imagen> <salida.json>`:
   - Usa `cv2.connectedComponents` para separar regiones por color+contigÃ¼idad (blanco/transparente = fondo/separador).
   - Dilata cada regiÃ³n (`cv2.distanceTransform`, radio fraccionario, default `1.86px`; regiones grandes como la cabeza/cresta usan `5.0px` vÃ­a `DILATE_RADIUS_LARGE` â€” **subir el radio grande solo para la regiÃ³n especÃ­fica, nunca el global**, porque un radio global alto deforma regiones chicas como patas y las fusiona) para que regiones vecinas se toquen un poco y no quede una costura sin tooltip.
   - `cv2.findContours` + `cv2.approxPolyDP` para vectorizar cada regiÃ³n dilatada.
   - Salida: JSON con `{viewBox, regions: [{color, area, bbox, points}]}`, ordenado arribaâ†’abajo, izquierdaâ†’derecha. El `color` es el promedio del PNG original â€” **solo sirve para ubicar la regiÃ³n a simple vista en el JSON, no se usa para pintar** (el pintado real en pantalla es por valor de stat, vÃ­a `tierColorsByPart()`).
3. Un humano (o la IA con el usuario) pega cada regiÃ³n a mano en `HITZONE_SHAPES[<Monstruo>].parts.<Parte>` en `app.js`. Una parte puede tener mÃ¡s de un shape (array de strings de puntos) si el arte la dibuja en pedazos separados.

### 3.2 La parte difÃ­cil: identificar quÃ© regiÃ³n es quÃ© parte del cuerpo

**El trazado nunca fallÃ³. Todos los errores reales fueron asumir la identidad anatÃ³mica de una regiÃ³n por su posiciÃ³n/tamaÃ±o/forma en el bounding box.** Con Rathalos esto saliÃ³ mal repetidamente: la regiÃ³n roja grande y llamativa arriba parecÃ­a "Cabeza" pero era el Ala; la franja angosta pegada parecÃ­a "Cuello" pero era la Espalda; una forma doblada abajo-izquierda parecÃ­a "Ala" por la forma de membrana pero era la Cola; una "llama" en la punta parecÃ­a decoraciÃ³n cosmÃ©tica pero era parte de la Cabeza (aliento de fuego).

**Regla dura**: nunca asignar regiÃ³nâ†’parte por posiciÃ³n/forma sin confirmaciÃ³n. El mÃ©todo que sÃ­ funciona:

1. Proponer una primera asignaciÃ³n de buena fe (posiciÃ³n estÃ¡ bien como punto de partida) pero avisar que es provisoria.
2. Si el usuario corrige, aplicar el cambio directo, sin defender la asignaciÃ³n original.
3. Si el usuario da un color hex (sacado con un color-picker sobre el `<svg>` ya renderizado) en vez de describir la zona en palabras, buscarlo directo en los `fill` de `document.querySelectorAll('svg polygon[data-part]')` â€” es exacto, no depende de interpretar una captura de pantalla.
4. Ojo con partes que "duplican" el shape de otra por falta de regiÃ³n propia en el arte (ej. Espalda reusando el shape de Cuello) â€” si se reasigna la parte de la que dependen, la que duplica se mueve en cascada sin que nadie la haya tocado. Avisar esto proactivamente.
5. No asumir que una regiÃ³n "rara" es decorativa sin confirmar primero.

Antes de mapear un monstruo nuevo, leer su entrada en [`rise/data/MONSTER_ANATOMY.md`](rise/data/MONSTER_ANATOMY.md) (guÃ­a de anatomÃ­a de los 78 monstruos, escrita de memoria de la saga, NO verificada/scrapeada â€” es solo para saber quÃ© esperar: Â¿tiene alas separadas del cuerpo?, Â¿cola gruesa o lÃ¡tigo?, Â¿brazos o son parte del ala?). Si la imagen de referencia real contradice la guÃ­a, la imagen real siempre gana, y conviene actualizar la guÃ­a despuÃ©s para el prÃ³ximo monstruo.

Este flujo estÃ¡ automatizado como skill: `.claude/skills/monster-vector-anatomy/` se autoinvoca antes de trazar/mapear una silueta nueva y repite esta misma regla.

### 3.3 FusionZonal â€” fusionar 2+ shapes de una misma parte en un solo contorno

Cuando una parte queda con mÃ¡s de un polÃ­gono (por reasignaciÃ³n, split, o carve) y quedan pegados entre sÃ­, se ve una costura interna (cada `<polygon>` dibuja su propio `stroke`). El usuario llama a esta operaciÃ³n "FusionZonal". Hay dos tÃ©cnicas, **incompatibles entre sÃ­ â€” elegir la correcta segÃºn de dÃ³nde vienen los pedazos antes de tocar nada**:

1. **Pedazos que vienen de un split hecho a mano por la IA** (se cortÃ³ un polÃ­gono original en 2+ partes): la fusiÃ³n es gratis â€” simplemente volver a usar el polÃ­gono original sin cortar. Cero riesgo.
2. **Pedazos que vienen de regiones trazadas por separado** en el PNG (bordes no coinciden pixel a pixel, tÃ­picamente 2-8px de diferencia por la dilataciÃ³n independiente de cada trazado): concatenar los puntos a mano casi seguro produce un polÃ­gono invÃ¡lido (self-intersection). Hace falta uniÃ³n geomÃ©trica real con `shapely`:
   ```python
   pip install shapely
   # buffer chico (2.5px) fusiona bordes casi-coincidentes en la uniÃ³n,
   # simplify final solo saca ruido de punto flotante
   from shapely.geometry import Polygon
   from shapely.ops import unary_union
   a = Polygon(...).buffer(2.5, join_style=2)
   b = Polygon(...).buffer(2.5, join_style=2)
   merged = unary_union([a, b]).buffer(-2.5, join_style=2).simplify(0.75, preserve_topology=True)
   points = list(merged.exterior.coords)[:-1]  # formatear como "x,y x,y ..." redondeando a enteros
   ```
   No intentar hacerlo a mano (empalmar vÃ©rtices "casi iguales") â€” las formas reales tienen zonas cÃ³ncavas que producen self-intersection aunque a simple vista parezca simple.

### 3.4 Estado actual

Solo **Rathalos** tiene silueta completa y confirmada por el usuario (tabla de referencia completa en `SILHOUETTE_GUIDE.md`). El resto de los 78 monstruos no muestra esta secciÃ³n â€” `renderHitzoneSilhouette()` se sale en silencio si `HITZONE_SHAPES[monster.name]` no existe. Hay un vector de Barioth tambiÃ©n trabajado (`rise/data/barioth_traced.json`) â€” ver notas de anatomÃ­a de Barioth en `MONSTER_ANATOMY.md` para detalles de esa sesiÃ³n (patas delanteras muy separadas por el Ã¡ngulo del dibujo, pata trasera chica escondida entre ellas, panza asomando).

Fuente prometedora para el futuro, **aÃºn no usada**: `MHRise-Database` (`robomeche.github.io/MHRise-Database`, clon local en `vectores/MHRise-Database-main/`, gitignored) tiene grÃ¡ficos de zona por monstruo que, segÃºn su propio README, salen originalmente de MHRice (`wwylele/mhrice`) â€” un extractor de datos del juego, no un dibujo hecho a mano. Si se retoma el trabajo de siluetas, investigar esto primero: probablemente traiga el mapeo colorâ†”parte del cuerpo como dato estructurado real en vez de tener que inferirlo a mano.

## 3.5 Ãconos de armadura rotos y verificaciÃ³n de traducciones ES (patrÃ³n reutilizable)

Aparecieron dos problemas relacionados con `rise/data/armor_pieces.json` (1574 piezas) que valen la pena documentar como patrÃ³n, porque van a repetirse con otros datasets de equipo:

**Ãconos rotos (no son un problema de descarga, son un 404 real en la fuente):** `armorIconTag(p)` en `app.js` arma `<img src="data/images/armor/${p.id}_m.webp">` a partir de un mirror local descargado por `rise/data/download_equip_icons.js` desde `iconM`/`iconF` (URLs del CDN de Kiranico). El script es resumible (`fs.existsSync` salta lo que ya estÃ¡), asÃ­ que si un Ã­cono falta **no siempre es porque nunca se corriÃ³ el script** â€” hay que probar primero si la URL de origen responde:

```bash
curl -sIL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" "<iconM o iconF>" | grep -i "^HTTP"
```

Se confirmÃ³ asÃ­ que **233 de 1574 piezas dan 404 real en Kiranico** (no es que falte descargarlas, Kiranico nunca las renderizÃ³ â€” casos como equipo de Palamute/Buddy, piezas raras o layered). Para esos casos no hay mÃ¡s remedio que buscar una fuente alternativa (Fextralife, mismo patrÃ³n que ya se usa para renders de monstruos) y agregarla como **fallback de una segunda capa**, no como reemplazo â€” seguir el patrÃ³n ya establecido de `loadMaterialIconManifest()`/`loadMhriceIconMaps()` (manifiesto JSON chico, cargado en `init()`, chequeado antes de caer al placeholder en blanco). Nunca reemplazar la fuente primaria (Kiranico) solo porque una fuente secundaria tambiÃ©n sirve â€” mantener el orden de prioridad explÃ­cito en el cÃ³digo.

**Verificar traducciones ES de Kiranico (bypass del bloqueo a WebFetch):** `mhrise.kiranico.com` devuelve 403 a la tool `WebFetch` (ver `SOURCES.md`), pero responde 200 a un `curl` con User-Agent de navegador normal â€” mismo truco ya usado para `grindosaur.com`:

```bash
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" "https://mhrise.kiranico.com/es/data/armors/<id>" | grep -o '<title>[^<]*</title>'
```

Con esto se confirmÃ³ un caso concreto: `"Lambent Sash"` (EN) tiene `nameEs: "FajÃ­n Lambent"` (id `1620705253`) â€” "Lambent" quedÃ³ sin traducir. **No es un bug de este proyecto**: la propia web de Kiranico en espaÃ±ol muestra exactamente el mismo "FajÃ­n Lambent", asÃ­ que lo mÃ¡s probable es que sea el nombre oficial de la lÃ­nea de set (Capcom a veces deja adjetivos de nombre de set como sustantivo propio, igual que nunca traduce "Rathalos"). Antes de "corregir" una traducciÃ³n parcial que parezca rara, verificar contra Kiranico ES con este mÃ©todo â€” si Kiranico tambiÃ©n la deja igual, no tocarla.

## 3.6 CÃ³mo se manejan los dos idiomas en los datos (dos patrones distintos, no uno solo)

No hay un Ãºnico mecanismo de traducciÃ³n â€” conviven **dos patrones**, y hay que saber cuÃ¡l aplica a quÃ© dataset antes de tocar nombres/textos. Mezclarlos (ej. buscar `nameEs` en `monsters.json`, o esperar que `I18N.monsterNames` tenga una decoraciÃ³n) es un error fÃ¡cil de cometer.

**PatrÃ³n A â€” campos gemelos inline (`decorations.json`, `weapons.json`, `armor_pieces.json`, `skills.json`):** cada registro trae el texto en los dos idiomas directamente, como `name`/`nameEs`, `descEn`/`descEs`, `effect`/`effectEs`. No hay diccionario intermedio â€” el registro ES fue tipeado/scrapeado junto con el registro EN en el mismo paso de recolecciÃ³n (por eso viven en el mismo JSON). Para leer el nombre segÃºn el idioma activo se hace inline: `lang === "es" && x.nameEs ? x.nameEs : x.name` (ver `trDecorationName()`, `trArmorName()`, `trSkillName()` en `app.js`). Si falta la traducciÃ³n de un registro nuevo, se edita el JSON directamente.

**PatrÃ³n B â€” diccionario separado por categorÃ­a (`monsters.json`, y los campos sueltos que arman la ficha de monstruo):** el dataset principal (`monsters.json`) es **solo inglÃ©s** â€” no tiene `nameEs` ni ningÃºn campo `*Es`. La traducciÃ³n vive aparte, en `rise/data/i18n.js`, como diccionarios `{"Nombre EN": "Nombre ES"}` independientes por categorÃ­a: `I18N.monsterNames`, `I18N.species`, `I18N.locations`, `I18N.ailments`, `I18N.elements`, `I18N.ranks`, `I18N.bodyParts`, `I18N.buildupLabels`. Cada uno tiene su propia funciÃ³n `trX()` en `app.js` (`trMonsterName()`, `trSpecies()`, `trLocation()`, etc.) que hace `lang === "es" ? t(I18N.X, name) : name` â€” con `t()` siendo un lookup simple que devuelve la clave sin traducir si no la encuentra (fallback silencioso a inglÃ©s, nunca rompe). Este patrÃ³n se usa cuando el mismo string en inglÃ©s aparece repetido en muchos monstruos (ej. "Fire", "Poison", "Shrine Ruins") â€” tiene mÃ¡s sentido un diccionario compartido que repetir la traducciÃ³n en cada registro.

**Caso especial â€” materiales, un tercer diccionario aparte de los dos anteriores:** los nombres de material (usados dentro de `monsters.json`, `decorations.json`, `weapons.json`, `armor_pieces.json` como strings sueltos dentro de listas de `materials`) se traducen con `translateMaterial()`/`trMaterial()`, que buscan en `I18N.materials` â€” un diccionario de **816 entradas cargado en runtime** desde `rise/data/kiranico_item_translations.json` (no vive en `rise/data/i18n.js` como los demÃ¡s, es un archivo aparte por su tamaÃ±o). Antes de cualquier lookup de material pasa por `normalizeMaterialKey()` (`rise/data/i18n.js`), que ademÃ¡s de limpiar el formato ("Name +" â†’ "Name+") aplica una pequeÃ±a tabla de alias (`MATERIAL_NAME_ALIASES`) para nombres que difieren entre fuentes (ej. "Volvidon Carapace" vs "Volvi Carapace" â€” ver secciÃ³n 3.5 arriba para cÃ³mo se detectan estos casos). Cobertura ~97.5%, los materiales sin traducciÃ³n muestran el nombre en inglÃ©s como fallback (mismo comportamiento silencioso que el patrÃ³n B).

**Strings fijos de la interfaz** (botones, headers, placeholders, mensajes) son un cuarto caso, el mÃ¡s simple: `I18N.ui.es`/`I18N.ui.en` en `rise/data/i18n.js`, accedidos vÃ­a `ui("clave")` en `app.js`. Antes de hardcodear un string nuevo en el cÃ³digo, agregarlo acÃ¡ primero en los dos idiomas.

**Regla prÃ¡ctica al agregar una secciÃ³n nueva de datos:** si el registro se recolectÃ³/scrapeÃ³ de a uno (con su propio texto largo por idioma, como una descripciÃ³n), usar PatrÃ³n A (campos gemelos en el mismo JSON). Si es un tÃ©rmino corto que se repite en cientos de registros (un elemento, un rango, una parte del cuerpo), usar PatrÃ³n B (diccionario aparte en `i18n.js` + funciÃ³n `trX()`).

## 4. Convenciones e instrucciones permanentes del usuario

- **Nunca hacer `git push` sin confirmaciÃ³n explÃ­cita cada vez** ("quiero que subas push a github cuando te lo diga"). Commits sÃ­ se pueden hacer libremente con mensaje descriptivo.
- Cuando se reemplaza un sistema de assets (Ã­conos, etc.), **respaldar los archivos viejos en una carpeta `*_bkp01/` en vez de borrarlos**.
- Mantener `PROGRESS.md` (checklist/historial cronolÃ³gico) y `DATA_NOTES.md` (casos dudosos de datos) al dÃ­a despuÃ©s de cada feature nueva â€” es el hÃ¡bito establecido del proyecto, aunque a veces queda pendiente un archivo mientras el otro sÃ­ se actualiza.
- El dato de cada secciÃ³n nueva sigue el mismo patrÃ³n (Ã­ndice + detalle, ver secciÃ³n 2) â€” antes de inventar una estructura distinta, mirar cÃ³mo estÃ¡ hecho Decoraciones o Materiales como referencia.

## 5. Herramienta de anÃ¡lisis de arquitectura: graphify

Este proyecto tiene `graphify-out/` con un grafo de conocimiento del cÃ³digo (nodos, comunidades, relaciones entre archivos). Para preguntas de arquitectura o "dÃ³nde estÃ¡ X", **usar esto antes de grep/lectura manual**:

```bash
graphify query "<pregunta>"
graphify path "<A>" "<B>"      # relaciÃ³n entre dos sÃ­mbolos/archivos
graphify explain "<concepto>"  # contexto enfocado de un concepto
```

Si `graphify-out/wiki/index.md` existe, usarlo para navegaciÃ³n amplia en vez de recorrer el cÃ³digo fuente a mano. `graphify-out/GRAPH_REPORT.md` solo para revisiÃ³n de arquitectura muy amplia, o cuando query/path/explain no alcanzan. DespuÃ©s de modificar cÃ³digo: `graphify update .` (solo AST, sin costo de API) para mantener el grafo al dÃ­a.

## 6. Fuentes de datos usadas

Ver [`SOURCES.md`](SOURCES.md) para la lista completa (Fextralife para datos base de monstruos, Grindosaur para hitzones/physiology, Kiranico para traducciones ES, MHRice para Ã­conos reales + habilidades + su sistema de mÃ¡scaras de color, fandom.com para renders y taxonomÃ­a). Incluye fuentes descartadas y por quÃ© (Kiranico bloquea WebFetch con 403 en la vista de monstruos, etc.).

## 7. Otros archivos de contexto sugeridos para trabajar esto en otra herramienta (ej. DeepSeek)

Ver secciÃ³n siguiente / archivo separado `SESSION_SUMMARY_2026-08-08.md` para un resumen de la sesiÃ³n mÃ¡s reciente de trabajo (Ãºtil como contexto reciente, no como fuente de verdad â€” la fuente de verdad siempre es el cÃ³digo y `PROGRESS.md`).
