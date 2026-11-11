'use client';
// Consola de una operación: carga editable, botón y resultado tal cual lo devuelve la API.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Operacion({ codigo, nombre, hace, payload, control }: { codigo: string; nombre: string; hace: string; payload: Record<string, unknown>; control: string }) {
  const router = useRouter();
  const conCarga = Object.keys(payload).length > 0;
  const [texto, setTexto] = useState(JSON.stringify(payload, null, 2));
  const [salida, setSalida] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function ejecutar() {
    let cuerpo: unknown = {};
    try { cuerpo = conCarga ? JSON.parse(texto) : {}; } catch { setFallo(true); setSalida('La carga no es JSON válido.'); return; }
    setOcupado(true);
    try {
      const r = await fetch(`/api/v1/operaciones/${codigo}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) });
      const j = await r.json();
      setFallo(!r.ok);
      setSalida(JSON.stringify(j.resultado ?? j, null, 2));
      if (r.ok) router.refresh();
    } catch { setFallo(true); setSalida('No hay conexión con el servidor.'); } finally { setOcupado(false); }
  }

  return (
    <div className="tarjeta op">
      <div className="linea" style={{ justifyContent: 'space-between' }}><span className="cod">{codigo}</span><span className="chip c-sesion_agente">{control}</span></div>
      <h2>{nombre}</h2>
      <p className="tenue">{hace}</p>
      {conCarga && <label>Carga<textarea rows={Math.min(9, texto.split('\n').length)} value={texto} onChange={(e) => setTexto(e.target.value)} spellCheck={false} /></label>}
      <div><button className="boton" onClick={ejecutar} disabled={ocupado}>{ocupado ? 'Ejecutando…' : 'Ejecutar'}</button></div>
      {salida && <pre className="json" style={fallo ? { color: 'var(--error)' } : undefined} role={fallo ? 'alert' : 'status'}>{salida}</pre>}
    </div>
  );
}
