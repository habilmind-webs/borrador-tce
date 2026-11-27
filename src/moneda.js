// Moneda por IP: mismo sistema que socioemociograma (src/hooks/useCurrency.ts).
// ipapi.co en el cliente; ES/PT -> EUR; resto o error -> USD. Mismo número, sin conversión.
const PAISES_EUR = ['ES', 'PT']; // igual que socioemociograma
export function initMoneda() {
  const els = document.querySelectorAll('[data-precio]');
  if (!els.length) return;
  const pinta = (cur) => els.forEach((el) => {
    const n = Number(el.dataset.precio);
    el.textContent = `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
  });
  els.forEach((el) => { el.textContent = '...'; });
  fetch('https://ipapi.co/json/')
    .then((r) => r.json())
    .then((d) => pinta(PAISES_EUR.includes(d.country_code) ? 'EUR' : 'USD'))
    .catch(() => { console.warn('Could not detect location, defaulting to USD'); pinta('USD'); });
}
