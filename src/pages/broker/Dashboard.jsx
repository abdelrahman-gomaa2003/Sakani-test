import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { apartmentService } from "../../services/apartmentService";
import AnimatedCounter from "../../components/ui/AnimatedCounter";
import { Chart } from "chart.js/auto";

function BrokerDashboard() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await apartmentService.getAll({ status: "approved", limit: 100 });
      setApartments(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (loading || apartments.length === 0 || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const now = new Date();
    const monthCounts = Array(6).fill(0);
    apartments.forEach((apt) => {
      const d = new Date(apt.created_at);
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diff >= 0 && diff < 6) monthCounts[5 - diff]++;
    });
    const labels6 = monthNames.slice(now.getMonth() - 5, now.getMonth() + 1);

    chartInstance.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: labels6,
        datasets: [{
          label: "العقارات المضافة",
          data: monthCounts,
          backgroundColor: "rgba(45,106,79,0.5)",
          borderColor: "#2D6A4F",
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, display: false }, x: { grid: { display: false } } },
      },
    });

    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [loading, apartments]);

  const totalViews = apartments.reduce((sum, a) => sum + (a.views || 0), 0);
  const uniqueOwners = new Set(apartments.map((a) => a.owner_id)).size;
  const avgPrice = apartments.length ? Math.round(apartments.reduce((sum, a) => sum + (a.price || 0), 0) / apartments.length) : 0;

  const stats = [
    { icon: "apartment", value: apartments.length, label: "العقارات المتاحة", bg: "rgba(107,144,128,0.08)", color: "var(--primary)" },
    { icon: "visibility", value: totalViews, label: "إجمالي المشاهدات", bg: "rgba(0,109,55,0.08)", color: "var(--success, #006d37)" },
    { icon: "real_estate_agent", value: uniqueOwners, label: "الملاك المسجلين", bg: "rgba(88,61,0,0.08)", color: "var(--tertiary, #583d00)" },
    { icon: "payments", value: avgPrice, label: "متوسط السعر", suffix: " ج.م", bg: "rgba(239,68,68,0.08)", color: "var(--danger, #dc3545)" },
  ];

  if (loading) {
    return (
      <div className="d-flex flex-column gap-4">
        <div className="row g-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="p-3 rounded-4 h-100" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <div className="placeholder-glow">
                  <span className="placeholder col-6 rounded-2 mb-2" style={{ height: 36 }} />
                  <span className="placeholder col-4 rounded-2 mb-1" style={{ height: 20 }} />
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
        .broker-stat-anim { animation: fadeSlideUp 0.5s ease both; }
        .broker-stat-anim:nth-child(1) { animation-delay: 0.05s; }
        .broker-stat-anim:nth-child(2) { animation-delay: 0.1s; }
        .broker-stat-anim:nth-child(3) { animation-delay: 0.15s; }
        .broker-stat-anim:nth-child(4) { animation-delay: 0.2s; }
      `}</style>

      <section>
        <h2 className="fw-bold" style={{ fontSize: "var(--fs-xl)" }}>لوحة تحكم الوسيط</h2>
        <p className="mb-0" style={{ color: "var(--on-surface-variant)" }}>نظرة عامة على العقارات المتاحة في المنصة.</p>
      </section>

      <div className="row g-3">
        {stats.map((s, i) => (
          <div key={i} className="col-6 col-md-3 broker-stat-anim">
            <div
              className="bg-white rounded-4 p-3 text-center h-100 d-flex flex-column align-items-center"
              style={{ boxShadow: "0 4px 20px rgba(107,144,128,0.06)", transition: "transform 0.25s ease, box-shadow 0.25s ease", cursor: "default", background: "var(--surface-card, #fff)" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(107,144,128,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(107,144,128,0.08)"; }}
            >
              <div className="d-flex align-items-center justify-content-center rounded-3 mb-2" style={{ width: 56, height: 56, background: s.bg, color: s.color }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{s.icon}</span>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: "var(--fs-xl)" }}>
                <AnimatedCounter target={s.value} suffix={s.suffix || ""} />
              </h3>
              <p className="mb-0" style={{ fontSize: "var(--fs-xs)", color: "var(--on-surface-variant)" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="rounded-4 p-4 h-100" style={{ background: "var(--surface-card, #fff)", boxShadow: "0 4px 20px rgba(107,144,128,0.08)", minHeight: 300 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold m-0" style={{ fontSize: "var(--fs-base)" }}>تحليل المشاهدات الشهري</h4>
            </div>
            <div style={{ height: 220 }}><canvas ref={chartRef} /></div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="rounded-4 p-4 h-100" style={{ background: "var(--surface-card, #fff)", boxShadow: "0 4px 20px rgba(107,144,128,0.08)" }}>
            <h4 className="fw-bold mb-3" style={{ fontSize: "var(--fs-base)" }}>إجراءات سريعة</h4>
            <div className="d-flex flex-column gap-2">
              {[
                { icon: "add_home", text: "إضافة عقار جديد", to: "/broker/add-apartment", color: "var(--primary)" },
                { icon: "apartment", text: "إدارة العقارات", to: "/broker/apartments", color: "var(--success, #006d37)" },
                { icon: "school", text: "طلبات الطلاب", to: "/broker/students", color: "var(--tertiary, #583d00)" },
              ].map((a, i) => (
                <Link key={i} to={a.to} className="btn text-start d-flex align-items-center gap-3 p-3 rounded-3 border-0 text-decoration-none" style={{ background: "transparent", transition: "all 0.2s ease", borderRadius: "var(--radius-md, 12px)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-container-low, #f0f3ff)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span className="material-symbols-outlined" style={{ color: a.color, fontSize: 22 }}>{a.icon}</span>
                  <span style={{ fontSize: "var(--fs-xs)" }}>{a.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {apartments.length > 0 && (
        <div className="rounded-4 p-4" style={{ background: "var(--surface-card, #fff)", boxShadow: "0 4px 20px rgba(107,144,128,0.08)" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold m-0" style={{ fontSize: "var(--fs-base)" }}>آخر العقارات المضافة</h4>
            <Link to="/broker/apartments" className="text-decoration-none fw-bold" style={{ color: "var(--primary)", fontSize: "0.8rem" }}>عرض الكل</Link>
          </div>
          <div className="table-responsive">
            <table className="table table-borderless align-middle mb-0">
              <thead>
                <tr style={{ color: "var(--on-surface-variant)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ fontSize: "var(--fs-xs)", paddingBottom: 12 }}>العقار</th>
                  <th style={{ fontSize: "var(--fs-xs)", paddingBottom: 12 }}>الحي</th>
                  <th className="d-none d-md-table-cell" style={{ fontSize: "var(--fs-xs)", paddingBottom: 12 }}>السعر</th>
                  <th style={{ fontSize: "var(--fs-xs)", paddingBottom: 12 }}>المشاهدات</th>
                </tr>
              </thead>
              <tbody>
                {apartments.slice(0, 5).map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img src={apt.images?.[0] || "https://via.placeholder.com/32x32"} alt="" className="rounded-2" style={{ width: 32, height: 32, objectFit: "cover" }} />
                        <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{apt.title}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "var(--fs-sm)" }}>{apt.neighborhood || apt.city}</td>
                    <td className="d-none d-md-table-cell" style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--primary)" }}>{apt.price?.toLocaleString("ar-EG")} ج.م</td>
                    <td><span className="px-2 py-1 rounded-pill" style={{ background: "rgba(107,144,128,0.1)", color: "var(--primary)", fontSize: "var(--fs-xs)", fontWeight: 600 }}>{apt.views || 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrokerDashboard;
