import { Resend } from "resend";
import { config, supabaseAdmin } from "../config.js";

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

const templates = {
  welcome: (name) => ({
    subject: "مرحباً بك في سكني!",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2D6A4F; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">سكني</h1>
          <p style="margin: 5px 0 0;">منصة الإسكان الطلابي</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>مرحباً ${name}! 👋</h2>
          <p>تم إنشاء حسابك بنجاح في منصة سكني.</p>
          <p>الآن يمكنك البحث عن سكن مناسب بالقرب من جامعتك في الفيوم.</p>
          <a href="${config.frontendUrl}/student-home" style="display: inline-block; background: #2D6A4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">ابدأ البحث</a>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">هذه رسالة تلقائية، لا ترد عليها.</p>
        </div>
      </div>
    `,
  }),

  apartmentApproved: (name, title) => ({
    subject: "تم اعتماد إعلانك! ✅",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2D6A4F; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">سكني</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>تم الاعتماد! ✅</h2>
          <p>مرحباً ${name}،</p>
          <p>تم اعتماد إعلانك "<strong>${title}</strong>" وهو الآن متاح للبحث.</p>
          <a href="${config.frontendUrl}/owner/apartments" style="display: inline-block; background: #2D6A4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">عرض إعلاناتي</a>
        </div>
      </div>
    `,
  }),

  apartmentRejected: (name, title, reason) => ({
    subject: "تم رفض إعلانك ❌",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #DC3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">سكني</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>تم رفض الإعلان ❌</h2>
          <p>مرحباً ${name}،</p>
          <p>للأسف تم رفض إعلانك "<strong>${title}</strong>".</p>
          ${reason ? `<p><strong>السبب:</strong> ${reason}</p>` : ""}
          <p>يمكنك تعديل الإعلان وإعادة إرساله.</p>
          <a href="${config.frontendUrl}/owner/apartments" style="display: inline-block; background: #DC3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">تعديل الإعلان</a>
        </div>
      </div>
    `,
  }),

  paymentSuccess: (name, amount, type) => ({
    subject: "تم الدفع بنجاح! 💳",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2D6A4F; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">سكني</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>تم الدفع بنجاح! 💳</h2>
          <p>مرحباً ${name}،</p>
          <p>تم استلام دفعتك بنجاح.</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>نوع الخدمة:</strong> ${type}</p>
            <p><strong>المبلغ:</strong> ${amount} جنيه</p>
          </div>
        </div>
      </div>
    `,
  }),

  verificationApproved: (name, role) => {
    const dashboardMap = { student: "/student-home", owner: "/owner/dashboard", broker: "/broker/dashboard", admin: "/admin/dashboard" };
    const dashboardUrl = `${config.frontendUrl}${dashboardMap[role] || "/student-home"}`;
    const ctaLabel = role === "student" ? "الذهاب للرئيسية" : "لوحة التحكم";
    return {
      subject: "تم توثيق حسابك بنجاح!",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #2D6A4F; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0;">سكني</h1>
            <p style="margin: 5px 0 0;">توثيق الحساب</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2>تم التوثيق بنجاح! ✅</h2>
            <p>مرحباً ${name}،</p>
            <p>تم اعتماد حسابك بنجاح. يمكنك الآن استخدام جميع خدمات المنصة.</p>
            <a href="${dashboardUrl}" style="display: inline-block; background: #2D6A4F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">${ctaLabel}</a>
          </div>
        </div>
      `,
    };
  },

  verificationRejected: (name, reason) => ({
    subject: "تم رفض توثيق حسابك",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #DC3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">سكني</h1>
          <p style="margin: 5px 0 0;">توثيق الحساب</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>تم رفض التوثيق ❌</h2>
          <p>مرحباً ${name}،</p>
          <p>للأسف تم رفض توثيق حسابك.</p>
          ${reason ? `<div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;"><p style="margin: 0;"><strong>السبب:</strong> ${reason}</p></div>` : ""}
          <p>يمكنك تسجيل الدخول وتحديث بياناتك ورفع مستندات جديدة.</p>
          <a href="${config.frontendUrl}/login" style="display: inline-block; background: #DC3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">تسجيل الدخول</a>
        </div>
      </div>
    `,
  }),

  newMessage: (name, senderName) => ({
    subject: "لديك رسالة جديدة! 💬",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #6B9080; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">سكني</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>رسالة جديدة 💬</h2>
          <p>مرحباً ${name}،</p>
          <p>أرسل لك <strong>${senderName}</strong> رسالة جديدة.</p>
          <a href="${config.frontendUrl}/messages" style="display: inline-block; background: #6B9080; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">عرض الرسالة</a>
        </div>
      </div>
    `,
  }),

  contactMessage: (name, email, messageType, subject, message) => ({
    subject: `رسالة جديدة من صفحة تواصل معنا - ${messageType}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #6B9080; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">سكني</h1>
          <p style="margin: 5px 0 0;">رسالة جديدة من صفحة تواصل معنا</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <p><strong>الاسم:</strong> ${name}</p>
            <p><strong>الإيميل:</strong> ${email}</p>
            <p><strong>نوع الرسالة:</strong> ${messageType}</p>
            <p><strong>العنوان:</strong> ${subject}</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border-right: 3px solid #6B9080;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <a href="${config.frontendUrl}/admin/contact" style="display: inline-block; background: #6B9080; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px;">عرض في لوحة التحكم</a>
        </div>
      </div>
    `,
  }),

  contactConfirmation: (name) => ({
    subject: "تم استلام رسالتك - سكني",
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #6B9080; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0;">سكني</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>تم استلام رسالتك ✅</h2>
          <p>مرحباً ${name}،</p>
          <p>شكراً لتواصلك مع منصة سكني.</p>
          <p>تم استلام رسالتك وسيقوم فريق الدعم بالرد عليك في أقرب وقت ممكن.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">هذه رسالة تلقائية، لا ترد عليها.</p>
        </div>
      </div>
    `,
  }),
};

export async function sendEmail(to, templateName, data = {}) {
  if (!resend) {
    console.warn("Resend not configured, skipping email to:", to);
    return { skipped: true };
  }

  const template = templates[templateName];
  if (!template) {
    console.error("Unknown email template:", templateName);
    return { error: "Unknown template" };
  }

  const { subject, html } = template(data.name || "", data.title || "", data.reason || "", data.amount || "", data.type || "", data.senderName || "");

  try {
    const { data: result, error } = await resend.emails.send({
      from: "Sakani <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Email error:", error);
      return { error: error.message };
    }

    return { success: true, id: result?.id };
  } catch (err) {
    console.error("Email send failed:", err.message);
    return { error: err.message };
  }
}

export async function sendBulkEmails(users, templateName, getData = () => ({})) {
  const results = [];
  for (const user of users) {
    const result = await sendEmail(user.email, templateName, getData(user));
    results.push({ userId: user.id, ...result });
  }
  return results;
}
