import { esEquipo, sesion } from '@/lib/auth';
import { estadoVivo } from '@/lib/estado';
import { json } from '@/lib/guardias';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!esEquipo(await sesion())) return json({ error: 'Sin sesión de equipo.' }, 401);
  return json(await estadoVivo());
}
