// Herramientas que n8n (PEPE) puede usar. El backend es la única puerta a los
// datos: n8n nunca toca la base. Todas son de lectura o de registro; ninguna
// aprueba, publica ni envía.
import { timingSafeEqual } from 'node:crypto';
import { auditar, q, uno } from '@/lib/db';
import { json } from '@/lib/guardias';
import { buscarFichas } from '@/lib/operaciones';
import { FUENTE_VOTO, PLAZOS, puedoVotar } from '@/lib/voto';

const HERRAMIENTAS: Record<string, (p: any) => Promise<unknown>> = {
  buscar_programa: async (p) => {
    const fichas = await buscarFichas(String(p.pregunta ?? ''), 2);
    return fichas.length
      ? { fichas: fichas.map((f) => ({ titulo: f.titulo, etiqueta: f.etiqueta, que_dice: f.que_dice, efecto_hoy: f.efecto_hoy, fuente: `${f.fuente_titulo} · ${f.fuente_url}` })) }
      : { fichas: [], instruccion: 'No hay ficha verificada. No respondas de memoria: usa escalar_humano.' };
  },
  puedo_votar: async (p) => ({
    ...puedoVotar({ nacionalidadEspanola: !!p.nacionalidadEspanola, pasaporteUE: !!p.pasaporteUE, pais: String(p.pais ?? ''), residenciaLegal: !!p.residenciaLegal, anosResidencia: Number(p.anosResidencia ?? 0) }),
    plazos: PLAZOS, fuente: FUENTE_VOTO,
  }),
  registrar_propuesta: async (p) => {
    const r = await uno(`INSERT INTO propuestas (autor, texto) VALUES ($1,$2) RETURNING id`, [String(p.autor ?? 'whatsapp'), String(p.texto ?? '').slice(0, 2000)]);
    return { propuesta_id: r!.id };
  },
  escalar_humano: async (p) => {
    await q(`INSERT INTO propuestas (autor, texto, estado) VALUES ($1,$2,'escalada')`, [String(p.autor ?? 'whatsapp'), String(p.texto ?? '').slice(0, 2000)]);
    return { estado: 'escalada', decir: 'Lo paso a una persona del equipo.' };
  },
  registrar_conversacion: async (p) => {
    await q('INSERT INTO conversaciones (canal, sesion, entrada, salida, herramienta) VALUES ($1,$2,$3,$4,$5)', [
      String(p.canal ?? 'whatsapp'), String(p.sesion ?? ''), String(p.entrada ?? '').slice(0, 2000), String(p.salida ?? '').slice(0, 4000), p.herramienta ?? null,
    ]);
    return { ok: true };
  },
};

export async function POST(req: Request, { params }: { params: Promise<{ nombre: string }> }) {
  const token = process.env.PEPE_N8N_TOKEN ?? '';
  const dado = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(dado), b = Buffer.from(token);
  if (token.length < 16 || a.length !== b.length || !timingSafeEqual(a, b)) return json({ error: 'No autorizado.' }, 401);
  const { nombre } = await params;
  const h = HERRAMIENTAS[nombre];
  if (!h) return json({ error: `La herramienta ${nombre} no existe.` }, 404);
  const resultado = await h((await req.json().catch(() => ({}))) ?? {});
  await auditar('pepe', 'herramienta', 'pepe', { nombre });
  return json(resultado);
}
