/* Variantes de la invitación. Se elige con ?variante=… (enlace para compartir) y se aplica antes de pintar:
   html[data-variante] decide qué se muestra. Además dibuja el menú para cambiar de variante.
   - sello    papel de algodón prensado en frío con A & E para abrir (predeterminada; el id se conserva por los enlaces)
   - mosaico  damasco a todo color que se rompe en teselas para abrir; sin sello (js/sello.js)
   - tinta    papel texturizado, sello de tinta índigo y escenas dibujadas a pluma (arte/tinta.mjs)
   - prensado-indigo  abre como «sello» (algodón prensado con A & E) y el contenido es el de «tinta»
   - vintage  papel envejecido en sepia con manchas de tiempo, sello de lacre rojo, acuarelas y fotos viradas a sepia
              con esquineros de álbum (solo CSS: usa las mismas capas que la variante sello) */
(function () {
  "use strict";

  var VARIANTES = [
    { id: "sello", nombre: "Papel prensado", nota: "Algodón blanco con A & E" },
    { id: "mosaico", nombre: "Mosaico", nota: "Se abre rompiendo el mosaico" },
    { id: "tinta", nombre: "Tinta índigo", nota: "Papel texturizado e ilustraciones a pluma" },
    { id: "prensado-indigo", nombre: "Prensado e índigo", nota: "Abre en papel prensado; contenido a pluma índigo" },
    { id: "vintage", nombre: "Vintage", nota: "Sepia, papel envejecido y sello de lacre" }
  ];

  var html = document.documentElement;
  var pedida = new URLSearchParams(location.search).get("variante");
  var actual = VARIANTES.some(function (v) { return v.id === pedida; }) ? pedida : VARIANTES[0].id;
  html.dataset.variante = actual;
  window.VARIANTE = actual;
  // Escenas a pluma, papel verjurado y sello índigo en el pie
  window.CONTENIDO_TINTA = actual === "tinta" || actual === "prensado-indigo";

  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.createElement("nav");
    nav.className = "variantes";
    nav.setAttribute("aria-label", "Variantes de la invitación");

    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "variantes__boton";
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-controls", "variantes-lista");
    boton.innerHTML = '<span class="variantes__icono" aria-hidden="true"><i></i><i></i><i></i></span>Variantes';

    var lista = document.createElement("ul");
    lista.className = "variantes__lista";
    lista.id = "variantes-lista";
    lista.hidden = true;
    VARIANTES.forEach(function (v) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      var url = new URL(location.href);
      url.searchParams.set("variante", v.id);
      url.hash = "";
      a.href = url.pathname + url.search;
      if (v.id === actual) a.setAttribute("aria-current", "page");
      a.innerHTML = "<b></b><small></small>";
      a.firstChild.textContent = v.nombre;
      a.lastChild.textContent = v.nota;
      li.appendChild(a);
      lista.appendChild(li);
    });

    function abrir(si) {
      lista.hidden = !si;
      boton.setAttribute("aria-expanded", String(si));
    }
    boton.addEventListener("click", function () { abrir(lista.hidden); });
    document.addEventListener("click", function (e) { if (!nav.contains(e.target)) abrir(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lista.hidden) { abrir(false); boton.focus(); }
    });

    nav.appendChild(boton);
    nav.appendChild(lista);
    document.body.appendChild(nav);
  });
})();
