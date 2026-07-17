import { useState } from "react";

const logEntries = [
  { time: "2024-05-20 14:22:10", type: "INFO", msg: "نظام النسخ الاحتياطي بدأ بنجاح." },
  { time: "2024-05-20 14:23:45", type: "INFO", msg: "تم تحديث إعدادات الأمان بواسطة المشرف (admin_root)." },
  { time: "2024-05-20 14:25:12", type: "WARNING", msg: "تأخير بسيط في استجابة بوابة الدفع." },
  { time: "2024-05-20 14:30:05", type: "INFO", msg: "تم تنظيف ذاكرة التخزين المؤقت (Redis Cache)." },
  { time: "2024-05-20 14:32:44", type: "ERROR", msg: "محاولة دخول فاشلة من عنوان IP غير معروف (192.168.1.44)." },
  { time: "2024-05-20 14:35:00", type: "INFO", msg: "فحص النظام الدوري: جميع العمليات مستقرة." },
];

const apiKeys = [
  { name: "Cloudinary (تخزين الصور)", key: "••••••••••••••••••••••••••••••••", color: "var(--primary)" },
  { name: "Supabase (قاعدة البيانات)", key: "••••••••••••••••••••••••••••••••", color: "var(--success, #006d37)" },
  { name: "Google Maps (الخرائط)", key: "••••••••••••••••••••••••••••••••", color: "var(--error, #ba1a1a)" },
];

const sections = [
  { id: "general", icon: "settings_applications", label: "الإعدادات العامة" },
  { id: "security", icon: "shield", label: "الأمان والخصوصية" },
  { id: "api", icon: "api", label: "الربط البرمجي (API)" },
  { id: "logs", icon: "list_alt", label: "سجلات النظام" },
  { id: "danger", icon: "report", label: "منطقة الخطر", danger: true },
];

const healthCards = [
  { icon: "database", label: "قاعدة البيانات", value: "متصلة - 12ms", color: "var(--success, #006d37)" },
  { icon: "cloud_done", label: "التخزين السحابي", value: "نشط - 89% فراغ", color: "var(--primary)" },
  { icon: "dns", label: "حالة الخادم", value: "يعمل بكفاءة", color: "var(--success, #006d37)" },
];

function AdminSettings() {
  const [activeSection, setActiveSection] = useState("general");
  const [platformName, setPlatformName] = useState("سكني لإسكان الطلاب");
  const [platformDesc, setPlatformDesc] = useState("منصة رائدة توفر حلول إسكانية متكاملة للطلاب في المملكة العربية السعودية مع ضمان الأمان والراحة.");
  const [twoFA, setTwoFA] = useState(true);
  const [strongPassword, setStrongPassword] = useState(true);
  const [ipRestrict, setIpRestrict] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});

  const toggleKey = (i) => {
    setVisibleKeys((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontSize: "1.75rem" }}>إعدادات النظام</h4>
          <p className="mb-0" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant, #464555)" }}>
            إدارة التكوينات العامة، الأمان، والربط البرمجي للمنصة.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn px-4 py-2 rounded-3 fw-medium"
            style={{ border: "1px solid var(--outline-variant, #D0D0D0)", color: "var(--on-surface-variant, #464555)" }}
          >
            إلغاء
          </button>
          <button
            className="btn px-4 py-2 rounded-3 text-white fw-medium"
            style={{ background: "var(--primary)", boxShadow: "0 4px 12px rgba(86,117,104,0.2)" }}
          >
            حفظ التغييرات
          </button>
        </div>
      </div>

      {/* Health Monitors */}
      <div className="row g-3">
        {healthCards.map((h, i) => (
          <div key={i} className="col-md-4">
            <div
              className="p-4 rounded-4 d-flex align-items-center gap-3"
              style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 20px rgba(107,144,128,0.04)" }}
            >
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 48, height: 48, background: `${h.color}14`, color: h.color }}
              >
                <span className="material-symbols-outlined">{h.icon}</span>
              </div>
              <div>
                <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>{h.label}</p>
                <p className="fw-bold mb-0" style={{ fontSize: "1rem" }}>{h.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Layout: Sub-nav + Sections */}
      <div className="row g-4">
        {/* Sticky Sub-Nav */}
        <div className="col-lg-3 order-lg-2">
          <div className="sticky-top rounded-4 p-2" style={{ top: 100, background: "#fff", border: "1px solid rgba(208,208,208,0.3)" }}>
            {sections.map((s) => (
              <button
                key={s.id}
                className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 w-100 border-0 text-end mb-1"
                style={{
                  fontSize: "0.875rem",
                  background: activeSection === s.id ? "rgba(107,144,128,0.1)" : "transparent",
                  color: activeSection === s.id ? "var(--primary)" : s.danger ? "var(--error, #ba1a1a)" : "var(--on-surface-variant, #464555)",
                  fontWeight: activeSection === s.id ? 500 : 400,
                }}
                onClick={() => scrollTo(s.id)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="col-lg-9 order-lg-1 d-flex flex-column gap-4">
          {/* General Settings */}
          <section
            id="general"
            className="rounded-4 p-4"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 20px rgba(107,144,128,0.04)" }}
          >
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>settings_applications</span>
              الإعدادات العامة
            </h5>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-medium" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>اسم المنصة</label>
                <input
                  type="text"
                  className="form-control"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  style={{ borderRadius: "0.5rem" }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>لغة النظام الافتراضية</label>
                <select className="form-select" style={{ borderRadius: "0.5rem" }}>
                  <option>العربية (RTL)</option>
                  <option>English (LTR)</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label fw-medium" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>وصف المنصة (SEO)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={platformDesc}
                  onChange={(e) => setPlatformDesc(e.target.value)}
                  style={{ borderRadius: "0.5rem" }}
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-medium" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>شعار المنصة</label>
                <div
                  className="d-flex align-items-center gap-3 p-3 rounded-3 cursor-pointer"
                  style={{ border: "2px dashed var(--outline-variant, #D0D0D0)" }}
                >
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: 64, height: 64, background: "rgba(86,117,104,0.08)", color: "var(--primary)" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>upload_file</span>
                  </div>
                  <div>
                    <p className="fw-bold mb-0" style={{ fontSize: "0.875rem" }}>انقر لرفع الشعار الجديد</p>
                    <small style={{ fontSize: "0.7rem", color: "var(--on-surface-variant, #464555)" }}>يدعم صيغ PNG, SVG بحد أقصى 2MB</small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Privacy */}
          <section
            id="security"
            className="rounded-4 p-4"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 20px rgba(107,144,128,0.04)" }}
          >
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>shield</span>
              الأمان والخصوصية
            </h5>
            <div className="d-flex flex-column gap-3">
              {[
                { label: "المصادقة الثنائية (2FA)", desc: "تطلب رمزاً إضافياً عند تسجيل دخول المسؤولين.", checked: twoFA, onChange: () => setTwoFA(!twoFA) },
                { label: "سياسة كلمات المرور القوية", desc: "إلزام جميع المستخدمين بكلمات مرور معقدة.", checked: strongPassword, onChange: () => setStrongPassword(!strongPassword) },
                { label: "تقييد بروتوكول IP", desc: "السماح بالوصول للوحة الإدارة من عناوين IP محددة فقط.", checked: ipRestrict, onChange: () => setIpRestrict(!ipRestrict) },
              ].map((item, i) => (
                <div
                  key={i}
                  className="d-flex justify-content-between align-items-center p-3 rounded-3"
                  style={{ background: "var(--surface-container-low, #eff4ff)" }}
                >
                  <div>
                    <p className="fw-bold mb-0" style={{ fontSize: "0.875rem" }}>{item.label}</p>
                    <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>{item.desc}</p>
                  </div>
                  <div
                    className="form-check form-switch mb-0"
                    style={{ cursor: "pointer" }}
                    onClick={item.onChange}
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={item.checked}
                      readOnly
                      style={{ cursor: "pointer", width: 44, height: 24 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* API Integration */}
          <section
            id="api"
            className="rounded-4 p-4"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 20px rgba(107,144,128,0.04)" }}
          >
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>api</span>
              الربط البرمجي (API)
            </h5>
            <div className="d-flex flex-column gap-3">
              {apiKeys.map((api, i) => (
                <div key={i} className="p-3 rounded-3" style={{ border: "1px solid var(--outline-variant, #D0D0D0)" }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div
                      className="rounded-2 d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32, background: `${api.color}14`, color: api.color }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>key</span>
                    </div>
                    <span className="fw-bold" style={{ fontSize: "0.875rem" }}>{api.name}</span>
                  </div>
                  <div className="position-relative">
                    <input
                      type={visibleKeys[i] ? "text" : "password"}
                      className="form-control"
                      value={api.key}
                      readOnly
                      style={{
                        borderRadius: "0.5rem",
                        background: "var(--surface, #f8f9ff)",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        paddingLeft: 44,
                      }}
                    />
                    <span
                      className="material-symbols-outlined position-absolute"
                      style={{ left: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: 20, color: "var(--on-surface-variant, #464555)" }}
                      onClick={() => toggleKey(i)}
                    >
                      {visibleKeys[i] ? "visibility_off" : "visibility"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* System Logs */}
          <section
            id="logs"
            className="rounded-4 p-4"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 4px 20px rgba(107,144,128,0.04)" }}
          >
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>terminal</span>
              سجلات النظام الحية
            </h5>
            <div
              className="rounded-3 p-4"
              style={{
                background: "var(--on-surface, #0b1c30)",
                color: "#4ae183",
                fontFamily: "monospace",
                fontSize: "0.8rem",
                lineHeight: 2,
                maxHeight: 260,
                overflowY: "auto",
                border: "4px solid var(--on-surface, #0b1c30)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {logEntries.map((log, i) => (
                <p key={i} className="mb-1" style={{ opacity: 0.8 }}>
                  <span style={{ color: log.type === "ERROR" ? "#ef4444" : log.type === "WARNING" ? "#eab308" : undefined, fontWeight: log.type === "ERROR" ? 700 : 400 }}>
                    [{log.time}] {log.type}:
                  </span>{" "}
                  {log.type === "ERROR" || log.type === "INFO" ? (
                    <span style={{ color: log.type === "INFO" ? "#fff" : undefined }}>{log.msg}</span>
                  ) : (
                    log.msg
                  )}
                </p>
              ))}
              <span
                className="d-inline-block rounded-1"
                style={{ width: 8, height: 16, background: "#4ae183", animation: "pulse 1.5s infinite" }}
              />
            </div>
          </section>

          {/* Danger Zone */}
          <section
            id="danger"
            className="rounded-4 p-4"
            style={{ background: "rgba(186,26,26,0.05)", border: "2px solid rgba(186,26,26,0.2)" }}
          >
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: "var(--error, #ba1a1a)" }}>
              <span className="material-symbols-outlined">report_problem</span>
              منطقة الخطر
            </h5>
            <div className="d-flex flex-column gap-3">
              {[
                { title: "إعادة ضبط المصنع", desc: "سيتم حذف كافة الإعدادات المخصصة والعودة للحالة الافتراضية.", btn: "بدء إعادة الضبط", outline: false },
                { title: "مسح سجلات البيانات", desc: "حذف كافة البيانات المؤرشفة وسجلات المستخدمين القديمة.", btn: "حذف السجلات", outline: true },
              ].map((item, i) => (
                <div
                  key={i}
                  className="d-flex justify-content-between align-items-center p-4 rounded-3"
                  style={{ border: "1px solid rgba(186,26,26,0.2)", background: "#fff" }}
                >
                  <div>
                    <p className="fw-bold mb-0" style={{ fontSize: "0.875rem" }}>{item.title}</p>
                    <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>{item.desc}</p>
                  </div>
                  <button
                    className="btn px-4 py-2 rounded-3 fw-bold"
                    style={{
                      background: item.outline ? "transparent" : "var(--error, #ba1a1a)",
                      color: item.outline ? "var(--error, #ba1a1a)" : "#fff",
                      border: item.outline ? "2px solid var(--error, #ba1a1a)" : "none",
                    }}
                  >
                    {item.btn}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div
        className="d-flex justify-content-between align-items-center pt-4 mt-3"
        style={{ borderTop: "1px solid var(--outline-variant, #D0D0D0)" }}
      >
        <div className="d-flex align-items-center gap-3">
          <span className="fw-bold" style={{ color: "var(--primary)", fontSize: "1.1rem" }}>سكني</span>
          <span style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>© 2024 منصة سكني للإسكان الطلابي. جميع الحقوق محفوظة</span>
        </div>
        <div className="d-flex gap-4">
          <a href="#" className="text-decoration-none" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>سياسة الخصوصية</a>
          <a href="#" className="text-decoration-none" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>اتصل بنا</a>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
