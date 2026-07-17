import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { apartmentService } from "../../services/apartmentService";
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
  useMapEvents({
    click(e) {
      setCoords(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

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

const inputStyle = { borderRadius: "var(--radius-md)", borderColor: "var(--border)", background: "var(--surface-container-low, #f0f3ff)" };

function EditApartment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [existingVideo, setExistingVideo] = useState(null);
  const [newVideo, setNewVideo] = useState(null);
  const [newVideoPreview, setNewVideoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    const loadApartment = async () => {
      const { data } = await apartmentService.getById(id);
      if (!data || data.owner_id !== user?.id) {
        navigate("/owner/apartments");
        return;
      }
      setForm({
        title: data.title || "",
        description: data.description || "",
        apartment_type: data.apartment_type || "apartment",
        neighborhood: data.neighborhood || "Dallah",
        address: data.address || "",
        bedrooms: data.bedrooms || 1,
        bathrooms: data.bathrooms || 1,
        area: data.area || "",
        price: data.price || "",
        amenities: data.amenities || [],
        latitude: data.latitude || 29.31,
        longitude: data.longitude || 30.98,
      });
      setExistingImages(data.images || []);
      setExistingVideo(data.video_url || null);
      setLoading(false);
    };
    if (user) loadApartment();
  }, [id, user, navigate]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleNeighborhoodChange = (val) => {
    const coords = neighborhoodCoords[val] || [29.31, 30.98];
    setForm((prev) => ({
      ...prev,
      neighborhood: val,
      latitude: coords[0],
      longitude: coords[1],
    }));
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
    if (file.size > 50 * 1024 * 1024) {
      toast.error("حجم الفيديو يتجاوز الحد الأقصى (50 ميجابايت)");
      return;
    }
    setNewVideo(file);
    setNewVideoPreview(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
    setNewVideo(null);
    setNewVideoPreview(null);
    setExistingVideo(null);
  };

  const handleSubmit = async () => {
    if (!user || !form) return;
    setSaving(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) { clearInterval(progressInterval); return 95; }
        return prev + Math.random() * 15;
      });
    }, 200);

    const imageUrls = [...existingImages];
    for (const file of newImages) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { data: url } = await apartmentService.uploadImage(file, path);
      if (url) imageUrls.push(url);
    }

    let videoUrl = existingVideo;
    if (newVideo) {
      const vPath = `${user.id}/${Date.now()}_video_${newVideo.name}`;
      const { data: vUrl } = await apartmentService.uploadImage(newVideo, vPath);
      if (vUrl) videoUrl = vUrl;
    } else if (!existingVideo && !newVideo) {
      videoUrl = null;
    }

    const updates = {
      title: form.title,
      description: form.description,
      apartment_type: form.apartment_type,
      neighborhood: form.neighborhood,
      address: form.address,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      area: form.area ? Number(form.area) : null,
      price: Number(form.price),
      amenities: form.amenities,
      images: imageUrls,
      video_url: videoUrl,
      latitude: form.latitude,
      longitude: form.longitude,
    };

    const { error } = await apartmentService.update(id, updates);
    clearInterval(progressInterval);
    setProgress(100);

    if (error) {
      setSaving(false);
      setProgress(0);
      toast.error("حدث خطأ أثناء حفظ التعديلات");
      return;
    }

    toast.success("تم حفظ التعديلات بنجاح");
    setTimeout(() => { setSaving(false); setProgress(0); navigate("/owner/apartments"); }, 800);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="spinner-border" style={{ color: "var(--primary)" }} role="status" />
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="d-flex flex-column" style={{ minHeight: "calc(100vh - 72px)" }}>
      <div className="flex-grow-1">
        <div className="p-3 p-md-4" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="mb-4">
            <h1 className="fw-bold mb-1" style={{ fontSize: "1.5rem" }}>تعديل العقار</h1>
            <p className="mb-0" style={{ color: "var(--on-surface-variant)" }}>تعديل بيانات العقار #{id}</p>
          </div>

          <div className="row g-4">
            {/* Basic Info */}
            <div className="col-lg-7">
              <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm" style={{ border: "1px solid rgba(208,208,208,0.3)" }}>
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>info</span>
                  المعلومات الأساسية
                </h3>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label fw-semibold small">عنوان الإعلان</label>
                    <input type="text" className="form-control" style={inputStyle} value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={150} />
                  </div>
                  <div>
                    <label className="form-label fw-semibold small">وصف العقار</label>
                    <textarea className="form-control" style={inputStyle} rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} />
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

            {/* Location */}
            <div className="col-lg-5">
              <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm mb-4" style={{ border: "1px solid rgba(208,208,208,0.3)" }}>
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>map</span>
                  الموقع
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
                    <input type="text" className="form-control form-control-sm" style={inputStyle} value={form.address} onChange={(e) => update("address", e.target.value)} />
                  </div>
                  <div className="mt-2">
                    <label className="form-label fw-semibold small text-muted">الموقع الجغرافي (اضغط على الخريطة لتعديل العلامة)</label>
                    <div className="rounded-3 overflow-hidden border" style={{ height: 200, position: "relative", zIndex: 1 }}>
                      <MapContainer center={[form.latitude || 29.31, form.longitude || 30.98]} zoom={15} style={{ height: "100%", width: "100%" }}>
                        <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[form.latitude || 29.31, form.longitude || 30.98]} />
                        <MapEvents setCoords={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />
                        <ChangeMapView center={[form.latitude || 29.31, form.longitude || 30.98]} />
                      </MapContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="col-lg-7">
              <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm" style={{ border: "1px solid rgba(208,208,208,0.3)" }}>
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>home</span>
                  تفاصيل العقار
                </h3>
                <div className="d-flex flex-column gap-3">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">الغرف</label>
                      <input type="number" className="form-control" style={inputStyle} min={1} value={form.bedrooms} onChange={(e) => update("bedrooms", Number(e.target.value))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">الحمامات</label>
                      <input type="number" className="form-control" style={inputStyle} min={1} value={form.bathrooms} onChange={(e) => update("bathrooms", Number(e.target.value))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small text-muted">المساحة (م²)</label>
                      <input type="number" className="form-control" style={inputStyle} value={form.area} onChange={(e) => update("area", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label fw-semibold small text-muted">السعر الشهري (ج.م)</label>
                    <input type="number" className="form-control" style={inputStyle} value={form.price} onChange={(e) => update("price", e.target.value)} required />
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="col-12">
              <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm" style={{ border: "1px solid rgba(208,208,208,0.3)" }}>
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>widgets</span>
                  المرافق
                </h3>
                <div className="row g-3">
                  {amenitiesList.map((item) => {
                    const selected = form.amenities.includes(item.label);
                    return (
                      <div key={item.label} className="col-6 col-md-4 col-lg-3">
                        <button className="w-100 d-flex flex-column align-items-center gap-2 p-3 rounded-3 border text-center" style={{ background: selected ? "rgba(107,144,128,0.08)" : "var(--surface-container-low, #f0f3ff)", borderColor: selected ? "var(--primary)" : "var(--border)", fontWeight: selected ? 600 : 400 }} onClick={() => toggleAmenity(item.label)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{item.icon}</span>
                          <span style={{ fontSize: "0.8rem" }}>{item.label}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="col-12">
              <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm" style={{ border: "1px solid rgba(208,208,208,0.3)" }}>
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>photo_library</span>
                  الصور
                </h3>
                {existingImages.length > 0 && (
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    {existingImages.map((url, i) => (
                      <div key={i} className="position-relative rounded-3 overflow-hidden" style={{ width: 120, height: 90 }}>
                        <img src={url} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                        <button className="position-absolute top-0 start-0 btn btn-sm p-0 text-white" style={{ background: "rgba(220,53,69,0.8)", width: 22, height: 22, fontSize: 14 }} onClick={() => setExistingImages((prev) => prev.filter((_, j) => j !== i))}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                        {i === 0 && <span className="position-absolute bottom-0 start-0 px-2 text-white" style={{ background: "var(--primary)", fontSize: 10, fontWeight: 700 }}>رئيسية</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className={`border border-2 border-dashed rounded-4 p-5 text-center mb-3 ${dragOver ? "border-success" : ""}`}
                  style={{ borderColor: dragOver ? "var(--success, #198754)" : "var(--primary)", background: dragOver ? "rgba(25,135,84,0.06)" : "rgba(107,144,128,0.03)", cursor: "pointer", transition: "all 0.2s" }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")); if (files.length) setNewImages((prev) => [...prev, ...files].slice(0, 5 - existingImages.length)); }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined d-block mb-3" style={{ fontSize: 48, color: dragOver ? "var(--success, #198754)" : "var(--primary)" }}>cloud_upload</span>
                  <h5 className="fw-bold mb-1" style={{ fontSize: "1rem" }}>اسحب الصور هنا أو اضغط للتحميل</h5>
                  <p className="text-muted small mb-3">بحد أقصى {5 - existingImages.length} صور إضافية</p>
                  <input ref={fileInputRef} type="file" className="d-none" multiple accept="image/*" onChange={(e) => setNewImages((prev) => [...prev, ...Array.from(e.target.files)].slice(0, 5 - existingImages.length))} />
                </div>
                {newImages.length > 0 && (
                  <div className="d-flex flex-wrap gap-3 mt-3">
                    {newImages.map((img, i) => (
                      <div key={i} className="position-relative rounded-3 overflow-hidden" style={{ width: 120, height: 90 }}>
                        <img src={URL.createObjectURL(img)} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                        <button className="position-absolute top-0 start-0 btn btn-sm p-0 text-white" style={{ background: "rgba(0,0,0,0.5)", width: 22, height: 22, fontSize: 14 }} onClick={() => setNewImages((prev) => prev.filter((_, j) => j !== i))}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video */}
            <div className="col-12">
              <div className="owner-section-card p-4 p-md-5">
                <h3 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>videocam</span>
                  فيديو العقار
                </h3>

                {(existingVideo && !newVideo) ? (
                  <div className="position-relative rounded-4 overflow-hidden" style={{ background: "#000" }}>
                    <video src={existingVideo} controls className="w-100" style={{ maxHeight: 300, borderRadius: "var(--radius-lg, 18px)" }} />
                    <button
                      className="position-absolute top-3 start-3 btn btn-sm d-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: 32, height: 32, background: "rgba(0,0,0,0.6)", color: "white" }}
                      onClick={handleRemoveVideo}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  </div>
                ) : newVideoPreview ? (
                  <div className="position-relative rounded-4 overflow-hidden" style={{ background: "#000" }}>
                    <video src={newVideoPreview} controls className="w-100" style={{ maxHeight: 300, borderRadius: "var(--radius-lg, 18px)" }} />
                    <button
                      className="position-absolute top-3 start-3 btn btn-sm d-flex align-items-center justify-content-center rounded-circle"
                      style={{ width: 32, height: 32, background: "rgba(0,0,0,0.6)", color: "white" }}
                      onClick={handleRemoveVideo}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className="owner-upload-zone p-4 text-center"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: 36, color: "var(--primary)" }}>videocam</span>
                    <p className="fw-bold mb-1" style={{ fontSize: "0.88rem", color: "var(--on-surface, #1A1D23)" }}>اضغط لاختيار فيديو</p>
                    <p className="mb-0 small" style={{ color: "var(--on-surface-variant, #5A6370)" }}>MP4، MOV، WEBM — حد أقصى 50 ميجابايت</p>
                    <input ref={videoInputRef} type="file" className="d-none" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => handleVideoChange(e.target.files?.[0])} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-4 p-3 p-md-4 rounded-4" style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            {saving && (
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="fw-semibold" style={{ color: "var(--on-surface-variant)" }}>جاري رفع البيانات...</small>
                  <small className="fw-bold" style={{ color: "var(--primary)" }}>{Math.min(Math.round(progress), 99)}%</small>
                </div>
                <div className="rounded-3 overflow-hidden" style={{ height: 6, background: "var(--border)" }}>
                  <div className="h-100 rounded-3" style={{ width: `${Math.min(progress, 100)}%`, background: "linear-gradient(90deg, var(--primary), var(--success, #198754))", transition: "width 0.3s ease" }} />
                </div>
              </div>
            )}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <button className="btn d-flex align-items-center gap-2 px-4" style={{ border: "1px solid var(--border)", color: "var(--on-surface-variant)" }} onClick={() => navigate("/owner/apartments")}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
              إلغاء
            </button>
            <button className="btn d-flex align-items-center gap-2 px-4 text-white fw-bold" style={{ background: "var(--primary)" }} onClick={handleSubmit} disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm" /> جاري الحفظ...</> : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span> حفظ التعديلات</>}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditApartment;
