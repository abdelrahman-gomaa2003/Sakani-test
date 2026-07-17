import { supabase } from "../lib/supabase";

export const notificationService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    return { count, error };
  },

  async markAsRead(notificationId) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    return { error };
  },

  async markAllAsRead(userId) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    return { error };
  },

  async create({ userId, title, message, type = "info", link }) {
    const { data, error } = await supabase
      .from("notifications")
      .insert({ user_id: userId, title, message, type, link })
      .select()
      .single();
    return { data, error };
  },
};
