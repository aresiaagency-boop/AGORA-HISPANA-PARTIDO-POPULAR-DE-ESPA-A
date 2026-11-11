// Estado vivo de la plataforma: lo que pinta Mission Control cada pocos segundos.
import { q, uno, motor } from './db';
import { MODO } from './modo';
import { googleListo, authLista, cifradoListo } from './auth';
import { PLAZOS, ELECCIONES } from './voto';

export type EstadoCanal = 'conectado' | 'sesion_agente' | 'pendiente' | 'apagado' | 'caducada' | 'sin_respuesta';

export interface Conexion {
  canal: string; nombre: string; via: string; estado: EstadoCanal; cuenta: string | null; detalle: string | null; eventos: number;
}

export interface EstadoVivo {
  modo: string;
  ahora: string;
  kpis: { personas: number; consentimientos: number; senales: number; oportunidades: number; pendientes: number; publicaciones: number; correos: number; conversaciones: number; altas7d: number; firmas: number };
  conexiones: Conexion[];
  actividad: { id: number; actor: string; accion: string; objeto: string; creada: string }[];
  pulso: { pepe: number; estudio: number; total: number };
  pendientes: { tipo: string; id: number; titulo: string }[];
  radar: number[];
  puntuaciones: number[];
  plazos: { nombre: string; fecha: string }[];
  embudo: { etapa: string; n: number }[];
  bajas: number;
}

let n8nCache: { t: number; ok: boolean } | null = null;
async function n8nVivo(): Promise<boolean | null> {
  const url = process.env.PEPE_N8N_URL;
  if (!url) return null;
  if (n8nCache && Date.now() - n8nCache.t < 30000) return n8nCache.ok;
  let ok = false;
  try { ok = (await fetch(new URL('/healthz', url), { signal: AbortSignal.timeout(1500) })).ok; } catch { ok = false; }
  n8nCache = { t: Date.now(), ok };
  return ok;
}

const n = async (sql: string) => (await uno<{ n: number }>(sql))?.n ?? 0;

export async function estadoVivo(): Promise<EstadoVivo> {
  const base = await motor();
  const filas = await q<Conexion>('SELECT canal, nombre, via, estado, cuenta, detalle FROM conexiones ORDER BY canal');
  const eventos = await q<{ objeto: string; n: number }>(`SELECT objeto, count(*)::int AS n FROM registro_auditoria WHERE creada > now() - interval '10 minutes' GROUP BY objeto`);
  const ev = (o: string) => eventos.find((e) => e.objeto === o)?.n ?? 0;
  const vivo = await n8nVivo();

  const conexiones: Conexion[] = [
    {
      canal: 'basedatos', nombre: 'Base de datos', via: base.tipo === 'postgres' ? 'PostgreSQL · EasyPanel' : 'Memoria (demo)',
      estado: 'conectado', cuenta: null, eventos: eventos.reduce((a, e) => a + e.n, 0),
      detalle: base.tipo === 'postgres' ? 'Persistente.' : 'Sin DATABASE_URL: los datos no persisten entre reinicios.',
    },
    {
      canal: 'google', nombre: 'Acceso Google', via: 'OIDC · PKCE', estado: googleListo() && authLista() ? 'conectado' : 'pendiente', cuenta: null, eventos: ev('acceso'),
      detalle: googleListo() ? 'Cliente OAuth configurado.' : 'Faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.',
    },
    ...filas.map((c) => {
      const x = { ...c, eventos: ev(c.canal === 'n8n' ? 'pepe' : c.canal === 'vidiq' ? 'estudio-viral' : c.canal) };
      if (c.canal === 'n8n' && vivo !== null) return { ...x, estado: (vivo ? 'conectado' : 'sin_respuesta') as EstadoCanal, detalle: vivo ? 'n8n responde.' : 'n8n no responde: PEPE sigue en modo local.' };
      if (c.canal === 'gmail' && c.estado === 'conectado' && !cifradoListo()) return { ...x, estado: 'pendiente' as EstadoCanal, detalle: 'Falta DATA_ENCRYPTION_KEY.' };
      return x;
    }),
  ];

  const piezas = await q<{ id: number; titulo: string }>(`SELECT id, titulo FROM piezas WHERE estado = 'pendiente_aprobacion' ORDER BY id`);
  const correos = await q<{ id: number; asunto: string }>(`SELECT id, asunto FROM correos WHERE estado = 'borrador' ORDER BY id`);
  const act = await q<{ id: number; actor: string; accion: string; objeto: string; creada: Date }>('SELECT id, actor, accion, objeto, creada FROM registro_auditoria ORDER BY id DESC LIMIT 9');

  return {
    modo: MODO,
    ahora: new Date().toISOString(),
    kpis: {
      personas: await n('SELECT count(*)::int AS n FROM personas WHERE baja IS NULL'),
      consentimientos: await n('SELECT count(*)::int AS n FROM consentimientos WHERE otorgado'),
      senales: await n('SELECT count(*)::int AS n FROM senales'),
      oportunidades: await n(`SELECT count(*)::int AS n FROM oportunidades WHERE estado = 'producir'`),
      pendientes: piezas.length + correos.length,
      publicaciones: await n('SELECT count(*)::int AS n FROM publicaciones'),
      correos: await n('SELECT count(*)::int AS n FROM correos'),
      conversaciones: await n('SELECT count(*)::int AS n FROM conversaciones'),
      altas7d: await n(`SELECT count(*)::int AS n FROM personas WHERE baja IS NULL AND creada > now() - interval '7 days'`),
      firmas: await n('SELECT count(*)::int AS n FROM personas WHERE baja IS NULL AND interes_afiliacion'),
    },
    conexiones,
    actividad: act.map((a) => ({ ...a, creada: new Date(a.creada).toISOString() })),
    pulso: { pepe: ev('pepe'), estudio: ev('estudio-viral') + ev('higgsfield') + ev('instagram') + ev('facebook') + ev('tiktok'), total: eventos.reduce((a, e) => a + e.n, 0) },
    pendientes: [...piezas.map((p) => ({ tipo: 'pieza', id: p.id, titulo: p.titulo })), ...correos.map((c) => ({ tipo: 'correo', id: c.id, titulo: c.asunto }))],
    radar: (await q<{ multiplicador: number }>('SELECT multiplicador FROM senales ORDER BY multiplicador DESC')).map((s) => s.multiplicador),
    puntuaciones: (await q<{ puntuacion: number }>('SELECT puntuacion FROM oportunidades ORDER BY puntuacion DESC')).map((o) => o.puntuacion),
    embudo: [
      { etapa: 'Perfiles creados', n: await n('SELECT count(*)::int AS n FROM personas WHERE baja IS NULL') },
      { etapa: 'Aceptan comunicaciones', n: await n(`SELECT count(*)::int AS n FROM personas p WHERE p.baja IS NULL AND (SELECT c.otorgado FROM consentimientos c WHERE c.persona_id = p.id AND c.finalidad = 'comunicaciones_politicas' ORDER BY c.id DESC LIMIT 1)`) },
      { etapa: 'Voluntariado', n: await n(`SELECT count(*)::int AS n FROM personas p WHERE p.baja IS NULL AND (SELECT c.otorgado FROM consentimientos c WHERE c.persona_id = p.id AND c.finalidad = 'voluntariado' ORDER BY c.id DESC LIMIT 1)`) },
      { etapa: 'Interés en afiliarse', n: await n('SELECT count(*)::int AS n FROM personas WHERE baja IS NULL AND interes_afiliacion') },
      { etapa: 'Llegaron por invitación', n: await n('SELECT count(*)::int AS n FROM personas WHERE baja IS NULL AND invitado_por IS NOT NULL') },
    ],
    bajas: await n('SELECT count(*)::int AS n FROM personas WHERE baja IS NOT NULL'),
    plazos: [
      { nombre: 'Elecciones generales', fecha: `${ELECCIONES.generales}T09:00:00+01:00` },
      { nombre: 'Abre el censo de extranjeros', fecha: `${PLAZOS.acuerdoDesde}T00:00:00+01:00` },
      { nombre: 'Cierra el plazo de ciudadanos UE', fecha: `${PLAZOS.ueHasta}T23:59:59+01:00` },
      { nombre: 'Cierra el censo de extranjeros', fecha: `${PLAZOS.acuerdoHasta}T23:59:59+01:00` },
      { nombre: 'Municipales y Parlament', fecha: `${ELECCIONES.municipales}T09:00:00+02:00` },
    ],
  };
}
