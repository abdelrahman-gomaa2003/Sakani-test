import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { bookingRequestService } from "../../services/bookingRequestService";
import { notificationService } from "../../services/notificationService";
import { SkeletonList } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
import toast from "react-hot-toast";

const statusConfig = {
  pending: { label: "قيد الانتظار", bg: "rgba(245,158,11,0.1)", color: "#d97706", icon: "schedule" },
  approved: { label: "تمت الموافقة", bg: "rgba(16,185,129,0.1)", color: "#059669", icon: "check_circle" },
  rejected: { label: "مرفوض", bg: "rgba(186,26,26,0.1)", color: "#ba1a1a", icon: "cancel" },
  cancelled: { label: "ملغي", bg: "rgba(107,114,128,0.1)", color: "#6b7280", icon: "block" },
};

const tabs = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "قيد الانتظار" },
  { key: "approved", label: "تمت الموافقة" },
  { key: "rejected", label: "مرفوض" },
];

function BookingRequests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchRequests = async () => {
    if (!profile) return;
    const { data } = await bookingRequestService.getByOwner(profile.id);
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!profile) return;
      const { data } = await bookingRequestService.getByOwner(profile.id);
      if (!cancelled) { setRequests(data || []); setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [profile]);

  const filtered = requests.filter((r) => filter === "all" || r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const handleApprove = async () => {
    if (!confirmAction) return;
    setProcessing(true);
    const { error } = await bookingRequestService.updateStatus(confirmAction.id, "approved");
    if (error) {
      toast.error("فشل الموافقة على الطلب");
      setProcessing(false);
      setConfirmAction(null);
      return;
    }
    await notificationService.create({
      userId: confirmAction.student_id,
      title: "تمت الموافقة على طلب الحجز",
      message: `تمت الموافقة على طلب حجز شقة "${confirmAction.apartments?.title}"`,
      type: "success",
      link: "/student/booking-requests",
    });
    toast.success("تمت الموافقة على الطلب بنجاح");
    setConfirmAction(null);
    setProcessing(false);
    fetchRequests();
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) {
      toast.error("يرجى كتابة سبب الرفض");
      return;
    }
    setProcessing(true);
    const { error } = await bookingRequestService.updateStatus(rejectId, "rejected", rejectReason.trim());
    if (error) {
      toast.error("فشل رفض الطلب");
      setProcessing(false);
      setRejectId(null);
      setRejectReason("");
      return;
    }
    const req = requests.find((r) => r.id === rejectId);
    if (req) {
      await notificationService.create({
        userId: req.student_id,
        title: "تم رفض طلب الحجز",
        message: `تم رفض طلب حجز شقة "${req.apartments?.title}". السبب: ${rejectReason.trim()}`,
        type: "error",
        link: "/student/booking-requests",
      });
    }
    toast.success("تم رفض الطلب بنجاح");
    setRejectId(null);
    setRejectReason("");
    setProcessing(false);
    fetchRequests();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  };

  const stats = [
    { label: "قيد الانتظار", value: pendingCount, icon: "schedule", bg: "rgba(245,158,11,0.1)", color: "#d97706" },
    { label: "تمت الموافقة", value: approvedCount, icon: "check_circle", bg: "rgba(16,185,129,0.1)", color: "#059669" },
    { label: "مرفوض", value: rejectedCount, icon: "cancel", bg: "rgba(186,26,26,0.1)", color: "#ba1a1a" },
  ];

  return (
    <div className="py-3 d-flex flex-column gap-4 owner-stagger">
      <section className="owner-section" style={{ animationDelay: "0.04s" }}>
        <div className="d-flex align-items-center gap-3 mb-1">
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--primary)" }}>calendar_month</span>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.75rem", color: "var(--on-surface, #1A1D23)" }}>طلبات الحجز</h2>
        </div>
        <p className="mb-0" style={{ color: "var(--on-surface-variant, #5A6370)" }}>
          إدارة طلبات الحجز الواردة من الطلاب
        </p>
      </section>

      {loading ? (
        <SkeletonList count={4} />
      ) : (
        <>
          {/* Stats */}
          <div className="row g-3 owner-stagger">
            {stats.map((stat, i) => (
              <div key={i} className="col-12 col-sm-4">
                <div
                  className="owner-section-card p-4 d-flex align-items-center gap-3"
                  style={{ animation: `ownerFadeInUp 0.45s ease both`, animationDelay: `${0.1 + i * 0.06}s` }}
                >
                  <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: 52, height: 52, background: stat.bg, color: stat.color }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{stat.icon}</span>
                  </div>
                  <div>
                    <p className="mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #5A6370)" }}>{stat.label}</p>
                    <h4 className="fw-bold mb-0" style={{ fontSize: "var(--fs-xl)", color: stat.color }}>{stat.value}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="owner-section-card p-3 owner-section" style={{ animationDelay: "0.2s" }}>
            <div className="d-flex gap-2 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className="btn btn-sm fw-bold"
                  onClick={() => setFilter(tab.key)}
                  style={{
                    background: filter === tab.key ? "var(--primary)" : "transparent",
                    color: filter === tab.key ? "white" : "var(--on-surface-variant, #5A6370)",
                    borderRadius: "var(--radius-md, 12px)",
                    padding: "8px 18px",
                    transition: "all 0.2s ease",
                  }}
                >
                  {tab.label}
                  {tab.key !== "all" && (
                    <span className="ms-1" style={{ opacity: 0.8 }}>
                      ({tab.key === "pending" ? pendingCount : tab.key === "approved" ? approvedCount : rejectedCount})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          {filtered.length === 0 ? (
            <EmptyState icon="event_busy" title="لا توجد طلبات" description="لم يتم استلام أي طلبات حجز بعد" />
          ) : (
            <div className="d-flex flex-column gap-3 owner-stagger">
              {filtered.map((req) => {
                const st = statusConfig[req.status] || statusConfig.pending;
                return (
                  <div key={req.id} className="owner-section-card p-4" style={{ animation: `ownerFadeInUp 0.4s ease both` }}>
                    <div className="d-flex flex-column flex-md-row align-items-md-start gap-4">
                      {/* Student Info */}
                      <div className="d-flex align-items-center gap-3 flex-shrink-0">
                        <div className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: 52, height: 52, background: "var(--primary)", color: "white" }}>
                          {req.profiles?.avatar_url ? (
                            <img src={req.profiles.avatar_url} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                          ) : (
                            <span className="fw-bold" style={{ fontSize: 18 }}>{req.profiles?.full_name?.charAt(0) || "ط"}</span>
                          )}
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface, #1A1D23)" }}>{req.profiles?.full_name || "طالب"}</h6>
                          <span className="owner-badge mt-1" style={{ background: st.bg, color: st.color }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{st.icon}</span>
                            {st.label}
                          </span>
                        </div>
                      </div>

                      {/* Request Details */}
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-3 mb-2">
                          {req.apartments?.images?.[0] && (
                            <img src={req.apartments.images[0]} alt="" className="rounded-3 flex-shrink-0" style={{ width: 56, height: 42, objectFit: "cover" }} />
                          )}
                          <div>
                            <h6 className="fw-bold mb-0" style={{ fontSize: "0.95rem", color: "var(--on-surface, #1A1D23)" }}>{req.apartments?.title || "شقة"}</h6>
                            {req.apartments?.neighborhood && (
                              <small style={{ color: "var(--on-surface-variant, #5A6370)" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: "middle" }}>location_on</span>
                                {req.apartments.neighborhood}
                              </small>
                            )}
                          </div>
                        </div>
                        <div className="d-flex flex-wrap gap-3 mt-2" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5A6370)" }}>
                          <div className="d-flex align-items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>event</span>
                            <span>تاريخ البداية: {formatDate(req.start_date)}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                            <span>المدة: {req.duration_months} {req.duration_months === 1 ? "شهر" : "أشهر"}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
                            <span>{req.num_persons || 1} {(req.num_persons || 1) === 1 ? "شخص" : "أشخاص"}</span>
                          </div>
                        </div>
                        {req.notes && (
                          <p className="mt-2 mb-0 p-2 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)", fontSize: "0.85rem", color: "var(--on-surface-variant, #5A6370)" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle" }}>sticky_note_2</span> {req.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {req.status === "pending" && (
                        <div className="d-flex gap-2 flex-shrink-0">
                          <button
                            className="btn btn-sm d-inline-flex align-items-center gap-1 fw-bold owner-btn-lift"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#059669", borderRadius: "var(--radius-md, 12px)", padding: "8px 16px" }}
                            onClick={() => setConfirmAction(req)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                            قبول
                          </button>
                          <button
                            className="btn btn-sm d-inline-flex align-items-center gap-1 fw-bold owner-btn-lift"
                            style={{ background: "rgba(186,26,26,0.1)", color: "#ba1a1a", borderRadius: "var(--radius-md, 12px)", padding: "8px 16px" }}
                            onClick={() => { setRejectId(req.id); setRejectReason(""); }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                            رفض
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Approve Confirmation */}
      <ConfirmModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleApprove}
        title="الموافقة على طلب الحجز"
        message={`هل أنت متأكد من الموافقة على طلب حجز شقة "${confirmAction?.apartments?.title}" من ${confirmAction?.profiles?.full_name}؟`}
        confirmLabel="موافقة"
        loading={processing}
      />

      {/* Reject Modal */}
      {rejectId && (
        <>
          <div className="position-fixed top-0 start-0 bottom-0 w-100" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }} onClick={() => { setRejectId(null); setRejectReason(""); }} />
          <div className="position-fixed top-50 start-50 translate-middle p-4 rounded-4" style={{ background: "#fff", zIndex: 1051, width: "90%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div className="text-center mb-3">
              <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, color: "#ba1a1a" }}>cancel</span>
              <h5 className="fw-bold">رفض طلب الحجز</h5>
              <p style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>يرجى كتابة سبب الرفض</p>
            </div>
            <textarea
              className="form-control owner-input mb-3"
              rows={3}
              placeholder="اكتب سبب الرفض..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ borderRadius: "var(--radius-md, 12px)" }}
            />
            <div className="d-flex gap-2">
              <button className="btn flex-grow-1" style={{ border: "1px solid var(--border)" }} onClick={() => { setRejectId(null); setRejectReason(""); }} disabled={processing}>إلغاء</button>
              <button className="btn flex-grow-1 text-white fw-bold" style={{ background: "#ba1a1a", borderRadius: "var(--radius-md, 12px)" }} onClick={handleReject} disabled={processing || !rejectReason.trim()}>
                {processing ? "جاري المعالجة..." : "رفض الطلب"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BookingRequests;
