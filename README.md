# ÁGORA HISPANA

Plataforma viva de la comunidad hispanoamericana de Baleares. **Demo de una propuesta para el Partido Popular: no es un producto oficial del partido.**

- **Mission Control**: todas las conexiones en tiempo real, en una interfaz de cristal de diamante con filo de plasma, pensada para tablet.
- **PEPE**: orquestador conversacional (n8n o modo local).
- **Estudio Viral**: radar de vidIQ → patrones → ranking → guion → producción con Higgsfield → aprobación humana → publicación → aprendizaje.
- **Alta**: Google OAuth, consentimiento por finalidad y manifestación de interés en afiliarse con firma electrónica.
- **Correo (HERMES)**, **Embajadores**, **Programa**, **¿Puedo votar?** y el resto de secciones 00–20.

## Arranque local
```bash
npm install
AUTH_SECRET=$(openssl rand -hex 24) OWNER_EMAIL=tu@correo OWNER_PASSWORD='una-clave-larga' npm run dev
```
Sin `DATABASE_URL` usa una base en memoria con datos de demostración. Entra en http://localhost:3000.

## Comprobación
```bash
npm run check                 # typecheck + evals + build
node scripts/capturas.mjs     # QA visual (necesita la app arrancada y OWNER_EMAIL / OWNER_PASSWORD)
```

## Documentación
`CLAUDE.md` (reglas y líneas rojas) · `MEMORY.md` (estado) · `docs/variables-entorno.md` · `docs/acciones-owner.md` · `docs/PROMPT_MAESTRO.md` · `docs/referencias/mission-control.md`
