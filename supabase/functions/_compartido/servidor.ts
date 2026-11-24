// Ayudas del servidor. Los secretos se leen solo de los secretos de Supabase, nunca de la petición.
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const need = (k: string): string => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`falta el secreto ${k}`);
  return v;
};

// Premium: $380.00 MXN. Si cambia en Stripe, cambia también NUBE_PRECIO_CENTAVOS.
export const PRECIO_CENTAVOS = (() => {
  const c = Number(need("NUBE_PRECIO_CENTAVOS"));
  if (!Number.isSafeInteger(c) || c < 1000) throw new Error("NUBE_PRECIO_CENTAVOS inválido");
  return c;
})();

// Id plink_… del Payment Link: solo sus cobros activan la nube.
export const PAYMENT_LINK_ID = need("STRIPE_PAYMENT_LINK_ID");

export const stripe = new Stripe(need("STRIPE_SECRET_KEY"), {
  apiVersion: "2025-02-24.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
export const cryptoProvider = Stripe.createSubtleCryptoProvider();

// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase en cada función.
export const admin = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
