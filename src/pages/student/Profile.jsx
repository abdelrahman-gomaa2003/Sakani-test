import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { favoriteService } from "../../services/favoriteService";
import { messageService } from "../../services/messageService";

function Profile() {
  const { user, profile } = useAuth();
  const [favCount, setFavCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data: favs } = await favoriteService.getFavorites(user.id);
      setFavCount(favs?.length || 0);
      const { data: msgs } = await messageService.getConversations(user.id);
      setMsgCount(msgs?.length || 0);
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const userName = profile?.full_name || user?.name || "طالب";
  const userEmail = profile?.email || user?.email || "";
  const userPhone = profile?.phone || "";
  const userBio = profile?.bio || "";
  const userAvatar = profile?.avatar_url || null;

  const circumference = 2 * Math.PI * 54;
  const completionPercent = userBio && userPhone ? 100 : userBio ? 75 : userPhone ? 75 : 50;
  const dashoffset = circumference - (completionPercent / 100) * circumference;

  return (
    <div className="profile-page container py-3">
      <style>{`
        .profile-page { background: var(--background); }
        .bento-card { background: var(--surface-card); box-shadow: var(--shadow-md); transition: all 0.3s ease; }
        .bento-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .progress-ring-circle { transition: stroke-dashoffset 0.35s; transform: rotate(-90deg); transform-origin: 50% 50%; }
      `}</style>

      {/* Profile Header */}
      <section className="position-relative rounded-4 overflow-hidden mb-4" style={{ marginTop: 16 }}>
        <div style={{ height: 256, background: "linear-gradient(135deg, var(--primary-container), var(--primary))" }} />
        <div className="position-relative px-3 px-md-4 pb-4 d-flex flex-column flex-md-row-reverse align-items-end justify-content-between gap-4" style={{ marginTop: -64 }}>
          <div className="d-flex flex-column flex-md-row-reverse align-items-center align-items-md-end gap-4 text-center text-md-end">
            <div className="position-relative">
              <div className="rounded-circle border border-4 border-primary shadow-lg overflow-hidden bg-white" style={{ width: 128, height: 128 }}>
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-100 h-100" style={{ objectFit: "cover" }} />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white fw-bold" style={{ background: "var(--primary)", fontSize: "2.5rem" }}>
                    {userName.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h1 className="fw-bold mb-1" style={{ fontSize: "1.8rem", color: "var(--on-surface)" }}>{userName}</h1>
              <p className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-0" style={{ color: "var(--on-surface-variant)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>school</span>
                طالب بجامعة الفيوم
              </p>
            </div>
          </div>
          <div className="d-flex gap-2 pb-2">
            <Link to="/edit-profile" className="btn d-flex align-items-center gap-2 fw-bold shadow-lg" style={{ background: "var(--primary)", color: "white", padding: "10px 24px", fontSize: "0.85rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>edit</span>
              تعديل الملف
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4">
            <div className="bento-card rounded-4 p-4 border text-center" style={{ borderColor: "var(--border)" }}>
              <div className="d-inline-flex align-items-center justify-content-center mb-3 position-relative" style={{ width: 128, height: 128 }}>
                <svg width="128" height="128">
                  <circle cx="64" cy="64" r="54" fill="transparent" stroke="var(--surface-container-high)" strokeWidth="8" />
                  <circle cx="64" cy="64" r="54" fill="transparent" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashoffset} className="progress-ring-circle" />
                </svg>
                <span className="position-absolute fw-bold text-primary" style={{ fontSize: "1.3rem" }}>{completionPercent}%</span>
              </div>
              <h3 className="fw-bold mb-2" style={{ color: "var(--on-surface)" }}>إكتمال الملف</h3>
              <p className="text-muted small mb-3">بقي القليل لتكون جاهزاً للتقديم على أفضل السكنات</p>
              <Link to="/edit-profile" className="btn w-100 fw-bold" style={{ border: "2px solid var(--primary)", color: "var(--primary)", padding: "12px" }}>
                أكمل ملفك الآن
              </Link>
            </div>

            <div className="row g-3">
              {[
                { icon: "bookmark", count: favCount, label: "محفوظات" },
                { icon: "chat", count: msgCount, label: "رسائل" },
              ].map((stat) => (
                <div className="col-6" key={stat.icon}>
                  <div className="bento-card rounded-4 p-3 border text-center" style={{ borderColor: "var(--border)" }}>
                    <span className="material-symbols-outlined text-primary mb-1" style={{ fontSize: "1.8rem" }}>{stat.icon}</span>
                    <p className="fw-bold mb-0" style={{ color: "var(--on-surface)", fontSize: "1.3rem" }}>{loading ? "..." : stat.count}</p>
                    <small className="text-muted">{stat.label}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="col-lg-8">
          <div className="d-flex flex-column gap-4">
            <div className="bento-card rounded-4 p-4 border" style={{ borderColor: "var(--border)" }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="h5 fw-bold mb-0" style={{ color: "var(--on-surface)" }}>عني</h2>
                <Link to="/edit-profile" className="btn btn-link text-primary fw-bold text-decoration-none p-0" style={{ fontSize: "0.85rem" }}>تعديل</Link>
              </div>
              <p className="text-muted mb-0" style={{ lineHeight: 1.8 }}>
                {userBio || "لم تُضف نبذة شخصية بعد. أضف نبذة عنك لتظهر هنا."}
              </p>
            </div>

            {/* Info Cards */}
            <div className="bento-card rounded-4 p-4 border" style={{ borderColor: "var(--border)" }}>
              <h2 className="h5 fw-bold mb-3" style={{ color: "var(--on-surface)" }}>معلومات الاتصال</h2>
              <div className="d-flex flex-column gap-2">
                {[
                  { icon: "mail", label: "البريد الإلكتروني", value: userEmail || "غير محدد" },
                  { icon: "call", label: "رقم الهاتف", value: userPhone || "غير محدد" },
                ].map((item) => (
                  <div key={item.icon} className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: "var(--surface-container-low)" }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, background: "var(--primary-container)", color: "var(--primary)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                      </div>
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: "0.7rem" }}>{item.label}</small>
                        <span className="fw-bold small">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
