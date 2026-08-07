# Bestiario — Monster Hunter Rise: Sunbreak

App web estática (sin build, sin frameworks) para consultar los 78 monstruos grandes de MH Rise + Sunbreak (incluyendo variantes: Apex, Risen, subespecies, especies raras) con:

- Zonas de aparición
- Debilidades y resistencias elementales (con estrellas / inmunidad)
- Susceptibilidad a estados (ailments)
- Estados que inflige el monstruo
- Materiales de dropeo por rango (Low Rank / High Rank / Master Rank), con % de recompensa objetivo, captura, rotura de partes, carveo y dropeo

El selector es único: un `<select>` con optgroups que agrupa cada monstruo base junto a sus versiones (ej. Rathalos / Apex Rathalos / Silver Rathalos).

## Cómo correrlo

Es HTML/CSS/JS plano, pero necesita servirse por HTTP (no abrir el `index.html` directo con doble click) porque `app.js` hace `fetch("data/monsters.json")`.

```bash
npx serve .
```

o cualquier servidor estático equivalente, y abrir la URL que indique.

## Estructura

```
mhrise-bestiario/
  index.html          shell + template de la ficha de detalle
  style.css           tema oscuro estilo MH
  app.js              carga data/monsters.json, arma el selector, renderiza la ficha
  data/
    monsters.json     dataset final consumido por la app
    monster_list.json listado maestro de 78 monstruos con su URL de Fextralife
    batches/          inputs/outputs intermedios de la recolección por agentes
  PROGRESS.md          checklist de avance del proyecto
  DATA_NOTES.md         casos ambiguos/dudosos detectados durante la recolección, a revisar
```

## Fuente de datos

Los datos se recolectaron de [Fextralife — Monster Hunter Rise Wiki](https://monsterhunterrise.wiki.fextralife.com/), monstruo por monstruo, vía agentes en paralelo. Ver `DATA_NOTES.md` para los casos donde la wiki no daba un dato claro y se dejó `null` en vez de inventar.

## Schema de `data/monsters.json`

```jsonc
{
  "name": "Magnamalo",
  "species": "Fanged Wyvern",
  "locations": ["Shrine Ruins", "Frost Islands", "Lava Caverns"],
  "weaknesses": [{ "element": "Water", "stars": 2 }],
  "resistances": [
    { "element": "Fire", "immune": true },
    { "element": "Ice", "stars": null } // resistente pero sin nivel de estrella publicado
  ],
  "ailmentSusceptibility": [{ "ailment": "Poison", "stars": 1 }],
  "inflicts": ["Hellfireblight"],
  "materials": {
    "Low Rank": [
      {
        "material": "Magnamalo Scale",
        "rarity": null,
        "targetReward": "17%",
        "capture": "",
        "breakParts": "36% (Armblade)",
        "carves": "36% (Body), 20% (Tail)",
        "dropped": "19%, 31%"
      }
    ],
    "High Rank": [ /* ... */ ],
    "Master Rank": [ /* ... */ ]
  }
}
```

Notas:
- Si un rango (Low/High/Master) no existe para ese monstruo (p. ej. monstruos exclusivos de Sunbreak que arrancan en Master Rank), esa clave simplemente no está en `materials`.
- `rarity` quedó `null` en toda la recolección porque Fextralife no expone ese dato en las tablas de forma consistente — pendiente de otra fuente si se quiere completar.
- Agrupación de variantes en el selector (qué monstruo va bajo qué optgroup) está hardcodeada en `app.js` → `GROUP_OVERRIDES`.
