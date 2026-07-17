import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { serverAPI } from "../../services/serverAPI";

const STATUS_OPTIONS = [
  { value: "all", label: "الكل", color: "var(--on-surface-variant)" },
  { value: "new", label: "جديدة", color: "#1a73e8" },
  { value: "in_progress", label: "قيد المراجعة", color: "#e8710a" },
  { value: "resolved", label: "تم الحل", color: "#006d37" },
  { value: "closed", label: "مغلقة", color: "var(--on-surface-variant)" },
];

function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [replyText, setReplyText] = useState("");
  const limit = 15;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = { status: statusFilter, search, page: String(page), limit: String(limit) };
        const data = await serverAPI.getContactMessages(params);
        if (!cancelled) {
          setMessages(data.messages || []);
          setStats(data.stats || { total: 0, new: 0, in_progress: 0, resolved: 0, closed: 0 });
          setTotal(data.total || 0);
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [statusFilter, search, page]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(true);
    try {
      await serverAPI.updateContactMessage(id, { status: newStatus });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
      setStats((prev) => {
        const updated = { ...prev };
        if (selectedMsg?.id === id) {
          updated[selectedMsg.status] = Math.max(0, (updated[selectedMsg.status] || 0) - 1);
        }
        updated[newStatus] = (updated[newStatus] || 0) + 1;
        return updated;
      });
      toast.success("تم تحديث الحالة");
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setUpdating(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedMsg) return;
    setUpdating(true);
    try {
      await serverAPI.updateContactMessage(selectedMsg.id, { admin_reply: replyText.trim(), status: "in_progress" });
      setMessages((prev) => prev.map((m) => (m.id === selectedMsg.id ? { ...m, admin_reply: replyText.trim(), status: "in_progress" } : m)));
      setSelectedMsg({ ...selectedMsg, admin_reply: replyText.trim(), status: "in_progress" });
      setReplyText("");
      toast.success("تم إرسال الرد");
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setUpdating(false);
    }
  };

  const deleteMessage = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      await serverAPI.deleteContactMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      if (selectedMsg?.id === id) setSelectedMsg(null);
      toast.success("تم الحذف");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const getStatusColor = (status) => {
    const opt = STATUS_OPTIONS.find((s) => s.value === status);
    return opt?.color || "#666";
  };
  const getStatusLabel = (status) => {
    const opt = STATUS_OPTIONS.find((s) => s.value === status);
    return opt?.label || status;
  };
  const formatDate = (d) => new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <style>{`
        .msg-stat-card { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .msg-stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .msg-row { transition: background 0.15s; cursor: pointer; }
        .msg-row:hover { background: rgba(107,144,128,0.04); }
        .msg-selected { background: rgba(107,144,128,0.08) !important; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
      `}</style>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-1" style={{ fontSize: "1.15rem" }}>رسائل التواصل</h5>
          <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>
            إدارة رسائل المستخدمين من صفحة تواصل معنا
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {STATUS_OPTIONS.map((s) => (
          <div key={s.value} className="col-6 col-md">
            <div
              className={`msg-stat-card p-3 rounded-3 ${statusFilter === s.value ? "shadow-sm" : ""}`}
              style={{
                background: statusFilter === s.value ? "var(--primary-container, rgba(107,144,128,0.12))" : "var(--surface, #fff)",
                border: `2px solid ${statusFilter === s.value ? "var(--primary)" : "var(--outline-variant, #D0D0D0)"}`,
              }}
              onClick={() => { setStatusFilter(s.value); setPage(1); }}
            >
              <p className="mb-1 fw-bold" style={{ fontSize: "0.75rem", color: s.color }}>{s.label}</p>
              <p className="mb-0 fw-bold" style={{ fontSize: "1.5rem", color: "var(--on-surface, #1A1D23)" }}>{stats[s.value] || 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="d-flex gap-2 mb-3">
        <div className="position-relative flex-grow-1">
          <span className="material-symbols-outlined position-absolute top-50 start-0 translate-middle-y ms-3" style={{ color: "var(--on-surface-variant)", fontSize: 20 }}>search</span>
          <input
            type="text"
            className="form-control rounded-3 ps-5 py-2"
            placeholder="بحث بالاسم، الإيميل، أو الموضوع..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ fontSize: "0.85rem", borderColor: "var(--outline-variant, #D0D0D0)" }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="row g-3">
        {/* Messages List */}
        <div className={`${selectedMsg ? "col-lg-6" : "col-12"}`}>
          <div className="rounded-4 overflow-hidden" style={{ background: "var(--surface, #fff)", border: "1px solid var(--outline-variant, #D0D0D0)" }}>
            {/* Table Header */}
            <div className="d-none d-md-flex px-4 py-3 fw-semibold" style={{ fontSize: "0.75rem", color: "var(--on-surface-variant, #767586)", borderBottom: "1px solid var(--outline-variant, #D0D0D0)", letterSpacing: "0.03em" }}>
              <div style={{ flex: 2 }}>المرسل</div>
              <div style={{ flex: 2 }}>الموضوع</div>
              <div style={{ flex: 1 }}>النوع</div>
              <div style={{ flex: 1 }}>الحالة</div>
              <div style={{ flex: 1 }}>التاريخ</div>
              <div style={{ width: 40 }}></div>
            </div>

            {loading ? (
              <div className="p-5 text-center">
                <div className="spinner-border" style={{ color: "var(--primary)", width: "2rem", height: "2rem" }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="p-5 text-center">
                <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, color: "var(--on-surface-variant)" }}>inbox</span>
                <p style={{ color: "var(--on-surface-variant, #464555)", fontSize: "0.9rem" }}>لا توجد رسائل</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`msg-row d-flex flex-wrap align-items-center px-4 py-3 ${selectedMsg?.id === msg.id ? "msg-selected" : ""}`}
                  style={{ borderBottom: "1px solid var(--outline-variant, #D0D0D0)", cursor: "pointer" }}
                  onClick={() => { setSelectedMsg(msg); setReplyText(msg.admin_reply || ""); }}
                >
                  <div style={{ flex: 2, minWidth: 150 }} className="d-flex align-items-center gap-2 mb-2 mb-md-0">
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0" style={{ width: 36, height: 36, background: "var(--primary)", fontSize: 14 }}>
                      {msg.name?.[0] || "م"}
                    </div>
                    <div className="overflow-hidden">
                      <p className="mb-0 fw-semibold text-truncate" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>{msg.name}</p>
                      <p className="mb-0 text-truncate" style={{ fontSize: "0.7rem", color: "var(--on-surface-variant, #767586)" }}>{msg.email}</p>
                    </div>
                  </div>
                  <div style={{ flex: 2, minWidth: 150 }} className="mb-2 mb-md-0">
                    <p className="mb-0 text-truncate" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>{msg.subject}</p>
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }} className="mb-2 mb-md-0">
                    <span className="badge rounded-pill" style={{ background: "var(--primary-container, rgba(107,144,128,0.12))", color: "var(--primary)", fontSize: "0.7rem", fontWeight: 600 }}>
                      {msg.message_type}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }} className="mb-2 mb-md-0">
                    <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: "0.75rem", color: getStatusColor(msg.status), fontWeight: 600 }}>
                      <span className="status-dot" style={{ background: getStatusColor(msg.status) }} />
                      {getStatusLabel(msg.status)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }} className="mb-2 mb-md-0">
                    <span style={{ fontSize: "0.75rem", color: "var(--on-surface-variant, #767586)" }}>{formatDate(msg.created_at)}</span>
                  </div>
                  <div style={{ width: 40 }} className="d-none d-md-block">
                    <button className="btn btn-sm p-1 rounded-circle" style={{ color: "var(--error, #ba1a1a)" }} onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center px-4 py-3" style={{ borderTop: "1px solid var(--outline-variant, #D0D0D0)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #767586)" }}>
                  {total} رسالة
                </span>
                <div className="d-flex gap-1">
                  <button className="btn btn-sm rounded-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ fontSize: "0.75rem", borderColor: "var(--outline-variant, #D0D0D0)" }}>
                    السابق
                  </button>
                  <span className="btn btn-sm rounded-2" style={{ background: "var(--primary)", color: "white", fontSize: "0.75rem" }}>
                    {page}/{totalPages}
                  </span>
                  <button className="btn btn-sm rounded-2" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ fontSize: "0.75rem", borderColor: "var(--outline-variant, #D0D0D0)" }}>
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedMsg && (
          <div className="col-lg-6">
            <div className="rounded-4 p-4" style={{ background: "var(--surface, #fff)", border: "1px solid var(--outline-variant, #D0D0D0)" }}>
              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 48, height: 48, background: "var(--primary)", fontSize: 18 }}>
                    {selectedMsg.name?.[0] || "م"}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ fontSize: "1rem", color: "var(--on-surface, #1A1D23)" }}>{selectedMsg.name}</h6>
                    <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #767586)" }}>{selectedMsg.email}</p>
                  </div>
                </div>
                <button className="btn btn-sm" onClick={() => setSelectedMsg(null)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>

              {/* Info */}
              <div className="row g-2 mb-3">
                <div className="col-4">
                  <span className="badge rounded-pill w-100 py-2" style={{ background: "var(--primary-container, rgba(107,144,128,0.12))", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 600 }}>
                    {selectedMsg.message_type}
                  </span>
                </div>
                <div className="col-4">
                  <span className="d-inline-flex align-items-center gap-1 w-100 justify-content-center py-2 rounded-pill" style={{ background: `${getStatusColor(selectedMsg.status)}15`, color: getStatusColor(selectedMsg.status), fontSize: "0.75rem", fontWeight: 600 }}>
                    <span className="status-dot" style={{ background: getStatusColor(selectedMsg.status) }} />
                    {getStatusLabel(selectedMsg.status)}
                  </span>
                </div>
                <div className="col-4">
                  <span className="w-100 d-block text-center py-2 rounded-pill" style={{ background: "var(--surface-dim, #F4F1EC)", fontSize: "0.75rem", color: "var(--on-surface-variant, #767586)" }}>
                    {selectedMsg.phone || "بدون هاتف"}
                  </span>
                </div>
              </div>

              <div className="mb-3 p-3 rounded-3" style={{ background: "var(--surface-dim, #F4F1EC)" }}>
                <p className="fw-bold mb-1" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>{selectedMsg.subject}</p>
                <p className="mb-0" style={{ fontSize: "0.85rem", color: "var(--on-surface-variant, #464555)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selectedMsg.message}</p>
              </div>

              <p style={{ fontSize: "0.7rem", color: "var(--on-surface-variant, #767586)" }}>
                تاريخ الإرسال: {formatDate(selectedMsg.created_at)}
              </p>

              {/* Status Actions */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {STATUS_OPTIONS.filter((s) => s.value !== "all").map((s) => (
                  <button
                    key={s.value}
                    className="btn btn-sm rounded-3"
                    disabled={updating || selectedMsg.status === s.value}
                    onClick={() => updateStatus(selectedMsg.id, s.value)}
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: selectedMsg.status === s.value ? s.color : "transparent",
                      color: selectedMsg.status === s.value ? "white" : s.color,
                      border: `1px solid ${s.color}`,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Admin Reply */}
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: "0.8rem", color: "var(--on-surface, #1A1D23)" }}>رد المشرف</label>
                <textarea
                  className="form-control rounded-3 mb-2"
                  rows="3"
                  placeholder="اكتب ردك هنا..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ fontSize: "0.85rem", borderColor: "var(--outline-variant, #D0D0D0)", resize: "vertical" }}
                />
                <button
                  className="btn btn-sm rounded-3"
                  disabled={!replyText.trim() || updating}
                  onClick={sendReply}
                  style={{ background: "var(--primary)", color: "white", fontWeight: 600 }}
                >
                  {updating ? "جاري..." : "إرسال الرد"}
                </button>
              </div>

              {selectedMsg.admin_reply && (
                <div className="p-3 rounded-3" style={{ background: "var(--primary-container, rgba(107,144,128,0.12))", borderRight: "3px solid var(--primary)" }}>
                  <p className="fw-bold mb-1" style={{ fontSize: "0.8rem", color: "var(--primary)" }}>رد المشرف:</p>
                  <p className="mb-0" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)", lineHeight: 1.6 }}>{selectedMsg.admin_reply}</p>
                </div>
              )}

              {/* Delete */}
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--outline-variant, #D0D0D0)" }}>
                <button className="btn btn-sm rounded-3" style={{ color: "var(--error, #ba1a1a)", border: "1px solid var(--error, #ba1a1a)" }} onClick={() => deleteMessage(selectedMsg.id)}>
                  <span className="material-symbols-outlined me-1" style={{ fontSize: 16 }}>delete</span>
                  حذف الرسالة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminContactMessages;
