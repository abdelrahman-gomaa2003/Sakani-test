import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <section className="notfound-page d-flex align-items-center">
      <div className="container">

        <div className="row align-items-center">

          {/* الصورة */}
          <div className="col-lg-6 text-center mb-5 mb-lg-0">
            <div className="error-image">

              <div className="house-circle">
                <i className="bi bi-house-door-fill"></i>
              </div>

              <div className="error-number">
                404
              </div>

            </div>
          </div>

          {/* النص */}
          <div className="col-lg-6 text-center text-lg-end">

            <span className="badge sakani-badge mb-3">
              Sakani - محافظة الفيوم
            </span>

            <h1 className="fw-bold display-4 mb-3">
              الصفحة غير موجودة
            </h1>

            <p className="text-muted fs-5 mb-4">
              يبدو أنك وصلت إلى صفحة غير موجودة أو تم نقلها.
              <br />
              يمكنك العودة للرئيسية أو تصفح الشقق المتاحة في محافظة الفيوم.
            </p>

            <div className="d-flex gap-3 justify-content-center justify-content-lg-end flex-wrap">

              <Link
                to="/"
                className="btn btn-success btn-lg px-4"
              >
                <i className="bi bi-house me-2"></i>
                الرئيسية
              </Link>

              <Link
                to="/apartments"
                className="btn btn-outline-success btn-lg px-4"
              >
                <i className="bi bi-search me-2"></i>
                تصفح الشقق
              </Link>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default NotFound;