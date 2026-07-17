import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";
import { serverAPI } from "../../services/serverAPI";
import AnimatedCounter from "../../components/ui/AnimatedCounter";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [apartmentsByStatus, setApartmentsByStatus] = useState([]);
  const [usersByRole, setUsersByRole] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const distChartRef = useRef(null);
  const regInstance = useRef(null);
  const distInstance = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [statsData, byStatus, byRole, , reports] = await Promise.all([
        adminService.getStats(),
        adminService.getApartmentsByStatus(),
        adminService.getUsersByRole(),
        adminService.getRecentApartments(5),
        adminService.getReports({ limit: 5 }),
      ]);
      setStats(statsData);
      setApartmentsByStatus(byStatus);
      setUsersByRole(byRole);
      setRecentReports(reports.data || []);
      setLoading(false);
    };
    loadData();
    return () => {
      if (regInstance.current) regInstance.current.destroy();
      if (distInstance.current) distInstance.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (!loading && apartmentsByStatus.length > 0 && distChartRef.current) {
      if (distInstance.current) distInstance.current.destroy();
      const colors = ["#567568", "#6B9080", "#CCE3D7", "#E8D5B7", "#f1f1ff"];
      const labels = apartmentsByStatus.map((s) => {
        const map = { pending: "بانتظار المراجعة", approved: "معتمدة", hidden: "مخفي", rejected: "مرفوضة" };
        return map[s.status] || s.status;
      });
      const data = apartmentsByStatus.map((s) => s.count);
      distInstance.current = new Chart(distChartRef.current, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors.slice(0, data.length), borderWidth: 0, hoverOffset: 10 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "75%",
          plugins: { legend: { display: false } },
        },
      });
    }
  }, [loading, apartmentsByStatus]);

  const handleDownloadReport = async () => {
    try {
      toast.loading("جاري تحميل التقرير...", { id: "pdf" });
      const blob = await serverAPI.getAdminReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sakani-admin-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم التحميل بنجاح", { id: "pdf" });
    } catch {
      toast.error("فشل تحميل التقرير — تأكد أن السيرفر يعمل", { id: "pdf" });
    }
  };

  const statCards = stats
    ? [
        { icon: "group", label: "المستخدمين", value: stats.totalUsers, bg: "rgba(86,117,104,0.08)", color: "var(--primary)" },
        { icon: "school", label: "الطلاب", value: stats.totalStudents, bg: "rgba(0,109,55,0.08)", color: "var(--success, #006d37)" },
        { icon: "real_estate_agent", label: "الملاك", value: stats.totalOwners, bg: "rgba(88,61,0,0.08)", color: "var(--tertiary, #583d00)" },
        { icon: "handshake", label: "الوسطاء", value: stats.totalBrokers, bg: "rgba(107,144,128,0.08)", color: "var(--primary-container, #6B9080)" },
        { icon: "apartment", label: "الوحدات", value: stats.totalApartments, bg: "rgba(86,117,104,0.08)", color: "var(--primary)" },
        { icon: "pending_actions", label: "قيد المراجعة", value: stats.pendingApartments, bg: "rgba(186,26,26,0.08)", color: "var(--error, #ba1a1a)" },
        { icon: "report_problem", label: "البلاغات", value: stats.activeReports, bg: "rgba(186,26,26,0.08)", color: "var(--error, #ba1a1a)" },
        { icon: "mail", label: "الرسائل", value: stats.totalMessages, bg: "rgba(107,144,128,0.08)", color: "var(--primary-container, #6B9080)" },
      ]
    : [];

  if (loading) {
    return (
      <div className="d-flex flex-column gap-4">
        <div className="row g-3">
          {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="col-6 col-md-3 admin-stat-anim">
              <div className="p-3 rounded-4 h-100" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <div className="placeholder-glow">
                  <span className="placeholder col-6 rounded-2 mb-2" style={{ height: 36 }} />
                  <span className="placeholder col-4 rounded-2 mb-1" style={{ height: 20 }} />
                  <span className="placeholder col-3 rounded-2" style={{ height: 12 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .admin-stat-anim { animation: fadeSlideUp 0.5s ease both; }
        .admin-stat-anim:nth-child(1) { animation-delay: 0.05s; }
        .admin-stat-anim:nth-child(2) { animation-delay: 0.08s; }
        .admin-stat-anim:nth-child(3) { animation-delay: 0.11s; }
        .admin-stat-anim:nth-child(4) { animation-delay: 0.14s; }
        .admin-stat-anim:nth-child(5) { animation-delay: 0.17s; }
        .admin-stat-anim:nth-child(6) { animation-delay: 0.2s; }
        .admin-stat-anim:nth-child(7) { animation-delay: 0.23s; }
        .admin-stat-anim:nth-child(8) { animation-delay: 0.26s; }
        .admin-stat-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .admin-stat-card:hover { transform: translateY(-5px) !important; box-shadow: 0 12px 32px rgba(107,144,128,0.15) !important; }
      `}</style>
      {/* Stat Cards */}
      <div className="row g-3">
        {statCards.map((s, i) => (
          <div key={i} className="col-6 col-md-3 admin-stat-anim">
            <div
              className="p-4 rounded-4 h-100 admin-stat-card"
              style={{ background: "var(--surface-card, #fff)", backdropFilter: "blur(12px)", border: "1px solid rgba(208,208,208,0.2)", boxShadow: "0 4px 20px rgba(107,144,128,0.06)" }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 52, height: 52, background: s.bg, color: s.color }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{s.icon}</span>
                </div>
                <span style={{ fontSize: "var(--fs-xs)", fontWeight: 600 }}>{s.label}</span>
              </div>
              <h5 className="fw-bold mb-0" style={{ fontSize: "var(--fs-xl)" }}><AnimatedCounter target={s.value} /></h5>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="p-4 rounded-4 h-100" style={{ background: "var(--surface-card, #fff)", backdropFilter: "blur(12px)", border: "1px solid rgba(208,208,208,0.2)", boxShadow: "0 4px 20px rgba(107,144,128,0.06)" }}>
            <h6 className="fw-bold mb-4" style={{ fontSize: "var(--fs-base)" }}>توزيع حالات الوحدات</h6>
            <div style={{ height: 250 }}>
              <canvas ref={distChartRef} />
            </div>
            <div className="row g-2 mt-3">
              {apartmentsByStatus.map((s, i) => {
                const map = { pending: "بانتظار المراجعة", approved: "معتمدة", hidden: "مخفي", rejected: "مرفوضة" };
                const colors = ["#E8D5B7", "#567568", "#CCE3D7", "#f1f1ff"];
                return (
                  <div key={i} className="col-6">
                    <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.7rem" }}>
                      <span className="rounded-circle" style={{ width: 8, height: 8, background: colors[i] }} />
                      {map[s.status]} ({s.count})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="p-4 rounded-4 h-100" style={{ background: "var(--surface-card, #fff)", backdropFilter: "blur(12px)", border: "1px solid rgba(208,208,208,0.2)", boxShadow: "0 4px 20px rgba(107,144,128,0.06)" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0" style={{ fontSize: "var(--fs-base)" }}>توزيع المستخدمين حسب الدور</h6>
            </div>
            <div className="row g-3">
              {usersByRole.map((r, i) => {
                const map = { student: "الطلاب", owner: "الملاك", broker: "الوسطاء", admin: "المديرين" };
                const icons = { student: "school", owner: "real_estate_agent", broker: "handshake", admin: "admin_panel_settings" };
                const colors = ["var(--primary)", "var(--tertiary, #583d00)", "var(--success, #006d37)", "#ba1a1a"];
                const bgs = ["rgba(86,117,104,0.08)", "rgba(88,61,0,0.08)", "rgba(0,109,55,0.08)", "rgba(186,26,26,0.08)"];
                return (
                  <div key={i} className="col-sm-6">
                    <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ border: "1px solid rgba(208,208,208,0.2)" }}>
                      <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 48, height: 48, background: bgs[i], color: colors[i] }}>
                        <span className="material-symbols-outlined">{icons[r.role]}</span>
                      </div>
                      <div>
                        <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>{map[r.role]}</p>
                        <h5 className="fw-bold mb-0">{r.count.toLocaleString("ar-EG")}</h5>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports + Quick Actions */}
      <div className="row g-4">
        {/* Recent Reports */}
        <div className="col-12 col-lg-8">
          <div className="p-4 rounded-4" style={{ background: "var(--surface-card, #fff)", backdropFilter: "blur(12px)", border: "1px solid rgba(208,208,208,0.2)", boxShadow: "0 4px 20px rgba(107,144,128,0.06)" }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0">آخر البلاغات</h6>
              <a href="/admin/reports" className="btn btn-sm p-0 fw-bold" style={{ color: "var(--primary)", fontSize: "0.8rem", textDecoration: "none" }}>عرض الكل</a>
            </div>
            {recentReports.length === 0 ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined mb-2" style={{ fontSize: 40, color: "var(--outline, #767586)" }}>check_circle</span>
                <p style={{ color: "var(--on-surface-variant, #464555)" }}>لا توجد بلاغات حالياً</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-borderless align-middle mb-0">
                  <thead>
                    <tr style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #464555)", borderBottom: "1px solid rgba(208,208,208,0.3)" }}>
                      <th className="text-end pb-2">المبلغ</th>
                      <th className="text-end pb-2">السبب</th>
                      <th className="text-center pb-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map((r, i) => {
                      const statusMap = {
                        pending: { label: "جديد", bg: "var(--surface-container, #e5eeff)", color: "var(--on-surface-variant, #464555)" },
                        reviewing: { label: "قيد المعالجة", bg: "rgba(88,61,0,0.08)", color: "var(--tertiary, #583d00)" },
                        resolved: { label: "تم الحل", bg: "rgba(106,254,156,0.2)", color: "var(--success, #006d37)" },
                        dismissed: { label: "مرفوض", bg: "rgba(208,208,208,0.3)", color: "var(--on-surface-variant, #464555)" },
                      };
                      const st = statusMap[r.status] || statusMap.pending;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(208,208,208,0.1)" }}>
                          <td className="py-3">{r.profiles?.full_name || "مستخدم"}</td>
                          <td className="py-3" style={{ fontSize: "var(--fs-sm)" }}>{r.reason || "بلاغ"}</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-1 rounded-pill fw-bold" style={{ fontSize: "0.65rem", background: st.bg, color: st.color }}>{st.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-12 col-lg-4">
          <div className="p-4 rounded-4 h-100 d-flex flex-column" style={{ background: "var(--surface-card, #fff)", backdropFilter: "blur(12px)", border: "1px solid rgba(208,208,208,0.2)", boxShadow: "0 4px 20px rgba(107,144,128,0.06)" }}>
            <h6 className="fw-bold mb-3">إجراءات سريعة</h6>
            <div className="d-flex flex-column gap-2">
              <a href="/admin/apartments" className="btn d-flex justify-content-between align-items-center p-3 rounded-3 text-white text-decoration-none" style={{ background: "var(--primary)", fontSize: "var(--fs-xs)", transition: "all 0.2s ease" }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>apartment</span>
                  <span className="fw-bold">إدارة الوحدات ({stats?.pendingApartments || 0} معلقة)</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
              </a>
              <a href="/admin/users" className="btn d-flex justify-content-between align-items-center p-3 rounded-3 text-decoration-none" style={{ border: "2px solid var(--primary)", color: "var(--primary)", fontSize: "var(--fs-xs)", transition: "all 0.2s ease" }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>group</span>
                  <span className="fw-bold">إدارة المستخدمين</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
              </a>
              <a href="/admin/reports" className="btn d-flex justify-content-between align-items-center p-3 rounded-3 text-decoration-none" style={{ border: "2px solid var(--outline-variant, #D0D0D0)", color: "var(--on-surface-variant, #464555)", fontSize: "var(--fs-xs)", transition: "all 0.2s ease" }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>report</span>
                  <span className="fw-bold">البلاغات ({stats?.activeReports || 0})</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
              </a>
              <button onClick={handleDownloadReport} className="btn d-flex justify-content-between align-items-center p-3 rounded-3" style={{ border: "2px solid var(--outline-variant, #D0D0D0)", color: "var(--on-surface-variant, #464555)", fontSize: "var(--fs-xs)", transition: "all 0.2s ease" }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
                  <span className="fw-bold">تحميل تقرير PDF</span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>description</span>
              </button>
            </div>
            <div className="mt-auto pt-4">
              <div className="d-flex align-items-center gap-3 p-3 rounded-4" style={{ background: "rgba(0,109,55,0.06)" }}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 52, height: 52, background: "var(--success, #006d37)", color: "white" }}>
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <div>
                  <p className="fw-bold mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--success, #006d37)" }}>تحتاج مساعدة؟</p>
                  <p className="mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant, #464555)" }}>تواصل مع الدعم الفني المخصص للمديرين.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
