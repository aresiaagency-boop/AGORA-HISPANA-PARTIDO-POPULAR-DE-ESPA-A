// Guardias de acceso para páginas y rutas.
import { redirect } from 'next/navigation';
import { esEquipo, puedeVerPublico, sesion, type Sesion } from './auth';

export async function exigirEquipo(): Promise<Sesion> {
  const s = await sesion();
  if (!esEquipo(s)) redirect('/entrar');
  return s;
}

// Páginas públicas: en demo solo las ve el equipo.
export async function exigirPublico(): Promise<Sesion | null> {
  const s = await sesion();
  if (!puedeVerPublico(s)) redirect('/entrar');
  return s;
}

export const json = (cuerpo: unknown, status = 200) => Response.json(cuerpo, { status, headers: { 'cache-control': 'no-store' } });
