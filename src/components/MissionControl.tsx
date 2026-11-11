'use client';
// Mission Control: todas las conexiones, en vivo. Sondea /api/v1/estado cada 5 s.
// Nada de lo que se mueve es decorado: cada pulso, onda y contador sale de un dato real.
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Conexion, EstadoVivo } from '@/lib/estado';

const ORDEN = ['n8n', 'vidiq', 'higgsfield', 'instagram', 'facebook', 'tiktok', 'gmail', 'whatsapp', 'google', 'basedatos'];
const ETIQUETA: Record<string, string> = {
  conectado: 'EN LÍNEA', sesion_agente: 'SESIÓN DE AGENTE', pendiente: 'PENDIENTE', apagado: 'APAGADO', caducada: 'CADUCADA', sin_respuesta: 'SIN RESPUESTA',
};
const COLOR: Record<string, string> = {
  conectado: 'var(--ok)', sesion_agente: 'var(--cian)', pendiente: 'var(--aviso)', apagado: 'var(--apagado)', caducada: 'var(--error)', sin_respuesta: 'var(--error)',
};
const DESTINO: Record<string, string> = {
  n8n: 'pepe', vidiq: 'estudio-viral', higgsfield: 'estudio-viral', instagram: 'estudio-viral', facebook: 'estudio-viral', tiktok: 'estudio-viral',
  gmail: 'correo', whatsapp: 'pepe', google: 'configuracion', basedatos: 'configuracion',
};
const hora = new Intl.DateTimeFormat('es-ES', { timeStyle: 'medium', timeZone: 'Europe/Madrid' });
const dia = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' });

const NOMBRE_CORTO: Record<string, string> = { facebook: 'Facebook' };
const IZQ = ['n8n', 'basedatos', 'google', 'gmail', 'whatsapp'];
const DER = ['vidiq', 'higgsfield', 'instagram', 'facebook', 'tiktok'];
const TALLA = 11;
const r1 = (n: number) => Math.round(n * 10) / 10;

// Diamante del núcleo, visto desde arriba: corona de ocho facetas dobles y tabla central.
const pt = (r: number, grados: number) => `${(r * Math.cos((grados * Math.PI) / 180)).toFixed(1)},${(r * Math.sin((grados * Math.PI) / 180)).toFixed(1)}`;
const FACETAS = Array.from({ length: 8 }, (_, k) => {
  const a = k * 45;
  return [
    { pts: `${pt(60, a)} ${pt(60, a + 45)} ${pt(31, a + 22.5)}`, luz: 0.1 + 0.34 * Math.abs(Math.cos(((a - 30) * Math.PI) / 180)) },
    { pts: `${pt(60, a + 45)} ${pt(31, a + 22.5)} ${pt(31, a + 67.5)}`, luz: 0.06 + 0.3 * Math.abs(Math.sin(((a + 10) * Math.PI) / 180)) },
  ];
}).flat();
const TABLA = Array.from({ length: 8 }, (_, k) => pt(31, k * 45 + 22.5)).join(' ');

interface Plano { w: number; h: number; cx: number; cy: number; nw: number; nh: number; esc: number; columnas: boolean; rx: number; ry: number; nodos: Record<string, { x: number; y: number; camino: string }> }

// El mapa se dibuja a tamaño real del contenedor: los nodos conservan su tamaño
// táctil en cualquier pantalla. En ancho sobra una elipse; en estrecho, dos columnas.
// Disposición simétrica: cinco conexiones a cada lado y el núcleo en el eje.
function plano(w: number, h: number): Plano {
  const nh = w < 480 ? 50 : 54;
  const nw = Math.min(172, Math.floor((w - 108) / 2));
  const alto = Math.max(IZQ.length * (nh + 12) + 46, h);
  const cx = w / 2, cy = alto / 2;
  const esc = Math.max(0.42, Math.min(1.08, (w - 2 * nw - 24) / 200, (alto - 60) / 220));
  const paso = (alto - 56 - nh) / (IZQ.length - 1);
  const nodos: Plano['nodos'] = {};
  [IZQ, DER].forEach((col, lado) => col.forEach((canal, fila) => {
    const x = lado ? w - 6 - nw / 2 : 6 + nw / 2, y = 28 + nh / 2 + fila * paso;
    const ex = lado ? x - nw / 2 - 4 : x + nw / 2 + 4;
    const dx = ex - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
    const sx = cx + (dx / len) * 98 * esc, sy = cy + (dy / len) * 98 * esc;
    nodos[canal] = { x: r1(x), y: r1(y), camino: `M${r1(sx)} ${r1(sy)} Q${r1(sx + (ex - sx) * 0.3)} ${r1(y)} ${r1(ex)} ${r1(y)}` };
  }));
  return { w, h: alto, cx, cy, nw, nh, esc, columnas: true, rx: 0, ry: 0, nodos };
}

function Onda({ nivel, tono }: { nivel: number; tono: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const nivelRef = useRef(nivel);
  nivelRef.current = nivel;
  useEffect(() => {
    const lienzo = ref.current;
    if (!lienzo) return;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return;
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cuadro = 0, vivo = true, amp = 4;
    const pinta = (t: number) => {
      if (!vivo) return;
      const dpr = window.devicePixelRatio || 1, w = lienzo.clientWidth, h = lienzo.clientHeight;
      if (lienzo.width !== w * dpr || lienzo.height !== h * dpr) { lienzo.width = w * dpr; lienzo.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const objetivo = 7 + Math.min(h * 0.34, nivelRef.current * 4.5);
      amp += (objetivo - amp) * 0.05;
      for (let capa = 0; capa < 4; capa++) {
        ctx.fillStyle = tono;
        ctx.globalAlpha = 0.9 - capa * 0.2;
        const fase = (quieto ? 0 : t / (900 + capa * 260)) + capa * 1.3;
        for (let x = 0; x < w; x += 3) {
          const k = x / w;
          const y = h / 2 + Math.sin(k * (7 + capa * 2.2) + fase) * amp * (0.5 + 0.5 * Math.sin(k * Math.PI)) + Math.sin(k * 23 + fase * 1.7) * amp * 0.18;
          ctx.fillRect(x, y + (capa - 1.5) * 3, 1.4, 1.4);
        }
      }
      ctx.globalAlpha = 1;
      if (!quieto) cuadro = requestAnimationFrame(pinta);
    };
    cuadro = requestAnimationFrame(pinta);
    return () => { vivo = false; cancelAnimationFrame(cuadro); };
  }, [tono]);
  return <canvas ref={ref} className="onda" aria-hidden="true" />;
}

function Area({ valores, log }: { valores: number[]; log?: boolean }) {
  const d = useMemo(() => {
    if (!valores.length) return '';
    const v = valores.map((x) => (log ? Math.log10(Math.max(1, x)) : x));
    const max = Math.max(...v, 1);
    const paso = valores.length > 1 ? 200 / (valores.length - 1) : 200;
    const pts = v.map((y, i) => [i * paso, 56 - (y / max) * 48] as const);
    let s = `M0 60 L${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], xm = (x0 + x1) / 2;
      s += ` C${xm} ${y0} ${xm} ${y1} ${x1} ${y1}`;
    }
    return `${s} L200 60 Z`;
  }, [valores, log]);
  return (
    <svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fd8ff" stopOpacity="0.75" /><stop offset="1" stopColor="#4fd8ff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {[15, 30, 45].map((y) => <line key={y} x1="0" x2="200" y1={y} y2={y} stroke="rgba(64,180,255,0.16)" strokeWidth="0.5" />)}
      <path d={d} fill="url(#relleno)" stroke="#9be9ff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Nucleo({ conexiones, sel, elegir, modo, ahora }: { conexiones: Conexion[]; sel: string | null; elegir: (c: string) => void; modo: string; ahora: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ w: 800, h: 524 });
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) setT((v) => (Math.abs(v.w - width) < 2 && Math.abs(v.h - height) < 2 ? v : { w: Math.round(width), h: Math.round(height) }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const g = useMemo(() => plano(t.w, t.h), [t]);
  const lista = ORDEN.map((c) => conexiones.find((x) => x.canal === c)).filter(Boolean) as Conexion[];
  const enLinea = lista.filter((c) => c.estado === 'conectado' || c.estado === 'sesion_agente').length;
  const forma = `${TALLA},0 ${g.nw},0 ${g.nw},${g.nh - TALLA} ${g.nw - TALLA},${g.nh} 0,${g.nh} 0,${TALLA}`;
  const bisel = `${TALLA},0 ${TALLA + 30},0 0,${TALLA + 30} 0,${TALLA}`;
  return (
    <div ref={caja} className="nucleo-caja" >
      <svg className="nucleo-svg" viewBox={`0 0 ${g.w} ${g.h}`} role="group" aria-label="Mapa de conexiones en tiempo real">
        <defs>
          <radialGradient id="brillo"><stop offset="0" stopColor="#4fd8ff" stopOpacity="0.5" /><stop offset="0.7" stopColor="#4fd8ff" stopOpacity="0.08" /><stop offset="1" stopColor="#4fd8ff" stopOpacity="0" /></radialGradient>
          <linearGradient id="plasma" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f2fdff" /><stop offset="0.35" stopColor="#7fe7ff" /><stop offset="0.7" stopColor="#5b6dff" /><stop offset="1" stopColor="#46e6a6" /></linearGradient>
          <filter id="halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g stroke="rgba(64,180,255,0.2)" strokeWidth="0.6" fill="none">
          <line x1={g.cx} y1="6" x2={g.cx} y2={g.h - 6} /><line x1="6" y1={g.cy} x2={g.w - 6} y2={g.cy} />
          {!g.columnas && <><ellipse cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry} strokeDasharray="2 6" /><ellipse cx={g.cx} cy={g.cy} rx={g.rx * 0.6} ry={g.ry * 0.6} strokeDasharray="1 8" /></>}
        </g>
        <text className="cota" x="12" y="16">CONEXIONES {enLinea}/{lista.length} EN LÍNEA</text>
        <text className="cota" x={g.w - 12} y="16" textAnchor="end">ACTUALIZADO {hora.format(new Date(ahora))}</text>
        <text className="cota" x="12" y={g.h - 8}>MODO {modo.toUpperCase()}</text>
        <text className="cota" x={g.w - 12} y={g.h - 8} textAnchor="end">SONDEO 5 S</text>

        {lista.map((c) => {
          const n = g.nodos[c.canal];
          const dur = Math.max(1.1, 3.4 - c.eventos * 0.25);
          return (
            <g key={c.canal}>
              <path className={`enlace ${c.estado}${sel === c.canal ? ' sel' : ''}`} style={{ color: COLOR[c.estado] }} d={n.camino} />
              {sel === c.canal && (
                <circle r="3.6" fill="#f2fdff" filter="url(#halo)"><animateMotion dur="0.9s" repeatCount="indefinite" path={n.camino} keyPoints="1;0" keyTimes="0;1" calcMode="linear" /></circle>
              )}
              {c.estado === 'conectado' && (
                <g fill="var(--ok)" filter="url(#halo)">
                  <circle r="2.8"><animateMotion dur={`${dur}s`} repeatCount="indefinite" path={n.camino} /></circle>
                  <circle r="2.2" opacity="0.8"><animateMotion dur={`${dur * 1.35}s`} repeatCount="indefinite" path={n.camino} keyPoints="1;0" keyTimes="0;1" calcMode="linear" /></circle>
                </g>
              )}
              {c.estado === 'sesion_agente' && (
                <circle r="2.4" fill="var(--cian)" filter="url(#halo)"><animateMotion dur="4.2s" repeatCount="indefinite" path={n.camino} /></circle>
              )}
            </g>
          );
        })}

        <g transform={`translate(${g.cx} ${g.cy}) scale(${g.esc.toFixed(3)})`}>
          <circle className="latido" r="96" /><circle className="latido l2" r="96" /><circle className="latido l3" r="96" />
          <circle r="96" fill="url(#brillo)" />
          <circle className="anillo a3" r="92" strokeWidth="0.8" />
          <circle className="anillo a1" r="82" strokeWidth="1" />
          <circle className="anillo a2" r="72" strokeWidth="1.6" filter="url(#halo)" />
          <g className="gema" filter="url(#halo)">
            {FACETAS.map((f, k) => <polygon key={k} points={f.pts} fill={`rgba(127,231,255,${f.luz.toFixed(2)})`} />)}
          </g>
          <polygon points={TABLA} fill="rgba(2,16,32,0.78)" stroke="#f2fdff" strokeWidth="0.9" />
          <g transform="translate(-22 -27) scale(1.85)" fill="none" stroke="#f2fdff" strokeWidth="1.4" strokeLinecap="round" filter="url(#halo)">
            <path d="M3.5 16a8.5 8.5 0 0 1 17 0" /><path d="M7 16a5 5 0 0 1 10 0" opacity="0.75" /><circle cx="12" cy="16" r="1.5" fill="#7fe7ff" stroke="none" /><path d="M2 20h20" />
          </g>
        </g>

        {lista.map((c) => {
          const n = g.nodos[c.canal];
          const etiqueta = ETIQUETA[c.estado];
          return (
            <g key={c.canal} className={`nodo ${c.estado}${sel === c.canal ? ' sel' : ''}`} transform={`translate(${r1(n.x - g.nw / 2)} ${r1(n.y - g.nh / 2)})`}
              role="button" tabIndex={0} aria-label={`${c.nombre}: ${etiqueta}`} aria-pressed={sel === c.canal}
              onClick={() => elegir(c.canal)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(c.canal); } }}>
              <polygon className="cuerpo" points={forma} stroke={COLOR[c.estado]} />
              <polygon className="bisel" points={bisel} />
              <rect className="luz" x="14" y="14" width="8" height="8" transform="rotate(45 18 18)" fill={COLOR[c.estado]} filter="url(#halo)" />
              <text className="nombre" x="31" y="23">{NOMBRE_CORTO[c.canal] ?? c.nombre}</text>
              <text className="estado" x="15" y={g.nh - 12} fill={COLOR[c.estado]}>{etiqueta}</text>
              {c.eventos > 0 && etiqueta.length <= 9 && <text className="estado" x={g.nw - 16} y={g.nh - 12} textAnchor="end" fill="var(--cian-2)">{c.eventos} ev</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function partes(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const dos = (n: number) => String(n).padStart(2, '0');

export default function MissionControl({ inicial }: { inicial: EstadoVivo }) {
  const [e, setE] = useState(inicial);
  const [senal, setSenal] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date(inicial.ahora).getTime());
  const [log, setLog] = useState<{ yo: string; el?: string; via?: string }[]>([]);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vivo = true;
    const sondea = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch('/api/v1/estado', { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const j = (await r.json()) as EstadoVivo;
        if (vivo) { setE(j); setSenal(true); }
      } catch { if (vivo) setSenal(false); }
    };
    const a = setInterval(sondea, 5000);
    const b = setInterval(() => setAhora(Date.now()), 1000);
    setAhora(Date.now());
    return () => { vivo = false; clearInterval(a); clearInterval(b); };
  }, []);

  const siguiente = e.plazos.find((p) => new Date(p.fecha).getTime() > ahora);
  const cuenta = partes(siguiente ? new Date(siguiente.fecha).getTime() - ahora : 0);
  const elegido = e.conexiones.find((c) => c.canal === sel);
  const k = e.kpis;

  async function preguntar(ev: React.FormEvent) {
    ev.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || ocupado) return;
    setTexto(''); setOcupado(true);
    setLog((l) => [...l, { yo: mensaje }]);
    try {
      const r = await fetch('/api/v1/pepe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mensaje }) });
      const j = await r.json();
      setLog((l) => l.map((x, i) => (i === l.length - 1 ? { ...x, el: j.texto ?? j.error ?? 'Sin respuesta.', via: j.modo ? `${j.modo}${j.herramienta ? ` · ${j.herramienta}` : ''}` : undefined } : x)));
    } catch {
      setLog((l) => l.map((x, i) => (i === l.length - 1 ? { ...x, el: 'No he podido contactar con PEPE.' } : x)));
    } finally { setOcupado(false); }
  }

  const maxEmbudo = Math.max(1, ...e.embudo.map((x) => x.n));
  return (
    <div className="mc">
      <section className="a-kpi kpis" aria-label="Indicadores">
        <div className="kpi"><span>Perfiles</span><b>{k.personas}</b></div>
        <div className="kpi"><span>Altas 7 días</span><b>{k.altas7d}</b></div>
        <div className="kpi"><span>Interés afiliación</span><b>{k.firmas}</b></div>
        <div className="kpi"><span>Mensajes a PEPE</span><b>{k.conversaciones}</b></div>
        <div className={`kpi${k.pendientes ? ' alerta' : ''}`}><span>Por aprobar</span><b>{k.pendientes}</b></div>
        <div className="kpi"><span>A producir</span><b>{k.oportunidades}</b></div>
        <div className="kpi"><span>Publicaciones</span><b>{k.publicaciones}</b></div>
        <div className="kpi"><span>Correos</span><b>{k.correos}</b></div>
      </section>

      <div className="a-izq columna">
        <section className="panel"><div className="panel-cab"><h3>Pulso PEPE</h3><span className="meta">{e.pulso.pepe} ev/10 min</span></div><div className="panel-cuerpo sin"><Onda nivel={e.pulso.pepe} tono="#7fe4ff" /></div></section>
        <section className="panel"><div className="panel-cab"><h3>Radar vidIQ</h3><span className="meta">multiplicador</span></div>
          <div className="panel-cuerpo"><div className="mini"><Area valores={e.radar} log /><div className="dato"><b>{e.radar[0] ? `${Math.round(e.radar[0])}×` : '—'}</b><span>máximo</span></div></div></div></section>
        <section className="panel"><div className="panel-cab"><h3>Embudo de usuarios</h3><span className="meta">{e.bajas} bajas</span></div>
          <div className="panel-cuerpo pila">
            {e.embudo.map((x) => <div key={x.etapa} className="embudo-fila"><span>{x.etapa}</span><b>{x.n}</b><div className="medidor"><i style={{ width: `${(x.n / maxEmbudo) * 100}%` }} /></div></div>)}
            <Link href="/consola/afiliados">Gestionar afiliados VIP</Link>
          </div></section>
      </div>

      <section className="panel a-nucleo">
        <div className="panel-cab"><h3>Núcleo de conexiones</h3><span className={`meta ${senal ? '' : 'c-caducada'}`}>{senal ? '● EN VIVO' : '● SIN SEÑAL'}</span></div>
        <div className="panel-cuerpo sin nucleo-marco"><Nucleo conexiones={e.conexiones} sel={sel} elegir={(c) => setSel(sel === c ? null : c)} modo={e.modo} ahora={e.ahora} /></div>
        {elegido && (
          <div className="detalle-nodo" aria-live="polite">
            <div className="linea"><b>{elegido.nombre}</b><span className={`chip c-${elegido.estado}`}>{ETIQUETA[elegido.estado]}</span><span className="tenue mono">{elegido.via}</span></div>
            {elegido.detalle && <span>{elegido.detalle}</span>}
            <span className="tenue">{elegido.cuenta ? `${elegido.cuenta} · ` : ''}{elegido.eventos} eventos en 10 min · <Link href={`/consola/${DESTINO[elegido.canal]}`}>Abrir sección</Link></span>
          </div>
        )}
        <div className="nucleo-pie">
          {(['conectado', 'sesion_agente', 'pendiente', 'apagado', 'caducada'] as const).map((s) => (
            <span key={s} className={`punto c-${s}`}><i />{s === 'caducada' ? 'Error' : ETIQUETA[s].charAt(0) + ETIQUETA[s].slice(1).toLowerCase()}</span>
          ))}
        </div>
      </section>

      <div className="a-der columna">
        <section className="panel"><div className="panel-cab"><h3>Pulso Estudio</h3><span className="meta">{e.pulso.estudio} ev/10 min</span></div><div className="panel-cuerpo sin"><Onda nivel={e.pulso.estudio} tono="#46e6a6" /></div></section>
        <section className="panel"><div className="panel-cab"><h3>Oportunidades</h3><span className="meta">puntuación</span></div>
          <div className="panel-cuerpo"><div className="mini"><Area valores={e.puntuaciones} /><div className="dato"><b>{e.puntuaciones[0] ?? '—'}</b><span>mejor</span></div></div></div></section>
        <section className="panel">
          <div className="panel-cab"><h3>Cuenta atrás</h3><span className="meta">{siguiente ? siguiente.nombre : 'Sin plazos'}</span></div>
          <div className="panel-cuerpo">
            <div className="cuenta" role="timer" aria-label={siguiente ? `Faltan ${cuenta.d} días para: ${siguiente.nombre}` : undefined}>
              <div className="digito"><b>{cuenta.d}</b><span>DÍAS</span></div><div className="digito"><b>{dos(cuenta.h)}</b><span>HR.</span></div>
              <div className="digito"><b>{dos(cuenta.m)}</b><span>MIN.</span></div><div className="digito"><b>{dos(cuenta.s)}</b><span>SEC.</span></div>
            </div>
            <ul className="plazos">
              {e.plazos.filter((p) => new Date(p.fecha).getTime() > ahora).slice(0, 3).map((p) => (
                <li key={p.nombre} className={p === siguiente ? 'sig' : ''}><span>{p.nombre}</span><span className="mono">{dia.format(new Date(p.fecha))}</span></li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="a-pie par">
        <section className="panel">
          <div className="panel-cab"><h3>Actividad</h3><span className="meta">{e.pulso.total} eventos / 10 min</span></div>
          <div className="panel-cuerpo sin desliza">
            <table className="tabla">
              <thead><tr><th className="num">N</th><th>Actor</th><th>Acción</th><th>Objeto</th><th className="num">Hora</th></tr></thead>
              <tbody>
                {e.actividad.slice(0, 6).map((a, i) => (
                  <tr key={a.id} className={i === 0 ? 'activa' : ''}><td className="num">{a.id}</td><td>{a.actor}</td><td>{a.accion}</td><td>{a.objeto}</td><td className="num">{hora.format(new Date(a.creada))}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="panel-cab"><h3>PEPE · Orquestador</h3><span className="meta">{e.pendientes.length} por aprobar</span></div>
          <div className="panel-cuerpo">
            <div className="pepe-log" aria-live="polite">
              {e.pendientes.map((p) => (
                <div key={`${p.tipo}${p.id}`} className="el"><span className="chip c-pendiente">{p.tipo.toUpperCase()} {p.id}</span> {p.titulo} · <Link href={`/consola/${p.tipo === 'pieza' ? 'estudio-viral' : p.tipo === 'afiliado' ? 'afiliados' : 'correo'}`}>Revisar</Link></div>
              ))}
              {log.map((l, i) => (
                <div key={i} style={{ display: 'grid', gap: 6 }}><div className="yo">{l.yo}</div>{l.el && <div className="el">{l.el}{l.via && <small>{l.via}</small>}</div>}</div>
              ))}
              {!e.pendientes.length && !log.length && <span className="tenue">Pregunta a PEPE: «estado», «qué espera aprobación», «ranking».</span>}
            </div>
          </div>
          <form className="pepe-barra" onSubmit={preguntar}>
            <label className="sr" htmlFor="orden">Mensaje para PEPE</label>
            <input id="orden" value={texto} onChange={(ev) => setTexto(ev.target.value)} placeholder="Escribe a PEPE…" autoComplete="off" maxLength={500} />
            <button className="boton primario" disabled={ocupado}>{ocupado ? '…' : 'Enviar'}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
