import { redirect } from 'next/navigation';
import { authLista, claveListo, esEquipo, googleListo, sesion } from '@/lib/auth';
import { NOMBRE, ROTULO } from '@/lib/modo';
import Logo from '@/components/Logo';
import BarraNav from '@/components/BarraNav';
import MarcaPartido from '@/components/MarcaPartido';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Entrar' };

const ERRORES: Record<string, string> = {
  credenciales: 'El correo o la contraseña no coinciden.',
  intentos: 'Demasiados intentos. Espera unos minutos.',
  google: 'Google no ha confirmado tu identidad. Vuelve a intentarlo.',
  demo: 'La demostración está reservada al equipo. Tu cuenta no figura en él.',
  origen: 'La petición no venía de esta aplicación.',
};

export default async function Entrar({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (esEquipo(await sesion())) redirect('/consola');
  const { error } = await searchParams;
  return (
    <main className="publico">
      <div className="caja panel">
        <div className="panel-cuerpo">
          <BarraNav salir={false} />
          <div className="linea" style={{ justifyContent: 'space-between' }}><div className="marca"><Logo />{NOMBRE}</div><MarcaPartido /></div>
          {ROTULO && <span className="rotulo">{ROTULO}</span>}
          <h1>Acceso del equipo</h1>
          {error && <p className="nota error" role="alert">{ERRORES[error] ?? 'No se ha podido entrar.'}</p>}
          {!authLista() && <p className="nota aviso">Falta la variable AUTH_SECRET. Sin ella no puede entrar nadie: no hay secreto por defecto.</p>}
          {googleListo() ? (
            <a className="boton primario" href="/api/auth/google?proposito=entrar">Entrar con Google</a>
          ) : (
            <p className="nota">El acceso con Google se activa al configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.</p>
          )}
          {claveListo() && (
            <>
              <div className="separador">o con la cuenta del owner</div>
              <form method="post" action="/api/auth/entrar" className="pila">
                <label>Correo<input name="email" type="email" autoComplete="username" required /></label>
                <label>Contraseña<input name="clave" type="password" autoComplete="current-password" required /></label>
                <button className="boton">Entrar</button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
