/* Recorta las acuarelas de arte/fuentes/ quitando el papel blanco (color → alfa, como en GIMP)
   y las guarda como WebP transparentes en img/escenas/. También desvanece el damasco del fondo hacia el blanco.
   Uso:  PW=/ruta/a/playwright-core CHROME=/ruta/a/chrome node arte/recortar.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright-core");
const raiz = new URL("../", import.meta.url);

// [fuente, salida, umbral de papel, voltear]
const PIEZAS = [
  ["ramo.jpg", "t-ramo", .06, false],
  ["paraiso-pintura.jpg", "t-pintura", .17, true],
  ["paraiso-tallos.jpg", "t-tallos", .06, false]
];

const nav = await chromium.launch({ executablePath: process.env.CHROME });
const pag = await nav.newPage();
await pag.setContent("<html><body></body></html>");

for (const [fuente, salida, umbral, voltear] of PIEZAS) {
  const datos = "data:image/jpeg;base64," + readFileSync(new URL(`arte/fuentes/${fuente}`, raiz)).toString("base64");
  const res = await pag.evaluate(async ({ datos, umbral, voltear }) => {
    const img = new Image(); img.src = datos; await img.decode();
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d");
    if (voltear) { x.translate(w, 0); x.scale(-1, 1); }
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    // Papel: mediana de la franja superior
    const mues = [[], [], []];
    for (let y = 0; y < Math.round(h * .06); y++) for (let i = 0; i < w; i += 3) { const k = (y * w + i) * 4; for (let ch = 0; ch < 3; ch++) mues[ch].push(p[k + ch]); }
    const bg = mues.map((m) => { m.sort((a, b) => a - b); return m[Math.floor(m.length * .6)]; });
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let k = 0; k < p.length; k += 4) {
      let a = 0;
      for (let ch = 0; ch < 3; ch++) a = Math.max(a, (bg[ch] - p[k + ch]) / bg[ch]);
      a = Math.min(1, Math.max(0, (a - umbral) / (1 - umbral)));
      a = Math.min(1, a * 1.25);
      if (a <= 0.004) { p[k + 3] = 0; continue; }
      for (let ch = 0; ch < 3; ch++) p[k + ch] = Math.max(0, Math.min(255, (p[k + ch] - (1 - a) * bg[ch]) / a));
      p[k + 3] = Math.round(a * 255);
      if (a > .05) { const i = (k / 4) % w, j = Math.floor(k / 4 / w); if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    }
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.putImageData(d, 0, 0);
    const pad = 4; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const r = document.createElement("canvas"); r.width = x1 - x0 + 1; r.height = y1 - y0 + 1;
    r.getContext("2d").drawImage(c, x0, y0, r.width, r.height, 0, 0, r.width, r.height);
    const prev = document.createElement("canvas"); prev.width = r.width; prev.height = r.height;
    const px = prev.getContext("2d"); px.fillStyle = "#A9B7C6"; px.fillRect(0, 0, r.width, r.height); px.drawImage(r, 0, 0);
    return { webp: r.toDataURL("image/webp", .86), jpg: prev.toDataURL("image/jpeg", .85), w: r.width, h: r.height, bg };
  }, { datos, umbral, voltear });
  const buf = Buffer.from(res.webp.split(",")[1], "base64");
  writeFileSync(new URL(`img/escenas/${salida}.webp`, raiz), buf);
  if (process.env.PREVIA) writeFileSync(`${process.env.PREVIA}/${salida}.jpg`, Buffer.from(res.jpg.split(",")[1], "base64"));
  console.log(salida, res.w + "×" + res.h, "papel", res.bg.join(","), Math.round(buf.length / 1024) + " KB");
}
// Fondo: damasco azul desvanecido en blanco (variante sello) y a todo color (variante mosaico)
const FONDOS = [["damasco-azul.png", "fondo-damasco", .84], ["damasco-azul.png", "fondo-damasco-color", 0]];
for (const [fuente, salida, velo] of FONDOS) {
  const datos = "data:image/png;base64," + readFileSync(new URL(`arte/fuentes/${fuente}`, raiz)).toString("base64");
  const webp = await pag.evaluate(async ({ datos, velo }) => {
    const img = new Image(); img.src = datos; await img.decode();
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    x.fillStyle = `rgba(255, 255, 255, ${velo})`;
    x.fillRect(0, 0, c.width, c.height);
    return c.toDataURL("image/webp", .82);
  }, { datos, velo });
  const buf = Buffer.from(webp.split(",")[1], "base64");
  writeFileSync(new URL(`img/escenas/${salida}.webp`, raiz), buf);
  console.log(salida, Math.round(buf.length / 1024) + " KB");
}
await nav.close();
