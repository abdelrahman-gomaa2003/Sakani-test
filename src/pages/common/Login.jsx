import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, profile, isLoggedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const from = location.state?.from?.pathname;

  const navigateToDashboard = (prof) => {
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    const role = prof?.role || "student";
    const roleRoutes = {
      student: "/student-home",
      owner: "/owner/dashboard",
      broker: "/broker/dashboard",
      admin: "/admin/dashboard",
    };
    navigate(roleRoutes[role] || "/student-home");
  };

  // Already logged in — redirect based on verification status
  const shouldBlock = submitted || (isLoggedIn && profile);
  const verificationStatus = shouldBlock ? profile?.verification_status : null;

  if (verificationStatus === "pending") {
    navigate("/pending-approval", { replace: true });
    return null;
  }

  if (verificationStatus === "rejected") {
    navigate("/rejected-approval", { replace: true });
    return null;
  }

  if (submitted && profile && verificationStatus !== "pending" && verificationStatus !== "rejected") {
    setLoading(false);
    navigateToDashboard(profile);
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await signIn({ email, password });

    if (authError) {
      const msg = authError.message || "";
      if (msg.includes("Invalid login") || msg.includes("invalid_credentials")) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (msg.includes("Email not confirmed")) {
        setError("يرجى تأكيد البريد الإلكتروني أولاً");
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.");
      }
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="container py-5">
      <style>{`
        @keyframes loginFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .login-card { animation: loginFadeIn 0.5s ease; }
        .login-input { transition: all 0.3s ease; border: 2px solid var(--outline-variant, #D0D0D0); border-radius: 14px; height: 52px; font-size: var(--fs-base); padding-right: 48px; }
        .login-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(107,144,128,0.1); outline: none; }
        .login-input-icon { position: absolute; top: 50%; transform: translateY(-50%); right: 16px; color: var(--outline, #94a3b8); font-size: 22px; transition: color 0.3s; pointer-events: none; z-index: 2; }
        .login-input:focus ~ .login-input-icon { color: var(--primary); }
        .login-input-wrap { position: relative; }
        .login-btn { height: 54px; border-radius: 14px; font-size: var(--fs-lg); font-weight: 700; transition: all 0.3s ease; }
        .login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(107,144,128,0.3); }
      `}</style>
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 p-lg-5 login-card" style={{ borderRadius: "var(--radius-lg, 20px)", border: "1px solid rgba(208,208,208,0.15)" }}>
            <div className="text-center mb-4">
              <h1 className="h3 fw-bold text-dark" style={{ fontSize: "var(--fs-2xl)", color: "var(--on-surface)" }}>
                تسجيل الدخول
              </h1>
              <p className="text-muted mb-0" style={{ fontSize: "var(--fs-base)" }}>
                استخدم بريدك الإلكتروني وكلمة المرور للدخول إلى حسابك
              </p>
            </div>

            {error && (
              <div className="alert alert-danger text-center py-2" role="alert" style={{ borderRadius: "var(--radius-md, 12px)", fontSize: "var(--fs-sm)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: "var(--fs-base)" }}>البريد الإلكتروني</label>
                <div className="login-input-wrap">
                  <span className="material-symbols-outlined login-input-icon">email</span>
                  <input type="email" className="form-control login-input" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: "var(--fs-base)" }}>كلمة المرور</label>
                <div className="login-input-wrap">
                  <span className="material-symbols-outlined login-input-icon">lock</span>
                  <input type="password" className="form-control login-input" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <div className="d-flex justify-content-end mb-4">
                <Link className="text-primary fw-semibold" to="/forgot-password" style={{ fontSize: "var(--fs-sm)" }}>نسيت كلمة المرور؟</Link>
              </div>
              <button className="btn btn-primary w-100 login-btn fw-bold" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    جاري الدخول...
                  </>
                ) : "دخول"}
              </button>
              <p className="text-center text-muted mb-0 mt-4" style={{ fontSize: "var(--fs-base)" }}>
                ليس لديك حساب؟{" "}
                <Link className="text-primary fw-semibold" to="/register">إنشاء حساب</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
