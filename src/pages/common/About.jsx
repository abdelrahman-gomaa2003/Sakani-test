import { useRef, useState, useEffect } from "react";
import heroImage from "../../assets/images/image.png";

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

function useReveal() {
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
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal-up ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

const features = [
  {
    icon: "verified",
    title: "وحدات موثقة",
    desc: "نعرض وحدات سكنية يتم مراجعتها لضمان جودة المعلومات والمصداقية.",
    color: "#6B9080",
  },
  {
    icon: "bolt",
    title: "بحث سريع وذكي",
    desc: "اعثر على السكن المناسب باستخدام فلاتر متقدمة حسب الحي والسعر وعدد الغرف.",
    color: "#E0A854",
  },
  {
    icon: "location_on",
    title: "مواقع قريبة من الجامعات",
    desc: "نوفر خيارات سكن بالقرب من جامعات الفيوم لتسهيل الانتقال اليومي.",
    color: "#4A6E5C",
  },
  {
    icon: "chat_bubble",
    title: "تواصل مباشر",
    desc: "تواصل بسهولة مع المالك أو الوسيط دون أي تعقيد.",
    color: "#A4C3B2",
  },
];

const goals = [
  "تسهيل رحلة البحث عن السكن للطلاب الوافدين.",
  "توفير معلومات دقيقة وصور حقيقية للوحدات السكنية.",
  "ربط الطلاب بالملاك والوسطاء بطريقة آمنة وموثوقة.",
  "توفير الوقت والجهد أثناء البحث.",
  "تحسين تجربة السكن الطلابي داخل محافظة الفيوم.",
];

const stats = [
  { value: 850, suffix: "+", label: "طالب يستخدم المنصة", icon: "groups" },
  { value: 180, suffix: "+", label: "وحدة سكنية", icon: "apartment" },
  { value: 35, suffix: "+", label: "مالك ووسيط موثق", icon: "verified" },
  { value: 95, suffix: "%", label: "نسبة رضا المستخدمين", icon: "thumb_up" },
];

function About() {
  return (
    <div style={{ overflow: "hidden" }}>
      {/* Hero */}
      <section style={{ padding: "5rem 0 4rem", background: "linear-gradient(160deg, var(--surface-container-low) 0%, var(--secondary) 50%, var(--surface-container) 100%)" }}>
        <div className="container px-4 px-lg-5">
          <div className="row align-items-center gy-5">
            <div className="col-lg-6 order-2 order-lg-1 text-end">
              <Reveal>
                <span className="badge mb-3 py-2 px-3" style={{ background: "var(--primary-container)", color: "var(--primary)", fontSize: "0.8rem", borderRadius: "999px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginLeft: 4 }}>info</span>
                  عن سكني
                </span>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 className="display-5 fw-bold mb-3" style={{ lineHeight: 1.3, color: "var(--on-surface)" }}>
                  منصة <span style={{ color: "var(--primary)" }}>سكني</span> للسكن الطلابي
                </h1>
              </Reveal>
              <Reveal delay={0.2}>
                <p style={{ color: "var(--on-surface-variant)", lineHeight: 1.9, fontSize: "1.05rem", maxWidth: 540 }}>
                  سكني هي منصة إلكترونية متخصصة في مساعدة الطلاب والطالبات الوافدين إلى محافظة الفيوم في العثور على سكن مناسب بسهولة وأمان. نوفر تجربة بحث ذكية تتيح للطالب استعراض الوحدات السكنية، مقارنة الأسعار، مشاهدة الصور الحقيقية، والتواصل مباشرة مع المالك أو الوسيط الموثق، مما يوفر الوقت والجهد ويمنح المستخدم تجربة موثوقة منذ بداية البحث وحتى اختيار السكن المناسب.
                </p>
              </Reveal>
            </div>
            <div className="col-lg-6 order-1 order-lg-2">
              <Reveal delay={0.15}>
                <div className="position-relative">
                  <div style={{ position: "absolute", inset: "auto auto 5% -5%", width: 250, height: 250, borderRadius: "999px", background: "radial-gradient(circle, rgba(107,144,128,0.15) 0%, transparent 70%)", filter: "blur(40px)", zIndex: 0 }} />
                  <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80" alt="طلاب يبحثون عن سكن" className="img-fluid rounded-4 shadow-lg position-relative" style={{ zIndex: 1, animation: "heroFloat 6s ease-in-out infinite" }} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sakani? */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container px-4 px-lg-5">
          <Reveal>
            <div className="text-center mb-5">
              <h2 className="h3 fw-bold mb-2" style={{ color: "var(--on-surface)" }}>لماذا سكني؟</h2>
              <p className="mx-auto" style={{ maxWidth: 520, color: "var(--on-surface-variant)", lineHeight: 1.7 }}>مميزات تجعل من سكني الخيار الأول للطلاب الباحثين عن سكن في الفيوم</p>
            </div>
          </Reveal>
          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-sm-6 col-lg-3" key={f.title}>
                <Reveal delay={i * 0.08}>
                  <div className="card border-0 h-100 p-4 text-center" style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s" }}>
                    <div className="mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, borderRadius: "var(--radius-md)", background: `${f.color}12` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: f.color }}>{f.icon}</span>
                    </div>
                    <h3 className="h6 fw-bold mb-2" style={{ color: "var(--on-surface)" }}>{f.title}</h3>
                    <p className="small mb-0" style={{ color: "var(--on-surface-variant)", lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Goals + Image */}
      <section style={{ padding: "5rem 0", background: "var(--surface-container-low)" }}>
        <div className="container px-4 px-lg-5">
          <div className="row align-items-center gy-5">
            <div className="col-lg-6 order-2 order-lg-1">
              <Reveal>
                <div className="card border-0 p-4 p-lg-5" style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", background: "var(--surface-card)" }}>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--primary-container)" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--primary)" }}>flag</span>
                    </div>
                    <h2 className="h5 fw-bold mb-0" style={{ color: "var(--on-surface)" }}>أهداف المنصة</h2>
                  </div>
                  <ul className="list-unstyled mb-0">
                    {goals.map((goal) => (
                      <li key={goal} className="d-flex align-items-start gap-3 mb-3">
                        <span className="material-symbols-outlined mt-1" style={{ fontSize: 20, color: "var(--primary)" }}>check_circle</span>
                        <span style={{ color: "var(--on-surface-variant)", lineHeight: 1.7, fontSize: "0.95rem" }}>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
            <div className="col-lg-6 order-1 order-lg-2">
              <Reveal delay={0.1}>
                <img src={heroImage} alt="شقة سكنية حديثة" className="img-fluid rounded-4 shadow-lg w-100" style={{ height: 380, objectFit: "cover", animation: "heroFadeIn 0.8s ease-out both" }} />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container px-4 px-lg-5">
          <Reveal>
            <div className="rounded-4 p-4 p-lg-5 position-relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)" }}>
              <div className="floating-dot" style={{ width: 80, height: 80, background: "rgba(255,255,255,0.08)", top: "10%", left: "5%", animationDelay: "0s" }} />
              <div className="floating-dot" style={{ width: 50, height: 50, background: "rgba(255,255,255,0.06)", bottom: "15%", right: "10%", animationDelay: "2s" }} />
              <div className="row text-center g-4" style={{ position: "relative", zIndex: 1 }}>
                {stats.map((s, i) => (
                  <div className="col-6 col-md-3" key={s.label}>
                    <Reveal delay={i * 0.1}>
                      <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: 30, color: "rgba(255,255,255,0.7)" }}>{s.icon}</span>
                      <div className="display-5 fw-bold" style={{ color: "white" }}>
                        <AnimatedCounter target={s.value} suffix={s.suffix} />
                      </div>
                      <div className="small mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>{s.label}</div>
                    </Reveal>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

export default About;
