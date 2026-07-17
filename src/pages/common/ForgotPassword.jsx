import { Link } from "react-router-dom";
import { useState } from "react";
import { authService } from "../../services/authService";
import toast from "react-hot-toast";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await authService.resetPassword(email);

    if (error) {
      toast.error("حدث خطأ أثناء إرسال الرابط");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
    toast.success("تم إرسال رابط إعادة تعيين كلمة المرور");
  };

  return (
    <div className="forgot-page">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-lg-6 d-none d-lg-block">
            <div className="image-box">
              <img
                src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80"
                className="img-fluid rounded-4 shadow"
                alt="Apartment"
              />
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-lg border-0 rounded-4 p-5">
              {sent ? (
                <div className="text-center">
                  <div className="d-flex justify-content-center mb-4">
                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 80, height: 80, background: "rgba(107,144,128,0.1)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--primary)" }}>mail</span>
                    </div>
                  </div>
                  <h2 className="fw-bold mb-3">تم إرسال الرابط</h2>
                  <p className="text-muted mb-4">
                    تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني <strong>{email}</strong>. تحقق من صندوق الوارد أو مجلد Spam.
                  </p>
                  <Link to="/login" className="btn btn-primary w-100 py-3">
                    العودة لتسجيل الدخول
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="fw-bold mb-3">نسيت كلمة المرور؟</h2>
                  <p className="text-muted mb-4">
                    أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">البريد الإلكتروني</label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      className="btn btn-success w-100 py-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          جاري الإرسال...
                        </>
                      ) : (
                        "إرسال الرابط"
                      )}
                    </button>
                  </form>
                </>
              )}

              <div className="text-center mt-4">
                <Link to="/login" className="text-decoration-none">
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
