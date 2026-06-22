import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GOLD   = "#F1E194";
const DARK   = "#09070b";
const WINE   = "#5B0E14";
const MUTED  = "rgba(241,225,148,0.55)";
const BORDER = "rgba(241,225,148,0.12)";

const S = {
  page: { minHeight: "100vh", background: DARK, color: GOLD, fontFamily: "Cairo, sans-serif", direction: "rtl", padding: "0 0 80px" },
  header: { background: "linear-gradient(180deg, #1a0204 0%, #09070b 100%)", borderBottom: `1px solid ${BORDER}`, padding: "32px 24px 24px", textAlign: "center" },
  logo: { fontSize: 13, color: MUTED, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 900, color: GOLD, marginBottom: 8 },
  date: { fontSize: 13, color: MUTED },
  wrap: { maxWidth: 820, margin: "0 auto", padding: "40px 24px" },
  section: { marginBottom: 40 },
  h2: { fontSize: 18, fontWeight: 800, color: GOLD, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10 },
  p: { color: "rgba(241,225,148,0.80)", lineHeight: 2, fontSize: 15, marginBottom: 12 },
  ul: { color: "rgba(241,225,148,0.80)", lineHeight: 2, fontSize: 15, paddingRight: 20, marginBottom: 12 },
  li: { marginBottom: 6 },
  badge: { background: WINE, color: GOLD, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, letterSpacing: 1 },
  highlight: { background: "rgba(91,14,20,0.25)", border: `1px solid ${WINE}`, borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 14, cursor: "pointer", background: "none", border: "none", marginBottom: 32, padding: 0, fontFamily: "Cairo, sans-serif" },
};

function Section({ icon, title, children }) {
  return (
    <div style={S.section}>
      <h2 style={S.h2}><span>{icon}</span>{title}</h2>
      {children}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.logo}>حُجّة | Hujjah</div>
        <h1 style={S.title}>سياسة الخصوصية</h1>
        <div style={S.date}>آخر تحديث: يونيو 2025 · تسري على جميع مستخدمي المنصة</div>
      </div>

      <div style={S.wrap}>
        <button style={S.backBtn} onClick={() => navigate(-1)}>
          ← العودة
        </button>

        <div style={S.highlight}>
          <p style={{ ...S.p, marginBottom: 0 }}>
            نحن في <strong>حُجّة</strong> نلتزم بحماية بياناتك الشخصية وخصوصيتك. تصف هذه السياسة كيفية جمعنا للبيانات واستخدامها وحمايتها وفقاً لنظام حماية البيانات الشخصية السعودي (PDPL) ومتطلبات اللائحة الأوروبية العامة لحماية البيانات (GDPR).
          </p>
        </div>

        <Section icon="🏢" title="١. التعريف بالمنصة">
          <p style={S.p}>
            <strong>حُجّة</strong> هي منصة ألعاب تريفيا رقمية تعمل على الويب، تُقدِّم ألعاب أسئلة تنافسية، فئات يصنعها المستخدمون، اشتراكات مدفوعة، وأرصدة ألعاب.
          </p>
          <p style={S.p}>
            <strong>المشغّل:</strong> [اسم الشركة أو الشخص المرخَّص] — <span style={{ color: MUTED }}>[يُستكمل بيانات السجل التجاري]</span><br />
            <strong>البريد الإلكتروني:</strong> <span style={{ color: MUTED }}>support@hujjahgames.com</span><br />
            <strong>الموقع الإلكتروني:</strong> hujjahgames.com
          </p>
        </Section>

        <Section icon="📋" title="٢. البيانات التي نجمعها">
          <p style={S.p}><strong>أ. بيانات الحساب (مقدَّمة منك):</strong></p>
          <ul style={S.ul}>
            <li style={S.li}>الاسم واسم المستخدم</li>
            <li style={S.li}>عنوان البريد الإلكتروني</li>
            <li style={S.li}>كلمة المرور (مشفَّرة بـ bcrypt — لا نطّلع عليها)</li>
            <li style={S.li}>الصورة الرمزية والبيو الشخصي (اختياري)</li>
          </ul>
          <p style={S.p}><strong>ب. بيانات الاستخدام (تلقائية):</strong></p>
          <ul style={S.ul}>
            <li style={S.li}>الصفحات التي تزورها وأوقات الزيارة</li>
            <li style={S.li}>الفئات التي تلعبها والأسئلة التي تجيب عليها</li>
            <li style={S.li}>نتائج الجلسات وعدد النقاط</li>
            <li style={S.li}>عنوان IP ومعلومات الجهاز (للأمان ومنع الإساءة)</li>
          </ul>
          <p style={S.p}><strong>ج. بيانات الدفع:</strong></p>
          <ul style={S.ul}>
            <li style={S.li}>نوع الاشتراك المختار والمبلغ المدفوع</li>
            <li style={S.li}>رقم المعاملة من بوابة الدفع</li>
            <li style={S.li}><strong>لا نخزّن أرقام البطاقات أو بيانات الدفع الكاملة</strong> — تُعالَج بالكامل عبر بوابات دفع معتمدة (Paylink)</li>
          </ul>
        </Section>

        <Section icon="🎯" title="٣. أغراض استخدام البيانات">
          <ul style={S.ul}>
            <li style={S.li}><strong>تقديم الخدمة:</strong> إنشاء حسابك، حفظ تقدمك، تفعيل اشتراكك</li>
            <li style={S.li}><strong>التواصل:</strong> إرسال إيميلات الترحيب، إعادة تعيين كلمة المرور، تأكيد الاشتراك، تذكيرات الانتهاء</li>
            <li style={S.li}><strong>الأمان:</strong> الكشف عن الأنشطة المشبوهة وحماية حسابك</li>
            <li style={S.li}><strong>التحسين:</strong> تحليل استخدام المنصة لتحسين تجربة المستخدم</li>
            <li style={S.li}><strong>الامتثال القانوني:</strong> الوفاء بالمتطلبات النظامية في المملكة العربية السعودية</li>
          </ul>
        </Section>

        <Section icon="📊" title="٤. أدوات التحليل والتتبع (PostHog)">
          <div style={S.highlight}>
            <p style={{ ...S.p, marginBottom: 0 }}>
              نستخدم منصة <strong>PostHog</strong> لتحليل سلوك المستخدمين بهدف تحسين المنصة. تجمع PostHog بيانات مجهولة الهوية مثل الصفحات المُزارة ومسارات التنقل وأحداث التفاعل.
            </p>
          </div>
          <ul style={S.ul}>
            <li style={S.li}>البيانات تُرسَل لخوادم PostHog (us.i.posthog.com)</li>
            <li style={S.li}>لا نشارك هذه البيانات مع أطراف ثالثة للإعلان</li>
            <li style={S.li}>يمكنك رفض التتبع التحليلي من خلال إعدادات المتصفح أو إضافات الحجب</li>
            <li style={S.li}>بعد تسجيل الدخول، تُربَط الأحداث بمعرّف مستخدم مجهول الهوية (UUID) لا باسمك أو بريدك</li>
          </ul>
        </Section>

        <Section icon="🍪" title="٥. ملفات تعريف الارتباط (Cookies)">
          <p style={S.p}>نستخدم التخزين المحلي (localStorage) وملفات الارتباط للأغراض التالية:</p>
          <ul style={S.ul}>
            <li style={S.li}><strong>الجلسة والمصادقة:</strong> حفظ رمز الدخول (JWT) لتجنب تكرار تسجيل الدخول</li>
            <li style={S.li}><strong>إعدادات المستخدم:</strong> الوضع الداكن، تفضيلات اللعبة</li>
            <li style={S.li}><strong>التحليلات:</strong> معرّف جلسة PostHog المجهول</li>
            <li style={S.li}><strong>حالة اللعبة:</strong> حفظ تقدم الجلسة الحالية محلياً على جهازك</li>
          </ul>
          <p style={S.p}>يمكنك مسح هذه البيانات في أي وقت عبر إعدادات المتصفح. مسح بيانات الموقع سيُسجِّل خروجك من الحساب.</p>
        </Section>

        <Section icon="💳" title="٦. الدفع والمعاملات المالية">
          <ul style={S.ul}>
            <li style={S.li}>تُعالَج جميع المدفوعات عبر <strong>Paylink</strong> — بوابة دفع مرخَّصة في المملكة العربية السعودية</li>
            <li style={S.li}>نحن لا نخزّن أرقام البطاقات البنكية أو بيانات الحساب المصرفي على خوادمنا</li>
            <li style={S.li}>نحتفظ بسجل المعاملات (المبلغ، التاريخ، نوع الاشتراك) لأغراض محاسبية وإثبات الاشتراك</li>
            <li style={S.li}>بيانات الدفع محمية وفق معايير PCI-DSS من قِبل مزود بوابة الدفع</li>
          </ul>
        </Section>

        <Section icon="🔒" title="٧. أمان البيانات">
          <ul style={S.ul}>
            <li style={S.li}>تشفير كلمات المرور باستخدام خوارزمية bcrypt</li>
            <li style={S.li}>جميع الاتصالات مشفَّرة عبر HTTPS/TLS</li>
            <li style={S.li}>نظام تحديد جلسات (max 2 جهاز، 2 جلسة نشطة)</li>
            <li style={S.li}>تحديد معدل الطلبات (Rate Limiting) لمنع هجمات التخمين</li>
            <li style={S.li}>مراقبة تلقائية لعناوين IP المشبوهة وقفل الحسابات المخترقة</li>
            <li style={S.li}>رؤوس HTTP الأمنية (X-Frame-Options, HSTS, CSP)</li>
          </ul>
        </Section>

        <Section icon="🌍" title="٨. مشاركة البيانات مع أطراف ثالثة">
          <p style={S.p}>لا نبيع بياناتك ولا نتاجر بها. نشارك البيانات فقط مع الأطراف التالية وللأغراض المحددة:</p>
          <ul style={S.ul}>
            <li style={S.li}><strong>Paylink:</strong> معالجة الدفعات — البيانات الضرورية للمعاملة فقط</li>
            <li style={S.li}><strong>Resend:</strong> إرسال البريد الإلكتروني — عنوان بريدك واسمك فقط</li>
            <li style={S.li}><strong>PostHog:</strong> تحليلات الاستخدام — بيانات مجهولة الهوية</li>
            <li style={S.li}><strong>MongoDB Atlas:</strong> تخزين البيانات — مزود السحابة المعتمد</li>
            <li style={S.li}><strong>الجهات الحكومية:</strong> عند الطلب القانوني الرسمي فقط</li>
          </ul>
        </Section>

        <Section icon="⚖️" title="٩. حقوق المستخدم (PDPL & GDPR)">
          <p style={S.p}>وفقاً لنظام حماية البيانات الشخصية السعودي واللائحة الأوروبية GDPR، لك الحق في:</p>
          <ul style={S.ul}>
            <li style={S.li}><strong>الاطلاع:</strong> طلب نسخة من بياناتك الشخصية التي نحتفظ بها</li>
            <li style={S.li}><strong>التصحيح:</strong> تعديل بياناتك غير الدقيقة (يمكنك ذلك من إعدادات الحساب)</li>
            <li style={S.li}><strong>الحذف:</strong> طلب حذف حسابك وبياناتك نهائياً</li>
            <li style={S.li}><strong>التقييد:</strong> طلب تقييد معالجة بياناتك في حالات معينة</li>
            <li style={S.li}><strong>الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض التسويق</li>
            <li style={S.li}><strong>النقل:</strong> الحصول على بياناتك بتنسيق قابل للقراءة الآلية</li>
          </ul>
          <p style={S.p}>لممارسة أي من هذه الحقوق، تواصل معنا على: <strong>support@hujjahgames.com</strong> — نستجيب خلال 30 يوم عمل.</p>
        </Section>

        <Section icon="🗓️" title="١٠. مدة الاحتفاظ بالبيانات">
          <ul style={S.ul}>
            <li style={S.li}><strong>بيانات الحساب النشط:</strong> طوال مدة نشاط الحساب</li>
            <li style={S.li}><strong>سجلات الجلسات:</strong> 90 يوماً من تاريخ الإنشاء</li>
            <li style={S.li}><strong>سجلات المدفوعات:</strong> 7 سنوات (متطلب محاسبي نظامي)</li>
            <li style={S.li}><strong>سجلات البريد الإلكتروني:</strong> 2 سنة</li>
            <li style={S.li}><strong>سجلات الأمان (IP/الأجهزة):</strong> 30 يوماً</li>
            <li style={S.li}><strong>بعد حذف الحساب:</strong> حذف كامل خلال 30 يوم، باستثناء ما يلزم قانونياً</li>
          </ul>
        </Section>

        <Section icon="👶" title="١١. الفئة العمرية">
          <div style={S.highlight}>
            <p style={{ ...S.p, marginBottom: 0 }}>
              خدماتنا موجَّهة للأشخاص الذين تجاوزوا <strong>13 عاماً</strong>. إذا كنت دون هذا السن، يُرجى الحصول على موافقة وليّ الأمر قبل إنشاء حساب. لا نجمع بياناتٍ مِن دون الـ 13 عن قصد.
            </p>
          </div>
        </Section>

        <Section icon="🔄" title="١٢. تحديثات سياسة الخصوصية">
          <p style={S.p}>
            نحتفظ بحق تعديل هذه السياسة في أي وقت. عند إجراء تعديلات جوهرية، نُعلمك عبر البريد الإلكتروني المسجَّل أو إشعار داخل المنصة قبل نفاذ التعديلات بـ 14 يوماً. استمرارك في استخدام المنصة بعد التعديل يُعدُّ قبولاً للسياسة الجديدة.
          </p>
        </Section>

        <Section icon="📬" title="١٣. التواصل معنا">
          <p style={S.p}>
            لأي استفسار أو طلب يتعلق بسياسة الخصوصية أو بياناتك الشخصية:<br />
            <strong>البريد الإلكتروني:</strong> support@hujjahgames.com<br />
            <strong>الموقع:</strong> hujjahgames.com/contact
          </p>
        </Section>
      </div>
    </div>
  );
}
