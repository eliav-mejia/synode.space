/* Escena 1 · Tetelpan: montes con bruma, lago, bosque de pinos, árboles que enmarcan y aves del paraíso.
   Capas (todas se alinean por la base en el sitio):
   t-montes 2400×1500 · t-bosque 2400×1500 · t-marco-izq 900×2000 · t-marco-der 900×2000 · t-paraiso-izq/der 1100×1300 */
import { Lienzo, curva, f } from "./pincel.mjs";

// ---------------- Montes, lago y pueblo ----------------
export function montes() {
  const L = new Lienzo(2400, 1500, 11);
  const W = L.w;

  // Cielo: velo de agua muy pálido detrás de la sierra (arriba queda el papel limpio)
  L.add(`<g filter="url(#lav)" opacity=".55">
    <path d="${L.mancha(1200, 560, 1500, 210, .12, 14)}" fill="${L.degradado([[0, "#DCE4EC", 0], [.45, "#D3DDE7", .8], [1, "#E4E9EE", .2]])}"/>
    <path d="${L.mancha(600, 520, 420, 90, .3, 10)}" fill="#E8DCCF" opacity=".5"/>
  </g>`);

  const cresta = (y0, amp, esc, desf, abajo) => {
    const pts = [];
    for (let x = -60; x <= W + 60; x += 24) pts.push([x, y0 + L.fbm(x / esc + desf, 5) * amp + Math.sin(x / W * Math.PI * 1.3 + desf) * amp * .35]);
    return curva(pts) + `L${W + 60} ${abajo}L-60 ${abajo}Z`;
  };

  // Sierra lejana, luego la cercana: más bruma y más fría cuanto más lejos
  L.add(`<g filter="url(#lejos)">
    <path d="${cresta(470, 110, 260, 3, 1000)}" fill="${L.degradado([[0, "#A3AFC6", .85], [.5, "#B9C3D3", .7], [1, "#CBD3DD", .5]])}"/>
    <path d="${cresta(600, 120, 210, 9, 1050)}" fill="${L.degradado([[0, "#7F92AA", .9], [.55, "#97A8BC", .8], [1, "#AFBCCB", .7]])}"/>
  </g>`);
  // Sombras de cañadas sobre la sierra cercana
  let canadas = "";
  for (let i = 0; i < 14; i++) {
    const x = L.r(100, 2300), y = L.r(660, 820);
    canadas += `<path d="${L.mancha(x, y, L.r(60, 160), L.r(14, 30), .4, 8, L.r(-.5, .5))}" fill="#6D809A" opacity="${L.r(.15, .35).toFixed(2)}"/>`;
  }
  L.add(`<g filter="url(#lav)">${canadas}</g>`);

  // Orilla lejana y lago
  const lago = curva([[700, 905], [980, 884], [1300, 880], [1620, 886], [1900, 905], [1960, 960], [1700, 1030], [1250, 1050], [880, 1030], [690, 960]], true);
  L.add(`<g filter="url(#acu)">
    <path d="${lago}" fill="${L.degradado([[0, "#C3CED8"], [.5, "#DCE3E9"], [1, "#CCD6DE"]])}" opacity=".95"/>
    <path d="M760 896 C1000 872 1500 870 1880 898" fill="none" stroke="#5E7183" stroke-width="9" opacity=".55" stroke-linecap="round"/>
  </g>`);
  // Brillos horizontales en el agua
  let brillos = "";
  for (let i = 0; i < 18; i++) {
    const x = L.r(860, 1800), y = L.r(905, 1010), w = L.r(40, 220);
    brillos += `<path d="M${f(x)} ${f(y)}h${f(w)}" stroke="#F4F6F8" stroke-width="${f(L.r(2, 5))}" opacity="${L.r(.4, .9).toFixed(2)}" stroke-linecap="round"/>`;
  }
  L.add(`<g filter="url(#lejos)">${brillos}</g>`);

  // Laderas cercanas que enmarcan el lago
  L.add(`<g filter="url(#acu)">
    <path d="M-60 760 C200 770 520 820 760 900 C900 950 1000 1040 1120 1160 C1200 1240 1260 1290 1300 1320 L-60 1320Z" fill="${L.degradado([[0, "#6A8288"], [.6, "#5C7672"], [1, "#4E6A60"]])}" opacity=".92"/>
    <path d="M2460 740 C2200 760 1960 820 1820 900 C1730 960 1640 1050 1540 1160 C1460 1240 1400 1290 1360 1320 L2460 1320Z" fill="${L.degradado([[0, "#6F868C"], [.6, "#5E7873"], [1, "#4F6B60"]])}" opacity=".92"/>
  </g>`);

  // Península con el pueblo: masa oscura de árboles y casitas blancas
  const pen = curva([[860, 1000], [960, 960], [1060, 968], [1180, 990], [1300, 1010], [1360, 1040], [1290, 1068], [1120, 1072], [940, 1062], [860, 1040]], true);
  L.add(`<g filter="url(#acu)"><path d="${pen}" fill="#4A5D58" opacity=".9"/></g>`);
  let casas = "";
  for (let i = 0; i < 70; i++) {
    const x = L.r(900, 1300), y = L.r(985, 1050) + (x - 900) * .04;
    casas += `<rect x="${f(x)}" y="${f(y)}" width="${f(L.r(5, 12))}" height="${f(L.r(3, 7))}" fill="${L.e(["#EEEBE4", "#F4F1EA", "#E2DCD0", "#D9CFC0"])}" opacity="${L.r(.6, .95).toFixed(2)}"/>`;
  }
  let copas = "";
  for (let i = 0; i < 60; i++) {
    copas += `<path d="${L.mancha(L.r(880, 1330), L.r(975, 1065), L.r(8, 18), L.r(6, 12))}" fill="${L.e(["#33463F", "#3E5249", "#2B3D37"])}" opacity=".8"/>`;
  }
  L.add(`<g filter="url(#gou)">${casas}${copas}</g>`);

  // Bosque lejano azulado al pie de las laderas
  let lejano = "";
  for (let x = -40; x < W + 40; x += L.r(14, 26)) {
    const dentroLago = x > 820 && x < 1880;
    const base = dentroLago ? 1060 + Math.abs(x - 1350) * .03 : 1000 - Math.min(160, Math.abs(x - 1350) * .12);
    lejano += `<path d="${L.mancha(x, base + L.r(-10, 20), L.r(14, 26), L.r(18, 34), .3, 8)}" fill="${L.e(["#4F6762", "#58706A", "#476058", "#627A70"])}" opacity=".85"/>`;
  }
  L.add(`<g filter="url(#lejos)">${lejano}<path d="${curva(Array.from({ length: 41 }, (_, i) => [i * 62 - 40, 1075 + L.fbm(i * .7, 3) * 30]))}L${W + 40} 1320L-40 1320Z" fill="#4E665E" opacity=".85"/></g>`);

  return L.svg();
}

// ---------------- Bosque de pinos (medio plano) ----------------
function pino(L, x, base, alto, paleta, ancho = 1) {
  let s = "";
  const incl = L.r(-.12, .12), n = Math.round(L.r(6, 10));
  s += `<path d="M${f(x)} ${f(base)}Q${f(x + incl * alto * .3)} ${f(base - alto * .5)} ${f(x + incl * alto * .8)} ${f(base - alto * .8)}" stroke="#3A2E26" stroke-width="${f(alto * .02)}" fill="none" opacity=".8"/>`;
  for (let i = 0; i < n; i++) {
    const t = .25 + i / n * .72, cx = x + incl * alto * t + L.r(-12, 12), cy = base - alto * t;
    const perfil = Math.pow(Math.sin(Math.PI * Math.min(1, .2 + t * .82)), .6) * .85 + .15;
    const rx = alto * .22 * perfil * ancho * L.r(.8, 1.2), ry = rx * L.r(.4, .6);
    // capa oscura, media y luz (la luz viene de la derecha, como en la foto)
    s += `<path d="${L.mancha(cx, cy, rx, ry, .35, 10)}" fill="${paleta[0]}" opacity=".95"/>`;
    for (let k = 0; k < 6; k++) s += `<path d="${L.mancha(cx + L.r(-rx * .6, rx * .5), cy + L.r(-ry * .6, ry * .2), rx * L.r(.18, .35), ry * L.r(.3, .55), .4, 7)}" fill="${paleta[1]}" opacity="${L.r(.6, .95).toFixed(2)}"/>`;
    for (let k = 0; k < 4; k++) s += `<path d="${L.mancha(cx + L.r(0, rx * .7), cy - L.r(0, ry * .6), rx * L.r(.1, .22), ry * L.r(.2, .4), .4, 7)}" fill="${paleta[2]}" opacity="${L.r(.5, .9).toFixed(2)}"/>`;
  }
  return s;
}

function copa(L, cx, cy, r, paleta, dabs = 60) {
  let s = `<path d="${L.mancha(cx, cy, r, r * .8, .3, 12)}" fill="${paleta[0]}"/>`;
  for (let k = 0; k < dabs; k++) {
    const a = L.r(0, Math.PI * 2), d = Math.sqrt(L.R()) * r * .9;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .8;
    const luz = (x - cx) / r * .5 - (y - cy) / r * .5 + L.r(-.4, .4);
    const c = luz > .45 ? paleta[3] : luz > .1 ? paleta[2] : luz > -.3 ? paleta[1] : paleta[0];
    s += `<path d="${L.mancha(x, y, r * L.r(.07, .15), r * L.r(.05, .11), .4, 7, L.r(0, 3))}" fill="${c}" opacity="${L.r(.65, .95).toFixed(2)}"/>`;
  }
  return s;
}

export function bosque() {
  const L = new Lienzo(2400, 1500, 23);
  const W = L.w;
  const fila = (base, altos, paso, paletas, fondo, hueco = 1) => {
    let s = `<path d="M-40 ${base - 40} ${Array.from({ length: 50 }, (_, i) => `L${f(i * 50)} ${f(base - 50 - L.r(0, 50))}`).join("")} L${W + 40} ${base - 40} L${W + 40} 1500 L-40 1500Z" fill="${fondo}"/>`;
    for (let x = -60; x < W + 60; x += L.r(...paso)) s += pino(L, x, base + L.r(-20, 30), L.r(...altos) * (Math.abs(x - 1330) < 560 ? hueco : 1), L.e(paletas));
    return s;
  };
  const centro = (x) => Math.abs(x - 1350);

  // Fila lejana: deja ver el lago en el centro
  let lejana = "";
  for (let x = -60; x < W + 60; x += L.r(40, 70)) {
    const alto = centro(x) < 520 ? L.r(110, 170) : L.r(200, 300);
    lejana += pino(L, x, 1200 + L.r(-10, 20), alto, L.e([["#47604F", "#58725C", "#738C6C"], ["#4C6452", "#5F7860", "#7D9572"]]), .9);
  }
  L.add(`<g filter="url(#gou)" opacity=".93"><rect x="-40" y="1180" width="${W + 80}" height="320" fill="#486050"/>${lejana}</g>`);

  L.add(`<g filter="url(#gou)">${fila(1330, [260, 420], [55, 95], [["#2E4733", "#3F5E3E", "#62804F"], ["#33503A", "#4A6B45", "#7A9459"], ["#2A4230", "#3B5A3B", "#5C7A4A"]], "#30492F", .6)}</g>`);

  // Fresnos amarillo-verdosos (como en la foto, a la derecha del centro)
  let fresnos = "";
  [[1640, 1250, 150], [1800, 1230, 130], [520, 1290, 110]].forEach(([x, y, r]) => {
    fresnos += copa(L, x, y, r, ["#6F7B31", "#99A03C", "#BDB84B", "#DDD472"], 110);
  });
  L.add(`<g filter="url(#gou)">${fresnos}</g>`);

  L.add(`<g filter="url(#gou)">${fila(1490, [300, 520], [70, 120], [["#22392A", "#335238", "#557446"], ["#253D2B", "#3B5C3B", "#6A8A50"]], "#24392A", .62)}</g>`);

  // Orilla inferior: la pintura se acaba de forma irregular sobre el papel
  const borde = L.id("borde");
  L.def(`<linearGradient id="${borde}-g" x1="0" y1="0" x2="0" y2="1"><stop offset=".93" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="${borde}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="1500"><rect width="${W}" height="1500" fill="url(#${borde}-g)"/></mask>`);
  const todo = L.capas.join("");
  L.capas = [`<g mask="url(#${borde})">${todo}</g>`];
  return L.svg();
}

// ---------------- Marcos: ciprés y pino a la izquierda ----------------
export function marcoIzq() {
  const L = new Lienzo(900, 2000, 37);
  // Ciprés: silueta amplia pegada a la orilla izquierda
  const ancho = (y) => 120 + Math.min(1, y / 1300) * 230 + L.fbm(y / 90, 3) * 30;
  const cx = (y) => 210 + Math.sin(y / 700) * 20;
  const izq = [], der = [];
  for (let y = -40; y <= 2040; y += 40) { izq.push([cx(y) - ancho(y), y]); der.push([cx(y) + ancho(y), y]); }
  const silueta = curva([...der, ...izq.reverse()], true);
  let dabs = "";
  for (let i = 0; i < 3200; i++) {
    const y = L.r(-40, 2040), w = ancho(y), x = cx(y) + L.r(-w, w) * .98;
    const lado = (x - cx(y)) / w; // -1 sombra … 1 luz
    const v = lado + L.r(-.45, .45);
    const c = v > .85 ? L.e(["#7FA048", "#93AD55"]) : v > .35 ? L.e(["#4E7A36", "#5C863B"]) : v > -.3 ? L.e(["#2C522C", "#356030"]) : L.e(["#1C3621", "#223F27"]);
    dabs += `<path d="${L.mancha(x, y, L.r(10, 24), L.r(8, 18), .45, 7, L.r(0, 3))}" fill="${c}" opacity="${L.r(.7, .98).toFixed(2)}"/>`;
  }
  L.add(`<g filter="url(#gou)"><path d="${silueta}" fill="#20402A"/>${dabs}</g>`);

  // Pino que se asoma: tronco oscuro y ramas con mechones
  let pinoS = `<path d="M-30 1640 C120 1500 260 1300 380 1080 C440 970 520 860 600 800" stroke="#2F241D" stroke-width="30" fill="none" stroke-linecap="round"/>
    <path d="M-30 1640 C120 1500 260 1300 380 1080" stroke="#5A4434" stroke-width="8" fill="none" opacity=".6" transform="translate(6 -4)"/>
    <path d="M380 1080 C470 1060 560 1080 680 1040 M300 1220 C380 1240 470 1230 560 1260 M520 860 C600 880 690 860 780 880" stroke="#2F241D" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  [[620, 790, 120], [730, 870, 90], [690, 1030, 110], [560, 1250, 100], [440, 1060, 80], [800, 980, 70]].forEach(([x, y, r]) => {
    for (let k = 0; k < 3; k++) {
      const cy = y + L.r(-20, 20), cx2 = x + L.r(-30, 30);
      pinoS += `<path d="${L.mancha(cx2, cy, r, r * .45, .35, 10)}" fill="#26402D"/>`;
      for (let j = 0; j < 22; j++) pinoS += `<path d="${L.mancha(cx2 + L.r(-r * .8, r * .8), cy + L.r(-r * .35, r * .2), L.r(10, 22), L.r(6, 12), .4, 7, L.r(-.3, .3))}" fill="${L.e(["#33553A", "#466B45", "#638A50", "#7FA05A"])}" opacity=".9"/>`;
    }
  });
  L.add(`<g filter="url(#gou)">${pinoS}</g>`);
  return L.svg();
}

// ---------------- Marcos: árbol oscuro, fresno y colorín a la derecha ----------------
export function marcoDer() {
  const L = new Lienzo(900, 2000, 41);
  let s = "";
  // Ramas
  s += `<path d="M930 1900 C800 1600 760 1300 700 1000 C660 800 600 600 560 300 M720 1100 C620 1060 520 1080 420 1020 M680 760 C600 700 520 690 460 640" stroke="#33281F" stroke-width="22" fill="none" stroke-linecap="round"/>`;
  // Árbol oscuro arriba (hojita menuda, verde azulado)
  [[760, 120, 260], [560, 260, 200], [800, 480, 240], [620, 620, 170], [460, 420, 150]].forEach(([x, y, r]) => { s += copa(L, x, y, r, ["#22392F", "#2F4C40", "#4C7262", "#7FA08C"], 160); });
  L.add(`<g filter="url(#gou)">${s}</g>`);

  // Fresno amarillo-verdoso abajo
  let fr = "";
  [[720, 980, 230], [500, 1120, 190], [790, 1300, 260], [580, 1480, 220], [820, 1680, 240], [380, 1340, 130]].forEach(([x, y, r]) => { fr += copa(L, x, y, r, ["#6A7A30", "#98A03C", "#BDB84B", "#E0D772"], 170); });
  L.add(`<g filter="url(#gou)">${fr}</g>`);

  // Colorín: espigas rojo-naranja en la orilla
  let col = "";
  for (let i = 0; i < 46; i++) {
    const x = L.r(600, 900), y = L.r(150, 1250), a = L.r(-2.4, -.7), l = L.r(18, 34);
    for (let k = 0; k < 4; k++) {
      col += `<path d="${L.mancha(x + Math.cos(a) * k * l * .35, y + Math.sin(a) * k * l * .35, l * .38, l * .14, .3, 7, a)}" fill="${L.e(["#C9431F", "#DD5A2A", "#E9763A", "#B33A1E"])}" opacity=".92"/>`;
    }
  }
  L.add(`<g filter="url(#acu)">${col}</g>`);
  return L.svg();
}

// ---------------- Ave del paraíso (planta completa) ----------------
function defsFlor(L) {
  if (L._flor) return L._flor;
  const k = L.id("fl");
  L.def(`
    <linearGradient id="${k}-nar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E0612A"/><stop offset=".5" stop-color="#F29A44"/><stop offset="1" stop-color="#FFD089"/></linearGradient>
    <linearGradient id="${k}-nara" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#C9521F"/><stop offset="1" stop-color="#F0A055"/></linearGradient>
    <linearGradient id="${k}-azul" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#1F2F78"/><stop offset=".55" stop-color="#3E5CBC"/><stop offset="1" stop-color="#A6B6EE"/></linearGradient>
    <linearGradient id="${k}-bra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DA585"/><stop offset=".5" stop-color="#4E7C64"/><stop offset="1" stop-color="#2C5444"/></linearGradient>
    <path id="${k}-sep" d="M0 0 C-22 -55 -28 -150 -9 -228 C-4 -238 6 -238 10 -228 C22 -150 20 -55 0 0Z"/>
    <path id="${k}-sepsom" d="M2 -6 C8 -60 10 -150 6 -222 C14 -150 16 -60 2 -6Z"/>
    <path id="${k}-len" d="M0 0 C-8 -50 -10 -120 -3 -172 L6 -190 L14 -170 C16 -120 10 -50 0 0Z"/>`);
  return (L._flor = k);
}

// Flor en coordenadas del dibujo original (cabeza en 300,262; el tallo llega a 388,312)
function flor(L, x, y, esc, giro, espejo) {
  const k = defsFlor(L);
  const sx = espejo ? -esc : esc;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(giro)}) scale(${sx} ${esc}) translate(-388 -312)">
    <g filter="url(#acu)" transform="translate(300 262)">
      <use href="#${k}-sep" fill="url(#${k}-nara)" opacity=".85" transform="rotate(-12) scale(.92)"/>
      <use href="#${k}-sep" fill="url(#${k}-nar)" opacity=".9" transform="rotate(-31)"/>
      <use href="#${k}-sepsom" fill="#C9481A" opacity=".42" transform="rotate(-31)"/>
      <use href="#${k}-len" fill="url(#${k}-azul)" opacity=".9" transform="rotate(-22)"/>
      <use href="#${k}-sep" fill="url(#${k}-nar)" opacity=".92" transform="rotate(-53) scale(1.03)"/>
      <use href="#${k}-sepsom" fill="#C9481A" opacity=".4" transform="rotate(-53) scale(1.03)"/>
      <path d="M-2 -10 C-6 -70 -8 -150 -4 -214" fill="none" stroke="#FFE3B4" stroke-width="3" opacity=".75" transform="rotate(-53)"/>
      <use href="#${k}-len" fill="url(#${k}-azul)" opacity=".85" transform="rotate(-42) scale(.8)"/>
    </g>
    <g filter="url(#acu)">
      <path d="M70 302 C150 268 290 250 392 268 C420 274 426 306 398 322 C300 342 160 330 70 302Z" fill="url(#${k}-bra)" opacity=".92"/>
      <path d="M96 304 C180 318 300 326 396 314 C300 336 170 330 96 304Z" fill="#23463A" opacity=".45"/>
      <path d="M110 292 C190 276 300 268 380 280" fill="none" stroke="#B9D6B2" stroke-width="5" stroke-linecap="round" opacity=".55"/>
      <path d="M70 302 C150 268 290 250 392 268 C410 271 420 284 418 298" fill="none" stroke="#B0474F" stroke-width="7" stroke-linecap="round" opacity=".6"/>
    </g>
  </g>`;
}

function hojaParaiso(L, bx, by, ang, peciolo, largo, ancho) {
  // ang: radianes desde la vertical (negativo = izquierda)
  const dx = Math.sin(ang), dy = -Math.cos(ang);
  const curv = L.r(-.25, .25) + ang * .25;
  const px = bx + dx * peciolo, py = by + dy * peciolo;
  let s = `<path d="M${f(bx)} ${f(by)}Q${f(bx + dx * peciolo * .5 + curv * 40)} ${f(by + dy * peciolo * .5)} ${f(px)} ${f(py)}" stroke="#4E7A5C" stroke-width="${f(L.r(10, 15))}" fill="none" stroke-linecap="round"/>`;
  // Nervio central curvo
  const nervio = [], izq = [], der = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = ang + curv * t * 1.6;
    const x = px + Math.sin(a) * largo * t, y = py - Math.cos(a) * largo * t + (t * t) * largo * .12 * Math.sign(Math.abs(ang) - .3);
    nervio.push([x, y]);
    const w = ancho * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), .75) * (t < .08 ? t / .08 : 1);
    const nx = Math.cos(a), ny = Math.sin(a);
    izq.push([x - nx * w * L.r(.92, 1.05), y - ny * w * L.r(.92, 1.05)]);
    der.push([x + nx * w * L.r(.92, 1.05), y + ny * w * L.r(.92, 1.05)]);
  }
  const mitadA = curva([...izq, ...nervio.slice().reverse()], true);
  const mitadB = curva([...der, ...nervio.slice().reverse()], true);
  const caja = [px - largo - ancho, py - largo - ancho, px + largo + ancho, py + largo + ancho];
  const luzIzq = ang > 0;
  s += `<path d="${mitadA}" fill="${luzIzq ? "#6F9B7A" : "#3F6E56"}"/><path d="${mitadB}" fill="${luzIzq ? "#3F6E56" : "#6F9B7A"}"/>`;
  // Nervaduras laterales paralelas (pinceladas)
  const a0 = Math.atan2(nervio[N][1] - nervio[0][1], nervio[N][0] - nervio[0][0]);
  s += L.pinceladas(mitadA, { n: 46, colores: ["#9CC2A0", "#86B08E", "#557F63", "#B5D3AE"], ancho: [3, 9], largo: [ancho * .6, ancho * 1.4], angulo: a0 - 1.1, dispersion: .12, opacidad: [.4, .8], caja });
  s += L.pinceladas(mitadB, { n: 46, colores: ["#9CC2A0", "#2F5A48", "#557F63", "#264C3D"], ancho: [3, 9], largo: [ancho * .6, ancho * 1.4], angulo: a0 + 1.1, dispersion: .12, opacidad: [.4, .8], caja });
  s += `<path d="${curva(nervio)}" stroke="#D5E6CC" stroke-width="4" fill="none" opacity=".75"/>`;
  // Rasgaduras típicas de la hoja
  for (let i = 0; i < Math.round(L.r(0, 3)); i++) {
    const j = Math.round(L.r(4, N - 3)), p = nervio[j], q = (L.R() > .5 ? izq : der)[j];
    s += `<path d="M${f(p[0] + (q[0] - p[0]) * .3)} ${f(p[1] + (q[1] - p[1]) * .3)}L${f(q[0] * 1.01 - p[0] * .01)} ${f(q[1] * 1.01 - p[1] * .01)}" stroke="#FBF8F1" stroke-width="3" opacity=".95"/>`;
  }
  return s;
}

export function paraiso(semilla, espejo = false) {
  const L = new Lienzo(1100, 1300, semilla);
  const bx = 560, by = 1320;
  let hojas = "";
  const angs = [-1.05, -.75, -.45, -.18, .1, .4, .72, 1];
  angs.forEach((a) => {
    hojas += hojaParaiso(L, bx + L.r(-40, 40), by, a * .85 + L.r(-.06, .06), L.r(240, 460) * (1 - Math.abs(a) * .3), L.r(330, 430), L.r(62, 84));
  });
  // Tallos y flores (los tallos van detrás de las hojas)
  const flores = [[-.3, 800, -6, .95, true], [.2, 930, 6, 1.05, false], [-.02, 620, 10, .8, false]];
  let tallos = "", fl = "";
  flores.forEach(([a, l, giro, esc, esp], i) => {
    const x = bx + Math.sin(a) * l, y = by - Math.cos(a) * l;
    tallos += `<path d="M${bx + i * 10} ${by}Q${f(bx + Math.sin(a) * l * .4)} ${f(by - l * .5)} ${f(x)} ${f(y)}" stroke="#5B8A66" stroke-width="${f(16 * esc)}" fill="none" stroke-linecap="round"/>`;
    fl += flor(L, x, y, esc, giro, esp);
  });
  L.add(`<g filter="url(#acu)">${tallos}</g>`);
  L.add(`<g filter="url(#gou)">${hojas}</g>`);
  L.add(fl);
  // Hojas de la base, al frente
  let base = "";
  for (let i = 0; i < 10; i++) base += `<path d="${L.mancha(bx + L.r(-160, 160), by - L.r(0, 70), L.r(30, 70), L.r(14, 30), .35, 9, L.r(-.6, .6))}" fill="${L.e(["#3F6E56", "#4E7C64", "#2C5444"])}" opacity=".9"/>`;
  L.add(`<g filter="url(#gou)">${base}</g>`);
  if (espejo) L.capas = [`<g transform="translate(${L.w} 0) scale(-1 1)">${L.capas.join("")}</g>`];
  return L.svg();
}
