import { Router } from "express";
import { supabaseAdmin } from "../config.js";
import { verifyAuth, verifyAdmin } from "../middleware/auth.js";
import { sendEmail } from "../services/emailService.js";

const router = Router();

const RATE_LIMIT = new Map();
function checkRateLimit(ip, limit = 5, windowMs = 3600000) {
  const now = Date.now();
  const record = RATE_LIMIT.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  record.count++;
  RATE_LIMIT.set(ip, record);
  return record.count <= limit;
}

router.post("/", async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "تم تجاوز الحد المسموح. حاول مرة أخرى لاحقاً." });
  }

  const { name, email, phone, subject, message_type, message } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: "الاسم مطلوب (حرفين على الأقل)" });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "البريد الإلكتروني غير صحيح" });
  }
  if (!subject || subject.trim().length < 3) {
    return res.status(400).json({ error: "عنوان الرسالة مطلوب" });
  }
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ error: "الرسالة يجب أن تكون 10 أحرف على الأقل" });
  }

  const { data, error } = await supabaseAdmin
    .from("contact_messages")
    .insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      subject: subject.trim(),
      message_type: message_type || "استفسار",
      message: message.trim(),
      status: "new",
    })
    .select()
    .single();

  if (error) {
    console.error("Contact insert error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء إرسال الرسالة" });
  }

  sendEmail("support@sakani.com", "contactMessage", {
    name: name.trim(),
    email: email.trim(),
    messageType: message_type || "استفسار",
    subject: subject.trim(),
    message: message.trim(),
  }).catch(() => {});

  sendEmail(email.trim(), "contactConfirmation", {
    name: name.trim(),
  }).catch(() => {});

  res.json({ success: true, id: data.id });
});

router.get("/", verifyAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let query = supabaseAdmin
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    const { data: stats } = await supabaseAdmin
      .from("contact_messages")
      .select("status")
      .then(({ data: rows }) => {
        const counts = { total: rows?.length || 0, new: 0, in_progress: 0, resolved: 0, closed: 0 };
        rows?.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
        return { data: counts };
      });

    res.json({ messages: data, total: count, stats });
  } catch (err) {
    console.error("Get contact messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/:id", verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Message not found" });
    res.json(data);
  } catch (err) {
    console.error("Get contact message error:", err);
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

router.patch("/:id", verifyAdmin, async (req, res) => {
  try {
    const { status, admin_reply } = req.body;
    const update = { updated_at: new Date().toISOString() };
    if (status) update.status = status;
    if (admin_reply !== undefined) update.admin_reply = admin_reply;

    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error("Update contact message error:", err);
    res.status(500).json({ error: "Failed to update message" });
  }
});

router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("contact_messages")
      .delete()
      .eq("id", req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete contact message error:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
