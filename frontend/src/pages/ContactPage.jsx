import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GOLD   = "#F1E194";
const DARK   = "#09070b";
const WINE   = "#5B0E14";
const MUTED  = "rgba(241,225,148,0.55)";
const BORDER = "rgba(241,225,148,0.12)";

const S = {
  page: { minHeight: "100vh", background: DARK, color: GOLD, fontFamily: "Cairo, sans-serif", direction: "rtl" },
  header: { background: "linear-gradient(180deg, #1a0204 0%, #09070b 100%)", borderBottom: `1px solid ${BORDER}`, padding: "32px 24px 28px", textAlign: "center" },
  logo: { fontSize: 13, color: MUTED, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 900, color: GOLD, marginBottom: 8 },
  sub: { fontSize: 15, color: MUTED },
  wrap: { maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 48 },
  card: { background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 10, transition: "border-color 0.2s" },
  cardIcon: { fontSize: 32, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: 800, color: GOLD },
  cardDesc: { fontSize: 14, color: MUTED, lineHeight: 1.8 },
  cardLink: { fontSize: 14, color: GOLD, fontWeight: 700, textDecoration: "none", background: WINE, padding: "8px 16px", borderRadius: 8, display: "inline-block", marginTop: 4, textAlign: "center" },
  sectionTitle: { fontSize: 20, fontWeight: 900, marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` },
  faqWrap: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 },
  faqItem: { background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" },
  faqQ: { padding: "16px 20px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" },
  faqA: { padding: "0 20px 16px", color: MUTED, fontSize: 14, lineHeight: 1.9 },
  hours: { background: "rgba(91,14,20,0.2)", border: `1px solid ${WINE}`, borderRadius: 12, padding: "20px 24px", marginBottom: 24 },
  hoursTitle: { fontWeight: 800, marginBottom: 12, fontSize: 16 },
  hoursRow: { display: "flex", justifyContent: "space-between", fontSize: 14, color: MUTED, padding: "4px 0", borderBottom: `1px solid ${BORDER}` },
  backBtn: { display: "inline-flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 14, cursor: "pointer", background: "none", border: "none", marginBottom: 32, padding: 0, fontFamily: "Cairo, sans-serif" },
};

const FAQ_ITEMS = [
  {
    q: "كيف أُفعِّل اشتراكي بعد الدفع؟",
    a: "يُفعَّل اشتراكك تلقائياً فور تأكيد الدفع من بوابة Paylink. إذا مرّ أكثر من 10 دقائق دون تفعيل، أرسل لنا رقم المعاملة عبر البريد الإلكتروني وسنتحقق فوراً."
  },
  {
    q: "نسيت كلمة المرور — ماذا أفعل؟",
    a: "انقر على \"نسيت كلمة المرور\" في صفحة تسجيل الدخول وأدخل بريدك الإلكتروني. ستصلك رسالة بها رابط إعادة التعيين خلال دقيقتين (تحقق من مجلد Spam إذا لم تجدها)."
  },
  {
    q: "هل يمكنني استخدام الاشتراك على أجهزة متعددة؟",
    a: "نعم، يمكنك استخدام حسابك على جهازين (2 أجهزة) في وقت واحد. إذا تجاوزت ذلك، ستُطلب منك تسجيل الخروج من جهاز قديم."
  },
  {
    q: "كيف أطلب حذف حسابي وبياناتي؟",
    a: "أرسل طلباً من بريدك المسجَّل إلى support@hujjahgames.com بعنوان \"طلب حذف الحساب\". سنعالج طلبك خلال 30 يوم عمل ونؤكد الحذف."
  },
  {
    q: "الإيميل لا يصلني — ما السبب؟",
    a: "تحقق من مجلد البريد المزعج (Spam/Junk). إذا وجدت رسائلنا هناك، انقر 'ليس بريداً مزعجاً' لضمان وصول الرسائل القادمة. إذا استمرت المشكلة، تواصل معنا."
  },
  {
    q: "كيف أُنشئ فئة أسئلة خاصة بي؟",
    a: "إنشاء الفئات متاح لمشتركي الباقة المميزة (Premium) فقط. بعد الاشتراك، اذهب إلى قسم \"المجتمع\" وانقر \"إنشاء فئة جديدة\"."
  },
  {
    q: "هل يمكن الاسترداد إذا لم يعجبني المحتوى؟",
    a: "نقدِّم نسخة مجانية تتيح لك تجربة المنصة قبل الدفع. بعد الشراء، الاسترداد متاح فقط في حالات موضَّحة في سياسة الاسترداد (أعطال تقنية، دفع مكرَّر، إلخ)."
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={S.faqItem}>
      <div style={S.faqQ} onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <span style={{ fontSize: 20, color: MUTED, transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}>⌄</span>
      </div>
      {open && <div style={S.faqA}>{a}</div>}
    </div>
  );
}

export default function ContactPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.logo}>حُجّة | Hujjah</div>
        <h1 style={S.title}>تواصل معنا</h1>
        <div style={S.sub}>نسعد بمساعدتك — فريق الدعم جاهز للردّ</div>
      </div>

      <div style={S.wrap}>
        <button style={S.backBtn} onClick={() => navigate(-1)}>
          ← العودة
        </button>

        {/* Contact Cards */}
        <div style={S.grid}>
          <div style={S.card}>
            <div style={S.cardIcon}>📧</div>
            <div style={S.cardTitle}>البريد الإلكتروني</div>
            <div style={S.cardDesc}>للدعم الفني، الاستفسارات، طلبات الاسترداد، وأي مشكلة تخصّ حسابك</div>
            <a href="mailto:support@hujjahgames.com" style={S.cardLink}>support@hujjahgames.com</a>
          </div>

          <div style={S.card}>
            <div style={S.cardIcon}>🐦</div>
            <div style={S.cardTitle}>تويتر / X</div>
            <div style={S.cardDesc}>آخر الأخبار، التحديثات، والتواصل المجتمعي مع فريق حُجّة</div>
            <a href="https://twitter.com/hujjahgames" target="_blank" rel="noreferrer" style={S.cardLink}>@hujjahgames</a>
          </div>

          <div style={S.card}>
            <div style={S.cardIcon}>📸</div>
            <div style={S.cardTitle}>إنستغرام</div>
            <div style={S.cardDesc}>محتوى بصري، كواليس التطوير، وأخبار الإصدارات الجديدة</div>
            <a href="https://instagram.com/hujjahgames" target="_blank" rel="noreferrer" style={S.cardLink}>@hujjahgames</a>
          </div>

          <div style={S.card}>
            <div style={S.cardIcon}>💬</div>
            <div style={S.cardTitle}>واتساب / تيليغرام</div>
            <div style={S.cardDesc}>قناة الإشعارات والتحديثات الفورية</div>
            <div style={{ ...S.cardLink, background: "rgba(91,14,20,0.4)", color: MUTED, cursor: "default" }}>
              قريباً
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div style={S.hours}>
          <div style={S.hoursTitle}>⏱️ أوقات الاستجابة المتوقَّعة</div>
          <div style={S.hoursRow}><span>البريد الإلكتروني — استفسارات عامة</span><span>خلال 48 ساعة عمل</span></div>
          <div style={{ ...S.hoursRow, borderBottom: "none" }}><span>المشاكل التقنية وطلبات الاسترداد</span><span>خلال 24 ساعة عمل</span></div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 10 }}>
            * في عطلات نهاية الأسبوع والإجازات الرسمية، قد تتأخر الاستجابة يوماً إضافياً.
          </div>
        </div>

        {/* FAQ */}
        <div style={S.sectionTitle}>الأسئلة الشائعة</div>
        <div style={S.faqWrap}>
          {FAQ_ITEMS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
        </div>

        {/* Legal links */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13 }}>
          <a href="/privacy" style={{ color: MUTED, textDecoration: "none" }}>سياسة الخصوصية</a>
          <span style={{ color: BORDER }}>·</span>
          <a href="/terms" style={{ color: MUTED, textDecoration: "none" }}>الشروط والأحكام</a>
          <span style={{ color: BORDER }}>·</span>
          <a href="/refund" style={{ color: MUTED, textDecoration: "none" }}>سياسة الاسترداد</a>
          <span style={{ color: BORDER }}>·</span>
          <span style={{ color: MUTED }}>hujjahgames.com © 2025</span>
        </div>
      </div>
    </div>
  );
}
