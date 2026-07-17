import { useState, useEffect, useCallback } from "react";
import { adminService } from "../../services/adminService";
import { exportToCSV } from "../../utils/exportUtils";
import toast from "react-hot-toast";

const statusConfig = {
  pending: { label: "بانتظار المراجعة", color: "#b45309", bg: "rgba(245,158,11,0.12)", dot: "#f59e0b", icon: "schedule" },
  approved: { label: "معتمدة", color: "#006d37", bg: "rgba(106,254,156,0.18)", dot: "#006d37", icon: "check_circle" },
  hidden: { label: "مخفي", color: "#64748b", bg: "rgba(100,116,139,0.1)", dot: "#94a3b8", icon: "visibility_off" },
  rejected: { label: "مرفوضة", color: "#ba1a1a", bg: "rgba(255,218,214,0.5)", dot: "#ba1a1a", icon: "cancel" },
};

const typeBadge = {
  owner: { label: "مالك", icon: "apartment", color: "#b45309", bg: "rgba(255,186,32,0.12)", border: "rgba(255,186,32,0.25)" },
  broker: { label: "وسيط", icon: "handshake", color: "#6B9080", bg: "rgba(107,144,128,0.12)", border: "rgba(107,144,128,0.25)" },
  student: { label: "طالب", icon: "school", color: "#006d37", bg: "rgba(0,109,55,0.1)", border: "rgba(0,109,55,0.2)" },
  admin: { label: "مدير", icon: "admin_panel_settings", color: "#ba1a1a", bg: "rgba(186,26,26,0.08)", border: "rgba(186,26,26,0.15)" },
};

const apartmentTypes = { room: "غرفة", apartment: "شقة", shared: "مشتركة", studio: "استوديو" };

const neighborhoodLabels = {
  dala: "دلة", sawaqi: "السواقي", algon: "الجون", central: "السنترال",
  hawatem: "الحواتم", lotfallah: "لطف الله", sawy: "الصوفي", baghouz: "باغوص",
  "keman-fares": "كيمان فارس", salakhana: "السلخانة", "sheikh-hassan": "الشيخ حسن",
  damo: "دمو", masla: "المسلة", "dar-alramad": "دار الرماد",
};

const verificationLabels = { pending: "بانتظار الاعتماد", approved: "معتمد", rejected: "مرفوض" };
const verificationColors = { pending: "#b45309", approved: "#006d37", rejected: "#ba1a1a" };

function AdminApartments() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const [detailApt, setDetailApt] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const perPage = 10;

  useEffect(() => { loadApartments(); }, [filterStatus]);

  async function loadApartments() {
    setLoading(true);
    const { data } = await adminService.getAllApartments({ status: filterStatus, limit: 50 });
    setApartments(data || []);
    setLoading(false);
  }

  async function handleAction(id, action, reason) {
    setUpdatingId(id);
    if (action === "delete") {
      await adminService.deleteApartment(id);
    } else if (action === "hide") {
      await adminService.hideApartment(id);
    } else {
      await adminService.updateApartmentStatus(id, action, reason);
    }
    setUpdatingId(null);
    setShowConfirm(null);
    setRejectModal(null);
    setRejectReason("");
    setDetailApt(null);
    toast.success(action === "approved" ? "تم اعتماد العقار" : action === "rejected" ? "تم رفض العقار" : action === "hide" ? "تم إخفاء العقار" : "تم الحذف");
    loadApartments();
  }

  const openDetail = useCallback((apt) => {
    setDetailApt(apt);
    setGalleryIndex(0);
  }, []);

  const totalPages = Math.ceil(apartments.length / perPage);
  const paginated = apartments.slice((page - 1) * perPage, page * perPage);

  const detailStyles = `
    @keyframes aptModalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .apt-detail-modal { animation: aptModalIn 0.3s ease; }
    .apt-gallery-thumb { cursor: pointer; opacity: 0.6; transition: all 0.2s; border: 2px solid transparent; }
    .apt-gallery-thumb:hover, .apt-gallery-thumb.active { opacity: 1; border-color: var(--primary); }
    .apt-info-card { background: var(--surface-container-low, #f8f9fa); border-radius: var(--radius-md, 12px); padding: 14px 16px; border: 1px solid rgba(208,208,208,0.2); }
    .apt-info-label { font-size: var(--fs-xs); color: var(--on-surface-variant, #64748b); margin-bottom: 4px; }
    .apt-info-value { font-size: var(--fs-sm); font-weight: 600; color: var(--on-surface, #1A1D23); margin: 0; }
    .apt-amenity-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 20px; font-size: var(--fs-xs); font-weight: 600; background: rgba(107,144,128,0.08); color: var(--on-surface, #1A1D23); border: 1px solid rgba(107,144,128,0.15); }
    .apt-detail-overlay { animation: aptOverlayIn 0.2s ease; }
    @keyframes aptOverlayIn { from { opacity: 0; } to { opacity: 1; } }
    .apt-reject-textarea { border: 2px solid #ba1a1a; border-radius: var(--radius-md, 12px); padding: 12px; font-size: var(--fs-sm); resize: vertical; width: 100%; }
    .apt-reject-textarea:focus { outline: none; box-shadow: 0 0 0 3px rgba(186,26,26,0.1); }
  `;

  return (
    <div className="d-flex flex-column gap-4">
      <style>{`
        .apt-table tbody tr { transition: background 0.15s ease; }
        .apt-table tbody tr:nth-child(even) { background: rgba(107,144,128,0.02); }
        .apt-table tbody tr:hover { background: rgba(107,144,128,0.06); }
        .apt-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; font-size: var(--fs-xs); font-weight: 700; }
        .apt-action-btn { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s ease; }
        .apt-action-btn:hover { transform: translateY(-1px); }
        .apt-action-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .apt-filter-btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: var(--radius-md); font-size: var(--fs-xs); font-weight: 700; border: 1.5px solid var(--outline-variant, #D0D0D0); cursor: pointer; transition: all 0.2s ease; background: transparent; }
        .apt-filter-btn:hover { border-color: var(--primary); color: var(--primary); }
        .apt-filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        .apt-view-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 8px; font-size: var(--fs-xs); font-weight: 700; border: none; cursor: pointer; transition: all 0.2s ease; background: rgba(107,144,128,0.08); color: var(--primary); }
        .apt-view-btn:hover { background: var(--primary); color: white; }
        ${detailStyles}
      `}</style>

      {/* Page Title */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontSize: "var(--fs-xl)" }}>إدارة الوحدات السكنية</h4>
          <p className="mb-0" style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface-variant, #64748b)" }}>مراجعة والتحكم في كافة العقارات المدرجة في المنصة</p>
        </div>
        <button className="btn btn-outline-primary d-flex align-items-center gap-2" style={{ fontSize: "var(--fs-xs)", borderRadius: "var(--radius-md)" }} onClick={() => {
          const exportData = apartments.map((a) => ({ "العنوان": a.title || "", "الحي": a.neighborhood || "", "السعر": a.price || 0, "الحالة": a.status === "approved" ? "معتمدة" : a.status === "pending" ? "قيد المراجعة" : a.status === "rejected" ? "مرفوضة" : "مخفي", "المشاهدات": a.views || 0 }));
          exportToCSV(exportData, "العقارات");
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>تصدير CSV
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 flex-wrap">
        {[
          { key: "all", label: "الكل", count: apartments.length, icon: "filter_list" },
          { key: "pending", label: "قيد المراجعة", icon: "schedule" },
          { key: "approved", label: "معتمدة", icon: "check_circle" },
          { key: "hidden", label: "مخفي", icon: "visibility_off" },
          { key: "rejected", label: "مرفوضة", icon: "cancel" },
        ].map((f) => (
          <button key={f.key} className={`apt-filter-btn ${filterStatus === f.key ? "active" : ""}`} onClick={() => { setFilterStatus(f.key); setPage(1); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{f.icon}</span>
            {f.label}{f.key === "all" ? ` (${f.count})` : ""}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-4 overflow-hidden" style={{ background: "var(--surface-card, #fff)", border: "1px solid rgba(208,208,208,0.25)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div className="p-5 text-center"><div className="spinner-border" style={{ color: "var(--primary)" }} role="status"><span className="visually-hidden">جاري التحميل...</span></div></div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined mb-3" style={{ fontSize: 56, color: "var(--outline, #94a3b8)" }}>apartment</span>
            <p className="fw-bold mb-1" style={{ fontSize: "var(--fs-lg)", color: "var(--on-surface-variant, #64748b)" }}>لا توجد وحدات</p>
            <p className="mb-0" style={{ fontSize: "var(--fs-sm)", color: "var(--outline, #94a3b8)" }}>لم يتم إضافة أي عقارات بعد</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0 apt-table">
              <thead>
                <tr style={{ background: "var(--surface-container-low, #f0f4f8)" }}>
                  {["العقار", "المالك", "السعر", "الحالة", "المشاهدات", "الإجراءات"].map((h) => (
                    <th key={h} className="px-4 py-3 fw-bold" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #64748b)", borderBottom: "2px solid rgba(208,208,208,0.25)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((apt) => {
                  const st = statusConfig[apt.status] || statusConfig.pending;
                  const owner = apt.profiles;
                  const badge = typeBadge[owner?.role] || typeBadge.owner;
                  return (
                    <tr key={apt.id} style={{ borderBottom: "1px solid rgba(208,208,208,0.12)" }}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3" style={{ cursor: "pointer" }} onClick={() => openDetail(apt)}>
                          <div className="rounded-3 overflow-hidden" style={{ width: 68, height: 50, flexShrink: 0, background: "var(--surface-container, #e5eeff)" }}>
                            {apt.images?.[0] ? <img src={apt.images[0]} alt={apt.title} className="w-100 h-100" style={{ objectFit: "cover" }} /> : <div className="w-100 h-100 d-flex align-items-center justify-content-center"><span className="material-symbols-outlined" style={{ fontSize: 26, color: "var(--outline, #94a3b8)" }}>image</span></div>}
                          </div>
                          <div>
                            <p className="fw-bold mb-1" style={{ fontSize: "var(--fs-sm)", color: "var(--primary)", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: "3px" }}>{apt.title}</p>
                            <div className="d-flex align-items-center gap-1" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #64748b)" }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                              {neighborhoodLabels[apt.neighborhood] || apt.neighborhood || "الفيوم"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex flex-column gap-1">
                          <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--on-surface, #1A1D23)" }}>{owner?.full_name || "غير معروف"}</span>
                          <span className="apt-badge" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, width: "fit-content" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{badge.icon}</span>{badge.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="fw-bold" style={{ fontSize: "var(--fs-sm)", color: "var(--primary)" }}>{(apt.price || 0).toLocaleString("ar-EG")} ج.م</span></td>
                      <td className="px-4 py-3">
                        <span className="apt-badge" style={{ background: st.bg, color: st.color }}><span className="rounded-circle" style={{ width: 7, height: 7, background: st.dot }} />{st.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ fontSize: "var(--fs-xs)", background: "var(--surface-container-low, #f0f4f8)", color: "var(--on-surface-variant)", fontWeight: 600 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>{apt.views || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="d-flex justify-content-end gap-1">
                          <button className="apt-view-btn" onClick={() => openDetail(apt)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>عرض
                          </button>
                          {apt.status === "pending" && (
                            <>
                              <button className="apt-action-btn" style={{ background: "rgba(0,109,55,0.08)", color: "#006d37" }} title="اعتماد" disabled={updatingId === apt.id} onClick={() => handleAction(apt.id, "approved")}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span></button>
                              <button className="apt-action-btn" style={{ background: "rgba(186,26,26,0.08)", color: "#ba1a1a" }} title="رفض" disabled={updatingId === apt.id} onClick={() => { setRejectModal(apt); setRejectReason(""); }}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>cancel</span></button>
                            </>
                          )}
                          {apt.status === "approved" && <button className="apt-action-btn" style={{ background: "var(--surface-container-high, #dce9ff)", color: "var(--on-surface-variant, #64748b)" }} title="إخفاء" disabled={updatingId === apt.id} onClick={() => handleAction(apt.id, "hide")}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility_off</span></button>}
                          {apt.status === "hidden" && <button className="apt-action-btn" style={{ background: "rgba(0,109,55,0.08)", color: "#006d37" }} title="إظهار" disabled={updatingId === apt.id} onClick={() => handleAction(apt.id, "approved")}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility</span></button>}
                          <button className="apt-action-btn" style={{ background: "rgba(186,26,26,0.08)", color: "#ba1a1a" }} title="حذف" onClick={() => setShowConfirm(apt.id)}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="p-3 d-flex justify-content-between align-items-center" style={{ background: "var(--surface-container-low, #f0f4f8)", borderTop: "1px solid rgba(208,208,208,0.25)" }}>
            <p className="mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #64748b)" }}>صفحة {page} من {totalPages}</p>
            <div className="d-flex gap-1">
              <button className="btn btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)} style={{ borderRadius: "var(--radius-md)" }}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span></button>
              <button className="btn btn-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ borderRadius: "var(--radius-md)" }}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span></button>
            </div>
          </div>
        )}
      </div>

      {/* ============ DETAIL MODAL ============ */}
      {detailApt && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100 apt-detail-overlay" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050, backdropFilter: "blur(4px)" }} onClick={() => setDetailApt(null)} />
          <div className="position-fixed top-50 start-50 translate-middle apt-detail-modal" style={{ zIndex: 1051, width: "94%", maxWidth: 900, maxHeight: "92vh", overflowY: "auto", background: "var(--surface-card, #fff)", borderRadius: "var(--radius-lg, 20px)", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: "rgba(208,208,208,0.25)", position: "sticky", top: 0, background: "var(--surface-card, #fff)", zIndex: 2, borderRadius: "var(--radius-lg, 20px) var(--radius-lg, 20px) 0 0" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: statusConfig[detailApt.status]?.bg || "rgba(0,0,0,0.05)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: statusConfig[detailApt.status]?.color }}>{statusConfig[detailApt.status]?.icon || "apartment"}</span>
                </div>
                <div>
                  <h5 className="fw-bold mb-0" style={{ fontSize: "var(--fs-lg)" }}>تفاصيل العقار</h5>
                  <p className="mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #64748b)" }}>{statusConfig[detailApt.status]?.label}</p>
                </div>
              </div>
              <button className="btn p-2 rounded-circle" style={{ background: "var(--surface-container-low, #f0f4f8)" }} onClick={() => setDetailApt(null)}><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="p-4">
              {/* Gallery */}
              {detailApt.images?.length > 0 && (
                <div className="mb-4">
                  <div className="rounded-4 overflow-hidden position-relative" style={{ background: "#000", aspectRatio: "16/9", maxHeight: 420 }}>
                    <img src={detailApt.images[galleryIndex]} alt="" className="w-100 h-100" style={{ objectFit: "contain" }} />
                    {detailApt.images.length > 1 && (
                      <>
                        <button className="position-absolute top-50 start-0 translate-middle-y btn btn-sm rounded-circle m-2" style={{ background: "rgba(0,0,0,0.6)", color: "white", width: 36, height: 36 }} onClick={() => setGalleryIndex((galleryIndex - 1 + detailApt.images.length) % detailApt.images.length)}>
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                        <button className="position-absolute top-50 end-0 translate-middle-y btn btn-sm rounded-circle m-2" style={{ background: "rgba(0,0,0,0.6)", color: "white", width: 36, height: 36 }} onClick={() => setGalleryIndex((galleryIndex + 1) % detailApt.images.length)}>
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                      </>
                    )}
                    <div className="position-absolute bottom-0 start-0 end-0 p-2 d-flex justify-content-center gap-1" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
                      {detailApt.images.map((_, i) => <span key={i} onClick={() => setGalleryIndex(i)} style={{ width: 8, height: 8, borderRadius: "50%", background: i === galleryIndex ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 0.2s" }} />)}
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-2 overflow-auto pb-1">
                    {detailApt.images.map((img, i) => <img key={i} src={img} alt="" className={`apt-gallery-thumb rounded-2 flex-shrink-0 ${i === galleryIndex ? "active" : ""}`} style={{ width: 64, height: 48, objectFit: "cover" }} onClick={() => setGalleryIndex(i)} />)}
                  </div>
                </div>
              )}

              {/* Video */}
              {detailApt.video_url && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: "var(--fs-sm)" }}><span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>videocam</span>فيديو العقار</h6>
                  <div className="rounded-4 overflow-hidden" style={{ background: "#000", maxWidth: 600 }}>
                    <video src={detailApt.video_url} controls className="w-100" style={{ maxHeight: 360 }} />
                  </div>
                </div>
              )}

              {/* Title + Description */}
              <div className="mb-4">
                <h4 className="fw-bold mb-1" style={{ fontSize: "var(--fs-lg)" }}>{detailApt.title}</h4>
                <p className="mb-0" style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface-variant, #64748b)", lineHeight: 1.8 }}>{detailApt.description}</p>
              </div>

              {/* Info Cards Grid */}
              <div className="row g-3 mb-4">
                {[
                  { icon: "apartment", label: "نوع العقار", value: apartmentTypes[detailApt.apartment_type] || detailApt.apartment_type },
                  { icon: "payments", label: "السعر الشهري", value: `${(detailApt.price || 0).toLocaleString("ar-EG")} ج.م`, color: "var(--primary)" },
                  { icon: "square_foot", label: "المساحة", value: detailApt.area ? `${detailApt.area} م²` : "—" },
                  { icon: "bed", label: "الغرف", value: detailApt.bedrooms || "—" },
                  { icon: "bathtub", label: "الحمامات", value: detailApt.bathrooms || "—" },
                  { icon: "location_on", label: "الحي", value: neighborhoodLabels[detailApt.neighborhood] || detailApt.neighborhood || "—" },
                  { icon: "home", label: "المدينة", value: detailApt.city || "الفيوم" },
                  { icon: "pin_drop", label: "العنوان", value: detailApt.address || "—" },
                  { icon: "visibility", label: "المشاهدات", value: detailApt.views || 0 },
                ].map((item, i) => (
                  <div key={i} className="col-6 col-md-4">
                    <div className="apt-info-card h-100">
                      <div className="d-flex align-items-center gap-1 apt-info-label"><span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--primary)" }}>{item.icon}</span>{item.label}</div>
                      <p className="apt-info-value" style={{ color: item.color || undefined }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coordinates */}
              {(detailApt.latitude || detailApt.longitude) && (
                <div className="mb-4">
                  <div className="apt-info-card">
                    <div className="d-flex align-items-center gap-1 apt-info-label"><span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--primary)" }}>my_location</span>الإحداثيات</div>
                    <p className="apt-info-value" style={{ fontSize: "var(--fs-xs)", fontFamily: "monospace" }}>
                      {detailApt.latitude?.toFixed(6)}, {detailApt.longitude?.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}

              {/* Map */}
              {detailApt.latitude && detailApt.longitude && (
                <div className="mb-4">
                  <div className="rounded-4 overflow-hidden border" style={{ height: 250 }}>
                    <iframe
                      title="apartment-map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${detailApt.longitude - 0.01}%2C${detailApt.latitude - 0.01}%2C${detailApt.longitude + 0.01}%2C${detailApt.latitude + 0.01}&layer=mapnik&marker=${detailApt.latitude}%2C${detailApt.longitude}`}
                    />
                  </div>
                </div>
              )}

              {/* Amenities */}
              {detailApt.amenities?.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2" style={{ fontSize: "var(--fs-sm)" }}>المرافق</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {detailApt.amenities.map((a, i) => <span key={i} className="apt-amenity-chip"><span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--primary)" }}>check_circle</span>{a}</span>)}
                  </div>
                </div>
              )}

              {/* Owner Info */}
              {detailApt.profiles && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-2" style={{ fontSize: "var(--fs-sm)" }}>بيانات المالك</h6>
                  <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: "var(--surface-container-low, #f8f9fa)", border: "1px solid rgba(208,208,208,0.2)" }}>
                    {detailApt.profiles.avatar_url ? (
                      <img src={detailApt.profiles.avatar_url} alt="" className="rounded-circle" style={{ width: 52, height: 52, objectFit: "cover", border: "2px solid rgba(107,144,128,0.2)" }} />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 52, height: 52, background: "var(--primary)", fontSize: 20 }}>{detailApt.profiles.full_name?.[0] || "م"}</div>
                    )}
                    <div className="flex-grow-1">
                      <p className="fw-bold mb-0" style={{ fontSize: "var(--fs-sm)" }}>{detailApt.profiles.full_name}</p>
                      <div className="d-flex flex-wrap gap-3 mt-1" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #64748b)" }}>
                        <span className="d-flex align-items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>email</span>{detailApt.profiles.email || "—"}</span>
                        <span className="d-flex align-items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: 14 }}>phone</span>{detailApt.profiles.phone || "—"}</span>
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span className="apt-badge" style={{ background: typeBadge[detailApt.profiles.role]?.bg, color: typeBadge[detailApt.profiles.role]?.color, border: `1px solid ${typeBadge[detailApt.profiles.role]?.border}` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{typeBadge[detailApt.profiles.role]?.icon}</span>
                        {typeBadge[detailApt.profiles.role]?.label || detailApt.profiles.role}
                      </span>
                      <span style={{ fontSize: "var(--fs-xs)", color: verificationColors[detailApt.profiles.verification_status] || "#64748b", fontWeight: 600 }}>
                        {verificationLabels[detailApt.profiles.verification_status] || detailApt.profiles.verification_status || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Publish Info */}
              <div className="mb-4">
                <h6 className="fw-bold mb-2" style={{ fontSize: "var(--fs-sm)" }}>بيانات النشر</h6>
                <div className="row g-3">
                  <div className="col-6"><div className="apt-info-card"><div className="d-flex align-items-center gap-1 apt-info-label"><span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--primary)" }}>calendar_today</span>تاريخ الإضافة</div><p className="apt-info-value">{detailApt.created_at ? new Date(detailApt.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p></div></div>
                  <div className="col-6"><div className="apt-info-card"><div className="d-flex align-items-center gap-1 apt-info-label"><span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--primary)" }}>update</span>آخر تحديث</div><p className="apt-info-value">{detailApt.updated_at ? new Date(detailApt.updated_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p></div></div>
                </div>
              </div>

              {/* Admin Actions */}
              {detailApt.status === "pending" && (
                <div className="p-4 rounded-4 d-flex flex-column flex-sm-row gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <div className="flex-grow-1 d-flex align-items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#b45309" }}>info</span>
                    <span style={{ fontSize: "var(--fs-sm)", color: "#b45309", fontWeight: 600 }}>هذا العقار بانتظار مراجعتك واتخاذ القرار</span>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn d-flex align-items-center gap-2 fw-bold" style={{ background: "#006d37", color: "white", borderRadius: "var(--radius-md, 12px)", fontSize: "var(--fs-xs)", padding: "10px 20px" }} disabled={updatingId === detailApt.id} onClick={() => handleAction(detailApt.id, "approved")}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>اعتماد العقار
                    </button>
                    <button className="btn d-flex align-items-center gap-2 fw-bold" style={{ background: "#ba1a1a", color: "white", borderRadius: "var(--radius-md, 12px)", fontSize: "var(--fs-xs)", padding: "10px 20px" }} disabled={updatingId === detailApt.id} onClick={() => { setRejectModal(detailApt); setRejectReason(""); }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cancel</span>رفض العقار
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ============ REJECT REASON MODAL ============ */}
      {rejectModal && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1100, backdropFilter: "blur(4px)" }} onClick={() => { setRejectModal(null); setRejectReason(""); }} />
          <div className="position-fixed top-50 start-50 translate-middle apt-detail-modal" style={{ zIndex: 1101, width: "90%", maxWidth: 480, background: "var(--surface-card, #fff)", borderRadius: "var(--radius-lg, 20px)", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: "rgba(208,208,208,0.25)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: "var(--fs-lg)", color: "#ba1a1a" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>cancel</span>رفض العقار
              </h5>
              <button className="btn p-2 rounded-circle" style={{ background: "var(--surface-container-low, #f0f4f8)" }} onClick={() => { setRejectModal(null); setRejectReason(""); }}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-4">
              <p className="mb-3" style={{ fontSize: "var(--fs-sm)", color: "var(--on-surface-variant, #64748b)" }}>
                أنت على رفض عقار <strong>{rejectModal.title}</strong>. يرجى كتابة سبب الرفض:
              </p>
              <textarea className="apt-reject-textarea" rows={4} placeholder="اكتب سبب الرفض هنا (إلزامي)..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} autoFocus />
              {!rejectReason.trim() && <p className="small mt-2 mb-0" style={{ color: "#ba1a1a", fontSize: "var(--fs-xs)" }}>* سبب الرفض مطلوب</p>}
            </div>
            <div className="p-4 border-top d-flex gap-3" style={{ borderColor: "rgba(208,208,208,0.25)" }}>
              <button className="btn flex-grow-1 fw-bold" style={{ background: "var(--surface-container-low, #f0f4f8)", borderRadius: "var(--radius-md, 12px)", fontSize: "var(--fs-xs)" }} onClick={() => { setRejectModal(null); setRejectReason(""); }}>إلغاء</button>
              <button className="btn flex-grow-1 fw-bold text-white" style={{ background: "#ba1a1a", borderRadius: "var(--radius-md, 12px)", fontSize: "var(--fs-xs)" }} disabled={!rejectReason.trim() || updatingId === rejectModal.id} onClick={() => handleAction(rejectModal.id, "rejected", rejectReason)}>
                {updatingId === rejectModal.id ? <span className="spinner-border spinner-border-sm" /> : "تأكيد الرفض"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ DELETE CONFIRM MODAL ============ */}
      {showConfirm && (
        <>
          <div className="position-fixed top-0 start-0 bottom-0 w-100" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }} onClick={() => setShowConfirm(null)} />
          <div className="position-fixed top-50 start-50 translate-middle p-4 rounded-4 apt-detail-modal" style={{ background: "#fff", zIndex: 1051, width: "90%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div className="text-center">
              <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, color: "var(--error, #ba1a1a)" }}>warning</span>
              <h5 className="fw-bold">تأكيد الحذف</h5>
              <p style={{ color: "var(--on-surface-variant, #464555)" }}>هل أنت متأكد من حذف هذه الوحدة؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="d-flex gap-2 mt-3">
                <button className="btn flex-grow-1" style={{ border: "1px solid var(--outline-variant, #D0D0D0)" }} onClick={() => setShowConfirm(null)}>إلغاء</button>
                <button className="btn flex-grow-1 text-white" style={{ background: "var(--error, #ba1a1a)" }} onClick={() => handleAction(showConfirm, "delete")}>حذف</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminApartments;
