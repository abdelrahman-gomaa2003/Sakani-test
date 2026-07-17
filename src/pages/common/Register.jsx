import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

const roleOptions = [
  { value: "student", label: "طالب جامعي", icon: "school", desc: "ابحث عن سكن مناسب بالقرب من جامعتك" },
  { value: "owner", label: "مالك شقة", icon: "apartment", desc: "أضف شققك على المنصة واستقبل طلبات الطلاب" },
  { value: "broker", label: "وسيط عقاري", icon: "handshake", desc: "ساعد المالكين والطلاب في إيجاد السكن المناسب" },
];

const universities = [
  { value: "Fayoum University", label: "جامعة الفيوم" },
  { value: "Egypt University of Technology", label: "جامعة مصر الدولية التكنولوجية" },
  { value: "Al-Ahliyya University", label: "الجامعة الأهلية" },
  { value: "Nile University", label: "جامعة النيل" },
];

const INITIAL_FORM = {
  fullName: "", email: "", phone: "", role: "",
  password: "", confirmPassword: "", university: "", college: "", nationalId: "",
};

function PremiumUpload({ label, fileKey, previews, files, onFileChange, onRemove, hint, accept = "image/jpeg,image/png,image/webp" }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const hasFile = !!previews[fileKey];

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الملف يجب أن يكون أقل من 5 ميجابايت"); return; }
    onFileChange(fileKey, file);
  }, [fileKey, onFileChange]);

  return (
    <div className="col-md-6">
      <label className="reg-label">{label}</label>
      <div
        className={`reg-upload ${dragActive ? "drag-active" : ""} ${hasFile ? "has-file" : ""}`}
        onClick={() => !hasFile && inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
      >
        {hasFile ? (
          <div className="position-relative">
            <img src={previews[fileKey]} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 14 }} />
            <p className="mt-2 mb-2 text-truncate fw-semibold" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)" }}>{files[fileKey]?.name}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button type="button" className="btn btn-sm rounded-3 px-3" style={{ background: "var(--primary-container, rgba(107,144,128,0.12))", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem" }} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>edit</span>تغيير
              </button>
              <button type="button" className="btn btn-sm rounded-3 px-3" style={{ background: "rgba(186,26,26,0.08)", color: "var(--error, #ba1a1a)", fontWeight: 700, fontSize: "0.9rem" }} onClick={(e) => { e.stopPropagation(); onRemove(fileKey); }}>
                <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>delete</span>إزالة
              </button>
            </div>
          </div>
        ) : (
          <div className="py-3">
            <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 72, height: 72, background: "var(--primary-container, rgba(107,144,128,0.12))" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 38 }}>cloud_upload</span>
            </div>
            <p className="fw-bold mb-1" style={{ fontSize: "var(--fs-base)", color: "var(--on-surface)" }}>اسحب وأفلت الصورة هنا</p>
            <p className="mb-2" style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface-variant)" }}>أو اضغط لاختيار ملف</p>
            <p className="mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--outline)" }}>JPG, PNG, WEBP — حد أقصى 5 ميجابايت</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" className="d-none" accept={accept} onChange={(e) => handleFile(e.target.files[0])} />
      {hint && (
        <div className="mt-2 d-flex align-items-start gap-2 rounded-3 p-3" style={{ background: "rgba(107,144,128,0.06)" }}>
          <span className="material-symbols-outlined mt-1 flex-shrink-0" style={{ fontSize: 20, color: "var(--primary)" }}>info</span>
          <span style={{ fontSize: "0.95rem", color: "var(--on-surface-variant)", lineHeight: 1.8 }}>{hint}</span>
        </div>
      )}
    </div>
  );
}

function Register() {
  const { signUp, signOut } = useAuth();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [cardFile, setCardFile] = useState(null);
  const [cardPreview, setCardPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "nationalId") {
      const digits = value.replace(/\D/g, "").slice(0, 14);
      setForm((p) => ({ ...p, [name]: digits }));
    } else if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setForm((p) => ({ ...p, [name]: digits }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleRoleSelect = (role) => {
    setForm({ ...INITIAL_FORM, role });
    setStep(2);
  };

  const handleCardFile = useCallback((file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الملف يجب أن يكون أقل من 5 ميجابايت"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("الصيغة غير مدعومة"); return; }
    setCardFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCardPreview(reader.result);
    reader.readAsDataURL(file);
    if (errors.studentCard) setErrors((p) => ({ ...p, studentCard: "" }));
  }, [errors]);

  const uploadFile = async (file, path) => {
    const { error: uploadError } = await supabase.storage.from("apartment-images").upload(path, file, { upsert: true });
    if (uploadError) {
      try { await supabase.storage.createBucket("apartment-images", { public: true }); await supabase.storage.from("apartment-images").upload(path, file, { upsert: true }); } catch { return null; }
    }
    const { data } = supabase.storage.from("apartment-images").getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const validateStudent = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "الاسم الكامل مطلوب";
    if (!form.email.trim()) errs.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "البريد الإلكتروني غير صحيح";
    if (!form.phone.trim()) errs.phone = "رقم الهاتف مطلوب";
    else if (!/^01[0-2,5]{1}[0-9]{8}$/.test(form.phone)) errs.phone = "رقم الهاتف غير صحيح";
    if (!form.university) errs.university = "الجامعة مطلوبة";
    if (!form.nationalId.trim()) errs.nationalId = "الرقم القومي مطلوب";
    else if (!/^\d{14}$/.test(form.nationalId)) errs.nationalId = "الرقم القومي يجب أن يكون 14 رقمًا";
    if (!form.password) errs.password = "كلمة المرور مطلوبة";
    else if (form.password.length < 6) errs.password = "6 أحرف على الأقل";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "كلمتا المرور غير متطابقتين";
    if (!cardFile) errs.studentCard = "صورة الكارنيه مطلوبة";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.role !== "student") return;
    const errs = validateStudent();
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error("يرجى تصحيح الأخطاء أدناه"); return; }

    setLoading(true);
    const { data, error: authError } = await signUp({
      email: form.email, password: form.password, fullName: form.fullName,
      role: "student", verificationStatus: "pending",
    });

    if (authError) {
      const msg = authError.message || "";
      setErrors({ submit: msg.includes("already") ? "هذا البريد الإلكتروني مسجل بالفعل" : "حدث خطأ أثناء إنشاء الحساب" });
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    if (!userId) { setSuccess(true); setLoading(false); return; }

    // Step 1: CRITICAL — always set verification_status to 'pending'
    await supabase.from("profiles").update({ verification_status: "pending" }).eq("id", userId);

    // Step 2: Update other profile fields (non-critical, can fail)
    await supabase.from("profiles").update({
      university: form.university, college: form.college || null,
      national_id: form.nationalId, phone: form.phone,
    }).eq("id", userId);

    // Step 3: Create verification request
    let cardUrl = null;
    if (cardFile) {
      toast.loading("جاري رفع الكارنيه...", { id: "upload" });
      cardUrl = await uploadFile(cardFile, `verifications/${userId}_student_card.${cardFile.name.split(".").pop()}`);
      toast.dismiss("upload");
    }

    const { error: vrError } = await supabase.from("verification_requests").insert({
      user_id: userId,
      role: "student",
      national_id: form.nationalId,
      university: form.university,
      college: form.college || null,
      student_card_image: cardUrl || "",
      status: "pending",
    });
    if (vrError) console.warn("verification_requests insert failed:", vrError.message);

    await signOut();
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, var(--primary) 0%, #4a7c65 100%)" }}>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", padding: "2rem" }}>
          <div className="text-center" style={{ animation: "fadeInUp 0.6s ease", maxWidth: 550 }}>
            <div className="mx-auto mb-5 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 120, height: 120, background: "rgba(255,255,255,0.2)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 68, color: "white" }}>check_circle</span>
            </div>
            <h1 className="fw-bold text-white mb-4" style={{ fontSize: "var(--fs-3xl)", lineHeight: 1.4 }}>تم إنشاء حسابك بنجاح</h1>
            <p className="text-white mx-auto mb-5" style={{ maxWidth: 480, fontSize: "var(--fs-lg)", lineHeight: 2, opacity: 0.9 }}>
              تم استلام طلب التسجيل وسيتم مراجعة بياناتك والكارنيه الجامعي.<br />
              سيصلك إشعار عبر البريد الإلكتروني بعد اعتماد الحساب.
            </p>
            <Link
              to="/login"
              className="btn px-5 py-3 rounded-4 fw-bold text-decoration-none"
              style={{ background: "white", color: "var(--primary)", fontSize: "var(--fs-lg)", height: 58 }}
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface-dim, #F4F1EC)", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .reg-card { animation: fadeInUp 0.6s ease; }
        .reg-left { animation: fadeInRight 0.6s ease; }
        .float-shape { position: absolute; border-radius: 50%; animation: float 6s ease-in-out infinite; }
        .reg-label { display: block; font-size: var(--fs-base); font-weight: 700; color: var(--on-surface, #1A1D23); margin-bottom: 8px; }
        .reg-input-wrap { position: relative; margin-bottom: 0; }
        .reg-input-wrap .input-icon { position: absolute; top: 50%; transform: translateY(-50%); right: 16px; color: var(--on-surface-variant, #767586); font-size: 22px; z-index: 2; transition: color 0.3s; pointer-events: none; }
        .reg-input-wrap input, .reg-input-wrap select { padding-right: 48px; border: 2px solid var(--outline-variant, #D0D0D0); border-radius: 14px; height: 56px; font-size: 1rem; transition: all 0.3s; background: var(--surface, #fff); }
        .reg-input-wrap input::placeholder { color: var(--outline, #9E9E9E); font-size: var(--fs-sm); }
        .reg-input-wrap input:focus, .reg-input-wrap select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(107,144,128,0.1); outline: none; }
        .reg-input-wrap input:focus ~ .input-icon, .reg-input-wrap select:focus ~ .input-icon { color: var(--primary); }
        .reg-input-wrap input.error { border-color: var(--error, #ba1a1a); }
        .reg-input-wrap input.error:focus { box-shadow: 0 0 0 4px rgba(186,26,26,0.08); }
        .field-error { font-size: var(--fs-xs); color: var(--error, #ba1a1a); margin-top: 6px; display: flex; align-items: center; gap: 5px; }
        .reg-upload { border: 2.5px dashed var(--outline-variant, #D0D0D0); border-radius: 18px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s; background: var(--surface, #fff); min-height: 170px; display: flex; align-items: center; justify-content: center; }
        .reg-upload:hover, .reg-upload.drag-active { border-color: var(--primary); background: rgba(107,144,128,0.04); transform: translateY(-1px); }
        .reg-upload.has-file { border-style: solid; border-color: var(--primary); padding: 1.25rem; cursor: default; }
        .role-card { cursor: pointer; transition: all 0.3s; border: 2px solid var(--outline-variant, #D0D0D0); border-radius: 18px; padding: 1.5rem; background: var(--surface, #fff); }
        .role-card:hover { border-color: var(--primary); transform: translateY(-3px); box-shadow: 0 10px 30px rgba(107,144,128,0.15); }
        .reg-btn { height: 58px; border-radius: 14px; font-size: var(--fs-lg); font-weight: 700; transition: all 0.3s; letter-spacing: 0.02em; }
        .reg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(107,144,128,0.3); }
        .reg-info-card { border-radius: 16px; padding: 1.25rem 1.5rem; border-right: 4px solid var(--primary); background: rgba(107,144,128,0.06); }
        .reg-section-title { font-size: var(--fs-lg); font-weight: 700; color: var(--on-surface); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 10px; }
        .reg-error-alert { border-radius: 14px; padding: 1rem 1.25rem; font-size: 1rem; text-align: center; }
        .reg-back-btn { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--surface, #fff); border: 2px solid var(--outline-variant, #D0D0D0); transition: all 0.3s; }
        .reg-back-btn:hover { border-color: var(--primary); background: rgba(107,144,128,0.06); }
      `}</style>

      <div className="container-fluid" style={{ minHeight: "100vh" }}>
        <div className="row" style={{ minHeight: "100vh" }}>

          {/* Left Side — Illustration */}
          <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center position-relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--primary) 0%, #4a7c65 100%)", minHeight: "100vh" }}>
            <div className="float-shape" style={{ width: 180, height: 180, background: "rgba(255,255,255,0.08)", top: "10%", left: "10%", animationDelay: "0s" }} />
            <div className="float-shape" style={{ width: 120, height: 120, background: "rgba(255,255,255,0.06)", bottom: "15%", right: "15%", animationDelay: "2s" }} />
            <div className="float-shape" style={{ width: 80, height: 80, background: "rgba(255,255,255,0.1)", top: "55%", left: "5%", animationDelay: "4s" }} />
            <div className="float-shape" style={{ width: 60, height: 60, background: "rgba(255,255,255,0.07)", top: "25%", right: "10%", animationDelay: "1s" }} />
            <div className="reg-left text-center px-5 position-relative" style={{ zIndex: 2 }}>
              <div className="mx-auto mb-5 rounded-4 overflow-hidden shadow-lg" style={{ maxWidth: 420, height: 300, background: "rgba(255,255,255,0.1)" }}>
                <img src="https://images.unsplash.com/photo-1523050854058-8df90110c476?auto=format&fit=crop&w=600&q=80" alt="طلاب جامعيون" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
              </div>
              <h2 className="fw-bold text-white mb-3" style={{ fontSize: "2rem", lineHeight: 1.5 }}>ابدأ رحلتك مع سكني</h2>
              <p className="text-white mx-auto" style={{ maxWidth: 420, fontSize: "1.15rem", lineHeight: 2, opacity: 0.9 }}>أنشئ حسابك الآن واستكشف أفضل الوحدات السكنية القريبة من جامعتك بكل سهولة وأمان.</p>
            </div>
          </div>

          {/* Right Side — Form */}
          <div className="col-lg-6 d-flex align-items-center justify-content-center px-4 py-5" style={{ minHeight: "100vh" }}>
            <div className="reg-card w-100" style={{ maxWidth: 580 }}>

              {/* Mobile Header */}
              <div className="d-lg-none text-center mb-4">
                <h1 className="fw-bold" style={{ fontSize: "var(--fs-2xl)", color: "var(--on-surface)" }}>إنشاء حساب جديد</h1>
                <p style={{ color: "var(--on-surface-variant)", fontSize: "var(--fs-base)" }}>ابدأ رحلتك مع سكني</p>
              </div>

              {step === 1 ? (
                <div className="reg-card">
                  <div className="d-none d-lg-block text-center mb-5">
                    <h1 className="fw-bold" style={{ fontSize: "var(--fs-2xl)", color: "var(--on-surface)" }}>إنشاء حساب جديد</h1>
                    <p style={{ color: "var(--on-surface-variant)", fontSize: "var(--fs-base)" }}>اختر نوع الحساب للبدء</p>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {roleOptions.map((r) => (
                      <button key={r.value} type="button" className="role-card d-flex align-items-center gap-4 text-end w-100" onClick={() => handleRoleSelect(r.value)}>
                        <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: 60, height: 60, background: "var(--primary)" }}>
                          <span className="material-symbols-outlined" style={{ color: "white", fontSize: 30 }}>{r.icon}</span>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1" style={{ color: "var(--on-surface)", fontSize: "var(--fs-lg)" }}>{r.label}</h6>
                          <p className="mb-0" style={{ color: "var(--on-surface-variant)", fontSize: "var(--fs-base)", lineHeight: 1.6 }}>{r.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : form.role === "student" ? (
                <StudentForm form={form} setStep={setStep} handleChange={handleChange} errors={errors} loading={loading} cardFile={cardFile} setCardFile={setCardFile} cardPreview={cardPreview} setCardPreview={setCardPreview} fileInputRef={fileInputRef} handleCardFile={handleCardFile} handleSubmit={handleSubmit} />
              ) : (
                <OwnerBrokerForm form={form} setForm={setForm} setStep={setStep} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentForm({ form, setStep, handleChange, errors, loading, cardFile, setCardFile, cardPreview, setCardPreview, fileInputRef, handleCardFile, handleSubmit }) {

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-5">
        <button type="button" className="reg-back-btn" onClick={() => setStep(1)}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--on-surface-variant)" }}>arrow_forward</span>
        </button>
        <div>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--on-surface)", marginBottom: 4 }}>بيانات الطالب</h1>
          <p style={{ color: "var(--on-surface-variant)", fontSize: "1.05rem" }}>أكمل بياناتك للبحث عن سكن مناسب</p>
        </div>
      </div>

      {errors.submit && (
        <div className="reg-error-alert mb-4" style={{ background: "rgba(186,26,26,0.08)", border: "1px solid rgba(186,26,26,0.2)", color: "var(--error, #ba1a1a)" }}>{errors.submit}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="mb-4">
          <label className="reg-label">الاسم الكامل</label>
          <div className="reg-input-wrap">
            <span className="material-symbols-outlined input-icon">person</span>
            <input name="fullName" className={`form-control ${errors.fullName ? "error" : ""}`} placeholder="أدخل اسمك الكامل كما هو في الهوية" value={form.fullName} onChange={handleChange} />
          </div>
          {errors.fullName && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.fullName}</div>}
        </div>

        {/* Email + Phone */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <label className="reg-label">البريد الإلكتروني</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">email</span>
              <input name="email" type="email" className={`form-control ${errors.email ? "error" : ""}`} placeholder="name@example.com" value={form.email} onChange={handleChange} />
            </div>
            {errors.email && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.email}</div>}
          </div>
          <div className="col-md-6">
            <label className="reg-label">رقم الهاتف</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">phone</span>
              <input name="phone" type="tel" className={`form-control ${errors.phone ? "error" : ""}`} placeholder="01xxxxxxxxx" value={form.phone} onChange={handleChange} />
            </div>
            {errors.phone && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.phone}</div>}
          </div>
        </div>

        {/* University + College */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <label className="reg-label">الجامعة</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">school</span>
              <select name="university" className={`form-select ${errors.university ? "error" : ""}`} value={form.university} onChange={handleChange}>
                <option value="">اختر الجامعة</option>
                {universities.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            {errors.university && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.university}</div>}
          </div>
          <div className="col-md-6">
            <label className="reg-label">الكلية</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">account_balance</span>
              <input name="college" className="form-control" placeholder="مثال: كلية الهندسة" value={form.college} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* National ID */}
        <div className="mb-4">
          <label className="reg-label">الرقم القومي</label>
          <div className="reg-input-wrap">
            <span className="material-symbols-outlined input-icon">badge</span>
            <input name="nationalId" className={`form-control ${errors.nationalId ? "error" : ""}`} placeholder="أدخل الرقم القومي المكون من 14 رقمًا" value={form.nationalId} onChange={handleChange} maxLength={14} />
          </div>
          {errors.nationalId && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.nationalId}</div>}
        </div>

        {/* Password */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <label className="reg-label">كلمة المرور</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input name="password" type="password" className={`form-control ${errors.password ? "error" : ""}`} placeholder="6 أحرف على الأقل" value={form.password} onChange={handleChange} />
            </div>
            {errors.password && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.password}</div>}
          </div>
          <div className="col-md-6">
            <label className="reg-label">تأكيد كلمة المرور</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input name="confirmPassword" type="password" className={`form-control ${errors.confirmPassword ? "error" : ""}`} placeholder="أعد إدخال كلمة المرور" value={form.confirmPassword} onChange={handleChange} />
            </div>
            {errors.confirmPassword && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.confirmPassword}</div>}
          </div>
        </div>

        {/* Student Card Upload */}
        <div className="mb-4">
          <label className="reg-label">صورة الكارنيه الجامعي</label>
          <div
            className={`reg-upload ${cardPreview ? "has-file" : ""}`}
            onClick={() => !cardFile && fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleCardFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
          >
            {cardPreview ? (
              <div className="w-100 position-relative">
                <img src={cardPreview} alt="الكارنيه" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 14 }} />
                {cardFile && <p className="mt-2 mb-2 text-truncate fw-semibold" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)" }}>{cardFile.name}</p>}
                <div className="d-flex gap-2 justify-content-center">
                  <button type="button" className="btn btn-sm rounded-3 px-3" style={{ background: "var(--primary-container, rgba(107,144,128,0.12))", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem" }} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>edit</span>تغيير
                  </button>
                  <button type="button" className="btn btn-sm rounded-3 px-3" style={{ background: "rgba(186,26,26,0.08)", color: "var(--error, #ba1a1a)", fontWeight: 700, fontSize: "0.9rem" }} onClick={(e) => { e.stopPropagation(); setCardFile(null); setCardPreview(null); }}>
                    <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>delete</span>إزالة
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-3">
                <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 72, height: 72, background: "var(--primary-container, rgba(107,144,128,0.12))" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 38 }}>cloud_upload</span>
                </div>
                <p className="fw-bold mb-1" style={{ fontSize: "var(--fs-base)", color: "var(--on-surface)" }}>اسحب وأفلت الصورة هنا</p>
                <p className="mb-2" style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface-variant)" }}>أو اضغط لاختيار ملف</p>
                <p className="mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--outline)" }}>JPG, PNG, WEBP — حد أقصى 5 ميجابايت</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" className="d-none" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleCardFile(e.target.files[0])} />
          {errors.studentCard && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.studentCard}</div>}
        </div>

        {/* Info Card */}
        <div className="reg-info-card mb-5">
          <div className="d-flex align-items-start gap-3">
            <span className="material-symbols-outlined mt-1 flex-shrink-0" style={{ fontSize: 26, color: "var(--primary)" }}>info</span>
            <div>
              <p className="fw-bold mb-2" style={{ fontSize: "var(--fs-base)", color: "var(--on-surface)" }}>ملاحظة هامة</p>
              <p className="mb-0" style={{ fontSize: "1rem", color: "var(--on-surface-variant)", lineHeight: 2 }}>
                سيتم مراجعة بياناتك وصورة الكارنيه الجامعي من قبل إدارة منصة سكني، وبعد اعتماد الحساب سيتم تفعيل جميع الخدمات الخاصة بالطلاب.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary w-100 reg-btn mb-4" disabled={loading}>
          {loading ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              جاري إنشاء الحساب...
            </span>
          ) : (
            <span className="d-flex align-items-center justify-content-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person_add</span>
              إنشاء الحساب
            </span>
          )}
        </button>

        <p className="text-center mb-0" style={{ color: "var(--on-surface-variant, #767586)", fontSize: "1.05rem" }}>
          لديك حساب بالفعل؟ <Link className="fw-bold text-decoration-none" style={{ color: "var(--primary)" }} to="/login">تسجيل الدخول</Link>
        </p>
      </form>
    </div>
  );
}

function OwnerBrokerForm({ form, setForm, setStep }) {
  const { signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "nationalId") {
      const digits = value.replace(/\D/g, "").slice(0, 14);
      setForm((p) => ({ ...p, [name]: digits }));
    } else if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setForm((p) => ({ ...p, [name]: digits }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleFileChange = (key, file) => {
    setFiles((p) => ({ ...p, [key]: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreviews((p) => ({ ...p, [key]: reader.result }));
    reader.readAsDataURL(file);
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
  };

  const handleRemoveFile = (key) => {
    setFiles((p) => { const n = { ...p }; delete n[key]; return n; });
    setPreviews((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const uploadFile = async (file, path) => {
    const { error: uploadError } = await supabase.storage.from("apartment-images").upload(path, file, { upsert: true });
    if (uploadError) {
      try { await supabase.storage.createBucket("apartment-images", { public: true }); await supabase.storage.from("apartment-images").upload(path, file, { upsert: true }); } catch { return null; }
    }
    const { data } = supabase.storage.from("apartment-images").getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "الاسم الكامل مطلوب";
    if (!form.email.trim()) errs.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "البريد الإلكتروني غير صحيح";
    if (!form.phone.trim()) errs.phone = "رقم الهاتف مطلوب";
    else if (!/^01[0-2,5]{1}[0-9]{8}$/.test(form.phone)) errs.phone = "رقم الهاتف غير صحيح";
    if (!form.nationalId.trim()) errs.nationalId = "الرقم القومي مطلوب";
    else if (!/^\d{14}$/.test(form.nationalId)) errs.nationalId = "الرقم القومي يجب أن يكون 14 رقمًا";
    if (!form.password) errs.password = "كلمة المرور مطلوبة";
    else if (form.password.length < 6) errs.password = "6 أحرف على الأقل";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "كلمتا المرور غير متطابقتين";
    if (!files.idCardFront) errs.idCardFront = "صورة البطاقة الأمامية مطلوبة";
    if (form.role === "owner") {
      if (!files.idCardBack) errs.idCardBack = "صورة البطاقة الخلفية مطلوبة";
      if (!files.proofDocument) errs.proofDocument = "إثبات الملكية مطلوب";
    }
    if (form.role === "broker") {
      if (!files.idCardBack) errs.idCardBack = "صورة البطاقة الخلفية مطلوبة";
      if (!files.personalPhoto) errs.personalPhoto = "الصورة الشخصية مطلوبة";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error("يرجى تصحيح الأخطاء أدناه"); return; }

    setLoading(true);
    const { data, error: authError } = await signUp({
      email: form.email, password: form.password, fullName: form.fullName,
      role: form.role, verificationStatus: "pending",
    });
    if (authError) {
      setErrors({ submit: authError.message?.includes("already") ? "هذا البريد الإلكتروني مسجل بالفعل" : "حدث خطأ أثناء إنشاء الحساب" });
      setLoading(false);
      return;
    }
    const userId = data?.user?.id;
    if (!userId) { toast.success("تم إنشاء الحساب، يرجى تسجيل الدخول"); setLoading(false); navigate("/login"); return; }

    // Step 1: CRITICAL — always set verification_status to 'pending'
    await supabase.from("profiles").update({ verification_status: "pending" }).eq("id", userId);

    // Step 2: Update other profile fields (non-critical)
    await supabase.from("profiles").update({
      phone: form.phone, national_id: form.nationalId,
    }).eq("id", userId);

    toast.loading("جاري رفع المستندات...", { id: "upload" });
    const docs = {};
    if (files.idCardFront) docs.national_id_front = await uploadFile(files.idCardFront, `verifications/${userId}_id_front.${files.idCardFront.name.split(".").pop()}`);
    if (files.idCardBack) docs.national_id_back = await uploadFile(files.idCardBack, `verifications/${userId}_id_back.${files.idCardBack.name.split(".").pop()}`);
    if (files.proofDocument) docs.ownership_document = await uploadFile(files.proofDocument, `verifications/${userId}_proof.${files.proofDocument.name.split(".").pop()}`);
    if (files.personalPhoto) docs.personal_photo = await uploadFile(files.personalPhoto, `verifications/${userId}_photo.${files.personalPhoto.name.split(".").pop()}`);

    // Step 3: Create verification request
    const { error: vrError } = await supabase.from("verification_requests").insert({
      user_id: userId, role: form.role, national_id_front: docs.national_id_front || "",
      national_id_back: docs.national_id_back || null, ownership_document: docs.ownership_document || null,
      personal_photo: docs.personal_photo || null, status: "pending",
    });
    if (vrError) console.warn("verification_requests insert failed:", vrError.message);

    toast.dismiss("upload");
    await signOut();
    toast.success("تم إنشاء الحساب بنجاح، يرجى تسجيل الدخول");
    setLoading(false);
    navigate("/login");
  };

  const isOwner = form.role === "owner";
  const title = isOwner ? "بيانات مالك الشقة" : "بيانات الوسيط العقاري";
  const desc = "أكمل بياناتك وارفع المستندات المطلوبة للمراجعة";
  const infoText = isOwner
    ? "لن يتمكن مالك العقار من نشر أي وحدة سكنية قبل مراجعة المستندات واعتماد الحساب من قبل إدارة منصة سكني."
    : "سيتم مراجعة بياناتك ومستنداتك من قبل إدارة منصة سكني، وبعد اعتماد الحساب يمكنك إضافة الوحدات السكنية والتواصل مع الطلاب.";

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-5">
        <button type="button" className="reg-back-btn" onClick={() => setStep(1)}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--on-surface-variant)" }}>arrow_forward</span>
        </button>
        <div>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, color: "var(--on-surface)", marginBottom: 4 }}>{title}</h1>
          <p style={{ color: "var(--on-surface-variant)", fontSize: "1.05rem" }}>{desc}</p>
        </div>
      </div>

      {errors.submit && (
        <div className="reg-error-alert mb-4" style={{ background: "rgba(186,26,26,0.08)", border: "1px solid rgba(186,26,26,0.2)", color: "var(--error, #ba1a1a)" }}>{errors.submit}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="mb-4">
          <label className="reg-label">الاسم الكامل</label>
          <div className="reg-input-wrap">
            <span className="material-symbols-outlined input-icon">person</span>
            <input name="fullName" className={`form-control ${errors.fullName ? "error" : ""}`} placeholder="أدخل الاسم كما هو في الهوية" value={form.fullName} onChange={handleChange} />
          </div>
          {errors.fullName && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.fullName}</div>}
        </div>

        {/* Email + Phone */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <label className="reg-label">البريد الإلكتروني</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">email</span>
              <input name="email" type="email" className={`form-control ${errors.email ? "error" : ""}`} placeholder="name@example.com" value={form.email} onChange={handleChange} />
            </div>
            {errors.email && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.email}</div>}
          </div>
          <div className="col-md-6">
            <label className="reg-label">رقم الهاتف</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">phone</span>
              <input name="phone" type="tel" className={`form-control ${errors.phone ? "error" : ""}`} placeholder="01xxxxxxxxx" value={form.phone || ""} onChange={handleChange} />
            </div>
            {errors.phone && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.phone}</div>}
          </div>
        </div>

        {/* National ID */}
        <div className="mb-4">
          <label className="reg-label">الرقم القومي</label>
          <div className="reg-input-wrap">
            <span className="material-symbols-outlined input-icon">badge</span>
            <input name="nationalId" className={`form-control ${errors.nationalId ? "error" : ""}`} placeholder="أدخل الرقم القومي المكون من 14 رقمًا" value={form.nationalId || ""} onChange={handleChange} maxLength={14} />
          </div>
          {errors.nationalId && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.nationalId}</div>}
        </div>

        {/* Password */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <label className="reg-label">كلمة المرور</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input name="password" type="password" className={`form-control ${errors.password ? "error" : ""}`} placeholder="6 أحرف على الأقل" value={form.password} onChange={handleChange} />
            </div>
            {errors.password && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.password}</div>}
          </div>
          <div className="col-md-6">
            <label className="reg-label">تأكيد كلمة المرور</label>
            <div className="reg-input-wrap">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input name="confirmPassword" type="password" className={`form-control ${errors.confirmPassword ? "error" : ""}`} placeholder="أعد إدخال كلمة المرور" value={form.confirmPassword} onChange={handleChange} />
            </div>
            {errors.confirmPassword && <div className="field-error"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>{errors.confirmPassword}</div>}
          </div>
        </div>

        {/* Documents Section */}
        <div className="mb-4 p-4 rounded-4" style={{ background: "var(--surface-container-low, #F8F6F3)", border: "1px solid var(--border, #E0E0E0)" }}>
          <h5 className="reg-section-title">
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 24 }}>description</span>
            المستندات المطلوبة
          </h5>
          <div className="row g-4">
            <PremiumUpload label="صورة البطاقة (الوجه الأمامي)" fileKey="idCardFront" previews={previews} files={files} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="قم برفع صورة واضحة للوجه الأمامي للبطاقة الشخصية" />
            <PremiumUpload label="صورة البطاقة (الوجه الخلفي)" fileKey="idCardBack" previews={previews} files={files} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="قم برفع صورة واضحة للوجه الخلفي للبطاقة الشخصية" />
            {isOwner && (
              <PremiumUpload label="إثبات الملكية أو عقد الإيجار" fileKey="proofDocument" previews={previews} files={files} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="أي مستند يثبت ملكية العقار أو عقد الإيجار الحالي" />
            )}
            {form.role === "broker" && (
              <>
                <PremiumUpload label="الصورة الشخصية" fileKey="personalPhoto" previews={previews} files={files} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="صورة شخصية واضحة للتعريف بك" />
                <PremiumUpload label="ما يثبت العمل كوسيط عقاري" fileKey="brokerLicense" previews={previews} files={files} onFileChange={handleFileChange} onRemove={handleRemoveFile} hint="(اختياري) رخصة أو تصريح يثبت عملك كوسيط عقاري" />
              </>
            )}
          </div>
          {Object.keys(errors).filter(k => k.startsWith("idCard") || k === "proofDocument" || k === "personalPhoto").length > 0 && (
            <div className="field-error mt-3">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              يرجى رفع جميع المستندات المطلوبة
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="reg-info-card mb-5">
          <div className="d-flex align-items-start gap-3">
            <span className="material-symbols-outlined mt-1 flex-shrink-0" style={{ fontSize: 26, color: "var(--primary)" }}>info</span>
            <div>
              <p className="fw-bold mb-2" style={{ fontSize: "var(--fs-base)", color: "var(--on-surface)" }}>ملاحظة هامة</p>
              <p className="mb-0" style={{ fontSize: "1rem", color: "var(--on-surface-variant)", lineHeight: 2 }}>{infoText}</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary w-100 reg-btn mb-4" disabled={loading}>
          {loading ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
              <span className="spinner-border spinner-border-sm" />
              جاري إنشاء الحساب...
            </span>
          ) : (
            <span className="d-flex align-items-center justify-content-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person_add</span>
              إنشاء الحساب
            </span>
          )}
        </button>

        <p className="text-center mb-0" style={{ color: "var(--on-surface-variant, #767586)", fontSize: "1.05rem" }}>
          لديك حساب بالفعل؟ <Link className="fw-bold text-decoration-none" style={{ color: "var(--primary)" }} to="/login">تسجيل الدخول</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;