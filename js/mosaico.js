/* Variante mosaico: al tocar o hacer clic, el papel se cuartea como un mosaico de azulejo roto (trencadís).
   Las grietas se dibujan desde el punto tocado, las teselas aparecen del centro hacia afuera
   y luego se desprenden y caen. Solo corre en html[data-variante="mosaico"]. */
(function () {
  "use strict";

  if (document.documentElement.dataset.variante !== "mosaico") return;

  var NS = "http://www.w3.org/2000/svg";
  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TESELAS = ["#F4EEE2", "#E9D3C6", "#C3CDB6", "#B9C9CC", "#EDE0BF", "#A8502E", "#4F6F78", "#FBF8F2"];
  var activas = 0;

  function azar(a, b) { return a + Math.random() * (b - a); }
  function punto(r, a) { return [Math.cos(a) * r, Math.sin(a) * r]; }
  function pts(lista) { return lista.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "); }

  function cuartear(x, y) {
    if (activas > 5) return;
    activas++;
    var R = azar(90, 150), lado = Math.ceil(R * 2.6);
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "grieta");
    svg.setAttribute("viewBox", [-lado / 2, -lado / 2, lado, lado].join(" "));
    svg.setAttribute("aria-hidden", "true");
    svg.style.left = (x - lado / 2) + "px";
    svg.style.top = (y - lado / 2) + "px";
    svg.style.width = svg.style.height = lado + "px";

    // Radios irregulares cortados por dos anillos: cada celda es una tesela
    var n = Math.round(azar(7, 11)), angulos = [];
    for (var i = 0; i < n; i++) angulos.push((i + azar(-.3, .3)) / n * Math.PI * 2);
    var anillos = [0, R * azar(.22, .32), R * azar(.55, .68), R];
    var vertice = anillos.map(function (r, k) {
      return angulos.map(function (a) { return k === 0 ? [0, 0] : punto(r * azar(.86, 1.1), a + azar(-.06, .06)); });
    });

    var grietas = "";
    var teselas = [];
    for (var k = 0; k < 3; k++) {
      for (var j = 0; j < n; j++) {
        var j2 = (j + 1) % n;
        var forma = k === 0 ? [[0, 0], vertice[1][j], vertice[1][j2]] : [vertice[k][j], vertice[k + 1][j], vertice[k + 1][j2], vertice[k][j2]];
        var p = document.createElementNS(NS, "polygon");
        p.setAttribute("points", pts(forma));
        p.setAttribute("fill", TESELAS[Math.floor(Math.random() * TESELAS.length)]);
        var cx = 0, cy = 0;
        forma.forEach(function (q) { cx += q[0] / forma.length; cy += q[1] / forma.length; });
        teselas.push({ el: p, cx: cx, cy: cy, k: k });
        svg.appendChild(p);
        grietas += "M" + pts([vertice[k][j], vertice[k + 1][j]]).replace(" ", "L");
      }
      grietas += "M" + pts(vertice[k + 1].concat([vertice[k + 1][0]])).split(" ").join("L");
    }
    var linea = document.createElementNS(NS, "path");
    linea.setAttribute("d", grietas);
    linea.setAttribute("class", "grieta__linea");
    svg.appendChild(linea);
    document.body.appendChild(svg);

    var fin = function () { svg.remove(); activas--; };
    if (reducido || !svg.animate) {
      setTimeout(function () { svg.style.opacity = "0"; }, 500);
      setTimeout(fin, 900);
      return;
    }

    var largo = linea.getTotalLength ? linea.getTotalLength() : 2000;
    linea.style.strokeDasharray = largo;
    linea.animate([{ strokeDashoffset: largo }, { strokeDashoffset: 0 }], { duration: 260, easing: "ease-out", fill: "forwards" });
    linea.animate([{ opacity: 1 }, { opacity: 0 }], { delay: 1100, duration: 500, fill: "forwards" });

    teselas.forEach(function (t) {
      var d = Math.hypot(t.cx, t.cy) || 1, ux = t.cx / d, uy = t.cy / d;
      var giro = azar(-24, 24), caida = azar(40, 110);
      t.el.style.transformOrigin = t.cx.toFixed(1) + "px " + t.cy.toFixed(1) + "px";
      t.el.animate([
        { transform: "scale(.4)", opacity: 0 },
        { transform: "scale(1)", opacity: .92, offset: .18 },
        { transform: "translate(" + (ux * 3) + "px," + (uy * 3) + "px) scale(.97)", opacity: .92, offset: .55 },
        { transform: "translate(" + (ux * 26) + "px," + (uy * 26 + caida) + "px) rotate(" + giro + "deg) scale(.8)", opacity: 0 }
      ], { duration: 1700, delay: t.k * 70, easing: "cubic-bezier(.3,.7,.4,1)", fill: "forwards" });
    });
    setTimeout(fin, 1700 + 3 * 70 + 50);
  }

  document.addEventListener("pointerdown", function (e) {
    if (e.button > 0) return;
    if (e.target.closest("a, button, input, select, textarea, label, .variantes")) return;
    cuartear(e.clientX, e.clientY);
  });
})();
