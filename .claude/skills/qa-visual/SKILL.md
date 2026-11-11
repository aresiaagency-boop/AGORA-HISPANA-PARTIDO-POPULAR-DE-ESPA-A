---
name: qa-visual
description: Revisión visual de Ágora Hispana con capturas reales en escritorio, tablet y móvil. Úsala después de cualquier cambio de interfaz y antes de dar por buena una pantalla.
---
# QA visual

1. Compila: `npm run build`.
2. Arranca con variables de prueba en línea (no escribas `.env`):
   `AUTH_SECRET=$(openssl rand -hex 24) OWNER_EMAIL=owner@agora.invalid OWNER_PASSWORD=$(openssl rand -hex 12) APP_ORIGEN=http://localhost:3000 npx next start -p 3000`
   y, en la misma shell, `node scripts/capturas.mjs`.
3. Abre las imágenes de `artifacts/capturas/` y responde a las cinco preguntas de `docs/referencias/mission-control.md`.
4. El script falla si hay errores de consola. Un fallo es un bloqueo, no un aviso.
5. Corrige, repite y anota en `MEMORY.md` lo que hayas aprendido.

Ver → comparar → detectar → corregir. Un log de texto no sirve para aprobar una interfaz.
