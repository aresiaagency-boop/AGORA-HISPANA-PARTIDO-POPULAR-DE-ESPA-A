import { notFound } from 'next/navigation';
import { porSlug } from '@/lib/secciones';
import Operacion from '@/components/Operacion';
import EstudioViral from './estudio';
import { Prevista, VISTAS } from './vistas';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ seccion: string }> }) {
  return { title: porSlug((await params).seccion)?.nombre ?? 'Sección' };
}

export default async function Pagina({ params }: { params: Promise<{ seccion: string }> }) {
  const s = porSlug((await params).seccion);
  if (!s || !s.slug) notFound();
  const Vista = VISTAS[s.slug];
  return (
    <div className="pagina">
      <header className="cab-seccion">
        <div><span className="cod">{s.codigo} · {s.agente}</span><h1>{s.nombre}</h1><p className="tenue">{s.sub}</p></div>
        <span className={`chip ${s.alcance === 'Completa' ? 'c-conectado' : s.alcance === 'Básica' ? 'c-sesion_agente' : 'c-apagado'}`}>Alcance en la beta: {s.alcance}</span>
      </header>
      {s.slug === 'estudio-viral' ? <EstudioViral /> : Vista ? await Vista({ s }) : <Prevista s={s} />}
      {s.ops.length > 0 && (
        <section className="panel">
          <div className="panel-cab"><h3>Operaciones</h3><span className="meta">{s.ops.length} · consola directa</span></div>
          <div className="panel-cuerpo"><div className="tres">{s.ops.map((o) => <Operacion key={o.codigo} {...o} />)}</div></div>
        </section>
      )}
    </div>
  );
}
