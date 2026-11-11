import Link from 'next/link';
import { redirect } from 'next/navigation';
import { esEquipo, sesion } from '@/lib/auth';
import { esDemo, NOMBRE, ROTULO } from '@/lib/modo';
import Logo from '@/components/Logo';

export const dynamic = 'force-dynamic';

export default async function Portada() {
  const s = await sesion();
  if (esEquipo(s)) redirect('/consola');
  if (esDemo) redirect('/entrar');
  return (
    <main className="publico">
      <div className="caja panel">
        <div className="panel-cuerpo">
          <div className="marca"><Logo />{NOMBRE}</div>
          {ROTULO && <span className="rotulo">{ROTULO}</span>}
          <h1>Tu voz cuenta en Baleares</h1>
          <p className="tenue">Comprueba si puedes votar, entiende qué propone cada medida y cómo te afecta, y decide si quieres participar.</p>
          <div className="linea">
            <Link className="boton primario" href="/puedo-votar">¿Puedo votar?</Link>
            <Link className="boton" href="/alta">Quiero participar</Link>
            <Link className="boton" href="/entrar">Acceso del equipo</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
