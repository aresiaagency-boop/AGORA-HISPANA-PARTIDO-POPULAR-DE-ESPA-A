import { redirect } from 'next/navigation';
import { uno } from '@/lib/db';
import { exigirPublico } from '@/lib/guardias';
import { googleListo } from '@/lib/auth';
import { NOMBRE, ROTULO } from '@/lib/modo';
import { AVISO_PRIVACIDAD, FINALIDADES, INTERESES, MANIFESTACION, MUNICIPIOS, VERSION_TEXTOS } from '@/lib/textos';
import { PAISES_HISPANOAMERICANOS } from '@/lib/voto';
import FormAlta from '@/components/FormAlta';
import Logo from '@/components/Logo';
import MarcaPartido from '@/components/MarcaPartido';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Alta' };

export default async function Alta({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  const s = await exigirPublico();
  const { i } = await searchParams;
  if (s && (await uno('SELECT 1 AS x FROM personas WHERE email = $1 AND baja IS NULL', [s.email]))) redirect('/mi-espacio');
  return (
    <main className="publico">
      <div className="caja panel" style={{ width: 'min(680px, 100%)' }}>
        <div className="panel-cuerpo">
          <div className="linea" style={{ justifyContent: 'space-between' }}><div className="marca"><Logo />{NOMBRE}</div><MarcaPartido /></div>
          {ROTULO && <span className="rotulo">{ROTULO}</span>}
          {s ? (
            <FormAlta email={s.email} viaGoogle={s.via === 'google'} nombreGoogle={s.nombre === 'Owner' ? '' : s.nombre} invitacion={i && /^[\w-]{4,20}$/.test(i) ? i : null}
              municipios={MUNICIPIOS} paises={PAISES_HISPANOAMERICANOS} intereses={INTERESES} finalidades={FINALIDADES} manifestacion={MANIFESTACION} aviso={AVISO_PRIVACIDAD} version={VERSION_TEXTOS} />
          ) : (
            <>
              <div className="progreso" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del alta"><i style={{ width: '0%' }} /></div>
              <p className="tenue mono">Paso 1 de 5 · 0 %</p>
              <h1>Únete a Ágora Hispana</h1>
              <p className="tenue">Primero confirmamos que eres tú con tu cuenta de Google. Después eliges qué quieres recibir y, si quieres, firmas tu interés en afiliarte.</p>
              {googleListo() ? <a className="boton primario" href="/api/auth/google?proposito=alta">Continuar con Google</a> : <p className="nota aviso">El alta se abre al configurar el acceso con Google.</p>}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
