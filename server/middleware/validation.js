const PLAN_LIMITS = {
  owner: {
    free: { maxApartments: 3, maxImages: 5, maxVideoSize: 0 },
    premium: { maxApartments: 10, maxImages: 15, maxVideoSize: 100 * 1024 * 1024 },
    professional: { maxApartments: Infinity, maxImages: Infinity, maxVideoSize: 100 * 1024 * 1024 },
  },
  broker: {
    free: { maxApartments: 6, maxImages: 10, maxVideoSize: 0 },
    premium: { maxApartments: 20, maxImages: 20, maxVideoSize: 100 * 1024 * 1024 },
    professional: { maxApartments: Infinity, maxImages: Infinity, maxVideoSize: 100 * 1024 * 1024 },
  },
};

const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const TITLE_MAX = 150;
const DESC_MAX = 2000;
const PRICE_MIN = 500;
const PRICE_MAX = 100000;
const AMENITIES_MAX = 15;

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export function validateApartmentInput(req, res, next) {
  const errors = [];
  const { title, description, apartment_type, neighborhood, city, price, bedrooms, bathrooms, area, amenities, images } = req.body;

  if (!title || typeof title !== "string" || title.trim().length < 5) {
    errors.push("العنوان يجب أن يكون 5 أحرف على الأقل");
  }
  if (title && title.length > TITLE_MAX) {
    errors.push(`العنوان يجب أن يكون ${TITLE_MAX} حرف على الأقل`);
  }
  if (!description || typeof description !== "string" || description.trim().length < 20) {
    errors.push("الوصف يجب أن يكون 20 حرف على الأقل");
  }
  if (description && description.length > DESC_MAX) {
    errors.push(`الوصف يجب أن يكون ${DESC_MAX} حرف على الأقل`);
  }
  if (!apartment_type || !["room", "apartment", "shared", "studio"].includes(apartment_type)) {
    errors.push("نوع العقار غير صالح");
  }
  if (!neighborhood || typeof neighborhood !== "string") {
    errors.push("يرجى اختيار الحي");
  }
  if (city && city !== "Fayoum") {
    errors.push("المدينة غير صالحة");
  }
  if (!price || isNaN(Number(price)) || Number(price) < PRICE_MIN) {
    errors.push(`السعر يجب أن يكون ${PRICE_MIN} جنيه على الأقل`);
  }
  if (price && Number(price) > PRICE_MAX) {
    errors.push(`السعر يجب أن يكون أقل من ${PRICE_MAX.toLocaleString("ar-EG")} جنيه`);
  }
  if (bedrooms && (isNaN(Number(bedrooms)) || Number(bedrooms) < 1 || Number(bedrooms) > 10)) {
    errors.push("عدد الغرف يجب أن يكون بين 1 و 10");
  }
  if (bathrooms && (isNaN(Number(bathrooms)) || Number(bathrooms) < 1 || Number(bathrooms) > 5)) {
    errors.push("عدد الحمامات يجب أن يكون بين 1 و 5");
  }
  if (area && (isNaN(Number(area)) || Number(area) < 1)) {
    errors.push("المساحة غير صالحة");
  }
  if (amenities && !Array.isArray(amenities)) {
    errors.push("المرافق غير صالحة");
  }
  if (amenities && amenities.length > AMENITIES_MAX) {
    errors.push(`عدد المرافق لا يجب أن يتجاوز ${AMENITIES_MAX}`);
  }
  if (images && !Array.isArray(images)) {
    errors.push("الصور غير صالحة");
  }
  if (images && images.length > 20) {
    errors.push("الحد الأقصى 20 صورة");
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: "بيانات غير صالحة", details: errors });
  }

  next();
}

export function verifySubscriptionLimits(supabaseAdmin) {
  return async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "غير مصرح" });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, verification_status")
      .eq("id", userId)
      .single();

    if (!profile) return res.status(404).json({ error: "الملف الشخصي غير موجود" });
    if (profile.role !== "owner" && profile.role !== "broker") return next();
    if (profile.verification_status !== "approved") {
      return res.status(403).json({ error: "يجب اعتماد حسابك أولاً", code: "VERIFICATION_REQUIRED" });
    }

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("plan, status, expires_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isExpired = sub?.expires_at && new Date(sub.expires_at) < new Date();
    const plan = (sub && !isExpired && sub.status === "active") ? sub.plan : "free";
    const limits = PLAN_LIMITS[profile.role]?.[plan] || PLAN_LIMITS[profile.role].free;

    const { count } = await supabaseAdmin
      .from("apartments")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);

    if (count >= limits.maxApartments) {
      return res.status(403).json({
        error: "وصلت الحد الأقصى لعقارات باقتك الحالية",
        code: "SUBSCRIPTION_LIMIT",
        current: count,
        max: limits.maxApartments,
        plan,
      });
    }

    req.subscriptionLimits = limits;
    req.subscriptionPlan = plan;
    next();
  };
}

export function validateVideoConstraints(req, res, next) {
  const { video_url } = req.body;
  if (!video_url) return next();

  if (typeof video_url !== "string") {
    return res.status(400).json({ error: "رابط الفيديو غير صالح" });
  }

  try {
    const url = new URL(video_url);
    if (!url.hostname.includes("supabase")) {
      return res.status(400).json({ error: "رابط الفيديو غير مدعوم" });
    }
  } catch {
    return res.status(400).json({ error: "رابط الفيديو غير صالح" });
  }

  next();
}

export function validateImageConstraints(req, res, next) {
  const { images } = req.body;
  if (!images || !Array.isArray(images)) return next();

  for (const img of images) {
    if (typeof img !== "string") {
      return res.status(400).json({ error: "رابط الصورة غير صالح" });
    }
  }

  next();
}


