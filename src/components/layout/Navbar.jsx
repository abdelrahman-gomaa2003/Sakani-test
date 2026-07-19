import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useCompare } from "../../hooks/useCompare";
import toast from "react-hot-toast";
import logo from "../../assets/logos/image.png";

const navLinks = [
  { to: "/", label: "الرئيسية", icon: "home" },
  { to: "/apartments", label: "ابحث عن سكن", icon: "apartment" },
  { to: "/about", label: "عن المنصة", icon: "info" },
  { to: "/contact", label: "تواصل معنا", icon: "mail" },
];

const dashboardRoutes = {
  student: "/student-home",
  owner: "/owner/dashboard",
  broker: "/broker/dashboard",
  admin: "/admin/dashboard",
};

const dashboardLabels = {
  student: "لوحة التحكم",
  owner: "لوحة التحكم",
  broker: "لوحة التحكم",
  admin: "لوحة التحكم",
};

function Navbar() {
  const navigate = useNavigate();
  const { profile, isLoggedIn, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { compareIds } = useCompare();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    setMobileOpen(false);
    await signOut();
    navigate("/login");
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <style>{`
        .navbar-nav-link { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          padding: 10px 18px; 
          border-radius: var(--radius-md, 12px); 
          font-size: var(--fs-sm, 0.975rem); 
          font-weight: 600; 
          color: var(--on-surface-variant, #5A6370); 
          text-decoration: none; 
          transition: all 0.25s ease; 
          white-space: nowrap; 
        }
        .navbar-nav-link:hover { 
          color: var(--primary, #6B9080); 
          background: rgba(107,144,128,0.08); 
        }
        .navbar-nav-link.active { 
          color: var(--primary, #6B9080); 
          background: rgba(107,144,128,0.12); 
          font-weight: 700; 
          border-bottom: 3px solid var(--primary, #6B9080); 
          border-radius: var(--radius-md, 12px) var(--radius-md, 12px) 0 0; 
        }
        .navbar-nav-link .nav-icon { 
          font-size: 22px; 
          opacity: 0.7; 
          transition: opacity 0.25s ease; 
        }
        .navbar-nav-link:hover .nav-icon,
        .navbar-nav-link.active .nav-icon { 
          opacity: 1; 
        }
        .navbar-action-btn { 
          width: 42px; 
          height: 42px; 
          border-radius: var(--radius-md, 12px); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          background: rgba(107,144,128,0.06); 
          border: 1px solid rgba(107,144,128,0.12); 
          color: var(--gray, #808894); 
          transition: all 0.25s ease; 
          cursor: pointer;
          text-decoration: none;
        }
        .navbar-action-btn .material-symbols-outlined { font-size: 22px; }
        .navbar-action-btn:hover { 
          background: var(--primary, #6B9080); 
          color: #fff; 
          border-color: var(--primary, #6B9080); 
          transform: translateY(-1px); 
        }
        .navbar-dashboard-btn { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          padding: 10px 20px; 
          border-radius: var(--radius-md, 12px); 
          font-size: var(--fs-sm, 0.975rem); 
          font-weight: 600; 
          color: #fff; 
          background: var(--primary, #6B9080); 
          text-decoration: none; 
          transition: all 0.25s ease; 
        }
        .navbar-dashboard-btn:hover { 
          background: var(--primary-dark, #4A6E5C); 
          transform: translateY(-1px); 
          box-shadow: 0 4px 15px rgba(107,144,128,0.3); 
        }
        .navbar-dashboard-btn .nav-icon { font-size: 22px; }
        .navbar-user-name { color: var(--on-surface, #1A1D23); font-weight: 600; font-size: var(--fs-sm, 0.975rem); }
        .navbar-dropdown-toggle { 
          background: rgba(107,144,128,0.06); 
          border: 1px solid rgba(107,144,128,0.15); 
          border-radius: var(--radius-full, 9999px); 
          padding: 5px 14px 5px 5px; 
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .navbar-dropdown-toggle:hover { 
          background: rgba(107,144,128,0.12); 
        }
        .navbar-auth-btn {
          padding: 10px 22px;
          border-radius: var(--radius-md, 12px);
          font-size: var(--fs-sm, 0.975rem);
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .navbar-auth-btn:hover { transform: translateY(-1px); }
        .navbar-hamburger {
          width: 42px; height: 42px; border-radius: var(--radius-md, 12px);
          display: none; align-items: center; justify-content: center;
          background: rgba(107,144,128,0.06); border: 1px solid rgba(107,144,128,0.12);
          color: var(--on-surface-variant, #5A6370); cursor: pointer; transition: all 0.25s ease;
        }
        .navbar-hamburger:hover { background: rgba(107,144,128,0.12); }
        @media (max-width: 991.98px) {
          .navbar-hamburger { display: flex; }
          .navbar-desktop-nav { display: none !important; }
        }
        .navbar-mobile-panel {
          position: fixed; top: 0; right: 0; bottom: 0; width: 300px;
          background: var(--surface-card, #fff); z-index: 1100;
          box-shadow: -4px 0 30px rgba(0,0,0,0.15);
          transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          overflow-y: auto; overscroll-behavior: contain;
        }
        .navbar-mobile-panel.open { transform: translateX(0); }
        .navbar-mobile-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          z-index: 1090; opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .navbar-mobile-overlay.open { opacity: 1; pointer-events: auto; }
        .mobile-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; border-radius: var(--radius-md, 12px);
          font-size: var(--fs-base, 1.0625rem); font-weight: 600;
          color: var(--on-surface-variant, #5A6370);
          text-decoration: none; transition: all 0.2s ease;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          color: var(--primary, #6B9080); background: rgba(107,144,128,0.08);
        }
        .mobile-nav-link.active { font-weight: 700; }
        .mobile-nav-link .material-symbols-outlined { font-size: 24px; }
      `}</style>

      {/* Mobile Overlay */}
      <div className={`navbar-mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={closeMobile} />

      {/* Mobile Slide Panel */}
      <div className={`navbar-mobile-panel ${mobileOpen ? "open" : ""}`}>
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom" style={{ borderColor: "var(--border)" }}>
          <Link to={isLoggedIn && profile ? (dashboardRoutes[profile.role] || "/student-home") : "/"} onClick={closeMobile}>
            <img src={logo} alt="سكني" style={{ height: 60, width: "auto" }} />
          </Link>
          <button className="btn btn-sm" onClick={closeMobile} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-container-low, #f5f3ee)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>

        <nav className="p-3 d-flex flex-column gap-1">
          {isLoggedIn && profile && (
            <Link
              to={dashboardRoutes[profile.role] || "/student-home"}
              className="mobile-nav-link fw-bold"
              style={{ color: "var(--primary, #6B9080)", background: "rgba(107,144,128,0.08)" }}
              onClick={closeMobile}
            >
              <span className="material-symbols-outlined">dashboard</span>
              {dashboardLabels[profile.role] || "لوحة التحكم"}
            </Link>
          )}

          {isLoggedIn && profile?.role === "student" && (
            <Link
              to="/student/my-requests"
              className="mobile-nav-link"
              onClick={closeMobile}
            >
              <span className="material-symbols-outlined">list_alt</span>
              طلباتي
            </Link>
          )}

          <hr className="my-2" style={{ borderColor: "var(--border)" }} />

          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
              onClick={closeMobile}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}

          <hr className="my-2" style={{ borderColor: "var(--border)" }} />

          <Link className="mobile-nav-link" to="/favorites" onClick={closeMobile}>
            <span className="material-symbols-outlined">favorite</span>
            المفضلة
          </Link>
          <Link className="mobile-nav-link" to="/notifications" onClick={closeMobile}>
            <span className="material-symbols-outlined">notifications</span>
            الإشعارات
          </Link>
          <Link className="mobile-nav-link" to="/messages" onClick={closeMobile}>
            <span className="material-symbols-outlined">chat</span>
            الرسائل
          </Link>
          <Link className="mobile-nav-link" to="/compare" onClick={closeMobile}>
            <span className="material-symbols-outlined">compare</span>
            المقارنة
            {compareIds.length > 0 && (
              <span className="me-auto rounded-circle d-flex align-items-center justify-content-center" style={{ width: 22, height: 22, background: "var(--primary, #6B9080)", color: "white", fontSize: "0.7rem", fontWeight: 700 }}>
                {compareIds.length}
              </span>
            )}
          </Link>

          <div className="d-flex align-items-center gap-2 px-3 py-2 my-2 rounded-3" style={{ background: "var(--surface-container-low, #f5f3ee)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--on-surface-variant)" }}>{theme === "light" ? "dark_mode" : "light_mode"}</span>
            <span style={{ fontSize: "var(--fs-sm, 0.975rem)", fontWeight: 500 }}>{theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}</span>
            <button className="form-check form-switch ms-auto mb-0" style={{ cursor: "pointer" }} onClick={toggleTheme}>
              <input className="form-check-input" type="checkbox" checked={theme === "dark"} readOnly style={{ cursor: "pointer" }} />
            </button>
          </div>
        </nav>

        <div className="p-4 border-top mt-auto" style={{ borderColor: "var(--border)" }}>
          {isLoggedIn && profile ? (
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center gap-3 mb-2">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="rounded-circle" style={{ width: 44, height: 44, objectFit: "cover", border: "2px solid var(--primary, #6B9080)" }} />
                ) : (
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 44, height: 44, background: "var(--primary, #6B9080)", color: "#fff", fontSize: "15px" }}>
                    {profile.full_name ? profile.full_name[0] : "أ"}
                  </div>
                )}
                <div>
                  <p className="fw-bold mb-0" style={{ fontSize: "var(--fs-sm, 0.975rem)" }}>{profile.full_name}</p>
                  <p className="mb-0" style={{ fontSize: "var(--fs-xs, 0.875rem)", color: "var(--on-surface-variant)" }}>{profile.role === "admin" ? "مدير النظام" : profile.role === "owner" ? "مالك عقار" : profile.role === "broker" ? "وسيط" : "طالب"}</p>
                </div>
              </div>
              <Link className="mobile-nav-link" to="/profile" onClick={closeMobile}>
                <span className="material-symbols-outlined">person</span>
                الملف الشخصي
              </Link>
              <Link className="mobile-nav-link" to="/settings" onClick={closeMobile}>
                <span className="material-symbols-outlined">settings</span>
                الإعدادات
              </Link>
              <button className="mobile-nav-link w-100 text-end border-0" style={{ background: "transparent", color: "var(--error, #ba1a1a)" }} onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <Link className="btn btn-primary w-100 fw-bold" style={{ borderRadius: "var(--radius-md, 12px)" }} to="/login" onClick={closeMobile}>
                تسجيل الدخول
              </Link>
              <Link className="btn w-100 fw-bold" style={{ borderRadius: "var(--radius-md, 12px)", border: "2px solid var(--primary, #6B9080)", color: "var(--primary, #6B9080)" }} to="/register" onClick={closeMobile}>
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar navbar-light sticky-top border-bottom shadow-sm" style={{ direction: "rtl", background: "var(--surface-card)" }}>
        <div className="container py-2 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <button className="navbar-hamburger" onClick={() => setMobileOpen(true)} aria-label="القائمة">
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>menu</span>
            </button>
            <Link className="navbar-brand d-flex align-items-center gap-2 text-decoration-none" to={isLoggedIn && profile ? (dashboardRoutes[profile.role] || "/student-home") : "/"}>
              <img src={logo} alt="سكني" style={{ height: 88, width: "auto" }} />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="navbar-desktop-nav d-flex align-items-center gap-1 gap-md-2">

            {isLoggedIn && profile ? (
              <NavLink
                to={dashboardRoutes[profile.role] || "/student-home"}
                className="navbar-dashboard-btn"
              >
                <span className="material-symbols-outlined nav-icon">dashboard</span>
                {dashboardLabels[profile.role] || "لوحة التحكم"}
              </NavLink>
            ) : null}

            {isLoggedIn && profile?.role === "student" && (
              <NavLink
                to="/student/my-requests"
                className="navbar-dashboard-btn"
                style={{ background: "transparent", color: "var(--primary, #6B9080)", border: "2px solid var(--primary, #6B9080)" }}
              >
                <span className="material-symbols-outlined nav-icon">list_alt</span>
                طلباتي
              </NavLink>
            )}

            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `navbar-nav-link ${isActive ? "active" : ""}`}
              >
                <span className="material-symbols-outlined nav-icon">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}

            <div className="d-flex align-items-center gap-1 mx-1">
              <button className="navbar-action-btn" onClick={toggleTheme} title={theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}>
                <span className="material-symbols-outlined">{theme === "light" ? "dark_mode" : "light_mode"}</span>
              </button>

              <button className="navbar-action-btn position-relative" title="المقارنة" onClick={() => { if (!isLoggedIn) { toast.error("يجب تسجيل الدخول أولًا لاستخدام ميزة مقارنة العقارات."); navigate("/login"); return; } navigate("/compare"); }}>
                <span className="material-symbols-outlined">compare</span>
                {compareIds.length > 0 && (
                  <span className="position-absolute" style={{ top: -4, left: -4, width: 20, height: 20, borderRadius: "50%", background: "var(--primary, #6B9080)", color: "white", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {compareIds.length}
                  </span>
                )}
              </button>

              <Link className="navbar-action-btn" to="/favorites" title="المفضلة">
                <span className="material-symbols-outlined">favorite</span>
              </Link>

              <Link className="navbar-action-btn" to="/notifications" title="الإشعارات">
                <span className="material-symbols-outlined">notifications</span>
              </Link>

              <Link className="navbar-action-btn" to="/messages" title="الرسائل">
                <span className="material-symbols-outlined">chat</span>
              </Link>
            </div>

            {isLoggedIn && profile ? (
              <div className="dropdown">
                <button className="navbar-dropdown-toggle d-flex align-items-center gap-2" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="rounded-circle" style={{ width: 40, height: 40, objectFit: "cover", border: "2px solid var(--primary, #6B9080)" }} />
                  ) : (
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 40, height: 40, fontSize: "15px", background: "var(--primary, #6B9080)", color: "#fff" }}>
                      {profile.full_name ? profile.full_name[0] : "أ"}
                    </div>
                  )}
                  <span className="navbar-user-name d-none d-md-inline">{profile.full_name}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--gray, #808894)" }}>expand_more</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end text-end mt-2 p-2 shadow-sm border-0" aria-labelledby="userDropdown" style={{ minWidth: 220 }}>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2 py-2" to="/profile">
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span>
                      الملف الشخصي
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2 py-2" to="/settings">
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
                      الإعدادات
                    </Link>
                  </li>
                  {profile?.role === "student" && (
                    <li>
                      <Link className="dropdown-item d-flex align-items-center gap-2 py-2" to="/student/my-requests">
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>visibility</span>
                        طلباتي
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger fw-semibold" onClick={handleLogout}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>logout</span>
                      تسجيل الخروج
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link className="navbar-auth-btn" style={{ background: "rgba(107,144,128,0.1)", color: "var(--primary, #6B9080)", border: "1px solid rgba(107,144,128,0.2)" }} to="/login">
                  تسجيل الدخول
                </Link>
                <Link className="navbar-auth-btn" style={{ background: "var(--primary, #6B9080)", color: "#fff" }} to="/register">
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
