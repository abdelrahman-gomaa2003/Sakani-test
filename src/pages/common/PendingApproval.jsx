import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

function PendingApproval() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("verification_requests")
        .select("id, created_at, role, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) setRequest(data);
    };

    load();

    intervalRef.current = setInterval(async () => {
      setChecking(true);
      await refreshProfile();
      const { data } = await supabase
        .from("verification_requests")
        .select("id, created_at, role, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) setRequest(data);
      setChecking(false);
    }, 30000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, refreshProfile]);

  useEffect(() => {
    if (profile?.verification_status === "approved") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigate("/owner/dashboard", { replace: true });
    }
  }, [profile?.verification_status, navigate]);

  const handleSignOut = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    const { data } = await supabase
      .from("verification_requests")
      .select("id, created_at, role, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setRequest(data);
    setChecking(false);
  };

  const roleLabel = profile?.role === "broker" ? "وسيط عقاري" : "مالك شقة";
  const requestDate = request?.created_at
    ? new Date(request.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
  const requestId = request?.id ? `#${request.id.slice(0, 8).toUpperCase()}` : "—";

  const timelineSteps = [
    { icon: "person_add", label: "تسجيل الحساب", done: true },
    { icon: "upload_file", label: "رفع المستندات", done: true },
    { icon: "rate_review", label: "مراجعة البيانات", done: false, active: true },
    { icon: "verified", label: "اعتماد الحساب", done: false },
  ];

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: "var(--radius-lg, 18px)" }}>
            {/* Header */}
            <div className="p-4 p-lg-5 text-center" style={{ background: "linear-gradient(135deg, #fff8e1, #fff3cd)", borderBottom: "3px solid #ffc107" }}>
              <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 100, height: 100, background: "rgba(255,193,7,0.15)", border: "3px solid #ffc107", animation: "pendingPulse 2s ease-in-out infinite" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 52, color: "#f59e0b" }}>hourglass_top</span>
              </div>
              <h2 className="fw-bold mb-2" style={{ fontSize: "1.6rem", color: "#92400e" }}>طلب التوثيق قيد المراجعة</h2>
              <p className="mb-0" style={{ color: "#a16207", fontSize: "0.95rem" }}>فريق منصة سكني يقوم بمراجعة طلبك حالياً</p>
            </div>

            {/* Body */}
            <div className="p-4 p-lg-5">
              {/* Order Details */}
              <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center">
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>confirmation_number</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>رقم الطلب:</span>
                  <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1a1d23)", direction: "ltr" }}>{requestId}</span>
                </div>
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>calendar_today</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>تاريخ الإرسال:</span>
                  <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1a1d23)" }}>{requestDate}</span>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center">
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>mail</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>البريد الإلكتروني:</span>
                  <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1a1d23)", direction: "ltr" }}>{user?.email || "—"}</span>
                </div>
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>{profile?.role === "broker" ? "real_estate_agent" : "apartment"}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>نوع الحساب:</span>
                  <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1a1d23)" }}>{roleLabel}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-4 p-4 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                <h5 className="fw-bold mb-4 text-center" style={{ fontSize: "1rem", color: "var(--on-surface, #1a1d23)" }}>مراحل المراجعة</h5>
                <div className="d-flex justify-content-between position-relative" style={{ padding: "0 10px" }}>
                  <div className="position-absolute" style={{ top: 20, left: 30, right: 30, height: 3, background: "var(--border, #DDD8D0)", zIndex: 0 }} />
                  {timelineSteps.map((step, i) => (
                    <div key={i} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1, flex: 1 }}>
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle mb-2"
                        style={{
                          width: 42, height: 42,
                          background: step.done ? "var(--primary)" : step.active ? "#ffc107" : "var(--surface-card, #f8f9fa)",
                          border: step.done ? "3px solid var(--primary)" : step.active ? "3px solid #ffc107" : "3px solid var(--border, #DDD8D0)",
                          transition: "all 0.3s",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: step.done || step.active ? "white" : "var(--on-surface-variant, #5a6370)" }}>
                          {step.done ? "check" : step.icon}
                        </span>
                      </div>
                      <span className="text-center" style={{ fontSize: "0.75rem", fontWeight: step.active ? 700 : 500, color: step.done ? "var(--primary)" : step.active ? "#92400e" : "var(--on-surface-variant, #5a6370)" }}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="mb-4 p-3 rounded-3" style={{ background: "rgba(255,193,7,0.08)", border: "1px solid rgba(255,193,7,0.2)" }}>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#f59e0b" }}>schedule</span>
                  <span className="fw-bold" style={{ color: "#92400e", fontSize: "0.95rem" }}>وقت المراجعة المتوقع</span>
                </div>
                <p className="mb-0 text-center" style={{ color: "#78350f", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  عادة ما تستغرق مراجعة الطلبات من <strong>24 إلى 48 ساعة</strong> عمل.
                  <br />
                  سيتم إشعارك عبر البريد الإلكتروني فور اتخاذ قرار الموافقة أو الرفض.
                </p>
              </div>

              {/* Auto-check indicator */}
              <div className="d-flex align-items-center justify-content-center gap-2 mb-4" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>autorenew</span>
                <span>يتم التحقق تلقائياً كل 30 ثانية</span>
                {checking && <span className="spinner-border spinner-border-sm" role="status" style={{ width: 14, height: 14 }} />}
              </div>

              {/* Actions */}
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                <button
                  className="btn py-2 px-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{ background: "var(--primary, #6B9080)", color: "white", borderRadius: "var(--radius-md, 12px)", fontSize: "0.95rem" }}
                  onClick={handleRefresh}
                  disabled={checking}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                  {checking ? "جاري التحقق..." : "تحديث الحالة"}
                </button>
                <button
                  className="btn py-2 px-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{ border: "2px solid var(--primary, #6B9080)", color: "var(--primary, #6B9080)", borderRadius: "var(--radius-md, 12px)", background: "transparent", fontSize: "0.95rem" }}
                  onClick={handleSignOut}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pendingPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

export default PendingApproval;
