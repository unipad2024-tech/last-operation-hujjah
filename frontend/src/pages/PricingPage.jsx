import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const BG_IMAGE = "https://i.pinimg.com/1200x/29/05/43/290543ec25d14cebeab11f46e0ccaffb.jpg";

const PLANS = [
  {
    id: "biweekly",
    name: "أسبوعان",
    price: "16.99",
    period: "/ 14 يوم",
    features: [
      "وصول كامل لجميع الفئات",
      "أسئلة لا تتكرر أبداً",
      "تتبع تقدمك",
      "مزايا المشتركين",
    ],
  },
  {
    id: "monthly",
    name: "شهري",
    price: "29.99",
    period: "/ 30 يوم",
    badge: "الأكثر شيوعاً",
    popular: true,
    features: [
      "وصول كامل لجميع الفئات",
      "أسئلة لا تتكرر أبداً",
      "تتبع تقدمك عبر الجلسات",
      "إحصاءات مباراتك",
      "مزايا المشتركين الحصرية",
    ],
  },
  {
    id: "two_games",
    name: "لعبتان",
    price: "5.99",
    period: "",
    credits: true,
    features: [
      "رصيد لعبتين كاملتين",
      "وصول كامل لجميع الفئات",
      "جميع الأسئلة والتحديات",
      "بعد استهلاك الرصيد يعود المجاني",
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { currentUser, userToken } = useGame();
  const [loading, setLoading]           = useState(null);
  const [showForm, setShowForm]         = useState(null);
  const [clientName, setClientName]     = useState("");
  const [clientMobile, setClientMobile] = useState("");

  const openForm = (planId) => {
    if (!currentUser) { toast.info("سجّل دخولك أولاً للاشتراك"); navigate("/login"); return; }
    if (currentUser.subscription_type === "premium") { toast.info("أنت مشترك مميز بالفعل!"); return; }
    setShowForm(planId);
  };

  const handleUpgrade = async () => {
    if (!clientName.trim()) { toast.error("يرجى إدخال الاسم"); return; }
    if (!clientMobile.trim()) { toast.error("يرجى إدخال رقم الجوال"); return; }
    if (!/^(05|5|966\d|00966\d)\d{7,8}$/.test(clientMobile.replace(/\s/g, ""))) {
      toast.error("رقم الجوال غير صحيح — مثال: 0512345678");
      return;
    }
    setLoading(showForm);
    try {
      const { data } = await axios.post(
        `${API}/paylink/initiate`,
        {
          plan_id:       showForm,
          client_name:   clientName.trim(),
          client_mobile: clientMobile.replace(/\s/g, ""),
          origin_url:    window.location.origin,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      localStorage.setItem("paylink_txn", data.transaction_no);
      toast.success("جاري التحويل لصفحة الدفع...");
      window.location.href = data.payment_url;
    } catch (err) {
      const msg = err?.response?.data?.detail || "خطأ في بدء عملية الدفع";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const isPremium    = currentUser?.subscription_type === "premium";
  const gameCredits  = currentUser?.game_credits || 0;
  const selectedPlan = PLANS.find(p => p.id === showForm);

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,1,3,0.82) 0%, rgba(26,2,5,0.88) 50%, rgba(10,1,3,0.95) 100%)" }} />

      <div className="relative z-10 min-h-screen px-4 py-10">
        <div className="max-w-4xl mx-auto">

          {/* Back */}
          <button
            onClick={() => navigate("/")}
            className="text-secondary/50 hover:text-secondary mb-8 flex items-center gap-2 transition-colors text-sm font-bold"
          >
            ← رجوع
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block bg-secondary/10 border border-secondary/20 text-secondary text-xs font-black px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
              Premium
            </div>
            <h1
              className="font-black text-secondary text-4xl md:text-5xl mb-4"
              style={{ fontFamily: "Cairo, sans-serif", textShadow: "0 0 40px rgba(241,225,148,0.3)" }}
            >
              اختر خطتك المميزة
            </h1>
            <p className="text-secondary/50 text-base max-w-md mx-auto leading-relaxed">
              استمتع بكامل تجربة حُجّة — أسئلة لا تتكرر، جميع الفئات، وتتبع كامل للتقدم
            </p>
          </div>

          {/* Premium already */}
          {isPremium ? (
            <div className="text-center bg-white/5 border border-secondary/30 rounded-3xl p-10 backdrop-blur-sm">
              <div className="text-5xl mb-4">✓</div>
              <h2 className="text-secondary font-black text-2xl mb-2">أنت مشترك مميز!</h2>
              <p className="text-secondary/50 text-sm mb-6">
                ينتهي اشتراكك: {currentUser?.subscription_expires_at
                  ? new Date(currentUser.subscription_expires_at).toLocaleDateString("ar-SA")
                  : "—"}
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-secondary text-primary font-black px-10 py-3 rounded-full hover:scale-105 transition-all"
              >
                العب الحين ←
              </button>
            </div>
          ) : gameCredits > 0 ? (
            <div className="text-center bg-white/5 border border-secondary/20 rounded-3xl p-10 backdrop-blur-sm mb-8">
              <div className="text-5xl mb-4">🎮</div>
              <h2 className="text-secondary font-black text-2xl mb-2">لديك {gameCredits} {gameCredits === 1 ? "رصيد لعبة" : "رصيدَي لعبة"}</h2>
              <p className="text-white/40 text-sm mb-6">يمكنك شراء اشتراك أو رصيد إضافي في أي وقت</p>
              <button
                onClick={() => navigate("/")}
                className="bg-secondary text-primary font-black px-10 py-3 rounded-full hover:scale-105 transition-all"
              >
                العب الحين ←
              </button>
            </div>
          ) : (
            <>
              {/* Pricing cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-3xl p-6 border transition-all duration-300 group
                      ${plan.popular
                        ? "border-secondary/70 bg-secondary/8 scale-[1.03] shadow-2xl"
                        : "border-white/10 bg-white/5 hover:border-secondary/30 hover:bg-white/8"
                      }`}
                    style={{
                      backdropFilter: "blur(16px)",
                      boxShadow: plan.popular
                        ? "0 0 50px rgba(241,225,148,0.15), 0 20px 60px rgba(0,0,0,0.5)"
                        : "0 8px 32px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Popular badge */}
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-secondary text-primary text-xs font-black px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                          ⭐ {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Plan name */}
                    <div className="mb-5">
                      <h3 className={`font-black text-xl mb-1 ${plan.popular ? "text-secondary" : "text-white/90"}`}>
                        {plan.name}
                      </h3>
                      {plan.period && (
                        <p className="text-white/40 text-xs">{plan.period}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black ${plan.popular ? "text-secondary" : "text-white"}`}>
                          {plan.price}
                        </span>
                        <span className={`text-base font-bold ${plan.popular ? "text-secondary/70" : "text-white/50"}`}>
                          ر.س
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <span className={`mt-0.5 text-xs ${plan.popular ? "text-secondary" : "text-secondary/50"}`}>✓</span>
                          <span className="text-white/70 leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Two games note */}
                    {plan.credits && (
                      <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/55 text-xs leading-relaxed">
                          يشمل رصيد لعبتين كاملتين مع وصول كامل لجميع الأسئلة والفئات. يُستهلك رصيد واحد عند بدء كل مباراة. بعد استهلاك الرصيدين يعود الحساب للنسخة المجانية.
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      data-testid={`upgrade-${plan.id}-btn`}
                      onClick={() => openForm(plan.id)}
                      className={`w-full font-black py-3.5 rounded-2xl transition-all duration-200
                        ${plan.popular
                          ? "bg-secondary text-primary hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(241,225,148,0.4)]"
                          : "bg-white/10 text-white hover:bg-white/15 hover:scale-[1.02]"
                        }`}
                    >
                      {plan.credits ? "اشتري الرصيد" : "اشترك الحين"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Trust badge */}
              <p className="text-center text-white/25 text-xs flex items-center justify-center gap-2">
                <span>🔒</span>
                الدفع آمن ومشفّر عبر Paylink السعودية
              </p>
            </>
          )}

          {/* Payment form modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div
                className="border border-secondary/20 rounded-3xl p-7 max-w-sm w-full"
                style={{ background: "rgba(15,1,2,0.97)", boxShadow: "0 0 60px rgba(0,0,0,0.8)" }}
              >
                <div className="mb-5">
                  <h3 className="text-secondary font-black text-xl mb-0.5">{selectedPlan?.name}</h3>
                  <p className="text-white/40 text-sm">
                    {selectedPlan?.price} ر.س {selectedPlan?.period}
                  </p>
                </div>
                <p className="text-white/50 text-sm mb-5">أدخل بياناتك للمتابعة للدفع</p>
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-white/60 text-xs font-bold block mb-1.5">الاسم الكامل</label>
                    <input
                      data-testid="paylink-name-input"
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="محمد العمري"
                      className="w-full bg-white/5 border border-white/15 focus:border-secondary/50 rounded-xl px-4 py-3 text-white font-bold outline-none transition-colors"
                      style={{ fontFamily: "Cairo, sans-serif" }}
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs font-bold block mb-1.5">رقم الجوال</label>
                    <input
                      data-testid="paylink-mobile-input"
                      type="tel"
                      value={clientMobile}
                      onChange={e => setClientMobile(e.target.value)}
                      placeholder="0512345678"
                      className="w-full bg-white/5 border border-white/15 focus:border-secondary/50 rounded-xl px-4 py-3 text-white font-bold outline-none transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowForm(null)}
                    className="flex-1 border border-white/15 text-white/50 py-3 rounded-xl font-bold hover:border-white/30 hover:text-white/70 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    data-testid="paylink-pay-btn"
                    onClick={handleUpgrade}
                    disabled={loading === showForm}
                    className="flex-1 bg-secondary text-primary font-black py-3 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {loading === showForm ? "⏳ جاري..." : "الدفع عبر Paylink"}
                  </button>
                </div>
                <p className="text-white/20 text-xs text-center mt-4">
                  سيتم تحويلك لصفحة دفع Paylink الآمنة
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
