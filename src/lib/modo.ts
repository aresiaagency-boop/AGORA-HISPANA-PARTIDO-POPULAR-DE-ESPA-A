// Modo de operación. `oficial` solo lo activa el OWNER con la autorización
// escrita del partido archivada en docs/autorizacion/. Ver CLAUDE.md.
export type Modo = 'demo' | 'oficial';

export const MODO: Modo = process.env.AGORA_MODO === 'oficial' ? 'oficial' : 'demo';
export const esDemo = MODO === 'demo';

export const MARCA = 'ÁGORA HISPANA';
export const NOMBRE = esDemo ? MARCA : 'ÁGORA HISPANA · Partido Popular de España';
export const ROTULO = esDemo ? 'Demo · propuesta para el Partido Popular · no oficial' : null;

// Quién responde de los datos. En demo no hay responsable designado todavía.
export const RESPONSABLE =
  process.env.RESPONSABLE_TRATAMIENTO ?? 'los promotores de Ágora Hispana (responsable pendiente de designar)';

export const ORIGEN = process.env.APP_ORIGEN ?? 'http://localhost:3000';
