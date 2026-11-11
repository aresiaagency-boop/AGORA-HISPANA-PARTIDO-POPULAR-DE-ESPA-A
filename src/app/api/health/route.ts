import { motor } from '@/lib/db';
import { json } from '@/lib/guardias';
import { MODO } from '@/lib/modo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const m = await motor();
    await m.query('SELECT 1');
    return json({ ok: true, modo: MODO, base: m.tipo });
  } catch {
    return json({ ok: false, modo: MODO }, 503);
  }
}
