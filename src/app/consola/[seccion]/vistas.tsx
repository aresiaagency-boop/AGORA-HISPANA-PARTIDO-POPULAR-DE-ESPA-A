// Vistas de cada sección. Todas leen de la base: no hay datos pintados a mano.
import Link from 'next/link';
import { q } from '@/lib/db';
import { authLista, cifradoListo, claveListo, googleListo } from '@/lib/auth';
import { listaPrueba } from '@/lib/correo';
import { LOGO_PARTIDO } from '@/lib/marca-partido';
import { MODO, esDemo, RESPONSABLE } from '@/lib/modo';
import { ELECCIONES, PAISES_ACUERDO, PAISES_HISPANOAMERICANOS, PLAZOS } from '@/lib/voto';
import { VERSION_TEXTOS } from '@/lib/textos';
import type { Seccion } from '@/lib/secciones';
import Accion from '@/components/Accion';
import ChatPepe from '@/components/ChatPepe';
import FormVoto from '@/components/FormVoto';

const fecha = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' });
const ETQ: Record<string, string> = { conectado: 'EN LÍNEA', sesion_agente: 'SESIÓN DE AGENTE', pendiente: 'PENDIENTE', apagado: 'APAGADO', caducada: 'CADUCADA' };
const Panel = ({ titulo, meta, children, sin }: { titulo: string; meta?: string; children: React.ReactNode; sin?: boolean }) => (
  <section className="panel"><div className="panel-cab"><h3>{titulo}</h3>{meta && <span className="meta">{meta}</span>}</div><div className={`panel-cuerpo ${sin ? 'sin desliza' : 'pila'}`}>{children}</div></section>
);

async function Programa() {
  const fichas = await q('SELECT * FROM fichas ORDER BY estado DESC, ambito, titulo');
  return (
    <Panel titulo="Fichas del programa" meta={`${fichas.filter((f) => f.estado === 'publicada').length} verificadas · ${fichas.filter((f) => f.estado !== 'publicada').length} en borrador`}>
      <p className="nota">Cada ficha dice qué es (ley vigente, propuesta o medida del Govern), cómo afecta hoy y de dónde sale. Las fricciones también se cuentan. Lo que no está aquí, PEPE no lo afirma.</p>
      <div className="dos">{fichas.map((f) => (
        <div key={f.id} className="tarjeta">
          <div className="linea" style={{ justifyContent: 'space-between' }}><span className="chip c-sesion_agente">{f.etiqueta}</span><span className={`chip ${f.estado === 'publicada' ? 'c-conectado' : 'c-pendiente'}`}>{f.estado === 'publicada' ? 'Verificada' : 'Sin verificar'}</span></div>
          <h2>{f.titulo}</h2><p>{f.que_dice}</p>
          <p className="tenue"><b>Hoy:</b> {f.efecto_hoy}</p><p className="tenue"><b>A futuro:</b> {f.efecto_futuro}</p>
          <p className="tenue"><b>Lectura:</b> {f.lectura} · {(f.perfiles as string[]).join(', ')}</p>
          <p className="tenue">Fuente: <a href={f.fuente_url} target="_blank" rel="noreferrer">{f.fuente_titulo}</a> · revisada {f.revisada}</p>
        </div>
      ))}</div>
    </Panel>
  );
}

async function MiCamino() {
  return (
    <div className="dos">
      <Panel titulo="¿Puedo votar?" meta="motor determinista · sin modelo"><FormVoto paises={PAISES_HISPANOAMERICANOS} /></Panel>
      <Panel titulo="Plazos y reglas" meta="fuente: INE">
        <p>Municipales y Parlament: <b className="mono">{ELECCIONES.municipales}</b>. Generales: <b className="mono">{ELECCIONES.generales}</b>.</p>
        <p>Inscripción en el censo de extranjeros (países con acuerdo): del <b className="mono">{PLAZOS.acuerdoDesde}</b> al <b className="mono">{PLAZOS.acuerdoHasta}</b>. Ciudadanos de la UE: hasta el <b className="mono">{PLAZOS.ueHasta}</b>.</p>
        <table className="tabla"><thead><tr><th>País con acuerdo</th><th className="num">Años de residencia legal</th></tr></thead>
          <tbody>{Object.entries(PAISES_ACUERDO).map(([p, a]) => <tr key={p}><td>{p}</td><td className="num">{a}</td></tr>)}</tbody></table>
        <p className="tenue">Página pública: <Link href="/puedo-votar">/puedo-votar</Link>. Las respuestas no se guardan.</p>
      </Panel>
    </div>
  );
}

async function Comunidad() {
  const [personas, firmas] = await Promise.all([
    q(`SELECT p.*, (SELECT string_agg(x.finalidad, ', ') FROM (SELECT DISTINCT ON (finalidad) finalidad, otorgado FROM consentimientos WHERE persona_id = p.id ORDER BY finalidad, id DESC) x WHERE x.otorgado) AS finalidades FROM personas p ORDER BY p.creada`),
    q('SELECT f.id, f.documento, f.version, f.nombre_firmante, f.metodo, f.creada FROM firmas f ORDER BY f.creada DESC'),
  ]);
  return (
    <>
      <Panel titulo="Personas" meta={`${personas.filter((p) => !p.baja).length} activas · textos ${VERSION_TEXTOS}`} sin>
        <table className="tabla"><thead><tr><th>Nombre</th><th>Municipio</th><th>Origen</th><th>Finalidades consentidas</th><th>Interés en afiliarse</th><th>Estado</th></tr></thead>
          <tbody>{personas.map((p) => <tr key={p.id}><td>{p.nombre}{p.es_demo && <span className="tenue"> · prueba</span>}</td><td>{p.municipio ?? '—'}</td><td>{p.pais_origen ?? '—'}</td><td className="tenue">{p.finalidades ?? 'ninguna'}</td><td>{p.interes_afiliacion ? 'Sí' : 'No'}</td>
            <td><span className={`chip ${p.baja ? 'c-caducada' : 'c-conectado'}`}>{p.baja ? 'Baja' : 'Activa'}</span></td></tr>)}</tbody></table>
      </Panel>
      <div className="dos">
        <Panel titulo="Manifestaciones firmadas" meta={`${firmas.length}`}>
          {!firmas.length && <p className="tenue">Ninguna todavía. Se firman en el alta (/alta), tras identificarse con Google.</p>}
          {firmas.map((f) => <div key={f.id} className="tarjeta"><h2>{f.nombre_firmante}</h2><span className="tenue mono">{String(f.id).slice(0, 8)} · {f.version} · {fecha.format(new Date(f.creada))}</span><span className="tenue">{f.metodo}</span></div>)}
          <p className="nota">Es una manifestación de interés: la afiliación la decide y la formaliza el partido. Nadie recibe nada a cambio y ningún servicio depende de ella.</p>
        </Panel>
        <Panel titulo="Reglas de datos">
          <p className="nota">Responsable: {RESPONSABLE}.</p>
          <p className="tenue">Una casilla por finalidad, sin premarcar. Se guarda la versión y la huella del texto exacto que vio cada persona.</p>
          <p className="tenue">No se guarda la situación migratoria ni se deduce la ideología. Los datos no se comparten con otras empresas de los promotores.</p>
          <p className="tenue">La baja vale para todos los canales y se ejecuta siempre.</p>
          <p><Link className="boton" href="/alta">Abrir el alta</Link></p>
        </Panel>
      </div>
    </>
  );
}

async function Correo() {
  const [con, correos] = await Promise.all([q(`SELECT * FROM conexiones WHERE canal = 'gmail'`), q('SELECT * FROM correos ORDER BY id DESC')]);
  const c = con[0]; const prueba = listaPrueba();
  return (
    <>
      <Panel titulo="HERMES · Gmail de Ágora" meta={c.via}>
        <div className="linea"><span className={`chip c-${c.estado}`}>{ETQ[c.estado] ?? c.estado}</span>{c.cuenta && <span className="mono">{c.cuenta}</span>}<span className="tenue">{c.detalle}</span></div>
        {googleListo() && cifradoListo()
          ? <div><a className="boton primario" href="/api/auth/google?proposito=gmail">{c.estado === 'conectado' ? 'Volver a autorizar Gmail' : 'Conectar el Gmail de Ágora'}</a></div>
          : <p className="nota aviso">Para conectar hacen falta GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y DATA_ENCRYPTION_KEY. Ver docs/acciones-owner.md.</p>}
        <p className="nota">{esDemo ? `Demo: los envíos van solo a la lista de prueba (${prueba.length} direcciones). Sin lista, el envío se simula y se registra.` : 'Oficial: solo reciben correo las personas con consentimiento vigente para comunicaciones políticas.'} Cada correo lleva su enlace de baja firmado.</p>
      </Panel>
      <Panel titulo="Correos" meta={`${correos.length}`}>
        {correos.map((m) => (
          <div key={m.id} className="tarjeta">
            <div className="linea" style={{ justifyContent: 'space-between' }}><h2>Correo {m.id} · {m.asunto}</h2><span className={`chip ${m.estado === 'borrador' ? 'c-pendiente' : m.estado === 'rechazado' ? 'c-caducada' : 'c-conectado'}`}>{m.estado}</span></div>
            <pre className="json" style={{ color: 'var(--texto)', fontFamily: 'var(--sans)', fontSize: 13 }}>{m.cuerpo}</pre>
            {m.estado !== 'borrador' && m.estado !== 'aprobado' && m.estado !== 'rechazado' && <p className="tenue mono">{JSON.stringify(m.resultado)}</p>}
            <div className="linea">
              {m.estado === 'borrador' && <><Accion codigo="19.04" payload={{ correo_id: m.id, decision: 'aprobar' }} etiqueta="Aprobar" clase="primario" /><Accion codigo="19.04" payload={{ correo_id: m.id, decision: 'rechazar' }} etiqueta="Rechazar" clase="peligro" campo={{ nombre: 'motivo', etiqueta: 'Motivo' }} /></>}
              {m.estado === 'aprobado' && <Accion codigo="19.05" payload={{ correo_id: m.id }} etiqueta={esDemo ? 'Enviar a la lista de prueba' : 'Enviar'} clase="primario" />}
            </div>
          </div>
        ))}
      </Panel>
    </>
  );
}

async function Pepe() {
  const [con, conv] = await Promise.all([q(`SELECT * FROM conexiones WHERE canal IN ('n8n','whatsapp') ORDER BY canal`), q('SELECT * FROM conversaciones ORDER BY id DESC LIMIT 12')]);
  return (
    <div className="dos">
      <Panel titulo="Hablar con PEPE" meta={process.env.PEPE_N8N_URL ? 'n8n' : 'modo local'}><ChatPepe sugerencias={['Estado', '¿Qué espera aprobación?', 'Ranking', '¿Puedo votar?']} /></Panel>
      <div className="pila">
        <Panel titulo="Orquestación">
          {con.map((c) => <div key={c.canal} className="linea" style={{ justifyContent: 'space-between' }}><span><b>{c.nombre}</b> <span className="tenue">· {c.via}</span></span><span className={`chip c-${c.estado}`}>{ETQ[c.estado] ?? c.estado}</span></div>)}
          <p className="nota">El flujo de n8n se genera con <span className="mono">npm run n8n</span> a partir de la plantilla del agente de WhatsApp, sin datos fijados ni claves. PEPE solo lee fichas, calcula el voto, registra propuestas y escala. No aprueba, no publica y no envía.</p>
          <p className="nota aviso">WhatsApp queda apagado: su política excluye a partidos y campañas, y la vía no oficial arriesga el bloqueo del número.</p>
        </Panel>
        <Panel titulo="Últimas conversaciones" meta={`${conv.length}`} sin>
          <table className="tabla"><thead><tr><th>Canal</th><th>Entrada</th><th>Herramienta</th><th className="num">Hora</th></tr></thead>
            <tbody>{conv.map((c) => <tr key={c.id}><td>{c.canal}</td><td>{c.entrada}</td><td className="tenue mono">{c.herramienta ?? '—'}</td><td className="num">{fecha.format(new Date(c.creada))}</td></tr>)}</tbody></table>
        </Panel>
      </div>
    </div>
  );
}

async function Embajadores() {
  const filas = await q(`SELECT p.nombre, p.codigo_invitacion, p.es_demo, (SELECT count(*)::int FROM personas i WHERE i.invitado_por = p.id) AS altas FROM personas p WHERE p.baja IS NULL ORDER BY altas DESC, p.creada`);
  return (
    <Panel titulo="Invitaciones" meta="reconocimiento, no premio">
      <p className="nota">Cada persona tiene un enlace personal para invitar. El reconocimiento es público y simbólico. No hay regalos, descuentos ni servicios a cambio de afiliarse, de militar o de traer a otras personas: ofrecer algo a cambio de apoyo político puede ser delito electoral e invalida el consentimiento.</p>
      <div className="desliza"><table className="tabla"><thead><tr><th>Persona</th><th>Enlace</th><th className="num">Altas por su enlace</th></tr></thead>
        <tbody>{filas.map((f) => <tr key={f.codigo_invitacion}><td>{f.nombre}{f.es_demo && <span className="tenue"> · prueba</span>}</td><td className="mono">/alta?i={f.codigo_invitacion}</td><td className="num">{f.altas}</td></tr>)}</tbody></table></div>
    </Panel>
  );
}

async function Configuracion() {
  const con = await q('SELECT canal, nombre, via, estado, cuenta, detalle FROM conexiones ORDER BY canal');
  const vars: [string, boolean, string][] = [
    ['AGORA_MODO', true, MODO], ['APP_ORIGEN', !!process.env.APP_ORIGEN, 'URL pública'], ['AUTH_SECRET', authLista(), 'firma de sesiones'], ['DATABASE_URL', !!process.env.DATABASE_URL, 'PostgreSQL'],
    ['DATA_ENCRYPTION_KEY', cifradoListo(), 'cifrado de tokens'], ['OWNER_EMAIL · OWNER_PASSWORD', claveListo(), 'acceso del owner'], ['EQUIPO_EMAILS', !!process.env.EQUIPO_EMAILS, 'equipo'],
    ['GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET', googleListo(), 'acceso y Gmail'], ['RESPONSABLE_TRATAMIENTO', !!process.env.RESPONSABLE_TRATAMIENTO, 'protección de datos'],
    ['CORREO_LISTA_PRUEBA', listaPrueba().length > 0, 'envíos de prueba'], ['PEPE_N8N_URL · PEPE_N8N_TOKEN', !!(process.env.PEPE_N8N_URL && process.env.PEPE_N8N_TOKEN), 'orquestador'],
    ['MARCA_PARTIDO_LOGO', !!LOGO_PARTIDO, 'solo en oficial'],
  ];
  return (
    <>
      <div className="dos">
        <Panel titulo="Modo" meta={MODO}>
          <p>{esDemo ? 'Demo: marca Ágora Hispana, rótulo «no oficial», todo tras el acceso del equipo, publicación simulada y correo solo a la lista de prueba.' : 'Oficial: nombre completo, marca y cuentas del partido, envíos reales.'}</p>
          <p className="nota aviso">El modo oficial lo activa solo el owner, con la autorización escrita del partido archivada en docs/autorizacion/. Ningún agente cambia el modo.</p>
        </Panel>
        <Panel titulo="Variables de entorno" meta="nunca se muestran los valores" sin>
          <table className="tabla"><tbody>{vars.map(([v, ok, d]) => <tr key={v}><td className="mono">{v}</td><td className="tenue">{d}</td><td><span className={`chip ${ok ? 'c-conectado' : 'c-pendiente'}`}>{ok ? 'Definida' : 'Falta'}</span></td></tr>)}</tbody></table>
        </Panel>
      </div>
      <Panel titulo="Conexiones" meta={`${con.length}`} sin>
        <table className="tabla"><thead><tr><th>Canal</th><th>Vía</th><th>Estado</th><th>Cuenta</th><th>Detalle</th></tr></thead>
          <tbody>{con.map((c) => <tr key={c.canal}><td>{c.nombre}</td><td className="tenue mono">{c.via}</td><td><span className={`chip c-${c.estado}`}>{ETQ[c.estado] ?? c.estado}</span></td><td className="mono">{c.cuenta ?? '—'}</td><td className="tenue">{c.detalle}</td></tr>)}</tbody></table>
      </Panel>
      <Panel titulo="Límites que el sistema no cruza">
        <div className="dos">
          {['Ninguna pieza se publica y ningún correo sale sin que una persona lo apruebe.', 'Nada a cambio de apoyo, afiliación o voto: ni sorteos, ni regalos, ni servicios.', 'Sin voz ni imagen sintética de personas reales. Los testimonios son de personas reales con permiso archivado.',
            'Sin cuentas satélite, identidades falsas ni comentarios simulados.', 'Ningún contenido señala o denigra a un colectivo por su origen.', 'Los datos de voto y de trámites salen de una ficha verificada con fuente, o no salen.'].map((t) => <p key={t} className="nota">{t}</p>)}
        </div>
      </Panel>
    </>
  );
}

async function Agenda() {
  const actos = await q('SELECT * FROM actos ORDER BY fecha');
  return <Panel titulo="Actos" meta={`${actos.length}${esDemo ? ' · ficticios' : ''}`} sin><table className="tabla"><thead><tr><th>Acto</th><th>Municipio</th><th>Fecha</th><th>Lugar</th></tr></thead><tbody>{actos.map((a) => <tr key={a.id}><td>{a.titulo}</td><td>{a.municipio}</td><td className="mono">{a.fecha}</td><td className="tenue">{a.lugar}</td></tr>)}</tbody></table></Panel>;
}

async function Mediateca() {
  const medios = await q('SELECT * FROM medios ORDER BY id DESC');
  return (
    <Panel titulo="Material" meta={`${medios.length}`}>
      <p className="nota">Se registra desde Estudio Viral con la operación 07.14: autor, licencia y permiso de imagen. Lo que muestra a una persona identificable sin permiso archivado queda bloqueado.</p>
      {!medios.length && <p className="tenue">Sin material todavía.</p>}
      {medios.map((m) => <div key={m.id} className="linea" style={{ justifyContent: 'space-between' }}><span>{m.titulo} <span className="tenue">· {m.tipo} · {m.autor} · {m.licencia}</span></span><span className={`chip ${m.estado === 'disponible' ? 'c-conectado' : 'c-caducada'}`}>{m.estado}</span></div>)}
    </Panel>
  );
}

async function Propuestas({ estado, titulo }: { estado: string; titulo: string }) {
  const filas = await q('SELECT * FROM propuestas WHERE estado = $1 ORDER BY id DESC', [estado]);
  return <Panel titulo={titulo} meta={`${filas.length}`}>{!filas.length && <p className="tenue">Nada por ahora.</p>}{filas.map((f) => <div key={f.id} className="tarjeta"><p>{f.texto}</p><span className="tenue mono">{fecha.format(new Date(f.creada))}</span></div>)}</Panel>;
}

async function Analitica() {
  const [k] = await q(`SELECT (SELECT count(*)::int FROM personas WHERE baja IS NULL AND NOT es_demo) AS reales, (SELECT count(*)::int FROM personas WHERE es_demo) AS prueba,
    (SELECT count(*)::int FROM firmas) AS firmas, (SELECT count(*)::int FROM piezas) AS piezas, (SELECT count(*)::int FROM publicaciones WHERE NOT simulada) AS publicadas,
    (SELECT count(*)::int FROM correos WHERE estado = 'enviado') AS enviados, (SELECT count(*)::int FROM conversaciones) AS conversaciones, (SELECT count(*)::int FROM aprobaciones) AS aprobaciones`);
  const filas: [string, number][] = [['Personas reales registradas', k.reales], ['Personas de prueba', k.prueba], ['Manifestaciones firmadas', k.firmas], ['Piezas generadas', k.piezas], ['Publicaciones reales', k.publicadas], ['Correos enviados', k.enviados], ['Conversaciones con PEPE', k.conversaciones], ['Decisiones humanas registradas', k.aprobaciones]];
  return <Panel titulo="Indicadores verificables" meta="contados en la base, ahora"><div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>{filas.map(([t, v]) => <div key={t} className="kpi"><span>{t}</span><b>{v}</b></div>)}</div><p className="nota">Un dato que falta no es un cero: alcance, retención y conversión aparecerán cuando haya publicaciones reales y cuentas enlazadas.</p></Panel>;
}

async function Cumplimiento() {
  const [k] = await q(`SELECT (SELECT count(*)::int FROM aprobaciones) AS aprobaciones, (SELECT count(*)::int FROM registro_auditoria) AS auditoria,
    (SELECT count(*)::int FROM consentimientos) AS consentimientos, (SELECT count(*)::int FROM personas WHERE baja IS NOT NULL) AS bajas,
    (SELECT count(*)::int FROM piezas WHERE estado = 'bloqueada') AS bloqueadas, (SELECT count(*)::int FROM fichas WHERE estado <> 'publicada') AS sin_verificar`);
  const responsable = !!process.env.RESPONSABLE_TRATAMIENTO;
  const filas: [string, string, string, 'ok' | 'pendiente'][] = [
    ['Protección de datos', 'RGPD art. 9 y LOPDGDD: la opinión política es dato de categoría especial.', `Consentimiento explícito por finalidad, sin premarcar, con versión y huella del texto. ${k.consentimientos} registros.`, 'ok'],
    ['Responsable y delegado', 'RGPD arts. 24, 30, 35 y 37.', responsable ? 'Responsable designado.' : 'Falta designar al responsable, el registro de actividades, la evaluación de impacto y el delegado de protección de datos.', responsable ? 'ok' : 'pendiente'],
    ['Derechos de la persona', 'RGPD arts. 15 a 22.', `Baja en un clic con enlace firmado, válida para todos los canales. ${k.bajas} ejecutadas.`, 'ok'],
    ['Comunicaciones', 'LSSI art. 21 y LOPDGDD.', 'Solo a quien consintió, con identificación del remitente y baja en cada envío.', 'ok'],
    ['Régimen electoral', 'LOREG: prohibición de dádivas a cambio de voto y reglas de campaña.', 'El sistema bloquea cualquier oferta a cambio de apoyo, afiliación o voto. Publicidad y gasto de campaña: revisar con el partido.', 'ok'],
    ['Transparencia de IA', 'Reglamento (UE) 2024/1689, art. 50.', 'PEPE se identifica como IA. El contenido generado se etiqueta. Sin voz ni imagen sintética de personas reales.', 'ok'],
    ['IA y procesos electorales', 'Reglamento (UE) 2024/1689, anexo III.', 'La IA no decide a quién se dirige cada mensaje político ni perfila ideología. Clasificación de riesgo: pendiente de dictamen jurídico.', 'pendiente'],
    ['Supervisión humana', 'Puerta humana obligatoria.', `Ninguna pieza ni correo sale sin aprobación registrada. ${k.aprobaciones} decisiones humanas.`, 'ok'],
    ['Trazabilidad', 'Registro de auditoría.', `${k.auditoria} eventos registrados: quién hizo qué y cuándo.`, 'ok'],
    ['Veracidad', 'Fichas con fuente.', `${k.bloqueadas} piezas bloqueadas por límites · ${k.sin_verificar} fichas sin verificar que no pueden publicarse.`, 'ok'],
    ['Marca y representación', 'Uso del nombre y la marca del partido.', esDemo ? 'Demo: sin marca del partido. Falta la autorización escrita.' : 'Modo oficial activo.', esDemo ? 'pendiente' : 'ok'],
    ['WhatsApp', 'Política de WhatsApp Business.', 'Canal apagado. Abrirlo exige revisar su política sobre partidos y campañas y un consentimiento propio.', 'pendiente'],
  ];
  return (
    <>
      <Panel titulo="Garantías" meta={`${filas.filter((f) => f[3] === 'ok').length} de ${filas.length} cubiertas`} sin>
        <table className="tabla"><thead><tr><th>Ámbito</th><th>Norma</th><th>Cómo lo cumple el sistema</th><th>Estado</th></tr></thead>
          <tbody>{filas.map(([a, n, c, e]) => <tr key={a}><td><b>{a}</b></td><td className="tenue">{n}</td><td>{c}</td><td><span className={`chip ${e === 'ok' ? 'c-conectado' : 'c-pendiente'}`}>{e === 'ok' ? 'Cubierto' : 'Pendiente'}</span></td></tr>)}</tbody></table>
      </Panel>
      <Panel titulo="Alcance"><p className="nota aviso">Esta pantalla enseña los controles técnicos del sistema y lo que falta. No sustituye el dictamen de un jurista ni del delegado de protección de datos: las referencias legales deben revisarlas ellos antes de tratar datos reales.</p></Panel>
    </>
  );
}

const PREVISTO: Record<string, string> = {
  'punto-qr': 'Códigos QR para actos y comercios que llevan a «¿Puedo votar?» y al alta. Medición por punto, sin datos personales.',
  campanas: 'Calendario de campañas por perfil y por plazo cívico, enlazado con el ranking del Estudio Viral.',
  territorio: 'Mapa por municipio con registros agregados. Nunca por persona ni por calle.',
  voluntariado: 'Equipos, tareas y turnos para quien consintió ser contactado como voluntario.',
  escucha: 'Temas y bulos que circulan, con respuesta respaldada por ficha. Solo fuentes públicas agregadas.',
  cantera: 'Formación de portavoces de la comunidad. Sin perfiles automáticos de personas.',
  cuentas: 'Gasto por pieza y por canal, con trazabilidad para la contabilidad electoral.',
};

export const VISTAS: Record<string, (p: { s: Seccion }) => Promise<React.ReactNode> | React.ReactNode> = {
  programa: () => <Programa />, 'mi-camino': () => <MiCamino />, comunidad: () => <Comunidad />, correo: () => <Correo />, pepe: () => <Pepe />,
  embajadores: () => <Embajadores />, configuracion: () => <Configuracion />, agenda: () => <Agenda />, mediateca: () => <Mediateca />,
  voz: () => <Propuestas estado="recibida" titulo="Propuestas de la comunidad" />, atencion: () => <Propuestas estado="escalada" titulo="Escaladas a una persona" />, analitica: () => <Analitica />, cumplimiento: () => <Cumplimiento />,
};

export function Prevista({ s }: { s: Seccion }) {
  return <Panel titulo="Prevista en la siguiente fase" meta={`alcance: ${s.alcance}`}><p>{PREVISTO[s.slug] ?? s.sub}</p><p className="nota">Esta sección aparece en el menú para enseñar la estructura completa. En la beta no tiene datos ni operaciones: no se simula actividad que no existe.</p></Panel>;
}
