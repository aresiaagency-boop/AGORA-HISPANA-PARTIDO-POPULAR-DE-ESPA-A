import { googleListo } from '@/lib/auth';
import { NOMBRE, ROTULO } from '@/lib/modo';
import Logo from '@/components/Logo';
import MarcaPartido from '@/components/MarcaPartido';

export const dynamic = 'force-dynamic';

// Portada: dos accesos, los dos con Google OAuth.
export default function Portada() {
  const google = googleListo();
  return (
    <main className="publico">
      <div className="caja pila" style={{ width: 'min(760px, 100%)' }}>
        <section className="panel"><div className="panel-cuerpo">
          <div className="linea" style={{ justifyContent: 'space-between' }}><div className="marca"><Logo />{NOMBRE}</div><MarcaPartido /></div>
          {ROTULO && <span className="rotulo">{ROTULO}</span>}
          <h1>Elige tu acceso</h1>
          {!google && <p className="nota aviso">El acceso con Google se activa al configurar el cliente OAuth. Mientras tanto, Dirección puede entrar con la cuenta del owner.</p>}
        </div></section>
        <div className="dos">
          <a className="tarjeta acceso" href={google ? '/api/auth/google?proposito=entrar' : '/entrar'}>
            <span className="cod mono">01</span><h2>Dirección</h2><p className="tenue">Panel central: Mission Control, Estudio Viral, comunidad y PEPE.</p><span className="boton primario">Entrar con Google</span>
          </a>
          <a className="tarjeta acceso" href={google ? '/api/auth/google?proposito=alta' : '/alta'}>
            <span className="cod mono">02</span><h2>Afiliado VIP</h2><p className="tenue">Tu espacio personal: crea tu perfil paso a paso y habla con PEPE.</p><span className="boton primario">Entrar con Google</span>
          </a>
        </div>
      </div>
    </main>
  );
}
