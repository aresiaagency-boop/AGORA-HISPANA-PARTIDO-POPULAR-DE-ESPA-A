'use client';
import { useRef, useState } from 'react';

export default function ChatPepe({ sugerencias }: { sugerencias: string[] }) {
  const [log, setLog] = useState<{ yo: string; el?: string; via?: string }[]>([]);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  async function enviar(mensaje: string) {
    const m = mensaje.trim();
    if (!m || ocupado) return;
    setTexto(''); setOcupado(true);
    setLog((l) => [...l, { yo: m }]);
    let el = 'No he podido contactar con PEPE.', via: string | undefined;
    try {
      const r = await fetch('/api/v1/pepe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mensaje: m }) });
      const j = await r.json();
      el = j.texto ?? j.error ?? el;
      via = j.modo ? `${j.modo}${j.herramienta ? ` · ${j.herramienta}` : ''}` : undefined;
    } catch { /* se muestra el mensaje por defecto */ }
    setLog((l) => l.map((x, i) => (i === l.length - 1 ? { ...x, el, via } : x)));
    setOcupado(false);
    requestAnimationFrame(() => fin.current?.scrollIntoView({ block: 'nearest' }));
  }

  return (
    <div className="pila">
      <div className="pepe-log" style={{ maxHeight: 380, minHeight: 120 }} aria-live="polite">
        {!log.length && <span className="tenue">PEPE se presenta como inteligencia artificial en su primer mensaje y solo afirma lo que respalda una ficha verificada.</span>}
        {log.map((l, i) => (
          <div key={i} style={{ display: 'grid', gap: 6 }}><div className="yo">{l.yo}</div>{l.el && <div className="el">{l.el}{l.via && <small>{l.via}</small>}</div>}</div>
        ))}
        <div ref={fin} />
      </div>
      <div className="linea">{sugerencias.map((s) => <button key={s} className="boton" onClick={() => enviar(s)} disabled={ocupado}>{s}</button>)}</div>
      <form className="linea" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
        <label className="sr" htmlFor="chat-pepe">Mensaje para PEPE</label>
        <input id="chat-pepe" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe a PEPE…" autoComplete="off" maxLength={500} />
        <button className="boton primario" disabled={ocupado}>{ocupado ? '…' : 'Enviar'}</button>
      </form>
    </div>
  );
}
