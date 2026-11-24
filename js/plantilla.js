/* Plantillas de Synode: llena la invitación con las respuestas de la encuesta.
   Los datos viajan en el fragmento de la URL (#d=…), que el navegador no envía al servidor.
   #p=Nombre personaliza el enlace para un invitado. Todo se escribe con textContent. */
(function () {
  "use strict";

  var LIMITES = {
    uno: 40, dos: 40, fecha: 10, hora: 5, tipo: 40, ciudad: 60, mensaje: 160, padres1: 120, padres2: 120,
    lugar: 90, direccion: 160, lugarRecepcion: 90, horaRecepcion: 5, direccionRecepcion: 160, itinerario: 500,
    vestimenta: 50, vestimentaNota: 180, regalos: 220, hashtag: 40, whatsapp: 16, correo: 120, confirmarAntes: 50, gracias: 100
  };

  function decodificar(t) {
    try {
      var b = atob(t.replace(/-/g, "+").replace(/_/g, "/"));
      var u = new Uint8Array(b.length);
      for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
      var o = JSON.parse(new TextDecoder().decode(u)), d = {};
      Object.keys(LIMITES).forEach(function (k) { if (typeof o[k] === "string") d[k] = o[k].slice(0, LIMITES[k]).trim(); });
      return d;
    } catch (e) { return {}; }
  }

  var CLAVE = "synode-plantilla-vista", h = new URLSearchParams(location.hash.slice(1)), crudo = h.get("d"), para = (h.get("p") || "").slice(0, 60).trim();
  try {
    if (crudo) sessionStorage.setItem(CLAVE, JSON.stringify({ d: crudo, p: para }));
    else { var g = JSON.parse(sessionStorage.getItem(CLAVE) || "null"); if (g) { crudo = g.d; para = g.p || ""; } }
  } catch (e) { /* sin almacenamiento */ }

  var d = crudo ? decodificar(crudo) : {};
  var uno = d.uno || "Valeria", dos = d.dos || "Mateo", tipo = d.tipo || "Ceremonia civil";
  var fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(d.fecha || ""), hora = /^\d{2}:\d{2}$/.test(d.hora || "") ? d.hora : "13:00";
  var lugarMapa = [d.lugar, d.direccion].filter(Boolean).join(", ");

  window.BODA = {
    fecha: fechaValida ? d.fecha + "T" + hora + ":00-06:00" : "",
    whatsapp: (d.whatsapp || "").replace(/\D/g, ""),
    correo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo || "") ? d.correo : "",
    confirmarAntes: d.confirmarAntes || "",
    hashtag: d.hashtag || "#" + (uno + "Y" + dos).replace(/\s+/g, ""),
    pareja: uno + " & " + dos,
    tipo: tipo,
    lugarMapa: lugarMapa,
    url: location.origin + location.pathname
  };
  window.PLANTILLA_ABIERTA = new URLSearchParams(location.search).has("vista");

  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function txt(s, v) { $$(s).forEach(function (e) { e.textContent = v; }); }
  function conY(sel, a, b) {
    $$(sel).forEach(function (e) {
      var i = document.createElement("i"); i.textContent = "&";
      e.textContent = ""; e.append(a + " ", i, " " + b);
    });
  }
  function inicial(n) { return Array.from(n.trim())[0] ? Array.from(n.trim())[0].toUpperCase() : ""; }
  function mapa(q) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q); }

  function aplicar() {
    document.title = uno + " & " + dos + " · Nuestra boda";
    var ia = inicial(uno), ib = inicial(dos);
    txt(".nombres__uno", uno); txt(".nombres__dos", dos);
    conY(".intro__placa-nombres, #historia-titulo", uno, dos);
    $$(".sello__mono, .monograma, .foto__ciego, .pie__mono").forEach(function (e) {
      var i = document.createElement("i"); i.textContent = "&"; e.textContent = ""; e.append(ia, i, ib);
    });
    txt('.sprite text[x="82"]', ia); txt('.sprite text[x="159"]', ib);
    txt(".volada", d.ciudad || "Ciudad de México");
    txt(".sobrelinea", "Nos casamos · " + tipo);
    if (d.mensaje) txt(".parrafo-grande", d.mensaje);

    var padres = $$(".padres > div");
    [[d.padres1, uno], [d.padres2, dos]].forEach(function (x, i) {
      if (!padres[i]) return;
      if (!x[0]) { padres[i].hidden = true; padres[i].style.display = "none"; return; }
      padres[i].querySelector("h2").textContent = "Padres de " + x[1];
      padres[i].querySelector("p").textContent = x[0];
    });

    var fases = $$("#lugar .escena__texto .fase");
    if (fechaValida) { var f = d.fecha.split("-"); txt(".lugar__nombre", f[2] + "." + f[1] + "." + f[0].slice(2)); }
    else txt(".lugar__nombre", "Próximamente");
    txt(".lugar__dir--grande", d.direccion || d.ciudad || "Dirección por confirmar");
    if (fases[1]) {
      fases[1].querySelector(".etiqueta").textContent = tipo;
      fases[1].querySelector(".lugar__dir").textContent = d.lugar || "Lugar por confirmar";
      var a = fases[1].querySelector("a.boton");
      if (a) { if (lugarMapa) a.href = mapa(lugarMapa); else a.hidden = true; }
    }
    if (fases[2]) {
      fases[2].querySelector(".lugar__hora").textContent = /^\d{2}:\d{2}$/.test(d.horaRecepcion || "") ? d.horaRecepcion + " h" : "Hora por confirmar";
      fases[2].querySelector(".lugar__dir").textContent = [d.lugarRecepcion, d.direccionRecepcion].filter(Boolean).join(" · ") || "Lugar por confirmar";
    }

    var prog = document.querySelector(".programa");
    if (prog && d.itinerario) {
      var modelo = prog.querySelector("li:nth-child(2)").cloneNode(true);
      var filas = d.itinerario.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean).slice(0, 12);
      prog.textContent = "";
      filas.forEach(function (l) {
        var m = l.match(/^(\d{1,2}:\d{2})\s*[-–—·]?\s*(.+)$/), li = modelo.cloneNode(true);
        li.querySelector(".programa__que").textContent = m ? m[2] : l;
        li.querySelector(".programa__hora").textContent = m ? m[1] : "— : —";
        prog.appendChild(li);
      });
    }

    var det = $$(".detalle");
    if (det[0]) {
      if (d.vestimenta) det[0].querySelector(".detalle__grande").textContent = d.vestimenta;
      if (d.vestimentaNota) det[0].querySelector("p:not(.detalle__grande)").textContent = d.vestimentaNota;
    }
    if (det[1] && d.regalos) det[1].querySelector("p:not(.detalle__grande)").textContent = d.regalos;
    if (d.gracias) txt(".pie__gracias", d.gracias);

    if (para) {
      txt(".intro__para, .intro__placa-para", "Una invitación para " + para);
      var nombre = document.querySelector('#rsvp [name="nombre"]');
      if (nombre) nombre.value = para;
    }
    var estilo = document.createElement("style");
    estilo.textContent = ".variantes{display:none!important}";
    document.head.appendChild(estilo);
  }

  window.PLANTILLA = { aplicar: aplicar };
})();
