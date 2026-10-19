/* Fondo fijo: papel con grano, flores prensadas en las orillas y una sola ave del paraíso en acuarela.
   La acuarela «se seca» al cargar (de difusa a nítida) y se difumina al hacer scroll: se cruzan dos imágenes
   (nítida y pre-difuminada) solo con opacidad y transform, así corre a 60–120 Hz sin repintar.
   Guirnaldas y ramos de los marcos usan las mismas flores prensadas (#p-* en el sprite de index.html). */
(function () {
  "use strict";

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  // [forma, x %, y %, tamaño (vmin), giro (deg)] — orillas del papel; la esquina inferior derecha es de la acuarela.
  var PRENSADAS = [
    ["helecho", 4, 9, 34, 148], ["hortensia", 15, 5, 17, 0], ["margarita", 7, 23, 15, 20], ["petalos", 23, 15, 10, 40], ["lavanda", 27, 3, 22, 118],
    ["rama", 94, 6, 26, -140], ["cosmos", 84, 9, 14, 0], ["hoja", 97, 24, 19, -118], ["petalos", 76, 4, 8, 160],
    ["lavanda", 5, 93, 26, 18], ["hoja", 15, 97, 18, 34], ["hortensia", 4, 78, 13, 0], ["cosmos", 19, 87, 11, 0],
    ["rama", -1, 52, 22, 82], ["margarita", 3, 63, 9, 0], ["petalos", 58, 97, 8, 0]
  ];

  var RAMOS = {
    izq: [["helecho", 30, 40, 9, -50], ["hoja", 55, 24, 7, 56], ["cosmos", 34, 48, 6, 0], ["margarita", 56, 60, 4, 0], ["lavanda", 64, 34, 6, 40]],
    der: [["rama", 70, 40, 9, 50], ["hoja", 45, 24, 7, -56], ["hortensia", 66, 48, 6, 0], ["cosmos", 42, 60, 4, 0], ["lavanda", 36, 36, 6, -40]]
  };

  function svgDe(forma) {
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-50 -50 100 100");
    var use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#p-" + forma);
    // Sin x/y/width/height el símbolo se dibujaría desde (0,0), desplazado medio tamaño.
    use.setAttribute("x", "-50");
    use.setAttribute("y", "-50");
    use.setAttribute("width", "100");
    use.setAttribute("height", "100");
    svg.appendChild(use);
    return svg;
  }

  // Flor que se mece (guirnalda y ramos). def = [forma, x, y, tamaño, giro]
  function flor(def, i) {
    var el = document.createElement("span");
    el.className = "flor";
    el.style.cssText =
      "--x:" + def[1] + "%;--y:" + def[2] + "%;--s:" + def[3] + ";--r:" + def[4] + "deg" +
      ";--d:" + (i * 0.08).toFixed(2) + "s;--dur:" + (5 + Math.random() * 4).toFixed(1) + "s;--amp:" + (2 + Math.random() * 2.5).toFixed(1) + "deg";
    el.appendChild(svgDe(def[0]));
    return el;
  }

  function prensadas(capa) {
    PRENSADAS.forEach(function (d) {
      var el = document.createElement("span");
      el.className = "prensada";
      el.style.cssText = "--x:" + d[1] + "%;--y:" + d[2] + "%;--s:" + d[3] + ";--r:" + d[4] + "deg";
      el.appendChild(svgDe(d[0]));
      capa.appendChild(el);
    });
  }

  function guirnalda(el) {
    var n = parseInt(el.dataset.guirnalda, 10) || 7;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "guirnalda__cordel");
    svg.setAttribute("viewBox", "0 0 1000 100");
    svg.setAttribute("preserveAspectRatio", "none");
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M-20 6 Q500 120 1020 6");
    svg.appendChild(path);
    el.appendChild(svg);
    var formas = ["margarita", "lavanda", "cosmos", "hortensia", "margarita", "petalos"];
    for (var i = 0; i < n; i++) {
      var t = (i + 1) / (n + 1);
      // Bézier cuadrática: y(t) en el viewBox de 100 → porcentaje de la altura
      var y = ((1 - t) * (1 - t) * 6 + 2 * (1 - t) * t * 120 + t * t * 6);
      var c = document.createElement("div");
      c.className = "colgajo";
      var hilo = 10 + (i % 3) * 9;
      c.style.cssText = "left:" + (t * 100).toFixed(2) + "%;top:" + (y * .98).toFixed(1) + "%;--hilo:" + hilo + "px;--dur:" + (4 + Math.random() * 3).toFixed(1) + "s;--d:" + (-Math.random() * 4).toFixed(1) + "s";
      var h = document.createElement("div");
      h.className = "colgajo__hilo";
      c.appendChild(h);
      c.appendChild(flor([formas[i % formas.length], 0, 0, i % 2 ? 6 : 8, Math.random() * 40 - 20], i));
      el.appendChild(c);
    }
  }

  // --- Acuarela: secado al cargar, difuminado con el scroll, leve parallax con puntero/giroscopio ---
  var acuarela, nitida, difusa;
  var objetivo = { x: 0, y: 0 }, actual = { x: 0, y: 0 };
  var scrollSuave = 0, inicioSecado = 0, secado = 0;
  var corriendo = false, previo = 0;

  function pedir() {
    if (corriendo || !acuarela) return;
    corriendo = true;
    previo = 0;
    requestAnimationFrame(cuadro);
  }

  function alMover(x, y) { objetivo.x = x; objetivo.y = y; pedir(); }

  if (!reducido) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      alMover(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5);
    }, { passive: true });
    window.addEventListener("deviceorientation", function (e) {
      if (e.gamma == null) return;
      alMover(Math.max(-1, Math.min(1, e.gamma / 30)) * .5, Math.max(-1, Math.min(1, (e.beta - 40) / 30)) * .5);
    }, { passive: true });
  }
  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir, { passive: true });

  function suavizar(t) { return t * t * (3 - 2 * t); }

  function cuadro(t) {
    var dt = previo ? Math.min(t - previo, 64) : 16.7;
    previo = t;
    // Suavizado independiente de la tasa de refresco
    var k = reducido ? 1 : 1 - Math.pow(.9, dt / 16.7);
    var kp = reducido ? 1 : 1 - Math.pow(.94, dt / 16.7);

    var meta = Math.min(1, window.scrollY / (innerHeight * .85));
    scrollSuave += (meta - scrollSuave) * k;
    actual.x += (objetivo.x - actual.x) * kp;
    actual.y += (objetivo.y - actual.y) * kp;
    if (inicioSecado) secado = reducido ? 1 : Math.min(1, (t - inicioSecado) / 2600);

    var p = suavizar(scrollSuave), s = suavizar(secado);
    // Nítida aparece al secarse y se va con el scroll; la difusa toma su lugar, más tenue.
    nitida.style.opacity = (s * (1 - p)).toFixed(3);
    difusa.style.opacity = ((1 - s) * .7 * Math.min(1, secado * 6) + p * .55 * s).toFixed(3);
    acuarela.style.transform =
      "translate3d(" + (-actual.x * 14).toFixed(2) + "px," + (-actual.y * 10 - p * 40).toFixed(2) + "px,0) scale(" + (1 + p * .06).toFixed(4) + ")";

    var quieto = Math.abs(meta - scrollSuave) < .0005 && Math.abs(objetivo.x - actual.x) < .0004 &&
      Math.abs(objetivo.y - actual.y) < .0004 && (secado >= 1 || !inicioSecado);
    if (quieto) { corriendo = false; return; }
    requestAnimationFrame(cuadro);
  }

  function montar() {
    var capa = document.querySelector("[data-prensadas]");
    if (capa) prensadas(capa);

    acuarela = document.querySelector("[data-acuarela]");
    if (acuarela) {
      nitida = acuarela.querySelector(".acuarela__nitida");
      difusa = acuarela.querySelector(".acuarela__difusa");
      var listo = nitida.decode ? nitida.decode() : Promise.resolve();
      listo.catch(function () {}).then(function () {
        requestAnimationFrame(function (t) { inicioSecado = t; pedir(); });
      });
      pedir();
    }

    document.querySelectorAll("[data-ramo]").forEach(function (r) {
      (RAMOS[r.dataset.ramo] || []).forEach(function (d, i) { r.appendChild(flor(d, i)); });
    });
    document.querySelectorAll("[data-guirnalda]").forEach(guirnalda);
  }

  window.Flores = {
    montar: montar,
    florecer: function (el) { if (el) el.classList.add("florece"); }
  };
})();
