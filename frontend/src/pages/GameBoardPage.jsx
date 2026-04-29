import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API          = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900]; /* 300 top → 900 bottom */

/* ─────────────────────────────────────────────────────────────────────
   ANIMATED SCORE COUNTER
───────────────────────────────────────────────────────────────────── */
function ScoreCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const delta = value - prev.current, steps = 16;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (delta * i) / steps));
      if (i >= steps) { clearInterval(t); setDisplay(value); prev.current = value; }
    }, 28);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display}</span>;
}

/* ─────────────────────────────────────────────────────────────────────
   CONFETTI
───────────────────────────────────────────────────────────────────── */
function fireConfetti() {
  const colors = ["#d4af37","#f1c40f","#e74c3c","#27ae60","#a78bfa","#fff","#ff6b6b"];
  for (let i = 0; i < 100; i++) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed", top: "-12px",
      left: Math.random() * 100 + "vw",
      width:  (Math.random() * 9 + 4) + "px",
      height: (Math.random() * 9 + 4) + "px",
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: Math.random() > .5 ? "50%" : "3px",
      animation: `hj-fall ${Math.random() * 3 + 2}s ${Math.random()}s linear forwards`,
      zIndex: 9999, pointerEvents: "none",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  }
}

/* ─────────────────────────────────────────────────────────────────────
   DIFFICULTY PALETTE
───────────────────────────────────────────────────────────────────── */
const DP = {
  300: {
    on:     { bg: "linear-gradient(180deg,rgba(212,175,55,.30) 0%,rgba(212,175,55,.10) 100%)", border: "rgba(212,175,55,.75)", text: "#f5e090", glow: "0 0 22px rgba(212,175,55,.55),0 0 8px rgba(212,175,55,.3),inset 0 1px 0 rgba(255,255,255,.16)" },
    off:    { bg: "rgba(0,0,0,.3)",                                                           border: "rgba(212,175,55,.14)", text: "rgba(212,175,55,.2)",  glow: "none" },
    spent:  { bg: "rgba(255,255,255,.03)",                                                    border: "rgba(255,255,255,.06)", text: "rgba(255,255,255,.12)", glow: "none" },
  },
  600: {
    on:     { bg: "linear-gradient(180deg,rgba(230,126,34,.30) 0%,rgba(230,126,34,.10) 100%)", border: "rgba(230,126,34,.75)", text: "#ffb06a", glow: "0 0 22px rgba(230,126,34,.55),0 0 8px rgba(230,126,34,.3),inset 0 1px 0 rgba(255,255,255,.14)" },
    off:    { bg: "rgba(0,0,0,.3)",                                                            border: "rgba(230,126,34,.14)", text: "rgba(230,126,34,.2)",  glow: "none" },
    spent:  { bg: "rgba(255,255,255,.03)",                                                     border: "rgba(255,255,255,.06)", text: "rgba(255,255,255,.12)", glow: "none" },
  },
  900: {
    on:     { bg: "linear-gradient(180deg,rgba(192,57,43,.30) 0%,rgba(192,57,43,.10) 100%)", border: "rgba(192,57,43,.75)", text: "#ff8f8f", glow: "0 0 22px rgba(192,57,43,.55),0 0 8px rgba(192,57,43,.3),inset 0 1px 0 rgba(255,255,255,.12)" },
    off:    { bg: "rgba(0,0,0,.3)",                                                          border: "rgba(192,57,43,.14)", text: "rgba(192,57,43,.2)",  glow: "none" },
    spent:  { bg: "rgba(255,255,255,.03)",                                                    border: "rgba(255,255,255,.06)", text: "rgba(255,255,255,.12)", glow: "none" },
  },
};

/* ─────────────────────────────────────────────────────────────────────
   CATEGORY CARD
   ┌──────────┬─────────────────────┬──────────┐
   │  T1 COL  │   IMAGE  +  NAME   │  T2 COL  │
   │  [300]   │  ┌─────────────┐   │  [300]   │
   │  [600]   │  │  cat image  │   │  [600]   │
   │  [900]   │  └─────────────┘   │  [900]   │
   │          │   category name    │          │
   └──────────┴─────────────────────┴──────────┘
───────────────────────────────────────────────────────────────────── */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const [imgErr, setImgErr] = useState(false);

  const tileKey  = (d, s) => `${cat.id}_${d}_${s}`;
  const isUsed   = (d, s) => isTileUsed(tileKey(d, s));
  const bothDone = (d)    => isUsed(d, 1) && isUsed(d, 2);
  const allDone  = DIFFICULTIES.every(d => bothDone(d));

  /* ── single pill button ── */
  function Pill({ diff, slot }) {
    const k         = tileKey(diff, slot);
    const used      = isUsed(diff, slot);
    const gone      = bothDone(diff);
    const loading   = clickingTile === k;
    const myTurn    = currentTurn === slot;
    const disabled  = used || gone || !!clickingTile || !myTurn;

    const p = used || gone ? DP[diff].spent : myTurn ? DP[diff].on : DP[diff].off;

    return (
      <button
        data-testid={`tile-${cat.id}-${diff}-${slot}`}
        disabled={disabled}
        onClick={() => myTurn && !used && !gone && onTileClick(cat.id, diff, slot)}
        style={{
          width: "100%",
          height: 50,
          borderRadius: 25,
          background: p.bg,
          border: `1.5px solid ${p.border}`,
          color: p.text,
          boxShadow: p.glow,
          fontFamily: "'Cairo', sans-serif",
          fontWeight: 900,
          fontSize: "clamp(.78rem,.95vw,.92rem)",
          letterSpacing: ".02em",
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "transform .14s cubic-bezier(.34,1.56,.64,1), filter .14s, box-shadow .14s",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={e => {
          if (myTurn && !used && !gone) {
            e.currentTarget.style.transform = "scale(1.07) translateY(-2px)";
            e.currentTarget.style.filter    = "brightness(1.28)";
          }
        }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.filter = ""; }}
        onMouseDown={e  => { if (myTurn && !used && !gone) e.currentTarget.style.transform = "scale(.91)"; }}
        onMouseUp={e    => { e.currentTarget.style.transform = ""; }}
      >
        {loading
          ? <span style={{ animation: "hj-spin .7s linear infinite", display: "inline-block" }}>◌</span>
          : used
          ? <span style={{ opacity: .32, fontSize: ".95rem" }}>✓</span>
          : diff}
      </button>
    );
  }

  /* ── vertical column of pills for one team ── */
  const TCLR = {
    1: { live: "#e74c3c", dim: "rgba(231,76,60,.5)" },
    2: { live: "#27ae60", dim: "rgba(39,174,96,.5)"  },
  };

  function PillColumn({ slot }) {
    const tc      = TCLR[slot];
    const active  = currentTurn === slot;

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",      /* VERTICAL — 300 top, 600 mid, 900 bottom */
        alignItems: "stretch",
        gap: 8,
        width: 70,
        flexShrink: 0,
        paddingTop: 2,
      }}>
        {/* Team indicator above pills */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          height: 18,
          marginBottom: 2,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: active ? tc.live : tc.dim,
            boxShadow: active ? `0 0 10px ${tc.live}` : "none",
            animation: active ? "hj-pulse 1.4s ease-in-out infinite" : "none",
            transition: "all .3s",
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: ".58rem", fontWeight: 800,
            color: active ? tc.live : tc.dim,
            fontFamily: "Cairo, sans-serif",
            letterSpacing: ".06em",
            transition: "color .3s",
          }}>
            {slot === 1 ? "الفريق ١" : "الفريق ٢"}
          </span>
        </div>

        {/* 300 → 600 → 900 stacked vertically */}
        {DIFFICULTIES.map(d => <Pill key={d} diff={d} slot={slot} />)}
      </div>
    );
  }

  /* ── card shell ── */
  const cardShadow = "0 8px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.12), inset 0 0 0 1px rgba(255,255,255,.04)";

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        borderRadius: 24,
        overflow: "hidden",
        border: allDone
          ? "1px solid rgba(255,255,255,.07)"
          : "1px solid rgba(212,175,55,.32)",
        opacity: allDone ? .34 : 1,
        display: "flex",
        flexDirection: "row",         /* LEFT PILLS | CENTER | RIGHT PILLS */
        alignItems: "stretch",
        background: "rgba(255,255,255,.07)",
        backdropFilter: "blur(22px) saturate(1.6)",
        WebkitBackdropFilter: "blur(22px) saturate(1.6)",
        boxShadow: cardShadow,
        transition: "transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s",
      }}
      onMouseEnter={e => {
        if (!allDone) {
          e.currentTarget.style.transform = "translateY(-5px) scale(1.014)";
          e.currentTarget.style.boxShadow = "0 24px 70px rgba(0,0,0,.72), 0 0 0 1px rgba(212,175,55,.3), inset 0 1px 0 rgba(255,255,255,.07)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = cardShadow;
      }}
    >
      {/* golden top-edge shimmer */}
      {!allDone && (
        <div style={{
          position: "absolute", top: 0, left: "12%", right: "12%", height: 1, zIndex: 4,
          background: "linear-gradient(90deg,transparent,rgba(212,175,55,.5),transparent)",
          pointerEvents: "none",
        }} />
      )}

      {/* ── LEFT COLUMN — Team 1 ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 10px 16px 16px",
        zIndex: 2,
        borderRight: "1px solid rgba(255,255,255,.04)",
        flexShrink: 0,
      }}>
        <PillColumn slot={1} />
      </div>

      {/* ── CENTER — Image + Name ── */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 10px",
        gap: 10,
        zIndex: 2,
      }}>
        {/* image frame */}
        <div style={{
          width: "100%",
          flex: 1,
          minHeight: 0,
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 8px 36px rgba(0,0,0,.72), 0 0 0 1px rgba(212,175,55,.1), 0 0 0 4px rgba(0,0,0,.3)",
        }}>
          {cat.image_url && !imgErr ? (
            <img
              src={cat.image_url}
              alt={cat.name}
              onError={() => setImgErr(true)}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                filter: "brightness(.62) saturate(.82) contrast(1.05)",
                display: "block",
              }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(160deg,#1a1830,#100e1a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.8rem",
            }}>
              {cat.icon || "🎯"}
            </div>
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg,rgba(0,0,0,.22) 0%,transparent 38%,transparent 56%,rgba(0,0,0,.48) 100%)",
          }} />
        </div>

        {/* category name */}
        <div style={{
          fontFamily: "'Cairo', sans-serif",
          fontWeight: 900,
          fontSize: "clamp(.72rem,1vw,.92rem)",
          color: "#f5e090",
          textAlign: "center",
          textShadow: "0 0 16px rgba(212,175,55,.52), 0 2px 6px rgba(0,0,0,.9)",
          letterSpacing: ".04em",
          lineHeight: 1.3,
          display: "flex",
          alignItems: "center",
          gap: 7,
          flexShrink: 0,
          paddingBottom: 2,
        }}>
          <span style={{ color: "rgba(212,175,55,.38)", fontSize: ".56em" }}>✦</span>
          {cat.name}
          <span style={{ color: "rgba(212,175,55,.38)", fontSize: ".56em" }}>✦</span>
        </div>
      </div>

      {/* ── RIGHT COLUMN — Team 2 ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 16px 16px 10px",
        zIndex: 2,
        borderLeft: "1px solid rgba(255,255,255,.04)",
        flexShrink: 0,
      }}>
        <PillColumn slot={2} />
      </div>

      {/* all-done veil */}
      {allDone && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,.52)", backdropFilter: "blur(7px)", borderRadius: 24,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            border: "2px solid rgba(212,175,55,.4)",
            background: "rgba(212,175,55,.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.4rem", color: "#d4af37",
          }}>✓</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ESPORTS SCORE BADGE
───────────────────────────────────────────────────────────────────── */
function ScoreBadge({ name, score, active, side, testId }) {
  const isRed   = side === "left";
  const rawRgb  = isRed ? "231,76,60" : "39,174,96";
  const accent  = isRed ? "#e74c3c"   : "#27ae60";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: side === "left" ? "flex-start" : "flex-end",
      gap: 3,
      padding: "10px 20px",
      borderRadius: 18,
      background: active
        ? `rgba(${rawRgb},.1)`
        : `rgba(${rawRgb},.05)`,
      border: `1.5px solid rgba(${rawRgb},${active ? ".52" : ".18"})`,
      boxShadow: active
        ? `0 0 0 1px rgba(${rawRgb},.1), 0 0 36px rgba(${rawRgb},.18), inset 0 1px 0 rgba(255,255,255,.04)`
        : "inset 0 1px 0 rgba(255,255,255,.02)",
      transition: "border-color .35s, box-shadow .35s, background .35s",
      minWidth: 150,
    }}>
      {/* name row */}
      <div style={{
        display: "flex", alignItems: "center",
        gap: 6,
        flexDirection: side === "left" ? "row" : "row-reverse",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: active ? accent : `rgba(${rawRgb},.32)`,
          boxShadow: active ? `0 0 12px ${accent}` : "none",
          animation: active ? "hj-pulse 1.4s ease-in-out infinite" : "none",
          flexShrink: 0,
          transition: "all .35s",
        }} />
        <span style={{
          fontSize: ".72rem", fontWeight: 800,
          color: active ? `rgba(${rawRgb},.92)` : `rgba(${rawRgb},.5)`,
          letterSpacing: ".07em",
          fontFamily: "Cairo, sans-serif",
          transition: "color .35s",
          whiteSpace: "nowrap",
        }}>{name}</span>
      </div>

      {/* score */}
      <div
        data-testid={testId}
        style={{
          fontSize: "clamp(1.8rem,2.5vw,2.6rem)",
          fontWeight: 900,
          color: "#f0ece0",
          lineHeight: 1,
          letterSpacing: "-.02em",
          fontFamily: "Cairo, sans-serif",
          textShadow: active ? `0 0 22px rgba(${rawRgb},.35)` : "none",
          transition: "text-shadow .35s",
          textAlign: side === "left" ? "left" : "right",
        }}
      >
        <ScoreCounter value={score} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN GAME BOARD PAGE
═══════════════════════════════════════════════════════════════════ */
export default function GameBoardPage() {
  const navigate = useNavigate();
  const {
    session, resetGame, currentTurn, markTileUsed, isTileUsed,
    teamScores, saveSession, gameMode, tournamentState,
  } = useGame();

  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWinner,     setShowWinner]     = useState(false);
  const [clickingTile,   setClickingTile]   = useState(null);

  const team1Name = session?.team1_name || "الفريق الأحمر";
  const team2Name = session?.team2_name || "الفريق الأخضر";

  // eslint-disable-next-line
  useEffect(() => { if (!session) { navigate("/"); return; } loadBoard(); }, []);

  const loadBoard = async () => {
    const allIds = [...(session?.team1_categories || []), ...(session?.team2_categories || [])];
    const { data: all } = await axios.get(`${API}/categories`);
    setCategories(allIds.map(id => all.find(c => c.id === id)).filter(Boolean));
    setLoading(false);
  };

  const refreshScores = useCallback(async () => {
    if (!session?.id) return;
    try {
      const { data } = await axios.get(`${API}/game/session/${session.id}`);
      saveSession({ ...session, team1_score: data.team1_score, team2_score: data.team2_score });
    } catch {}
  }, [session, saveSession]);

  useEffect(() => {
    const iv = setInterval(refreshScores, 4000);
    return () => clearInterval(iv);
  }, [refreshScores]);

  useEffect(() => {
    const h = () => refreshScores();
    window.addEventListener("scoreUpdated", h);
    return () => window.removeEventListener("scoreUpdated", h);
  }, [refreshScores]);

  const handleTileClick = async (catId, difficulty, slot) => {
    const k = `${catId}_${difficulty}_${slot}`;
    if (isTileUsed(k) || clickingTile) return;
    setClickingTile(k);
    markTileUsed(k);
    try {
      const { data: q } = await axios.post(
        `${API}/game/session/${session.id}/question?category_id=${catId}&difficulty=${difficulty}`
      );
      navigate("/question", {
        state: { question: q, catId, difficulty, slot, catName: categories.find(c => c.id === catId)?.name, turnTeam: currentTurn },
      });
    } catch {
      toast.error("لا يوجد أسئلة متاحة لهذه الفئة!");
    } finally {
      setClickingTile(null);
    }
  };

  const handleEndGame = () => { fireConfetti(); setShowEndConfirm(false); setShowWinner(true); };

  /* ── loading screen ── */
  if (loading) return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#07080d", fontFamily: "Cairo, sans-serif", gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        border: "2px solid rgba(212,175,55,.18)",
        borderTop: "2px solid #d4af37",
        animation: "hj-spin .9s linear infinite",
      }} />
      <span style={{ color: "rgba(212,175,55,.65)", fontSize: "1rem", fontWeight: 700, letterSpacing: ".06em" }}>
        جاري التحميل…
      </span>
    </div>
  );

  const allUsed = categories.every(c =>
    DIFFICULTIES.every(d => isTileUsed(`${c.id}_${d}_1`) && isTileUsed(`${c.id}_${d}_2`))
  );
  const winner = (allUsed || showWinner)
    ? (teamScores.team1 > teamScores.team2 ? team1Name
       : teamScores.team2 > teamScores.team1 ? team2Name
       : "تعادل")
    : null;

  /* ── modal wrapper ── */
  const Modal = ({ children }) => (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, background: "rgba(4,5,10,.92)",
      backdropFilter: "blur(22px)",
    }}>
      <div style={{
        background: "rgba(11,11,20,.98)",
        border: "1px solid rgba(212,175,55,.2)",
        borderRadius: 24,
        padding: "clamp(24px,3.5vw,46px)",
        maxWidth: 390, width: "100%",
        textAlign: "center",
        boxShadow: "0 36px 100px rgba(0,0,0,.88), inset 0 1px 0 rgba(255,255,255,.04)",
        fontFamily: "Cairo, sans-serif",
        animation: "hj-fadein .28s cubic-bezier(.22,1,.36,1) both",
      }}>
        {children}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;700;800;900&display=swap" />
      <style>{`
        @keyframes hj-fall    { to { transform:translateY(110vh) rotate(560deg); opacity:0; } }
        @keyframes hj-fadein  { from { opacity:0; transform:translateY(20px) scale(.96); } to { opacity:1; transform:none; } }
        @keyframes hj-pulse   { 0%,100%{opacity:1} 50%{opacity:.22} }
        @keyframes hj-winner  { from{opacity:0;transform:scale(.84)} to{opacity:1;transform:none} }
        @keyframes hj-spin    { to{transform:rotate(360deg)} }
        @keyframes hj-card    { from{opacity:0;transform:translateY(22px) scale(.96)} to{opacity:1;transform:none} }
        * { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; }
      `}</style>

      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0c0d14",
        backgroundImage: [
          "radial-gradient(ellipse 80% 55% at 50% -8%, rgba(212,175,55,.14) 0%, transparent 65%)",
          "radial-gradient(ellipse 55% 40% at 92% 105%, rgba(99,102,241,.07) 0%, transparent 60%)",
          "radial-gradient(ellipse 42% 38% at 8%  100%, rgba(231,76,60,.06) 0%, transparent 58%)",
        ].join(","),
        direction: "rtl",
        fontFamily: "Cairo, sans-serif",
        color: "#f0ece0",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* ── classical background ── */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "url('/roman-bg.jpg')",
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: .18,
          filter: "blur(5px) grayscale(50%) sepia(15%)",
        }} />
        {/* dark overlay so background doesn't distract */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(7,8,13,.72) 0%, rgba(7,8,13,.62) 50%, rgba(7,8,13,.78) 100%)",
        }} />
        {/* subtle noise */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          opacity: .022,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px",
        }} />

        {/* ══════════════════════════════════════════════════════════
            HEADER — esports scoreboard
        ══════════════════════════════════════════════════════════ */}
        <header style={{
          position: "relative", zIndex: 10, flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
          padding: "10px 22px",
          background: "rgba(255,255,255,.06)",
          borderBottom: "1px solid rgba(212,175,55,.2)",
          backdropFilter: "blur(28px) saturate(1.6)",
          WebkitBackdropFilter: "blur(28px) saturate(1.6)",
          boxShadow: "0 6px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08), inset 0 -1px 0 rgba(212,175,55,.1)",
        }}>

          {/* Team 1 */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <ScoreBadge
              name={team1Name}
              score={teamScores.team1}
              active={currentTurn === 1}
              side="left"
              testId="team1-score"
            />
          </div>

          {/* Center */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{
              fontFamily: "'Cairo', 'Tajawal', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(1.85rem,2.5vw,2.7rem)",
              background: "linear-gradient(160deg,#f5e090 0%,#d4af37 45%,#8b6a10 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0",
              lineHeight: 1.5,
              padding: "0 6px",
              overflow: "visible",
              filter: "drop-shadow(0 0 18px rgba(212,175,55,.5))",
            }}>حُجّة</div>

            <div
              data-testid="turn-indicator"
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "3px 16px", borderRadius: 99,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(212,175,55,.17)",
                fontSize: ".7rem", fontWeight: 700,
                color: "rgba(212,175,55,.78)",
                letterSpacing: ".04em", whiteSpace: "nowrap",
              }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: currentTurn === 1 ? "#e74c3c" : "#27ae60",
                animation: "hj-pulse 1.4s ease-in-out infinite",
              }} />
              دور {currentTurn === 1 ? team1Name : team2Name}
            </div>
          </div>

          {/* Team 2 + End */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
            <ScoreBadge
              name={team2Name}
              score={teamScores.team2}
              active={currentTurn === 2}
              side="right"
              testId="team2-score"
            />
            <button
              data-testid="end-game-btn"
              onClick={() => setShowEndConfirm(true)}
              style={{
                padding: "9px 14px", borderRadius: 11,
                background: "rgba(192,57,43,.07)",
                border: "1px solid rgba(192,57,43,.28)",
                color: "rgba(231,76,60,.7)",
                fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: ".78rem",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                transition: "all .22s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(192,57,43,.16)"; e.currentTarget.style.color = "#e74c3c"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(192,57,43,.07)"; e.currentTarget.style.color = "rgba(231,76,60,.7)"; }}
            >✕ إنهاء</button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════
            BOARD — 3 columns × 2 rows
        ══════════════════════════════════════════════════════════ */}
        <main style={{
          position: "relative", zIndex: 1,
          flex: 1, minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          gridTemplateRows:    "repeat(2, minmax(0,1fr))",
          gap: 14,
          padding: "14px 20px 18px",
        }}>
          {categories.slice(0, 6).map((cat, i) => (
            <div
              key={cat.id}
              style={{ animation: `hj-card .46s ${i * .072}s cubic-bezier(.22,1,.36,1) both`, height: "100%" }}
            >
              <CategoryCard
                cat={cat}
                isTileUsed={isTileUsed}
                clickingTile={clickingTile}
                currentTurn={currentTurn}
                onTileClick={handleTileClick}
              />
            </div>
          ))}
        </main>

        {/* ── all-done banner ── */}
        {allUsed && !showWinner && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
            padding: "16px", textAlign: "center",
            background: "rgba(7,8,13,.97)",
            borderTop: "1px solid rgba(212,175,55,.16)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 -8px 48px rgba(0,0,0,.55)",
          }}>
            <div style={{ fontWeight: 900, fontSize: "1.08rem", color: "#d4af37", marginBottom: 12 }}>
              {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
            </div>
            <button
              onClick={() => { fireConfetti(); setShowWinner(true); }}
              style={{
                padding: "12px 34px", borderRadius: 13,
                fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: ".95rem",
                background: "linear-gradient(135deg,#d4af37,#8b6a10)",
                color: "#0a0900", border: "none", cursor: "pointer",
                boxShadow: "0 6px 28px rgba(212,175,55,.4)",
              }}
            >عرض النتيجة النهائية</button>
          </div>
        )}

        {/* ── end-game confirm ── */}
        {showEndConfirm && (
          <Modal>
            <div style={{ fontSize: "2.2rem", marginBottom: 12 }}>⚔️</div>
            <div style={{ fontWeight: 900, fontSize: "1.28rem", color: "#f0ece0", marginBottom: 8 }}>إنهاء اللعبة؟</div>
            <div style={{ fontSize: ".82rem", color: "rgba(240,236,224,.32)", marginBottom: 28 }}>سيتم إعلان الفائز الحالي</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={handleEndGame} style={{ padding:"11px 26px", borderRadius:11, fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:".92rem", background:"rgba(192,57,43,.12)", color:"#e74c3c", border:"1px solid rgba(192,57,43,.42)", cursor:"pointer" }}>
                نعم، إنهاء
              </button>
              <button onClick={() => setShowEndConfirm(false)} style={{ padding:"11px 26px", borderRadius:11, fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:".92rem", background:"transparent", color:"rgba(240,236,224,.32)", border:"1px solid rgba(255,255,255,.1)", cursor:"pointer" }}>
                رجوع
              </button>
            </div>
          </Modal>
        )}

        {/* ── winner screen ── */}
        {showWinner && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 70,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 28, textAlign: "center",
            background: "rgba(5,6,11,.97)", backdropFilter: "blur(36px)",
            animation: "hj-winner .5s cubic-bezier(.22,1,.36,1) both",
            fontFamily: "Cairo, sans-serif",
          }}>
            <div style={{ fontSize: "clamp(3rem,7.5vw,5.5rem)", marginBottom: 10 }}>🏆</div>
            <div style={{ fontSize: ".8rem", fontWeight: 700, color: "rgba(212,175,55,.4)", marginBottom: 8, letterSpacing: ".09em" }}>الفائز</div>
            <div style={{
              fontWeight: 900, fontSize: "clamp(2.2rem,5vw,4.5rem)",
              background: "linear-gradient(160deg,#f5e090,#d4af37,#8b6a10)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              marginBottom: 34, lineHeight: 1.1,
              filter: "drop-shadow(0 0 26px rgba(212,175,55,.58))",
            }}>
              {winner === "تعادل" ? "🤝 تعادل!" : winner}
            </div>

            <div style={{ display: "flex", gap: 22, marginBottom: 38 }}>
              {[{ name: team1Name, score: teamScores.team1, c: "#e74c3c" }, { name: team2Name, score: teamScores.team2, c: "#27ae60" }]
                .map(({ name, score, c }) => (
                  <div key={name} style={{
                    textAlign: "center", borderRadius: 18, padding: "18px 30px",
                    background: "rgba(255,255,255,.04)",
                    border: `1px solid ${c}33`,
                    boxShadow: `0 0 28px ${c}1a`,
                  }}>
                    <div style={{ fontSize: ".75rem", fontWeight: 700, color: c, marginBottom: 8, letterSpacing: ".05em" }}>{name}</div>
                    <div style={{ fontSize: "2.3rem", fontWeight: 900, color: "#f0ece0" }}>{score}</div>
                  </div>
                ))}
            </div>

            <button
              onClick={() => {
                if (gameMode === "tournament") {
                  const ref = tournamentState?.currentMatchRef;
                  if (ref) {
                    const w = teamScores.team1 >= teamScores.team2 ? ref.team1Id : ref.team2Id;
                    navigate("/tournament/bracket", { state: { autoRecord: { roundIdx: ref.roundIdx, matchIdx: ref.matchIdx, winnerId: w } } });
                  } else {
                    navigate("/tournament/bracket");
                  }
                } else {
                  resetGame();
                  navigate("/");
                }
              }}
              style={{
                padding: "14px 50px", borderRadius: 13,
                fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: "1rem",
                background: "linear-gradient(135deg,#d4af37,#8b6a10)",
                color: "#0a0900", border: "none", cursor: "pointer",
                boxShadow: "0 6px 34px rgba(212,175,55,.4)",
              }}
            >
              {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
            </button>
          </div>
        )}

      </div>
    </>
  );
}
