# Desarrollo local y modo admin

## Lanzamiento

Ejecutar `run-local.bat` desde la raíz del proyecto inicia los dos servicios:

- Bestiario: `http://localhost:3000`
- VecMon: `http://localhost:5055`

Cada servicio queda en su propia ventana CMD. Cerrar esa ventana detiene el
proceso correspondiente; no hace falta mantener servidores activos cuando no
se está trabajando.

Cada ventana tiene un encabezado ASCII para reconocerla rápidamente: `VECMON`
para el editor y `MONHUNDB` para el servidor del bestiario.

## VecMon · Admin local

El enlace **VecMon · Admin local** solo se inyecta cuando el bestiario se abre
desde `localhost` o `127.0.0.1`. Aparece en el home y en la navegación de Rise,
MHFU y Wilds, y abre VecMon en una pestaña nueva.

El botón **Editar snippet en VecMon** solo aparece para monstruos que ya tienen
una silueta de hitzones y sus datos de debilidades cargados. Envía el snippet y
la imagen al puente local de VecMon para continuar editándolos.

Esto es una herramienta administrativa local: no se muestra en GitHub Pages y
no forma parte de la experiencia pública del sitio.
