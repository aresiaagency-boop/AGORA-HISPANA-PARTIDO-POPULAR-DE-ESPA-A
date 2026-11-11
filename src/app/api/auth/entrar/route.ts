import { NextResponse } from 'next/server';
import { claveCorrecta, COOKIE, mismoOrigen, opcionesCookie, sellar } from '@/lib/auth';
import { auditar } from '@/lib/db';

// Freno de intentos en memoria: cinco fallos por IP cada diez minutos.
const fallos = new Map<string, { n: number; t: number }>();

export async function POST(req: Request) {
  const ir = (ruta: string) => NextResponse.redirect(new URL(ruta, req.url), 303);
  if (!mismoOrigen(req)) return ir('/entrar?error=origen');
  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
  const f = fallos.get(ip);
  if (f && f.n >= 5 && Date.now() - f.t < 600000) return ir('/entrar?error=intentos');
  const datos = await req.formData();
  const email = String(datos.get('email') ?? '').trim();
  if (!claveCorrecta(email, String(datos.get('clave') ?? ''))) {
    fallos.set(ip, { n: f && Date.now() - f.t < 600000 ? f.n + 1 : 1, t: Date.now() });
    return ir('/entrar?error=credenciales');
  }
  fallos.delete(ip);
  await auditar('owner', 'entrar', 'acceso', { via: 'clave' });
  const r = ir('/consola');
  r.cookies.set(COOKIE, sellar({ email: email.toLowerCase(), nombre: 'Owner', rol: 'owner', via: 'clave' }, 43200), opcionesCookie(43200));
  return r;
}
