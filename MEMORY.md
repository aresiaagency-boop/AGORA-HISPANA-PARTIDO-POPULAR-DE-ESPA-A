# MEMORY — ÁGORA HISPANA

## Hechos verificados
- 2026-11-10 · `npm run check` pasa: typecheck, 45 evals (voto 16, hooks 8, límites 13, ranking 5, guiones 3) y build de Next 16.4.6.
- 2026-11-10 · La app arranca en demo sin `DATABASE_URL` (PGlite en memoria) con `next start`. `/api/health` → `{ok:true, modo:"demo", base:"memoria"}`.
- 2026-11-10 · QA visual sin errores de consola en escritorio, tablet horizontal, tablet vertical y móvil (`scripts/capturas.mjs`).
- Next 16: `params`, `searchParams` y `cookies()` son asíncronos. `export const dynamic` sigue siendo válido porque no usamos Cache Components. `middleware` se llama `proxy` (no lo usamos: la guardia va en páginas y rutas).
- vidIQ (conector): `vidiq_instagram_tiktok_outlier_search` cuesta 5 créditos; `vidiq_watch_shortform_content`, 10. Saldo tras el primer radar: 140 de 150 al mes. Sin cuentas sociales enlazadas. Publicar y ver métricas propias exige la sesión de vidIQ del owner.
- Primer radar (10 nov 2026): 11 outliers en español. La utilidad sobre trámites supera a la opinión. Patrones P1 (pregunta que ya se hacen), P2 (explicador animado), P3 (relato migrante sin filtro).
- La plantilla `AgenteWhatsapp.json` traía en `pinData` un teléfono real y una clave de Evolution API. El origen saneado no los contiene. **El owner debe rotar esa clave.**
- Entorno de agente: Playwright global en `/opt/npm-tools/node_modules`, Chrome en `/usr/bin/google-chrome`. La shell no llega a Vercel, n8n ni EasyPanel: eso se configura desde el navegador del owner.
- Un hook del entorno bloquea escribir `.env*` desde la shell: las variables de prueba se pasan en línea al comando.

- 2026-11-11 · Dominio de producción en Vercel: `agorahispanapp.vercel.app` (visto en el panel; sin despliegue porque el repositorio sigue vacío). El flujo de n8n ya está generado con esa URL.
- 2026-11-11 · Añadidos: alta en embudo con progreso, `/mi-espacio`, sección 21 Cumplimiento, Mission Control simétrico con embudo de usuarios, difusión de publicaciones (operación 19.06, en borrador), modelo de PEPE configurable (`PEPE_MODELO`).

## Intentos fallidos (no repetir)
- Mapa de conexiones con `viewBox` fijo: etiquetas ilegibles en escritorio y móvil. Sustituido por geometría a tamaño real del contenedor (`plano()`), con dos columnas en estrecho.
- Firma HMAC verificada en un nodo Code de n8n: exige `crypto`, que n8n bloquea por defecto. Sustituido por credencial Header Auth en el webhook.
- Brillo exterior en los cristales con `box-shadow` o `filter`: `clip-path` lo recorta. El filo de plasma va como fondo del propio cristal y el brillo, por dentro.
- `git push`: rechazado mientras la app de GitHub de Claude no tenga acceso al repositorio.

## Decisiones tomadas
- No hay persona de ningún dirigente político: el rol constructor es «Director de Construcción».
- No hay sección de incentivos con BUROFAST/BUROINSTANT. En su lugar, Embajadores (enlace personal, reconocimiento simbólico).
- El logotipo del partido no entra en demo ni como favicon. Hueco preparado para modo oficial.
- Alta: Google OIDC → datos mínimos → consentimiento por finalidad → manifestación de interés en afiliarse con firma electrónica (huella del texto, versión, fecha, método). La afiliación la formaliza el partido.
- Sin cuenta VIP de BUROFAST como incentivo (segunda petición, misma decisión). El logo central es la marca propia de Ágora, no un derivado del logo del partido.
- WhatsApp apagado por defecto (política de WhatsApp y riesgo de bloqueo).

## Sin verificar todavía
- PGlite empaquetado en Vercel (en producción se usará PostgreSQL; la memoria es solo para demo local).
- Importación de `pepe.workflow.json` en la instancia de n8n: generado sin poder ejecutarlo. Comprobar en la interfaz, sobre todo las cuatro herramientas HTTP (`$fromAI`).
- API de servidor de Higgsfield: la producción se hace desde la sesión de agente (MCP) y se registra con la operación 07.12.
- Ficha «regularizacion-un-ano»: en borrador con `[VERIFICAR]`. Es la segunda señal más fuerte del radar; hace falta fuente oficial.

## Última sesión — 2026-11-10
Construida la beta completa: consola con 21 secciones, Mission Control en vivo con cristal de diamante y filo de plasma táctil, Estudio Viral F1–F9, PEPE local y flujo de n8n, alta con OAuth y firma, Correo (HERMES), Embajadores, evals y QA visual.

## Próximos pasos
1. Owner: dar acceso al repositorio a la app de GitHub de Claude y subir a `main`.
2. Owner: variables en Vercel (`docs/variables-entorno.md`) y pasos de `docs/acciones-owner.md`.
3. Importar el flujo en n8n, crear las dos credenciales Header Auth y probar con «estado».
4. Crear y enlazar en vidIQ las cuentas de Instagram, Facebook y TikTok de Ágora.
5. Verificar la ficha de la regularización y producir la primera pieza real (oportunidad de 91 puntos) con Higgsfield, previa aprobación de créditos.
6. Convertir en Routines: resumen de las 07:00 y radar semanal.

## Sesión — 2026-11-11
- Añadido: alta en embudo con progreso y porcentaje, espacio del usuario (`/mi-espacio`), sección 21 Cumplimiento, Mission Control simétrico con embudo de usuarios y marca Ágora en el núcleo, difusión de cada publicación por correo (borrador, operación 19.06) y modelo de PEPE configurable (`PEPE_MODELO`, por defecto gpt-4.1).
- Rechazado de nuevo: cuenta VIP de BUROFAST como incentivo y logo central basado en el del partido.
- Las referencias legales de Cumplimiento están sin revisar por jurista.
