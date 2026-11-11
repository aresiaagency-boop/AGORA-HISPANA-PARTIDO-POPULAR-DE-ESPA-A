// Evaluaciones. Lo que no se mide no mejora: cada motor determinista tiene sus
// casos en eval/*.jsonl y un fallo aquí rompe `npm run check`.
import { readFileSync } from 'node:fs';
import { puedoVotar } from '../src/lib/voto';
import { decidir, evaluarHook, generarGuion, puntuar, revisarLimites, type PatronId } from '../src/lib/estudio';
import { FICHAS, OPORTUNIDADES } from '../src/lib/semilla';

const lee = <T>(f: string): T[] => readFileSync(new URL(`../eval/${f}.jsonl`, import.meta.url), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l) as T);
let fallos = 0;
const informe = (nombre: string, total: number, malos: string[]) => {
  fallos += malos.length;
  console.log(`${malos.length ? '✗' : '✓'} ${nombre}: ${total - malos.length}/${total}`);
  malos.forEach((m) => console.log(`    ${m}`));
};

// 1 · ¿Puedo votar?
{
  const casos = lee<{ caso: string; entrada: Parameters<typeof puedoVotar>[0]; espera: Record<string, unknown> }>('voto');
  const malos: string[] = [];
  for (const c of casos) {
    const r = puedoVotar(c.entrada) as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(c.espera)) {
      const ok = k === 'plazo_contiene' ? String(r.plazo ?? '').includes(String(v)) : r[k] === v;
      if (!ok) malos.push(`${c.caso}: ${k} esperado ${JSON.stringify(v)}, obtenido ${JSON.stringify(k === 'plazo_contiene' ? r.plazo : r[k])}`);
    }
  }
  informe('voto', casos.length, malos);
}

// 2 · Rúbrica de hooks
{
  const casos = lee<{ hook: string; espera: string }>('hooks');
  informe('hooks', casos.length, casos.filter((c) => evaluarHook(c.hook).veredicto !== c.espera).map((c) => `«${c.hook}»: esperado ${c.espera}, obtenido ${evaluarHook(c.hook).veredicto} (${evaluarHook(c.hook).total})`));
}

// 3 · Límites duros
{
  const casos = lee<{ texto: string; ficha: boolean; espera: string[] }>('limites');
  const malos: string[] = [];
  for (const c of casos) {
    const r = revisarLimites(c.texto, { fichaVerificada: c.ficha }).map((a) => a.regla).sort();
    if (JSON.stringify(r) !== JSON.stringify([...c.espera].sort())) malos.push(`«${c.texto}»: esperado [${c.espera}], obtenido [${r}]`);
  }
  informe('límites', casos.length, malos);
}

// 4 · Ranking de oportunidades
{
  const casos = lee<{ caso: string; factores: Parameters<typeof puntuar>[0]; espera: string }>('ranking');
  informe('ranking', casos.length, casos.filter((c) => decidir(puntuar(c.factores)) !== c.espera).map((c) => `${c.caso}: esperado ${c.espera}, obtenido ${decidir(puntuar(c.factores))} (${puntuar(c.factores)})`));
}

// 5 · Guiones: cada oportunidad sembrada con ficha verificada genera un guion completo,
// bien escrito y que pasa sus propios límites.
{
  const candidatas = OPORTUNIDADES.filter((o) => FICHAS.find((f) => f[0] === o.ficha)?.[11] === 'publicada');
  const malos: string[] = [];
  for (const o of candidatas) {
    const f = FICHAS.find((x) => x[0] === o.ficha)!;
    const g = generarGuion({ titulo: o.titulo, patron: o.patron as PatronId, accion: o.accion, ficha: { id: f[0], titulo: f[1], etiqueta: f[3], que_dice: f[4], efecto_hoy: f[5], fuente_titulo: f[9] } });
    const texto = [...g.hooks, ...g.escenas.map((e) => `${e.pantalla} ${e.voz}`), g.cta].join(' ');
    const bloqueos = revisarLimites(texto, { fichaVerificada: true }).filter((a) => a.nivel === 'bloquea');
    if (bloqueos.length) malos.push(`${o.patron}: bloqueado por ${bloqueos.map((b) => b.regla)}`);
    if (g.hooks.length !== 3 || !g.cta || !g.fuente_en_pantalla.startsWith('Fuente')) malos.push(`${o.patron}: guion incompleto`);
    if (!g.hooks.some((h) => evaluarHook(h).veredicto === 'aprobado')) malos.push(`${o.patron}: ningún hook supera la rúbrica`);
    for (const h of g.hooks) {
      const abre = (h.match(/¿/g) ?? []).length, cierra = (h.match(/\?/g) ?? []).length;
      if (abre !== cierra) malos.push(`${o.patron}: interrogación sin pareja en «${h}»`);
      if (/\bespaña\b|\bmallorca\b|\b(de|sobre) (puedes|homologué)\b/.test(h)) malos.push(`${o.patron}: hook mal construido «${h}»`);
      if (h.split(/\s+/).length > 14) malos.push(`${o.patron}: hook de más de 14 palabras «${h}»`);
    }
    if (g.escenas.some((e) => e.voz.includes('…'))) malos.push(`${o.patron}: la voz se corta a media frase`);
    if (/logotipo del|voz de |rostro de /i.test(g.prompt_higgsfield)) malos.push(`${o.patron}: el encargo pide marca o persona real`);
  }
  informe('guiones', candidatas.length, malos);
}

if (fallos) { console.error(`\n${fallos} evaluaciones fallan.`); process.exit(1); }
console.log('\nTodas las evaluaciones pasan.');
