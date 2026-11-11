import type { Metadata, Viewport } from 'next';
import { NOMBRE, esDemo } from '@/lib/modo';
import { ICONO_PARTIDO } from '@/lib/marca-partido';
import Reactor from '@/components/Reactor';
import './globals.css';

export const metadata: Metadata = {
  title: { default: NOMBRE, template: `%s · ${NOMBRE}` },
  description: 'Plataforma viva de la comunidad hispanoamericana de Baleares.',
  robots: esDemo ? { index: false, follow: false } : undefined,
  icons: { icon: ICONO_PARTIDO ?? '/icon.svg', apple: ICONO_PARTIDO ?? '/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Ágora Hispana' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#020b18' };

export default function Raiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Reactor />
      </body>
    </html>
  );
}
