import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { exportToCSV } from "../../utils/exportUtils";

const roleBadge = {
  student: { label: "طالب", icon: "school", bg: "rgba(107,144,128,0.12)", color: "#4A6E5C", border: "rgba(107,144,128,0.25)" },
  owner: { label: "مالك", icon: "home", bg: "rgba(88,61,0,0.10)", color: "#8B6914", border: "rgba(139,105,20,0.25)" },
  broker: { label: "وسيط", icon: "handshake", bg: "rgba(0,109,55,0.10)", color: "#006d37", border: "rgba(0,109,55,0.25)" },
  admin: { label: "مدير", icon: "admin_panel_settings", bg: "rgba(186,26,26,0.10)", color: "#ba1a1a", border: "rgba(186,26,26,0.25)" },
};

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const perPage = 10;

  useEffect(() => {
    loadUsers();
  }, [filterRole]);

  async function loadUsers() {
    setLoading(true);
    const { data } = await adminService.getAllUsers({ role: filterRole === "all" ? undefined : filterRole });
    setUsers(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    setUpdatingId(id);
    await adminService.deleteUser(id);
    setUpdatingId(null);
    loadUsers();
  }

  const filtered = users.filter((u) => {
    if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="d-flex flex-column gap-4">
      <style>{`
        .users-table th { font-size: var(--fs-sm, 0.975rem); font-weight: 700; color: var(--on-surface, #1A1D23); background: var(--surface-container-low, #F5F3EE); padding: 14px 16px; white-space: nowrap; border-bottom: 2px solid var(--border, #DDD8D0); }
        .users-table td { font-size: var(--fs-sm, 0.975rem); padding: 14px 16px; vertical-align: middle; border-bottom: 1px solid rgba(208,208,208,0.15); }
        .users-table tbody tr { transition: background 0.15s ease; }
        .users-table tbody tr:hover { background: rgba(107,144,128,0.04); }
        .users-table tbody tr:nth-child(even) { background: rgba(107,144,128,0.02); }
        .users-table tbody tr:nth-child(even):hover { background: rgba(107,144,128,0.06); }
        .user-role-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: var(--radius-full, 9999px); font-size: var(--fs-xs, 0.875rem); font-weight: 700; border: 1px solid; white-space: nowrap; }
        .user-role-badge .material-symbols-outlined { font-size: 18px; }
        .users-search { border-radius: var(--radius-md, 12px); border: 1.5px solid var(--border, #DDD8D0); padding: 10px 14px; font-size: var(--fs-sm, 0.975rem); transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .users-search:focus { border-color: var(--primary, #6B9080); box-shadow: 0 0 0 3px rgba(107,144,128,0.1); }
        .users-filter { border-radius: var(--radius-md, 12px); border: 1.5px solid var(--border, #DDD8D0); padding: 10px 14px; font-size: var(--fs-sm, 0.975rem); background: var(--surface-card, #fff); }
      `}</style>

      {/* Filter Bar */}
      <div className="p-4 rounded-4" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))" }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label fw-bold mb-2" style={{ fontSize: "var(--fs-sm, 0.975rem)", color: "var(--on-surface, #1A1D23)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginLeft: 4, color: "var(--primary, #6B9080)" }}>search</span>
              بحث
            </label>
            <input
              type="text"
              className="form-control users-search"
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-bold mb-2" style={{ fontSize: "var(--fs-sm, 0.975rem)", color: "var(--on-surface, #1A1D23)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginLeft: 4, color: "var(--primary, #6B9080)" }}>filter_list</span>
              نوع الحساب
            </label>
            <select className="form-select users-filter" value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}>
              <option value="all">الكل</option>
              <option value="student">طالب</option>
              <option value="owner">مالك</option>
              <option value="broker">وسيط</option>
              <option value="admin">مدير</option>
            </select>
          </div>
          <div className="col-md-2">
            <p className="mb-0 fw-bold" style={{ fontSize: "var(--fs-sm, 0.975rem)", color: "var(--on-surface-variant, #5A6370)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: "middle", marginLeft: 4 }}>group</span>
              {filtered.length} مستخدم
            </p>
          </div>
          <div className="col-md-3 d-flex justify-content-end">
            <button
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              onClick={() => {
                const exportData = users.map((u) => ({
                  "الاسم": u.full_name || "",
                  "البريد": u.email || "",
                  "الدور": u.role === "student" ? "طالب" : u.role === "owner" ? "مالك" : u.role === "broker" ? "وسيط" : "مدير",
                  "تاريخ التسجيل": u.created_at ? new Date(u.created_at).toLocaleDateString("ar-EG") : "",
                }));
                exportToCSV(exportData, "المستخدمين");
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
              تصدير CSV
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div className="p-5 text-center">
            <div className="spinner-border" style={{ color: "var(--primary)" }} role="status">
              <span className="visually-hidden">جاري التحميل...</span>
            </div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-5">
            <span className="material-symbols-outlined mb-2" style={{ fontSize: 56, color: "var(--gray, #808894)" }}>group</span>
            <p className="fw-bold mb-1" style={{ fontSize: "var(--fs-lg, 1.175rem)", color: "var(--on-surface, #1A1D23)" }}>لا يوجد مستخدمين</p>
            <p style={{ fontSize: "var(--fs-sm, 0.975rem)", color: "var(--on-surface-variant, #5A6370)" }}>لم يتم العثور على مستخدمين مطابقين للبحث</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0 users-table">
              <thead>
                <tr>
                  {["المستخدم", "الدور", "البريد الإلكتروني", "تاريخ التسجيل", "الإجراءات"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((u) => {
                  const badge = roleBadge[u.role] || roleBadge.student;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="rounded-circle" style={{ width: 46, height: 46, objectFit: "cover", border: "2px solid var(--primary-container, #D4E8DD)" }} />
                          ) : (
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 46, height: 46, background: "linear-gradient(135deg, var(--primary, #6B9080), var(--primary-dark, #4A6E5C))", fontSize: 17 }}>
                              {u.full_name ? u.full_name[0] : "?"}
                            </div>
                          )}
                          <div>
                            <p className="fw-bold mb-0" style={{ fontSize: "var(--fs-base, 1.0625rem)", color: "var(--on-surface, #1A1D23)" }}>{u.full_name || "غير مسجل"}</p>
                            <p className="mb-0" style={{ fontSize: "var(--fs-xs, 0.875rem)", color: "var(--on-surface-variant, #5A6370)" }}>{u.phone || "بدون هاتف"}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="user-role-badge" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
                          <span className="material-symbols-outlined">{badge.icon}</span>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ color: "var(--on-surface, #1A1D23)" }}>{u.email || "—"}</td>
                      <td style={{ color: "var(--on-surface-variant, #5A6370)" }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("ar-EG") : "—"}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-ghost btn-sm p-2"
                            style={{ color: "var(--danger, #C45B4A)", borderRadius: "var(--radius-sm, 8px)" }}
                            disabled={updatingId === u.id || u.role === "admin"}
                            onClick={() => handleDelete(u.id)}
                            title="حذف المستخدم"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 d-flex justify-content-between align-items-center" style={{ background: "var(--surface-container-low, #F5F3EE)", borderTop: "1px solid var(--border, #DDD8D0)" }}>
            <p className="mb-0" style={{ fontSize: "var(--fs-sm, 0.975rem)", color: "var(--on-surface-variant, #5A6370)" }}>
              صفحة {page} من {totalPages}
            </p>
            <nav>
              <ul className="pagination mb-0">
                <li className="page-item">
                  <button className="page-link" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                  </button>
                </li>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <li key={i + 1} className={`page-item ${i + 1 === page ? "active" : ""}`}>
                    <button className="page-link" style={{ fontWeight: 600 }} onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className="page-item">
                  <button className="page-link" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
