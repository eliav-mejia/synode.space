/* Recorrido automático: ya abierta la invitación, la página baja sola de parada en parada, dejando en cada una
   el tiempo justo para leerla (según cuánto texto hay). En cuanto la persona navega por su cuenta (rueda, toque,
   teclado, clic o al escribir en el RSVP) el recorrido se suspende; si deja de moverse un rato, sigue desde
   donde quedó. Termina en el pie. Igual en todas las variantes; no corre con «menos movimiento». */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var html = document.documentElement;
  var REANUDA = 7000;          // quietud necesaria tras navegar a mano para retomar el recorrido
  var activo = false, animando = 0, espera = 0, enFormulario = false;

  // Tiempo de lectura: base más ~30 ms por carácter; las fotos piden un poco más
  function lectura(texto, fotos) {
    return Math.min(9000, Math.max(3200, 2200 + texto.length * 30 + (fotos || 0) * 1400));
  }
  function textoPropio(fase) {
    return Array.prototype.filter.call(fase.querySelectorAll(".prensa"), function (p) {
      return p.parentElement.closest("[data-fase]") === fase;
    }).map(function (p) { return p.textContent; }).join(" ").replace(/\s+/g, " ").trim();
  }

  // Paradas: [scrollY, ms de lectura], calculadas cada vez (las imágenes y el tamaño de ventana cambian el alto)
  function paradas() {
    var vh = innerHeight, lista = [];
    document.querySelectorAll("[data-escena]").forEach(function (esc) {
      var top = esc.getBoundingClientRect().top + scrollY, total = esc.offsetHeight - vh;
      esc.querySelectorAll("[data-fase]").forEach(function (f) {
        var r = f.dataset.fase.split(/\s+/).map(Number), b = Math.min(r[1], 1);
        // Una fase que contiene otra se lee al empezar; las demás, ya bien impresas
        var p = f.querySelector("[data-fase]") ? r[0] : r[0] + (b - r[0]) * .4;
        lista.push([top + total * p, lectura(textoPropio(f))]);
      });
    });
    document.querySelectorAll("main > section:not([data-escena]), main > footer").forEach(function (s) {
      var r = s.getBoundingClientRect(), top = r.top + scrollY, h = r.height;
      var fotos = s.querySelectorAll(".foto").length;
      var texto = s.textContent.replace(/\s+/g, " ").trim();
      if (h <= vh * .9) { lista.push([top + h / 2 - vh / 2, lectura(texto, fotos)]); return; }
      // Secciones altas: se recorren por tramos de media pantalla
      var tramos = Math.ceil((h - vh) / (vh * .6)) + 1;
      for (var i = 0; i < tramos; i++) {
        lista.push([Math.min(top - vh * .06 + i * vh * .6, top + h - vh), lectura(texto.slice(0, texto.length / tramos), fotos / tramos)]);
      }
    });
    var max = document.documentElement.scrollHeight - vh;
    return lista.map(function (p) { return [Math.max(0, Math.min(max, Math.round(p[0]))), p[1]]; })
      .sort(function (a, b) { return a[0] - b[0]; });
  }

  function siguiente() {
    var y = scrollY;
    return paradas().filter(function (p) { return p[0] > y + 8; })[0];
  }

  function suave(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  // Desliza hasta la parada y espera a que se lea
  function avanzar() {
    espera = 0;
    if (!activo) return;
    var p = siguiente();
    if (!p) { activo = false; return; }
    var desde = scrollY, dist = p[0] - desde;
    var dur = Math.min(4800, Math.max(1400, dist * 1.1)), t0 = performance.now();
    function paso(ahora) {
      var t = Math.min(1, (ahora - t0) / dur);
      window.scrollTo({ top: desde + dist * suave(t), behavior: "instant" });
      if (t < 1) animando = requestAnimationFrame(paso);
      else { animando = 0; espera = setTimeout(avanzar, p[1]); }
    }
    animando = requestAnimationFrame(paso);
  }

  function detener() {
    if (animando) cancelAnimationFrame(animando);
    clearTimeout(espera);
    animando = 0; espera = 0;
  }

  // Navegación a mano: se suspende y, tras un rato de quietud, se retoma desde ahí
  function aMano() {
    if (!activo) return;
    detener();
    if (!enFormulario && !document.hidden) espera = setTimeout(avanzar, REANUDA);
  }
  ["wheel", "touchstart", "pointerdown"].forEach(function (ev) { window.addEventListener(ev, aMano, { passive: true }); });
  window.addEventListener("keydown", aMano);
  document.addEventListener("visibilitychange", aMano);
  document.addEventListener("focusin", function (e) { if (e.target.closest("form")) { enFormulario = true; aMano(); } });
  document.addEventListener("focusout", function (e) { if (e.target.closest("form")) { enFormulario = false; aMano(); } });

  // Empieza al abrir la invitación (el primer toque); la portada se lee mientras se retira la entrada
  function empezar() {
    if (activo) return;
    activo = true;
    var p = paradas()[0];
    espera = setTimeout(avanzar, (p ? p[1] : 3200) + 1500);
  }
  if (html.classList.contains("sellado")) document.addEventListener("invitacion:abierta", empezar, { once: true });
  else empezar();
})();
