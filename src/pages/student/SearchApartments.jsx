import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apartmentService } from "../../services/apartmentService";
import { favoriteService } from "../../services/favoriteService";
import { useAuth } from "../../hooks/useAuth";
import { useCompare } from "../../hooks/useCompare";
import { SkeletonCard } from "../../components/ui/Skeleton";
import GuestLoginModal from "../../components/ui/GuestLoginModal";
import toast from "react-hot-toast";

const neighborhoods = [
  { value: "", label: "الكل" },
  { value: "sawaqi", label: "السواقي" },
  { value: "algon", label: "الجون" },
  { value: "central", label: "السنترال" },
  { value: "hawatem", label: "الحواتم" },
  { value: "lotfallah", label: "لطف الله" },
  { value: "sawy", label: "الصوفي" },
  { value: "baghouz", label: "باغوص" },
  { value: "dala", label: "دلة" },
  { value: "keman-fares", label: "كيمان فارس" },
  { value: "salakhana", label: "السلخانة" },
  { value: "sheikh-hassan", label: "الشيخ حسن" },
  { value: "damo", label: "دمو" },
  { value: "masla", label: "المسلة" },
  { value: "dar-alramad", label: "دار الرماد" },
];

const typeFilters = [
  { value: "", label: "الكل" },
  { value: "room", label: "غرفة" },
  { value: "apartment", label: "شقة" },
  { value: "shared", label: "مشتركة" },
  { value: "studio", label: "استوديو" },
];

const priceRanges = [
  { value: "", label: "الكل" },
  { value: "0-2000", label: "أقل من ٢٬٠٠٠" },
  { value: "2000-4000", label: "٢٬٠٠٠ - ٤٬٠٠٠" },
  { value: "4000-6000", label: "٤٬٠٠٠ - ٦٬٠٠٠" },
  { value: "6000+", label: "أكثر من ٦٬٠٠٠" },
];

function SearchApartments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialNeighborhood = searchParams.get("neighborhood") || "";
  const { user } = useAuth();
  const { toggleCompare, isComparing, compareIds } = useCompare();

  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood);
  const [activeType, setActiveType] = useState("");
  const [sortBy, setSortBy] = useState("relevant");
  const [priceRange, setPriceRange] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestReturnPath, setGuestReturnPath] = useState("");
  const perPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await apartmentService.getAll({ status: "approved", limit: 100 });
      setApartments(data || []);
      if (user) {
        const { data: favs } = await favoriteService.getFavorites(user.id);
        setFavoriteIds(new Set(favs?.map((f) => f.apartment_id) || []));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const toggleFavorite = useCallback(async (apartmentId) => {
    if (!user) {
      toast.error("سجّل الدخول أولاً لإضافة المفضلة");
      return;
    }
    if (favoriteIds.has(apartmentId)) {
      await favoriteService.removeFavorite(user.id, apartmentId);
      setFavoriteIds((prev) => { const next = new Set(prev); next.delete(apartmentId); return next; });
      toast.success("تمت إزالة الشقة من المفضلة");
    } else {
      await favoriteService.addFavorite(user.id, apartmentId);
      setFavoriteIds((prev) => new Set(prev).add(apartmentId));
      toast.success("تمت إضافة الشقة إلى المفضلة");
    }
  }, [user, favoriteIds]);

  const handleCompare = useCallback((apt) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولًا لاستخدام ميزة مقارنة العقارات.");
      navigate("/login", { state: { from: { pathname: "/apartments" } } });
      return;
    }
    const wasComparing = isComparing(apt.id);
    toggleCompare(apt);
    if (wasComparing) {
      toast.success("تمت إزالة الشقة من المقارنة");
    } else if (compareIds.length >= 3) {
      toast.error("يمكنك مقارنة حتى 3 شقق فقط");
    } else {
      toast.success("تمت إضافة الشقة إلى المقارنة");
    }
  }, [user, isComparing, toggleCompare, compareIds, navigate]);

  const handleDetailsClick = useCallback((apartmentId) => {
    if (!user) {
      setGuestReturnPath(`/apartment/${apartmentId}`);
      setShowGuestModal(true);
      return;
    }
    navigate(`/apartment/${apartmentId}`);
  }, [user, navigate]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = apartments
    .filter((apt) => {
      if (neighborhood && apt.neighborhood !== neighborhood) return false;
      if (activeType && apt.apartment_type !== activeType) return false;
      if (priceRange) {
        if (priceRange.endsWith("+")) {
          const min = Number(priceRange.replace("+", ""));
          if (apt.price < min) return false;
        } else {
          const [min, max] = priceRange.split("-").map(Number);
          if (apt.price < min || apt.price > max) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "cheap") return a.price - b.price;
      if (sortBy === "expensive") return b.price - a.price;
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "featured") return b.is_featured - a.is_featured;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const neighborhoodLabel = neighborhoods.find((n) => n.value === neighborhood)?.label || "الفيوم";

  return (
    <div className="search-apartments-page">
      <style>{`
        .search-apartments-page { font-family: 'IBM Plex Sans Arabic', sans-serif; background-color: var(--background, #f8f9ff); color: #1e293b; }
        .filter-chip { background: #fff; border: 2px solid #e2e8f0; padding: 0.65rem 1.5rem; border-radius: 14px; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
        .filter-chip:hover { border-color: var(--primary, #6B9080); color: var(--primary, #6B9080); background: var(--primary-container, #B7E4C7); }
        .filter-chip.active { background: var(--primary, #6B9080); color: white; border-color: var(--primary, #6B9080); }
        .property-card-search { background: white; border-radius: 20px; overflow: hidden; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transition: transform 0.3s ease, box-shadow 0.3s ease; height: 100%; display: flex; flex-direction: column; }
        .property-card-search:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }
        .property-card-search:hover .card-img-top { transform: scale(1.05); }
        .card-img-wrapper { position: relative; height: 220px; overflow: hidden; }
        .card-img-wrapper img { height: 100%; width: 100%; object-fit: cover; transition: transform 0.5s; }
        .badge-overlay { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; }
        .custom-badge { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; color: white; }
        .badge-verified { background: #10b981; }
        .badge-featured { background: #6366f1; }
        .property-price { font-size: 1.25rem; font-weight: 700; color: var(--primary, #6B9080); }
        .property-meta { display: flex; gap: 1rem; color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; margin-top: 1rem; }
        .card-actions-row { display: flex; gap: 8px; margin-top: 12px; }
        .card-action-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 12px; border-radius: 12px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; border: 1.5px solid var(--outline-variant, #D0D0D0); background: var(--surface, #fff); color: var(--on-surface-variant, #464555); }
        .card-action-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-container, rgba(107,144,128,0.08)); }
        .card-action-btn.active-fav { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.06); }
        .card-action-btn.active-compare { border-color: var(--primary); color: white; background: var(--primary); }
        .card-action-btn .material-symbols-rounded { font-size: 18px; transition: transform 0.3s; }
        .card-action-btn:active .material-symbols-rounded { transform: scale(1.25); }
        .page-btn { min-width: 36px; height: 36px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .page-btn:hover:not(:disabled) { background: var(--primary, #6B9080); color: white; }
        .page-btn.active { background: var(--primary, #6B9080); color: white; }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h4 fw-bold mb-1">
              نتائج البحث في <span className="text-primary">{neighborhoodLabel}</span>
            </h1>
            <p className="text-muted small mb-0">{filtered.length} عقار متاح حالياً</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <select className="form-select border-0 shadow-sm rounded-3 bg-white" style={{ width: 140 }} value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
              <option value="relevant">الأكثر صلة</option>
              <option value="cheap">الأقل سعراً</option>
              <option value="expensive">الأعلى سعراً</option>
              <option value="views">الأكثر مشاهدة</option>
              <option value="featured">المميزة</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {typeFilters.map((t) => (
            <button key={t.value} className={`filter-chip ${activeType === t.value ? "active" : ""}`} onClick={() => { setActiveType(t.value); setCurrentPage(1); }}>
              {t.label}
            </button>
          ))}
          <select className="form-select form-select-lg border shadow-sm rounded-3 bg-white" style={{ width: "auto", fontSize: "0.95rem", fontWeight: 600, padding: "0.6rem 2.5rem 0.6rem 1rem" }} value={neighborhood} onChange={(e) => { setNeighborhood(e.target.value); setCurrentPage(1); }}>
            {neighborhoods.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>

        {/* Price Filter */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          {priceRanges.map((p) => (
            <button key={p.value} className={`filter-chip ${priceRange === p.value ? "active" : ""}`} onClick={() => { setPriceRange(p.value); setCurrentPage(1); }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="row g-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="col-md-6 col-lg-4"><SkeletonCard /></div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-rounded text-muted mb-3" style={{ fontSize: "4rem" }}>search_off</span>
            <h5 className="fw-bold text-dark">لا توجد نتائج</h5>
            <p className="text-muted small">جرّب تغيير الفلاتر للحصول على نتائج أفضل</p>
            <button className="btn btn-primary rounded-3 mt-2" onClick={() => { setNeighborhood(""); setActiveType(""); setPriceRange(""); setSortBy("relevant"); setCurrentPage(1); }}>مسح الفلاتر</button>
          </div>
        ) : (
          <>
            <div className="row g-4">
              {paginated.map((apt) => (
                <div className="col-md-6 col-lg-4" key={apt.id}>
                  <div className="property-card-search card">
                    <div className="card-img-wrapper">
                      <img src={apt.images?.[0] || "https://via.placeholder.com/400x220"} alt={apt.title} className="card-img-top" />
                      <div className="badge-overlay">
                        <span className="custom-badge badge-verified">متاح</span>
                        {apt.is_featured && <span className="custom-badge badge-featured">مميز</span>}
                      </div>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title fw-bold mb-0">{apt.title}</h5>
                        <div className="property-price">{apt.price.toLocaleString("ar-EG")} <span className="small fw-normal">ج.م/شهر</span></div>
                      </div>
                      <p className="text-muted small mb-3 d-flex align-items-center gap-1">
                        <span className="material-symbols-rounded" style={{ fontSize: "1rem" }}>location_on</span>
                        {apt.neighborhood || apt.city}
                      </p>
                      <div className="property-meta">
                        <span className="d-flex align-items-center gap-1">
                          <span className="material-symbols-rounded" style={{ fontSize: "1rem" }}>bed</span>
                          {apt.bedrooms} غرف
                        </span>
                        <span className="d-flex align-items-center gap-1">
                          <span className="material-symbols-rounded" style={{ fontSize: "1rem" }}>bathtub</span>
                          {apt.bathrooms} حمام
                        </span>
                        {apt.area && (
                          <span className="d-flex align-items-center gap-1">
                            <span className="material-symbols-rounded" style={{ fontSize: "1rem" }}>square_foot</span>
                            {apt.area} م²
                          </span>
                        )}
                      </div>
                      <div className="mt-auto pt-3">
                        <button className="btn btn-primary btn-sm rounded-3 w-100 py-2 fw-bold" onClick={() => handleDetailsClick(apt.id)}>
                          عرض التفاصيل
                        </button>
                        <div className="card-actions-row">
                          <button
                            className={`card-action-btn ${favoriteIds.has(apt.id) ? "active-fav" : ""}`}
                            onClick={() => toggleFavorite(apt.id)}
                          >
                            <span
                              className="material-symbols-rounded"
                              style={{ fontVariationSettings: favoriteIds.has(apt.id) ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              favorite
                            </span>
                            {favoriteIds.has(apt.id) ? "تمت الإضافة" : "المفضلة"}
                          </button>
                          <button
                            className={`card-action-btn ${isComparing(apt.id) ? "active-compare" : ""}`}
                            onClick={() => handleCompare(apt)}
                          >
                            <span
                              className="material-symbols-rounded"
                              style={{ fontVariationSettings: isComparing(apt.id) ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              {isComparing(apt.id) ? "check_circle" : "compare"}
                            </span>
                            {isComparing(apt.id) ? "تمت الإضافة" : "مقارنة"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-5 d-flex flex-column align-items-center gap-3">
                <p className="text-muted small mb-0">صفحة {currentPage} من {totalPages}</p>
                <ul className="pagination gap-1 border-0 mb-0">
                  <li className="page-item">
                    <button className="page-btn bg-white" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                      <span className="material-symbols-rounded" style={{ fontSize: 20 }}>chevron_right</span>
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li className="page-item" key={page}>
                      <button className={`page-btn ${page === currentPage ? "active" : "bg-white text-dark"}`} onClick={() => handlePageChange(page)}>
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className="page-item">
                    <button className="page-btn bg-white" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                      <span className="material-symbols-rounded" style={{ fontSize: 20 }}>chevron_left</span>
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>

      <GuestLoginModal show={showGuestModal} onClose={() => setShowGuestModal(false)} returnPath={guestReturnPath} />
    </div>
  );
}

export default SearchApartments;
