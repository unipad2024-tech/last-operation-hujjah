import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";

/* ── Fade-in via IntersectionObserver ── */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.style.opacity="1"; el.style.transform="translateY(0)"; obs.unobserve(el); } },
      { threshold: 0.10 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

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
/* ── User Avatar Dropdown ─────────────────────────────────────────────────── */
function UserMenu({ currentUser, isPremium, navigate, logoutUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const avatarLetter = (currentUser.username || "؟")[0].toUpperCase();
  const avatarUrl    = currentUser.avatar_url;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 11,
          background: open ? "rgba(241,225,148,0.13)" : "rgba(241,225,148,0.08)",
          border: `1.5px solid ${open ? "rgba(241,225,148,0.55)" : "rgba(241,225,148,0.25)"}`,
          borderRadius: 999, padding: "7px 16px 7px 7px",
          cursor: "pointer", transition: "all 0.2s",
          boxShadow: open ? "0 0 16px rgba(241,225,148,0.15)" : "none",
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(241,225,148,0.35)" }} onError={e => { e.target.style.display="none"; }} />
        ) : (
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(241,225,148,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#F1E194", flexShrink: 0, border: "2px solid rgba(241,225,148,0.3)" }}>
            {avatarLetter}
          </div>
        )}
        <div style={{ lineHeight: 1.35, textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#F1E194" }}>{currentUser.username}</div>
          <div style={{ fontSize: 11, color: isPremium ? "#FCD34D" : "rgba(241,225,148,0.5)", fontWeight: 700 }}>
            {isPremium ? "✦ عضو مميز" : "مجاني"}
          </div>
        </div>
        <span style={{ color: "rgba(241,225,148,0.5)", fontSize: 11, marginRight: 2 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          background: "rgba(10,5,8,0.97)", border: "1px solid rgba(241,225,148,0.22)",
          borderRadius: 18, padding: 8, minWidth: 230,
          boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
          backdropFilter: "blur(24px)", zIndex: 100,
          animation: "fadeIn 0.15s ease",
        }}>
          {/* Header */}
          <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid rgba(241,225,148,0.1)", marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#F1E194" }}>{currentUser.username}</div>
            <div style={{ fontSize: 11, color: "rgba(241,225,148,0.4)", marginTop: 2 }}>{currentUser.email || ""}</div>
          </div>

          {/* Items */}
          {[
            { icon: "👤", label: "بروفايلي", action: () => { navigate(`/profile/${currentUser.username}`); setOpen(false); } },
            { icon: "⚙️", label: "إعدادات الحساب", action: () => { navigate("/settings"); setOpen(false); } },
            { icon: "🏘️", label: "المجتمع", action: () => { navigate("/community"); setOpen(false); } },
            ...(!isPremium ? [{ icon: "✦", label: "ترقية إلى Premium", action: () => { navigate("/pricing"); setOpen(false); }, gold: true }] : []),
          ].map(({ icon, label, action, gold }) => (
            <button key={label} onClick={action}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "13px 16px", borderRadius: 12, border: "none",
                background: "transparent", color: gold ? "#FCD34D" : "rgba(241,225,148,0.85)",
                cursor: "pointer", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 15,
                textAlign: "right", transition: "background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(241,225,148,0.09)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 17 }}>{icon}</span><span>{label}</span>
            </button>
          ))}

          {/* Divider + logout */}
          <div style={{ height: 1, background: "rgba(241,225,148,0.08)", margin: "6px 0" }} />
          <button onClick={() => { logoutUser(); setOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%",
              padding: "13px 16px", borderRadius: 12, border: "none",
              background: "transparent", color: "rgba(255,100,100,0.75)",
              cursor: "pointer", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 15,
              textAlign: "right", transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,80,80,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 17 }}>🚪</span><span>تسجيل خروج</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate  = useNavigate();
  const { currentUser, logoutUser } = useGame();
  const isPremium = currentUser?.subscription_type === "premium";
  const aboutRef  = useRef(null);
  const scrollToAbout = () => aboutRef.current?.scrollIntoView({ behavior: "smooth" });

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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate("/search")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(241,225,148,0.08)",
                border: "1.5px solid rgba(241,225,148,0.22)",
                color: "rgba(241,225,148,0.7)", fontSize: 18,
                cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(241,225,148,0.15)"; e.currentTarget.style.borderColor = "rgba(241,225,148,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(241,225,148,0.08)"; e.currentTarget.style.borderColor = "rgba(241,225,148,0.22)"; }}
              title="بحث عن مستخدم"
            >🔍</button>
            <UserMenu currentUser={currentUser} isPremium={isPremium} navigate={navigate} logoutUser={logoutUser} />
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
            onClick={() => navigate("/community")}
            className="text-secondary/70 text-sm font-bold px-4 py-2 rounded-full transition-all hover:text-secondary/90 hover:bg-secondary/8"
            style={{ border: "1px solid rgba(241,225,148,0.18)" }}
          >
            المجتمع
          </button>
          <button
            data-testid="admin-link"
            onClick={() => navigate("/admin")}
            className="text-secondary/55 text-sm font-bold px-4 py-2 rounded-full transition-all hover:text-secondary/90 hover:bg-secondary/8"
            style={{ border: "1px solid rgba(241,225,148,0.18)" }}
          >
            الإدارة
          </button>
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

        {/* ── Scroll down indicator ── */}
        <button
          onClick={scrollToAbout}
          style={{
            marginTop: "2.5rem", background: "none", border: "none",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 6, opacity: 0.45,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity="0.45"}
        >
          <span style={{ color: "#F1E194", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.15em" }}>اعرف أكثر</span>
          <span style={{ color: "#F1E194", fontSize: "1.2rem", animation: "hj-bounce 1.6s ease-in-out infinite" }}>↓</span>
        </button>
      </main>

      {/* ═══════════════════════════════════════════════════════════════
          ABOUT / LANDING SECTIONS
      ═══════════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes hj-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
        .hj-fade { opacity:0; transform:translateY(28px); transition:opacity 0.65s ease, transform 0.65s ease; }
      `}</style>

      <div ref={aboutRef} style={{ position: "relative", zIndex: 10, background: "rgba(6,0,2,0.92)", backdropFilter: "blur(2px)" }}>

        {/* ── divider ── */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, rgba(241,225,148,0.35), transparent)" }} />

        <LandingSection icon="🔮" title="وش هي حُجّة؟" accent>
          <p style={bodyText}>لعبة تنافسية بين فريقين، تختار فئات، تجاوب، وتثبت إنك الأذكى</p>
          <PlaceholderImg label="فريقين يتنافسان" />
        </LandingSection>

        <Divider/>

        <LandingSection icon="🎮" title="كيف تلعب؟">
          <ul style={{ ...bodyText, listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {["كل فريق يختار 3 فئات","تختار سؤال (300 / 600 / 900)","تجاوب وتكسب نقاط","الفريق الأعلى يفوز"].map((t,i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ color: "#F1E194", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>{i+1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <PlaceholderImg label="البورد 3×2" />
        </LandingSection>

        <Divider/>

        <LandingSection icon="🏅" title="نظام النقاط">
          <p style={bodyText}>"كل سؤال له قيمة، كل ما كانت أعلى كان أصعب… وأربح"</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            {[["300","سهل","#6ee7b7"],["600","متوسط","#fcd34d"],["900","صعب","#f87171"]].map(([pts,lbl,col]) => (
              <div key={pts} style={{ textAlign: "center", padding: "14px 24px", borderRadius: 16, background: `rgba(241,225,148,0.05)`, border: `1.5px solid ${col}40` }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: col }}>{pts}</div>
                <div style={{ fontSize: "0.72rem", color: `${col}cc`, fontWeight: 700, marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </LandingSection>

        <Divider/>

        <LandingSection icon="⚡" title="وسائل المساعدة">
          <ul style={{ ...bodyText, listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {[["🔄","تغيير السؤال"],["⚡","مضاعفة النقاط"],["⏱️","زيادة الوقت"]].map(([ic,t]) => (
              <li key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.1rem" }}>{ic}</span><span>{t}</span>
              </li>
            ))}
          </ul>
          <p style={{ ...bodyText, marginTop: 14, color: "rgba(241,225,148,0.45)", fontStyle: "italic" }}>
            "استخدمها بذكاء عشان تقلب النتيجة"
          </p>
        </LandingSection>

        <Divider/>

        <LandingSection icon="🏘️" title="مجتمع حُجّة">
          <p style={bodyText}>تقدر تنشئ فئاتك الخاصة، وتخلي غيرك يلعبها</p>
          <p style={{ ...bodyText, color: "rgba(241,225,148,0.42)", marginTop: 8, fontStyle: "italic" }}>
            ويمكن تكسب من فئاتك مستقبلاً ✦
          </p>
          <PlaceholderImg label="إنشاء فئة مجتمع" />
        </LandingSection>

        <Divider/>

        <LandingSection icon="❤️" title="احفظ فئاتك">
          <p style={bodyText}>أي فئة تعجبك تقدر تحفظها وترجع لها بأي وقت</p>
          <PlaceholderImg label="قائمة المفضلة" />
        </LandingSection>

        <Divider/>

        <LandingSection icon="🏆" title="نظام البطولة">
          <p style={bodyText}>العب بنظام بطولة كامل وتحدى أكثر من فريق</p>
          <p style={{ ...bodyText, color: "rgba(241,225,148,0.42)", marginTop: 8, fontStyle: "italic" }}>
            يفضل يكون الفريق شخصين لزيادة الحماس 🔥
          </p>
          <PlaceholderImg label="شجرة البطولة" />
        </LandingSection>

        <Divider/>

        {/* ── Contact ── */}
        <ContactSection />

        <div style={{ height: 60 }} />
      </div>

    </div>
  );
}

/* ── shared style ── */
const bodyText = {
  color: "rgba(241,225,148,0.72)",
  fontSize: "clamp(0.88rem,1.5vw,1.05rem)",
  lineHeight: 1.75,
  fontFamily: "Cairo, sans-serif",
  fontWeight: 500,
  margin: 0,
};

function Divider() {
  return <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(241,225,148,0.10),transparent)", margin: "0 5%" }} />;
}

function PlaceholderImg({ label }) {
  return (
    <div style={{
      marginTop: 20, borderRadius: 16,
      background: "rgba(241,225,148,0.04)",
      border: "1.5px dashed rgba(241,225,148,0.14)",
      height: 120, display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(241,225,148,0.22)", fontSize: "0.78rem", fontWeight: 700,
      fontFamily: "Cairo, sans-serif", letterSpacing: "0.08em",
    }}>
      {label}
    </div>
  );
}

function LandingSection({ icon, title, children, accent }) {
  const ref = useFadeIn();
  return (
    <section
      ref={ref}
      className="hj-fade"
      style={{
        maxWidth: 680, margin: "0 auto",
        padding: "clamp(36px,6vw,64px) clamp(20px,5vw,40px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <span style={{ fontSize: "1.6rem" }}>{icon}</span>
        <h2 style={{
          fontFamily: "Cairo, sans-serif", fontWeight: 900, margin: 0,
          fontSize: "clamp(1.3rem,2.5vw,1.8rem)",
          color: accent ? "#F1E194" : "rgba(241,225,148,0.92)",
          textShadow: accent ? "0 0 24px rgba(241,225,148,0.35)" : "none",
        }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ContactSection() {
  const ref = useFadeIn();
  return (
    <section
      ref={ref}
      className="hj-fade"
      style={{
        maxWidth: 680, margin: "0 auto",
        padding: "clamp(36px,6vw,64px) clamp(20px,5vw,40px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <span style={{ fontSize: "1.6rem" }}>📬</span>
        <h2 style={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, margin: 0, fontSize: "clamp(1.3rem,2.5vw,1.8rem)", color: "rgba(241,225,148,0.92)" }}>تواصل معنا</h2>
      </div>
      <p style={bodyText}>عندك اقتراح أو فكرة؟ تواصل معنا</p>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { icon: "✉️", label: "البريد الإلكتروني", value: "hujjahgame@gmail.com", href: "mailto:hujjahgame@gmail.com" },
          { icon: "📸", label: "انستقرام",           value: "hujjah.game",          href: "https://instagram.com/hujjah.game" },
          { icon: "🎵", label: "تيك توك",            value: "huajjh.game",          href: "https://tiktok.com/@huajjh.game" },
        ].map(({ icon, label, value, href }) => (
          <a
            key={value}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", borderRadius: 14,
              background: "rgba(241,225,148,0.05)",
              border: "1px solid rgba(241,225,148,0.12)",
              textDecoration: "none", transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(241,225,148,0.32)"; e.currentTarget.style.background="rgba(241,225,148,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(241,225,148,0.12)"; e.currentTarget.style.background="rgba(241,225,148,0.05)"; }}
          >
            <span style={{ fontSize: "1.2rem" }}>{icon}</span>
            <div>
              <div style={{ fontSize: "0.68rem", color: "rgba(241,225,148,0.38)", fontWeight: 700, fontFamily: "Cairo, sans-serif", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(241,225,148,0.82)", fontWeight: 700, fontFamily: "Cairo, sans-serif" }}>{value}</div>
            </div>
          </a>
        ))}
      </div>
      <p style={{ ...bodyText, marginTop: 20, color: "rgba(241,225,148,0.38)", fontSize: "0.8rem" }}>
        تابعنا عشان تشوف أحدث الفئات والتحديات
      </p>
    </section>
  );
}
