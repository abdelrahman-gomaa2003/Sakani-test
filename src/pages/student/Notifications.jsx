import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { notificationService } from "../../services/notificationService";
import { realtimeService } from "../../services/realtimeService";

const typeIconMap = {
  success: { icon: "verified", bg: "#e8f5e9", color: "#2e7d32", fill: true },
  info: { icon: "info", bg: "var(--surface-container, #e5eeff)", color: "var(--primary, #6B9080)" },
  warning: { icon: "warning", bg: "#fff3e0", color: "#e65100" },
  danger: { icon: "error", bg: "#ffdad6", color: "#ba1a1a" },
};

const filters = ["الكل", "غير مقروء"];

function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [now] = useState(() => Date.now());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await notificationService.getAll(user.id);
      setNotifications(data || []);
      setLoading(false);
    };
    fetchNotifications();

    const cleanup = realtimeService.subscribeToNotifications(user.id, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setToast(newNotification);
      setTimeout(() => setToast(null), 4000);
    });

    return () => cleanup();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTimeLabel = (timestamp) => {
    const diff = now - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `منذ ${Math.max(1, mins)} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "أمس";
    return `منذ ${days} يوم`;
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === "غير مقروء") return !n.is_read;
    return true;
  });

  return (
    <div className="notifications-page">
      <style>{`
        .notifications-page { background: var(--background, #f8f9ff); min-height: calc(100vh - 80px); }
        .notification-card { border-radius: 0.75rem; transition: all 0.3s; border: 1px solid transparent; cursor: pointer; margin-bottom: 1rem; }
        .notification-card:hover { border-color: var(--primary, #6B9080); transform: translateY(-2px); background: var(--surface-card, #fff); }
        .filter-pill { border-radius: 50px; padding: 8px 20px; font-weight: 500; font-size: 0.85rem; border: 1px solid var(--border); background: white; color: var(--on-surface-variant); transition: all 0.2s; cursor: pointer; }
        .filter-pill.active { background-color: var(--primary, #6B9080); color: white; border-color: var(--primary); }
        @keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <div className="container py-4" style={{ maxWidth: 900 }}>
        <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-2">
          <div>
            <h1 className="h3 fw-bold text-dark mb-1">التنبيهات</h1>
            <p className="text-muted small mb-0">
              تابع آخر التحديثات والرسائل
              {unreadCount > 0 && <span className="badge bg-primary ms-2" style={{ fontSize: "0.7rem" }}>{unreadCount} جديد</span>}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-link text-decoration-none fw-semibold p-0" style={{ color: "var(--primary)", fontSize: "0.85rem" }} onClick={markAllAsRead}>
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        <div className="d-flex gap-2 mb-4">
          {filters.map((f) => (
            <button key={f} className={`filter-pill ${activeFilter === f ? "active" : ""}`} onClick={() => setActiveFilter(f)}>
              {f}
              {f === "غير مقروء" && unreadCount > 0 && <span className="ms-1 badge bg-white" style={{ fontSize: "0.65rem", color: "var(--primary)" }}>{unreadCount}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
        ) : !user ? (
          <div className="bg-white rounded-4 p-5 text-center border">
            <span className="material-symbols-outlined text-muted mb-3" style={{ fontSize: 64 }}>lock</span>
            <h5 className="fw-bold text-dark mb-1">سجّل الدخول أولاً</h5>
            <p className="text-muted small">يجب تسجيل الدخول لعرض التنبيهات.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-4 p-5 text-center border">
            <span className="material-symbols-outlined text-muted mb-3" style={{ fontSize: 64 }}>notifications_off</span>
            <h5 className="fw-bold text-dark mb-1">لا توجد تنبيهات</h5>
            <p className="text-muted small mb-0">لم تجد أي تنبيهات مطابقة.</p>
          </div>
        ) : (
          <div className="d-flex flex-column">
            {filtered.map((n) => {
              const iconStyle = typeIconMap[n.type] || typeIconMap.info;
              return (
                <div className="notification-card p-4 d-flex align-items-start gap-3" key={n.id} style={{ background: "rgba(255,255,255,0.8)" }} onClick={() => markAsRead(n.id)}>
                  {!n.is_read ? (
                    <div style={{ width: 10, height: 10, background: "var(--primary)", borderRadius: "50%", flexShrink: 0, marginTop: 8 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: iconStyle.bg, color: iconStyle.color }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", fontVariationSettings: iconStyle.fill ? "'FILL' 1" : "'FILL' 0" }}>{iconStyle.icon}</span>
                    </div>
                  )}
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h6 className="fw-bold mb-1" style={{ fontSize: "0.9rem" }}>{n.title}</h6>
                      <small className="text-muted text-nowrap" style={{ fontSize: "0.75rem" }}>{getTimeLabel(n.created_at)}</small>
                    </div>
                    <p className="text-muted mb-0 small" style={{ lineHeight: 1.6 }}>{n.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Realtime Toast */}
      {toast && (
        <div
          className="position-fixed bottom-0 end-0 m-4 p-3 rounded-4 d-flex align-items-center gap-3 shadow-lg"
          style={{ background: "#fff", border: "1px solid rgba(0,109,55,0.2)", zIndex: 9999, animation: "slideIn 0.3s ease", maxWidth: 360 }}
        >
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: "rgba(0,109,55,0.1)", color: "var(--success, #006d37)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications_active</span>
          </div>
          <div className="flex-grow-1 min-w-0">
            <p className="fw-bold mb-0" style={{ fontSize: "0.8rem" }}>{toast.title}</p>
            <p className="mb-0 text-truncate" style={{ fontSize: "0.7rem", color: "var(--on-surface-variant, #464555)" }}>{toast.message}</p>
          </div>
          <button className="btn btn-sm p-0" onClick={() => setToast(null)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--outline, #767586)" }}>close</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default Notifications;
