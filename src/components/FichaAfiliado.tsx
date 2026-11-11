'use client';
// Ficha de un afiliado en el panel de Dirección: datos, aprobación, edición, baja y borrado.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface P { id: string; nombre: string; email: string; municipio: string | null; pais_origen: string | null; telefono: string | null; estado: string; baja: boolean; es_demo: boolean; finalidades: string | null; interes: boolean; firmas: number; invitados: number; alta: string; aprobado_por: string | null }
const CHIP: Record<string, [string, string]> = { pendiente: ['Espera aprobación', 'c-pendiente'], aprobado: ['Aprobado', 'c-conectado'], rechazado: ['Rechazado', 'c-caducada'] };

export default function FichaAfiliado({ p }: { p: P }) {
  const router = useRouter();
  const [edita, setEdita] = useState(false);
  const [borra, setBorra] = useState(false);
  const [f, setF] = useState({ nombre: p.nombre, municipio: p.municipio ?? '', pais_origen: p.pais_origen ?? '', telefono: p.telefono ?? '' });
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function op(codigo: string, carga: Record<string, unknown>) {
    setOcupado(true); setError(null);
    try {
      const r = await fetch(`/api/v1/operaciones/${codigo}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(carga) });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? 'No se ha podido completar.'); else { setEdita(false); setBorra(false); router.refresh(); }
    } catch { setError('No hay conexión con el servidor.'); } finally { setOcupado(false); }
  }
  const [txt, cls] = p.baja ? ['Baja', 'c-caducada'] : CHIP[p.estado] ?? [p.estado, 'c-apagado'];

  return (
    <div className="tarjeta">
      <div className="linea" style={{ justifyContent: 'space-between' }}>
        <h2>{p.nombre}{p.es_demo && <span className="tenue"> · prueba</span>}</h2>
        <span className={`chip ${cls}`}>{txt}</span>
      </div>
      <span className="tenue"><span className="mono">{p.email}</span> · {p.municipio ?? 'sin municipio'} · {p.pais_origen ?? 'sin origen'} · {p.telefono ?? 'sin teléfono'}</span>
      <span className="tenue">Alta: {p.alta} · Consiente: {p.finalidades ?? 'nada'} · Interés en afiliarse: {p.interes ? `sí (${p.firmas} firma)` : 'no'} · Invitados: {p.invitados}{p.aprobado_por ? ` · Decidido por ${p.aprobado_por}` : ''}</span>
      {edita && (
        <div className="dos">
          <label>Nombre<input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
          <label>Teléfono<input value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} inputMode="tel" /></label>
          <label>Municipio<input value={f.municipio} onChange={(e) => setF({ ...f, municipio: e.target.value })} /></label>
          <label>País de origen<input value={f.pais_origen} onChange={(e) => setF({ ...f, pais_origen: e.target.value })} /></label>
        </div>
      )}
      {error && <p className="nota error" role="alert">{error}</p>}
      <div className="linea">
        {!p.baja && p.estado !== 'aprobado' && <button className="boton primario" disabled={ocupado} onClick={() => op('05.04', { persona_id: p.id, decision: 'aprobar' })}>Aprobar</button>}
        {!p.baja && p.estado !== 'rechazado' && <button className="boton" disabled={ocupado} onClick={() => op('05.04', { persona_id: p.id, decision: 'rechazar' })}>Rechazar</button>}
        {edita ? <><button className="boton primario" disabled={ocupado} onClick={() => op('05.05', { persona_id: p.id, ...f })}>Guardar</button><button className="boton" onClick={() => setEdita(false)}>Cancelar</button></> : <button className="boton" onClick={() => setEdita(true)}>Editar</button>}
        {!p.baja && <button className="boton" disabled={ocupado} onClick={() => op('05.03', { email: p.email })}>Dar de baja</button>}
        {borra ? <><button className="boton peligro" disabled={ocupado} onClick={() => op('05.06', { persona_id: p.id })}>Confirmar borrado definitivo</button><button className="boton" onClick={() => setBorra(false)}>Cancelar</button></> : <button className="boton peligro" onClick={() => setBorra(true)}>Borrar</button>}
      </div>
    </div>
  );
}
