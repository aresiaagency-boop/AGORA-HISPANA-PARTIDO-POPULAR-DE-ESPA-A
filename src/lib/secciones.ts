// Catálogo de secciones y operaciones. Es la única fuente del menú y de la consola.
export interface Operacion {
  codigo: string;
  nombre: string;
  hace: string;
  payload: Record<string, unknown>;
  control: string;
}

export interface Seccion {
  codigo: string;
  slug: string;
  nombre: string;
  sub: string;
  agente: string;
  alcance: 'Completa' | 'Básica' | 'Visible';
  ops: Operacion[];
}

const op = (codigo: string, nombre: string, hace: string, payload: Record<string, unknown> = {}, control = 'Equipo'): Operacion =>
  ({ codigo, nombre, hace, payload, control });

export const SECCIONES: Seccion[] = [
  { codigo: '00', slug: '', nombre: 'Mission Control', sub: 'Estado en tiempo real', agente: 'PEPE', alcance: 'Completa', ops: [] },
  {
    codigo: '22', slug: 'afiliados', nombre: 'Afiliados VIP', sub: 'Aprobación y gestión de cada perfil', agente: 'Dirección', alcance: 'Completa',
    ops: [
      op('05.04', 'Aprobar o rechazar', 'Decide si un perfil nuevo entra. Queda registrado quién lo decidió.', { persona_id: '', decision: 'aprobar' }, 'Humano'),
      op('05.05', 'Editar perfil', 'Corrige nombre, municipio, origen o teléfono.', { persona_id: '', nombre: '' }),
      op('05.06', 'Borrar perfil', 'Elimina el perfil, sus consentimientos y sus firmas. No se puede deshacer.', { persona_id: '' }, 'Irreversible'),
    ],
  },
  {
    codigo: '01', slug: 'programa', nombre: 'Programa', sub: 'Políticas explicadas y fuentes', agente: 'Programa', alcance: 'Completa',
    ops: [op('01.05', 'Responder consulta', 'Busca en las fichas verificadas y contesta con su fuente.', { pregunta: '¿Qué cambia con la nacionalidad?' }, 'Solo fichas publicadas')],
  },
  {
    codigo: '02', slug: 'mi-camino', nombre: 'Mi camino', sub: 'Voto, nacionalidad y afiliación', agente: 'Guía', alcance: 'Completa',
    ops: [op('02.01', '¿Puedo votar?', 'Motor determinista con reglas del INE.', { nacionalidadEspanola: false, pasaporteUE: false, pais: 'Colombia', residenciaLegal: true, anosResidencia: 6 }, 'Sin modelo; eval/voto.jsonl')],
  },
  { codigo: '03', slug: 'punto-qr', nombre: 'Punto QR', sub: 'Atención en actos y comercios', agente: 'Guía', alcance: 'Básica', ops: [] },
  { codigo: '04', slug: 'atencion', nombre: 'Atención', sub: 'Mensajes y escalado', agente: 'PEPE', alcance: 'Básica', ops: [] },
  {
    codigo: '05', slug: 'comunidad', nombre: 'Comunidad', sub: 'Registro y consentimiento', agente: 'Comunidad', alcance: 'Completa',
    ops: [
      op('05.01', 'Listar comunidad', 'Personas registradas y finalidades consentidas.', {}),
      op('05.03', 'Dar de baja', 'Ejecuta la baja y la registra. Efectiva en todos los canales.', { email: 'demo2@agora.invalid' }, 'Siempre se ejecuta'),
    ],
  },
  { codigo: '06', slug: 'campanas', nombre: 'Campañas', sub: 'Estrategia y segmentos', agente: 'CALÍOPE', alcance: 'Básica', ops: [] },
  {
    codigo: '07', slug: 'estudio-viral', nombre: 'Estudio Viral', sub: 'Contenido y canales', agente: 'CALÍOPE', alcance: 'Completa',
    ops: [
      op('07.18', 'Radar de tendencias', 'Señales de vidIQ: vídeos que superan la mediana de su creador.', {}, 'Créditos de vidIQ'),
      op('07.19', 'Disección de outliers', 'Patrones confirmados con dos evidencias o más.', {}),
      op('07.20', 'Ranking de oportunidades', 'Recalcula la puntuación y decide qué se produce.', {}, 'Umbral 70 / 55'),
      op('07.04', 'Generar contenido', 'Guion en borrador con tres hooks, límites y rúbrica.', { oportunidad_id: 1 }, 'Nace en borrador'),
      op('07.17', 'Puntuar hook', 'Rúbrica: parada, brecha, especificidad, identidad y prueba.', { hook: '¿Puedes votar el 23 de mayo?' }),
      op('07.12', 'Registrar producción', 'Adjunta el vídeo que Higgsfield ha producido a partir del guion.', { pieza_id: 1, media_url: 'https://example.com/video.mp4' }, 'Sesión de agente'),
      op('07.05', 'Aprobar contenido', 'Puerta humana. Rechazar exige motivo.', { pieza_id: 1, decision: 'aprobar', motivo: '' }, 'Humano'),
      op('07.06', 'Programar contenido', 'Agenda la pieza aprobada en los tres canales.', { pieza_id: 1, cuando: '2026-12-01T19:30' }, 'Solo aprobadas'),
      op('07.07', 'Publicar social', 'Envía al adaptador. En demo, simula y registra.', { pieza_id: 1 }, 'Credenciales de canal'),
      op('07.13', 'Analítica', 'Publicaciones y métricas reales.', {}),
      op('07.14', 'Subir material', 'Registra imagen o vídeo de base con autor, licencia y permisos.', { titulo: 'Entrevista de prueba', tipo: 'video', url: 'https://example.com/video.mp4', autor: 'Equipo', licencia: 'Propia', personas_identificables: true, permiso_archivado: false }, 'Permiso de imagen'),
    ],
  },
  { codigo: '08', slug: 'agenda', nombre: 'Agenda', sub: 'Actos e inscripciones', agente: 'Agenda', alcance: 'Básica', ops: [] },
  { codigo: '09', slug: 'territorio', nombre: 'Territorio', sub: 'Mapa vivo por municipio', agente: 'Territorio', alcance: 'Visible', ops: [] },
  { codigo: '10', slug: 'voluntariado', nombre: 'Voluntariado', sub: 'Equipos y tareas', agente: 'Voluntariado', alcance: 'Visible', ops: [] },
  { codigo: '11', slug: 'mediateca', nombre: 'Mediateca', sub: 'Imágenes, vídeos y permisos', agente: 'CALÍOPE', alcance: 'Completa', ops: [] },
  { codigo: '12', slug: 'escucha', nombre: 'Escucha', sub: 'Opinión, bulos y respuesta', agente: 'Escucha', alcance: 'Básica', ops: [] },
  {
    codigo: '13', slug: 'voz', nombre: 'Voz', sub: 'Propuestas de la comunidad', agente: 'Voz', alcance: 'Básica',
    ops: [op('13.01', 'Registrar propuesta', 'Guarda una propuesta para el partido.', { texto: 'Más citas de extranjería en Palma.' })],
  },
  { codigo: '14', slug: 'cantera', nombre: 'Cantera', sub: 'Portavoces y candidatos', agente: 'Cantera', alcance: 'Visible', ops: [] },
  { codigo: '15', slug: 'pepe', nombre: 'PEPE', sub: 'Orquestador inteligente', agente: 'PEPE', alcance: 'Completa', ops: [] },
  { codigo: '16', slug: 'analitica', nombre: 'Analítica', sub: 'Indicadores verificables', agente: 'Analítica', alcance: 'Básica', ops: [] },
  { codigo: '17', slug: 'cuentas', nombre: 'Cuentas', sub: 'Gasto y trazabilidad', agente: 'Cuentas', alcance: 'Visible', ops: [] },
  { codigo: '18', slug: 'configuracion', nombre: 'Configuración', sub: 'Reglas, roles y cumplimiento', agente: 'Cumplimiento', alcance: 'Completa', ops: [] },
  {
    codigo: '19', slug: 'correo', nombre: 'Correo', sub: 'Comunicaciones a afiliados', agente: 'HERMES', alcance: 'Completa',
    ops: [
      op('19.02', 'Redactar borrador', 'Borrador desde una ficha verificada.', { ficha_id: 'voto-municipal' }, 'Nace en borrador'),
      op('19.04', 'Aprobar correo', 'Puerta humana.', { correo_id: 1, decision: 'aprobar' }, 'Humano'),
      op('19.06', 'Difundir publicación', 'Prepara el correo que comparte una pieza publicada con quien consintió recibirlas. Nace en borrador.', { pieza_id: 1 }, 'Nace en borrador'),
      op('19.05', 'Enviar por lotes', 'Solo a personas con consentimiento. En demo, a la lista de prueba.', { correo_id: 1 }, 'Consentimiento'),
    ],
  },
  {
    codigo: '20', slug: 'embajadores', nombre: 'Embajadores', sub: 'Invitaciones y reconocimiento', agente: 'Comunidad', alcance: 'Básica',
    ops: [op('20.01', 'Ver invitaciones', 'Enlaces personales y altas que llegaron por ellos. Sin premios.', {})],
  },
  { codigo: '21', slug: 'cumplimiento', nombre: 'Cumplimiento', sub: 'Garantías legales y de IA', agente: 'TEMIS', alcance: 'Completa', ops: [] },
];

export const porSlug = (slug: string) => SECCIONES.find((s) => s.slug === slug);
export const OPS_PUBLICAS = new Set(['02.01']);
