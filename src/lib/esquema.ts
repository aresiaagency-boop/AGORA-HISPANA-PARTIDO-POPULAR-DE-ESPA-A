// Migraciones. Se aplican solas al arrancar, una vez cada una.
// Sin int8 ni numeric: pg y PGlite los devuelven con tipos distintos.
export const MIGRACIONES: { id: string; sql: string }[] = [
  {
    id: '001_base',
    sql: `
CREATE TABLE personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nombre text NOT NULL,
  municipio text,
  pais_origen text,
  intereses jsonb NOT NULL DEFAULT '[]',
  situacion_voto text,
  interes_afiliacion boolean NOT NULL DEFAULT false,
  codigo_invitacion text UNIQUE NOT NULL,
  invitado_por uuid,
  es_demo boolean NOT NULL DEFAULT false,
  creada timestamptz NOT NULL DEFAULT now(),
  baja timestamptz
);
CREATE TABLE consentimientos (
  id serial PRIMARY KEY,
  persona_id uuid NOT NULL REFERENCES personas(id),
  finalidad text NOT NULL,
  otorgado boolean NOT NULL,
  texto_version text NOT NULL,
  texto_hash text NOT NULL,
  origen text NOT NULL,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE firmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES personas(id),
  documento text NOT NULL,
  version text NOT NULL,
  texto_hash text NOT NULL,
  nombre_firmante text NOT NULL,
  metodo text NOT NULL,
  ip_hash text,
  agente text,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE fichas (
  id text PRIMARY KEY,
  titulo text NOT NULL,
  ambito text NOT NULL,
  etiqueta text NOT NULL,
  que_dice text NOT NULL,
  efecto_hoy text NOT NULL,
  efecto_futuro text NOT NULL,
  lectura text NOT NULL,
  perfiles jsonb NOT NULL DEFAULT '[]',
  fuente_titulo text NOT NULL,
  fuente_url text NOT NULL,
  revisada text NOT NULL,
  estado text NOT NULL DEFAULT 'publicada'
);
CREATE TABLE senales (
  id serial PRIMARY KEY,
  plataforma text NOT NULL,
  hook text NOT NULL,
  formato text NOT NULL,
  multiplicador real NOT NULL,
  vistas integer NOT NULL,
  url text UNIQUE NOT NULL,
  tema text NOT NULL,
  patron text,
  fuente text NOT NULL,
  captada text NOT NULL
);
CREATE TABLE patrones (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text NOT NULL,
  plataforma text NOT NULL,
  evidencias integer NOT NULL
);
CREATE TABLE oportunidades (
  id serial PRIMARY KEY,
  titulo text NOT NULL,
  patron_id text NOT NULL,
  ficha_id text,
  perfil text NOT NULL,
  accion text NOT NULL,
  demanda integer NOT NULL,
  retencion integer NOT NULL,
  ajuste integer NOT NULL,
  utilidad integer NOT NULL,
  eficiencia integer NOT NULL,
  riesgo integer NOT NULL,
  puntuacion integer NOT NULL,
  estado text NOT NULL,
  motivo text,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE piezas (
  id serial PRIMARY KEY,
  oportunidad_id integer REFERENCES oportunidades(id),
  titulo text NOT NULL,
  guion jsonb NOT NULL,
  avisos jsonb NOT NULL DEFAULT '[]',
  estado text NOT NULL,
  etiqueta_ia boolean NOT NULL DEFAULT true,
  media_url text,
  creada timestamptz NOT NULL DEFAULT now(),
  actualizada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE aprobaciones (
  id serial PRIMARY KEY,
  tipo text NOT NULL,
  ref_id integer NOT NULL,
  decision text NOT NULL,
  motivo text,
  actor text NOT NULL,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE publicaciones (
  id serial PRIMARY KEY,
  pieza_id integer NOT NULL REFERENCES piezas(id),
  canal text NOT NULL,
  texto text NOT NULL,
  programada text,
  estado text NOT NULL,
  simulada boolean NOT NULL DEFAULT true,
  resultado jsonb NOT NULL DEFAULT '{}',
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE metricas (
  id serial PRIMARY KEY,
  publicacion_id integer NOT NULL REFERENCES publicaciones(id),
  corte text NOT NULL,
  datos jsonb NOT NULL,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE medios (
  id serial PRIMARY KEY,
  titulo text NOT NULL,
  tipo text NOT NULL,
  url text NOT NULL,
  autor text NOT NULL,
  lugar text,
  fecha text,
  licencia text NOT NULL,
  personas_identificables boolean NOT NULL DEFAULT false,
  permiso_archivado boolean NOT NULL DEFAULT false,
  estado text NOT NULL,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE correos (
  id serial PRIMARY KEY,
  asunto text NOT NULL,
  cuerpo text NOT NULL,
  segmento jsonb NOT NULL DEFAULT '{}',
  estado text NOT NULL,
  destinatarios integer NOT NULL DEFAULT 0,
  resultado jsonb NOT NULL DEFAULT '{}',
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE conexiones (
  canal text PRIMARY KEY,
  nombre text NOT NULL,
  via text NOT NULL,
  estado text NOT NULL,
  cuenta text,
  token_cifrado text,
  detalle text,
  actualizada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE conversaciones (
  id serial PRIMARY KEY,
  canal text NOT NULL,
  sesion text NOT NULL,
  entrada text NOT NULL,
  salida text NOT NULL,
  herramienta text,
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE propuestas (
  id serial PRIMARY KEY,
  autor text NOT NULL,
  texto text NOT NULL,
  estado text NOT NULL DEFAULT 'recibida',
  creada timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE actos (
  id serial PRIMARY KEY,
  titulo text NOT NULL,
  municipio text NOT NULL,
  fecha text NOT NULL,
  lugar text NOT NULL
);
CREATE TABLE registro_auditoria (
  id serial PRIMARY KEY,
  actor text NOT NULL,
  accion text NOT NULL,
  objeto text NOT NULL,
  detalle jsonb NOT NULL DEFAULT '{}',
  creada timestamptz NOT NULL DEFAULT now()
);
`,
  },
];
