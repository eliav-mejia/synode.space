/* Variante tinta: las mismas escenas dibujadas a pluma con tinta índigo, solo contorno y achurado
   (como un grabado o una toile azul), con alguna aguada muy ligera. Mismos tamaños que las capas de acuarela
   para que el CSS de las escenas sirva sin cambios. */
import { Lienzo, curva, f } from "./pincel.mjs";

const INDIGO = "#26357A";
const INDIGO_OSC = "#1A2558";
const AGUADA = "#3552C4";
const PAPEL = "#F3ECDE";

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

// ================= Escena 3 · El arco =================
const SUELO = 1310, CX = 1200, ARRANQUE = 1010, RADIO = 232;

export function muro() {
  const L = new Pluma(2400, 1500, 251);
  const muroD = `M240 1010 C420 990 640 900 830 830 L830 700 C1000 694 1400 694 1570 700 L1570 772 L2220 780 L2220 ${SUELO} L240 ${SUELO}Z`;
  const clip = L.id("muro");
  L.def(`<clipPath id="${clip}"><path d="${muroD}"/></clipPath>`);
  let s = L.contorno(muroD, 3.4);
  // Piedra braza: cantos de contorno, con sombra achurada en la mitad de abajo
  let piedras = "";
  for (let y = 700; y < SUELO + 20; y += L.r(44, 58)) {
    for (let x = 230 + L.r(-40, 0); x < 2240; x += L.r(70, 130)) {
      if (Math.abs(x + 30 - CX) < RADIO + 40 && y > ARRANQUE - RADIO - 30) continue;
      const w = L.r(26, 56), h = L.r(16, 26), cx = x + w, cy = y + L.r(-6, 6);
      const d = L.mancha(cx, cy, w, h, .22, 7, L.r(-.15, .15));
      piedras += L.contorno(d, 2);
      if (L.R() < .7) piedras += L.rayado(d, [cx - w, cy, cx + w, cy + h], { ang: -.8, sep: 5, w: 1, op: .6 });
    }
  }
  s += `<g clip-path="url(#${clip})">${piedras}</g>`;
  // Arco de ladrillo: dovelas entre dos arcos
  const r2 = RADIO + 62;
  let dovelas = `M${CX - r2} ${ARRANQUE}A${r2} ${r2} 0 0 1 ${CX + r2} ${ARRANQUE}M${CX - RADIO} ${ARRANQUE}A${RADIO} ${RADIO} 0 0 1 ${CX + RADIO} ${ARRANQUE}`;
  for (let i = 0; i <= 17; i++) {
    const a = Math.PI + i / 17 * Math.PI;
    dovelas += `M${f(CX + Math.cos(a) * RADIO)} ${f(ARRANQUE + Math.sin(a) * RADIO)}L${f(CX + Math.cos(a) * r2)} ${f(ARRANQUE + Math.sin(a) * r2)}`;
  }
  s += `<path d="M${CX - r2} ${ARRANQUE}A${r2} ${r2} 0 0 1 ${CX + r2} ${ARRANQUE}L${CX + RADIO} ${ARRANQUE}A${RADIO} ${RADIO} 0 0 0 ${CX - RADIO} ${ARRANQUE}Z" fill="${PAPEL}"/>`;
  s += `<path d="${dovelas}" stroke="${INDIGO}" stroke-width="2.6" fill="none"/>`;
  // Jambas de ladrillo
  [CX - RADIO - 62, CX + RADIO].forEach((x) => {
    let j = `M${x} ${ARRANQUE}V${SUELO}M${x + 62} ${ARRANQUE}V${SUELO}`;
    for (let y = ARRANQUE + 34; y < SUELO; y += 34) j += `M${x} ${y}h62`;
    s += `<rect x="${x}" y="${ARRANQUE}" width="62" height="${SUELO - ARRANQUE}" fill="${PAPEL}"/><path d="${j}" stroke="${INDIGO}" stroke-width="2.2" fill="none"/>`;
  });
  // Portón de tablones a pluma, apenas sombreado: el texto de la escena se imprime encima
  const vano = `M${CX - RADIO} ${SUELO}L${CX - RADIO} ${ARRANQUE}A${RADIO} ${RADIO} 0 0 1 ${CX + RADIO} ${ARRANQUE}L${CX + RADIO} ${SUELO}Z`;
  let tablas = "";
  for (let x = CX - RADIO + 38; x < CX + RADIO; x += 38) tablas += `M${x} ${ARRANQUE - RADIO + 10}V${SUELO}`;
  s += `<path d="${vano}" fill="${PAPEL}"/>` + L.lavado(vano, .08);
  s += L.rayado(vano, [CX - RADIO, ARRANQUE - RADIO, CX + RADIO, SUELO], { ang: -1.52, sep: 9, w: 1, op: .3 });
  s += `<path d="${tablas}" stroke="${INDIGO}" stroke-width="2" fill="none" opacity=".75"/>`;
  s += `<path d="M${CX - RADIO} 1110H${CX + RADIO}M${CX - RADIO} 1240H${CX + RADIO}" stroke="${INDIGO}" stroke-width="7" fill="none"/>`;
  let clavos = "";
  for (let x = CX - RADIO + 20; x < CX + RADIO; x += 38) clavos += `<circle cx="${x}" cy="1110" r="3.2"/><circle cx="${x}" cy="1240" r="3.2"/>`;
  s += `<g fill="${PAPEL}">${clavos}</g>`;
  s += `<path d="M${CX} ${ARRANQUE - RADIO}V${SUELO}" stroke="${INDIGO_OSC}" stroke-width="4"/>`;
  s += `<circle cx="${CX - 22}" cy="1170" r="9" fill="none" stroke="${INDIGO}" stroke-width="2.4"/><circle cx="${CX + 22}" cy="1170" r="9" fill="none" stroke="${INDIGO}" stroke-width="2.4"/>`;
  s += L.contorno(vano, 3.4);
  // Remate del muro
  s += L.linea([[240, 1004], [420, 984], [640, 894], [830, 824]], 9, INDIGO, .9);
  s += L.linea([[830, 694], [1200, 688], [1570, 694]], 9, INDIGO, .9);
  s += L.linea([[1570, 766], [2220, 774]], 9, INDIGO, .9);
  // Empedrado del suelo en perspectiva
  let suelo = `M120 ${SUELO}H2300`;
  for (let k = 0; k < 6; k++) {
    const y = SUELO + 18 + k * k * 6 + k * 18, h = 7 + k * 3;
    for (let x = 160 + L.r(0, 40); x < 2260; x += L.r(50, 80) + k * 10) {
      suelo += `M${f(x)} ${f(y)}a${f(20 + k * 5)} ${f(h)} 0 1 0 1 0`;
    }
  }
  s += `<path d="${suelo}" stroke="${INDIGO}" stroke-width="1.8" fill="none" opacity=".65"/>`;
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}

// Hojita de enredadera y bugambilia (tres brácteas con aguada)
function hojita(L, x, y, r, a) {
  const e = eje(x, y, a, r * 2, L.r(-.15, .15), 8), d = lanceola(e, r * .75, .4);
  // Las hojas de abajo quedan en sombra: medio achurado
  const sombra = L.R() < .45 ? L.rayado(d, [x - r * 2, y - r * 2, x + r * 2, y + r * 2], { ang: -.8, sep: 3.6, w: .9, op: .6, temblor: .4 }) : "";
  return `<path d="${d}" fill="${PAPEL}"/>` + sombra + L.contorno(d, 1.9) + L.linea([[x, y], [e[5][0], e[5][1]]], 1.1, INDIGO, .7);
}
function bugambilia(L, x, y, r) {
  let s = "";
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 + L.r(0, 1);
    const e = eje(x, y, a, r, 0, 8);
    const d = lanceola(e, r * .55, .55);
    s += `<path d="${d}" fill="${PAPEL}"/><path d="${d}" fill="${AGUADA}" opacity=".32"/>` + L.contorno(d, 1.7);
  }
  return s;
}

export function enredadera() {
  const L = new Pluma(2400, 1500, 263);
  let s = "";
  // Guías que recorren el remate y cuelgan
  const guias = [];
  for (let i = 0; i < 16; i++) {
    const x0 = L.r(620, 2380), y0 = x0 < 830 ? 900 - (x0 - 620) * .3 : x0 < 1570 ? L.r(640, 700) : L.r(500, 760);
    const pts = [[x0, y0]];
    let x = x0, y = y0;
    const cae = x0 > 1700 ? L.r(250, 650) : L.r(60, 220);
    for (let k = 0; k < 8; k++) { x += L.r(-60, 60); y += cae / 8; pts.push([x, y]); }
    guias.push(pts);
    s += L.linea(pts, 2.6, INDIGO, .9);
  }
  // Masa de follaje a lo largo de la cima
  for (let i = 0; i < 1100; i++) {
    const x = L.r(600, 2400);
    const tope = x < 830 ? 860 - (x - 600) * .5 : x < 1700 ? 640 : 520 - (x - 1700) * .25;
    const y = L.r(tope, tope + (x > 1700 ? 320 : 150));
    if (x > CX - RADIO - 70 && x < CX + RADIO + 70 && y > ARRANQUE - RADIO - 20) continue;
    s += hojita(L, x, y, L.r(12, 20), L.r(0, Math.PI * 2));
  }
  // Hojas sobre las guías que cuelgan
  guias.forEach((pts) => pts.forEach((p, k) => { if (k) s += hojita(L, p[0] + L.r(-10, 10), p[1], L.r(8, 13), L.r(0, 6.3)); }));
  // Bugambilia, sobre todo a la derecha
  for (let i = 0; i < 110; i++) {
    const x = L.r(1400, 2400), y = L.r(470 - (x - 1400) * .1, 840);
    s += bugambilia(L, x, y, L.r(16, 24));
  }
  for (let i = 0; i < 18; i++) s += bugambilia(L, L.r(700, 1250), L.r(640, 720), L.r(13, 18));
  // Mata a la izquierda, sobre el muro bajo
  for (let i = 0; i < 160; i++) s += hojita(L, L.r(250, 620), L.r(870, 1010), L.r(11, 17), L.r(0, 6.3));
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}

// Maguey de contorno: pencas largas con dientes y espina
function maguey(L, x, y, s, inc = 0) {
  let o = "";
  const n = 13;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + inc + (i / (n - 1) - .5) * 2.7 + L.r(-.08, .08);
    const largo = s * L.r(380, 560) * (1 - Math.abs(i / (n - 1) - .5) * .7);
    const e = eje(x, y, a, largo, L.r(-.05, .05) + (a + Math.PI / 2) * .05);
    const d = lanceola(e, s * 34, .25);
    o += `<path d="${d}" fill="${PAPEL}"/>` + L.contorno(d, 2.6);
    o += L.linea(e.slice(2, -2).map((p) => [p[0], p[1]]), 1.2, INDIGO, .6);
    o += L.rayado(lanceola(e.map((p) => [p[0] + Math.cos(a + 1.57) * 14 * s, p[1] + Math.sin(a + 1.57) * 14 * s, p[2]]), s * 22, .25), [x - 700 * s, y - 700 * s, x + 700 * s, y], { ang: a + .3, sep: 8, w: 1, op: .5 });
    const tip = e[e.length - 1];
    o += L.linea([[tip[0], tip[1]], [tip[0] + Math.cos(a) * 26 * s, tip[1] + Math.sin(a) * 26 * s]], 2.6, INDIGO_OSC);
  }
  return o;
}
// Órgano: columnas con costillas y areolas
function organo(L, x, y) {
  let o = "";
  [[-120, 560, 46], [-40, 820, 52], [50, 700, 50], [140, 480, 44]].forEach(([dx, h, w]) => {
    const x0 = x + dx, d = `M${x0 - w / 2} ${y}V${y - h + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x0 + w / 2} ${y - h + w / 2}V${y}Z`;
    o += `<path d="${d}" fill="${PAPEL}"/>` + L.contorno(d, 2.8);
    let c = "";
    [-.22, 0, .22].forEach((k) => { c += `M${f(x0 + k * w)} ${y}V${f(y - h + w * .3)}`; });
    o += `<path d="${c}" stroke="${INDIGO}" stroke-width="1.5" opacity=".75" fill="none"/>`;
    o += L.rayado(`M${x0 + w * .1} ${y}V${y - h}H${x0 + w}V${y}Z`, [x0, y - h, x0 + w, y], { ang: -1.4, sep: 6, w: 1, op: .5 });
    let ar = "";
    for (let yy = y - h + 30; yy < y; yy += 22) [-.22, 0, .22].forEach((k) => { ar += `M${f(x0 + k * w - 2)} ${f(yy + L.r(-4, 4))}h4`; });
    o += `<path d="${ar}" stroke="${INDIGO_OSC}" stroke-width="2.4" stroke-linecap="round"/>`;
  });
  return o;
}
function echeveria(L, x, y, r) {
  let o = "";
  for (let k = 2; k >= 0; k--) {
    const rr = r * (1 - k * .28);
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2 + k * .4;
      const e = eje(x, y, a, rr, 0, 6);
      const d = lanceola(e, rr * .32, .55);
      o += `<path d="${d}" fill="${PAPEL}"/>` + L.contorno(d, 1.6);
    }
  }
  return o;
}

export function plantas() {
  const L = new Pluma(2400, 1500, 271);
  let s = "";
  // Arriates: línea de tierra y matitas
  s += L.linea([[1470, 1500], [1500, 1380], [1620, 1330], [1800, 1310], [2000, 1294], [2400, 1290]], 2.6);
  s += L.linea([[0, 1350], [200, 1330], [520, 1350], [760, 1420], [830, 1500]], 2.6);
  let pasto = "";
  for (let i = 0; i < 260; i++) {
    const der = L.R() < .65;
    const x = der ? L.r(1500, 2400) : L.r(0, 800), y = der ? L.r(1340, 1500) : L.r(1380 + x * .06, 1500);
    const h = L.r(10, 24), a = L.r(-.4, .4);
    pasto += `M${f(x)} ${f(y)}q${f(a * h)} ${f(-h * .5)} ${f(a * h * 2)} ${f(-h)}`;
  }
  s += `<path d="${pasto}" stroke="${INDIGO}" stroke-width="1.4" fill="none" opacity=".7" stroke-linecap="round"/>`;
  s += organo(L, 1720, 1400);
  s += maguey(L, 2050, 1450, .8, .1);
  s += maguey(L, 2330, 1480, .55, -.1);
  s += maguey(L, 380, 1500, 1.05);
  [[1560, 1440, 40], [1660, 1470, 46], [1800, 1455, 38], [1920, 1490, 44], [1500, 1490, 34], [640, 1470, 36], [740, 1495, 30]].forEach(([x, y, r]) => { s += echeveria(L, x, y, r); });
  L.add(`<g filter="url(#pluma)">${s}</g>`);
  return L.svg();
}
