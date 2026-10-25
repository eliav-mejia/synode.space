/* Pincel: utilidades para pintar acuarela y gouache en SVG de forma procedural.
   Cada capa es un Lienzo con su propia semilla, así el resultado es reproducible. */

export const f = (v) => Math.round(v * 10) / 10;

export function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Curva suave (Catmull-Rom → Bézier) por una lista de puntos.
export function curva(pts, cerrada = false) {
  const n = pts.length;
  const p = (i) => cerrada ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const fin = cerrada ? n : n - 1;
  for (let i = 0; i < fin; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return cerrada ? d + "Z" : d;
}

/* Filtros compartidos (coordenadas = píxeles: cada SVG se rasteriza 1:1).
   acu   acuarela: orilla irregular, borde de pigmento más oscuro y granulado
   lav   lavado: agua abundante, muy difuso
   gou   gouache: cuerpo opaco y orilla de pincel seco
   lejos bruma de distancia */
export const FILTROS = `
<filter id="acu" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="4" result="n1"/>
  <feDisplacementMap in="SourceGraphic" in2="n1" scale="14" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="1.3" result="b"/>
  <feMorphology in="b" operator="erode" radius="3" result="e"/>
  <feGaussianBlur in="e" stdDeviation="3" result="eb"/>
  <feComposite in="b" in2="eb" operator="out" result="orilla"/>
  <feColorMatrix in="orilla" values=".6 0 0 0 0  0 .6 0 0 0  0 0 .64 0 0  0 0 0 .75 0" result="orillaOsc"/>
  <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="11" result="g"/>
  <feColorMatrix in="g" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.9 0 0 0 1.12" result="ga"/>
  <feComposite in="b" in2="ga" operator="in" result="gran"/>
  <feMerge><feMergeNode in="gran"/><feMergeNode in="orillaOsc"/></feMerge>
</filter>
<filter id="lav" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".008" numOctaves="3" seed="9" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="40" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="6" result="b"/>
  <feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="21" result="g"/>
  <feColorMatrix in="g" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.7 0 0 0 1.05" result="ga"/>
  <feComposite in="b" in2="ga" operator="in"/>
</filter>
<filter id="gou" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="7" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency=".9 .22" numOctaves="2" seed="3" result="t"/>
  <feColorMatrix in="t" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.5 0 0 0 1.7" result="ta"/>
  <feComposite in="d" in2="ta" operator="in" result="seco"/>
  <feMorphology in="d" operator="erode" radius="1.6" result="nucleo"/>
  <feMerge><feMergeNode in="seco"/><feMergeNode in="nucleo"/></feMerge>
</filter>
<filter id="lejos" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="15" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="2.4" result="b"/>
  <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="31" result="g"/>
  <feColorMatrix in="g" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.6 0 0 0 1.04" result="ga"/>
  <feComposite in="b" in2="ga" operator="in"/>
</filter>
<filter id="humedo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
`;

export class Lienzo {
  constructor(w, h, seed) {
    this.w = w; this.h = h;
    this.R = rng(seed);
    this.defs = []; this.capas = []; this.n = 0;
    const g = Array.from({ length: 1024 }, () => this.R() * 2 - 1);
    this.ruido = (x) => {
      const i = Math.floor(x), t = x - i, u = t * t * (3 - 2 * t);
      return g[i & 1023] * (1 - u) + g[(i + 1) & 1023] * u;
    };
  }
  r(a = 0, b = 1) { return a + (b - a) * this.R(); }
  e(arr) { return arr[Math.floor(this.R() * arr.length)]; }
  id(p) { return p + "-" + (++this.n); }
  def(s) { this.defs.push(s); }
  add(s) { this.capas.push(s); }
  fbm(x, oct = 4) {
    let a = 0, amp = 1, fr = 1, s = 0;
    for (let o = 0; o < oct; o++) { a += this.ruido(x * fr + o * 37.3) * amp; s += amp; amp *= .5; fr *= 2; }
    return a / s;
  }

  // Mancha cerrada irregular
  mancha(cx, cy, rx, ry, irr = .25, n = 9, rot = 0) {
    const pts = [], c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, k = 1 + irr * (this.R() * 2 - 1);
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      pts.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return curva(pts, true);
  }

  // Pinceladas cortas recortadas a una forma: la textura del gouache.
  pinceladas(d, { n = 60, colores, ancho = [6, 14], largo = [20, 60], angulo = 0, dispersion = .4, opacidad = [.35, .7], caja }) {
    const id = this.id("clip");
    this.def(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    const [x0, y0, x1, y1] = caja;
    let s = `<g clip-path="url(#${id})" stroke-linecap="round" fill="none">`;
    for (let i = 0; i < n; i++) {
      const x = this.r(x0, x1), y = this.r(y0, y1), L = this.r(...largo), a = angulo + this.r(-dispersion, dispersion);
      const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2, cv = this.r(-.25, .25) * L;
      s += `<path d="M${f(x - dx)} ${f(y - dy)}Q${f(x - dy * cv / L * 2)} ${f(y + dx * cv / L * 2)} ${f(x + dx)} ${f(y + dy)}" stroke="${this.e(colores)}" stroke-width="${f(this.r(...ancho))}" opacity="${this.r(...opacidad).toFixed(2)}"/>`;
    }
    return s + "</g>";
  }

  // Degradado lineal; devuelve url(#id)
  degradado(paradas, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
    const id = this.id("dg");
    this.def(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${paradas.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</linearGradient>`);
    return `url(#${id})`;
  }

  svg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}"><defs>${FILTROS}${this.defs.join("")}</defs>\n${this.capas.join("\n")}\n</svg>`;
  }
}
