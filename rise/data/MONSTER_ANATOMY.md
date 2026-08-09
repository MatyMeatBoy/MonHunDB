# Guía de anatomía — referencia para trazar vectores/siluetas

Notas de forma corporal y rasgos distintivos de los 78 monstruos, pensadas específicamente para **no repetir el error de Rathalos** (asumir qué región trazada es qué parte del cuerpo por posición/forma, sin verificar). Antes de mapear un `HITZONE_SHAPES` nuevo, leer la entrada del monstruo acá primero — da una idea de qué buscar (¿tiene alas separadas del cuerpo? ¿la cola es gruesa o un látigo delgado? ¿tiene "brazos" o son parte del ala?) — pero **la palabra final siempre es la referencia visual que dé el usuario y su confirmación por color hex**, esto es solo para no partir a ciegas.

**Fuente**: conocimiento general de la saga Monster Hunter (diseños ya publicados por Capcom), no un scrape verificado — es una ayuda de orientación visual, no un dato de juego. Si algo se ve claramente mal contra la referencia real, se corrige.

Especie según nuestros datos (`data/monsters.json` → `species`) entre paréntesis. Variantes (Apex/Risen/Gold/etc.) comparten la anatomía base salvo que se aclare lo contrario.

## Wyvern Pájaro (Bird Wyvern)

Bípedos, cuerpo compacto tipo ave grande, cabeza con pico, cola relativamente corta y gruesa, dos patas traseras fuertes, "brazos" delanteros pequeños. Sin alas de vuelo real (son Bird Wyvern, no Flying Wyvern).

- **Aknosom**: parecido a un ave rapaz/pavo real, cresta vistosa en la cabeza, plumaje ornamental en la cola.
- **Great Baggi**: hocico alargado tipo lobo-ave, cresta ósea sobre la cabeza, cola mediana.
- **Great Izuchi**: el más "genérico" del grupo, referencia de tamaño estándar, cola larga con mechón.
- **Great Wroggi**: similar a Great Baggi pero con bolsas de veneno visibles en el cuello/mejillas.
- **Kulu-Ya-Ku**: postura muy erguida, pico curvo grande, usa los "brazos" delanteros para cargar objetos — brazos más desarrollados que el resto del grupo.
- **Pukei-Pukei**: cuerpo más rechoncho, cola prensil larga con una vejiga/saco venenoso en la punta (distintivo — la punta de cola es su propia sub-zona).

## Wyvern Volador (Flying Wyvern)

El grupo más grande. Bípedos o cuadrúpedos con **alas membranosas** que funcionan como "brazos" delanteros (patrón murciélago/dragón clásico) — al caminar en 4 patas usan el borde del ala como mano. Cabeza-cuello-espalda-cola bien diferenciados, cola casi siempre larga.

- **Apex Diablos / Diablos**: sin alas de vuelo (excepción del grupo, es terrestre puro), dos grandes cuernos curvos en la cabeza, cuerpo robusto tipo "toro/rinoceronte", cola gruesa con púas, se desplaza también bajo tierra.
- **Astalos**: alas con "cuchillas" en el borde, cresta con órganos generadores de electricidad en la cabeza y el lomo.
- **Barioth**: ver aparte, es Fanged Wyvern realmente — **NO, corregido: Barioth es Flying Wyvern en nuestros datos**. Cuerpo tipo felino-dragón (rasgos de "diente de sable"), colmillos largos curvos, alas más pequeñas/menos vistosas que otros del grupo, cola larga y delgada tipo látigo, **cuchillas óseas en los antebrazos** (rasgo distintivo, no confundir con garras normales), se mueve mucho a 4 patas como un felino grande. **Confirmado con el vector real del usuario (2026-08-07)**: la referencia lo dibuja de frente/3-cuartos (no de perfil), por eso las dos patas delanteras se ven muy separadas entre sí en la silueta (una más grande/adelantada por el escorzo) — no confundir esa pata "más atrás" con una pata trasera real. La pata trasera real SÍ tiene su propia región en el arte, pero es chica y aparece metida entre las dos patas delanteras (fácil de confundir con un pie/detalle de las delanteras a simple vista — hubo que preguntarle al usuario dos veces para no terminar borrándola por error). También hay un sliver diminuto que a simple vista parece pie de la pata delantera pero en realidad es panza (`Abdomen`) asomando entre las patas. Las espinas de hielo del antebrazo y el ala son, en la práctica, la misma estructura visual (el borde del ala termina en esa espina) — mismo par de formas sirve para ambas partes del juego (`Thorns` y `Wing`).
- **Bazelgeuse / Seething Bazelgeuse**: cuerpo grande y pesado, cubierto de "escamas explosivas" desprendibles (más notorio en Seething), alas anchas, cola larga.
- **Espinas / Flaming Espinas**: cuerpo cubierto de púas/espinas largas por toda la espalda y cola (rasgo muy distintivo, la "silueta" tiene contorno dentado en casi todo el dorso), alas más pequeñas.
- **Gold Rathian / Rathian**: variante hembra de la familia Rathalos — cola con veneno y más protagonismo ofensivo (barre con la cola), cuerpo más esbelto que Rathalos, cresta más pequeña.
- **Khezu**: **atípico** — sin patas traseras definidas ni alas visibles, cuerpo tipo "gusano/serpiente" pálido que se arrastra/cuelga de techos, cabeza pequeña en un cuello muy largo y flexible. No asumir estructura de wyvern estándar acá.
- **Kushala Daora / Risen Kushala Daora**: Elder Dragon en realidad (ver esa sección) — cuerpo blindado en placas metálicas.
- **Lucent Nargacuga / Nargacuga**: cuerpo felino-murciélago negro, alas grandes tipo capa, cola con una maza/masa dura en la punta (arma distintiva), muy ágil.
- **Rathalos / Apex Rathalos / Silver Rathalos**: el "rey" de la franquicia — alas rojas grandes, cresta prominente hacia atrás, cola con una punta inflamable (aguijón de fuego), vuela activamente.
- **Rathian / Apex Rathian**: ver Gold Rathian arriba, misma anatomía base.
- **Seregios**: cubierto de escamas afiladas tipo cuchilla que puede disparar, alas con bordes serrados.
- **Silver Rathalos**: variante de Rathalos, misma anatomía.
- **Tigrex**: cuerpo muy robusto y musculoso, mandíbula inferior enorme y prominente (rasgo más distintivo — la cabeza es casi toda mandíbula), alas pequeñas casi decorativas, se mueve mayormente en tierra a toda velocidad.

## Bestia con Colmillos (Fanged Beast)

Cuadrúpedos tipo mamífero grande (oso/lobo/simio), sin alas, sin escamas de reptil (piel/pelaje). Estructura de "cabeza-cuello-lomo-cola-4 patas" simple, sin partes "raras".

- **Apex Arzuros / Arzuros**: tipo oso, cuerpo rechoncho, cola casi inexistente.
- **Blood Orange Bishaten / Bishaten**: tipo mono/tanuki, cola larga prensil muy prominente (usada activamente en combate, es casi una "5ta extremidad"), postura bípeda frecuente.
- **Furious Rajang / Rajang**: tipo gorila, brazos delanteros muy desarrollados y largos, se para en dos patas en su forma enfurecida, pelaje dorado (Furious).
- **Garangolm**: tipo oso/simio cubierto de resina endurecida, brazos grandes.
- **Goss Harag**: tipo yeti/oso de hielo, usa placas de hielo generadas como armadura/arma adicional.
- **Lagombi**: tipo conejo/oso polar, patas traseras grandes adaptadas para deslizarse en hielo/nieve.
- **Rajang**: ver Furious Rajang.
- **Volvidon**: tipo armadillo/oso hormiguero, cuerpo bajo y ancho, puede enrollarse.
- **Zamite/otros**: (no aplica, no están en la lista).

## Wyvern con Colmillos (Fanged Wyvern)

Híbrido: reptil con más rasgos mamíferos que los wyvern clásicos (dientes prominentes tipo depredador, menos "pico"). Sin alas de vuelo real en general.

- **Apex Zinogre / Zinogre**: tipo lobo-dragón, placas amarillas generadoras de electricidad en el lomo y cola, cola gruesa con maza en la punta.
- **Barioth**: ver arriba en Flying Wyvern (así está clasificado en nuestros datos, aunque visualmente parece más felino).
- **Lunagaron**: tipo lobo grande, forma "furia" cubre el cuerpo en hielo.
- **Magnamalo / Scorned Magnamalo**: cuerpo púrpura/negro compacto, placas duras en hombros y cola, cola con una punta tipo maza afilada que usa para golpear "a través" del propio cuerpo (rasgo muy distintivo del diseño).
- **Tobi-Kadachi**: tipo ardilla voladora/dragón eléctrico, membranas planeadoras entre brazos y cuerpo (no son alas completas), cola larga.

## Wyvern Bruto (Brute Wyvern)

Cuadrúpedos muy robustos y pesados, cabeza baja, sin alas, centro de gravedad bajo.

- **Anjanath**: tipo T-Rex, cabeza y mandíbula grandes, brazos delanteros pequeños (casi vestigiales), cresta nasal.
- **Barroth**: tipo rinoceronte/cocodrilo, se cubre de barro (capa extra sobre el cuerpo base, afecta resistencias — ver nota en `DATA_NOTES.md`), cuerno nasal curvo.
- **Basarios**: cuerpo rocoso/mineral, caparazón grueso tipo roca en el lomo.

## Wyvern Piscino (Piscine Wyvern)

Cuadrúpedos semi-acuáticos, cuerpo tipo pez-reptil, aletas en vez de alas.

- **Jyuratodus**: cuerpo cubierto de barro (similar mecánica a Barroth), aletas grandes tipo pala, se cubre de lodo/barro.

## Leviatán (Leviathan)

Cuerpo serpentino/tipo cocodrilo, se mueven mucho reptando o nadando, cola muy larga y musculosa (a menudo el arma principal), patas cortas relativas al cuerpo.

- **Almudron / Magma Almudron**: cuerpo tipo pez-gusano gigante, usa barro/magma como arma a distancia, cola muy larga.
- **Apex Mizutsune / Mizutsune / Violet Mizutsune**: tipo dragón-zorro acuático, genera burbujas de jabón, cola con mechón vistoso, muy ágil y "elegante" en el movimiento.
- **Magma Almudron**: ver Almudron.
- **Aurora Somnacanth / Somnacanth**: tipo pez luna/rape, aleta dorsal grande vistosa que cambia de color, cuerpo comprimido lateralmente.
- **Royal Ludroth**: tipo cocodrilo con melena/crin en el cuello (rasgo distintivo), cola tipo remo.
- **Tetranadon**: **es Amphibian en nuestros datos, no Leviathan** — ver abajo.
- **Violet Mizutsune**: ver Mizutsune.

## Anfibio (Amphibian)

- **Tetranadon**: tipo rana/sapo gigante, cuerpo muy inflable (se hincha como mecánica de combate — cambia mucho la silueta entre estados), patas traseras grandes.

## Carapaceon (crustáceo/artrópodo grande)

Exoesqueleto duro, sin "piel" — toda la silueta es placas/caparazón. Estructura muy distinta a un wyvern: no hay cuello claro, la "cabeza" suele fusionarse con el cefalotórax.

- **Daimyo Hermitaur**: tipo cangrejo ermitaño gigante, usa un caparazón de otro monstruo como "casco"/escudo en la parte frontal (arma prestada, no es parte de su cuerpo real — importante no confundir en el trazado).
- **Shogun Ceanataur**: tipo langosta/escorpión, grandes tenazas delanteras, cola segmentada curva.

## Temnoceran (arácnido/insecto grande)

Muchas patas, cuerpo segmentado, sin el patrón cabeza-cuello-cola de un wyvern.

- **Pyre Rakna-Kadaki / Rakna-Kadaki**: tipo araña gigante, cuerpo con abdomen grande separado del cefalotórax, genera telarañas.

## Dragón Anciano (Elder Dragon)

Grupo más variado — cada uno tiene un diseño único, no comparten plan corporal. Anotado uno por uno.

- **Amatsu**: serpiente marina/dragón oriental, cuerpo muy largo y ondulado, sin patas traseras claras, aletas/barbas largas en la cabeza.
- **Chameleos / Risen Chameleos**: tipo camaleón/rana, puede volverse invisible (afecta cómo se ve pero no la anatomía base), lengua larga prensil.
- **Crimson Glow Valstrax / Risen Crimson Glow Valstrax**: tipo dragón-avión, cuerpo muy aerodinámico, alas que se pliegan como un jet, cola con propulsión.
- **Gaismagorm**: gigantesco, tipo gusano/larva colosal, tiene una fase "excavadora" (solo la parte superior visible) y una fase de cuerpo completo — anatomía muy atípica, revisar referencia visual con cuidado si se aborda.
- **Kushala Daora / Risen Kushala Daora**: dragón blindado en placas metálicas plateadas, alas grandes, genera vientos cortantes.
- **Malzeno / Primordial Malzeno**: tipo murciélago-vampiro, alas membranosas grandes, cuerpo delgado y ágil, cresta en la cabeza.
- **Narwa the Allmother**: forma "armada" de Narwa — cubierta de un caparazón/armadura eléctrica adicional sobre el cuerpo base (comparar con Thunder Serpent Narwa, que es la forma sin esa armadura — silueta distinta aunque es "el mismo" monstruo narrativamente).
- **Primordial Malzeno**: ver Malzeno.
- **Risen Chameleos / Risen Crimson Glow Valstrax / Risen Kushala Daora / Risen Shagaru Magala / Risen Teostra**: formas "elevadas/corruptas" — mismo diseño base que su versión normal, coloración y aura distintas, revisar si el trazado de color plano lo necesita (probablemente sí comparte silueta con el original).
- **Shagaru Magala**: forma evolucionada de Gore Magala — a diferencia de Gore, tiene **alas funcionales completas** (Gore las tiene más como brazos plegados), cuerpo pálido/blanco brillante.
- **Gore Magala / Chaotic Gore Magala**: cuerpo negro, alas más reducidas/atrofiadas que Shagaru (funcionan más como un segundo par de patas delanteras que como alas de vuelo), esporas visibles.
- **Teostra / Risen Teostra**: dragón de fuego con melena/crin blanca prominente alrededor de la cabeza y el cuello (rasgo muy distintivo), alas grandes.
- **Thunder Serpent Narwa**: ver Narwa the Allmother — esta es la forma "base", sin la armadura extra.
- **Velkhana**: dragón de hielo, cresta de cristal de hielo en la cabeza, cuerpo alargado tipo serpiente-dragón, cola con abanico de hielo en la punta.
- **Wind Serpent Ibushi**: dragón serpiente eólico, cuerpo muy largo y ondulado similar a Amatsu, crestas/púas a lo largo del lomo.

## Desconocida (Unknown, según nuestros datos)

- **Gore Magala**: catalogado como "Unknown" oficialmente en el juego (antes de revelarse su naturaleza) — ver descripción en Elder Dragon arriba, la anatomía es la misma.
- **Shagaru Magala**: mismo caso, ver arriba.

---

## Cómo usar esto en la práctica

1. Antes de trazar, leer la entrada del monstruo acá para saber cuántas "regiones" esperar a grandes rasgos (¿tiene alas separadas del cuerpo? ¿tiene cola larga o corta? ¿tiene brazos/tenazas grandes?).
2. Esto NO reemplaza confirmar con el usuario — es solo para no adivinar totalmente a ciegas como pasó con Rathalos (donde terminamos confundiendo Ala/Cola/Cuello varias veces).
3. Si el usuario da una imagen de referencia nueva, comparar la silueta contra la descripción acá antes de asignar regiones a partes.
4. Si notás que la descripción de acá no calza con la referencia real que dio el usuario, la referencia real siempre gana — avisar y corregir esta guía también.
