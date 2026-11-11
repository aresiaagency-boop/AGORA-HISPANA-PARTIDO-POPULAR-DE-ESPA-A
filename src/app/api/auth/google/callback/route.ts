import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { abrir, canjearGoogle, cifrar, cifradoListo, COOKIE, COOKIE_OAUTH, esEquipo, opcionesCookie, rolDe, sellar, sesion, type EstadoOAuth } from '@/lib/auth';
import { auditar, q } from '@/lib/db';
import { esDemo } from '@/lib/modo';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ir = (ruta: string) => { const r = NextResponse.redirect(new URL(ruta, req.url)); r.cookies.delete(COOKIE_OAUTH); return r; };
  const e = abrir<EstadoOAuth>((await cookies()).get(COOKIE_OAUTH)?.value);
  const code = url.searchParams.get('code');
  if (!e || !code || url.searchParams.get('state') !== e.estado) return ir('/entrar?error=google');

  let g: Awaited<ReturnType<typeof canjearGoogle>>;
  try { g = await canjearGoogle(code, e); } catch { return ir('/entrar?error=google'); }
  const rol = rolDe(g.email);

  if (e.proposito === 'gmail') {
    if (!esEquipo(await sesion())) return ir('/entrar');
    if (!g.refresh || !cifradoListo()) {
      await q(`UPDATE conexiones SET estado = 'pendiente', detalle = $1, actualizada = now() WHERE canal = 'gmail'`, [
        cifradoListo() ? 'Google no devolvió el permiso de envío. Vuelve a autorizar.' : 'Falta DATA_ENCRYPTION_KEY para guardar el permiso cifrado.',
      ]);
      return ir('/consola/correo');
    }
    await q(`UPDATE conexiones SET estado = 'conectado', cuenta = $1, token_cifrado = $2, detalle = 'Autorizado para redactar y enviar.', actualizada = now() WHERE canal = 'gmail'`, [g.email, cifrar(g.refresh)]);
    await auditar(g.email, 'conectar', 'gmail', {});
    return ir('/consola/correo');
  }

  // En demo solo entra el equipo, también por la puerta de alta.
  if (esDemo && rol === 'persona') return ir('/entrar?error=demo');
  await auditar(rol === 'persona' ? 'persona' : g.email, 'entrar', 'acceso', { via: 'google', proposito: e.proposito });
  const r = ir(e.proposito === 'alta' || rol === 'persona' ? '/alta' : '/consola');
  r.cookies.set(COOKIE, sellar({ email: g.email.toLowerCase(), nombre: g.nombre, rol, via: 'google' }, 43200), opcionesCookie(43200));
  return r;
}
