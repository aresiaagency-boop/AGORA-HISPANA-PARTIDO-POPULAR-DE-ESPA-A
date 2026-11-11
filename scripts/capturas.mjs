// QA visual: entra como owner y captura las pantallas clave en escritorio, tablet
// y móvil. El trabajo visual se revisa con imágenes, no con logs.
// Uso: BASE=http://localhost:3000 OWNER_EMAIL=… OWNER_PASSWORD=… node scripts/capturas.mjs
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  ({ chromium } = createRequire(`${process.env.PLAYWRIGHT_DIR ?? '/opt/npm-tools/node_modules'}/`)('playwright'));
}
const BASE = process.env.BASE ?? 'http://localhost:3000';
const DIR = process.env.CAPTURAS ?? 'artifacts/capturas';
mkdirSync(DIR, { recursive: true });

const navegador = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const errores = [];
const TAMANOS = {
  escritorio: { viewport: { width: 1440, height: 900 } },
  'tablet-horizontal': { viewport: { width: 1180, height: 820 }, hasTouch: true, deviceScaleFactor: 2 },
  'tablet-vertical': { viewport: { width: 820, height: 1180 }, hasTouch: true, deviceScaleFactor: 2 },
  movil: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
};

async function sesion(nombre) {
  const ctx = await navegador.newContext(TAMANOS[nombre]);
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errores.push(`[${nombre}] ${m.text()}`); });
  p.on('pageerror', (e) => errores.push(`[${nombre}] ${e.message}`));
  await p.goto(`${BASE}/entrar`);
  if (nombre === 'escritorio') await p.screenshot({ path: `${DIR}/entrar-escritorio.png` });
  await p.fill('input[name=email]', process.env.OWNER_EMAIL);
  await p.fill('input[name=clave]', process.env.OWNER_PASSWORD);
  await Promise.all([p.waitForURL('**/consola'), p.click('form[action="/api/auth/entrar"] button')]);
  return p;
}
const foto = async (p, nombre, completa = false) => { await p.waitForTimeout(900); await p.screenshot({ path: `${DIR}/${nombre}.png`, fullPage: completa }); console.log('captura', nombre); };

for (const t of Object.keys(TAMANOS)) {
  const p = await sesion(t);
  await foto(p, `mission-control-${t}`);
  if (t !== 'escritorio') { await p.locator('.lienzo').evaluate((el) => el.scrollTo(0, el.scrollHeight)); await foto(p, `mission-control-${t}-final`); await p.locator('.lienzo').evaluate((el) => el.scrollTo(0, 0)); }
  if (t === 'escritorio' || t === 'tablet-horizontal') {
    // Toque sostenido sobre un nodo y sobre un cristal: el filo de plasma tiene que encenderse.
    await p.locator('.nodo').nth(1).click();
    const k = await p.locator('.kpi').nth(4).boundingBox();
    await p.mouse.move(k.x + k.width * 0.7, k.y + k.height * 0.4);
    await p.mouse.down();
    await p.waitForTimeout(260);
    await p.screenshot({ path: `${DIR}/mission-control-${t}-toque.png` });
    await p.mouse.up();
    console.log('captura', `mission-control-${t}-toque`);
    for (const s of ['estudio-viral', 'correo', 'comunidad', 'pepe', 'configuracion', 'programa', 'mi-camino', 'embajadores', 'territorio', 'cumplimiento']) {
      if (t !== 'escritorio' && s !== 'estudio-viral') continue;
      await p.goto(`${BASE}/consola/${s}`);
      await p.setViewportSize({ width: TAMANOS[t].viewport.width, height: Math.min(6000, await p.locator('.lienzo').evaluate((el) => el.scrollHeight + 120)) });
      await foto(p, `${s}-${t}`);
      await p.setViewportSize(TAMANOS[t].viewport);
    }
    if (t === 'escritorio') {
      // Ciclo real: generar un guion desde la interfaz y capturar la pieza con sus acciones.
      await p.goto(`${BASE}/consola/estudio-viral`);
      await p.getByRole('button', { name: 'Generar guion' }).first().click();
      await p.locator('.guion').first().waitFor();
      await p.locator('.guion').first().screenshot({ path: `${DIR}/estudio-viral-pieza.png` });
      console.log('captura', 'estudio-viral-pieza');
    }
    if (t === 'escritorio') {
      await p.goto(`${BASE}/alta`); await foto(p, 'alta-paso2');
      await p.fill('input[autocomplete=name]', 'Ana Prueba Demo'); await p.getByRole('button', { name: 'Continuar' }).click(); await p.locator('input[type=checkbox]').first().check(); await foto(p, 'alta-paso3');
      await p.getByRole('button', { name: 'Continuar' }).click(); await p.getByRole('button', { name: 'Terminar' }).click(); await p.getByRole('link', { name: 'Entrar en mi espacio' }).click(); await p.waitForURL('**/mi-espacio');
      await p.setViewportSize({ width: 1440, height: 1700 }); await foto(p, 'mi-espacio'); await p.setViewportSize(TAMANOS[t].viewport); await p.goto(`${BASE}/puedo-votar`); await foto(p, 'puedo-votar-escritorio'); }
  }
  await p.context().close();
}
await navegador.close();
if (errores.length) { console.error('ERRORES DE CONSOLA:\n' + errores.join('\n')); process.exit(1); }
console.log('Sin errores de consola.');
