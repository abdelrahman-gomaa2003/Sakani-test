import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logos/image.png";

const navItems = [
  { path: "/broker/dashboard", icon: "dashboard", label: "الرئيسية" },
  { path: "/broker/apartments", icon: "domain", label: "العقارات" },
  { path: "/broker/viewing-requests", icon: "visibility", label: "طلبات المعاينة" },
  { path: "/broker/booking-requests", icon: "calendar_month", label: "طلبات الحجز" },
  { path: "/broker/students", icon: "group", label: "الطلاب" },
  { path: "/broker/messages", icon: "mail", label: "الرسائل" },
  { path: "/subscriptions", icon: "card_membership", label: "الاشتراكات" },
  { path: "/broker/profile", icon: "person", label: "الملف الشخصي" },
  { path: "/broker/settings", icon: "settings", label: "الإعدادات" },
];

function BrokerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const user = profile || { full_name: "وسيط معتمد", avatar_url: null };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <style>{`
        @media (min-width: 992px) {
          .broker-main-area { margin-left: 280px; }
        }
      `}</style>
      {/* Sidebar - Desktop */}
      <aside
        className="d-none d-lg-flex flex-column position-fixed top-0 end-0 bottom-0 z-3"
        style={{ width: 280, background: "white", borderLeft: "1px solid var(--border)" }}
      >
        <div className="px-4 py-4 mb-4">
          <img src={logo} alt="سكني" style={{ height: 90, width: "auto" }} />
        </div>

        <nav className="flex-grow-1 px-3">
          <ul className="list-unstyled">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="mb-1">
                  <NavLink
                    to={item.path}
                    className="d-flex align-items-center gap-3 px-3 py-3 text-decoration-none rounded-3 transition-all"
                    style={{
                      background: isActive ? "var(--primary-fixed, #e1e0ff)" : "transparent",
                      color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                      fontWeight: isActive ? 700 : 400,
                      fontSize: "var(--fs-sm, 0.975rem)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 mt-auto border-top" style={{ borderColor: "var(--border)" }}>
          <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: "var(--surface-container-low, #f0f3ff)" }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="rounded-circle" style={{ width: 42, height: 42, objectFit: "cover" }} />
            ) : (
              <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 42, height: 42, background: "hsl(200, 60%, 50%)", fontSize: 15 }}>
                {user.full_name ? user.full_name[0] : "و"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="fw-bold mb-0 truncate" style={{ fontSize: "var(--fs-sm, 0.975rem)" }}>{user.full_name}</p>
              <p className="mb-0 truncate" style={{ fontSize: "var(--fs-xs, 0.875rem)", color: "var(--on-surface-variant)" }}>وسيط معتمد</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="position-fixed top-0 start-0 bottom-0" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1040, width: "100%" }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`d-lg-none position-fixed top-0 bottom-0 z-1050 flex flex-column`}
        style={{
          right: sidebarOpen ? 0 : -280,
          width: 280,
          transition: "right 0.3s ease",
          background: "white",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div className="d-flex align-items-center justify-content-between p-4">
          <img src={logo} alt="سكني" style={{ height: 80, width: "auto" }} />
          <button className="btn btn-sm" onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="px-3">
          <ul className="list-unstyled">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="mb-1">
                  <NavLink
                    to={item.path}
                    className="d-flex align-items-center gap-3 px-3 py-3 text-decoration-none rounded-3"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      background: isActive ? "var(--primary-fixed, #e1e0ff)" : "transparent",
                      color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
                      fontWeight: isActive ? 700 : 400,
                      fontSize: "var(--fs-sm, 0.975rem)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-grow-1 broker-main-area" style={{ marginRight: 0 }}>
        {/* Topbar */}
        <header
          className="sticky-top top-0 d-flex align-items-center justify-content-between px-3 px-md-4 z-3"
          style={{
            height: 72,
            background: "rgba(248,249,255,0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(208,208,208,0.3)",
          }}
        >
          <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ maxWidth: 400 }}>
            <button className="d-lg-none btn btn-sm" onClick={() => setSidebarOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="position-relative d-none d-sm-block flex-grow-1">
              <span className="material-symbols-outlined position-absolute" style={{ right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--outline, #767586)", fontSize: 22 }}>search</span>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="بحث عن طلبات، طلاب، أو عقارات..."
                style={{ borderRadius: "9999px", background: "var(--surface-container-low, #f0f3ff)", border: "none", paddingRight: 38 }}
              />
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm rounded-circle" style={{ width: 42, height: 42 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)", fontSize: 24 }}>notifications</span>
            </button>
            <div className="dropdown">
              <button className="btn btn-sm p-0 d-flex align-items-center gap-2 dropdown-toggle show-arrow" data-bs-toggle="dropdown">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="rounded-circle" style={{ width: 42, height: 42, objectFit: "cover" }} />
                ) : (
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 42, height: 42, background: "hsl(200, 60%, 50%)", fontSize: 15 }}>
                    {user.full_name ? user.full_name[0] : "و"}
                  </div>
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end text-end mt-2 p-2 shadow-sm border-0 rounded-3">
                <li><Link className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2" to="/broker/profile"><span className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span>الملف الشخصي</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 text-danger fw-semibold" onClick={handleLogout}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>logout</span>تسجيل الخروج
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <main className="p-3 p-md-4" style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default BrokerLayout;
