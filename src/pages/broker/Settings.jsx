import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ui/ConfirmModal";

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
    <div className="d-flex align-items-center gap-2 mt-2">
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

function BrokerSettings() {
  const { user, signOut, reauthenticate, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);

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

  const handleDeleteAccount = async () => {
    setConfirmDelete(false);
    toast.success("تم طلب حذف الحساب. سيتم المعالجة قريباً.");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: 740, margin: "0 auto" }}>
      {/* Header */}
      <div>
        <h2 className="fw-bold mb-1" style={{ fontSize: "1.65rem", color: "var(--on-surface, #1A1D23)" }}>الإعدادات</h2>
        <p className="mb-0" style={{ color: "var(--on-surface-variant, #5A6370)", fontSize: "1.05rem" }}>إدارة إعدادات حسابك وتفضيلاتك</p>
      </div>

      {/* Notifications */}
      <div className="p-4" style={{ background: "var(--surface-card)", borderRadius: "var(--radius-lg, 18px)", border: "1px solid var(--border, #DDD8D0)" }}>
        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 24 }}>notifications</span>
          الإشعارات
        </h5>
        <div className="d-flex justify-content-between align-items-center py-3" style={{ borderBottom: "1px solid var(--border, #DDD8D0)" }}>
          <div>
            <p className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface, #1A1D23)" }}>إشعارات البريد الإلكتروني</p>
            <p className="mb-0" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant, #5A6370)" }}>استلام إشعارات عبر البريد</p>
          </div>
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} style={{ cursor: "pointer" }} />
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center py-3">
          <div>
            <p className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface, #1A1D23)" }}>إشعارات الرسائل</p>
            <p className="mb-0" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant, #5A6370)" }}>تنبيه عند وصول رسالة جديدة</p>
          </div>
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} style={{ cursor: "pointer" }} />
          </div>
        </div>
      </div>

      {/* Security & Password */}
      <div className="overflow-hidden" style={{ background: "var(--surface-card)", borderRadius: "var(--radius-lg, 18px)", border: securityOpen ? "2px solid var(--primary)" : "2px solid transparent", transition: "border-color 0.3s" }}>
        <button
          className="w-100 p-4 d-flex align-items-center justify-content-between bg-transparent border-0 text-start"
          style={{ cursor: "pointer" }}
          onClick={() => setSecurityOpen(!securityOpen)}
        >
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 24 }}>shield_lock</span>
            الأمان وتغيير كلمة المرور
          </h5>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--on-surface-variant, #5A6370)", transform: securityOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }}>expand_more</span>
        </button>

        <div style={{ maxHeight: securityOpen ? 900 : 0, overflow: "hidden", transition: "max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}>
          <form onSubmit={handleChangePassword} className="px-4 pb-4 d-flex flex-column gap-4">
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

      {/* Danger Zone */}
      <div className="p-4" style={{ background: "var(--surface-card)", borderRadius: "var(--radius-lg, 18px)", border: "1px solid rgba(196,91,74,0.2)" }}>
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--danger, #C45B4A)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>warning</span>
          منطقة الخطر
        </h5>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface, #1A1D23)" }}>حذف الحساب</p>
            <p className="mb-0" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant, #5A6370)" }}>حذف حسابك نهائياً من المنصة</p>
          </div>
          <button className="btn btn-outline-danger btn-sm" style={{ fontSize: "0.9rem", borderRadius: "var(--radius-sm, 8px)" }} onClick={() => setConfirmDelete(true)}>حذف الحساب</button>
        </div>
      </div>

      {/* Logout */}
      <button
        className="btn d-flex align-items-center justify-content-center gap-2 py-3 fw-bold rounded-3"
        style={{ border: "2px solid var(--primary)", color: "var(--primary)", fontSize: "1rem" }}
        onClick={handleSignOut}
      >
        <span className="material-symbols-outlined">logout</span>
        تسجيل الخروج
      </button>

      <ConfirmModal open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDeleteAccount} title="حذف الحساب" message="هل أنت متأكد من حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء." confirmLabel="حذف" danger />
    </div>
  );
}

export default BrokerSettings;
