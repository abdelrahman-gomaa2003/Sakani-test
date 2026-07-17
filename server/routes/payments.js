import { Router } from "express";
import { config, supabaseAdmin } from "../config.js";
import { verifyAuth, verifyApproved } from "../middleware/auth.js";
import {
  createIntention,
  getCheckoutUrl,
  handlePaymobWebhook,
  SUBSCRIPTION_PLANS,
  FEATURED_AD_PLAN,
} from "../services/paymentService.js";

const router = Router();

router.get("/plans", (req, res) => {
  res.json({
    subscriptions: SUBSCRIPTION_PLANS,
    featured_ad: FEATURED_AD_PLAN,
  });
});

router.post("/checkout", verifyAuth, verifyApproved, async (req, res) => {
  try {
    const { type, apartment_id } = req.body;

    if (type === "featured_ad") {
      const plan = FEATURED_AD_PLAN;
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", req.user.id)
        .single();

      const specialRef = `featured_${req.user.id}_${Date.now()}`;

      const { error: dbError } = await supabaseAdmin.from("payments").insert({
        user_id: req.user.id,
        apartment_id: apartment_id || null,
        type,
        amount: plan.price,
        status: "pending",
        special_reference: specialRef,
      });
      if (dbError) console.warn("Payment insert error:", dbError.message);

      const intention = await createIntention({
        amountCents: plan.price * 100,
        items: [{ name: plan.name, amount: plan.price * 100, description: plan.name }],
        billingData: {
          full_name: profile?.full_name || "User",
          email: profile?.email || req.user.email,
          phone: profile?.phone || "+201000000000",
          city: profile?.city || "Fayoum",
        },
        specialReference: specialRef,
        notificationUrl: `${config.frontendUrl.replace("localhost:5174", "localhost:3001")}/api/payments/webhook`,
        redirectionUrl: `${config.frontendUrl}/owner/apartments`,
      });

      if (intention.error) {
        return res.status(400).json({ error: intention.error });
      }

      const checkoutUrl = getCheckoutUrl(intention.clientSecret);
      return res.json({ checkoutUrl, intentionId: intention.intentionId });
    }

    res.status(400).json({ error: "Invalid checkout type" });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

router.post("/subscription-checkout", verifyAuth, verifyApproved, async (req, res) => {
  try {
    const { planId, amount, billingCycle } = req.body;

    if (!planId || !amount || !billingCycle) {
      return res.status(400).json({ error: "Missing required fields: planId, amount, billingCycle" });
    }

    const planConfig = SUBSCRIPTION_PLANS[planId];
    if (!planConfig) {
      return res.status(400).json({ error: `Unknown plan: ${planId}` });
    }

    const cycleConfig = planConfig[billingCycle];
    if (!cycleConfig) {
      return res.status(400).json({ error: `Unknown billing cycle: ${billingCycle}` });
    }

    if (Number(amount) !== cycleConfig.price) {
      console.warn(`Price mismatch: expected ${cycleConfig.price}, got ${amount}`);
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    const specialRef = `sub_${planId}_${req.user.id}_${Date.now()}`;

    const { error: dbError } = await supabaseAdmin.from("payments").insert({
      user_id: req.user.id,
      type: `subscription_${planId}`,
      amount,
      status: "pending",
      special_reference: specialRef,
    });
    if (dbError) console.warn("Subscription payment insert error:", dbError.message);

    const intention = await createIntention({
      amountCents: Math.round(amount * 100),
      items: [{
        name: planConfig.name,
        amount: Math.round(amount * 100),
        description: `${planConfig.name} - ${billingCycle === "yearly" ? "سنوي" : "شهري"}`,
      }],
      billingData: {
        full_name: profile?.full_name || "User",
        email: profile?.email || req.user.email,
        phone: profile?.phone || "+201000000000",
        city: profile?.city || "Fayoum",
      },
      specialReference: specialRef,
      notificationUrl: `${config.frontendUrl.replace("localhost:5174", "localhost:3001")}/api/payments/webhook`,
      redirectionUrl: `${config.frontendUrl}/subscriptions`,
    });

    if (intention.error) {
      return res.status(400).json({ error: intention.error });
    }

    const checkoutUrl = getCheckoutUrl(intention.clientSecret);
    res.json({ checkoutUrl, intentionId: intention.intentionId });
  } catch (err) {
    console.error("Subscription checkout error:", err);
    res.status(500).json({ error: "Subscription checkout failed" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const hmacSignature = req.body?.hmac || req.headers["x-paymob-signature"] || null;
    const result = await handlePaymobWebhook(req.body, hmacSignature);
    res.json(result);
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

router.get("/history", verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ payments: data });
  } catch (err) {
    console.error("Payment history error:", err);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

export default router;
