// Manejadores de las operaciones de la consola. Regla de oro: todo nace en
// borrador; aprobar, publicar y enviar son siempre un acto humano registrado.
import { q, uno, auditar } from './db';
import { esDemo } from './modo';
import { puedoVotar, FUENTE_VOTO, PLAZOS } from './voto';
import { decidir, demandaDeSenales, evaluarHook, generarGuion, puntuar, revisarLimites, type PatronId } from './estudio';
import { enviarGmail, listaPrueba } from './correo';

export interface Ctx { actor: string; rol: string }
type Manejador = (p: any, ctx: Ctx) => Promise<unknown>;

function exigir(cond: unknown, mensaje: string): asserts cond { if (!cond) throw new Error(mensaje); }

export async function buscarFichas(pregunta: string, limite = 3) {
  const fichas = await q(`SELECT * FROM fichas WHERE estado = 'publicada'`);
  const palabras = pregunta.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  return fichas
    .map((f) => {
      const texto = `${f.titulo} ${f.que_dice} ${f.efecto_hoy} ${(f.perfiles as string[]).join(' ')}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      return { f, n: palabras.filter((w) => texto.includes(w.slice(0, 6))).length };
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, limite)
    .map((x) => x.f);
}

// Cada publicación se comparte con la comunidad: se prepara el correo, y una persona lo aprueba.
async function difundir(piezaId: number, actor: string) {
  const pieza = await uno('SELECT id, titulo, guion FROM piezas WHERE id = $1', [piezaId]);
  exigir(pieza, 'No existe esa pieza.');
  const pubs = await q('SELECT canal FROM publicaciones WHERE pieza_id = $1', [piezaId]);
  exigir(pubs.length, 'La pieza todavía no se ha publicado.');
  const cuerpo = `Hola:\n\nAcabamos de publicar «${pieza.titulo}».\n\n${pieza.guion.hooks[0]}\n${pieza.guion.cta}. ${pieza.guion.fuente_en_pantalla}\n\nEstá en ${pubs.map((p) => p.canal).join(', ')}. Si te sirve, compártelo con quien lo necesite.`;
  const c = await uno(`INSERT INTO correos (asunto, cuerpo, segmento, estado) VALUES ($1,$2,$3::jsonb,'borrador') RETURNING id`, [`Nuevo: ${pieza.titulo}`, cuerpo, JSON.stringify({ finalidad: 'comunicaciones_politicas', pieza: piezaId })]);
  await auditar(actor, 'difundir', 'gmail', { correo: c!.id, pieza: piezaId });
  return { correo_id: c!.id, estado: 'borrador' };
}

export const MANEJADORES: Record<string, Manejador> = {
  '19.06': async (p, ctx) => difundir(Number(p.pieza_id), ctx.actor),

  '01.05': async (p) => {
    const fichas = await buscarFichas(String(p.pregunta ?? ''));
    return fichas.length ? { fichas } : { fichas: [], nota: 'Sin ficha que lo respalde. Se escala a una persona.' };
  },

  '02.01': async (p) => ({
    ...puedoVotar({
      nacionalidadEspanola: !!p.nacionalidadEspanola, pasaporteUE: !!p.pasaporteUE, pais: String(p.pais ?? ''),
      residenciaLegal: !!p.residenciaLegal, anosResidencia: Number(p.anosResidencia ?? 0),
    }),
    plazos: PLAZOS, fuente: FUENTE_VOTO,
  }),

  '05.01': async () => ({
    personas: await q(`SELECT p.nombre, p.municipio, p.pais_origen, p.situacion_voto, p.interes_afiliacion, p.es_demo, p.baja IS NOT NULL AS de_baja,
      (SELECT count(*)::int FROM consentimientos c WHERE c.persona_id = p.id AND c.otorgado) AS finalidades
      FROM personas p ORDER BY p.creada`),
  }),

  '05.04': async (p, ctx) => {
    const per = await uno('SELECT id FROM personas WHERE id = $1', [String(p.persona_id)]);
    exigir(per, 'No existe ese perfil.');
    const estado = p.decision === 'aprobar' ? 'aprobado' : 'rechazado';
    await q('UPDATE personas SET estado = $1, aprobado_por = $2, aprobado_en = now() WHERE id = $3', [estado, ctx.actor, per.id]);
    await q(`INSERT INTO aprobaciones (tipo, ref_id, decision, motivo, actor) VALUES ('afiliado', 0, $1, $2, $3)`, [estado, String(per.id), ctx.actor]);
    await auditar(ctx.actor, estado === 'aprobado' ? 'aprobar' : 'rechazar', 'comunidad', { persona: per.id });
    return { persona_id: per.id, estado };
  },

  '05.05': async (p, ctx) => {
    const per = await uno('SELECT * FROM personas WHERE id = $1', [String(p.persona_id)]);
    exigir(per, 'No existe ese perfil.');
    const nombre = String(p.nombre ?? per.nombre).trim();
    exigir(nombre.length >= 3, 'El nombre no puede quedar vacío.');
    await q('UPDATE personas SET nombre = $1, municipio = $2, pais_origen = $3, telefono = $4 WHERE id = $5', [
      nombre, p.municipio === undefined ? per.municipio : p.municipio || null, p.pais_origen === undefined ? per.pais_origen : p.pais_origen || null,
      p.telefono === undefined ? per.telefono : String(p.telefono).replace(/[^\d+ ]/g, '').slice(0, 20) || null, per.id,
    ]);
    await auditar(ctx.actor, 'editar', 'comunidad', { persona: per.id });
    return { persona_id: per.id, estado: 'actualizado' };
  },

  '05.06': async (p, ctx) => {
    const per = await uno('SELECT id FROM personas WHERE id = $1', [String(p.persona_id)]);
    exigir(per, 'No existe ese perfil.');
    await q('UPDATE personas SET invitado_por = NULL WHERE invitado_por = $1', [per.id]);
    await q('DELETE FROM consentimientos WHERE persona_id = $1', [per.id]);
    await q('DELETE FROM firmas WHERE persona_id = $1', [per.id]);
    await q('DELETE FROM personas WHERE id = $1', [per.id]);
    await auditar(ctx.actor, 'borrar', 'comunidad', { persona: per.id });
    return { estado: 'borrado' };
  },

  '05.03': async (p, ctx) => {
    const persona = await uno('SELECT id FROM personas WHERE email = $1', [String(p.email ?? '').toLowerCase()]);
    exigir(persona, 'No hay nadie registrado con ese correo.');
    await q('UPDATE personas SET baja = now() WHERE id = $1', [persona.id]);
    await q(`INSERT INTO consentimientos (persona_id, finalidad, otorgado, texto_version, texto_hash, origen)
             SELECT $1, finalidad, false, 'baja', 'baja', 'baja' FROM (SELECT DISTINCT finalidad FROM consentimientos WHERE persona_id = $1) f`, [persona.id]);
    await auditar(ctx.actor, 'baja', 'comunidad', { persona: persona.id });
    return { estado: 'baja ejecutada' };
  },

  '07.18': async () => ({
    senales: await q('SELECT plataforma, hook, formato, multiplicador, vistas, tema, patron, url, captada FROM senales ORDER BY multiplicador DESC'),
    nota: 'El radar se refresca desde la sesión de agente con el conector de vidIQ (5 créditos por búsqueda).',
  }),

  '07.19': async () => ({ patrones: await q('SELECT * FROM patrones ORDER BY id') }),

  '07.20': async (_p, ctx) => {
    const ops = await q('SELECT * FROM oportunidades ORDER BY id');
    for (const o of ops) {
      const mult = (await q<{ multiplicador: number }>('SELECT multiplicador FROM senales WHERE patron = $1', [o.patron_id])).map((s) => s.multiplicador);
      const ficha = o.ficha_id ? await uno('SELECT estado FROM fichas WHERE id = $1', [o.ficha_id]) : null;
      const riesgo = ficha?.estado === 'publicada' ? Math.min(o.riesgo, 10) : Math.max(o.riesgo, 35);
      const demanda = demandaDeSenales(mult);
      const puntuacion = puntuar({ demanda, riesgo, retencion: o.retencion, ajuste: o.ajuste, utilidad: o.utilidad, eficiencia: o.eficiencia });
      const estado = ['producida', 'descartada_manual'].includes(o.estado) ? o.estado : decidir(puntuacion);
      const motivo = ficha?.estado === 'publicada' ? null : 'La ficha que lo respalda está sin verificar.';
      await q('UPDATE oportunidades SET demanda=$1, riesgo=$2, puntuacion=$3, estado=$4, motivo=$5 WHERE id=$6', [demanda, riesgo, puntuacion, estado, motivo, o.id]);
    }
    await auditar(ctx.actor, 'ranking', 'estudio-viral', { oportunidades: ops.length });
    return { ranking: await q('SELECT id, titulo, patron_id, puntuacion, estado, motivo FROM oportunidades ORDER BY puntuacion DESC') };
  },

  '07.04': async (p, ctx) => {
    const o = await uno('SELECT * FROM oportunidades WHERE id = $1', [Number(p.oportunidad_id)]);
    exigir(o, 'No existe esa oportunidad.');
    exigir(o.estado === 'producir', `La oportunidad está en «${o.estado}»: solo se generan las que superan 70 puntos.`);
    const ficha = o.ficha_id ? await uno('SELECT * FROM fichas WHERE id = $1', [o.ficha_id]) : null;
    const guion = generarGuion({ titulo: o.titulo, patron: o.patron_id as PatronId, accion: o.accion, ficha: (ficha as any) ?? null });
    const texto = [...guion.hooks, ...guion.escenas.map((e) => `${e.pantalla} ${e.voz}`), guion.cta].join(' ');
    const avisos = revisarLimites(texto, { fichaVerificada: ficha?.estado === 'publicada' });
    const rubricas = guion.hooks.map((h) => ({ hook: h, ...evaluarHook(h) }));
    const estado = avisos.some((a) => a.nivel === 'bloquea') ? 'bloqueada' : 'pendiente_aprobacion';
    const pieza = await uno(
      `INSERT INTO piezas (oportunidad_id, titulo, guion, avisos, estado, etiqueta_ia) VALUES ($1,$2,$3::jsonb,$4::jsonb,$5,$6) RETURNING id`,
      [o.id, o.titulo, JSON.stringify({ ...guion, rubricas }), JSON.stringify(avisos), estado, guion.patron !== 'P3'],
    );
    await q(`UPDATE oportunidades SET estado = 'producida' WHERE id = $1`, [o.id]);
    await auditar(ctx.actor, 'generar', 'estudio-viral', { pieza: pieza!.id, estado });
    return { pieza_id: pieza!.id, estado, avisos, rubricas };
  },

  '07.17': async (p) => ({ hook: String(p.hook ?? ''), ...evaluarHook(String(p.hook ?? ''), !!p.pruebaVisual) }),

  '07.05': async (p, ctx) => {
    const pieza = await uno('SELECT * FROM piezas WHERE id = $1', [Number(p.pieza_id)]);
    exigir(pieza, 'No existe esa pieza.');
    exigir(pieza.estado === 'pendiente_aprobacion', `La pieza está en «${pieza.estado}» y no admite aprobación.`);
    const aprobar = p.decision === 'aprobar';
    exigir(aprobar || String(p.motivo ?? '').trim().length > 3, 'Rechazar exige un motivo: vuelve a la memoria del estudio.');
    await q('UPDATE piezas SET estado = $1, actualizada = now() WHERE id = $2', [aprobar ? 'aprobada' : 'rechazada', pieza.id]);
    await q(`INSERT INTO aprobaciones (tipo, ref_id, decision, motivo, actor) VALUES ('pieza',$1,$2,$3,$4)`, [pieza.id, aprobar ? 'aprobada' : 'rechazada', p.motivo ?? null, ctx.actor]);
    await auditar(ctx.actor, aprobar ? 'aprobar' : 'rechazar', 'estudio-viral', { pieza: pieza.id, motivo: p.motivo ?? null });
    return { pieza_id: pieza.id, estado: aprobar ? 'aprobada' : 'rechazada' };
  },

  '07.12': async (p, ctx) => {
    const pieza = await uno('SELECT id, estado FROM piezas WHERE id = $1', [Number(p.pieza_id)]);
    exigir(pieza, 'No existe esa pieza.');
    exigir(pieza.estado !== 'bloqueada' && pieza.estado !== 'rechazada', `La pieza está «${pieza.estado}»: no se produce.`);
    exigir(/^https:\/\/\S+$/.test(String(p.media_url ?? '')), 'Hace falta la URL https del vídeo producido.');
    await q('UPDATE piezas SET media_url = $1, actualizada = now() WHERE id = $2', [p.media_url, pieza.id]);
    await auditar(ctx.actor, 'producir', 'higgsfield', { pieza: pieza.id });
    return { pieza_id: pieza.id, media_url: p.media_url };
  },

  '07.06': async (p, ctx) => {
    const pieza = await uno('SELECT * FROM piezas WHERE id = $1', [Number(p.pieza_id)]);
    exigir(pieza?.estado === 'aprobada', 'Solo se programan piezas aprobadas por una persona.');
    const texto = `${pieza.guion.hooks[0]}\n\n${pieza.guion.cta}. ${pieza.guion.fuente_en_pantalla}\n${(pieza.guion.hashtags as string[]).join(' ')}`;
    for (const canal of ['instagram', 'facebook', 'tiktok']) {
      await q(`INSERT INTO publicaciones (pieza_id, canal, texto, programada, estado, simulada) VALUES ($1,$2,$3,$4,'programada',$5)`, [pieza.id, canal, texto, String(p.cuando ?? ''), esDemo]);
    }
    await q(`UPDATE piezas SET estado = 'programada', actualizada = now() WHERE id = $1`, [pieza.id]);
    await auditar(ctx.actor, 'programar', 'estudio-viral', { pieza: pieza.id, cuando: p.cuando });
    return { pieza_id: pieza.id, canales: 3, cuando: p.cuando };
  },

  '07.07': async (p, ctx) => {
    const pieza = await uno('SELECT * FROM piezas WHERE id = $1', [Number(p.pieza_id)]);
    exigir(pieza?.estado === 'programada', 'La pieza tiene que estar aprobada y programada.');
    exigir(esDemo || pieza.media_url, 'Falta el vídeo producido (operación 07.12). No se publica un guion sin vídeo.');
    const pubs = await q(`SELECT * FROM publicaciones WHERE pieza_id = $1 AND estado = 'programada'`, [pieza.id]);
    const salida: Record<string, string> = {};
    for (const pub of pubs) {
      const con = await uno('SELECT estado FROM conexiones WHERE canal = $1', [pub.canal]);
      const estado = esDemo ? 'publicada_simulada' : con?.estado === 'conectado' ? 'en_cola_agente' : 'PENDIENTE_CREDENCIALES';
      const nota = esDemo ? 'Demo: el adaptador registra lo que habría publicado. No ha salido nada.' : 'La sesión de agente con vidIQ publica el borrador aprobado.';
      await q('UPDATE publicaciones SET estado = $1, resultado = $2::jsonb WHERE id = $3', [estado, JSON.stringify({ nota, etiqueta_ia: pieza.etiqueta_ia }), pub.id]);
      await auditar(ctx.actor, 'publicar', pub.canal, { pieza: pieza.id, estado });
      salida[pub.canal] = estado;
    }
    await q(`UPDATE piezas SET estado = $1, actualizada = now() WHERE id = $2`, [esDemo ? 'publicada_simulada' : 'en_publicacion', pieza.id]);
    const difusion = await difundir(pieza.id, ctx.actor);
    return { ...salida, difusion: `Correo ${difusion.correo_id} en borrador para la comunidad` };
  },

  '07.13': async () => ({
    publicaciones: await q('SELECT pub.id, pub.canal, pub.estado, pub.programada, pub.simulada, pi.titulo FROM publicaciones pub JOIN piezas pi ON pi.id = pub.pieza_id ORDER BY pub.id DESC'),
    metricas: await q('SELECT * FROM metricas ORDER BY id DESC'),
    nota: 'Sin métricas hasta que haya publicaciones reales. Un dato que falta no es un cero.',
  }),

  '07.14': async (p, ctx) => {
    exigir(p.titulo && p.url && p.autor && p.licencia, 'Faltan título, URL, autor o licencia.');
    const bloqueado = !!p.personas_identificables && !p.permiso_archivado;
    const m = await uno(
      `INSERT INTO medios (titulo, tipo, url, autor, lugar, fecha, licencia, personas_identificables, permiso_archivado, estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [p.titulo, p.tipo ?? 'video', p.url, p.autor, p.lugar ?? null, p.fecha ?? null, p.licencia, !!p.personas_identificables, !!p.permiso_archivado, bloqueado ? 'bloqueado_sin_permiso' : 'disponible'],
    );
    await auditar(ctx.actor, 'subir', 'mediateca', { medio: m!.id, bloqueado });
    return { medio_id: m!.id, estado: bloqueado ? 'bloqueado_sin_permiso' : 'disponible', nota: bloqueado ? 'Aparece una persona identificable: archiva su permiso escrito para desbloquearlo.' : null };
  },

  '13.01': async (p, ctx) => {
    exigir(String(p.texto ?? '').trim().length > 5, 'La propuesta está vacía.');
    const r = await uno(`INSERT INTO propuestas (autor, texto) VALUES ($1,$2) RETURNING id`, [ctx.actor, String(p.texto).trim()]);
    await auditar(ctx.actor, 'proponer', 'voz', { propuesta: r!.id });
    return { propuesta_id: r!.id, estado: 'recibida' };
  },

  '19.02': async (p, ctx) => {
    const f = await uno(`SELECT * FROM fichas WHERE id = $1 AND estado = 'publicada'`, [String(p.ficha_id ?? '')]);
    exigir(f, 'Solo se redacta desde una ficha publicada y verificada.');
    const cuerpo = `Hola:\n\n${f.que_dice}\n\nCómo te afecta hoy: ${f.efecto_hoy}\n\nEsto es: ${String(f.etiqueta).toLowerCase()}.\n\nFuente: ${f.fuente_titulo} (${f.fuente_url}).`;
    const c = await uno(`INSERT INTO correos (asunto, cuerpo, segmento, estado) VALUES ($1,$2,$3::jsonb,'borrador') RETURNING id`, [f.titulo, cuerpo, JSON.stringify({ finalidad: 'comunicaciones_politicas' })]);
    await auditar(ctx.actor, 'redactar', 'gmail', { correo: c!.id });
    return { correo_id: c!.id, estado: 'borrador' };
  },

  '19.04': async (p, ctx) => {
    const c = await uno('SELECT * FROM correos WHERE id = $1', [Number(p.correo_id)]);
    exigir(c?.estado === 'borrador', 'Solo se aprueban borradores.');
    const estado = p.decision === 'aprobar' ? 'aprobado' : 'rechazado';
    await q('UPDATE correos SET estado = $1 WHERE id = $2', [estado, c.id]);
    await q(`INSERT INTO aprobaciones (tipo, ref_id, decision, motivo, actor) VALUES ('correo',$1,$2,$3,$4)`, [c.id, estado, p.motivo ?? null, ctx.actor]);
    await auditar(ctx.actor, 'aprobar', 'gmail', { correo: c.id, estado });
    return { correo_id: c.id, estado };
  },

  '19.05': async (p, ctx) => {
    const c = await uno('SELECT * FROM correos WHERE id = $1', [Number(p.correo_id)]);
    exigir(c?.estado === 'aprobado', 'Solo se envían correos aprobados por una persona.');
    const consentidos = await q<{ email: string }>(
      `SELECT p.email FROM personas p WHERE p.baja IS NULL AND p.estado = 'aprobado' AND (
         SELECT c.otorgado FROM consentimientos c WHERE c.persona_id = p.id AND c.finalidad = 'comunicaciones_politicas' ORDER BY c.id DESC LIMIT 1)`,
    );
    const destino = esDemo ? listaPrueba() : consentidos.map((x) => x.email);
    const resultado = { consentidos: consentidos.length, enviados: 0, fallidos: 0, modo: esDemo ? 'demo: solo lista de prueba' : 'oficial', detalle: '' };
    for (const email of destino) {
      const r = await enviarGmail(email, c.asunto, c.cuerpo);
      if (r.ok) resultado.enviados += 1; else { resultado.fallidos += 1; resultado.detalle = r.detalle; }
    }
    const estado = resultado.enviados > 0 ? 'enviado' : destino.length === 0 ? 'enviado_simulado' : 'pendiente_credenciales';
    if (destino.length === 0) resultado.detalle = 'Sin lista de prueba (CORREO_LISTA_PRUEBA): se simula el envío.';
    await q('UPDATE correos SET estado = $1, destinatarios = $2, resultado = $3::jsonb WHERE id = $4', [estado, resultado.enviados, JSON.stringify(resultado), c.id]);
    await auditar(ctx.actor, 'enviar', 'gmail', { correo: c.id, ...resultado });
    return { correo_id: c.id, estado, ...resultado };
  },

  '20.01': async () => ({
    embajadores: await q(`SELECT p.nombre, p.codigo_invitacion, (SELECT count(*)::int FROM personas i WHERE i.invitado_por = p.id) AS altas FROM personas p WHERE p.baja IS NULL ORDER BY altas DESC, p.creada`),
    nota: 'Reconocimiento sin valor económico. Nada se da a cambio de afiliación ni de voto.',
  }),
};
