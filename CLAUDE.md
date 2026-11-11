# ÁGORA HISPANA — guía para agentes

Plataforma viva de la comunidad hispanoamericana de Baleares, construida como
**propuesta para el Partido Popular**. Orquestador: **PEPE**. Sección estrella:
**Estudio Viral**. Lee también `MEMORY.md` (estado y aprendizajes) y `AGENTS.md`
(esta versión de Next.js tiene cambios: consulta `node_modules/next/dist/docs/`).

## Stack
- Next.js 16 (App Router) · React 19 · TypeScript estricto · Node 22 · Vercel (despliega al subir a `main`).
- PostgreSQL en EasyPanel con `pg`. Sin `DATABASE_URL`, y solo en demo, base en memoria (PGlite) que se siembra sola.
- n8n aloja a PEPE (`infrastructure/n8n/pepe.workflow.json`, generado). El backend es la única puerta a los datos.
- vidIQ investiga y publica · Higgsfield produce vídeo · Gmail API envía. Todo pasa por una persona antes de salir.
- Sin dependencias de interfaz: CSS propio en `src/app/globals.css`.

## Comandos
| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Desarrollo local |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run eval` | Evaluaciones de `eval/*.jsonl` |
| `npm run build` | Compilación de producción |
| `npm run check` | typecheck + eval + build. **Obligatorio antes de cada commit** |
| `npm run n8n` | Regenera el flujo de PEPE (`APP_ORIGEN=https://… npm run n8n`) |
| `node scripts/capturas.mjs` | QA visual con capturas (escritorio, tablet, móvil) |

## Mapa
- `src/lib/secciones.ts` — catálogo de secciones 00–20 y operaciones. Única fuente del menú.
- `src/lib/operaciones.ts` — manejadores de cada operación (`MANEJADORES`).
- `src/lib/estudio.ts` — ranking, rúbrica de hooks, límites duros, generador de guiones. Determinista.
- `src/lib/voto.ts` — motor «¿Puedo votar?» con reglas del INE. Determinista.
- `src/lib/estado.ts` + `src/components/MissionControl.tsx` — estado vivo y su pantalla.
- `src/lib/esquema.ts` — migraciones (se aplican solas). `src/lib/semilla.ts` — datos de demo.
- `src/app/api/v1/…` — API. `src/app/consola/…` — consola del equipo.

## Estilo de código
- Español en nombres de dominio, textos y comentarios. Comentarios solo para explicar el porqué.
- Servidor por defecto; `'use client'` solo donde hay interacción.
- SQL parametrizado siempre. JSONB como `JSON.stringify(x)` con `::jsonb`. Contar con `count(*)::int`. Sin `int8` ni `numeric` (pg y PGlite difieren).
- Un cambio de esquema es una migración nueva en `MIGRACIONES`; nunca se edita una aplicada.
- Toda operación que cambia algo llama a `auditar()`.
- Diseño: sistema «cristal de diamante con filo de plasma» (`globals.css`, `Reactor.tsx`). Táctil primero: objetivos de 46 px, nada depende de pasar el ratón. Respeta `prefers-reduced-motion`.
- Nada que se mueva en pantalla es decorado: cada pulso y contador sale de un dato real.

## Archivos prohibidos
- `.env*`, claves, tokens o contraseñas: nunca en el repositorio, el chat, los logs ni las capturas.
- `pinData` en flujos de n8n. La plantilla original traía un teléfono y una clave reales: no vuelven a entrar.
- `docs/autorizacion/*` — lo gestiona solo el OWNER.
- `public/marca-partido/*` — solo archivos oficiales entregados por el partido, colocados por el OWNER.
- Imágenes de terceros (la referencia de Mission Control es de banco de imágenes: se describe, no se copia).

## Líneas que no se cruzan
1. **Modo.** `AGORA_MODO=demo` por defecto: marca «ÁGORA HISPANA», rótulo «Demo · propuesta para el Partido Popular · no oficial», todo tras el acceso del equipo, publicación simulada y correo solo a la lista de prueba. `oficial` lo activa **solo el OWNER**, con la autorización escrita del partido archivada en `docs/autorizacion/`. Un agente nunca cambia el modo.
2. **Marca del partido.** No se dibuja, copia ni muestra en demo: ni logotipo, ni icono, ni favicon. El hueco existe (`src/lib/marca-partido.ts`) y se enciende solo en oficial.
3. **Puerta humana.** Ninguna pieza se publica y ningún correo se envía sin aprobación de una persona, registrada en `aprobaciones`.
4. **Nada a cambio.** Ni sorteos, ni regalos, ni descuentos, ni servicios de otras empresas de los promotores (BUROFAST, BUROINSTANT u otras) a cambio de alta, afiliación, militancia, voto o invitaciones. Los datos no se comparten con esas empresas. La sección Embajadores es reconocimiento simbólico. `/servicios` es un directorio informativo abierto a cualquiera, con aviso de titularidad, sin ventajas por afiliarse y sin cesión de datos: no se convierte en incentivo ni se condiciona a nada.
5. **Personas reales.** Sin voz, imagen ni palabras sintéticas de dirigentes ni de nadie. Ningún agente habla como un político. Testimonios solo reales, con permiso archivado.
6. **Autenticidad.** Sin cuentas satélite, identidades falsas ni comentarios simulados. El contenido generado con IA se etiqueta.
7. **Colectivos.** Ningún contenido señala o denigra a un grupo por su origen.
8. **Datos.** Consentimiento por finalidad, sin premarcar. No se guarda la situación migratoria ni se deduce ideología. La baja se ejecuta siempre.
9. **Verdad.** Un dato de voto o de trámite sale de una ficha verificada con fuente, o no sale. `[VERIFICAR]` bloquea la publicación.

## Reglas de revisión
- `npm run check` en verde. Los evals nuevos acompañan a cada regla nueva.
- Si el cambio toca una pantalla: capturas en escritorio (1440×900), tablet (1180×820 y 820×1180) y móvil (390×844), y comparación con `docs/referencias/mission-control.md`.
- Maker y Verifier son agentes distintos: quien hace el cambio no lo da por bueno. El Verifier arranca la app, ejecuta evals y capturas, y revisa logs.
- Trabajo en paralelo: un worktree por agente (`git worktree add ../agora-<tarea> -b <rama>`).
- Modelo según el trabajo: Fable 5 planifica · Sonnet edita en masa · Haiku puntúa evals · Opus para casos difíciles.
- Cada sesión termina actualizando `MEMORY.md`.

## Rutinas previstas
- CI falla → triage. · PR abierta → revisión (Verifier). · 07:00 → resumen: plazos cívicos, piezas por aprobar, radar.
- Lunes → radar de vidIQ (skill `radar-vidiq`, presupuesto de créditos en `MEMORY.md`).
