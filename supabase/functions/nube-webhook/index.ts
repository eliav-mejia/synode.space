// POST /functions/v1/nube-webhook  (solo Stripe; desplegar con --no-verify-jwt)
// Único lugar que activa o retira el acceso: firma, modo, Payment Link, importe e idempotencia por event.id.
// El panel abre el Payment Link con ?client_reference_id=<user_id>. Una compra desde la portada no trae cuenta:
// se ignora aquí y se atiende por el correo de la compra hasta activar el reclamo descrito en _interno/docs.
import type Stripe from "npm:stripe@17.7.0";
import { admin, cryptoProvider, PAYMENT_LINK_ID, PRECIO_CENTAVOS, stripe } from "../_compartido/servidor.ts";

const WHSEC = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const LIVE = Deno.env.get("STRIPE_LIVEMODE") === "true";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Cambio = { estado: string; user?: string; session?: string; pi: string; monto?: number };

function cambioDe(event: Stripe.Event): Cambio | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.payment_link !== PAYMENT_LINK_ID) return null;
      if (s.payment_status !== "paid" || s.currency !== "mxn" || typeof s.payment_intent !== "string") return null;
      if (s.amount_total !== PRECIO_CENTAVOS) {
        console.error("importe distinto", s.id);
        return null;
      }
      const user = s.client_reference_id ?? "";
      if (!UUID.test(user)) {
        console.log("compra sin cuenta", s.id);
        return null;
      }
      return { estado: "pagado", user, session: s.id, pi: s.payment_intent, monto: s.amount_total };
    }
    case "charge.refunded": {
      const c = event.data.object as Stripe.Charge;
      return c.refunded && typeof c.payment_intent === "string" ? { estado: "reembolsado", pi: c.payment_intent } : null;
    }
    case "charge.dispute.created": {
      const d = event.data.object as Stripe.Dispute;
      return typeof d.payment_intent === "string" ? { estado: "disputa", pi: d.payment_intent } : null;
    }
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("método", { status: 405 });
  const firma = req.headers.get("stripe-signature");
  if (!firma) return new Response("sin firma", { status: 400 });

  const cuerpo = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(cuerpo, firma, WHSEC, undefined, cryptoProvider);
  } catch {
    return new Response("firma inválida", { status: 400 });
  }
  if (event.livemode !== LIVE) return new Response("otro modo", { status: 200 });

  const c = cambioDe(event);
  if (!c) return new Response("ignorado", { status: 200 });

  const { data, error } = await admin.rpc("nube_aplicar_evento", {
    p_event_id: event.id, p_tipo: event.type, p_estado: c.estado, p_user_id: c.user ?? null,
    p_session_id: c.session ?? null, p_payment_intent: c.pi, p_monto: c.monto ?? null, p_livemode: event.livemode,
  });
  if (error) {
    console.error("webhook", event.id, error.code); // 500: Stripe reintenta
    return new Response("error", { status: 500 });
  }
  console.log("webhook", event.id, event.type, data);
  return new Response("ok", { status: 200 });
});
