import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <span className="material-symbols-outlined text-warning d-block mb-3" style={{ fontSize: 80 }}>lock</span>
      <h1 className="fw-bold display-5 mb-3">غير مصرح لك بالدخول</h1>
      <p className="text-muted fs-5 mb-4">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
      <div className="d-flex gap-3">
        <Link to="/" className="btn btn-primary btn-lg px-4 rounded-3">الرئيسية</Link>
        <Link to="/login" className="btn btn-outline-primary btn-lg px-4 rounded-3">تسجيل الدخول</Link>
      </div>
    </div>
  );
}

export default Unauthorized;
