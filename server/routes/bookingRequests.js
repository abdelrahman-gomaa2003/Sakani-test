import { Router } from "express";
import { supabaseAdmin } from "../config.js";
import { verifyAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", verifyAuth, async (req, res) => {
  try {
    const { apartmentId, startDate, durationMonths, numPersons, notes } = req.body;

    if (!apartmentId || !startDate || !durationMonths) {
      return res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة" });
    }

    const { data: student } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", req.user.id)
      .single();

    if (!student) {
      return res.status(404).json({ error: "الطالب غير موجود" });
    }

    const { data: apartment } = await supabaseAdmin
      .from("apartments")
      .select("id, owner_id")
      .eq("id", apartmentId)
      .single();

    if (!apartment) {
      return res.status(404).json({ error: "العقار غير موجود" });
    }

    if (!apartment.owner_id) {
      return res.status(400).json({ error: "العقار لا يملك مالكاً" });
    }

    const { data: existing } = await supabaseAdmin
      .from("booking_requests")
      .select("id")
      .eq("student_id", req.user.id)
      .eq("apartment_id", apartmentId)
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "لديك طلب حجز بالفعل لهذا العقار" });
    }

    const { data, error } = await supabaseAdmin
      .from("booking_requests")
      .insert({
        student_id: req.user.id,
        apartment_id: apartmentId,
        owner_id: apartment.owner_id,
        start_date: startDate,
        duration_months: durationMonths,
        num_persons: numPersons || 1,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء إنشاء طلب الحجز" });
    }

    res.status(201).json({ data });
  } catch (err) {
    console.error("Error creating booking request:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/student", verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("booking_requests")
      .select(`
        *,
        apartment:apartments(title, images, price, neighborhood),
        owner:profiles!booking_requests_owner_id_fkey(full_name, avatar_url, phone)
      `)
      .eq("student_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء جلب طلبات الحجز" });
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching student booking requests:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/owner", verifyAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("booking_requests")
      .select(`
        *,
        apartment:apartments(title, images, price, neighborhood),
        student:profiles!booking_requests_student_id_fkey(full_name, avatar_url, phone)
      `)
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء جلب طلبات الحجز" });
    }

    res.json({ data });
  } catch (err) {
    console.error("Error fetching owner booking requests:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.patch("/:id/approve", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: request } = await supabaseAdmin
      .from("booking_requests")
      .select("id, owner_id, status")
      .eq("id", id)
      .single();

    if (!request) {
      return res.status(404).json({ error: "طلب الحجز غير موجود" });
    }

    if (request.owner_id !== req.user.id) {
      return res.status(403).json({ error: "غير مصرح بالموافقة على هذا الطلب" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "هذا الطلب تم معالجته بالفعل" });
    }

    const { data, error } = await supabaseAdmin
      .from("booking_requests")
      .update({ status: "approved" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء الموافقة على الطلب" });
    }

    res.json({ data });
  } catch (err) {
    console.error("Error approving booking request:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.patch("/:id/reject", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: request } = await supabaseAdmin
      .from("booking_requests")
      .select("id, owner_id, status")
      .eq("id", id)
      .single();

    if (!request) {
      return res.status(404).json({ error: "طلب الحجز غير موجود" });
    }

    if (request.owner_id !== req.user.id) {
      return res.status(403).json({ error: "غير مصرح برفض هذا الطلب" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "هذا الطلب تم معالجته بالفعل" });
    }

    const { data, error } = await supabaseAdmin
      .from("booking_requests")
      .update({ status: "rejected", rejection_reason: reason || null })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء رفض الطلب" });
    }

    res.json({ data });
  } catch (err) {
    console.error("Error rejecting booking request:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.patch("/:id/cancel", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: request } = await supabaseAdmin
      .from("booking_requests")
      .select("id, student_id, status")
      .eq("id", id)
      .single();

    if (!request) {
      return res.status(404).json({ error: "طلب الحجز غير موجود" });
    }

    if (request.student_id !== req.user.id) {
      return res.status(403).json({ error: "غير مصرح بإلغاء هذا الطلب" });
    }

    if (request.status !== "approved") {
      return res.status(400).json({ error: "يمكن إلغاء الطلبات المعتمدة فقط" });
    }

    const { data, error } = await supabaseAdmin
      .from("booking_requests")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء إلغاء الطلب" });
    }

    res.json({ data });
  } catch (err) {
    console.error("Error cancelling booking request:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

router.get("/check/:apartmentId", verifyAuth, async (req, res) => {
  try {
    const { apartmentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from("booking_requests")
      .select("id, status")
      .eq("student_id", req.user.id)
      .eq("apartment_id", apartmentId)
      .in("status", ["pending", "approved"])
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: "حدث خطأ أثناء التحقق" });
    }

    res.json({ exists: !!data, request: data || null });
  } catch (err) {
    console.error("Error checking booking request:", err);
    res.status(500).json({ error: "خطأ داخلي في الخادم" });
  }
});

export default router;
