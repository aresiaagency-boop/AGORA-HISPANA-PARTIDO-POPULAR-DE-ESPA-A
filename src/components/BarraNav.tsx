'use client';
// Atrás y Salir, en todas las páginas.
export function BotonAtras() {
  return <button className="boton" type="button" onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/'))}>← Atrás</button>;
}

export default function BarraNav({ salir = false }: { salir?: boolean }) {
  return (
    <div className="linea" style={{ justifyContent: 'space-between' }}>
      <BotonAtras />
      {salir ? <form method="post" action="/api/auth/salir"><button className="boton">Salir</button></form> : <a className="boton" href="/">Inicio</a>}
    </div>
  );
}
