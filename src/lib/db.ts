// Una sola puerta a la base. Con DATABASE_URL usa PostgreSQL; sin ella, y solo en
// demo, una base en memoria (PGlite) que se siembra sola y no persiste.
import { MIGRACIONES } from './esquema';
import { sembrar } from './semilla';
import { esDemo } from './modo';

type Fila = Record<string, any>;
interface Motor {
  tipo: 'postgres' | 'memoria';
  query(texto: string, params?: unknown[]): Promise<{ rows: Fila[] }>;
  exec(texto: string): Promise<void>;
}

const g = globalThis as unknown as { __agora?: Promise<Motor> };

async function crear(): Promise<Motor> {
  let m: Motor;
  if (process.env.DATABASE_URL) {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      ssl: process.env.DATABASE_SSL === 'off' ? undefined : { rejectUnauthorized: false },
    });
    m = {
      tipo: 'postgres',
      query: (t, p) => pool.query(t, p as any[]),
      exec: async (t) => { await pool.query(t); },
    };
  } else {
    if (!esDemo) throw new Error('DATABASE_URL es obligatoria en modo oficial.');
    const { PGlite } = await import('@electric-sql/pglite');
    const pg = new PGlite();
    m = {
      tipo: 'memoria',
      query: (t, p) => pg.query(t, p as any[]) as unknown as Promise<{ rows: Fila[] }>,
      exec: async (t) => { await pg.exec(t); },
    };
  }
  await m.exec('CREATE TABLE IF NOT EXISTS migraciones (id text PRIMARY KEY, aplicada timestamptz NOT NULL DEFAULT now())');
  const hechas = new Set((await m.query('SELECT id FROM migraciones')).rows.map((r) => r.id));
  for (const mig of MIGRACIONES) {
    if (hechas.has(mig.id)) continue;
    await m.exec(mig.sql);
    await m.query('INSERT INTO migraciones (id) VALUES ($1)', [mig.id]);
  }
  if (esDemo) await sembrar((t, p) => m.query(t, p));
  return m;
}

export function motor(): Promise<Motor> {
  if (!g.__agora) {
    g.__agora = crear().catch((e) => { g.__agora = undefined; throw e; });
  }
  return g.__agora;
}

export async function q<T = Fila>(texto: string, params: unknown[] = []): Promise<T[]> {
  return (await (await motor()).query(texto, params)).rows as T[];
}

export async function uno<T = Fila>(texto: string, params: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(texto, params))[0];
}

export async function auditar(actor: string, accion: string, objeto: string, detalle: unknown = {}): Promise<void> {
  await q('INSERT INTO registro_auditoria (actor, accion, objeto, detalle) VALUES ($1,$2,$3,$4::jsonb)', [
    actor, accion, objeto, JSON.stringify(detalle),
  ]);
}
