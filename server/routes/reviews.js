import { Router } from "express";
import { supabaseAdmin } from "../config.js";
import { verifyAuth } from "../middleware/auth.js";

const router = Router();

router.post("/owner", verifyAuth, async (req, res) => {
  try {
    const { reviewedId, bookingRequestId, rating, comment } = req.body;

    if (!reviewedId || !bookingRequestId || !rating) {
      return res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "التقييم يجب أن يكون بين 1 و 5" });
    }

    const { data: bookingRequest } = await supabaseAdmin
      .from("booking_requests")
      .select("id, student_id, status")
      .eq("id", bookingRequestId)
      .single();

    if (!bookingRequest) {
      return res.status(404).json({ error: "طلب الحجز غير موجود" });
    }

    if (bookingRequest.student_id !== req.user.id) {
      return res.status(403).json({ error: "غير مصرح بإنشاء تقييم لهذا الطلب" });
    }

    if (bookingRequest.status !== "approved") {
      return res.status(400).json({ error: "يمكن تقييم الطلبات المعتمدة فقط" });
    }

    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("reviewer_id", req.user.id)
      .eq("booking_request_id", bookingRequestId)
      .eq("review_type", "owner")
      .maybeSingle();

    if (existingReview) {
      return res.status(400).json({ error: "لقد قمت بتقييم هذا المالك بالفعل" });
    }

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        reviewer_id: req.user.id,
        reviewed_id: reviewedId,
        booking_request_id: bookingRequestId,
        review_type: "owner",
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء إنشاء التقييم" });
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error("Error creating owner review:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/owner/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)
      `)
      .eq("reviewed_id", userId)
      .eq("review_type", "owner")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء جلب التقييمات" });
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching owner reviews:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/owner/:userId/average", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("reviewed_id", userId)
      .eq("review_type", "owner");

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء حساب المتوسط" });
    }

    const average = data.length
      ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
      : 0;

    res.json({
      average: Math.round(average * 10) / 10,
      count: data.length,
    });
  } catch (err) {
    console.error("Error calculating owner average:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.post("/property", verifyAuth, async (req, res) => {
  try {
    const {
      apartmentId,
      bookingRequestId,
      rating,
      comment,
      cleanliness,
      safety,
      locationRating,
      nearUniversity,
      imageAccuracy,
    } = req.body;

    if (!apartmentId || !bookingRequestId || !rating) {
      return res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "التقييم يجب أن يكون بين 1 و 5" });
    }

    const { data: bookingRequest } = await supabaseAdmin
      .from("booking_requests")
      .select("id, student_id, status")
      .eq("id", bookingRequestId)
      .single();

    if (!bookingRequest) {
      return res.status(404).json({ error: "طلب الحجز غير موجود" });
    }

    if (bookingRequest.student_id !== req.user.id) {
      return res.status(403).json({ error: "غير مصرح بإنشاء تقييم لهذا الطلب" });
    }

    if (bookingRequest.status !== "approved") {
      return res.status(400).json({ error: "يمكن تقييم الطلبات المعتمدة فقط" });
    }

    const { data: existingReview } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("reviewer_id", req.user.id)
      .eq("booking_request_id", bookingRequestId)
      .eq("review_type", "property")
      .maybeSingle();

    if (existingReview) {
      return res.status(400).json({ error: "لقد قمت بتقييم هذا العقار بالفعل" });
    }

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        reviewer_id: req.user.id,
        apartment_id: apartmentId,
        booking_request_id: bookingRequestId,
        review_type: "property",
        rating,
        comment: comment || null,
        cleanliness: cleanliness || null,
        safety: safety || null,
        location_rating: locationRating || null,
        near_university: nearUniversity || null,
        image_accuracy: imageAccuracy || null,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء إنشاء التقييم" });
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error("Error creating property review:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/property/:apartmentId", async (req, res) => {
  try {
    const { apartmentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)
      `)
      .eq("apartment_id", apartmentId)
      .eq("review_type", "property")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء جلب التقييمات" });
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching property reviews:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/property/:apartmentId/average", async (req, res) => {
  try {
    const { apartmentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("rating, cleanliness, safety, location_rating, near_university, image_accuracy")
      .eq("apartment_id", apartmentId)
      .eq("review_type", "property");

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء حساب المتوسط" });
    }

    const count = data.length;
    const average = count
      ? data.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    const breakdown = count
      ? {
          cleanliness: Math.round((data.reduce((s, r) => s + (r.cleanliness || 0), 0) / count) * 10) / 10,
          safety: Math.round((data.reduce((s, r) => s + (r.safety || 0), 0) / count) * 10) / 10,
          locationRating: Math.round((data.reduce((s, r) => s + (r.location_rating || 0), 0) / count) * 10) / 10,
          nearUniversity: Math.round((data.reduce((s, r) => s + (r.near_university || 0), 0) / count) * 10) / 10,
          imageAccuracy: Math.round((data.reduce((s, r) => s + (r.image_accuracy || 0), 0) / count) * 10) / 10,
        }
      : null;

    res.json({
      average: Math.round(average * 10) / 10,
      count,
      breakdown,
    });
  } catch (err) {
    console.error("Error calculating property average:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

export default router;
