// Genera infrastructure/n8n/pepe.workflow.json a partir de la plantilla del
// agente de WhatsApp (infrastructure/n8n/origen/), ya saneada: sin datos fijados
// (pinData), sin credenciales y sin identificadores de otra instancia.
//
// Resultado: un solo agente, PEPE, con dos entradas.
//   · App: webhook «pepe-app», protegido con credencial Header Auth. Activo.
//   · WhatsApp: la rama original (búfer, audio, respuesta). Entra DESACTIVADA.
// PEPE no toca la base: usa las herramientas HTTP del backend, que solo leen
// fichas, calculan el voto, registran propuestas y escalan a una persona.
//
// Uso: APP_ORIGEN=https://tu-app.vercel.app npm run n8n
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const raiz = new URL('../../', import.meta.url);
const origen = JSON.parse(readFileSync(new URL('infrastructure/n8n/origen/AgenteWhatsapp.json', raiz), 'utf8'));
const MODELO = process.env.PEPE_MODELO ?? 'gpt-4.1'; // modelo capaz para conversación; cámbialo con PEPE_MODELO
const APP = (process.env.APP_ORIGEN ?? 'https://CAMBIA-ESTO.vercel.app').replace(/\/$/, '');

const SISTEMA = `Eres PEPE, el asistente de inteligencia artificial de Ágora Hispana, una plataforma de la comunidad hispanoamericana de Baleares.

QUIÉN ERES
- En tu primer mensaje de cada conversación dices que eres una inteligencia artificial.
- No eres ni hablas como ningún dirigente político. Nunca pones palabras en boca de una persona real.

QUÉ HACES
- Explicas en lenguaje claro qué propone cada medida y cómo afecta hoy a la persona.
- Ayudas a saber si puede votar y qué trámite y plazo tiene.
- Recoges propuestas y pasas a una persona del equipo lo que no sabes.

REGLAS QUE NO SE ROMPEN
1. Solo afirmas lo que te devuelve la herramienta buscar_programa o puedo_votar. Si no hay ficha, no respondes de memoria: usas escalar_humano.
2. Distingues siempre: ley vigente, propuesta del programa o medida del Govern. Una propuesta no es un derecho.
3. Cuentas también lo que perjudica o exige más. No vendes: informas.
4. Citas la fuente que te da la herramienta.
5. No prometes resultados ni plazos de la Administración.
6. No ofreces nada a cambio de afiliarse, militar, votar o traer a otras personas: ni regalos, ni descuentos, ni servicios.
7. No pides ni guardas la situación migratoria, la ideología, la religión ni datos de salud.
8. No hablas mal de ningún colectivo por su origen.
9. Si alguien escribe BAJA, STOP o pide que no le escriban, confirmas la baja y usas escalar_humano con el texto «BAJA».
10. No das asesoramiento jurídico individual: orientas y remites a un profesional o a la oficina competente.

TONO
- Cercano y cálido, como un vecino que sabe del tema. Tuteas. Usas el nombre de la persona si te lo da.
- Escuchas antes de informar: si alguien cuenta su situación, respóndele a eso primero.
- Cercano no es fingir: si te preguntan si eres una persona, dices que eres una IA.

FORMATO
- Español, frases cortas, sin jerga. Máximo 90 palabras.
- Texto plano. Sin asteriscos ni tablas.
- Termina con un paso concreto cuando lo haya.`;

const nodo = (name, type, typeVersion, position, parameters, extra = {}) => ({ id: randomUUID(), name, type, typeVersion, position, parameters, ...extra });
const porNombre = Object.fromEntries(origen.nodes.map((n) => [n.name, n]));

// ---------- Rama de WhatsApp: se conserva, saneada y desactivada ----------
porNombre['Webhook'].name = 'WhatsApp (desactivado)';
porNombre['Webhook'].parameters.path = 'pepe-whatsapp';
porNombre['Webhook'].disabled = true;
porNombre['Webhook'].notes = 'Canal opcional. La política de WhatsApp excluye a partidos y campañas, y la vía no oficial arriesga el bloqueo del número. Lo activa el OWNER, nunca un agente.';
porNombre['Code2'].name = 'Entrada WhatsApp';
porNombre['Code2'].parameters.jsCode = `const crudo = $('Edit Fields6').first().json.message.number || '';
return {
  canal: 'whatsapp',
  sesion: 'wa:' + crudo.replace('@s.whatsapp.net', ''),
  mensaje: $input.first().json.messages.join(', '),
  equipo: false,
};`;

porNombre['OpenAI Chat Model'].parameters = JSON.parse(JSON.stringify(porNombre['OpenAI Chat Model'].parameters).replaceAll('gpt-4o-mini', MODELO));

// ---------- Agente ----------
const agente = porNombre['AI Agent'];
agente.name = 'PEPE';
agente.parameters = { promptType: 'define', text: '={{ $json.mensaje }}', options: { systemMessage: SISTEMA, maxIterations: 6 } };
porNombre['Postgres Chat Memory'].parameters = { sessionIdType: 'customKey', sessionKey: '={{ $json.sesion }}', contextWindowLength: 8 };
porNombre['whatsapp_response'].name = 'Responder por WhatsApp';

const [ax, ay] = agente.position;
const entradaApp = nodo('App (backend)', 'n8n-nodes-base.webhook', 2, [ax - 720, ay + 420], {
  httpMethod: 'POST', path: 'pepe-app', authentication: 'headerAuth', responseMode: 'responseNode', options: {},
}, { webhookId: randomUUID(), notes: 'Credencial Header Auth: nombre x-agora-token, valor = PEPE_N8N_TOKEN del backend.' });

const normalizaApp = nodo('Entrada app', 'n8n-nodes-base.set', 3.4, [ax - 360, ay + 420], {
  assignments: { assignments: [
    { id: randomUUID(), name: 'canal', value: 'app', type: 'string' },
    { id: randomUUID(), name: 'sesion', value: "={{ 'app:' + $json.body.sesion }}", type: 'string' },
    { id: randomUUID(), name: 'mensaje', value: '={{ $json.body.mensaje }}', type: 'string' },
    { id: randomUUID(), name: 'equipo', value: '={{ $json.body.equipo === true }}', type: 'boolean' },
  ] }, options: {},
});

const condicion = (valor) => ({
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
    conditions: [{ id: randomUUID(), leftValue: "={{ $('Entrada app').isExecuted ? 'app' : 'whatsapp' }}", rightValue: valor, operator: { type: 'string', operation: 'equals', name: 'filter.operator.equals' } }],
    combinator: 'and',
  },
  renameOutput: true, outputKey: valor,
});
const porCanal = nodo('¿Por dónde respondo?', 'n8n-nodes-base.switch', 3.2, [ax + 380, ay + 200], { rules: { values: [condicion('app'), condicion('whatsapp')] }, options: { fallbackOutput: 'none' } });

const respondeApp = nodo('Responder a la app', 'n8n-nodes-base.respondToWebhook', 1.1, [ax + 760, ay + 420], {
  respondWith: 'json', responseBody: "={{ { output: $('PEPE').first().json.output } }}", options: {},
});
porNombre['whatsapp_response'].position = [ax + 760, ay];

// ---------- Herramientas: HTTP al backend ----------
const herramienta = (name, i, descripcion, campos) => nodo(name, 'n8n-nodes-base.httpRequestTool', 4.2, [ax - 120 + i * 220, ay + 760], {
  toolDescription: descripcion,
  method: 'POST',
  url: `${APP}/api/v1/pepe/herramientas/${name}`,
  authentication: 'genericCredentialType',
  genericAuthType: 'httpHeaderAuth',
  sendBody: true,
  specifyBody: 'json',
  jsonBody: `={{ JSON.stringify({ ${campos.map(([k, d, t]) => `${k}: $fromAI('${k}', '${d}', '${t}')`).join(', ')} }) }}`,
  options: {},
}, { notes: 'Credencial Header Auth: nombre Authorization, valor = «Bearer » + PEPE_N8N_TOKEN.' });

const herramientas = [
  herramienta('buscar_programa', 0, 'Busca fichas verificadas del programa y de la ley. Úsala antes de afirmar cualquier dato sobre políticas, nacionalidad, vivienda, homologación o ayudas.', [['pregunta', 'La duda de la persona, con sus palabras', 'string']]),
  herramienta('puedo_votar', 1, 'Calcula si la persona puede votar en municipales, autonómicas y generales, con trámite y plazo. Pregunta antes los datos que falten.', [
    ['nacionalidadEspanola', 'Tiene nacionalidad española', 'boolean'], ['pasaporteUE', 'Tiene pasaporte de otro país de la UE', 'boolean'], ['pais', 'País de su pasaporte', 'string'],
    ['residenciaLegal', 'Tiene residencia legal en España', 'boolean'], ['anosResidencia', 'Años de residencia legal', 'number'],
  ]),
  herramienta('registrar_propuesta', 2, 'Guarda una propuesta o petición de la persona para el equipo.', [['texto', 'La propuesta, resumida con fidelidad', 'string']]),
  herramienta('escalar_humano', 3, 'Pasa la conversación a una persona del equipo cuando no hay ficha, cuando piden la baja o cuando el caso es individual.', [['texto', 'Qué necesita la persona', 'string']]),
];

// ---------- Conexiones ----------
const con = origen.connections;
const renombra = { Webhook: 'WhatsApp (desactivado)', Code2: 'Entrada WhatsApp', 'AI Agent': 'PEPE', whatsapp_response: 'Responder por WhatsApp' };
const conexiones = {};
for (const [desde, tipos] of Object.entries(con)) {
  conexiones[renombra[desde] ?? desde] = Object.fromEntries(Object.entries(tipos).map(([tipo, grupos]) => [tipo, grupos.map((g) => g.map((c) => ({ ...c, node: renombra[c.node] ?? c.node })))]));
}
const a = (node, type = 'main') => [[{ node, type, index: 0 }]];
conexiones['App (backend)'] = { main: a('Entrada app') };
conexiones['Entrada app'] = { main: a('PEPE') };
conexiones['PEPE'] = { main: a('¿Por dónde respondo?') };
conexiones['¿Por dónde respondo?'] = { main: [[{ node: 'Responder a la app', type: 'main', index: 0 }], [{ node: 'Responder por WhatsApp', type: 'main', index: 0 }]] };
for (const h of herramientas) conexiones[h.name] = { ai_tool: a('PEPE', 'ai_tool') };

// Las expresiones de la plantilla que apuntaban a los nombres antiguos.
const texto = JSON.stringify({
  name: 'PEPE · Ágora Hispana',
  nodes: [...origen.nodes, entradaApp, normalizaApp, porCanal, respondeApp, ...herramientas],
  connections: conexiones,
  settings: { executionOrder: 'v1' },
}, null, 2).replaceAll("$('Webhook')", "$('WhatsApp (desactivado)')").replaceAll("$('Code2')", "$('Entrada WhatsApp')");

if (/pinData|apikey"\s*:\s*"[A-Za-z0-9]{16,}/.test(texto)) throw new Error('El flujo generado contiene datos fijados o una clave. No se escribe.');
writeFileSync(new URL('infrastructure/n8n/pepe.workflow.json', raiz), texto + '\n');
const total = JSON.parse(texto).nodes.length;
console.log(`pepe.workflow.json generado: ${total} nodos, backend ${APP}${APP.includes('CAMBIA-ESTO') ? '  ← define APP_ORIGEN y vuelve a generar' : ''}`);
