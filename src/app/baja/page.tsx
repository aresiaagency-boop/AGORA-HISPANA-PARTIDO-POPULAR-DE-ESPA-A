import { NOMBRE } from '@/lib/modo';
import BotonBaja from '@/components/BotonBaja';
import Logo from '@/components/Logo';
import BarraNav from '@/components/BarraNav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Baja' };

// La baja no exige sesión, ni siquiera en demo: es un derecho de la persona.
export default async function Baja({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e, t } = await searchParams;
  return (
    <main className="publico">
      <div className="caja panel">
        <div className="panel-cuerpo">
          <BarraNav salir={false} />
          <div className="marca"><Logo />{NOMBRE}</div>
          <h1>Darte de baja</h1>
          {e && t ? <><p>Vas a dar de baja <span className="mono">{e}</span> de todas las comunicaciones.</p><BotonBaja e={e} t={t} /></> : <p className="nota aviso">Abre el enlace de baja que aparece al pie de cualquiera de nuestros correos.</p>}
        </div>
      </div>
    </main>
  );
}
