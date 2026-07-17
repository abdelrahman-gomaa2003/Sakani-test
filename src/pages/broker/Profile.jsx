import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { apartmentService } from "../../services/apartmentService";
import toast from "react-hot-toast";

function BrokerProfile() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState(() => ({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
  }));
  const [apartments, setApartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const { data } = await apartmentService.getByOwner(user.id);
      setApartments((data || []).slice(0, 3));
    };
    loadData();
  }, [user]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone, bio: form.bio })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }
    toast.success("تم حفظ التعديلات بنجاح");
  };

  return (
    <div>
      {/* Profile Header */}
      <section className="mb-5">
        <div className="rounded-4 overflow-hidden" style={{ height: 200, background: "linear-gradient(135deg, var(--primary-container), var(--primary))" }} />
        <div className="d-flex flex-column flex-md-row align-items-md-end gap-4 px-4" style={{ marginTop: -60 }}>
          <div className="position-relative">
            <div className="rounded-circle overflow-hidden bg-white" style={{ width: 120, height: 120, border: "4px solid white", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={form.full_name} className="w-100 h-100" style={{ objectFit: "cover" }} />
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white fw-bold" style={{ background: "var(--primary)", fontSize: 36 }}>
                  {form.full_name ? form.full_name[0] : "و"}
                </div>
              )}
            </div>
            <div className="position-absolute bottom-2 end-2 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 32, height: 32, background: "var(--primary)", color: "white", border: "2px solid white" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
          <div className="flex-grow-1 pt-4 pt-md-5 text-md-end">
            <h3 className="fw-bold mb-1" style={{ fontSize: "1.4rem" }}>{form.full_name || "وسيط"}</h3>
            <div className="d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>apartment</span>
              وسيط عقاري معتمد في سكني
            </div>
          </div>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="d-flex flex-column gap-4">
            {/* Edit Form */}
            <div className="p-4 rounded-4 bg-white" style={{ boxShadow: "0 4px 20px rgba(107,144,128,0.08)" }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1rem" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>edit_note</span>
                البيانات الشخصية
              </h5>
              <form onSubmit={handleSave}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">الاسم الكامل</label>
                    <input className="form-control" type="text" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} style={{ borderRadius: "var(--radius-md)", padding: "10px 16px" }} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">البريد الإلكتروني</label>
                    <input className="form-control" type="email" value={form.email} disabled style={{ borderRadius: "var(--radius-md)", padding: "10px 16px", background: "#f5f5f5" }} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">رقم الجوال</label>
                    <input className="form-control" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} style={{ borderRadius: "var(--radius-md)", padding: "10px 16px", direction: "ltr", textAlign: "right" }} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-muted">نبذة تعريفية</label>
                    <textarea className="form-control" rows={3} value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="اكتب نبذة عنك كوسيط عقاري..." style={{ borderRadius: "var(--radius-md)", padding: "10px 16px" }} />
                  </div>
                  <div className="col-12 mt-2 text-end">
                    <button className="btn px-4 py-2 fw-bold text-white" type="submit" disabled={saving} style={{ background: "var(--primary)", borderRadius: "var(--radius-md)" }}>
                      {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Managed Apartments */}
            {apartments.length > 0 && (
              <div className="p-4 rounded-4 bg-white" style={{ boxShadow: "0 4px 20px rgba(107,144,128,0.08)" }}>
                <h6 className="fw-bold mb-3">عقارات تحت الإدارة</h6>
                <div className="row g-3">
                  {apartments.map((apt) => (
                    <div key={apt.id} className="col-md-4">
                      <div className="rounded-3 overflow-hidden mb-2" style={{ aspectRatio: "16/10" }}>
                        <img src={apt.images?.[0] || "https://via.placeholder.com/200x120"} alt={apt.title} className="w-100 h-100" style={{ objectFit: "cover" }} />
                      </div>
                      <h6 className="fw-bold text-truncate" style={{ fontSize: "0.85rem" }}>{apt.title}</h6>
                      <p className="d-flex align-items-center gap-1 mb-0" style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                        {apt.neighborhood || "الفيوم"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-xl-4">
          <div className="d-flex flex-column gap-4">
            {/* Account Settings */}
            <div className="p-4 rounded-4 bg-white" style={{ boxShadow: "0 4px 20px rgba(107,144,128,0.08)" }}>
              <h6 className="fw-bold mb-4">إعدادات الحساب</h6>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>notifications_active</span>
    <div className="container py-3">
                      <p className="fw-bold mb-0" style={{ fontSize: "0.85rem" }}>تنبيهات الطلبات</p>
                      <p className="mb-0" style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>استقبل تنبيهات الطلبات الجديدة</p>
                    </div>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} style={{ cursor: "pointer" }} />
                  </div>
                </div>
                {[
                  { icon: "lock", label: "تغيير كلمة المرور" },
                  { icon: "language", label: "اللغة والمنطقة" },
                ].map((item) => (
                  <button key={item.label} className="btn d-flex justify-content-between align-items-center p-3 rounded-3 w-100 text-start" style={{ border: "1px solid transparent" }}>
                    <div className="d-flex align-items-center gap-3">
                      <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>{item.icon}</span>
                      <span style={{ fontSize: "0.85rem" }}>{item.label}</span>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--on-surface-variant)" }}>chevron_left</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Support CTA */}
            <div className="p-4 rounded-4 text-white position-relative overflow-hidden" style={{ background: "var(--primary)", boxShadow: "0 8px 32px rgba(107,144,128,0.2)" }}>
              <div className="position-absolute" style={{ top: -40, left: -40, width: 160, height: 160, background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(20px)" }} />
              <div className="position-relative" style={{ zIndex: 1 }}>
                <span className="material-symbols-outlined d-block mb-3" style={{ fontSize: 36 }}>support_agent</span>
                <h6 className="fw-bold mb-2">هل تحتاج للمساعدة؟</h6>
                <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>فريق دعم سكني متاح لمساعدتك.</p>
                <button className="btn w-100 py-2 fw-bold rounded-3" style={{ background: "white", color: "var(--primary)" }}>تواصل مع الدعم الفني</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrokerProfile;
