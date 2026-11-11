import { exigirPublico } from '@/lib/guardias';
import { NOMBRE, ROTULO } from '@/lib/modo';
import { PAISES_HISPANOAMERICANOS } from '@/lib/voto';
import FormVoto from '@/components/FormVoto';
import Logo from '@/components/Logo';
import BarraNav from '@/components/BarraNav';

export const dynamic = 'force-dynamic';
export const metadata = { title: '¿Puedo votar?' };

export default async function PuedoVotar() {
  await exigirPublico();
  return (
    <main className="publico">
      <div className="caja panel">
        <div className="panel-cuerpo">
          <BarraNav salir={false} />
          <div className="marca"><Logo />{NOMBRE}</div>
          {ROTULO && <span className="rotulo">{ROTULO}</span>}
          <h1>¿Puedo votar en Baleares?</h1>
          <p className="tenue">Cuatro preguntas. Respuesta al momento, con la regla oficial y su plazo.</p>
          <FormVoto paises={PAISES_HISPANOAMERICANOS} />
        </div>
      </div>
    </main>
  );
}
