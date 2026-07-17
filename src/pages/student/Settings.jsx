import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { authService } from "../../services/authService";
import { supabase } from "../../lib/supabase";

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { score: 1, label: "ضعيفة", color: "#C45B4A" };
  if (score <= 4) return { score: 2, label: "متوسطة", color: "#E9A23B" };
  return { score: 3, label: "قوية", color: "#10B981" };
}

function PasswordInput({ id, label, icon, value, onChange, placeholder, show, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: "0.95rem", color: "var(--on-surface, #1A1D23)" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>{icon}</span>
        {label}
      </label>
      <div className="position-relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="form-control"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            height: 50,
            borderRadius: "var(--radius-md, 12px)",
            border: "2px solid var(--border, #DDD8D0)",
            paddingRight: 48,
            paddingLeft: 48,
            fontSize: "1rem",
            background: "var(--white, #fff)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px rgba(107,144,128,0.12)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border, #DDD8D0)"; e.target.style.boxShadow = "none"; }}
        />
        <span className="material-symbols-outlined position-absolute" style={{ right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: "var(--on-surface-variant, #5A6370)", pointerEvents: "none" }}>{icon}</span>
        <button
          type="button"
          className="btn p-0 position-absolute d-flex align-items-center justify-content-center"
          style={{ left: 8, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 8 }}
          onClick={onToggle}
          tabIndex={-1}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--on-surface-variant, #5A6370)" }}>{show ? "visibility_off" : "visibility"}</span>
        </button>
      </div>
    </div>
  );
}

function StrengthIndicator({ strength }) {
  if (!strength.label) return null;
  return (
    <div className="d-flex align-items-center gap-2 mt-2" style={{ animation: "ownerFadeIn 0.3s ease" }}>
      <div className="d-flex gap-1 flex-grow-1">
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= strength.score ? strength.color : "var(--border, #DDD8D0)", transition: "background 0.3s" }} />
        ))}
      </div>
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: strength.color, whiteSpace: "nowrap" }}>{strength.label}</span>
    </div>
  );
}

function ValidationCheck({ met, label }) {
  return (
    <div className="d-flex align-items-center gap-2" style={{ opacity: met ? 1 : 0.5, transition: "opacity 0.2s" }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: met ? "var(--success, #10B981)" : "var(--on-surface-variant, #5A6370)" }}>
        {met ? "check_circle" : "radio_button_unchecked"}
      </span>
      <span style={{ fontSize: "0.85rem", color: met ? "var(--success, #10B981)" : "var(--on-surface-variant, #5A6370)" }}>{label}</span>
    </div>
  );
}

const tabs = [
  { id: "general", label: "عام", icon: "settings" },
  { id: "notifications", label: "التنبيهات", icon: "notifications" },
  { id: "security", label: "الأمان", icon: "security" },
  { id: "privacy", label: "الخصوصية", icon: "visibility" },
];

const notificationItems = [
  { id: "email", icon: "mail", title: "البريد الإلكتروني", desc: "استلام تحديثات الحجز والعروض عبر البريد", color: "var(--primary)", bg: "rgba(107,144,128,0.1)" },
  { id: "sms", icon: "sms", title: "رسائل SMS", desc: "إشعارات فورية على هاتفك الجوال", color: "var(--success, #10b981)", bg: "rgba(16,185,129,0.1)" },
  { id: "browser", icon: "notifications_active", title: "تنبيهات المتصفح", desc: "إشعارات مباشرة أثناء استخدام الموقع", color: "#583d00", bg: "rgba(255,190,32,0.15)" },
];

function Settings() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, signOut, reauthenticate, updatePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");

  const [name, setName] = useState(profile?.full_name || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("sakani_font_size");
    return saved ? Number(saved) : 16;
  });

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize + "px";
  }, [fontSize]);

  const [notifications, setNotifications] = useState({
    email: profile?.notification_email ?? true,
    sms: profile?.notification_sms ?? false,
    browser: profile?.notification_browser ?? true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

  const [privacy, setPrivacy] = useState({
    profileVisible: profile?.privacy_profile_visible ?? true,
    shareUsage: profile?.privacy_share_usage ?? false,
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--user-font-size", `${fontSize}px`);
  }, [fontSize]);

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("حجم الصورة يجب أن يكون أقل من 2 ميجابايت"); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveGeneral = async () => {
    if (!name.trim()) { toast.error("الرجاء إدخال اسم صحيح"); return; }
    setSavingGeneral(true);
    try {
      let avatarUrl = profile?.avatar_url || null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const filePath = `avatars/${user.id}.${ext}`;
        let { error: uploadError } = await supabase.storage
          .from("apartment-images")
          .upload(filePath, avatarFile, { upsert: true });
        if (uploadError) {
          try {
            await supabase.storage.createBucket("apartment-images", { public: true });
            const retry = await supabase.storage
              .from("apartment-images")
              .upload(filePath, avatarFile, { upsert: true });
            if (retry.error) { toast.error("فشل رفع الصورة"); return; }
          } catch { toast.error("فشل رفع الصورة"); return; }
        }
        const { data: urlData } = supabase.storage.from("apartment-images").getPublicUrl(filePath);
        avatarUrl = urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : avatarUrl;
      }
      const updates = { full_name: name.trim() };
      if (avatarFile) updates.avatar_url = avatarUrl;
      const { error } = await authService.updateProfile(user.id, updates);
      if (error) { toast.error("حدث خطأ أثناء الحفظ"); return; }
      localStorage.setItem("sakani_font_size", fontSize);
      await refreshProfile();
      setAvatarFile(null);
      toast.success("تم حفظ التعديلات بنجاح");
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifs(true);
    try {
      const { error } = await authService.updateProfile(user.id, {
        notification_email: notifications.email,
        notification_sms: notifications.sms,
        notification_browser: notifications.browser,
      });
      if (error) { toast.error("حدث خطأ أثناء حفظ التنبيهات"); return; }
      await refreshProfile();
      toast.success("تم حفظ تفضيلات التنبيهات");
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const { error } = await authService.updateProfile(user.id, {
        privacy_profile_visible: privacy.profileVisible,
        privacy_share_usage: privacy.shareUsage,
      });
      if (error) { toast.error("حدث خطأ أثناء حفظ إعدادات الخصوصية"); return; }
      await refreshProfile();
      toast.success("تم حفظ إعدادات الخصوصية");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const strength = getPasswordStrength(newPw);

  const validations = [
    { met: newPw.length >= 8, label: "8 أحرف على الأقل" },
    { met: /[A-Z]/.test(newPw), label: "حرف كبير (A-Z)" },
    { met: /[a-z]/.test(newPw), label: "حرف صغير (a-z)" },
    { met: /[0-9]/.test(newPw), label: "رقم (0-9)" },
    { met: /[^A-Za-z0-9]/.test(newPw), label: "رمز خاص (@, !, #)" },
    { met: newPw === confirmPw && confirmPw.length > 0, label: "كلمتا المرور متطابقتان" },
  ];

  const allValid = validations.every((v) => v.met);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    if (!allValid) {
      toast.error("كلمة المرور لا تلبي جميع المتطلبات");
      return;
    }
    setSavingPw(true);
    try {
      if (user?.email) {
        const { error: authError } = await reauthenticate(user.email, currentPw);
        if (authError) {
          toast.error("كلمة المرور الحالية غير صحيحة");
          setSavingPw(false);
          return;
        }
      }
      const { error: updateError } = await updatePassword(newPw);
      if (updateError) {
        toast.error(updateError.message || "فشل تغيير كلمة المرور");
        setSavingPw(false);
        return;
      }
      toast.success("تم تغيير كلمة المرور بنجاح.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      console.error("Password change error:", err);
      toast.error("حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setSavingPw(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="settings-card">
              <h3 className="settings-label mb-4">الملف الشخصي</h3>
              <div className="d-flex align-items-center gap-4 mb-4">
                <div className="position-relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="الملف الشخصي" className="rounded-circle border border-3 border-primary shadow-sm" style={{ width: 80, height: 80, objectFit: "cover" }} />
                  ) : (
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center border border-3 border-primary shadow-sm" style={{ width: 80, height: 80, fontSize: 28, fontWeight: "bold" }}>
                      {name ? name[0] : "أ"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="btn btn-outline-primary btn-sm px-4 py-2 mb-1" style={{ cursor: "pointer" }}>
                    تحميل صورة جديدة
                    <input type="file" className="d-none" accept="image/*" onChange={handleAvatarSelect} />
                  </label>
                  <div className="settings-desc">صورة مربعة بحجم أقل من 2 ميجابايت</div>
                </div>
              </div>
              <div>
                <label className="form-label small" style={{ color: "var(--on-surface-variant)" }}>الاسم الكامل</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل"
                  style={{ borderRadius: "var(--radius-md, 10px)", borderColor: "var(--border)" }}
                />
              </div>
            </div>

            <div className="settings-card">
              <h2 className="settings-label mb-4">الإعدادات العامة</h2>

              <div className="d-flex align-items-center justify-content-between py-3">
                <div>
                  <h3 className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface)" }}>المظهر</h3>
                  <p className="small mb-0" style={{ color: "var(--on-surface-variant)" }}>التبديل بين الوضع الليلي والنهاري</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>light_mode</span>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" role="switch" checked={theme === "dark"} onChange={toggleTheme} style={{ cursor: "pointer" }} />
                  </div>
                  <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>dark_mode</span>
                </div>
              </div>

              <hr style={{ borderColor: "var(--border)" }} />

              <div className="py-3">
                <div className="mb-3">
                  <h3 className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface)" }}>حجم الخط</h3>
                  <p className="small mb-0" style={{ color: "var(--on-surface-variant)" }}>تعديل حجم النصوص في المنصة</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="small fw-bold" style={{ color: "var(--on-surface)" }}>أ</span>
                  <input type="range" className="form-range flex-grow-1" min="12" max="24" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ accentColor: "var(--primary)" }} />
                  <span className="fw-bold" style={{ fontSize: "1.25rem", color: "var(--on-surface)" }}>أ</span>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary w-100 py-3 fw-bold"
              style={{ borderRadius: "var(--radius-md, 10px)", fontSize: "1.05rem" }}
              onClick={handleSaveGeneral}
              disabled={savingGeneral}
            >
              {savingGeneral ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              حفظ التعديلات
            </button>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-card">
            <h2 className="settings-label mb-4">تفضيلات التنبيهات</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {notificationItems.map((item) => (
                <div key={item.id} className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ border: "1px solid var(--border)" }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 44, height: 44, background: item.bg, color: item.color }}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="fw-bold mb-0" style={{ fontSize: "0.95rem", color: "var(--on-surface)" }}>{item.title}</h3>
                      <p className="small mb-0" style={{ color: "var(--on-surface-variant)" }}>{item.desc}</p>
                    </div>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" role="switch" checked={notifications[item.id]} onChange={() => setNotifications((prev) => ({ ...prev, [item.id]: !prev[item.id] }))} style={{ cursor: "pointer" }} />
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary w-100 py-3 fw-bold mt-4"
              style={{ borderRadius: "var(--radius-md, 10px)", fontSize: "1.05rem" }}
              onClick={handleSaveNotifications}
              disabled={savingNotifs}
            >
              {savingNotifs ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              حفظ التنبيهات
            </button>
          </div>
        );

      case "security":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Collapsible Security Section */}
            <div className="settings-card overflow-hidden" style={{ border: securityOpen ? "2px solid var(--primary)" : "2px solid transparent", transition: "border-color 0.3s" }}>
              <button
                className="w-100 p-0 d-flex align-items-center justify-content-between bg-transparent border-0 text-start"
                style={{ cursor: "pointer" }}
                onClick={() => setSecurityOpen(!securityOpen)}
              >
                <h2 className="settings-label d-flex align-items-center gap-2 mb-0">
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 24 }}>shield_lock</span>
                  الأمان وتغيير كلمة المرور
                </h2>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--on-surface-variant, #5A6370)", transform: securityOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }}>expand_more</span>
              </button>

              <div style={{ maxHeight: securityOpen ? 900 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}>
                <form onSubmit={handleChangePassword} className="d-flex flex-column gap-4" style={{ paddingTop: "1.25rem" }}>
                  <p className="mb-0" style={{ fontSize: "0.95rem", color: "var(--on-surface-variant, #5A6370)", lineHeight: 1.6 }}>
                    لتبديل كلمة المرور، أدخل كلمة المرور الحالية ثم كلمة المرور الجديدة. يجب أن تكون كلمة المرور الجديدة قوية ومحروسة.
                  </p>

                  <PasswordInput
                    id="current-password"
                    label="كلمة المرور الحالية"
                    icon="lock_open"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    show={showCurrent}
                    onToggle={() => setShowCurrent(!showCurrent)}
                  />

                  <PasswordInput
                    id="new-password"
                    label="كلمة المرور الجديدة"
                    icon="lock"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة"
                    show={showNew}
                    onToggle={() => setShowNew(!showNew)}
                  />

                  <StrengthIndicator strength={strength} />

                  <div className="d-flex flex-column gap-1">
                    {validations.map((v) => (
                      <ValidationCheck key={v.label} met={v.met} label={v.label} />
                    ))}
                  </div>

                  <PasswordInput
                    id="confirm-password"
                    label="تأكيد كلمة المرور الجديدة"
                    icon="lock_reset"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    show={showConfirm}
                    onToggle={() => setShowConfirm(!showConfirm)}
                  />

                  {confirmPw && confirmPw !== newPw && (
                    <div className="d-flex align-items-center gap-2 p-3 rounded-3" style={{ background: "rgba(196,91,74,0.08)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--danger, #C45B4A)" }}>error</span>
                      <span style={{ fontSize: "0.9rem", color: "var(--danger, #C45B4A)" }}>كلمتا المرور غير متطابقتين</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                    disabled={savingPw || !allValid || !currentPw}
                    style={{
                      borderRadius: "var(--radius-md, 12px)",
                      fontSize: "1rem",
                      background: savingPw || !allValid || !currentPw ? "var(--border, #DDD8D0)" : "var(--primary, #6B9080)",
                      color: savingPw || !allValid || !currentPw ? "var(--on-surface-variant, #5A6370)" : "white",
                      cursor: savingPw || !allValid || !currentPw ? "not-allowed" : "pointer",
                      transition: "all 0.25s",
                    }}
                  >
                    {savingPw ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" />
                        جاري حفظ التغييرات...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>save</span>
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="settings-card">
            <h2 className="settings-label mb-4">إعدادات الخصوصية</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="d-flex align-items-center justify-content-between py-2">
                <div style={{ maxWidth: 480 }}>
                  <h3 className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface)" }}>ظهور الملف الشخصي</h3>
                  <p className="small mb-0" style={{ color: "var(--on-surface-variant)" }}>السماح للملاك والطلاب الآخرين برؤية معلوماتك الأساسية</p>
                </div>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" role="switch" checked={privacy.profileVisible} onChange={() => setPrivacy((p) => ({ ...p, profileVisible: !p.profileVisible }))} style={{ cursor: "pointer" }} />
                </div>
              </div>
              <hr className="my-0" style={{ borderColor: "var(--border)" }} />
              <div className="d-flex align-items-center justify-content-between py-2">
                <div style={{ maxWidth: 480 }}>
                  <h3 className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface)" }}>مشاركة بيانات الاستخدام</h3>
                  <p className="small mb-0" style={{ color: "var(--on-surface-variant)" }}>ساعدنا في تحسين سكنى من خلال مشاركة بيانات مجهولة</p>
                </div>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" role="switch" checked={privacy.shareUsage} onChange={() => setPrivacy((p) => ({ ...p, shareUsage: !p.shareUsage }))} style={{ cursor: "pointer" }} />
                </div>
              </div>
            </div>
            <button
              className="btn btn-primary w-100 py-3 fw-bold mt-4"
              style={{ borderRadius: "var(--radius-md, 10px)", fontSize: "1.05rem" }}
              onClick={handleSavePrivacy}
              disabled={savingPrivacy}
            >
              {savingPrivacy ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : null}
              حفظ الخصوصية
            </button>
          </div>
        );

      case "danger":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="p-4 rounded-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <div className="d-flex align-items-start gap-3 mb-4">
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--danger, #ef4444)" }}>warning</span>
                <div>
                  <h2 className="fw-bold" style={{ fontSize: "1.25rem", color: "var(--danger, #ef4444)" }}>منطقة الخطر</h2>
                  <p className="small mb-0 mt-1" style={{ color: "var(--on-surface-variant)" }}>يرجى الحذر، هذه الإجراءات دائمة ولا يمكن التراجع عنها.</p>
                </div>
              </div>
              <div className="rounded-3 p-4" style={{ background: "var(--surface-card)", border: "1px solid rgba(239,68,68,0.1)" }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                  <div className="text-center text-md-end">
                    <h3 className="fw-bold mb-1" style={{ color: "var(--on-surface)" }}>تسجيل الخروج</h3>
                    <p className="small mb-0" style={{ color: "var(--on-surface-variant)" }}>سيتم تسجيل خروجك وتأمين الجلسة الحالية.</p>
                  </div>
                  <button className="btn btn-outline-danger px-4 py-2 fw-bold" style={{ borderRadius: "var(--radius-md, 10px)" }} onClick={handleLogout}>
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        .settings-card { background: var(--surface-card); border-radius: 18px; padding: 1.5rem; border: 1px solid var(--border); }
        .settings-label { font-size: 1.05rem; font-weight: 700; color: var(--on-surface); }
        .settings-desc { font-size: 0.9rem; color: var(--on-surface-variant); }
        .strength-bar { height: 6px; border-radius: 3px; transition: all 0.3s; }
      `}</style>
      <div className="container py-5 text-end" style={{ direction: "rtl" }}>
        <div className="row g-4">
          <div className="col-lg-3">
            <div className="rounded-4 p-3 shadow-sm sticky-top" style={{ top: 90, background: "var(--surface-card)" }}>
              <h1 className="fw-bold mb-4 px-3" style={{ fontSize: "1.3rem", color: "var(--on-surface)" }}>الإعدادات</h1>
              <nav className="d-flex flex-column gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border-0 text-end w-100"
                    style={{
                      fontWeight: activeTab === tab.id ? 700 : 500,
                      fontSize: "0.95rem",
                      background: activeTab === tab.id ? "var(--primary)" : "transparent",
                      color: activeTab === tab.id ? "white" : "var(--on-surface-variant)",
                      transition: "all 0.2s",
                    }}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="material-symbols-outlined">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border-0 text-end w-100"
                  style={{
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    color: activeTab === "danger" ? "white" : "var(--danger, #ef4444)",
                    background: activeTab === "danger" ? "var(--danger, #ef4444)" : "transparent",
                  }}
                  onClick={() => setActiveTab("danger")}
                >
                  <span className="material-symbols-outlined">delete</span>
                  منطقة الخطر
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;
