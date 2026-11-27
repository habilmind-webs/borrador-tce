// Moneda por IP en /precios (mismo contrato que socioemociograma, src/lib/geo.ts).
// 1) /geo propio (servidor local con DB-IP Lite, mismo dominio), timeout 1500 ms.
// 2) Respaldo: https://ipapi.co/json/, timeout 3000 ms.
// 3) Si ambos fallan: null -> USD. ES/PT -> EUR; resto -> USD. Mismo número, sin conversión.
// Se cachea en sessionStorage ('hm_geo_country').
const PAISES_EUR = ['ES', 'PT'];
const CLAVE = 'hm_geo_country';

async function conTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const normaliza = (v) => (typeof v === 'string' && /^[A-Za-z]{2}$/.test(v) ? v.toUpperCase() : null);

function leeCache() {
  try {
    const v = sessionStorage.getItem(CLAVE);
    if (v === null) return undefined;
    return v === '' ? null : v;
  } catch { return undefined; }
}

function guardaCache(p) {
  try { sessionStorage.setItem(CLAVE, p ?? ''); } catch { /* sin sessionStorage */ }
}

export async function pais() {
  const cache = leeCache();
  if (cache !== undefined) return cache;
  let resultado = null;
  let resuelto = false;
  try {
    const d = await conTimeout('/geo', 1500);
    resultado = normaliza(d?.country ?? null);
    resuelto = true;
  } catch {
    try {
      const d = await conTimeout('https://ipapi.co/json/', 3000);
      resultado = normaliza(d?.country_code ?? null);
      resuelto = true;
    } catch {
      resultado = null;
    }
  }
  // Solo se cachea si alguna fuente respondió; si ambas fallan se reintenta en la próxima carga.
  if (resuelto) guardaCache(resultado);
  return resultado;
}

export function initMoneda() {
  const els = document.querySelectorAll('[data-precio]');
  if (!els.length) return;
  const pinta = (cur) => els.forEach((el) => {
    const n = Number(el.dataset.precio);
    el.textContent = `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
  });
  els.forEach((el) => { el.textContent = '...'; });
  pais()
    .then((p) => pinta(p && PAISES_EUR.includes(p) ? 'EUR' : 'USD'))
    .catch(() => { console.warn('Could not detect location, defaulting to USD'); pinta('USD'); });
}
