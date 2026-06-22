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
  green: { background: "rgba(0,120,50,0.15)", border: "1px solid rgba(0,180,80,0.3)", borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  warning: { background: "rgba(180,50,0,0.15)", border: "1px solid rgba(180,80,0,0.4)", borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  steps: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 },
  step: { display: "flex", gap: 14, alignItems: "flex-start" },
  stepNum: { minWidth: 32, height: 32, background: WINE, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: GOLD, flexShrink: 0, marginTop: 2 },
  stepText: { color: "rgba(241,225,148,0.80)", lineHeight: 1.9, fontSize: 15 },
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

export default function RefundPolicyPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.logo}>حُجّة | Hujjah</div>
        <h1 style={S.title}>سياسة الاسترداد والإلغاء</h1>
        <div style={S.date}>آخر تحديث: يونيو 2025 · تسري على جميع المشتريات الرقمية</div>
      </div>

      <div style={S.wrap}>
        <button style={S.backBtn} onClick={() => navigate(-1)}>
          ← العودة
        </button>

        <div style={S.highlight}>
          <p style={{ ...S.p, marginBottom: 0 }}>
            نحن في <strong>حُجّة</strong> نسعى لتقديم تجربة رقمية ممتازة. نفهم أن مشاكل تقنية قد تحدث، لذلك وضعنا سياسة استرداد واضحة وعادلة تحمي حقوقك كمستخدم.
          </p>
        </div>

        <Section icon="📦" title="١. طبيعة المنتج الرقمي">
          <p style={S.p}>
            حُجّة تُقدِّم <strong>منتجات رقمية فورية الوصول</strong> — أي أن الخدمة تبدأ فور تأكيد الدفع. وفقاً لأنظمة التجارة الإلكترونية السعودية وممارسات الصناعة للمنتجات الرقمية، فإن سياسة الاسترداد الافتراضية محدودة، مع استثناءات موضّحة أدناه.
          </p>
        </Section>

        <Section icon="✅" title="٢. الحالات المؤهَّلة للاسترداد الكامل">
          <div style={S.green}>
            <p style={{ ...S.p, marginBottom: 8, fontWeight: 700 }}>يحق لك استرداد المبلغ كاملاً في الحالات التالية:</p>
            <ul style={{ ...S.ul, marginBottom: 0 }}>
              <li style={S.li}><strong>خطأ تقني في التفعيل:</strong> دُفع المبلغ لكن لم تُفعَّل الباقة خلال 24 ساعة</li>
              <li style={S.li}><strong>دفع مكرَّر:</strong> خُصم المبلغ مرتين لنفس الاشتراك</li>
              <li style={S.li}><strong>خطأ في المبلغ:</strong> خُصم مبلغ مختلف عمّا اخترته</li>
              <li style={S.li}><strong>عطل مستمر:</strong> إذا توقفت المنصة عن العمل لأكثر من 72 ساعة متواصلة خلال فترة اشتراكك الفعّال</li>
            </ul>
          </div>
        </Section>

        <Section icon="⚠️" title="٣. الحالات غير المؤهَّلة للاسترداد">
          <div style={S.warning}>
            <p style={{ ...S.p, marginBottom: 8, fontWeight: 700 }}>لا يُمنح الاسترداد في الحالات التالية:</p>
            <ul style={{ ...S.ul, marginBottom: 0 }}>
              <li style={S.li}>تغيير رأيك بعد الاستخدام الفعلي للاشتراك</li>
              <li style={S.li}>عدم استخدام الاشتراك خلال فترته (لكنك لم تواجه مشكلة تقنية)</li>
              <li style={S.li}>إنهاء حسابك طوعاً بعد بدء الاشتراك</li>
              <li style={S.li}>تعليق الحساب بسبب انتهاك الشروط والأحكام</li>
              <li style={S.li}>المطالبة بالاسترداد بعد انتهاء فترة الاشتراك</li>
              <li style={S.li}>أرصدة الألعاب التي استُهلكت جزئياً أو كلياً</li>
            </ul>
          </div>
        </Section>

        <Section icon="💳" title="٤. الاشتراكات — تفاصيل الاسترداد">
          <p style={S.p}><strong>فترة الاسترداد المقبولة:</strong></p>
          <ul style={S.ul}>
            <li style={S.li}>طلبات الاسترداد مقبولة خلال <strong>48 ساعة</strong> من تفعيل الاشتراك إذا لم تُستخدَم أي ميزة مدفوعة</li>
            <li style={S.li}>بعد 48 ساعة أو بعد استخدام المحتوى المميز: لا يُمنح استرداد إلا للأسباب التقنية الموضّحة في القسم ٢</li>
          </ul>
          <p style={S.p}><strong>الاشتراكات لا تتجدد تلقائياً</strong> — لن تُخصم مبالغ تلقائية بدون موافقتك الصريحة.</p>
        </Section>

        <Section icon="🎮" title="٥. أرصدة الألعاب">
          <ul style={S.ul}>
            <li style={S.li}>أرصدة الألعاب غير قابلة للاسترداد بعد الاستخدام</li>
            <li style={S.li}>في حالة دفع مكرَّر أو خطأ تقني، يُستردّ كامل المبلغ</li>
            <li style={S.li}>الأرصدة غير المستخدمة لا تنتهي صلاحيتها</li>
          </ul>
        </Section>

        <Section icon="🔄" title="٦. خطوات طلب الاسترداد">
          <div style={S.steps}>
            <div style={S.step}>
              <div style={S.stepNum}>١</div>
              <div style={S.stepText}><strong>أرسل طلبك</strong> عبر البريد الإلكتروني: <strong>support@hujjahgames.com</strong> — استخدم نفس البريد المسجَّل في حسابك</div>
            </div>
            <div style={S.step}>
              <div style={S.stepNum}>٢</div>
              <div style={S.stepText}><strong>أدرج في طلبك:</strong> اسم المستخدم، تاريخ الدفع، رقم المعاملة (يجدها في إيميل تأكيد الدفع)، وسبب الطلب</div>
            </div>
            <div style={S.step}>
              <div style={S.stepNum}>٣</div>
              <div style={S.stepText}><strong>مدة المراجعة:</strong> نراجع طلبك خلال <strong>3 أيام عمل</strong> ونُخطرك بالنتيجة عبر البريد الإلكتروني</div>
            </div>
            <div style={S.step}>
              <div style={S.stepNum}>٤</div>
              <div style={S.stepText}><strong>مدة الاسترداد:</strong> في حالة القبول، يُودَع المبلغ في حسابك البنكي خلال <strong>5–14 يوم عمل</strong> حسب البنك</div>
            </div>
          </div>
        </Section>

        <Section icon="💡" title="٧. بدائل الاسترداد">
          <p style={S.p}>
            في بعض الحالات التي لا تستوفي شروط الاسترداد النقدي، نُقدِّم بدائل منها:
          </p>
          <ul style={S.ul}>
            <li style={S.li}><strong>تمديد الاشتراك:</strong> تمديد فترة اشتراكك مقابل المشكلة التقنية التي واجهتها</li>
            <li style={S.li}><strong>رصيد ألعاب:</strong> إضافة رصيد ألعاب مجاني تعويضاً عن تجربة سيئة موثَّقة</li>
          </ul>
        </Section>

        <Section icon="🏦" title="٨. طريقة الاسترداد">
          <ul style={S.ul}>
            <li style={S.li}>يُردّ المبلغ بنفس وسيلة الدفع الأصلية (مدى / فيزا / ماستركارد / STC Pay)</li>
            <li style={S.li}>لا نُقدِّم الاسترداد نقداً أو بتحويل بنكي مختلف عن وسيلة الدفع الأصلية</li>
            <li style={S.li}>رسوم معالجة الدفع (إن وُجدت) قد لا تُسترَدّ حسب سياسة بوابة الدفع</li>
          </ul>
        </Section>

        <Section icon="📬" title="٩. التواصل لطلب الاسترداد">
          <p style={S.p}>
            <strong>البريد الإلكتروني:</strong> support@hujjahgames.com<br />
            <strong>الموضوع المقترح:</strong> "طلب استرداد - [اسم المستخدم] - [رقم المعاملة]"<br />
            <strong>وقت الاستجابة:</strong> خلال 48 ساعة عمل
          </p>
        </Section>
      </div>
    </div>
  );
}
