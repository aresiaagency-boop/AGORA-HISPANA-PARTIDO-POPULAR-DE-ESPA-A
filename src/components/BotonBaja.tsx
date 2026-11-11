'use client';
import { useState } from 'react';

export default function BotonBaja({ e, t }: { e: string; t: string }) {
  const [estado, setEstado] = useState<'listo' | 'ocupado' | 'hecho' | 'error'>('listo');
  async function baja() {
    setEstado('ocupado');
    try {
      const r = await fetch('/api/v1/baja', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ e, t }) });
      setEstado(r.ok ? 'hecho' : 'error');
    } catch { setEstado('error'); }
  }
  if (estado === 'hecho') return <p className="nota" role="status">Baja completada. No volverás a recibir comunicaciones por ningún canal.</p>;
  return (
    <div className="pila">
      <div><button className="boton peligro" onClick={baja} disabled={estado === 'ocupado'}>{estado === 'ocupado' ? 'Tramitando…' : 'Confirmar la baja'}</button></div>
      {estado === 'error' && <p className="nota error" role="alert">El enlace de baja no es válido o ha caducado. Responde al correo y lo hacemos a mano.</p>}
    </div>
  );
}
