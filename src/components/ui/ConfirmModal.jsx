function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = "تأكيد", cancelLabel = "إلغاء", danger = false, loading = false }) {
  if (!open) return null;
  return (
    <>
      <div className="position-fixed top-0 start-0 bottom-0 w-100" style={{ background: "rgba(0,0,0,0.4)", zIndex: 1050 }} onClick={onClose} />
      <div className="position-fixed top-50 start-50 translate-middle p-4 rounded-4" style={{ background: "#fff", zIndex: 1051, width: "90%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div className="text-center">
          <span className="material-symbols-outlined mb-2" style={{ fontSize: 48, color: danger ? "var(--danger, #ef4444)" : "var(--primary, #6B9080)" }}>
            {danger ? "warning" : "help"}
          </span>
          <h5 className="fw-bold">{title}</h5>
          <p style={{ color: "var(--on-surface-variant)" }}>{message}</p>
          <div className="d-flex gap-2 mt-3">
            <button className="btn flex-grow-1" style={{ border: "1px solid var(--border)" }} onClick={onClose} disabled={loading}>{cancelLabel}</button>
            <button className="btn flex-grow-1 text-white" style={{ background: danger ? "var(--danger, #ef4444)" : "var(--primary)" }} onClick={onConfirm} disabled={loading}>
              {loading ? "جاري المعالجة..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmModal;
