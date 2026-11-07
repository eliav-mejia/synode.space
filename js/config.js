/* Datos de la boda: el único archivo que hay que editar para fecha, RSVP y hashtag.
   Lugares, horarios e itinerario están escritos directamente en index.html. */
window.BODA = {
  // Fecha y hora de la ceremonia en ISO con la zona de Ciudad de México (UTC−6 todo el año, sin horario de verano).
  // Vacía = «Fecha por confirmar» y sin cuenta regresiva.
  fecha: "2027-01-31T13:00:00-06:00",
  // Si cambia la fecha, actualiza también el título fijo «31.01.27 CDMX» de «Dónde y cuándo» en index.html

  // RSVP: si hay WhatsApp se usa WhatsApp; si no, correo. Ambos vacíos = el formulario avisa que aún no está disponible.
  whatsapp: "",   // solo dígitos con lada, ej. "5215512345678"
  correo: "",     // ej. "rsvp@synode.space"

  // Fecha límite para confirmar (texto libre). Vacía = no se muestra.
  confirmarAntes: "",

  hashtag: "#AlejandraYEliav"
};
