/* Sobre con sello de cera. El scroll queda bloqueado (html.sellado) hasta que el sitio terminó de cargar
   y el sello se abrió. Secuencia lenta: sello se parte → solapa gira → carta sale → la invitación aparece.
   Atajo para pruebas: synode.space/#abierta salta la animación. */
(function () {
  "use strict";

  var html = document.documentElement;
  var intro = document.getElementById("intro");
  var sobre = document.getElementById("sobre");
  var sello = document.getElementById("sello");
  var main = document.getElementById("invitacion");
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
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].indexOf(e.key) > -1 && e.target !== sello) e.preventDefault();
  });

  window.Flores.montar();

  // Listo = página cargada (imágenes, estilos) + fuentes, con un mínimo para que el sobre se vea entrar.
  var cargado = new Promise(function (ok) {
    if (document.readyState === "complete") ok(); else window.addEventListener("load", ok, { once: true });
  });
  var fuentes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var minimo = new Promise(function (ok) { setTimeout(ok, reducido ? 200 : 1200); });
  var tope = new Promise(function (ok) { setTimeout(ok, 8000); }); // red lenta: no dejar a nadie esperando

  Promise.race([Promise.all([cargado, fuentes, minimo]), tope]).then(function () {
    intro.classList.add("listo");
    sello.disabled = false;
    window.Flores.florecer(intro.querySelector("[data-jardin]"));
    if (location.hash === "#abierta") abrir(true);
  });

  function despues(ms, fn) { setTimeout(fn, reducido ? Math.min(ms, 300) : ms); }

  function abrir(rapido) {
    if (abierto) return;
    abierto = true;
    if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) {} }
    intro.classList.add("abriendo");

    // iOS 13+: el permiso del giroscopio se pide con un gesto; el toque del sello sirve.
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().catch(function () {});
    }

    var t = rapido ? 0.15 : 1;
    sobre.classList.add("roto");
    despues(700 * t, function () { sobre.classList.add("abierta"); });
    despues(1750 * t, function () { sobre.classList.add("solapa-atras"); });
    despues(2700 * t, function () { sobre.classList.add("carta-sale"); });
    despues(5000 * t, function () {
      html.classList.remove("sellado");
      window.scrollTo(0, 0);
      html.classList.add("revelada");
      main.removeAttribute("aria-hidden");
      intro.classList.add("se-va");
      document.dispatchEvent(new CustomEvent("invitacion:abierta"));
    });
    despues(6600 * t, function () {
      intro.remove();
      var h = document.querySelector(".nombres");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    });
  }

  sello.addEventListener("click", function () { abrir(false); });
  // Tocar cualquier parte del sobre también abre, una vez listo.
  sobre.addEventListener("click", function (e) {
    if (!sello.disabled && e.target !== sello && !sello.contains(e.target)) abrir(false);
  });
})();
