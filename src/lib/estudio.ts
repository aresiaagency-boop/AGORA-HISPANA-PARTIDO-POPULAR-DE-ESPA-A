// Estudio Viral: puntuación de oportunidades, rúbrica de hooks, límites duros
// y generador de guiones. Todo determinista, para poder evaluarlo (eval/*.jsonl).

// ---------- F3 · Decisión ----------
export const PESOS = { demanda: 30, retencion: 25, ajuste: 20, utilidad: 15, eficiencia: 10 } as const;

export interface Factores {
  demanda: number; retencion: number; ajuste: number; utilidad: number; eficiencia: number; riesgo: number;
}

export function puntuar(f: Factores): number {
  const base =
    (f.demanda * PESOS.demanda + f.retencion * PESOS.retencion + f.ajuste * PESOS.ajuste +
      f.utilidad * PESOS.utilidad + f.eficiencia * PESOS.eficiencia) / 100;
  return Math.max(0, Math.min(100, Math.round(base - f.riesgo)));
}

export type Decision = 'producir' | 'reescribir' | 'descartar';
export const decidir = (p: number): Decision => (p >= 70 ? 'producir' : p >= 55 ? 'reescribir' : 'descartar');

// Demanda a partir de los multiplicadores de outlier del patrón (escala logarítmica).
export function demandaDeSenales(multiplicadores: number[]): number {
  if (!multiplicadores.length) return 20;
  const base = Math.round(25 + 30 * Math.log10(Math.max(...multiplicadores)));
  const extra = Math.min(10, (multiplicadores.length - 1) * 5);
  return Math.max(0, Math.min(100, base + extra));
}

// ---------- F5 · Rúbrica de hook ----------
export interface Rubrica {
  parada: number; brecha: number; especificidad: number; identidad: number; prueba: number;
  total: number; veredicto: 'aprobado' | 'reescribir';
}

export function evaluarHook(hook: string, pruebaVisual = false): Rubrica {
  const t = hook.trim();
  const palabras = t.split(/\s+/).filter(Boolean).length;
  const parada = palabras <= 7 ? 10 : palabras <= 10 ? 7 : palabras <= 14 ? 4 : 2;
  const brecha = /\?|^(por qué|qué pasa|lo que nadie|nadie te|esto es lo que)/i.test(t) ? 9 : 4;
  const especificidad = /\d|\b(mayo|enero|diciembre|nie|dni|censo|nacionalidad|título|pasaporte|palma|baleares|mallorca)\b/i.test(t) ? 8 : 3;
  const identidad = /\b(tu|tus|te|puedes|tienes|eres|colombian|argentin|ecuatorian|venezolan|peruan|bolivian|latin|migrante|familia)/i.test(t) ? 8 : 3;
  const prueba = pruebaVisual ? 8 : 5;
  const total = (parada + brecha + especificidad + identidad + prueba) * 2;
  return { parada, brecha, especificidad, identidad, prueba, total, veredicto: total >= 60 ? 'aprobado' : 'reescribir' };
}

// ---------- Límites duros ----------
export interface Aviso { regla: string; nivel: 'bloquea' | 'revisa'; detalle: string }

const REGLAS: { regla: string; nivel: Aviso['nivel']; re: RegExp; detalle: string }[] = [
  { regla: 'colectivos', nivel: 'bloquea', re: /\b(moros?|sudacas?|panchitos?|ilegales|invasi[oó]n|menas)\b/i, detalle: 'Señala o denigra a un colectivo por su origen.' },
  { regla: 'recompensa', nivel: 'bloquea', re: /\b(sorteo|regalo|premio|recompensa)s?\b|\ba cambio de (tu |su )?(voto|apoyo|afiliaci[oó]n|militancia)\b|\b(gratis|gratuit[oa]s?|descuentos?|bonos?|beneficios?)\b[^.!?]{0,80}\b(si te afilias|por afiliarte|al afiliarte|por militar|por tu voto|si votas|por inscribirte)\b/i, detalle: 'Ofrece algo a cambio de apoyo, afiliación o voto.' },
  { regla: 'voz-de-dirigente', nivel: 'bloquea', re: /\b(soy|te habla|habla) (feij[oó]o|prohens|el presidente)\b|\b(deepfake|voz clonada|clonar la voz|avatar de)\b/i, detalle: 'Pone palabras o imagen sintética en una persona real.' },
  { regla: 'promesa', nivel: 'bloquea', re: /\b(garantizad[oa]s?|100 ?%|seguro que te (dan|conceden)|te conseguimos)\b/i, detalle: 'Promete un resultado que nadie puede garantizar.' },
  { regla: 'urgencia', nivel: 'revisa', re: /\b(solo hoy|[uú]ltima oportunidad|antes de que lo borren)\b/i, detalle: 'Urgencia que no corresponde a un plazo real.' },
  { regla: 'testimonio', nivel: 'revisa', re: /\b(testimonio|me cambi[oó] la vida|gracias al pp)\b/i, detalle: 'Testimonio: exige persona real, con nombre y permiso archivado.' },
];

const DATO_SENSIBLE = /\b(votar|voto|censo|elecciones|plazo|nacionalidad|requisitos?|permiso|residencia|homologa)/i;

export function revisarLimites(texto: string, ctx: { fichaVerificada: boolean }): Aviso[] {
  const avisos: Aviso[] = REGLAS.filter((r) => r.re.test(texto)).map(({ regla, nivel, detalle }) => ({ regla, nivel, detalle }));
  if (DATO_SENSIBLE.test(texto) && !ctx.fichaVerificada) {
    avisos.push({ regla: 'dato-sin-ficha', nivel: 'bloquea', detalle: 'Habla de voto o de trámites sin una ficha verificada que lo respalde.' });
  }
  return avisos;
}

// ---------- F4 · Guion ----------
export type PatronId = 'P1' | 'P2' | 'P3';

export interface FichaGuion {
  id: string; titulo: string; etiqueta: string; que_dice: string; efecto_hoy: string; fuente_titulo: string;
}

export interface Escena { t: string; plano: string; pantalla: string; voz: string }

export interface Guion {
  patron: PatronId;
  duracion_s: number;
  hooks: string[];
  escenas: Escena[];
  cta: string;
  fuente_en_pantalla: string;
  hashtags: string[];
  material: string;
  prompt_higgsfield: string;
}

const corta = (s: string, n: number) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…');
// Para la voz no se corta a media frase: frases completas hasta el límite, y siempre al menos la primera.
function frases(s: string, n: number): string {
  const partes = s.match(/[^.!?]+[.!?]+/g) ?? [s];
  let salida = partes[0].trim();
  for (const p of partes.slice(1)) { if ((salida + ' ' + p.trim()).length > n) break; salida += ' ' + p.trim(); }
  return salida;
}

export function generarGuion(o: { titulo: string; patron: PatronId; accion: string; ficha: FichaGuion | null }): Guion {
  // El tema es la primera frase del título, sin signos: de «¿Puedes votar el 23 de mayo? Depende…» sale «Puedes votar el 23 de mayo».
  const esPregunta = o.titulo.trim().startsWith('¿');
  const tema = o.titulo.replace(/^\s*¿/, '').split(/[?:.]/)[0].trim();
  const pregunta = `¿${tema}?`;
  const minus = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const dice = o.ficha ? frases(o.ficha.que_dice, 170) : '[VERIFICAR: falta ficha]';
  const hoy = o.ficha ? frases(o.ficha.efecto_hoy, 150) : '[VERIFICAR: falta ficha]';
  const etiqueta = o.ficha?.etiqueta ?? 'Sin etiqueta';
  const fuente = o.ficha ? `Fuente: ${o.ficha.fuente_titulo}` : 'Sin fuente: no se puede publicar';
  const hashtags = ['#Baleares', '#Mallorca', '#LatinosEnEspaña', '#Trámites', '#Explicado', '#EnUnMinuto', '#ÁgoraHispana'];

  if (o.patron === 'P2') {
    return {
      patron: 'P2', duracion_s: 28,
      hooks: [`${pregunta} No es lo que crees`, `Lo que no te cuentan: ${minus(tema)}`, `${tema}: 3 cosas que sí cambian`],
      escenas: [
        { t: '0-2', plano: 'Animación: el mito aparece escrito y se tacha', pantalla: `¿${corta(tema, 34)}?`, voz: `Te han contado mal lo de ${minus(tema)}.` },
        { t: '2-5', plano: 'Icono de reloj y contador 1-2-3', pantalla: '3 datos, 25 segundos', voz: 'Tres datos y sales de dudas.' },
        { t: '5-12', plano: 'Tarjeta 1 con icono; entra con corte seco', pantalla: '1 · Qué dice', voz: dice },
        { t: '12-19', plano: 'Tarjeta 2; cambio de color de fondo', pantalla: '2 · Cómo te afecta hoy', voz: hoy },
        { t: '19-24', plano: 'Tarjeta 3: sello con la etiqueta', pantalla: `3 · ${etiqueta}`, voz: `Ojo: esto es ${etiqueta.toLowerCase()}.` },
        { t: '24-28', plano: 'Vuelve el mito tachado del inicio (bucle)', pantalla: o.accion, voz: `${o.accion}. Enlace en el perfil.` },
      ],
      cta: o.accion, fuente_en_pantalla: fuente, hashtags,
      material: 'Animación 2D con iconos. No necesita personas.',
      prompt_higgsfield: `Vídeo vertical 9:16, 28 s, animación 2D plana con iconos y tarjetas numeradas, cortes cada 3 s o menos, subtítulos incrustados en español, paleta azul marino y cian sobre fondo oscuro, sin personas reales, sin logotipos de partidos. Tema: ${tema}.`,
    };
  }

  if (o.patron === 'P3') {
    return {
      patron: 'P3', duracion_s: 35,
      hooks: [`${tema}. Así fue, sin filtros`, 'Nadie te cuenta esto antes de llegar', 'Llegué a Mallorca y esto me pasó'],
      escenas: [
        { t: '0-2', plano: 'Selfie caminando, cámara en mano', pantalla: corta(tema, 48), voz: '(La persona empieza a hablar sin saludar.)' },
        { t: '2-8', plano: 'Mismo plano; corte a detalle de manos o documento', pantalla: 'Mi caso', voz: '(Cuenta en primera persona qué le pasó.)' },
        { t: '8-20', plano: 'Dos cortes a recurso real: calle, trabajo, casa', pantalla: 'Lo difícil', voz: '(El obstáculo concreto y cómo lo resolvió.)' },
        { t: '20-29', plano: 'Vuelve a cámara', pantalla: 'El dato', voz: hoy },
        { t: '29-35', plano: 'Plano fijo, mirada a cámara', pantalla: o.accion, voz: `${o.accion}.` },
      ],
      cta: o.accion, fuente_en_pantalla: fuente, hashtags,
      material: 'Persona real grabada con su móvil. Bloqueado hasta archivar su permiso escrito en la Mediateca.',
      prompt_higgsfield: `No generar personas. Solo edición sobre material real de la Mediateca: reencuadre a 9:16, subtítulos incrustados en español, cortes cada 3 s o menos, rótulos inferiores. Tema: ${tema}.`,
    };
  }

  return {
    patron: 'P1', duracion_s: 30,
    hooks: [pregunta, `${pregunta} Te lo digo en 30 segundos`, esPregunta ? `Nadie te lo explica: ¿${minus(tema)}?` : `Lo que nadie te explica de ${minus(tema)}`],
    escenas: [
      { t: '0-2', plano: 'Primer plano en movimiento hacia cámara', pantalla: `¿${corta(tema, 40)}?`, voz: pregunta },
      { t: '2-5', plano: 'Corte a pantalla del trámite o del calendario', pantalla: 'En 30 segundos lo sabes', voz: 'En treinta segundos sabes si te afecta.' },
      { t: '5-13', plano: 'A cámara; texto guía por frases', pantalla: 'Qué dice', voz: dice },
      { t: '13-21', plano: 'Recurso: documento, fecha marcada en calendario', pantalla: 'Cómo te afecta hoy', voz: hoy },
      { t: '21-26', plano: 'Sello en pantalla', pantalla: etiqueta, voz: `Y ojo: es ${etiqueta.toLowerCase()}.` },
      { t: '26-30', plano: 'Vuelve la pregunta del inicio (bucle)', pantalla: o.accion, voz: `${o.accion}. Enlace en el perfil.` },
    ],
    cta: o.accion, fuente_en_pantalla: fuente, hashtags,
    material: 'Portavoz real de la comunidad con permiso, o gráficos sin personas.',
    prompt_higgsfield: `Vídeo vertical 9:16, 30 s, estilo explicador con gráficos animados y capturas de calendario, cortes cada 3 s o menos, subtítulos incrustados en español, sin personas reales generadas, sin logotipos de partidos. Tema: ${tema}.`,
  };
}
