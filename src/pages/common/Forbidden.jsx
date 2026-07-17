import { Link } from "react-router-dom";

function Forbidden() {
  return (
    <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <span className="material-symbols-outlined text-danger d-block mb-3" style={{ fontSize: 80 }}>gpp_bad</span>
      <h1 className="fw-bold display-5 mb-3">محظور الوصول</h1>
      <p className="text-muted fs-5 mb-4">لا تملك الصلاحية الكافية لتنفيذ هذا الإجراء.</p>
      <div className="d-flex gap-3">
        <Link to="/" className="btn btn-primary btn-lg px-4 rounded-3">الرئيسية</Link>
        <button className="btn btn-outline-primary btn-lg px-4 rounded-3" onClick={() => window.history.back()}>رجوع</button>
      </div>
    </div>
  );
}

export default Forbidden;
