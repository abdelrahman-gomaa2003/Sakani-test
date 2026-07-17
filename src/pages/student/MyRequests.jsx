import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { viewingRequestService } from "../../services/viewingRequestService";
import { bookingRequestService } from "../../services/bookingRequestService";
import { ownerReviewService } from "../../services/ownerReviewService";
import { reviewService } from "../../services/reviewService";
import { notificationService } from "../../services/notificationService";
import EmptyState from "../../components/ui/EmptyState";
import toast from "react-hot-toast";

const statusConfig = {
  pending: { label: "قيد المراجعة", bg: "#F59E0B", icon: "schedule", ring: "rgba(245,158,11,0.15)" },
  approved: { label: "تمت الموافقة", bg: "#10b981", icon: "check_circle", ring: "rgba(16,185,129,0.15)" },
  rejected: { label: "مرفوض", bg: "#EF4444", icon: "cancel", ring: "rgba(239,68,68,0.15)" },
  cancelled: { label: "ملغي", bg: "#6B7280", icon: "block", ring: "rgba(107,114,128,0.15)" },
  completed: { label: "مكتمل", bg: "#6366F1", icon: "task_alt", ring: "rgba(99,102,241,0.15)" },
};

const PAGE_SIZE = 5;

function StatusBadge({ status }) {
  const s = statusConfig[status] || statusConfig.pending;
  return (
    <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill fw-bold" style={{ background: s.ring, color: s.bg, fontSize: "0.78rem" }}>
      <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>{s.icon}</span>
      {s.label}
    </span>
  );
}

function StarRating({ value, onChange, onHover, hoverValue, readonly = false, size = "1.8rem" }) {
  const display = hoverValue || value;
  return (
    <div className="d-flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className="material-symbols-outlined"
          style={{
            fontSize: size,
            fontVariationSettings: star <= display ? "'FILL' 1" : "'FILL' 0",
            color: star <= display ? "#F59E0B" : "var(--outline-variant, #D0D0D0)",
            cursor: readonly ? "default" : "pointer",
            transition: "all 0.15s",
            transform: !readonly && hoverValue === star ? "scale(1.15)" : "scale(1)",
          }}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && onHover?.(star)}
          onMouseLeave={() => !readonly && onHover?.(0)}
        >
          star
        </span>
      ))}
    </div>
  );
}

function MyRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("viewing");
  const [viewingRequests, setViewingRequests] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingPage, setViewingPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());
  const [propertyReviewedBookings, setPropertyReviewedBookings] = useState(new Set());

  const [showOwnerRating, setShowOwnerRating] = useState(false);
  const [showPropertyRating, setShowPropertyRating] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);

  const [propRating, setPropRating] = useState(0);
  const [propHoverRating, setPropHoverRating] = useState(0);
  const [propCleanliness, setPropCleanliness] = useState(0);
  const [propSafety, setPropSafety] = useState(0);
  const [propLocation, setPropLocation] = useState(0);
  const [propNearUni, setPropNearUni] = useState(0);
  const [propImageAcc, setPropImageAcc] = useState(0);
  const [propComment, setPropComment] = useState("");
  const [propRatingLoading, setPropRatingLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { setLoading(false); return; }
      const [vResult, bResult] = await Promise.all([
        viewingRequestService.getByStudent(user.id),
        bookingRequestService.getByStudent(user.id),
      ]);
      setViewingRequests(vResult.data || []);
      setBookingRequests(bResult.data || []);

      const approvedBookings = (bResult.data || []).filter((r) => r.status === "approved");
      const reviewedSet = new Set();
      const propReviewedSet = new Set();
      for (const booking of approvedBookings) {
        const { hasReviewed } = await ownerReviewService.checkCanReview(user.id, booking.id);
        if (hasReviewed) reviewedSet.add(booking.id);

        const { data: propReview } = await reviewService.getByApartmentAndBooking(booking.apartment_id, booking.id);
        if (propReview) propReviewedSet.add(booking.id);
      }
      setReviewedBookings(reviewedSet);
      setPropertyReviewedBookings(propReviewedSet);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const submitOwnerReview = async (e) => {
    e.preventDefault();
    if (!ratingTarget || rating === 0) { toast.error("يرجى اختيار تقييم"); return; }
    setRatingLoading(true);
    try {
      const { error } = await ownerReviewService.create({
        reviewerId: user.id,
        reviewedId: ratingTarget.owner_id,
        bookingRequestId: ratingTarget.id,
        rating,
        comment: reviewComment,
      });
      if (error) throw error;
      await notificationService.create({
        userId: ratingTarget.owner_id,
        title: "تقييم جديد",
        message: `طالب قيّمك بـ ${rating} نجوم`,
        type: "info",
        link: "/owner/ratings",
      });
      setReviewedBookings((prev) => new Set([...prev, ratingTarget.id]));
      setShowOwnerRating(false);
      setRating(0);
      setReviewComment("");
      toast.success("تم إرسال التقييم بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء إرسال التقييم");
    }
    setRatingLoading(false);
  };

  const submitPropertyReview = async (e) => {
    e.preventDefault();
    if (!ratingTarget || propRating === 0) { toast.error("يرجى اختيار تقييم"); return; }
    setPropRatingLoading(true);
    try {
      const { error } = await reviewService.create({
        userId: user.id,
        apartmentId: ratingTarget.apartment_id,
        rating: propRating,
        comment: propComment,
        cleanliness: propCleanliness || undefined,
        safety: propSafety || undefined,
        locationRating: propLocation || undefined,
        nearUniversity: propNearUni || undefined,
        imageAccuracy: propImageAcc || undefined,
        bookingRequestId: ratingTarget.id,
      });
      if (error) throw error;
      setPropertyReviewedBookings((prev) => new Set([...prev, ratingTarget.id]));
      setShowPropertyRating(false);
      setPropRating(0);
      setPropComment("");
      setPropCleanliness(0);
      setPropSafety(0);
      setPropLocation(0);
      setPropNearUni(0);
      setPropImageAcc(0);
      toast.success("تم إرسال تقييم العقار بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء إرسال التقييم");
    }
    setPropRatingLoading(false);
  };

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  };

  const viewingPages = useMemo(() => Math.ceil(viewingRequests.length / PAGE_SIZE) || 1, [viewingRequests.length]);
  const bookingPages = useMemo(() => Math.ceil(bookingRequests.length / PAGE_SIZE) || 1, [bookingRequests.length]);
  const paginatedViewing = viewingRequests.slice((viewingPage - 1) * PAGE_SIZE, viewingPage * PAGE_SIZE);
  const paginatedBooking = bookingRequests.slice((bookingPage - 1) * PAGE_SIZE, bookingPage * PAGE_SIZE);

  const viewingCounts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    viewingRequests.forEach((r) => { if (c[r.status] !== undefined) c[r.status]++; });
    return c;
  }, [viewingRequests]);

  const bookingCounts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    bookingRequests.forEach((r) => { if (c[r.status] !== undefined) c[r.status]++; });
    return c;
  }, [bookingRequests]);

  return (
    <div className="py-4 py-md-5" style={{ direction: "rtl" }}>
      <style>{`
        .mr-page { max-width: 900px; margin: 0 auto; padding: 0 1rem; }
        .mr-tab { padding: 10px 20px; border-radius: 12px; font-weight: 700; font-size: 0.88rem; transition: all 0.25s; cursor: pointer; border: 2px solid var(--border, #e5e7eb); background: var(--surface-card, #fff); color: var(--on-surface-variant, #5A6370); display: inline-flex; align-items: center; gap: 8px; }
        .mr-tab.active { background: var(--primary, #6B9080); color: #fff; border-color: var(--primary); }
        .mr-tab:not(.active):hover { border-color: var(--primary, #6B9080); color: var(--primary); }
        .mr-tab .count { font-size: 0.72rem; padding: 2px 8px; border-radius: 9999px; }
        .mr-card { background: var(--surface-card, #fff); border: 1.5px solid var(--border, #e5e7eb); border-radius: 16px; overflow: hidden; transition: all 0.25s; }
        .mr-card:hover { border-color: var(--primary, #6B9080); box-shadow: 0 6px 24px rgba(107,144,128,0.1); transform: translateY(-2px); }
        .mr-card-img { width: 110px; height: 90px; border-radius: 12px; object-fit: cover; cursor: pointer; flex-shrink: 0; }
        .mr-action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; text-decoration: none; transition: all 0.2s; cursor: pointer; border: none; }
        .mr-action-btn:hover { transform: translateY(-1px); }
        .mr-info-row { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--on-surface-variant, #5A6370); }
        .mr-page-btn { width: 36px; height: 36px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid var(--border, #e5e7eb); background: var(--surface-card, #fff); cursor: pointer; transition: all 0.2s; font-weight: 600; font-size: 0.85rem; }
        .mr-page-btn.active { background: var(--primary, #6B9080); color: #fff; border-color: var(--primary); }
        .mr-page-btn:not(.active):hover { border-color: var(--primary); color: var(--primary); }
        .mr-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .mr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1060; display: flex; align-items: center; justify-content: center; animation: mrFadeIn 0.2s ease; backdrop-filter: blur(4px); }
        .mr-modal { background: var(--surface-card, #fff); border-radius: 20px; width: 92%; max-width: 540px; max-height: 90vh; overflow-y: auto; animation: mrSlideUp 0.3s ease; padding: 2rem; }
        @keyframes mrFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mrSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .mr-input { border: 2px solid var(--outline-variant, #D0D0D0); border-radius: 12px; height: 46px; font-size: 0.9rem; padding: 0 14px; width: 100%; transition: all 0.25s; background: var(--surface-card, #fff); }
        .mr-input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(107,144,128,0.1); }
        .mr-skeleton { background: linear-gradient(90deg, var(--border, #e5e7eb) 25%, #f0f0f0 50%, var(--border, #e5e7eb) 75%); background-size: 200% 100%; animation: mrShimmer 1.5s infinite; border-radius: 12px; }
        @keyframes mrShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div className="mr-page">
        {/* Header */}
        <div className="mb-4">
          <h1 className="h4 h3-md fw-bold mb-1 d-flex align-items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: "1.6rem" }}>list_alt</span>
            طلباتي
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "0.88rem" }}>تابع حالة طلبات المعاينة والحجز الخاصة بك</p>
        </div>

        {/* Tabs */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <button className={`mr-tab ${activeTab === "viewing" ? "active" : ""}`} onClick={() => { setActiveTab("viewing"); setViewingPage(1); }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>visibility</span>
            طلبات المعاينة
            {viewingRequests.length > 0 && (
              <span className="count" style={{ background: activeTab === "viewing" ? "rgba(255,255,255,0.25)" : "var(--primary-container, rgba(107,144,128,0.12))", color: activeTab === "viewing" ? "#fff" : "var(--primary)" }}>
                {viewingRequests.length}
              </span>
            )}
          </button>
          <button className={`mr-tab ${activeTab === "booking" ? "active" : ""}`} onClick={() => { setActiveTab("booking"); setBookingPage(1); }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>calendar_month</span>
            طلبات الحجز
            {bookingRequests.length > 0 && (
              <span className="count" style={{ background: activeTab === "booking" ? "rgba(255,255,255,0.25)" : "var(--primary-container, rgba(107,144,128,0.12))", color: activeTab === "booking" ? "#fff" : "var(--primary)" }}>
                {bookingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Stats row */}
        {!loading && user && ((activeTab === "viewing" && viewingRequests.length > 0) || (activeTab === "booking" && bookingRequests.length > 0)) && (
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {activeTab === "viewing" ? (
              <>
                {viewingCounts.pending > 0 && <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706", fontSize: "0.78rem", fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>schedule</span> قيد الانتظار: {viewingCounts.pending}</span>}
                {viewingCounts.approved > 0 && <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: "rgba(16,185,129,0.08)", color: "#059669", fontSize: "0.78rem", fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>check_circle</span> مقبول: {viewingCounts.approved}</span>}
                {viewingCounts.rejected > 0 && <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", fontSize: "0.78rem", fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>cancel</span> مرفوض: {viewingCounts.rejected}</span>}
              </>
            ) : (
              <>
                {bookingCounts.pending > 0 && <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: "rgba(245,158,11,0.08)", color: "#d97706", fontSize: "0.78rem", fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>schedule</span> قيد الانتظار: {bookingCounts.pending}</span>}
                {bookingCounts.approved > 0 && <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: "rgba(16,185,129,0.08)", color: "#059669", fontSize: "0.78rem", fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>check_circle</span> مقبول: {bookingCounts.approved}</span>}
                {bookingCounts.rejected > 0 && <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", fontSize: "0.78rem", fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>cancel</span> مرفوض: {bookingCounts.rejected}</span>}
                {bookingCounts.cancelled > 0 && <span className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: "rgba(107,114,128,0.08)", color: "#6b7280", fontSize: "0.78rem", fontWeight: 600 }}><span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>block</span> ملغي: {bookingCounts.cancelled}</span>}
              </>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="d-flex flex-column gap-3">
            {[1, 2, 3].map((i) => (
              <div className="mr-card p-4" key={i}>
                <div className="d-flex gap-3">
                  <div className="mr-skeleton" style={{ width: 110, height: 90 }} />
                  <div className="flex-grow-1">
                    <div className="mr-skeleton mb-2" style={{ width: "60%", height: 16 }} />
                    <div className="mr-skeleton mb-2" style={{ width: "40%", height: 12 }} />
                    <div className="d-flex gap-2 mt-3">
                      <div className="mr-skeleton" style={{ width: 80, height: 28, borderRadius: 8 }} />
                      <div className="mr-skeleton" style={{ width: 80, height: 28, borderRadius: 8 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !user ? (
          <EmptyState icon="lock" title="سجّل الدخول أولاً" description="يجب تسجيل الدخول لعرض طلباتك." actionLabel="تسجيل الدخول" actionTo="/login" />
        ) : activeTab === "viewing" ? (
          viewingRequests.length === 0 ? (
            <EmptyState icon="visibility_off" title="لا توجد طلبات معاينة" description="لم تقم بإرسال أي طلبات معاينة بعد." actionLabel="تصفح الشقق" actionTo="/apartments" />
          ) : (
            <>
              <div className="d-flex flex-column gap-3">
                {paginatedViewing.map((req) => {
                  const apt = req.apartments;
                  const ownerProfile = req.profiles;
                  const isBroker = ownerProfile?.role === "broker";
                  const ownerName = isBroker ? "الوسيط" : "المالك";
                  return (
                    <div className="mr-card p-4" key={req.id}>
                      <div className="d-flex gap-3">
                        <img
                          src={apt?.images?.[0] || "https://via.placeholder.com/110x90"}
                          alt={apt?.title || ""}
                          className="mr-card-img"
                          onClick={() => apt?.id && navigate(`/apartment/${apt.id}`)}
                        />
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex justify-content-between align-items-start mb-2 gap-2 flex-wrap">
                            <div className="min-w-0">
                              <h4 className="fw-bold mb-0 text-truncate" style={{ fontSize: "0.95rem", cursor: "pointer" }} onClick={() => apt?.id && navigate(`/apartment/${apt.id}`)}>
                                {apt?.title || "شقة"}
                              </h4>
                              <div className="d-flex align-items-center gap-2 mt-1">
                                {ownerProfile && (
                                  <span className="d-inline-flex align-items-center gap-1 text-muted" style={{ fontSize: "0.78rem" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "0.85rem" }}>{isBroker ? "handshake" : "person"}</span>
                                    {ownerProfile.full_name || ownerName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={req.status} />
                          </div>
                          <div className="d-flex flex-wrap gap-x-4 gap-y-1 mb-2">
                            {apt?.neighborhood && (
                              <span className="mr-info-row">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: "0.9rem" }}>location_on</span>
                                {apt.neighborhood}
                              </span>
                            )}
                            <span className="mr-info-row">
                              <span className="material-symbols-outlined text-primary" style={{ fontSize: "0.9rem" }}>event</span>
                              {formatDate(req.viewing_date)}
                            </span>
                            <span className="mr-info-row">
                              <span className="material-symbols-outlined text-primary" style={{ fontSize: "0.9rem" }}>schedule</span>
                              {req.viewing_time?.slice(0, 5)}
                            </span>
                          </div>
                          {req.notes && <p className="text-muted mb-2" style={{ fontSize: "0.82rem", fontStyle: "italic" }}>ملاحظات: {req.notes}</p>}
                          {req.status === "rejected" && req.reject_reason && (
                            <div className="d-flex align-items-start gap-2 p-2 rounded-3 mb-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                              <span className="material-symbols-outlined mt-1" style={{ fontSize: "1rem", color: "#EF4444" }}>info</span>
                              <span style={{ fontSize: "0.82rem", color: "#dc2626" }}>سبب الرفض: {req.reject_reason}</span>
                            </div>
                          )}
                          <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top flex-wrap gap-2" style={{ borderColor: "var(--border, #e5e7eb)" }}>
                            <small className="text-muted" style={{ fontSize: "0.75rem" }}>أُرسل: {formatDate(req.created_at)}</small>
                            <div className="d-flex gap-2 flex-wrap">
                              {req.status === "approved" && (
                                <>
                                  <a href={`/messages?ownerId=${req.owner_id}&apartmentId=${req.apartment_id}`} className="mr-action-btn" style={{ background: "var(--primary-container, rgba(107,144,128,0.1))", color: "var(--primary)" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>chat</span>
                                    محادثة
                                  </a>
                                  {ownerProfile?.phone && (
                                    <a href={`https://wa.me/2${ownerProfile.phone}`} target="_blank" rel="noreferrer" className="mr-action-btn" style={{ background: "#25D366", color: "#fff" }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>call</span>
                                      واتساب
                                    </a>
                                  )}
                                  {apt?.latitude && apt?.longitude && (
                                    <a href={`https://www.openstreetmap.org/?mlat=${apt.latitude}&mlon=${apt.longitude}#map=16/${apt.latitude}/${apt.longitude}`} target="_blank" rel="noreferrer" className="mr-action-btn" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>map</span>
                                      الخريطة
                                    </a>
                                  )}
                                </>
                              )}
                              {apt?.id && (
                                <button className="mr-action-btn" style={{ background: "var(--surface-container, #f1f5f9)", color: "var(--on-surface)" }} onClick={() => navigate(`/apartment/${apt.id}`)}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>open_in_new</span>
                                  العقار
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {viewingPages > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button className="mr-page-btn" disabled={viewingPage <= 1} onClick={() => setViewingPage((p) => p - 1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chevron_right</span>
                  </button>
                  {Array.from({ length: viewingPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`mr-page-btn ${p === viewingPage ? "active" : ""}`} onClick={() => setViewingPage(p)}>{p}</button>
                  ))}
                  <button className="mr-page-btn" disabled={viewingPage >= viewingPages} onClick={() => setViewingPage((p) => p + 1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chevron_left</span>
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          bookingRequests.length === 0 ? (
            <EmptyState icon="calendar_off" title="لا توجد طلبات حجز" description="لم تقم بإرسال أي طلبات حجز بعد." actionLabel="تصفح الشقق" actionTo="/apartments" />
          ) : (
            <>
              <div className="d-flex flex-column gap-3">
                {paginatedBooking.map((req) => {
                  const apt = req.apartments;
                  const ownerProfile = req.profiles;
                  const isBroker = ownerProfile?.role === "broker";
                  const ownerName = isBroker ? "الوسيط" : "المالك";
                  const isApproved = req.status === "approved";
                  const isCompleted = req.status === "completed";
                  const canRate = isApproved || isCompleted;
                  return (
                    <div className="mr-card p-4" key={req.id}>
                      <div className="d-flex gap-3">
                        <img
                          src={apt?.images?.[0] || "https://via.placeholder.com/110x90"}
                          alt={apt?.title || ""}
                          className="mr-card-img"
                          onClick={() => apt?.id && navigate(`/apartment/${apt.id}`)}
                        />
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex justify-content-between align-items-start mb-2 gap-2 flex-wrap">
                            <div className="min-w-0">
                              <h4 className="fw-bold mb-0 text-truncate" style={{ fontSize: "0.95rem", cursor: "pointer" }} onClick={() => apt?.id && navigate(`/apartment/${apt.id}`)}>
                                {apt?.title || "شقة"}
                              </h4>
                              {ownerProfile && (
                                <span className="d-inline-flex align-items-center gap-1 text-muted mt-1" style={{ fontSize: "0.78rem" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "0.85rem" }}>{isBroker ? "handshake" : "person"}</span>
                                  {ownerProfile.full_name || ownerName}
                                </span>
                              )}
                            </div>
                            <StatusBadge status={req.status} />
                          </div>
                          <div className="d-flex flex-wrap gap-x-4 gap-y-1 mb-2">
                            {apt?.neighborhood && (
                              <span className="mr-info-row">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: "0.9rem" }}>location_on</span>
                                {apt.neighborhood}
                              </span>
                            )}
                            <span className="mr-info-row">
                              <span className="material-symbols-outlined text-primary" style={{ fontSize: "0.9rem" }}>event</span>
                              يبدأ: {formatDate(req.start_date)}
                            </span>
                            <span className="mr-info-row">
                              <span className="material-symbols-outlined text-primary" style={{ fontSize: "0.9rem" }}>schedule</span>
                              {req.duration_months} {req.duration_months === 1 ? "شهر" : "أشهر"}
                            </span>
                            <span className="mr-info-row">
                              <span className="material-symbols-outlined text-primary" style={{ fontSize: "0.9rem" }}>group</span>
                              {req.num_persons} {req.num_persons === 1 ? "شخص" : "أشخاص"}
                            </span>
                          </div>
                          {req.notes && <p className="text-muted mb-2" style={{ fontSize: "0.82rem", fontStyle: "italic" }}>ملاحظات: {req.notes}</p>}
                          {req.status === "rejected" && req.reject_reason && (
                            <div className="d-flex align-items-start gap-2 p-2 rounded-3 mb-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                              <span className="material-symbols-outlined mt-1" style={{ fontSize: "1rem", color: "#EF4444" }}>info</span>
                              <span style={{ fontSize: "0.82rem", color: "#dc2626" }}>سبب الرفض: {req.reject_reason}</span>
                            </div>
                          )}

                          {/* Action buttons for approved/completed */}
                          {canRate && (
                            <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top flex-wrap gap-2" style={{ borderColor: "var(--border, #e5e7eb)" }}>
                              <small className="text-muted" style={{ fontSize: "0.75rem" }}>أُرسل: {formatDate(req.created_at)}</small>
                              <div className="d-flex gap-2 flex-wrap">
                                <a href={`/messages?ownerId=${req.owner_id}&apartmentId=${req.apartment_id}`} className="mr-action-btn" style={{ background: "var(--primary-container, rgba(107,144,128,0.1))", color: "var(--primary)" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>chat</span>
                                  محادثة
                                </a>
                                {ownerProfile?.phone && (
                                  <a href={`https://wa.me/2${ownerProfile.phone}`} target="_blank" rel="noreferrer" className="mr-action-btn" style={{ background: "#25D366", color: "#fff" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>call</span>
                                    واتساب
                                  </a>
                                )}
                                {apt?.id && (
                                  <button className="mr-action-btn" style={{ background: "var(--surface-container, #f1f5f9)", color: "var(--on-surface)" }} onClick={() => navigate(`/apartment/${apt.id}`)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>open_in_new</span>
                                    العقار
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Rating section for approved/completed */}
                          {canRate && (
                            <div className="mt-3 p-3 rounded-3" style={{ background: "var(--surface-container-low, #f8f9fa)" }}>
                              <p className="fw-bold mb-2" style={{ fontSize: "0.82rem", color: "var(--on-surface)" }}>التقييمات</p>
                              <div className="d-flex gap-2 flex-wrap">
                                {!reviewedBookings.has(req.id) ? (
                                  <button className="mr-action-btn" style={{ background: "#FEF3C7", color: "#92400E" }} onClick={() => { setRatingTarget(req); setRating(0); setReviewComment(""); setShowOwnerRating(true); }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>star</span>
                                    تقييم {ownerName}
                                  </button>
                                ) : (
                                  <span className="mr-action-btn" style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>check_circle</span>
                                    تم تقييم {ownerName}
                                  </span>
                                )}
                                {!propertyReviewedBookings.has(req.id) ? (
                                  <button className="mr-action-btn" style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }} onClick={() => { setRatingTarget(req); setPropRating(0); setPropComment(""); setPropCleanliness(0); setPropSafety(0); setPropLocation(0); setPropNearUni(0); setPropImageAcc(0); setShowPropertyRating(true); }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>apartment</span>
                                    تقييم العقار
                                  </button>
                                ) : (
                                  <span className="mr-action-btn" style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>check_circle</span>
                                    تم تقييم العقار
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {req.status !== "rejected" && !canRate && (
                            <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center" style={{ borderColor: "var(--border, #e5e7eb)" }}>
                              <small className="text-muted" style={{ fontSize: "0.75rem" }}>أُرسل: {formatDate(req.created_at)}</small>
                              {apt?.id && (
                                <button className="mr-action-btn" style={{ background: "var(--surface-container, #f1f5f9)", color: "var(--on-surface)" }} onClick={() => navigate(`/apartment/${apt.id}`)}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>open_in_new</span>
                                  العقار
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {bookingPages > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button className="mr-page-btn" disabled={bookingPage <= 1} onClick={() => setBookingPage((p) => p - 1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chevron_right</span>
                  </button>
                  {Array.from({ length: bookingPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`mr-page-btn ${p === bookingPage ? "active" : ""}`} onClick={() => setBookingPage(p)}>{p}</button>
                  ))}
                  <button className="mr-page-btn" disabled={bookingPage >= bookingPages} onClick={() => setBookingPage((p) => p + 1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chevron_left</span>
                  </button>
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* Owner/Broker Rating Modal */}
      {showOwnerRating && (
        <div className="mr-overlay" onClick={() => setShowOwnerRating(false)}>
          <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem" }}>
                <span className="material-symbols-outlined" style={{ color: "#F59E0B", fontVariationSettings: "'FILL' 1" }}>star</span>
                تقييم {ratingTarget?.profiles?.role === "broker" ? "الوسيط" : "المالك"}
              </h3>
              <button className="btn btn-sm rounded-circle" style={{ width: 36, height: 36, background: "var(--surface-container, #f1f3f5)" }} onClick={() => setShowOwnerRating(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>close</span>
              </button>
            </div>
            {ratingTarget && <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>الشقة: <strong>{ratingTarget.apartments?.title || ""}</strong></p>}
            <form onSubmit={submitOwnerReview}>
              <div className="mb-4 text-center">
                <label className="form-label fw-bold small text-muted mb-2 d-block">تقييمك</label>
                <StarRating value={rating} onChange={setRating} onHover={setHoverRating} hoverValue={hoverRating} size="2.4rem" />
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold small text-muted mb-2">تعليقك (اختياري)</label>
                <textarea className="mr-input" style={{ height: "auto", minHeight: 100, padding: "12px 14px", resize: "vertical" }} placeholder="اكتب تجربتك..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
              </div>
              <button type="submit" className="btn w-100 py-3 rounded-4 fw-bold" style={{ background: "var(--primary, #6B9080)", color: "#fff", fontSize: "0.95rem" }} disabled={ratingLoading || rating === 0}>
                {ratingLoading ? <span className="spinner-border spinner-border-sm ms-2" /> : <span className="material-symbols-outlined ms-1" style={{ fontSize: "1rem" }}>send</span>}
                {ratingLoading ? "جاري الإرسال..." : "إرسال التقييم"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Property Rating Modal */}
      {showPropertyRating && (
        <div className="mr-overlay" onClick={() => setShowPropertyRating(false)}>
          <div className="mr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem" }}>
                <span className="material-symbols-outlined" style={{ color: "#6366F1", fontVariationSettings: "'FILL' 1" }}>apartment</span>
                تقييم العقار
              </h3>
              <button className="btn btn-sm rounded-circle" style={{ width: 36, height: 36, background: "var(--surface-container, #f1f3f5)" }} onClick={() => setShowPropertyRating(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>close</span>
              </button>
            </div>
            {ratingTarget && <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>الشقة: <strong>{ratingTarget.apartments?.title || ""}</strong></p>}
            <form onSubmit={submitPropertyReview}>
              <div className="mb-3 text-center">
                <label className="form-label fw-bold small text-muted mb-2 d-block">التقييم العام</label>
                <StarRating value={propRating} onChange={setPropRating} onHover={setPropHoverRating} hoverValue={propHoverRating} size="2.2rem" />
              </div>
              {[
                { label: "النظافة", value: propCleanliness, set: setPropCleanliness },
                { label: "الأمان", value: propSafety, set: setPropSafety },
                { label: "الموقع", value: propLocation, set: setPropLocation },
                { label: "القرب من الجامعة", value: propNearUni, set: setPropNearUni },
                { label: "دقة الصور", value: propImageAcc, set: setPropImageAcc },
              ].map((item) => (
                <div key={item.label} className="d-flex align-items-center justify-content-between mb-2 p-2 rounded-3" style={{ background: "var(--surface-container-low, #f8f9fa)" }}>
                  <span className="fw-bold" style={{ fontSize: "0.85rem" }}>{item.label}</span>
                  <StarRating value={item.value} onChange={item.set} size="1.2rem" />
                </div>
              ))}
              <div className="my-3">
                <label className="form-label fw-bold small text-muted mb-2">تعليقك (اختياري)</label>
                <textarea className="mr-input" style={{ height: "auto", minHeight: 80, padding: "12px 14px", resize: "vertical" }} placeholder="اكتب تجربتك في السكن..." value={propComment} onChange={(e) => setPropComment(e.target.value)} />
              </div>
              <button type="submit" className="btn w-100 py-3 rounded-4 fw-bold" style={{ background: "#6366F1", color: "#fff", fontSize: "0.95rem" }} disabled={propRatingLoading || propRating === 0}>
                {propRatingLoading ? <span className="spinner-border spinner-border-sm ms-2" /> : <span className="material-symbols-outlined ms-1" style={{ fontSize: "1rem" }}>send</span>}
                {propRatingLoading ? "جاري الإرسال..." : "إرسال تقييم العقار"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRequests;
