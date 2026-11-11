'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Menu({ secciones }: { secciones: { codigo: string; slug: string; nombre: string; alcance: string }[] }) {
  const ruta = usePathname();
  return (
    <table className="menu">
      <thead><tr><th>N &nbsp;·&nbsp; SECCIÓN</th></tr></thead>
      <tbody>
        {secciones.map((s) => {
          const href = s.slug ? `/consola/${s.slug}` : '/consola';
          const activa = ruta === href;
          return (
            <tr key={s.codigo}><td>
              <Link href={href} className={activa ? 'activa' : ''} aria-current={activa ? 'page' : undefined}>
                <span className="n">{s.codigo}</span><span>{s.nombre}</span><span className={`nivel ${s.alcance}`} title={`Alcance en la beta: ${s.alcance}`} />
              </Link>
            </td></tr>
          );
        })}
      </tbody>
    </table>
  );
}
