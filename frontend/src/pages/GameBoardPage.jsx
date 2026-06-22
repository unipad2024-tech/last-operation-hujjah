import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];
const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";

/* ══════════════════════════════════════
   DESIGN TOKENS — Classical Roman / Parchment
══════════════════════════════════════ */
const C = {
  parchment:    "#FAF9F6",
  parchmentDk:  "#F0EDE4",
  parchmentBdr: "#E8E0D0",
  gold:         "#C9A84C",
  goldLight:    "#DAA520",
  goldDark:     "#8B6914",
  bronze:       "#4A3728",
  bronzeDk:     "#2E1E14",
  bronzeLt:     "#7A6250",
  deepBlue:     "#1B2A4A",
  textDark:     "#2C1810",
  textMid:      "#5A3E28",
  cream:        "#FFF8E8",
};

/* ── Bronze coin buttons — dark brown + gold border ── */
const diffStyle = (diff, used) => {
  if (used) return {
    bg:     "rgba(200,185,165,0.45)",
    border: "rgba(145,120,80,0.30)",
    color:  "rgba(80,58,35,0.38)",
    shadow: "inset 0 2px 5px rgba(0,0,0,0.10)",
    hBg:    "rgba(200,185,165,0.45)",
    hSh:    "inset 0 2px 5px rgba(0,0,0,0.10)",
    strike: true,
  };
  if (diff === 300) return {
    bg:     `linear-gradient(175deg,${C.bronzeLt},${C.bronze})`,
    border: C.gold,
    color:  "#FFF5E0",
    shadow: "0 4px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(218,165,32,0.35), inset 0 -2px 3px rgba(0,0,0,0.28)",
    hBg:    "linear-gradient(175deg,#8A7260,#5E4838)",
    hSh:    "0 6px 18px rgba(0,0,0,0.34), inset 0 1px 0 rgba(218,165,32,0.55)",
    strike: false,
  };
  if (diff === 600) return {
    bg:     `linear-gradient(175deg,#5A4530,${C.bronzeDk})`,
    border: C.goldLight,
    color:  "#FFF0D0",
    shadow: "0 4px 10px rgba(0,0,0,0.34), inset 0 1px 0 rgba(184,134,11,0.35), inset 0 -2px 3px rgba(0,0,0,0.32)",
    hBg:    "linear-gradient(175deg,#6A5540,#4A3528)",
    hSh:    "0 6px 18px rgba(0,0,0,0.40), inset 0 1px 0 rgba(184,134,11,0.55)",
    strike: false,
  };
  return {
    bg:     `linear-gradient(175deg,#3A2518,#160C04)`,
    border: C.goldDark,
    color:  "#EED090",
    shadow: "0 4px 10px rgba(0,0,0,0.42), inset 0 1px 0 rgba(139,105,20,0.38), inset 0 -2px 3px rgba(0,0,0,0.38)",
    hBg:    "linear-gradient(175deg,#4A3528,#2E2018)",
    hSh:    "0 6px 18px rgba(0,0,0,0.50), inset 0 1px 0 rgba(139,105,20,0.55)",
    strike: false,
  };
};

/* ── Card ornate frame ── */
const cardFrame = (hover = false) => ({
  background:   C.parchment,
  border:       `3px solid ${hover ? C.goldLight : C.gold}`,
  borderRadius: "18px",
  boxShadow: hover
    ? `0 0 0 1.5px ${C.goldLight}, 6px 6px 0 3px ${C.goldDark}, 0 16px 48px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(218,165,32,0.30)`
    : `0 0 0 1px ${C.gold}, 4px 4px 0 2px ${C.goldDark}, 0 8px 28px rgba(0,0,0,0.16), inset 0 0 0 1px rgba(218,165,32,0.18)`,
});

/* ══════════════════════════════════════
   SCORE COUNTER
══════════════════════════════════════ */
function ScoreCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (value === prev.current) return;
    setPop(true);
    const delta = value - prev.current, steps = 12;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (delta * i) / steps));
      if (i >= steps) { clearInterval(iv); setDisplay(value); setPop(false); prev.current = value; }
    }, 40);
    return () => clearInterval(iv);
  }, [value]);

  return (
    <span className={`inline-block tabular-nums transition-transform duration-150 ${pop ? "scale-125" : ""}`}>
      {display}
    </span>
  );
}

/* ══════════════════════════════════════
   CONFETTI
══════════════════════════════════════ */
function fireConfetti() {
  const colors = ["#C9A84C", "#B8860B", "#8B0000", "#1B2A4A", "#DAA520", "#4A3728"];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    Object.assign(el.style, {
      position: "fixed", top: "-20px", pointerEvents: "none", zIndex: "9999",
      left:   Math.random() * 100 + "vw",
      width:  (Math.random() * 10 + 5) + "px",
      height: (Math.random() * 10 + 5) + "px",
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: Math.random() > 0.5 ? "50%" : "3px",
      animation: `confettiFall ${Math.random() * 3 + 2}s ${Math.random()}s linear forwards`,
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5500);
  }
}

/* ══════════════════════════════════════
   BRONZE COIN SCORE BUTTON
══════════════════════════════════════ */
function ScoreBtn({ catId, diff, slot, used, clicking, onClick }) {
  const key = `${catId}_${diff}_${slot}`;
  const isClicking = clicking === key;
  const s = diffStyle(diff, used);

  return (
    <button
      data-testid={`tile-${catId}-${diff}-${slot}`}
      onClick={onClick}
      disabled={used || !!clicking}
      style={{
        width:          "68px",
        padding:        "12px 0",
        background:     s.bg,
        color:          s.color,
        border:         `2px solid ${s.border}`,
        borderRadius:   "999px",
        fontSize:       "0.87rem",
        fontWeight:     800,
        fontFamily:     "'Noto Naskh Arabic','Amiri',serif",
        cursor:         used ? "not-allowed" : "pointer",
        boxShadow:      s.shadow,
        transition:     "all 0.18s cubic-bezier(0.34,1.4,0.64,1)",
        lineHeight:     1,
        textDecoration: s.strike ? "line-through" : "none",
        userSelect:     "none",
        display:        "block",
        flexShrink:     0,
        letterSpacing:  "-0.01em",
      }}
      onMouseEnter={e => {
        if (!used) {
          e.currentTarget.style.background  = s.hBg;
          e.currentTarget.style.boxShadow   = s.hSh;
          e.currentTarget.style.transform   = "scale(1.08)";
          e.currentTarget.style.borderColor = C.goldLight;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = s.bg;
        e.currentTarget.style.boxShadow   = s.shadow;
        e.currentTarget.style.transform   = "";
        e.currentTarget.style.borderColor = s.border;
      }}
      onMouseDown={e => { if (!used) e.currentTarget.style.transform = "scale(0.94)"; }}
      onMouseUp={e   => { if (!used) e.currentTarget.style.transform = "scale(1.08)"; }}
    >
      {isClicking ? "⏳" : used ? "✓" : diff}
    </button>
  );
}

/* ══════════════════════════════════════
   PARCHMENT CATEGORY CARD
   Layout: [LEFT col vertical] | [CENTER image] | [RIGHT col vertical]
══════════════════════════════════════ */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, doubleNextQ }) {
  const allUsed = DIFFICULTIES.every(d =>
    isTileUsed(`${cat.id}_${d}_1`) && isTileUsed(`${cat.id}_${d}_2`)
  );

  const BtnCol = ({ slot }) => (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      justifyContent: "space-evenly",
      alignItems:     "center",
      width:          "72px",
      flexShrink:     0,
    }}>
      {DIFFICULTIES.map(d => {
        const isUsed = isTileUsed(`${cat.id}_${d}_${slot}`);
        return (
          <div key={`${cat.id}_${d}_${slot}`} style={{ position:"relative" }}>
            <ScoreBtn
              catId={cat.id} diff={d} slot={slot}
              used={isUsed}
              clicking={clickingTile}
              onClick={() => onTileClick(cat.id, d, slot)}
            />
            {doubleNextQ && !isUsed && (
              <div style={{
                position:"absolute", top:-5, right:-5, zIndex:10,
                background:"linear-gradient(135deg,#f5c842,#c9880c)",
                color:"#1a0900", fontSize:"0.44rem", fontWeight:900,
                padding:"2px 5px", borderRadius:999, lineHeight:1.4,
                pointerEvents:"none",
                boxShadow:"0 2px 6px rgba(0,0,0,0.40), 0 0 8px rgba(245,200,66,0.55)",
                letterSpacing:"-0.01em",
              }}>×2</div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className="cat-card"
      style={{
        display:       "flex",
        flexDirection: "row",
        alignItems:    "stretch",
        gap:           "10px",
        padding:       "14px 12px",
        opacity:       allUsed ? 0.42 : 1,
        transition:    "transform 0.28s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.28s ease, border-color 0.28s ease",
        position:      "relative",
        overflow:      "hidden",
        ...cardFrame(),
      }}
    >
      {/* Ornate top gold rule */}
      <div style={{
        position:   "absolute", top: "12px", left: "18%", right: "18%", height: "1px",
        background: `linear-gradient(90deg,transparent,${C.gold},transparent)`,
        pointerEvents: "none",
      }} />

      {/* LEFT button column — slot 1 */}
      <BtnCol slot={1} />

      {/* CENTER — image + category name */}
      <div style={{
        flex:        1,
        borderRadius:"12px",
        overflow:    "hidden",
        position:    "relative",
        border:      `1.5px solid ${C.parchmentBdr}`,
        boxShadow:   `inset 0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.10)`,
        background:  cat.image_url
          ? "transparent"
          : `linear-gradient(145deg,${C.parchmentDk},${C.parchment})`,
        minHeight:   "90px",
      }}>
        {cat.image_url ? (
          <img
            src={cat.image_url}
            alt=""
            aria-hidden="true"
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              display: "block", opacity: 0.90,
              filter: "sepia(0.08) contrast(1.02)",
            }}
          />
        ) : (
          <div style={{
            width:"100%", height:"100%",
            display:"flex", alignItems:"center", justifyContent:"center",
            color: C.gold, fontSize: "2rem", opacity: 0.40,
          }}>✦</div>
        )}

        {/* Bottom name overlay — dark gradient for legibility */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 42%, rgba(44,24,16,0.72) 100%)",
          pointerEvents: "none",
        }} />

        {/* Category name */}
        <div style={{
          position:   "absolute", bottom: 0, left: 0, right: 0,
          padding:    "7px 8px 10px",
          display:    "flex", alignItems: "center", justifyContent: "center", gap: "4px",
          color:      C.cream,
          fontFamily: "'Amiri','Noto Naskh Arabic',serif",
          fontSize:   "clamp(0.72rem,1vw,1rem)",
          fontWeight: 700,
          textAlign:  "center",
          lineHeight: 1.2,
          letterSpacing: "0.03em",
          textShadow: "0 1px 6px rgba(0,0,0,0.80), 0 0 12px rgba(0,0,0,0.60)",
        }}>
          <span style={{ opacity: 0.55, fontSize: "0.5em" }}>✦</span>
          {cat.name}
          <span style={{ opacity: 0.55, fontSize: "0.5em" }}>✦</span>
        </div>
      </div>

      {/* RIGHT button column — slot 2 */}
      <BtnCol slot={2} />
    </div>
  );
}

/* ══════════════════════════════════════
   BRONZE ESPORTS TEAM PANEL
══════════════════════════════════════ */
function TeamPanel({ team, name, score, isActive, icon, reversed, onAdd, onRemove }) {
  const activeGlow = team === 1 ? "rgba(180,50,50,0.22)" : "rgba(50,100,200,0.22)";
  const activeBorder = team === 1 ? "rgba(220,80,80,0.55)" : "rgba(80,140,240,0.55)";
  const activeNameClr = team === 1 ? "#FFB0B0" : "#B0D0FF";

  const adjBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        width: "22px", height: "22px", borderRadius: "6px",
        background: "rgba(218,165,32,0.12)", border: "1px solid rgba(218,165,32,0.30)",
        color: C.goldLight, fontSize: "0.85rem", fontWeight: 900,
        cursor: "pointer", lineHeight: 1, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(218,165,32,0.28)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(218,165,32,0.12)"}
    >
      {label}
    </button>
  );

  return (
    <div
      data-testid={`team${team}-score`}
      style={{
        display:       "flex",
        flexDirection: reversed ? "row-reverse" : "row",
        alignItems:    "center",
        gap:           "12px",
        padding:       "12px 20px",
        borderRadius:  "16px",
        minWidth:      "clamp(185px,19vw,258px)",
        background:    `linear-gradient(160deg,${C.bronzeLt},${C.bronzeDk})`,
        border:        `2px solid ${isActive ? activeBorder : C.gold}`,
        boxShadow:     isActive
          ? `0 0 28px ${activeGlow}, 0 6px 28px rgba(0,0,0,0.40), inset 0 1px 0 rgba(218,165,32,0.22)`
          : `0 6px 28px rgba(0,0,0,0.32), inset 0 1px 0 rgba(218,165,32,0.18)`,
        transition:    "all 0.40s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Name & label */}
      <div style={{ flex: 1, minWidth: 0, textAlign: reversed ? "right" : "left" }}>
        <div style={{ fontSize: "0.55rem", color: "rgba(218,165,32,0.50)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "3px" }}>
          TEAM
        </div>
        <div style={{
          fontSize:       "clamp(0.78rem,1.1vw,0.95rem)",
          fontWeight:     800,
          color:          isActive ? activeNameClr : "rgba(250,240,220,0.80)",
          overflow:       "hidden",
          textOverflow:   "ellipsis",
          whiteSpace:     "nowrap",
          fontFamily:     "Cairo,Tajawal,sans-serif",
          transition:     "color 0.4s ease",
        }}>
          {reversed ? `${name} ${icon}` : `${icon} ${name}`}
        </div>
      </div>

      {/* Score + ±100 controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
        {onRemove && adjBtn("−", onRemove)}
        <div style={{
          fontSize:   "clamp(1.8rem,2.6vw,2.5rem)",
          fontWeight: 900,
          color:      C.goldLight,
          lineHeight: 1,
          textShadow: "0 0 20px rgba(218,165,32,0.40)",
          fontFamily: "Cairo,sans-serif",
          minWidth:   "3ch",
          textAlign:  "center",
        }}>
          <ScoreCounter value={score} />
        </div>
        {onAdd && adjBtn("+", onAdd)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN GAME BOARD
══════════════════════════════════════ */
export default function GameBoardPage() {
  const navigate = useNavigate();
  const {
    session, resetGame, currentTurn,
    markTileUsed, isTileUsed, teamScores,
    saveSession, gameMode, tournamentState,
    switchTurn, updateScore, currentUser,
  } = useGame();

  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWinner, setShowWinner]         = useState(false);
  const [clickingTile, setClickingTile]     = useState(null);
  const [showHostPanel, setShowHostPanel]   = useState(false);
  const [doubleNextQ, setDoubleNextQ]       = useState(false);

  useEffect(() => {
    if (!session) { navigate("/"); return; }
    loadBoard();
  }, []); // eslint-disable-line

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
    const iv = setInterval(refreshScores, 12000); // was 4000ms — 3x reduction in DB polling load
    return () => clearInterval(iv);
  }, [refreshScores]);

  useEffect(() => {
    const h = () => refreshScores();
    window.addEventListener("scoreUpdated", h);
    return () => window.removeEventListener("scoreUpdated", h);
  }, [refreshScores]);

  const handleTileClick = async (catId, difficulty, slot) => {
    const key = `${catId}_${difficulty}_${slot}`;
    if (isTileUsed(key) || clickingTile) return;
    setClickingTile(key);
    markTileUsed(key);
    const wasDouble = doubleNextQ;
    setDoubleNextQ(false);
    try {
      const { data: q } = await axios.post(
        `${API}/game/session/${session.id}/question?category_id=${catId}&difficulty=${difficulty}`
      );
      navigate("/question", {
        state: {
          question: q, catId, difficulty, slot,
          catName: categories.find(c => c.id === catId)?.name,
          turnTeam: currentTurn,
          doubleActive: wasDouble,
        },
      });
    } catch {
      toast.error("لا يوجد أسئلة متاحة لهذه الفئة!");
    } finally {
      setClickingTile(null);
    }
  };

  const handleEndGame = () => { fireConfetti(); setShowEndConfirm(false); setShowWinner(true); };

  /* ── Loading ── */
  if (loading) return (
    <div style={{
      height: "100svh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(rgba(245,235,210,0.88),rgba(235,225,195,0.92)),url("${ROMAN_BG}") center/cover`,
    }}>
      <div style={{
        color: C.bronze, fontFamily: "'Amiri',serif",
        fontSize: "1.4rem", fontWeight: 700,
        animation: "loadPulse 1.5s ease-in-out infinite",
        padding: "16px 32px", borderRadius: "12px",
        background: C.parchment, border: `2px solid ${C.gold}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.14), 4px 4px 0 2px ${C.goldDark}`,
      }}>
        جاري تحميل اللوحة...
      </div>
    </div>
  );

  const allUsed = categories.every(c =>
    DIFFICULTIES.every(d => isTileUsed(`${c.id}_${d}_1`) && isTileUsed(`${c.id}_${d}_2`))
  );
  const winner = allUsed || showWinner
    ? teamScores.team1 > teamScores.team2 ? session?.team1_name
      : teamScores.team2 > teamScores.team1 ? session?.team2_name : "تعادل"
    : null;

  /* ════════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <div style={{
      minHeight:     "100svh",
      display:       "flex",
      flexDirection: "column",
      padding:       "18px 20px",
      gap:           "14px",
      position:      "relative",
      overflow:      "hidden",
    }}>

      {/* ── Global CSS ── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; overflow-x: hidden; }

        body {
          background:
            linear-gradient(rgba(245,235,210,0.72), rgba(235,225,195,0.80)),
            url("${ROMAN_BG}") center / cover fixed no-repeat;
          font-family: "Cairo", "Tajawal", sans-serif;
          color: ${C.textDark};
        }

        /* Parchment card hover — intensify gold frame */
        .cat-card { will-change: transform; }
        .cat-card:hover {
          transform:    translateY(-4px) scale(1.016) !important;
          border-color: ${C.goldLight} !important;
          box-shadow:
            0 0 0 1.5px ${C.goldLight},
            6px 6px 0 3px ${C.goldDark},
            0 16px 52px rgba(0,0,0,0.24),
            inset 0 0 0 1px rgba(218,165,32,0.32) !important;
        }

        @keyframes turnPulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.75; }
        }
        @keyframes dotPulse {
          0%,100% { transform:scale(1); }
          50%      { transform:scale(1.40); }
        }
        @keyframes loadPulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.42; }
        }
        @keyframes confettiFall {
          to { transform:translateY(110vh) rotate(720deg); opacity:0; }
        }
        @keyframes winnerGlow {
          0%,100% { text-shadow: 0 0 30px rgba(218,165,32,0.60), 0 4px 24px rgba(0,0,0,0.70); }
          50%      { text-shadow: 0 0 70px rgba(218,165,32,0.90), 0 0 120px rgba(218,165,32,0.35), 0 4px 24px rgba(0,0,0,0.70); }
        }
        @keyframes winnerFadeIn {
          from { opacity:0; transform:scale(0.88) translateY(16px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>

      {/* ══════════════════════════════
          HEADER
      ══════════════════════════════ */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap:                 "16px",
        alignItems:          "center",
        flexShrink:          0,
      }}>

        {/* Team 1 — left */}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <TeamPanel
            team={1} name={session?.team1_name}
            score={teamScores.team1} isActive={currentTurn === 1}
            icon="🦁" reversed={false}
            onAdd={() => updateScore(1, 100)}
            onRemove={() => updateScore(1, -100)}
          />
        </div>

        {/* Center — emblem + turn + end */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          {/* Title emblem — deep blue with gold frame */}
          <div style={{
            fontFamily:  "'Amiri',serif",
            fontWeight:  900,
            fontSize:    "48px",
            lineHeight:  "1.4",
            letterSpacing: "0.04em",
            color:       C.cream,
            background:  C.deepBlue,
            padding:     "6px 28px 4px",
            borderRadius:"14px",
            border:      `3px solid ${C.gold}`,
            boxShadow:   `0 0 0 1px ${C.goldLight}, 4px 4px 0 2px ${C.goldDark}, 0 8px 28px rgba(0,0,0,0.32), inset 0 1px 0 rgba(218,165,32,0.22)`,
            textShadow:  "0 2px 10px rgba(0,0,0,0.55)",
          }}>حُجّة</div>

          {/* Turn pill — click to switch turn */}
          <div
            data-testid="turn-indicator"
            onClick={switchTurn}
            title="اضغط لتبديل الدور"
            style={{
              display:        "flex", alignItems: "center", gap: "7px",
              borderRadius:   "999px", padding: "6px 18px",
              background:     C.deepBlue,
              border:         `1.5px solid ${currentTurn === 1 ? "rgba(220,80,80,0.65)" : "rgba(80,140,240,0.65)"}`,
              color:          currentTurn === 1 ? "#FFB0B0" : "#B0D0FF",
              fontWeight:     800, fontSize: "clamp(0.68rem,1.1vw,0.84rem)",
              fontFamily:     "Cairo,Tajawal,sans-serif",
              boxShadow:      `0 4px 16px rgba(0,0,0,0.30), 4px 4px 0 2px ${C.goldDark}`,
              animation:      "turnPulse 2.5s ease-in-out infinite",
              whiteSpace:     "nowrap",
              transition:     "border-color 0.4s,color 0.4s",
              cursor:         "pointer",
              userSelect:     "none",
            }}
          >
            <span>{currentTurn === 1 ? "🦁" : "🦅"}</span>
            <span>دور {currentTurn === 1 ? session?.team1_name : session?.team2_name}</span>
          </div>

          {/* End game */}
          <button
            data-testid="end-game-btn"
            onClick={() => setShowEndConfirm(true)}
            style={{
              padding:      "6px 20px", borderRadius: "999px",
              background:   `linear-gradient(135deg,#7A1520,#4A0E14)`,
              border:       `1.5px solid ${C.goldDark}`,
              color:        "rgba(250,240,220,0.85)",
              fontWeight:   700, fontSize: "0.72rem",
              fontFamily:   "Cairo,Tajawal,sans-serif", cursor: "pointer",
              boxShadow:    "0 3px 10px rgba(0,0,0,0.28)",
              transition:   "all 0.18s ease", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#9A1A28,#6A1018)"; e.currentTarget.style.boxShadow = "0 5px 16px rgba(0,0,0,0.36)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg,#7A1520,#4A0E14)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(0,0,0,0.28)"; }}
          >
            إنهاء اللعبة
          </button>

          {/* Double Points Lifeline — activate here before opening a question */}
          <button
            onClick={() => {
              setDoubleNextQ(v => !v);
              if (!doubleNextQ) toast.success("⚡ مضاعفة النقاط مفعّلة — اختر سؤالاً الآن!");
              else toast("تم إلغاء مضاعفة النقاط", { icon: "⚡" });
            }}
            style={{
              display:    "flex", alignItems: "center", gap: "6px",
              padding:    "7px 16px", borderRadius: "999px",
              background: doubleNextQ
                ? "linear-gradient(135deg,rgba(245,200,66,0.28),rgba(245,170,20,0.18))"
                : C.deepBlue,
              border:     `1.5px solid ${doubleNextQ ? C.goldLight : C.goldDark}`,
              color:      doubleNextQ ? C.goldLight : "rgba(245,200,66,0.55)",
              fontWeight: 800, fontSize: "0.72rem",
              fontFamily: "Cairo,Tajawal,sans-serif", cursor: "pointer",
              boxShadow:  doubleNextQ
                ? `0 0 18px rgba(245,200,66,0.40), 4px 4px 0 2px ${C.goldDark}`
                : `0 3px 10px rgba(0,0,0,0.24), 4px 4px 0 2px ${C.goldDark}`,
              transition: "all 0.22s ease", whiteSpace: "nowrap",
              animation:  doubleNextQ ? "turnPulse 1.8s ease-in-out infinite" : "none",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = doubleNextQ ? `0 0 26px rgba(245,200,66,0.55), 4px 4px 0 2px ${C.goldDark}` : `0 5px 16px rgba(0,0,0,0.32), 4px 4px 0 2px ${C.goldDark}`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = doubleNextQ ? `0 0 18px rgba(245,200,66,0.40), 4px 4px 0 2px ${C.goldDark}` : `0 3px 10px rgba(0,0,0,0.24), 4px 4px 0 2px ${C.goldDark}`; }}
          >
            <span style={{ fontSize:"1rem" }}>⚡</span>
            <span>{doubleNextQ ? "✓ مضاعفة فعّالة" : "مضاعفة النقاط"}</span>
          </button>
        </div>

        {/* Team 2 — right */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <TeamPanel
            team={2} name={session?.team2_name}
            score={teamScores.team2} isActive={currentTurn === 2}
            icon="🦅" reversed={true}
            onAdd={() => updateScore(2, 100)}
            onRemove={() => updateScore(2, -100)}
          />
        </div>
      </div>

      {/* ══════════════════════════════
          CATEGORY GRID — 2 rows × 3 cols
      ══════════════════════════════ */}
      <div style={{
        flex:                1,
        minHeight:           0,
        display:             "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gridTemplateRows:    "repeat(2,1fr)",
        gap:                 "16px",
      }}>
        {categories.slice(0, 6).map(cat => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            isTileUsed={isTileUsed}
            clickingTile={clickingTile}
            onTileClick={handleTileClick}
            doubleNextQ={doubleNextQ}
          />
        ))}
      </div>

      {/* ══════════════════════════════
          ALL-USED BANNER
      ══════════════════════════════ */}
      {allUsed && !showWinner && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
          padding: "20px 24px",
          background: `linear-gradient(135deg,${C.deepBlue},#0F1A30)`,
          borderTop: `3px solid ${C.gold}`,
          boxShadow: `0 0 0 1px ${C.goldLight}, 0 -8px 32px rgba(0,0,0,0.30)`,
        }}>
          <div style={{ color: C.goldLight, fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "1.3rem" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "12px 40px", borderRadius: "999px", fontWeight: 900, fontSize: "1rem",
              background: `linear-gradient(135deg,${C.gold},${C.goldLight})`, color: C.bronzeDk,
              border: "none", cursor: "pointer", fontFamily: "Cairo,sans-serif",
              boxShadow: `0 6px 28px rgba(184,134,11,0.50), 4px 4px 0 2px ${C.goldDark}`,
              transition: "all 0.18s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.currentTarget.style.transform = ""}
          >
            عرض النتيجة النهائية
          </button>
        </div>
      )}

      {/* ══════════════════════════════
          END CONFIRM MODAL
      ══════════════════════════════ */}
      {showEndConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          background: "rgba(26,20,12,0.82)", backdropFilter: "blur(10px)",
        }}>
          <div style={{
            borderRadius: "20px", padding: "36px 42px",
            maxWidth: "390px", width: "100%", textAlign: "center",
            background: C.parchment,
            border:     `3px solid ${C.gold}`,
            boxShadow:  `0 0 0 1px ${C.goldLight}, 6px 6px 0 3px ${C.goldDark}, 0 24px 72px rgba(0,0,0,0.45)`,
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🎮</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: C.textDark, fontFamily: "Cairo,sans-serif", marginBottom: "8px" }}>
              إنهاء اللعبة؟
            </div>
            <div style={{ fontSize: "0.85rem", color: C.textMid, marginBottom: "28px" }}>
              سيتم إعلان الفائز الحالي
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleEndGame}
                style={{
                  padding: "12px 28px", borderRadius: "999px", fontWeight: 800, cursor: "pointer",
                  background: `linear-gradient(135deg,#8B1520,#5B0E14)`, color: C.goldLight,
                  border: `1.5px solid ${C.goldDark}`, fontFamily: "Cairo,sans-serif",
                  boxShadow: "0 4px 20px rgba(91,14,20,0.45)", transition: "all 0.18s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.15)"}
                onMouseLeave={e => e.currentTarget.style.filter = ""}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: "12px 28px", borderRadius: "999px", fontWeight: 700, cursor: "pointer",
                  background: C.parchmentDk, border: `1.5px solid ${C.parchmentBdr}`,
                  color: C.textMid, fontFamily: "Cairo,sans-serif",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.parchmentBdr}
                onMouseLeave={e => e.currentTarget.style.background = C.parchmentDk}
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          WINNER SCREEN
      ══════════════════════════════ */}
      {showWinner && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "24px", textAlign: "center",
          background: `linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.86)), url("${ROMAN_BG}") center/cover fixed no-repeat`,
        }}>
          <div style={{ animation: "winnerFadeIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both", display:"flex", flexDirection:"column", alignItems:"center" }}>

          <div style={{ fontSize: "clamp(4rem,8vw,7rem)", marginBottom: "12px", filter: "drop-shadow(0 0 24px rgba(218,165,32,0.60))" }}>🏆</div>

          {/* "الفريق الفائز" label */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{ height: "1px", width: "60px", background: `linear-gradient(90deg,transparent,${C.gold})` }} />
            <span style={{ color: C.goldLight, fontFamily: "Cairo,sans-serif", fontSize: "0.84rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>الفريق الفائز</span>
            <div style={{ height: "1px", width: "60px", background: `linear-gradient(90deg,${C.gold},transparent)` }} />
          </div>

          <div style={{
            fontSize: "clamp(2.8rem,6vw,5.5rem)", fontWeight: 900, color: C.cream,
            fontFamily: "Cairo,sans-serif", marginBottom: "40px",
            animation: "winnerGlow 2.5s ease-in-out infinite",
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>

          {/* Score cards */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "48px" }}>
            <div style={{
              textAlign: "center", borderRadius: "16px", padding: "20px 32px",
              background: "rgba(250,249,246,0.10)",
              border: `2px solid ${C.gold}`,
              boxShadow: `0 0 0 1px rgba(218,165,32,0.30), 0 8px 32px rgba(0,0,0,0.50)`,
              backdropFilter: "blur(12px)",
            }}>
              <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "rgba(218,165,32,0.80)", fontFamily: "Cairo,sans-serif", marginBottom: "8px" }}>
                🦁 {session?.team1_name}
              </div>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, color: C.cream }}>{teamScores.team1}</div>
            </div>

            <div style={{ color: C.gold, fontSize: "1.4rem", fontWeight: 900, textShadow: "0 0 12px rgba(218,165,32,0.50)" }}>VS</div>

            <div style={{
              textAlign: "center", borderRadius: "16px", padding: "20px 32px",
              background: "rgba(250,249,246,0.10)",
              border: `2px solid ${C.gold}`,
              boxShadow: `0 0 0 1px rgba(218,165,32,0.30), 0 8px 32px rgba(0,0,0,0.50)`,
              backdropFilter: "blur(12px)",
            }}>
              <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "rgba(218,165,32,0.80)", fontFamily: "Cairo,sans-serif", marginBottom: "8px" }}>
                {session?.team2_name} 🦅
              </div>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, color: C.cream }}>{teamScores.team2}</div>
            </div>
          </div>
          <button
            onClick={() => {
              if (gameMode === "tournament") {
                const ref = tournamentState?.currentMatchRef;
                if (ref) {
                  const winnerId = teamScores.team1 >= teamScores.team2 ? ref.team1Id : ref.team2Id;
                  navigate("/tournament/bracket", { state: { autoRecord: { roundIdx: ref.roundIdx, matchIdx: ref.matchIdx, winnerId } } });
                } else navigate("/tournament/bracket");
              } else { resetGame(); navigate("/"); }
            }}
            style={{
              padding: "16px 52px", borderRadius: "999px", fontWeight: 900, fontSize: "1.1rem",
              background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
              color: C.bronzeDk, border: `2px solid ${C.goldDark}`,
              fontFamily: "Cairo,sans-serif",
              boxShadow: `0 0 0 1px ${C.goldLight}, 0 8px 36px rgba(218,165,32,0.45)`,
              transition: "all 0.18s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.filter = "brightness(1.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.filter = ""; }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          HOST CONTROLS — bottom-left corner
          Visible only when logged in
      ══════════════════════════════ */}
      {currentUser && (
        <div style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 60, direction: "rtl" }}>

          {/* Toggle button */}
          <button
            onClick={() => setShowHostPanel(p => !p)}
            title="تحكم المضيف"
            style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: showHostPanel
                ? `linear-gradient(135deg,${C.gold},${C.goldLight})`
                : `linear-gradient(135deg,${C.deepBlue},#0F1A30)`,
              border: `2px solid ${C.gold}`,
              color: showHostPanel ? C.bronzeDk : C.goldLight,
              fontSize: "1.1rem", cursor: "pointer",
              boxShadow: `0 4px 16px rgba(0,0,0,0.38), 3px 3px 0 2px ${C.goldDark}`,
              transition: "all 0.18s ease",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ⚙️
          </button>

          {/* Panel */}
          {showHostPanel && (
            <div style={{
              position: "absolute", bottom: "54px", left: 0,
              minWidth: "220px",
              background: C.deepBlue,
              border: `2px solid ${C.gold}`,
              borderRadius: "16px",
              boxShadow: `0 0 0 1px ${C.goldLight}, 6px 6px 0 3px ${C.goldDark}, 0 16px 40px rgba(0,0,0,0.50)`,
              padding: "14px 16px",
              display: "flex", flexDirection: "column", gap: "10px",
            }}>
              {/* Header */}
              <div style={{
                color: C.goldLight, fontFamily: "Cairo,sans-serif",
                fontWeight: 800, fontSize: "0.75rem",
                letterSpacing: "0.10em", textAlign: "center",
                borderBottom: `1px solid rgba(201,168,76,0.25)`,
                paddingBottom: "8px", marginBottom: "2px",
              }}>
                تحكم المضيف
              </div>

              {/* Switch turn */}
              <button
                onClick={switchTurn}
                style={{
                  padding: "9px 14px", borderRadius: "10px", cursor: "pointer",
                  background: `linear-gradient(135deg,#1B3A6A,#0F2248)`,
                  border: `1.5px solid rgba(80,140,240,0.55)`,
                  color: "#B0D0FF", fontFamily: "Cairo,sans-serif",
                  fontWeight: 700, fontSize: "0.82rem",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.28)",
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                }}
                onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.2)"}
                onMouseLeave={e => e.currentTarget.style.filter = ""}
              >
                🔄 تبديل الدور
              </button>

              {/* Points controls per team */}
              {[
                { team: 1, name: session?.team1_name, icon: "🦁", color: "#FFB0B0", border: "rgba(220,80,80,0.55)", bg: "rgba(140,30,30,0.30)" },
                { team: 2, name: session?.team2_name, icon: "🦅", color: "#B0D0FF", border: "rgba(80,140,240,0.55)", bg: "rgba(30,60,140,0.30)" },
              ].map(({ team, name, icon, color, border, bg }) => (
                <div key={team} style={{
                  borderRadius: "10px", padding: "8px 10px",
                  background: bg, border: `1px solid ${border}`,
                }}>
                  <div style={{
                    color, fontFamily: "Cairo,sans-serif",
                    fontWeight: 700, fontSize: "0.75rem",
                    marginBottom: "6px", textAlign: "center",
                  }}>
                    {icon} {name}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[300, 600, 900].map(pts => (
                      <div key={pts} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          onClick={() => updateScore(team, pts)}
                          style={{
                            padding: "5px 2px", borderRadius: "6px", cursor: "pointer", fontSize: "0.65rem",
                            fontFamily: "Cairo,sans-serif", fontWeight: 800,
                            background: "rgba(67,233,123,0.15)", border: "1px solid rgba(67,233,123,0.45)",
                            color: "#43e97b", transition: "all 0.15s ease",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(67,233,123,0.28)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(67,233,123,0.15)"}
                        >
                          +{pts}
                        </button>
                        <button
                          onClick={() => updateScore(team, -pts)}
                          style={{
                            padding: "5px 2px", borderRadius: "6px", cursor: "pointer", fontSize: "0.65rem",
                            fontFamily: "Cairo,sans-serif", fontWeight: 800,
                            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.40)",
                            color: "#f87171", transition: "all 0.15s ease",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.28)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                        >
                          -{pts}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
