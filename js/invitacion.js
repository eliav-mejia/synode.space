/* Invitación: textos de config.js, fotos de la pareja, cuenta regresiva, calendario y RSVP por WhatsApp o correo.
   El parallax y la impresión por fases viven en js/escenas.js. */
(function () {
  "use strict";

  var B = window.BODA || {};
  var fecha = B.fecha ? new Date(B.fecha) : null;
  if (fecha && isNaN(fecha)) fecha = null;
  var ZONA = "America/Mexico_City"; // todas las fechas se muestran en hora de Ciudad de México

  // --- Textos que dependen de config.js ---
  function poner(sel, txt) { document.querySelectorAll(sel).forEach(function (el) { el.textContent = txt; }); }
  if (fecha) {
    var larga = fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA });
    poner('[data-boda="fecha-larga"]', larga.charAt(0).toUpperCase() + larga.slice(1));
    poner('[data-boda="fecha-corta"]', fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: ZONA }).replace(/\//g, " · "));
    poner('[data-boda="hora"]', fecha.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", timeZone: ZONA }));
  }
  if (B.hashtag) poner('[data-boda="hashtag"]', B.hashtag);
  var antes = document.querySelector('[data-boda="confirmar-antes"]');
  if (antes && B.confirmarAntes) { antes.textContent = "Por favor confirma antes del " + B.confirmarAntes + "."; antes.hidden = false; }

  // Fotos de la pareja: se usan si existen en img/, si no queda el monograma en relieve.
  document.querySelectorAll("[data-foto]").forEach(function (f) {
    var img = new Image();
    img.onload = function () { f.style.backgroundImage = "url('" + f.dataset.foto + "')"; f.classList.add("con-foto"); };
    img.src = f.dataset.foto;
  });

  // --- Cuenta regresiva ---
  var cuenta = document.querySelector("[data-cuenta]");
  var nota = document.querySelector("[data-cuenta-nota]");
  var hoy = document.querySelector("[data-hoy]");
  var relojHoy = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  if (fecha && cuenta) {
    var cel = {};
    ["d", "h", "m", "s"].forEach(function (k) { cel[k] = cuenta.querySelector('[data-c="' + k + '"]'); });
    nota.hidden = true;
    if (hoy) hoy.hidden = false;
    // Reloj en vivo: se alinea al cambio de segundo para que todos los números avancen juntos
    var tic = function () {
      var ahora = Date.now();
      var r = Math.max(0, fecha - ahora);
      var s = Math.floor(r / 1000);
      cel.d.textContent = Math.floor(s / 86400);
      cel.h.textContent = String(Math.floor(s / 3600) % 24).padStart(2, "0");
      cel.m.textContent = String(Math.floor(s / 60) % 60).padStart(2, "0");
      cel.s.textContent = String(s % 60).padStart(2, "0");
      if (hoy) hoy.textContent = "Hoy en Ciudad de México: " + relojHoy.format(ahora);
      if (r === 0) { nota.textContent = "¡Hoy es el gran día!"; nota.hidden = false; }
      setTimeout(tic, 1000 - (Date.now() % 1000) + 10);
    };
    tic();

    var cal = document.querySelector("[data-calendario]");
    var fin = new Date(fecha.getTime() + 8 * 3600 * 1000);
    var f = function (d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    cal.href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent("Ceremonia civil · Alejandra & Eliav") +
      "&dates=" + f(fecha) + "/" + f(fin) +
      "&details=" + encodeURIComponent("https://synode.space") +
      "&location=" + encodeURIComponent("Casa Maka, Calle Maka, Tetelpan, Ciudad de México");
    cal.hidden = false;
  }

  // --- RSVP ---
  var form = document.getElementById("rsvp");
  var estado = form.querySelector(".rsvp__estado");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = new FormData(form);
    var nombre = (d.get("nombre") || "").trim();
    if (!nombre) { estado.textContent = "Escribe tu nombre, por favor."; form.nombre.focus(); return; }

    var texto = "Confirmación de asistencia · Alejandra & Eliav\n\n" +
      "Nombre: " + nombre + "\n" +
      "Respuesta: " + d.get("asiste") + "\n" +
      "Personas: " + d.get("personas") +
      ((d.get("mensaje") || "").trim() ? "\nMensaje: " + d.get("mensaje").trim() : "");

    if (B.whatsapp) {
      window.open("https://wa.me/" + String(B.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
      estado.textContent = "¡Gracias! Se abrió WhatsApp para enviar tu confirmación.";
    } else if (B.correo) {
      location.href = "mailto:" + B.correo + "?subject=" + encodeURIComponent("RSVP · " + nombre) + "&body=" + encodeURIComponent(texto);
      estado.textContent = "¡Gracias! Se abrió tu correo para enviar la confirmación.";
    } else {
      estado.textContent = "La confirmación en línea estará disponible muy pronto.";
    }
  });
})();
