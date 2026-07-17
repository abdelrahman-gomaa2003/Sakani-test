import { supabase } from "../lib/supabase";

export const OWNER_PLAN_LIMITS = {
  free: { maxApartments: 3, maxImages: 5, label: "مجاني", color: "var(--on-surface-variant)" },
  premium: { maxApartments: 10, maxImages: 15, label: "مميز", color: "var(--primary)" },
  professional: { maxApartments: Infinity, maxImages: Infinity, label: "محترف", color: "#2D6A4F" },
};

export const BROKER_PLAN_LIMITS = {
  free: { maxApartments: 6, maxImages: 10, label: "مجاني", color: "var(--on-surface-variant)" },
  premium: { maxApartments: 20, maxImages: 20, label: "وسيط موثق", color: "var(--primary)" },
  professional: { maxApartments: Infinity, maxImages: Infinity, label: "وسيط مميز", color: "#2D6A4F" },
};

export const PLAN_LIMITS = OWNER_PLAN_LIMITS;

export const OWNER_PLAN_PRICES = {
  premium: { monthly: 50, yearly: 480 },
  professional: { monthly: 100, yearly: 960 },
};

export const BROKER_PLAN_PRICES = {
  premium: { monthly: 100, yearly: 960 },
  professional: { monthly: 200, yearly: 1920 },
};

function getLimits(role) {
  return role === "broker" ? BROKER_PLAN_LIMITS : OWNER_PLAN_LIMITS;
}

function getPrices(role) {
  return role === "broker" ? BROKER_PLAN_PRICES : OWNER_PLAN_PRICES;
}

export const subscriptionService = {
  async getCurrent(ownerId) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data, error };
  },

  async getAll() {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, profiles!subscriptions_owner_id_fkey(id, full_name, email, phone, role)")
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async countApartments(ownerId) {
    const { count, error } = await supabase
      .from("apartments")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", ownerId);
    return { count: count || 0, error };
  },

  canAddApartment(subscription, currentCount, role = "owner") {
    const limits = getLimits(role);
    if (!subscription) return currentCount < limits.free.maxApartments;
    if (subscription.plan === "free") return currentCount < limits.free.maxApartments;
    if (subscriptionService.isExpired(subscription)) return currentCount < limits.free.maxApartments;
    const planLimits = limits[subscription.plan] || limits.free;
    return currentCount < planLimits.maxApartments;
  },

  getRemainingSlots(subscription, currentCount, role = "owner") {
    const limits = getLimits(role);
    if (!subscription) return Math.max(0, limits.free.maxApartments - currentCount);
    if (subscription.plan === "free") return Math.max(0, limits.free.maxApartments - currentCount);
    if (subscriptionService.isExpired(subscription)) return Math.max(0, limits.free.maxApartments - currentCount);
    const planLimits = limits[subscription.plan] || limits.free;
    if (planLimits.maxApartments === Infinity) return Infinity;
    return Math.max(0, planLimits.maxApartments - currentCount);
  },

  getMaxImages(subscription, role = "owner") {
    const limits = getLimits(role);
    if (!subscription) return limits.free.maxImages;
    if (subscription.plan === "free") return limits.free.maxImages;
    if (subscriptionService.isExpired(subscription)) return limits.free.maxImages;
    return limits[subscription.plan]?.maxImages || limits.free.maxImages;
  },

  isExpired(subscription) {
    if (!subscription) return false;
    if (subscription.plan === "free") return false;
    return new Date(subscription.expires_at) < new Date();
  },

  getPlanInfo(subscription, role = "owner") {
    const limits = getLimits(role);
    if (!subscription) return limits.free;
    if (subscription.plan === "free") return limits.free;
    if (subscriptionService.isExpired(subscription)) return limits.free;
    return limits[subscription.plan] || limits.free;
  },

  getEffectivePlan(subscription) {
    if (!subscription) return "free";
    if (subscription.plan === "free") return "free";
    if (subscriptionService.isExpired(subscription)) return "free";
    return subscription.plan;
  },

  getPlanPrices(role = "owner") {
    return getPrices(role);
  },

  async getPaymentHistory(ownerId) {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async createSubscription(ownerId, plan, billingCycle, paymentId) {
    const now = new Date();
    const durationDays = billingCycle === "yearly" ? 365 : 30;
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", ownerId)
      .maybeSingle();

    const role = profile?.role || "owner";
    const prices = getPrices(role);
    const price = prices[plan]?.[billingCycle] || 0;

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        owner_id: ownerId,
        plan,
        status: "active",
        price,
        billing_cycle: billingCycle,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: paymentId || null,
      })
      .select()
      .single();
    return { data, error };
  },

  async cancelSubscription(subscriptionId) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", subscriptionId)
      .select()
      .single();
    return { data, error };
  },

  async adminUpdateStatus(subscriptionId, status) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", subscriptionId)
      .select()
      .single();
    return { data, error };
  },
};
