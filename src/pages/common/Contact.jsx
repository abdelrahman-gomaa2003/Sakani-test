import { useState } from "react";
import toast from "react-hot-toast";

const MESSAGE_TYPES = ["استفسار", "شكوى", "اقتراح", "دعم فني", "شراكة"];
const FAQ_ITEMS = [
  { q: "كيف أضيف وحدة سكنية؟", a: "سجّل حساب كمالك، ثم اختر \"إضافة وحدة\" من لوحة التحكم وأكمل البيانات والمستندات المطلوبة." },
  { q: "كم يستغرق توثيق الوحدة؟", a: "عادةً خلال 24 ساعة عمل. سيصلك إشعار بالموافقة أو طلب تعديل." },
  { q: "هل الموقع مجاني؟", a: "نعم، البحث والتصفح مجاني. بعض الميزات المتقدمة قد تتطلب اشتراكاً مدفوعاً." },
  { q: "كيف أتواصل مع مالك؟", a: "من صفحة الوحدة، اضغط \"تواصل مع المالك\" وستتمكن من إرسال رسالة مباشرة." },
];

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message_type: "استفسار", message: "" });
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      return toast.error("يرجى ملء جميع الحقول المطلوبة");
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.");
      setForm({ name: "", email: "", phone: "", subject: "", message_type: "استفسار", message: "" });
    } catch (err) {
      toast.error(err.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--surface-dim, #F4F1EC)" }}>
      <style>{`
        .contact-section { padding: 5rem 0; }
        @media (max-width: 768px) { .contact-section { padding: 3rem 0; } }
        .contact-info-card { transition: transform 0.3s, box-shadow 0.3s; }
        .contact-info-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .faq-item { border: 1px solid var(--outline-variant, #D0D0D0); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
        .faq-item:hover { border-color: var(--primary); }
        .faq-question { cursor: pointer; transition: background 0.2s; }
        .faq-question:hover { background: rgba(107,144,128,0.04); }
        .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .faq-answer.open { max-height: 200px; }
        .whatsapp-float { position: fixed; bottom: 24px; left: 24px; z-index: 1000; }
        .whatsapp-float a { display: flex; align-items: center; gap: 8px; background: #25D366; color: white; padding: 14px 24px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 0.9rem; box-shadow: 0 4px 16px rgba(37,211,102,0.35); transition: transform 0.2s, box-shadow 0.2s; }
        .whatsapp-float a:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(37,211,102,0.45); }
        .map-container { border-radius: 16px; overflow: hidden; border: 2px solid var(--outline-variant, #D0D0D0); }
        .map-container iframe { width: 100%; height: 350px; border: 0; }
        @media (max-width: 768px) { .map-container iframe { height: 250px; } }
      `}</style>

      {/* Hero */}
      <section className="contact-section text-center" style={{ background: "linear-gradient(135deg, var(--primary) 0%, #4a7c65 100%)" }}>
        <div className="container px-4">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <span className="material-symbols-outlined mb-3" style={{ color: "rgba(255,255,255,0.85)", fontSize: 48 }}>mail</span>
              <h1 className="fw-bold text-white mb-3" style={{ fontSize: "2.5rem" }}>تواصل معنا</h1>
              <p className="text-white mx-auto" style={{ maxWidth: 600, fontSize: "1.1rem", lineHeight: 1.8, opacity: 0.9 }}>
                نحن هنا لمساعدتك. سواء كان لديك سؤال، اقتراح، أو مشكلة، لا تتردد في التواصل معنا.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="contact-section">
        <div className="container px-4">
          <div className="row g-4 justify-content-center" style={{ marginTop: "-3rem" }}>

            {/* Phone Card */}
            <div className="col-md-6 col-lg-3">
              <a href="tel:+201026746929" className="text-decoration-none d-block h-100">
                <div className="contact-info-card rounded-4 p-4 h-100" style={{ background: "var(--surface, #fff)", border: "1px solid var(--outline-variant, #D0D0D0)" }}>
                  <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, background: "var(--primary-container, rgba(107,144,128,0.12))" }}>
                    <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 32 }}>phone</span>
                  </div>
                  <h6 className="fw-bold mb-2" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "1.05rem" }}>الهاتف</h6>
                  <p className="mb-2 fw-bold" style={{ color: "var(--primary)", fontSize: "1.15rem", direction: "ltr" }}>01026746929</p>
                  <small style={{ color: "var(--on-surface-variant, #767586)", fontSize: "0.85rem" }}>متاح 9 صباحاً - 9 مساءً</small>
                </div>
              </a>
            </div>

            {/* Email Card */}
            <div className="col-md-6 col-lg-3">
              <a href="mailto:support@sakani.com" className="text-decoration-none d-block h-100">
                <div className="contact-info-card rounded-4 p-4 h-100" style={{ background: "var(--surface, #fff)", border: "1px solid var(--outline-variant, #D0D0D0)" }}>
                  <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, background: "var(--primary-container, rgba(107,144,128,0.12))" }}>
                    <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 32 }}>email</span>
                  </div>
                  <h6 className="fw-bold mb-2" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "1.05rem" }}>البريد الإلكتروني</h6>
                  <p className="mb-2 fw-bold" style={{ color: "var(--primary)", fontSize: "1rem" }}>support@sakani.com</p>
                  <small style={{ color: "var(--on-surface-variant, #767586)", fontSize: "0.85rem" }}>نرد خلال 24 ساعة</small>
                </div>
              </a>
            </div>

            {/* Location Card */}
            <div className="col-md-6 col-lg-3">
              <div className="contact-info-card rounded-4 p-4 h-100" style={{ background: "var(--surface, #fff)", border: "1px solid var(--outline-variant, #D0D0D0)" }}>
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, background: "var(--primary-container, rgba(107,144,128,0.12))" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 32 }}>location_on</span>
                </div>
                <h6 className="fw-bold mb-2" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "1.05rem" }}>الموقع</h6>
                <p className="mb-2 fw-bold" style={{ color: "var(--primary)", fontSize: "1.05rem" }}>الفيوم، مصر</p>
                <small style={{ color: "var(--on-surface-variant, #767586)", fontSize: "0.85rem" }}>منصة رقمية فقط</small>
              </div>
            </div>

            {/* Hours Card */}
            <div className="col-md-6 col-lg-3">
              <div className="contact-info-card rounded-4 p-4 h-100" style={{ background: "var(--surface, #fff)", border: "1px solid var(--outline-variant, #D0D0D0)" }}>
                <div className="rounded-3 d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64, background: "var(--primary-container, rgba(107,144,128,0.12))" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 32 }}>schedule</span>
                </div>
                <h6 className="fw-bold mb-2" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "1.05rem" }}>ساعات العمل</h6>
                <p className="mb-2 fw-bold" style={{ color: "var(--primary)", fontSize: "1.05rem" }}>9:00 ص - 9:00 م</p>
                <small style={{ color: "var(--on-surface-variant, #767586)", fontSize: "0.85rem" }}>طوال أيام الأسبوع</small>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="contact-section" style={{ background: "var(--surface, #fff)" }}>
        <div className="container px-4">
          <div className="row g-5 align-items-start">
            {/* Form */}
            <div className="col-lg-7">
              <h2 className="fw-bold mb-2" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "1.8rem" }}>أرسل لنا رسالة</h2>
              <p className="mb-4" style={{ color: "var(--on-surface-variant, #464555)", fontSize: "0.95rem" }}>
                املأ النموذج أدناه وسنرد عليك في أقرب وقت ممكن.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>
                      الاسم الكامل <span style={{ color: "var(--error, #ba1a1a)" }}>*</span>
                    </label>
                    <input
                      name="name"
                      className="form-control rounded-3 py-2"
                      placeholder="أدخل اسمك"
                      value={form.name}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--outline-variant, #D0D0D0)" }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>
                      البريد الإلكتروني <span style={{ color: "var(--error, #ba1a1a)" }}>*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="form-control rounded-3 py-2"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--outline-variant, #D0D0D0)" }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>
                      رقم الهاتف
                    </label>
                    <input
                      name="phone"
                      className="form-control rounded-3 py-2"
                      placeholder="01xxxxxxxxx"
                      value={form.phone}
                      onChange={handleChange}
                      style={{ borderColor: "var(--outline-variant, #D0D0D0)" }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>
                      نوع الرسالة <span style={{ color: "var(--error, #ba1a1a)" }}>*</span>
                    </label>
                    <select
                      name="message_type"
                      className="form-select rounded-3 py-2"
                      value={form.message_type}
                      onChange={handleChange}
                      style={{ borderColor: "var(--outline-variant, #D0D0D0)" }}
                    >
                      {MESSAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>
                      الموضوع <span style={{ color: "var(--error, #ba1a1a)" }}>*</span>
                    </label>
                    <input
                      name="subject"
                      className="form-control rounded-3 py-2"
                      placeholder="موضوع الرسالة"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--outline-variant, #D0D0D0)" }}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>
                      الرسالة <span style={{ color: "var(--error, #ba1a1a)" }}>*</span>
                    </label>
                    <textarea
                      name="message"
                      className="form-control rounded-3 py-2"
                      rows="5"
                      placeholder="اكتب رسالتك هنا..."
                      value={form.message}
                      onChange={handleChange}
                      required
                      style={{ borderColor: "var(--outline-variant, #D0D0D0)", resize: "vertical" }}
                    />
                  </div>
                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn px-5 py-2 fw-bold rounded-3"
                      disabled={loading}
                      style={{
                        background: loading ? "var(--primary-container, #A4C3B2)" : "var(--primary)",
                        color: "white",
                        fontSize: "0.95rem",
                        transition: "all 0.2s",
                      }}
                    >
                      {loading ? (
                        <span className="d-flex align-items-center gap-2">
                          <span className="spinner-border spinner-border-sm" />
                          جاري الإرسال...
                        </span>
                      ) : (
                        <span className="d-flex align-items-center gap-2">
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
                          إرسال الرسالة
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Map */}
            <div className="col-lg-5">
              <h4 className="fw-bold mb-3" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "1.1rem" }}>موقعنا</h4>
              <div className="map-container mb-4">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54817.37530887583!2d30.825!3d29.31!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f4b2f0e6b9b4b3%3A0x1234567890abcdef!2sFayoum%2C%20Egypt!5e0!3m2!1sen!2seg!4v1"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="موقع سكني - الفيوم"
                />
              </div>
              <div className="p-4 rounded-4" style={{ background: "var(--surface-dim, #F4F1EC)" }}>
                <h6 className="fw-bold mb-3" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "0.9rem" }}>الفروع والمندوبين</h6>
                <div className="d-flex align-items-start gap-3 mb-3">
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 22, marginTop: 2 }}>apartment</span>
                  <div>
                    <p className="mb-0 fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>المقر الرئيسي</p>
                    <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>الفيوم، مصر</p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 22, marginTop: 2 }}>group</span>
                  <div>
                    <p className="mb-0 fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface, #1A1D23)" }}>فريق المبيعات</p>
                    <p className="mb-0" style={{ fontSize: "0.8rem", color: "var(--on-surface-variant, #464555)" }}>متاحون للزيارة الميدانية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="contact-section">
        <div className="container px-4">
          <div className="text-center mb-5">
            <span className="material-symbols-outlined mb-2" style={{ color: "var(--primary)", fontSize: 40 }}>help</span>
            <h2 className="fw-bold" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "2rem" }}>الأسئلة الشائعة</h2>
            <p style={{ color: "var(--on-surface-variant, #464555)", maxWidth: 500, margin: "0 auto" }}>
              هل لديك سؤال شائع؟ تحقق من الأسئلة أدناه
            </p>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="d-flex flex-column gap-3">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className="faq-item">
                    <div
                      className="faq-question d-flex align-items-center justify-content-between p-4"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="fw-bold" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "0.95rem" }}>
                        {item.q}
                      </span>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          color: "var(--primary)",
                          fontSize: 22,
                          transform: openFaq === i ? "rotate(180deg)" : "rotate(0)",
                          transition: "transform 0.3s",
                        }}
                      >
                        expand_more
                      </span>
                    </div>
                    <div className={`faq-answer px-4 pb-4 ${openFaq === i ? "open" : ""}`}>
                      <p className="mb-0" style={{ color: "var(--on-surface-variant, #464555)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="contact-section text-center" style={{ background: "linear-gradient(135deg, var(--primary-container, rgba(107,144,128,0.12)) 0%, var(--surface-dim, #F4F1EC) 100%)" }}>
        <div className="container px-4">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <span className="material-symbols-outlined mb-3" style={{ color: "var(--primary)", fontSize: 48 }}>support_agent</span>
              <h2 className="fw-bold mb-3" style={{ color: "var(--on-surface, #1A1D23)", fontSize: "2rem" }}>لا تجد الإجابة؟</h2>
              <p className="mb-4" style={{ color: "var(--on-surface-variant, #464555)", fontSize: "1rem", maxWidth: 500, margin: "0 auto" }}>
                فريق الدعم لدينا جاهز لمساعدتك في أي وقت
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <a
                  href="https://wa.me/201026746929"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn px-4 py-2 rounded-3 fw-bold text-decoration-none d-inline-flex align-items-center gap-2"
                  style={{ background: "#25D366", color: "white", fontSize: "0.9rem" }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  تواصل عبر واتساب
                </a>
                <a
                  href="mailto:support@sakani.com"
                  className="btn px-4 py-2 rounded-3 fw-bold text-decoration-none d-inline-flex align-items-center gap-2"
                  style={{ background: "var(--primary)", color: "white", fontSize: "0.9rem" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>email</span>
                  أرسل إيميل
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Float */}
      <div className="whatsapp-float d-none d-md-block">
        <a href="https://wa.me/201026746929" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          تواصل معنا
        </a>
      </div>
    </div>
  );
}

export default Contact;
