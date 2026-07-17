import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { apartmentService } from "../../services/apartmentService";
import { reviewService } from "../../services/reviewService";
import { favoriteService } from "../../services/favoriteService";
import { viewingRequestService } from "../../services/viewingRequestService";
import { bookingRequestService } from "../../services/bookingRequestService";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../hooks/useAuth";
import { SkeletonImage, SkeletonText } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Lightbox from "../../components/ui/Lightbox";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png", iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png", shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png" });

const amenityIcons = {
  "wifi": "wifi", "واي فاي": "wifi",
  "تكييف": "ac_unit", "air conditioning": "ac_unit",
  "غسالة": "local_laundry_service", "مغسلة": "local_laundry_service",
  "صالة رياضية": "fitness_center", "gym": "fitness_center",
  "أمن": "security", "أمن 24 ساعة": "security",
  "تنظيف": "cleaning_services",
  "موقف سيارات": "local_parking",
  "شرفة": "balcony",
  "تلفزيون": "tv",
  "مفروش": "bed", "مفروش بالكامل": "bed",
  "سخان مياه": "water_drop",
  "مطبخ": "kitchen", "مطبخ مجهز": "kitchen",
  "مصعد": "elevator",
};

const typeLabels = { room: "غرفة", apartment: "شقة", shared: "مشتركة", studio: "استوديو" };

function ApartmentDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [apartment, setApartment] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingData, setRatingData] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [similarApartments, setSimilarApartments] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [existingViewing, setExistingViewing] = useState(null);
  const [existingBooking, setExistingBooking] = useState(null);
  const [viewingForm, setViewingForm] = useState({ date: "", time: "", notes: "" });
  const [bookingForm, setBookingForm] = useState({ startDate: "", duration: "1", persons: "1", notes: "" });
  const [viewingLoading, setViewingLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: apt } = await apartmentService.getById(id);
      setApartment(apt);

      if (apt) {
        const [reviewsResult, ratingResult, favResult] = await Promise.all([
          reviewService.getByApartment(id),
          reviewService.getAverageRating(id),
          user ? favoriteService.isFavorited(user.id, id) : { isFavorited: false },
        ]);
        setReviews(reviewsResult.data || []);
        setRatingData(ratingResult);
        setFavorite(favResult.isFavorited);

        const { data: similar } = await apartmentService.getAll({ status: "approved", limit: 4 });
        setSimilarApartments((similar || []).filter((a) => a.id !== apt.id).slice(0, 2));

        if (user && apt.owner_id !== user.id) {
          const [vResult, bResult] = await Promise.all([
            viewingRequestService.checkExisting(user.id, id),
            bookingRequestService.checkExisting(user.id, id),
          ]);
          setExistingViewing(vResult.data);
          setExistingBooking(bResult.data);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("سجّل الدخول أولاً");
      return navigate("/login");
    }
    if (favorite) {
      await favoriteService.removeFavorite(user.id, id);
      toast.success("تمت الإزالة من المفضلة");
    } else {
      await favoriteService.addFavorite(user.id, id);
      toast.success("تمت الإضافة للمفضلة");
    }
    setFavorite(!favorite);
  };

  const handleContactOwner = () => {
    if (!user) {
      toast.error(`سجّل الدخول أولاً للتواصل مع ${ownerLabel}`);
      return navigate("/login");
    }
    if (apartment.owner_id === user.id) {
      toast.error("لا يمكنك مراسلة نفسك");
      return;
    }
    navigate(`/messages?ownerId=${apartment.owner_id}&apartmentId=${apartment.id}`);
  };

  const handleViewingSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!viewingForm.date || !viewingForm.time) {
      toast.error("يرجى اختيار التاريخ والوقت");
      return;
    }
    setViewingLoading(true);
    try {
      const { data, error } = await viewingRequestService.create({
        studentId: user.id,
        apartmentId: apartment.id,
        ownerId: apartment.owner_id,
        viewingDate: viewingForm.date,
        viewingTime: viewingForm.time,
        notes: viewingForm.notes,
      });
      if (error) throw error;
      await notificationService.create({
        userId: apartment.owner_id,
        title: "طلب معاينة جديد",
        message: `طالب يطلب معاينة الشقة "${apartment.title}"`,
        type: "info",
        link: `/owner/requests`,
      });
      setExistingViewing({ id: data.id, status: "pending" });
      setShowViewingModal(false);
      setViewingForm({ date: "", time: "", notes: "" });
      toast.success("تم إرسال طلب المعاينة بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء إرسال الطلب");
    }
    setViewingLoading(false);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (!bookingForm.startDate) {
      toast.error("يرجى اختيار تاريخ البداية");
      return;
    }
    setBookingLoading(true);
    try {
      const { data, error } = await bookingRequestService.create({
        studentId: user.id,
        apartmentId: apartment.id,
        ownerId: apartment.owner_id,
        startDate: bookingForm.startDate,
        durationMonths: parseInt(bookingForm.duration),
        numPersons: parseInt(bookingForm.persons),
        notes: bookingForm.notes,
      });
      if (error) throw error;
      await notificationService.create({
        userId: apartment.owner_id,
        title: "طلب حجز جديد",
        message: `طالب يطلب حجز الشقة "${apartment.title}"`,
        type: "info",
        link: `/owner/requests`,
      });
      setExistingBooking({ id: data.id, status: "pending" });
      setShowBookingModal(false);
      setBookingForm({ startDate: "", duration: "1", persons: "1", notes: "" });
      toast.success("تم إرسال طلب الحجز بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء إرسال الطلب");
    }
    setBookingLoading(false);
  };

  const mediaItems = useMemo(() => {
    if (!apartment) return [];
    const items = (apartment.images || []).map((url) => ({ src: url, type: "image" }));
    if (apartment.video_url) {
      items.push({ src: apartment.video_url, type: "video", poster: apartment.images?.[0] });
    }
    return items;
  }, [apartment]);

  if (loading) {
    return (
      <div className="container py-5">
        <SkeletonImage height={400} className="mb-4" />
        <SkeletonText lines={4} className="mb-4" />
        <SkeletonText lines={2} />
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="container py-5">
        <EmptyState icon="home_off" title="الشقة غير موجودة" description="لم نتمكن من العثور على هذا العقار." actionLabel="العودة للبحث" actionTo="/apartments" />
      </div>
    );
  }

  const owner = apartment.profiles;
  const ownerLabel = owner?.role === "broker" ? "الوسيط" : "المالك";
  const location = [apartment.neighborhood, apartment.city].filter(Boolean).join("، ");
  const includedAmenities = [
    apartment.wifi && "واي فاي",
    apartment.electricity && "كهرباء",
    apartment.water && "مياه",
    apartment.gas && "غاز",
    ...(apartment.amenities || []),
  ].filter(Boolean);

  const neighborhoodCoords = {
    Dallah: [29.31, 30.98],
    "El Hadqa": [29.32, 30.96],
    "El Gamea": [29.30, 30.97],
    "El Masalla": [29.33, 30.95],
    "Keman Fares": [29.29, 30.99],
    Qahafa: [29.28, 30.94],
    "Dar El Ramad": [29.34, 31.0],
  };
  const mapCenter = neighborhoodCoords[apartment.neighborhood] || [29.31, 30.97];

  return (
    <div className="apartment-details-page">
      <style>{`
        .apartment-details-page { background: var(--background, #f8f9ff); }
        .property-card-shadow { box-shadow: 0 4px 20px rgba(107,144,128,0.08); }
        .section-title { border-right: 4px solid var(--primary, #6B9080); padding-right: 12px; }
        .desc-clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .glass-card { background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 4px 20px rgba(107,144,128,0.08); }
        .sticky-sidebar { position: sticky; top: 100px; }
        .amenity-card { transition: border-color 0.2s; }
        .amenity-card:hover { border-color: var(--primary, #6B9080); }
        .request-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1060; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
        .request-modal { background: var(--surface-card, #fff); border-radius: var(--radius-lg, 20px); width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s ease; padding: 2rem; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .request-input { border: 2px solid var(--outline-variant, #D0D0D0); border-radius: 12px; height: 48px; font-size: var(--fs-sm); padding: 0 14px; width: 100%; transition: all 0.3s; }
        .request-input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px rgba(107,144,128,0.1); }
      `}</style>

      {/* Image Gallery */}
      <section className="row g-3 mb-4">
        <div className="col-md-8">
          <div
            className="position-relative rounded-4 overflow-hidden property-card-shadow gallery-grid-item"
            style={{ height: 400 }}
            onClick={() => setLightboxIndex(0)}
          >
            <img src={apartment.images?.[0] || "https://via.placeholder.com/800x400"} alt={apartment.title} className="w-100 h-100" style={{ objectFit: "cover" }} />
            <div className="position-absolute top-3 end-3 d-flex gap-2" style={{ zIndex: 2 }}>
              {apartment.status === "approved" && <span className="badge rounded-pill px-3 py-2" style={{ background: "#10b981", color: "white", fontSize: "0.75rem" }}>متاح</span>}
              {apartment.is_featured && <span className="badge rounded-pill px-3 py-2 bg-primary" style={{ fontSize: "0.75rem" }}>مميز</span>}
            </div>
            <button
              className="btn position-absolute top-3 start-3 rounded-circle shadow-sm d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, background: "rgba(255,255,255,0.85)", zIndex: 2 }}
              onClick={(e) => { e.stopPropagation(); toggleFavorite(); }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: favorite ? "var(--danger)" : "#94a3b8", fontVariationSettings: favorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            </button>
            <div className="gallery-grid-overlay" style={{ zIndex: 1 }}>
              <span className="material-symbols-outlined" style={{ color: "white", fontSize: 28 }}>fullscreen</span>
            </div>
          </div>
        </div>
        <div className="col-md-4 d-none d-md-grid gap-3" style={{ gridTemplateRows: "1fr 1fr" }}>
          <div
            className="rounded-4 overflow-hidden property-card-shadow gallery-grid-item"
            onClick={() => setLightboxIndex(1)}
          >
            <img src={apartment.images?.[1] || apartment.images?.[0] || "https://via.placeholder.com/400x200"} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
            <div className="gallery-grid-overlay">
              <span className="material-symbols-outlined" style={{ color: "white", fontSize: 28 }}>fullscreen</span>
            </div>
          </div>
          <div className="rounded-4 overflow-hidden property-card-shadow position-relative">
            {apartment.video_url && (!apartment.images?.[2]) ? (
              <div
                className="gallery-grid-item w-100 h-100"
                style={{ background: "#000" }}
                onClick={() => setLightboxIndex(mediaItems.length - 1)}
              >
                <div className="owner-video-container">
                  <video src={apartment.video_url} playsInline preload="metadata" poster={apartment.images?.[0]} />
                </div>
                <div className="gallery-grid-overlay">
                  <span className="material-symbols-outlined" style={{ color: "white", fontSize: 28 }}>play_circle</span>
                </div>
              </div>
            ) : (
              <div
                className="gallery-grid-item w-100 h-100"
                onClick={() => setLightboxIndex(2)}
              >
                <img src={apartment.images?.[2] || apartment.images?.[0] || "https://via.placeholder.com/400x200"} alt="" className="w-100 h-100" style={{ objectFit: "cover", filter: apartment.images?.length > 3 ? "brightness(0.7)" : undefined }} />
                {apartment.images?.length > 3 && (
                  <div className="position-absolute inset-0 d-flex align-items-center justify-content-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <span className="text-white fw-bold" style={{ fontSize: "1.2rem" }}>+{apartment.images.length - 3} صور</span>
                  </div>
                )}
                <div className="gallery-grid-overlay">
                  <span className="material-symbols-outlined" style={{ color: "white", fontSize: 28 }}>fullscreen</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Player (standalone when many images) */}
      {apartment.video_url && apartment.images?.length > 2 && (
        <section className="mb-4" style={{ animation: "ownerFadeInUp 0.5s ease both" }}>
          <div
            className="bg-white p-4 rounded-4 property-card-shadow border"
            style={{ borderColor: "var(--border, #e5e7eb)", cursor: "pointer" }}
            onClick={() => setLightboxIndex(mediaItems.length - 1)}
          >
            <h2 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
              فيديو العقار
            </h2>
            <div className="owner-video-container">
              <video
                src={apartment.video_url}
                playsInline
                preload="metadata"
                poster={apartment.images?.[0]}
              />
            </div>
          </div>
        </section>
      )}

      {/* Two Column Layout */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="d-flex flex-column gap-5">
            {/* Header Info */}
            <div className="bg-white p-4 rounded-4 property-card-shadow border" style={{ borderColor: "var(--border, #e5e7eb)" }}>
              <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-3">
                <h1 className="h4 fw-bold text-dark mb-0">{apartment.title}</h1>
                <div className="text-end">
                  <span className="d-block fw-bold text-primary" style={{ fontSize: "1.5rem" }}>{apartment.price.toLocaleString("ar-EG")} ج.م</span>
                  <span className="small text-muted">شهرياً</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted mb-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "1.1rem" }}>location_on</span>
                <span>{location}</span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { icon: "school", text: "قريب من الجامعة" },
                  { icon: "king_bed", text: `${apartment.bedrooms} غرف` },
                  { icon: "square_foot", text: `${apartment.area || "?"} م²` },
                  { icon: "chair", text: typeLabels[apartment.apartment_type] || apartment.apartment_type },
                ].map((chip) => (
                  <span key={chip.icon} className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-primary" style={{ background: "var(--surface-container, #e7eeff)", fontSize: "0.85rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>{chip.icon}</span>
                    {chip.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-4 rounded-4 property-card-shadow border" style={{ borderColor: "var(--border, #e5e7eb)" }}>
              <h2 className="h5 fw-bold mb-3 section-title">الوصف</h2>
              <p className={`text-muted mb-0 ${descExpanded ? "" : "desc-clamp"}`} style={{ lineHeight: 1.8 }}>{apartment.description}</p>
              {apartment.description?.length > 200 && (
                <button className="btn btn-link text-primary fw-bold text-decoration-none mt-2 p-0 d-flex align-items-center gap-1" onClick={() => setDescExpanded(!descExpanded)}>
                  <span>{descExpanded ? "عرض أقل" : "اقرأ المزيد"}</span>
                </button>
              )}
            </div>

            {/* Amenities */}
            {includedAmenities.length > 0 && (
              <div>
                <h2 className="h4 fw-bold mb-4 d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
                  المرافق والخدمات
                </h2>
                <div className="row g-3">
                  {includedAmenities.map((item) => (
                    <div className="col-6 col-sm-4 col-md-3" key={item}>
                      <div className="d-flex flex-column align-items-center p-3 rounded-4 amenity-card text-center border" style={{ background: "var(--surface-card, #fff)", borderColor: "var(--border, #e5e7eb)" }}>
                        <span className="material-symbols-outlined text-primary mb-2" style={{ fontSize: "1.8rem" }}>{amenityIcons[item] || "check_circle"}</span>
                        <small className="fw-bold">{item}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="h4 fw-bold mb-4 d-flex align-items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                الموقع على الخريطة
              </h2>
              <div className="rounded-4 overflow-hidden property-card-shadow border" style={{ borderColor: "var(--border, #e5e7eb)", height: 300 }}>
                <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={mapCenter}>
                    <Popup>{apartment.title} - {location}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                  <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    تقييمات الطلاب
                  </h2>
                  <p className="text-muted small mb-0">ماذا يقول زملاؤك عن هذا السكن؟</p>
                </div>
                {ratingData.count > 0 && (
                  <div className="text-start">
                    <div className="d-flex align-items-center gap-1" style={{ color: "#583d00" }}>
                      <span className="fw-bold" style={{ fontSize: "1.3rem" }}>{ratingData.average}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                    <small className="text-muted">بناءً على {ratingData.count} تقييم</small>
                  </div>
                )}
              </div>
              {reviews.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {reviews.map((r) => (
                    <div className="glass-card p-4 rounded-4" key={r.id}>
                      <div className="d-flex gap-3">
                        <div className="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center fw-bold" style={{ width: 48, height: 48, background: "var(--primary-light, #CCE3D7)", color: "var(--primary, #6B9080)", fontSize: "1.1rem" }}>
                          {r.profiles?.full_name?.charAt(0) || "ط"}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h4 className="fw-bold small mb-0">{r.profiles?.full_name || "طالب"}</h4>
                            </div>
                            <div className="d-flex gap-0" style={{ color: "#583d00" }}>
                              {Array.from({ length: 5 }, (_, j) => (
                                <span key={j} className="material-symbols-outlined" style={{ fontSize: "0.9rem", fontVariationSettings: j < r.rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                              ))}
                            </div>
                          </div>
                          {r.comment && <p className="text-muted mt-2 mb-0 small" style={{ lineHeight: 1.7 }}>{r.comment}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">لا توجد تقييمات بعد</p>
              )}
            </div>

            {/* Similar */}
            {similarApartments.length > 0 && (
              <div>
                <h2 className="h4 fw-bold mb-4 d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
                  عقارات مشابهة
                </h2>
                <div className="row g-4">
                  {similarApartments.map((apt) => (
                    <div className="col-md-6" key={apt.id}>
                      <div className="bg-white rounded-4 overflow-hidden border property-card-shadow" style={{ borderColor: "var(--border, #e5e7eb)" }}>
                        <div className="position-relative" style={{ height: 192 }}>
                          <img src={apt.images?.[0] || "https://via.placeholder.com/400x200"} alt={apt.title} className="w-100 h-100" style={{ objectFit: "cover" }} />
                          <span className="badge rounded-pill position-absolute top-3 end-3" style={{ background: "var(--primary, #6B9080)", color: "white", fontSize: "0.7rem" }}>{typeLabels[apt.apartment_type] || apt.apartment_type}</span>
                        </div>
                        <div className="p-4">
                          <h3 className="fw-bold mb-1" style={{ fontSize: "1rem" }}>{apt.title}</h3>
                          <p className="text-muted small d-flex align-items-center gap-1 mb-3">
                            <span className="material-symbols-outlined" style={{ fontSize: "0.85rem" }}>location_on</span>
                            {apt.neighborhood || apt.city}
                          </p>
                          <div className="d-flex justify-content-between align-items-center border-top pt-3" style={{ borderColor: "var(--border, #e5e7eb)" }}>
                            <div className="text-primary fw-bold">
                              <span style={{ fontSize: "1.1rem" }}>{apt.price.toLocaleString("ar-EG")}</span>
                              <small className="fw-normal text-muted ms-1">ج.م/شهر</small>
                            </div>
                            <Link to={`/apartment/${apt.id}`} className="btn btn-sm rounded-circle" style={{ color: "var(--primary, #6B9080)" }}>
                              <span className="material-symbols-outlined">arrow_back</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <aside className="sticky-sidebar d-flex flex-column gap-4">
            <div className="p-4 rounded-4 border-2" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(107,144,128,0.1)", borderColor: "rgba(107,144,128,0.1)" }}>
              <div className="mb-4">
                <small className="text-muted">الإيجار الشهري</small>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fw-bold text-primary" style={{ fontSize: "2rem" }}>{apartment.price.toLocaleString("ar-EG")}</span>
                  <small className="text-muted">ج.م</small>
                </div>
              </div>
              <button className="btn btn-primary w-100 py-3 rounded-4 fw-bold" style={{ fontSize: "1rem" }} onClick={handleContactOwner}>تواصل مع {ownerLabel}</button>

              {user && apartment.owner_id !== user.id && (
                <>
                  {existingViewing ? (
                    <button className="btn w-100 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2" style={{ fontSize: "0.9rem", background: existingViewing.status === "approved" ? "var(--success, #10b981)" : "var(--warning, #F59E0B)", color: "#fff", opacity: 0.85 }} disabled>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>{existingViewing.status === "approved" ? "check_circle" : "schedule"}</span>
                      {existingViewing.status === "approved" ? "تمت الموافقة على المعاينة" : "طلب المعاينة قيد المراجعة"}
                    </button>
                  ) : (
                    <button className="btn w-100 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2" style={{ fontSize: "0.9rem", background: "var(--surface-card, #fff)", border: "2px solid var(--primary, #6B9080)", color: "var(--primary, #6B9080)" }} onClick={() => setShowViewingModal(true)}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>visibility</span>
                      طلب معاينة
                    </button>
                  )}

                  {existingBooking ? (
                    <button className="btn w-100 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2" style={{ fontSize: "0.9rem", background: existingBooking.status === "approved" ? "var(--success, #10b981)" : "var(--warning, #F59E0B)", color: "#fff", opacity: 0.85 }} disabled>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>{existingBooking.status === "approved" ? "check_circle" : "schedule"}</span>
                      {existingBooking.status === "approved" ? "تمت الموافقة على الحجز" : "طلب الحجز قيد المراجعة"}
                    </button>
                  ) : (
                    <button className="btn w-100 py-3 rounded-4 fw-bold d-flex align-items-center justify-content-center gap-2" style={{ fontSize: "0.9rem", background: "var(--primary, #6B9080)", color: "#fff" }} onClick={() => setShowBookingModal(true)}>
                      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>calendar_month</span>
                      طلب حجز
                    </button>
                  )}
                </>
              )}
            </div>

            {owner && (
              <div className="bg-white p-4 rounded-4 border" style={{ borderColor: "var(--border, #e5e7eb)" }}>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="rounded-circle overflow-hidden border flex-shrink-0" style={{ width: 56, height: 56, borderColor: "rgba(107,144,128,0.2)" }}>
                    {owner.avatar_url ? (
                      <img src={owner.avatar_url} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold" style={{ background: "var(--primary-light, #e1e0ff)", color: "var(--primary, #6B9080)", fontSize: "1.2rem" }}>
                        {owner.full_name?.charAt(0) || "م"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="fw-bold mb-0" style={{ fontSize: "0.95rem" }}>{owner.full_name}</h4>
                    {owner.is_verified && (
                      <small className="d-flex align-items-center gap-1" style={{ color: "#006d37", fontSize: "0.75rem" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "0.8rem", fontVariationSettings: "'FILL' 1" }}>verified</span>
                        {ownerLabel} موثق
                      </small>
                    )}
                  </div>
                </div>
                {owner.phone && (
                  <a href={`https://wa.me/2${owner.phone}`} target="_blank" rel="noreferrer" className="btn w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 fw-bold text-white" style={{ background: "#25D366", fontSize: "0.85rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>call</span>
                    واتساب
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {lightboxIndex >= 0 && (
        <Lightbox items={mediaItems} startIndex={lightboxIndex} onClose={() => setLightboxIndex(-1)} />
      )}

      {/* Viewing Request Modal */}
      {showViewingModal && (
        <div className="request-modal-overlay" onClick={() => setShowViewingModal(false)}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                طلب معاينة
              </h3>
              <button className="btn btn-sm rounded-circle" style={{ background: "var(--surface-container, #f1f3f5)" }} onClick={() => setShowViewingModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>close</span>
              </button>
            </div>
            <form onSubmit={handleViewingSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted mb-2">التاريخ</label>
                <input type="date" className="request-input" min={today} value={viewingForm.date} onChange={(e) => setViewingForm({ ...viewingForm, date: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted mb-2">الوقت</label>
                <input type="time" className="request-input" value={viewingForm.time} onChange={(e) => setViewingForm({ ...viewingForm, time: e.target.value })} required />
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold small text-muted mb-2">ملاحظات (اختياري)</label>
                <textarea className="request-input" style={{ height: "auto", minHeight: "80px", padding: "12px 14px", resize: "vertical" }} placeholder="أضف ملاحظاتك هنا..." value={viewingForm.notes} onChange={(e) => setViewingForm({ ...viewingForm, notes: e.target.value })} />
              </div>
              <button type="submit" className="btn w-100 py-3 rounded-4 fw-bold" style={{ background: "var(--primary, #6B9080)", color: "#fff", fontSize: "1rem" }} disabled={viewingLoading}>
                {viewingLoading ? (
                  <span className="spinner-border spinner-border-sm ms-2" />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>send</span>
                )}
                {viewingLoading ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking Request Modal */}
      {showBookingModal && (
        <div className="request-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                طلب حجز
              </h3>
              <button className="btn btn-sm rounded-circle" style={{ background: "var(--surface-container, #f1f3f5)" }} onClick={() => setShowBookingModal(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>close</span>
              </button>
            </div>
            <form onSubmit={handleBookingSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold small text-muted mb-2">تاريخ البداية</label>
                <input type="date" className="request-input" min={today} value={bookingForm.startDate} onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })} required />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold small text-muted mb-2">المدة (أشهر)</label>
                  <select className="request-input" value={bookingForm.duration} onChange={(e) => setBookingForm({ ...bookingForm, duration: e.target.value })}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "شهر" : "أشهر"}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label fw-bold small text-muted mb-2">عدد الأشخاص</label>
                  <select className="request-input" value={bookingForm.persons} onChange={(e) => setBookingForm({ ...bookingForm, persons: e.target.value })}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "شخص" : "أشخاص"}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold small text-muted mb-2">ملاحظات (اختياري)</label>
                <textarea className="request-input" style={{ height: "auto", minHeight: "80px", padding: "12px 14px", resize: "vertical" }} placeholder="أضف ملاحظاتك هنا..." value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} />
              </div>
              <button type="submit" className="btn w-100 py-3 rounded-4 fw-bold" style={{ background: "var(--primary, #6B9080)", color: "#fff", fontSize: "1rem" }} disabled={bookingLoading}>
                {bookingLoading ? (
                  <span className="spinner-border spinner-border-sm ms-2" />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>send</span>
                )}
                {bookingLoading ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApartmentDetails;
