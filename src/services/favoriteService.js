import { supabase } from "../lib/supabase";

export const favoriteService = {
  async getFavorites(userId) {
    const { data, error } = await supabase
      .from("favorites")
      .select("apartment_id, apartments(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async addFavorite(userId, apartmentId) {
    const { data, error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, apartment_id: apartmentId })
      .select()
      .single();
    return { data, error };
  },

  async removeFavorite(userId, apartmentId) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("apartment_id", apartmentId);
    return { error };
  },

  async isFavorited(userId, apartmentId) {
    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("apartment_id", apartmentId)
      .maybeSingle();
    return { isFavorited: !!data, error };
  },
};
