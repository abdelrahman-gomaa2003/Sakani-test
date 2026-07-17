import { Link } from "react-router-dom";
import { useCompare } from "../../hooks/useCompare";

function Compare() {
  const { compareIds, removeCompare, clearCompare } = useCompare();

  if (compareIds.length < 2) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "60vh" }}>
        <span className="material-symbols-outlined mb-3 d-block" style={{ fontSize: 64, color: "var(--on-surface-variant)" }}>compare</span>
        <h3 className="fw-bold mb-2" style={{ color: "var(--on-surface)" }}>اختر شقتين للمقارنة</h3>
        <p className="mb-4" style={{ color: "var(--on-surface-variant)" }}>أضف شقتين على الأقل من صفحة البحث لبدء المقارنة</p>
        <Link to="/apartments" className="btn btn-primary fw-bold px-4" style={{ borderRadius: "var(--radius-md)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginLeft: 4 }}>search</span>
          تصفح الشقق
        </Link>
      </div>
    );
  }

  const minPrice = Math.min(...compareIds.map((a) => Number(a.price) || 0));
  const maxRating = Math.max(...compareIds.map((a) => Number(a.rating) || 0));

  const rows = [
    {
      label: "السعر الشهري",
      icon: "payments",
      render: (apt) => {
        const price = Number(apt.price) || 0;
        const isBest = price === minPrice && compareIds.length > 1;
        return (
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold" style={{ fontSize: "1.1rem", color: isBest ? "var(--success)" : "var(--primary)" }}>
              {price.toLocaleString("ar-EG")} ج.م
            </span>
            {isBest && <span className="badge rounded-pill" style={{ background: "var(--primary-container)", color: "var(--primary)", fontSize: "0.65rem" }}>الأقل سعراً</span>}
          </div>
        );
      },
    },
    {
      label: "الموقع",
      icon: "location_on",
      render: (apt) => <span style={{ color: "var(--on-surface-variant)" }}>{apt.neighborhood || apt.city || "غير محدد"}</span>,
    },
    {
      label: "الجامعة القريبة",
      icon: "school",
      render: (apt) => <span>{apt.university || "غير محدد"}</span>,
    },
    {
      label: "عدد الغرف",
      icon: "bed",
      render: (apt) => <span>{apt.bedrooms || "—"}</span>,
    },
    {
      label: "عدد الحمامات",
      icon: "bathtub",
      render: (apt) => <span>{apt.bathrooms || "—"}</span>,
    },
    {
      label: "المساحة",
      icon: "square_foot",
      render: (apt) => <span>{apt.area ? `${apt.area} م²` : "—"}</span>,
    },
    {
      label: "النوع",
      icon: "apartment",
      render: (apt) => <span>{apt.apartment_type || "—"}</span>,
    },
    {
      label: "Wi-Fi",
      icon: "wifi",
      render: (apt) => (
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: apt.wifi ? "var(--success)" : "var(--danger)" }}>
          {apt.wifi ? "check_circle" : "cancel"}
        </span>
      ),
    },
    {
      label: "غاز",
      icon: "local_fire_department",
      render: (apt) => (
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: apt.gas ? "var(--success)" : "var(--danger)" }}>
          {apt.gas ? "check_circle" : "cancel"}
        </span>
      ),
    },
    {
      label: "مفروشة",
      icon: "chair",
      render: (apt) => (
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: apt.furnished ? "var(--success)" : "var(--danger)" }}>
          {apt.furnished ? "check_circle" : "cancel"}
        </span>
      ),
    },
    {
      label: "التقييم",
      icon: "star",
      render: (apt) => {
        const rating = Number(apt.rating) || 0;
        const isBest = rating === maxRating && compareIds.length > 1;
        return (
          <div className="d-flex align-items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--warning)", fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="fw-bold" style={{ color: isBest ? "var(--success)" : "var(--on-surface)" }}>{rating > 0 ? rating.toFixed(1) : "—"}</span>
            {apt.reviews_count ? <small style={{ color: "var(--on-surface-variant)" }}>({apt.reviews_count})</small> : null}
            {isBest && <span className="badge rounded-pill" style={{ background: "var(--primary-container)", color: "var(--primary)", fontSize: "0.65rem" }}>الأعلى تقييماً</span>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="container py-5" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/apartments" className="btn btn-sm" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface-container-low)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>arrow_forward</span>
          </Link>
          <h1 className="h4 fw-bold mb-0" style={{ color: "var(--on-surface)" }}>مقارنة العقارات</h1>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem" }}>
            تم اختيار <strong style={{ color: "var(--primary)" }}>{compareIds.length}</strong> من العقارات
          </span>
          <button className="btn btn-sm fw-bold" style={{ color: "var(--danger)", border: "1px solid var(--danger)" }} onClick={clearCompare}>
            مسح الكل
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="card border-0 overflow-hidden" style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}>
        <div className="row g-0">
          {/* Labels Column (Desktop) */}
          <div className="col-md-3 d-none d-md-flex flex-column" style={{ background: "var(--surface-container-low)" }}>
            <div style={{ height: 260, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "end", padding: "1.25rem" }}>
              <small style={{ color: "var(--on-surface-variant)", opacity: 0.6 }}>نظرة عامة</small>
            </div>
            {rows.map((row) => (
              <div key={row.label} style={{ height: 60, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 1.25rem", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--on-surface-variant)" }}>{row.icon}</span>
                <span style={{ color: "var(--on-surface)", fontSize: "0.9rem", fontWeight: 600 }}>{row.label}</span>
              </div>
            ))}
            <div style={{ height: 80, display: "flex", alignItems: "center", padding: "0 1.25rem" }} />
          </div>

          {/* Apartment Columns */}
          {compareIds.map((apt, idx) => (
            <div key={apt.id} className={`col-12 col-md-${9 / compareIds.length} d-flex flex-column`} style={{ borderRight: idx < compareIds.length - 1 ? "1px solid var(--border)" : "none" }}>
              {/* Image + Title */}
              <div style={{ height: 260, borderBottom: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                <img src={apt.image || "https://via.placeholder.com/400x220"} alt={apt.title} style={{ width: "100%", height: 180, objectFit: "cover" }} />
                <div style={{ padding: "0.75rem 1rem", background: "var(--surface-card)" }}>
                  <h3 className="fw-bold mb-0 truncate" style={{ color: "var(--primary)", fontSize: "1rem" }}>{apt.title}</h3>
                </div>
                <button onClick={() => removeCompare(apt.id)} className="position-absolute" style={{ top: 8, left: 8, width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>

              {/* Rows */}
              {rows.map((row) => (
                <div key={row.label} className="d-flex d-md-none align-items-center gap-2" style={{ height: 50, borderBottom: "1px solid var(--border)", padding: "0 1rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>{row.icon}</span>
                  <small className="fw-bold" style={{ color: "var(--on-surface-variant)" }}>{row.label}:</small>
                  {row.render(apt)}
                </div>
              ))}
              {rows.map((row) => (
                <div key={`desktop-${row.label}`} className="d-none d-md-flex align-items-center" style={{ height: 60, borderBottom: "1px solid var(--border)", padding: "0 1rem" }}>
                  {row.render(apt)}
                </div>
              ))}

              {/* Action */}
              <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 1rem" }}>
                <Link to={`/apartment/${apt.id}`} className="btn fw-bold w-100" style={{ borderRadius: "var(--radius-md)", background: "var(--surface-container-low)", color: "var(--primary)", border: "1px solid var(--border)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginLeft: 4 }}>visibility</span>
                  عرض التفاصيل
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Insights */}
      {compareIds.length >= 2 && (
        <div className="row g-4 mt-4">
          <div className="col-md-6">
            <div className="card border-0 p-4" style={{ borderRadius: "var(--radius-lg)", background: "var(--surface-container-low)", border: "1px solid var(--primary-container)" }}>
              <div className="d-flex align-items-start gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: "var(--primary-container)", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)" }}>trending_down</span>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: "var(--on-surface)" }}>أفضل قيمة مقابل السعر</h5>
                  <p className="mb-0" style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                    الشقة الأقل سعراً هي <strong style={{ color: "var(--primary)" }}>{compareIds.find((a) => (Number(a.price) || 0) === minPrice)?.title}</strong> بسعر {minPrice.toLocaleString("ar-EG")} ج.م شهرياً.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 p-4" style={{ borderRadius: "var(--radius-lg)", background: "var(--surface-container-low)", border: "1px solid var(--primary-container)" }}>
              <div className="d-flex align-items-start gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 48, height: 48, background: "var(--primary-container)", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)" }}>verified</span>
                </div>
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: "var(--on-surface)" }}>الأعلى تقييماً</h5>
                  <p className="mb-0" style={{ color: "var(--on-surface-variant)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                    الشقة الأعلى تقييماً هي <strong style={{ color: "var(--primary)" }}>{compareIds.find((a) => (Number(a.rating) || 0) === maxRating)?.title}</strong> بتقييم {maxRating > 0 ? maxRating.toFixed(1) : "—"}/5.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Compare;
