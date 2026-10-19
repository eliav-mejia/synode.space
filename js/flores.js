/* Flores 2.5D: capas con profundidad (fondo, medio, frente), parallax con puntero, giroscopio y scroll,
   florecimiento escalonado y balanceo. Las formas viven en el sprite SVG de index.html (#f-*). */
(function () {
  "use strict";

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // [forma, paleta, x %, y %, tamaño (vmin), giro (deg), profundidad 0–1, opacidad, espejo]
  // Protagonista: ave del paraíso (#f-paraiso, pico a la izquierda; espejo = 1 lo voltea hacia la derecha).
  var COMPOSICIONES = {
    portada: [
      ["eucalipto", "salvia", 7, 16, 30, -32, .2], ["hoja-paraiso", "paraiso", 24, 4, 24, -38, .2], ["espiga", "trigo", 31, 15, 22, 28, .2],
      ["gipsofila", "blanco", 15, 31, 22, -12, .2], ["eucalipto", "eucalipto", 92, 84, 30, 150, .2], ["hoja-paraiso", "paraiso", 75, 95, 26, 158, .2],
      ["gipsofila", "blanco", 86, 68, 22, 168, .2], ["hoja-paraiso", "paraiso", 94, 12, 18, 204, .2], ["eucalipto", "salvia", 5, 88, 24, 22, .2],
      ["espiga", "trigo", 96, 32, 16, -120, .2],

      ["paraiso", "paraiso", 12, 11, 30, -6, .5, 0, 1], ["paraiso", "paraiso", 27, 21, 17, 12, .5], ["abierta", "terracota", 3, 27, 9, -22, .5],
      ["abierta", "crema", 21, 3, 10, 10, .5], ["boton", "durazno", 17, 25, 8, -15, .5],
      ["paraiso", "paraiso", 87, 86, 32, 4, .5], ["paraiso", "paraiso", 73, 93, 18, -10, .5, 0, 1], ["abierta", "crema", 96, 74, 12, 20, .5],
      ["boton", "terracota", 82, 76, 9, 10, .5], ["abierta", "rubor", 93, 17, 9, 0, .5], ["paraiso", "paraiso", 8, 93, 15, 6, .5, 0, 1],
      ["abierta", "durazno", 97, 6, 8, 0, .5],

      ["hoja-paraiso", "paraiso", 1, 3, 28, 130, 1], ["paraiso", "paraiso", -1, 46, 16, 8, 1, .85, 1], ["hoja-paraiso", "paraiso", 99, 99, 28, -40, 1], ["paraiso", "paraiso", 101, 60, 14, -6, 1, .9]
    ],
    intro: [
      ["eucalipto", "salvia", 6, 10, 26, -30, .2], ["hoja-paraiso", "paraiso", 20, 4, 20, -34, .2], ["gipsofila", "blanco", 4, 24, 18, -10, .2],
      ["eucalipto", "eucalipto", 94, 90, 26, 150, .2], ["hoja-paraiso", "paraiso", 80, 96, 20, 156, .2], ["gipsofila", "blanco", 96, 76, 18, 170, .2],
      ["paraiso", "paraiso", 9, 7, 24, -4, .5, 0, 1], ["paraiso", "paraiso", 20, 14, 13, 14, .5], ["abierta", "terracota", 4, 18, 8, -10, .5],
      ["paraiso", "paraiso", 90, 93, 26, 4, .5], ["paraiso", "paraiso", 78, 98, 13, -8, .5, 0, 1], ["abierta", "crema", 97, 82, 10, 0, .5],
      ["hoja-paraiso", "paraiso", 0, 0, 22, 130, 1], ["paraiso", "paraiso", 100, 100, 15, 0, 1, .85]
    ],
    pie: [
      ["eucalipto", "salvia", 8, 70, 24, 20, .3], ["hoja-paraiso", "paraiso", 18, 90, 22, 14, .3], ["paraiso", "paraiso", 7, 90, 22, 0, .6, 0, 1],
      ["abierta", "terracota", 17, 78, 9, 0, .6], ["eucalipto", "eucalipto", 92, 70, 24, -20, .3], ["paraiso", "paraiso", 93, 90, 22, 0, .6],
      ["abierta", "crema", 84, 82, 11, 0, .6], ["gipsofila", "blanco", 76, 96, 16, 0, .3]
    ]
  };

  var RAMOS = {
    izq: [["eucalipto", "salvia", 30, 40, 9, -50, .5], ["hoja-paraiso", "paraiso", 55, 22, 7, 56, .5], ["paraiso", "paraiso", 34, 46, 9, -4, .5, 0, 1], ["abierta", "terracota", 58, 60, 4, 0, .5], ["boton", "crema", 64, 34, 4, 40, .5]],
    der: [["eucalipto", "eucalipto", 70, 40, 9, 50, .5], ["hoja-paraiso", "paraiso", 45, 22, 7, -56, .5], ["paraiso", "paraiso", 66, 46, 9, 4, .5], ["abierta", "rubor", 42, 60, 4, 0, .5], ["abierta", "terracota", 38, 38, 4, 0, .5]]
  };

  var NS = "http://www.w3.org/2000/svg";

  function flor(def, i) {
    var el = document.createElement("span");
    el.className = "flor pal-" + def[1] + (def[8] ? " flor--espejo" : "");
    var z = def[6];
    el.style.cssText =
      "--x:" + def[2] + "%;--y:" + def[3] + "%;--s:" + def[4] + ";--r:" + def[5] + "deg;--z:" + z +
      ";--o:" + (def[7] || (z < .3 ? .85 : 1)) +
      ";--d:" + (i * 0.07 + z * .3).toFixed(2) + "s;--dur:" + (5 + Math.random() * 4).toFixed(1) + "s;--amp:" + (2 + Math.random() * 3 * (1.2 - z)).toFixed(1) + "deg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-50 -50 100 100");
    var use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#f-" + def[0]);
    // Sin esto el símbolo se dibuja desde (0,0): desplazado medio tamaño y meciéndose fuera de su centro.
    use.setAttribute("x", "-50");
    use.setAttribute("y", "-50");
    use.setAttribute("width", "100");
    use.setAttribute("height", "100");
    svg.appendChild(use);
    el.appendChild(svg);
    return el;
  }

  function capas(jardin, lista) {
    var grupos = { fondo: [], medio: [], frente: [] };
    lista.forEach(function (d, i) {
      grupos[d[6] < .3 ? "fondo" : d[6] < .8 ? "medio" : "frente"].push(flor(d, i));
    });
    var hechas = [];
    Object.keys(grupos).forEach(function (n) {
      var capa = document.createElement("div");
      capa.className = "capa capa--" + n;
      capa._prof = n === "fondo" ? .25 : n === "medio" ? .6 : 1.2;
      grupos[n].forEach(function (f) { capa.appendChild(f); });
      jardin.appendChild(capa);
      hechas.push(capa);
    });
    return hechas;
  }

  function petalos(jardin, n) {
    if (reducido) return;
    var tonos = [["#FFC66E", "#F28C35"], ["#FDF7EA", "#EADBC0"], ["#E59572", "#C8613F"], ["#F9E5D3", "#F0C9A8"]];
    for (var i = 0; i < n; i++) {
      var p = document.createElement("span");
      var t = tonos[i % tonos.length];
      p.className = "petalo-cae";
      p.style.cssText = "--x:" + (Math.random() * 100).toFixed(1) + "%;--s:" + (8 + Math.random() * 9).toFixed(0) + "px;--c1:" + t[0] + ";--c2:" + t[1] +
        ";--dur:" + (11 + Math.random() * 9).toFixed(1) + "s;--d:" + (-Math.random() * 18).toFixed(1) + "s;--dx:" + (Math.random() * 120 - 60).toFixed(0) + "px";
      jardin.appendChild(p);
    }
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
    var formas = ["paraiso", "abierta", "boton", "paraiso", "abierta", "gipsofila"];
    var pals = ["paraiso", "crema", "terracota", "paraiso", "durazno", "blanco", "rubor"];
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
      var forma = formas[i % formas.length];
      // El ave del paraíso cuelga casi derecha (giro pequeño) y alterna hacia dónde mira.
      c.appendChild(flor([forma, pals[i % pals.length], 0, 0, i % 2 ? 6 : 8, forma === "paraiso" ? Math.random() * 16 - 8 : Math.random() * 60 - 30, .5, 0, i % 4 === 0], i));
      el.appendChild(c);
    }
  }

  // --- Parallax ---
  // El bucle solo corre mientras algo se mueve (puntero, giroscopio, scroll) y se duerme al asentarse.
  // Suavizado independiente de la tasa de refresco: igual a 60, 90 o 120 Hz.
  var activas = [];
  var objetivo = { x: 0, y: 0 }, actual = { x: 0, y: 0 };
  var corriendo = false, previo = 0, scrollPrevio = -1;

  function pedir() {
    if (corriendo || reducido) return;
    corriendo = true;
    previo = 0;
    requestAnimationFrame(cuadro);
  }

  function alMover(x, y) { objetivo.x = x; objetivo.y = y; pedir(); }

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    alMover(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5);
  }, { passive: true });

  window.addEventListener("deviceorientation", function (e) {
    if (e.gamma == null) return;
    alMover(Math.max(-1, Math.min(1, e.gamma / 30)) * .5, Math.max(-1, Math.min(1, (e.beta - 40) / 30)) * .5);
  }, { passive: true });

  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir, { passive: true });

  function cuadro(t) {
    var dt = previo ? Math.min(t - previo, 64) : 16.7;
    previo = t;
    var k = 1 - Math.pow(.93, dt / 16.7);
    actual.x += (objetivo.x - actual.x) * k;
    actual.y += (objetivo.y - actual.y) * k;

    // Primero todas las lecturas de layout, luego todas las escrituras (sin layout forzado por cuadro).
    var rects = [];
    for (var i = 0; i < activas.length; i++) rects.push(activas[i].jardin.getBoundingClientRect());

    for (i = 0; i < activas.length; i++) {
      var a = activas[i], rect = rects[i];
      if (rect.bottom < -50 || rect.top > innerHeight + 50) continue;
      var desde = a.fijo ? 0 : rect.top;
      for (var j = 0; j < a.capas.length; j++) {
        var c = a.capas[j], p = c._prof;
        var tx = -actual.x * 30 * p;
        var ty = -actual.y * 24 * p + (a.fijo ? 0 : -desde * .08 * p);
        c.style.transform = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0) rotateX(" + (-actual.y * 3 * p).toFixed(2) + "deg) rotateY(" + (actual.x * 4.5 * p).toFixed(2) + "deg)";
      }
    }

    var sy = window.scrollY;
    var quieto = Math.abs(objetivo.x - actual.x) < .0004 && Math.abs(objetivo.y - actual.y) < .0004 && sy === scrollPrevio;
    scrollPrevio = sy;
    if (quieto) { corriendo = false; return; }
    requestAnimationFrame(cuadro);
  }

  function montar() {
    document.querySelectorAll("[data-jardin]").forEach(function (j) {
      var lista = COMPOSICIONES[j.dataset.jardin];
      if (!lista) return;
      activas.push({ jardin: j, capas: capas(j, lista), fijo: j.dataset.jardin === "intro" });
      if (j.dataset.jardin === "portada") petalos(j, 14);
      if (j.dataset.jardin === "intro") petalos(j, 8);
    });
    document.querySelectorAll("[data-ramo]").forEach(function (r) {
      (RAMOS[r.dataset.ramo] || []).forEach(function (d, i) {
        r.appendChild(flor(d, i));
      });
    });
    document.querySelectorAll("[data-guirnalda]").forEach(guirnalda);
    pedir();
  }

  window.Flores = {
    montar: montar,
    florecer: function (el) { if (el) el.classList.add("florece"); }
  };
})();
