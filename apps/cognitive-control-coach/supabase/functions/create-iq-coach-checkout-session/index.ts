import { CORS, json, readPayload } from "../_shared/http.ts";

type PurchaseProductCode =
  | "g_track"
  | "cognitive_control_coach"
  | "complete_cognitive_route"
  | "synergy_attention";

const STRIPE_API_VERSION = "2026-02-25.clover";
const SYNERGY_ATTENTION_PRICE_ID = "price_1UJDnrAZLCi6B66bz2ioQAVe";
const SYNERGY_IQ_APP_URL = "https://www.iqmindware.com/synergy-iq/";

const PRODUCT_CODES = new Set<PurchaseProductCode>([
  "g_track",
  "cognitive_control_coach",
  "complete_cognitive_route",
  "synergy_attention",
]);

function checkoutReturnUrl(appUrl: string, state: "complete" | "cancelled"): string {
  const url = new URL(appUrl);
  url.searchParams.set("checkout", state);
  if (state === "complete") url.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  return url.toString();
}

function productConfiguration(productCode: PurchaseProductCode): { priceId?: string; appUrl?: string } {
  if (productCode === "g_track") {
    return {
      priceId: Deno.env.get("STRIPE_G_TRACK_PRICE_ID"),
      appUrl: Deno.env.get("G_TRACK_APP_URL"),
    };
  }
  if (productCode === "cognitive_control_coach") {
    return {
      priceId: Deno.env.get("STRIPE_COGNITIVE_CONTROL_COACH_PRICE_ID"),
      appUrl: Deno.env.get("COGNITIVE_CONTROL_COACH_APP_URL"),
    };
  }
  if (productCode === "synergy_attention") {
    return {
      priceId: SYNERGY_ATTENTION_PRICE_ID,
      appUrl: SYNERGY_IQ_APP_URL,
    };
  }
  return {
    priceId: Deno.env.get("STRIPE_COMPLETE_COGNITIVE_ROUTE_PRICE_ID"),
    appUrl: Deno.env.get("COGNITIVE_CONTROL_COACH_APP_URL"),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const payload = await readPayload(request);
  const productCode = payload?.productCode;
  if (typeof productCode !== "string" || !PRODUCT_CODES.has(productCode as PurchaseProductCode)) {
    return json(400, { error: "Choose a recognised IQ Mindware product." });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const { priceId, appUrl } = productConfiguration(productCode as PurchaseProductCode);
  if (!stripeSecretKey || !priceId || !appUrl) {
    return json(500, { error: "IQ Mindware checkout is not configured." });
  }

  try {
    const parsedAppUrl = new URL(appUrl);
    if (parsedAppUrl.protocol !== "https:") throw new Error("The app URL must use HTTPS.");
  } catch {
    return json(500, { error: "IQ Mindware checkout has an invalid app URL." });
  }

  const form = new URLSearchParams({
    mode: "payment",
    success_url: checkoutReturnUrl(appUrl, "complete"),
    cancel_url: checkoutReturnUrl(appUrl, "cancelled"),
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[product_code]": productCode,
    "payment_intent_data[metadata][product_code]": productCode,
    "custom_text[submit][message]": "After payment, IQ Mindware will email a six-digit sign-in code to your checkout email. Questions: admin@iqmindware.com",
    customer_creation: "always",
    allow_promotion_codes: "true",
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: form,
  });
  const stripeSession = await stripeResponse.json();
  if (!stripeResponse.ok || typeof stripeSession.url !== "string") {
    return json(502, { error: stripeSession.error?.message || "Stripe Checkout could not be started." });
  }

  const checkoutUrl = new URL(stripeSession.url);
  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
    return json(502, { error: "Stripe Checkout returned an invalid URL." });
  }
  return json(200, { url: checkoutUrl.toString() });
});
