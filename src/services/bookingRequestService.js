import { supabase } from "../lib/supabase";

export const bookingRequestService = {
  async create({ studentId, apartmentId, ownerId, startDate, durationMonths, numPersons, notes }) {
    const { data, error } = await supabase
      .from("booking_requests")
      .insert({
        student_id: studentId,
        apartment_id: apartmentId,
        owner_id: ownerId,
        start_date: startDate,
        duration_months: durationMonths,
        num_persons: numPersons || 1,
        notes: notes || null,
        status: "pending",
      })
      .select("*, apartments(title, images, price, neighborhood), profiles!booking_requests_student_id_fkey(full_name, avatar_url, phone)")
      .single();
    return { data, error };
  },

  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from("booking_requests")
      .select("*, apartments(title, images, price, neighborhood, owner_id), profiles!booking_requests_owner_id_fkey(full_name, avatar_url, phone)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getByOwner(ownerId) {
    const { data, error } = await supabase
      .from("booking_requests")
      .select("*, apartments(title, images, price, neighborhood), profiles!booking_requests_student_id_fkey(full_name, avatar_url, phone)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async updateStatus(requestId, status, rejectReason) {
    const updates = { status };
    if (rejectReason) updates.reject_reason = rejectReason;
    const { data, error } = await supabase
      .from("booking_requests")
      .update(updates)
      .eq("id", requestId)
      .select("*, apartments(title, images, price, neighborhood), profiles!booking_requests_student_id_fkey(full_name, avatar_url, phone)")
      .single();
    return { data, error };
  },

  async cancelByStudent(requestId, studentId) {
    const { data, error } = await supabase
      .from("booking_requests")
      .update({ status: "cancelled" })
      .eq("id", requestId)
      .eq("student_id", studentId)
      .eq("status", "approved")
      .select()
      .single();
    return { data, error };
  },

  async checkExisting(studentId, apartmentId) {
    const { data, error } = await supabase
      .from("booking_requests")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("apartment_id", apartmentId)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    return { data, error };
  },

  async getCountsByOwner(ownerId) {
    const { data, error } = await supabase
      .from("booking_requests")
      .select("status")
      .eq("owner_id", ownerId);
    if (error) return { pending: 0, approved: 0, rejected: 0, cancelled: 0, total: 0, error };
    const pending = data.filter((r) => r.status === "pending").length;
    const approved = data.filter((r) => r.status === "approved").length;
    const rejected = data.filter((r) => r.status === "rejected").length;
    const cancelled = data.filter((r) => r.status === "cancelled").length;
    return { pending, approved, rejected, cancelled, total: data.length, error: null };
  },
};
