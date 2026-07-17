import { Router } from "express";
import { supabaseAdmin } from "../config.js";
import { verifyAuth } from "../middleware/auth.js";
import { validateApartmentInput, verifySubscriptionLimits, validateVideoConstraints, validateImageConstraints } from "../middleware/validation.js";

const router = Router();

router.post(
  "/",
  verifyAuth,
  verifySubscriptionLimits(supabaseAdmin),
  validateApartmentInput,
  validateVideoConstraints,
  validateImageConstraints,
  async (req, res) => {
    try {
      const apartmentData = {
        ...req.body,
        owner_id: req.user.id,
        city: "Fayoum",
        status: "pending",
      };

      const { data, error } = await supabaseAdmin
        .from("apartments")
        .insert(apartmentData)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: "حدث خطأ أثناء إضافة العقار" });
      }

      res.status(201).json({ data });
    } catch {
      res.status(500).json({ error: "خطأ داخلي في الخادم" });
    }
  }
);

router.delete("/:id", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: apt } = await supabaseAdmin
      .from("apartments")
      .select("owner_id, images, video_url")
      .eq("id", id)
      .single();

    if (!apt) {
      return res.status(404).json({ error: "العقار غير موجود" });
    }

    if (apt.owner_id !== req.user.id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        return res.status(403).json({ error: "غير مصرح بحذف هذا العقار" });
      }
    }

    if (apt.images?.length) {
      const paths = apt.images
        .map((url) => {
          const match = url.match(/apartment-images\/(.+)/);
          return match ? decodeURIComponent(match[1]) : null;
        })
        .filter(Boolean);
      if (paths.length) {
        await supabaseAdmin.storage.from("apartment-images").remove(paths);
      }
    }

    if (apt.video_url) {
      const vMatch = apt.video_url.match(/apartment-images\/(.+)/);
      if (vMatch) {
        await supabaseAdmin.storage.from("apartment-images").remove([decodeURIComponent(vMatch[1])]);
      }
    }

    const { error } = await supabaseAdmin
      .from("apartments")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء الحذف" });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/validate-limits", verifyAuth, verifySubscriptionLimits(supabaseAdmin), (req, res) => {
  res.json({
    allowed: true,
    plan: req.subscriptionPlan,
    limits: req.subscriptionLimits,
  });
});

export default router;
