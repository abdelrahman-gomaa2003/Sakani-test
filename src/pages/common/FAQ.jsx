const faqs = [
  {
    question: "كيف أبحث عن سكن مناسب؟",
    answer: "استخدم قسم البحث لتصفية المدينة والحي ونوع السكن بحسب احتياجك."
  },
  {
    question: "هل يمكنني التواصل مباشرة مع المالك؟",
    answer: "نعم، توفر المنصة وسائل التواصل المباشر مع الملاك أو الوسطاء المعتمدين."
  },
  {
    question: "هل توجد وحدات في جميع المدن؟",
    answer: "نعم، تشمل المنصة أحياء ومدن مختلفة داخل محافظة الفيوم ومحيطها."
  }
];

function FAQ() {
  return (
    <div className="container py-5">
      <h1 className="h3 fw-bold text-dark mb-4">الأسئلة الشائعة</h1>
      <div className="d-grid gap-3">
        {faqs.map((item) => (
          <details className="card border-0 shadow-sm p-4" key={item.question}>
            <summary className="fw-semibold text-dark cursor-pointer">{item.question}</summary>
            <p className="text-muted mb-0 mt-3">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export default FAQ;
