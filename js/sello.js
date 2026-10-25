/* Entrada de la invitación. El scroll queda bloqueado (html.sellado) hasta que el sitio terminó de cargar y se abrió.
   - Variante sello:   se toca el sello de cera; la perforadora baja, el sello se levanta y la invitación aparece.
   - Variante mosaico: se toca el damasco; el azulejo se cuartea desde ese punto y las teselas caen dejando ver la invitación.
   Atajo para pruebas: synode.space/#abierta abre sin esperar. */
(function () {
  "use strict";

  var html = document.documentElement;
  var intro = document.getElementById("intro");
  var sello = document.getElementById("sello");
  var romperBtn = document.getElementById("romper");
  var mosaico = html.dataset.variante === "mosaico";
  var disparador = mosaico ? romperBtn : sello;

  function quedaAbierta() {
    html.classList.remove("sellado");
    html.classList.add("abierta");
    document.dispatchEvent(new CustomEvent("invitacion:abierta"));
  }
  if (!intro || !disparador) { if (intro) intro.remove(); quedaAbierta(); return; }

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var abierto = false;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  // Mientras está sellado no hay scroll ni en táctil ni con teclado.
  function bloquear(e) { if (html.classList.contains("sellado")) e.preventDefault(); }
  window.addEventListener("touchmove", bloquear, { passive: false });
  window.addEventListener("wheel", bloquear, { passive: false });
  window.addEventListener("keydown", function (e) {
    if (!html.classList.contains("sellado")) return;
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].indexOf(e.key) > -1 && e.target !== disparador) e.preventDefault();
  });

  // El damasco a todo color se precarga para poder romperlo en un lienzo
  var damasco = null;
  if (mosaico) {
    damasco = new Image();
    damasco.src = "img/escenas/fondo-damasco-color.webp";
  }

  // Listo = página cargada + fuentes, con un mínimo para que la entrada se vea llegar y un tope para redes lentas.
  var cargado = new Promise(function (ok) {
    if (document.readyState === "complete") ok(); else window.addEventListener("load", ok, { once: true });
  });
  var fuentes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var imagen = damasco && damasco.decode ? damasco.decode().catch(function () {}) : Promise.resolve();
  var minimo = new Promise(function (ok) { setTimeout(ok, reducido ? 200 : 900); });
  var tope = new Promise(function (ok) { setTimeout(ok, 8000); });

  Promise.race([Promise.all([cargado, fuentes, imagen, minimo]), tope]).then(function () {
    intro.classList.add("listo");
    disparador.disabled = false;
    if (location.hash === "#abierta") { if (mosaico) romper(innerWidth / 2, innerHeight / 2, true); else abrir(true); }
  });

  function despues(ms, fn) { setTimeout(fn, reducido ? Math.min(ms, 200) : ms); }
  function vibrar(rapido) { if (!rapido && navigator.vibrate) { try { navigator.vibrate(14); } catch (e) {} } }
  function enfocarNombres() {
    var h = document.querySelector(".nombres");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  // ---------- Sello de cera ----------
  function abrir(rapido) {
    if (abierto) return;
    abierto = true;
    vibrar(rapido);
    var t = rapido ? .15 : 1;
    intro.classList.add("abriendo");
    despues(520 * t, function () { intro.classList.add("se-va"); });
    despues(900 * t, function () { quedaAbierta(); window.scrollTo(0, 0); });
    despues(2400 * t, function () { intro.remove(); enfocarNombres(); });
  }

  // ---------- Mosaico que se rompe ----------
  function romper(x, y, rapido) {
    if (abierto) return;
    abierto = true;
    vibrar(rapido);
    if (reducido || rapido || !damasco || !damasco.naturalWidth) {
      intro.classList.add("se-va");
      quedaAbierta();
      despues(1400, function () { intro.remove(); enfocarNombres(); });
      return;
    }

    var W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    // Fondo en un lienzo aparte, recortado igual que «background-size: cover»
    var fondo = document.createElement("canvas");
    fondo.width = W * dpr; fondo.height = H * dpr;
    var fx = fondo.getContext("2d");
    var esc = Math.max(W / damasco.naturalWidth, H / damasco.naturalHeight);
    var dw = damasco.naturalWidth * esc, dh = damasco.naturalHeight * esc;
    fx.drawImage(damasco, (W - dw) / 2 * dpr, (H - dh) / 2 * dpr, dw * dpr, dh * dpr);

    var lienzo = document.createElement("canvas");
    lienzo.className = "mosaico-lienzo";
    lienzo.width = W * dpr; lienzo.height = H * dpr;
    var cx = lienzo.getContext("2d");
    cx.scale(dpr, dpr);
    document.body.appendChild(lienzo);

    // Teselas: rejilla irregular partida en triángulos
    var lado = W < 600 ? 78 : 112;
    var cols = Math.max(4, Math.round(W / lado)), filas = Math.max(5, Math.round(H / lado));
    var p = [];
    for (var j = 0; j <= filas; j++) {
      p.push([]);
      for (var i = 0; i <= cols; i++) {
        var borde = i === 0 || j === 0 || i === cols || j === filas;
        p[j].push([i / cols * W + (borde ? 0 : (Math.random() - .5) * W / cols * .7), j / filas * H + (borde ? 0 : (Math.random() - .5) * H / filas * .7)]);
      }
    }
    var teselas = [], lejos = Math.hypot(Math.max(x, W - x), Math.max(y, H - y));
    function tesela(pts) {
      var mx = 0, my = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach(function (q) {
        mx += q[0] / pts.length; my += q[1] / pts.length;
        x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]);
      });
      var d = Math.hypot(mx - x, my - y) || 1;
      var fuerza = 80 + Math.random() * 220;
      teselas.push({
        pts: pts, mx: mx, my: my, caja: [x0, y0, x1 - x0, y1 - y0], d: d,
        espera: 240 + d / lejos * 520 + Math.random() * 90,
        vx: (mx - x) / d * fuerza, vy: (my - y) / d * fuerza * .5 - 120 - Math.random() * 160,
        giro: (Math.random() - .5) * 6
      });
    }
    for (j = 0; j < filas; j++) for (i = 0; i < cols; i++) {
      var a = p[j][i], b = p[j][i + 1], c = p[j + 1][i + 1], d = p[j + 1][i];
      if (Math.random() < .5) { tesela([a, b, c]); tesela([a, c, d]); } else { tesela([a, b, d]); tesela([b, c, d]); }
    }

    // El damasco del intro se sustituye por el lienzo; detrás, la invitación ya está abierta
    intro.classList.add("rompiendo");
    quedaAbierta();
    window.scrollTo(0, 0);

    var inicio = performance.now(), CAIDA = 1000, G = 2200;
    function trazar(t) {
      cx.beginPath();
      cx.moveTo(t.pts[0][0], t.pts[0][1]);
      for (var k = 1; k < t.pts.length; k++) cx.lineTo(t.pts[k][0], t.pts[k][1]);
      cx.closePath();
    }
    function cuadro(ahora) {
      var dt = ahora - inicio, vivas = 0;
      cx.clearRect(0, 0, W, H);
      // Las grietas avanzan desde el punto tocado
      var alcance = Math.min(1, dt / 360) * lejos * 1.05;
      teselas.forEach(function (t) {
        var s = (dt - t.espera) / 1000;
        if (s > CAIDA / 1000) return;
        vivas++;
        cx.save();
        if (s > 0) {
          cx.globalAlpha = Math.max(0, 1 - s / (CAIDA / 1000));
          cx.translate(t.mx + t.vx * s, t.my + t.vy * s + G * s * s / 2);
          cx.rotate(t.giro * s);
          cx.translate(-t.mx, -t.my);
        }
        trazar(t);
        cx.save();
        cx.clip();
        cx.drawImage(fondo, t.caja[0] * dpr, t.caja[1] * dpr, t.caja[2] * dpr + 2, t.caja[3] * dpr + 2, t.caja[0], t.caja[1], t.caja[2] + 2 / dpr, t.caja[3] + 2 / dpr);
        cx.restore();
        if (t.d < alcance) {
          // Junta blanca de azulejo y grieta oscura
          cx.lineJoin = "round";
          cx.strokeStyle = "rgba(255, 255, 255, .9)"; cx.lineWidth = s > 0 ? 2 : 1.4; cx.stroke();
          cx.strokeStyle = "rgba(20, 28, 60, .55)"; cx.lineWidth = .7; cx.stroke();
        }
        cx.restore();
      });
      if (vivas) requestAnimationFrame(cuadro);
      else { lienzo.remove(); intro.remove(); enfocarNombres(); }
    }
    requestAnimationFrame(cuadro);
  }

  if (mosaico) {
    // Toda la pantalla rompe el mosaico, desde donde se tocó; el botón sirve con teclado (rompe desde el centro)
    intro.addEventListener("click", function (e) {
      if (disparador.disabled || e.target.closest(".variantes")) return;
      var r = romperBtn.getBoundingClientRect();
      var teclado = e.detail === 0;
      romper(teclado ? r.left + r.width / 2 : e.clientX, teclado ? r.top + r.height / 2 : e.clientY, false);
    });
  } else {
    sello.addEventListener("click", function () { abrir(false); });
  }
})();
