# Fuentes usadas en el proyecto

Todas las webs que se scrapearon/consultaron para armar los datos, en orden de uso.

## Datos de monstruos (inglés)

- **[monsterhunterrise.wiki.fextralife.com](https://monsterhunterrise.wiki.fextralife.com/)** — fuente principal de los 78 monstruos: hábitat/zonas, debilidades y resistencias elementales con estrellas, susceptibilidad a ailments, tablas completas de materiales por rango (Low/High/Master Rank). Scrapeado vía 6 agentes en paralelo (uno por batch de 13 monstruos) usando `WebFetch`. Ver `data/batches/`.
- **[grindosaur.com](https://www.grindosaur.com/en/games/monster-hunter-rise/monsters/large-monsters/)** — tabla "Physiology" (daño % por parte del cuerpo y tipo de daño = hitzones) y "Ailment Effectiveness" con valores exactos incluso en las barras (`aria-valuenow`/`aria-valuemax`). `WebFetch` devuelve 403 en este sitio — se resolvió bajando el HTML con `curl` (user-agent de navegador normal) y parseándolo con `data/scrape_grindosaur.js` (regex determinístico, sin LLM de por medio).

## Descartadas (evaluadas pero no usadas)

- **[Neryss/monster_hunter_db](https://github.com/Neryss/monster_hunter_db)** (GitHub) — tenía debilidades/resistencias/ailments de Rise+Sunbreak pero sin ubicaciones ni materiales. Se usó solo como referencia inicial rápida, no quedó nada de esta fuente en los datos finales.
- **[CrimsonNynja/monster-hunter-DB](https://github.com/CrimsonNynja/monster-hunter-DB)** (GitHub) — base de datos de toda la saga, sin datos específicos de Rise/Sunbreak (ubicaciones, materiales por rango). No se usó.
- **[Kiranico](https://mhrise.kiranico.com/)** (vista de monstruos) — bloqueado con 403 tanto en `WebFetch` como en `curl`. Sí se pudo usar la sección `/data/items` (ver abajo) porque esas páginas no tienen la misma protección.

## Traducciones al español

- **[mhrise.kiranico.com/es/data/items](https://mhrise.kiranico.com/es/data/items?view=material)** + su [equivalente en inglés](https://mhrise.kiranico.com/en/data/items?view=material) — diccionario de 816 materiales (97.5% de cobertura) armado cruzando por ID numérico de item entre la versión ES y EN. Vistas usadas: `material`, `consume`, `scrap` (esta última pareja de vistas trajo peces/frutas/insectos de más, guardados para uso futuro). URL compartida directamente por el usuario.
- **[monsterhunter.fandom.com/es/wiki/Bestiario](https://monsterhunter.fandom.com/es/wiki/Bestiario)** — taxonomía oficial de especies (Wyvern Nadador, Wyvern de Colmillos, etc.) y nombres oficiales de monstruos/variantes en español (Apex, Risen, Gold, etc. no siempre son prefijo/sufijo traducido literal). URL compartida directamente por el usuario, quien detectó el primer error (Piscine Wyvern).

## Renders de monstruos

- **[monsterhunter.fandom.com/wiki/<Monstruo>](https://monsterhunter.fandom.com/wiki/Malzeno)** (página individual en inglés de cada uno de los 78, no la categoría) — imagen del infobox descargada a `data/images/`, sin hotlink. La categoría [Category:MHRise_Monster_Renders](https://monsterhunter.fandom.com/wiki/Category:MHRise_Monster_Renders) que se probó primero estaba incompleta para monstruos de Sunbreak, así que se pasó a scrapear cada página individual. El usuario también encontró [monsterhunterwiki.org/wiki/Category:MHRS_Monster_Renders](https://monsterhunterwiki.org/wiki/Category:MHRS_Monster_Renders) como alternativa, no hizo falta usarla porque la primera fuente ya dio 78/78.
