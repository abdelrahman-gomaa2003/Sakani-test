import { Router } from "express";
import { supabaseAdmin } from "../config.js";
import { verifyAuth, verifyAdmin } from "../middleware/auth.js";
import { sendEmail, sendBulkEmails } from "../services/emailService.js";

const router = Router();

router.post("/send", verifyAdmin, async (req, res) => {
  try {
    const { to, template, data } = req.body;
    if (!to || !template) {
      return res.status(400).json({ error: "to and template are required" });
    }

    const result = await sendEmail(to, template, data || {});
    res.json(result);
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/bulk", verifyAdmin, async (req, res) => {
  try {
    const { template, role, getData } = req.body;

    let query = supabaseAdmin.from("profiles").select("id, email, full_name");
    if (role) query = query.eq("role", role);

    const { data: users, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    const results = await sendBulkEmails(users, template, getData || (() => ({})));
    res.json({ total: users.length, results });
  } catch (err) {
    console.error("Bulk email error:", err);
    res.status(500).json({ error: "Failed to send bulk emails" });
  }
});

router.post("/send-message-notification", verifyAuth, async (req, res) => {
  try {
    const { receiver_id, sender_name } = req.body;

    const { data: receiver } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", receiver_id)
      .single();

    if (!receiver?.email) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    const result = await sendEmail(receiver.email, "newMessage", {
      name: receiver.full_name,
      senderName: sender_name,
    });

    res.json(result);
  } catch (err) {
    console.error("Message notification error:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

export default router;
