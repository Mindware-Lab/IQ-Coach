import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";

type PurchaseProductCode = "g_track" | "cognitive_control_coach" | "complete_cognitive_route" | "synergy_attention";

const STRIPE_API_VERSION = "2026-02-25.clover";
const SYNERGY_ATTENTION_PRICE_ID = "price_1UJDnrAZLCi6B66bz2ioQAVe";
const SYNERGY_IQ_APP_URL = "https://www.iqmindware.com/synergy-iq/";
const COMPLETE_ROUTE_PROMO_PRICE_IDS = new Set([
  "price_1U5RaBAZLCi6B66bgtw7tW0q",
]);
const encoder = new TextEncoder();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function productPriceIds(): Record<PurchaseProductCode, string[]> {
  const gTrackPriceId = Deno.env.get("STRIPE_G_TRACK_PRICE_ID");
  const cognitiveControlCoachPriceId = Deno.env.get("STRIPE_COGNITIVE_CONTROL_COACH_PRICE_ID");
  const completeRoutePriceId = Deno.env.get("STRIPE_COMPLETE_COGNITIVE_ROUTE_PRICE_ID");
  return {
    g_track: gTrackPriceId ? [gTrackPriceId] : [],
    cognitive_control_coach: cognitiveControlCoachPriceId ? [cognitiveControlCoachPriceId] : [],
    complete_cognitive_route: completeRoutePriceId
      ? [completeRoutePriceId, ...COMPLETE_ROUTE_PROMO_PRICE_IDS]
      : [],
    synergy_attention: [SYNERGY_ATTENTION_PRICE_ID],
  };
}

function productAppUrl(productCode: PurchaseProductCode): string | undefined {
  if (productCode === "g_track") return Deno.env.get("G_TRACK_APP_URL");
  if (productCode === "synergy_attention") return SYNERGY_IQ_APP_URL;
  return Deno.env.get("COGNITIVE_CONTROL_COACH_APP_URL");
}

function hexBytes(input: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(input) || input.length % 2 !== 0) return new Uint8Array();
  return new Uint8Array(input.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}

async function verifiesStripeSignature(body: string, signatureHeader: string, secret: string): Promise<boolean> {
  const fields = signatureHeader.split(",").map((field) => field.split("="));
  const timestamp = fields.find(([key]) => key === "t")?.[1];
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signedPayload = encoder.encode(`${timestamp}.${body}`);
  for (const signature of signatures) {
    if (await crypto.subtle.verify("HMAC", key, hexBytes(signature), signedPayload)) return true;
  }
  return false;
}

async function verifiedCheckoutSession(
  sessionId: string,
  stripeSecretKey: string,
  priceIdsByProduct: Record<PurchaseProductCode, string[]>,
): Promise<{ session: any; productCode: PurchaseProductCode } | null> {
  const query = new URLSearchParams({ "expand[]": "line_items" });
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Stripe-Version": STRIPE_API_VERSION,
      },
    },
  );
  if (!response.ok) throw new Error("Stripe Checkout Session could not be verified.");
  const session = await response.json();
  const lineItems = Array.isArray(session?.line_items?.data) ? session.line_items.data : [];
  if (session?.mode !== "payment" || session?.payment_status !== "paid" || lineItems.length !== 1) return null;

  const purchasedPriceId = lineItems[0]?.price?.id;
  const quantity = lineItems[0]?.quantity;
  const productCode = (Object.entries(priceIdsByProduct) as Array<[PurchaseProductCode, string[]]>)
    .find(([, allowedPriceIds]) => typeof purchasedPriceId === "string" && allowedPriceIds.includes(purchasedPriceId))?.[0];
  if (!productCode || quantity !== 1 || session?.metadata?.product_code !== productCode) return null;
  return { session, productCode };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const webhookSecret = Deno.env.get("STRIPE_IQ_COACH_WEBHOOK_SECRET");
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const priceIdsByProduct = productPriceIds();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (
    !webhookSecret
    || !stripeSecretKey
    || Object.values(priceIdsByProduct).some((priceIds) => priceIds.length === 0)
    || !supabaseUrl
    || !serviceRoleKey
    || !Deno.env.get("G_TRACK_APP_URL")
    || !Deno.env.get("COGNITIVE_CONTROL_COACH_APP_URL")
  ) {
    return json(500, { error: "IQ Mindware webhook is not configured." });
  }

  const body = await request.text();
  const signature = request.headers.get("Stripe-Signature") || "";
  if (!(await verifiesStripeSignature(body, signature, webhookSecret))) {
    return json(400, { error: "Invalid Stripe signature." });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return json(400, { error: "Invalid Stripe event." });
  }
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    return json(200, { received: true });
  }

  const sessionId = event.data?.object?.id;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return json(400, { error: "Stripe event has no Checkout Session." });
  }

  let verified: { session: any; productCode: PurchaseProductCode } | null;
  try {
    verified = await verifiedCheckoutSession(sessionId, stripeSecretKey, priceIdsByProduct);
  } catch {
    return json(500, { error: "Paid checkout could not be verified with Stripe." });
  }
  if (!verified) return json(200, { received: true });

  const { session, productCode } = verified;
  const emailValue = session?.customer_details?.email || session?.customer_email;
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  if (!email) return json(500, { error: "Paid checkout did not include a customer email." });

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const purchasedAt = typeof session.created === "number"
    ? new Date(session.created * 1000).toISOString()
    : new Date().toISOString();
  const customerId = typeof session.customer === "string" ? session.customer : null;
  const { data: shouldSendAccessEmail, error: grantError } = await supabase.rpc("record_iq_coach_checkout", {
    p_email: email,
    p_stripe_customer_id: customerId,
    p_checkout_session_id: session.id,
    p_product_code: productCode,
    p_purchased_at: purchasedAt,
  });
  if (grantError) return json(500, { error: "Paid IQ Mindware access could not be stored." });

  if (shouldSendAccessEmail) {
    const appUrl = productAppUrl(productCode);
    if (!appUrl) return json(500, { error: "The purchased product has no access URL." });
    const redirectUrl = new URL(appUrl);
    redirectUrl.searchParams.set("checkout", "access");
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email,
      options: productCode === "synergy_attention"
        ? { shouldCreateUser: true }
        : { emailRedirectTo: redirectUrl.toString(), shouldCreateUser: true },
    });
    if (emailError) {
      return json(500, { error: "Paid access was stored, but the sign-in email could not be sent." });
    }
    const { error: markError } = await supabase.rpc("mark_iq_coach_access_email_sent", {
      p_checkout_session_id: session.id,
    });
    if (markError) return json(500, { error: "Access email delivery could not be recorded." });
  }

  return json(200, { received: true });
});
