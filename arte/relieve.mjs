/* Papel blanco con flores en relieve ciego (sin tinta), como si una plancha las hubiera prensado.
   Se dibuja un mapa de alturas en grises y la luz (feDiffuseLighting) lo vuelve volumen.
   Mosaico sin costuras de 720×720 (exportado al doble para pantallas densas). */
import { Lienzo, curva, f } from "./pincel.mjs";

const T = 720;

function flor(L, cx, cy, R, n, giro) {
  let s = "";
  const petalo = (r, ancho, a, gris) => {
    const c = Math.cos(a), sn = Math.sin(a);
    const p = (x, y) => [cx + x * c - y * sn, cy + x * sn + y * c];
    const pts = [p(r * .12, 0), p(r * .45, -ancho * .55), p(r * .82, -ancho * .5), p(r, 0), p(r * .82, ancho * .5), p(r * .45, ancho * .55)];
    s += `<path d="${curva(pts, true)}" fill="${gris}" stroke="#000" stroke-width="2.2"/>`;
    const v0 = p(r * .2, 0), v1 = p(r * .85, 0);
    s += `<path d="M${f(v0[0])} ${f(v0[1])}L${f(v1[0])} ${f(v1[1])}" stroke="#5A5A5A" stroke-width="1.4"/>`;
  };
  for (let i = 0; i < n; i++) petalo(R, R * .42, giro + i / n * Math.PI * 2, "#A8A8A8");
  for (let i = 0; i < n; i++) petalo(R * .66, R * .34, giro + (i + .5) / n * Math.PI * 2, "#C8C8C8");
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * .2)}" fill="#E6E6E6" stroke="#000" stroke-width="1.6"/>`;
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, d = R * .1;
    s += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(R * .035)}" fill="#FFFFFF"/>`;
  }
  return s;
}

function rama(L, x, y, largo, a) {
  // tallo curvo con hojas alternas y un botón al final
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8, aa = a + Math.sin(t * 2.4) * .35;
    pts.push([x + Math.cos(aa) * largo * t, y + Math.sin(aa) * largo * t]);
  }
  let s = `<path d="${curva(pts)}" stroke="#7A7A7A" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  for (let i = 2; i < 8; i += 2) {
    const [px, py] = pts[i], lado = i % 4 ? 1 : -1, ah = a + lado * 1 + Math.sin(i) * .2, l = largo * .26;
    const c = Math.cos(ah), sn = Math.sin(ah);
    const q = (u, v) => [px + u * c - v * sn, py + u * sn + v * c];
    s += `<path d="${curva([q(0, 0), q(l * .35, -l * .2), q(l, 0), q(l * .35, l * .2)], true)}" fill="#8E8E8E" stroke="#000" stroke-width="1.6"/>`;
    const m0 = q(l * .1, 0), m1 = q(l * .85, 0);
    s += `<path d="M${f(m0[0])} ${f(m0[1])}L${f(m1[0])} ${f(m1[1])}" stroke="#4A4A4A" stroke-width="1.2"/>`;
  }
  const [bx, by] = pts[8];
  s += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="9" ry="13" transform="rotate(${f(a * 180 / Math.PI + 90)} ${f(bx)} ${f(by)})" fill="#B4B4B4" stroke="#000" stroke-width="1.4"/>`;
  return s;
}

export function flores() {
  const L = new Lienzo(T * 2, T * 2, 131);
  // [x, y, radio, pétalos] repartidas para que el mosaico respire
  const FLORES = [[150, 140, 62, 8], [520, 250, 48, 6], [300, 470, 70, 9], [640, 600, 40, 7], [80, 520, 34, 6], [430, 60, 30, 6]];
  // Cada flor con su tallo: [largo, ángulo]
  const TALLOS = [[200, 1.1], [150, 2.5], [210, -.3], [120, 1.2], [130, -2.3], [110, 2.8]];
  let motivo = "";
  FLORES.forEach(([x, y], i) => { motivo += rama(L, x, y, TALLOS[i][0], TALLOS[i][1]); });
  FLORES.forEach(([x, y, r, n], i) => { motivo += flor(L, x, y, r, n, i * .7); });
  // Copias desplazadas: el relieve continúa al repetir el mosaico
  let mosaico = "";
  for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) mosaico += `<g transform="translate(${dx} ${dy})">${motivo}</g>`;

  L.def(`<filter id="prensado" x="-40" y="-40" width="${T + 80}" height="${T + 80}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h0"/>
    <feGaussianBlur in="h0" stdDeviation="1.6" result="h"/>
    <feDiffuseLighting in="h" surfaceScale="2.5" diffuseConstant="1" lighting-color="#fff" result="luz"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting>
    <feComponentTransfer in="luz"><feFuncR type="linear" slope="1.17" intercept="-.005"/><feFuncG type="linear" slope="1.165" intercept="-.008"/><feFuncB type="linear" slope="1.15" intercept="-.014"/></feComponentTransfer>
  </filter>`);
  L.add(`<g transform="scale(2)"><g filter="url(#prensado)"><rect x="-40" y="-40" width="${T + 80}" height="${T + 80}" fill="#000"/>${mosaico}</g></g>`);
  return L.svg();
}
