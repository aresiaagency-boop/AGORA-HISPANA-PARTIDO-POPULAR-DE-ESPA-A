'use client';
// Alta en embudo: una sola decisión por pantalla, con progreso y porcentaje.
// 1 identidad (Google) · 2 datos · 3 consentimiento · 4 afiliación (opcional) · 5 listo.
import { useState } from 'react';

interface Props {
  email: string; viaGoogle: boolean; nombreGoogle: string; invitacion: string | null;
  municipios: string[]; paises: string[]; intereses: string[];
  finalidades: Record<string, string>; manifestacion: string; aviso: string; version: string;
}
const PASOS = ['Identidad', 'Tus datos', 'Tu consentimiento', 'Afiliación', 'Listo'];

export default function FormAlta(p: Props) {
  const [paso, setPaso] = useState(2);
  const [nombre, setNombre] = useState(p.nombreGoogle);
  const [municipio, setMunicipio] = useState('');
  const [pais, setPais] = useState('');
  const [intereses, setIntereses] = useState<string[]>([]);
  const [fin, setFin] = useState<Record<string, boolean>>({});
  const [afiliar, setAfiliar] = useState(false);
  const [firma, setFirma] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ firma: string | null } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const pct = Math.round(((paso - 1) / (PASOS.length - 1)) * 100);

  function siguiente() {
    setError(null);
    if (paso === 2 && (nombre.trim().length < 5 || !nombre.trim().includes(' '))) return setError('Escribe tu nombre y tus apellidos.');
    if (paso === 3 && !Object.values(fin).some(Boolean)) return setError('Marca al menos una opción. Sin tu consentimiento no guardamos nada.');
    setPaso(paso + 1);
  }

  async function enviar() {
    setOcupado(true); setError(null);
    try {
      const r = await fetch('/api/v1/alta', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre, municipio, pais, intereses, finalidades: fin, interesAfiliacion: afiliar, firmaNombre: firma, aceptaFirma: acepta, invitacion: p.invitacion }),
      });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? 'No se ha podido completar el alta.'); else { setHecho({ firma: j.firma }); setPaso(5); }
    } catch { setError('No hay conexión con el servidor.'); } finally { setOcupado(false); }
  }

  return (
    <div className="pila embudo">
      <div className="progreso" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del alta"><i style={{ width: `${pct}%` }} /></div>
      <p className="tenue mono">Paso {paso} de {PASOS.length} · {PASOS[paso - 1]} · {pct} %</p>

      {paso === 2 && (
        <>
          <h1>¿Cómo te llamas?</h1>
          <p className="tenue">{p.viaGoogle ? 'Identidad verificada con Google' : 'Sesión del owner (prueba del alta, sin Google)'}: <span className="mono">{p.email}</span></p>
          <label>Nombre y apellidos<input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" /></label>
          <div className="dos">
            <label>Municipio<select value={municipio} onChange={(e) => setMunicipio(e.target.value)}><option value="">Prefiero no decirlo</option>{p.municipios.map((m) => <option key={m}>{m}</option>)}</select></label>
            <label>País de origen<select value={pais} onChange={(e) => setPais(e.target.value)}><option value="">Prefiero no decirlo</option>{[...p.paises, 'España', 'Otro'].map((m) => <option key={m}>{m}</option>)}</select></label>
          </div>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="pila">
            <legend className="tenue" style={{ fontSize: 12, padding: 0 }}>Qué te interesa</legend>
            <div className="dos">{p.intereses.map((i) => (
              <label key={i} className="marca-casilla"><input type="checkbox" checked={intereses.includes(i)} onChange={(e) => setIntereses(e.target.checked ? [...intereses, i] : intereses.filter((x) => x !== i))} />{i}</label>
            ))}</div>
          </fieldset>
        </>
      )}

      {paso === 3 && (
        <>
          <h1>¿Qué quieres recibir?</h1>
          <p className="nota">{p.aviso}</p>
          {Object.entries(p.finalidades).map(([k, t]) => (
            <label key={k} className="marca-casilla"><input type="checkbox" checked={!!fin[k]} onChange={(e) => setFin({ ...fin, [k]: e.target.checked })} />{t}</label>
          ))}
        </>
      )}

      {paso === 4 && (
        <>
          <h1>¿Quieres afiliarte?</h1>
          <p className="tenue">Es opcional. Puedes terminar sin hacerlo y decidirlo más adelante.</p>
          <label className="marca-casilla"><input type="checkbox" checked={afiliar} onChange={(e) => setAfiliar(e.target.checked)} />Quiero manifestar mi interés en afiliarme al Partido Popular</label>
          {afiliar && (
            <div className="pila">
              <p className="nota aviso">{p.manifestacion}</p>
              <label>Firma: escribe tu nombre y apellidos<input value={firma} onChange={(e) => setFirma(e.target.value)} autoComplete="off" /></label>
              <div className="firma" aria-hidden="true">{firma}</div>
              <label className="marca-casilla"><input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />He leído la manifestación y la firmo electrónicamente.</label>
            </div>
          )}
        </>
      )}

      {paso === 5 && hecho && (
        <div className="pila" role="status">
          <h1>Ya formas parte</h1>
          <p>Tu perfil está creado. Guardamos tus consentimientos con la versión {p.version}.</p>
          {hecho.firma && <p className="nota">Tu manifestación de interés queda firmada (referencia <span className="mono">{hecho.firma.slice(0, 8)}</span>). La afiliación la tramita y la formaliza el partido.</p>}
          <div><a className="boton primario" href="/mi-espacio">Entrar en mi espacio</a></div>
        </div>
      )}

      {error && <p className="nota error" role="alert">{error}</p>}
      {paso < 5 && (
        <div className="linea" style={{ justifyContent: 'space-between' }}>
          {paso > 2 ? <button className="boton" onClick={() => { setError(null); setPaso(paso - 1); }}>Atrás</button> : <span />}
          {paso < 4 ? <button className="boton primario" onClick={siguiente}>Continuar</button> : <button className="boton primario" onClick={enviar} disabled={ocupado}>{ocupado ? 'Guardando…' : afiliar ? 'Firmar y terminar' : 'Terminar'}</button>}
        </div>
      )}
    </div>
  );
}
