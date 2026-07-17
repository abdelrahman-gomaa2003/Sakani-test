import { config, supabaseAdmin } from "../config.js";
import crypto from "crypto";

const PAYMOB_BASE = "https://accept.paymob.com";

const SUBSCRIPTION_PLANS = {
  premium: {
    name: "الباقة المميزة",
    monthly: { price: 50, durationDays: 30 },
    yearly: { price: 480, durationDays: 365 },
  },
  professional: {
    name: "باقة المحترفين",
    monthly: { price: 100, durationDays: 30 },
    yearly: { price: 960, durationDays: 365 },
  },
};

const FEATURED_AD_PLAN = { name: "إعلان مميز", price: 50, durationDays: 30 };

function log(msg) {
  console.log(`[Paymob ${config.paymobMode.toUpperCase()}] ${msg}`);
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Token ${config.paymobSecretKey}`,
  };
}

export async function createIntention({ amountCents, items, billingData, specialReference, notificationUrl, redirectionUrl }) {
  if (!config.paymobSecretKey) {
    log("No secret key configured — skipping intention");
    return { error: "Paymob not configured" };
  }

  const na = "NA";
  const payload = {
    amount: amountCents,
    currency: "EGP",
    payment_methods: [Number(config.paymobIntegrationId)],
    items: (items || []).map((item) => ({
      name: item.name || "Sakani Service",
      amount: item.amount || amountCents,
      description: item.description || "",
      quantity: item.quantity || 1,
    })),
    billing_data: {
      first_name: billingData?.full_name?.split(" ")[0] || na,
      last_name: billingData?.full_name?.split(" ").slice(1).join(" ") || na,
      email: billingData?.email || "user@example.com",
      phone_number: billingData?.phone || "+201000000000",
      apartment: na,
      floor: na,
      street: na,
      building: na,
      shipping_method: na,
      postal_code: na,
      city: billingData?.city || "Fayoum",
      country: "EG",
      state: na,
    },
    customer: {
      first_name: billingData?.full_name?.split(" ")[0] || na,
      last_name: billingData?.full_name?.split(" ").slice(1).join(" ") || na,
      email: billingData?.email || "user@example.com",
    },
    delivery_needed: false,
    notification_url: notificationUrl || "",
    redirection_url: redirectionUrl || config.frontendUrl,
  };

  if (specialReference) {
    payload.special_reference = specialReference;
  }

  log(`Creating intention: ${amountCents / 100} EGP`);

  const res = await fetch(`${PAYMOB_BASE}/v1/intention/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (data.id) {
    log(`Intention created: ${data.id}`);
    return {
      intentionId: data.id,
      clientSecret: data.client_secret,
    };
  }

  log("Intention creation failed: " + JSON.stringify(data));
  return { error: data.detail || data.message || "Intention creation failed" };
}

export function getCheckoutUrl(clientSecret) {
  const url = `${PAYMOB_BASE}/unifiedcheckout/?publicKey=${config.paymobPublicKey}&clientSecret=${clientSecret}`;
  log(`Checkout URL generated`);
  return url;
}

export function verifyPaymobHmac(payload, signature) {
  if (!config.paymobHmacSecret) {
    log("CRITICAL: No HMAC secret configured — rejecting webhook");
    return false;
  }
  if (!signature) {
    log("WARNING: No HMAC signature in request");
    return false;
  }
  try {
    const { hmac: _providedHmac, ...rest } = payload;
    const sortedKeys = Object.keys(rest).sort();
    const computed = sortedKeys
      .map((key) => {
        const val = rest[key];
        if (val === null || val === undefined) return `${key}=`;
        return `${key}=${typeof val === "object" ? JSON.stringify(val) : val}`;
      })
      .join("&");
    const computedHmac = crypto.createHmac("sha512", config.paymobHmacSecret).update(computed).digest("hex");
    const match = computedHmac === signature;
    if (!match) {
      log("HMAC verification FAILED");
      log(`  Computed: ${computedHmac.substring(0, 16)}...`);
      log(`  Received: ${signature.substring(0, 16)}...`);
    }
    return match;
  } catch (err) {
    console.error("HMAC verification error:", err);
    return false;
  }
}

export async function handlePaymobWebhook(payload, hmacSignature) {
  if (!hmacSignature) {
    log("No HMAC signature in webhook — rejecting");
    return { success: false, message: "Missing HMAC signature" };
  }
  if (!verifyPaymobHmac(payload, hmacSignature)) {
    log("Webhook HMAC verification failed — rejecting");
    return { success: false, message: "Invalid HMAC signature" };
  }

  const obj = payload.obj || {};
  const transactionId = obj.id;
  const orderId = obj.order?.id || obj.order_id;
  const specialRef = obj.special_reference;
  const success = obj.success;
  const amountCents = obj.amount_cents;

  log(`Webhook received: order=${orderId}, special_ref=${specialRef}, success=${success}, txn=${transactionId}`);

  if (!success) {
    log("Payment failed — skipping");
    return { success: false, message: "Payment failed" };
  }

  const matchFilter = specialRef
    ? { special_reference: specialRef }
    : { order_id: String(orderId) };

  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "paid",
      transaction_id: String(transactionId),
      paid_at: new Date().toISOString(),
    })
    .match(matchFilter)
    .select()
    .single();

  if (error) {
    console.error("Payment update error:", error.message);
    return { success: false, error: error.message };
  }

  log(`Payment ${payment.id} marked as paid (${payment.amount} EGP)`);

  if (payment?.type === "featured_ad" && payment.apartment_id) {
    await supabaseAdmin
      .from("apartments")
      .update({ is_featured: true })
      .eq("id", payment.apartment_id);
    log(`Apartment ${payment.apartment_id} marked as featured`);
  }

  if (payment?.type?.startsWith("subscription_")) {
    const planId = payment.type.replace("subscription_", "");
    const planConfig = SUBSCRIPTION_PLANS[planId];

    if (!planConfig) {
      log(`Unknown subscription plan: ${planId}`);
      return { success: true, payment };
    }

    const now = new Date();

    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, expires_at")
      .eq("owner_id", payment.user_id)
      .eq("status", "active")
      .eq("plan", planId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSub) {
      const currentExpiry = new Date(existingSub.expires_at);
      const baseTime = currentExpiry > now ? currentExpiry : now;
      const durationDays = planConfig.monthly.durationDays;
      const newExpiry = new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await supabaseAdmin
        .from("subscriptions")
        .update({
          expires_at: newExpiry.toISOString(),
          status: "active",
          updated_at: now.toISOString(),
        })
        .eq("id", existingSub.id);

      log(`Subscription ${existingSub.id} extended to ${newExpiry.toISOString()}`);
    } else {
      const durationDays = planConfig.monthly.durationDays;
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await supabaseAdmin.from("subscriptions").insert({
        owner_id: payment.user_id,
        plan: planId,
        status: "active",
        price: payment.amount,
        billing_cycle: "monthly",
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: payment.id,
      });

      log(`New subscription created for user ${payment.user_id}: ${planId}`);
    }
  }

  return { success: true, payment };
}

export { SUBSCRIPTION_PLANS, FEATURED_AD_PLAN };
