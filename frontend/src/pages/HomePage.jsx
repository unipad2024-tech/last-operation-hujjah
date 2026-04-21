import React from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";

/* ── Art background sources ───────────────────────────────────────────────── */
const ART = {
  schoolOfAthens:
    "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400",
  schoolCloseup:
    "https://images.pexels.com/photos/27063871/pexels-photo-27063871.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400",
  rembrandtDark:
    "https://images.unsplash.com/photo-1579168730073-4541e40ca43a?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=80&w=900",
  baroque:
    "https://images.unsplash.com/photo-1745239188955-67aec6a48459?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=80&w=900",
  marbleStatue:
    "https://images.unsplash.com/photo-1572349387816-f96e105271ee?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=80&w=900",
  baroqueCeiling:
    "https://images.unsplash.com/photo-1755194359207-8e2b1861389e?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=80&w=900",
};

/* ── ArtCollageBackground ─────────────────────────────────────────────────── */
function ArtCollageBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 0, background: "#0a0101" }}
      aria-hidden="true"
    >
      {/* ── BASE: Full-width School of Athens ── */}
      <div className="absolute inset-0">
        <img
          src={ART.schoolOfAthens}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.42) saturate(0.75)", transform: "scale(1.05)" }}
          loading="eager"
          onError={e => { e.target.style.display = "none"; }}
        />
      </div>

      {/* ── LEFT PANEL: Rembrandt dark scholar ── */}
      <div
        className="absolute left-0 top-0 h-full"
        style={{ width: "clamp(180px, 28vw, 380px)" }}
      >
        <img
          src={ART.rembrandtDark}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.38) saturate(0.7)", borderRight: "1px solid rgba(241,225,148,0.06)" }}
          loading="lazy"
          onError={e => { e.target.style.display = "none"; }}
        />
        {/* feather right edge of left panel */}
        <div
          className="absolute inset-y-0 right-0 w-32"
          style={{ background: "linear-gradient(to right, transparent, #0a0101)" }}
        />
      </div>

      {/* ── RIGHT PANEL: Marble statue ── */}
      <div
        className="absolute right-0 top-0 h-full"
        style={{ width: "clamp(160px, 25vw, 360px)" }}
      >
        <img
          src={ART.marbleStatue}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.35) saturate(0.55)", borderLeft: "1px solid rgba(241,225,148,0.05)" }}
          loading="lazy"
          onError={e => { e.target.style.display = "none"; }}
        />
        {/* feather left edge of right panel */}
        <div
          className="absolute inset-y-0 left-0 w-32"
          style={{ background: "linear-gradient(to left, transparent, #0a0101)" }}
        />
      </div>

      {/* ── TOP-RIGHT ACCENT: Baroque fresco ── */}
      <div
        className="absolute rounded-2xl overflow-hidden hidden md:block"
        style={{
          top: "3%", right: "clamp(160px,26vw,365px)",
          width: "clamp(100px,14vw,200px)", height: "clamp(80px,12vw,160px)",
          filter: "brightness(0.35) saturate(0.65)",
          boxShadow: "0 0 0 1px rgba(241,225,148,0.07)",
          transform: "rotate(1.5deg)",
        }}
      >
        <img src={ART.baroqueCeiling} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { e.target.parentElement.style.display = "none"; }} />
      </div>

      {/* ── BOTTOM-LEFT ACCENT: School closeup ── */}
      <div
        className="absolute rounded-2xl overflow-hidden hidden md:block"
        style={{
          bottom: "5%", left: "clamp(160px,28vw,385px)",
          width: "clamp(100px,13vw,190px)", height: "clamp(70px,9vw,130px)",
          filter: "brightness(0.38) saturate(0.7)",
          boxShadow: "0 0 0 1px rgba(241,225,148,0.07)",
          transform: "rotate(-1.2deg)",
        }}
      >
        <img src={ART.schoolCloseup} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => { e.target.parentElement.style.display = "none"; }} />
      </div>

      {/* ── UNIFIED DARK OVERLAY ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 75% 80% at 50% 45%, rgba(10,1,1,0.25) 0%, rgba(10,1,1,0.72) 100%),
            linear-gradient(to bottom, rgba(10,1,1,0.50) 0%, rgba(10,1,1,0.20) 40%, rgba(10,1,1,0.65) 100%)
          `,
        }}
      />

      {/* ── VIGNETTE EDGES ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 100% at 50% 50%,
              transparent 35%,
              rgba(5,0,0,0.55) 70%,
              rgba(2,0,0,0.88) 100%
            )
          `,
        }}
      />

      {/* ── WARM BURGUNDY TINT ── */}
      <div className="absolute inset-0" style={{ background: "rgba(61,8,16,0.28)", mixBlendMode: "multiply" }} />

      {/* ── TOP FADE (navbar readability) ── */}
      <div
        className="absolute top-0 left-0 right-0 h-32"
        style={{ background: "linear-gradient(to bottom, rgba(8,0,2,0.75), transparent)" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate  = useNavigate();
  const { currentUser, logoutUser } = useGame();
  const isPremium = currentUser?.subscription_type === "premium";

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ minHeight: "100svh" }}>

      {/* Background */}
      <ArtCollageBackground />

      {/* ═══ NAVBAR ═══ */}
      <nav
        className="relative flex items-center justify-between px-5 md:px-8 py-4"
        style={{ zIndex: 20 }}
      >
        {/* LEFT: auth */}
        {currentUser ? (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-secondary text-sm font-black shrink-0"
              style={{ background: "rgba(241,225,148,0.13)", border: "1.5px solid rgba(241,225,148,0.32)" }}
            >
              {(currentUser.username || "؟")[0].toUpperCase()}
            </div>
            <div className="leading-tight">
              <span className="text-secondary/85 text-sm font-bold block">{currentUser.username}</span>
              {isPremium
                ? <span className="text-[10px] text-amber-400/70 font-bold">✦ عضو مميز</span>
                : <button data-testid="upgrade-banner-btn" onClick={() => navigate("/pricing")} className="text-[10px] text-amber-400 font-black hover:text-amber-300 transition-colors">ترقية ↗</button>
              }
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              data-testid="login-nav-btn"
              onClick={() => navigate("/login")}
              className="text-secondary/70 text-sm font-black px-4 py-2 rounded-full transition-all hover:text-secondary hover:bg-secondary/10"
              style={{ border: "1.5px solid rgba(241,225,148,0.22)" }}
            >
              دخول
            </button>
            <button
              data-testid="signup-nav-btn"
              onClick={() => navigate("/signup")}
              className="bg-secondary text-primary text-sm font-black px-5 py-2 rounded-full hover:scale-105 active:scale-95 transition-all"
              style={{ boxShadow: "0 0 20px rgba(241,225,148,0.3)" }}
            >
              حساب جديد
            </button>
          </div>
        )}

        {/* RIGHT: nav actions */}
        <div className="flex items-center gap-2">
          {!isPremium && (
            <button
              data-testid="pricing-nav-btn"
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-1.5 font-black text-sm px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, rgba(180,120,10,0.25), rgba(251,191,36,0.15))",
                border: "1.5px solid rgba(251,191,36,0.5)",
                color: "#FCD34D",
                boxShadow: "0 0 16px rgba(251,191,36,0.15), inset 0 1px 0 rgba(251,191,36,0.12)",
                textShadow: "0 0 12px rgba(251,191,36,0.5)",
              }}
            >
              <span>✦</span>
              <span>الأسعار</span>
            </button>
          )}
          <button
            data-testid="admin-link"
            onClick={() => navigate("/admin")}
            className="text-secondary/55 text-sm font-bold px-4 py-2 rounded-full transition-all hover:text-secondary/90 hover:bg-secondary/8"
            style={{ border: "1px solid rgba(241,225,148,0.18)" }}
          >
            الإدارة
          </button>
          {currentUser && (
            <button
              data-testid="logout-btn"
              onClick={logoutUser}
              className="text-secondary/35 text-xs font-bold px-3 py-2 rounded-full hover:text-secondary/65 transition-all"
            >
              خروج
            </button>
          )}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <main
        className="relative flex flex-col items-center text-center"
        style={{ zIndex: 10, paddingTop: "clamp(2rem,6vh,5rem)", paddingBottom: "4rem", paddingLeft: "1rem", paddingRight: "1rem" }}
      >
        {/* Orb */}
        <div
          className="animate-fade-in-up"
          style={{
            fontSize: "clamp(3.5rem, 9vw, 6rem)",
            marginBottom: "1.2rem",
            filter: "drop-shadow(0 0 36px rgba(241,225,148,0.5)) drop-shadow(0 0 10px rgba(241,225,148,0.25))",
            animationDelay: "0s",
          }}
          aria-hidden="true"
        >
          🔮
        </div>

        {/* ── Title — strict block with no absolute positioning ── */}
        <h1
          className="animate-fade-in-up"
          style={{
            display: "block",
            fontFamily: "Cairo, sans-serif",
            fontSize: "clamp(4.5rem, 13vw, 8rem)",
            fontWeight: 900,
            lineHeight: 1,
            color: "#F1E194",
            margin: 0,
            marginBottom: "clamp(0.6rem, 2vw, 1.2rem)",
            textShadow:
              "0 0 80px rgba(241,225,148,0.42), 0 0 24px rgba(241,225,148,0.22), 0 4px 32px rgba(0,0,0,0.8)",
            letterSpacing: "-0.01em",
            animationDelay: "0.06s",
          }}
        >
          حُجّة
        </h1>

        {/* ── Subtitle — inside a readable card ── */}
        <div
          className="animate-fade-in-up"
          style={{
            display: "block",
            marginBottom: "clamp(1.5rem, 3.5vw, 2.2rem)",
            animationDelay: "0.12s",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "0.45em 1.4em",
              borderRadius: "9999px",
              background: "rgba(241,225,148,0.07)",
              border: "1px solid rgba(241,225,148,0.18)",
              color: "rgba(241,225,148,0.65)",
              fontWeight: 600,
              fontSize: "clamp(0.65rem, 1.6vw, 0.85rem)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              backdropFilter: "blur(4px)",
            }}
          >
            HUJJAH &nbsp;•&nbsp; لعبة الأسئلة
          </span>
        </div>

        {/* ── Premium upsell ── */}
        {currentUser && !isPremium && (
          <div
            className="animate-fade-in-up"
            style={{
              display: "block",
              maxWidth: "340px",
              width: "100%",
              marginBottom: "1.5rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "1rem",
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.22)",
              animationDelay: "0.13s",
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

        {/* ── CTA ── */}
        <button
          data-testid="start-game-btn"
          onClick={() => navigate("/mode")}
          className="animate-pulse-glow animate-fade-in-up select-none"
          style={{
            display: "block",
            marginBottom: "clamp(2rem, 5vw, 3rem)",
            background: "#F1E194",
            color: "#1a0205",
            fontFamily: "Cairo, sans-serif",
            fontWeight: 900,
            borderRadius: "9999px",
            border: "2.5px solid rgba(241,225,148,0.9)",
            fontSize: "clamp(1.15rem, 3vw, 1.55rem)",
            padding: "clamp(14px,2.8vw,20px) clamp(38px,7vw,72px)",
            boxShadow: "0 0 60px rgba(241,225,148,0.38), 0 0 18px rgba(241,225,148,0.18), 0 8px 32px rgba(0,0,0,0.6)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            animationDelay: "0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          🎮 العب الحين
        </button>

        {/* ── Steps ── */}
        <div
          className="animate-fade-in-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(8px, 1.5vw, 14px)",
            maxWidth: "560px",
            width: "100%",
            marginBottom: "clamp(1.2rem, 3vw, 2rem)",
            animationDelay: "0.22s",
          }}
        >
          {[
            { n: "1", t: "سمّوا الفرق",    d: "كل فريق يختار اسمه" },
            { n: "2", t: "اختاروا الفئات", d: "3 فئات لكل فريق"    },
            { n: "3", t: "العب وانتصر",    d: "أجب وجمّع النقاط"    },
          ].map(s => (
            <div
              key={s.n}
              style={{
                background: "rgba(61,8,16,0.32)",
                border: "1px solid rgba(241,225,148,0.12)",
                backdropFilter: "blur(10px)",
                borderRadius: "1rem",
                padding: "clamp(10px, 2vw, 18px) clamp(8px, 1.5vw, 14px)",
                textAlign: "center",
                transition: "transform 0.18s, border-color 0.18s",
                cursor: "default",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.borderColor = "rgba(241,225,148,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(241,225,148,0.12)"; }}
            >
              <div
                style={{
                  color: "#F1E194",
                  fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                  fontWeight: 900,
                  marginBottom: "0.3em",
                  textShadow: "0 0 18px rgba(241,225,148,0.45)",
                }}
              >
                {s.n}
              </div>
              <div style={{ color: "rgba(241,225,148,0.85)", fontWeight: 700, fontSize: "clamp(0.72rem, 1.3vw, 0.88rem)", lineHeight: 1.3 }}>{s.t}</div>
              <div style={{ color: "rgba(241,225,148,0.38)", fontSize: "clamp(0.6rem, 1vw, 0.72rem)", marginTop: "0.25em" }}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* ── Feature chips — ONLY 2 (removed: أسئلة بالصور, مؤقت للإجابة) ── */}
        <div
          className="animate-fade-in-up"
          style={{
            display: "flex",
            gap: "0.6rem",
            justifyContent: "center",
            flexWrap: "wrap",
            animationDelay: "0.27s",
          }}
        >
          {[
            { icon: "🏆", text: "وضع البطولة" },
            { icon: "🔄", text: "أسئلة لا تتكرر" },
          ].map(f => (
            <div
              key={f.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(241,225,148,0.04)",
                border: "1px solid rgba(241,225,148,0.10)",
                borderRadius: "9999px",
                padding: "0.4em 0.95em",
              }}
            >
              <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>{f.icon}</span>
              <span style={{ color: "rgba(241,225,148,0.55)", fontSize: "clamp(0.7rem, 1.2vw, 0.82rem)", fontWeight: 700 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
