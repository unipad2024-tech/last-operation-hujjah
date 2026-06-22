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
  highlight: { background: "rgba(91,14,20,0.25)", border: `1px solid ${WINE}`, borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  warning: { background: "rgba(180,50,0,0.15)", border: "1px solid rgba(180,80,0,0.4)", borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
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

export default function TermsPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.logo}>حُجّة | Hujjah</div>
        <h1 style={S.title}>الشروط والأحكام</h1>
        <div style={S.date}>آخر تحديث: يونيو 2025 · تُلزم جميع مستخدمي المنصة</div>
      </div>

      <div style={S.wrap}>
        <button style={S.backBtn} onClick={() => navigate(-1)}>
          ← العودة
        </button>

        <div style={S.highlight}>
          <p style={{ ...S.p, marginBottom: 0 }}>
            بتسجيلك في منصة <strong>حُجّة</strong> أو استخدامها، فإنك توافق على هذه الشروط والأحكام بالكامل. إذا كنت لا توافق على أي بند، يُرجى التوقف عن استخدام المنصة.
          </p>
        </div>

        <Section icon="🏢" title="١. التعريف بالأطراف">
          <p style={S.p}>
            <strong>"المنصة"</strong> تعني موقع حُجّة (hujjahgames.com) وجميع خدماتها.<br />
            <strong>"المشغّل"</strong> يعني [اسم الشركة أو الشخص المرخَّص] المسؤول عن تشغيل المنصة.<br />
            <strong>"المستخدم"</strong> يعني أي شخص يزور المنصة أو يُنشئ حساباً أو يستخدم أي من خدماتها.<br />
            <strong>"المحتوى المميز"</strong> يعني الفئات والأسئلة المتاحة حصراً لمشتركي الباقة المدفوعة.
          </p>
        </Section>

        <Section icon="👤" title="٢. أهلية الاستخدام ومسؤوليات المستخدم">
          <p style={S.p}>لاستخدام المنصة يجب أن:</p>
          <ul style={S.ul}>
            <li style={S.li}>يكون عمرك 13 عاماً فأكثر؛ وإذا كنت دون 18 يلزمك الحصول على إذن وليّ الأمر</li>
            <li style={S.li}>تُقدِّم معلومات حقيقية ودقيقة عند التسجيل</li>
            <li style={S.li}>تحافظ على سرية كلمة المرور وتكون مسؤولاً عن جميع الأنشطة من حسابك</li>
            <li style={S.li}>لا تُنشئ أكثر من حساب شخصي واحد (يُسمح بحسابات متعددة للعائلة بأجهزة مختلفة)</li>
          </ul>
          <p style={S.p}><strong>يُحظر صراحةً:</strong></p>
          <ul style={S.ul}>
            <li style={S.li}>مشاركة بيانات تسجيل الدخول مع الآخرين</li>
            <li style={S.li}>استخدام أدوات آلية أو بوتات للتفاعل مع المنصة</li>
            <li style={S.li}>محاولة اختراق أو تعطيل أي جزء من المنصة</li>
            <li style={S.li}>انتحال شخصية مستخدم آخر أو موظف في المنصة</li>
            <li style={S.li}>إساءة استخدام نظام الإبلاغ أو الإعجابات</li>
          </ul>
        </Section>

        <Section icon="✍️" title="٣. المحتوى الذي ينشئه المستخدمون">
          <p style={S.p}>
            يتيح حُجّة للمستخدمين المميزين (Premium) إنشاء فئات أسئلة خاصة ومشاركتها في المجتمع.
          </p>
          <p style={S.p}><strong>بنشر أي محتوى، فإنك:</strong></p>
          <ul style={S.ul}>
            <li style={S.li}>تؤكد أنك المالك الحقيقي للمحتوى أو تمتلك الترخيص اللازم لنشره</li>
            <li style={S.li}>تمنح المنصة ترخيصاً مجانياً غير حصري لعرض المحتوى وتوزيعه</li>
            <li style={S.li}>تتحمل المسؤولية الكاملة عن دقة المعلومات والأسئلة التي تنشرها</li>
          </ul>
          <div style={S.warning}>
            <p style={{ ...S.p, marginBottom: 0 }}>
              <strong>⚠️ محتوى محظور تماماً:</strong> أي محتوى يحتوي على إساءة دينية أو عنصرية أو تحرش أو انتهاك للملكية الفكرية أو مخالف للقوانين السعودية. سيُحذف الحساب المخالف فوراً دون إشعار مسبق.
            </p>
          </div>
          <p style={S.p}>
            تحتفظ المنصة بحق مراجعة وحذف أي محتوى يُخالف هذه الشروط دون الرجوع إلى صاحبه.
          </p>
        </Section>

        <Section icon="💎" title="٤. الاشتراكات والباقات المدفوعة">
          <p style={S.p}>تُقدِّم حُجّة الباقات التالية:</p>
          <ul style={S.ul}>
            <li style={S.li}><strong>الباقة المجانية:</strong> وصول محدود لفئات مختارة</li>
            <li style={S.li}><strong>اشتراك أسبوعان:</strong> وصول كامل لمدة 14 يوماً</li>
            <li style={S.li}><strong>اشتراك شهري:</strong> وصول كامل لمدة 30 يوماً</li>
            <li style={S.li}><strong>أرصدة ألعاب:</strong> رصيد لعبتين يُستهلك عند اللعب</li>
          </ul>
          <p style={S.p}><strong>شروط الاشتراك:</strong></p>
          <ul style={S.ul}>
            <li style={S.li}>الاشتراكات لا تتجدد تلقائياً — يلزمك التجديد اليدوي عند الانتهاء</li>
            <li style={S.li}>تُفعَّل الباقة فور تأكيد الدفع من بوابة الدفع</li>
            <li style={S.li}>عند انتهاء الاشتراك، يتحول حسابك للباقة المجانية تلقائياً دون حذف بياناتك</li>
            <li style={S.li}>الأسعار المعروضة شاملة لضريبة القيمة المضافة (إن وُجدت)</li>
            <li style={S.li}>نحتفظ بحق تعديل الأسعار مع إشعار مسبق بـ 30 يوماً</li>
          </ul>
        </Section>

        <Section icon="💳" title="٥. الدفع والفوترة">
          <ul style={S.ul}>
            <li style={S.li}>تُعالَج المدفوعات عبر بوابة <strong>Paylink</strong> المرخَّصة في المملكة العربية السعودية</li>
            <li style={S.li}>نقبل: مدى، فيزا، ماستركارد، STC Pay</li>
            <li style={S.li}>العملة الافتراضية: الريال السعودي (SAR)</li>
            <li style={S.li}>يُعدّ الدفع مكتملاً فقط بعد تأكيد بوابة الدفع — لا تُفعَّل الباقة بمجرد الخصم</li>
            <li style={S.li}>في حالة فشل الدفع، لن يُشحن حسابك ولن تُفعَّل أي باقة</li>
          </ul>
        </Section>

        <Section icon="🔐" title="٦. الملكية الفكرية">
          <p style={S.p}>
            جميع المحتويات الأصلية في المنصة (الاسم، الشعار، التصميم، الكود البرمجي، قاعدة الأسئلة الرسمية) هي ملكية حصرية لمشغّل المنصة، محمية بموجب قوانين الملكية الفكرية السعودية والدولية.
          </p>
          <ul style={S.ul}>
            <li style={S.li}>يُحظر نسخ أو تعديل أو إعادة توزيع أي جزء من المنصة بدون إذن كتابي مسبق</li>
            <li style={S.li}>يُحظر استخراج قاعدة الأسئلة أو بيانات المستخدمين بأي وسيلة</li>
            <li style={S.li}>يُحظر إنشاء خدمات منافسة تعتمد على محتوى مستخرج من المنصة</li>
          </ul>
        </Section>

        <Section icon="🚫" title="٧. تعليق الحساب وإنهاء الخدمة">
          <p style={S.p}>نحتفظ بحق تعليق أو إنهاء أي حساب فوراً في الحالات التالية:</p>
          <ul style={S.ul}>
            <li style={S.li}>انتهاك أي من هذه الشروط</li>
            <li style={S.li}>إساءة استخدام نظام الدفع أو محاولة الاحتيال</li>
            <li style={S.li}>نشر محتوى مسيء أو غير قانوني</li>
            <li style={S.li}>استخدام أدوات آلية أو هجمات على البنية التحتية</li>
            <li style={S.li}>التحايل على منظومة الاشتراكات أو مشاركة الوصول</li>
          </ul>
          <div style={S.warning}>
            <p style={{ ...S.p, marginBottom: 0 }}>
              <strong>في حالة الإنهاء بسبب انتهاك الشروط:</strong> لا يحق لك استرداد أي مبالغ مدفوعة عن الفترة المتبقية من الاشتراك.
            </p>
          </div>
        </Section>

        <Section icon="⚖️" title="٨. تحديد المسؤولية">
          <p style={S.p}>
            تُقدَّم المنصة "كما هي" (As-Is). نبذل جهوداً معقولة لضمان استمراريتها وجودتها، لكننا لا نضمن:
          </p>
          <ul style={S.ul}>
            <li style={S.li}>توافر الخدمة على مدار الساعة بدون انقطاع</li>
            <li style={S.li}>دقة 100% لجميع الأسئلة في المحتوى المُنشأ من المجتمع</li>
            <li style={S.li}>توافق المنصة مع جميع الأجهزة والمتصفحات القديمة</li>
          </ul>
          <p style={S.p}>
            <strong>الحد الأقصى لمسؤوليتنا</strong> لا يتجاوز المبلغ الذي دفعته خلال آخر 3 أشهر من استخدام الخدمة.
          </p>
        </Section>

        <Section icon="🇸🇦" title="٩. القانون المطبَّق وحلّ النزاعات">
          <p style={S.p}>
            تخضع هذه الشروط لقوانين المملكة العربية السعودية. في حالة أي نزاع، يُشجَّع على الحلّ الودي أولاً عبر التواصل المباشر. إذا تعذَّر الحلّ الودي خلال 30 يوماً، تختص المحاكم السعودية المختصة بالنظر في النزاع.
          </p>
        </Section>

        <Section icon="🔄" title="١٠. تعديل الشروط">
          <p style={S.p}>
            نحتفظ بحق تعديل هذه الشروط في أي وقت. للتعديلات الجوهرية، نُرسل إشعاراً بالبريد الإلكتروني المسجَّل قبل 14 يوماً من نفاذها. استمرارك في الاستخدام يُعدُّ قبولاً للشروط المعدَّلة.
          </p>
        </Section>

        <Section icon="📬" title="١١. التواصل معنا">
          <p style={S.p}>
            لأي استفسار حول هذه الشروط:<br />
            <strong>البريد الإلكتروني:</strong> support@hujjahgames.com<br />
            <strong>صفحة التواصل:</strong> hujjahgames.com/contact
          </p>
        </Section>
      </div>
    </div>
  );
}
