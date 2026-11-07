/* Escena 3 · Casa Virreinal Roja (5 de Mayo, Villa Gustavo A. Madero): fachada de frente, muro rojo con pilastras
   de cantera de ángulo recto, cornisa, ventanales de vitroblock y portón de arco con marco de cantera;
   al frente una fuente de cantera de tres tazas y macetas de barro con cuna de Moisés.
   Tres capas 2400×1500 que se alinean por la base: muro, fuente y plantas. */
import { Lienzo, curva, f } from "./pincel.mjs";

// Geometría compartida con la variante tinta (arte/tinta.mjs)
export const G = {
  SUELO: 1310, CX: 1200, ARRANQUE: 1010, RADIO: 232, MARCO: 46,
  X0: 150, X1: 2250,
  PRETIL: 520, CORNISA: 600, CORNISA_B: 636,
  VENT_B: 850, BANDA_B: 874, ZOCALO: 1238,
  PIL: [200, 540, 880, 1520, 1860, 2200], PW: 74,
  FX: 1650, FY: 1450
};
const { SUELO, CX, ARRANQUE, RADIO, MARCO, X0, X1, PRETIL, CORNISA, CORNISA_B, VENT_B, BANDA_B, ZOCALO, PIL, PW, FX, FY } = G;

// Vanos entre pilastras (sin el del portón)
export function vanos() {
  const v = [];
  for (let i = 0; i < PIL.length - 1; i++) {
    const a = PIL[i] + PW / 2, b = PIL[i + 1] - PW / 2;
    if (a < CX && b > CX) continue;
    v.push([a, b]);
  }
  return v;
}

function mascaraOrillas(L, x0, x1, x2, x3, yFin) {
  const id = L.id("orillas");
  L.def(`<linearGradient id="${id}-h" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${L.w}" y2="0">
      <stop offset="${x0 / L.w}" stop-color="#000"/><stop offset="${x1 / L.w}" stop-color="#fff"/><stop offset="${x2 / L.w}" stop-color="#fff"/><stop offset="${x3 / L.w}" stop-color="#000"/></linearGradient>
    <linearGradient id="${id}-v" gradientUnits="userSpaceOnUse" x1="0" y1="${yFin - 120}" x2="0" y2="${yFin}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="${id}-m2" maskUnits="userSpaceOnUse" x="0" y="0" width="${L.w}" height="${L.h}"><rect width="${L.w}" height="${L.h}" fill="url(#${id}-v)"/></mask>
    <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${L.w}" height="${L.h}"><rect width="${L.w}" height="${L.h}" fill="url(#${id}-h)" mask="url(#${id}-m2)"/></mask>`);
  return `url(#${id})`;
}

const CANTERA = ["#B8B1A5", "#ADA69A", "#C2BBAF", "#A39C90"];
const ROJO = ["#C24A3E", "#B7433A", "#CB5546", "#AE3E36"];

// Bloque de cantera: relleno, vetas, luz a la izquierda y sombra a la derecha
function cantera(L, x, y, w, h, juntas = 0) {
  const d = `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
  let s = `<path d="${d}" fill="${L.e(CANTERA)}"/>`;
  s += L.pinceladas(d, { n: Math.max(6, Math.round(w * h / 900)), colores: ["#CFC9BE", "#9C958A", "#B4AC9F", "#8F887E"], ancho: [3, 8], largo: [12, 40], angulo: Math.PI / 2, dispersion: .5, opacidad: [.2, .45], caja: [x, y, x + w, y + h] });
  s += `<rect x="${f(x)}" y="${f(y)}" width="${f(Math.min(6, w * .1))}" height="${f(h)}" fill="#DCD6CB" opacity=".7"/>`;
  s += `<rect x="${f(x + w - Math.min(8, w * .12))}" y="${f(y)}" width="${f(Math.min(8, w * .12))}" height="${f(h)}" fill="#6F685F" opacity=".45"/>`;
  if (juntas) for (let yy = y + juntas; yy < y + h - 8; yy += juntas) s += `<path d="M${f(x)} ${f(yy)}h${f(w)}" stroke="#7E776D" stroke-width="2.4" opacity=".6"/>`;
  return s;
}

// ---------------- Fachada roja con pilastras de cantera ----------------
export function muro() {
  const L = new Lienzo(2400, 1500, 71);

  // Aplanado rojo: base, pinceladas verticales y manchas de humedad
  const muroD = `M${X0} ${PRETIL}H${X1}V${SUELO}H${X0}Z`;
  let rojo = `<path d="${muroD}" fill="#BF473C"/>`;
  rojo += L.pinceladas(muroD, { n: 900, colores: ROJO.concat(["#D2614F", "#A3372F"]), ancho: [8, 22], largo: [40, 140], angulo: Math.PI / 2, dispersion: .25, opacidad: [.25, .55], caja: [X0, PRETIL, X1, SUELO] });
  L.add(`<g filter="url(#gou)">${rojo}</g>`);
  let humedad = "";
  for (let i = 0; i < 16; i++) humedad += `<path d="${L.mancha(L.r(X0 + 60, X1 - 60), L.r(1150, 1240), L.r(60, 160), L.r(30, 70), .35, 10)}" fill="#7E2A24"/>`;
  for (let i = 0; i < 10; i++) humedad += `<path d="${L.mancha(L.r(X0 + 60, X1 - 60), L.r(650, 700), L.r(80, 180), L.r(14, 26), .35, 10)}" fill="#7E2A24"/>`;
  L.add(`<g filter="url(#lav)" opacity=".28">${humedad}</g>`);

  // Pretil: remate de cantera
  let s = cantera(L, X0 - 14, PRETIL - 14, X1 - X0 + 28, 20);
  // Cornisa corrida: filete claro, cuerpo y sombra que proyecta sobre el rojo
  s += cantera(L, X0 - 26, CORNISA, X1 - X0 + 52, CORNISA_B - CORNISA);
  s += `<rect x="${X0 - 26}" y="${CORNISA}" width="${X1 - X0 + 52}" height="7" fill="#DDD7CC"/>`;
  s += `<rect x="${X0 - 26}" y="${CORNISA_B - 9}" width="${X1 - X0 + 52}" height="9" fill="#857E73"/>`;
  L.add(`<g filter="url(#gou)">${s}</g>`);
  L.add(`<g filter="url(#lav)" opacity=".5"><rect x="${X0}" y="${CORNISA_B}" width="${X1 - X0}" height="20" fill="#5A1D18"/></g>`);

  // Ventanales de vitroblock sobre la banda gris, en cada vano
  let v = "";
  vanos().forEach(([a, b]) => {
    const x0 = a + 16, x1 = b - 16, y0 = CORNISA_B + 18, y1 = VENT_B;
    v += `<rect x="${x0 - 6}" y="${y0 - 6}" width="${x1 - x0 + 12}" height="${y1 - y0 + 6}" fill="#6E7266"/>`;
    const cols = Math.round((x1 - x0) / 30), filas = Math.round((y1 - y0) / 30);
    const cw = (x1 - x0) / cols, ch = (y1 - y0) / filas;
    for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) {
      const x = x0 + i * cw, y = y0 + j * ch;
      v += `<rect x="${f(x + 2)}" y="${f(y + 2)}" width="${f(cw - 4)}" height="${f(ch - 4)}" fill="${L.e(["#C9D0CD", "#BCC5C3", "#D6DBD7", "#AEB8B8", "#C3C9C3"])}"/>`;
      v += `<path d="M${f(x + 5)} ${f(y + ch * .5)}h${f(cw - 10)}M${f(x + cw * .5)} ${f(y + 5)}v${f(ch - 10)}" stroke="#E9ECE8" stroke-width="1.6" opacity=".55"/>`;
    }
    // Reflejo diagonal del cielo y sombra arriba
    v += `<path d="M${x0} ${y1}L${x0 + (x1 - x0) * .45} ${y0}H${x0 + (x1 - x0) * .62}L${x0 + (x1 - x0) * .17} ${y1}Z" fill="#FFFFFF" opacity=".16"/>`;
    v += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="26" fill="#3E4440" opacity=".25"/>`;
    // Banda gris oliva bajo la ventana
    v += `<rect x="${a}" y="${VENT_B}" width="${b - a}" height="${BANDA_B - VENT_B}" fill="#8A8B78"/><rect x="${a}" y="${BANDA_B - 5}" width="${b - a}" height="5" fill="#5F604F" opacity=".7"/>`;
  });
  L.add(`<g filter="url(#gou)">${v}</g>`);

  // Zócalo de piedra al pie del muro
  L.add(`<g filter="url(#gou)">${cantera(L, X0, ZOCALO, X1 - X0, SUELO - ZOCALO)}<rect x="${X0}" y="${ZOCALO}" width="${X1 - X0}" height="6" fill="#DDD7CC"/></g>`);

  // Pilastras de cantera: fuste en hiladas, capitel y basa, aristas rectas
  let p = "";
  PIL.forEach((x) => {
    const a = x - PW / 2;
    p += cantera(L, a, CORNISA_B, PW, ZOCALO - CORNISA_B, 64);
    p += cantera(L, a - 9, CORNISA_B, PW + 18, 30);
    p += `<rect x="${a - 9}" y="${CORNISA_B + 30}" width="${PW + 18}" height="6" fill="#6F685F" opacity=".55"/>`;
    p += cantera(L, a - 10, ZOCALO - 34, PW + 20, SUELO - ZOCALO + 34);
    p += `<rect x="${a - 10}" y="${ZOCALO - 34}" width="${PW + 20}" height="6" fill="#DDD7CC"/>`;
  });
  L.add(`<g filter="url(#gou)">${p}</g>`);

  // Vano oscuro: el interior de la casa. Las hojas del portón son capas aparte (puerta) que se abren con el scroll
  const vano = `M${CX - RADIO} ${SUELO}L${CX - RADIO} ${ARRANQUE}A${RADIO} ${RADIO} 0 0 1 ${CX + RADIO} ${ARRANQUE}L${CX + RADIO} ${SUELO}Z`;
  L.add(`<g filter="url(#gou)"><path d="${vano}" fill="${L.degradado([[0, "#0E0A08"], [.6, "#17110D"], [1, "#261C16"]])}"/></g>
    <g filter="url(#lav)" opacity=".35"><path d="${L.mancha(CX, SUELO - 60, RADIO * .8, 60, .2, 10)}" fill="#4A3A2C"/></g>`);

  let marco = "";
  // Jambas en hiladas e impostas
  [CX - RADIO - MARCO, CX + RADIO].forEach((x) => {
    marco += cantera(L, x, ARRANQUE, MARCO, ZOCALO - ARRANQUE, 56);
    marco += cantera(L, x - 8, ARRANQUE - 4, MARCO + 16, 24);
    marco += `<rect x="${x - 8}" y="${ARRANQUE + 20}" width="${MARCO + 16}" height="5" fill="#6F685F" opacity=".55"/>`;
  });
  // Dovelas
  const n = 15, r0 = RADIO, r1 = RADIO + MARCO;
  const pt = (r, a) => `${f(CX + Math.cos(a) * r)} ${f(ARRANQUE + Math.sin(a) * r)}`;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + i / n * Math.PI, a1 = Math.PI + (i + 1) / n * Math.PI;
    const clave = i === (n - 1) / 2;
    const ra = clave ? r1 + 18 : r1;
    marco += `<path d="M${pt(r0, a0)}L${pt(ra, a0)}A${ra} ${ra} 0 0 1 ${pt(ra, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 0 0 ${pt(r0, a0)}Z" fill="${clave ? "#C9C2B6" : L.e(CANTERA)}" stroke="#7E776D" stroke-width="2.4"/>`;
  }
  marco += `<path d="M${CX - r1} ${ARRANQUE}A${r1} ${r1} 0 0 1 ${CX + r1} ${ARRANQUE}" stroke="#DCD6CB" stroke-width="4" fill="none" opacity=".7"/>`;
  marco += `<path d="M${CX - r0 - 3} ${ARRANQUE}A${r0 + 3} ${r0 + 3} 0 0 1 ${CX + r0 + 3} ${ARRANQUE}" stroke="#5E574F" stroke-width="6" fill="none" opacity=".55"/>`;
  L.add(`<g filter="url(#gou)">${marco}</g>`);

  // Farol de hierro en la pilastra derecha del portón
  const fx = PIL[3] + PW / 2 + 44, fy = 800;
  L.add(`<g filter="url(#gou)">
    <path d="M${PIL[3] + PW / 2} ${fy - 30}h40q12 0 12 14v14" stroke="#2B2522" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M${fx - 18} ${fy}h36l-6 12h-24z" fill="#2B2522"/>
    <path d="M${fx - 14} ${fy + 12}h28l-5 46h-18z" fill="#E9D9A6" stroke="#2B2522" stroke-width="4"/>
    <path d="M${fx} ${fy + 12}v46" stroke="#2B2522" stroke-width="2.4"/>
    <path d="M${fx - 12} ${fy + 58}h24l-12 14z" fill="#2B2522"/>
  </g>`);

  // Banqueta de losas, guarnición y arroyo
  let losas = "";
  for (let x = X0 - 60 + L.r(0, 30); x < X1 + 60; x += L.r(110, 160)) losas += `<path d="M${f(x)} ${SUELO + 4}l${f(L.r(-30, -10))} 92" stroke="#8E8A82" stroke-width="2.4" opacity=".7"/>`;
  L.add(`<g filter="url(#gou)">
    <rect x="${X0 - 80}" y="${SUELO}" width="${X1 - X0 + 160}" height="96" fill="#BDB8AE"/>${losas}
    <rect x="${X0 - 80}" y="${SUELO + 96}" width="${X1 - X0 + 160}" height="14" fill="#9C978D"/>
    <rect x="${X0 - 80}" y="${SUELO + 110}" width="${X1 - X0 + 160}" height="80" fill="#7C7B77"/>
  </g>
  <g filter="url(#lav)" opacity=".45"><rect x="${X0}" y="${SUELO - 4}" width="${X1 - X0}" height="26" fill="#3B3530"/></g>`);

  L.capas = [`<g mask="${mascaraOrillas(L, 40, 210, 2190, 2360, 1490)}">${L.capas.join("")}</g>`];
  return L.svg();
}

// ---------------- Hojas del portón (capas que giran sobre su gozne) ----------------
export const HOJA = { R2: RADIO - 20 };
export function puerta(lado) {
  const L = new Lienzo(2400, 1500, lado === "izq" ? 73 : 79);
  const R2 = HOJA.R2, x0 = lado === "izq" ? CX - R2 : CX, x1 = lado === "izq" ? CX : CX + R2;
  const porton = `M${CX - R2} ${SUELO}L${CX - R2} ${ARRANQUE + 12}A${R2} ${R2} 0 0 1 ${CX + R2} ${ARRANQUE + 12}L${CX + R2} ${SUELO}Z`;
  // La mitad del portón: recorte del arco dentro del recorte de la mitad
  const clip2 = L.id("mitad");
  L.def(`<clipPath id="${clip2}"><rect x="${x0}" y="0" width="${x1 - x0}" height="1500"/></clipPath>`);
  const clipP = L.id("porton");
  L.def(`<clipPath id="${clipP}"><path d="${porton}"/></clipPath>`);
  let tablas = "";
  for (let x = x0; x < x1; x += 27) {
    tablas += `<rect x="${x}" y="${ARRANQUE - R2}" width="25" height="${SUELO - ARRANQUE + R2 + 20}" fill="${L.e(["#6E3B22", "#7D4528", "#5F331D", "#874C2C", "#743F24"])}"/>`;
    tablas += `<path d="M${x + L.r(6, 18)} ${ARRANQUE - R2}V${SUELO}" stroke="#4A2816" stroke-width="2" opacity=".35"/>`;
  }
  const canto = lado === "izq" ? x1 - 4 : x0 + 4;
  tablas += `<path d="M${canto} ${ARRANQUE - R2}V${SUELO}" stroke="#1A100A" stroke-width="7"/>`;
  tablas += `<path d="M${x0} ${SUELO - 150}H${x1}M${x0} ${ARRANQUE + 40}H${x1}" stroke="#3E2415" stroke-width="10" opacity=".6"/>`;
  let clavos = "";
  for (let x = CX - R2 + 18; x < CX + R2; x += 36) if (x > x0 && x < x1) clavos += `<circle cx="${x}" cy="${SUELO - 150}" r="4"/><circle cx="${x}" cy="${ARRANQUE + 40}" r="4"/>`;
  const aldaba = lado === "izq" ? CX - 30 : CX + 30;
  clavos += `<circle cx="${aldaba}" cy="1170" r="11" fill="none" stroke="#2A1A10" stroke-width="5"/>`;
  L.add(`<g clip-path="url(#${clip2})"><g clip-path="url(#${clipP})" filter="url(#gou)">${tablas}<g fill="#2A1A10">${clavos}</g>
    <rect x="${CX - R2}" y="${ARRANQUE - R2}" width="${R2 * 2}" height="${SUELO - ARRANQUE + R2}" fill="${L.degradado([[0, "#1A120D", .7], [.45, "#1A120D", .2], [1, "#1A120D", .05]])}"/></g></g>`);
  return L.svg();
}

// ---------------- Fuente de cantera de tres tazas ----------------
// Perfil de balaustre: [alto relativo, medio ancho] de abajo hacia arriba
function balaustre(cx, y0, y1, perfil) {
  const h = y0 - y1;
  const izq = perfil.map(([t, w]) => [cx - w, y0 - t * h]);
  const der = perfil.map(([t, w]) => [cx + w, y0 - t * h]).reverse();
  return curva(izq.concat(der), true);
}

// Taza: borde elíptico arriba y panza que baja al fuste; con orilla festoneada
function taza(L, cx, y, rx, ry, fondo, sombra = true) {
  const cuerpo = `M${cx - rx} ${y}C${cx - rx * .9} ${y + fondo * .7} ${cx - rx * .35} ${y + fondo} ${cx} ${y + fondo}C${cx + rx * .35} ${y + fondo} ${cx + rx * .9} ${y + fondo * .7} ${cx + rx} ${y}Z`;
  let s = `<path d="${cuerpo}" fill="${L.degradado([[0, "#CFC8BC"], [.5, "#ADA69A"], [1, "#7D766C"]], 0, 0, 1, 0)}"/>`;
  s += `<path d="${cuerpo}" fill="${L.degradado([[0, "#000", 0], [1, "#3A332C", .35]])}"/>`;
  // Gallones de la panza
  for (let k = -3; k <= 3; k++) {
    const x = cx + k * rx * .26;
    s += `<path d="M${f(x)} ${f(y + 6)}Q${f(x - k * 4)} ${f(y + fondo * .6)} ${f(cx + k * rx * .08)} ${f(y + fondo - 4)}" stroke="#80796F" stroke-width="2.4" fill="none" opacity=".55"/>`;
  }
  // Agua en la taza y borde
  s += `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="#B9B2A6"/>`;
  s += `<ellipse cx="${cx}" cy="${y - ry * .25}" rx="${rx - 14}" ry="${ry * .45}" fill="#8FAAB3"/>`;
  s += `<ellipse cx="${cx - rx * .2}" cy="${y - ry * .3}" rx="${rx * .35}" ry="${ry * .15}" fill="#D6E4E8" opacity=".6"/>`;
  // Festón
  const n = Math.round(rx / 16);
  for (let i = 0; i <= n; i++) {
    const a = Math.PI * i / n, x = cx - Math.cos(a) * rx, yy = y + Math.sin(a) * ry;
    s += `<circle cx="${f(x)}" cy="${f(yy + 2)}" r="${f(rx / n * .55)}" fill="${i < n / 2 ? "#C9C2B6" : "#9F988C"}"/>`;
  }
  if (sombra) s += `<ellipse cx="${cx}" cy="${y + ry + 6}" rx="${rx * .85}" ry="${ry * .5}" fill="#4A433B" opacity=".18"/>`;
  return s;
}

// Chorros que caen de una taza a la de abajo
function chorros(L, cx, y, rx, yFin, n) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (i + .5) / n, x = cx - Math.cos(a) * rx * .96, y0 = y + Math.sin(a) * 8;
    const caida = x + (x - cx) * .12;
    s += `<path d="M${f(x)} ${f(y0)}Q${f(x + (x - cx) * .08)} ${f((y0 + yFin) / 2)} ${f(caida)} ${f(yFin)}" stroke="${L.e(["#DCEBEF", "#C2DCE4", "#FFFFFF"])}" stroke-width="${f(L.r(2.4, 4.4))}" fill="none" opacity="${L.r(.45, .75).toFixed(2)}" stroke-linecap="round"/>`;
  }
  return s;
}

export function fuente() {
  const L = new Lienzo(2400, 1500, 89);
  const rx = 255, ry = 46, h = 96, top = FY - h;
  const B1 = 1236, B2 = 1084, B3 = 968;

  // Sombra en la banqueta
  L.add(`<g filter="url(#lav)" opacity=".4"><path d="${L.mancha(FX + 30, FY + 6, rx + 50, 34, .15, 12)}" fill="#3B3530"/></g>`);

  // Pileta: interior de azulejo azul, agua y pretil de cantera
  let p = `<ellipse cx="${FX}" cy="${top}" rx="${rx}" ry="${ry}" fill="#A9A296"/>`;
  p += `<ellipse cx="${FX}" cy="${top + 4}" rx="${rx - 20}" ry="${ry - 9}" fill="#3A6788"/>`;
  let azulejo = "";
  for (let k = 0; k < 18; k++) {
    const a = Math.PI + k / 17 * Math.PI, x = FX + Math.cos(a) * (rx - 26), y = top + 4 + Math.sin(a) * (ry - 12);
    azulejo += `<rect x="${f(x - 8)}" y="${f(y - 6)}" width="16" height="12" fill="${L.e(["#3E73A2", "#D9E3EA", "#264F77"])}" opacity=".8"/>`;
  }
  p += azulejo;
  p += `<ellipse cx="${FX}" cy="${top + 12}" rx="${rx - 34}" ry="${ry - 20}" fill="#5F8FA8"/>`;
  // Ondas donde cae el agua
  for (let i = 0; i < 6; i++) p += `<ellipse cx="${f(FX + L.r(-150, 150))}" cy="${f(top + L.r(6, 22))}" rx="${f(L.r(16, 34))}" ry="${f(L.r(3, 6))}" fill="none" stroke="#D8EAF0" stroke-width="2" opacity=".6"/>`;
  // Fuste bajo saliendo del agua
  p += `<path d="${balaustre(FX, top + 14, B1 + 30, [[0, 34], [.25, 28], [.5, 44], [.72, 26], [.9, 22], [1, 30]])}" fill="${L.degradado([[0, "#D3CDC2"], [.55, "#A8A195"], [1, "#6F685F"]], 0, 0, 1, 0)}"/>`;
  // Pretil (cara frontal)
  const frente = `M${FX - rx} ${top}A${rx} ${ry} 0 0 0 ${FX + rx} ${top}V${FY}A${rx} ${ry} 0 0 1 ${FX - rx} ${FY}Z`;
  p += `<path d="${frente}" fill="${L.degradado([[0, "#CBC4B8"], [.45, "#B1AA9E"], [1, "#857E73"]], 0, 0, 1, 0)}"/>`;
  p += L.pinceladas(frente, { n: 70, colores: ["#D6D0C5", "#968F84", "#B5AEA2"], ancho: [3, 8], largo: [14, 40], angulo: 0, dispersion: .3, opacidad: [.2, .45], caja: [FX - rx, top, FX + rx, FY + ry] });
  for (let k = 1; k < 8; k++) {
    const a = Math.PI - k / 8 * Math.PI, x = FX + Math.cos(a) * rx;
    p += `<path d="M${f(x)} ${f(top + Math.sin(a) * ry)}V${f(FY + Math.sin(a) * ry)}" stroke="#7E776D" stroke-width="2.4" opacity=".55"/>`;
  }
  p += `<path d="M${FX - rx} ${top}A${rx} ${ry} 0 0 0 ${FX + rx} ${top}" stroke="#E0DACF" stroke-width="12" fill="none"/>`;
  p += `<path d="M${FX - rx} ${top + 10}A${rx} ${ry} 0 0 0 ${FX + rx} ${top + 10}" stroke="#7E776D" stroke-width="3" fill="none" opacity=".6"/>`;
  L.add(`<g filter="url(#gou)">${p}</g>`);

  // Tazas y fustes, de abajo hacia arriba
  let t = taza(L, FX, B1, 172, 20, 80);
  t += `<path d="${balaustre(FX, B1 - 6, B2 + 24, [[0, 30], [.2, 22], [.45, 40], [.7, 20], [.88, 16], [1, 22]])}" fill="${L.degradado([[0, "#D3CDC2"], [.55, "#A8A195"], [1, "#6F685F"]], 0, 0, 1, 0)}"/>`;
  t += taza(L, FX, B2, 112, 15, 58);
  t += `<path d="${balaustre(FX, B2 - 4, B3 + 18, [[0, 22], [.25, 15], [.5, 28], [.75, 14], [1, 17]])}" fill="${L.degradado([[0, "#D3CDC2"], [.55, "#A8A195"], [1, "#6F685F"]], 0, 0, 1, 0)}"/>`;
  t += taza(L, FX, B3, 66, 10, 40, false);
  // Remate: piña de cantera
  t += `<path d="${balaustre(FX, B3 - 2, B3 - 96, [[0, 12], [.18, 9], [.42, 22], [.7, 18], [.88, 8], [1, 2]])}" fill="${L.degradado([[0, "#D3CDC2"], [.55, "#A8A195"], [1, "#6F685F"]], 0, 0, 1, 0)}"/>`;
  for (let k = 0; k < 4; k++) t += `<path d="M${FX - 16} ${B3 - 34 - k * 12}q16 10 32 0" stroke="#7E776D" stroke-width="2" fill="none" opacity=".6"/>`;
  L.add(`<g filter="url(#gou)">${t}</g>`);

  // Agua que cae
  L.add(`<g filter="url(#acu)">${chorros(L, FX, B3, 66, B2 - 2, 9)}${chorros(L, FX, B2, 112, B1 - 2, 14)}${chorros(L, FX, B1, 172, top + 14, 20)}
    <path d="M${FX - 3} ${B3 - 96}q3 -26 6 0" stroke="#E4F0F3" stroke-width="3" fill="none" opacity=".7"/></g>`);
  return L.svg();
}

// ---------------- Macetas de barro con cuna de Moisés ----------------
function hojaLanza(cx, cy, ang, largo, ancho, curv) {
  const pts = [], izq = [], der = [];
  const ux = Math.cos(ang), uy = Math.sin(ang);
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, b = curv * t * t * largo;
    pts.push([cx + ux * largo * t - uy * b, cy + uy * largo * t + ux * b]);
  }
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, 12)], o = pts[Math.max(i - 1, 0)];
    let dx = q[0] - o[0], dy = q[1] - o[1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const t = i / 12, w = ancho * Math.sin(Math.min(1, t / .45) * Math.PI / 2) * (t > .45 ? Math.cos((t - .45) / .55 * Math.PI / 2) : 1);
    izq.push([p[0] - dy * w, p[1] + dx * w]); der.push([p[0] + dy * w, p[1] - dx * w]);
  });
  return { d: curva(izq.concat(der.reverse()), true), eje: pts };
}

function cunaDeMoises(L, x, y, esc) {
  let s = "";
  const n = 13;
  const hojas = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / (n - 1) - .5) * 2.6 + L.r(-.12, .12);
    hojas.push({ a, largo: L.r(190, 260) * esc * (1 - Math.abs(a + Math.PI / 2) * .15), curv: (a + Math.PI / 2) * .35 });
  }
  hojas.sort((p, q) => Math.abs(q.a + Math.PI / 2) - Math.abs(p.a + Math.PI / 2));
  // Espatas blancas por detrás de las hojas del centro
  const flores = [];
  for (let k = 0; k < 3; k++) flores.push([x + L.r(-50, 50) * esc, y - L.r(230, 300) * esc, L.r(-.3, .3)]);
  flores.forEach(([fx, fy, inc]) => {
    s += `<path d="M${f(x + (fx - x) * .3)} ${y}Q${f(fx)} ${f(fy + 120 * esc)} ${f(fx)} ${f(fy + 30 * esc)}" stroke="#4F7A3A" stroke-width="${f(5 * esc)}" fill="none"/>`;
    const { d } = hojaLanza(fx, fy + 30 * esc, -Math.PI / 2 + inc, 80 * esc, 28 * esc, .1);
    s += `<path d="${d}" fill="#F6F3E8"/><path d="${d}" fill="${L.degradado([[0, "#FFFFFF", 0], [1, "#C4C9BC", .5]], 0, 0, 1, 0)}"/>`;
    s += `<path d="M${f(fx - 3 * esc)} ${f(fy + 26 * esc)}q${f(2 * esc)} ${f(-26 * esc)} ${f(6 * esc)} ${f(-36 * esc)}" stroke="#E6DCA6" stroke-width="${f(5 * esc)}" fill="none" stroke-linecap="round"/>`;
  });
  hojas.forEach(({ a, largo, curv }) => {
    // Pecíolo casi derecho y lámina ancha y brillante que se arquea hacia afuera
    const pl = largo * .42, px = x + Math.cos(a) * pl, py = y + Math.sin(a) * pl;
    const ab = a + (a + Math.PI / 2) * .45;
    s += `<path d="M${f(x)} ${f(y)}L${f(px)} ${f(py)}" stroke="#3E6A33" stroke-width="${f(4 * esc)}" stroke-linecap="round"/>`;
    const { d, eje } = hojaLanza(px, py, ab, largo * .7, largo * .16, curv * .8);
    const luz = a > -Math.PI / 2;
    s += `<path d="${d}" fill="${luz ? L.e(["#2C5A2C", "#244F27"]) : L.e(["#3D6F37", "#47793F"])}"/>`;
    s += `<path d="${curva(eje.slice(0, -1))}" stroke="#7FA862" stroke-width="${f(2.4 * esc)}" fill="none" opacity=".65"/>`;
    s += `<path d="${curva(eje.slice(2, 8).map(([qx, qy]) => [qx - 7 * esc, qy - 4 * esc]))}" stroke="#A9CC86" stroke-width="${f(6 * esc)}" fill="none" opacity=".3" stroke-linecap="round"/>`;
  });
  return s;
}

function maceta(L, x, y, esc) {
  const w = 74 * esc, wb = 52 * esc, h = 110 * esc, borde = 22 * esc;
  const cuerpo = `M${f(x - w)} ${f(y - h)}L${f(x + w)} ${f(y - h)}L${f(x + wb)} ${f(y)}L${f(x - wb)} ${f(y)}Z`;
  let s = `<path d="${cuerpo}" fill="${L.degradado([[0, "#C8774E"], [.5, "#B0603D"], [1, "#7F3F25"]], 0, 0, 1, 0)}"/>`;
  s += L.pinceladas(cuerpo, { n: 24, colores: ["#D08A60", "#93492C", "#B86A45"], ancho: [3, 7], largo: [10, 30], angulo: 0, dispersion: .3, opacidad: [.2, .45], caja: [x - w, y - h, x + w, y] });
  s += `<rect x="${f(x - w - 8 * esc)}" y="${f(y - h - borde)}" width="${f(2 * w + 16 * esc)}" height="${f(borde)}" rx="${f(4 * esc)}" fill="#C27450"/>`;
  s += `<rect x="${f(x - w - 8 * esc)}" y="${f(y - h - 4 * esc)}" width="${f(2 * w + 16 * esc)}" height="${f(5 * esc)}" fill="#6E3620" opacity=".5"/>`;
  return s;
}

export function plantas() {
  const L = new Lienzo(2400, 1500, 97);
  const macetas = [[1975, 1480, 1.05], [2160, 1496, .85], [430, 1490, 1.1], [690, 1498, .9], [250, 1500, .75]];
  let sombras = "";
  macetas.forEach(([x, y, e]) => { sombras += `<path d="${L.mancha(x + 20 * e, y + 4, 90 * e, 14 * e, .15, 10)}" fill="#3B3530"/>`; });
  L.add(`<g filter="url(#lav)" opacity=".35">${sombras}</g>`);
  macetas.forEach(([x, y, e]) => {
    L.add(`<g filter="url(#gou)">${cunaDeMoises(L, x, y - 122 * e, e)}</g>`);
    L.add(`<g filter="url(#gou)">${maceta(L, x, y, e)}</g>`);
  });
  return L.svg();
}
