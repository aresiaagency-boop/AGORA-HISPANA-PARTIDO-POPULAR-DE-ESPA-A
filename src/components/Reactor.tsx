'use client';
// Reactor táctil. Un solo oyente para toda la aplicación: cada cristal sabe dónde
// está el dedo (--px, --py), se inclina hacia él (--rx, --ry) y enciende su filo
// de plasma al tocarlo (.cerca, .toque), con una onda de impacto.
import { useEffect } from 'react';

const CRISTAL = '.panel, .kpi, .digito, .tarjeta, .fase';

export default function Reactor() {
  useEffect(() => {
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let actual: HTMLElement | null = null;
    let ultimo: PointerEvent | null = null;
    let cuadro = 0;

    const suelta = () => {
      if (!actual) return;
      actual.classList.remove('cerca');
      actual.style.removeProperty('--rx');
      actual.style.removeProperty('--ry');
      actual = null;
    };

    const aplica = () => {
      cuadro = 0;
      const ev = ultimo;
      if (!ev) return;
      const el = (ev.target as Element | null)?.closest?.<HTMLElement>(CRISTAL) ?? null;
      if (el !== actual) { suelta(); actual = el; el?.classList.add('cerca'); }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
      const lado = Math.max(r.width, r.height);
      // Los cristales grandes no se inclinan: molestaría al leer o al desplazar.
      if (!quieto && lado < 760) {
        const max = Math.min(7, 1100 / lado);
        el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
      }
    };

    const mueve = (ev: PointerEvent) => { ultimo = ev; if (!cuadro) cuadro = requestAnimationFrame(aplica); };

    const toca = (ev: PointerEvent) => {
      ultimo = ev;
      if (cuadro) cancelAnimationFrame(cuadro);
      aplica();
      const el = actual;
      if (!el) return;
      el.classList.add('toque');
      if (quieto) return;
      const r = el.getBoundingClientRect();
      const onda = document.createElement('span');
      onda.className = 'onda-toque';
      onda.style.left = `${ev.clientX - r.left}px`;
      onda.style.top = `${ev.clientY - r.top}px`;
      el.appendChild(onda);
      onda.addEventListener('animationend', () => onda.remove(), { once: true });
    };

    const levanta = (ev: PointerEvent) => {
      const tocados = document.querySelectorAll('.toque');
      window.setTimeout(() => tocados.forEach((e) => e.classList.remove('toque')), 420);
      if (ev.pointerType !== 'mouse') window.setTimeout(suelta, 420);
    };

    document.addEventListener('pointermove', mueve, { passive: true });
    document.addEventListener('pointerdown', toca, { passive: true });
    document.addEventListener('pointerup', levanta, { passive: true });
    document.addEventListener('pointercancel', levanta, { passive: true });
    document.documentElement.addEventListener('pointerleave', suelta);
    return () => {
      document.removeEventListener('pointermove', mueve);
      document.removeEventListener('pointerdown', toca);
      document.removeEventListener('pointerup', levanta);
      document.removeEventListener('pointercancel', levanta);
      document.documentElement.removeEventListener('pointerleave', suelta);
      if (cuadro) cancelAnimationFrame(cuadro);
    };
  }, []);
  return null;
}
