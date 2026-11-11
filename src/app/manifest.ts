import type { MetadataRoute } from 'next';
import { MARCA } from '@/lib/modo';

// Instalable en tablet como panel a pantalla completa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: MARCA,
    short_name: 'Ágora',
    description: 'Mission Control de Ágora Hispana.',
    start_url: '/consola',
    display: 'fullscreen',
    display_override: ['fullscreen', 'standalone'],
    orientation: 'any',
    background_color: '#020b18',
    theme_color: '#020b18',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
