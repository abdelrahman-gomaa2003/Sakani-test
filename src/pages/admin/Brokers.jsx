import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

function AdminBrokers() {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    const loadBrokers = async () => {
      setLoading(true);
      const { data } = await adminService.getAllBrokers();
      setBrokers(data || []);
      setLoading(false);
    };
    loadBrokers();
  }, []);

  const filtered = brokers.filter((b) => {
    if (search && !b.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Page Heading */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-0" style={{ fontSize: "1.75rem" }}>إدارة الوسطاء المعتمدين</h4>
          <p className="mb-0 mt-1" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant, #464555)" }}>
            عرض وإدارة حسابات الوسطاء العقاريين في المنصة
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-4 d-flex flex-wrap align-items-center gap-3" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(107,144,128,0.06)" }}>
        <div className="flex-grow-1" style={{ minWidth: 200 }}>
          <input
            type="text"
            className="form-control"
            style={{ border: "1px solid #e2e8f0", borderRadius: "0.5rem", fontSize: "0.875rem" }}
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <p className="mb-0 fw-bold" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #464555)" }}>
          {filtered.length} وسيط
        </p>
      </div>

      {/* Broker Grid */}
      {loading ? (
        <div className="p-5 text-center">
          <div className="spinner-border" style={{ color: "var(--primary)" }} role="status">
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, color: "var(--outline, #767586)" }}>handshake</span>
          <p className="fw-bold" style={{ color: "var(--on-surface-variant, #464555)" }}>لا يوجد وسطاء</p>
        </div>
      ) : (
        <div className="row g-4">
          {paginated.map((broker) => (
            <div key={broker.id} className="col-md-6 col-lg-4">
              <div
                className="rounded-4 p-4 position-relative overflow-hidden h-100 d-flex flex-column"
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 20px rgba(107,144,128,0.06)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(107,144,128,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(107,144,128,0.06)"; }}
              >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="position-relative">
                    <div className="rounded-4 overflow-hidden shadow-sm" style={{ width: 72, height: 72 }}>
                      {broker.avatar_url ? (
                        <img src={broker.avatar_url} alt={broker.full_name} className="w-100 h-100" style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white fw-bold" style={{ background: "var(--primary-container, #6B9080)", fontSize: 24 }}>
                          {broker.full_name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div
                      className="position-absolute d-flex align-items-center justify-content-center"
                      style={{
                        bottom: -8, right: -8, width: 28, height: 28,
                        background: "var(--success, #006d37)", color: "#fff",
                        borderRadius: 8, border: "2px solid #fff", boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-5 fw-bold d-flex align-items-center gap-1" style={{ fontSize: "0.75rem", background: "rgba(86,117,104,0.08)", color: "var(--primary)" }}>
                    <span className="rounded-circle" style={{ width: 8, height: 8, background: "var(--primary)" }} />
                    وسيط
                  </span>
                </div>

                {/* Info */}
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">{broker.full_name || "وسيط"}</h5>
                  <div className="d-flex align-items-center" style={{ fontSize: "0.875rem", color: "var(--on-surface-variant, #464555)" }}>
                    <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>email</span>
                    {broker.email || "—"}
                  </div>
                  <div className="d-flex align-items-center mt-1" style={{ fontSize: "0.875rem", color: "var(--on-surface-variant, #464555)" }}>
                    <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>call</span>
                    {broker.phone || "—"}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="p-3 rounded-3 mb-4" style={{ background: "var(--surface, #f8f9ff)", border: "1px solid rgba(208,208,208,0.3)" }}>
                  <div className="row g-2 text-center">
                    <div className="col-6">
                      <p style={{ fontSize: "0.7rem", color: "var(--on-surface-variant, #464555)" }} className="mb-1">تاريخ التسجيل</p>
                      <p className="fw-bold mb-0" style={{ fontSize: "0.8rem" }}>
                        {broker.created_at ? new Date(broker.created_at).toLocaleDateString("ar-EG") : "—"}
                      </p>
                    </div>
                    <div className="col-6">
                      <p style={{ fontSize: "0.7rem", color: "var(--on-surface-variant, #464555)" }} className="mb-1">الجامعة</p>
                      <p className="fw-bold mb-0" style={{ fontSize: "0.8rem" }}>
                        {broker.university || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2 mt-auto">
                  <button className="flex-grow-1 py-2 rounded-3 fw-bold border-0" style={{ fontSize: "0.875rem", background: "rgba(86,117,104,0.05)", color: "var(--primary)" }}>
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2">
          <button className="btn btn-sm rounded-3" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
            <button
              key={i + 1}
              className="btn btn-sm rounded-3 fw-bold"
              style={{
                background: i + 1 === page ? "var(--primary)" : "transparent",
                color: i + 1 === page ? "#fff" : "var(--on-surface-variant, #464555)",
              }}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="btn btn-sm rounded-3" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminBrokers;
