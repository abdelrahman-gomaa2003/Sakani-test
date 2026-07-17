import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ownerReviewService } from "../../services/ownerReviewService";
import { SkeletonList } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

function OwnerRatings() {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      const [reviewsResult, statsResult] = await Promise.allSettled([
        ownerReviewService.getForUser(profile.id),
        ownerReviewService.getAverageRating(profile.id),
      ]);
      setReviews(reviewsResult.status === "fulfilled" ? (reviewsResult.value.data || []) : []);
      setStats(statsResult.status === "fulfilled" ? { average: statsResult.value.average || 0, count: statsResult.value.count || 0 } : { average: 0, count: 0 });
      setLoading(false);
    };
    fetchData();
  }, [profile]);

  const starBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className="material-symbols-outlined"
        style={{
          fontSize: 18,
          color: i < rating ? "#f59e0b" : "var(--outline, #b0b0b0)",
          fontVariationSettings: i < rating ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        star
      </span>
    ));
  };

  return (
    <div className="py-3 d-flex flex-column gap-4 owner-stagger">
      <section className="owner-section" style={{ animationDelay: "0.04s" }}>
        <div className="d-flex align-items-center gap-3 mb-1">
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#f59e0b" }}>star</span>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.75rem", color: "var(--on-surface, #1A1D23)" }}>تقييماتي</h2>
        </div>
        <p className="mb-0" style={{ color: "var(--on-surface-variant, #5A6370)" }}>
          تقييمات الطلاب الذين تعاملوا معك
        </p>
      </section>

      {loading ? (
        <SkeletonList count={3} />
      ) : (
        <>
          {/* Stats Section */}
          {reviews.length > 0 && (
            <div className="owner-section-card p-4 owner-section" style={{ animationDelay: "0.08s" }}>
              <div className="d-flex flex-column flex-md-row align-items-md-center gap-4">
                {/* Average Rating */}
                <div className="text-center flex-shrink-0" style={{ minWidth: 140 }}>
                  <h1 className="fw-bold mb-0" style={{ fontSize: "3rem", color: "#f59e0b", lineHeight: 1 }}>{stats.average}</h1>
                  <div className="d-flex align-items-center justify-content-center gap-1 mt-1">
                    {renderStars(Math.round(stats.average))}
                  </div>
                  <p className="mb-0 mt-1" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5A6370)" }}>
                    من {stats.count} {stats.count === 1 ? "تقييم" : "تقييمات"}
                  </p>
                </div>

                {/* Star Breakdown */}
                <div className="flex-grow-1">
                  {starBreakdown.map(({ star, count, pct }) => (
                    <div key={star} className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: "0.85rem" }}>
                      <span className="fw-bold" style={{ color: "var(--on-surface, #1A1D23)", minWidth: 20, textAlign: "center" }}>{star}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#f59e0b", fontVariationSettings: "'FILL' 1" }}>star</span>
                      <div className="flex-grow-1 rounded-3 overflow-hidden" style={{ height: 8, background: "var(--surface-container-low, #F5F3EE)" }}>
                        <div
                          className="h-100 rounded-3"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg, #f59e0b, #d97706)",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                      <span style={{ color: "var(--on-surface-variant, #5A6370)", minWidth: 35, textAlign: "start" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <EmptyState icon="rate_review" title="لا توجد تقييمات" description="لم تتلقَ أي تقييمات من الطلاب بعد" />
          ) : (
            <div className="d-flex flex-column gap-3 owner-stagger">
              {reviews.map((review) => (
                <div key={review.id} className="owner-section-card p-4" style={{ animation: `ownerFadeInUp 0.4s ease both` }}>
                  <div className="d-flex align-items-start gap-3">
                    {/* Reviewer Avatar */}
                    <div className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: 48, height: 48, background: "var(--primary)", color: "white" }}>
                      {review.profiles?.avatar_url ? (
                        <img src={review.profiles.avatar_url} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                      ) : (
                        <span className="fw-bold" style={{ fontSize: 16 }}>{review.profiles?.full_name?.charAt(0) || "ط"}</span>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <h6 className="fw-bold mb-0" style={{ fontSize: "0.95rem", color: "var(--on-surface, #1A1D23)" }}>{review.profiles?.full_name || "طالب"}</h6>
                        <small style={{ color: "var(--on-surface-variant, #5A6370)" }}>{formatDate(review.created_at)}</small>
                      </div>
                      <div className="d-flex align-items-center gap-1 mb-2">
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="mb-0 p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)", fontSize: "0.9rem", color: "var(--on-surface-variant, #5A6370)", lineHeight: 1.6 }}>
                          {review.comment}
                        </p>
                      )}
                      {review.booking_request_id && (
                        <div className="mt-2 d-flex align-items-center gap-1" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #5A6370)" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>link</span>
                          مرتبط بطلب حجز
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OwnerRatings;
