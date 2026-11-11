// Hueco de «marca del partido». Vacío en demo, siempre. En modo oficial muestra
// los archivos que entregue el partido, colocados por el OWNER en
// public/marca-partido/ y declarados en MARCA_PARTIDO_LOGO / MARCA_PARTIDO_ICONO.
// El agente no dibuja, copia ni activa la marca de un tercero. Ver CLAUDE.md.
import { esDemo } from './modo';

const valida = (v?: string) => (v && /^\/marca-partido\/[\w.-]+\.(svg|png|webp)$/.test(v) ? v : null);

export const LOGO_PARTIDO = esDemo ? null : valida(process.env.MARCA_PARTIDO_LOGO);
export const ICONO_PARTIDO = esDemo ? null : valida(process.env.MARCA_PARTIDO_ICONO);
