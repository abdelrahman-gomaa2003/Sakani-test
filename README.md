<div dir="rtl">

# 🏠 سكني - Sakani
### منصة الإسكان الطلابي في الفيوم

[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-purple)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-bootstrap)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)]()

---

## 📋 نبذة عن المشروع

**سكني** هي منصة إلكترونية متخصصة في الإسكان الطلابي بمدينة الفيوم، مصر. توفر المنصة حلولاً متكاملة تربط بين الطلاب الباحثين عن سكن والملاك والوسطاء العقاريين، مع نظام إدارة شامل للمديرين.

تهدف المنصة إلى تسهيل عملية البحث عن سكن مناسب بالقرب من الجامعات، وتوفر تجربة مستخدم احترافية مع واجهة عربية كاملة (RTL) وتصميم متجاوب يعمل على جميع الأجهزة.

---

## 🎯 أهداف المشروع

- تبسيط عملية البحث عن سكن للطلاب في الفيوم
- توفير منصة آمنة للتواصل بين الطلاب والملاك
- تقديم نظام إدارة شامل للوسيط والمدير
- دعم التفاعل في الوقت الفعلي (Realtime)
- توفير تجربة مستخدم احترافية وعربية بالكامل

---

## ✨ المميزات الرئيسية

### 👨‍🎓 للطلاب
- 🔍 بحث متقدم عن الشقق مع فلاتر (الحي، النوع، نطاق السعر)
- ❤️ نظام المفضلة لحفظ الشقق المفضلة
- 💬 محادثات مباشرة مع الملاك والوسطاء
- ⭐ تقييم وتعليقات على الشقق
- 🔔 إشعارات فورية
- 🗺️ خريطة تفاعلية (Leaflet)
- 🌙 وضع داكن/فاتح

### 🏠 للملاك
- 📊 لوحة تحكم بتحليلات و Charts
- 🏢 إدارة الشقق (إضافة، تعديل، حذف)
- 📸 رفع الصور مع Drag & Drop
- 📈 إحصائيات المشاهدات والتقييمات
- 🔔 إشعارات فورية

### 🤝 للوسطاء
- 📊 لوحة تحكم شاملة
- 🏢 إدارة العقارات المتاحة
- 📋 متابعة طلبات الطلاب

### 👨‍💼 للمدير
- 📊 لوحة تحكم بـ 8 إحصائيات حية
- 📊 توزيع المستخدمين حسب الدور (Chart.js)
- 📊 توزيع حالات الوحدات (Doughnut Chart)
- ✅ اعتماد/رفض/إخفاء العقارات
- 👥 إدارة المستخدمين مع البحث والفلتر
- 🚨 إدارة البلاغات مع حالات متعددة
- 📤 تصدير البيانات إلى CSV

---

## 🛠️ التقنيات المستخدمة

### Frontend
| التقنية | الاستخدام |
|---------|-----------|
| **React 19** | Framework الواجهة الأمامية |
| **Vite 8** | Build Tool |
| **Bootstrap 5** | CSS Framework (RTL) |
| **React Router 7** | التوجيه |
| **Chart.js** | الرسوم البيانية |
| **Leaflet** | الخرائط التفاعلية |
| **react-hot-toast** | الإشعارات |
| **Google Material Symbols** | الأيقونات |
| **IBM Plex Sans Arabic** | الخط العربي |

### Backend
| التقنية | الاستخدام |
|---------|-----------|
| **Supabase** | Backend as a Service |
| **PostgreSQL** | قاعدة البيانات |
| **Supabase Auth** | المصادقة والتفويض |
| **Supabase Storage** | تخزين الصور |
| **Supabase Realtime** | التحديثات الفورية |
| **Row Level Security** | الأمان على مستوى الصفوف |

---

## 🏗️ بنية المشروع

```
src/
├── components/
│   ├── layout/          # Navbar, Sidebar
│   ├── ui/              # Skeleton, EmptyState, ConfirmModal, AnimatedCounter
│   ├── ErrorBoundary.jsx
│   └── ProtectedRoute.jsx
├── context/
│   ├── AuthContext.jsx
│   ├── ThemeContext.jsx
│   └── LanguageContext.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useTheme.js
│   └── useLanguage.js
├── layouts/
│   ├── MainLayout.jsx
│   ├── OwnerLayout.jsx
│   ├── BrokerLayout.jsx
│   └── AdminLayout.jsx
├── pages/
│   ├── common/          # Home, Login, Register, Error Pages
│   ├── student/         # Search, Details, Favorites, Messages
│   ├── owner/           # Dashboard, MyApartments, AddApartment
│   ├── broker/          # Dashboard, MyApartments, StudentRequests
│   └── admin/           # Dashboard, Users, Apartments, Reports
├── routes/
│   └── AppRouter.jsx
├── services/            # Supabase Service Layer
├── styles/              # CSS Variables, Global Styles
├── utils/               # Export Utilities
└── lib/
    └── supabase.js      # Supabase Client
```

---

## 🗄️ قاعدة البيانات

### جداول قاعدة البيانات
| الجدول | الوصف |
|--------|-------|
| `profiles` | بيانات المستخدمين |
| `apartments` | العقارات المُعلنة |
| `favorites` | المفضلة |
| `messages` | الرسائل |
| `notifications` | الإشعارات |
| `reviews` | التقييمات |
| `apartment_reports` | البلاغات |

### الأمان
- **Row Level Security (RLS)** مفعّل على جميع الجداول
- **Policies** مخصصة لكل دور مستخدم
- **Auth Trigger** لإنشاء البروفايل تلقائياً عند التسجيل
- **Auto-update** حقل `updated_at`

---

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- حساب Supabase

### خطوات التثبيت

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-username/sakani.git
cd sakani

# 2. تثبيت التبعيات
npm install

# 3. إعداد المتغيرات البيئية
cp .env.example .env
# عدّل قيم .env بالبيانات الخاصة بك

# 4. تشغيل المشروع
npm run dev
```

### إعداد Supabase

1. أنشئ مشروع جديد على [Supabase](https://supabase.com)
2. شغّل SQL من ملف `supabase-schema.sql`
3. أنشئ Storage Bucket باسم `apartment-images` (Public)
4. (اختياري) شغّل `seed-data.sql` للبيانات التجريبية
5. أضف بيانات Supabase في ملف `.env`

### ملف `.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### بناء للإنتاج

```bash
npm run build
npm run preview  # معاينة البناء
```

---

## 👥 الفريق

| الاسم | الدور |
|-------|-------|
| [اسمك] | مطور Full Stack |

---

## 📊 إحصائيات المشروع

| المقياس | العدد |
|---------|-------|
| عدد الملفات | 90+ ملف |
| عدد الصفحات | 50+ صفحة |
| المراحل المكتملة | 9 مراحل |
| الأخطاء | 0 ESLint Error |
| حجم البناء | ~117 KB Main Bundle |
| Code Splitting | 75+ Chunks |

---

## 📄 التراخيص

هذا المشروع مرخص بموجب [MIT License](LICENSE)

---

## 📞 التواصل

- البريد الإلكتروني: your-email@example.com
- GitHub: [your-username](https://github.com/your-username)

---

<div align="center">

**تم بناء هذا المشروع بحب ❤️ لخدمة طلاب الفيوم**

</div>

</div>
