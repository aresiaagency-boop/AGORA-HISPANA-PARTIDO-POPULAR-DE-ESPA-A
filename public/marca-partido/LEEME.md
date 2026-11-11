# Marca del partido

Esta carpeta está vacía a propósito.

Aquí van el logotipo y el icono oficiales **solo** cuando el partido haya
autorizado por escrito el uso de su marca (documento archivado en
`docs/autorizacion/`) y haya entregado sus archivos: versión vectorial y versión
para fondo oscuro, según su manual de identidad.

Para activarlos, el OWNER:

1. Copia los archivos aquí (por ejemplo `logo.svg` e `icono.png`).
2. Define en Vercel `MARCA_PARTIDO_LOGO=/marca-partido/logo.svg` y
   `MARCA_PARTIDO_ICONO=/marca-partido/icono.png`.
3. Cambia `AGORA_MODO=oficial`.

En modo demo estos archivos no se muestran aunque existan.
