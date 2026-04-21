import React from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";

/* ── Diamond‑pattern overlay – purely decorative ── */
const DIAMOND_PATTERN = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(241,225,148,1) 0, rgba(241,225,148,1) 1px, transparent 0, transparent 50%)",
  backgroundSize: "44px 44px",
};

/* ── Rich layered background ── */
const PAGE_BG = {
  background: `
    radial-gradient(ellipse 90% 55% at 50% -5%,  rgba(140,25,40,0.65), transparent),
    radial-gradient(ellipse 55% 45% at 0%  100%, rgba(90,14,20,0.40),  transparent),
    radial-gradient(ellipse 50% 50% at 100% 0%,  rgba(80,10,18,0.30),  transparent),
    radial-gradient(ellipse at top, #3D0810 0%, #1a0205 45%, #090101 100%)
  `,
  minHeight: "100svh",
};

export default function HomePage() {
  const navigate   = useNavigate();
  const { currentUser, logoutUser } = useGame();
  const isPremium  = currentUser?.subscription_type === "premium";

  return (
    <div className="overflow-hidden" style={PAGE_BG}>

      {/* ── Ambient layers ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {/* Top glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[520px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(241,225,148,0.05) 0%, transparent 70%)" }}
        />
        {/* Bottom-right warmth */}
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(160,40,60,0.10) 0%, transparent 70%)" }}
        />
        {/* Diamond micro-pattern */}
        <div className="absolute inset-0 opacity-[0.022]" style={DIAMOND_PATTERN} />
      </div>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav
        className="relative z-20 flex items-center justify-between px-5 md:px-8 py-3.5"
        style={{ borderBottom: "1px solid rgba(241,225,148,0.08)", backdropFilter: "blur(6px)" }}
      >
        {/* Left: auth state */}
        {currentUser ? (
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary text-xs font-black shrink-0"
              style={{ background: "rgba(241,225,148,0.12)", border: "1.5px solid rgba(241,225,148,0.28)" }}
            >
              {(currentUser.username || "؟")[0].toUpperCase()}
            </div>
            <div className="leading-tight">
              <span className="text-secondary/80 text-sm font-bold block">{currentUser.username}</span>
              {isPremium ? (
                <span className="text-[10px] text-amber-400/70 font-bold">✦ عضو مميز</span>
              ) : (
                <button
                  data-testid="upgrade-btn"
                  onClick={() => navigate("/pricing")}
                  className="text-[10px] text-amber-400 font-black hover:text-amber-300 transition-colors"
                >
                  ترقية للمميز ↗
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              data-testid="login-nav-btn"
              onClick={() => navigate("/login")}
              className="text-secondary/60 text-sm font-black px-4 py-2 rounded-full transition-all hover:text-secondary/90 hover:bg-secondary/8"
              style={{ border: "1.5px solid rgba(241,225,148,0.18)" }}
            >
              دخول
            </button>
            <button
              data-testid="signup-nav-btn"
              onClick={() => navigate("/signup")}
              className="bg-secondary text-primary text-sm font-black px-5 py-2 rounded-full hover:scale-105 transition-all duration-200"
              style={{ boxShadow: "0 0 18px rgba(241,225,148,0.28)" }}
            >
              حساب جديد
            </button>
          </div>
        )}

        {/* Right: nav links */}
        <div className="flex items-center gap-1">
          {!isPremium && (
            <button
              data-testid="pricing-nav-btn"
              onClick={() => navigate("/pricing")}
              className="text-amber-300 text-sm font-black px-4 py-2 rounded-full transition-all hover:bg-amber-500/15"
              style={{ border: "1.5px solid rgba(251,191,36,0.30)", background: "rgba(251,191,36,0.08)" }}
            >
              ✦ الأسعار
            </button>
          )}
          <button
            data-testid="admin-link"
            onClick={() => navigate("/admin")}
            className="text-secondary/40 text-xs font-bold px-3 py-2 rounded-full hover:text-secondary/70 hover:bg-secondary/6 transition-all"
          >
            الإدارة
          </button>
          {currentUser && (
            <button
              data-testid="logout-btn"
              onClick={logoutUser}
              className="text-secondary/30 text-xs font-bold px-3 py-2 rounded-full hover:text-secondary/60 transition-all"
            >
              خروج
            </button>
          )}
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <main className="relative z-10 flex flex-col items-center px-4 pt-10 pb-16 md:pt-14">

        {/* Orb icon */}
        <div
          className="mb-5 animate-fade-in-up"
          style={{
            fontSize:   "clamp(3.5rem, 9vw, 6rem)",
            filter:     "drop-shadow(0 0 32px rgba(241,225,148,0.45)) drop-shadow(0 0 8px rgba(241,225,148,0.2))",
            animationDelay: "0s",
          }}
          aria-hidden="true"
        >
          🔮
        </div>

        {/* Title */}
        <h1
          className="font-black text-secondary text-center leading-none animate-fade-in-up"
          style={{
            fontFamily:  "Cairo, sans-serif",
            fontSize:    "clamp(4.5rem, 13vw, 8.5rem)",
            textShadow:  "0 0 80px rgba(241,225,148,0.38), 0 4px 24px rgba(0,0,0,0.65)",
            letterSpacing: "-0.01em",
            marginBottom: "0.35em",
            animationDelay: "0.06s",
          }}
        >
          حُجّة
        </h1>

        {/* Tagline */}
        <p
          className="text-secondary/45 font-medium uppercase tracking-[0.22em] animate-fade-in-up"
          style={{ fontSize: "clamp(0.65rem, 1.6vw, 0.85rem)", marginBottom: "2rem", animationDelay: "0.12s" }}
        >
          HUJJAH &nbsp;•&nbsp; لعبة الأسئلة
        </p>

        {/* Premium upsell notice */}
        {currentUser && !isPremium && (
          <div
            className="max-w-sm w-full text-center rounded-2xl px-5 py-3 mb-6 animate-fade-in-up"
            style={{
              background:    "rgba(251,191,36,0.07)",
              border:        "1px solid rgba(251,191,36,0.22)",
              animationDelay: "0.12s",
            }}
          >
            <p className="text-amber-300/75 text-sm">
              أسئلتك قد تتكرر —{" "}
              <button
                data-testid="pricing-inline-btn"
                onClick={() => navigate("/pricing")}
                className="text-amber-300 font-black underline underline-offset-2 hover:no-underline"
              >
                اشترك للحصول على تجربة كاملة
              </button>
            </p>
          </div>
        )}

        {/* CTA button */}
        <button
          data-testid="start-game-btn"
          onClick={() => navigate("/mode")}
          className="animate-pulse-glow animate-fade-in-up mb-10 bg-secondary text-primary font-black rounded-full border-2 border-secondary hover:scale-105 active:scale-95 transition-all duration-300 select-none"
          style={{
            animationDelay: "0.18s",
            fontSize:        "clamp(1.15rem, 3vw, 1.55rem)",
            padding:         "clamp(14px,2.8vw,20px) clamp(38px,7vw,70px)",
            boxShadow:       "0 0 60px rgba(241,225,148,0.32), 0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          🎮 العب الحين
        </button>

        {/* How-to steps */}
        <div
          className="grid grid-cols-3 gap-3 max-w-xl w-full mb-8 animate-fade-in-up"
          style={{ animationDelay: "0.22s" }}
        >
          {[
            { n: "1", t: "سمّوا الفرق",    d: "كل فريق يختار اسمه" },
            { n: "2", t: "اختاروا الفئات", d: "3 فئات لكل فريق"    },
            { n: "3", t: "العب وانتصر",    d: "أجب وجمّع النقاط"    },
          ].map(s => (
            <div
              key={s.n}
              className="rounded-2xl p-4 text-center transition-all duration-200 hover:scale-[1.03] cursor-default"
              style={{
                background:    "rgba(91,14,20,0.22)",
                border:        "1px solid rgba(241,225,148,0.11)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                className="text-secondary text-2xl font-black mb-1"
                style={{ textShadow: "0 0 18px rgba(241,225,148,0.45)" }}
              >
                {s.n}
              </div>
              <div className="text-secondary/80 font-bold text-sm leading-tight">{s.t}</div>
              <div className="text-secondary/40 text-xs mt-1">{s.d}</div>
            </div>
          ))}
        </div>

        {/* Feature chips */}
        <div
          className="grid grid-cols-2 gap-2.5 max-w-xs w-full animate-fade-in-up"
          style={{ animationDelay: "0.27s" }}
        >
          {[
            { icon: "🏆", text: "وضع البطولة" },
            { icon: "🎯", text: "أسئلة بالصور" },
            { icon: "⚡", text: "مؤقت للإجابة" },
            { icon: "🔄", text: "أسئلة لا تتكرر" },
          ].map(f => (
            <div
              key={f.text}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
              style={{
                background: "rgba(241,225,148,0.035)",
                border:     "1px solid rgba(241,225,148,0.09)",
              }}
            >
              <span className="text-sm leading-none">{f.icon}</span>
              <span className="text-secondary/55 text-xs font-bold">{f.text}</span>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
