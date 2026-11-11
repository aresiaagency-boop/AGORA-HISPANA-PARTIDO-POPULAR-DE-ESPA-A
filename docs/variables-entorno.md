# Variables de entorno

Se definen en Vercel (Settings → Environment Variables). Los valores los pega el owner: nunca van al repositorio ni al chat.

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `AGORA_MODO` | no | `demo` (por defecto) u `oficial`. Solo el owner pone `oficial`, con la autorización del partido archivada. |
| `APP_ORIGEN` | sí | URL pública, sin barra final. Se usa en OAuth y en los enlaces de baja. |
| `AUTH_SECRET` | sí | Firma de sesiones. 32 caracteres aleatorios o más. Sin ella no entra nadie. |
| `DATABASE_URL` | sí en Vercel | Cadena de PostgreSQL de EasyPanel. Usa un rol propio de la app, no el superusuario. |
| `DATABASE_SSL` | no | `off` si el servidor no ofrece TLS. |
| `DATA_ENCRYPTION_KEY` | para Gmail | Cifra el permiso de Gmail en la base. 32 caracteres o más. |
| `OWNER_EMAIL` · `OWNER_PASSWORD` | recomendado | Acceso del owner sin depender de Google. |
| `EQUIPO_EMAILS` | no | Correos del equipo separados por comas. Entran con Google. |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` | para alta y Gmail | Cliente OAuth web del proyecto `agorahispanapp`. |
| `RESPONSABLE_TRATAMIENTO` | antes de datos reales | Quién responde de los datos (nombre y NIF). |
| `CORREO_LISTA_PRUEBA` | no | En demo, únicas direcciones que reciben correo. |
| `PEPE_N8N_URL` | para n8n | URL de producción del webhook `pepe-app`. |
| `PEPE_N8N_TOKEN` | para n8n | Secreto compartido con n8n. 32 caracteres o más. |
| `MARCA_PARTIDO_LOGO` · `MARCA_PARTIDO_ICONO` | solo oficial | Rutas dentro de `/marca-partido/`. Ver `public/marca-partido/LEEME.md`. |

URI de redirección de OAuth: `<APP_ORIGEN>/api/auth/google/callback`.
