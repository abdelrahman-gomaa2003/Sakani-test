import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

const statusConfig = {
  pending: { label: "جديد", bg: "rgba(186,26,26,0.1)", color: "var(--error, #ba1a1a)", icon: "priority_high", fill: true },
  reviewing: { label: "قيد المراجعة", bg: "rgba(255,186,32,0.1)", color: "var(--tertiary, #583d00)", icon: "warning", fill: false },
  resolved: { label: "تم الحل", bg: "rgba(0,109,55,0.08)", color: "var(--success, #006d37)", icon: "check_circle", fill: false },
  dismissed: { label: "مرفوض", bg: "rgba(208,208,208,0.3)", color: "var(--on-surface-variant, #464555)", icon: "block", fill: false },
};

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  async function loadReports() {
    setLoading(true);
    const { data } = await adminService.getReports({ status: filterStatus === "all" ? undefined : filterStatus });
    setReports(data || []);
    if (data && data.length > 0 && !selectedReport) {
      setSelectedReport(data[0]);
    }
    setLoading(false);
  }

  async function handleAction(id, action) {
    setUpdatingId(id);
    await adminService.updateReportStatus(id, action);
    setUpdatingId(null);
    loadReports();
  }

  const stats = {
    pending: reports.filter((r) => r.status === "pending").length,
    reviewing: reports.filter((r) => r.status === "reviewing").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ fontSize: "1.75rem" }}>مركز إدارة البلاغات</h4>
          <p className="mb-0" style={{ fontSize: "0.9rem", color: "var(--on-surface-variant, #464555)" }}>
            مراجعة ومعالجة بلاغات المستخدمين والعقارات
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-4" style={{ borderBottom: "1px solid var(--outline-variant, #D0D0D0)" }}>
        {[
          { key: "all", label: "الكل" },
          { key: "pending", label: "جديدة", count: stats.pending },
          { key: "reviewing", label: "قيد المراجعة", count: stats.reviewing },
          { key: "resolved", label: "تم حلها", count: stats.resolved },
        ].map((tab) => (
          <button
            key={tab.key}
            className="pb-3 fw-bold border-0 bg-transparent"
            style={{
              fontSize: "0.875rem",
              color: filterStatus === tab.key ? "var(--primary)" : "var(--on-surface-variant, #464555)",
              borderBottom: filterStatus === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
            }}
            onClick={() => setFilterStatus(tab.key)}
          >
            {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-5 text-center">
          <div className="spinner-border" style={{ color: "var(--primary)" }} role="status">
            <span className="visually-hidden">جاري التحميل...</span>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, color: "var(--outline, #767586)" }}>check_circle</span>
          <p className="fw-bold" style={{ color: "var(--on-surface-variant, #464555)" }}>لا توجد بلاغات</p>
        </div>
      ) : (
        /* Split Layout */
        <div className="row g-4" style={{ minHeight: 500 }}>
          {/* Sidebar: Report List */}
          <div className="col-lg-4 d-flex flex-column gap-3" style={{ overflowY: "auto", maxHeight: 600 }}>
            {reports.map((report) => {
              const isActive = selectedReport?.id === report.id;
              const st = statusConfig[report.status] || statusConfig.pending;
              return (
                <div
                  key={report.id}
                  className="p-4 rounded-4 d-flex flex-column gap-2"
                  style={{
                    background: isActive ? "var(--surface-container-low, #eff4ff)" : "rgba(255,255,255,0.7)",
                    border: isActive ? "1px solid var(--outline-variant, #D0D0D0)" : "1px solid rgba(255,255,255,0.3)",
                    borderRight: isActive ? "4px solid var(--primary)" : "4px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="px-2 py-1 rounded-5 fw-bold d-flex align-items-center gap-1" style={{ fontSize: "0.65rem", background: st.bg, color: st.color }}>
                      {st.icon && (
                        <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: st.fill ? "'FILL' 1" : "unset" }}>{st.icon}</span>
                      )}
                      {st.label}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--outline, #767586)" }}>
                      {report.created_at ? new Date(report.created_at).toLocaleDateString("ar-EG") : ""}
                    </span>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ fontSize: "0.9rem" }}>{report.reason || "بلاغ"}</h6>
                    <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {report.description || "بدون وصف"}
                    </p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 28, height: 28, fontSize: "0.6rem", background: "rgba(106,254,156,0.2)", color: "var(--on-surface-variant, #464555)", border: "2px solid #fff" }}>
                      {report.profiles?.full_name?.[0] || "?"}
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--outline, #767586)" }}>
                      {report.apartments?.title || "عقار"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Detail View */}
          <div className="col-lg-8 rounded-4 overflow-hidden d-flex flex-column" style={{ background: "#fff", border: "1px solid rgba(208,208,208,0.3)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            {selectedReport ? (
              <>
                <div className="p-4 d-flex justify-content-between align-items-center" style={{ borderBottom: "1px solid var(--outline-variant, #D0D0D0)" }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-4 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: "rgba(186,26,26,0.08)", color: "var(--error, #ba1a1a)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 28 }}>emergency_home</span>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0" style={{ fontSize: "1.1rem" }}>تقرير: {selectedReport.reason || "بلاغ"}</h5>
                      <small style={{ color: "var(--outline, #767586)", fontSize: "0.8rem" }}>
                        تاريخ البلاغ: {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleDateString("ar-EG") : "—"}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="flex-grow-1 p-4" style={{ overflowY: "auto" }}>
                  {/* Participants */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="p-4 rounded-4" style={{ border: "1px solid rgba(208,208,208,0.4)" }}>
                        <p className="mb-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--outline, #767586)", textTransform: "uppercase" }}>مقدم البلاغ</p>
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 48, height: 48, background: "rgba(106,254,156,0.2)", color: "var(--on-surface-variant, #464555)" }}>
                            {selectedReport.profiles?.full_name?.[0] || "?"}
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0" style={{ fontSize: "0.9rem" }}>{selectedReport.profiles?.full_name || "مستخدم"}</h6>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-4 rounded-4" style={{ border: "1px solid rgba(208,208,208,0.4)" }}>
                        <p className="mb-3" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--outline, #767586)", textTransform: "uppercase" }}>العقار المُبلّغ عنه</p>
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: "var(--surface-container, #e5eeff)" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 24, color: "var(--primary)" }}>apartment</span>
                          </div>
                          <div>
                            <h6 className="fw-bold mb-0" style={{ fontSize: "0.9rem" }}>{selectedReport.apartments?.title || "عقار"}</h6>
                            <small style={{ fontSize: "0.75rem", color: "var(--on-surface-variant, #464555)" }}>
                              {selectedReport.apartments?.neighborhood || "الفيوم"}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2 d-flex align-items-center gap-2" style={{ fontSize: "0.875rem" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--primary)" }}>description</span>
                      وصف المشكلة
                    </h6>
                    <div className="p-4 rounded-4" style={{ background: "var(--surface-container-low, #eff4ff)", fontSize: "0.875rem", lineHeight: 1.8, color: "var(--on-surface-variant, #464555)" }}>
                      {selectedReport.description || "لا يوجد وصف تفصيلي لهذا البلاغ."}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 d-flex justify-content-between align-items-center" style={{ background: "var(--surface-container-low, #eff4ff)", borderTop: "1px solid var(--outline-variant, #D0D0D0)" }}>
                  <div className="d-flex gap-2">
                    {selectedReport.status === "pending" && (
                      <button
                        className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-3 text-white fw-bold"
                        style={{ background: "var(--primary)", fontSize: "0.875rem" }}
                        disabled={updatingId === selectedReport.id}
                        onClick={() => handleAction(selectedReport.id, "reviewing")}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>rate_review</span>
                        مراجعة البلاغ
                      </button>
                    )}
                    {selectedReport.status === "reviewing" && (
                      <>
                        <button
                          className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-3 text-white fw-bold"
                          style={{ background: "var(--success, #006d37)", fontSize: "0.875rem" }}
                          disabled={updatingId === selectedReport.id}
                          onClick={() => handleAction(selectedReport.id, "resolved")}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                          تم الحل
                        </button>
                        <button
                          className="btn d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-bold border-0"
                          style={{ color: "var(--error, #ba1a1a)", fontSize: "0.875rem" }}
                          disabled={updatingId === selectedReport.id}
                          onClick={() => handleAction(selectedReport.id, "dismissed")}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>block</span>
                          رفض البلاغ
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                <p style={{ color: "var(--outline, #767586)" }}>اختر بلاغاً لعرض التفاصيل</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;
