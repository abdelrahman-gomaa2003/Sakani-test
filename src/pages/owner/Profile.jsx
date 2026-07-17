import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

const inputStyle = {
  borderRadius: "var(--radius-md, 12px)",
  borderColor: "var(--border, #DDD8D0)",
  padding: "14px 48px 14px 16px",
  fontSize: "0.95rem",
  transition: "border-color 0.25s ease, box-shadow 0.25s ease",
  background: "var(--white, #fff)",
};

const labelStyle = {
  fontSize: "1rem",
  fontWeight: 600,
  color: "var(--on-surface-variant, #5A6370)",
  marginBottom: 6,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const iconWrapStyle = {
  position: "absolute",
  right: 14,
  top: "50%",
  transform: "translateY(-50%)",
  color: "var(--primary, #6B9080)",
  fontSize: 20,
  pointerEvents: "none",
  display: "flex",
};

function OwnerProfile() {
  const { user, profile } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => ({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    national_id: profile?.national_id || "",
    city: profile?.city || "الفيوم",
    bio: profile?.bio || "",
  }));
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(() => profile?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({ apartments: 0, views: 0, rating: 0 });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      const { count } = await supabase
        .from("apartments")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id);
      const { data: apts } = await supabase
        .from("apartments")
        .select("views")
        .eq("owner_id", user.id);
      const totalViews = (apts || []).reduce((s, a) => s + (a.views || 0), 0);
      setStats({ apartments: count || 0, views: totalViews, rating: 0 });
    };
    loadStats();
  }, [user]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
      return;
    }
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setDirty(true);
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    if (profile?.avatar_url) {
      const path = profile.avatar_url.split("/avatars/")[1];
      if (path) await supabase.storage.from("apartment-images").remove([`avatars/${path}`]);
    }
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    setAvatar(null);
    setAvatarPreview(null);
    setUploadingAvatar(false);
    toast.success("تم حذف الصورة");
    window.location.reload();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("يرجى إدخال الاسم الكامل");
      return;
    }
    setSaving(true);

    let avatarUrl = profile?.avatar_url || null;
    if (avatar) {
      const ext = avatar.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("apartment-images")
        .upload(path, avatar, { upsert: true, contentType: avatar.type });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("apartment-images").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        bio: form.bio,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
      return;
    }
    setDirty(false);
    setAvatar(null);
    toast.success("تم حفظ التغييرات بنجاح");
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })
    : "2024";

  return (
    <div className="d-flex flex-column gap-4 owner-stagger">
      {/* Hero Banner */}
      <div className="position-relative" style={{ animation: "ownerFadeIn 0.5s ease both" }}>
        <div
          className="overflow-hidden"
          style={{
            height: 220,
            borderRadius: "var(--radius-lg, 18px)",
            background: "linear-gradient(135deg, var(--primary) 0%, #2D6A4F 50%, var(--primary-light, #A4C3B2) 100%)",
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>

        {/* Avatar + Info overlay */}
        <div
          className="position-absolute d-flex align-items-end gap-4 px-4"
          style={{ bottom: -48, right: 24, left: 24 }}
        >
          {/* Avatar */}
          <div
            className="position-relative flex-shrink-0"
            style={{ cursor: "pointer" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
              style={{
                width: 120,
                height: 120,
                border: "4px solid var(--white, #fff)",
                boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
                background: "var(--primary, #6B9080)",
                fontSize: 42,
                color: "white",
                fontWeight: 700,
              }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="الملف الشخصي" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                form.full_name?.[0] || "م"
              )}
            </div>
            {/* Edit overlay */}
            <div
              className="position-absolute d-flex align-items-center justify-content-center rounded-circle"
              style={{
                bottom: 2,
                left: 2,
                width: 32,
                height: 32,
                background: "var(--primary, #6B9080)",
                color: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                fontSize: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handleAvatarChange} />
          </div>

          {/* Name + meta */}
          <div className="mb-3 flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <h2 className="fw-bold mb-0" style={{ fontSize: "1.6rem", color: "var(--on-surface, #1A1D23)" }}>
                {form.full_name || "المالك"}
              </h2>
              {profile?.verification_status === "approved" && (
                <span
                  className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                  style={{ background: "rgba(107,144,128,0.12)", color: "var(--primary, #6B9080)", fontSize: "0.85rem", fontWeight: 600 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>verified</span>
                  موثق
                </span>
              )}
            </div>
            <p className="mb-0" style={{ color: "var(--on-surface-variant, #5A6370)", fontSize: "1.02rem" }}>
              عضو منذ {memberSince}
            </p>
            {avatarPreview && (
              <button
                className="btn btn-sm mt-2 d-inline-flex align-items-center gap-1"
                style={{ fontSize: "0.88rem", color: "var(--danger, #C45B4A)", padding: "2px 8px" }}
                onClick={(e) => { e.stopPropagation(); handleDeleteAvatar(); }}
                disabled={uploadingAvatar}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                حذف الصورة
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for avatar overlap */}
      <div style={{ marginTop: 24 }} />

      {/* Stats Row */}
      <div className="row g-3 owner-section" style={{ animationDelay: "0.1s" }}>
        {[
          { icon: "apartment", label: "العقارات", value: stats.apartments, color: "var(--primary, #6B9080)" },
          { icon: "visibility", label: "المشاهدات", value: stats.views.toLocaleString("ar-EG"), color: "var(--primary-dark, #4A6E5C)" },
          { icon: "star", label: "التقييم", value: "—", color: "var(--warning, #E0A854)" },
        ].map((stat, i) => (
          <div key={i} className="col-sm-4">
            <div
              className="owner-section-card p-4 d-flex align-items-center gap-3"
              style={{ animation: `ownerFadeInUp 0.45s ease both`, animationDelay: `${0.1 + i * 0.06}s` }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 48, height: 48, background: `${stat.color}12`, color: stat.color }}
              >
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <div>
                <p className="mb-0" style={{ fontSize: "1.05rem", color: "var(--on-surface-variant, #5A6370)" }}>{stat.label}</p>
                <h4 className="fw-bold mb-0" style={{ fontSize: "1.3rem", color: "var(--on-surface, #1A1D23)" }}>{stat.value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Form Column */}
        <div className="col-lg-8">
          <form onSubmit={handleSave}>
            <div className="owner-section-card p-4 p-md-5 owner-section" style={{ animationDelay: "0.2s" }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.2rem", color: "var(--on-surface, #1A1D23)" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--primary, #6B9080)", fontSize: 22 }}>person</span>
                البيانات الشخصية
              </h5>

              <div className="d-flex flex-column gap-4">
                {/* Full Name */}
                <div>
                  <label style={labelStyle}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>badge</span>
                    الاسم الكامل
                  </label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control owner-input"
                      style={inputStyle}
                      value={form.full_name}
                      onChange={(e) => update("full_name", e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                    />
                    <span style={iconWrapStyle}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>badge</span>
                    </span>
                  </div>
                </div>

                {/* Email (disabled) */}
                <div>
                  <label style={labelStyle}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
                    البريد الإلكتروني
                  </label>
                  <div className="position-relative">
                    <input
                      type="email"
                      className="form-control"
                      style={{ ...inputStyle, background: "var(--surface-container-low, #F5F3EE)", color: "var(--on-surface-variant, #5A6370)", cursor: "not-allowed" }}
                      value={form.email}
                      disabled
                    />
                    <span style={iconWrapStyle}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lock</span>
                    </span>
                  </div>
                </div>

                <div className="row g-3">
                  {/* Phone */}
                  <div className="col-md-6">
                    <label style={labelStyle}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>call</span>
                      رقم الهاتف
                    </label>
                    <div className="position-relative">
                      <input
                        type="tel"
                        className="form-control owner-input"
                        style={{ ...inputStyle, direction: "ltr", textAlign: "right" }}
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="01xxxxxxxxx"
                      />
                      <span style={iconWrapStyle}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call</span>
                      </span>
                    </div>
                  </div>

                  {/* City */}
                  <div className="col-md-6">
                    <label style={labelStyle}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_city</span>
                      المدينة
                    </label>
                    <div className="position-relative">
                      <input
                        type="text"
                        className="form-control"
                        style={{ ...inputStyle, background: "var(--surface-container-low, #F5F3EE)", color: "var(--on-surface-variant, #5A6370)" }}
                        value={form.city}
                        disabled
                      />
                      <span style={iconWrapStyle}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>location_city</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label style={labelStyle}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                    نبذة تعريفية
                  </label>
                  <div className="position-relative">
                    <textarea
                      className="form-control owner-input"
                      style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                      rows={4}
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      placeholder="اكتب نبذة مختصرة عنك..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex align-items-center gap-3 mt-5">
                <button
                  className="btn px-5 py-3 fw-bold owner-btn-lift"
                  type="submit"
                  disabled={saving || !dirty}
                  style={{
                    background: dirty ? "var(--primary, #6B9080)" : "var(--border, #DDD8D0)",
                    color: dirty ? "white" : "var(--on-surface-variant, #5A6370)",
                    borderRadius: "var(--radius-md, 12px)",
                    fontSize: "0.95rem",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? (
                    <span className="d-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm" />
                      جاري الحفظ...
                    </span>
                  ) : (
                    <span className="d-flex align-items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>save</span>
                      حفظ التغييرات
                    </span>
                  )}
                </button>
                {dirty && (
                  <button
                    type="button"
                    className="btn px-4 py-3 fw-bold"
                    style={{
                      border: "1px solid var(--border, #DDD8D0)",
                      color: "var(--on-surface-variant, #5A6370)",
                      borderRadius: "var(--radius-md, 12px)",
  fontSize: "1.1rem",
                    }}
                    onClick={() => {
                      setForm({
                        full_name: profile?.full_name || "",
                        email: profile?.email || "",
                        phone: profile?.phone || "",
                        national_id: profile?.national_id || "",
                        city: profile?.city || "الفيوم",
                        bio: profile?.bio || "",
                      });
                      setAvatar(null);
                      setAvatarPreview(profile?.avatar_url || null);
                      setDirty(false);
                    }}
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4">
            {/* Verification Card */}
            <div
              className="owner-section-card overflow-hidden owner-section"
              style={{ animationDelay: "0.25s" }}
            >
              <div
                className="p-4"
                style={{
                  background: profile?.verification_status === "approved"
                    ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                    : "linear-gradient(135deg, var(--surface-container-low, #F5F3EE), var(--surface-container, #F0EDE8))",
                }}
              >
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: profile?.verification_status === "approved" ? "#10b981" : "var(--primary, #6B9080)",
                      color: "white",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                      {profile?.verification_status === "approved" ? "verified" : "pending"}
                    </span>
                  </div>
                  <div>
                    <h6
                      className="fw-bold mb-0"
                      style={{ color: profile?.verification_status === "approved" ? "#10b981" : "var(--primary, #6B9080)" }}
                    >
                      {profile?.verification_status === "approved" ? "حساب موثق" : "قيد المراجعة"}
                    </h6>
                    <p className="mb-0 small" style={{ color: profile?.verification_status === "approved" ? "#059669" : "var(--on-surface-variant, #5A6370)" }}>
                      {profile?.verification_status === "approved" ? "تم التحقق من هويتك بنجاح" : "بانتظار مراجعة الوثائق"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="owner-section-card p-4 owner-section" style={{ animationDelay: "0.3s" }}>
              <h6 className="fw-bold mb-3" style={{ fontSize: "1.05rem", color: "var(--on-surface, #1A1D23)" }}>
                إجراءات سريعة
              </h6>
              <div className="d-flex flex-column gap-2">
                {[
                  { icon: "lock", label: "تغيير كلمة المرور", desc: "تحديث كلمة المرور" },
                  { icon: "notifications", label: "إدارة الإشعارات", desc: "تخصيص تفضيلات الإشعارات" },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="d-flex align-items-center gap-3 p-3 rounded-3 text-end w-100 border-0"
                    style={{
                      background: "var(--surface-container-low, #F5F3EE)",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(107,144,128,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-container-low, #F5F3EE)"; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary, #6B9080)" }}>{item.icon}</span>
                    <div>
                      <p className="fw-bold mb-0" style={{ fontSize: "1.02rem" }}>{item.label}</p>
                      <p className="mb-0 small" style={{ color: "var(--on-surface-variant, #5A6370)" }}>{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription Card */}
            <div
              className="owner-section-card p-4 text-white owner-section"
              style={{
                background: "linear-gradient(135deg, var(--primary, #6B9080), #2D6A4F)",
                animationDelay: "0.35s",
                boxShadow: "0 8px 28px rgba(107,144,128,0.2)",
              }}
            >
              <div className="d-flex align-items-center gap-3 mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.8 }}>card_membership</span>
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: "1.05rem" }}>الباقة المجانية</h6>
                  <p className="mb-0" style={{ fontSize: "1.05rem", opacity: 0.75 }}>{stats.apartments} / 3 شقق</p>
                </div>
              </div>
              <a
                href="/subscriptions"
                className="btn w-100 py-2 fw-bold text-decoration-none"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: "white",
                  borderRadius: "var(--radius-md, 12px)",
                  fontSize: "0.85rem",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                ترقية الباقة
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerProfile;
