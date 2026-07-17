import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/authService";
import { supabase } from "../../lib/supabase";

const universities = [
  { value: "Fayoum University", label: "جامعة الفيوم" },
  { value: "Egypt University of Technology", label: "جامعة مصر الدولية التكنولوجية" },
  { value: "Al-Ahliyya University", label: "الجامعة الأهلية" },
  { value: "Nile University", label: "جامعة النيل" },
];

function EditProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || "",
    university: profile?.university || "",
    college: profile?.college || "",
    nationalId: profile?.national_id || "",
    bio: profile?.bio || "",
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null);
  const [cardFile, setCardFile] = useState(null);
  const [cardPreview, setCardPreview] = useState(null);
  const [existingCardUrl, setExistingCardUrl] = useState(profile?.student_card_url || null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const cardInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const role = profile?.role || "student";
  const isStudent = role === "student";

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((p) => ({ ...p, [name]: value.replace(/\D/g, "").slice(0, 11) }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleAvatarChange = useCallback((file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار صورة صالحة");
      return;
    }
    setAvatar(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    toast.success("تم اختيار الصورة الشخصية");
  }, []);

  const handleCardFile = useCallback((file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("الصيغة غير مدعومة");
      return;
    }
    setCardFile(file);
    setExistingCardUrl(null);
    const reader = new FileReader();
    reader.onloadend = () => setCardPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const removeCard = useCallback(() => {
    setCardFile(null);
    setCardPreview(null);
    setExistingCardUrl(null);
  }, []);

  const uploadFile = async (file, path) => {
    const { error: uploadError } = await supabase.storage
      .from("apartment-images")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      try {
        await supabase.storage.createBucket("apartment-images", { public: true });
        await supabase.storage.from("apartment-images").upload(path, file, { upsert: true });
      } catch {
        return null;
      }
    }
    const { data } = supabase.storage.from("apartment-images").getPublicUrl(path);
    return data?.publicUrl ? `${data.publicUrl}?t=${Date.now()}` : null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("الاسم الكامل مطلوب");
      return;
    }
    if (isStudent && !formData.university) {
      toast.error("يرجى اختيار الجامعة");
      return;
    }

    setSaving(true);

    let avatarUrl = profile?.avatar_url || null;
    if (avatar) {
      toast.loading("جاري رفع الصورة...", { id: "upload" });
      const uploadedUrl = await uploadFile(avatar, `avatars/${user.id}.${avatar.name.split(".").pop()}`);
      if (uploadedUrl) {
        avatarUrl = uploadedUrl;
      } else {
        toast.error("فشل رفع الصورة، تم الحفظ بدون تغيير الصورة");
      }
      toast.dismiss("upload");
    }

    let studentCardUrl = existingCardUrl || null;
    if (isStudent && cardFile) {
      toast.loading("جاري رفع الكارنيه...", { id: "upload-card" });
      const cardUrl = await uploadFile(cardFile, `verifications/${user.id}_student_card.${cardFile.name.split(".").pop()}`);
      if (cardUrl) {
        studentCardUrl = cardUrl;
      } else {
        toast.error("فشل رفع الكارنيه");
      }
      toast.dismiss("upload-card");
    }

    const updates = {
      full_name: formData.fullName.trim(),
      phone: formData.phone.trim(),
      bio: formData.bio.trim(),
      avatar_url: avatarUrl,
    };

    if (isStudent) {
      updates.university = formData.university;
      updates.college = formData.college.trim() || null;
      updates.student_card_url = studentCardUrl;
    }

    const { error } = await authService.updateProfile(user.id, updates);

    if (error) {
      toast.error("حدث خطأ أثناء حفظ البيانات");
      setSaving(false);
      return;
    }

    await refreshProfile();
    toast.success("تم حفظ بيانات الملف الشخصي بنجاح");
    setTimeout(() => navigate("/profile"), 800);
  };

  const renderReadOnlyField = (label, value, icon) => (
    <div className="mb-4">
      <label className="reg-label">{label}</label>
      <div className="reg-input-wrap">
        <span className="material-symbols-outlined input-icon">{icon}</span>
        <input
          type="text"
          className="form-control"
          value={value || ""}
          readOnly
          style={{ background: "var(--surface-dim, #F4F1EC)", color: "var(--on-surface-variant, #767586)", cursor: "not-allowed" }}
        />
        <span className="material-symbols-outlined" style={{ position: "absolute", top: "50%", left: "16px", transform: "translateY(-50%)", color: "var(--on-surface-variant, #767586)", fontSize: 20, zIndex: 2 }}>lock</span>
      </div>
      <p className="mt-1 mb-0" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #767586)", display: "flex", alignItems: "center", gap: 4 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
        لا يمكن تعديل هذا الحقل
      </p>
    </div>
  );

  return (
    <div style={{ background: "var(--surface-dim, #F4F1EC)", minHeight: "100vh" }}>
      <style>{`
        .reg-label { display: block; font-size: 1.05rem; font-weight: 700; color: var(--on-surface, #1A1D23); margin-bottom: 8px; }
        .reg-input-wrap { position: relative; }
        .reg-input-wrap .input-icon { position: absolute; top: 50%; transform: translateY(-50%); right: 16px; color: var(--on-surface-variant, #767586); font-size: 22px; z-index: 2; pointer-events: none; }
        .reg-input-wrap input, .reg-input-wrap select { padding-right: 48px; border: 2px solid var(--outline-variant, #D0D0D0); border-radius: 14px; height: 52px; font-size: 1rem; transition: all 0.3s; background: var(--surface, #fff); width: 100%; }
        .reg-input-wrap input:focus, .reg-input-wrap select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(107,144,128,0.1); outline: none; }
        .reg-input-wrap input::placeholder { color: var(--outline, #9E9E9E); font-size: 0.95rem; }
        .reg-upload { border: 2.5px dashed var(--outline-variant, #D0D0D0); border-radius: 18px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s; background: var(--surface, #fff); min-height: 170px; display: flex; align-items: center; justify-content: center; }
        .reg-upload:hover, .reg-upload.drag-active { border-color: var(--primary); background: rgba(107,144,128,0.04); transform: translateY(-1px); }
        .reg-upload.has-file { border-style: solid; border-color: var(--primary); padding: 1.25rem; cursor: default; }
        .reg-btn { height: 58px; border-radius: 14px; font-size: 1.1rem; font-weight: 700; transition: all 0.3s; letter-spacing: 0.02em; }
        .reg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(107,144,128,0.3); }
        .field-error { font-size: 0.9rem; color: var(--error, #ba1a1a); margin-top: 6px; display: flex; align-items: center; gap: 5px; }
        .edit-avatar-wrap { position: relative; cursor: pointer; }
        .edit-avatar-wrap:hover .avatar-overlay { opacity: 1; }
        .avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
      `}</style>

      <div className="container py-5" style={{ direction: "rtl" }}>
        <div className="d-flex align-items-center gap-3 mb-5">
          <button type="button" onClick={() => navigate("/profile")} style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface, #fff)", border: "2px solid var(--outline-variant, #D0D0D0)", transition: "all 0.3s", cursor: "pointer" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--on-surface-variant)" }}>arrow_forward</span>
          </button>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--on-surface)", marginBottom: 4 }}>تعديل الملف الشخصي</h1>
            <p style={{ color: "var(--on-surface-variant)", fontSize: "1.05rem" }}>حدّث بياناتك الشخصية</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="row g-4">
            {/* Left — Avatar Card */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: "var(--surface-card, #fff)" }}>
                <div className="edit-avatar-wrap mb-3" onClick={() => avatarInputRef.current?.click()}>
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="الصورة الشخصية"
                      className="rounded-circle border border-4 border-primary shadow-sm"
                      style={{ width: 140, height: 140, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center border border-4 border-primary shadow-sm mx-auto"
                      style={{ width: 140, height: 140, fontSize: 48, fontWeight: "bold" }}
                    >
                      {formData.fullName ? formData.fullName[0] : "أ"}
                    </div>
                  )}
                  <div className="avatar-overlay rounded-circle">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 36 }}>photo_camera</span>
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  className="d-none"
                  accept="image/*"
                  onChange={(e) => handleAvatarChange(e.target.files[0])}
                />
                <button
                  type="button"
                  className="btn btn-sm rounded-3 px-4 py-2 fw-bold"
                  style={{ background: "var(--primary-container, rgba(107,144,128,0.12))", color: "var(--primary)", fontSize: "0.95rem" }}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>edit</span>
                  تغيير الصورة
                </button>
                <p className="text-muted small mb-0 mt-2" style={{ fontSize: "0.85rem" }}>يفضل استخدام صورة مربعة (أقل من 2 ميجابايت)</p>

                {profile?.verification_status && (
                  <div className="mt-3 p-3 rounded-3 w-100" style={{ background: "rgba(107,144,128,0.06)" }}>
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: profile.verification_status === "approved" ? "var(--primary)" : profile.verification_status === "rejected" ? "var(--error, #ba1a1a)" : "var(--outline)" }}>
                        {profile.verification_status === "approved" ? "verified" : profile.verification_status === "rejected" ? "cancel" : "pending"}
                      </span>
                      <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--on-surface-variant)" }}>
                        {profile.verification_status === "approved" ? "حساب موثّق" : profile.verification_status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right — Form */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "var(--surface-card, #fff)" }}>
                <h2 className="h5 fw-bold mb-4 pb-2 border-bottom" style={{ color: "var(--on-surface)" }}>
                  <span className="material-symbols-outlined me-2" style={{ fontSize: 22, verticalAlign: "middle" }}>person</span>
                  المعلومات الشخصية
                </h2>

                {/* Full Name */}
                <div className="mb-4">
                  <label className="reg-label">الاسم الكامل</label>
                  <div className="reg-input-wrap">
                    <span className="material-symbols-outlined input-icon">person</span>
                    <input
                      name="fullName"
                      type="text"
                      className="form-control"
                      placeholder="أدخل اسمك الكامل كما هو في الهوية"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email — Read Only */}
                {renderReadOnlyField("البريد الإلكتروني", formData.email, "email")}

                {/* Phone */}
                <div className="mb-4">
                  <label className="reg-label">رقم الهاتف</label>
                  <div className="reg-input-wrap">
                    <span className="material-symbols-outlined input-icon">phone</span>
                    <input
                      name="phone"
                      type="tel"
                      className="form-control"
                      placeholder="01xxxxxxxxx"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={11}
                    />
                  </div>
                </div>

                {/* Student-specific fields */}
                {isStudent && (
                  <>
                    {/* University + College */}
                    <div className="row g-4 mb-4">
                      <div className="col-md-6">
                        <label className="reg-label">الجامعة</label>
                        <div className="reg-input-wrap">
                          <span className="material-symbols-outlined input-icon">school</span>
                          <select
                            name="university"
                            className="form-select"
                            value={formData.university}
                            onChange={handleChange}
                          >
                            <option value="">اختر الجامعة</option>
                            {universities.map((u) => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="reg-label">الكلية</label>
                        <div className="reg-input-wrap">
                          <span className="material-symbols-outlined input-icon">account_balance</span>
                          <input
                            name="college"
                            type="text"
                            className="form-control"
                            placeholder="مثال: كلية الهندسة"
                            value={formData.college}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* National ID — Read Only */}
                {renderReadOnlyField("الرقم القومي", formData.nationalId, "badge")}

                {/* Student Card Upload */}
                {isStudent && (
                  <div className="mb-4">
                    <label className="reg-label">صورة الكارنيه الجامعي</label>
                    <div
                      className={`reg-upload ${(cardPreview || existingCardUrl) ? "has-file" : ""} ${dragActive ? "drag-active" : ""}`}
                      onClick={() => !cardFile && !existingCardUrl && cardInputRef.current?.click()}
                      onDrop={(e) => { e.preventDefault(); setDragActive(false); handleCardFile(e.dataTransfer.files[0]); }}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    >
                      {(cardPreview || existingCardUrl) ? (
                        <div className="w-100 position-relative">
                          <img
                            src={cardPreview || existingCardUrl}
                            alt="الكارنيه"
                            style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 14 }}
                          />
                          {cardFile && (
                            <p className="mt-2 mb-2 text-truncate fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>
                              {cardFile.name}
                            </p>
                          )}
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              type="button"
                              className="btn btn-sm rounded-3 px-3"
                              style={{ background: "var(--primary-container, rgba(107,144,128,0.12))", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem" }}
                              onClick={(e) => { e.stopPropagation(); cardInputRef.current?.click(); }}
                            >
                              <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>edit</span>تغيير
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm rounded-3 px-3"
                              style={{ background: "rgba(186,26,26,0.08)", color: "var(--error, #ba1a1a)", fontWeight: 700, fontSize: "0.9rem" }}
                              onClick={(e) => { e.stopPropagation(); removeCard(); }}
                            >
                              <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>delete</span>إزالة
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-3">
                          <div className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 72, height: 72, background: "var(--primary-container, rgba(107,144,128,0.12))" }}>
                            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 38 }}>cloud_upload</span>
                          </div>
                          <p className="fw-bold mb-1" style={{ fontSize: "1.05rem", color: "var(--on-surface)" }}>اسحب وأفلت الصورة هنا</p>
                          <p className="mb-2" style={{ fontSize: "0.95rem", color: "var(--on-surface-variant)" }}>أو اضغط لاختيار ملف</p>
                          <p className="mb-0" style={{ fontSize: "0.85rem", color: "var(--outline)" }}>JPG, PNG, WEBP — حد أقصى 5 ميجابايت</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={cardInputRef}
                      type="file"
                      className="d-none"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleCardFile(e.target.files[0])}
                    />
                    {existingCardUrl && !cardFile && (
                      <div className="mt-2 d-flex align-items-start gap-2 rounded-3 p-3" style={{ background: "rgba(107,144,128,0.06)" }}>
                        <span className="material-symbols-outlined mt-1 flex-shrink-0" style={{ fontSize: 20, color: "var(--primary)" }}>info</span>
                        <span style={{ fontSize: "0.95rem", color: "var(--on-surface-variant)", lineHeight: 1.8 }}>الكارنيه الحالي مرفق. اضغط على "تغيير" لرفع صورة جديدة.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bio */}
                <div className="mb-4">
                  <label className="reg-label">نبذة شخصية</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder={isStudent ? "اكتب نبذة قصيرة عن نفسك، دراستك، وما تبحث عنه..." : "اكتب نبذة قصيرة عن نفسك وخبراتك..."}
                    value={formData.bio}
                    onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                    style={{ borderRadius: 14, border: "2px solid var(--outline-variant, #D0D0D0)", padding: "14px 16px", fontSize: "1rem", resize: "vertical", minHeight: 100, transition: "all 0.3s", background: "var(--surface, #fff)", width: "100%" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 4px rgba(107,144,128,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--outline-variant, #D0D0D0)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Info Card */}
                <div className="mb-4 p-4 rounded-4" style={{ borderRight: "4px solid var(--primary)", background: "rgba(107,144,128,0.06)" }}>
                  <div className="d-flex align-items-start gap-3">
                    <span className="material-symbols-outlined mt-1 flex-shrink-0" style={{ fontSize: 26, color: "var(--primary)" }}>info</span>
                    <div>
                      <p className="fw-bold mb-2" style={{ fontSize: "1.05rem", color: "var(--on-surface)" }}>ملاحظة</p>
                      <p className="mb-0" style={{ fontSize: "1rem", color: "var(--on-surface-variant)", lineHeight: 2 }}>
                        البريد الإلكتروني والرقم القومي لا يمكن تعديلهما بعد إنشاء الحساب.
                        {isStudent && " الكارنيه الجامعي سيظهر كما هو دون تعديل."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="d-flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1 reg-btn d-flex align-items-center justify-content-center gap-2"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>save</span>
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn reg-btn d-flex align-items-center justify-content-center gap-2"
                    style={{ background: "var(--surface, #fff)", border: "2px solid var(--outline-variant, #D0D0D0)", color: "var(--on-surface-variant)", minWidth: 140 }}
                    onClick={() => navigate("/profile")}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
