import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apartmentService } from "../../services/apartmentService";
import { reviewService } from "../../services/reviewService";
import { useAuth } from "../../hooks/useAuth";
import Lightbox from "../../components/ui/Lightbox";
import toast from "react-hot-toast";

function OwnerApartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  useAuth();
  const [apt, setApt] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await apartmentService.getById(id);
      if (data) {
        setApt(data);
        const { data: revs } = await reviewService.getByApartment(id);
        setReviews(revs || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    const { error } = await apartmentService.delete(id);
    if (error) {
      toast.error("حدث خطأ أثناء الحذف");
    } else {
      toast.success("تم حذف العقار بنجاح");
      navigate("/owner/apartments");
    }
    setShowDelete(false);
  };

  const formatPrice = (p) => Number(p).toLocaleString("ar-EG");

  const mediaItems = useMemo(() => {
    if (!apt) return [];
    const items = (apt.images || []).map((url) => ({ src: url, type: "image" }));
    if (apt.video_url) {
      items.push({ src: apt.video_url, type: "video", poster: apt.images?.[0] });
    }
    return items;
  }, [apt]);

  if (loading) {
    return (
      <div className="d-flex flex-column gap-4">
        <div className="placeholder-glow">
          <span className="placeholder col-4 rounded-2 mb-3" style={{ height: 32 }} />
          <span className="placeholder col-6 rounded-2" style={{ height: 20 }} />
        </div>
        <div className="placeholder-glow"><div className="placeholder col-12 rounded-4" style={{ height: 400 }} /></div>
      </div>
    );
  }

  if (!apt) {
    return (
      <div className="text-center py-5">
        <span className="material-symbols-outlined text-muted" style={{ fontSize: 64 }}>apartment</span>
        <p className="text-muted mt-3">العقار غير موجود</p>
        <button className="btn btn-primary" onClick={() => navigate("/owner/apartments")}>العودة للعقارات</button>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <h1 className="fw-bold mb-0" style={{ fontSize: "1.4rem" }}>{apt.title}</h1>
            <span className="px-2 py-1 rounded-pill" style={{ background: apt.status === "approved" ? "rgba(16,185,129,0.12)" : "rgba(233,162,59,0.12)", color: apt.status === "approved" ? "var(--success)" : "var(--warning)", fontSize: "0.75rem", fontWeight: 600 }}>
              {apt.status === "approved" ? "نشط" : apt.status === "pending" ? "قيد المراجعة" : apt.status === "rejected" ? "مرفوض" : "مخفى"}
            </span>
          </div>
          <p className="mb-0" style={{ color: "var(--on-surface-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>location_on</span>
            {apt.neighborhood}، {apt.city}
          </p>
        </div>
        <div className="text-md-end">
          <p className="fw-bold mb-0" style={{ fontSize: "1.4rem", color: "var(--primary)" }}>
            {formatPrice(apt.price)} ج.م
            <span className="small fw-normal" style={{ color: "var(--on-surface-variant)" }}> / شهرياً</span>
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="d-flex flex-column gap-4">
            {/* Gallery + Video (unified) */}
            <div className="d-grid gap-2 rounded-4 overflow-hidden shadow-sm" style={{ gridTemplateColumns: apt.images?.length > 1 ? "2fr 1fr" : "1fr", gridTemplateRows: "300px 200px" }}>
              <div
                className="rounded-4 overflow-hidden gallery-grid-item"
                style={{ gridRow: apt.images?.length > 1 ? "span 2" : "span 1", gridColumn: "span 1" }}
                onClick={() => setLightboxIndex(0)}
              >
                <img src={apt.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"} alt={apt.title} className="w-100 h-100" style={{ objectFit: "cover" }} />
                <div className="gallery-grid-overlay">
                  <span className="material-symbols-outlined" style={{ color: "white", fontSize: 28 }}>fullscreen</span>
                </div>
              </div>
              {apt.images?.slice(1, 3).map((img, i) => (
                <div
                  key={i}
                  className="rounded-4 overflow-hidden gallery-grid-item"
                  onClick={() => setLightboxIndex(i + 1)}
                >
                  <img src={img} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                  <div className="gallery-grid-overlay">
                    <span className="material-symbols-outlined" style={{ color: "white", fontSize: 28 }}>fullscreen</span>
                  </div>
                </div>
              ))}
              {apt.video_url && apt.images?.length <= 2 && (
                <div
                  className="rounded-4 overflow-hidden gallery-grid-item"
                  style={{ background: "#000" }}
                  onClick={() => setLightboxIndex(mediaItems.length - 1)}
                >
                  <div className="owner-video-container">
                    <video src={apt.video_url} playsInline preload="metadata" poster={apt.images?.[0]} />
                  </div>
                  <div className="gallery-grid-overlay">
                    <span className="material-symbols-outlined" style={{ color: "white", fontSize: 28 }}>play_circle</span>
                  </div>
                </div>
              )}
            </div>

            {apt.video_url && apt.images?.length > 2 && (
              <div
                className="owner-video-container"
                onClick={() => setLightboxIndex(mediaItems.length - 1)}
                style={{ cursor: "pointer" }}
              >
                <video src={apt.video_url} playsInline preload="metadata" poster={apt.images?.[0]} />
                <div className="gallery-grid-overlay">
                  <span className="material-symbols-outlined" style={{ color: "white", fontSize: 32 }}>play_circle</span>
                </div>
              </div>
            )}

            <div className="d-flex align-items-center gap-3">
              {(apt.images?.length > 0 || apt.video_url) && (
                <button
                  className="btn btn-sm d-flex align-items-center gap-1 rounded-pill"
                  style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)", fontSize: "0.8rem" }}
                  onClick={() => setLightboxIndex(0)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_library</span>
                  {apt.images?.length || 0} صور{(apt.video_url) ? ` + فيديو` : ""}
                </button>
              )}
            </div>

            <div className="row g-3">
              {[
                { icon: "visibility", label: "المشاهدات", value: apt.views || 0, iconBg: "rgba(45,106,79,0.08)", iconColor: "var(--primary)" },
                { icon: "bed", label: "الغرف", value: apt.bedrooms || 0, iconBg: "rgba(64,145,108,0.08)", iconColor: "var(--tertiary)" },
                { icon: "shower", label: "الحمامات", value: apt.bathrooms || 0, iconBg: "rgba(45,106,79,0.08)", iconColor: "var(--primary)" },
              ].map((stat, i) => (
                <div key={i} className="col-md-4">
                  <div className="bg-white p-3 rounded-4 shadow-sm h-100" style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 40, height: 40, background: stat.iconBg, color: stat.iconColor }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{stat.icon}</span>
                      </div>
                      <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>{stat.label}</p>
                    </div>
                    <h4 className="fw-bold mb-0">{stat.value.toLocaleString("ar-EG")}</h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
              <h3 className="fw-bold mb-3" style={{ fontSize: "1.1rem" }}>وصف العقار</h3>
              <p className="mb-0" style={{ color: "var(--on-surface-variant)", lineHeight: 1.8 }}>{apt.description || "لا يوجد وصف متاح لهذا العقار."}</p>
            </div>

            <div className="bg-white p-4 rounded-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
              <h3 className="fw-bold mb-4" style={{ fontSize: "1.1rem" }}>آراء الطلاب المقيمين ({reviews.length})</h3>
              {reviews.length === 0 ? (
                <div className="text-center py-4">
                  <span className="material-symbols-outlined text-muted" style={{ fontSize: 48 }}>rate_review</span>
                  <p className="text-muted mt-2 mb-0">لا توجد تقييمات بعد</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {reviews.map((r, i) => (
                    <div key={r.id} className="d-flex gap-3">
                      <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold flex-shrink-0" style={{ width: 44, height: 44, background: "var(--primary-container)", color: "var(--primary)", fontSize: "0.8rem" }}>
                        {r.profiles?.full_name?.charAt(0) || "ط"}
                      </div>
                      <div className={`flex-grow-1 ${i < reviews.length - 1 ? "pb-3" : ""}`} style={i < reviews.length - 1 ? { borderBottom: "1px solid var(--border)" } : {}}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-bold" style={{ fontSize: "0.9rem" }}>{r.profiles?.full_name || "طالب"}</span>
                          <span style={{ color: "#E9A23B", letterSpacing: 2, fontSize: "0.85rem" }}>
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                          </span>
                        </div>
                        <p className="mb-0" style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>{r.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="d-flex flex-column gap-4" style={{ position: "sticky", top: 96 }}>
            <div className="bg-white p-4 rounded-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
              <h4 className="fw-bold mb-3" style={{ fontSize: "0.95rem" }}>تفاصيل العقار</h4>
              <div className="d-flex flex-column gap-3">
                {[
                  { icon: "apartment", label: "نوع السكن", value: apt.apartment_type === "apartment" ? "شقة" : apt.apartment_type === "studio" ? "استوديو" : "غرفة مشتركة" },
                  { icon: "location_on", label: "المدينة", value: apt.city },
                  { icon: "map", label: "الحي", value: apt.neighborhood },
                  { icon: "school", label: "الجامعة القريبة", value: apt.university || "غير محدد" },
                  { icon: "payments", label: "السعر", value: `${formatPrice(apt.price)} ج.م / شهر` },
                ].map((item) => (
                  <div key={item.icon} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--primary)" }}>{item.icon}</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>{item.label}</span>
                    </div>
                    <span className="fw-bold" style={{ fontSize: "0.85rem" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-4 shadow-sm d-flex flex-column gap-2" style={{ border: "1px solid rgba(0,0,0,0.04)" }}>
              <button className="btn d-flex align-items-center justify-content-center gap-2 fw-bold py-3 owner-btn-lift" style={{ background: "var(--primary)", color: "white", borderRadius: "var(--radius-lg)" }} onClick={() => navigate(`/owner/edit-apartment/${apt.id}`)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                تعديل بيانات العقار
              </button>
              <button className="btn d-flex align-items-center justify-content-center gap-2 py-3" style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-lg)", fontSize: "0.9rem" }} onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("تم نسخ الرابط"); }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>share</span>
                مشاركة الرابط
              </button>
              <button className="btn d-flex align-items-center justify-content-center gap-2 py-3" style={{ border: "1px solid rgba(220,53,69,0.2)", color: "var(--danger)", borderRadius: "var(--radius-lg)", fontSize: "0.9rem" }} onClick={() => setShowDelete(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                حذف العقار
              </button>
            </div>
          </div>
        </div>
      </div>

      {lightboxIndex >= 0 && (
        <Lightbox items={mediaItems} startIndex={lightboxIndex} onClose={() => setLightboxIndex(-1)} />
      )}

      {showDelete && (
        <div className="position-fixed top-0 start-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050, width: "100%" }} onClick={() => setShowDelete(false)}>
          <div className="bg-white rounded-4 p-4 shadow-lg" style={{ maxWidth: 400, width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-3">
              <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: 48, color: "var(--danger)" }}>warning</span>
              <h5 className="fw-bold">حذف العقار</h5>
              <p className="text-muted small mb-0">هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn flex-grow-1" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }} onClick={() => setShowDelete(false)}>إلغاء</button>
              <button className="btn flex-grow-1 text-white" style={{ background: "var(--danger)", borderRadius: "var(--radius-md)" }} onClick={handleDelete}>حذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerApartmentDetails;
