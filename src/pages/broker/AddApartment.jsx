import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apartmentService } from "../../services/apartmentService";
import { subscriptionService } from "../../services/subscriptionService";
import { compressImages } from "../../utils/imageCompression";
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
  dala: [29.31, 30.98],
  sawaqi: [29.32, 30.96],
  algon: [29.30, 30.97],
  central: [29.33, 30.95],
  hawatem: [29.29, 30.99],
  lotfallah: [29.28, 30.94],
  sawy: [29.34, 31.0],
  baghouz: [29.27, 30.93],
  "keman-fares": [29.29, 30.99],
  salakhana: [29.30, 30.95],
  "sheikh-hassan": [29.35, 31.01],
  damo: [29.26, 30.92],
  masla: [29.33, 30.95],
  "dar-alramad": [29.34, 31.0],
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

const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const DRAFT_KEY = "sakani_add_apartment_draft";

const defaultForm = {
  title: "",
  description: "",
  apartment_type: "apartment",
  neighborhood: "dala",
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
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    return { ...draft, images: [], video: null, videoPreview: null };
  } catch {
    return null;
  }
}

function saveDraft(form) {
  const safe = { ...form, images: [], video: null, videoPreview: null };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
  } catch { /* quota exceeded */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* */ }
}

function BrokerAddApartment() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const videoInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [apartmentCount, setApartmentCount] = useState(0);
  const [checkingSub, setCheckingSub] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadResults, setUploadResults] = useState({});
  const [form, setForm] = useState(() => {
    const draft = loadDraft();
    if (draft) {
      return { ...defaultForm, ...draft };
    }
    return { ...defaultForm };
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

  useEffect(() => {
    const timer = setTimeout(() => saveDraft(form), 500);
    return () => clearTimeout(timer);
  }, [form]);

  const canAdd = subscriptionService.canAddApartment(subscription, apartmentCount, "broker");
  const planLimits = subscriptionService.getPlanInfo(subscription, "broker");

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
      toast.error("حجم الفيديو يتجاوز الحد الأقصى (100 ميجابايت)");
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

  const getStepCompletion = useCallback((step) => {
    switch (step) {
      case 1: {
        const fields = [
          form.title.trim().length >= 5,
          form.description.trim().length >= 20,
          !!form.apartment_type,
        ];
        return { done: fields.filter(Boolean).length, total: fields.length };
      }
      case 2: {
        const fields = [
          !!form.neighborhood,
          form.address.trim().length >= 5,
        ];
        return { done: fields.filter(Boolean).length, total: fields.length };
      }
      case 3: {
        const fields = [
          !!form.price && Number(form.price) >= 500,
          true,
          true,
        ];
        return { done: fields.filter(Boolean).length, total: fields.length };
      }
      case 4:
        return { done: form.amenities.length > 0 ? 1 : 0, total: 1 };
      case 5:
        return { done: form.images.length > 0 ? 1 : 0, total: 1 };
      case 6:
        return { done: 0, total: 0 };
      default:
        return { done: 0, total: 0 };
    }
  }, [form]);

  const overallProgress = (() => {
    let done = 0;
    let total = 0;
    for (let s = 1; s <= 5; s++) {
      const c = getStepCompletion(s);
      done += c.done;
      total += c.total;
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  })();

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!form.title.trim()) return "يرجى إدخال عنوان الإعلان";
        if (form.title.trim().length < 5) return "العنوان يجب أن يكون 5 أحرف على الأقل";
        if (!form.apartment_type) return "يرجى اختيار نوع العقار";
        if (!form.description.trim()) return "يرجى إدخال وصف العقار";
        if (form.description.trim().length < 20) return "الوصف يجب أن يكون 20 حرف على الأقل";
        return null;
      case 2:
        if (!form.neighborhood) return "يرجى اختيار الحي";
        if (!form.address.trim()) return "يرجى إدخال العنوان التفصيلي";
        if (form.address.trim().length < 5) return "العنوان التفصيلي يجب أن يكون 5 أحرف على الأقل";
        return null;
      case 3:
        if (!form.price || Number(form.price) <= 0) return "يرجى إدخال السعر الشهري";
        if (Number(form.price) < 500) return "السعر يجب أن يكون 500 جنيه على الأقل";
        return null;
      case 4:
        return null;
      case 5:
        if (form.images.length === 0) return "يرجى رفع صورة واحدة على الأقل";
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setStepErrors((prev) => ({ ...prev, [currentStep]: error }));
      toast.error(error);
      return;
    }
    setStepErrors((prev) => ({ ...prev, [currentStep]: null }));
    if (currentStep < 6) setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    if (currentStep > 1) {
      setStepErrors((prev) => ({ ...prev, [currentStep]: null }));
      setCurrentStep((s) => s - 1);
    }
  };

  const handleImagesAdd = async (newFiles) => {
    const allowed = [...form.images, ...newFiles].slice(0, 10);
    toast.loading("جاري ضغط الصور...", { id: "compress" });
    const compressed = await compressImages(
      allowed.filter((f) => f instanceof File && !f._uploaded)
    );
    toast.dismiss("compress");
    const merged = [...allowed.filter((f) => f._uploaded || f.url), ...compressed].slice(0, 10);
    update("images", merged);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!canAdd) {
      toast.error("وصلت الحد الأقصى لباقة " + planLimits.label + ". يرجى ترقية باقتك.");
      return;
    }

    const stepError = validateStep(5);
    if (stepError) {
      toast.error(stepError);
      return;
    }

    setLoading(true);
    const results = {};
    let hasErrors = false;

    try {
      const imageUrls = [];
      const filesToUpload = form.images.filter((f) => f instanceof File && !f._uploaded);
      const existingUrls = form.images.filter((f) => f._uploaded || typeof f === "string").map((f) => f.url || f);

      for (let i = 0; i < filesToUpload.length; i++) {
        const img = filesToUpload[i];
        const fileKey = `img_${i}`;
        setUploadProgress((p) => ({ ...p, [fileKey]: 0 }));

        const path = `${user.id}/${Date.now()}_${i}_${img.name}`;
        const { data: url } = await apartmentService.uploadFile(img, path, {
          onUploadProgress: (p) => setUploadProgress((p2) => ({ ...p2, [fileKey]: p })),
        });

        if (url) {
          imageUrls.push(url);
          results[fileKey] = "success";
        } else {
          results[fileKey] = "error";
          hasErrors = true;
        }
        setUploadResults({ ...results });
      }

      let videoUrl = null;
      if (form.video) {
        setUploadProgress((p) => ({ ...p, video: 0 }));
        const vPath = `${user.id}/${Date.now()}_video_${form.video.name}`;
        const { data: vUrl } = await apartmentService.uploadFile(form.video, vPath, {
          onUploadProgress: (p) => setUploadProgress((p2) => ({ ...p2, video: p })),
        });
        if (vUrl) {
          videoUrl = vUrl;
          results.video = "success";
        } else {
          results.video = "error";
          hasErrors = true;
        }
        setUploadResults({ ...results });
      }

      const allImages = [...existingUrls, ...imageUrls];

      const apartmentData = {
        owner_id: user.id,
        title: form.title,
        description: form.description,
        apartment_type: form.apartment_type,
        neighborhood: form.neighborhood,
        city: "Fayoum",
        address: form.address,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        area: form.area ? Number(form.area) : null,
        price: Number(form.price),
        amenities: form.amenities,
        images: allImages,
        video_url: videoUrl,
        wifi: form.amenities.includes("واي فاي"),
        latitude: form.latitude,
        longitude: form.longitude,
      };

      const { error } = await apartmentService.create(apartmentData);
      if (error) {
        toast.error("حدث خطأ أثناء إضافة العقار");
        return;
      }

      clearDraft();
      if (hasErrors) {
        toast.success("تم إرسال العقار لكن بعض الصور فشلت في الرفع.");
      } else {
        toast.success("تم إرسال العقار بنجاح! سيتم مراجعته من قبل الإدارة.");
      }
      setTimeout(() => navigate("/broker/apartments"), 1500);
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
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
                    <label className="form-label fw-semibold small">عنوان الإعلان <span style={{ color: "var(--danger, #dc3545)" }}>*</span></label>
                    <input type="text" className="form-control owner-input" style={inputStyle} placeholder="مثال: شقة مؤثثة بالقرب من جامعة الفيوم" value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={150} />
                    {stepErrors[1] && form.title.trim().length < 5 && <small className="d-block mt-1" style={{ color: "var(--danger, #dc3545)" }}>{stepErrors[1]}</small>}
                  </div>
                  <div>
                    <label className="form-label fw-semibold small">وصف العقار <span style={{ color: "var(--danger, #dc3545)" }}>*</span></label>
                    <textarea className="form-control owner-input" style={inputStyle} rows={4} placeholder="اكتب وصفاً تفصيلياً للعقار والمرافق المحيطة..." value={form.description} onChange={(e) => update("description", e.target.value)} />
                    <small className="d-block mt-1" style={{ color: "var(--on-surface-variant)", fontSize: "0.75rem" }}>{form.description.length}/2000 — {form.description.trim().length < 20 ? "20 حرف على الأقل مطلوب" : "✓"}</small>
                  </div>
                  <div>
                    <label className="form-label fw-semibold small">نوع العقار <span style={{ color: "var(--danger, #dc3545)" }}>*</span></label>
                    <select className="form-select" style={inputStyle} value={form.apartment_type} onChange={(e) => update("apartment_type", e.target.value)}>
                      {apartmentTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="owner-section-card p-4 p-md-5">
                <h3 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: "1rem", color: "var(--on-surface, #1A1D23)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 20 }}>tips_and_updates</span>
                  نصائح لكتابة إعلان جذاب
                </h3>
                <ul className="d-flex flex-column gap-2 mb-0" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>
                  <li className="d-flex align-items-start gap-2"><span className="material-symbols-outlined mt-1" style={{ fontSize: 16, color: "var(--primary)" }}>check</span>اكتب عنواناً واضحاً ومركزاً</li>
                  <li className="d-flex align-items-start gap-2"><span className="material-symbols-outlined mt-1" style={{ fontSize: 16, color: "var(--primary)" }}>check</span>اذكر المميزات الرئيسية للعقار</li>
                  <li className="d-flex align-items-start gap-2"><span className="material-symbols-outlined mt-1" style={{ fontSize: 16, color: "var(--primary)" }}>check</span>اذكر القرب من الجامعة أو الخدمات</li>
                  <li className="d-flex align-items-start gap-2"><span className="material-symbols-outlined mt-1" style={{ fontSize: 16, color: "var(--primary)" }}>check</span>استخدم لغة واضحة ومفهومة</li>
                </ul>
              </div>
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
            <p className="text-muted small mb-4">حدد موقع العقار بدقة بالضغط على الخريطة. سيتحرك الدبوس تلقائياً إلى النقطة المحددة.</p>
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label fw-semibold small">الحي <span style={{ color: "var(--danger, #dc3545)" }}>*</span></label>
                    <select className="form-select" style={inputStyle} value={form.neighborhood} onChange={(e) => handleNeighborhoodChange(e.target.value)}>
                      {neighborhoods.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label fw-semibold small">العنوان التفصيلي <span style={{ color: "var(--danger, #dc3545)" }}>*</span></label>
                    <input type="text" className="form-control" style={inputStyle} placeholder="اسم الشارع، رقم المبنى، علامة مميزة" value={form.address} onChange={(e) => update("address", e.target.value)} />
                    {stepErrors[2] && <small className="d-block mt-1" style={{ color: "var(--danger, #dc3545)" }}>{stepErrors[2]}</small>}
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">خط العرض</label>
                      <input type="text" className="form-control form-control-sm bg-light" readOnly value={form.latitude?.toFixed(6) || ""} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small text-muted">خط الطول</label>
                      <input type="text" className="form-control form-control-sm bg-light" readOnly value={form.longitude?.toFixed(6) || ""} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="rounded-4 overflow-hidden border" style={{ height: 320, position: "relative", zIndex: 1 }}>
                  <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
                    <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={mapCenter} />
                    <MapEvents setCoords={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />
                    <ChangeMapView center={mapCenter} />
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>
        );
      }

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
                  <div>
                    <label className="form-label fw-semibold small text-muted">السعر الشهري (ج.م) <span style={{ color: "var(--danger, #dc3545)" }}>*</span></label>
                    <input type="number" className="form-control owner-input" style={inputStyle} placeholder="مثال: 2500" value={form.price} onChange={(e) => update("price", e.target.value)} min={500} />
                    {stepErrors[3] && <small className="d-block mt-1" style={{ color: "var(--danger, #dc3545)" }}>{stepErrors[3]}</small>}
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">الغرف</label>
                      <input type="number" className="form-control owner-input" style={inputStyle} min={1} max={10} value={form.bedrooms} onChange={(e) => update("bedrooms", Number(e.target.value))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">الحمامات</label>
                      <input type="number" className="form-control owner-input" style={inputStyle} min={1} max={5} value={form.bathrooms} onChange={(e) => update("bathrooms", Number(e.target.value))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">المساحة (م²)</label>
                      <input type="number" className="form-control owner-input" style={inputStyle} placeholder="120" value={form.area} onChange={(e) => update("area", e.target.value)} />
                    </div>
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
            <p className="text-muted small mb-4">اختر المرافق المتاحة في العقار (اختياري)</p>
            <div className="row g-3">
              {amenitiesList.map((item) => {
                const selected = form.amenities.includes(item.label);
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
                      type="button"
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

            <div
              className={`owner-upload-zone p-5 text-center mb-4 ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                if (files.length) handleImagesAdd(files);
              }}
            >
              <span className="material-symbols-outlined d-block mb-3" style={{ fontSize: 48, color: "var(--primary)" }}>cloud_upload</span>
              <h5 className="fw-bold" style={{ color: "var(--on-surface, #1A1D23)" }}>اسحب الصور هنا أو اضغط للتحميل</h5>
              <p className="text-muted small mb-3">بحد أقصى 10 صور، كل صورة أقل من 5 ميجابايت</p>
              <label className="btn btn-primary px-4 owner-btn-lift" style={{ borderRadius: "var(--radius-md, 12px)" }}>
                اختيار الصور
                <input type="file" className="d-none" multiple accept="image/*" onChange={(e) => handleImagesAdd(Array.from(e.target.files))} />
              </label>
            </div>

            {form.images.length > 0 && (
              <div className="d-flex flex-wrap gap-3 mb-4">
                {form.images.map((img, i) => {
                  const key = `img_${i}`;
                  const progress = uploadProgress[key];
                  const result = uploadResults[key];
                  const isUploading = loading && progress !== undefined && progress < 100;
                  const isSuccess = result === "success";
                  const isError = result === "error";

                  return (
                    <div key={i} className="position-relative rounded-3 overflow-hidden" style={{ width: 120, height: 90 }}>
                      <img src={img.url || URL.createObjectURL(img)} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                      <button className="position-absolute top-0 start-0 btn btn-sm p-0 text-white" style={{ background: "rgba(0,0,0,0.5)", width: 22, height: 22, fontSize: 14 }} onClick={() => update("images", form.images.filter((_, j) => j !== i))} type="button">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      </button>
                      {i === 0 && !isUploading && <span className="position-absolute bottom-0 start-0 px-2 text-white" style={{ background: "var(--primary)", fontSize: 10, fontWeight: 700 }}>رئيسية</span>}
                      {isUploading && (
                        <div className="position-absolute bottom-0 start-0 end-0">
                          <div className="upload-progress-bar">
                            <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}
                      {isSuccess && (
                        <div className="position-absolute top-0 end-0 d-flex align-items-center justify-content-center" style={{ width: 20, height: 20, background: "var(--success, #10b981)", borderRadius: "0 0 0 6px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: "white", fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                      )}
                      {isError && (
                        <div className="position-absolute top-0 end-0 d-flex align-items-center justify-content-center" style={{ width: 20, height: 20, background: "var(--danger, #dc3545)", borderRadius: "0 0 0 6px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: "white" }}>close</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {stepErrors[5] && form.images.length === 0 && (
              <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4" style={{ background: "rgba(220,53,69,0.06)", border: "1px solid rgba(220,53,69,0.15)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--danger, #dc3545)" }}>error</span>
                <small style={{ color: "var(--danger, #dc3545)" }}>{stepErrors[5]}</small>
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--border, #DDD8D0)", paddingTop: 24 }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 22 }}>videocam</span>
                <div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: "0.95rem", color: "var(--on-surface, #1A1D23)" }}>فيديو العقار</h6>
                  <p className="mb-0 small" style={{ color: "var(--on-surface-variant, #5A6370)" }}>أضف فيديو لعرض العقار (اختياري، حد أقصى 100 ميجابايت)</p>
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
                  <p className="mb-0 small" style={{ color: "var(--on-surface-variant, #5A6370)" }}>MP4، MOV، WEBM — حد أقصى 100 ميجابايت</p>
                  <input ref={videoInputRef} type="file" className="d-none" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => handleVideoChange(e.target.files?.[0])} />
                </div>
              ) : (
                <div className="position-relative rounded-4 overflow-hidden" style={{ background: "#000" }}>
                  <video src={form.videoPreview} controls playsInline className="w-100" style={{ maxHeight: 300, borderRadius: "var(--radius-lg, 18px)" }} />
                  <button
                    className="position-absolute top-3 start-3 btn btn-sm d-flex align-items-center justify-content-center rounded-circle"
                    style={{ width: 32, height: 32, background: "rgba(0,0,0,0.6)", color: "white" }}
                    onClick={handleRemoveVideo}
                    type="button"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                  <div className="position-absolute bottom-3 end-3 d-flex align-items-center gap-2">
                    {uploadProgress.video !== undefined && loading && (
                      <div className="d-flex align-items-center gap-1 video-meta-pill">
                        <span className="spinner-border spinner-border-sm" role="status" style={{ width: 12, height: 12 }} />
                        {uploadProgress.video}%
                      </div>
                    )}
                    <div className="video-meta-pill">
                      {apartmentService.formatFileSize(form.video?.size)}
                    </div>
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
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
                    <p className="small text-muted mb-1">النوع</p>
                    <p className="fw-bold mb-0">{apartmentTypes.find((t) => t.value === form.apartment_type)?.label}</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
                    <p className="small text-muted mb-1">الموقع</p>
                    <p className="fw-bold mb-0">{neighborhoods.find((n) => n.value === form.neighborhood)?.label}، الفيوم</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
                    <p className="small text-muted mb-1">الغرف</p>
                    <p className="fw-bold mb-0">{form.bedrooms}</p>
                  </div>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
                    <p className="small text-muted mb-1">المساحة</p>
                    <p className="fw-bold mb-0">{form.area || "—"} {form.area ? "م²" : ""}</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: "rgba(107,144,128,0.08)" }}>
                    <p className="small text-muted mb-1">السعر</p>
                    <p className="fw-bold mb-0" style={{ color: "var(--primary)", fontSize: "1.1rem" }}>{form.price ? `${Number(form.price).toLocaleString("ar-EG")} ج.م / شهر` : "—"}</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
                    <p className="small text-muted mb-1">الصور</p>
                    <p className="fw-bold mb-0">{form.images.length} صورة</p>
                  </div>
                </div>
              </div>
              {form.videoPreview && (
                <div className="p-3 rounded-3" style={{ background: "rgba(107,144,128,0.05)" }}>
                  <p className="small text-muted mb-1">الفيديو</p>
                  <p className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "var(--primary)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>videocam</span>
                    تم إرفاق فيديو — {apartmentService.formatDuration()} | {apartmentService.formatFileSize(form.video?.size)}
                  </p>
                </div>
              )}
              {form.amenities.length > 0 && (
                <div className="p-3 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
                  <p className="small text-muted mb-2">المرافق ({form.amenities.length})</p>
                  <div className="d-flex flex-wrap gap-2">
                    {form.amenities.map((label) => {
                      const a = amenitiesList.find((am) => am.label === label);
                      return (
                        <span key={label} className="px-2 py-1 rounded-pill" style={{ background: "rgba(107,144,128,0.1)", color: "var(--primary)", fontSize: "0.75rem" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginLeft: 4 }}>{a?.icon}</span>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isUnverified = profile && profile.verification_status !== "approved";

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
                <button className="btn py-2 px-4 fw-bold" style={{ border: "2px solid var(--primary, #6B9080)", color: "var(--primary, #6B9080)", borderRadius: "var(--radius-md, 12px)", background: "transparent" }} onClick={() => navigate("/broker/dashboard")}>
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
    <div className="d-flex flex-column" style={{ minHeight: "calc(100vh - 68px)" }}>
      <div className="flex-grow-1">
        {!checkingSub && !canAdd && (
          <div className="container py-4">
            <div className="owner-section-card p-4 text-center">
              <span className="material-symbols-outlined mb-3" style={{ fontSize: 48, color: "var(--primary)" }}>card_membership</span>
              <h5 className="fw-bold mb-2" style={{ color: "var(--on-surface, #1A1D23)" }}>لقد وصلت إلى الحد الأقصى للعقارات المسموح بها في باقتك الحالية</h5>
              <p style={{ color: "var(--on-surface-variant, #5A6370)", fontSize: "0.9rem", maxWidth: 500, margin: "0 auto" }}>
                باقتك الحالية ({planLimits.label}) تسمح بـ {planLimits.maxApartments === Infinity ? "عدد غير محدود من" : `${planLimits.maxApartments}`} العقارات.
                لديك حالياً {apartmentCount} عقار. قم بترقية باقتك لإضافة المزيد من العقارات.
              </p>
              <button
                className="btn px-5 py-3 fw-bold mt-3 owner-btn-lift"
                style={{ background: "var(--primary)", color: "white", borderRadius: "var(--radius-md, 12px)", fontSize: "1rem" }}
                onClick={() => navigate("/subscriptions")}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: "middle", marginLeft: 8 }}>upgrade</span>
                ترقية الباقة
              </button>
            </div>
          </div>
        )}

        <div className="p-3 p-md-4" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="mb-4">
            <h1 className="fw-bold mb-1" style={{ fontSize: "1.5rem", color: "var(--on-surface, #1A1D23)" }}>إضافة عقار جديد</h1>
            <p className="mb-0" style={{ color: "var(--on-surface-variant, #5A6370)" }}>أكمل الخطوات التالية لإدراج عقارك في المنصة</p>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-4 p-3 rounded-4" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>تقدم ملء النموذج</span>
              <span className="fw-bold" style={{ fontSize: "0.85rem", color: "var(--primary)" }}>{overallProgress}%</span>
            </div>
            <div className="progress-animated progress-striped" style={{ height: 6, borderRadius: 3, background: "var(--surface-container-low, #F5F3EE)" }}>
              <div
                className="progress-bar-animated"
                style={{
                  width: `${overallProgress}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: overallProgress === 100 ? "var(--success, #10b981)" : "var(--primary)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            {overallProgress === 100 && (
              <p className="mt-2 mb-0 d-flex align-items-center gap-1" style={{ fontSize: "0.8rem", color: "var(--success, #10b981)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                النموذج مكتمل — يمكنك المراجعة والإرسال
              </p>
            )}
          </div>

          {/* Wizard Steps */}
          <div className="d-flex align-items-center gap-2 mb-4 overflow-x-auto pb-3">
            {steps.map((step, i) => {
              const completion = getStepCompletion(step.id);
              return (
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
                        background: step.id < currentStep ? "var(--success, #10b981)" : step.id === currentStep ? "var(--primary)" : "white",
                        color: step.id <= currentStep ? "white" : "var(--on-surface-variant, #5A6370)",
                        border: `2px solid ${step.id < currentStep ? "var(--success, #10b981)" : step.id === currentStep ? "var(--primary)" : "var(--border, #DDD8D0)"}`,
                        transition: "all 0.25s ease",
                      }}
                    >
                      {step.id < currentStep ? <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check</span> : step.id}
                    </div>
                    <span className="text-nowrap" style={{ fontSize: "0.7rem", fontWeight: step.id === currentStep ? 700 : 500, color: step.id <= currentStep ? "var(--primary)" : "var(--on-surface-variant, #5A6370)" }}>
                      {step.label}
                    </span>
                    {step.id < currentStep && completion.total > 0 && (
                      <span style={{ fontSize: "0.65rem", color: "var(--success, #10b981)", fontWeight: 600 }}>
                        {completion.done}/{completion.total}
                      </span>
                    )}
                    {step.id === currentStep && completion.total > 0 && (
                      <span style={{ fontSize: "0.65rem", color: "var(--primary)", fontWeight: 600 }}>
                        {completion.done}/{completion.total}
                      </span>
                    )}
                  </div>
                  {i < steps.length - 1 && <div style={{ width: 30, height: 2, background: step.id < currentStep ? "var(--success, #10b981)" : "var(--border, #DDD8D0)", transition: "background 0.25s ease" }} />}
                </div>
              );
            })}
          </div>

          {stepErrors[currentStep] && (
            <div className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4" style={{ background: "rgba(220,53,69,0.06)", border: "1px solid rgba(220,53,69,0.15)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--danger, #dc3545)" }}>error</span>
              <span style={{ color: "var(--danger, #dc3545)", fontSize: "0.9rem", fontWeight: 500 }}>{stepErrors[currentStep]}</span>
            </div>
          )}

          {renderStepContent()}

          <div className="mt-4 p-3 p-md-4 rounded-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3" style={{ background: "var(--white, #fff)", boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,0.05))" }}>
            <button
              className="btn d-flex align-items-center gap-2 px-4"
              style={{ border: "1px solid var(--border, #DDD8D0)", color: "var(--on-surface-variant, #5A6370)", borderRadius: "var(--radius-md, 12px)" }}
              onClick={goPrev}
              disabled={currentStep === 1}
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              رجوع
            </button>
            {currentStep < 6 ? (
              <button
                className="btn d-flex align-items-center gap-2 px-5 py-2 text-white fw-bold"
                style={{ background: "var(--primary, #6B9080)", borderRadius: "var(--radius-md, 12px)", fontSize: "0.95rem" }}
                onClick={goNext}
                type="button"
              >
                الخطوة التالية
                <span className="material-symbols-outlined" style={{ fontSize: 18, transform: "rotate(180deg)" }}>arrow_right_alt</span>
              </button>
            ) : (
              <button
                className="btn d-flex align-items-center gap-2 px-5 py-2 text-white fw-bold sub-btn"
                style={{ background: "var(--success, #6B9080)", borderRadius: "var(--radius-md, 12px)", fontSize: "0.95rem" }}
                onClick={handleSubmit}
                disabled={loading || !canAdd}
                type="button"
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> جاري الإرسال...</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span> إرسال للمراجعة</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrokerAddApartment;
