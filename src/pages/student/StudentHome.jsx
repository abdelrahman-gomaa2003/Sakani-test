import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { apartmentService } from "../../services/apartmentService";
import GuestLoginModal from "../../components/ui/GuestLoginModal";
import { supabase } from "../../lib/supabase";

const categories = [
  { title: "شقق كاملة", icon: "apartment", color: "primary" },
  { title: "استوديوهات", icon: "bedroom_parent", color: "secondary" },
  { title: "غرف مشتركة", icon: "groups", color: "tertiary" },
  { title: "سكن جامعي", icon: "school", color: "primary" },
];

function StudentHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState({ city: "", university: "", type: "", rooms: "", budget: "" });
  const [recommendedApartments, setRecommendedApartments] = useState([]);
  const [stats, setStats] = useState({ apartments: 0, students: 0 });
  const [loading, setLoading] = useState(true);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestReturnPath, setGuestReturnPath] = useState("");

  const handleDetailsClick = useCallback((apartmentId) => {
    if (!user) {
      setGuestReturnPath(`/apartment/${apartmentId}`);
      setShowGuestModal(true);
      return;
    }
    navigate(`/apartment/${apartmentId}`);
  }, [user, navigate]);

  const userName = (profile?.full_name || user?.name || "طالب").split(" ")[0];

  useEffect(() => {
    const fetchApartments = async () => {
      const { data } = await apartmentService.getAll({ status: "approved", limit: 3 });
      setRecommendedApartments(data || []);
      setLoading(false);
    };
    fetchApartments();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: aptCount } = await supabase.from("apartments").select("*", { count: "exact", head: true }).eq("status", "approved");
        const { count: stuCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student");
        setStats({ apartments: aptCount || 0, students: stuCount || 0 });
      } catch {
        // Stats are non-critical
      }
    };
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.city) params.set("city", search.city);
    if (search.university) params.set("university", search.university);
    if (search.type) params.set("type", search.type);
    if (search.rooms) params.set("rooms", search.rooms);
    if (search.budget) params.set("budget", search.budget);
    navigate(`/apartments?${params.toString()}`);
  };

  return (
    <div className="student-home container py-3">
      {/* Hero */}
      <section className="mb-4">
        <div className="position-relative rounded-4 overflow-hidden" style={{ background: "var(--primary-container)", minHeight: 340 }}>
          <div className="position-absolute inset-0 opacity-25" style={{ background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3), transparent 60%)" }} />
          <div className="position-relative z-1 p-4 p-md-5 d-flex align-items-center" style={{ minHeight: 340 }}>
            <div style={{ maxWidth: 560 }}>
              <h1 className="fw-bold mb-3" style={{ fontSize: "2rem", color: "var(--on-surface)" }}>أهلاً بك، {userName} 👋</h1>
              <p className="mb-4" style={{ lineHeight: 1.8, color: "var(--on-surface-variant)" }}>
                نتمنى لك يوماً سعيداً في رحلة البحث عن سكنك المثالي. لقد قمنا بتحديث القوائم لتناسب احتياجاتك الدراسية.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="mb-5" style={{ marginTop: -40, position: "relative", zIndex: 20 }}>
        <form onSubmit={handleSearch} className="shadow-lg rounded-4 p-3 border" style={{ borderColor: "var(--border)", background: "var(--surface-card)" }}>
          <div className="row g-2 align-items-end">
            <div className="col-6 col-md">
              <label className="form-label small fw-bold" style={{ color: "var(--on-surface-variant)", fontSize: "0.7rem" }}>المدينة</label>
              <select className="form-select form-select-sm border-0 bg-light" value={search.city} onChange={(e) => setSearch((p) => ({ ...p, city: e.target.value }))}>
                <option value="">الكل</option>
                <option value="fayoum">الفيوم</option>
                <option value="snores">سنورس</option>
                <option value="itsa">إطسا</option>
                <option value="abshway">أبشواي</option>
                <option value="tamya">طامية</option>
              </select>
            </div>
            <div className="col-6 col-md">
              <label className="form-label small fw-bold" style={{ color: "var(--on-surface-variant)", fontSize: "0.7rem" }}>الجامعة</label>
              <select className="form-select form-select-sm border-0 bg-light" value={search.university} onChange={(e) => setSearch((p) => ({ ...p, university: e.target.value }))}>
                <option value="">الكل</option>
                <option value="fayoum">جامعة الفيوم</option>
                <option value="mite">جامعة مصر الدولية</option>
                <option value="engineering">كلية الهندسة</option>
                <option value="medical">المعاهد الطبية</option>
              </select>
            </div>
            <div className="col-6 col-md">
              <label className="form-label small fw-bold" style={{ color: "var(--on-surface-variant)", fontSize: "0.7rem" }}>نوع السكن</label>
              <select className="form-select form-select-sm border-0 bg-light" value={search.type} onChange={(e) => setSearch((p) => ({ ...p, type: e.target.value }))}>
                <option value="">الكل</option>
                <option value="apartment">شقة كاملة</option>
                <option value="studio">استوديو</option>
                <option value="shared">غرفة مشتركة</option>
              </select>
            </div>
            <div className="col-6 col-md">
              <label className="form-label small fw-bold" style={{ color: "var(--on-surface-variant)", fontSize: "0.7rem" }}>الغرف</label>
              <select className="form-select form-select-sm border-0 bg-light" value={search.rooms} onChange={(e) => setSearch((p) => ({ ...p, rooms: e.target.value }))}>
                <option value="">الكل</option>
                <option value="1">1+ غرفة</option>
                <option value="2">2+ غرفة</option>
                <option value="3">3+ غرفة</option>
              </select>
            </div>
            <div className="col-6 col-md">
              <label className="form-label small fw-bold" style={{ color: "var(--on-surface-variant)", fontSize: "0.7rem" }}>الميزانية</label>
              <input className="form-control form-control-sm border-0 bg-light" placeholder="مثلاً: 3000 ج.م" value={search.budget} onChange={(e) => setSearch((p) => ({ ...p, budget: e.target.value }))} />
            </div>
            <div className="col-12 col-md-auto">
              <button type="submit" className="btn btn-primary rounded-pill px-4 d-flex align-items-center justify-content-center gap-2 w-100 fw-bold" style={{ height: 42 }}>
                <span className="material-symbols-outlined">search</span>
                بحث الآن
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Categories */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 fw-bold mb-0" style={{ color: "var(--on-surface)" }}>استكشف حسب الفئة</h2>
          <Link to="/apartments" className="text-primary fw-bold small text-decoration-none">عرض الكل</Link>
        </div>
        <div className="row g-3">
          {categories.map((cat) => (
            <div className="col-6 col-md-3" key={cat.title}>
              <Link to="/apartments" className="text-decoration-none">
                <div className={`card border-0 shadow-sm h-100 text-center p-4 rounded-4 category-card`} style={{ background: "var(--surface-container-low)" }}>
                  <span className={`material-symbols-outlined mb-2 text-${cat.color}`} style={{ fontSize: "2.5rem" }}>{cat.icon}</span>
                  <span className="fw-bold" style={{ color: "var(--on-surface)" }}>{cat.title}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Apartments */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 fw-bold mb-0" style={{ color: "var(--on-surface)" }}>عقارات موصى بها لك</h2>
          <Link to="/apartments" className="text-primary fw-bold small text-decoration-none">عرض الكل</Link>
        </div>
        {loading ? (
          <div className="row g-4">
            {[1, 2, 3].map((i) => (
              <div className="col-md-6 col-lg-4" key={i}>
                <div className="card border-0 shadow-sm h-100 overflow-hidden rounded-4">
                  <div className="placeholder-glow"><div className="placeholder col-12" style={{ height: 220 }} /></div>
                  <div className="p-4"><span className="placeholder col-6 mb-2" /><span className="placeholder col-8" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : recommendedApartments.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined text-muted" style={{ fontSize: 64 }}>apartment</span>
            <p className="text-muted mt-3">لا توجد عقارات متاحة حالياً</p>
          </div>
        ) : (
          <div className="row g-4">
            {recommendedApartments.map((apt) => (
              <div className="col-md-6 col-lg-4" key={apt.id}>
                <div className="card border-0 shadow-sm h-100 overflow-hidden rounded-4 property-card">
                  <div className="position-relative" style={{ height: 220 }}>
                    <img src={apt.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80"} alt={apt.title} className="w-100 h-100" style={{ objectFit: "cover" }} />
                    {apt.status === "approved" && <span className="position-absolute top-3 end-3 badge bg-success rounded-pill px-3 py-2">متاح</span>}
                    <button type="button" className="btn btn-light btn-sm position-absolute top-3 start-3 rounded-circle shadow-sm" onClick={(e) => { e.preventDefault(); toast.success("تمت الإضافة إلى المفضلة"); }}>
                      <span className="material-symbols-outlined">favorite</span>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h3 className="h6 fw-bold mb-0" style={{ flex: 1, color: "var(--on-surface)" }}>{apt.title}</h3>
                      <span className="text-primary fw-bold ms-2" style={{ whiteSpace: "nowrap" }}>{Number(apt.price).toLocaleString("ar-EG")} ج.م/شهر</span>
                    </div>
                    <div className="d-flex align-items-center gap-1 text-muted small mb-3">
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>location_on</span>
                      {apt.neighborhood}، {apt.city}
                    </div>
                    <div className="d-flex align-items-center gap-3 pt-3 border-top" style={{ borderColor: "var(--border)" }}>
                      {apt.bedrooms > 0 && <span className="small text-muted d-flex align-items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>bed</span>{apt.bedrooms} غرف</span>}
                      {apt.bathrooms > 0 && <span className="small text-muted d-flex align-items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>shower</span>{apt.bathrooms} حمام</span>}
                      {apt.area > 0 && <span className="small text-muted d-flex align-items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>square_foot</span>{apt.area} م²</span>}
                    </div>
                    <div className="mt-3">
                      <button onClick={() => handleDetailsClick(apt.id)} className="btn btn-outline-primary btn-sm rounded-pill w-100">عرض التفاصيل</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="mb-4">
        <div className="rounded-4 p-4 p-md-5 text-center" style={{ background: "var(--surface-container-high)" }}>
          <div className="row g-4">
            <div className="col-6 col-md-3">
              <div className="fw-bold" style={{ color: "var(--primary)", fontSize: "1.8rem" }}>{stats.apartments.toLocaleString("ar-EG")}</div>
              <div className="small text-muted">وحدة سكنية متاحة</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fw-bold" style={{ color: "var(--primary)", fontSize: "1.8rem" }}>{stats.students.toLocaleString("ar-EG")}</div>
              <div className="small text-muted">طالب مسجل</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fw-bold" style={{ color: "var(--primary)", fontSize: "1.8rem" }}>4</div>
              <div className="small text-muted">جامعات مدعومة</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fw-bold" style={{ color: "var(--primary)", fontSize: "1.8rem" }}>24/7</div>
              <div className="small text-muted">دعم فني للطلاب</div>
            </div>
          </div>
        </div>
      </section>

      <GuestLoginModal show={showGuestModal} onClose={() => setShowGuestModal(false)} returnPath={guestReturnPath} />
    </div>
  );
}

export default StudentHome;
