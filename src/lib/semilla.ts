// Semilla de demostración. Las fichas y las señales son reales y llevan fuente;
// las personas, los actos y los correos son ficticios y van marcados como tales.
import { demandaDeSenales, puntuar, decidir } from './estudio';

type Consulta = (texto: string, params?: unknown[]) => Promise<{ rows: Record<string, any>[] }>;

const HOY = '2026-11-10';
const PROGRAMA = 'https://ppandalucia.es/programa-electoral-feijoo-reparar-estado/';
const PLAN = 'https://www.pp.es/storage/2025/10/Plan-Nacional-de-Inmigracion-del-Partido-Popular.pdf';

export const FICHAS = [
  ['voto-municipal', 'Voto municipal por acuerdo de reciprocidad', 'ley', 'Ley vigente', 'Los nacionales de Bolivia, Chile, Colombia, Ecuador, Paraguay y Perú con cinco años de residencia legal votan en las municipales si piden la inscripción en el censo de extranjeros.', 'El plazo para las municipales del 23 de mayo de 2027 va del 1 de diciembre de 2026 al 15 de enero de 2027. Hay que pedirla en cada elección.', 'Quien se inscribe decide el gobierno de su municipio.', 'A favor', ['Votante municipal'], 'INE · Censo electoral de extranjeros, municipales 2027', 'https://www.ine.es/dyngs/CEL/index.htm?cid=383', 'publicada'],
  ['nacionalidad-ley', 'Nacionalidad por residencia en dos años', 'ley', 'Ley vigente', 'Los nacionales de origen de países iberoamericanos pueden pedir la nacionalidad española con dos años de residencia legal y continuada, frente a los diez de la regla general.', 'Es la norma en vigor hoy, con cualquier gobierno. No es una medida de ningún partido.', 'Con la nacionalidad se vota en todas las elecciones.', 'A favor', ['Residente sin voto', 'Votante municipal'], 'Código Civil, artículo 22', 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763', 'publicada'],
  ['nacionalidad-pp', 'Nueva Ley de Nacionalidad', 'nacional', 'Propuesta del programa', 'Exigiría residencia legal y continuada, español, valores constitucionales, buena conducta cívica y estar al corriente con Hacienda y Seguridad Social, con trato preferente a los países de la Hispanidad. El plan de 2025 añade nivel B2 y prueba reforzada.', 'Ninguno: es una propuesta. Sigue vigente el Código Civil.', 'Mantendría la ventaja de origen y subiría la exigencia de examen y de cumplimiento fiscal. No fija años de residencia.', 'A favor, con más exigencia', ['Residente sin voto'], 'PP · Pilares del programa del 29 de noviembre', PROGRAMA, 'publicada'],
  ['visado-puntos', 'Visado por puntos', 'nacional', 'Propuesta del programa', 'Puntuaría formación, experiencia, idioma e integración; la Hispanidad sumaría. Dos vías: contrato en origen o visado temporal para buscar empleo.', 'Ninguno: es una propuesta.', 'Familiares y paisanos con oficio o formación tendrían una vía legal con ventaja.', 'A favor', ['Votante pleno', 'Residente sin voto'], 'PP · Plan nacional de inmigración', PLAN, 'publicada'],
  ['regularizaciones', 'Fin de las regularizaciones colectivas', 'nacional', 'Propuesta del programa', 'Sustituiría las regularizaciones generales por un régimen transitorio individual y por puntos para quien acredite trabajo, cotización o integración. El arraigo sería excepcional.', 'Ninguno: la regularización extraordinaria de 2026 ya se tramitó.', 'Cerraría la vía que usaron 34.166 solicitantes en Baleares y dejaría una vía individual más estrecha.', 'Fricción', ['Recién llegado o en trámite'], 'PP · Plan nacional de inmigración', PLAN, 'publicada'],
  ['ayudas-padron', 'Ayudas, padrón e Ingreso Mínimo Vital', 'nacional', 'Propuesta del programa', 'Las ayudas no urgentes exigirían residencia legal y el Ingreso Mínimo Vital se ligaría a la búsqueda activa de empleo. Se mantendría el acceso a los servicios esenciales.', 'Ninguno: es una propuesta.', 'Sin efecto para residentes legales; restringe a quien no tiene papeles.', 'Fricción para irregulares', ['Recién llegado o en trámite'], 'PP · Plan nacional de inmigración', PLAN, 'publicada'],
  ['reagrupacion', 'Reagrupación familiar', 'nacional', 'Propuesta del programa', 'Pediría requisitos económicos más exigentes y controles antifraude.', 'Ninguno: es una propuesta.', 'Traer a la familia exigiría más ingresos acreditados.', 'Fricción', ['Residente sin voto', 'Votante pleno'], 'PP · Plan nacional de inmigración', PLAN, 'publicada'],
  ['homologacion', 'Homologación de títulos más ágil', 'nacional', 'Propuesta del programa', 'Agilizaría el reconocimiento de títulos en sectores de alta demanda, con comprobaciones más exigentes.', 'Ninguno: es una propuesta.', 'Permitiría ejercer su profesión a quien hoy trabaja por debajo de su formación.', 'A favor', ['Profesional por homologar'], 'El Español · Cupos migratorios en el programa del PP', 'https://www.elespanol.com/espana/politica/20261109/feijoo-compromete-ajustar-ano-cupo-migratorio-capacidad-real-acogida-necesidades-laborales/1003744449653_0.html', 'publicada'],
  ['vivienda-joven', 'IVA del 4 % y Hucha Hogar Joven', 'nacional', 'Propuesta del programa', 'IVA del 4 % en la primera vivienda de menores de 40 años, y Hucha Hogar Joven: hasta 2.000 euros de ahorro al año con deducción del 20 % y aval de hasta 40.000 euros.', 'Ninguno: es una propuesta.', 'Abarataría la compra a familias jóvenes con ingresos estables.', 'A favor en compra', ['Joven de 18 a 35', 'Votante pleno'], 'PP · Pilares del programa del 29 de noviembre', PROGRAMA, 'publicada'],
  ['irpf-joven', 'IRPF joven y deducción familiar', 'nacional', 'Propuesta del programa', 'De 18 a 35 años, sin IRPF el primer año de trabajo y 25 %, 50 % y 75 % los tres siguientes. Deducción familiar única, reembolsable y mensual.', 'Ninguno: es una propuesta.', 'Más sueldo neto al empezar a trabajar; la deducción llegaría también a rentas bajas.', 'A favor', ['Joven de 18 a 35'], 'PP · Pilares del programa del 29 de noviembre', PROGRAMA, 'publicada'],
  ['vivienda-publica-balear', 'Vivienda pública: cinco años de residencia', 'balear', 'Medida del Govern', 'Optar a vivienda pública o de precio limitado en Baleares exige cinco años de residencia en las islas; algunos municipios piden más.', 'Prioridad para quien lleva cinco años; exclusión para quien lleva menos.', 'La antigüedad de residencia se convierte en un activo.', 'A favor con 5 años, fricción con menos', ['Votante pleno', 'Recién llegado o en trámite'], 'Mallorcadiario · Cinco años de residencia para vivienda pública', 'https://www.mallorcadiario.com/vivienda-publica-residentes-baleares-cinco-anos', 'publicada'],
  ['catalan-sanidad', 'Sanidad sin requisito de catalán', 'balear', 'Medida del Govern', 'El Govern eliminó en 2023 el requisito de catalán para médicos y personal sanitario.', 'Los sanitarios hispanohablantes con título homologado pueden optar a plaza.', 'Salida profesional estable en la sanidad pública.', 'A favor', ['Profesional por homologar'], 'OKDiario · Eliminación del requisito de catalán en sanidad', 'https://okdiario.com/baleares/govern-prohens-elimina-requisito-del-catalan-que-armengol-impuso-medicos-11465189', 'publicada'],
  ['regularizacion-un-ano', 'Permiso de la regularización: qué pasa al cumplir un año', 'ley', 'Ley vigente', 'La autorización de la regularización extraordinaria de 2026 permite trabajar en cualquier sector y lugar durante un año. Qué ocurre después: [VERIFICAR con fuente oficial].', '[VERIFICAR]', '[VERIFICAR]', 'Depende', ['Recién llegado o en trámite'], 'La Moncloa · Proceso de regularización extraordinaria', 'https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/inclusion/paginas/2026/proceso-regularizacion-migratoria.aspx', 'borrador'],
] as const;

// Primer radar real de vidIQ (10 nov 2026).
export const SENALES = [
  ['TikTok', '¿Por qué nunca hay citas para el NIE, el DNI o las huellas?', 'Grabación de pantalla con gráficos animados, 57 s', 259.9, 913600, 'https://www.tiktok.com/@datosmotion/video/7699554387848351008', 'Citas y trámites', 'P1'],
  ['Instagram', '¿TE PUEDEN ECHAR?', 'Animación 2D, lista numerada y pregunta final', 161.2, 1500000, 'https://www.instagram.com/reel/DfUTMzRCNLm', 'Derechos laborales', 'P2'],
  ['Instagram', 'Los hispanoamericanos y los españoles', 'Opinión caminando, subtítulos dinámicos', 75.2, 950500, 'https://www.instagram.com/reel/DfM6obNIfVa', 'Identidad', null],
  ['TikTok', '¿Qué ocurre con esta autorización cuando cumple un año?', 'Experto a cámara con texto guía, 31 s', 59.1, 574400, 'https://www.tiktok.com/@extranjeristas/video/7698830730452929798', 'Regularización', 'P1'],
  ['Instagram', 'Latinos trabajando en Estados Unidos vs España', 'Montaje rápido y sketch de comparación', 43.5, 3900000, 'https://www.instagram.com/reel/Dew25WpRkVu', 'Trabajo', null],
  ['Instagram', 'Estos son los 4 requisitos clave', 'Experto a cámara, lista numerada', 38.2, 741800, 'https://www.instagram.com/reel/DfSG0dvsn6x', 'Residencia (EE. UU.)', null],
  ['TikTok', 'Las cosas más difíciles que nadie te cuenta al llegar a España en familia', 'Monólogo caminando, sin editar, 192 s', 15.7, 954600, 'https://www.tiktok.com/@guerrero.internacional/video/7698519485317123361', 'Vivienda y llegada', 'P3'],
  ['Instagram', 'Radar de tramo, 129 km/h, FRENANDO', 'Explicador 3D que desmonta un mito', 12.3, 6100000, 'https://www.instagram.com/reel/DesvHlRxa_K', 'Normas explicadas', 'P2'],
  ['TikTok', 'OFERTAS DE TRABAJO EN ESPAÑA', 'Experto a cámara con pantalla, 101 s', 4.7, 583500, 'https://www.tiktok.com/@abogadoextranjeria/video/7702407310366297366', 'Trabajo', null],
  ['TikTok', '¿Cuál ha sido el mayor choque cultural que has vivido?', 'Entrevista en la calle, 161 s', 4.3, 1100000, 'https://www.tiktok.com/@elreydelbarriomachorro/video/7696644683480583425', 'Identidad', 'P3'],
  ['TikTok', 'ESPAÑA DA 1 PASO HISTÓRICO', 'Imágenes de recurso con voz en off, en bucle, 29 s', 4.0, 646900, 'https://www.tiktok.com/@residencias.conmi/video/7698596971149364512', 'Regularización', null],
] as const;

const PATRONES = [
  ['P1', 'La pregunta que ya se hacen', 'El hook es la duda literal sobre un trámite y la respuesta experta llega en menos de un minuto.', 'TikTok'],
  ['P2', 'Explicador animado de una norma', 'Pregunta o mito en cuatro palabras, animación, lista numerada, ritmo rápido y pregunta final que llama al comentario.', 'Instagram'],
  ['P3', 'Relato migrante sin filtro', 'Persona real, a cámara o en la calle, sin edición. Identidad antes que información.', 'TikTok'],
] as const;

export const OPORTUNIDADES = [
  { titulo: '¿Puedes votar el 23 de mayo? Depende de tu pasaporte', patron: 'P1', ficha: 'voto-municipal', perfil: 'Votante municipal', accion: 'Comprueba en un minuto si puedes votar', retencion: 78, ajuste: 95, utilidad: 95, eficiencia: 80, riesgo: 0 },
  { titulo: 'Nacionalidad en dos años: qué cambia y qué no', patron: 'P2', ficha: 'nacionalidad-ley', perfil: 'Residente sin voto', accion: 'Mira tu ruta a la nacionalidad', retencion: 70, ajuste: 85, utilidad: 85, eficiencia: 55, riesgo: 5 },
  { titulo: 'Homologué mi título en España: así fue', patron: 'P3', ficha: 'homologacion', perfil: 'Profesional por homologar', accion: 'Cuéntanos tu caso en Voz', retencion: 62, ajuste: 80, utilidad: 70, eficiencia: 85, riesgo: 5 },
  { titulo: '¿Qué pasa con tu permiso de regularización al cumplir un año?', patron: 'P1', ficha: 'regularizacion-un-ano', perfil: 'Recién llegado o en trámite', accion: 'Lee la ficha completa', retencion: 80, ajuste: 60, utilidad: 95, eficiencia: 80, riesgo: 35 },
];

const CONEXIONES = [
  ['vidiq', 'vidIQ', 'Conector', 'conectado', 'Plan de 150 créditos al mes', 'Motor de investigación y vía de publicación de la beta.'],
  ['higgsfield', 'Higgsfield', 'MCP', 'sesion_agente', null, 'Producción de vídeo desde la sesión de agente. API de servidor por verificar.'],
  ['instagram', 'Instagram', 'vidIQ · OAuth', 'pendiente', null, 'Falta crear la cuenta de Ágora y enlazarla en vidIQ.'],
  ['facebook', 'Facebook (página)', 'vidIQ · OAuth', 'pendiente', null, 'Falta crear la página de Ágora y enlazarla en vidIQ.'],
  ['tiktok', 'TikTok', 'vidIQ · OAuth', 'pendiente', null, 'Falta crear la cuenta de Ágora y enlazarla en vidIQ.'],
  ['gmail', 'Gmail', 'API de Gmail · OAuth', 'pendiente', null, 'Falta el cliente OAuth en Google Cloud y autorizar la cuenta de Ágora.'],
  ['n8n', 'n8n · PEPE', 'Webhook firmado', 'pendiente', null, 'Falta importar infrastructure/n8n/pepe.workflow.json. PEPE responde en modo local.'],
  ['whatsapp', 'WhatsApp', 'Evolution (no oficial)', 'apagado', null, 'Canal opcional. Riesgo de bloqueo: la política de WhatsApp excluye a partidos y campañas.'],
] as const;

const PERSONAS = [
  ['demo1@agora.invalid', 'Persona de prueba 1', 'Palma', 'Colombia', 'Votante municipal', true],
  ['demo2@agora.invalid', 'Persona de prueba 2', 'Calvià', 'Argentina', 'Residente sin voto', false],
  ['demo3@agora.invalid', 'Persona de prueba 3', 'Manacor', 'Ecuador', 'Votante pleno', true],
  ['demo4@agora.invalid', 'Persona de prueba 4', 'Eivissa', 'Venezuela', 'Residente sin voto', false],
  ['demo5@agora.invalid', 'Persona de prueba 5', 'Palma', 'Perú', 'Votante municipal', false],
] as const;

export async function sembrar(c: Consulta): Promise<void> {
  const ya = await c('SELECT count(*)::int AS n FROM fichas');
  if (ya.rows[0].n > 0) return;

  for (const f of FICHAS) {
    await c(
      `INSERT INTO fichas (id, titulo, ambito, etiqueta, que_dice, efecto_hoy, efecto_futuro, lectura, perfiles, fuente_titulo, fuente_url, revisada, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13)`,
      [f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], JSON.stringify(f[8]), f[9], f[10], HOY, f[11]],
    );
  }
  for (const s of SENALES) {
    await c(
      `INSERT INTO senales (plataforma, hook, formato, multiplicador, vistas, url, tema, patron, fuente, captada) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'vidIQ',$9)`,
      [s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], HOY],
    );
  }
  for (const p of PATRONES) {
    const n = SENALES.filter((s) => s[7] === p[0]).length;
    await c('INSERT INTO patrones (id, nombre, descripcion, plataforma, evidencias) VALUES ($1,$2,$3,$4,$5)', [p[0], p[1], p[2], p[3], n]);
  }
  for (const o of OPORTUNIDADES) {
    const demanda = demandaDeSenales(SENALES.filter((s) => s[7] === o.patron).map((s) => s[3]));
    const puntuacion = puntuar({ demanda, ...o });
    const estado = decidir(puntuacion);
    const motivo = o.riesgo >= 30 ? 'La ficha que lo respalda está sin verificar.' : null;
    await c(
      `INSERT INTO oportunidades (titulo, patron_id, ficha_id, perfil, accion, demanda, retencion, ajuste, utilidad, eficiencia, riesgo, puntuacion, estado, motivo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [o.titulo, o.patron, o.ficha, o.perfil, o.accion, demanda, o.retencion, o.ajuste, o.utilidad, o.eficiencia, o.riesgo, puntuacion, estado, motivo],
    );
  }
  for (const x of CONEXIONES) {
    await c('INSERT INTO conexiones (canal, nombre, via, estado, cuenta, detalle) VALUES ($1,$2,$3,$4,$5,$6)', [...x]);
  }
  let i = 0;
  for (const p of PERSONAS) {
    i += 1;
    const r = await c(
      `INSERT INTO personas (email, nombre, municipio, pais_origen, situacion_voto, interes_afiliacion, codigo_invitacion, es_demo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id`,
      [p[0], p[1], p[2], p[3], p[4], p[5], `demo${i}`],
    );
    for (const finalidad of ['informacion_civica', 'comunicaciones_politicas']) {
      await c(
        `INSERT INTO consentimientos (persona_id, finalidad, otorgado, texto_version, texto_hash, origen) VALUES ($1,$2,$3,'demo','demo','semilla')`,
        [r.rows[0].id, finalidad, finalidad === 'informacion_civica' || i % 2 === 1],
      );
    }
  }
  await c(`INSERT INTO actos (titulo, municipio, fecha, lugar) VALUES
    ('Encuentro de prueba: cómo inscribirse en el censo', 'Palma', '2026-12-03T19:00', 'Lugar ficticio de demostración'),
    ('Encuentro de prueba: nacionalidad paso a paso', 'Manacor', '2026-12-10T19:00', 'Lugar ficticio de demostración')`);
  await c(
    `INSERT INTO correos (asunto, cuerpo, segmento, estado) VALUES ($1,$2,$3::jsonb,'borrador')`,
    [
      'El plazo para votar en las municipales abre el 1 de diciembre',
      'Hola:\n\nSi eres de Bolivia, Chile, Colombia, Ecuador, Paraguay o Perú y llevas cinco años de residencia legal, puedes votar en las municipales del 23 de mayo de 2027. Para eso tienes que pedir tu inscripción en el censo entre el 1 de diciembre y el 15 de enero.\n\nComprueba tu caso en un minuto en «¿Puedo votar?».\n\nFuente: INE, censo electoral de extranjeros.',
      JSON.stringify({ finalidad: 'comunicaciones_politicas', municipio: null }),
    ],
  );
  await c(`INSERT INTO registro_auditoria (actor, accion, objeto, detalle) VALUES ('sistema', 'semilla', 'demo', '{"nota":"datos de demostración cargados"}')`);
}
