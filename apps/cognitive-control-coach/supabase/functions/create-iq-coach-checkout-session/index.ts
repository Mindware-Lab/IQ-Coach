import { CORS, json, readPayload } from "../_shared/http.ts";

type PurchaseProductCode = "g_track" | "cognitive_control_coach" | "complete_cognitive_route" | "synergy_attention";

const STRIPE_API_VERSION = "2026-02-25.clover";
const COGNITIVE_CONTROL_COACH_PRODUCT_ID = "prod_V5DWcTnJ6t2c9h";
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

function productConfiguration(productCode: PurchaseProductCode): { priceId?: string; productId?: string; appUrl?: string } {
  if (productCode === "g_track") {
    return {
      priceId: Deno.env.get("STRIPE_G_TRACK_PRICE_ID"),
      appUrl: Deno.env.get("G_TRACK_APP_URL"),
    };
  }
  if (productCode === "cognitive_control_coach") {
    return {
      productId: COGNITIVE_CONTROL_COACH_PRODUCT_ID,
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

function metadataValue(value: unknown, max = 120): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[^a-zA-Z0-9_./:-]/g, "_").slice(0, max);
}

function publicProductCode(productCode: PurchaseProductCode, requested: unknown): string {
  const explicit = metadataValue(requested, 80);
  if (explicit) return explicit;
  if (productCode === "cognitive_control_coach") return "attention-control";
  if (productCode === "g_track") return "g-track";
  if (productCode === "synergy_attention") return "synergy-attention";
  return "complete-cognitive-route";
}

async function resolveDefaultPriceId(stripeSecretKey: string, productId: string): Promise<string | null> {
  const response = await fetch(`https://api.stripe.com/v1/products/${encodeURIComponent(productId)}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Stripe-Version": STRIPE_API_VERSION,
    },
  });
  const product = await response.json();
  if (!response.ok || typeof product?.default_price !== "string") return null;
  return product.default_price;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const payload = await readPayload(request);
  const productCode = payload?.productCode;
  if (typeof productCode !== "string" || !PRODUCT_CODES.has(productCode as PurchaseProductCode)) {
    return json(400, { error: "Choose a recognised IQ Mindware product." });
  }

  const attribution =
    payload?.attribution && typeof payload.attribution === "object" && !Array.isArray(payload.attribution)
      ? payload.attribution as Record<string, unknown>
      : {};
  const iqmProduct = publicProductCode(productCode as PurchaseProductCode, attribution.product);
  const iqmCampaign = metadataValue(attribution.campaign, 100);
  const utmSource = metadataValue(attribution.source, 100);
  const utmMedium = metadataValue(attribution.medium, 100);
  const utmContent = metadataValue(attribution.content, 100);

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const { priceId: configuredPriceId, productId, appUrl } = productConfiguration(productCode as PurchaseProductCode);
  if (!stripeSecretKey || !appUrl) {
    return json(500, { error: "IQ Mindware checkout is not configured." });
  }

  let priceId = configuredPriceId;
  if (!priceId && productId) {
    priceId = await resolveDefaultPriceId(stripeSecretKey, productId) ?? undefined;
  }
  if (!priceId) {
    return json(500, { error: "IQ Mindware checkout price is not configured." });
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
    "metadata[iqm_product]": iqmProduct,
    "payment_intent_data[metadata][product_code]": productCode,
    "payment_intent_data[metadata][iqm_product]": iqmProduct,
    "custom_text[submit][message]": "After payment, IQ Mindware will email a six-digit sign-in code to your checkout email. Questions: admin@iqmindware.com",
    customer_creation: "always",
    allow_promotion_codes: "true",
  });

  if (iqmCampaign) {
    form.set("metadata[iqm_campaign]", iqmCampaign);
    form.set("payment_intent_data[metadata][iqm_campaign]", iqmCampaign);
  }
  if (utmSource) {
    form.set("metadata[utm_source]", utmSource);
    form.set("payment_intent_data[metadata][utm_source]", utmSource);
  }
  if (utmMedium) {
    form.set("metadata[utm_medium]", utmMedium);
    form.set("payment_intent_data[metadata][utm_medium]", utmMedium);
  }
  if (utmContent) {
    form.set("metadata[utm_content]", utmContent);
    form.set("payment_intent_data[metadata][utm_content]", utmContent);
  }

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
