'use client';
// Botón que ejecuta una operación con una carga fija y refresca la pantalla.
// Si la acción necesita un dato (motivo, fecha), lo pide en línea: sin diálogos.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Campo { nombre: string; etiqueta: string; tipo?: string; valor?: string }

export default function Accion({ codigo, payload, etiqueta, clase = '', campo }: { codigo: string; payload: Record<string, unknown>; etiqueta: string; clase?: string; campo?: Campo }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState(campo?.valor ?? '');
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function lanzar() {
    if (campo && !abierto) { setAbierto(true); return; }
    setOcupado(true); setError(null);
    try {
      const r = await fetch(`/api/v1/operaciones/${codigo}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(campo ? { ...payload, [campo.nombre]: valor } : payload),
      });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? 'No se ha podido completar.'); else { setAbierto(false); router.refresh(); }
    } catch { setError('No hay conexión con el servidor.'); } finally { setOcupado(false); }
  }

  return (
    <span className="linea">
      {campo && abierto && (
        <label style={{ minWidth: 220 }}><span className="sr">{campo.etiqueta}</span>
          <input type={campo.tipo ?? 'text'} value={valor} onChange={(e) => setValor(e.target.value)} placeholder={campo.etiqueta} autoFocus />
        </label>
      )}
      <button className={`boton ${clase}`} onClick={lanzar} disabled={ocupado}>{ocupado ? '…' : abierto ? `Confirmar: ${etiqueta.toLowerCase()}` : etiqueta}</button>
      {abierto && <button className="boton" onClick={() => setAbierto(false)}>Cancelar</button>}
      {error && <span className="nota error" role="alert">{error}</span>}
    </span>
  );
}
