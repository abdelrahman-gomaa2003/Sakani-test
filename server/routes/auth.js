import { Router } from "express";
import { supabaseAdmin } from "../config.js";
import { verifyAuth, verifyAdmin } from "../middleware/auth.js";
import { sendEmail } from "../services/emailService.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name, role = "student", phone } = req.body;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const profileData = {
      id: data.user.id,
      full_name,
      email,
      role,
    };
    if (phone) profileData.phone = phone;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });

    if (profileError) {
      console.warn("Profile upsert error:", profileError.message);
    }

    sendEmail(email, "welcome", { name: full_name }).catch(() => {});

    res.json({ user: data.user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/approve-apartment", verifyAdmin, async (req, res) => {
  try {
    const { apartment_id, status } = req.body;

    const { data: apartment, error: aptError } = await supabaseAdmin
      .from("apartments")
      .update({
        status,
        published_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", apartment_id)
      .select("*, profiles!inner(full_name, email)")
      .single();

    if (aptError) {
      return res.status(400).json({ error: aptError.message });
    }

    const ownerEmail = apartment.profiles?.email;
    const ownerName = apartment.profiles?.full_name;
    const template = status === "approved" ? "apartmentApproved" : "apartmentRejected";

    if (ownerEmail) {
      sendEmail(ownerEmail, template, {
        name: ownerName,
        title: apartment.title,
        reason: req.body.reason || "",
      }).catch(() => {});
    }

    res.json({ apartment });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: "Approval failed" });
  }
});

router.post("/approve-verification", verifyAdmin, async (req, res) => {
  try {
    const { request_id, status, admin_note } = req.body;

    if (!request_id || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid request_id or status" });
    }

    const { data: vr, error: vrError } = await supabaseAdmin
      .from("verification_requests")
      .update({
        status,
        admin_note: admin_note || "",
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request_id)
      .select("user_id, role")
      .single();

    if (vrError) return res.status(400).json({ error: vrError.message });

    const verification_status = status === "approved" ? "approved" : "rejected";
    const updateData = { verification_status };
    if (status === "rejected" && admin_note) {
      updateData.rejection_reason = admin_note;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", vr.user_id);

    if (profileError) {
      console.warn("Profile update error:", profileError.message);
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", vr.user_id)
      .single();

    if (profile?.email) {
      const template = status === "approved" ? "verificationApproved" : "verificationRejected";
      sendEmail(profile.email, template, {
        name: profile.full_name,
        title: vr.role || "",
        reason: admin_note || "",
      }).catch(() => {});
    }

    res.json({ success: true, status });
  } catch (err) {
    console.error("Approve verification error:", err);
    res.status(500).json({ error: "Verification update failed" });
  }
});

router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ users: data });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const [users, apartments, reviews, messages] = await Promise.all([
      supabaseAdmin.from("profiles").select("role", { count: "exact" }),
      supabaseAdmin.from("apartments").select("status", { count: "exact" }),
      supabaseAdmin.from("reviews").select("rating"),
      supabaseAdmin.from("messages").select("id", { count: "exact" }),
    ]);

    res.json({
      totalUsers: users.count || 0,
      totalApartments: apartments.count || 0,
      totalReviews: reviews.data?.length || 0,
      totalMessages: messages.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Stats fetch failed" });
  }
});

export default router;
