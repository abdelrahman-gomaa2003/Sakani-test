import { useNavigate } from "react-router-dom";

function GuestLoginModal({ show, onClose, returnPath }) {
  const navigate = useNavigate();

  if (!show) return null;

  const target = returnPath || "/";

  return (
    <>
      <style>{`
        .guest-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1060; display: flex; align-items: center; justify-content: center; animation: guestFadeIn 0.25s ease; }
        .guest-modal-card { background: var(--surface-card, #fff); border-radius: var(--radius-lg, 18px); width: 90%; max-width: 440px; padding: 2.5rem 2rem; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: guestSlideUp 0.3s ease; position: relative; }
        .guest-modal-icon { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; background: var(--primary-container, #B7E4C7); }
        .guest-modal-btn { height: 48px; border-radius: 14px; font-size: var(--fs-base); font-weight: 700; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .guest-modal-btn:hover { transform: translateY(-2px); }
        .guest-modal-close { position: absolute; top: 14px; left: 14px; width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--surface-container-low, #f1f3f5); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .guest-modal-close:hover { background: var(--danger, #ef4444); color: white; }
        @keyframes guestFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes guestSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="guest-modal-overlay" onClick={onClose}>
        <div className="guest-modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="guest-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>

          <div className="guest-modal-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--primary)" }}>lock</span>
          </div>

          <h5 className="fw-bold mb-2" style={{ color: "var(--on-surface)", fontSize: "var(--fs-xl)" }}>
            تسجيل الدخول مطلوب
          </h5>
          <p className="mb-4" style={{ color: "var(--on-surface-variant)", fontSize: "var(--fs-sm)", lineHeight: 1.7 }}>
            يجب تسجيل الدخول أولًا لعرض تفاصيل العقار والاستفادة من جميع خدمات المنصة.
          </p>

          <div className="d-flex flex-column gap-2">
            <button
              className="btn guest-modal-btn w-100"
              style={{ background: "var(--primary, #6B9080)", color: "white" }}
              onClick={() => navigate("/login", { state: { from: { pathname: target } } })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
              تسجيل الدخول
            </button>
            <button
              className="btn guest-modal-btn w-100"
              style={{ border: "2px solid var(--primary, #6B9080)", color: "var(--primary, #6B9080)", background: "transparent" }}
              onClick={() => navigate("/register", { state: { from: { pathname: target } } })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
              إنشاء حساب
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default GuestLoginModal;
