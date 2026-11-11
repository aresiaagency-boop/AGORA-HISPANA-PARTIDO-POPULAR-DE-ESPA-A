// Estudio Viral: el circuito cerrado F1–F9 en una sola pantalla.
import { q } from '@/lib/db';
import { esDemo } from '@/lib/modo';
import { PESOS } from '@/lib/estudio';
import Accion from '@/components/Accion';

const n = new Intl.NumberFormat('es-ES');
const ESTADO_PIEZA: Record<string, [string, string]> = {
  pendiente_aprobacion: ['Espera aprobación', 'c-pendiente'], bloqueada: ['Bloqueada por límites', 'c-caducada'], aprobada: ['Aprobada', 'c-conectado'],
  rechazada: ['Rechazada', 'c-caducada'], programada: ['Programada', 'c-sesion_agente'], publicada_simulada: ['Publicada (simulada)', 'c-sesion_agente'], en_publicacion: ['En publicación', 'c-conectado'],
};
const ETQ: Record<string, string> = { conectado: 'EN LÍNEA', sesion_agente: 'SESIÓN DE AGENTE', pendiente: 'PENDIENTE', apagado: 'APAGADO', caducada: 'CADUCADA' };

export default async function EstudioViral() {
  const [senales, patrones, ops, piezas, pubs, medios, canales, metricas] = await Promise.all([
    q('SELECT * FROM senales ORDER BY multiplicador DESC'),
    q('SELECT * FROM patrones ORDER BY id'),
    q('SELECT o.*, f.titulo AS ficha_titulo, f.estado AS ficha_estado FROM oportunidades o LEFT JOIN fichas f ON f.id = o.ficha_id ORDER BY o.puntuacion DESC'),
    q('SELECT * FROM piezas ORDER BY id DESC'),
    q('SELECT pub.*, pi.titulo FROM publicaciones pub JOIN piezas pi ON pi.id = pub.pieza_id ORDER BY pub.id DESC'),
    q('SELECT * FROM medios ORDER BY id DESC'),
    q(`SELECT * FROM conexiones WHERE canal IN ('vidiq','higgsfield','instagram','facebook','tiktok') ORDER BY canal`),
    q('SELECT count(*)::int AS n FROM metricas'),
  ]);
  const max = Math.log10(Math.max(...senales.map((s) => s.multiplicador), 10));
  const cuenta = (e: string) => piezas.filter((p) => p.estado === e).length;
  const manana = new Date(Date.now() + 86400000).toISOString().slice(0, 10) + 'T19:30';
  const fases: [string, string, number | string, boolean?][] = [
    ['F1', 'Radar', senales.length], ['F2', 'Disección', patrones.length], ['F3', 'Decisión', ops.filter((o) => o.estado === 'producir').length],
    ['F4', 'Guion', piezas.length], ['F5', 'Prueba previa', piezas.filter((p) => p.estado !== 'bloqueada').length], ['F6', 'Producción', piezas.filter((p) => p.media_url).length],
    ['F7', 'Puerta humana', cuenta('pendiente_aprobacion'), true], ['F8', 'Publicación', pubs.length], ['F9', 'Aprendizaje', metricas[0].n],
  ];

  return (
    <>
      <div className="fases" aria-label="Fases del circuito">
        {fases.map(([f, t, v, humana]) => <div key={f} className={`fase${humana ? ' humana' : ''}`}><span className="f">{f}</span><span className="t">{t}</span><span className="v">{v}</span></div>)}
      </div>

      <section className="panel">
        <div className="panel-cab"><h3>Motores y canales</h3><span className="meta">vidIQ investiga · Higgsfield produce · una persona aprueba</span></div>
        <div className="panel-cuerpo"><div className="tres">
          {canales.map((c) => (
            <div key={c.canal} className="tarjeta"><div className="linea" style={{ justifyContent: 'space-between' }}><h2>{c.nombre}</h2><span className={`chip c-${c.estado}`}>{ETQ[c.estado] ?? c.estado}</span></div>
              <span className="tenue mono">{c.via}{c.cuenta ? ` · ${c.cuenta}` : ''}</span><span className="tenue">{c.detalle}</span></div>
          ))}
        </div></div>
      </section>

      <section className="panel">
        <div className="panel-cab"><h3>F1 · Radar de tendencias</h3><span className="meta">vidIQ · captado {senales[0]?.captada}</span></div>
        <div className="panel-cuerpo sin desliza">
          <table className="tabla">
            <thead><tr><th>Red</th><th>Hook</th><th>Formato</th><th>Tema</th><th>Patrón</th><th className="num">× mediana</th><th className="num">Vistas</th></tr></thead>
            <tbody>{senales.map((s) => (
              <tr key={s.id}><td>{s.plataforma}</td><td><a href={s.url} target="_blank" rel="noreferrer">{s.hook}</a></td><td className="tenue">{s.formato}</td><td>{s.tema}</td>
                <td>{s.patron ? <span className="chip c-sesion_agente">{s.patron}</span> : <span className="tenue">—</span>}</td>
                <td className="num"><div style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>{s.multiplicador.toFixed(1)}×<div className="medidor" style={{ width: 90 }}><i style={{ width: `${Math.max(6, (Math.log10(Math.max(1, s.multiplicador)) / max) * 100)}%` }} /></div></div></td>
                <td className="num">{n.format(s.vistas)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-cab"><h3>F2 · Patrones confirmados</h3><span className="meta">dos evidencias o más</span></div>
        <div className="panel-cuerpo"><div className="tres">{patrones.map((p) => (
          <div key={p.id} className="tarjeta"><div className="linea" style={{ justifyContent: 'space-between' }}><span className="chip c-sesion_agente">{p.id}</span><span className="tenue mono">{p.evidencias} evidencias · {p.plataforma}</span></div><h2>{p.nombre}</h2><p className="tenue">{p.descripcion}</p></div>
        ))}</div></div>
      </section>

      <section className="panel">
        <div className="panel-cab"><h3>F3 · Ranking de oportunidades</h3><span className="meta">≥70 producir · 55–69 reescribir · &lt;55 descartar</span></div>
        <div className="panel-cuerpo"><div className="dos">{ops.map((o) => (
          <div key={o.id} className="tarjeta">
            <div className="linea" style={{ justifyContent: 'space-between', alignItems: 'start', flexWrap: 'nowrap' }}>
              <div className="pila" style={{ gap: 4 }}><h2>{o.titulo}</h2><span className="tenue">{o.perfil} · patrón {o.patron_id} · ficha: {o.ficha_titulo ?? 'ninguna'}{o.ficha_estado && o.ficha_estado !== 'publicada' ? ' (sin verificar)' : ''}</span></div>
              <div style={{ textAlign: 'right' }}><div className={`puntuacion ${o.estado}`}>{o.puntuacion}</div><span className="tenue mono">{o.estado}</span></div>
            </div>
            <div className="factores">
              {(Object.keys(PESOS) as (keyof typeof PESOS)[]).map((k) => [<span key={`${k}a`}>{k} · {PESOS[k]}%</span>, <div key={`${k}b`} className="medidor"><i style={{ width: `${o[k]}%` }} /></div>, <b key={`${k}c`}>{o[k]}</b>])}
              <span>riesgo · resta</span><div className="medidor riesgo"><i style={{ width: `${o.riesgo}%` }} /></div><b>{o.riesgo}</b>
            </div>
            {o.motivo && <p className="nota aviso">{o.motivo}</p>}
            {o.estado === 'producir' && <div><Accion codigo="07.04" payload={{ oportunidad_id: o.id }} etiqueta="Generar guion" clase="primario" /></div>}
          </div>
        ))}</div></div>
      </section>

      <section className="panel">
        <div className="panel-cab"><h3>F4–F8 · Piezas</h3><span className="meta">{piezas.length} en total · {cuenta('pendiente_aprobacion')} esperan a una persona</span></div>
        <div className="panel-cuerpo pila">
          {!piezas.length && <p className="tenue">Todavía no hay piezas. Genera un guion desde una oportunidad de 70 puntos o más.</p>}
          {piezas.map((p) => {
            const g = p.guion; const [txt, cls] = ESTADO_PIEZA[p.estado] ?? [p.estado, 'c-apagado'];
            return (
              <div key={p.id} className="tarjeta guion">
                <div className="linea" style={{ justifyContent: 'space-between' }}>
                  <h2>Pieza {p.id} · {p.titulo}</h2>
                  <span className="linea"><span className={`chip ${cls}`}>{txt}</span>{p.etiqueta_ia && <span className="chip c-sesion_agente">Etiqueta «creado con IA»</span>}<span className="tenue mono">{g.patron} · {g.duracion_s} s</span></span>
                </div>
                {(p.avisos as { regla: string; nivel: string; detalle: string }[]).map((a) => <p key={a.regla} className={`nota ${a.nivel === 'bloquea' ? 'error' : 'aviso'}`}><b>{a.regla}</b> · {a.detalle}</p>)}
                <div className="hooks">{(g.rubricas as { hook: string; total: number; veredicto: string }[]).map((r) => (
                  <div key={r.hook} className="hook"><b>{r.hook}</b><span className={`chip ${r.veredicto === 'aprobado' ? 'c-conectado' : 'c-pendiente'}`}>{r.total}/100</span></div>
                ))}</div>
                <div className="desliza"><table className="tabla"><thead><tr><th>Tiempo</th><th>Plano</th><th>En pantalla</th><th>Voz</th></tr></thead>
                  <tbody>{(g.escenas as { t: string; plano: string; pantalla: string; voz: string }[]).map((e) => <tr key={e.t}><td className="mono">{e.t}</td><td className="tenue">{e.plano}</td><td>{e.pantalla}</td><td>{e.voz}</td></tr>)}</tbody></table></div>
                <p><b>Llamada a la acción:</b> {g.cta} · <span className="tenue">{g.fuente_en_pantalla}</span></p>
                <p className="tenue">{(g.hashtags as string[]).join(' ')}</p>
                <details><summary className="tenue" style={{ cursor: 'pointer', padding: '8px 0' }}>F6 · Encargo para Higgsfield y material</summary><pre className="json">{g.prompt_higgsfield}{'\n\n'}Material: {g.material}</pre></details>
                {p.media_url && <p className="tenue">Vídeo producido: <a href={p.media_url} target="_blank" rel="noreferrer">{p.media_url}</a></p>}
                <div className="linea">
                  {p.estado === 'pendiente_aprobacion' && <><Accion codigo="07.05" payload={{ pieza_id: p.id, decision: 'aprobar' }} etiqueta="Aprobar" clase="primario" /><Accion codigo="07.05" payload={{ pieza_id: p.id, decision: 'rechazar' }} etiqueta="Rechazar" clase="peligro" campo={{ nombre: 'motivo', etiqueta: 'Motivo del rechazo' }} /></>}
                  {(p.estado === 'pendiente_aprobacion' || p.estado === 'aprobada') && !p.media_url && <Accion codigo="07.12" payload={{ pieza_id: p.id }} etiqueta="Adjuntar vídeo" campo={{ nombre: 'media_url', etiqueta: 'URL https del vídeo', tipo: 'url' }} />}
                  {p.estado === 'aprobada' && <Accion codigo="07.06" payload={{ pieza_id: p.id }} etiqueta="Programar" clase="primario" campo={{ nombre: 'cuando', etiqueta: 'Fecha y hora', tipo: 'datetime-local', valor: manana }} />}
                  {p.estado === 'programada' && <Accion codigo="07.07" payload={{ pieza_id: p.id }} etiqueta={esDemo ? 'Publicar (simulado)' : 'Publicar'} clase="primario" />}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="dos">
        <section className="panel">
          <div className="panel-cab"><h3>F8 · Publicaciones</h3><span className="meta">{esDemo ? 'demo: simuladas' : 'reales'}</span></div>
          <div className="panel-cuerpo sin desliza">
            {pubs.length ? <table className="tabla"><thead><tr><th>Canal</th><th>Pieza</th><th>Programada</th><th>Estado</th></tr></thead>
              <tbody>{pubs.map((p) => <tr key={p.id}><td>{p.canal}</td><td>{p.titulo}</td><td className="mono">{p.programada}</td><td><span className={`chip ${p.estado === 'PENDIENTE_CREDENCIALES' ? 'c-pendiente' : 'c-sesion_agente'}`}>{p.estado}</span></td></tr>)}</tbody></table>
              : <p className="tenue" style={{ padding: 14 }}>Nada programado todavía.</p>}
          </div>
        </section>
        <section className="panel">
          <div className="panel-cab"><h3>Material de base</h3><span className="meta">{medios.length} archivos</span></div>
          <div className="panel-cuerpo pila">
            <p className="nota">Imágenes y vídeos propios alimentan el guion. Si aparece una persona identificable, el material queda bloqueado hasta archivar su permiso escrito. Se sube con la operación 07.14.</p>
            {medios.map((m) => <div key={m.id} className="linea" style={{ justifyContent: 'space-between' }}><span>{m.titulo} <span className="tenue">· {m.tipo} · {m.autor} · {m.licencia}</span></span><span className={`chip ${m.estado === 'disponible' ? 'c-conectado' : 'c-caducada'}`}>{m.estado}</span></div>)}
            <p className="tenue">F9 · Aprendizaje: {metricas[0].n ? `${metricas[0].n} cortes de métricas.` : 'sin métricas hasta que haya publicaciones reales. Un dato que falta no es un cero.'}</p>
          </div>
        </section>
      </div>
    </>
  );
}
