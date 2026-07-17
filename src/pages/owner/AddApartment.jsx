import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apartmentService } from "../../services/apartmentService";
import { subscriptionService, PLAN_LIMITS } from "../../services/subscriptionService";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

const neighborhoodCoords = {
  Dallah: [29.31, 30.98],
  "El Hadqa": [29.32, 30.96],
  "El Gamea": [29.30, 30.97],
  "El Masalla": [29.33, 30.95],
  "Keman Fares": [29.29, 30.99],
  Qahafa: [29.28, 30.94],
  "Dar El Ramad": [29.34, 31.0],
};

function MapEvents({ setCoords }) {
  useMapEvents({ click(e) { setCoords(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

const steps = [
  { id: 1, label: "المعلومات الأساسية", icon: "info" },
  { id: 2, label: "الموقع الجغرافي", icon: "location_on" },
  { id: 3, label: "تفاصيل العقار", icon: "home" },
  { id: 4, label: "المرافق", icon: "widgets" },
  { id: 5, label: "الصور والفيديو", icon: "photo_library" },
  { id: 6, label: "المراجعة", icon: "rate_review" },
];

const neighborhoods = [
  { value: "dala", label: "دلة" },
  { value: "sawaqi", label: "السواقي" },
  { value: "algon", label: "الجون" },
  { value: "central", label: "السنترال" },
  { value: "hawatem", label: "الحواتم" },
  { value: "lotfallah", label: "لطف الله" },
  { value: "sawy", label: "الصوفي" },
  { value: "baghouz", label: "باغوص" },
  { value: "keman-fares", label: "كيمان فارس" },
  { value: "salakhana", label: "السلخانة" },
  { value: "sheikh-hassan", label: "الشيخ حسن" },
  { value: "damo", label: "دمو" },
  { value: "masla", label: "المسلة" },
  { value: "dar-alramad", label: "دار الرماد" },
];

const apartmentTypes = [
  { value: "room", label: "غرفة" },
  { value: "apartment", label: "شقة" },
  { value: "shared", label: "مشتركة" },
  { value: "studio", label: "استوديو" },
];

const amenitiesList = [
  { icon: "wifi", label: "واي فاي" },
  { icon: "ac_unit", label: "تكييف" },
  { icon: "local_laundry_service", label: "غسالة ملابس" },
  { icon: "kitchen", label: "مطبخ مجهز" },
  { icon: "local_parking", label: "موقف سيارات" },
  { icon: "security", label: "أمن 24 ساعة" },
  { icon: "elevator", label: "مصعد" },
  { icon: "balcony", label: "شرفة" },
  { icon: "tv", label: "تلفزيون" },
  { icon: "bed", label: "مفروش بالكامل" },
  { icon: "water_drop", label: "سخان مياه" },
];

const inputStyle = { borderRadius: "var(--radius-md, 12px)", borderColor: "var(--border, #DDD8D0)", background: "var(--surface-container-low, #F5F3EE)" };

const VIDEO_MAX_SIZE = 50 * 1024 * 1024;

function AddApartment() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const videoInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [apartmentCount, setApartmentCount] = useState(0);
  const [checkingSub, setCheckingSub] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    apartment_type: "apartment",
    neighborhood: "Dallah",
    address: "",
    bedrooms: 1,
    bathrooms: 1,
    area: "",
    price: "",
    amenities: [],
    images: [],
    video: null,
    videoPreview: null,
    latitude: 29.31,
    longitude: 30.98,
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (!profile) return;
      try {
        const [subResult, countResult] = await Promise.allSettled([
          subscriptionService.getCurrent(profile.id),
          subscriptionService.countApartments(profile.id),
        ]);
        if (subResult.status === "fulfilled") setSubscription(subResult.value.data);
        if (countResult.status === "fulfilled") setApartmentCount(countResult.value.count);
      } catch {
        // silent
      }
      setCheckingSub(false);
    };
    checkSubscription();
  }, [profile]);

  useEffect(() => {
    return () => {
      if (form.videoPreview) URL.revokeObjectURL(form.videoPreview);
    };
  }, [form.videoPreview]);

  const canAdd = subscriptionService.canAddApartment(subscription, apartmentCount);
  const planLimits = subscription
    ? PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.free
    : PLAN_LIMITS.free;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleNeighborhoodChange = (val) => {
    const coords = neighborhoodCoords[val] || [29.31, 30.98];
    setForm((prev) => ({ ...prev, neighborhood: val, latitude: coords[0], longitude: coords[1] }));
  };

  const toggleAmenity = (label) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(label)
        ? prev.amenities.filter((a) => a !== label)
        : [...prev.amenities, label],
    }));
  };

  const handleVideoChange = (file) => {
    if (!file) return;
    const allowed = ["video/mp4", "video/quicktime", "video/webm"];
    if (!allowed.includes(file.type)) {
      toast.error("صيغة الفيديو غير مدعومة. استخدم MP4 أو MOV أو WEBM");
      return;
    }
    if (file.size > VIDEO_MAX_SIZE) {
      toast.error("حجم الفيديو يتجاوز الحد الأقصى (50 ميجابايت)");
      return;
    }
    if (form.videoPreview) URL.revokeObjectURL(form.videoPreview);
    update("video", file);
    update("videoPreview", URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    if (form.videoPreview) URL.revokeObjectURL(form.videoPreview);
    update("video", null);
    update("videoPreview", null);
  };

  const handleNext = () => {
    if (currentStep === 1 && !form.title.trim()) {
      toast.error("يرجى إدخال عنوان الإعلان");
      return;
    }
    if (currentStep < 6) setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!canAdd) {
      toast.error("وصلت الحد الأقصى لباقة " + planLimits.label + ". يرجى ترقية باقتك.");
      return;
    }
    setLoading(true);

    const imageUrls = [];
    for (const file of form.images) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { data: url, error } = await apartmentService.uploadImage(file, path);
      if (url) imageUrls.push(url);
      if (error) console.error("Upload error:", error);
    }

    let videoUrl = null;
    if (form.video) {
      const vPath = `${user.id}/${Date.now()}_video_${form.video.name}`;
      const { data: vUrl, error: vErr } = await apartmentService.uploadImage(form.video, vPath);
      if (vUrl) videoUrl = vUrl;
      if (vErr) console.error("Video upload error:", vErr);
    }

    const apartmentData = {
      owner_id: user.id,
      title: form.title,
      description: form.description,
      apartment_type: form.apartment_type,
      neighborhood: form.neighborhood,
      city: "Fayoum",
      address: form.address,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      area: form.area ? Number(form.area) : null,
      price: Number(form.price),
      amenities: form.amenities,
      images: imageUrls,
      video_url: videoUrl,
      wifi: form.amenities.includes("واي فاي"),
      latitude: form.latitude,
      longitude: form.longitude,
    };

    const { error } = await apartmentService.create(apartmentData);
    setLoading(false);

    if (error) {
      toast.error("حدث خطأ أثناء إضافة العقار");
      return;
    }

    toast.success("تم إرسال العقار بنجاح! سيتم مراجعته من قبل الإدارة.");
    setTimeout(() => navigate("/owner/apartments"), 1500);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="owner-section-card p-4 p-md-5">
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>info</span>
                  المعلومات الأساسية
                </h3>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label fw-semibold small">عنوان الإعلان</label>
                    <input type="text" className="form-control owner-input" style={inputStyle} placeholder="مثال: شقة مؤثثة بالقرب من جامعة الفيوم" value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={150} />
                  </div>
                  <div>
                    <label className="form-label fw-semibold small">وصف العقار</label>
                    <textarea className="form-control owner-input" style={inputStyle} rows={4} placeholder="اكتب وصفاً تفصيلياً..." value={form.description} onChange={(e) => update("description", e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">نوع العقار</label>
                    <select className="form-select" style={inputStyle} value={form.apartment_type} onChange={(e) => update("apartment_type", e.target.value)}>
                      {apartmentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="owner-section-card p-4 p-md-5 mb-4">
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>map</span>
                  تفاصيل الموقع
                </h3>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label fw-semibold small text-muted">الحي</label>
                    <select className="form-select form-select-sm" style={inputStyle} value={form.neighborhood} onChange={(e) => handleNeighborhoodChange(e.target.value)}>
                      {neighborhoods.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label fw-semibold small text-muted">العنوان التفصيلي</label>
                    <input type="text" className="form-control form-control-sm owner-input" style={inputStyle} placeholder="اسم الشارع، رقم المبنى" value={form.address} onChange={(e) => update("address", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="owner-section-card p-4 p-md-5">
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>home</span>
                  تفاصيل العقار
                </h3>
                <div className="d-flex flex-column gap-3">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">الغرف</label>
                      <input type="number" className="form-control owner-input" style={inputStyle} min={1} value={form.bedrooms} onChange={(e) => update("bedrooms", Number(e.target.value))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">الحمامات</label>
                      <input type="number" className="form-control owner-input" style={inputStyle} min={1} value={form.bathrooms} onChange={(e) => update("bathrooms", Number(e.target.value))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">المساحة (م²)</label>
                      <input type="number" className="form-control owner-input" style={inputStyle} placeholder="مثال: 120" value={form.area} onChange={(e) => update("area", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label fw-semibold small text-muted">السعر الشهري (ج.م)</label>
                    <input type="number" className="form-control owner-input" style={inputStyle} placeholder="مثال: 2500" value={form.price} onChange={(e) => update("price", e.target.value)} required />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="owner-section-card p-4 p-md-5">
            <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>widgets</span>
              المرافق والخدمات
            </h3>
            <div className="row g-3 owner-stagger">
              {amenitiesList.map((item) => {
                const selected = form.amenities.includes(item.label);
  const isUnverified = profile && (profile.role === "owner" || profile.role === "broker") && profile.verification_status !== "approved";

  if (isUnverified) {
    const statusLabel = profile.verification_status === "pending" ? "قيد المراجعة" : "مرفوض";
    const statusColor = profile.verification_status === "pending" ? "#f59e0b" : "#dc3545";
    const statusIcon = profile.verification_status === "pending" ? "hourglass_top" : "cancel";
    const targetPage = profile.verification_status === "pending" ? "/pending-approval" : "/rejected-approval";

    return (
      <div className="container py-5" style={{ minHeight: "60vh" }}>
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm text-center p-4 p-lg-5" style={{ borderRadius: "var(--radius-lg, 18px)" }}>
              <div className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 80, height: 80, background: `${statusColor}15`, border: `3px solid ${statusColor}` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: statusColor }}>{statusIcon}</span>
              </div>
              <h3 className="fw-bold mb-3" style={{ fontSize: "1.35rem", color: "var(--on-surface, #1a1d23)" }}>لا يمكنك إضافة وحدات سكنية</h3>
              <p className="mb-3" style={{ color: "var(--on-surface-variant, #5a6370)", fontSize: "1rem", lineHeight: 1.7 }}>
                يجب اعتماد حسابك أولاً قبل إضافة أي وحدات سكنية.
              </p>
              <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: statusColor }}>info</span>
                <span style={{ fontSize: "0.9rem", color: statusColor, fontWeight: 600 }}>حالة الحساب: {statusLabel}</span>
              </div>
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                <button className="btn py-2 px-4 fw-bold" style={{ background: "var(--primary, #6B9080)", color: "white", borderRadius: "var(--radius-md, 12px)" }} onClick={() => navigate(targetPage)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginLeft: 6 }}>visibility</span>
                  صفحة حالة الطلب
                </button>
                <button className="btn py-2 px-4 fw-bold" style={{ border: "2px solid var(--primary, #6B9080)", color: "var(--primary, #6B9080)", borderRadius: "var(--radius-md, 12px)", background: "transparent" }} onClick={() => navigate("/owner/dashboard")}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginLeft: 6 }}>dashboard</span>
                  لوحة التحكم
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
                  <div key={item.label} className="col-6 col-md-4 col-lg-3">
                    <button
                      className="w-100 d-flex flex-column align-items-center gap-2 p-3 rounded-3 border text-center"
                      style={{
                        background: selected ? "rgba(107,144,128,0.08)" : "var(--surface-container-low, #F5F3EE)",
                        borderColor: selected ? "var(--primary)" : "var(--border, #DDD8D0)",
                        fontWeight: selected ? 600 : 400,
                        transition: "all 0.2s ease",
                        color: "var(--on-surface, #1A1D23)",
                      }}
                      onClick={() => toggleAmenity(item.label)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: selected ? "var(--primary)" : "var(--on-surface-variant, #5A6370)" }}>{item.icon}</span>
                      <span style={{ fontSize: "0.8rem" }}>{item.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="owner-section-card p-4 p-md-5">
            <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>photo_library</span>
              صور وفيديو العقار
            </h3>

            {/* Image Upload */}
            <div
              className={`owner-upload-zone p-5 text-center mb-4 ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")); if (files.length) update("images", [...form.images, ...files].slice(0, 5)); }}
            >
              <span className="material-symbols-outlined d-block mb-3" style={{ fontSize: 48, color: "var(--primary)" }}>cloud_upload</span>
              <h5 className="fw-bold" style={{ color: "var(--on-surface, #1A1D23)" }}>اسحب الصور هنا أو اضغط للتحميل</h5>
              <p className="text-muted small mb-3">بحد أقصى 5 صور، كل صورة أقل من 5 ميجابايت</p>
              <label className="btn btn-primary px-4 owner-btn-lift" style={{ borderRadius: "var(--radius-md, 12px)" }}>
                اختيار الصور
                <input type="file" className="d-none" multiple accept="image/*" onChange={(e) => update("images", [...form.images, ...Array.from(e.target.files)].slice(0, 5))} />
              </label>
            </div>

            {form.images.length > 0 && (
              <div className="d-flex flex-wrap gap-3 mb-4">
                {form.images.map((img, i) => (
                  <div key={i} className="position-relative rounded-3 overflow-hidden" style={{ width: 120, height: 90 }}>
                    <img src={URL.createObjectURL(img)} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                    <button className="position-absolute top-0 start-0 btn btn-sm p-0 text-white" style={{ background: "rgba(0,0,0,0.5)", width: 22, height: 22, fontSize: 14 }} onClick={() => update("images", form.images.filter((_, j) => j !== i))}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                    {i === 0 && <span className="position-absolute bottom-0 start-0 px-2 text-white" style={{ background: "var(--primary)", fontSize: 10, fontWeight: 700 }}>رئيسية</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Video Upload */}
            <div style={{ borderTop: "1px solid var(--border, #DDD8D0)", paddingTop: 24 }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 22 }}>videocam</span>
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: "0.95rem", color: "var(--on-surface, #1A1D23)" }}>فيديو العقار</h6>
                  <p className="mb-0 small" style={{ color: "var(--on-surface-variant, #5A6370)" }}>أضف فيديو ل展示 العقار (اختياري، حد أقصى 50 ميجابايت)</p>
                </div>
              </div>

              {!form.videoPreview ? (
                <div
                  className="owner-upload-zone p-4 text-center"
                  onClick={() => videoInputRef.current?.click()}
                  style={{ borderStyle: "dashed" }}
                >
                  <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: 36, color: "var(--primary)" }}>videocam</span>
                  <p className="fw-bold mb-1" style={{ fontSize: "0.88rem", color: "var(--on-surface, #1A1D23)" }}>اضغط لاختيار فيديو</p>
                  <p className="mb-0 small" style={{ color: "var(--on-surface-variant, #5A6370)" }}>MP4، MOV، WEBM — حد أقصى 50 ميجابايت</p>
                  <input
                    ref={videoInputRef}
                    type="file"
                    className="d-none"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(e) => handleVideoChange(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <div className="position-relative rounded-4 overflow-hidden" style={{ background: "#000" }}>
                  <video
                    src={form.videoPreview}
                    controls
                    className="w-100"
                    style={{ maxHeight: 300, borderRadius: "var(--radius-lg, 18px)" }}
                  />
                  <button
                    className="position-absolute top-3 start-3 btn btn-sm d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 32, height: 32, background: "rgba(0,0,0,0.6)", color: "white" }}
                    onClick={handleRemoveVideo}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                  <div className="position-absolute bottom-3 end-3 px-2 py-1 rounded-2" style={{ background: "rgba(0,0,0,0.6)", color: "white", fontSize: "0.75rem" }}>
                    {form.video?.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="owner-section-card p-4 p-md-5">
            <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>rate_review</span>
              مراجعة الإعلان
            </h3>
            <div className="d-flex flex-column gap-3">
              <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
                <p className="small text-muted mb-1">عنوان الإعلان</p>
                <p className="fw-bold mb-0" style={{ color: "var(--on-surface, #1A1D23)" }}>{form.title || "لم يتم الإدخال"}</p>
              </div>
              <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
                <p className="small text-muted mb-1">الوصف</p>
                <p className="mb-0" style={{ fontSize: "0.9rem", color: "var(--on-surface, #1A1D23)" }}>{form.description || "لم يتم الإدخال"}</p>
              </div>
              <div className="row g-3">
                <div className="col-4"><div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}><p className="small text-muted mb-1">النوع</p><p className="fw-bold mb-0">{apartmentTypes.find((t) => t.value === form.apartment_type)?.label}</p></div></div>
                <div className="col-4"><div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}><p className="small text-muted mb-1">الغرف</p><p className="fw-bold mb-0">{form.bedrooms}</p></div></div>
                <div className="col-4"><div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}><p className="small text-muted mb-1">المساحة</p><p className="fw-bold mb-0">{form.area || "—"} {form.area ? "م²" : ""}</p></div></div>
              </div>
              {form.price && (
                <div className="p-3 rounded-3" style={{ background: "rgba(107,144,128,0.08)" }}>
                  <p className="small text-muted mb-1">السعر</p>
                  <p className="fw-bold mb-0" style={{ color: "var(--primary)", fontSize: "1.2rem" }}>{Number(form.price).toLocaleString("ar-EG")} ج.م / شهر</p>
                </div>
              )}
              {form.videoPreview && (
                <div className="p-3 rounded-3" style={{ background: "rgba(107,144,128,0.05)" }}>
                  <p className="small text-muted mb-1">الفيديو</p>
                  <p className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "var(--primary)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>videocam</span>
                    تم إرفاق فيديو
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 2: {
        const mapCenter = [form.latitude || 29.31, form.longitude || 30.98];
        return (
          <div className="owner-section-card p-4 p-md-5">
            <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>location_on</span>
              الموقع الجغرافي
            </h3>
            <p className="text-muted small">
              حدد موقع العقار بدقة بالضغط على الخريطة. سيتحرك الدبوس تلقائياً إلى النقطة المحددة.
            </p>
            <div className="rounded-4 overflow-hidden border mb-3" style={{ height: 350, position: "relative", zIndex: 1 }}>
              <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={mapCenter} />
                <MapEvents setCoords={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />
                <ChangeMapView center={mapCenter} />
              </MapContainer>
            </div>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label small text-muted">خط العرض (Latitude)</label>
                <input type="text" className="form-control form-control-sm bg-light" readOnly value={form.latitude?.toFixed(6) || ""} />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted">خط الطول (Longitude)</label>
                <input type="text" className="form-control form-control-sm bg-light" readOnly value={form.longitude?.toFixed(6) || ""} />
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: "calc(100vh - 68px)" }}>
      {profile?.verification_status === "pending" && (
        <div className="container py-5 text-center owner-section">
          <span className="material-symbols-outlined mb-3" style={{ fontSize: 64, color: "var(--tertiary, #E0A854)" }}>pending_actions</span>
          <h4 className="fw-bold" style={{ color: "var(--on-surface, #1A1D23)" }}>حسابك بانتظار التوثيق</h4>
          <p style={{ color: "var(--on-surface-variant, #5A6370)" }}>يجب اعتماد حسابك من قبل الإدارة قبل إضافة العقارات. سيتم إشعارك عند الاعتماد.</p>
        </div>
      )}
      {profile?.verification_status === "rejected" && (
        <div className="container py-5 text-center owner-section">
          <span className="material-symbols-outlined mb-3" style={{ fontSize: 64, color: "var(--error, #C45B4A)" }}>block</span>
          <h4 className="fw-bold" style={{ color: "var(--on-surface, #1A1D23)" }}>تم رفض توثيق حسابك</h4>
          <p style={{ color: "var(--on-surface-variant, #5A6370)" }}>{profile.rejection_reason || "يرجى التواصل مع الإدارة لمعرفة سبب الرفض."}</p>
        </div>
      )}
      {profile?.verification_status !== "pending" && profile?.verification_status !== "rejected" && (
      <div className="flex-grow-1">
        {!checkingSub && !canAdd && (
          <div className="container py-4">
            <div className="owner-section-card p-4 text-center">
              <span className="material-symbols-outlined mb-3" style={{ fontSize: 48, color: "var(--tertiary, #E0A854)" }}>warning</span>
              <h5 className="fw-bold mb-2" style={{ color: "var(--on-surface, #1A1D23)" }}>وصلت الحد الأقصى لباقة {planLimits.label}</h5>
              <p style={{ color: "var(--on-surface-variant, #5A6370)", fontSize: "0.9rem" }}>
                باقتك الحالية تسمح بـ {planLimits.maxApartments === Infinity ? "عدد غير محدود من" : `${planLimits.maxApartments}`} الإعلانات.
                لديك حالياً {apartmentCount} إعلان.
              </p>
              <button
                className="btn px-4 py-2 fw-bold mt-2 owner-btn-lift"
                style={{ background: "var(--primary)", color: "white", borderRadius: "var(--radius-md, 12px)" }}
                onClick={() => navigate("/subscriptions")}
              >
                ترقية الباقة
              </button>
            </div>
          </div>
        )}
        <div className="p-3 p-md-4" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="mb-4 owner-section" style={{ animationDelay: "0.04s" }}>
            <h1 className="fw-bold mb-1" style={{ fontSize: "1.5rem", color: "var(--on-surface, #1A1D23)" }}>إضافة عقار سكني جديد</h1>
            <p className="mb-0" style={{ color: "var(--on-surface-variant, #5A6370)" }}>أكمل الخطوات التالية لإدراج عقارك في المنصة</p>
          </div>

          {/* Wizard Steps */}
          <div className="d-flex align-items-center gap-2 mb-4 overflow-x-auto pb-3 owner-section" style={{ animationDelay: "0.08s" }}>
            {steps.map((step, i) => (
              <div key={step.id} className="d-flex align-items-center gap-2" style={{ minWidth: "fit-content" }}>
                <div
                  className="d-flex flex-column align-items-center gap-1"
                  style={{ opacity: currentStep >= step.id ? 1 : 0.5, cursor: step.id <= currentStep ? "pointer" : "default" }}
                  onClick={() => { if (step.id <= currentStep) setCurrentStep(step.id); }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
                    style={{
                      width: 40, height: 40, fontSize: "0.85rem",
                      background: step.id <= currentStep ? "var(--primary)" : "var(--white, #fff)",
                      color: step.id <= currentStep ? "white" : "var(--on-surface-variant, #5A6370)",
                      border: `2px solid ${step.id <= currentStep ? "var(--primary)" : "var(--border, #DDD8D0)"}`,
                      transition: "all 0.25s ease",
                    }}
                  >
                    {step.id < currentStep ? <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check</span> : step.id}
                  </div>
                  <span className="text-nowrap" style={{ fontSize: "0.7rem", fontWeight: step.id === currentStep ? 700 : 500, color: step.id <= currentStep ? "var(--primary)" : "var(--on-surface-variant, #5A6370)" }}>{step.label}</span>
                </div>
                {i < steps.length - 1 && <div style={{ width: 30, height: 2, background: step.id < currentStep ? "var(--primary)" : "var(--border, #DDD8D0)", transition: "background 0.25s ease" }} />}
              </div>
            ))}
          </div>

          {renderStepContent()}

          {/* Action Footer */}
          <div className="mt-4 p-3 p-md-4 rounded-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 owner-section" style={{ background: "var(--white, #fff)", boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,0.05))", animationDelay: "0.15s" }}>
            <button className="btn d-flex align-items-center gap-2 px-4" style={{ border: "1px solid var(--border, #DDD8D0)", color: "var(--on-surface-variant, #5A6370)", borderRadius: "var(--radius-md, 12px)" }} onClick={() => currentStep > 1 && setCurrentStep((s) => s - 1)} disabled={currentStep === 1}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              رجوع
            </button>
            {currentStep < 6 ? (
              <button className="btn d-flex align-items-center gap-2 px-4 text-white fw-bold owner-btn-lift" style={{ background: "var(--primary, #6B9080)", borderRadius: "var(--radius-md, 12px)" }} onClick={handleNext}>
                الخطوة التالية
                <span className="material-symbols-outlined" style={{ fontSize: 18, transform: "rotate(180deg)" }}>arrow_right_alt</span>
              </button>
            ) : (
              <button className="btn d-flex align-items-center gap-2 px-4 text-white fw-bold owner-btn-lift" style={{ background: "var(--success, #6B9080)", borderRadius: "var(--radius-md, 12px)" }} onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm" /> جاري الإرسال...</> : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span> إرسال للمراجعة</>}
              </button>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default AddApartment;
