import { LOGO_PARTIDO } from '@/lib/marca-partido';

// Sello de cristal para la marca del partido. No pinta nada si no hay archivo oficial.
export default function MarcaPartido() {
  if (!LOGO_PARTIDO) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <span className="sello"><img src={LOGO_PARTIDO} alt="Partido Popular" /></span>;
}
