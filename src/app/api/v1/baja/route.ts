import { bajaValida } from '@/lib/auth';
import { json } from '@/lib/guardias';
import { MANEJADORES } from '@/lib/operaciones';

// La baja es un derecho: funciona sin sesión, con el enlace firmado del correo.
export async function POST(req: Request) {
  const { e, t } = (await req.json().catch(() => ({}))) as { e?: string; t?: string };
  if (!e || !t || !bajaValida(e, t)) return json({ error: 'El enlace de baja no es válido.' }, 400);
  try {
    await MANEJADORES['05.03']({ email: e }, { actor: 'titular', rol: 'persona' });
  } catch { /* si no existe, la respuesta es la misma */ }
  return json({ ok: true });
}
