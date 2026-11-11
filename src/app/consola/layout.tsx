import { exigirEquipo } from '@/lib/guardias';
import { motor } from '@/lib/db';
import { MODO, NOMBRE, ROTULO } from '@/lib/modo';
import { SECCIONES } from '@/lib/secciones';
import Menu from '@/components/Menu';
import Logo from '@/components/Logo';
import MarcaPartido from '@/components/MarcaPartido';

export const dynamic = 'force-dynamic';

export default async function Consola({ children }: { children: React.ReactNode }) {
  const s = await exigirEquipo();
  const base = await motor();
  return (
    <div className="app">
      <header className="barra">
        <div className="marca"><Logo />{NOMBRE}</div>
        <MarcaPartido />
        {ROTULO && <span className="rotulo">{ROTULO}</span>}
        <span className="hueco" />
        <span className="quien">{s.nombre} · {s.rol}</span>
        <form method="post" action="/api/auth/salir"><button className="boton">Salir</button></form>
      </header>
      <aside className="lateral">
        <nav aria-label="Secciones"><Menu secciones={SECCIONES.map(({ codigo, slug, nombre, alcance }) => ({ codigo, slug, nombre, alcance }))} /></nav>
        <div className="control" aria-label="Panel de control">
          <div className="fila"><span>MODO</span><b>{MODO}</b></div>
          <div className="fila"><span>BASE</span><b>{base.tipo}</b></div>
          <div className="fila"><span>SESIÓN</span><b>{s.rol}</b></div>
        </div>
      </aside>
      <main className="lienzo">{children}</main>
    </div>
  );
}
