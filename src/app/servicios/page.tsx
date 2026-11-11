// Servicios de la comunidad: directorio informativo, abierto a cualquiera.
// No es un incentivo: no hay ventajas por afiliarse ni se comparten datos.
import { exigirPublico } from '@/lib/guardias';
import { NOMBRE, ROTULO } from '@/lib/modo';
import BarraNav from '@/components/BarraNav';
import Logo from '@/components/Logo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Servicios de la comunidad' };

const url = (v?: string) => (v && /^https:\/\/[\w.-]+(\/\S*)?$/.test(v) ? v : null);
const SERVICIOS = [
  { nombre: 'BUROFAST', que: 'Trámites de extranjería', detalle: 'Residencia y arraigo, trabajo, nacionalidad, reagrupación familiar, visados y estudios, NIE y TIE.', enlace: url(process.env.SERVICIO_BUROFAST_URL) },
  { nombre: 'BUROINSTANT', que: 'Crear y gestionar tu empresa', detalle: 'Alta como autónomo o creación de una pyme: forma jurídica, obligaciones, documentos y calendario.', enlace: url(process.env.SERVICIO_BUROINSTANT_URL ?? 'https://buroinstant.vercel.app') },
];

export default async function Servicios() {
  const s = await exigirPublico();
  return (
    <main className="publico">
      <div className="caja panel" style={{ width: 'min(680px, 100%)' }}>
        <div className="panel-cuerpo">
          <BarraNav salir={!!s} />
          <div className="marca"><Logo />{NOMBRE}</div>
          {ROTULO && <span className="rotulo">{ROTULO}</span>}
          <h1>Servicios de la comunidad</h1>
          <p className="tenue">Empresas de miembros de la comunidad que pueden serte útiles. Son servicios privados e independientes de Ágora y del partido.</p>
          {SERVICIOS.map((x) => (
            <div key={x.nombre} className="tarjeta">
              <h2>{x.nombre} · {x.que}</h2>
              <p className="tenue">{x.detalle}</p>
              {x.enlace ? <div><a className="boton" href={x.enlace} target="_blank" rel="noopener noreferrer">Visitar {x.nombre}</a></div> : <p className="tenue">Enlace disponible próximamente.</p>}
            </div>
          ))}
          <p className="nota">Transparencia: BUROFAST y BUROINSTANT pertenecen a promotores de esta plataforma. Aparecen aquí para cualquier persona, esté o no registrada o afiliada. Afiliarte no da descuentos ni ventajas en ellos, usarlos no es condición para nada, y Ágora no les cede tus datos: si los visitas, les das tú la información que quieras.</p>
        </div>
      </div>
    </main>
  );
}
