import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { X } from "lucide-react";

/* ── Art sources (same palette as HomePage) ─────────────────────────── */
const ART = {
  schoolOfAthens:
    "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400",
  marbleStatue:
    "https://images.unsplash.com/photo-1572349387816-f96e105271ee?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=80&w=900",
  classicalScene:
    "https://images.unsplash.com/photo-1762114433053-768fe4217c8b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
  groupDebate:
    "https://images.unsplash.com/photo-1694725411666-eb24f48935fa?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
  rembrandtDark:
    "https://images.unsplash.com/photo-1579168730073-4541e40ca43a?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=80&w=900",
};

/* ── Art Background ─────────────────────────────────────────────────── */
function ArtBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0, background: "#080001" }} aria-hidden="true">
      {/* Main full-screen base: School of Athens */}
      <div className="absolute inset-0">
        <img
          src={ART.schoolOfAthens}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.38) saturate(0.7) blur(4px)", transform: "scale(1.08)" }}
          loading="eager"
          onError={e => { e.target.style.display = "none"; }}
        />
      </div>

      {/* Left accent: Rembrandt dark */}
      <div className="absolute left-0 top-0 h-full hidden md:block" style={{ width: "clamp(140px,22vw,300px)" }}>
        <img
          src={ART.rembrandtDark}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.32) saturate(0.6) blur(2px)" }}
          loading="lazy"
          onError={e => { e.target.style.display = "none"; }}
        />
        <div className="absolute inset-y-0 right-0 w-24" style={{ background: "linear-gradient(to right, transparent, #080001)" }} />
      </div>

      {/* Right accent: Classical scene */}
      <div className="absolute right-0 bottom-0 h-2/3 hidden md:block" style={{ width: "clamp(120px,20vw,280px)" }}>
        <img
          src={ART.classicalScene}
          alt=""
          className="w-full h-full object-cover object-top"
          style={{ filter: "brightness(0.3) saturate(0.6) blur(3px)" }}
          loading="lazy"
          onError={e => { e.target.style.display = "none"; }}
        />
        <div className="absolute inset-y-0 left-0 w-24" style={{ background: "linear-gradient(to left, transparent, #080001)" }} />
      </div>

      {/* Top-right corner: Group debate small accent */}
      <div
        className="absolute rounded-2xl overflow-hidden hidden lg:block"
        style={{
          top: "4%", right: "clamp(120px,21vw,285px)",
          width: "clamp(90px,11vw,160px)", height: "clamp(70px,9vw,130px)",
          filter: "brightness(0.28) saturate(0.6) blur(1px)",
          transform: "rotate(1.2deg)",
          boxShadow: "0 0 0 1px rgba(241,225,148,0.06)",
        }}
      >
        <img src={ART.groupDebate} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { e.target.parentElement.style.display = "none"; }} />
      </div>

      {/* Unified dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 80% at 50% 50%, rgba(8,0,1,0.20) 0%, rgba(8,0,1,0.75) 100%),
            linear-gradient(to bottom, rgba(8,0,1,0.55) 0%, rgba(8,0,1,0.15) 50%, rgba(8,0,1,0.65) 100%)
          `,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(2,0,0,0.6) 75%, rgba(0,0,0,0.9) 100%)" }}
      />

      {/* Warm burgundy tint */}
      <div className="absolute inset-0" style={{ background: "rgba(50,6,12,0.30)", mixBlendMode: "multiply" }} />

      {/* Top gradient for header readability */}
      <div className="absolute top-0 left-0 right-0 h-28" style={{ background: "linear-gradient(to bottom, rgba(6,0,1,0.72), transparent)" }} />
    </div>
  );
}

/* ── Login Gate Modal ────────────────────────────────────────────────── */
function LoginGateModal({ mode, onClose }) {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden text-center animate-fade-in-up"
        style={{
          background: "rgba(15,2,5,0.95)",
          border: "1.5px solid rgba(241,225,148,0.18)",
          boxShadow: "0 0 80px rgba(0,0,0,0.8), 0 0 32px rgba(91,14,20,0.4)",
          backdropFilter: "blur(20px)",
          padding: "clamp(28px,4vw,48px)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full transition-all hover:bg-secondary/10"
          style={{ color: "rgba(241,225,148,0.35)" }}
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="text-5xl mb-4" style={{ filter: "drop-shadow(0 0 20px rgba(241,225,148,0.4))" }}>
          🔒
        </div>

        {/* Title */}
        <h2
          className="font-black text-secondary mb-2"
          style={{ fontSize: "clamp(1.3rem,3vw,1.8rem)", textShadow: "0 0 20px rgba(241,225,148,0.3)" }}
        >
          تحتاج لتسجيل الدخول
        </h2>
        <p className="text-secondary/45 text-sm mb-6 leading-relaxed">
          سجّل دخولك أو أنشئ حساباً مجانياً للبدء في{" "}
          {mode === "standard" ? "اللعبة العادية" : "مود البطولة"}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            data-testid="login-gate-login-btn"
            onClick={() => navigate("/login")}
            className="w-full font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "#F1E194",
              color: "#1a0205",
              padding: "clamp(12px,1.8vw,16px)",
              fontSize: "clamp(0.9rem,1.6vw,1.1rem)",
              boxShadow: "0 0 24px rgba(241,225,148,0.25)",
            }}
          >
            تسجيل الدخول
          </button>
          <button
            data-testid="login-gate-signup-btn"
            onClick={() => navigate("/signup")}
            className="w-full font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "rgba(241,225,148,0.08)",
              border: "1.5px solid rgba(241,225,148,0.25)",
              color: "#F1E194",
              padding: "clamp(12px,1.8vw,16px)",
              fontSize: "clamp(0.9rem,1.6vw,1.1rem)",
            }}
          >
            إنشاء حساب مجاني
          </button>
        </div>

        <div className="mt-4 text-secondary/25 text-xs">
          أو{" "}
          <button
            onClick={() => { navigate("/login"); }}
            className="underline hover:text-secondary/50 transition-colors"
          >
            سجّل الدخول بـ Google
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function GameModeSelectPage() {
  const navigate = useNavigate();
  const { setGameMode, currentUser } = useGame();
  const [loginGateMode, setLoginGateMode] = useState(null); // null | "standard" | "tournament"
  const [loadingMode, setLoadingMode]     = useState(null);

  const handlePlay = (mode) => {
    if (!currentUser) {
      setLoginGateMode(mode);
      return;
    }
    setLoadingMode(mode);
    setTimeout(() => {
      setGameMode(mode);
      navigate(mode === "standard" ? "/setup" : "/tournament");
    }, 280); // brief loading flash
  };

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-x-hidden"
      style={{ minHeight: "100svh", fontFamily: "Cairo, sans-serif" }}
    >
      {/* Background */}
      <ArtBackground />

      {/* Login gate modal */}
      {loginGateMode && (
        <LoginGateModal
          mode={loginGateMode}
          onClose={() => setLoginGateMode(null)}
        />
      )}

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-5 md:px-8 py-4">
        <button
          data-testid="mode-back-btn"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all hover:bg-secondary/8 group"
          style={{ color: "rgba(241,225,148,0.45)", fontWeight: 700, fontSize: "0.9rem" }}
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>رجوع</span>
        </button>

        {/* Brand */}
        <div className="text-secondary/25 text-xs font-black tracking-[0.25em] uppercase">
          HUJJAH &nbsp;·&nbsp; حُجّة
        </div>

        {/* Auth status */}
        {currentUser ? (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(241,225,148,0.06)", border: "1px solid rgba(241,225,148,0.12)" }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: "rgba(241,225,148,0.15)", color: "#F1E194" }}
            >
              {(currentUser.username || "؟")[0].toUpperCase()}
            </div>
            <span className="text-secondary/65 text-sm font-bold">{currentUser.username}</span>
          </div>
        ) : (
          <button
            data-testid="header-login-btn"
            onClick={() => navigate("/login")}
            className="text-secondary/50 text-sm font-black px-4 py-2 rounded-xl transition-all hover:text-secondary/80 hover:bg-secondary/8"
            style={{ border: "1px solid rgba(241,225,148,0.18)" }}
          >
            دخول
          </button>
        )}
      </header>

      {/* ── Hero Title ── */}
      <div className="relative z-10 flex flex-col items-center pt-4 pb-8 md:pt-6 md:pb-10 px-4 text-center">
        <div
          className="font-black text-secondary animate-fade-in-up mb-3"
          style={{
            fontSize: "clamp(2.2rem,6vw,4.5rem)",
            letterSpacing: "-0.02em",
            textShadow: "0 0 60px rgba(241,225,148,0.28), 0 4px 24px rgba(0,0,0,0.7)",
            animationDelay: "0s",
          }}
        >
          اختر نوع اللعبة
        </div>
        <p
          className="text-secondary/40 font-bold animate-fade-in-up"
          style={{ fontSize: "clamp(0.8rem,1.6vw,1.05rem)", animationDelay: "0.06s" }}
        >
          وضعان للعب في كل مناسبة
        </p>

        {/* Not logged in notice */}
        {!currentUser && (
          <div
            className="mt-5 flex items-center gap-2 rounded-full px-5 py-2.5 animate-fade-in-up"
            style={{
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.22)",
              animationDelay: "0.1s",
            }}
          >
            <span className="text-amber-400 text-sm">🔒</span>
            <span className="text-amber-300/70 text-sm font-bold">
              تحتاج لتسجيل الدخول لبدء اللعبة
            </span>
          </div>
        )}
      </div>

      {/* ── Mode Cards ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-5 md:px-8 pb-10">
        <div
          className="w-full grid grid-cols-1 md:grid-cols-2 animate-fade-in-up"
          style={{ maxWidth: "860px", gap: "clamp(14px,2.5vw,28px)", animationDelay: "0.12s" }}
        >

          {/* ── Standard Mode Card ── */}
          <button
            data-testid="mode-standard-btn"
            onClick={() => handlePlay("standard")}
            disabled={loadingMode === "standard"}
            className="group relative rounded-3xl overflow-hidden text-right transition-all duration-300 hover:-translate-y-2 active:scale-[0.97] disabled:opacity-80 disabled:cursor-wait"
            style={{
              background: "rgba(12,2,4,0.70)",
              border: "1.5px solid rgba(241,225,148,0.15)",
              boxShadow: "0 12px 60px rgba(91,14,20,0.45), inset 0 1px 0 rgba(241,225,148,0.08)",
              backdropFilter: "blur(14px)",
              padding: "clamp(28px,4.5vw,52px) clamp(24px,3.5vw,44px)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 20px 80px rgba(91,14,20,0.65), 0 0 40px rgba(241,225,148,0.06), inset 0 1px 0 rgba(241,225,148,0.15)";
              e.currentTarget.style.borderColor = "rgba(241,225,148,0.30)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 12px 60px rgba(91,14,20,0.45), inset 0 1px 0 rgba(241,225,148,0.08)";
              e.currentTarget.style.borderColor = "rgba(241,225,148,0.15)";
            }}
          >
            {/* Inner radial glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(ellipse at 30% 30%, rgba(241,225,148,0.06) 0%, transparent 65%)" }}
            />

            {/* Popular badge */}
            <div className="absolute top-5 left-5">
              <span
                className="px-3 py-1.5 rounded-full font-black text-xs text-white"
                style={{ background: "linear-gradient(135deg,#15803d,#166534)", boxShadow: "0 2px 10px rgba(22,163,74,0.4)" }}
              >
                ⭐ الأكثر شيوعاً
              </span>
            </div>

            {/* Login lock hint (if not logged in) */}
            {!currentUser && (
              <div className="absolute top-5 right-5">
                <span className="text-amber-400/60 text-sm">🔒</span>
              </div>
            )}

            <div className="relative">
              {/* Icon */}
              <div
                className="text-[5.5rem] mb-5 leading-none transition-transform duration-400 group-hover:scale-110 inline-block"
                style={{ filter: "drop-shadow(0 4px 24px rgba(241,225,148,0.3))" }}
              >
                ⚔
              </div>

              {/* Title */}
              <div className="text-secondary font-black mb-2" style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)" }}>
                اللعبة العادية
              </div>

              {/* Subtitle */}
              <div className="text-secondary/55 font-bold mb-3" style={{ fontSize: "clamp(0.85rem,1.5vw,1rem)" }}>
                فريق ضد فريق
              </div>

              {/* Description */}
              <div className="text-secondary/32 text-sm leading-relaxed mb-6" style={{ fontSize: "clamp(0.75rem,1.2vw,0.88rem)" }}>
                لوحة أسئلة كلاسيكية — 6 فئات × 3 مستويات صعوبة
              </div>

              {/* CTA row */}
              {loadingMode === "standard" ? (
                <div className="flex items-center gap-2 text-secondary/50">
                  <span className="animate-spin text-lg">⏳</span>
                  <span className="text-sm font-bold">جارٍ التحميل...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-secondary/50 group-hover:text-secondary/90 transition-colors">
                  <span className="font-black text-sm">
                    {!currentUser ? "سجّل لتبدأ" : "ابدأ اللعبة"}
                  </span>
                  <span className="group-hover:translate-x-[-3px] transition-transform" style={{ transform: "scaleX(-1)", display: "inline-block" }}>←</span>
                </div>
              )}
            </div>
          </button>

          {/* ── Tournament Mode Card ── */}
          <button
            data-testid="mode-tournament-btn"
            onClick={() => handlePlay("tournament")}
            disabled={loadingMode === "tournament"}
            className="group relative rounded-3xl overflow-hidden text-right transition-all duration-300 hover:-translate-y-2 active:scale-[0.97] disabled:opacity-80 disabled:cursor-wait"
            style={{
              background: "rgba(12,4,2,0.70)",
              border: "1.5px solid rgba(241,225,148,0.12)",
              boxShadow: "0 12px 60px rgba(120,53,15,0.35), inset 0 1px 0 rgba(241,225,148,0.06)",
              backdropFilter: "blur(14px)",
              padding: "clamp(28px,4.5vw,52px) clamp(24px,3.5vw,44px)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 20px 80px rgba(180,83,9,0.55), 0 0 40px rgba(241,225,148,0.05), inset 0 1px 0 rgba(241,225,148,0.12)";
              e.currentTarget.style.borderColor = "rgba(251,191,36,0.28)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 12px 60px rgba(120,53,15,0.35), inset 0 1px 0 rgba(241,225,148,0.06)";
              e.currentTarget.style.borderColor = "rgba(241,225,148,0.12)";
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(ellipse at 30% 30%, rgba(251,191,36,0.05) 0%, transparent 65%)" }}
            />

            {!currentUser && (
              <div className="absolute top-5 right-5">
                <span className="text-amber-400/60 text-sm">🔒</span>
              </div>
            )}

            <div className="relative">
              <div
                className="text-[5.5rem] mb-5 leading-none transition-transform duration-400 group-hover:scale-110 inline-block"
                style={{ filter: "drop-shadow(0 4px 24px rgba(251,191,36,0.35))" }}
              >
                🏆
              </div>

              <div className="text-secondary font-black mb-2" style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)" }}>
                مود البطولة
              </div>

              <div className="text-secondary/55 font-bold mb-3" style={{ fontSize: "clamp(0.85rem,1.5vw,1rem)" }}>
                حتى 8 فرق
              </div>

              <div className="text-secondary/32 text-sm leading-relaxed mb-6" style={{ fontSize: "clamp(0.75rem,1.2vw,0.88rem)" }}>
                ربع نهائي ← نصف نهائي ← النهائي — بطل واحد فقط
              </div>

              {loadingMode === "tournament" ? (
                <div className="flex items-center gap-2 text-secondary/50">
                  <span className="animate-spin text-lg">⏳</span>
                  <span className="text-sm font-bold">جارٍ التحميل...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-secondary/50 group-hover:text-secondary/90 transition-colors">
                  <span className="font-black text-sm">
                    {!currentUser ? "سجّل لتبدأ" : "أنشئ البطولة"}
                  </span>
                  <span className="group-hover:translate-x-[-3px] transition-transform" style={{ transform: "scaleX(-1)", display: "inline-block" }}>←</span>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="relative z-10 pb-6 text-center">
        <p className="text-secondary/18 text-xs">
          مناسب للجلسات العائلية · حفلات الأصدقاء · الأمسيات الترفيهية
        </p>
      </div>
    </div>
  );
}
