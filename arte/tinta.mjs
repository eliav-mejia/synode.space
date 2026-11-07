/* Variante tinta: las mismas escenas dibujadas a pluma con tinta índigo, solo contorno y achurado
   (como un grabado o una toile azul), con alguna aguada muy ligera. Mismos tamaños que las capas de acuarela
   para que el CSS de las escenas sirva sin cambios. */
import { Lienzo, curva, f } from "./pincel.mjs";
import { G, vanos } from "./arco.mjs";

const INDIGO = "#26357A";
const INDIGO_OSC = "#1A2558";
const AGUADA = "#3552C4";
// Tono medio del algodón blanco prensado en frío (--prensado sobre blanco): los rellenos se funden con el papel
const PAPEL = "#F4F3F0";

// Pluma: orilla temblorosa y tinta que no carga igual en todo el trazo
const PLUMA = `
<filter id="pluma" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="5" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="17" result="g"/>
  <feColorMatrix in="g" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.8 0 0 0 1.25" result="ga"/>
  <feComposite in="d" in2="ga" operator="in" result="seca"/>
  <feGaussianBlur in="seca" stdDeviation=".35"/>
</filter>
<filter id="aguada" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="3" seed="23" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="1.2"/>
</filter>`;

class Pluma extends Lienzo {
  svg() {
    return super.svg().replace("<defs>", "<defs>" + PLUMA);
  }
  // Trazo abierto por puntos
  linea(pts, w = 2.4, color = INDIGO, op = 1) {
    return `<path d="${curva(pts)}" fill="none" stroke="${color}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op.toFixed(2)}"` : ""}/>`;
  }
  contorno(d, w = 2.4, color = INDIGO, relleno = "none") {
    return `<path d="${d}" fill="${relleno}" stroke="${color}" stroke-width="${f(w)}" stroke-linejoin="round"/>`;
  }
  // Achurado: rectas paralelas recortadas a una forma
  rayado(d, caja, { ang = -.9, sep = 9, w = 1.2, color = INDIGO, op = .8, temblor = 1.5 } = {}) {
    const id = this.id("ray");
    this.def(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    const [x0, y0, x1, y1] = caja;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    let s = "";
    for (let t = -R; t < R; t += sep * this.r(.8, 1.2)) {
      const px = cx + nx * t, py = cy + ny * t, j = this.r(-temblor, temblor);
      s += `M${f(px - ux * R)} ${f(py - uy * R + j)}L${f(px + ux * R)} ${f(py + uy * R - j)}`;
    }
    return `<g clip-path="url(#${id})"><path d="${s}" stroke="${color}" stroke-width="${f(w)}" opacity="${op}" fill="none" stroke-linecap="round"/></g>`;
  }
  // Aguada ligera de índigo debajo de la línea
  lavado(d, op = .1, color = AGUADA) {
    return `<path d="${d}" fill="${color}" opacity="${op}" filter="url(#aguada)"/>`;
  }
}

// Tallo de contorno: trazo grueso de tinta con el centro en blanco de papel
function tallo(L, pts, ancho) {
  return L.linea(pts, ancho + 4.4) + L.linea(pts, ancho, PAPEL) + L.linea(pts.map(([x, y]) => [x + ancho * .22, y]), 1, INDIGO, .55);
}

// Línea media de una hoja o pétalo: base, ángulo, largo y curvatura
function eje(x, y, ang, largo, curv, n = 14) {
  const ux = Math.cos(ang), uy = Math.sin(ang);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, b = curv * Math.sin(Math.PI * t * .9) * largo + curv * t * t * largo * .6;
    pts.push([x + ux * largo * t - uy * b, y + uy * largo * t + ux * b, t]);
  }
  return pts;
}
// Contorno lanceolado alrededor del eje; «panza» mueve el punto más ancho
function lanceola(pts, ancho, panza = .4) {
  const izq = [], der = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    let dx = q[0] - o[0], dy = q[1] - o[1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const t = p[2], k = t < panza ? Math.sin(t / panza * Math.PI / 2) : Math.cos((t - panza) / (1 - panza) * Math.PI / 2);
    const a = ancho * Math.pow(Math.max(0, k), .8);
    izq.push([p[0] - dy * a, p[1] + dx * a]);
    der.push([p[0] + dy * a, p[1] - dx * a]);
  });
  return curva(izq.concat(der.reverse()), true);
}

// Hoja con nervadura: contorno, nervio central y nervios laterales paralelos (platanera, ave del paraíso)
function hoja(L, x, y, ang, largo, ancho, curv, { w = 2.4, venas = 14, lavado = 0, panza = .45, rayar = true } = {}) {
  const e = eje(x, y, ang, largo, curv);
  const d = lanceola(e, ancho, panza);
  let s = `<path d="${d}" fill="${PAPEL}"/>` + (lavado ? L.lavado(d, lavado) : "");
  // Media hoja en sombra: achurado fino paralelo a los nervios
  const mitad = curva(e.map((p) => [p[0], p[1]]).concat(e.slice().reverse().map((p, i, a) => {
    const q = a[Math.max(i - 1, 0)], dx = p[0] - q[0], dy = p[1] - q[1], dd = Math.hypot(dx, dy) || 1;
    return [p[0] - dy / dd * ancho * 1.2, p[1] + dx / dd * ancho * 1.2];
  })), true);
  const id = L.id("hj");
  L.def(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  s += `<g clip-path="url(#${id})">${L.rayado(mitad, [x - largo, y - largo, x + largo, y + largo], { ang: ang + .75, sep: 4.5, w: .9, op: .55 })}</g>`;
  s += L.contorno(d, w);
  s += L.linea(e.slice(0, -1).map((p) => [p[0], p[1]]), w * .7);
  if (rayar) {
    let v = "";
    for (let i = 1; i < venas; i++) {
      const t = i / venas, k = Math.floor(t * (e.length - 1)), p = e[k], q = e[Math.min(k + 1, e.length - 1)];
      const da = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const a = ancho * .85 * Math.sin(Math.PI * Math.min(1, t * 1.1));
      [1, -1].forEach((lado) => {
        const aa = da + lado * 1.05;
        v += `M${f(p[0])} ${f(p[1])}Q${f(p[0] + Math.cos(aa) * a * .5)} ${f(p[1] + Math.sin(aa) * a * .5)} ${f(p[0] + Math.cos(da + lado * .7) * a)} ${f(p[1] + Math.sin(da + lado * .7) * a)}`;
      });
    }
    s += `<path d="${v}" stroke="${INDIGO}" stroke-width="${f(w * .42)}" fill="none" opacity=".7" stroke-linecap="round"/>`;
  }
  return s;
}

// Ave del paraíso: espata en forma de pico, sépalos en abanico y lengüetas azules
function paraiso(L, x, y, ang, s, espejo = 1) {
  const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy * espejo, ny = ux * espejo;
  const P = (a, b) => [x + ux * a * s + nx * b * s, y + uy * a * s + ny * b * s];
  const espata = curva([P(-10, 0), P(40, -10), P(110, -14), P(175, -6), P(196, 2), P(150, 10), P(80, 18), P(20, 14)], true);
  let o = `<path d="${espata}" fill="${PAPEL}"/>` + L.lavado(espata, .12);
  o += L.contorno(espata, 2.6 * Math.sqrt(s));
  o += L.rayado(espata, [x - 220 * s, y - 220 * s, x + 220 * s, y + 220 * s], { ang: ang + .12 * espejo, sep: 6 * s + 2, w: 1, op: .55 });
  o += L.linea([P(30, 4), P(100, 0), P(170, -4)], 1.4 * Math.sqrt(s), INDIGO, .8);
  // Sépalos (naranjas en la acuarela): pétalos largos que se abren hacia arriba
  const base = P(70, -12);
  const angulos = [-1.05, -1.35, -1.7, -2.05].map((a) => ang + a * espejo);
  angulos.forEach((a, i) => {
    const e = eje(base[0], base[1], a, s * L.r(120, 160) * (i === 3 ? .8 : 1), L.r(-.06, .06));
    const d = lanceola(e, s * L.r(9, 13), .35);
    o += L.contorno(d, 2.1 * Math.sqrt(s));
    o += L.linea(e.slice(1, -2).map((p) => [p[0], p[1]]), 1.1 * Math.sqrt(s), INDIGO, .75);
  });
  // Lengüetas: azules en la acuarela, aquí con aguada más intensa
  [ang - .75 * espejo, ang - .95 * espejo].forEach((a, i) => {
    const e = eje(base[0] + ux * 12 * s, base[1] + uy * 12 * s, a, s * (110 + i * 25), .08 * espejo);
    const d = lanceola(e, s * 5, .55);
    o += `<path d="${d}" fill="${INDIGO}" opacity=".7"/>` + L.contorno(d, 1.8 * Math.sqrt(s));
  });
  return o;
}

// Árbol pequeño de grabado: copa redonda, sombra achurada a la derecha y tronco
function arbolito(L, x, y, r) {
  const copa = L.mancha(x, y - r, r * .8, r, .18, 9);
  let s = L.contorno(copa, 1.8) + L.rayado(copa, [x, y - 2 * r, x + r, y], { ang: -1.1, sep: 4, w: 1, op: .7 });
  s += L.linea([[x, y - r * .2], [x + .5, y + r * .5]], 2);
  return s;
}

// ================= Escena 1 · Tetelpan =================
export function montes() {
  const L = new Pluma(2400, 1500, 211);
  // Crestas de lejos a cerca; cada una tapa el achurado de la anterior
  const crestas = [
    { y: 420, amp: 150, fr: .0016, op: .45, sep: 15, largo: 60 },
    { y: 560, amp: 140, fr: .0022, op: .6, sep: 12, largo: 80 },
    { y: 700, amp: 110, fr: .003, op: .8, sep: 10, largo: 90 }
  ];
  const alto = crestas.map((c, i) => (x) => c.y - Math.abs(L.fbm(x * c.fr + i * 13, 4)) * c.amp * 2.2 + Math.sin(x * .0011 + i) * 40);
  let s = "";
  crestas.forEach((c, i) => {
    const y = alto[i], sig = alto[i + 1] || (() => 2000);
    const pts = [];
    for (let x = -40; x <= 2440; x += 30) pts.push([x, y(x)]);
    s += `<g opacity="${c.op}">${L.linea(pts, 3.4 - i * .2 + .4 * i)}`;
    // Achurado que baja por la ladera siguiendo la pendiente
    let h = "";
    for (let x = -20; x < 2420; x += c.sep * L.r(.7, 1.3)) {
      const y0 = y(x) + 4, pend = Math.max(-.7, Math.min(.7, (y(x + 10) - y(x - 10)) / 20));
      const largo = c.largo * L.r(.3, 1) * (1 + Math.abs(pend) * .5);
      const y1 = Math.min(y0 + largo, sig(x) - 8);
      if (y1 <= y0 + 4) continue;
      h += `M${f(x)} ${f(y0)}L${f(x + pend * (y1 - y0) * .6)} ${f(y1)}`;
    }
    s += `<path d="${h}" stroke="${INDIGO}" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>`;
  });
  // Nubes de contorno en el cielo
  [[520, 250, 1], [1700, 200, 1.2], [2150, 330, .8]].forEach(([x, y, k]) => {
    const pts = [[x - 160 * k, y + 20], [x - 120 * k, y - 6], [x - 70 * k, y - 26], [x - 10 * k, y - 34], [x + 50 * k, y - 22], [x + 110 * k, y - 6], [x + 170 * k, y + 18]];
    s += `<g opacity=".4">${L.linea(pts, 2.4)}${L.linea([[x - 200 * k, y + 22], [x + 220 * k, y + 22]], 1.6)}</g>`;
  });
  L.add(`<g filter="url(#pluma)">${s}</g>`);

  // Lago: rayitas horizontales que se aclaran hacia la orilla
  let lago = "";
  for (let i = 0; i < 120; i++) {
    const y = L.r(880, 1040), x = L.r(820, 1860), w = L.r(30, 160) * (1 - (y - 880) / 300);
    lago += `M${f(x)} ${f(y)}h${f(w)}`;
  }
  L.add(`<g filter="url(#pluma)"><path d="M760 878 C1100 868 1500 866 1880 878" stroke="${INDIGO}" stroke-width="2.6" fill="none" opacity=".8"/>
    <path d="${lago}" stroke="${INDIGO}" stroke-width="1.6" opacity=".55" stroke-linecap="round"/></g>`);

  // Laderas cercanas con arbolitos
  const izq = "M-60 760 C200 770 520 820 760 900 C900 950 1000 1040 1120 1160 C1200 1240 1260 1290 1300 1320";
  const der = "M2460 740 C2200 760 1960 820 1820 900 C1730 960 1640 1050 1540 1160 C1460 1240 1400 1290 1360 1320";
  let cerca = L.contorno(izq, 3.2) + L.contorno(der, 3.2);
  cerca += L.rayado(izq + "L-60 1320Z", [-60, 760, 1300, 1320], { ang: -2.2, sep: 13, w: 1.3, op: .45 });
  cerca += L.rayado(der + "L2460 1320Z", [1360, 740, 2460, 1320], { ang: -.95, sep: 13, w: 1.3, op: .45 });
  for (let i = 0; i < 26; i++) {
    const t = L.r(0, 1), x = -40 + t * 820, y = 780 + t * t * 140 + L.r(10, 140);
    cerca += arbolito(L, x, y, L.r(16, 26));
    const x2 = 2440 - t * 640, y2 = 760 + t * t * 160 + L.r(10, 140);
    cerca += arbolito(L, x2, y2, L.r(16, 26));
  }
  // Península con el pueblo
  const pen = curva([[860, 1000], [960, 960], [1060, 968], [1180, 990], [1300, 1010], [1360, 1040], [1290, 1068], [1120, 1072], [940, 1062], [860, 1040]], true);
  cerca += L.contorno(pen, 2.6);
  for (let i = 0; i < 22; i++) {
    const x = L.r(900, 1300), y = L.r(1000, 1050), w = L.r(14, 22), h = L.r(9, 14);
    cerca += `<path d="M${f(x)} ${f(y)}h${f(w)}v${f(-h)}l${f(-w / 2)} ${f(-h * .7)}l${f(-w / 2)} ${f(h * .7)}Z" fill="${PAPEL}" stroke="${INDIGO}" stroke-width="1.4"/>`;
  }
  for (let i = 0; i < 9; i++) cerca += arbolito(L, L.r(900, 1300), L.r(1000, 1045), L.r(10, 15));
  L.add(`<g filter="url(#pluma)">${cerca}</g>`);
  return L.svg();
}

export function tallos() {
  const L = new Pluma(504, 1000, 223);
  let s = "";
  // Tallos largos que bajan hasta el borde
  s += tallo(L, [[222, 300], [228, 520], [216, 760], [204, 1000]], 9);
  s += tallo(L, [[70, 560], [64, 760], [76, 1000]], 8);
  // Hojas largas
  s += hoja(L, 210, 760, -2.2, 330, 30, .05, { venas: 18 });
  s += hoja(L, 225, 700, -.62, 300, 24, -.06, { venas: 16 });
  s += hoja(L, 70, 880, -1.2, 260, 26, .08, { venas: 14 });
  // Dos flores: arriba a la derecha y abajo a la izquierda
  s += paraiso(L, 222, 300, -2.6, 1.15, -1);
  s += paraiso(L, 70, 560, -.35, .9);
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}

export function pintura() {
  const L = new Pluma(564, 757, 229);
  let s = "";
  // Hojas grandes de platanera detrás
  s += hoja(L, 200, 757, -1.95, 430, 46, .05, { venas: 20 });
  s += hoja(L, 330, 757, -1.45, 540, 58, -.05, { venas: 26 });
  s += hoja(L, 420, 757, -1.15, 470, 50, .06, { venas: 22 });
  s += hoja(L, 520, 757, -1.6, 300, 38, -.1, { venas: 14 });
  // Tallos y flores
  [[250, 757, 190, 300], [360, 757, 330, 210], [470, 757, 470, 380]].forEach(([x0, y0, x1, y1]) => {
    s += tallo(L, [[x0, y0], [x0 + (x1 - x0) * .4, y0 - (y0 - y1) * .5], [x1, y1]], 7);
  });
  s += paraiso(L, 190, 300, -.15, 1.05);
  s += paraiso(L, 330, 210, -.35, .85);
  s += paraiso(L, 470, 380, -.05, .7);
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}

// Rosa de grabado: espiral de pétalos y pétalos exteriores
function rosa(L, x, y, r) {
  let s = L.lavado(L.mancha(x, y, r, r * .9, .12, 9), .07);
  const exterior = [];
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2 + L.r(-.2, .2);
    exterior.push(`M${f(x + Math.cos(a - .55) * r * .7)} ${f(y + Math.sin(a - .55) * r * .7)}Q${f(x + Math.cos(a) * r * 1.25)} ${f(y + Math.sin(a) * r * 1.25)} ${f(x + Math.cos(a + .6) * r * .78)} ${f(y + Math.sin(a + .6) * r * .78)}`);
  }
  s += `<path d="${exterior.join("")}" stroke="${INDIGO}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  let esp = "";
  for (let k = 0; k < 3; k++) {
    const rr = r * (.62 - k * .18), a0 = L.r(0, 6);
    esp += `M${f(x + Math.cos(a0) * rr)} ${f(y + Math.sin(a0) * rr)}A${f(rr)} ${f(rr * .85)} 0 1 1 ${f(x + Math.cos(a0 + 4.6) * rr)} ${f(y + Math.sin(a0 + 4.6) * rr)}`;
  }
  s += `<path d="${esp}" stroke="${INDIGO}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  s += L.rayado(L.mancha(x + r * .25, y + r * .3, r * .7, r * .5, .1, 8), [x - r, y - r, x + r * 1.4, y + r * 1.4], { ang: -.7, sep: 4, w: .9, op: .6 });
  return s;
}

export function ramo() {
  const L = new Pluma(807, 841, 241);
  let s = "";
  // Tallos atados que salen por abajo
  for (let i = 0; i < 9; i++) {
    const x = 380 + i * 7;
    s += L.linea([[x + L.r(-30, 30), 520], [x, 660], [x + (i - 4) * 14, 830]], 2);
  }
  // Moño
  s += L.contorno(curva([[400, 640], [300, 600], [280, 660], [400, 650], [520, 670], [520, 600]], true), 2.4, INDIGO, "none");
  s += L.linea([[400, 650], [350, 760], [330, 820]], 2.2) + L.linea([[410, 650], [470, 770], [500, 815]], 2.2);
  // Follaje en abanico
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i / 11 - .5) * 2.6;
    s += hoja(L, 400 + Math.cos(a) * 80, 470 + Math.sin(a) * 60, a, L.r(150, 230), L.r(22, 34), L.r(-.12, .12), { venas: 8 });
  }
  // Ramitas de flor pequeña
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i / 6 - .5) * 2.2, x0 = 400, y0 = 470, x1 = x0 + Math.cos(a) * 320, y1 = y0 + Math.sin(a) * 300;
    s += L.linea([[x0, y0], [(x0 + x1) / 2 + L.r(-20, 20), (y0 + y1) / 2], [x1, y1]], 1.6);
    for (let k = 0; k < 6; k++) {
      const t = .55 + k * .08, cx = x0 + (x1 - x0) * t + L.r(-14, 14), cy = y0 + (y1 - y0) * t + L.r(-14, 14);
      s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(L.r(4, 7))}" fill="none" stroke="${INDIGO}" stroke-width="1.5"/>`;
    }
  }
  // Rosas
  [[400, 360, 70], [290, 420, 58], [515, 420, 60], [340, 290, 46], [470, 290, 50], [400, 480, 52]].forEach(([x, y, r]) => {
    s += `<path d="${L.mancha(x, y, r * 1.18, r * 1.08, .1, 9)}" fill="${PAPEL}"/>` + rosa(L, x, y, r);
  });
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}

// ================= Escena 3 · Casa Virreinal Roja =================
// Misma geometría que la acuarela (arte/arco.mjs): fachada de frente, pilastras, portón, fuente y macetas
const { SUELO, CX, ARRANQUE, RADIO, MARCO, X0, X1, PRETIL, CORNISA, CORNISA_B, VENT_B, BANDA_B, ZOCALO, PIL, PW, FX, FY } = G;

// Bloque de cantera a pluma: contorno, hiladas y la cara derecha achurada
function bloque(L, x, y, w, h, juntas = 0) {
  const d = `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
  let s = L.contorno(d, 2.4);
  if (juntas) { let j = ""; for (let yy = y + juntas; yy < y + h - 8; yy += juntas) j += `M${f(x)} ${f(yy)}h${f(w)}`; s += `<path d="${j}" stroke="${INDIGO}" stroke-width="1.6" fill="none"/>`; }
  s += L.rayado(`M${f(x + w * .78)} ${f(y)}h${f(w * .22)}v${f(h)}h${f(-w * .22)}Z`, [x, y, x + w, y + h], { ang: -1.2, sep: 5, w: 1, op: .6 });
  return s;
}

export function muro() {
  const L = new Pluma(2400, 1500, 251);
  const muroD = `M${X0} ${PRETIL}H${X1}V${SUELO}H${X0}Z`;
  // Aplanado: aguada ligera y punteado de cal
  L.add(`<path d="${muroD}" fill="${PAPEL}"/><path d="${muroD}" fill="${AGUADA}" opacity=".07"/>`);
  let s = L.contorno(muroD, 3.4);
  let punteo = "";
  for (let i = 0; i < 900; i++) {
    const x = L.r(X0, X1), y = L.r(PRETIL + 10, SUELO - 10);
    if (Math.abs(x - CX) < RADIO + MARCO + 10 || PIL.some((p) => Math.abs(x - p) < PW / 2 + 12)) continue;
    punteo += `M${f(x)} ${f(y)}h1.6`;
  }
  s += `<path d="${punteo}" stroke="${INDIGO}" stroke-width="2" opacity=".35" stroke-linecap="round"/>`;
  // Pretil y cornisa con su sombra achurada
  s += bloque(L, X0 - 14, PRETIL - 14, X1 - X0 + 28, 20);
  s += bloque(L, X0 - 26, CORNISA, X1 - X0 + 52, CORNISA_B - CORNISA);
  s += L.linea([[X0 - 26, CORNISA + 8], [X1 + 26, CORNISA + 8]], 1.4);
  s += L.rayado(`M${X0} ${CORNISA_B}H${X1}V${CORNISA_B + 22}H${X0}Z`, [X0, CORNISA_B, X1, CORNISA_B + 22], { ang: -.8, sep: 6, w: 1, op: .7 });
  // Ventanales de vitroblock: retícula fina, banda abajo
  vanos().forEach(([a, b]) => {
    const x0 = a + 16, x1 = b - 16, y0 = CORNISA_B + 18, y1 = VENT_B;
    const marco = `M${x0 - 6} ${y0 - 6}H${x1 + 6}V${y1}H${x0 - 6}Z`;
    s += L.contorno(marco, 2.6);
    const cols = Math.round((x1 - x0) / 30), filas = Math.round((y1 - y0) / 30);
    let g = "";
    for (let i = 1; i < cols; i++) g += `M${f(x0 + i * (x1 - x0) / cols)} ${y0}V${y1}`;
    for (let j = 1; j < filas; j++) g += `M${x0} ${f(y0 + j * (y1 - y0) / filas)}H${x1}`;
    s += `<path d="${g}" stroke="${INDIGO}" stroke-width="1.5" fill="none"/>`;
    s += L.rayado(`M${x0} ${y0}H${x1}V${y0 + 26}H${x0}Z`, [x0, y0, x1, y0 + 26], { ang: -.8, sep: 4.5, w: .9, op: .55 });
    const banda = `M${a} ${VENT_B}H${b}V${BANDA_B}H${a}Z`;
    s += L.rayado(banda, [a, VENT_B, b, BANDA_B], { ang: 0, sep: 5, w: 1, op: .55, temblor: .4 }) + L.contorno(banda, 2.2);
  });
  // Zócalo
  s += bloque(L, X0, ZOCALO, X1 - X0, SUELO - ZOCALO);
  // Pilastras de ángulo recto
  PIL.forEach((x) => {
    const a = x - PW / 2;
    s += bloque(L, a, CORNISA_B, PW, ZOCALO - CORNISA_B, 64);
    s += bloque(L, a - 9, CORNISA_B, PW + 18, 30);
    s += bloque(L, a - 10, ZOCALO - 34, PW + 20, SUELO - ZOCALO + 34);
  });
  // Vano: interior oscuro en índigo denso, para que el texto blanco se lea encima. Las hojas son capas aparte
  const vano = `M${CX - RADIO} ${SUELO}L${CX - RADIO} ${ARRANQUE}A${RADIO} ${RADIO} 0 0 1 ${CX + RADIO} ${ARRANQUE}L${CX + RADIO} ${SUELO}Z`;
  L.add(`<path d="${vano}" fill="${INDIGO_OSC}"/><path d="${vano}" fill="#0E1433" opacity=".55"/>`);
  s += L.rayado(vano, [CX - RADIO, ARRANQUE - RADIO, CX + RADIO, SUELO], { ang: -.8, sep: 7, w: 1, color: "#5A6AB0", op: .25 });
  s += L.contorno(vano, 3.4);
  // Marco de cantera: jambas, impostas, dovelas y clave
  [CX - RADIO - MARCO, CX + RADIO].forEach((x) => {
    s += bloque(L, x, ARRANQUE, MARCO, ZOCALO - ARRANQUE, 56);
    s += bloque(L, x - 8, ARRANQUE - 4, MARCO + 16, 24);
  });
  const n = 15, r0 = RADIO, r1 = RADIO + MARCO;
  const pt = (r, a) => `${f(CX + Math.cos(a) * r)} ${f(ARRANQUE + Math.sin(a) * r)}`;
  let dov = "";
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + i / n * Math.PI, a1 = Math.PI + (i + 1) / n * Math.PI, ra = i === (n - 1) / 2 ? r1 + 18 : r1;
    dov += `<path d="M${pt(r0, a0)}L${pt(ra, a0)}A${ra} ${ra} 0 0 1 ${pt(ra, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 0 0 ${pt(r0, a0)}Z" fill="none" stroke="${INDIGO}" stroke-width="2.4"/>`;
  }
  s += dov;
  // Farol
  const fx = PIL[3] + PW / 2 + 44, fy = 800;
  s += `<path d="M${PIL[3] + PW / 2} ${fy - 30}h40q12 0 12 14v14" stroke="${INDIGO_OSC}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  s += L.contorno(`M${fx - 18} ${fy}h36l-6 12h-24zM${fx - 14} ${fy + 12}h28l-5 46h-18zM${fx - 12} ${fy + 58}h24l-12 14z`, 2.6, INDIGO, PAPEL);
  s += `<path d="M${fx} ${fy + 12}v46" stroke="${INDIGO}" stroke-width="1.6"/>`;
  // Banqueta de losas y guarnición
  let suelo = `M${X0 - 80} ${SUELO}H${X1 + 80}M${X0 - 80} ${SUELO + 96}H${X1 + 80}M${X0 - 80} ${SUELO + 110}H${X1 + 80}`;
  for (let x = X0 - 60 + L.r(0, 30); x < X1 + 60; x += L.r(110, 160)) suelo += `M${f(x)} ${SUELO + 4}l${f(L.r(-30, -10))} 92`;
  s += `<path d="${suelo}" stroke="${INDIGO}" stroke-width="1.8" fill="none" opacity=".7"/>`;
  s += L.rayado(`M${X0 - 80} ${SUELO + 110}H${X1 + 80}V${SUELO + 170}H${X0 - 80}Z`, [X0 - 80, SUELO + 110, X1 + 80, SUELO + 170], { ang: -.15, sep: 9, w: 1, op: .35 });
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}

// Hojas del portón a pluma
export function puerta(lado) {
  const L = new Pluma(2400, 1500, lado === "izq" ? 253 : 255);
  const R2 = RADIO - 20, x0 = lado === "izq" ? CX - R2 : CX, x1 = lado === "izq" ? CX : CX + R2;
  const porton = `M${CX - R2} ${SUELO}L${CX - R2} ${ARRANQUE + 12}A${R2} ${R2} 0 0 1 ${CX + R2} ${ARRANQUE + 12}L${CX + R2} ${SUELO}Z`;
  const cm = L.id("mitad"), cp = L.id("porton");
  L.def(`<clipPath id="${cm}"><rect x="${x0}" y="0" width="${x1 - x0}" height="1500"/></clipPath><clipPath id="${cp}"><path d="${porton}"/></clipPath>`);
  // Relleno de papel fuera de la pluma (sin grano) y la línea encima
  L.add(`<g clip-path="url(#${cm})"><path d="${porton}" fill="${PAPEL}"/><path d="${porton}" fill="${AGUADA}" opacity=".08"/></g>`);
  let s = L.rayado(`M${x0} ${ARRANQUE - R2}H${x1}V${SUELO}H${x0}Z`, [x0, ARRANQUE - R2, x1, SUELO], { ang: -1.52, sep: 9, w: 1, op: .3 });
  let tablas = "";
  for (let x = CX - R2 + 36; x < CX + R2; x += 36) if (x > x0 + 2 && x < x1 - 2) tablas += `M${x} ${ARRANQUE - R2 + 14}V${SUELO}`;
  s += `<path d="${tablas}" stroke="${INDIGO}" stroke-width="2" fill="none" opacity=".75"/>`;
  s += `<path d="M${x0} ${ARRANQUE + 40}H${x1}M${x0} ${SUELO - 150}H${x1}" stroke="${INDIGO}" stroke-width="7" fill="none"/>`;
  let clavos = "";
  for (let x = CX - R2 + 18; x < CX + R2; x += 36) if (x > x0 && x < x1) clavos += `<circle cx="${x}" cy="${ARRANQUE + 40}" r="3.2"/><circle cx="${x}" cy="${SUELO - 150}" r="3.2"/>`;
  s += `<g fill="${PAPEL}">${clavos}</g>`;
  s += `<circle cx="${lado === "izq" ? CX - 22 : CX + 22}" cy="1170" r="9" fill="none" stroke="${INDIGO}" stroke-width="2.4"/>`;
  s += `<path d="${porton}" fill="none" stroke="${INDIGO}" stroke-width="3.4"/><path d="M${lado === "izq" ? x1 - 2 : x0 + 2} ${ARRANQUE - R2}V${SUELO}" stroke="${INDIGO_OSC}" stroke-width="4"/>`;
  L.add(`<g clip-path="url(#${cm})"><g clip-path="url(#${cp})" filter="url(#pluma)">${s}</g></g>`);
  return L.svg();
}

// Perfil de balaustre (igual que en la acuarela)
function balaustre(cx, y0, y1, perfil) {
  const h = y0 - y1;
  const izq = perfil.map(([t, w]) => [cx - w, y0 - t * h]);
  const der = perfil.map(([t, w]) => [cx + w, y0 - t * h]).reverse();
  return curva(izq.concat(der), true);
}
function tazaTinta(L, cx, y, rx, ry, fondo) {
  const cuerpo = `M${cx - rx} ${y}C${cx - rx * .9} ${y + fondo * .7} ${cx - rx * .35} ${y + fondo} ${cx} ${y + fondo}C${cx + rx * .35} ${y + fondo} ${cx + rx * .9} ${y + fondo * .7} ${cx + rx} ${y}Z`;
  let s = `<path d="${cuerpo}" fill="${PAPEL}"/>` + L.rayado(cuerpo, [cx - rx, y, cx + rx, y + fondo], { ang: -1.1, sep: 6, w: 1, op: .4 });
  s += L.rayado(`M${cx + rx * .2} ${y}H${cx + rx}V${y + fondo}H${cx + rx * .2}Z`, [cx, y, cx + rx, y + fondo], { ang: -.7, sep: 4.5, w: 1, op: .5 });
  s += L.contorno(cuerpo, 2.6);
  let g = "";
  for (let k = -3; k <= 3; k++) { const x = cx + k * rx * .26; g += `M${f(x)} ${f(y + 6)}Q${f(x - k * 4)} ${f(y + fondo * .6)} ${f(cx + k * rx * .08)} ${f(y + fondo - 4)}`; }
  s += `<path d="${g}" stroke="${INDIGO}" stroke-width="1.3" fill="none" opacity=".7"/>`;
  s += `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="${PAPEL}" stroke="${INDIGO}" stroke-width="2.6"/>`;
  s += `<ellipse cx="${cx}" cy="${y - ry * .25}" rx="${rx - 14}" ry="${ry * .45}" fill="${AGUADA}" fill-opacity=".18" stroke="${INDIGO}" stroke-width="1.4"/>`;
  const n = Math.round(rx / 16);
  let fe = "";
  for (let i = 0; i <= n; i++) { const a = Math.PI * i / n, x = cx - Math.cos(a) * rx, yy = y + Math.sin(a) * ry; fe += `M${f(x - rx / n * .5)} ${f(yy + 2)}a${f(rx / n * .5)} ${f(rx / n * .5)} 0 0 0 ${f(rx / n)} 0`; }
  s += `<path d="${fe}" stroke="${INDIGO}" stroke-width="1.6" fill="none"/>`;
  return s;
}
function fuste(L, d, caja) {
  return `<path d="${d}" fill="${PAPEL}"/>` + L.rayado(d, caja, { ang: -1.4, sep: 5, w: 1, op: .35 }) + L.contorno(d, 2.4);
}
function chorrosTinta(L, cx, y, rx, yFin, n) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (i + .5) / n, x = cx - Math.cos(a) * rx * .96, y0 = y + Math.sin(a) * 8;
    s += `<path d="M${f(x)} ${f(y0)}Q${f(x + (x - cx) * .08)} ${f((y0 + yFin) / 2)} ${f(x + (x - cx) * .12)} ${f(yFin)}" stroke="${INDIGO}" stroke-width="1.2" fill="none" stroke-dasharray="${f(L.r(10, 22))} ${f(L.r(5, 10))}" opacity=".7"/>`;
  }
  return s;
}

export function fuente() {
  const L = new Pluma(2400, 1500, 257);
  const rx = 255, ry = 46, h = 96, top = FY - h, B1 = 1236, B2 = 1084, B3 = 968;
  let s = "";
  // Pileta
  s += `<ellipse cx="${FX}" cy="${top}" rx="${rx}" ry="${ry}" fill="${PAPEL}" stroke="${INDIGO}" stroke-width="2.6"/>`;
  s += `<ellipse cx="${FX}" cy="${top + 4}" rx="${rx - 20}" ry="${ry - 9}" fill="${AGUADA}" fill-opacity=".14" stroke="${INDIGO}" stroke-width="1.6"/>`;
  let ondas = "";
  for (let i = 0; i < 7; i++) ondas += `<ellipse cx="${f(FX + L.r(-150, 150))}" cy="${f(top + L.r(6, 22))}" rx="${f(L.r(16, 34))}" ry="${f(L.r(3, 6))}"/>`;
  s += `<g fill="none" stroke="${INDIGO}" stroke-width="1.2" opacity=".6">${ondas}</g>`;
  s += fuste(L, balaustre(FX, top + 14, B1 + 30, [[0, 34], [.25, 28], [.5, 44], [.72, 26], [.9, 22], [1, 30]]), [FX - 50, B1, FX + 50, top + 14]);
  const frente = `M${FX - rx} ${top}A${rx} ${ry} 0 0 0 ${FX + rx} ${top}V${FY}A${rx} ${ry} 0 0 1 ${FX - rx} ${FY}Z`;
  s += `<path d="${frente}" fill="${PAPEL}"/>`;
  s += L.rayado(`M${FX + rx * .35} ${top}H${FX + rx}V${FY + ry}H${FX + rx * .35}Z`, [FX, top, FX + rx, FY + ry], { ang: -1.2, sep: 5, w: 1, op: .55 });
  let j = "";
  for (let k = 1; k < 8; k++) { const a = Math.PI - k / 8 * Math.PI, x = FX + Math.cos(a) * rx; j += `M${f(x)} ${f(top + Math.sin(a) * ry)}V${f(FY + Math.sin(a) * ry)}`; }
  s += `<path d="${j}" stroke="${INDIGO}" stroke-width="1.6" fill="none"/>` + L.contorno(frente, 3);
  s += `<path d="M${FX - rx} ${top + 10}A${rx} ${ry} 0 0 0 ${FX + rx} ${top + 10}" stroke="${INDIGO}" stroke-width="1.4" fill="none"/>`;
  // Tazas, fustes y remate
  s += tazaTinta(L, FX, B1, 172, 20, 80);
  s += fuste(L, balaustre(FX, B1 - 6, B2 + 24, [[0, 30], [.2, 22], [.45, 40], [.7, 20], [.88, 16], [1, 22]]), [FX - 45, B2, FX + 45, B1]);
  s += tazaTinta(L, FX, B2, 112, 15, 58);
  s += fuste(L, balaustre(FX, B2 - 4, B3 + 18, [[0, 22], [.25, 15], [.5, 28], [.75, 14], [1, 17]]), [FX - 35, B3, FX + 35, B2]);
  s += tazaTinta(L, FX, B3, 66, 10, 40);
  s += fuste(L, balaustre(FX, B3 - 2, B3 - 96, [[0, 12], [.18, 9], [.42, 22], [.7, 18], [.88, 8], [1, 2]]), [FX - 25, B3 - 100, FX + 25, B3]);
  let pina = "";
  for (let k = 0; k < 4; k++) pina += `M${FX - 16} ${B3 - 34 - k * 12}q16 10 32 0`;
  s += `<path d="${pina}" stroke="${INDIGO}" stroke-width="1.4" fill="none"/>`;
  s += chorrosTinta(L, FX, B3, 66, B2 - 2, 9) + chorrosTinta(L, FX, B2, 112, B1 - 2, 14) + chorrosTinta(L, FX, B1, 172, top + 14, 20);
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}

// Cuna de Moisés en maceta de barro
function cunaTinta(L, x, y, esc) {
  let o = "";
  const n = 13, hojas = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / (n - 1) - .5) * 2.6 + L.r(-.12, .12);
    hojas.push({ a, largo: L.r(190, 260) * esc * (1 - Math.abs(a + Math.PI / 2) * .15) });
  }
  hojas.sort((p, q) => Math.abs(q.a + Math.PI / 2) - Math.abs(p.a + Math.PI / 2));
  for (let k = 0; k < 3; k++) {
    const fx = x + L.r(-50, 50) * esc, fy = y - L.r(230, 300) * esc, inc = L.r(-.3, .3);
    o += L.linea([[x + (fx - x) * .3, y], [fx, fy + 110 * esc], [fx, fy + 30 * esc]], 2);
    const e = eje(fx, fy + 30 * esc, -Math.PI / 2 + inc, 80 * esc, .05, 10), d = lanceola(e, 28 * esc, .4);
    o += `<path d="${d}" fill="${PAPEL}"/>` + L.contorno(d, 2) + L.linea([[fx - 3 * esc, fy + 26 * esc], [fx, fy - 6 * esc]], 4, INDIGO, .8);
  }
  hojas.forEach(({ a, largo }) => {
    const pl = largo * .42, px = x + Math.cos(a) * pl, py = y + Math.sin(a) * pl;
    o += L.linea([[x, y], [px, py]], 2);
    const ab = a + (a + Math.PI / 2) * .45;
    const e = eje(px, py, ab, largo * .7, (a + Math.PI / 2) * .12, 12), d = lanceola(e, largo * .16, .45);
    o += `<path d="${d}" fill="${PAPEL}"/>`;
    if (a > -Math.PI / 2) o += L.rayado(d, [px - largo, py - largo, px + largo, py + largo], { ang: -.8, sep: 4, w: .9, op: .5, temblor: .4 });
    o += L.contorno(d, 2) + L.linea(e.slice(0, -1).map((p) => [p[0], p[1]]), 1.1, INDIGO, .7);
  });
  return o;
}
function macetaTinta(L, x, y, esc) {
  const w = 74 * esc, wb = 52 * esc, h = 110 * esc, borde = 22 * esc;
  const cuerpo = `M${f(x - w)} ${f(y - h)}L${f(x + w)} ${f(y - h)}L${f(x + wb)} ${f(y)}L${f(x - wb)} ${f(y)}Z`;
  const ceja = `M${f(x - w - 8 * esc)} ${f(y - h - borde)}h${f(2 * w + 16 * esc)}v${f(borde)}h${f(-2 * w - 16 * esc)}Z`;
  return `<path d="${cuerpo}" fill="${PAPEL}"/>` + L.lavado(cuerpo, .1) +
    L.rayado(`M${f(x + w * .2)} ${f(y - h)}H${f(x + w)}L${f(x + wb)} ${f(y)}H${f(x + w * .2)}Z`, [x - w, y - h, x + w, y], { ang: -1.1, sep: 5, w: 1, op: .6 }) +
    L.contorno(cuerpo, 2.6) + `<path d="${ceja}" fill="${PAPEL}"/>` + L.contorno(ceja, 2.6);
}

export function plantas() {
  const L = new Pluma(2400, 1500, 271);
  let s = "";
  [[1975, 1480, 1.05], [2160, 1496, .85], [430, 1490, 1.1], [690, 1498, .9], [250, 1500, .75]].forEach(([x, y, e]) => {
    s += cunaTinta(L, x, y - 122 * e, e) + macetaTinta(L, x, y, e);
  });
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}
