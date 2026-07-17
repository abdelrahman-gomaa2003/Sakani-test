import { supabase } from "../lib/supabase";

export const reviewService = {
  async getByApartment(apartmentId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, profiles(user_id:id, full_name, avatar_url)")
      .eq("apartment_id", apartmentId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getByUser(userId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, apartments(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async create({ userId, apartmentId, rating, comment, cleanliness, safety, locationRating, nearUniversity, imageAccuracy, bookingRequestId }) {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        apartment_id: apartmentId,
        rating,
        comment: comment || null,
        cleanliness: cleanliness || null,
        safety: safety || null,
        location_rating: locationRating || null,
        near_university: nearUniversity || null,
        image_accuracy: imageAccuracy || null,
        booking_request_id: bookingRequestId || null,
      })
      .select()
      .single();
    return { data, error };
  },

  async update(reviewId, updates) {
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();
    return { data, error };
  },

  async delete(reviewId) {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    return { error };
  },

  async getAverageRating(apartmentId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("apartment_id", apartmentId);
    if (error) return { average: 0, count: 0, error };
    const avg = data.length ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0;
    return { average: Math.round(avg * 10) / 10, count: data.length, error: null };
  },

  async getByApartmentAndBooking(apartmentId, bookingRequestId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("id")
      .eq("apartment_id", apartmentId)
      .eq("booking_request_id", bookingRequestId)
      .maybeSingle();
    return { data, error };
  },
};
