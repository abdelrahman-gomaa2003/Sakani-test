import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "../../services/authService";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    const { error } = await authService.updatePassword(password);
    setLoading(false);

    if (error) {
      toast.error(error.message || "حدث خطأ أثناء تغيير كلمة المرور");
      return;
    }

    toast.success("تم تغيير كلمة المرور بنجاح");
    navigate("/login");
  };

  return (
    <div className="reset-page">
      <div className="container">

        <div className="row justify-content-center align-items-center min-vh-100">

          <div className="col-lg-5">

            <div className="card shadow-lg border-0 rounded-4 p-5">

              <h2 className="fw-bold mb-3">
                إنشاء كلمة مرور جديدة
              </h2>

              <p className="text-muted mb-4">
                اختر كلمة مرور قوية لحسابك.
              </p>

              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label">
                    كلمة المرور الجديدة
                  </label>

                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">

                  <label className="form-label">
                    تأكيد كلمة المرور
                  </label>

                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                </div>

                <button className="btn btn-success w-100 py-3" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ كلمة المرور"
                  )}
                </button>

              </form>

              <div className="text-center mt-4">
                <Link to="/login">
                  العودة لتسجيل الدخول
                </Link>
              </div>

            </div>

          </div>

          <div className="col-lg-6 d-none d-lg-block">

            <img
              src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
              className="img-fluid rounded-4 shadow"
              alt="Apartment"
            />

          </div>

        </div>

      </div>
    </div>
  );
}

export default ResetPassword;
