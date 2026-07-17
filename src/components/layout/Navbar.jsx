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

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-light sticky-top border-bottom shadow-sm" style={{ direction: "rtl", background: "var(--surface-card)" }}>
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
      `}</style>

      <div className="container py-2 d-flex justify-content-between align-items-center">
        <Link className="navbar-brand d-flex align-items-center gap-2 text-decoration-none" to={isLoggedIn && profile ? (dashboardRoutes[profile.role] || "/student-home") : "/"}>
          <img src={logo} alt="سكني" style={{ height: 88, width: "auto" }} />
        </Link>

        <div className="d-flex align-items-center gap-1 gap-md-2 flex-wrap justify-content-end">

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
  );
}

export default Navbar;
