import { supabase } from "../lib/supabase";

export const adminService = {
  async getStats() {
    const [users, apartments, brokers, messages, reports] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("apartments").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "broker"),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("apartment_reports").select("id", { count: "exact", head: true }),
    ]);

    const pendingApartments = await supabase
      .from("apartments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const students = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student");

    const owners = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner");

    const unreadMessages = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    const activeReports = await supabase
      .from("apartment_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    return {
      totalUsers: users.count || 0,
      totalApartments: apartments.count || 0,
      totalBrokers: brokers.count || 0,
      totalMessages: messages.count || 0,
      totalReports: reports.count || 0,
      pendingApartments: pendingApartments.count || 0,
      totalStudents: students.count || 0,
      totalOwners: owners.count || 0,
      unreadMessages: unreadMessages.count || 0,
      activeReports: activeReports.count || 0,
    };
  },

  async getAllApartments({ status, limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from("apartments")
      .select("*, profiles(owner_id:id, full_name, avatar_url, role, email, phone, verification_status)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    return { data, error };
  },

  async updateApartmentStatus(id, status) {
    const { data, error } = await supabase
      .from("apartments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  async hideApartment(id) {
    return this.updateApartmentStatus(id, "hidden");
  },

  async deleteApartment(id) {
    const { error } = await supabase.from("apartments").delete().eq("id", id);
    return { error };
  },

  async getAllUsers({ role, search, limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (role && role !== "all") query = query.eq("role", role);
    if (search) query = query.ilike("full_name", `%${search}%`);

    const { data, error } = await query;
    return { data, error };
  },

  async updateUserRole(id, role) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  async deleteUser(id) {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    return { error };
  },

  async getAllBrokers({ limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "broker")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    return { data, error };
  },

  async getReports({ status, limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from("apartment_reports")
      .select("*, apartments(title, neighborhood), profiles!apartment_reports_user_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    return { data, error };
  },

  async updateReportStatus(id, status) {
    const { data, error } = await supabase
      .from("apartment_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  async getRecentApartments(limit = 5) {
    const { data, error } = await supabase
      .from("apartments")
      .select("id, title, status, price, created_at, profiles(owner_id:id, full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    return { data, error };
  },

  async getApartmentsByStatus() {
    const statuses = ["pending", "approved", "hidden", "rejected"];
    const results = await Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from("apartments")
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        return { status, count: count || 0 };
      })
    );
    return results;
  },

  async getUsersByRole() {
    const roles = ["student", "owner", "broker", "admin"];
    const results = await Promise.all(
      roles.map(async (role) => {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", role);
        return { role, count: count || 0 };
      })
    );
    return results;
  },
};
