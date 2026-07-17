import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { apartmentService } from "../../services/apartmentService";
import { subscriptionService } from "../../services/subscriptionService";
import { realtimeService } from "../../services/realtimeService";
import { reviewService } from "../../services/reviewService";
import { Link } from "react-router-dom";
import { SkeletonStats } from "../../components/ui/Skeleton";
import AnimatedCounter from "../../components/ui/AnimatedCounter";
import toast from "react-hot-toast";
import { Chart } from "chart.js/auto";

function Dashboard() {
  const { user, profile } = useAuth();
  const [apartments, setApartments] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const barRef = useRef(null);
  const doughnutRef = useRef(null);
  const barInstance = useRef(null);
  const doughnutInstance = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      const [aptResult, subResult] = await Promise.allSettled([
        apartmentService.getByOwner(profile.id),
        subscriptionService.getCurrent(profile.id),
      ]);

      const apts = aptResult.status === "fulfilled" ? (aptResult.value.data || []) : [];

      const enriched = await Promise.all(
        apts.map(async (apt) => {
          const ratingData = await reviewService.getAverageRating(apt.id);
          return { ...apt, avgRating: ratingData.average || 0, reviewCount: ratingData.count || 0 };
        })
      );

      setApartments(enriched);
      if (subResult.status === "fulfilled") setSubscription(subResult.value.data);
      setLoading(false);
    };
    fetchData();

    const unsub = realtimeService.subscribeToNotifications(user?.id, (n) => {
      toast(n.title || "إشعار جديد", { icon: "🔔" });
    });

    return unsub;
  }, [profile, user]);

  useEffect(() => {
    if (loading || apartments.length === 0) return;

    if (barInstance.current) barInstance.current.destroy();
    if (doughnutInstance.current) doughnutInstance.current.destroy();

    const topApartments = [...apartments].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

    barInstance.current = new Chart(barRef.current, {
      type: "bar",
      data: {
        labels: topApartments.map((a) => a.title?.slice(0, 15) || "شقة"),
        datasets: [{
          label: "المشاهدات",
          data: topApartments.map((a) => a.views || 0),
          backgroundColor: "rgba(107,144,128,0.6)",
          borderColor: "#6B9080",
          borderWidth: 1,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 10 } } } },
      },
    });

    const statusCounts = {
      approved: apartments.filter((a) => a.status === "approved").length,
      pending: apartments.filter((a) => a.status === "pending").length,
      rejected: apartments.filter((a) => a.status === "rejected").length,
      hidden: apartments.filter((a) => a.status === "hidden").length,
    };

    doughnutInstance.current = new Chart(doughnutRef.current, {
      type: "doughnut",
      data: {
        labels: ["منشورة", "قيد المراجعة", "مرفوضة", "مخفي"],
        datasets: [{
          data: [statusCounts.approved, statusCounts.pending, statusCounts.rejected, statusCounts.hidden],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#94a3b8"],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { padding: 16, font: { size: 12 }, usePointStyle: true } } },
        cutout: "65%",
      },
    });

    return () => {
      if (barInstance.current) barInstance.current.destroy();
      if (doughnutInstance.current) doughnutInstance.current.destroy();
    };
  }, [loading, apartments]);

  const totalViews = apartments.reduce((sum, a) => sum + (a.views || 0), 0);
  const pendingCount = apartments.filter((a) => a.status === "pending").length;
  const approvedCount = apartments.filter((a) => a.status === "approved").length;
  const userName = profile?.full_name?.split(" ")[0] || "المالك";
  const planInfo = subscriptionService.getPlanInfo(subscription);

  const stats = [
    { icon: "apartment", label: "إجمالي الشقق", value: apartments.length, suffix: " وحدة", iconBg: "rgba(107,144,128,0.1)", iconColor: "var(--primary)" },
    { icon: "visibility", label: "إجمالي المشاهدات", value: totalViews, suffix: "", iconBg: "rgba(0,109,55,0.1)", iconColor: "var(--success, #006d37)" },
    { icon: "check_circle", label: "شقق منشورة", value: approvedCount, suffix: " شقة", iconBg: "rgba(16,185,129,0.1)", iconColor: "var(--success, #10b981)" },
    { icon: "pending_actions", label: "قيد المراجعة", value: pendingCount, suffix: " طلب", iconBg: "rgba(239,68,68,0.1)", iconColor: "var(--danger, #ef4444)" },
  ];

  return (
    <div className="py-3 d-flex flex-column gap-4 owner-stagger">
      <section className="owner-section" style={{ animationDelay: "0.04s" }}>
        <h2 className="fw-bold" style={{ fontSize: "var(--fs-2xl)", color: "var(--on-surface, #1A1D23)" }}>
          أهلاً بك مجدداً، أ. {userName}
        </h2>
        <p className="mb-0" style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface-variant, #5A6370)" }}>إليك نظرة عامة على عقاراتك.</p>
      </section>

      {loading ? (
        <SkeletonStats count={4} />
      ) : (
        <>
          {/* Subscription Card */}
          <div
            className="owner-section-card overflow-hidden owner-section"
            style={{ animationDelay: "0.08s" }}
          >
            <div
              className="p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"
              style={{
                background: subscription && !subscriptionService.isExpired(subscription)
                  ? "linear-gradient(135deg, var(--primary, #6B9080) 0%, #2D6A4F 100%)"
                  : "var(--surface-container-low, #F5F3EE)",
                color: subscription && !subscriptionService.isExpired(subscription) ? "white" : "var(--on-surface, #1A1D23)",
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: 52,
                    height: 52,
                    background: subscription && !subscriptionService.isExpired(subscription) ? "rgba(255,255,255,0.15)" : "rgba(107,144,128,0.1)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 26, color: subscription && !subscriptionService.isExpired(subscription) ? "white" : "var(--primary)" }}>card_membership</span>
                </div>
                <div>
                  <p className="fw-bold mb-0" style={{ fontSize: "var(--fs-base)" }}>الباقة {planInfo.label}</p>
                  <p className="mb-0" style={{ fontSize: "var(--fs-xs)", opacity: 0.8 }}>
                    {apartments.length} / {planInfo.maxApartments === Infinity ? "∞" : planInfo.maxApartments} شقة
                  </p>
                </div>
              </div>
              <Link
                to="/subscriptions"
                className="btn fw-bold px-4 py-2 owner-btn-lift"
                style={{
                  background: subscription && !subscriptionService.isExpired(subscription) ? "rgba(255,255,255,0.2)" : "var(--primary, #6B9080)",
                  color: "white",
                  borderRadius: "var(--radius-md, 12px)",
                  fontSize: "var(--fs-xs)",
                }}
              >
                ترقية الباقة
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="row g-3 owner-stagger">
            {stats.map((stat, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-3">
                <div
                  className="owner-section-card p-4 h-100 d-flex flex-column justify-content-between owner-card"
                  style={{ animation: `ownerFadeInUp 0.45s ease both`, animationDelay: `${0.12 + i * 0.06}s`, cursor: "default" }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3"
                      style={{ width: 56, height: 56, background: stat.iconBg, color: stat.iconColor }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{stat.icon}</span>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #5A6370)" }}>{stat.label}</p>
                    <h3 className="fw-bold mb-0" style={{ fontSize: "var(--fs-xl)", color: "var(--on-surface, #1A1D23)" }}>
                      <AnimatedCounter target={stat.value} suffix={stat.suffix || ""} />
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {apartments.length > 0 && (
            <div className="row g-4 owner-section" style={{ animationDelay: "0.35s" }}>
              <div className="col-lg-8">
                <div className="owner-section-card p-4">
                  <h4 className="fw-bold mb-3" style={{ fontSize: "var(--fs-base)", color: "var(--on-surface, #1A1D23)" }}>المشاهدات حسب العقار</h4>
                  <div style={{ height: 260 }}><canvas ref={barRef} /></div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="owner-section-card p-4 h-100">
                  <h4 className="fw-bold mb-3" style={{ fontSize: "var(--fs-base)", color: "var(--on-surface, #1A1D23)" }}>توزيع حالات الشقق</h4>
                  <div style={{ height: 220 }}><canvas ref={doughnutRef} /></div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Apartments */}
          {apartments.length > 0 && (
            <div className="owner-section-card p-4 owner-section" style={{ animationDelay: "0.4s" }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0" style={{ fontSize: "var(--fs-base)", color: "var(--on-surface, #1A1D23)" }}>آخر شققك المضافة</h4>
                <Link to="/owner/apartments" className="btn btn-link text-decoration-none fw-bold p-0" style={{ color: "var(--primary)", fontSize: "0.85rem" }}>عرض الكل</Link>
              </div>
              <div className="d-flex flex-column gap-2">
                {apartments.slice(0, 5).map((apt) => (
                  <Link
                    to={`/owner/apartment/${apt.id}`}
                    key={apt.id}
                    className="d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none owner-card"
                    style={{ border: "1px solid rgba(221,216,208,0.25)", background: "var(--white, #fff)", transition: "background 0.15s ease" }}
                  >
                    <img src={apt.images?.[0] || "https://via.placeholder.com/60x60"} alt="" className="rounded-3" style={{ width: 56, height: 56, objectFit: "cover" }} />
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0" style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface, #1A1D23)" }}>{apt.title}</h6>
                      <small style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #5A6370)" }}>{apt.neighborhood || apt.city}</small>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span className="fw-bold" style={{ color: "var(--primary)", whiteSpace: "nowrap", fontSize: "var(--fs-sm)" }}>{apt.price.toLocaleString("ar-EG")} ج.م</span>
                      {apt.avgRating > 0 && (
                        <span className="d-flex align-items-center gap-1" style={{ fontSize: "0.75rem", color: "#f59e0b" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>star</span>
                          {apt.avgRating}
                        </span>
                      )}
                    </div>
                    <span
                      className="owner-badge"
                      style={{
                        fontSize: "var(--fs-xs)",
                        background: apt.status === "approved" ? "rgba(16,185,129,0.12)" : "rgba(255,222,168,0.8)",
                        color: apt.status === "approved" ? "var(--success, #006d37)" : "var(--tertiary-dark, #583d00)",
                      }}
                    >
                      {apt.status === "approved" ? "منشورة" : "قيد المراجعة"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
