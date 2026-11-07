/* Escenas: parallax de las capas de acuarela y texto que se imprime por fases según el scroll.
   Cada [data-escena] es alta (≈330vh) con un escenario fijo (sticky); su avance p va de 0 a 1.
   - [data-capa]  se desplaza p·data-y (vh), p·data-x (vw) y escala 1 + p·data-s.
   - [data-fase="a b"]  imprime su tinta mientras a ≤ p < b.
   - [data-zoom="a b"]  la cámara se acerca entre a y b: lleva la puerta (data-puerta, fracción de la primera capa)
     al centro horizontal y a --zoom-y de alto, y escala hasta --zoom (variables CSS de la escena).
     data-hueco = ancho del hueco entre las hojas abiertas (fracción de la capa) → --hueco-texto en la escena.
   - [data-abre="a b"]  recibe --abre de 0 a 1 entre a y b (el portón gira con CSS).
   Fuera de las escenas, cada .prensa se imprime al entrar en pantalla, y [data-vel] da parallax a las fotos. */
(function () {
  "use strict";

  var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Letra por letra: el texto queda legible para lectores de pantalla ---
  document.querySelectorAll(".letras").forEach(function (el) {
    var texto = el.textContent.trim();
    el.textContent = "";
    var sr = document.createElement("span");
    sr.className = "sr";
    sr.textContent = texto;
    var tipos = document.createElement("span");
    tipos.className = "letras__tipos";
    tipos.setAttribute("aria-hidden", "true");
    Array.from(texto).forEach(function (c, i) {
      var l = document.createElement("span");
      l.className = "letra";
      l.style.setProperty("--li", i);
      l.textContent = c === " " ? " " : c;
      tipos.appendChild(l);
    });
    el.appendChild(sr);
    el.appendChild(tipos);
  });

  // La tinta y la acuarela esperan a que se abra el sello (js/sello.js)
  var html = document.documentElement;
  // Variante tinta: la acuarela se cambia por las ilustraciones a pluma antes de esperar a que carguen
  if (window.CONTENIDO_TINTA) document.querySelectorAll("[data-tinta]").forEach(function (img) { img.src = img.dataset.tinta; });
  var abierta = !html.classList.contains("sellado");
  var alAbrir = [];
  document.addEventListener("invitacion:abierta", function () {
    abierta = true;
    alAbrir.forEach(function (fn) { fn(); });
    pedir();
  });

  // --- La acuarela se seca al cargar cada capa ---
  document.querySelectorAll("[data-capa]").forEach(function (img) {
    // Un contenedor (el portón) no tiene «load»: se da por cargado de inmediato
    if (img.tagName !== "IMG") { if (abierta) img.classList.add("lista"); else alAbrir.push(function () { img.classList.add("lista"); }); return; }
    var listo = function () { if (abierta) img.classList.add("lista"); else alAbrir.push(function () { img.classList.add("lista"); }); };
    if (img.complete && img.naturalWidth) listo();
    else { img.addEventListener("load", listo, { once: true }); img.addEventListener("error", listo, { once: true }); }
  });

  // --- Fases: imprime solo la tinta propia (no la de una fase anidada) ---
  function prensasDe(fase) {
    return Array.prototype.filter.call(fase.querySelectorAll(".prensa"), function (p) {
      return p.parentElement.closest("[data-fase]") === fase;
    });
  }
  function imprimir(fase, si) {
    if (fase.on === si) return;
    fase.on = si;
    fase.el.classList.toggle("impresa", si);
    fase.prensas.forEach(function (p, i) {
      p.style.setProperty("--rd", (si ? i * .14 : 0) + "s");
      p.classList.toggle("impresa", si);
    });
  }

  var escenas = Array.prototype.map.call(document.querySelectorAll("[data-escena]"), function (el) {
    return {
      el: el,
      capas: Array.prototype.map.call(el.querySelectorAll("[data-capa]"), function (c) {
        return { el: c, x: +c.dataset.x || 0, y: +c.dataset.y || 0, s: +c.dataset.s || 0 };
      }),
      fases: Array.prototype.map.call(el.querySelectorAll("[data-fase]"), function (f) {
        var r = f.dataset.fase.split(/\s+/).map(Number);
        return { el: f, a: r[0], b: r[1], on: null, prensas: prensasDe(f) };
      }),
      zoom: (function () {
        var z = el.querySelector("[data-zoom]");
        if (!z) return null;
        var r = z.dataset.zoom.split(/\s+/).map(Number), pu = (z.dataset.puerta || ".5 .7").split(/\s+/).map(Number);
        return { el: z, a: r[0], b: r[1], px: pu[0], py: pu[1], hueco: +z.dataset.hueco || 0, ref: z.querySelector("[data-capa]") };
      })(),
      abre: Array.prototype.map.call(el.querySelectorAll("[data-abre]"), function (a) {
        var r = a.dataset.abre.split(/\s+/).map(Number);
        return { el: a, a: r[0], b: r[1] };
      }),
      p: 0, meta: 0
    };
  });

  // Teclado: al enfocar algo dentro de una fase oculta, llevar el scroll a esa fase.
  escenas.forEach(function (e) {
    e.fases.forEach(function (f) {
      f.el.addEventListener("focusin", function () {
        if (f.on) return;
        var total = e.el.offsetHeight - innerHeight;
        var top = e.el.getBoundingClientRect().top + scrollY;
        scrollTo({ top: top + total * Math.min(.99, (f.a + Math.min(f.b, 1)) / 2), behavior: "auto" });
      });
    });
  });

  var desliza = document.querySelector(".desliza");
  var fotos = Array.prototype.map.call(document.querySelectorAll("[data-vel]"), function (el) { return { el: el, v: +el.dataset.vel }; });

  // Cámara: punto de la puerta en pantalla según el ancho real de la capa y el encuadre --cx de la escena
  function acercar(e) {
    var z = e.zoom, t = Math.min(1, Math.max(0, (e.p - z.a) / (z.b - z.a)));
    var k = t * t * (3 - 2 * t);
    var cs = getComputedStyle(e.el);
    var S = parseFloat(cs.getPropertyValue("--zoom")) || 1.6;
    var objY = parseFloat(cs.getPropertyValue("--zoom-y")) || .52;
    var cx = (parseFloat(cs.getPropertyValue("--cx")) || 50) / 100;
    var W = z.ref.offsetWidth, H = z.ref.offsetHeight, vw = z.el.clientWidth, vh = z.el.clientHeight;
    var dx = vw / 2 - cx * W + z.px * W, dy = vh - H + z.py * H;
    // Hueco entre las hojas abiertas, ya acercado: el texto de la escena se centra ahí con margen (--hueco-texto)
    if (z.hueco) {
      var hueco = z.hueco * W * S, margen = Math.max(14, hueco * .1);
      e.el.style.setProperty("--hueco-texto", Math.max(120, hueco - 2 * margen).toFixed(0) + "px");
    }
    z.el.style.transformOrigin = dx.toFixed(1) + "px " + dy.toFixed(1) + "px";
    z.el.style.transform = "translate3d(" + ((vw / 2 - dx) * k).toFixed(1) + "px," + ((vh * objY - dy) * k).toFixed(1) + "px,0) scale(" + (1 + (S - 1) * k).toFixed(4) + ")";
  }

  var corriendo = false;
  function pedir() { if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); } }

  function cuadro() {
    var vh = innerHeight, vw = innerWidth, seguir = false;

    escenas.forEach(function (e) {
      var r = e.el.getBoundingClientRect();
      var total = Math.max(1, e.el.offsetHeight - vh);
      e.meta = Math.min(1, Math.max(0, -r.top / total));
      // Suavizado ligero para la rueda del ratón; directo si se prefiere menos movimiento
      e.p = reducido ? e.meta : e.p + (e.meta - e.p) * .16;
      if (Math.abs(e.meta - e.p) > .0005) seguir = true; else e.p = e.meta;

      e.fases.forEach(function (f) { imprimir(f, abierta && e.meta >= f.a && e.meta < f.b); });

      if (r.bottom < -vh * .2 || r.top > vh * 1.2) return;
      if (e.zoom) acercar(e);
      e.abre.forEach(function (a) {
        var t = Math.min(1, Math.max(0, (e.p - a.a) / (a.b - a.a)));
        a.el.style.setProperty("--abre", (t * t * (3 - 2 * t)).toFixed(4));
      });
      if (reducido) return;
      e.capas.forEach(function (c) {
        c.el.style.transform = "translate3d(" + (c.x * e.p * vw / 100).toFixed(1) + "px," + (c.y * e.p * vh / 100).toFixed(1) + "px,0)" +
          (c.s ? " scale(" + (1 + c.s * e.p).toFixed(4) + ")" : "");
      });
    });

    if (desliza) desliza.classList.toggle("oculto", escenas[0] && escenas[0].meta > .04);

    if (!reducido) fotos.forEach(function (f) {
      var r = f.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var d = (r.top + r.height / 2 - vh / 2);
      f.el.style.transform = "translate3d(0," + (d * f.v).toFixed(1) + "px,0)";
    });

    if (seguir) requestAnimationFrame(cuadro); else corriendo = false;
  }

  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir, { passive: true });
  pedir();

  // --- Tinta fuera de las escenas: se imprime al entrar en pantalla, en orden ---
  var sueltas = Array.prototype.filter.call(document.querySelectorAll(".prensa"), function (p) { return !p.closest("[data-fase]"); });
  var io = new IntersectionObserver(function (entradas) {
    var nuevas = entradas.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
    nuevas.forEach(function (el, i) {
      el.style.setProperty("--rd", (i * .16) + "s");
      el.classList.add("impresa");
      io.unobserve(el);
    });
  }, { threshold: .2, rootMargin: "0px 0px -8% 0px" });
  sueltas.forEach(function (el) { io.observe(el); });
})();
