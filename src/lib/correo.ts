// HERMES: envío por la API de Gmail con el token cifrado de la conexión.
import { q, uno } from './db';
import { cifradoListo, descifrar, firmaBaja } from './auth';
import { ORIGEN, MARCA, RESPONSABLE } from './modo';

export const listaPrueba = () =>
  (process.env.CORREO_LISTA_PRUEBA ?? '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);

async function tokenAcceso(): Promise<string | null> {
  const c = await uno<{ token_cifrado: string | null; estado: string }>(`SELECT token_cifrado, estado FROM conexiones WHERE canal = 'gmail'`);
  if (!c?.token_cifrado || c.estado !== 'conectado' || !cifradoListo()) return null;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '', client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: descifrar(c.token_cifrado), grant_type: 'refresh_token',
    }),
  });
  if (!r.ok) {
    await q(`UPDATE conexiones SET estado = 'caducada', detalle = 'Google rechazó el token. Hay que volver a autorizar.', actualizada = now() WHERE canal = 'gmail'`);
    return null;
  }
  return ((await r.json()) as { access_token: string }).access_token;
}

export const gmailConectado = async () => (await tokenAcceso()) !== null;

export const enlaceBaja = (email: string) => `${ORIGEN}/baja?e=${encodeURIComponent(email)}&t=${firmaBaja(email)}`;

const pie = (email: string) =>
  `\n\n—\n${MARCA}. Responsable: ${RESPONSABLE}.\nRecibes este correo porque diste tu consentimiento. Baja en un clic: ${enlaceBaja(email)}`;

export async function enviarGmail(para: string, asunto: string, cuerpo: string): Promise<{ ok: boolean; detalle: string }> {
  const token = await tokenAcceso();
  if (!token) return { ok: false, detalle: 'PENDIENTE_CREDENCIALES' };
  const mime = [
    `To: ${para}`,
    `Subject: =?UTF-8?B?${Buffer.from(asunto).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    `List-Unsubscribe: <${enlaceBaja(para)}>`,
    '',
    cuerpo + pie(para),
  ].join('\r\n');
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw: Buffer.from(mime).toString('base64url') }),
  });
  return r.ok ? { ok: true, detalle: 'enviado' } : { ok: false, detalle: `Gmail respondió ${r.status}` };
}
