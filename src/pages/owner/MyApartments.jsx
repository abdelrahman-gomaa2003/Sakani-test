import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { apartmentService } from "../../services/apartmentService";
import { serverAPI } from "../../services/serverAPI";
import { SkeletonList } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
import toast from "react-hot-toast";

const statusConfig = {
  approved: { bg: "rgba(106,254,156,0.2)", color: "var(--success, #006d37)", label: "منشورة" },
  pending: { bg: "rgba(255,222,168,0.8)", color: "var(--tertiary, #583d00)", label: "قيد المراجعة" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "var(--danger, #ef4444)", label: "مرفوضة" },
  hidden: { bg: "var(--surface-variant, #d3e4fe)", color: "var(--on-surface-variant, #464555)", label: "مخفي" },
  rented: { bg: "rgba(16,185,129,0.15)", color: "var(--success, #10b981)", label: "مؤجرة" },
};

function MyApartments() {
  const { user } = useAuth();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchApartments = async () => {
      if (!user) return;
      const { data } = await apartmentService.getByOwner(user.id);
      setApartments(data || []);
      setLoading(false);
    };
    fetchApartments();
  }, [user]);

  const handleDownloadReport = async () => {
    try {
      toast.loading("جاري تحميل التقرير...", { id: "pdf" });
      const blob = await serverAPI.getOwnerReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sakani-owner-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم التحميل بنجاح", { id: "pdf" });
    } catch {
      toast.error("فشل تحميل التقرير — تأكد أن السيرفر يعمل", { id: "pdf" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await apartmentService.delete(deleteId);
    setApartments((prev) => prev.filter((a) => a.id !== deleteId));
    setDeleting(false);
    setDeleteId(null);
    toast.success("تم حذف العقار بنجاح");
  };

  const filtered = apartments
    .filter((a) => filterStatus === "all" || a.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "cheap") return a.price - b.price;
      if (sortBy === "expensive") return b.price - a.price;
      return 0;
    });

  return (
    <div className="py-3 d-flex flex-column gap-4 owner-stagger">
      <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 owner-section" style={{ animationDelay: "0.04s" }}>
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: "1.75rem", color: "var(--on-surface, #1A1D23)" }}>إدارة شققي</h2>
          <p className="mb-0" style={{ color: "var(--on-surface-variant, #5A6370)" }}>
            لديك <span className="fw-bold" style={{ color: "var(--primary)" }}>{apartments.length}</span> شقة مضافة في منصة سكني
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button onClick={handleDownloadReport} className="btn d-inline-flex align-items-center gap-2 fw-bold owner-btn-lift" style={{ border: "2px solid var(--primary)", color: "var(--primary)", borderRadius: "var(--radius-md, 12px)", padding: "10px 20px", fontSize: "1rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
            تحميل التقرير
          </button>
          <Link to="/owner/add-apartment" className="btn d-inline-flex align-items-center gap-2 text-white fw-bold text-decoration-none owner-btn-lift" style={{ background: "var(--primary)", borderRadius: "var(--radius-md, 12px)", padding: "10px 24px" }}>
            <span className="material-symbols-outlined">add_circle</span>
            إضافة شقة جديدة
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="owner-section-card p-3 p-md-4 owner-section" style={{ animationDelay: "0.08s" }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <select className="form-select form-select-sm" style={{ minWidth: 140 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">جميع الحالات</option>
              <option value="approved">منشورة</option>
              <option value="pending">قيد المراجعة</option>
              <option value="rented">مؤجرة</option>
              <option value="rejected">مرفوضة</option>
            </select>
            <select className="form-select form-select-sm" style={{ minWidth: 140 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">الأحدث</option>
              <option value="cheap">الأقل سعراً</option>
              <option value="expensive">الأعلى سعراً</option>
            </select>
          </div>
          <div className="d-flex p-1 rounded-3" style={{ background: "var(--surface-container-low, #F5F3EE)" }}>
            <button className="btn btn-sm p-1" style={{ background: viewMode === "grid" ? "var(--white, #fff)" : "transparent", borderRadius: "var(--radius-sm, 8px)", transition: "all 0.2s ease" }} onClick={() => setViewMode("grid")}>
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button className="btn btn-sm p-1" style={{ background: viewMode === "list" ? "var(--white, #fff)" : "transparent", borderRadius: "var(--radius-sm, 8px)", transition: "all 0.2s ease" }} onClick={() => setViewMode("list")}>
              <span className="material-symbols-outlined">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="apartment" title="لا توجد شقق" description="أضف شقتك الأولى الآن لتبدأ في استقبال الطلاب" actionLabel="إضافة شقة جديدة" actionTo="/owner/add-apartment" />
      ) : (
        <div className={viewMode === "grid" ? "row g-4 owner-stagger" : "d-flex flex-column gap-3 owner-stagger"}>
          {filtered.map((apt) => {
            const st = statusConfig[apt.status] || statusConfig.pending;
            if (viewMode === "list") {
              return (
                <div key={apt.id} className="owner-section-card d-flex align-items-center gap-4 p-3" style={{ animation: `ownerFadeInUp 0.4s ease both` }}>
                  <img src={apt.images?.[0] || "https://via.placeholder.com/100x80"} alt={apt.title} className="rounded-3" style={{ width: 100, height: 80, objectFit: "cover" }} />
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="owner-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      <h5 className="fw-bold mb-0" style={{ fontSize: "1.1rem", color: "var(--on-surface, #1A1D23)" }}>{apt.title}</h5>
                    </div>
                    <p className="mb-0 small" style={{ color: "var(--on-surface-variant, #5A6370)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle" }}>location_on</span>
                      {apt.neighborhood || apt.city}
                    </p>
                  </div>
                  <span className="fw-bold" style={{ color: "var(--primary)", whiteSpace: "nowrap" }}>{apt.price.toLocaleString("ar-EG")} ج.م</span>
                  <Link to={`/owner/apartment/${apt.id}`} className="btn btn-sm btn-outline-primary">عرض</Link>
                  <Link to={`/owner/edit-apartment/${apt.id}`} className="btn btn-sm" style={{ color: "var(--primary)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                  </Link>
                  <button className="btn btn-sm" style={{ color: "var(--danger, #ef4444)" }} onClick={() => setDeleteId(apt.id)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>
              );
            }
            return (
              <div key={apt.id} className="col-12 col-sm-6 col-xl-4">
                <div className="owner-section-card overflow-hidden h-100 d-flex flex-column owner-card">
                  <div className="position-relative" style={{ height: 200 }}>
                    <img src={apt.images?.[0] || "https://via.placeholder.com/400x200"} alt={apt.title} className="w-100 h-100" style={{ objectFit: "cover" }} />
                    <span className="owner-badge position-absolute top-3 end-3" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    <div className="position-absolute bottom-0 start-0 p-3">
                      <span className="px-3 py-2 rounded-3 text-white fw-bold" style={{ background: "var(--primary)", fontSize: "1rem" }}>{apt.price.toLocaleString("ar-EG")} ج.م / شهر</span>
                    </div>
                  </div>
                  <div className="p-4 flex-grow-1 d-flex flex-column">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "1.2rem", color: "var(--on-surface, #1A1D23)" }}>{apt.title}</h5>
                    <div className="d-flex align-items-center gap-1 mb-3" style={{ color: "var(--on-surface-variant, #5A6370)", fontSize: "1rem" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>location_on</span>
                      {apt.neighborhood || apt.city}
                    </div>
                    <div className="mt-auto pt-3 d-flex justify-content-between align-items-center" style={{ borderTop: "1px solid var(--border, #DDD8D0)" }}>
                      <div className="d-flex align-items-center gap-3" style={{ color: "var(--on-surface-variant, #5A6370)" }}>
                        <div className="d-flex align-items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility</span>
                          <span style={{ fontSize: "0.95rem" }}>{apt.views || 0}</span>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        <Link to={`/owner/edit-apartment/${apt.id}`} className="btn btn-sm" style={{ color: "var(--primary)" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                        </Link>
                        <button className="btn btn-sm" style={{ color: "var(--danger, #ef4444)" }} onClick={() => setDeleteId(apt.id)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        </button>
                        <Link to={`/owner/apartment/${apt.id}`} className="btn btn-sm btn-outline-primary">عرض</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="حذف العقار" message="هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع عن هذا الإجراء." confirmLabel="حذف" danger loading={deleting} />
    </div>
  );
}

export default MyApartments;
