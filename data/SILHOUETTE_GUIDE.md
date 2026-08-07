# Guía: siluetas de hitzones (vectorizado + identificación de partes)

Notas de proceso para cuando se agreguen más monstruos a `HITZONE_SHAPES` en `app.js`. Pensada para gastar poco contexto: es una checklist, no una narración.

## Pipeline técnico (ya resuelto, reutilizar tal cual)

1. El usuario deja una imagen de referencia en `vectores/<monstruo>.png` — silueta de colores planos, sin degradés, separada por líneas blancas/transparentes entre regiones.
2. `python data/trace_silhouette.py <imagen> <salida.json>` la vectoriza:
   - `cv2.connectedComponents` separa regiones por color+contigüidad (blanco/transparente = separador).
   - Cada región se dilata (radio en px, vía `cv2.distanceTransform`, no kernel fijo — permite radios fraccionarios) antes de `cv2.findContours` + `cv2.approxPolyDP`, para que las regiones vecinas se toquen un poco y no quede un hueco sin tooltip en la costura.
   - Radio default `DILATE_RADIUS = 1.86`. Regiones grandes (`area > LARGE_REGION_AREA`) pueden llevar un radio mayor aparte (`DILATE_RADIUS_LARGE`) — **usar esto en vez de subir el radio global**, porque un radio global alto deforma regiones chicas (ej. patas fusionándose).
3. La salida trae regiones ordenadas por bbox (arriba-abajo, izquierda-derecha) con su color promedio del PNG original — ese color original **no se usa para pintar**, es solo referencia para ubicar la región a simple vista en el JSON.
4. Cada región se pega a mano en `HITZONE_SHAPES[<Monstruo>].parts.<Parte>` en `app.js`. Una `parte` puede tener **más de un shape** (array de strings de puntos) si el arte tiene la misma parte anatómica dibujada en más de un pedazo separado — ver Rathalos (Cabeza = cresta... no, ver sección siguiente, esto cambió).

## Lo que most importa: la identificación anatómica, NO el trazado

El trazado (paso técnico) nunca falló. Todos los errores reales fueron **asumir qué parte del cuerpo es cada región** a partir de su posición/tamaño en el bounding box. Eso llevó a varias rondas de corrección con Rathalos:

- Región más grande y llamativa (la "cresta" roja) → yo asumí "Cabeza" porque es roja y está arriba. **Estaba mal**: es el Ala.
- La franja angosta pegada a la cresta → yo asumí "Cuello". **Estaba mal**: es la Espalda.
- El segmento cerca de la llama → yo asumí "Cola". **Estaba mal**: es el Cuello.
- La forma doblada con puntas, abajo a la izquierda → yo asumí "Ala" (parecía membrana de ala por la forma). **Estaba mal**: es la Cola.
- La "llama" en la punta → yo la traté como decoración cosmética fija, sin tooltip. **Estaba mal**: es parte de la Cabeza (boca abierta/aliento de fuego).

**Ninguna de estas se podía adivinar por forma o posición.** La única forma confiable que funcionó: el usuario abre la página ya renderizada, usa un selector de color (color picker) sobre el `<svg>` real, y me pasa el hex exacto (ej. `#C93A2E`) de la zona que está mal. Como el fill de cada polígono sale de `tierColorsByPart()` (color por valor de stat, no el color original del PNG), ese hex identifica sin ambigüedad **qué `data-part` tiene asignada esa forma ahora mismo** — no hace falta que yo "vea" ninguna captura de pantalla, alcanza con buscar ese hex en los `fill` de los `<polygon data-part>` del DOM.

### Checklist para el próximo monstruo

1. Trazar y pegar una primera asignación de buena fe (posición/tamaño está bien como punto de partida, pero avisar que es provisorio).
2. **No defender la asignación inicial si el usuario la corrige.** Cero fricción: si dice "esto es X, no Y", aplicar el cambio directo. Ya se indicó explícitamente que estas correcciones son absolutas.
3. Si el usuario da un código hex en vez de describir la zona, buscarlo directo en los `fill` de los polígonos renderizados (JS: `document.querySelectorAll('svg polygon[data-part]')`) en vez de sacar capturas de pantalla — es más preciso y no depende de que yo interprete una imagen.
4. Cuidado con las partes que "duplican" el shape de otra por falta de arte propio (ej. Espalda duplicando Cuello cuando no hay región dedicada): si se reasigna la parte de la que dependen, la que duplica se mueve en cascada sin que nadie la haya tocado directamente. Avisar esto proactivamente, no dejar que el usuario lo descubra solo.
5. No asumir que una región "rara" (llama, marcas, detalles) es decorativa — preguntar o confirmar antes de excluirla del sistema de tooltips/colores.
6. Para huecos de tooltip en una costura puntual: no subir la dilatación global. Aumentar el radio solo de la región grande involucrada (`DILATE_RADIUS_LARGE`), y si con eso no alcanza, mejor preguntar antes de seguir escalando el radio — puede que el "hueco" en realidad sea una región mal asignada (como pasó acá), no un problema de trazado.

## Estado actual: Rathalos (referencia completa, confirmada por el usuario)

| Parte      | Shape(s) en el arte                                  | Color en pantalla (Corte) |
|------------|-------------------------------------------------------|----------------------------|
| Cabeza     | la llama/boca pequeña (punta derecha)                  | rojo `#c93a2e` (65%, máximo) |
| Ala        | la cresta grande completa                              | naranja `#d9832a` (50%) |
| Cuello     | segmento angosto junto a la llama                      | amarillo `#d9c94a` (35%) |
| Espalda    | banda justo después de la cresta (sin región propia originalmente — ahora tiene la suya) | gris `#4a4038` (25%) |
| Cola       | forma doblada con puntas, abajo a la izquierda         | amarillo `#d9c94a` (45%) |
| Abdomen    | (sin cambios desde el trazado inicial)                 | gris `#4a4038` (25%) |
| Pata       | (sin cambios desde el trazado inicial)                 | amarillo `#d9c94a` (35%) |

Solo Rathalos tiene silueta por ahora. El resto de los monstruos no muestra esta sección (`renderHitzoneSilhouette` se sale en silencio si `HITZONE_SHAPES[monster.name]` no existe).
