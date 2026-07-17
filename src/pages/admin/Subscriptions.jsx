import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { subscriptionService } from "../../services/subscriptionService";
import toast from "react-hot-toast";

const styles = `
  .sub-table tbody tr { transition: background 0.15s ease; }
  .sub-table tbody tr:nth-child(even) { background: rgba(107,144,128,0.02); }
  .sub-table tbody tr:hover { background: rgba(107,144,128,0.06); }
  .sub-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 20px; font-size: var(--fs-xs); font-weight: 700; }
  .sub-action-btn { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s ease; background: transparent; }
  .sub-action-btn:hover { transform: translateY(-1px); }
  .sub-filter-btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: var(--radius-md); font-size: var(--fs-xs); font-weight: 700; border: 1.5px solid var(--outline-variant, #D0D0D0); cursor: pointer; transition: all 0.2s ease; background: transparent; }
  .sub-filter-btn:hover { border-color: var(--primary); color: var(--primary); }
  .sub-filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
  .sub-stat-card { transition: transform 0.2s, box-shadow 0.2s; cursor: default; }
  .sub-stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(107,144,128,0.12); }
`;

const STATUS_OPTIONS = [
  { value: "all", label: "الكل", icon: "filter_list" },
  { value: "active", label: "نشط", icon: "check_circle" },
  { value: "expired", label: "منتهي", icon: "schedule" },
  { value: "cancelled", label: "ملغي", icon: "block" },
];

const PLAN_LABELS = {
  free: { label: "مجاني (3 شقق)", color: "var(--on-surface-variant)", bg: "rgba(100,116,139,0.1)" },
  premium: { label: "مميز (10 شقق)", color: "var(--primary)", bg: "rgba(107,144,128,0.12)" },
  professional: { label: "محترف (∞ شقق)", color: "#2D6A4F", bg: "rgba(0,109,55,0.1)" },
};

const STATUS_COLORS = {
  active: { bg: "rgba(16,185,129,0.15)", text: "var(--success, #006d37)" },
  expired: { bg: "rgba(239,68,68,0.15)", text: "var(--danger, #ef4444)" },
  cancelled: { bg: "rgba(148,163,184,0.15)", text: "var(--on-surface-variant)" },
};

function AdminSubscriptions() {
  useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, cancelled: 0, revenue: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await subscriptionService.getAll();
        if (error) throw error;
        if (cancelled) return;

        let filtered = data || [];
        if (statusFilter !== "all") {
          filtered = filtered.filter((s) => s.status === statusFilter);
        }
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.profiles?.full_name?.toLowerCase().includes(q) ||
              s.profiles?.email?.toLowerCase().includes(q) ||
              s.plan?.toLowerCase().includes(q)
          );
        }

        setSubscriptions(filtered);

        const all = data || [];
        setStats({
          total: all.length,
          active: all.filter((s) => s.status === "active").length,
          expired: all.filter((s) => s.status === "expired").length,
          cancelled: all.filter((s) => s.status === "cancelled").length,
          revenue: all.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
        });
      } catch (err) {
        toast.error("خطأ في تحميل الاشتراكات");
        console.error(err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [statusFilter, search, refreshKey]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await subscriptionService.adminUpdateStatus(id, newStatus);
      if (error) throw error;
      toast.success("تم التحديث بنجاح");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message || "حدث خطأ");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("هل أنت متأكد من إلغاء هذا الاشتراك؟")) return;
    try {
      const { error } = await subscriptionService.cancelSubscription(id);
      if (error) throw error;
      toast.success("تم إلغاء الاشتراك");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message || "حدث خطأ");
    }
  };

  const statCards = [
    { label: "إجمالي الاشتراكات", value: stats.total, icon: "card_membership", bg: "rgba(107,144,128,0.1)", color: "var(--primary)" },
    { label: "اشتراكات نشطة", value: stats.active, icon: "check_circle", bg: "rgba(16,185,129,0.1)", color: "var(--success, #006d37)" },
    { label: "منتهية", value: stats.expired, icon: "schedule", bg: "rgba(239,68,68,0.1)", color: "var(--danger, #ef4444)" },
    { label: "الإيرادات", value: stats.revenue, suffix: " ج.م", icon: "payments", bg: "rgba(45,106,79,0.1)", color: "#2D6A4F" },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <style>{styles}</style>
      {/* Header */}
      <div>
        <h4 className="fw-bold mb-1" style={{ fontSize: "var(--fs-xl)" }}>إدارة الاشتراكات</h4>
        <p className="mb-0" style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface-variant)" }}>عرض وإدارة اشتراكات جميع أصحاب العقارات</p>
      </div>

      {/* Stats */}
      <div className="row g-3">
        {statCards.map((stat, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div className="bg-white rounded-4 p-4 h-100 d-flex align-items-center gap-3 sub-stat-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: stat.bg }}>
                <span className="material-symbols-outlined" style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div>
                <p className="mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)" }}>{stat.label}</p>
                <h5 className="fw-bold mb-0" style={{ fontSize: "var(--fs-lg)" }}>{stat.value}{stat.suffix || ""}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-4 p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
          <div className="position-relative flex-grow-1" style={{ maxWidth: 400 }}>
            <span className="material-symbols-outlined position-absolute" style={{ right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: "var(--outline, #767586)" }}>search</span>
            <input
              type="text"
              className="form-control"
              placeholder="بحث بالاسم أو الإيميل..."
              style={{ paddingRight: 40, borderRadius: "var(--radius-md)", borderColor: "var(--border)" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`sub-filter-btn${statusFilter === opt.value ? " active" : ""}`}
                onClick={() => setStatusFilter(opt.value)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-4 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border" style={{ color: "var(--primary)" }} />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined mb-3" style={{ fontSize: 56, color: "var(--outline, #aaa)" }}>inbox</span>
            <p style={{ color: "var(--on-surface-variant)", fontSize: "var(--fs-lg)" }}>لا توجد اشتراكات</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0 sub-table">
              <thead>
                <tr style={{ background: "var(--surface-container-low)" }}>
                  <th className="fw-bold py-3 px-4" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>المستخدم</th>
                  <th className="fw-bold py-3 px-4" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>الباقة</th>
                  <th className="fw-bold py-3 px-4" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>الدور</th>
                  <th className="fw-bold py-3 px-4" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>الفترة</th>
                  <th className="fw-bold py-3 px-4" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>المبلغ</th>
                  <th className="fw-bold py-3 px-4" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>الحالة</th>
                  <th className="fw-bold py-3 px-4" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>تاريخ الانتهاء</th>
                  <th className="fw-bold py-3 px-4" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const sc = STATUS_COLORS[sub.status] || STATUS_COLORS.active;
                  const planInfo = PLAN_LABELS[sub.plan] || PLAN_LABELS.free;
                  const isExpired = subscriptionService.isExpired(sub);
                  return (
                    <tr key={sub.id}>
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 40, height: 40, background: "var(--primary)", fontSize: 14, border: "2px solid rgba(107,144,128,0.15)" }}>
                            {sub.profiles?.full_name?.[0] || "م"}
                          </div>
                          <div>
                            <p className="fw-bold mb-0" style={{ fontSize: "var(--fs-sm)" }}>{sub.profiles?.full_name || "—"}</p>
                            <small style={{ color: "var(--on-surface-variant)" }}>{sub.profiles?.email || "—"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="sub-badge" style={{ background: planInfo.bg || "rgba(107,144,128,0.1)", color: planInfo.color, border: "1px solid rgba(107,144,128,0.2)" }}>{planInfo.label}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface-variant)" }}>
                          {sub.profiles?.role === "broker" ? "سمسار" : sub.profiles?.role === "owner" ? "مالك عقار" : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span style={{ fontSize: "var(--fs-sm)" }}>{sub.billing_cycle === "yearly" ? "سنوي" : "شهري"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="fw-bold" style={{ color: "var(--primary)", fontSize: "var(--fs-sm)" }}>{sub.price} ج.م</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="sub-badge"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {isExpired ? "منتهي" : sub.status === "active" ? "نشط" : sub.status === "cancelled" ? "ملغي" : sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>
                          {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString("ar-EG") : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="d-flex gap-1">
                          {sub.status === "active" && (
                            <>
                              <button
                                className="sub-action-btn"
                                title="延长"
                                onClick={() => handleUpdateStatus(sub.id, "active")}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>refresh</span>
                              </button>
                              <button
                                className="sub-action-btn"
                                title="إلغاء"
                                onClick={() => handleCancel(sub.id)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--danger, #ef4444)" }}>block</span>
                              </button>
                            </>
                          )}
                          {sub.status === "expired" && (
                            <button
                              className="sub-action-btn"
                              title="تفعيل"
                              onClick={() => handleUpdateStatus(sub.id, "active")}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--success, #006d37)" }}>check_circle</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSubscriptions;
