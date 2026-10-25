/* Escena 3 · El arco: muro de piedra braza con arco de ladrillo y portón de madera, enredadera con bugambilia,
   y al frente maguey, cactus órgano y echeverias. Tres capas 2400×1500 que se alinean por la base. */
import { Lienzo, curva, f } from "./pincel.mjs";

const SUELO = 1310, CX = 1200, ARRANQUE = 1010, RADIO = 232;

function mascaraOrillas(L, x0, x1, x2, x3, yFin) {
  const id = L.id("orillas");
  L.def(`<linearGradient id="${id}-h" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${L.w}" y2="0">
      <stop offset="${x0 / L.w}" stop-color="#000"/><stop offset="${x1 / L.w}" stop-color="#fff"/><stop offset="${x2 / L.w}" stop-color="#fff"/><stop offset="${x3 / L.w}" stop-color="#000"/></linearGradient>
    <linearGradient id="${id}-v" gradientUnits="userSpaceOnUse" x1="0" y1="${yFin - 120}" x2="0" y2="${yFin}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="${id}-m2" maskUnits="userSpaceOnUse" x="0" y="0" width="${L.w}" height="${L.h}"><rect width="${L.w}" height="${L.h}" fill="url(#${id}-v)"/></mask>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${L.w}" height="${L.h}"><rect width="${L.w}" height="${L.h}" fill="url(#${id}-h)" mask="url(#${id}-m2)"/></mask>`);
  return `url(#${id})`;
}

// ---------------- Muro, arco y portón ----------------
export function muro() {
  const L = new Lienzo(2400, 1500, 71);
  const muroD = `M240 1010 C420 990 640 900 830 830 L830 700 C1000 694 1400 694 1570 700 L1570 772 L2220 780 L2220 ${SUELO} L240 ${SUELO}Z`;
  const vano = `M${CX - RADIO} ${SUELO}L${CX - RADIO} ${ARRANQUE}A${RADIO} ${RADIO} 0 0 1 ${CX + RADIO} ${ARRANQUE}L${CX + RADIO} ${SUELO}Z`;
  const clip = L.id("muro");
  L.def(`<clipPath id="${clip}"><path d="${muroD}"/></clipPath>`);

  // Piedra braza: cantos irregulares sobre mortero
  let piedras = "";
  for (let y = 690; y < SUELO + 30; y += L.r(42, 56)) {
    for (let x = 230 + L.r(-40, 0); x < 2240; x += L.r(60, 120)) {
      const w = L.r(28, 62), h = L.r(17, 28);
      const c = L.R() < .08 ? L.e(["#8A5A44", "#9A6550"]) : L.e(["#5E5C5A", "#6F6C68", "#4E4C4B", "#7E7A74", "#8C877F", "#5B5550", "#666A6C"]);
      piedras += `<path d="${L.mancha(x + w, y + L.r(-6, 6), w, h, .26, 6, L.r(-.15, .15))}" fill="${c}"/>`;
      piedras += `<path d="${L.mancha(x + w + w * .2, y - h * .3, w * .55, h * .35, .3, 7)}" fill="#A9A49B" opacity=".28"/>`;
    }
  }
  L.add(`<g clip-path="url(#${clip})"><g filter="url(#gou)"><path d="${muroD}" fill="#ABA498"/>${piedras}</g>
    <rect x="200" y="660" width="2050" height="700" fill="${L.degradado([[0, "#3A3430", 0], [.6, "#3A3430", .08], [1, "#2E2A26", .35]])}"/></g>`);
  // Sombra de la enredadera sobre el muro (más oscura a la derecha, donde cuelga más)
  L.add(`<g filter="url(#lav)" opacity=".45"><path d="${L.mancha(1900, 860, 420, 120, .3, 12)}" fill="#2E3A2A"/><path d="${L.mancha(1200, 760, 420, 50, .3, 12)}" fill="#2E3A2A"/></g>`);

  // Remate de ladrillo sobre el muro bajo (curvo), el bloque central y el ala derecha
  const remate = (pts, grosor) => {
    let s = `<path d="${curva(pts)}" stroke="#97502F" stroke-width="${grosor}" fill="none" stroke-linecap="round"/>`;
    s += `<path d="${curva(pts.map(([x, y]) => [x, y - grosor * .3]))}" stroke="#C07A52" stroke-width="${grosor * .25}" fill="none" opacity=".6"/>`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      for (let t = 0; t < 1; t += .18) {
        const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        s += `<path d="M${f(x)} ${f(y - grosor / 2)}l0 ${grosor}" stroke="#D2B49C" stroke-width="2.5" opacity=".7"/>`;
      }
    }
    return s;
  };
  L.add(`<g filter="url(#gou)">
    ${remate([[230, 1012], [420, 992], [640, 905], [835, 832]], 40)}
    ${remate([[820, 700], [1200, 694], [1580, 700]], 34)}
    ${remate([[1560, 772], [1900, 776], [2230, 780]], 30)}
  </g>`);

  // Vano: penumbra, jamba con profundidad y portón de madera
  const fondo = L.degradado([[0, "#231B16"], [.5, "#33271F"], [1, "#4A3A2F"]]);
  const R2 = RADIO - 34;
  const porton = `M${CX - R2} ${SUELO}L${CX - R2} ${ARRANQUE + 20}A${R2} ${R2} 0 0 1 ${CX + R2} ${ARRANQUE + 20}L${CX + R2} ${SUELO}Z`;
  const clipP = L.id("porton");
  L.def(`<clipPath id="${clipP}"><path d="${porton}"/></clipPath>`);
  let tablas = "";
  for (let x = CX - R2; x < CX + R2; x += 27) {
    tablas += `<rect x="${x}" y="${ARRANQUE - R2}" width="25" height="${SUELO - ARRANQUE + R2 + 20}" fill="${L.e(["#7A4A2A", "#8B5733", "#6B3F24", "#94603A", "#83512F"])}"/>`;
    tablas += `<path d="M${x + L.r(6, 18)} ${ARRANQUE - R2}V${SUELO}" stroke="#5A3520" stroke-width="2" opacity=".35"/>`;
  }
  tablas += `<path d="M${CX} ${ARRANQUE - R2}V${SUELO}" stroke="#20140D" stroke-width="7"/>`;
  tablas += `<path d="M${CX - R2} ${SUELO - 150}H${CX + R2}M${CX - R2} ${ARRANQUE + 40}H${CX + R2}" stroke="#4A2C1A" stroke-width="10" opacity=".6"/>`;
  L.add(`<g filter="url(#gou)">
    <path d="${vano}" fill="${fondo}"/>
    <path d="M${CX + RADIO} ${SUELO}L${CX + RADIO} ${ARRANQUE}L${CX + R2} ${ARRANQUE + 20}L${CX + R2} ${SUELO}Z" fill="#6E6862"/>
    <g clip-path="url(#${clipP})">${tablas}<rect x="${CX - R2}" y="${ARRANQUE - R2}" width="${R2 * 2}" height="${SUELO - ARRANQUE + R2}" fill="${L.degradado([[0, "#1A120D", .85], [.45, "#1A120D", .25], [1, "#1A120D", .1]])}"/></g>
  </g>`);

  // Dovelas de ladrillo
  let dovelas = "";
  const n = 27, r0 = RADIO, r1 = RADIO + 66;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + i / n * Math.PI + .012, a1 = Math.PI + (i + 1) / n * Math.PI - .012;
    const p = (r, a) => `${f(CX + Math.cos(a) * r)} ${f(ARRANQUE + Math.sin(a) * r)}`;
    dovelas += `<path d="M${p(r0, a0)}L${p(r1 + L.r(-4, 4), a0)}A${r1} ${r1} 0 0 1 ${p(r1, a1)}L${p(r0, a1)}A${r0} ${r0} 0 0 0 ${p(r0, a0)}Z" fill="${L.e(["#A0522D", "#B5643A", "#8E4426", "#C07048", "#9B4B2B"])}"/>`;
  }
  dovelas += `<path d="M${CX - r1 - 8} ${ARRANQUE}A${r1 + 8} ${r1 + 8} 0 0 1 ${CX + r1 + 8} ${ARRANQUE}" stroke="#5B4A40" stroke-width="10" fill="none" opacity=".5"/>`;
  L.add(`<g filter="url(#gou)"><path d="M${CX - r1} ${ARRANQUE}A${r1} ${r1} 0 0 1 ${CX + r1} ${ARRANQUE}L${CX + r0} ${ARRANQUE}A${r0} ${r0} 0 0 0 ${CX - r0} ${ARRANQUE}Z" fill="#D9C4AE"/>${dovelas}</g>`);

  // Piso de laja
  let lajas = "";
  for (let y = SUELO + 6; y < 1480; y += L.r(30, 46)) {
    for (let x = 180 + L.r(-60, 0); x < 2260; x += L.r(70, 150)) {
      lajas += `<path d="${L.mancha(x, y, L.r(30, 70), L.r(10, 18), .3, 7, L.r(-.2, .2))}" fill="${L.e(["#8F9497", "#7E8487", "#A3A7A8", "#6F7579", "#959089"])}" opacity=".9"/>`;
    }
  }
  L.add(`<g filter="url(#gou)"><rect x="180" y="${SUELO}" width="2080" height="170" fill="#BAB6AE"/>${lajas}</g>
    <g filter="url(#lav)" opacity=".5"><path d="${L.mancha(CX, SUELO + 30, 700, 34, .2, 12)}" fill="#3B3530"/></g>`);

  L.capas = [`<g mask="${mascaraOrillas(L, 140, 420, 2020, 2290, 1480)}">${L.capas.join("")}</g>`];
  return L.svg();
}

// ---------------- Enredadera y bugambilia ----------------
const HOJA_YEDRA = "M0 0C-6-3-11-9-8-15C-5-14-3-17 0-21C3-17 5-14 8-15C11-9 6-3 0 0Z";

export function enredadera() {
  const L = new Lienzo(2400, 1500, 83);
  L.def(`<path id="yedra" d="${HOJA_YEDRA}"/>`);
  // Zonas: [cx, cy, rx, ry, densidad]
  const zonas = [
    [1960, 820, 340, 260, 1700], [2180, 700, 200, 220, 700], [1650, 760, 160, 120, 500],
    [1200, 690, 420, 70, 900], [880, 760, 90, 140, 350], [1530, 780, 80, 150, 350],
    [700, 880, 120, 50, 200], [430, 980, 90, 30, 120]
  ];
  let base = "", hojas = "";
  zonas.forEach(([cx, cy, rx, ry, n]) => {
    for (let k = 0; k < 7; k++) base += `<path d="${L.mancha(cx + L.r(-rx * .5, rx * .5), cy + L.r(-ry * .5, ry * .5), rx * L.r(.25, .45), ry * L.r(.25, .45), .4, 10)}" fill="#2A4726"/>`;
    for (let i = 0; i < n; i++) {
      const a = L.r(0, Math.PI * 2), d = Math.sqrt(L.R());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      const luz = (x - cx) / rx * .3 - (y - cy) / ry * .6 + L.r(-.5, .5);
      const c = luz > .55 ? L.e(["#8FA859", "#A6B865"]) : luz > .1 ? L.e(["#557A3B", "#6E8F45"]) : luz > -.4 ? L.e(["#3E6532", "#466E36"]) : L.e(["#2A4726", "#2F4F2A"]);
      hojas += `<use href="#yedra" transform="translate(${f(x)} ${f(y)}) rotate(${f(L.r(-180, 180))}) scale(${L.r(.9, 1.7).toFixed(2)})" fill="${c}"/>`;
    }
  });
  // Guías que cuelgan
  let guias = "";
  const colgar = (x, y0, largo) => {
    let x1 = x, s = "", pts = [[x, y0]];
    for (let y = y0; y < y0 + largo; y += 14) {
      x1 += L.r(-4, 4) + Math.sin(y / 40) * 1.5;
      pts.push([x1, y]);
      if (L.R() < .8) s += `<use href="#yedra" transform="translate(${f(x1 + L.r(-6, 6))} ${f(y)}) rotate(${f(L.r(120, 240))}) scale(${L.r(.8, 1.4).toFixed(2)})" fill="${L.e(["#2F4F2A", "#3E6532", "#557A3B", "#6E8F45"])}"/>`;
    }
    return `<path d="${curva(pts)}" stroke="#4A5A34" stroke-width="2" fill="none"/>` + s;
  };
  for (let i = 0; i < 26; i++) guias += colgar(L.r(1650, 2250), L.r(950, 1050), L.r(80, 260));
  for (let i = 0; i < 9; i++) guias += colgar(L.r(860, 960), L.r(760, 840), L.r(120, 300));
  for (let i = 0; i < 9; i++) guias += colgar(L.r(1440, 1540), L.r(760, 840), L.r(120, 280));
  for (let i = 0; i < 10; i++) guias += colgar(L.r(1000, 1400), L.r(740, 770), L.r(20, 80));
  L.add(`<g filter="url(#gou)">${base}${hojas}${guias}</g>`);

  // Bugambilia: racimos de brácteas magenta
  let bug = "";
  const racimo = (cx, cy, n) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = cx + L.r(-30, 30), y = cy + L.r(-22, 22);
      for (let p = 0; p < 3; p++) s += `<path d="${L.mancha(x + Math.cos(p * 2.1) * 5, y + Math.sin(p * 2.1) * 5, L.r(6, 10), L.r(5, 8), .25, 7, p * 2.1)}" fill="${L.e(["#B03A8C", "#C9479E", "#D86DB3", "#9E2F7C"])}" opacity=".9"/>`;
    }
    return s;
  };
  for (let i = 0; i < 26; i++) bug += racimo(L.r(1750, 2300), L.r(520, 900), Math.round(L.r(3, 8)));
  for (let i = 0; i < 6; i++) bug += racimo(L.r(1500, 1700), L.r(650, 760), Math.round(L.r(2, 5)));
  for (let i = 0; i < 4; i++) bug += racimo(L.r(820, 1000), L.r(640, 720), Math.round(L.r(2, 4)));
  L.add(`<g filter="url(#acu)">${bug}</g>`);
  L.capas = [`<g mask="${mascaraOrillas(L, 300, 420, 2200, 2360, 1500)}">${L.capas.join("")}</g>`];
  return L.svg();
}

// ---------------- Maguey, órgano y echeverias ----------------
function maguey(L, bx, by, esc, semillaAng = 0) {
  const hojas = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / (n - 1) - .5) * 2.9 + L.r(-.08, .08) + semillaAng;
    hojas.push({ a, largo: (560 - Math.abs(a) * 120) * L.r(.75, 1.05) * esc, ancho: L.r(34, 48) * esc });
  }
  hojas.sort((p, q) => Math.abs(p.a) - Math.abs(q.a));
  let s = "";
  for (const { a, largo, ancho } of hojas) {
    const pts = [], izq = [], der = [];
    const caida = Math.abs(a) > .9 ? (Math.abs(a) - .9) * .9 : 0;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, aa = a + Math.sign(a) * caida * t * t;
      const x = bx + Math.sin(aa) * largo * t, y = by - Math.cos(aa) * largo * t;
      pts.push([x, y]);
      const w = ancho * (1 - t) * (t < .1 ? .7 + t * 3 : 1), nx = Math.cos(aa), ny = Math.sin(aa);
      izq.push([x - nx * w, y - ny * w]); der.push([x + nx * w, y + ny * w]);
    }
    const punta = pts[10];
    const mitad1 = curva([...izq, punta, ...pts.slice().reverse()], true);
    const mitad2 = curva([...der, punta, ...pts.slice().reverse()], true);
    const luz = a > 0;
    s += `<path d="${mitad1}" fill="${luz ? "#5D7E86" : "#87A5A6"}"/><path d="${mitad2}" fill="${luz ? "#87A5A6" : "#5D7E86"}"/>`;
    s += `<path d="${curva(pts)}" stroke="#B7CBC5" stroke-width="${f(3 * esc)}" fill="none" opacity=".55"/>`;
    s += `<path d="${curva(der.slice(1))}" stroke="#C9D8CF" stroke-width="${f(2.4 * esc)}" fill="none" opacity=".6"/>`;
    s += `<path d="M${f(pts[9][0] * .5 + punta[0] * .5)} ${f(pts[9][1] * .5 + punta[1] * .5)}L${f(punta[0])} ${f(punta[1])}" stroke="#4A3A2E" stroke-width="${f(4.5 * esc)}" stroke-linecap="round"/>`;
    s += L.pinceladas(mitad1 + mitad2, { n: 14, colores: ["#A9C2BD", "#4E6C74", "#9DB7B3"], ancho: [3, 7], largo: [largo * .2, largo * .5], angulo: -Math.PI / 2 + a, dispersion: .08, opacidad: [.25, .5], caja: [bx - largo, by - largo, bx + largo, by] });
    // dientes en la orilla
    for (let i = 3; i < 9; i += 2) s += `<circle cx="${f(izq[i][0])}" cy="${f(izq[i][1])}" r="${f(1.8 * esc)}" fill="#5A4636" opacity=".45"/>`;
  }
  return s;
}

function organo(L, bx, by) {
  const cols = [[-130, 380, 50], [140, 430, 54], [-66, 540, 58], [74, 610, 60], [0, 720, 64]];
  let s = "";
  for (const [dx, alto, w] of cols) {
    const x = bx + dx + L.r(-6, 6), top = by - alto;
    const d = `M${x - w / 2} ${by}L${x - w / 2} ${top + w / 2}Q${x - w / 2} ${top} ${x} ${top}Q${x + w / 2} ${top} ${x + w / 2} ${top + w / 2}L${x + w / 2} ${by}Z`;
    s += `<path d="${d}" fill="${L.degradado([[0, "#3F5838"], [.45, "#6E8A5A"], [.75, "#86A06C"], [1, "#55704A"]], 0, 0, 1, 0)}"/>`;
    for (let k = 1; k < 6; k++) {
      const rx = x - w / 2 + w * k / 6;
      s += `<path d="M${f(rx)} ${by}L${f(rx)} ${f(top + w * .35)}" stroke="${k % 2 ? "#A6B98A" : "#3E5636"}" stroke-width="${k % 2 ? 2.4 : 3}" opacity=".7"/>`;
      if (k % 2) for (let y = top + 30; y < by; y += 26) s += `<circle cx="${f(rx)}" cy="${f(y)}" r="2.2" fill="#EAE3C9" opacity=".75"/>`;
    }
  }
  return s;
}

function echeveria(L, cx, cy, r) {
  let s = "";
  [[1, 10, 0], [.72, 8, .3], [.45, 6, .1]].forEach(([k, n, off]) => {
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + off, x = cx + Math.cos(a) * r * k * .55, y = cy + Math.sin(a) * r * k * .32;
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * k * .42)}" ry="${f(r * k * .2)}" transform="rotate(${f(a * 180 / Math.PI)} ${f(x)} ${f(y)})" fill="${L.e(["#9DB59A", "#B5C9AE", "#8FAA8E"])}" stroke="#D49AA0" stroke-width="2" opacity=".95"/>`;
    }
  });
  return s + `<circle cx="${cx}" cy="${cy}" r="${f(r * .14)}" fill="#C9DAC2"/>`;
}

export function plantas() {
  const L = new Lienzo(2400, 1500, 97);
  // Arriates: tierra y cubresuelos
  let suelo = `<path d="M1470 1500 C1500 1380 1620 1330 1800 1310 C2000 1290 2200 1300 2400 1290 L2400 1500Z" fill="#6E4A36"/>
    <path d="M0 1500 L0 1350 C200 1330 520 1350 760 1420 C800 1440 820 1470 830 1500Z" fill="#6E4A36"/>`;
  for (let i = 0; i < 900; i++) {
    const der = L.R() < .65;
    const x = der ? L.r(1500, 2400) : L.r(0, 800), y = der ? L.r(1330 - (x - 1500) * .02, 1500) : L.r(1370 + x * .06, 1500);
    suelo += `<path d="${L.mancha(x, y, L.r(8, 18), L.r(5, 11), .4, 7, L.r(0, 3))}" fill="${L.e(["#4F7A3A", "#5F8A44", "#7AA052", "#3F6A34", "#8DB060"])}" opacity=".9"/>`;
  }
  L.add(`<g filter="url(#gou)">${suelo}</g>`);
  L.add(`<g filter="url(#gou)">${organo(L, 1720, 1400)}</g>`);
  L.add(`<g filter="url(#gou)">${maguey(L, 2050, 1450, .8, .1)}</g>`);
  L.add(`<g filter="url(#gou)">${maguey(L, 2330, 1480, .55, -.1)}</g>`);
  L.add(`<g filter="url(#gou)">${maguey(L, 380, 1500, 1.05)}</g>`);
  let ech = "";
  [[1560, 1440, 40], [1660, 1470, 46], [1800, 1455, 38], [1920, 1490, 44], [1500, 1490, 34], [640, 1470, 36], [740, 1495, 30]].forEach(([x, y, r]) => { ech += echeveria(L, x, y, r); });
  L.add(`<g filter="url(#acu)">${ech}</g>`);
  return L.svg();
}
