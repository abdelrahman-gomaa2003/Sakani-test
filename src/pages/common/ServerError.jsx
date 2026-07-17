import { Link } from "react-router-dom";

function ServerError() {
  return (
    <div className="container py-5 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <span className="material-symbols-outlined text-danger d-block mb-3" style={{ fontSize: 80 }}>cloud_off</span>
      <h1 className="fw-bold display-5 mb-3">خطأ في الخادم</h1>
      <p className="text-muted fs-5 mb-4">حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.</p>
      <div className="d-flex gap-3">
        <Link to="/" className="btn btn-primary btn-lg px-4 rounded-3">الرئيسية</Link>
        <button className="btn btn-outline-primary btn-lg px-4 rounded-3" onClick={() => window.location.reload()}>إعادة المحاولة</button>
      </div>
    </div>
  );
}

export default ServerError;
