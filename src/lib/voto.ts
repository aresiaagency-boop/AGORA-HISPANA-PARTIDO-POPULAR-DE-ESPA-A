// Motor determinista de «¿Puedo votar?». Sin modelos: reglas del INE.
// Auditado por eval/voto.jsonl. Fuente: https://www.ine.es/dyngs/CEL/index.htm?cid=383
export const FUENTE_VOTO = {
  titulo: 'INE · Censo electoral de extranjeros residentes para las municipales de 2027',
  url: 'https://www.ine.es/dyngs/CEL/index.htm?cid=383',
};

export const ELECCIONES = {
  generales: '2026-11-29',
  municipales: '2027-05-23',
  autonomicas: '2027-05-23',
};

export const PLAZOS = {
  acuerdoDesde: '2026-12-01',
  acuerdoHasta: '2027-01-15',
  ueHasta: '2026-12-30',
};

// País → años de residencia legal exigidos por su acuerdo.
export const PAISES_ACUERDO: Record<string, number> = {
  Bolivia: 5,
  'Cabo Verde': 5,
  Chile: 5,
  Colombia: 5,
  Corea: 5,
  Ecuador: 5,
  Islandia: 5,
  Noruega: 3,
  'Nueva Zelanda': 5,
  Paraguay: 5,
  Perú: 5,
  'Reino Unido': 3,
  'Trinidad y Tobago': 5,
};

export const PAISES_HISPANOAMERICANOS = [
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador',
  'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú',
  'República Dominicana', 'Uruguay', 'Venezuela',
];

export interface EntradaVoto {
  nacionalidadEspanola: boolean;
  pasaporteUE: boolean;
  pais: string;
  residenciaLegal: boolean;
  anosResidencia: number;
}

export type Municipales = 'si' | 'si_con_tramite' | 'no';

export interface ResultadoVoto {
  generales: boolean;
  autonomicas: boolean;
  municipales: Municipales;
  tramite: string | null;
  plazo: string | null;
  explicacion: string;
  camino: string;
}

export function puedoVotar(e: EntradaVoto): ResultadoVoto {
  if (e.nacionalidadEspanola) {
    return {
      generales: true, autonomicas: true, municipales: 'si', tramite: null, plazo: null,
      explicacion: 'Con nacionalidad española votas en todas las elecciones. Comprueba que estás en el censo de tu municipio.',
      camino: 'Ya eres votante. Puedes dar el paso a simpatizante, afiliado o voluntario.',
    };
  }
  if (e.pasaporteUE) {
    return {
      generales: false, autonomicas: false, municipales: 'si_con_tramite',
      tramite: 'Estar empadronado y declarar tu voluntad de votar en España ante el INE o tu ayuntamiento.',
      plazo: `Hasta el ${PLAZOS.ueHasta}`,
      explicacion: 'Como ciudadano de otro país de la UE votas en las municipales si lo declaras a tiempo. No votas en generales ni autonómicas.',
      camino: 'Haz la declaración antes del plazo. Si ya la hiciste en otras municipales, sigue vigente.',
    };
  }
  const anos = PAISES_ACUERDO[e.pais];
  if (anos && e.residenciaLegal && e.anosResidencia >= anos) {
    return {
      generales: false, autonomicas: false, municipales: 'si_con_tramite',
      tramite: 'Pedir la inscripción en el censo electoral de extranjeros (CERE), por internet con Cl@ve o en tu ayuntamiento.',
      plazo: `Del ${PLAZOS.acuerdoDesde} al ${PLAZOS.acuerdoHasta}`,
      explicacion: `${e.pais} tiene acuerdo de voto con España. Con ${anos} años o más de residencia legal votas en las municipales si pides la inscripción en plazo. Hay que pedirla en cada elección, aunque ya votaras antes.`,
      camino: 'Pide la inscripción dentro del plazo: fuera de él se desestima.',
    };
  }
  if (anos && e.residenciaLegal) {
    return {
      generales: false, autonomicas: false, municipales: 'no', tramite: null, plazo: null,
      explicacion: `${e.pais} tiene acuerdo de voto, pero exige ${anos} años de residencia legal y aún no los cumples.`,
      camino: 'Con dos años de residencia legal puedes pedir la nacionalidad española y, con ella, votar en todo.',
    };
  }
  const iberoamericano = PAISES_HISPANOAMERICANOS.includes(e.pais);
  return {
    generales: false, autonomicas: false, municipales: 'no', tramite: null, plazo: null,
    explicacion: anos
      ? 'El voto municipal por acuerdo exige residencia legal en España.'
      : `${e.pais || 'Tu país'} no tiene acuerdo de voto municipal con España.`,
    camino: iberoamericano && e.residenciaLegal
      ? 'Tu vía es la nacionalidad: se puede pedir con dos años de residencia legal y continuada.'
      : 'Sin voto no te quedas fuera: puedes informarte, proponer y, si resides legalmente, afiliarte.',
  };
}
