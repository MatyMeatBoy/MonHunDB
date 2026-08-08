# Guía de traspaso — Bestiario MH Rise/Sunbreak

Escrita para que otra IA (ej. DeepSeek, u otro asistente sin memoria de este proyecto) pueda
entender la web y, sobre todo, el generador de vectores de siluetas (la parte más compleja)
sin tener que redescubrir nada por prueba y error. No reemplaza a `CLAUDE.md`, `PROGRESS.md`,
`DATA_NOTES.md` ni `SOURCES.md` — es el punto de entrada que enlaza a todos ellos.

## 0. Qué es este proyecto, en una frase

App web estática (HTML/CSS/JS plano, sin build, sin frameworks, sin backend) que muestra
info de los 78 monstruos grandes de Monster Hunter Rise + Sunbreak: zonas, debilidades,
resistencias, hitzones, materiales, y secciones enlazadas de Decoraciones, Armas, Armaduras,
Materiales y Habilidades. Bilingüe ES/EN. Todo el dato vive en archivos JSON dentro de `data/`,
cargados por `fetch()` en tiempo de ejecución — por eso **no se puede abrir `index.html` con
doble-click**, hay que servirlo por HTTP:

```bash
npx serve .
```

## 1. Mapa de archivos (qué tocar según lo que se pida)

```
mhrise-bestiario/
  index.html        shell + templates (una <template> por tipo de ficha: monstruo, decoración, arma, armadura, material, habilidad)
  app.js             TODA la lógica (~2600 líneas, sin módulos, un solo archivo). Ver sección 2.
  style.css          tema oscuro estilo MH (~1400 líneas)
  data/
    monsters.json           dataset final de 78 monstruos (el "core" del proyecto)
    decorations.json        243 adornos
    weapons.json            armas por tipo
    armor_pieces.json        armor_sets.json    piezas/sets de armadura
    skills.json               147 habilidades (ES/EN, niveles, colorIndex)
    material_mhrice_icons.json / decoration_mhrice_icons.json   {nombre: {iconId, color}} para el sistema de íconos por máscara CSS
    i18n.js                   TODOS los strings de la UI en ES/EN (buscar acá antes de hardcodear texto nuevo)
    scrape_*.js                scrapers reutilizables (Node, uno por fuente/feature) — ver SOURCES.md
    trace_silhouette.py        generador de vectores de siluetas — ver sección 3, es la pieza más compleja
    MONSTER_ANATOMY.md          guía de anatomía de referencia (no verificada) para no adivinar mal al mapear siluetas
    SILHOUETTE_GUIDE.md          checklist/lecciones aprendidas del pipeline de siluetas — LEER ANTES de tocar HITZONE_SHAPES
    images/                     íconos y renders descargados, con carpetas *_bkp01/ de respaldo cuando se reemplazó un sistema de íconos
  vectores/
    <monstruo>.png              imágenes de referencia (silueta de colores planos) que el usuario deja para trazar
    mhrice/                     clon de github.com/wwylele/mhrice (data-miner del juego), gitignored, solo referencia local
  .claude/skills/monster-vector-anatomy/   skill que se autoinvoca antes de trazar una silueta nueva (repite la regla de la sección 3)
  PROGRESS.md        historial cronológico de features, con fecha, en orden de más reciente arriba
  DATA_NOTES.md       casos ambiguos/dudosos encontrados en la recolección de datos, a revisar
  SOURCES.md           qué sitio se usó para qué dato, y por qué (incluye fuentes descartadas y por qué)
  CLAUDE.md             instrucciones cortas: usar graphify (ver sección 5) para preguntas de arquitectura del código
```

## 2. Cómo está armado `app.js`

No hay build step ni módulos — es un solo archivo cargado como `<script src="app.js" defer>`.
Patrón repetido para cada sección navegable (Decoraciones, Armas, Armaduras, Materiales, Habilidades):

- Un `<main id="X-view" hidden>` en `index.html` con: toolbar (botón volver + buscador) + `#X-index` (grid de tarjetas) + `#X-detail` (panel de detalle).
- En `app.js`: `showXView()`, `hideXView()`, `renderXIndex(query)`, `showXDetail(id)`, `initX()`.
- **Regla de exclusión mutua**: cada `showXView()` tiene que ocultar (`hidden = true`) TODOS los demás contenedores de vista (home, detalle de monstruo, y las otras 5 secciones). Si se agrega una sección nueva, hay que volver a todas las `showXView()` existentes y agregarle la línea de ocultar la nueva — es fácil olvidarlo (pasó varias veces en este proyecto).
- **Redibujado al cambiar de idioma**: el listener de `langToggleEl` tiene que saber re-renderizar la vista que esté visible en ese momento (chequeando `!xViewEl.hidden`). Si se agrega una sección nueva sin agregar su bloque acá, cambiar ES/EN no actualiza esa sección hasta navegar afuera y volver.
- Los nombres de material/decoración/habilidad son `<button data-*>` clickeables en todos lados (tabla de materiales, buscador global, detalle de adorno/arma/armadura) que navegan a la página de detalle correspondiente — el patrón siempre es: guardar el nombre en un `data-*` attr (con `escapeAttr()` porque hay apóstrofes), y wiring con `querySelectorAll("[data-*]").forEach(...)` justo después de setear el `innerHTML`.
- **Íconos por máscara CSS de 2 capas**: material/decoración/habilidad usan el mismo truco visual que el sitio fuente (MHRice): dos `<span>` superpuestos vía CSS grid, cada uno con `mask-image` apuntando a un PNG en blanco/negro (`.r.png` = capa coloreada por CSS `background-color`, `.a.png` = capa negra fija atrás). El color sale de una paleta fija por índice (`MH_ITEM_COLOR`, ~20 colores) según rareza. Ver `itemMaskIconTag()` / `skillIconTag()` en `app.js`.
- **Inferencia monstruo↔equipo**: ni `weapons.json` ni `armor_pieces.json` dicen de qué monstruo sale un arma/set (el nombre es temático, ej. "Tempest Set" para Amatsu). Se infiere tallando qué monstruo aparece más en la lista de materiales de crafteo de esa arma/set (`materialIndex`), exigiendo dominancia clara antes de asociar (ver `buildMonsterEquipmentIndex()`).

Antes de hacer cambios de arquitectura o buscar "dónde está X", correr graphify (sección 5) en vez de leer `app.js` entero.

## 3. El generador de vectores de siluetas (la parte más compleja)

Esto dibuja el hitzone interactivo (mapa de color por parte del cuerpo, con tooltip al pasar el mouse) que aparece en la ficha de cada monstruo, usando `HITZONE_SHAPES` en `app.js` (~línea 2192).

**Documentación completa y ya resuelta**: [`data/SILHOUETTE_GUIDE.md`](data/SILHOUETTE_GUIDE.md) — leer ese archivo entero antes de tocar esto, es una checklist corta a propósito. Resumen:

### 3.1 Pipeline técnico (mecánico, ya funciona, no hace falta rediseñarlo)

1. El usuario deja una imagen en `vectores/<monstruo>.png`: silueta de colores planos (sin degradé), regiones separadas por líneas blancas o transparentes.
2. `python data/trace_silhouette.py <imagen> <salida.json>`:
   - Usa `cv2.connectedComponents` para separar regiones por color+contigüidad (blanco/transparente = fondo/separador).
   - Dilata cada región (`cv2.distanceTransform`, radio fraccionario, default `1.86px`; regiones grandes como la cabeza/cresta usan `5.0px` vía `DILATE_RADIUS_LARGE` — **subir el radio grande solo para la región específica, nunca el global**, porque un radio global alto deforma regiones chicas como patas y las fusiona) para que regiones vecinas se toquen un poco y no quede una costura sin tooltip.
   - `cv2.findContours` + `cv2.approxPolyDP` para vectorizar cada región dilatada.
   - Salida: JSON con `{viewBox, regions: [{color, area, bbox, points}]}`, ordenado arriba→abajo, izquierda→derecha. El `color` es el promedio del PNG original — **solo sirve para ubicar la región a simple vista en el JSON, no se usa para pintar** (el pintado real en pantalla es por valor de stat, vía `tierColorsByPart()`).
3. Un humano (o la IA con el usuario) pega cada región a mano en `HITZONE_SHAPES[<Monstruo>].parts.<Parte>` en `app.js`. Una parte puede tener más de un shape (array de strings de puntos) si el arte la dibuja en pedazos separados.

### 3.2 La parte difícil: identificar qué región es qué parte del cuerpo

**El trazado nunca falló. Todos los errores reales fueron asumir la identidad anatómica de una región por su posición/tamaño/forma en el bounding box.** Con Rathalos esto salió mal repetidamente: la región roja grande y llamativa arriba parecía "Cabeza" pero era el Ala; la franja angosta pegada parecía "Cuello" pero era la Espalda; una forma doblada abajo-izquierda parecía "Ala" por la forma de membrana pero era la Cola; una "llama" en la punta parecía decoración cosmética pero era parte de la Cabeza (aliento de fuego).

**Regla dura**: nunca asignar región→parte por posición/forma sin confirmación. El método que sí funciona:

1. Proponer una primera asignación de buena fe (posición está bien como punto de partida) pero avisar que es provisoria.
2. Si el usuario corrige, aplicar el cambio directo, sin defender la asignación original.
3. Si el usuario da un color hex (sacado con un color-picker sobre el `<svg>` ya renderizado) en vez de describir la zona en palabras, buscarlo directo en los `fill` de `document.querySelectorAll('svg polygon[data-part]')` — es exacto, no depende de interpretar una captura de pantalla.
4. Ojo con partes que "duplican" el shape de otra por falta de región propia en el arte (ej. Espalda reusando el shape de Cuello) — si se reasigna la parte de la que dependen, la que duplica se mueve en cascada sin que nadie la haya tocado. Avisar esto proactivamente.
5. No asumir que una región "rara" es decorativa sin confirmar primero.

Antes de mapear un monstruo nuevo, leer su entrada en [`data/MONSTER_ANATOMY.md`](data/MONSTER_ANATOMY.md) (guía de anatomía de los 78 monstruos, escrita de memoria de la saga, NO verificada/scrapeada — es solo para saber qué esperar: ¿tiene alas separadas del cuerpo?, ¿cola gruesa o látigo?, ¿brazos o son parte del ala?). Si la imagen de referencia real contradice la guía, la imagen real siempre gana, y conviene actualizar la guía después para el próximo monstruo.

Este flujo está automatizado como skill: `.claude/skills/monster-vector-anatomy/` se autoinvoca antes de trazar/mapear una silueta nueva y repite esta misma regla.

### 3.3 FusionZonal — fusionar 2+ shapes de una misma parte en un solo contorno

Cuando una parte queda con más de un polígono (por reasignación, split, o carve) y quedan pegados entre sí, se ve una costura interna (cada `<polygon>` dibuja su propio `stroke`). El usuario llama a esta operación "FusionZonal". Hay dos técnicas, **incompatibles entre sí — elegir la correcta según de dónde vienen los pedazos antes de tocar nada**:

1. **Pedazos que vienen de un split hecho a mano por la IA** (se cortó un polígono original en 2+ partes): la fusión es gratis — simplemente volver a usar el polígono original sin cortar. Cero riesgo.
2. **Pedazos que vienen de regiones trazadas por separado** en el PNG (bordes no coinciden pixel a pixel, típicamente 2-8px de diferencia por la dilatación independiente de cada trazado): concatenar los puntos a mano casi seguro produce un polígono inválido (self-intersection). Hace falta unión geométrica real con `shapely`:
   ```python
   pip install shapely
   # buffer chico (2.5px) fusiona bordes casi-coincidentes en la unión,
   # simplify final solo saca ruido de punto flotante
   from shapely.geometry import Polygon
   from shapely.ops import unary_union
   a = Polygon(...).buffer(2.5, join_style=2)
   b = Polygon(...).buffer(2.5, join_style=2)
   merged = unary_union([a, b]).buffer(-2.5, join_style=2).simplify(0.75, preserve_topology=True)
   points = list(merged.exterior.coords)[:-1]  # formatear como "x,y x,y ..." redondeando a enteros
   ```
   No intentar hacerlo a mano (empalmar vértices "casi iguales") — las formas reales tienen zonas cóncavas que producen self-intersection aunque a simple vista parezca simple.

### 3.4 Estado actual

Solo **Rathalos** tiene silueta completa y confirmada por el usuario (tabla de referencia completa en `SILHOUETTE_GUIDE.md`). El resto de los 78 monstruos no muestra esta sección — `renderHitzoneSilhouette()` se sale en silencio si `HITZONE_SHAPES[monster.name]` no existe. Hay un vector de Barioth también trabajado (`data/barioth_traced.json`) — ver notas de anatomía de Barioth en `MONSTER_ANATOMY.md` para detalles de esa sesión (patas delanteras muy separadas por el ángulo del dibujo, pata trasera chica escondida entre ellas, panza asomando).

Fuente prometedora para el futuro, **aún no usada**: `MHRise-Database` (`robomeche.github.io/MHRise-Database`, clon local en `vectores/MHRise-Database-main/`, gitignored) tiene gráficos de zona por monstruo que, según su propio README, salen originalmente de MHRice (`wwylele/mhrice`) — un extractor de datos del juego, no un dibujo hecho a mano. Si se retoma el trabajo de siluetas, investigar esto primero: probablemente traiga el mapeo color↔parte del cuerpo como dato estructurado real en vez de tener que inferirlo a mano.

## 3.5 Íconos de armadura rotos y verificación de traducciones ES (patrón reutilizable)

Aparecieron dos problemas relacionados con `data/armor_pieces.json` (1574 piezas) que valen la pena documentar como patrón, porque van a repetirse con otros datasets de equipo:

**Íconos rotos (no son un problema de descarga, son un 404 real en la fuente):** `armorIconTag(p)` en `app.js` arma `<img src="data/images/armor/${p.id}_m.webp">` a partir de un mirror local descargado por `data/download_equip_icons.js` desde `iconM`/`iconF` (URLs del CDN de Kiranico). El script es resumible (`fs.existsSync` salta lo que ya está), así que si un ícono falta **no siempre es porque nunca se corrió el script** — hay que probar primero si la URL de origen responde:

```bash
curl -sIL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" "<iconM o iconF>" | grep -i "^HTTP"
```

Se confirmó así que **233 de 1574 piezas dan 404 real en Kiranico** (no es que falte descargarlas, Kiranico nunca las renderizó — casos como equipo de Palamute/Buddy, piezas raras o layered). Para esos casos no hay más remedio que buscar una fuente alternativa (Fextralife, mismo patrón que ya se usa para renders de monstruos) y agregarla como **fallback de una segunda capa**, no como reemplazo — seguir el patrón ya establecido de `loadMaterialIconManifest()`/`loadMhriceIconMaps()` (manifiesto JSON chico, cargado en `init()`, chequeado antes de caer al placeholder en blanco). Nunca reemplazar la fuente primaria (Kiranico) solo porque una fuente secundaria también sirve — mantener el orden de prioridad explícito en el código.

**Verificar traducciones ES de Kiranico (bypass del bloqueo a WebFetch):** `mhrise.kiranico.com` devuelve 403 a la tool `WebFetch` (ver `SOURCES.md`), pero responde 200 a un `curl` con User-Agent de navegador normal — mismo truco ya usado para `grindosaur.com`:

```bash
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" "https://mhrise.kiranico.com/es/data/armors/<id>" | grep -o '<title>[^<]*</title>'
```

Con esto se confirmó un caso concreto: `"Lambent Sash"` (EN) tiene `nameEs: "Fajín Lambent"` (id `1620705253`) — "Lambent" quedó sin traducir. **No es un bug de este proyecto**: la propia web de Kiranico en español muestra exactamente el mismo "Fajín Lambent", así que lo más probable es que sea el nombre oficial de la línea de set (Capcom a veces deja adjetivos de nombre de set como sustantivo propio, igual que nunca traduce "Rathalos"). Antes de "corregir" una traducción parcial que parezca rara, verificar contra Kiranico ES con este método — si Kiranico también la deja igual, no tocarla.

## 3.6 Cómo se manejan los dos idiomas en los datos (dos patrones distintos, no uno solo)

No hay un único mecanismo de traducción — conviven **dos patrones**, y hay que saber cuál aplica a qué dataset antes de tocar nombres/textos. Mezclarlos (ej. buscar `nameEs` en `monsters.json`, o esperar que `I18N.monsterNames` tenga una decoración) es un error fácil de cometer.

**Patrón A — campos gemelos inline (`decorations.json`, `weapons.json`, `armor_pieces.json`, `skills.json`):** cada registro trae el texto en los dos idiomas directamente, como `name`/`nameEs`, `descEn`/`descEs`, `effect`/`effectEs`. No hay diccionario intermedio — el registro ES fue tipeado/scrapeado junto con el registro EN en el mismo paso de recolección (por eso viven en el mismo JSON). Para leer el nombre según el idioma activo se hace inline: `lang === "es" && x.nameEs ? x.nameEs : x.name` (ver `trDecorationName()`, `trArmorName()`, `trSkillName()` en `app.js`). Si falta la traducción de un registro nuevo, se edita el JSON directamente.

**Patrón B — diccionario separado por categoría (`monsters.json`, y los campos sueltos que arman la ficha de monstruo):** el dataset principal (`monsters.json`) es **solo inglés** — no tiene `nameEs` ni ningún campo `*Es`. La traducción vive aparte, en `data/i18n.js`, como diccionarios `{"Nombre EN": "Nombre ES"}` independientes por categoría: `I18N.monsterNames`, `I18N.species`, `I18N.locations`, `I18N.ailments`, `I18N.elements`, `I18N.ranks`, `I18N.bodyParts`, `I18N.buildupLabels`. Cada uno tiene su propia función `trX()` en `app.js` (`trMonsterName()`, `trSpecies()`, `trLocation()`, etc.) que hace `lang === "es" ? t(I18N.X, name) : name` — con `t()` siendo un lookup simple que devuelve la clave sin traducir si no la encuentra (fallback silencioso a inglés, nunca rompe). Este patrón se usa cuando el mismo string en inglés aparece repetido en muchos monstruos (ej. "Fire", "Poison", "Shrine Ruins") — tiene más sentido un diccionario compartido que repetir la traducción en cada registro.

**Caso especial — materiales, un tercer diccionario aparte de los dos anteriores:** los nombres de material (usados dentro de `monsters.json`, `decorations.json`, `weapons.json`, `armor_pieces.json` como strings sueltos dentro de listas de `materials`) se traducen con `translateMaterial()`/`trMaterial()`, que buscan en `I18N.materials` — un diccionario de **816 entradas cargado en runtime** desde `data/kiranico_item_translations.json` (no vive en `data/i18n.js` como los demás, es un archivo aparte por su tamaño). Antes de cualquier lookup de material pasa por `normalizeMaterialKey()` (`data/i18n.js`), que además de limpiar el formato ("Name +" → "Name+") aplica una pequeña tabla de alias (`MATERIAL_NAME_ALIASES`) para nombres que difieren entre fuentes (ej. "Volvidon Carapace" vs "Volvi Carapace" — ver sección 3.5 arriba para cómo se detectan estos casos). Cobertura ~97.5%, los materiales sin traducción muestran el nombre en inglés como fallback (mismo comportamiento silencioso que el patrón B).

**Strings fijos de la interfaz** (botones, headers, placeholders, mensajes) son un cuarto caso, el más simple: `I18N.ui.es`/`I18N.ui.en` en `data/i18n.js`, accedidos vía `ui("clave")` en `app.js`. Antes de hardcodear un string nuevo en el código, agregarlo acá primero en los dos idiomas.

**Regla práctica al agregar una sección nueva de datos:** si el registro se recolectó/scrapeó de a uno (con su propio texto largo por idioma, como una descripción), usar Patrón A (campos gemelos en el mismo JSON). Si es un término corto que se repite en cientos de registros (un elemento, un rango, una parte del cuerpo), usar Patrón B (diccionario aparte en `i18n.js` + función `trX()`).

## 4. Convenciones e instrucciones permanentes del usuario

- **Nunca hacer `git push` sin confirmación explícita cada vez** ("quiero que subas push a github cuando te lo diga"). Commits sí se pueden hacer libremente con mensaje descriptivo.
- Cuando se reemplaza un sistema de assets (íconos, etc.), **respaldar los archivos viejos en una carpeta `*_bkp01/` en vez de borrarlos**.
- Mantener `PROGRESS.md` (checklist/historial cronológico) y `DATA_NOTES.md` (casos dudosos de datos) al día después de cada feature nueva — es el hábito establecido del proyecto, aunque a veces queda pendiente un archivo mientras el otro sí se actualiza.
- El dato de cada sección nueva sigue el mismo patrón (índice + detalle, ver sección 2) — antes de inventar una estructura distinta, mirar cómo está hecho Decoraciones o Materiales como referencia.

## 5. Herramienta de análisis de arquitectura: graphify

Este proyecto tiene `graphify-out/` con un grafo de conocimiento del código (nodos, comunidades, relaciones entre archivos). Para preguntas de arquitectura o "dónde está X", **usar esto antes de grep/lectura manual**:

```bash
graphify query "<pregunta>"
graphify path "<A>" "<B>"      # relación entre dos símbolos/archivos
graphify explain "<concepto>"  # contexto enfocado de un concepto
```

Si `graphify-out/wiki/index.md` existe, usarlo para navegación amplia en vez de recorrer el código fuente a mano. `graphify-out/GRAPH_REPORT.md` solo para revisión de arquitectura muy amplia, o cuando query/path/explain no alcanzan. Después de modificar código: `graphify update .` (solo AST, sin costo de API) para mantener el grafo al día.

## 6. Fuentes de datos usadas

Ver [`SOURCES.md`](SOURCES.md) para la lista completa (Fextralife para datos base de monstruos, Grindosaur para hitzones/physiology, Kiranico para traducciones ES, MHRice para íconos reales + habilidades + su sistema de máscaras de color, fandom.com para renders y taxonomía). Incluye fuentes descartadas y por qué (Kiranico bloquea WebFetch con 403 en la vista de monstruos, etc.).

## 7. Otros archivos de contexto sugeridos para trabajar esto en otra herramienta (ej. DeepSeek)

Ver sección siguiente / archivo separado `SESSION_SUMMARY_2026-08-08.md` para un resumen de la sesión más reciente de trabajo (útil como contexto reciente, no como fuente de verdad — la fuente de verdad siempre es el código y `PROGRESS.md`).
