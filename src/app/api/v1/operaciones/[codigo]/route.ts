import { esEquipo, mismoOrigen, puedeVerPublico, sesion } from '@/lib/auth';
import { json } from '@/lib/guardias';
import { MANEJADORES } from '@/lib/operaciones';
import { OPS_PUBLICAS } from '@/lib/secciones';

export async function POST(req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const manejador = MANEJADORES[codigo];
  if (!manejador) return json({ error: `La operación ${codigo} no existe.` }, 404);
  if (!mismoOrigen(req)) return json({ error: 'Origen no permitido.' }, 403);
  const s = await sesion();
  const publica = OPS_PUBLICAS.has(codigo) && puedeVerPublico(s);
  if (!esEquipo(s) && !publica) return json({ error: 'Sin sesión de equipo.' }, 401);
  let payload: unknown = {};
  try { payload = await req.json(); } catch { /* sin cuerpo */ }
  try {
    return json({ ok: true, codigo, resultado: await manejador(payload ?? {}, { actor: s?.email ?? 'anonimo', rol: s?.rol ?? 'anonimo' }) });
  } catch (e) {
    return json({ ok: false, codigo, error: e instanceof Error ? e.message : 'Error inesperado.' }, 400);
  }
}
