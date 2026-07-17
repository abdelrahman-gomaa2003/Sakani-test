import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logos/image.png";

const navItems = [
  { path: "/admin/dashboard", icon: "dashboard", label: "الرئيسية" },
  { path: "/admin/verifications", icon: "verified_user", label: "التوثيق" },
  { path: "/admin/contact", icon: "mail", label: "رسائل التواصل" },
  { path: "/admin/users", icon: "group", label: "المستخدمين" },
  { path: "/admin/apartments", icon: "home_work", label: "العقارات" },
  { path: "/admin/brokers", icon: "handshake", label: "الوسطاء" },
  { path: "/admin/subscriptions", icon: "card_membership", label: "الاشتراكات" },
];

const systemItems = [
  { path: "/admin/reports", icon: "assessment", label: "التقارير" },
  { path: "/admin/settings", icon: "settings", label: "الإعدادات" },
];

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const user = profile || { full_name: "مدير النظام", avatar_url: null };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <style>{`
        @media (min-width: 768px) {
          .admin-main-content { margin-right: 256px !important; }
        }
      `}</style>
      {/* Sidebar - Desktop */}
      <aside
        className="d-none d-md-flex flex-column position-fixed top-0 bottom-0 z-3"
        style={{ width: 256, background: "white", borderLeft: "1px solid var(--outline-variant, #D0D0D0)", padding: "24px 12px" }}
      >
        {/* Logo */}
        <div className="d-flex align-items-center gap-2 px-3 mb-5">
          <img src={logo} alt="سكني" style={{ height: 90, width: "auto" }} />
        </div>

        {/* Nav */}
        <nav className="d-flex flex-column gap-1 flex-grow-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="d-flex align-items-center gap-3 px-4 py-3 text-decoration-none rounded-3"
                style={{
                  background: isActive ? "var(--primary)" : "transparent",
                  color: isActive ? "white" : "var(--on-surface-variant, #464555)",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: "var(--fs-sm, 0.975rem)",
                  transition: "all 0.2s",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}

          {/* System Section */}
          <div className="mt-4 mb-2 px-4" style={{ fontSize: "var(--fs-xs, 0.875rem)", fontWeight: 700, color: "var(--outline, #767586)", letterSpacing: "0.05em" }}>النظام</div>
          {systemItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="d-flex align-items-center gap-3 px-4 py-3 text-decoration-none rounded-3"
                style={{
                  background: isActive ? "var(--primary)" : "transparent",
                  color: isActive ? "white" : "var(--on-surface-variant, #464555)",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: "var(--fs-sm, 0.975rem)",
                  transition: "all 0.2s",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          className="d-flex align-items-center gap-3 px-4 py-3 rounded-3 border-0 w-100 mt-2"
          style={{ background: "transparent", color: "var(--error, #ba1a1a)", fontWeight: 500, fontSize: "var(--fs-sm, 0.975rem)", cursor: "pointer", textAlign: "right" }}
          onClick={handleLogout}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>logout</span>
          تسجيل الخروج
        </button>

        {/* System Status */}
        <div className="mt-auto p-3 rounded-4" style={{ background: "rgba(86,117,104,0.03)", border: "1px solid rgba(86,117,104,0.08)" }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span style={{ fontSize: "var(--fs-xs, 0.875rem)", fontWeight: 700, color: "var(--primary)" }}>حالة النظام</span>
            <span className="rounded-circle" style={{ width: 8, height: 8, background: "var(--success, #006d37)", animation: "pulse 2s infinite" }} />
          </div>
          <p className="mb-2" style={{ fontSize: "var(--fs-xs, 0.875rem)", color: "var(--on-surface-variant, #464555)", lineHeight: 1.6 }}>جميع الخدمات تعمل بكفاءة عالية.</p>
          <div className="rounded-pill overflow-hidden" style={{ height: 4, background: "var(--outline-variant, #D0D0D0)" }}>
            <div className="h-100 rounded-pill" style={{ width: "98%", background: "var(--success, #006d37)" }} />
          </div>
          <span style={{ fontSize: "var(--fs-xs, 0.875rem)", color: "var(--on-surface-variant, #464555)" }} className="d-block mt-1">استقرار النظام: 98.4%</span>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="position-fixed top-0 start-0 bottom-0" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1040, width: "100%" }} onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className="d-md-none position-fixed top-0 bottom-0 flex flex-column"
        style={{
          right: sidebarOpen ? 0 : -280,
          width: 256,
          transition: "right 0.3s ease",
          background: "white",
          borderLeft: "1px solid var(--outline-variant, #D0D0D0)",
          padding: "24px 12px",
          zIndex: 1050,
        }}
      >
        <div className="d-flex align-items-center justify-content-between px-3 mb-4">
          <div className="d-flex align-items-center gap-2">
            <img src={logo} alt="سكني" style={{ height: 80, width: "auto" }} />
          </div>
          <button className="btn btn-sm" onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="d-flex flex-column gap-1">
          {[...navItems, ...systemItems].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="d-flex align-items-center gap-3 px-4 py-3 text-decoration-none rounded-3"
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: isActive ? "var(--primary)" : "transparent",
                  color: isActive ? "white" : "var(--on-surface-variant, #464555)",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: "var(--fs-sm, 0.975rem)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <button
          className="d-flex align-items-center gap-3 px-4 py-3 rounded-3 border-0 w-100 mt-3"
          style={{ background: "transparent", color: "var(--error, #ba1a1a)", fontWeight: 500, fontSize: "var(--fs-sm, 0.975rem)", cursor: "pointer", textAlign: "right" }}
          onClick={() => { setSidebarOpen(false); handleLogout(); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>logout</span>
          تسجيل الخروج
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-grow-1 admin-main-content">
        {/* Top Header */}
        <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 px-4 py-4">
          <div>
            <div className="d-flex align-items-center gap-3 mb-1">
              <button className="d-md-none btn btn-sm" onClick={() => setSidebarOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
              </button>
              <h4 className="fw-bold mb-0" style={{ fontSize: "var(--fs-xl, 1.35rem)" }}>لوحة التحكم الإحصائية</h4>
            </div>
            <p className="mb-0" style={{ fontSize: "var(--fs-sm, 0.975rem)", color: "var(--on-surface-variant, #464555)" }}>أهلاً بك مجدداً، {user.full_name}. إليك نظرة شاملة اليوم.</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn position-relative p-2 rounded-circle" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant, #464555)", fontSize: 24 }}>notifications</span>
              <span className="position-absolute top-0 end-0 rounded-circle" style={{ width: 10, height: 10, background: "var(--error, #ba1a1a)", border: "2px solid white" }} />
            </button>
            <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)" }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="rounded-3" style={{ width: 40, height: 40, objectFit: "cover" }} />
              ) : (
                <div className="rounded-3 d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 40, height: 40, background: "var(--primary-container, #6B9080)", fontSize: 14 }}>
                  {user.full_name ? user.full_name[0] : "أ"}
                </div>
              )}
              <div className="d-none d-sm-block text-end">
                <p className="fw-bold mb-0" style={{ fontSize: "var(--fs-sm, 0.975rem)", lineHeight: 1.2 }}>{user.full_name}</p>
                <p className="mb-0" style={{ fontSize: "var(--fs-xs, 0.875rem)", color: "var(--on-surface-variant, #464555)" }}>مدير النظام</p>
              </div>
              <button
                className="btn btn-sm px-2 py-1 rounded-2"
                style={{ color: "var(--error, #ba1a1a)", fontWeight: 600 }}
                onClick={handleLogout}
                title="تسجيل الخروج"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-4" style={{ maxWidth: 1240, margin: "0 auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
