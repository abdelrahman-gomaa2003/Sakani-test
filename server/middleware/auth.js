import { supabaseAdmin } from "../config.js";

export async function verifyAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = data.user;
  next();
}

export async function verifyApproved(req, res, next) {
  await verifyAuth(req, res, () => {});
  if (res.headersSent) return;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role, verification_status")
    .eq("id", req.user.id)
    .single();

  if (!data) {
    return res.status(403).json({ error: "Profile not found" });
  }

  if (data.role === "admin" || data.role === "student") {
    return next();
  }

  if (data.verification_status !== "approved") {
    return res.status(403).json({
      error: "لا يمكنك استخدام هذه الخدمة حتى يتم اعتماد حسابك.",
      code: "VERIFICATION_REQUIRED",
      verification_status: data.verification_status,
    });
  }

  next();
}

export async function verifyAdmin(req, res, next) {
  await verifyAuth(req, res, () => {});
  if (res.headersSent) return;

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", req.user.id)
    .single();

  if (!data || data.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
