# Acciones que solo puede hacer el owner

Ordenadas. Cada una desbloquea una conexión de Mission Control.

1. **GitHub.** Dar acceso al repositorio a la app de Claude: https://github.com/apps/claude/installations/select_target. Sin esto no se puede subir el código.
2. **Vercel.** Definir las variables de `docs/variables-entorno.md` y redesplegar. Empezar por `AUTH_SECRET`, `APP_ORIGEN`, `OWNER_EMAIL`, `OWNER_PASSWORD` y `DATABASE_URL`.
3. **EasyPanel · PostgreSQL.** Crear un rol y una base para la app y usar esa cadena en `DATABASE_URL`. Las tablas se crean solas en el primer arranque.
4. **Google Cloud (`agorahispanapp`).** Pantalla de consentimiento, cliente OAuth web con la URI de redirección, y API de Gmail activada. Los permisos de Gmail (`gmail.send`, `gmail.compose`) son restringidos: en pruebas, añadir la cuenta de Ágora como usuario de prueba.
5. **Gmail de Ágora.** Con la app desplegada: Correo → «Conectar el Gmail de Ágora», entrando con la cuenta de Ágora.
6. **n8n.** Regenerar el flujo con la URL real (`APP_ORIGEN=https://… npm run n8n`), importarlo, crear dos credenciales *Header Auth* (`x-agora-token` = token; `Authorization` = `Bearer ` + token), asignar las de OpenAI y Postgres, activarlo y poner su URL en `PEPE_N8N_URL`.
7. **Rotar la clave de Evolution API** que venía en la plantilla original de WhatsApp. Estuvo en un archivo compartido.
8. **Cuentas sociales.** Crear Instagram, página de Facebook y TikTok con la marca Ágora Hispana y enlazarlas en vidIQ. Hasta que haya autorización del partido, no usan su nombre ni su logotipo.
9. **Responsable de datos.** Decidir qué entidad responde de los datos y ponerla en `RESPONSABLE_TRATAMIENTO` antes de abrir el alta a personas reales. Como se tratan opiniones políticas, hace falta evaluación de impacto.
10. **Autorización del partido.** Cuando exista por escrito: archivarla en `docs/autorizacion/`, colocar los archivos de marca que entregue el partido y cambiar `AGORA_MODO=oficial`.
