import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apartmentService } from "../../services/apartmentService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import GuestLoginModal from "../../components/ui/GuestLoginModal";
import heroImage from "../../assets/images/image.png";
import toast from "react-hot-toast";

const categories = [
  { title: "شقق مفروشة", icon: "apartment", desc: "شقق جاهزة بالأثاث", color: "#6B9080" },
  { title: "استوديوهات", icon: "meeting_room", desc: "مساحات صغيرة مريحة", color: "#A4C3B2" },
  { title: "غرف مشتركة", icon: "group", desc: "توفير مع زملاء", color: "#E0A854" },
  { title: "سكن قريب من الجامعة", icon: "school", desc: "على بعد دقائق", color: "#4A6E5C" },
];

const neighborhoodOptions = [
  { value: "sawaqi", label: "السواقي" },
  { value: "algon", label: "الجون" },
  { value: "central", label: "السنترال" },
  { value: "hawatem", label: "الحواتم" },
  { value: "lotfallah", label: "لطف الله" },
  { value: "sawy", label: "الصوفي" },
  { value: "baghouz", label: "باغوص" },
  { value: "dala", label: "دلة" },
  { value: "keman-fares", label: "كيمان فارس" },
  { value: "salakhana", label: "السلخانة" },
  { value: "sheikh-hassan", label: "الشيخ حسن" },
  { value: "damo", label: "دمو" },
  { value: "masla", label: "المسلة" },
  { value: "dar-alramad", label: "دار الرماد" },
];

const universities = [
  { name: "جامعة الفيوم", icon: "school", color: "#6B9080" },
  { name: "جامعة مصر الدولية التكنولوجية", icon: "biotech", color: "#4A6E5C" },
  { name: "جامعة النيل الأهلية", icon: "account_balance", color: "#A4C3B2" },
  { name: "الجامعات الأهلية", icon: "cast_for_education", color: "#E0A854" },
];

const steps = [
  { title: "ابحث", text: "حدد الحي والسعر وعدد الغرف، وتصفّح النتائج في ثوانٍ.", icon: "search", color: "#6B9080" },
  { title: "اختر", text: "شوف الصور والمميزات الكاملة وقارن بين الخيارات.", icon: "task_alt", color: "#A4C3B2" },
  { title: "تواصل", text: "اتواصل مباشرة مع المالك أو الوسيط واحجز موعد المعاينة.", icon: "chat_bubble", color: "#4A6E5C" },
];

const stats = [
  { value: 850, suffix: "+", label: "طالب مسجل", icon: "groups" },
  { value: 180, suffix: "+", label: "وحدة سكنية", icon: "apartment" },
  { value: 35, suffix: "+", label: "مالك وسيط موثق", icon: "verified" },
  { value: 95, suffix: "%", label: "نسبة رضا الطلاب", icon: "thumb_up" },
];

const faqs = [
  { question: "هل المنصة مجانية للطلاب؟", answer: "نعم، البحث وتصفح الشققات مجاني بالكامل. لا ن收取 أي رسوم على الطلاب." },
  { question: "كيف أتأكد من موثوقية الشقة؟", answer: "كل مالك أو وسيط عليه علامة توثيق، ونراجع المستندات قبل النشر. كمان تقدر تشوف تقييمات الطلاب السابقين." },
  { question: "هل أقدر أتواصل مع المالك قبل الحجز؟", answer: "أكيد! التواصل مباشر مع المالك أو الوسيط من خلال الرسائل أو الهاتف." },
  { question: "إيه الفرق بين الشقة والاستوديو؟", answer: "الشقة عادة فيها أكتر من أوضة، الاستوديو مساحة واحدة مفتوحة فيها كل حاجة. الاتنين متاحة بالفيوم." },
];

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealDiv({ children, className = "", delay = 0, ...props }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`reveal-up ${className}`} style={{ transitionDelay: `${delay}s` }} {...props}>
      {children}
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString("ar-EG")}{suffix}
    </span>
  );
}

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState({ district: "sawaqi", price: "all", rooms: "all", type: "all" });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestReturnPath, setGuestReturnPath] = useState("");

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    const { error } = await supabase.from("newsletters").insert({ email: newsletterEmail.trim() });
    if (error) {
      if (error.code === "23505") {
        toast.error("هذا البريد مسجل بالفعل");
      } else {
        toast.error("حدث خطأ. حاول مرة أخرى.");
      }
      return;
    }
    toast.success("تم الاشتراك بنجاح في النشرة البريدية!");
    setNewsletterEmail("");
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await apartmentService.getAll({ status: "approved", limit: 3 });
      setProperties(
        (data || []).map((apt) => ({
          id: apt.id,
          image: apt.images?.[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80",
          title: apt.title,
          price: `${Number(apt.price).toLocaleString("ar-EG")} ج.م`,
          location: `${apt.neighborhood || ""}، ${apt.city || ""}`,
          features: [apt.bedrooms ? `${apt.bedrooms} غرف` : null, apt.bathrooms ? `${apt.bathrooms} حمام` : null, apt.apartment_type || null].filter(Boolean),
          badge: "متاح",
        }))
      );
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  const handleDetailsClick = useCallback((propertyId) => {
    if (!user) {
      setGuestReturnPath(`/apartment/${propertyId}`);
      setShowGuestModal(true);
      return;
    }
    navigate(`/apartment/${propertyId}`);
  }, [user, navigate]);

  const handleSearch = useCallback((event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("city", "fayoum");
    params.set("district", search.district);
    if (search.price !== "all") params.set("price", search.price);
    if (search.rooms !== "all") params.set("rooms", search.rooms);
    if (search.type !== "all") params.set("type", search.type);
    navigate(`/apartments?${params.toString()}`);
  }, [search, navigate]);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero-section">
        <div className="container px-4 px-lg-5">
          <div className="row align-items-center gy-5">
            <div className="col-lg-6 order-2 order-lg-1 text-end hero-content">
              <RevealDiv>
                <span className="badge mb-3 py-2 px-3" style={{ background: "var(--primary-container)", color: "var(--primary)", fontSize: "var(--fs-xs)", borderRadius: "999px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginLeft: 4 }}>verified</span>
                  منصة سكني — الفيوم
                </span>
              </RevealDiv>
              <RevealDiv delay={0.1}>
                <h1 className="display-5 fw-bold mb-3" style={{ lineHeight: 1.3, color: "var(--on-surface)" }}>
                  اعثر على <span style={{ color: "var(--primary)" }}>السكن الجامعي</span> المناسب في الفيوم
                </h1>
              </RevealDiv>
              <RevealDiv delay={0.2}>
                <p className="lead mb-4" style={{ color: "var(--on-surface-variant)", lineHeight: 1.8, maxWidth: 520 }}>
                  سكني تساعد الطلاب الوافدين في الوصول إلى <strong style={{ color: "var(--primary)" }}>أفضل الشقق والغرف</strong> القريبة من الجامعات، مع أسعار مناسبة وتواصل مباشر مع المالك أو الوسيط الموثق.
                </p>
              </RevealDiv>
              <RevealDiv delay={0.3}>
                <div className="d-flex gap-2 mb-4">
                  <Link to="/apartments" className="btn btn-primary btn-lg px-4 py-2 fw-bold" style={{ borderRadius: "var(--radius-md)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: "middle", marginLeft: 6 }}>search</span>
                    تصفح الشقق
                  </Link>
                  <Link to="/register" className="btn btn-lg px-4 py-2 fw-bold" style={{ borderRadius: "var(--radius-md)", border: "2px solid var(--primary)", color: "var(--primary)" }}>
                    سجّل الآن
                  </Link>
                </div>
              </RevealDiv>
            </div>
            <div className="col-lg-6 order-1 order-lg-2">
              <div className="position-relative hero-image-wrapper">
                <div className="hero-glow"></div>
                <img src={heroImage} alt="سكن جامعي حديث" className="img-fluid rounded-4 shadow-lg hero-img" style={{ objectFit: "cover", width: "100%", height: "auto", maxHeight: 480 }} />
              </div>
            </div>
          </div>

          {/* Search Card */}
          <RevealDiv delay={0.35}>
            <div className="mt-5 card border-0 p-4 p-lg-5" style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}>
              <form onSubmit={handleSearch}>
                <div className="row g-3 align-items-end">
                  <div className="col-md-6 col-lg-3">
                    <label className="form-label small fw-semibold" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginLeft: 4 }}>location_on</span>
                      الحي
                    </label>
                    <select className="form-select form-select-lg" style={{ borderRadius: "var(--radius-md)", background: "var(--surface-container-low)", border: "1px solid var(--border)" }} value={search.district} onChange={(e) => setSearch((prev) => ({ ...prev, district: e.target.value }))}>
                      {neighborhoodOptions.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                    </select>
                  </div>
                  <div className="col-md-6 col-lg-2">
                    <label className="form-label small fw-semibold" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginLeft: 4 }}>payments</span>
                      السعر
                    </label>
                    <select className="form-select form-select-lg" style={{ borderRadius: "var(--radius-md)", background: "var(--surface-container-low)", border: "1px solid var(--border)" }} value={search.price} onChange={(e) => setSearch((prev) => ({ ...prev, price: e.target.value }))}>
                      <option value="all">الكل</option>
                      <option value="low">أقل من 2,000 ج.م</option>
                      <option value="mid">2,000 - 3,500 ج.م</option>
                      <option value="high">أكثر من 3,500 ج.م</option>
                    </select>
                  </div>
                  <div className="col-md-6 col-lg-2">
                    <label className="form-label small fw-semibold" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginLeft: 4 }}>door_front</span>
                      الغرف
                    </label>
                    <select className="form-select form-select-lg" style={{ borderRadius: "var(--radius-md)", background: "var(--surface-container-low)", border: "1px solid var(--border)" }} value={search.rooms} onChange={(e) => setSearch((prev) => ({ ...prev, rooms: e.target.value }))}>
                      <option value="all">الكل</option>
                      <option value="1">غرفة واحدة</option>
                      <option value="2">غرفتان</option>
                      <option value="3">3 غرف</option>
                    </select>
                  </div>
                  <div className="col-md-6 col-lg-2">
                    <label className="form-label small fw-semibold" style={{ color: "var(--on-surface-variant)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginLeft: 4 }}>apartment</span>
                      النوع
                    </label>
                    <select className="form-select form-select-lg" style={{ borderRadius: "var(--radius-md)", background: "var(--surface-container-low)", border: "1px solid var(--border)" }} value={search.type} onChange={(e) => setSearch((prev) => ({ ...prev, type: e.target.value }))}>
                      <option value="all">الكل</option>
                      <option value="apartment">شقة</option>
                      <option value="studio">استوديو</option>
                      <option value="shared">غرفة مشتركة</option>
                    </select>
                  </div>
                  <div className="col-lg-3">
                    <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold py-3" style={{ borderRadius: "var(--radius-md)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: "middle", marginLeft: 6 }}>search</span>
                      بحث
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container px-4 px-lg-5">
          <RevealDiv>
            <div className="d-flex justify-content-between align-items-center mb-5">
              <div>
                <h2 className="h4 fw-bold mb-1" style={{ color: "var(--on-surface)" }}>اختر نوع السكن</h2>
                <p className="mb-0 small" style={{ color: "var(--on-surface-variant)" }}>خيارات متنوعة تناسب احتياجاتك وميزانيتك</p>
              </div>
              <Link to="/apartments" className="fw-bold text-decoration-none d-flex align-items-center gap-1" style={{ color: "var(--primary)", fontSize: "var(--fs-sm)" }}>
                عرض الكل
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              </Link>
            </div>
          </RevealDiv>
          <div className="row g-3 g-md-4">
            {categories.map((item, i) => (
              <div className="col-6 col-md-3" key={item.title}>
                <RevealDiv delay={i * 0.08}>
                  <Link to="/apartments" className="text-decoration-none">
                    <div className="card border-0 h-100 text-center p-4 category-card" style={{ borderRadius: "var(--radius-lg)" }}>
                      <div className="mx-auto mb-3 d-flex align-items-center justify-content-center icon-wrap" style={{ width: 60, height: 60, borderRadius: "var(--radius-md)", background: `${item.color}15` }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 30, color: item.color }}>{item.icon}</span>
                      </div>
                      <h3 className="h6 fw-bold mb-1" style={{ color: "var(--on-surface)" }}>{item.title}</h3>
                      <p className="small mb-0" style={{ color: "var(--on-surface-variant)" }}>{item.desc}</p>
                    </div>
                  </Link>
                </RevealDiv>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Apartments */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container px-4 px-lg-5">
          <RevealDiv>
            <div className="d-flex justify-content-between align-items-center mb-5">
              <div>
                <h2 className="h4 fw-bold mb-1" style={{ color: "var(--on-surface)" }}>أحدث العقارات</h2>
                <p className="mb-0 small" style={{ color: "var(--on-surface-variant)" }}>شقق وغرف متاحة حالياً في الفيوم</p>
              </div>
              <Link to="/apartments" className="fw-bold text-decoration-none d-flex align-items-center gap-1" style={{ color: "var(--primary)", fontSize: "var(--fs-sm)" }}>
                عرض الكل
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              </Link>
            </div>
          </RevealDiv>
          {loading ? (
            <div className="row g-4">
              {[1, 2, 3].map((i) => (
                <div className="col-md-6 col-lg-4" key={i}>
                  <div className="card border-0 overflow-hidden h-100" style={{ borderRadius: "var(--radius-lg)" }}>
                    <div className="placeholder-glow"><div className="placeholder col-12" style={{ height: 220 }} /></div>
                    <div className="card-body"><span className="placeholder col-6 mb-2" /><span className="placeholder col-8 mb-2" /><span className="placeholder col-4" /></div>
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-5">
              <span className="material-symbols-outlined mb-2" style={{ fontSize: 56, color: "var(--on-surface-variant)" }}>apartment</span>
              <p style={{ color: "var(--on-surface-variant)" }}>لا توجد عقارات متاحة حالياً</p>
            </div>
          ) : (
            <div className="row g-4">
              {properties.map((property, i) => (
                <div className="col-md-6 col-lg-4" key={property.id}>
                  <RevealDiv delay={i * 0.1}>
                    <div className="card border-0 overflow-hidden h-100 property-card" style={{ borderRadius: "var(--radius-lg)" }}>
                      <div className="position-relative">
                        <img src={property.image} alt={property.title} className="property-image w-100" style={{ height: 220, objectFit: "cover" }} />
                        <span className="badge position-absolute top-3 end-3 py-2 px-3 fw-bold" style={{ background: "var(--success)", color: "white", borderRadius: "999px", fontSize: "var(--fs-xs)" }}>
                          {property.badge}
                        </span>
                        <button type="button" className="btn position-absolute top-3 start-3" style={{ background: "rgba(255,255,255,0.9)", borderRadius: "50%", width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--danger)" }}>favorite</span>
                        </button>
                      </div>
                      <div className="card-body text-end p-4">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h3 className="h6 fw-bold mb-0" style={{ color: "var(--on-surface)" }}>{property.title}</h3>
                          <span className="fw-bold" style={{ color: "var(--primary)", fontSize: "0.95rem" }}>{property.price}</span>
                        </div>
                        <p className="small mb-3" style={{ color: "var(--on-surface-variant)" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginLeft: 4 }}>location_on</span>
                          {property.location}
                        </p>
                        <div className="d-flex justify-content-end gap-2 flex-wrap pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                          {property.features.map((feature) => (
                            <span key={feature} className="small px-2 py-1 rounded-2" style={{ background: "var(--surface-container-low)", color: "var(--on-surface-variant)", fontSize: "0.75rem" }}>{feature}</span>
                          ))}
                        </div>
                        <div className="mt-3 d-flex justify-content-end">
                          <button className="btn btn-sm fw-bold px-3" onClick={() => handleDetailsClick(property.id)} style={{ background: "var(--primary-container)", color: "var(--primary)", borderRadius: "var(--radius-sm)" }}>
                            عرض التفاصيل
                          </button>
                        </div>
                      </div>
                    </div>
                  </RevealDiv>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "5rem 0", background: "var(--surface-container-low)" }}>
        <div className="container px-4 px-lg-5">
          <RevealDiv>
            <div className="text-center mb-5">
              <h2 className="h4 fw-bold mb-2" style={{ color: "var(--on-surface)" }}>كيف تجد سكنك في الفيوم؟</h2>
              <p className="mx-auto" style={{ maxWidth: 520, color: "var(--on-surface-variant)" }}>ثلاث خطوات بسيطة توصّلك للسكن المناسب</p>
            </div>
          </RevealDiv>
          <div className="row g-4">
            {steps.map((step, i) => (
              <div className="col-md-4" key={step.title}>
                <RevealDiv delay={i * 0.12}>
                  <div className="card border-0 h-100 p-4 text-center step-card" style={{ borderRadius: "var(--radius-lg)" }}>
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 68, height: 68, borderRadius: "50%", background: `${step.color}12` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: step.color }}>{step.icon}</span>
                    </div>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold mb-3" style={{ width: 30, height: 30, fontSize: "var(--fs-xs)", background: step.color, color: "white" }}>
                      {i + 1}
                    </div>
                    <h3 className="h6 fw-bold mb-2" style={{ color: "var(--on-surface)" }}>{step.title}</h3>
                    <p className="small mb-0" style={{ color: "var(--on-surface-variant)", lineHeight: 1.7 }}>{step.text}</p>
                  </div>
                </RevealDiv>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Universities */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container px-4 px-lg-5">
          <RevealDiv>
            <div className="text-center mb-5">
              <h2 className="h4 fw-bold mb-2" style={{ color: "var(--on-surface)" }}>جامعات الفيوم</h2>
              <p className="mb-0" style={{ color: "var(--on-surface-variant)" }}>سكن قريب من جامعتك</p>
            </div>
          </RevealDiv>
          <div className="row g-3 justify-content-center">
            {universities.map((uni, i) => (
              <div className="col-6 col-md-3" key={uni.name}>
                <RevealDiv delay={i * 0.08}>
                  <div className="card border-0 text-center p-4 h-100 university-card" style={{ borderRadius: "var(--radius-lg)" }}>
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, borderRadius: "50%", background: `${uni.color}15` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 26, color: uni.color }}>{uni.icon}</span>
                    </div>
                    <h3 className="h6 fw-bold mb-0" style={{ color: "var(--on-surface)" }}>{uni.name}</h3>
                  </div>
                </RevealDiv>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container px-4 px-lg-5">
          <RevealDiv>
            <div className="rounded-4 p-4 p-lg-5 position-relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)", color: "white" }}>
              <div className="floating-dot" style={{ width: 80, height: 80, background: "rgba(255,255,255,0.08)", top: "10%", left: "5%", animationDelay: "0s" }} />
              <div className="floating-dot" style={{ width: 50, height: 50, background: "rgba(255,255,255,0.06)", bottom: "15%", right: "10%", animationDelay: "2s" }} />
              <div className="floating-dot" style={{ width: 35, height: 35, background: "rgba(255,255,255,0.05)", top: "60%", left: "80%", animationDelay: "4s" }} />
              <div className="row text-center g-4" style={{ position: "relative", zIndex: 1 }}>
                {stats.map((s, i) => (
                  <div className="col-6 col-md-3" key={s.label}>
                    <RevealDiv delay={i * 0.1}>
                      <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: 32, color: "rgba(255,255,255,0.7)" }}>{s.icon}</span>
                      <div className="display-5 fw-bold" style={{ color: "white" }}>
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                      </div>
                      <div className="small mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>{s.label}</div>
                    </RevealDiv>
                  </div>
                ))}
              </div>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "5rem 0", background: "var(--surface-container-low)" }}>
        <div className="container px-4 px-lg-5">
          <div className="mx-auto" style={{ maxWidth: 760 }}>
            <RevealDiv>
              <h2 className="h4 fw-bold text-center mb-5" style={{ color: "var(--on-surface)" }}>الأسئلة الشائعة</h2>
            </RevealDiv>
            <div className="d-grid gap-3">
              {faqs.map((item, i) => (
                <RevealDiv key={item.question} delay={i * 0.08}>
                  <details className="card border-0 p-4" style={{ borderRadius: "var(--radius-md)" }}>
                    <summary className="fw-semibold cursor-pointer" style={{ color: "var(--on-surface)" }}>{item.question}</summary>
                    <p className="small mt-3 mb-0" style={{ color: "var(--on-surface-variant)", lineHeight: 1.7 }}>{item.answer}</p>
                  </details>
                </RevealDiv>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Newsletter */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container px-4 px-lg-5">
          <RevealDiv>
            <div className="rounded-4 p-4 p-lg-5 text-center position-relative cta-section" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 50%, #3D5E4A 100%)", color: "white" }}>
              <div className="floating-dot" style={{ width: 100, height: 100, background: "rgba(255,255,255,0.1)", top: "-20px", right: "10%", animationDelay: "1s" }} />
              <div className="floating-dot" style={{ width: 60, height: 60, background: "rgba(255,255,255,0.07)", bottom: "-15px", left: "15%", animationDelay: "3s" }} />
              <span className="material-symbols-outlined mb-3 d-block" style={{ fontSize: 40, color: "rgba(255,255,255,0.8)" }}>mail</span>
              <h2 className="h4 fw-bold mb-2" style={{ position: "relative", zIndex: 1 }}>اشترك في النشرة البريدية</h2>
              <p className="mb-4" style={{ color: "rgba(255,255,255,0.85)", position: "relative", zIndex: 1 }}>كن أول من يعرف عن العروض والوحدات الجديدة في الفيوم</p>
              <form className="row g-3 justify-content-center" onSubmit={handleNewsletterSubmit} style={{ position: "relative", zIndex: 1 }}>
                <div className="col-md-6">
                  <input type="email" className="form-control form-control-lg newsletter-input" style={{ borderRadius: "var(--radius-md)", border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "white" }} placeholder="بريدك الإلكتروني" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} required />
                </div>
                <div className="col-md-3">
                  <button type="submit" className="btn btn-lg w-100 fw-bold py-3" style={{ borderRadius: "var(--radius-md)", background: "white", color: "var(--primary)" }}>
                    اشترك الآن
                  </button>
                </div>
              </form>
            </div>
          </RevealDiv>
        </div>
      </section>

      <GuestLoginModal show={showGuestModal} onClose={() => setShowGuestModal(false)} returnPath={guestReturnPath} />
    </div>
  );
}

export default Home;
