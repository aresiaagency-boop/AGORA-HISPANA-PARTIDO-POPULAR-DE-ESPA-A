// Espacio del usuario: su perfil, lo que puede hacer y PEPE. Sobrio: una columna.
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { q, uno } from '@/lib/db';
import { firmaBaja } from '@/lib/auth';
import { exigirPublico } from '@/lib/guardias';
import { NOMBRE, ROTULO } from '@/lib/modo';
import { FINALIDADES } from '@/lib/textos';
import BarraNav from '@/components/BarraNav';
import ChatPepe from '@/components/ChatPepe';
import Logo from '@/components/Logo';
import MarcaPartido from '@/components/MarcaPartido';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi espacio' };

export default async function MiEspacio() {
  const s = await exigirPublico();
  if (!s) redirect('/alta');
  const p = await uno('SELECT * FROM personas WHERE email = $1 AND baja IS NULL', [s.email]);
  if (!p) redirect('/alta');
  const [cons, firma, actos, piezas, invitados] = await Promise.all([
    q('SELECT DISTINCT ON (finalidad) finalidad, otorgado FROM consentimientos WHERE persona_id = $1 ORDER BY finalidad, id DESC', [p.id]),
    uno('SELECT id, creada FROM firmas WHERE persona_id = $1 ORDER BY creada DESC LIMIT 1', [p.id]),
    q('SELECT titulo, municipio, fecha FROM actos ORDER BY fecha LIMIT 3'),
    q(`SELECT titulo FROM piezas WHERE estado IN ('publicada_simulada','en_publicacion') ORDER BY id DESC LIMIT 3`),
    uno('SELECT count(*)::int AS n FROM personas WHERE invitado_por = $1', [p.id]),
  ]);
  const dados = cons.filter((c) => c.otorgado).map((c) => c.finalidad as string);
  const hechos = [true, !!p.municipio, dados.includes('comunicaciones_politicas'), dados.includes('voluntariado'), !!firma];
  const pct = Math.round((hechos.filter(Boolean).length / hechos.length) * 100);
  const wa = (process.env.PEPE_WHATSAPP ?? '').replace(/\D/g, '');
  const pasos: [string, string, string, boolean][] = [
    ['Saber si puedes votar', 'Cuatro preguntas y la respuesta oficial, con su plazo.', '/puedo-votar', false],
    ['Entender las propuestas', 'Qué dice cada medida y cómo te afecta hoy, con su fuente.', '#pepe', false],
    ['Venir a un acto', actos.length ? `Próximo: ${actos[0].titulo}, ${actos[0].municipio}, ${actos[0].fecha}.` : 'Te avisaremos del próximo.', '#actos', false],
    ['Hacer oír tu propuesta', 'Cuéntasela a PEPE y llega al equipo.', '#pepe', false],
    ['Colaborar como voluntario', 'Tú decides cuánto y cuándo.', '#perfil', dados.includes('voluntariado')],
    ['Afiliarte', 'Manifiestas tu interés aquí; la afiliación la tramita el partido.', '#perfil', !!firma],
    ['Invitar a alguien', `${invitados?.n ?? 0} personas han llegado por tu enlace.`, '#invitar', false],
  ];
  return (
    <main className="publico" style={{ placeItems: 'start center' }}>
      <div className="caja pila" style={{ width: 'min(680px, 100%)' }}>
        <BarraNav salir />
        <section className="panel"><div className="panel-cuerpo">
          <div className="linea" style={{ justifyContent: 'space-between' }}><div className="marca"><Logo />{NOMBRE}</div><MarcaPartido /></div>
          {ROTULO && <span className="rotulo">{ROTULO}</span>}
          <h1>Hola, {String(p.nombre).split(' ')[0]}</h1>
          <div className="progreso" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Tu participación"><i style={{ width: `${pct}%` }} /></div>
          <p className="tenue mono">Tu participación · {pct} %</p>
          {p.estado === 'pendiente' && <p className="nota aviso">Tu perfil está pendiente de aprobación por Dirección. Te avisaremos cuando esté activo.</p>}
          {p.estado === 'rechazado' && <p className="nota error">Tu solicitud no ha sido aprobada. Puedes escribir a PEPE si crees que es un error.</p>}
        </div></section>

        {p.estado === 'aprobado' && <section className="panel"><div className="panel-cab"><h3>Qué puedes hacer</h3></div><div className="panel-cuerpo pila">
          {pasos.map(([t, d, href, ok], i) => (
            <Link key={t} href={href} className="paso"><span className="mono n">{ok ? '✓' : i + 1}</span><span><b>{t}</b><br /><span className="tenue">{d}</span></span></Link>
          ))}
          <p className="tenue">Nada de esto está condicionado a afiliarte, y afiliarte no da premios ni servicios.</p>
        </div></section>}

        <a className="paso" href="/servicios"><span className="mono n">i</span><span><b>Servicios de la comunidad</b><br /><span className="tenue">Extranjería y creación de empresas. Información abierta a todos, sin condiciones.</span></span></a>

        <section className="panel" id="pepe"><div className="panel-cab"><h3>Habla con PEPE</h3><span className="meta">asistente de IA</span></div><div className="panel-cuerpo pila">
          <ChatPepe sugerencias={['¿Puedo votar?', '¿Qué cambia con la nacionalidad?', 'Tengo una propuesta']} />
          {wa ? <div><a className="boton" href={`https://wa.me/${wa}?text=${encodeURIComponent('Hola PEPE')}`} target="_blank" rel="noreferrer">Seguir por WhatsApp</a></div> : <p className="tenue">WhatsApp se activará cuando el equipo abra ese canal.</p>}
        </div></section>

        {piezas.length > 0 && <section className="panel"><div className="panel-cab"><h3>Lo último</h3></div><div className="panel-cuerpo pila">{piezas.map((x) => <p key={x.titulo}>{x.titulo}</p>)}</div></section>}

        <section className="panel" id="actos"><div className="panel-cab"><h3>Próximos actos</h3></div><div className="panel-cuerpo pila">
          {actos.map((a) => <div key={a.titulo} className="linea" style={{ justifyContent: 'space-between' }}><span>{a.titulo} <span className="tenue">· {a.municipio}</span></span><span className="mono tenue">{a.fecha}</span></div>)}
        </div></section>

        <section className="panel" id="perfil"><div className="panel-cab"><h3>Tu perfil</h3></div><div className="panel-cuerpo pila">
          <p>{p.nombre} · <span className="mono tenue">{p.email}</span></p>
          <p className="tenue">{p.municipio ?? 'Municipio sin indicar'} · {p.pais_origen ?? 'Origen sin indicar'}</p>
          {Object.keys(FINALIDADES).map((f) => <div key={f} className="linea" style={{ justifyContent: 'space-between' }}><span>{f.replaceAll('_', ' ')}</span><span className={`chip ${dados.includes(f) ? 'c-conectado' : 'c-apagado'}`}>{dados.includes(f) ? 'Sí' : 'No'}</span></div>)}
          <div className="linea" style={{ justifyContent: 'space-between' }}><span>interés en afiliarse</span><span className={`chip ${firma ? 'c-conectado' : 'c-apagado'}`}>{firma ? 'Firmado' : 'No'}</span></div>
          <p className="tenue" id="invitar">Tu enlace para invitar: <span className="mono">/alta?i={p.codigo_invitacion}</span></p>
          <div className="linea"><Link className="boton peligro" href={`/baja?e=${encodeURIComponent(p.email)}&t=${firmaBaja(p.email)}`}>Darme de baja</Link></div>
        </div></section>
      </div>
    </main>
  );
}
