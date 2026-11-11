import { esEquipo, mismoOrigen, puedeVerPublico, sesion, sha256 } from '@/lib/auth';
import { json } from '@/lib/guardias';
import { pepe } from '@/lib/pepe';

const ritmo = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  if (!mismoOrigen(req)) return json({ error: 'Origen no permitido.' }, 403);
  const s = await sesion();
  if (!puedeVerPublico(s)) return json({ error: 'Sin sesión.' }, 401);
  const { mensaje } = (await req.json().catch(() => ({}))) as { mensaje?: string };
  if (!mensaje || !mensaje.trim()) return json({ error: 'Mensaje vacío.' }, 400);
  const id = sha256(s?.email ?? (req.headers.get('x-forwarded-for') ?? 'anonimo')).slice(0, 16);
  const r = ritmo.get(id);
  if (r && Date.now() - r.t < 60000 && r.n >= 20) return json({ error: 'Vas muy rápido. Espera un minuto.' }, 429);
  ritmo.set(id, r && Date.now() - r.t < 60000 ? { n: r.n + 1, t: r.t } : { n: 1, t: Date.now() });
  return json(await pepe(mensaje, { sesion: id, equipo: esEquipo(s), actor: s?.email ?? 'anonimo' }));
}
