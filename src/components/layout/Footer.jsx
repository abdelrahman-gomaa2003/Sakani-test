import { Link } from "react-router-dom";
import logo from "../../assets/logos/image.png";

const socialLinks = [
  { href: "https://facebook.com", label: "Facebook", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { href: "https://instagram.com", label: "Instagram", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { href: "https://linkedin.com", label: "LinkedIn", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { href: "https://wa.me/201026746929", label: "WhatsApp", icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
];

function Footer() {
  return (
    <>
      <style>{`
        .footer-section { background: #111827; color: #D1D5DB; }
        .footer-col-title { font-size: var(--fs-base, 1.0625rem); font-weight: 700; color: #FFFFFF; margin-bottom: 0.75rem; letter-spacing: 0.01em; }
        .footer-link { color: #9CA3AF; font-size: var(--fs-xs, 0.875rem); text-decoration: none; transition: all 0.25s ease; display: inline-flex; align-items: center; gap: 6px; padding: 2px 0; line-height: 1.8; }
        .footer-link:hover { color: #6B9080; transform: translateX(-3px); }
        .footer-link .link-arrow { opacity: 0; transition: all 0.25s ease; font-size: 15px; }
        .footer-link:hover .link-arrow { opacity: 1; transform: translateX(-2px); }
        .footer-contact-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; color: #9CA3AF; font-size: var(--fs-xs, 0.875rem); line-height: 1.5; }
        .footer-contact-item .material-symbols-outlined { color: #6B9080; font-size: 22px; margin-top: 2px; flex-shrink: 0; }
        .footer-social-btn { width: 38px; height: 38px; border-radius: var(--radius-sm, 8px); display: flex; align-items: center; justify-content: center; background: rgba(107,144,128,0.1); color: #6B9080; transition: all 0.3s ease; border: 1px solid rgba(107,144,128,0.15); }
        .footer-social-btn:hover { background: #6B9080; color: #fff; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(107,144,128,0.3); }
        .footer-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 1.25rem 0; }
        .scroll-top-btn { position: fixed; bottom: 30px; left: 30px; width: 44px; height: 44px; border-radius: 50%; background: var(--primary, #6B9080); color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 20px rgba(107,144,128,0.4); transition: all 0.3s ease; z-index: 1000; }
        .scroll-top-btn:hover { background: var(--primary-dark, #4A6E5C); transform: translateY(-3px); box-shadow: 0 8px 30px rgba(107,144,128,0.5); }
        .scroll-top-btn .material-symbols-outlined { font-size: 22px; }
      `}</style>

      <footer className="footer-section" style={{ borderTop: "3px solid var(--primary, #6B9080)" }}>
        <div className="container" style={{ paddingTop: "2rem", paddingBottom: "1.5rem" }}>
          <div className="row g-4 text-end">

            {/* Column 1 — About */}
            <div className="col-lg-4 col-md-6">
              <div className="d-flex align-items-center gap-2 mb-2 justify-content-end">
                <h2 className="fw-bold mb-0" style={{ color: "#fff", fontSize: "1.35rem" }}>سكني</h2>
                <img src={logo} alt="سكني" style={{ height: 52, width: "auto" }} />
              </div>
              <p style={{ color: "#9CA3AF", fontSize: "var(--fs-xs, 0.875rem)", lineHeight: 1.7, marginBottom: "1rem" }}>
                منصة <strong style={{ color: "#6B9080" }}>سكني</strong> متخصصة في مساعدة الطلاب على العثور على سكن مناسب بالقرب من جامعات الفيوم.
              </p>
              <div className="d-flex gap-2 justify-content-end flex-wrap">
                {socialLinks.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label={s.label}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2 — Quick Links */}
            <div className="col-lg-2 col-md-6">
              <h3 className="footer-col-title">روابط سريعة</h3>
              <ul className="list-unstyled mb-0">
                {[
                  { to: "/", label: "الرئيسية" },
                  { to: "/apartments", label: "ابحث عن سكن" },
                  { to: "/about", label: "عن المنصة" },
                  { to: "/faq", label: "الأسئلة الشائعة" },
                  { to: "/contact", label: "تواصل معنا" },
                ].map((link) => (
                  <li key={link.to}>
                    <Link className="footer-link" to={link.to}>
                      <span className="link-arrow material-symbols-outlined">arrow_back</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 — Support & Legal */}
            <div className="col-lg-3 col-md-6">
              <h3 className="footer-col-title">الدعم والمساعدة</h3>
              <ul className="list-unstyled mb-0">
                {[
                  { to: "/faq", label: "مركز المساعدة" },
                  { to: "/privacy", label: "سياسة الخصوصية" },
                  { to: "/terms", label: "الشروط والأحكام" },
                  { to: "/contact", label: "الإبلاغ عن مشكلة" },
                  { to: "/contact", label: "الإبلاغ عن إعلان مخالف" },
                ].map((link, i) => (
                  <li key={i}>
                    <Link className="footer-link" to={link.to}>
                      <span className="link-arrow material-symbols-outlined">arrow_back</span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 — Contact */}
            <div className="col-lg-3 col-md-6">
              <h3 className="footer-col-title">تواصل معنا</h3>
              <div className="footer-contact-item">
                <span className="material-symbols-outlined">call</span>
                <div>
                  <p className="mb-0" style={{ color: "#fff", fontWeight: 600 }}>01026746929</p>
                  <p className="mb-0" style={{ fontSize: "0.8rem" }}>اتصل بنا</p>
                </div>
              </div>
              <div className="footer-contact-item">
                <span className="material-symbols-outlined">mail</span>
                <div>
                  <p className="mb-0" style={{ color: "#fff", fontWeight: 600 }}>contact@sakani.com</p>
                  <p className="mb-0" style={{ fontSize: "0.8rem" }}>راسلنا</p>
                </div>
              </div>
              <div className="footer-contact-item">
                <span className="material-symbols-outlined">location_on</span>
                <div>
                  <p className="mb-0" style={{ color: "#fff", fontWeight: 600 }}>الفيوم – جمهورية مصر العربية</p>
                </div>
              </div>
              <div className="footer-contact-item">
                <span className="material-symbols-outlined">schedule</span>
                <div>
                  <p className="mb-0" style={{ color: "#fff", fontWeight: 600 }}>الدعم الفني</p>
                  <p className="mb-0" style={{ fontSize: "0.8rem" }}>السبت - الخميس | 09:00 ص - 10:00 م</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="footer-divider" />

          {/* Copyright */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 text-center">
            <p className="mb-0" style={{ color: "#6B7280", fontSize: "var(--fs-xs, 0.875rem)" }}>
              © 2026 منصة سكني. جميع الحقوق محفوظة.
            </p>
            <p className="mb-0" style={{ color: "#6B7280", fontSize: "0.8rem" }}>
              صُممت بشغف لخدمة طلاب الفيوم.
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top */}
      <button
        className="scroll-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="العودة للأعلى"
      >
        <span className="material-symbols-outlined">keyboard_arrow_up</span>
      </button>
    </>
  );
}

export default Footer;
