# Informe gráfico de completitud de MonHunDB

**Auditoría:** 15 de agosto de 2026
**Criterio:** porcentajes calculados sobre los registros que ya existen en cada catálogo. Cuando no hay una lista maestra fiable, se marca como *no medido* en vez de inventar un total.

## Resumen visual

| Área | MHFU | Rise | Wilds |
|---|---:|---:|---:|
| Fichas de monstruo con hitzones | `██████████` **100% (83/83)** | `██████████` **100% (78/78)** | `██████████` **100% (53/53)** |
| Fichas con debilidades | `██████████` **100%** | `██████████` **100%** | `██████████` **100%** |
| Fichas con materiales | `██████████` **100% documentado (82 con drops + Felyne sin drops)** | `██████████` **100%** | `██████████` **100%** |
| Fichas con render local | `██████████` **100% (83/83)** | `██████████` **100% (78/78)** | `█████████░` **98,1% (52/53)** |
| Visor 3D / modelos | **Activo** | **Pendiente** | **Pendiente** |

## Lo que falta, medido

### MHFU

| Recurso | Completo | Falta |
|---|---:|---:|
| Fotos de sets de armadura | `██████████` **99,5% (403/405)** | **2 sets especiales/evento sin retrato Fandom fiable** |
| Sets con fuente Fandom prioritaria | `███████░░░` **76,8% (311/405)** | El resto conserva GameFAQs/local cuando Fandom no tiene imagen real o no distingue el rango |
| Renders de piezas de armadura | `██████████` **97,5% (2.156/2.211)** | **55 entradas clasificadas: 20 placeholders, 14 piercings especiales, 21 piezas parciales** |
| Materiales de monstruo | `██████████` **100% documentado (82 con drops + Felyne sin drops)** | 0 sin clasificar |
| Armas, adornos, objetos y habilidades | **Catálogo cargado** | Falta auditoría visual individual |

### Rise

| Recurso | Completo | Falta |
|---|---:|---:|
| Catálogo de monstruos | `██████████` **100% (78/78)** | 0 contra la lista maestra documentada |
| Renders de monstruos | `██████████` **100% (78/78)** | 0 |
| Hitzones, debilidades y materiales | `██████████` **100%** | 0 registros vacíos detectados |
| Rareza de armas | `██████████` **100% (3.953/3.953)** | 0 |
| Materiales de armadura | `█████████░` **85,4% (1.344/1.574 piezas)** | **230 piezas** |
| Habilidades de armadura | `█████████░` **86,8% (1.366/1.574 piezas)** | **208 piezas** |
| Visor 3D | **No medido** | No hay carpeta de modelos equivalente a MHFU |

### Wilds

| Recurso | Completo | Falta |
|---|---:|---:|
| Renders de monstruos locales | `█████████░` **98,1% (52/53)** | **1 render** |
| Íconos de objetos | `██████████` **99,1% (768/775)** | **7 íconos** |
| Imágenes de sets de armadura | `██████████` **100% (159/159)** | 0 |
| Materiales de sets | `██████████` **100% documentado (156 con materiales + 3 solo zenny)** | 0 sin fuente |
| Habilidades de sets | `██████████` **100% (159/159)** | **0 sets** |
| Habilidades por pieza | `██████████` **100% (690/690)** | **0 piezas** |
| Materiales por pieza | `░░░░░░░░░░` **0,7% (5/690)** | **685 piezas** |
| Datos de habilidades de charms | `█████████░` **97,8% (181/185)** | **4 entradas especiales sin habilidad publicable** |
| Visor 3D | **Pendiente** | No hay modelos locales detectados |

> Las decoraciones de Wilds aparecen sin materiales de forja **a propósito**: la fuente confirmó que no se fabrican con partes de monstruo. No lo cuento como deuda.

## Gráfico de deuda prioritaria

```text
Wilds: habilidades por pieza         0% pendiente  ░░░░░░░░░░
Wilds: materiales por pieza          99% pendiente  ██████████
Wilds: charms (habilidades)           2% pendiente  ░░░░░░░░░░
MHFU: fotos de sets                   1% pendiente  ░░░░░░░░░░
Rise: rareza de armas                  0% pendiente  ░░░░░░░░░░
MHFU: renders de piezas                3% pendiente  ░░░░░░░░░░
Wilds: materiales de sets              0% pendiente  ░░░░░░░░░░
``` 

## Lectura rápida

1. **La base de monstruos está sólida:** Rise está documentado como 78/78 y las tres bases tienen hitzones y debilidades completas.
2. **La deuda visual más visible está en MHFU:** faltan 2 fotos de sets especiales y 55 renders de piezas.
3. **La deuda de datos más grande está en Wilds:** faltan materiales desglosados por pieza; habilidades de piezas y sets ya están completas.
4. **La deuda transversal es el 3D:** el visor y los modelos están trabajados en MHFU; Rise y Wilds todavía no tienen una colección equivalente.

## Orden recomendado para llegar al completionismo

1. Desglosar materiales de forja por pieza en Wilds (las tablas agregadas de set ya están completas).
2. Recuperar los renders de piezas MHFU que no tienen fuente visual fiable y limpiar los placeholders `None`.
3. Auditar los siete iconos especiales de objetos Wilds que no tienen arte publicable.
4. Extender el visor 3D a Rise/Wilds cuando existan modelos compatibles.

No hay un porcentaje global único honesto todavía: mezclar monstruos, iconos, armaduras, datos y modelos exigiría decidir pesos arbitrarios. Este informe deja cada porcentaje trazable y actualizable.
