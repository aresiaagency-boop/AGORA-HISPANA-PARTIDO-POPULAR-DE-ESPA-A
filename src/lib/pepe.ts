// PEPE, el orquestador. Si hay n8n (PEPE_N8N_URL) le pasa el mensaje con su credencial;
// si no, o si n8n falla, responde en modo local con intenciones deterministas.
import { q, uno, auditar } from './db';
import { buscarFichas } from './operaciones';
import { PLAZOS, ELECCIONES } from './voto';

export interface RespuestaPepe { texto: string; herramienta: string | null; modo: 'n8n' | 'local' }

async function porN8n(mensaje: string, sesion: string, equipo: boolean): Promise<string | null> {
  const url = process.env.PEPE_N8N_URL;
  const token = process.env.PEPE_N8N_TOKEN;
  if (!url || !token) return null;
  const cuerpo = JSON.stringify({ canal: 'app', mensaje, sesion, equipo });
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-agora-token': token },
      body: cuerpo,
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { output?: string };
    return j.output ?? null;
  } catch { return null; }
}

async function local(mensaje: string, equipo: boolean, actor: string): Promise<{ texto: string; herramienta: string | null }> {
  const m = mensaje.toLowerCase();

  if (/\b(baja|stop|no me escrib)/.test(m)) {
    return { texto: 'Hecho: puedes darte de baja en un clic desde cualquier correo, o dime tu correo y lo paso al equipo ahora mismo. La baja vale para todos los canales.', herramienta: 'baja_comunidad' };
  }
  if (equipo && /\b(aprob|pendiente|cola)/.test(m)) {
    const p = await q(`SELECT id, titulo FROM piezas WHERE estado = 'pendiente_aprobacion' ORDER BY id`);
    const c = await q(`SELECT id, asunto FROM correos WHERE estado = 'borrador' ORDER BY id`);
    const lineas = [...p.map((x) => `· Pieza ${x.id}: ${x.titulo}`), ...c.map((x) => `· Correo ${x.id}: ${x.asunto}`)];
    return { texto: lineas.length ? `Esperan tu aprobación:\n${lineas.join('\n')}\nYo preparo; aprobar es cosa tuya, en la pantalla de cada sección.` : 'No hay nada esperando aprobación.', herramienta: 'estado_mission_control' };
  }
  if (equipo && /\b(radar|oportunidad|ranking|guion|lote|viral)/.test(m)) {
    const o = await q('SELECT titulo, puntuacion, estado FROM oportunidades ORDER BY puntuacion DESC LIMIT 4');
    return { texto: `Ranking del Estudio Viral:\n${o.map((x) => `· ${x.puntuacion} · ${x.estado} · ${x.titulo}`).join('\n')}\nPara generar un guion, abre Estudio Viral y pulsa «Generar guion» en una oportunidad de 70 o más.`, herramienta: 'ranking_oportunidades' };
  }
  if (equipo && /\b(estado|resumen|conexion)/.test(m)) {
    const c = await q('SELECT nombre, estado FROM conexiones ORDER BY canal');
    return { texto: `Conexiones:\n${c.map((x) => `· ${x.nombre}: ${x.estado}`).join('\n')}`, herramienta: 'estado_mission_control' };
  }
  if (/\b(vot|censo|cere|elecci)/.test(m)) {
    return {
      texto: `Depende de tu nacionalidad y de tus años de residencia legal. Las municipales son el ${ELECCIONES.municipales}. Si tu país tiene acuerdo de voto (Bolivia, Chile, Colombia, Ecuador, Paraguay o Perú) y llevas cinco años de residencia legal, tienes que pedir tu inscripción en el censo entre el ${PLAZOS.acuerdoDesde} y el ${PLAZOS.acuerdoHasta}. Compruébalo en un minuto en «¿Puedo votar?» (/puedo-votar).\nFuente: INE, censo electoral de extranjeros.`,
      herramienta: 'puedo_votar',
    };
  }
  if (/\b(propuesta|propongo|suger)/.test(m)) {
    const r = await uno(`INSERT INTO propuestas (autor, texto) VALUES ($1,$2) RETURNING id`, [actor, mensaje.slice(0, 2000)]);
    return { texto: `Recibida. La he registrado como propuesta ${r!.id} para el equipo.`, herramienta: 'registrar_propuesta' };
  }
  const fichas = await buscarFichas(mensaje, 1);
  if (fichas.length) {
    const f = fichas[0];
    return {
      texto: `${f.titulo} (${String(f.etiqueta).toLowerCase()}).\n${f.que_dice}\nCómo te afecta hoy: ${f.efecto_hoy}\nFuente: ${f.fuente_titulo} · ${f.fuente_url}`,
      herramienta: 'buscar_programa',
    };
  }
  await q(`INSERT INTO propuestas (autor, texto, estado) VALUES ($1,$2,'escalada')`, [actor, mensaje.slice(0, 2000)]);
  return { texto: 'No tengo una ficha verificada sobre eso y no quiero inventar. Déjame pasarlo a una persona del equipo.', herramienta: 'escalar_humano' };
}

export async function pepe(mensaje: string, o: { sesion: string; equipo: boolean; actor: string }): Promise<RespuestaPepe> {
  const limpio = mensaje.trim().slice(0, 2000);
  const primera = !(await uno('SELECT 1 AS x FROM conversaciones WHERE sesion = $1 LIMIT 1', [o.sesion]));
  const remoto = await porN8n(limpio, o.sesion, o.equipo);
  const r = remoto ? { texto: remoto, herramienta: null as string | null } : await local(limpio, o.equipo, o.actor);
  const texto = primera ? `Soy Pepe, un asistente de inteligencia artificial de Ágora Hispana.\n${r.texto}` : r.texto;
  await q('INSERT INTO conversaciones (canal, sesion, entrada, salida, herramienta) VALUES ($1,$2,$3,$4,$5)', ['app', o.sesion, limpio, texto, r.herramienta]);
  await auditar('pepe', 'responder', 'pepe', { herramienta: r.herramienta, modo: remoto ? 'n8n' : 'local' });
  return { texto, herramienta: r.herramienta, modo: remoto ? 'n8n' : 'local' };
}
