'use client';
// «¿Puedo votar?»: cuatro preguntas y una respuesta con su fuente. No guarda nada.
import { useState } from 'react';

interface Resultado { generales: boolean; autonomicas: boolean; municipales: 'si' | 'si_con_tramite' | 'no'; tramite: string | null; plazo: string | null; explicacion: string; camino: string; fuente: { titulo: string; url: string } }

export default function FormVoto({ paises }: { paises: string[] }) {
  const [f, setF] = useState({ nacionalidadEspanola: false, pasaporteUE: false, pais: 'Colombia', residenciaLegal: true, anosResidencia: 5 });
  const [r, setR] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function comprobar(e: React.FormEvent) {
    e.preventDefault(); setOcupado(true); setError(null);
    try {
      const res = await fetch('/api/v1/operaciones/02.01', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
      const j = await res.json();
      if (!res.ok) setError(j.error ?? 'No se ha podido comprobar.'); else setR(j.resultado);
    } catch { setError('No hay conexión con el servidor.'); } finally { setOcupado(false); }
  }
  const marca = (v: boolean | string) => (v === true || v === 'si' ? ['Sí', 'c-conectado'] : v === 'si_con_tramite' ? ['Sí, con trámite', 'c-pendiente'] : ['No', 'c-caducada']);

  return (
    <form className="pila" onSubmit={comprobar}>
      <label className="marca-casilla"><input type="checkbox" checked={f.nacionalidadEspanola} onChange={(e) => setF({ ...f, nacionalidadEspanola: e.target.checked })} />Tengo nacionalidad española</label>
      {!f.nacionalidadEspanola && (
        <>
          <label className="marca-casilla"><input type="checkbox" checked={f.pasaporteUE} onChange={(e) => setF({ ...f, pasaporteUE: e.target.checked })} />Tengo pasaporte de otro país de la Unión Europea</label>
          {!f.pasaporteUE && (
            <>
              <label>País de mi pasaporte<select value={f.pais} onChange={(e) => setF({ ...f, pais: e.target.value })}>{paises.map((p) => <option key={p}>{p}</option>)}</select></label>
              <label className="marca-casilla"><input type="checkbox" checked={f.residenciaLegal} onChange={(e) => setF({ ...f, residenciaLegal: e.target.checked })} />Tengo residencia legal en España</label>
              {f.residenciaLegal && <label>Años de residencia legal<input type="number" min={0} max={60} inputMode="numeric" value={f.anosResidencia} onChange={(e) => setF({ ...f, anosResidencia: Number(e.target.value) })} /></label>}
            </>
          )}
        </>
      )}
      <div><button className="boton primario" disabled={ocupado}>{ocupado ? 'Comprobando…' : 'Comprobar'}</button></div>
      {error && <p className="nota error" role="alert">{error}</p>}
      {r && (
        <div className="pila" role="status">
          <div className="linea">
            {([['Municipales', r.municipales], ['Parlament', r.autonomicas], ['Generales', r.generales]] as const).map(([n, v]) => <span key={n} className={`chip ${marca(v)[1]}`}>{n}: {marca(v)[0]}</span>)}
          </div>
          <p>{r.explicacion}</p>
          {r.tramite && <p className="nota aviso"><b>Trámite:</b> {r.tramite}{r.plazo ? ` Plazo: ${r.plazo}.` : ''}</p>}
          <p className="nota"><b>Tu camino:</b> {r.camino}</p>
          <p className="tenue">Fuente: <a href={r.fuente.url} target="_blank" rel="noreferrer">{r.fuente.titulo}</a>. No guardamos tus respuestas.</p>
        </div>
      )}
    </form>
  );
}
