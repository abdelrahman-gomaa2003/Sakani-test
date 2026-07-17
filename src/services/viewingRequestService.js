import { supabase } from "../lib/supabase";

export const viewingRequestService = {
  async create({ studentId, apartmentId, ownerId, viewingDate, viewingTime, notes }) {
    const { data, error } = await supabase
      .from("viewing_requests")
      .insert({
        student_id: studentId,
        apartment_id: apartmentId,
        owner_id: ownerId,
        viewing_date: viewingDate,
        viewing_time: viewingTime,
        notes: notes || null,
        status: "pending",
      })
      .select("*, apartments(title, images, price, neighborhood), profiles!viewing_requests_student_id_fkey(full_name, avatar_url, phone)")
      .single();
    return { data, error };
  },

  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from("viewing_requests")
      .select("*, apartments(title, images, price, neighborhood, owner_id), profiles!viewing_requests_owner_id_fkey(full_name, avatar_url, phone)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getByOwner(ownerId) {
    const { data, error } = await supabase
      .from("viewing_requests")
      .select("*, apartments(title, images, price, neighborhood), profiles!viewing_requests_student_id_fkey(full_name, avatar_url, phone)")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getByApartment(apartmentId) {
    const { data, error } = await supabase
      .from("viewing_requests")
      .select("*, profiles!viewing_requests_student_id_fkey(full_name, avatar_url, phone)")
      .eq("apartment_id", apartmentId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async updateStatus(requestId, status, rejectReason) {
    const updates = { status };
    if (rejectReason) updates.reject_reason = rejectReason;
    const { data, error } = await supabase
      .from("viewing_requests")
      .update(updates)
      .eq("id", requestId)
      .select()
      .single();
    return { data, error };
  },

  async checkExisting(studentId, apartmentId) {
    const { data, error } = await supabase
      .from("viewing_requests")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("apartment_id", apartmentId)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    return { data, error };
  },

  async getCountsByOwner(ownerId) {
    const { data, error } = await supabase
      .from("viewing_requests")
      .select("status")
      .eq("owner_id", ownerId);
    if (error) return { pending: 0, approved: 0, rejected: 0, total: 0, error };
    const pending = data.filter((r) => r.status === "pending").length;
    const approved = data.filter((r) => r.status === "approved").length;
    const rejected = data.filter((r) => r.status === "rejected").length;
    return { pending, approved, rejected, total: data.length, error: null };
  },
};
