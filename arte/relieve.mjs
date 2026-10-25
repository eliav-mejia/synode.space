/* Papel prensado inspirado en el papel florentino de Rossi: damasco simétrico con hojas de acanto en espiral,
   ramo de lirios al centro, lazos y rosetas de filigrana. Todo en relieve, sin tinta, en distintos tonos de blanco
   (marfil y perla donde el original es rojo y azul, champaña donde es dorado).
   Dos pasadas de la misma geometría: tintes de blanco + luz del relieve (mapa de alturas en grises) en multiplicar.
   Mosaico sin costuras de 720×720, exportado al doble para pantallas densas. */
import { Lienzo, curva, f } from "./pincel.mjs";

const T = 720, EJE = T / 2;
const PAPEL = "#FBF9F4";

// Cada pieza se dibuja dos veces: con su tinte y con su altura (gris claro = más alto).
function pieza(d, tinte, altura, extra = "") {
  return { t: `<path d="${d}" fill="${tinte}" ${extra}/>`, h: `<path d="${d}" fill="${altura}" stroke="#000" stroke-width="1.8" ${extra}/>` };
}
function trazo(d, tinte, altura, ancho) {
  return { t: `<path d="${d}" fill="none" stroke="${tinte}" stroke-width="${ancho}" stroke-linecap="round"/>`, h: `<path d="${d}" fill="none" stroke="${altura}" stroke-width="${ancho}" stroke-linecap="round"/>` };
}

// Hoja de acanto: lóbulo con la punta rizada y dos dientes
function lobulo(x, y, a, L, W) {
  const c = Math.cos(a), s = Math.sin(a);
  const p = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  return curva([p(0, -W * .35), p(L * .35, -W * .62), p(L * .62, -W * .42), p(L * .72, -W * .66), p(L * .9, -W * .3), p(L * 1.04, -W * .48), p(L, 0), p(L * .7, W * .22), p(L * .3, W * .3), p(0, W * .3)], true);
}

// Espiral de acanto: lomo que se enrosca y lóbulos hacia afuera
function acanto(cx, cy, r0, vueltas, a0, sentido, tinte, out) {
  const pts = [];
  const N = 60, k = .62;
  for (let i = 0; i <= N; i++) {
    const t = i / N, th = a0 + sentido * t * vueltas * Math.PI * 2, r = r0 * Math.exp(-k * t * vueltas * Math.PI * 2 / 2.2);
    pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r, th, r]);
  }
  // Lóbulos hacia afuera, peinados hacia atrás como hojas de acanto; más grandes al inicio del rizo
  for (let i = 1; i < N - 10; i += 5) {
    const [x, y, th, r] = pts[i];
    const a = th - sentido * .75;
    out.push(pieza(lobulo(x, y, a, r * (.62 + .2 * Math.sin(i)), r * .4), tinte, i % 2 ? "#9C9C9C" : "#B4B4B4"));
    out.push(pieza(lobulo(x, y, a - sentido * .5, r * .42, r * .26), tinte, "#C6C6C6"));
  }
  // Lomo grueso que se adelgaza
  for (let i = 0; i < N - 2; i += 4) {
    const seg = pts.slice(i, Math.min(N, i + 5)).map(([x, y]) => [x, y]);
    out.push(trazo(curva(seg), tinte, "#D2D2D2", Math.max(2.5, 13 * (1 - i / N))));
  }
  const [ex, ey] = pts[N];
  out.push(pieza(`M${f(ex - 7)} ${f(ey)}a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`, tinte, "#E0E0E0"));
}

function lirio(cx, cy, r, giro, out) {
  for (let i = 0; i < 6; i++) {
    const a = giro + i / 6 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const p = (u, v) => [cx + u * c - v * s, cy + u * s + v * c];
    out.push(pieza(curva([p(r * .1, 0), p(r * .5, -r * .24), p(r, 0), p(r * .5, r * .24)], true), "#FFFEFB", i % 2 ? "#C4C4C4" : "#B4B4B4"));
    const v0 = p(r * .2, 0), v1 = p(r * .85, 0);
    out.push(trazo(`M${f(v0[0])} ${f(v0[1])}L${f(v1[0])} ${f(v1[1])}`, "#F3EFE6", "#707070", 1.2));
  }
  out.push(pieza(`M${f(cx - r * .16)} ${f(cy)}a${f(r * .16)} ${f(r * .16)} 0 1 0 ${f(r * .32)} 0a${f(r * .16)} ${f(r * .16)} 0 1 0 ${f(-r * .32)} 0`, "#EFE8D8", "#E8E8E8"));
}

// Roseta de filigrana: margarita pequeña, anillo de puntos y zarcillos finos
function roseta(cx, cy, r, out) {
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const p = (u, v) => [cx + u * c - v * s, cy + u * s + v * c];
    out.push(pieza(curva([p(r * .2, 0), p(r * .6, -r * .2), p(r, 0), p(r * .6, r * .2)], true), "#F1ECE1", "#909090"));
  }
  out.push(pieza(`M${f(cx - r * .22)} ${f(cy)}a${f(r * .22)} ${f(r * .22)} 0 1 0 ${f(r * .44)} 0a${f(r * .22)} ${f(r * .22)} 0 1 0 ${f(-r * .44)} 0`, "#ECE3CF", "#B8B8B8"));
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, x = cx + Math.cos(a) * r * 1.5, y = cy + Math.sin(a) * r * 1.5;
    out.push(pieza(`M${f(x - 1.8)} ${f(y)}a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0`, "#E9E1CE", "#8A8A8A"));
  }
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + .4, x0 = cx + Math.cos(a) * r * 1.9, y0 = cy + Math.sin(a) * r * 1.9;
    const x1 = cx + Math.cos(a + .5) * r * 3, y1 = cy + Math.sin(a + .5) * r * 3;
    out.push(trazo(`M${f(x0)} ${f(y0)}Q${f(cx + Math.cos(a + .1) * r * 3)} ${f(cy + Math.sin(a + .1) * r * 3)} ${f(x1)} ${f(y1)}`, "#EDE6D6", "#6E6E6E", 1.3));
  }
}

function lazo(cx, cy, e, out) {
  const ala = (s) => curva([[cx, cy], [cx + s * 14 * e, cy - 16 * e], [cx + s * 30 * e, cy - 8 * e], [cx + s * 26 * e, cy + 8 * e], [cx + s * 10 * e, cy + 4 * e]], true);
  const cinta = (s) => curva([[cx, cy + 2 * e], [cx + s * 8 * e, cy + 18 * e], [cx + s * 6 * e, cy + 36 * e], [cx + s * 14 * e, cy + 34 * e], [cx + s * 16 * e, cy + 16 * e], [cx + s * 3 * e, cy]], true);
  out.push(pieza(ala(-1), "#EFE7D5", "#A6A6A6"), pieza(ala(1), "#EFE7D5", "#A6A6A6"));
  out.push(pieza(cinta(-1), "#EFE7D5", "#989898"), pieza(cinta(1), "#EFE7D5", "#989898"));
  out.push(pieza(`M${f(cx - 6 * e)} ${f(cy)}a${f(6 * e)} ${f(6 * e)} 0 1 0 ${f(12 * e)} 0a${f(6 * e)} ${f(6 * e)} 0 1 0 ${f(-12 * e)} 0`, "#EADFC8", "#C8C8C8"));
}

export function flores() {
  const L = new Lienzo(T * 2, T * 2, 131);
  const mitad = [];
  const MARFIL = "#F5EFE3", PERLA = "#EEF0EF";

  // Ramo de lirios al centro (sobre el eje)
  mitad.push(trazo(`M${EJE} 590C${EJE - 4} 520 ${EJE + 3} 440 ${EJE} 330`, "#F0EBDF", "#9A9A9A", 7));
  mitad.push(pieza(lobulo(EJE - 4, 540, -2.3, 70, 34), PERLA, "#A0A0A0"));
  lirio(EJE, 300, 46, -Math.PI / 2, mitad);
  lirio(EJE - 58, 350, 38, -1.9, mitad);
  lirio(EJE - 36, 425, 34, -2.2, mitad);
  lirio(EJE - 92, 432, 28, -2.4, mitad);
  lirio(EJE - 100, 290, 22, -2, mitad);

  // Acantos: el grande en marfil sube y se enrosca; el de arriba en perla baja; uno pequeño abajo
  acanto(150, 340, 190, 1.25, Math.PI * .5, 1, MARFIL, mitad);
  acanto(130, 110, 120, 1.2, -Math.PI * .05, -1, PERLA, mitad);
  acanto(90, 620, 92, 1.2, -Math.PI * .1, 1, PERLA, mitad);

  // Lazos donde se juntan los tallos, y rosetas de filigrana en los huecos
  lazo(EJE, 46, 1.3, mitad);
  lazo(232, 214, .9, mitad);
  [[262, 120, 9], [54, 300, 8], [244, 600, 10], [150, 690, 7], [300, 470, 7], [30, 30, 7], [196, 488, 6]].forEach(([x, y, r]) => roseta(x, y, r, mitad));

  // Espejo sobre el eje vertical y copias para que el mosaico continúe en las orillas
  const lado = (k) => mitad.map((p) => p[k]).join("");
  const motivo = (k) => `<g>${lado(k)}</g><g transform="translate(${T} 0) scale(-1 1)">${lado(k)}</g>`;
  const mosaico = (k) => {
    let s = "";
    for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) s += `<g transform="translate(${dx} ${dy})">${motivo(k)}</g>`;
    return s;
  };

  L.def(`<filter id="prensado" x="-40" y="-40" width="${T + 80}" height="${T + 80}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h0"/>
    <feGaussianBlur in="h0" stdDeviation="1.5" result="h"/>
    <feDiffuseLighting in="h" surfaceScale="2.3" diffuseConstant="1" lighting-color="#fff" result="luz"><feDistantLight azimuth="235" elevation="58"/></feDiffuseLighting>
    <feComponentTransfer in="luz"><feFuncR type="linear" slope="1.18"/><feFuncG type="linear" slope="1.18"/><feFuncB type="linear" slope="1.18"/></feComponentTransfer>
  </filter>`);
  L.add(`<g transform="scale(2)">
    <rect width="${T}" height="${T}" fill="${PAPEL}"/>
    <g opacity=".9">${mosaico("t")}</g>
    <g style="mix-blend-mode:multiply" filter="url(#prensado)"><rect x="-40" y="-40" width="${T + 80}" height="${T + 80}" fill="#000"/>${mosaico("h")}</g>
  </g>`);
  return L.svg();
}
