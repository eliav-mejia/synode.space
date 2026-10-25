/* Genera las capas de las escenas: SVG procedural → WebP con transparencia en img/escenas/.
   Uso:  PW=/ruta/a/node_modules/playwright-core CHROME=/ruta/a/chrome node arte/rasterizar.mjs [filtro]
   PREVIA=/carpeta  además guarda una vista previa JPG de cada capa sobre papel. */
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import * as T from "./tetelpan.mjs";
import * as A from "./arco.mjs";
import * as R from "./relieve.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright-core");

// Escala de salida: el fondo brumoso no necesita resolución completa
const ESCALA = { "t-montes": .6 };
const CALIDAD = { "relieve-flores": .86 };

const CAPAS = {
  "t-montes": T.montes,
  "a-muro": A.muro,
  "a-enredadera": A.enredadera,
  "a-plantas": A.plantas,
  "relieve-flores": R.flores
};

const filtro = process.argv[2] || "";
const raiz = new URL("../", import.meta.url);
mkdirSync(new URL("arte/svg/", raiz), { recursive: true });
mkdirSync(new URL("img/escenas/", raiz), { recursive: true });

const nav = await chromium.launch({ executablePath: process.env.CHROME });
const pag = await nav.newPage();
await pag.setContent("<html><body></body></html>");

for (const [nombre, gen] of Object.entries(CAPAS)) {
  if (filtro && !nombre.startsWith(filtro)) continue;
  const svg = gen();
  writeFileSync(new URL(`arte/svg/${nombre}.svg`, raiz), svg);
  const res = await pag.evaluate(async ({ svg, previa, escala, calidad }) => {
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    await img.decode();
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * escala); c.height = Math.round(img.naturalHeight * escala);
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0, c.width, c.height);
    const webp = c.toDataURL("image/webp", calidad);
    let jpg = null;
    if (previa) {
      const p = document.createElement("canvas");
      const k = Math.min(1, 1000 / c.width);
      p.width = c.width * k; p.height = c.height * k;
      const px = p.getContext("2d");
      px.fillStyle = "#F7F2E8"; px.fillRect(0, 0, p.width, p.height);
      px.drawImage(c, 0, 0, p.width, p.height);
      jpg = p.toDataURL("image/jpeg", 0.85);
    }
    return { webp, jpg };
  }, { svg, previa: !!process.env.PREVIA, escala: ESCALA[nombre] || 1, calidad: CALIDAD[nombre] || .78 });
  const buf = Buffer.from(res.webp.split(",")[1], "base64");
  writeFileSync(new URL(`img/escenas/${nombre}.webp`, raiz), buf);
  if (res.jpg) writeFileSync(`${process.env.PREVIA}/${nombre}.jpg`, Buffer.from(res.jpg.split(",")[1], "base64"));
  console.log(nombre, Math.round(svg.length / 1024) + " KB svg →", Math.round(buf.length / 1024) + " KB webp");
}
await nav.close();
