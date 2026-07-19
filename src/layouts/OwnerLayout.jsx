import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logos/image.png";

const navItems = [
  { path: "/owner/dashboard", icon: "dashboard", label: "لوحة التحكم" },
  { path: "/owner/apartments", icon: "real_estate_agent", label: "عقاراتي" },
  { path: "/owner/add-apartment", icon: "add_circle", label: "إضافة عقار" },
  { path: "/owner/viewing-requests", icon: "visibility", label: "طلبات المعاينة" },
  { path: "/owner/booking-requests", icon: "calendar_month", label: "طلبات الحجز" },
  { path: "/owner/ratings", icon: "star", label: "تقييماتي" },
  { path: "/owner/messages", icon: "chat_bubble", label: "الرسائل" },
  { path: "/subscriptions", icon: "card_membership", label: "الاشتراكات" },
  { path: "/owner/profile", icon: "person", label: "الملف الشخصي" },
  { path: "/owner/settings", icon: "settings", label: "الإعدادات" },
];

function OwnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const user = profile || { full_name: "مالك عقار", avatar_url: null };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const renderNavList = (onClick) => (
    <ul className="list-unstyled d-flex flex-column gap-1 px-3">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={`d-flex align-items-center gap-3 px-3 py-3 text-decoration-none rounded-3 owner-nav-item ${isActive ? "active" : ""}`}
              style={{
                color: isActive ? "var(--primary)" : "var(--on-surface-variant, #5A6370)",
                fontSize: "var(--fs-sm, 0.975rem)",
              }}
              onClick={onClick}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="d-flex" style={{ minHeight: "100vh", background: "var(--background, #FAFAF7)" }}>
      <style>{`
        @media (min-width: 768px) {
          .owner-main-area { margin-left: 270px; }
        }
      `}</style>
      {/* Desktop Sidebar */}
      <aside
        className="d-none d-md-flex flex-column position-fixed top-0 end-0 bottom-0 owner-sidebar"
        style={{ width: 270, zIndex: 1030 }}
      >
        {/* Logo */}
        <div className="px-4 pt-4 pb-3">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <img src={logo} alt="سكني" style={{ height: 56, width: "auto" }} />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-grow-1 py-2 overflow-auto" style={{ scrollbarWidth: "thin" }}>
          {renderNavList()}
        </nav>

        {/* CTA */}
        <div className="p-4 mt-auto">
          <NavLink
            to="/owner/add-apartment"
            className="d-flex align-items-center justify-content-center gap-2 text-white text-decoration-none py-3 fw-bold owner-btn-lift"
            style={{
              background: "linear-gradient(135deg, var(--primary, #6B9080), var(--primary-dark, #4A6E5C))",
              borderRadius: "var(--radius-lg, 18px)",
              fontSize: "var(--fs-sm, 0.975rem)",
              boxShadow: "0 4px 18px rgba(107,144,128,0.25)",
            }}
          >
            <span className="material-symbols-outlined">add</span>
            إضافة عقار جديد
          </NavLink>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 bottom-0"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 1040, width: "100%", animation: "ownerFadeIn 0.25s ease" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`d-md-none position-fixed top-0 bottom-0 flex flex-column owner-sidebar`}
        style={{
          right: sidebarOpen ? 0 : -280,
          width: 280,
          transition: "right 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
          zIndex: 1050,
          display: sidebarOpen ? "flex" : "none",
        }}
      >
        <div className="d-flex align-items-center justify-between p-4">
          <img src={logo} alt="سكني" style={{ height: 48, width: "auto" }} />
          <button className="btn btn-sm rounded-circle" style={{ width: 36, height: 36, background: "var(--surface-container-low, #F5F3EE)" }} onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>
        <nav className="flex-grow-1 overflow-auto">
          {renderNavList(() => setSidebarOpen(false))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column owner-main-area">
        {/* Topbar */}
        <header
          className="sticky-top top-0 d-flex align-items-center px-3 px-md-4 owner-topbar"
          style={{ height: 68, zIndex: 1020 }}
        >
          <div className="d-flex align-items-center gap-3 w-100">
            {/* Mobile hamburger */}
            <button
              className="d-md-none btn btn-sm d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, borderRadius: "var(--radius-sm, 8px)", background: "var(--surface-container-low, #F5F3EE)" }}
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
            </button>

            <div className="flex-grow-1" />
          </div>

          {/* Right side actions */}
          <div className="d-flex align-items-center gap-2">
            {/* Messages */}
            <Link
              to="/owner/messages"
              className="btn btn-sm d-flex align-items-center justify-content-center position-relative text-decoration-none"
              style={{ width: 40, height: 40, borderRadius: "var(--radius-sm, 8px)", color: "var(--on-surface-variant, #5A6370)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>chat</span>
            </Link>

            {/* Notifications */}
            <button
              className="btn btn-sm d-flex align-items-center justify-content-center position-relative"
              style={{ width: 40, height: 40, borderRadius: "var(--radius-sm, 8px)", color: "var(--on-surface-variant, #5A6370)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>notifications</span>
              <span
                className="position-absolute"
                style={{ top: 8, left: 8, width: 8, height: 8, background: "var(--danger, #C45B4A)", borderRadius: "50%", border: "2px solid var(--white, #fff)" }}
              />
            </button>

            <div className="vr d-none d-sm-block mx-1" style={{ height: 28, opacity: 0.15 }} />

            {/* User dropdown */}
            <div className="dropdown">
              <button
                className="btn p-0 d-flex align-items-center gap-2 text-decoration-none dropdown-toggle show-arrow"
                data-bs-toggle="dropdown"
              >
                <div className="d-flex align-items-center gap-2 px-2 py-1 rounded-3" style={{ transition: "background 0.2s ease" }}>
                  <div className="d-none d-sm-block text-end">
                    <p className="fw-bold mb-0" style={{ fontSize: "var(--fs-sm, 0.975rem)", color: "var(--on-surface, #1A1D23)" }}>{user.full_name}</p>
                    <p className="mb-0" style={{ fontSize: "var(--fs-xs, 0.875rem)", color: "var(--on-surface-variant, #5A6370)" }}>مالك عقار</p>
                  </div>
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="الملف الشخصي"
                      className="rounded-circle"
                      style={{ width: 40, height: 40, objectFit: "cover", border: "2px solid var(--primary-light, #A4C3B2)" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{ width: 40, height: 40, background: "var(--primary, #6B9080)", fontSize: 16, border: "2px solid var(--primary-light, #A4C3B2)" }}
                    >
                      {user.full_name ? user.full_name[0] : "م"}
                    </div>
                  )}
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end text-end mt-2 p-2 shadow-lg border-0 rounded-3" style={{ minWidth: 200, background: "var(--white, #fff)" }}>
                <li>
                  <Link className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2" to="/owner/profile">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span>
                    الملف الشخصي
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2" to="/owner/settings">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
                    الإعدادات
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 text-danger fw-semibold"
                    onClick={handleLogout}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>logout</span>
                    تسجيل الخروج
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 p-md-4 flex-grow-1" style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default OwnerLayout;
