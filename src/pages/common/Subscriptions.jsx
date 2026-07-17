import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { serverAPI } from "../../services/serverAPI";
import { subscriptionService } from "../../services/subscriptionService";
import toast from "react-hot-toast";

const ownerPlans = [
  {
    id: "free",
    name: "الباقة المجانية",
    desc: "للبدء والتجربة",
    icon: "package_2",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "حتى 3 شقق",
      "حتى 5 صور لكل شقة",
      "ظهور عادي في نتائج البحث",
      "استقبال الرسائل من الطلاب",
    ],
    highlight: false,
    badgeType: null,
    badgeText: null,
  },
  {
    id: "premium",
    name: "الباقة المميزة",
    desc: "للنمو والظهور الأفضل",
    icon: "star",
    monthlyPrice: 50,
    yearlyPrice: 480,
    features: [
      "حتى 10 شقق",
      "حتى 15 صورة لكل شقة",
      "ظهور أفضل في نتائج البحث",
      'شارة "مالك موثق"',
      "إحصائيات المشاهدات",
      "دعم أسرع",
    ],
    badgeType: "popular",
    badgeText: "الأكثر طلبًا",
    highlight: true,
  },
  {
    id: "professional",
    name: "باقة المحترفين",
    desc: "لأصحاب العقارات المتعددة",
    icon: "workspace_premium",
    monthlyPrice: 100,
    yearlyPrice: 960,
    features: [
      "شقق غير محدودة",
      "صور غير محدودة",
      "أولوية أكبر في نتائج البحث",
      'شارة "مالك مميز"',
      "إحصائيات كاملة",
      "دعم فني مميز",
      "تجديد تلقائي للإعلانات",
    ],
    badgeType: "recommended",
    badgeText: "موصى بها",
    highlight: false,
  },
];

const brokerPlans = [
  {
    id: "free",
    name: "الباقة المجانية",
    desc: "للبدء والتجربة",
    icon: "package_2",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "حتى 6 عقارات",
      "حتى 10 صور لكل عقار",
      "ظهور عادي في نتائج البحث",
      "استقبال الرسائل والاستفسارات",
    ],
    highlight: false,
    badgeType: null,
    badgeText: null,
  },
  {
    id: "premium",
    name: "الباقة المميزة",
    desc: "للوكلاء المحترفين",
    icon: "star",
    monthlyPrice: 100,
    yearlyPrice: 960,
    features: [
      "حتى 20 عقار",
      "حتى 20 صورة لكل عقار",
      "ظهور أفضل في نتائج البحث",
      'شارة "وسيط موثق"',
      "إحصائيات المشاهدات",
      "دعم فني أسرع",
    ],
    badgeType: "popular",
    badgeText: "الأكثر طلبًا",
    highlight: true,
  },
  {
    id: "professional",
    name: "الباقة الاحترافية",
    desc: "للوكلااء ذوي العقارات المتعددة",
    icon: "workspace_premium",
    monthlyPrice: 200,
    yearlyPrice: 1920,
    features: [
      "عقارات غير محدودة",
      "صور غير محدودة",
      "أولوية قصوى في نتائج البحث",
      'شارة "وسيط مميز"',
      "إحصائيات كاملة",
      "دعم فني مميز",
      "إمكانية تفعيل التجديد التلقائي",
    ],
    badgeType: "value",
    badgeText: "أفضل قيمة",
    highlight: false,
  },
];

function getComparisonRows(isBroker) {
  return [
    { label: "عدد العقارات", values: isBroker ? ["6", "20", "غير محدود"] : ["3", "10", "غير محدود"] },
    { label: "صور لكل عقار", values: isBroker ? ["10", "20", "غير محدود"] : ["5", "15", "غير محدود"] },
    { label: "الظهور في نتائج البحث", values: ["عادي", "أفضل", "أولوية قصوى"] },
    { label: "شارة الحساب", values: [false, isBroker ? "وسيط موثق" : "مالك موثق", isBroker ? "وسيط مميز" : "مالك مميز"] },
    { label: "استقبال الرسائل", values: [true, true, true] },
    { label: "إحصائيات المشاهدات", values: [false, true, true] },
    { label: "دعم فني", values: ["أساسي", "أسرع", "مميز"] },
    { label: "تجديد تلقائي", values: [false, false, true] },
  ];
}

const ownerFaqs = [
  {
    question: "كيف يتم الدفع عبر Paymob؟",
    answer: "نوفر لك تجربة دفع آمنة وسهلة من خلال بوابة Paymob. يمكنك استخدام بطاقات الخصم المباشر، الائتمان، أو حتى المحافظ الإلكترونية (فودافون كاش، اتصالات كاش، إلخ) لإتمام اشتراكك في ثوانٍ.",
  },
  {
    question: "هل يمكنني ترقية باقتي في منتصف الشهر؟",
    answer: "نعم بالتأكيد! يمكنك الترقية لأي باقة أعلى في أي وقت. سيتم حساب الفرق فقط للفترة المتبقية من الشهر وإضافته لتكلفتك الحالية.",
  },
  {
    question: "ماذا يحدث عند انتهاء الاشتراك؟",
    answer: "عند انتهاء الاشتراك، تعود حسابك تلقائياً إلى الباقة المجانية. لن يتم حذف أي إعلانات موجودة، لكن لن تتمكن من إضافة عقارات جديدة حتى تجدد اشتراكك.",
  },
  {
    question: "هل يمكنني تجديد الباقة تلقائياً؟",
    answer: "نعم! الباقة الاحترافية تتميز بالتجديد التلقائي للإعلانات. بالنسبة للباقات الأخرى، يمكنك التجديد يدوياً من لوحة التحكم.",
  },
];

function Subscriptions() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [apartmentCount, setApartmentCount] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingSub, setLoadingSub] = useState(true);

  const isBroker = profile?.role === "broker";
  const plans = isBroker ? brokerPlans : ownerPlans;
  const comparisonRows = getComparisonRows(isBroker);
  const faqs = ownerFaqs;

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) {
        setLoadingSub(false);
        return;
      }
      try {
        const [subResult, countResult, historyResult] = await Promise.allSettled([
          subscriptionService.getCurrent(profile.id),
          subscriptionService.countApartments(profile.id),
          serverAPI.getPaymentHistory(),
        ]);

        if (subResult.status === "fulfilled" && subResult.value.data) {
          setSubscription(subResult.value.data);
        }
        if (countResult.status === "fulfilled") {
          setApartmentCount(countResult.value.count);
        }
        if (historyResult.status === "fulfilled") {
          setPaymentHistory(historyResult.value?.payments || []);
        }
      } catch {
        // silent
      }
      setLoadingSub(false);
    };
    fetchData();
  }, [profile]);

  const handleSubscribe = async (plan) => {
    if (plan.id === "free") return;
    if (!profile) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }

    setLoading(plan.id);
    try {
      const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
      const billingCycle = isYearly ? "yearly" : "monthly";
      const result = await serverAPI.createSubscriptionCheckout({
        planId: plan.id,
        amount,
        billingCycle,
      });
      if (result?.checkoutUrl) {
        window.location.replace(result.checkoutUrl);
      } else {
        toast.error("حدث خطأ في إنشاء رابط الدفع");
      }
    } catch {
      toast.error("حدث خطأ. حاول مرة أخرى.");
    } finally {
      setLoading(null);
    }
  };

  const isExpired = subscription ? subscriptionService.isExpired(subscription) : false;
  const planInfo = subscriptionService.getPlanInfo(subscription, profile?.role);
  const effectivePlan = (subscription && !isExpired && subscription.status === "active")
    ? subscription.plan
    : "free";
  const expiresAt = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : null;
  const maxAllowed = planInfo.maxApartments === Infinity ? "∞" : planInfo.maxApartments;

  const isUnverifiedOwner = profile && (profile.role === "owner" || profile.role === "broker") && profile.verification_status !== "approved";

  if (isUnverifiedOwner) {
    const statusLabel = profile.verification_status === "pending" ? "قيد المراجعة" : "مرفوض";
    const statusColor = profile.verification_status === "pending" ? "#f59e0b" : "#dc3545";
    const statusIcon = profile.verification_status === "pending" ? "hourglass_top" : "cancel";
    const targetPage = profile.verification_status === "pending" ? "/pending-approval" : "/rejected-approval";

    return (
      <div className="container py-5" style={{ minHeight: "60vh" }}>
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm text-center p-4 p-lg-5" style={{ borderRadius: "var(--radius-lg, 18px)" }}>
              <div className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle" style={{ width: 80, height: 80, background: `${statusColor}15`, border: `3px solid ${statusColor}` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: statusColor }}>{statusIcon}</span>
              </div>
              <h3 className="fw-bold mb-3" style={{ fontSize: "1.35rem", color: "var(--on-surface, #1a1d23)" }}>الاشتراك غير متاح حالياً</h3>
              <p className="mb-3" style={{ color: "var(--on-surface-variant, #5a6370)", fontSize: "1rem", lineHeight: 1.7 }}>
                يجب اعتماد حسابك أولاً قبل الاشتراك في أي باقة.
              </p>
              <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: statusColor }}>info</span>
                <span style={{ fontSize: "0.9rem", color: statusColor, fontWeight: 600 }}>حالة الحساب: {statusLabel}</span>
              </div>
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                <button className="btn py-2 px-4 fw-bold" style={{ background: "var(--primary, #6B9080)", color: "white", borderRadius: "var(--radius-md, 12px)" }} onClick={() => navigate(targetPage)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginLeft: 6 }}>visibility</span>
                  صفحة حالة الطلب
                </button>
                <button className="btn py-2 px-4 fw-bold" style={{ border: "2px solid var(--primary, #6B9080)", color: "var(--primary, #6B9080)", borderRadius: "var(--radius-md, 12px)", background: "transparent" }} onClick={() => navigate("/")}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginLeft: 6 }}>home</span>
                  الرئيسية
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: 1200 }}>
      {/* Current Subscription Banner */}
      {profile && !loadingSub && (
        <div
          className="card border-0 mb-5 overflow-hidden"
          style={{
            borderRadius: "var(--radius-lg, 18px)",
            boxShadow: "0 4px 20px rgba(107,144,128,0.08)",
            background: effectivePlan !== "free"
              ? "linear-gradient(135deg, var(--primary) 0%, #2D6A4F 100%)"
              : "var(--surface-container-low)",
          }}
        >
          <div className={`card-body p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 ${effectivePlan !== "free" ? "text-white" : ""}`}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 56, height: 56, background: effectivePlan !== "free" ? "rgba(255,255,255,0.15)" : "rgba(107,144,128,0.1)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: effectivePlan !== "free" ? "white" : "var(--primary)" }}>card_membership</span>
              </div>
              <div>
                <h5 className="fw-bold mb-1">
                  باقتك الحالية: {planInfo.label || "مجانية"}
                </h5>
                <p className="mb-0" style={{ fontSize: "0.9rem", opacity: 0.85 }}>
                  {isExpired && subscription
                    ? "انتهت صلاحية اشتراكك — أنت حالياً على الباقة المجانية"
                    : expiresAt
                      ? `صالحة حتى ${expiresAt} — ${apartmentCount} / ${maxAllowed} عقار`
                      : `${apartmentCount} / ${maxAllowed} عقار`}
                </p>
              </div>
            </div>
            {effectivePlan !== "free" && !isExpired && (
              <span
                className="px-3 py-1 rounded-pill fw-bold"
                style={{ background: "rgba(255,255,255,0.2)", fontSize: "0.85rem" }}
              >
                {subscription?.billing_cycle === "yearly" ? "اشتراك سنوي" : "اشتراك شهري"}
              </span>
            )}
            {(effectivePlan === "free" || isExpired) && (
              <button
                className="btn px-4 py-2 fw-bold sub-btn"
                style={{ background: "var(--primary)", color: "white", borderRadius: "var(--radius-md, 12px)" }}
                onClick={() => document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                ترقية الباقة
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="h2 fw-bold mb-3" style={{ color: "var(--on-surface)" }}>
          {isBroker ? "باقات الوسيط العقاري" : "باقات الاشتراك"}
        </h1>
        <p className="mx-auto" style={{ color: "var(--on-surface-variant)", maxWidth: 600, fontSize: "1.05rem", lineHeight: 1.7 }}>
          {isBroker
            ? "اختر الباقة المناسبة لاحتياجاتك كوكيل عقاري وابدأ في نشر عقاراتك لآلاف الطلاب والباحثين عن سكن."
            : "اختر الباقة المناسبة لاحتياجاتك العقارية وابدأ في عرض وحداتك السكنية لآلاف الطلاب والباحثين عن سكن."
          }
        </p>
      </div>

      {/* Billing Toggle */}
      <div id="plans-section" className="d-flex justify-content-center align-items-center gap-3 mb-5">
        <span className="fw-semibold" style={{ color: isYearly ? "var(--on-surface-variant)" : "var(--primary)", fontSize: "0.9rem" }}>شهري</span>
        <button
          className="position-relative border-0 p-0"
          style={{ width: 52, height: 28, borderRadius: 14, background: isYearly ? "var(--primary)" : "var(--border)", cursor: "pointer", transition: "background 0.3s" }}
          onClick={() => setIsYearly(!isYearly)}
        >
          <span
            className="position-absolute top-50 translate-middle-y rounded-circle bg-white shadow-sm"
            style={{ width: 22, height: 22, right: isYearly ? 3 : 25, transition: "right 0.3s", top: 3 }}
          />
        </button>
        <span className="fw-semibold" style={{ color: isYearly ? "var(--primary)" : "var(--on-surface-variant)", fontSize: "0.9rem" }}>سنوي</span>
        {isYearly && (
          <span className="badge rounded-pill" style={{ background: "var(--primary-container)", color: "var(--primary)", fontSize: "0.75rem" }}>
            خصم 20%
          </span>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="row g-4 mb-5">
        {plans.map((plan) => {
          const isCurrentPlan = effectivePlan === plan.id;
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const isUpgrade = !isCurrentPlan && effectivePlan === "free";

          return (
            <div key={plan.id} className="col-12 col-md-6 col-lg-4">
              <div
                className={`card h-100 border-0 position-relative overflow-hidden sub-plan-card ${plan.highlight ? "sub-highlight" : ""} ${isCurrentPlan ? "sub-current" : ""}`}
                style={{
                  borderRadius: "var(--radius-lg, 18px)",
                  boxShadow: plan.highlight ? "0 8px 30px rgba(45,106,79,0.12)" : "0 2px 12px rgba(0,0,0,0.04)",
                  border: isCurrentPlan ? "2px solid var(--success, #10b981)" : plan.highlight ? "2px solid var(--primary)" : "2px solid transparent",
                }}
              >
                {plan.badgeText && (
                  <div
                    className={`position-absolute top-0 start-50 translate-middle-x text-white fw-bold sub-badge-${plan.badgeType}`}
                    style={{ padding: "4px 20px", borderRadius: "0 0 12px 12px", fontSize: "0.8rem" }}
                  >
                    {plan.badgeText}
                  </div>
                )}
                <div className={`card-body p-4 d-flex flex-column ${plan.badgeText ? "pt-5" : ""}`}>
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 56, height: 56, background: plan.highlight ? "var(--primary-container)" : "var(--surface-container-low)" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--primary)" }}>{plan.icon}</span>
                  </div>

                  <h5 className="fw-bold mb-1" style={{ color: "var(--on-surface)" }}>{plan.name}</h5>
                  <p className="mb-3" style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>{plan.desc}</p>

                  <div className="mb-3">
                    <span className="fw-bold" style={{ fontSize: "2.2rem", color: "var(--primary)" }}>
                      {price === 0 ? "مجانًا" : price}
                    </span>
                    {price > 0 && (
                      <span className="ms-1" style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>
                        جنية / {isYearly ? "سنة" : "شهر"}
                      </span>
                    )}
                  </div>

                  <ul className="list-unstyled mb-4 flex-grow-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="d-flex align-items-start gap-2 mb-2">
                        <span className="material-symbols-outlined mt-1" style={{ fontSize: 18, color: "var(--primary)" }}>check_circle</span>
                        <span style={{ color: "var(--on-surface)", fontSize: "0.9rem" }}>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className="btn w-100 py-2 fw-bold sub-btn"
                    style={{
                      borderRadius: "var(--radius-md, 12px)",
                      background: isCurrentPlan ? "var(--success, #10b981)" : plan.highlight ? "var(--primary)" : "transparent",
                      color: isCurrentPlan || plan.highlight ? "white" : "var(--primary)",
                      border: isCurrentPlan ? "none" : plan.highlight ? "none" : "2px solid var(--primary)",
                    }}
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading === plan.id || isCurrentPlan}
                  >
                    {loading === plan.id ? (
                      <>
                        <span className="spinner-border spinner-border-sm ms-2" role="status" />
                        جاري المعالجة...
                      </>
                    ) : isCurrentPlan ? (
                      <span className="d-flex align-items-center justify-content-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                        باقتك الحالية
                      </span>
                    ) : plan.id === "free" ? (
                      "ابدأ مجانًا"
                    ) : isUpgrade ? (
                      <span className="d-flex align-items-center justify-content-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upgrade</span>
                        ترقية الباقة
                      </span>
                    ) : (
                      "اشترك الآن"
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-5">
        <h4 className="fw-bold mb-4 text-center" style={{ color: "var(--on-surface)" }}>مقارنة الباقات</h4>
        <div className="table-responsive">
          <table className="table align-middle" style={{ borderRadius: "var(--radius-lg, 18px)", overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "var(--surface-container-low)" }}>
                <th className="fw-bold py-3 px-4" style={{ color: "var(--on-surface)", fontSize: "0.9rem" }}>الميزة</th>
                {plans.map((p) => (
                  <th key={p.id} className="fw-bold py-3 px-4 text-center" style={{ color: "var(--primary)", fontSize: "0.9rem" }}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i}>
                  <td className="py-3 px-4 fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface)" }}>{row.label}</td>
                  {row.values.map((val, j) => (
                    <td key={j} className="text-center py-3 px-4">
                      {typeof val === "boolean" ? (
                        val ? (
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--success, #10b981)" }}>check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--outline, #aaa)" }}>cancel</span>
                        )
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--on-surface)", fontWeight: 600 }}>{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ + Payment History */}
      <div className="row g-4 mt-3">
        <div className="col-lg-8">
          <h4 className="fw-bold mb-4" style={{ color: "var(--on-surface)" }}>الأسئلة الشائعة</h4>
          <div className="d-flex flex-column gap-3">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="card border-0"
                style={{ borderRadius: "var(--radius-lg, 18px)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
              >
                <summary
                  className="d-flex justify-content-between align-items-center p-4 fw-semibold"
                  style={{ color: "var(--on-surface)", cursor: "pointer", listStyle: "none" }}
                >
                  {item.question}
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--on-surface-variant)" }}>expand_more</span>
                </summary>
                <div className="px-4 pb-4" style={{ color: "var(--on-surface-variant)", fontSize: "0.95rem", lineHeight: 1.7 }}>
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="col-lg-4">
          <div
            className="card border-0 text-white h-100 d-flex flex-column justify-content-between"
            style={{ borderRadius: "var(--radius-lg, 18px)", background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #1B4332) 100%)" }}
          >
            <div className="card-body p-4">
              <span className="material-symbols-outlined mb-3" style={{ fontSize: 40, color: "var(--primary-container)" }}>account_balance_wallet</span>
              <h5 className="fw-bold mb-2">سجل المدفوعات</h5>
              <p style={{ fontSize: "0.9rem", opacity: 0.85, lineHeight: 1.7 }}>
                مراجعة فواتيرك السابقة وتفصيل عمليات الدفع.
              </p>
            </div>
            <div className="px-4 pb-4">
              <button
                className="btn w-100 d-flex align-items-center justify-content-between p-3 fw-bold"
                style={{ background: "white", color: "var(--primary)", borderRadius: "var(--radius-md, 12px)" }}
                onClick={() => setShowHistory(!showHistory)}
              >
                <span>{showHistory ? "إخفاء السجل" : "عرض التاريخ المالي"}</span>
                <span className="material-symbols-outlined">{showHistory ? "expand_less" : "arrow_back"}</span>
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="card border-0 mt-3" style={{ borderRadius: "var(--radius-lg, 18px)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3" style={{ color: "var(--on-surface)" }}>عمليات الدفع</h6>
                {paymentHistory.length === 0 ? (
                  <p className="text-center py-3" style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>
                    لا توجد عمليات دفع بعد
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {paymentHistory.map((p) => (
                      <div
                        key={p.id}
                        className="d-flex justify-content-between align-items-center p-2"
                        style={{ borderRadius: 8, background: "var(--surface-container-low)" }}
                      >
                        <div>
                          <p className="mb-0 fw-semibold" style={{ fontSize: "0.85rem", color: "var(--on-surface)" }}>{p.type}</p>
                          <small style={{ color: "var(--on-surface-variant)" }}>{new Date(p.created_at).toLocaleDateString("ar-EG")}</small>
                        </div>
                        <div className="text-end">
                          <p className="mb-0 fw-bold" style={{ fontSize: "0.85rem", color: "var(--primary)" }}>{p.amount} ج.م</p>
                          <small style={{ color: p.status === "paid" ? "var(--success)" : "var(--danger)" }}>
                            {p.status === "paid" ? "مدفوع" : "قيد الانتظار"}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Subscriptions;
