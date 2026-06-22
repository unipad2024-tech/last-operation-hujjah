import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];
const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";

/* ──────────────────────────────────────────
   DESIGN TOKENS — Minimalist Dark Luxury
────────────────────────────────────────── */
const N = {
  surface:    "rgba(14, 8, 5, 0.64)",
  surfaceAct: "rgba(78, 12, 18, 0.52)",
  pill:       "rgba(18, 10, 6, 0.78)",
  pillUsed:   "rgba(255,255,255,0.06)",
  gold:       "#C9A84C",
  goldMuted:  "rgba(201,168,76,0.42)",
  goldFaint:  "rgba(201,168,76,0.12)",
  cream:      "#F5EDD8",
  creamFade:  "rgba(245,237,216,0.50)",
  strip:      "#100704",
  border:     "rgba(201,168,76,0.14)",
};

/* ──────────────────────────────────────────
   SCORE COUNTER — animated number rollup
────────────────────────────────────────── */
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

/* ──────────────────────────────────────────
   CONFETTI
────────────────────────────────────────── */
function fireConfetti() {
  const colors = ["#C9A84C", "#B8860B", "#8B0000", "#F5EDD8", "#DAA520", "#5B0E14"];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("div");
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

/* ──────────────────────────────────────────
   SCORE PILL BUTTON — extended pill, 2 states
────────────────────────────────────────── */
function ScoreBtn({ catId, diff, slot, used, clicking, onClick }) {
  const key = `${catId}_${diff}_${slot}`;
  const isClicking = clicking === key;

  return (
    <button
      data-testid={`tile-${catId}-${diff}-${slot}`}
      onClick={onClick}
      disabled={used || !!clicking}
      style={{
        width:          "100%",
        padding:        "9px 0",
        background:     used ? N.pillUsed : N.pill,
        color:          used ? "rgba(245,237,216,0.22)" : "rgba(245,237,216,0.82)",
        border:         `1px solid ${used ? "rgba(255,255,255,0.07)" : N.border}`,
        borderRadius:   "24px",
        fontSize:       "0.80rem",
        fontWeight:     700,
        fontFamily:     "Cairo, Tajawal, sans-serif",
        cursor:         used ? "not-allowed" : "pointer",
        textDecoration: used ? "line-through" : "none",
        userSelect:     "none",
        transition:     "all 0.18s ease",
        lineHeight:     1,
        display:        "block",
      }}
      onMouseEnter={e => {
        if (!used) {
          e.currentTarget.style.background  = "rgba(201,168,76,0.18)";
          e.currentTarget.style.borderColor = N.goldMuted;
          e.currentTarget.style.color       = N.cream;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = used ? N.pillUsed : N.pill;
        e.currentTarget.style.borderColor = used ? "rgba(255,255,255,0.07)" : N.border;
        e.currentTarget.style.color       = used ? "rgba(245,237,216,0.22)" : "rgba(245,237,216,0.82)";
      }}
      onMouseDown={e => { if (!used) e.currentTarget.style.transform = "scale(0.95)"; }}
      onMouseUp={e   => { if (!used) e.currentTarget.style.transform = ""; }}
    >
      {isClicking ? "⏳" : used ? "✓" : diff}
    </button>
  );
}

/* ──────────────────────────────────────────
   CATEGORY CARD
   [ left pills ] | [ center image + name strip ] | [ right pills ]
────────────────────────────────────────── */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, doubleNextQ }) {
  const allUsed = DIFFICULTIES.every(d =>
    isTileUsed(`${cat.id}_${d}_1`) && isTileUsed(`${cat.id}_${d}_2`)
  );

  const BtnCol = ({ slot }) => (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      justifyContent: "space-evenly",
      alignItems:     "stretch",
      width:          "56px",
      flexShrink:     0,
      gap:            "6px",
    }}>
      {DIFFICULTIES.map(d => {
        const isUsed = isTileUsed(`${cat.id}_${d}_${slot}`);
        return (
          <div key={`${cat.id}_${d}_${slot}`} style={{ position: "relative" }}>
            <ScoreBtn
              catId={cat.id} diff={d} slot={slot}
              used={isUsed}
              clicking={clickingTile}
              onClick={() => onTileClick(cat.id, d, slot)}
            />
            {doubleNextQ && !isUsed && (
              <div style={{
                position: "absolute", top: -4, right: -4, zIndex: 10,
                background: "linear-gradient(135deg,#f5c842,#c9880c)",
                color: "#1a0900", fontSize: "0.42rem", fontWeight: 900,
                padding: "2px 4px", borderRadius: 999, lineHeight: 1.4,
                pointerEvents: "none",
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
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "stretch",
        gap:            "8px",
        padding:        "10px",
        borderRadius:   "14px",
        background:     N.surface,
        border:         `1px solid ${N.border}`,
        backdropFilter: "blur(8px)",
        opacity:        allUsed ? 0.38 : 1,
        transition:     "transform 0.22s ease, opacity 0.3s ease",
        position:       "relative",
        overflow:       "hidden",
      }}
    >
      {/* Left pills — slot 1 */}
      <BtnCol slot={1} />

      {/* Center image + solid name strip */}
      <div style={{
        flex:         1,
        borderRadius: "8px",
        overflow:     "hidden",
        position:     "relative",
        minWidth:     0,
        background:   "rgba(10,5,3,0.80)",
      }}>
        {cat.image_url ? (
          <img
            src={cat.image_url}
            alt=""
            aria-hidden="true"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: N.goldMuted, fontSize: "1.8rem",
          }}>✦</div>
        )}

        {/* Solid strip — no gradient, no shadows */}
        <div style={{
          position:   "absolute", bottom: 0, left: 0, right: 0,
          background: N.strip,
          padding:    "7px 6px",
          textAlign:  "center",
        }}>
          <span style={{
            color:      N.cream,
            fontFamily: "Cairo, Tajawal, sans-serif",
            fontSize:   "clamp(0.66rem, 0.85vw, 0.88rem)",
            fontWeight: 700,
            lineHeight: 1.2,
          }}>
            {cat.name}
          </span>
        </div>
      </div>

      {/* Right pills — slot 2 */}
      <BtnCol slot={2} />
    </div>
  );
}

/* ──────────────────────────────────────────
   TEAM PANEL — slim, minimal
────────────────────────────────────────── */
function TeamPanel({ team, name, score, isActive, icon, reversed, onAdd, onRemove }) {
  const adjBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        width: "22px", height: "22px", borderRadius: "8px",
        background: "rgba(201,168,76,0.10)",
        border: "1px solid rgba(201,168,76,0.22)",
        color: N.goldMuted, fontSize: "0.85rem", fontWeight: 900,
        cursor: "pointer", lineHeight: 1, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.22)"}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,0.10)"}
    >
      {label}
    </button>
  );

  return (
    <div
      data-testid={`team${team}-score`}
      style={{
        display:        "flex",
        flexDirection:  reversed ? "row-reverse" : "row",
        alignItems:     "center",
        gap:            "10px",
        padding:        "10px 16px",
        borderRadius:   "12px",
        minWidth:       "clamp(155px,15vw,215px)",
        background:     isActive ? N.surfaceAct : N.surface,
        border:         `1px solid ${isActive ? "rgba(201,168,76,0.36)" : N.border}`,
        backdropFilter: "blur(8px)",
        transition:     "all 0.35s ease",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, textAlign: reversed ? "right" : "left" }}>
        <div style={{
          fontSize:     "clamp(0.76rem,1.0vw,0.90rem)",
          fontWeight:   700,
          color:        isActive ? N.cream : N.creamFade,
          overflow:     "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily:   "Cairo, Tajawal, sans-serif",
          transition:   "color 0.35s ease",
        }}>
          {reversed ? `${name} ${icon}` : `${icon} ${name}`}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
        {onRemove && adjBtn("−", onRemove)}
        <div style={{
          fontSize:   "clamp(1.8rem,2.4vw,2.4rem)",
          fontWeight: 900,
          color:      N.gold,
          lineHeight: 1,
          fontFamily: "Cairo, sans-serif",
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

/* ──────────────────────────────────────────
   MAIN GAME BOARD
────────────────────────────────────────── */
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
    const iv = setInterval(refreshScores, 12000);
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

  /* Loading state */
  if (loading) return (
    <div style={{
      height: "100svh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(rgba(14,8,5,0.65), rgba(14,8,5,0.70)), url("${ROMAN_BG}") center/cover`,
    }}>
      <div style={{
        color: N.cream, fontFamily: "Cairo, sans-serif",
        fontSize: "1rem", fontWeight: 700,
        animation: "loadPulse 1.5s ease-in-out infinite",
        padding: "14px 28px", borderRadius: "12px",
        background: N.surface, border: `1px solid ${N.border}`,
        backdropFilter: "blur(8px)",
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

  /* ════ RENDER ════ */
  return (
    <div style={{
      minHeight:     "100svh",
      display:       "flex",
      flexDirection: "column",
      padding:       "14px 16px",
      gap:           "12px",
      position:      "relative",
      overflow:      "hidden",
    }}>

      {/* ── Global CSS ── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; overflow-x: hidden; }

        body {
          background:
            linear-gradient(rgba(16,9,5,0.55), rgba(16,9,5,0.60)),
            url("${ROMAN_BG}") center / cover fixed no-repeat;
          font-family: "Cairo", "Tajawal", sans-serif;
          color: ${N.cream};
        }

        .cat-card:hover {
          transform: translateY(-2px) scale(1.010) !important;
          border-color: ${N.goldMuted} !important;
        }

        @keyframes turnPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.70; }
        }
        @keyframes loadPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.42; }
        }
        @keyframes confettiFall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes winnerGlow {
          0%,100% { text-shadow: 0 0 28px rgba(201,168,76,0.55), 0 2px 14px rgba(0,0,0,0.55); }
          50%      { text-shadow: 0 0 58px rgba(201,168,76,0.85), 0 2px 14px rgba(0,0,0,0.55); }
        }
        @keyframes winnerFadeIn {
          from { opacity: 0; transform: scale(0.90) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* ══════════════════════════════
          HEADER
      ══════════════════════════════ */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap:                 "12px",
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

        {/* Center controls */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "7px" }}>

          {/* Logo */}
          <div style={{
            fontFamily:    "Cairo, sans-serif",
            fontWeight:    900,
            fontSize:      "clamp(1.6rem,3.6vw,2.4rem)",
            color:         N.cream,
            lineHeight:    1.2,
            letterSpacing: "0.02em",
          }}>حُجّة</div>

          {/* Turn indicator — clickable */}
          <div
            data-testid="turn-indicator"
            onClick={switchTurn}
            title="اضغط لتبديل الدور"
            style={{
              display:        "flex", alignItems: "center", gap: "6px",
              borderRadius:   "999px", padding: "5px 14px",
              background:     N.surface,
              border:         `1px solid ${currentTurn === 1 ? "rgba(220,80,80,0.40)" : "rgba(80,140,240,0.40)"}`,
              color:          currentTurn === 1 ? "rgba(255,176,176,0.88)" : "rgba(176,208,255,0.88)",
              fontWeight:     700, fontSize: "clamp(0.66rem,1.0vw,0.80rem)",
              fontFamily:     "Cairo, sans-serif",
              animation:      "turnPulse 2.5s ease-in-out infinite",
              whiteSpace:     "nowrap",
              transition:     "border-color 0.35s, color 0.35s",
              cursor:         "pointer",
              userSelect:     "none",
              backdropFilter: "blur(6px)",
            }}
          >
            <span>{currentTurn === 1 ? "🦁" : "🦅"}</span>
            <span>دور {currentTurn === 1 ? session?.team1_name : session?.team2_name}</span>
          </div>

          {/* Double points + End game row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => {
                setDoubleNextQ(v => !v);
                if (!doubleNextQ) toast.success("⚡ مضاعفة النقاط مفعّلة — اختر سؤالاً الآن!");
                else toast("تم إلغاء مضاعفة النقاط", { icon: "⚡" });
              }}
              style={{
                display:        "flex", alignItems: "center", gap: "5px",
                padding:        "5px 12px", borderRadius: "999px",
                background:     doubleNextQ ? "rgba(201,168,76,0.20)" : N.surface,
                border:         `1px solid ${doubleNextQ ? N.goldMuted : N.border}`,
                color:          doubleNextQ ? N.gold : N.creamFade,
                fontWeight:     700, fontSize: "0.72rem",
                fontFamily:     "Cairo, sans-serif", cursor: "pointer",
                transition:     "all 0.20s ease", whiteSpace: "nowrap",
                backdropFilter: "blur(6px)",
                animation:      doubleNextQ ? "turnPulse 1.8s ease-in-out infinite" : "none",
              }}
            >
              <span>⚡</span>
              <span>{doubleNextQ ? "✓ مضاعفة فعّالة" : "مضاعفة النقاط"}</span>
            </button>

            <button
              data-testid="end-game-btn"
              onClick={() => setShowEndConfirm(true)}
              style={{
                padding:        "5px 14px", borderRadius: "999px",
                background:     "rgba(91,14,20,0.45)",
                border:         "1px solid rgba(91,14,20,0.65)",
                color:          "rgba(245,237,216,0.80)",
                fontWeight:     700, fontSize: "0.72rem",
                fontFamily:     "Cairo, sans-serif", cursor: "pointer",
                transition:     "all 0.18s ease", whiteSpace: "nowrap",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(91,14,20,0.72)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(91,14,20,0.45)"}
            >
              إنهاء اللعبة
            </button>
          </div>
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
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows:    "repeat(2, 1fr)",
        gap:                 "12px",
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
          position:       "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          display:        "flex", flexDirection: "column", alignItems: "center", gap: "10px",
          padding:        "16px 24px",
          background:     "rgba(10,6,3,0.90)",
          backdropFilter: "blur(12px)",
          borderTop:      `1px solid ${N.border}`,
        }}>
          <div style={{ color: N.gold, fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "1.2rem" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "11px 36px", borderRadius: "999px", fontWeight: 900, fontSize: "0.95rem",
              background: N.gold, color: "#0F0702",
              border: "none", cursor: "pointer", fontFamily: "Cairo,sans-serif",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.10)"}
            onMouseLeave={e => e.currentTarget.style.filter = ""}
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
          background: "rgba(8,4,2,0.80)", backdropFilter: "blur(12px)",
        }}>
          <div style={{
            borderRadius:   "18px", padding: "32px 36px",
            maxWidth:       "360px", width: "100%", textAlign: "center",
            background:     "rgba(16,9,5,0.92)",
            border:         `1px solid ${N.border}`,
            backdropFilter: "blur(16px)",
          }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>🎮</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900, color: N.cream, fontFamily: "Cairo,sans-serif", marginBottom: "6px" }}>
              إنهاء اللعبة؟
            </div>
            <div style={{ fontSize: "0.84rem", color: N.creamFade, marginBottom: "24px" }}>
              سيتم إعلان الفائز الحالي
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={handleEndGame}
                style={{
                  padding: "11px 26px", borderRadius: "999px", fontWeight: 800, cursor: "pointer",
                  background: "rgba(91,14,20,0.80)", color: N.cream,
                  border: "1px solid rgba(91,14,20,0.90)", fontFamily: "Cairo,sans-serif",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(120,18,28,0.90)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(91,14,20,0.80)"}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: "11px 26px", borderRadius: "999px", fontWeight: 700, cursor: "pointer",
                  background: N.surface, border: `1px solid ${N.border}`,
                  color: N.creamFade, fontFamily: "Cairo,sans-serif",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = N.goldMuted}
                onMouseLeave={e => e.currentTarget.style.borderColor = N.border}
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
          position:       "fixed", inset: 0, zIndex: 50,
          display:        "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding:        "24px", textAlign: "center",
          background:     `linear-gradient(rgba(8,4,2,0.80), rgba(8,4,2,0.88)), url("${ROMAN_BG}") center/cover fixed no-repeat`,
          backdropFilter: "blur(4px)",
        }}>
          <div style={{ animation: "winnerFadeIn 0.50s cubic-bezier(0.34,1.2,0.64,1) both", display: "flex", flexDirection: "column", alignItems: "center" }}>

            <div style={{ fontSize: "clamp(3.5rem,7vw,6rem)", marginBottom: "10px" }}>🏆</div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ height: "1px", width: "48px", background: `linear-gradient(90deg,transparent,${N.goldMuted})` }} />
              <span style={{ color: N.goldMuted, fontFamily: "Cairo,sans-serif", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.16em" }}>الفريق الفائز</span>
              <div style={{ height: "1px", width: "48px", background: `linear-gradient(90deg,${N.goldMuted},transparent)` }} />
            </div>

            <div style={{
              fontSize:   "clamp(2.4rem,5.5vw,5rem)", fontWeight: 900, color: N.cream,
              fontFamily: "Cairo,sans-serif", marginBottom: "36px",
              animation:  "winnerGlow 2.5s ease-in-out infinite",
            }}>
              {winner === "تعادل" ? "🤝 تعادل!" : winner}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
              <div style={{
                textAlign: "center", borderRadius: "14px", padding: "18px 28px",
                background: "rgba(16,9,5,0.78)",
                border: `1px solid ${N.border}`,
                backdropFilter: "blur(10px)",
              }}>
                <div style={{ fontSize: "0.80rem", fontWeight: 700, color: N.creamFade, fontFamily: "Cairo,sans-serif", marginBottom: "6px" }}>
                  🦁 {session?.team1_name}
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: N.gold }}>{teamScores.team1}</div>
              </div>

              <div style={{ color: N.goldMuted, fontSize: "1.2rem", fontWeight: 900 }}>VS</div>

              <div style={{
                textAlign: "center", borderRadius: "14px", padding: "18px 28px",
                background: "rgba(16,9,5,0.78)",
                border: `1px solid ${N.border}`,
                backdropFilter: "blur(10px)",
              }}>
                <div style={{ fontSize: "0.80rem", fontWeight: 700, color: N.creamFade, fontFamily: "Cairo,sans-serif", marginBottom: "6px" }}>
                  {session?.team2_name} 🦅
                </div>
                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: N.gold }}>{teamScores.team2}</div>
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
                padding:    "14px 48px", borderRadius: "999px", fontWeight: 900, fontSize: "1rem",
                background: N.gold, color: "#0F0702",
                border:     "none", fontFamily: "Cairo,sans-serif",
                cursor:     "pointer", transition: "all 0.18s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.filter = "brightness(1.10)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.filter = ""; }}
            >
              {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          HOST CONTROLS — bottom-left
      ══════════════════════════════ */}
      {currentUser && (
        <div style={{ position: "fixed", bottom: "16px", left: "16px", zIndex: 60, direction: "rtl" }}>

          <button
            onClick={() => setShowHostPanel(p => !p)}
            title="تحكم المضيف"
            style={{
              width:          "40px", height: "40px", borderRadius: "10px",
              background:     showHostPanel ? N.gold : N.surface,
              border:         `1px solid ${showHostPanel ? N.gold : N.border}`,
              color:          showHostPanel ? "#0F0702" : N.creamFade,
              fontSize:       "1rem", cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition:     "all 0.18s ease",
              display:        "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ⚙️
          </button>

          {showHostPanel && (
            <div style={{
              position:       "absolute", bottom: "50px", left: 0,
              minWidth:       "210px",
              background:     "rgba(14,8,5,0.92)",
              border:         `1px solid ${N.border}`,
              borderRadius:   "14px",
              backdropFilter: "blur(16px)",
              padding:        "12px 14px",
              display:        "flex", flexDirection: "column", gap: "8px",
            }}>
              <div style={{
                color: N.goldMuted, fontFamily: "Cairo,sans-serif",
                fontWeight: 700, fontSize: "0.72rem",
                letterSpacing: "0.10em", textAlign: "center",
                borderBottom: `1px solid ${N.goldFaint}`,
                paddingBottom: "8px", marginBottom: "2px",
              }}>
                تحكم المضيف
              </div>

              <button
                onClick={switchTurn}
                style={{
                  padding: "8px 12px", borderRadius: "10px", cursor: "pointer",
                  background: "rgba(80,140,240,0.12)",
                  border: "1px solid rgba(80,140,240,0.28)",
                  color: "rgba(176,208,255,0.85)", fontFamily: "Cairo,sans-serif",
                  fontWeight: 700, fontSize: "0.80rem",
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(80,140,240,0.22)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(80,140,240,0.12)"}
              >
                🔄 تبديل الدور
              </button>

              {[
                { team: 1, name: session?.team1_name, icon: "🦁", color: "rgba(255,176,176,0.85)", border: "rgba(220,80,80,0.30)", bg: "rgba(140,30,30,0.18)" },
                { team: 2, name: session?.team2_name, icon: "🦅", color: "rgba(176,208,255,0.85)", border: "rgba(80,140,240,0.30)", bg: "rgba(30,60,140,0.18)" },
              ].map(({ team, name, icon, color, border, bg }) => (
                <div key={team} style={{
                  borderRadius: "10px", padding: "8px 10px",
                  background: bg, border: `1px solid ${border}`,
                }}>
                  <div style={{ color, fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: "0.72rem", marginBottom: "6px", textAlign: "center" }}>
                    {icon} {name}
                  </div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {[300, 600, 900].map(pts => (
                      <div key={pts} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          onClick={() => updateScore(team, pts)}
                          style={{
                            padding: "5px 2px", borderRadius: "6px", cursor: "pointer", fontSize: "0.62rem",
                            fontFamily: "Cairo,sans-serif", fontWeight: 800,
                            background: "rgba(67,233,123,0.12)", border: "1px solid rgba(67,233,123,0.35)",
                            color: "#43e97b", transition: "all 0.15s ease",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(67,233,123,0.22)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(67,233,123,0.12)"}
                        >+{pts}</button>
                        <button
                          onClick={() => updateScore(team, -pts)}
                          style={{
                            padding: "5px 2px", borderRadius: "6px", cursor: "pointer", fontSize: "0.62rem",
                            fontFamily: "Cairo,sans-serif", fontWeight: 800,
                            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.30)",
                            color: "#f87171", transition: "all 0.15s ease",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.22)"}
                          onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
                        >-{pts}</button>
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
