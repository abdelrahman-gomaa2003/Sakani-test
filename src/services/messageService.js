import { supabase } from "../lib/supabase";

export const messageService = {
  async getConversations(userId) {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getMessages(userId, otherUserId, apartmentId) {
    let query = supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
      `)
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true });

    if (apartmentId) query = query.eq("apartment_id", apartmentId);

    const { data, error } = await query;
    return { data, error };
  },

  async sendMessage({ senderId, receiverId, apartmentId, content }) {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        apartment_id: apartmentId || null,
        content,
      })
      .select()
      .single();
    return { data, error };
  },

  async markAsRead(messageId) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);
    return { error };
  },

  async markConversationAsRead(userId, otherUserId) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", otherUserId)
      .eq("receiver_id", userId)
      .eq("is_read", false);
    return { error };
  },
};
