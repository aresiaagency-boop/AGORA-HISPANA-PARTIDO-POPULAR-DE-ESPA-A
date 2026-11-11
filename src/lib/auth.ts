// Sesión propia firmada con HMAC, Google OIDC hecho a mano (PKCE + state + nonce)
// y cifrado de tokens. Sin AUTH_SECRET no entra nadie: no hay secreto por defecto.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { ORIGEN, esDemo } from './modo';

export type Rol = 'owner' | 'equipo' | 'persona';
export interface Sesion { email: string; nombre: string; rol: Rol; via: 'google' | 'clave'; exp: number }

export const COOKIE = 'agora_sesion';
export const COOKIE_OAUTH = 'agora_oauth';

const secreto = () => process.env.AUTH_SECRET ?? '';
export const authLista = () => secreto().length >= 16;
export const googleListo = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const claveListo = () => !!(process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD);

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const firma = (d: string) => createHmac('sha256', secreto()).update(d).digest('base64url');

export function sellar(obj: object, segundos: number): string {
  const cuerpo = Buffer.from(JSON.stringify({ ...obj, exp: Date.now() + segundos * 1000 })).toString('base64url');
  return `${cuerpo}.${firma(cuerpo)}`;
}

export function abrir<T extends { exp: number }>(token?: string): T | null {
  if (!token || !authLista()) return null;
  const [cuerpo, f] = token.split('.');
  if (!cuerpo || !f) return null;
  const a = Buffer.from(f);
  const b = Buffer.from(firma(cuerpo));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(cuerpo, 'base64url').toString()) as T;
    return obj.exp > Date.now() ? obj : null;
  } catch { return null; }
}

export async function sesion(): Promise<Sesion | null> {
  return abrir<Sesion>((await cookies()).get(COOKIE)?.value);
}

export function rolDe(email: string): Rol {
  const e = email.toLowerCase();
  if (e === (process.env.OWNER_EMAIL ?? '').toLowerCase()) return 'owner';
  const equipo = (process.env.EQUIPO_EMAILS ?? '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  return equipo.includes(e) ? 'equipo' : 'persona';
}

export const esEquipo = (s: Sesion | null): s is Sesion => !!s && (s.rol === 'owner' || s.rol === 'equipo');

// En demo toda la aplicación va tras la sesión del equipo.
export const puedeVerPublico = (s: Sesion | null) => !esDemo || esEquipo(s);

export const opcionesCookie = (segundos: number) => ({
  httpOnly: true, sameSite: 'lax' as const, secure: ORIGEN.startsWith('https'), path: '/', maxAge: segundos,
});

export function claveCorrecta(email: string, clave: string): boolean {
  if (!claveListo()) return false;
  const ok = (x: string, y: string) => timingSafeEqual(Buffer.from(sha256(x)), Buffer.from(sha256(y)));
  return ok(email.toLowerCase(), process.env.OWNER_EMAIL!.toLowerCase()) && ok(clave, process.env.OWNER_PASSWORD!);
}

// ---------- Cifrado de tokens (AES-256-GCM) ----------
const clave = () => createHash('sha256').update(process.env.DATA_ENCRYPTION_KEY ?? '').digest();
export const cifradoListo = () => (process.env.DATA_ENCRYPTION_KEY ?? '').length >= 16;

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', clave(), iv);
  const datos = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), datos].map((b) => b.toString('base64url')).join('.');
}

export function descifrar(sellado: string): string {
  const [iv, tag, datos] = sellado.split('.').map((x) => Buffer.from(x, 'base64url'));
  const d = createDecipheriv('aes-256-gcm', clave(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString('utf8');
}

// ---------- Google OIDC ----------
export type Proposito = 'entrar' | 'alta' | 'gmail';
export interface EstadoOAuth { estado: string; verificador: string; nonce: string; proposito: Proposito; exp: number }

const SCOPES: Record<Proposito, string> = {
  entrar: 'openid email profile',
  alta: 'openid email profile',
  gmail: 'openid email https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose',
};

export const REDIRECT = `${ORIGEN}/api/auth/google/callback`;

export function inicioGoogle(proposito: Proposito): { url: string; cookie: string } {
  const estado = randomBytes(16).toString('base64url');
  const verificador = randomBytes(32).toString('base64url');
  const nonce = randomBytes(16).toString('base64url');
  const reto = createHash('sha256').update(verificador).digest('base64url');
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPES[proposito],
    state: estado,
    nonce,
    code_challenge: reto,
    code_challenge_method: 'S256',
  });
  if (proposito === 'gmail') { p.set('access_type', 'offline'); p.set('prompt', 'consent'); }
  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${p}`,
    cookie: sellar({ estado, verificador, nonce, proposito }, 600),
  };
}

export async function canjearGoogle(code: string, e: EstadoOAuth) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: REDIRECT, grant_type: 'authorization_code', code_verifier: e.verificador,
    }),
  });
  if (!r.ok) throw new Error('Google rechazó el código de acceso.');
  const t = (await r.json()) as { id_token: string; refresh_token?: string };
  const datos = JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url').toString()) as {
    aud: string; iss: string; nonce?: string; email?: string; email_verified?: boolean; name?: string; exp: number;
  };
  const emisorOk = datos.iss === 'https://accounts.google.com' || datos.iss === 'accounts.google.com';
  if (datos.aud !== process.env.GOOGLE_CLIENT_ID || !emisorOk || datos.nonce !== e.nonce || !datos.email || !datos.email_verified) {
    throw new Error('La identidad de Google no supera la verificación.');
  }
  return { email: datos.email, nombre: datos.name ?? datos.email, refresh: t.refresh_token ?? null };
}

// ---------- Baja firmada y control de origen ----------
// El enlace de baja lleva una firma: nadie puede dar de baja a otra persona.
export const firmaBaja = (email: string) => createHmac('sha256', secreto()).update(`baja:${email.toLowerCase()}`).digest('base64url').slice(0, 32);

export function bajaValida(email: string, t: string): boolean {
  if (!authLista() || !email || !t) return false;
  const a = Buffer.from(t);
  const b = Buffer.from(firmaBaja(email));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Las peticiones que cambian algo tienen que venir de la propia aplicación.
export function mismoOrigen(req: Request): boolean {
  const origen = req.headers.get('origin');
  if (!origen) return false;
  try { return new URL(origen).host === (req.headers.get('x-forwarded-host') ?? req.headers.get('host')); } catch { return false; }
}
