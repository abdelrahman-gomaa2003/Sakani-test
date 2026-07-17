import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apartmentService } from "../../services/apartmentService";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

function BrokerMyApartments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchApartments = async () => {
      if (!user) return;
      const { data } = await apartmentService.getByOwner(user.id);
      setApartments(data || []);
      setLoading(false);
    };
    fetchApartments();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا العقار؟")) return;
    const { error } = await apartmentService.delete(id);
    if (!error) {
      setApartments((prev) => prev.filter((a) => a.id !== id));
      toast.success("تم حذف العقار بنجاح");
    } else {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const filtered = apartments.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  const statusConfig = {
    approved: { label: "نشط", bg: "var(--success)", color: "white" },
    pending: { label: "معلق", bg: "var(--warning)", color: "white" },
    rejected: { label: "مرفوض", bg: "var(--danger)", color: "white" },
    hidden: { label: "مخفى", bg: "var(--gray)", color: "white" },
  };

  if (loading) {
    return (
      <div className="d-flex flex-column gap-4">
        <div className="row g-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="col-12 col-md-6 col-lg-4"><div className="placeholder-glow"><div className="placeholder col-12 rounded-4" style={{ height: 300 }} /></div></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.4rem" }}>إدارة العقارات</h2>
          <p style={{ fontSize: "0.9rem", color: "var(--on-surface-variant)" }}>
            لديك <span className="fw-bold" style={{ color: "var(--primary)" }}>{apartments.length}</span> عقار مسجل في المنصة
          </p>
        </div>
        <Link to="/broker/add-apartment" className="btn d-flex align-items-center gap-2 px-4 py-2 fw-bold text-white text-decoration-none" style={{ background: "var(--primary)", borderRadius: "var(--radius-md, 12px)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
          إضافة عقار جديد
        </Link>
      </div>

      {/* Filter */}
      <div className="p-4 rounded-4" style={{ background: "white", border: "1px solid var(--border)" }}>
        <div className="d-flex gap-2 flex-wrap">
          {[
            { value: "all", label: "الكل" },
            { value: "approved", label: "نشط" },
            { value: "pending", label: "معلق" },
            { value: "rejected", label: "مرفوض" },
          ].map((s) => (
            <button key={s.value} className="btn btn-sm rounded-pill fw-bold" style={{ padding: "6px 16px", fontSize: "0.8rem", background: filterStatus === s.value ? "var(--primary)" : "white", color: filterStatus === s.value ? "white" : "var(--on-surface-variant)", border: filterStatus === s.value ? "none" : "1px solid var(--border)" }} onClick={() => setFilterStatus(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apartments */}
      {filtered.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined text-muted" style={{ fontSize: 64 }}>apartment</span>
          <p className="text-muted mt-3">لا توجد عقارات {filterStatus !== "all" ? "بهذا الحالة" : ""}</p>
          <Link to="/broker/add-apartment" className="btn btn-primary mt-2">إضافة عقار</Link>
        </div>
      ) : (
        <div className="row g-4">
          {filtered.map((apt) => {
            const sc = statusConfig[apt.status] || statusConfig.pending;
            return (
              <div key={apt.id} className="col-12 col-md-6 col-lg-4">
                <div className="h-100 d-flex flex-column" style={{ background: "white", borderRadius: 24, border: "1px solid var(--border)", overflow: "hidden" }}>
                  <div className="position-relative" style={{ height: 224 }}>
                    <img
                      src={apt.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80"}
                      alt={apt.title}
                      className="w-100 h-100"
                      style={{ objectFit: "cover", cursor: "pointer" }}
                      onClick={() => navigate(`/broker/apartment/${apt.id}`)}
                    />
                    <span className="position-absolute top-3 end-3 px-3 py-1 rounded-pill fw-bold" style={{ fontSize: "0.75rem", background: sc.bg, color: sc.color }}>{sc.label}</span>
                    {apt.video_url && (
                      <span className="position-absolute top-3 start-3 px-2 py-1 rounded-pill d-flex align-items-center gap-1" style={{ background: "rgba(0,0,0,0.6)", color: "white", fontSize: "0.7rem" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span>
                        فيديو
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-grow-1 d-flex flex-column">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "0.95rem" }}>{apt.title}</h5>
                    <p className="d-flex align-items-center mb-3" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined me-1" style={{ fontSize: 16 }}>location_on</span>
                      {apt.neighborhood}، {apt.city}
                    </p>
                    <div className="d-flex justify-content-between align-items-center py-3 mb-3" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="d-flex align-items-center gap-1" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bed</span>
                          {apt.bedrooms}
                        </span>
                        <span className="d-flex align-items-center gap-1" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant)" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shower</span>
                          {apt.bathrooms}
                        </span>
                      </div>
                      <div>
                        <span className="fw-bold" style={{ fontSize: "1rem", color: "var(--primary)" }}>{Number(apt.price).toLocaleString("ar-EG")}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}> ج.م / شهر</span>
                      </div>
                    </div>
                    <div className="d-flex gap-2 mt-auto">
                      <Link to={`/broker/apartment/${apt.id}`} className="flex-grow-1 btn py-2 fw-bold text-decoration-none" style={{ background: "var(--surface-container)", color: "var(--primary)", fontSize: "0.85rem" }}>عرض</Link>
                      <Link to={`/broker/edit-apartment/${apt.id}`} className="btn d-flex align-items-center justify-content-center" style={{ width: 48, height: 40, border: "1px solid var(--border)", color: "var(--primary)", textDecoration: "none" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                      </Link>
                      <button className="btn d-flex align-items-center justify-content-center" style={{ width: 48, height: 40, border: "1px solid var(--border)", color: "var(--danger)" }} onClick={() => handleDelete(apt.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BrokerMyApartments;
