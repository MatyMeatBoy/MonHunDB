# Informe gráfico de completitud de MonHunDB

**Auditoría:** 15 de agosto de 2026  
**Criterio:** porcentajes calculados sobre los registros que ya existen en cada catálogo. Cuando no hay una lista maestra fiable, se marca como *no medido* en vez de inventar un total.

## Resumen visual

| Área | MHFU | Rise | Wilds |
|---|---:|---:|---:|
| Fichas de monstruo con hitzones | `██████████` **100% (83/83)** | `██████████` **100% (78/78)** | `██████████` **100% (53/53)** |
| Fichas con debilidades | `██████████` **100%** | `██████████` **100%** | `██████████` **100%** |
| Fichas con materiales | `█████████░` **98,8% (82/83)** | `██████████` **100%** | `██████████` **100%** |
| Fichas con render local | `██████████` **100% (83/83)** | `██████████` **100% (78/78)** | `█████████░` **98,1% (52/53)** |
| Visor 3D / modelos | **Activo** | **Pendiente** | **Pendiente** |

## Lo que falta, medido

### MHFU

| Recurso | Completo | Falta |
|---|---:|---:|
| Fotos de sets de armadura | `██████████` **99,5% (403/405)** | **2 sets especiales/evento sin retrato Fandom fiable** |
| Sets con fuente Fandom prioritaria | `███████░░░` **76,8% (311/405)** | El resto conserva GameFAQs/local cuando Fandom no tiene imagen real o no distingue el rango |
| Renders de piezas de armadura | `██████████` **97,5% (2.156/2.211)** | **55 piezas** |
| Materiales de monstruo | `█████████░` **98,8% (82/83 fichas)** | **1 ficha** |
| Armas, adornos, objetos y habilidades | **Catálogo cargado** | Falta auditoría visual individual |

### Rise

| Recurso | Completo | Falta |
|---|---:|---:|
| Catálogo de monstruos | `██████████` **100% (78/78)** | 0 contra la lista maestra documentada |
| Renders de monstruos | `██████████` **100% (78/78)** | 0 |
| Hitzones, debilidades y materiales | `██████████` **100%** | 0 registros vacíos detectados |
| Rareza de armas | `█████████░` **86,8% (3.431/3.953)** | **522 armas** sin rareza |
| Materiales de armadura | `█████████░` **85,4% (1.344/1.574 piezas)** | **230 piezas** |
| Habilidades de armadura | `█████████░` **86,8% (1.366/1.574 piezas)** | **208 piezas** |
| Visor 3D | **No medido** | No hay carpeta de modelos equivalente a MHFU |

### Wilds

| Recurso | Completo | Falta |
|---|---:|---:|
| Renders de monstruos locales | `█████████░` **98,1% (52/53)** | **1 render** |
| Íconos de objetos | `██████████` **99,1% (768/775)** | **7 íconos** |
| Imágenes de sets de armadura | `██████████` **98,7% (157/159)** | **2 sets** |
| Materiales de sets | `█████████░` **91,2% (145/159)** | **14 sets** |
| Habilidades de sets | `████████░░` **84,3% (134/159)** | **25 sets** |
| Habilidades por pieza | `░░░░░░░░░░` **0% (0/690)** | **690 piezas** |
| Materiales por pieza | `░░░░░░░░░░` **0,7% (5/690)** | **685 piezas** |
| Datos de habilidades de charms | `█████████░` **97,8% (181/185)** | **4 entradas especiales sin habilidad publicable** |
| Visor 3D | **Pendiente** | No hay modelos locales detectados |

> Las decoraciones de Wilds aparecen sin materiales de forja **a propósito**: la fuente confirmó que no se fabrican con partes de monstruo. No lo cuento como deuda.

## Gráfico de deuda prioritaria

```text
Wilds: habilidades por pieza       100% pendiente  ██████████
Wilds: materiales por pieza          99% pendiente  ██████████
Wilds: charms (habilidades)           2% pendiente  ░░░░░░░░░░
MHFU: fotos de sets                  29% pendiente  ███░░░░░░░
Rise: rareza de armas                 13% pendiente  █░░░░░░░░░
MHFU: renders de piezas                3% pendiente  ░░░░░░░░░░
Wilds: materiales de sets              9% pendiente  ░░░░░░░░░░
``` 

## Lectura rápida

1. **La base de monstruos está sólida:** Rise está documentado como 78/78 y las tres bases tienen hitzones y debilidades completas.
2. **La deuda visual más visible está en MHFU:** faltan 115 fotos de sets y 55 renders de piezas.
3. **La deuda de datos más grande está en Wilds:** piezas de armadura sin habilidades/materiales y charms todavía con estructura vacía.
4. **La deuda transversal es el 3D:** el visor y los modelos están trabajados en MHFU; Rise y Wilds todavía no tienen una colección equivalente.

## Orden recomendado para llegar al completionismo

1. Completar datos de charms de Wilds.
2. Desglosar habilidades y materiales por pieza en Wilds.
3. Completar materiales/habilidades faltantes de sets de Wilds.
4. Recuperar fotos de sets y renders de piezas de MHFU.
5. Resolver las 522 rarezas de armas pendientes de Rise.
6. Auditar enlaces, iconos y traducciones y luego extender el visor 3D a Rise/Wilds.

No hay un porcentaje global único honesto todavía: mezclar monstruos, iconos, armaduras, datos y modelos exigiría decidir pesos arbitrarios. Este informe deja cada porcentaje trazable y actualizable.
