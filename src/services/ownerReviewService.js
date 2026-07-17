import { supabase } from "../lib/supabase";

export const ownerReviewService = {
  async create({ reviewerId, reviewedId, bookingRequestId, rating, comment }) {
    const { data, error } = await supabase
      .from("owner_reviews")
      .insert({
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        booking_request_id: bookingRequestId || null,
        rating,
        comment: comment || null,
      })
      .select("*, profiles!owner_reviews_reviewer_id_fkey(full_name, avatar_url)")
      .single();
    return { data, error };
  },

  async getForUser(userId) {
    const { data, error } = await supabase
      .from("owner_reviews")
      .select("*, profiles!owner_reviews_reviewer_id_fkey(full_name, avatar_url)")
      .eq("reviewed_id", userId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async getAverageRating(userId) {
    const { data, error } = await supabase
      .from("owner_reviews")
      .select("rating")
      .eq("reviewed_id", userId);
    if (error) return { average: 0, count: 0, error };
    const avg = data.length ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0;
    return { average: Math.round(avg * 10) / 10, count: data.length, error: null };
  },

  async checkCanReview(studentId, bookingRequestId) {
    const { data, error } = await supabase
      .from("owner_reviews")
      .select("id")
      .eq("reviewer_id", studentId)
      .eq("booking_request_id", bookingRequestId)
      .maybeSingle();
    return { hasReviewed: !!data, error };
  },

  async delete(reviewId) {
    const { error } = await supabase.from("owner_reviews").delete().eq("id", reviewId);
    return { error };
  },
};
