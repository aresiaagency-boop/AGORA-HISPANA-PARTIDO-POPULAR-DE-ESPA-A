import { NextResponse } from 'next/server';
import { authLista, COOKIE_OAUTH, esEquipo, googleListo, inicioGoogle, opcionesCookie, sesion, type Proposito } from '@/lib/auth';

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams.get('proposito');
  const proposito: Proposito = p === 'alta' || p === 'gmail' ? p : 'entrar';
  if (!googleListo() || !authLista()) return NextResponse.redirect(new URL('/entrar?error=google', req.url));
  // Conectar el Gmail de Ágora es una acción del equipo.
  if (proposito === 'gmail' && !esEquipo(await sesion())) return NextResponse.redirect(new URL('/entrar', req.url));
  const { url, cookie } = inicioGoogle(proposito);
  const r = NextResponse.redirect(url);
  r.cookies.set(COOKIE_OAUTH, cookie, opcionesCookie(600));
  return r;
}
