import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { favoriteService } from "../../services/favoriteService";
import { formatPriceWithCurrency } from "../../utils/formatPrice";
import { SkeletonList } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import toast from "react-hot-toast";

const typeLabels = { room: "غرفة", apartment: "شقة", shared: "مشتركة", studio: "استوديو" };

function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favoriteApartments, setFavoriteApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await favoriteService.getFavorites(user.id);
      setFavoriteApartments(data?.map((f) => f.apartments).filter(Boolean) || []);
      setLoading(false);
    };
    fetchFavorites();
  }, [user]);

  const handleRemove = async (apartmentId, e) => {
    e.stopPropagation();
    if (!user) return;
    await favoriteService.removeFavorite(user.id, apartmentId);
    setFavoriteApartments((prev) => prev.filter((a) => a.id !== apartmentId));
    toast.success("تمت الإزالة من المفضلة");
  };

  return (
    <div className="container py-5 text-end" style={{ direction: "rtl" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">المفضلة</h1>
          <p className="text-muted small mb-0">الشقق والغرف التي قمت بحفظها للرجوع إليها لاحقاً.</p>
        </div>
        <span className="badge bg-primary px-3 py-2 rounded-pill">
          {favoriteApartments.length} وحدات محفوظة
        </span>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : !user ? (
        <EmptyState icon="lock" title="سجّل الدخول أولاً" description="يجب تسجيل الدخول لعرض المفضلة." actionLabel="تسجيل الدخول" actionTo="/login" />
      ) : favoriteApartments.length === 0 ? (
        <EmptyState icon="heart_broken" title="المفضلة فارغة" description="تصفح الشقق المتاحة وقم بإضافتها للمفضلة." actionLabel="البدء في التصفح" actionTo="/apartments" />
      ) : (
        <div className="row g-4">
          {favoriteApartments.map((item) => (
            <div className="col-md-6" key={item.id}>
              <div className="card border-0 shadow-sm overflow-hidden rounded-4 h-100 cursor-pointer hover-shadow" onClick={() => navigate(`/apartment/${item.id}`)} style={{ transition: "all 0.2s ease-in-out" }}>
                <div className="row g-0 h-100">
                  <div className="col-5">
                    <img src={item.images?.[0] || "https://via.placeholder.com/300x200"} alt={item.title} className="w-100 h-100" style={{ objectFit: "cover", minHeight: "150px" }} />
                  </div>
                  <div className="col-7 p-3 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <h2 className="h6 fw-bold text-dark mb-1 text-truncate" style={{ maxWidth: "160px" }}>{item.title}</h2>
                        <button className="btn btn-outline-danger btn-sm border-0 p-1 rounded-circle d-flex align-items-center" onClick={(e) => handleRemove(item.id, e)} title="حذف من المفضلة">
                          <span className="material-symbols-outlined fs-5">delete</span>
                        </button>
                      </div>
                      <p className="text-muted small mb-2 d-flex align-items-center gap-1">
                        <span className="material-symbols-outlined fs-6 text-primary">location_on</span>
                        <span>{item.neighborhood || item.city}</span>
                      </p>
                      <span className="badge bg-light text-dark border small">{typeLabels[item.apartment_type] || item.apartment_type}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                      <span className="text-primary fw-bold">{formatPriceWithCurrency(item.price)}</span>
                      <button className="btn btn-outline-primary btn-sm rounded-3">عرض التفاصيل</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`.hover-shadow:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important; }`}</style>
    </div>
  );
}

export default Favorites;
