import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

function RejectedApproval() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("verification_requests")
        .select("id, created_at, role, status, rejection_reason, rejected_document")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setRequest(data);
    };
    fetchRequest();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const rejectionReason = request?.rejection_reason || profile?.rejection_reason;
  const rejectedDoc = request?.rejected_document;

  const docLabels = {
    national_id_front: "صورة البطاقة الأمامية",
    national_id_back: "صورة البطاقة الخلفية",
    ownership_document: "مستندOwnership",
    personal_photo: "الصورة الشخصية",
  };

  const roleLabel = profile?.role === "broker" ? "وسيط عقاري" : "مالك شقة";
  const requestDate = request?.created_at
    ? new Date(request.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="container py-5" style={{ minHeight: "80vh" }}>
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: "var(--radius-lg, 18px)" }}>
            {/* Header */}
            <div className="p-4 p-lg-5 text-center" style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)", borderBottom: "3px solid #dc3545" }}>
              <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 100, height: 100, background: "rgba(220,53,69,0.1)", border: "3px solid #dc3545" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 52, color: "#dc3545" }}>cancel</span>
              </div>
              <h2 className="fw-bold mb-2" style={{ fontSize: "1.6rem", color: "#991b1b" }}>تم رفض طلب التوثيق</h2>
              <p className="mb-0" style={{ color: "#b91c1c", fontSize: "0.95rem" }}>لم نتمكن من اعتماد حسابك بناءً على البيانات المرسلة</p>
            </div>

            {/* Body */}
            <div className="p-4 p-lg-5">
              {/* Order Info */}
              <div className="d-flex flex-wrap gap-3 mb-4 justify-content-center">
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>calendar_today</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>تاريخ الإرسال:</span>
                  <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1a1d23)" }}>{requestDate}</span>
                </div>
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>{profile?.role === "broker" ? "real_estate_agent" : "apartment"}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>نوع الحساب:</span>
                  <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1a1d23)" }}>{roleLabel}</span>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="mb-4 p-4 rounded-3" style={{ background: "rgba(220,53,69,0.06)", border: "1px solid rgba(220,53,69,0.15)" }}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#dc3545" }}>error</span>
                  <span className="fw-bold" style={{ color: "#991b1b", fontSize: "1.05rem" }}>سبب الرفض</span>
                </div>
                {rejectionReason ? (
                  <p className="mb-0" style={{ color: "#7f1d1d", fontSize: "0.95rem", lineHeight: 1.8 }}>{rejectionReason}</p>
                ) : (
                  <p className="mb-0" style={{ color: "#7f1d1d", fontSize: "0.95rem", lineHeight: 1.8 }}>
                    لم نتمكن من اعتماد حسابك بناءً على البيانات أو المستندات المرسلة. يرجى مراجعة البيانات وإعادة الإرسال.
                  </p>
                )}
              </div>

              {/* Rejected Document */}
              {rejectedDoc && (
                <div className="mb-4 p-3 rounded-3" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#f97316" }}>description</span>
                    <span className="fw-bold" style={{ color: "#9a3412", fontSize: "0.95rem" }}>المستند المُرفَض:</span>
                    <span style={{ color: "#7c2d12", fontSize: "0.9rem" }}>{docLabels[rejectedDoc] || rejectedDoc}</span>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="d-flex flex-column gap-3 mb-4" style={{ textAlign: "right" }}>
                <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                  <span className="material-symbols-outlined mt-1" style={{ fontSize: 22, color: "var(--primary)" }}>edit_document</span>
                  <div>
                    <p className="fw-bold mb-1" style={{ fontSize: "0.95rem", color: "var(--on-surface, #1a1d23)" }}>مراجعة البيانات والمستندات</p>
                    <p className="mb-0" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>تأكد من صحة جميع البيانات ووضوح المستندات المرفقة</p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={{ background: "var(--surface-card, #f8f9fa)", border: "1px solid var(--border, #e9ecef)" }}>
                  <span className="material-symbols-outlined mt-1" style={{ fontSize: 22, color: "var(--primary)" }}>upload_file</span>
                  <div>
                    <p className="fw-bold mb-1" style={{ fontSize: "0.95rem", color: "var(--on-surface, #1a1d23)" }}>إعادة رفع المستندات</p>
                    <p className="mb-0" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #5a6370)" }}>يمكنك إعادة رفع المستندات الصحيحة من خلال صفحة التسجيل</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                <Link
                  className="btn py-2 px-4 fw-bold text-decoration-none d-flex align-items-center justify-content-center gap-2"
                  to="/register"
                  style={{ background: "var(--primary, #6B9080)", color: "white", borderRadius: "var(--radius-md, 12px)", fontSize: "0.95rem" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
                  إعادة رفع المستندات
                </Link>
                <Link
                  className="btn py-2 px-4 fw-bold text-decoration-none d-flex align-items-center justify-content-center gap-2"
                  to="/contact"
                  style={{ border: "2px solid var(--primary, #6B9080)", color: "var(--primary, #6B9080)", borderRadius: "var(--radius-md, 12px)", background: "transparent", fontSize: "0.95rem" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>support_agent</span>
                  تواصل مع الدعم
                </Link>
                <button
                  className="btn py-2 px-4 fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{ border: "2px solid var(--on-surface-variant, #5a6370)", color: "var(--on-surface-variant, #5a6370)", borderRadius: "var(--radius-md, 12px)", background: "transparent", fontSize: "0.95rem" }}
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
    </div>
  );
}

export default RejectedApproval;
