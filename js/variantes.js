/* Variantes de la invitación. Se elige con ?variante=… (enlace para compartir) y se aplica antes de pintar:
   html[data-variante] decide qué se muestra. Además dibuja el menú para cambiar de variante.
   - sello    sello de cera para abrir y damasco desvanecido (predeterminada)
   - mosaico  damasco a todo color que se rompe en teselas para abrir; sin sello (js/sello.js, js/mosaico.js) */
(function () {
  "use strict";

  var VARIANTES = [
    { id: "sello", nombre: "Sello de cera", nota: "Se abre con el sello A & E" },
    { id: "mosaico", nombre: "Mosaico", nota: "Se abre rompiendo el mosaico" }
  ];

  var html = document.documentElement;
  var pedida = new URLSearchParams(location.search).get("variante");
  var actual = VARIANTES.some(function (v) { return v.id === pedida; }) ? pedida : VARIANTES[0].id;
  html.dataset.variante = actual;
  window.VARIANTE = actual;

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
