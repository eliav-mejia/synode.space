/* Sello de entrada: relieve A & E en papel crema. El scroll queda bloqueado (html.sellado) hasta que el sitio
   terminó de cargar y se tocó el sello. Secuencia: la perforadora baja → el sello se levanta → la invitación aparece.
   Atajo para pruebas: synode.space/#abierta abre sin esperar. */
(function () {
  "use strict";

  var html = document.documentElement;
  var intro = document.getElementById("intro");
  var sello = document.getElementById("sello");
  if (!intro || !sello) { html.classList.remove("sellado"); html.classList.add("abierta"); return; }
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

  // Listo = página cargada + fuentes, con un mínimo para que el sello se vea llegar y un tope para redes lentas.
  var cargado = new Promise(function (ok) {
    if (document.readyState === "complete") ok(); else window.addEventListener("load", ok, { once: true });
  });
  var fuentes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var minimo = new Promise(function (ok) { setTimeout(ok, reducido ? 200 : 900); });
  var tope = new Promise(function (ok) { setTimeout(ok, 8000); });

  Promise.race([Promise.all([cargado, fuentes, minimo]), tope]).then(function () {
    intro.classList.add("listo");
    sello.disabled = false;
    if (location.hash === "#abierta") abrir(true);
  });

  function despues(ms, fn) { setTimeout(fn, reducido ? Math.min(ms, 200) : ms); }

  function abrir(rapido) {
    if (abierto) return;
    abierto = true;
    if (navigator.vibrate) { try { navigator.vibrate(14); } catch (e) {} }
    var t = rapido ? .15 : 1;
    intro.classList.add("abriendo");
    despues(520 * t, function () { intro.classList.add("se-va"); });
    despues(900 * t, function () {
      html.classList.remove("sellado");
      html.classList.add("abierta");
      window.scrollTo(0, 0);
      document.dispatchEvent(new CustomEvent("invitacion:abierta"));
    });
    despues(2400 * t, function () {
      intro.remove();
      var h = document.querySelector(".nombres");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    });
  }

  sello.addEventListener("click", function () { abrir(false); });
})();
