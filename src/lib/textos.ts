// Textos legales que la persona acepta y firma. Cada alta guarda la versión y el
// hash del texto exacto que vio. Cambiar un texto exige subir la versión.
import { RESPONSABLE } from './modo';

export const VERSION_TEXTOS = 'v1-2026-11';

export const FINALIDADES = {
  informacion_civica:
    'Quiero recibir información cívica de Ágora Hispana: plazos de voto, trámites de nacionalidad y actos.',
  comunicaciones_politicas:
    'Quiero recibir comunicaciones políticas sobre las propuestas del Partido Popular. Sé que esto revela mi interés político y lo consiento expresamente.',
  voluntariado:
    'Quiero que me contacten para colaborar como voluntario o voluntaria.',
} as const;

export type Finalidad = keyof typeof FINALIDADES;

export const MANIFESTACION =
  `Manifiesto mi interés en afiliarme al Partido Popular y autorizo a ${RESPONSABLE} a trasladar mi nombre y mi correo al partido para que tramite mi solicitud. ` +
  'Entiendo que esta manifestación no es la afiliación: la afiliación la decide y la formaliza el partido conforme a sus estatutos. ' +
  'No recibo nada a cambio y ningún servicio depende de ella. Puedo retirarla cuando quiera.';

export const AVISO_PRIVACIDAD =
  `Responsable: ${RESPONSABLE}. Finalidad: las que marques abajo, cada una por separado. Base jurídica: tu consentimiento explícito. ` +
  'No guardamos tu situación migratoria ni deducimos tu ideología. Puedes darte de baja en un clic y pedir el borrado de tus datos.';

export const MUNICIPIOS = [
  'Palma', 'Calvià', 'Manacor', 'Llucmajor', 'Marratxí', 'Inca', 'Alcúdia', 'Eivissa', 'Santa Eulària des Riu',
  'Sant Antoni de Portmany', 'Maó', 'Ciutadella', 'Formentera', 'Otro municipio de Baleares',
];

export const INTERESES = ['Voto y censo', 'Nacionalidad', 'Homologación de títulos', 'Vivienda', 'Empleo y autónomos', 'Familia y educación'];
