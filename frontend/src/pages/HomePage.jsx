import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

/* ── Art sources ─────────────────────────────────────────────────────────── */
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

/* ── Cinematic Art Collage Background ───────────────────────────────────── */
function ArtCollageBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 0, background: "#060001" }}
      aria-hidden="true"
    >
      {/* BASE: School of Athens — full canvas */}
      <div className="absolute inset-0">
        <img
          src={ART.schoolOfAthens}
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: "brightness(0.40) saturate(0.72) sepia(0.18)",
            transform: "scale(1.06)",
            transformOrigin: "center center",
          }}
          loading="eager"
          onError={e => { e.target.style.display = "none"; }}
        />
      </div>

      {/* LEFT STRIP: Rembrandt scholar — feathered right */}
      <div
        className="absolute left-0 top-0 h-full"
        style={{ width: "clamp(150px, 25vw, 340px)" }}
      >
        <img
          src={ART.rembrandtDark}
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: "brightness(0.34) saturate(0.62) sepia(0.22)",
          }}
          loading="lazy"
          onError={e => { e.target.style.display = "none"; }}
        />
        {/* feather edge into center */}
        <div
          className="absolute inset-y-0 right-0"
          style={{
            width: "60%",
            background: "linear-gradient(to right, transparent, #060001)",
          }}
        />
      </div>

      {/* RIGHT STRIP: Marble statue — feathered left */}
      <div
        className="absolute right-0 top-0 h-full"
        style={{ width: "clamp(130px, 22vw, 310px)" }}
      >
        <img
          src={ART.marbleStatue}
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: "brightness(0.30) saturate(0.52) sepia(0.25)",
          }}
          loading="lazy"
          onError={e => { e.target.style.display = "none"; }}
        />
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: "60%",
            background: "linear-gradient(to left, transparent, #060001)",
          }}
        />
      </div>

      {/* ACCENT TL: Baroque ceiling — rotated, blurred */}
      <div
        className="absolute rounded-2xl overflow-hidden hidden md:block"
        style={{
          top: "4%",
          right: "clamp(130px, 23vw, 318px)",
          width: "clamp(88px, 11vw, 160px)",
          height: "clamp(66px, 9.5vw, 138px)",
          filter: "brightness(0.28) saturate(0.52) blur(3px) sepia(0.20)",
          boxShadow: "0 0 0 1px rgba(241,225,148,0.07), 0 10px 36px rgba(0,0,0,0.65)",
          transform: "rotate(2.2deg)",
        }}
      >
        <img
          src={ART.baroqueCeiling}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onError={e => { e.target.parentElement.style.display = "none"; }}
        />
      </div>

      {/* ACCENT BL: School closeup — counter-rotated, blurred */}
      <div
        className="absolute rounded-2xl overflow-hidden hidden md:block"
        style={{
          bottom: "6%",
          left: "clamp(132px, 25vw, 348px)",
          width: "clamp(88px, 10.5vw, 150px)",
          height: "clamp(62px, 8vw, 114px)",
          filter: "brightness(0.30) saturate(0.58) blur(2.5px) sepia(0.18)",
          boxShadow: "0 0 0 1px rgba(241,225,148,0.06), 0 10px 36px rgba(0,0,0,0.60)",
          transform: "rotate(-1.8deg)",
        }}
      >
        <img
          src={ART.schoolCloseup}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onError={e => { e.target.parentElement.style.display = "none"; }}
        />
      </div>

      {/* ACCENT MID-LEFT: Baroque portrait — tall, subtle */}
      <div
        className="absolute rounded-xl overflow-hidden hidden lg:block"
        style={{
          top: "22%",
          left: "clamp(122px, 22vw, 308px)",
          width: "clamp(58px, 7.5vw, 108px)",
          height: "clamp(88px, 13vw, 188px)",
          filter: "brightness(0.26) saturate(0.48) blur(2px) sepia(0.24)",
          boxShadow: "0 0 0 1px rgba(241,225,148,0.05)",
          transform: "rotate(-1deg)",
        }}
      >
        <img
          src={ART.baroque}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onError={e => { e.target.parentElement.style.display = "none"; }}
        />
      </div>

      {/* ── LAYERED OVERLAYS ── */}

      {/* 1. Central light pocket — lets the center breathe slightly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 65% at 50% 44%, rgba(6,0,1,0.12) 0%, rgba(6,0,1,0.64) 100%)",
        }}
      />

      {/* 2. Top-to-bottom gradient for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,0,1,0.58) 0%, rgba(6,0,1,0.10) 30%, rgba(6,0,1,0.18) 68%, rgba(6,0,1,0.72) 100%)",
        }}
      />

      {/* 3. Vignette — Caravaggio-style darkened corners */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 105% 105% at 50% 50%, transparent 26%, rgba(4,0,0,0.48) 60%, rgba(2,0,0,0.92) 100%)",
        }}
      />

      {/* 4. Warm burgundy multiply tint */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(52,5,13,0.24)", mixBlendMode: "multiply" }}
      />

      {/* 5. Top fade — navbar legibility */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: "160px",
          background: "linear-gradient(to bottom, rgba(5,0,1,0.85) 0%, rgba(5,0,1,0.30) 60%, transparent 100%)",
        }}
      />

      {/* 6. Bottom fade — footer legibility */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "120px",
          background: "linear-gradient(to top, rgba(5,0,1,0.75) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

/* ── Thin decorative rule ─────────────────────────────────────────────────── */
function GoldRule() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.8rem",
        width: "clamp(180px, 42vw, 340px)",
      }}
    >
      <div style={{ flex: 1, height: "1px", background: "rgba(241,225,148,0.16)" }} />
      <span
        style={{
          color: "rgba(241,225,148,0.38)",
          fontSize: "0.48rem",
          letterSpacing: "0.55em",
          lineHeight: 1,
        }}
      >
        ✦ ✦ ✦
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(241,225,148,0.16)" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate  = useNavigate();
  const { currentUser, logoutUser } = useGame();
  const isPremium = currentUser?.subscription_type === "premium";
  const infoRef   = useRef(null);

  // Preload hot endpoints on mount so the server is warm when user clicks play
  useEffect(() => {
    fetch(`${API}/free-categories`).catch(() => {});
    fetch(`${API}/categories`).catch(() => {});
  }, []);

  // Fade-in on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("hl-visible"); }),
      { threshold: 0.10 }
    );
    const els = document.querySelectorAll(".hl-reveal");
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative overflow-x-hidden"
      style={{ minHeight: "100svh" }}
    >
      <ArtCollageBackground />

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav
        className="relative flex items-center justify-between px-5 md:px-8 py-4"
        style={{ zIndex: 20 }}
      >
        {/* LEFT: user info or auth buttons */}
        {currentUser ? (
          <div className="flex items-center gap-3">
            {/* Avatar circle */}
            <div
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 cursor-pointer"
              style={{
                color: "#F1E194",
                background: "rgba(241,225,148,0.10)",
                border: "1.5px solid rgba(241,225,148,0.28)",
              }}
            >
              {currentUser.avatar_url
                ? <img src={currentUser.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                : (currentUser.username || "؟")[0].toUpperCase()
              }
            </div>
            <div className="leading-tight">
              <span
                className="block text-sm font-bold"
                style={{ color: "rgba(241,225,148,0.85)" }}
              >
                {currentUser.username}
              </span>
              {isPremium ? (
                <span
                  className="text-[10px] font-bold"
                  style={{ color: "rgba(251,191,36,0.70)" }}
                >
                  ✦ عضو مميز
                </span>
              ) : (
                <button
                  data-testid="upgrade-banner-btn"
                  onClick={() => navigate("/pricing")}
                  className="text-[10px] font-black transition-colors hover:opacity-80"
                  style={{ color: "#FCD34D" }}
                >
                  ترقية ↗
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              data-testid="login-nav-btn"
              onClick={() => navigate("/login")}
              className="text-sm font-black px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                color: "rgba(241,225,148,0.72)",
                border: "1.5px solid rgba(241,225,148,0.22)",
              }}
            >
              دخول
            </button>
            <button
              data-testid="signup-nav-btn"
              onClick={() => navigate("/signup")}
              className="text-sm font-black px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: "#F1E194",
                color: "#1a0205",
                boxShadow: "0 0 22px rgba(241,225,148,0.30)",
              }}
            >
              حساب جديد
            </button>
          </div>
        )}

        {/* RIGHT: nav actions — pricing + admin, now clearly visible */}
        <div className="flex items-center gap-2">
          {!isPremium && (
            <button
              data-testid="pricing-nav-btn"
              onClick={() => navigate("/pricing")}
              className="flex items-center gap-1.5 text-sm font-black px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, rgba(200,138,8,0.28) 0%, rgba(251,191,36,0.14) 100%)",
                border: "1.5px solid rgba(251,191,36,0.55)",
                color: "#FCD34D",
                boxShadow: "0 0 18px rgba(251,191,36,0.20), inset 0 1px 0 rgba(251,191,36,0.12)",
                textShadow: "0 0 12px rgba(251,191,36,0.50)",
              }}
            >
              <span style={{ fontSize: "0.7rem" }}>✦</span>
              <span>الأسعار</span>
            </button>
          )}

          <button
            data-testid="admin-link"
            onClick={() => navigate("/admin")}
            className="text-sm font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
            style={{
              color: "rgba(241,225,148,0.72)",
              border: "1.5px solid rgba(241,225,148,0.26)",
              background: "rgba(241,225,148,0.06)",
              backdropFilter: "blur(4px)",
            }}
          >
            الإدارة
          </button>
          {currentUser && (
            <button
              data-testid="logout-btn"
              onClick={logoutUser}
              className="text-xs font-bold px-3 py-2 rounded-full transition-all hover:scale-105"
              style={{ color: "rgba(241,225,148,0.38)" }}
            >
              خروج
            </button>
          )}
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <main
        className="relative flex flex-col items-center text-center"
        style={{
          zIndex: 10,
          /* enough breathing room above and below */
          paddingTop: "clamp(2rem, 7vh, 5.5rem)",
          paddingBottom: "clamp(3rem, 8vh, 6rem)",
          paddingLeft: "1.25rem",
          paddingRight: "1.25rem",
        }}
      >

        {/* ── Ornamental rule ── */}
        <div className="animate-fade-in-up" style={{ marginBottom: "clamp(1rem, 3vh, 1.8rem)", animationDelay: "0s" }}>
          <GoldRule />
        </div>

        {/* ── Main title: حُجّة ── */}
        <h1
          className="animate-fade-in-up"
          style={{
            /*
             * OVERLAP FIX: explicit block display + controlled line-height.
             * clamp keeps it from growing too large on big screens.
             */
            display: "block",
            fontFamily: "Cairo, sans-serif",
            fontSize: "clamp(3.8rem, 10.5vw, 6.8rem)",
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#F1E194",
            margin: "0",
            /* clear bottom gap — subtitle will never overlap */
            marginBottom: "clamp(0.9rem, 2.8vh, 1.5rem)",
            textShadow:
              "0 0 100px rgba(241,225,148,0.38), " +
              "0 0 30px rgba(241,225,148,0.20), " +
              "0 4px 48px rgba(0,0,0,0.88)",
            letterSpacing: "-0.01em",
            animationDelay: "0.08s",
          }}
        >
          حُجّة
        </h1>

        {/* ── Subtitle pill — always fully visible ── */}
        <div
          className="animate-fade-in-up"
          style={{ marginBottom: "clamp(2rem, 4.5vh, 3rem)", animationDelay: "0.15s" }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "0.52em 1.7em",
              borderRadius: "9999px",
              background: "rgba(241,225,148,0.07)",
              border: "1px solid rgba(241,225,148,0.18)",
              backdropFilter: "blur(8px)",
              color: "rgba(241,225,148,0.62)",
              fontWeight: 600,
              fontSize: "clamp(0.62rem, 1.45vw, 0.80rem)",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
            }}
          >
            HUJJAH &nbsp;•&nbsp; لعبة الأسئلة
          </span>
        </div>

        {/* ── Premium upsell (only if logged in, not premium) ── */}
        {currentUser && !isPremium && (
          <div
            className="animate-fade-in-up"
            style={{
              maxWidth: "340px",
              width: "100%",
              marginBottom: "1.6rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "1rem",
              background: "rgba(251,191,36,0.07)",
              border: "1px solid rgba(251,191,36,0.20)",
              backdropFilter: "blur(6px)",
              animationDelay: "0.17s",
            }}
          >
            <p className="text-sm" style={{ color: "rgba(251,191,36,0.72)", margin: 0 }}>
              أسئلتك قد تتكرر —{" "}
              <button
                data-testid="pricing-inline-btn"
                onClick={() => navigate("/pricing")}
                className="font-black underline underline-offset-2 hover:no-underline transition-all"
                style={{ color: "#FCD34D" }}
              >
                اشترك للحصول على تجربة كاملة
              </button>
            </p>
          </div>
        )}

        {/* ── Primary CTA ── */}
        <button
          data-testid="start-game-btn"
          onClick={() => navigate("/mode")}
          className="animate-fade-in-up select-none"
          style={{
            display: "block",
            marginBottom: "1rem",
            background: "linear-gradient(135deg, #F5E99A 0%, #E8D050 55%, #D4BC30 100%)",
            color: "#130104",
            fontFamily: "Cairo, sans-serif",
            fontWeight: 900,
            borderRadius: "9999px",
            border: "2px solid rgba(241,225,148,0.82)",
            fontSize: "clamp(1.08rem, 2.7vw, 1.42rem)",
            padding: "clamp(14px, 2.6vw, 20px) clamp(42px, 7.5vw, 82px)",
            boxShadow:
              "0 0 72px rgba(241,225,148,0.38), " +
              "0 0 24px rgba(241,225,148,0.18), " +
              "0 8px 44px rgba(0,0,0,0.70)",
            cursor: "pointer",
            transition: "transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s",
            animationDelay: "0.22s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.06) translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 0 96px rgba(241,225,148,0.52), 0 0 32px rgba(241,225,148,0.26), 0 14px 52px rgba(0,0,0,0.75)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1) translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 0 72px rgba(241,225,148,0.38), 0 0 24px rgba(241,225,148,0.18), 0 8px 44px rgba(0,0,0,0.70)";
          }}
        >
          العب الحين
        </button>


        {/* ── Secondary actions row ── */}
        <div
          className="animate-fade-in-up flex items-center justify-center gap-3 flex-wrap"
          style={{ marginBottom: "clamp(2.2rem, 5.5vh, 3.8rem)", animationDelay: "0.27s" }}
        >
          <button
            onClick={() => navigate("/community")}
            style={{
              background: "rgba(242,184,91,0.12)",
              border: "1.5px solid rgba(242,184,91,0.35)",
              color: "#f2b85b",
              borderRadius: "9999px",
              padding: "clamp(8px,1.4vw,12px) clamp(20px,3.5vw,36px)",
              fontWeight: 800,
              fontSize: "clamp(0.8rem,1.4vw,0.95rem)",
              cursor: "pointer",
              fontFamily: "Cairo, sans-serif",
              transition: "all 0.2s",
            }}
          >
            🏛️ المجتمع
          </button>

          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 text-sm font-black px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, rgba(195,132,6,0.22) 0%, rgba(251,191,36,0.12) 100%)",
              border: "1.5px solid rgba(251,191,36,0.50)",
              color: "#FCD34D",
              boxShadow: "0 0 20px rgba(251,191,36,0.20), inset 0 1px 0 rgba(251,191,36,0.12)",
              textShadow: "0 0 12px rgba(251,191,36,0.48)",
              backdropFilter: "blur(6px)",
            }}
          >
            <span style={{ fontSize: "0.65rem" }}>✦</span>
            الأسعار
          </button>

          {currentUser && (
            <button
              onClick={() => navigate("/profile")}
              className="text-sm font-black px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              style={{
                color: "#F1E194",
                background: "rgba(241,225,148,0.08)",
                border: "1.5px solid rgba(241,225,148,0.28)",
                backdropFilter: "blur(6px)",
              }}
            >
              {currentUser.avatar_url
                ? <img src={currentUser.avatar_url} alt="" style={{ width:20, height:20, borderRadius:"50%", objectFit:"cover" }} />
                : <span style={{ width:20, height:20, borderRadius:"50%", background:"rgba(241,225,148,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900 }}>{(currentUser.username||"؟")[0].toUpperCase()}</span>
              }
              بروفايلي
            </button>
          )}
        </div>

        {/* ── Steps (how it works) ── */}
        <div
          className="animate-fade-in-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(8px, 1.6vw, 14px)",
            maxWidth: "540px",
            width: "100%",
            marginBottom: "clamp(1.4rem, 3.5vh, 2.2rem)",
            animationDelay: "0.32s",
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
                background: "rgba(48,4,12,0.30)",
                border: "1px solid rgba(241,225,148,0.10)",
                backdropFilter: "blur(12px)",
                borderRadius: "1rem",
                padding: "clamp(10px, 2vw, 18px) clamp(8px, 1.5vw, 14px)",
                textAlign: "center",
                transition: "transform 0.20s cubic-bezier(.4,0,.2,1), border-color 0.20s, box-shadow 0.20s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.04) translateY(-3px)";
                e.currentTarget.style.borderColor = "rgba(241,225,148,0.28)";
                e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.45)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1) translateY(0)";
                e.currentTarget.style.borderColor = "rgba(241,225,148,0.10)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  color: "#F1E194",
                  fontSize: "clamp(1.25rem, 2.4vw, 1.75rem)",
                  fontWeight: 900,
                  marginBottom: "0.3em",
                  textShadow: "0 0 18px rgba(241,225,148,0.45)",
                  lineHeight: 1,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  color: "rgba(241,225,148,0.84)",
                  fontWeight: 700,
                  fontSize: "clamp(0.68rem, 1.25vw, 0.85rem)",
                  lineHeight: 1.3,
                }}
              >
                {s.t}
              </div>
              <div
                style={{
                  color: "rgba(241,225,148,0.34)",
                  fontSize: "clamp(0.58rem, 0.95vw, 0.70rem)",
                  marginTop: "0.28em",
                  lineHeight: 1.4,
                }}
              >
                {s.d}
              </div>
            </div>
          ))}
        </div>

        {/* ── Feature chips — exactly 2, trimmed ── */}
        <div
          className="animate-fade-in-up flex gap-2.5 justify-center flex-wrap"
          style={{ animationDelay: "0.37s" }}
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
                gap: "0.45rem",
                background: "rgba(241,225,148,0.04)",
                border: "1px solid rgba(241,225,148,0.09)",
                borderRadius: "9999px",
                padding: "0.38em 1.05em",
              }}
            >
              <span style={{ fontSize: "0.80rem", lineHeight: 1 }}>{f.icon}</span>
              <span
                style={{
                  color: "rgba(241,225,148,0.50)",
                  fontSize: "clamp(0.66rem, 1.1vw, 0.78rem)",
                  fontWeight: 700,
                }}
              >
                {f.text}
              </span>
            </div>
          ))}
        </div>

      </main>

      {/* ── Scroll-down cue ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: "10px", padding: "20px 0 36px", position: "relative", zIndex: 10,
          cursor: "pointer",
        }}
        onClick={() => infoRef.current?.scrollIntoView({ behavior: "smooth" })}
      >
        <span style={{
          color: "rgba(241,225,148,0.55)", fontSize: "0.78rem", letterSpacing: "0.28em",
          fontWeight: 800, fontFamily: "Cairo, sans-serif", textTransform: "uppercase",
        }}>
          اعرف أكثر
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <div style={{ width: "1px", height: "32px", background: "linear-gradient(to bottom, rgba(241,225,148,0.12), rgba(241,225,148,0.40))" }} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "hlBounce 1.6s ease-in-out infinite", opacity: 0.6 }}>
            <path d="M12 5v14M5 12l7 7 7-7" stroke="#F1E194" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ══════════════════ INFO SECTIONS ══════════════════ */}
      <style>{`
        .hl-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.80s ease, transform 0.80s ease; }
        .hl-reveal.hl-visible { opacity: 1; transform: none; }
        @keyframes hlBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
      `}</style>

      <div ref={infoRef} style={{ position: "relative", zIndex: 10 }}>
        {[
          {
            img: "https://i.pinimg.com/1200x/64/18/cb/6418cb92ddf7922e669e4ce4db23848e.jpg",
            label: "البداية",
            title: "وش هي حُجّة؟",
            body: "حُجّة لعبة تنافسية جماعية، تختار فئات وتدخل تحدي مباشر مع فريق ثاني… الهدف؟ تثبت إنك الأذكى",
          },
          {
            img: "https://i.pinimg.com/1200x/b2/84/70/b2847051be2fd729ff772802e96b6174.jpg",
            label: "طريقة اللعب",
            title: "كيف تلعب؟",
            body: "كل فريق يختار 3 فئات، بعدها تبدأون تختارون الأسئلة (300 / 600 / 900)، تجاوب وتكسب نقاط… واللي يجمع أكثر يفوز",
          },
          {
            img: "https://i.pinimg.com/1200x/fd/23/bc/fd23bc26a6a6b35c412b25441e947478.jpg",
            label: "الأسعار",
            title: "نظام النقاط",
            body: "كل ما زادت قيمة السؤال، زادت صعوبته… لكن بالمقابل نقاطه أعلى، القرار لك: تلعبها آمن أو تخاطر؟",
          },
          {
            img: "https://i.pinimg.com/1200x/da/90/57/da9057e1d03b0ca70434ca358b2cf483.jpg",
            label: "التكتيك",
            title: "وسائل المساعدة",
            body: "عندك أدوات تساعدك: تغيير السؤال، مضاعفة النقاط، وزيادة الوقت… استخدمها في الوقت الصح عشان تقلب المباراة",
          },
          {
            img: "https://i.pinimg.com/1200x/c1/df/92/c1df923c8864703400c1ddad66ce2a84.jpg",
            label: "المجتمع",
            title: "مجتمع حُجّة",
            body: "أنشئ فئاتك الخاصة وخلي غيرك يلعبها… ومع الوقت ممكن تكسب من فئاتك وتنتشر بين اللاعبين",
          },
          {
            img: "https://i.pinimg.com/1200x/53/4e/ac/534eacc413764ea8b931743e6b4dcfd6.jpg",
            label: "المفضلة",
            title: "احفظ فئاتك",
            body: "أي فئة تعجبك تقدر تحفظها وترجع لها بأي وقت، بدون ما تضيعها",
          },
          {
            img: "https://i.pinimg.com/1200x/69/89/86/69898606c334b187437b881e1780106e.jpg",
            label: "التنافس",
            title: "نظام البطولة",
            body: "ادخل بنظام بطولة كامل وتحدى أكثر من فريق… والأفضل يكون فريقك شخصين عشان الحماس يكون أعلى",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="hl-reveal"
            style={{
              minHeight: "80vh",
              backgroundImage: `linear-gradient(to bottom,
                rgba(0,0,0,0.92) 0%,
                rgba(0,0,0,0.42) 22%,
                rgba(0,0,0,0.38) 50%,
                rgba(0,0,0,0.42) 78%,
                rgba(0,0,0,0.92) 100%
              ), url(${s.img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "clamp(64px,10vh,120px) clamp(24px,10vw,160px)",
              textAlign: "center",
              direction: "rtl",
            }}
          >
            <div style={{ maxWidth: "680px" }}>
              <div style={{
                color: "rgba(241,225,148,0.40)",
                fontSize: "0.58rem",
                fontWeight: 800,
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}>
                {s.label}
              </div>
              <h2 style={{
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(2rem,4.2vw,3.4rem)",
                fontWeight: 900,
                color: "#F1E194",
                margin: "0 0 24px",
                lineHeight: 1.15,
                textShadow: "0 2px 48px rgba(0,0,0,0.95), 0 0 80px rgba(241,225,148,0.12)",
              }}>
                {s.title}
              </h2>
              <p style={{
                color: "rgba(255,255,255,0.82)",
                fontFamily: "Cairo, sans-serif",
                fontSize: "clamp(1rem,1.9vw,1.22rem)",
                lineHeight: 1.85,
                margin: "0 auto",
                textShadow: "0 1px 18px rgba(0,0,0,0.80)",
                maxWidth: "540px",
              }}>
                {s.body}
              </p>
            </div>
          </div>
        ))}

        {/* Contact */}
        <ContactSection />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   SUB-COMPONENTS (landing page only)
───────────────────────────────────────────────────── */

function ContactSection() {
  const socials = [
    { icon: "📧", label: "البريد",     value: "hujjahgame@gmail.com",  href: "mailto:hujjahgame@gmail.com" },
    { icon: "📸", label: "انستقرام",   value: "hujjah.game",           href: "https://instagram.com/hujjah.game" },
    { icon: "🎵", label: "تيك توك",    value: "huajjh.game",           href: "https://tiktok.com/@huajjh.game" },
  ];
  return (
    <div
      className="hl-reveal"
      style={{
        textAlign: "center",
        minHeight: "100vh",
        backgroundImage: `linear-gradient(to bottom,
          rgba(0,0,0,0.92) 0%,
          rgba(0,0,0,0.48) 20%,
          rgba(0,0,0,0.42) 60%,
          rgba(0,0,0,0.92) 100%
        ), url(https://i.pinimg.com/1200x/d1/d6/a6/d1d6a699164ce6bc38a291bd4b0909c9.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(80px,12vh,140px) clamp(24px,10vw,160px)",
      }}
    >
      <div style={{
        color: "rgba(241,225,148,0.40)", fontSize: "0.62rem",
        fontWeight: 800, letterSpacing: "0.36em", textTransform: "uppercase", marginBottom: "20px",
      }}>
        تواصل
      </div>
      <h2 style={{
        fontFamily: "Cairo, sans-serif",
        fontSize: "clamp(2rem,4.2vw,3.4rem)",
        fontWeight: 900,
        color: "#F1E194",
        margin: "0 0 18px",
        textShadow: "0 2px 48px rgba(0,0,0,0.95), 0 0 80px rgba(241,225,148,0.12)",
        lineHeight: 1.15,
      }}>
        تواصل معنا
      </h2>
      <p style={{
        color: "rgba(255,255,255,0.75)",
        fontFamily: "Cairo, sans-serif",
        fontSize: "clamp(1rem,1.9vw,1.22rem)",
        marginBottom: "clamp(36px,6vh,60px)",
        textShadow: "0 1px 18px rgba(0,0,0,0.80)",
        maxWidth: "480px",
      }}>
        عندك اقتراح أو فكرة؟ تواصل معنا
      </p>

      <div style={{
        display: "flex", justifyContent: "center", flexWrap: "wrap",
        gap: "clamp(14px,2.5vw,28px)", marginBottom: "clamp(28px,5vh,48px)",
      }}>
        {socials.map(s => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "clamp(14px,2vw,20px) clamp(22px,3.5vw,36px)",
              borderRadius: "16px",
              background: "rgba(241,225,148,0.06)",
              border: "1.5px solid rgba(241,225,148,0.18)",
              backdropFilter: "blur(12px)",
              textDecoration: "none",
              transition: "all 0.22s ease",
              minWidth: "clamp(180px,24vw,260px)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(241,225,148,0.12)";
              e.currentTarget.style.borderColor = "rgba(241,225,148,0.35)";
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(241,225,148,0.06)";
              e.currentTarget.style.borderColor = "rgba(241,225,148,0.18)";
              e.currentTarget.style.transform = "";
            }}
          >
            <span style={{ fontSize: "1.8rem" }}>{s.icon}</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "rgba(241,225,148,0.45)", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.14em" }}>
                {s.label}
              </div>
              <div style={{ color: "rgba(241,225,148,0.85)", fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: "clamp(0.88rem,1.5vw,1.05rem)" }}>
                {s.value}
              </div>
            </div>
          </a>
        ))}
      </div>

      <p style={{
        color: "rgba(255,255,255,0.82)",
        fontFamily: "Cairo, sans-serif",
        fontSize: "clamp(1rem,1.8vw,1.18rem)",
        margin: 0,
        fontWeight: 600,
        textShadow: "0 2px 20px rgba(0,0,0,0.90)",
      }}>
        تابعنا عشان تشوف أحدث الفئات والتحديات
      </p>
    </div>
  );
}
