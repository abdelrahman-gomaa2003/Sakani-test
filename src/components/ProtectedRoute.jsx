import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ allowedRoles, requireVerification = false }) {
  const { profile, loading, isLoggedIn } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", background: "var(--background, #f8f9ff)" }}>
        <div className="text-center">
          <div className="spinner-border mb-3" style={{ color: "var(--primary)", width: "3rem", height: "3rem" }} role="status" />
          <p className="text-muted small">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !profile) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <p className="text-muted">جاري تحميل بيانات الحساب...</p>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => window.location.reload()}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/403" replace />;
  }

  if (requireVerification) {
    const status = profile?.verification_status;
    if (status === "pending") {
      return <Navigate to="/pending-approval" replace />;
    }
    if (status === "rejected") {
      return <Navigate to="/rejected-approval" replace />;
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;
