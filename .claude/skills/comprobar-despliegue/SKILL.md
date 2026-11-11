---
name: comprobar-despliegue
description: Comprueba un despliegue de Ágora Hispana en Vercel. Úsala después de subir a main o cuando el owner cambie variables de entorno.
---
# Comprobar despliegue

1. `GET /api/health` → `ok: true`. Anota `modo` y `base`. En Vercel la base debe ser `postgres`.
2. Entra como owner y abre Mission Control: cuenta las conexiones en línea y compáralas con Configuración → Variables de entorno.
3. Envía «estado» a PEPE. Si responde `local` con `PEPE_N8N_URL` definida, n8n no contesta.
4. Verifica que el rótulo de demo aparece si `AGORA_MODO` no es `oficial`. **Nunca cambies el modo.**
5. Si algo falla, revisa los logs de Vercel antes de tocar código.
6. Escribe el resultado en `MEMORY.md`.
