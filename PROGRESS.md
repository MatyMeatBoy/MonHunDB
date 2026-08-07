# Progreso del proyecto

Última actualización: 2026-08-07

## Resumen rápido para retomar (si se corta el contexto)

Proyecto: `mhrise-bestiario/` — bestiario web ES/EN de MH Rise/Sunbreak, 78 monstruos, 100% funcional. Todo lo scrapeado está en `data/` (JSONs + scripts `.js` reutilizables), documentado abajo y en `DATA_NOTES.md`. **Nada se perdió, todo commiteado a disco** (más `backups/selector01/` y `mhrise-bestiario_savepoint01/02` como snapshots).

**Feature de silueta de hitzones (Rathalos + Corte, ver sección propia abajo): CERRADA.** El bug del hueco/tooltip se resolvió identificando que la asignación región→parte estaba mal (no era un problema de trazado/dilatación) — ver sección "Silueta de hitzones" más abajo para el detalle y la lección aprendida (documentada también en `data/SILHOUETTE_GUIDE.md`).

**Feature nueva y completa: Decoraciones/Adornos** (ver sección propia abajo) — 243 decoraciones con habilidad + materiales, sección propia en el header, integradas al buscador global, y cada material del detalle muestra qué monstruo lo dropea con link directo.

- El skill `/checkpoint` que se creó en `.claude/skills/checkpoint/` **no se puede invocar con la herramienta Skill** porque colisiona con un comando nativo del mismo nombre — para sincronizar este archivo hay que seguir sus instrucciones a mano (leerlas del SKILL.md) en vez de invocarlo.

## Funcionalidades completas (además de lo ya listado abajo)

- **Selector custom con íconos** (`backups/selector01/` tiene el `<select>` nativo viejo de respaldo): combobox propio con buscador, agrupa variantes con guion indentado bajo el monstruo base (sin encabezado de categoría, a pedido del usuario tras iterar el diseño).
- **Búsqueda global** (botón lupa en el header): busca monstruos Y materiales a la vez, insensible a tildes (`normalizeSearch`). Si el resultado es un material, muestra "Este objeto podés obtenerlo de los siguientes monstruos" con mini-resumen por fuente (recompensa/captura/rotura/carveo/dropeo) y tooltip explicando qué significa "(xN)" — investigado y confirmado: significa N tiradas independientes dentro de un mismo cupo de recompensa (una captura/carveo/misión da varios objetos a la vez), no que se repita la acción N veces.
- **Header del monstruo**: separador vertical + panel de info a la derecha (por ahora solo "Elemento principal", pensado para agregar más campos a futuro).
- **Hitzones (tabla)**: verde brillante = mejor elemento (con empates completos, hasta 4 si hay 4-way tie), amarillo = resto hasta completar 3, rojo = columnas en 0%.
- **Resistencias/Debilidades**: tarjetas con fondo tintado (rojizo/verdoso) + ícono de elemento a la izquierda de cada fila.
- **Casos especiales de resistencia condicional** (Barroth, Jyuratodus, Almudron, Magma Almudron): filas propias tipo "Agua (sin barro)" Inmune / "Agua (con barro)" Débil, con ⚠ de "caso especial" (no de "sin confirmar").
- **Íconos descargados localmente**: 78 monstruos, 816 materiales (~99% cobertura), 17 estados/plagas + Exhaust. Todo en `data/images/`, manifiestos en `data/*_manifest.json`.
- **Bugs de datos encontrados y corregidos**: `attackElements` con string literal `"None"` en 21 monstruos (ya arreglado en datos y en el scraper fuente), varios ailments sin traducir (Bleed/Bleeding/Venom/Bubble/Frenzy Virus/Defense Down/Blastblight/Bloodblight/Webbed/Stench), ubicaciones mal traducidas (corregidas contra wiki oficial), especies mal traducidas (corregidas contra wiki oficial), bug de `text-transform: capitalize` que rompía frases de varias palabras (sacado de raíz).
- **Graphify** instalado (`graphify claude install`) para análisis de arquitectura del código — `backups/` excluido vía `.graphifyignore`.

## Estado general

| Etapa | Estado |
|---|---|
| Listado maestro de 78 monstruos (base + variantes) con URL de Fextralife | ✅ Hecho (`data/monster_list.json`) |
| Armado de la app (HTML/CSS/JS, selector agrupado, ficha de detalle) | ✅ Hecho, probado en navegador con datos de muestra |
| Recolección de datos por batches (6 agentes en paralelo, ~13 monstruos c/u) | 🔄 En curso |
| Fusión de batches en `data/monsters.json` final | ✅ Hecho — 78/78 monstruos, sin duplicados ni faltantes contra el listado maestro |
| Revisión de casos dudosos/ambiguos (ver `DATA_NOTES.md`) | 🔄 Documentados, pendientes de doble-chequeo manual |
| Prueba final en navegador con dataset completo | ✅ Hecho — 79 opciones en el selector (78 monstruos + placeholder) |

## Batches de recolección (13 monstruos c/u)

| Batch | Estado | Notas |
|---|---|---|
| 1 | ✅ Completo | 13/13 con materiales |
| 2 | ✅ Completo | 13/13 con materiales |
| 3 | ✅ Completo | 13/13 con materiales — ver nota "Melding Pudding/Honey" en `DATA_NOTES.md` |
| 4 | ✅ Completo | 13/13 con materiales |
| 5 | ✅ Completo (2do intento) | Primer intento falló a mitad de camino (límite de sesión del agente) tras terminar solo Bazelgeuse. Relanzado desde cero, 13/13 con materiales. |
| 6 | ✅ Completo | 13/13 con materiales |

## Correcciones aplicadas manualmente

- **Scorned Magnamalo (Magnamalo Humillado)**: el dato de muestra inicial tenía Dragón como "resistente 1 estrella". Verificado contra Fextralife: es **inmune** tanto a Fuego como a Dragón. Corregido en `data/monsters.json`. También se completaron zonas de aparición (Shrine Ruins, Flooded Forest, Lava Caverns, Citadel) y susceptibilidad a estados.
- Mejorado `app.js` para no mostrar "1 estrella" por defecto cuando un elemento es "resistente" sin nivel específico — ahora muestra un badge "Resistente"/"Débil"/"Susceptible" en esos casos en vez de una estrella falsa.

## Feature: Hitzones por parte del cuerpo + detalle de acumulación de estados (2026-08-05)

Nueva fuente de datos: [grindosaur.com](https://www.grindosaur.com/en/games/monster-hunter-rise/monsters), que sí tiene la tabla "Physiology" (daño % por parte del cuerpo y tipo de daño) y "Ailment Effectiveness" con valores numéricos exactos incluso en las barras (`aria-valuenow`/`aria-valuemax`).

- `WebFetch` (la herramienta de los agentes) devuelve 403 en este sitio, igual que Kiranico. Se resolvió con `curl` usando un User-Agent de navegador normal, que sí funciona (200 OK, HTML completo server-rendered).
- Se escribió `data/scrape_grindosaur.js`: descarga las 78 páginas y parsea las tablas con regex determinístico — **sin LLM de por medio**, cero riesgo de transcripción incorrecta.
- Se agregaron dos campos nuevos a cada monstruo en `monsters.json`:
  - `hitzones`: array de `{part, sever, blunt, projectile, fire, water, thunder, ice, dragon, stun}` (todos %).
  - `ailmentBuildup`: array de `{key, label, stars, buildup: [{label, value, max}]}` — reemplaza en la UI al viejo `ailmentSusceptibility` (que quedó sin usar pero no se borró).
- UI: nueva sección "Debilidades por parte del cuerpo". Resaltado de columnas elementales (Fuego/Agua/Trueno/Hielo/Dragón): se calcula el máximo de cada columna, se rankean, el top-3 (con máximo > 0) se resalta — 1ro dorado con brillo animado, 2do/3ro verde si su valor es ≥70% del top o amarillo si es notablemente menor. Columnas físicas (Corte/Contund./Disparo) y Aturdimiento sin resaltar.
- Ailments ahora en `<details>` colapsable: estrellas siempre visibles, el detalle de acumulación (Initial/Threshold/Max Resistance, Degradación, Daño total) queda oculto hasta hacer click.

## Savepoints

- **savepoint01** (2026-08-05): copia completa de la carpeta del proyecto en `../mhrise-bestiario_savepoint01/`, tomada justo antes de empezar el sistema de idiomas ES/EN. Incluye: los 78 monstruos con materiales, hitzones y ailment buildup ya fusionados; app funcional con selector agrupado, tabla de hitzones resaltada, y ailments desplegables.
- **savepoint02** (2026-08-05): copia completa en `../mhrise-bestiario_savepoint02/`, tomada justo después de terminar el selector de idioma ES/EN (materiales, elementos, ailments, partes del cuerpo, especies, ubicaciones y UI traducidos).

## Feature: Selector de idioma ES/EN (2026-08-05)

- Botón "ES/EN" en el header, cambia todo en vivo (sin recargar), persiste en `localStorage` (`mh-lang`).
- Traduce: UI (headers, botones, labels), elementos, ailments/plagas, partes del cuerpo (hitzones), especies, ubicaciones, rangos, encabezados de la tabla de materiales, y los materiales mismos (816 items, 97.5% con traducción oficial vía Kiranico ES/EN cruzado por ID — ver `DATA_NOTES.md`).
- Nuevo archivo `data/i18n.js` con todos los diccionarios + `data/kiranico_item_translations.json` (1429 términos oficiales EN↔ES, incluye peces/frutas/insectos para uso futuro).
- Bug encontrado y corregido durante la implementación: los headers de sección viven dentro de un `<template>`, que no es alcanzado por `document.querySelectorAll` hasta clonarse — había que aplicar las traducciones también sobre el nodo clonado, no solo sobre el documento.

## Feature: renders de monstruos + correcciones varias (2026-08-05)

- **Imágenes**: los 78 monstruos tienen su render oficial descargado localmente en `data/images/<slug>.png` (43MB total, cero duplicados verificados por hash) y linkeado en `monsters.json` → campo `image`. Fuente: página individual de cada monstruo en la wiki de Fandom en inglés (no la categoría de renders, que estaba incompleta para Sunbreak). Script: `data/scrape_renders.js`. Dos bugs encontrados y corregidos en el camino: (1) `WebFetch`/`fetch()` de Node reciben 403 de Fandom pero `curl` no — se resolvió shelleando a `curl`; (2) la primera versión del regex agarraba la imagen de fondo del tema de la wiki en vez del render real (mismo patrón de URL), causando que las 78 imágenes fueran idénticas — se corrigió anclando la búsqueda al link de alta resolución dentro del infobox específicamente.
- **Nombres de monstruos ES/EN**: agregado `monsterNames` en `i18n.js`, aplicado en el selector y en el título de la ficha. Ej: "Apex Rathalos" → "Rathalos Apex", "Scorned Magnamalo" → "Magnamalo Humillado" (confirmado por el usuario).
- **Bug de capitalización**: `.stat-name`/`.monster-species` tenían `text-transform: capitalize`, que rompía las traducciones en español con conectores minúsculos ("Bestia De Colmillos", "Plaga De Fuego" en vez de "...de..."). Corregido quitando el transform donde correspondía.
- **Estrellas no centradas** (ailments): al pasar `ailments-list` a una sola columna ancha, las estrellas quedaban pegadas al borde derecho por el `justify-content: space-between`. Se les dio un ancho fijo con `text-align: center` para que se vean como una columna propia.
- **Columnas de hitzones centradas**: a pedido del usuario, todas las columnas numéricas de la tabla de "Debilidades por parte del cuerpo" quedaron centradas (la de "Parte" se mantiene a la izquierda).
- **Columna de Aturdimiento en hitzones**: se evaluó sacarla por parecer redundante (siempre en Cabeza), pero se encontraron 6 excepciones en los 78 monstruos — la más relevante, Great Wroggi tiene 100% en el Cuerpo. Se mantuvo la columna.

## Rediseño del resaltado de hitzones (2026-08-05)

Reglas nuevas para las columnas elementales de "Debilidades por parte del cuerpo":
- **Verde + brillo** = el/los elemento(s) con el valor máximo más alto — si hay empate en el primer puesto (2, 3, o incluso los 4 no-nulos como en Crimson Glow Valstrax), todos brillan en verde, sin límite de 3 en ese caso.
- **Amarillo, sin brillo** = rellena los cupos restantes hasta un total de 3 columnas resaltadas (si no hubo empate en el primer puesto).
- **Rojo** = cualquier columna con 0% en todas las partes del cuerpo (el elemento no hace nada), siempre, sin importar el resto.
- Caso de prueba: Crimson Glow Valstrax (Fuego=Agua=Rayo=Hielo=25%, Dragón=0%) → los 4 primeros brillan en verde, Dragón en rojo. Jyuratodus (Rayo=30 único máximo, Fuego=15, Hielo=Dragón=5, Agua=0) → Rayo verde brillante, Fuego e Hielo amarillo, Agua rojo, Dragón sin resaltar.

## Feature: Silueta de hitzones coloreada — Rathalos + Corte (2026-08-06/07, CERRADA)

Prototipo de mapa de calor por daño, dibujado sobre la silueta real del monstruo (no un dibujo genérico). Solo Rathalos por ahora, con un toggle para elegir cuál de las 9 columnas de daño (Corte/Contund./Disparo/5 elementos/Aturdimiento) colorea la silueta — pensado para expandirse a más monstruos a futuro con más vectores de referencia del usuario.

- **Pipeline**: usuario deja un PNG de referencia (colores planos, costuras blancas/transparentes) en `vectores/<monstruo>.png` → `data/trace_silhouette.py` (OpenCV: `connectedComponents` + `dilate` + `findContours` + `approxPolyDP`) lo vectoriza a `data/rathalos_traced.json` → las coordenadas se pegan a mano en `HITZONE_SHAPES.Rathalos` en `app.js`. Detalle completo del proceso y las reglas de dilatación en `data/SILHOUETTE_GUIDE.md`.
- **Color por parte**: `tierColorsByPart()` — rojo = valor más alto, naranja = 2do, amarillo = todo el resto excepto el mínimo, gris (`#4a4038`) = el valor mínimo únicamente. Confirmado con el usuario contra varios monstruos de referencia (Rathalos, Bulldrome, Odibatorasu, etc).
- **El bug real no era de trazado ni de dilatación** (se probaron y descartaron varias rondas de eso) **sino de identificación anatómica**: se había asumido a mano qué región trazada = qué parte del cuerpo, y la asignación estaba mal en varios casos (la cresta grande roja es el Ala, no la Cabeza; la forma doblada de abajo es la Cola, no el Ala; etc). Se corrigió pidiéndole al usuario que confirme cada parte con el color hex real tomado del render (`document.querySelectorAll('svg polygon[data-part]')`), no adivinando por posición/forma. La llama/boca en la punta, que estaba tratada como decoración cosmética sin tooltip, en realidad es parte de la Cabeza (boca abierta) — se integró como un segundo polígono dentro de `Head`.
- **Lección clave, ya escrita en `data/SILHOUETTE_GUIDE.md`**: para el próximo monstruo, no asumir región→parte por posición/tamaño. Si el usuario da un código hex, buscarlo directo en los `fill` del DOM en vez de interpretar capturas de pantalla.
- Toggle de tipo de daño: botones tipo pastilla (mismo estilo visual que "Rango Bajo/Alto/Maestro" de materiales, pero con clases CSS propias `.hz-silhouette-stat-tab(s)` — al principio reutilizaba literalmente `.rank-tab`/`.rank-tabs` y eso rompía el selector de rango de materiales, porque `node.querySelector(".rank-tabs")` agarraba el primer match del DOM, que pasó a ser el de la silueta). Recalcula `tierColorsByPart()` con la columna elegida (`hzSilhouetteStat`, default `"sever"`), bilingüe. Labels completos en el toggle (`hzStatLabelFull()`, ej. "Contundente") vs. abreviados en la tabla (`hzStatLabel()`, "Contund.") por espacio de columna.
- **Íconos de daño físico**: se agregaron a la tabla de hitzones y al toggle de la silueta, igual que ya tenían los estados en "Susceptibilidad a estados". Fuego/Agua/Rayo/Hielo/Dragón/Aturdimiento reusan íconos que ya existían (`elementIconTag`/`statusIconTag`); Corte/Contundente/Disparo son 3 íconos nuevos, pedidos explícitamente por el usuario desde la wiki de MH World (`data/images/icons/dmg-{sever,blunt,projectile}.png`, mapeados a mano en `HZ_PHYS_ICONS` en `app.js`, no hay manifiesto para estos 3 ya que no vinieron de un scrape).
- **Búsqueda más tolerante al "+"**: el usuario reportó que buscar "attack jewel 4" no encontraba "Attack Jewel+ 4" (el "+" rompía el match de substring). `normalizeSearch()` ahora también quita el "+" (y colapsa espacios dobles) de ambos lados de la comparación, no solo tildes — aplica a monstruos, materiales y decoraciones por igual ya que todas las búsquedas pasan por esta misma función.

## Feature: Decoraciones / Adornos (2026-08-07)

Sección nueva y completamente separada de los monstruos: 243 decoraciones de Sunbreak (accesorios de armadura que otorgan una habilidad al equiparse). Botón "Adornos" en el header.

- **Datos**: `data/decorations.json`, generado por `data/scrape_decorations.js` desde Kiranico (listado EN+ES + detalle por decoración para los materiales) e íconos de grindosaur.com. Detalle completo de fuentes y decisiones en `DATA_NOTES.md` → "Decoraciones / Adornos".
- **Vista índice**: agrupada por ranura (1-4), buscador propio por nombre de decoración o de habilidad.
- **Vista detalle**: ícono + nombre + ranura, habilidad(es) con nivel y efecto, y materiales para crear — cada material muestra ícono, cantidad, y un **desplegable** (`<details>`, mismo patrón que "Susceptibilidad a estados") con qué monstruo(s) lo dropean, en qué rango, con qué probabilidad, y un botón que navega directo a la página de ese monstruo. Si el material no es un drop de monstruo (recolección/minado/tienda), se lo indica en vez de mostrar un desplegable vacío.
- **Buscador global**: las decoraciones aparecen como sección propia, con el mismo formato "bloque expandido" que ya se usaba para materiales (ícono+nombre, habilidad, lista de materiales) — clickeable, navega directo al detalle de la decoración.
- Bug encontrado de paso y corregido: el placeholder del buscador global (`#global-search-input`) nunca cambiaba de idioma pese a tener `data-i18n-ph` en el HTML — ese atributo nunca se procesó en JS. Se corrigió asignando el placeholder a mano en `applyUiStrings()` (mismo patrón que ya se usaba para `#monster-search`), y se aplicó el mismo fix al nuevo buscador de decoraciones.

## Próximos pasos

1. Esperar que termine el batch 5.
2. Fusionar los 6 `output_batch_*.json` en `data/monsters.json`, resolviendo los casos de `DATA_NOTES.md`.
3. Recorrer visualmente varios monstruos de cada batch en el navegador para detectar inconsistencias.
4. (Opcional, a futuro) Completar el campo `rarity` de materiales con otra fuente, ya que Fextralife no lo expuso.
