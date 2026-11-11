// Alta: identidad por Google (ya en la sesión), datos mínimos, una casilla por
// finalidad y, si la persona quiere, su manifestación de interés en afiliarse
// con firma electrónica. La afiliación la formaliza el partido, no esta app.
import { randomBytes } from 'node:crypto';
import { mismoOrigen, puedeVerPublico, sesion, sha256 } from '@/lib/auth';
import { auditar, q, uno } from '@/lib/db';
import { json } from '@/lib/guardias';
import { esDemo } from '@/lib/modo';
import { FINALIDADES, INTERESES, MANIFESTACION, MUNICIPIOS, VERSION_TEXTOS, type Finalidad } from '@/lib/textos';
import { PAISES_HISPANOAMERICANOS } from '@/lib/voto';

export async function POST(req: Request) {
  if (!mismoOrigen(req)) return json({ error: 'Origen no permitido.' }, 403);
  const s = await sesion();
  if (!s || !puedeVerPublico(s)) return json({ error: 'Identifícate con Google para continuar.' }, 401);
  const p = (await req.json().catch(() => ({}))) as Record<string, any>;

  const nombre = String(p.nombre ?? '').trim().replace(/\s+/g, ' ');
  if (nombre.length < 5 || !nombre.includes(' ')) return json({ error: 'Escribe tu nombre y tus apellidos.' }, 400);
  const municipio = MUNICIPIOS.includes(p.municipio) ? p.municipio : null;
  const pais = PAISES_HISPANOAMERICANOS.includes(p.pais) || p.pais === 'España' || p.pais === 'Otro' ? p.pais : null;
  const intereses = (Array.isArray(p.intereses) ? p.intereses : []).filter((x: unknown) => INTERESES.includes(x as string));
  const finalidades = Object.keys(FINALIDADES) as Finalidad[];
  const otorgadas = finalidades.filter((f) => p.finalidades?.[f] === true);
  if (!otorgadas.length) return json({ error: 'Marca al menos una finalidad. Sin tu consentimiento no guardamos nada.' }, 400);

  const quiereAfiliarse = p.interesAfiliacion === true;
  if (quiereAfiliarse) {
    const firma = String(p.firmaNombre ?? '').trim().replace(/\s+/g, ' ');
    if (firma.toLowerCase() !== nombre.toLowerCase()) return json({ error: 'La firma tiene que coincidir con tu nombre y apellidos.' }, 400);
    if (p.aceptaFirma !== true) return json({ error: 'Confirma que has leído la manifestación antes de firmarla.' }, 400);
  }

  const padrino = p.invitacion ? await uno('SELECT id FROM personas WHERE codigo_invitacion = $1 AND baja IS NULL', [String(p.invitacion)]) : null;
  const persona = await uno(
    `INSERT INTO personas (email, nombre, municipio, pais_origen, intereses, interes_afiliacion, codigo_invitacion, invitado_por, es_demo)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)
     ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, municipio = EXCLUDED.municipio, pais_origen = EXCLUDED.pais_origen,
       intereses = EXCLUDED.intereses, interes_afiliacion = EXCLUDED.interes_afiliacion, baja = NULL
     RETURNING id, codigo_invitacion`,
    [s.email, nombre, municipio, pais, JSON.stringify(intereses), quiereAfiliarse, randomBytes(5).toString('hex'), padrino?.id ?? null, esDemo],
  );
  for (const f of finalidades) {
    await q(`INSERT INTO consentimientos (persona_id, finalidad, otorgado, texto_version, texto_hash, origen) VALUES ($1,$2,$3,$4,$5,'alta-web')`, [
      persona!.id, f, otorgadas.includes(f), VERSION_TEXTOS, sha256(FINALIDADES[f]),
    ]);
  }
  let firmaId: string | null = null;
  if (quiereAfiliarse) {
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
    const f = await uno(
      `INSERT INTO firmas (persona_id, documento, version, texto_hash, nombre_firmante, metodo, ip_hash, agente)
       VALUES ($1,'manifestacion_interes_afiliacion',$2,$3,$4,$7,$5,$6) RETURNING id`,
      [persona!.id, VERSION_TEXTOS, sha256(MANIFESTACION), nombre, ip ? sha256(`${process.env.AUTH_SECRET}:${ip}`) : null, (req.headers.get('user-agent') ?? '').slice(0, 200),
        s.via === 'google' ? 'Identidad Google (OIDC) + nombre tecleado + casilla' : 'Sesión del owner (prueba) + nombre tecleado + casilla'],
    );
    firmaId = f!.id;
  }
  await auditar('persona', 'alta', 'comunidad', { persona: persona!.id, finalidades: otorgadas, firma: firmaId });
  return json({ ok: true, codigo_invitacion: persona!.codigo_invitacion, firma: firmaId, version: VERSION_TEXTOS });
}
