import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];

const ROMAN_BG_IMG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";

/* ── Difficulty chip styles ── */
const DIFF_STYLE = {
  300: {
    bg: "linear-gradient(145deg,#b8860b,#d4a820,#f0d045)",
    shadow: "rgba(212,168,32,0.55)",
    used: "rgba(212,168,32,0.08)",
  },
  600: {
    bg: "linear-gradient(145deg,#a84c08,#c45c0a,#f07830)",
    shadow: "rgba(196,92,10,0.55)",
    used: "rgba(196,92,10,0.08)",
  },
  900: {
    bg: "linear-gradient(145deg,#5b0e14,#8b1520,#a82030)",
    shadow: "rgba(139,21,32,0.65)",
    used: "rgba(139,21,32,0.08)",
  },
};

/* ── Animated score counter ── */
function ScoreCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (value === prev.current) return;
    setPop(true);
    const diff = value - prev.current;
    const steps = 14;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (diff * i) / steps));
      if (i >= steps) { clearInterval(t); setDisplay(value); setPop(false); prev.current = value; }
    }, 35);
    return () => clearInterval(t);
  }, [value]);

  return (
    <span
      className="tabular-nums inline-block"
      style={{
        display: "inline-block",
        transform: pop ? "scale(1.22)" : "scale(1)",
        transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {display}
    </span>
  );
}

/* ── Confetti ── */
function fireConfetti() {
  const colors = ["#F1E194","#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6"];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed", top: "-10px",
      left: Math.random() * 100 + "vw",
      width: (Math.random() * 9 + 5) + "px",
      height: (Math.random() * 9 + 5) + "px",
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      animation: `fall ${Math.random() * 3 + 2}s ${Math.random()}s linear forwards`,
      zIndex: 9999, pointerEvents: "none",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5500);
  }
}

/* ── Score Button ── */
function ScoreBtn({ catId, diff, slot, used, clicking, onClick }) {
  const ds = DIFF_STYLE[diff];
  const key = `${catId}_${diff}_${slot}`;
  const isClicking = clicking === key;

  return (
    <button
      data-testid={`tile-${catId}-${diff}-${slot}`}
      onClick={onClick}
      disabled={used || !!clicking}
      style={{
        width: "100%",
        borderRadius: "10px",
        fontWeight: 900,
        fontSize: "clamp(0.62rem,1.1vw,1.05rem)",
        lineHeight: 1,
        letterSpacing: "-0.01em",
        padding: "clamp(5px,0.9vh,11px) clamp(2px,0.3vw,5px)",
        background: used ? ds.used : ds.bg,
        border: used
          ? "1px solid rgba(255,220,120,0.08)"
          : "1px solid rgba(255,255,255,0.18)",
        color: used ? "rgba(255,220,120,0.18)" : "#fff8e8",
        boxShadow: used ? "none" : `0 4px 14px ${ds.shadow}, inset 0 1px 0 rgba(255,255,255,0.22)`,
        cursor: used ? "default" : "pointer",
        transition: "transform 0.16s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.16s ease, opacity 0.16s ease",
        textShadow: used ? "none" : "0 1px 3px rgba(0,0,0,0.55)",
        transform: isClicking ? "scale(0.92)" : "scale(1)",
      }}
    >
      {isClicking ? "⏳" : used ? "✓" : diff}
    </button>
  );
}

/* ── Category Card ── */
function CategoryCard({ cat, session, isTileUsed, clickingTile, onTileClick }) {
  const t1Cats = session?.team1_categories || [];
  const isT1   = t1Cats.includes(cat.id);
  const teamName  = isT1 ? session?.team1_name : session?.team2_name;
  const teamColor = isT1 ? "#ef4444" : "#3b82f6";
  const teamGlow  = isT1 ? "rgba(239,68,68,0.30)" : "rgba(59,130,246,0.30)";

  return (
    <div
      className="category-card"
      style={{
        position: "relative",
        borderRadius: "18px",
        background: "linear-gradient(160deg, rgba(255,245,225,0.11) 0%, rgba(255,235,190,0.07) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,215,130,0.22)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.48), 0 2px 8px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,230,150,0.09)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {/* Team color bar at top */}
      <div style={{
        height: "3px",
        width: "100%",
        background: `linear-gradient(90deg, ${teamColor}cc, ${teamColor}55)`,
        flexShrink: 0,
      }} />

      {/* Inner glow from team color */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "60%",
        background: `radial-gradient(ellipse at top, ${teamGlow} 0%, transparent 70%)`,
        pointerEvents: "none",
        opacity: 0.35,
      }} />

      {/* Card body: [left buttons | center | right buttons] */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: "clamp(5px,0.6vw,10px)",
        padding: "clamp(8px,1vw,14px)",
        minHeight: 0,
      }}>

        {/* Left score buttons */}
        <div style={{
          width: "clamp(36px,5vw,72px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "clamp(4px,0.5vh,8px)",
          flexShrink: 0,
        }}>
          {DIFFICULTIES.map(diff => (
            <ScoreBtn
              key={`${cat.id}_${diff}_1`}
              catId={cat.id} diff={diff} slot={1}
              used={isTileUsed(`${cat.id}_${diff}_1`)}
              clicking={clickingTile}
              onClick={() => onTileClick(cat.id, diff, 1)}
            />
          ))}
        </div>

        {/* Center: image + title + team badge */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(5px,0.6vh,9px)",
          minWidth: 0,
          padding: "clamp(2px,0.3vh,6px) 0",
        }}>
          {/* Category image */}
          <div style={{
            width: "clamp(44px,5.5vw,86px)",
            height: "clamp(44px,5.5vw,86px)",
            borderRadius: "12px",
            overflow: "hidden",
            flexShrink: 0,
            background: `linear-gradient(135deg, ${cat.color || "#5B0E14"}44, ${cat.color || "#5B0E14"}11)`,
            border: "1px solid rgba(255,230,150,0.16)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {cat.image_url ? (
              <img
                src={cat.image_url}
                alt={cat.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              <span style={{ fontSize: "clamp(1.2rem,2.6vw,2.2rem)" }}>{cat.icon || "🎯"}</span>
            )}
          </div>

          {/* Category name */}
          <div style={{
            color: "#f4efe6",
            fontSize: "clamp(0.7rem,1.3vw,1.05rem)",
            fontWeight: 800,
            fontFamily: "Cairo, sans-serif",
            textAlign: "center",
            lineHeight: 1.25,
            letterSpacing: "0.01em",
            textShadow: "0 1px 4px rgba(0,0,0,0.55)",
            maxWidth: "100%",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {cat.name}
          </div>

          {/* Team badge */}
          <div style={{
            padding: "clamp(2px,0.4vh,5px) clamp(8px,0.8vw,14px)",
            borderRadius: "9999px",
            background: isT1 ? "rgba(239,68,68,0.14)" : "rgba(59,130,246,0.14)",
            border: `1px solid ${isT1 ? "rgba(239,68,68,0.32)" : "rgba(59,130,246,0.32)"}`,
            color: isT1 ? "#fca5a5" : "#93c5fd",
            fontSize: "clamp(0.58rem,1vw,0.8rem)",
            fontWeight: 700,
            fontFamily: "Cairo, sans-serif",
            whiteSpace: "nowrap",
            letterSpacing: "0.01em",
          }}>
            {teamName}
          </div>
        </div>

        {/* Right score buttons */}
        <div style={{
          width: "clamp(36px,5vw,72px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "clamp(4px,0.5vh,8px)",
          flexShrink: 0,
        }}>
          {DIFFICULTIES.map(diff => (
            <ScoreBtn
              key={`${cat.id}_${diff}_2`}
              catId={cat.id} diff={diff} slot={2}
              used={isTileUsed(`${cat.id}_${diff}_2`)}
              clicking={clickingTile}
              onClick={() => onTileClick(cat.id, diff, 2)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ Main Board ═══ */
export default function GameBoardPage() {
  const navigate = useNavigate();
  const {
    session, resetGame, darkMode, toggleDarkMode, currentTurn,
    markTileUsed, isTileUsed, teamScores, saveSession,
    gameMode, tournamentState
  } = useGame();
  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWinner, setShowWinner]         = useState(false);
  const [clickingTile, setClickingTile]     = useState(null);

  const team1Name = session?.team1_name || "الفريق الأحمر";
  const team2Name = session?.team2_name || "الفريق الأزرق";

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

  useEffect(() => { const iv = setInterval(refreshScores, 4000); return () => clearInterval(iv); }, [refreshScores]);
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
    try {
      const { data: q } = await axios.post(
        `${API}/game/session/${session.id}/question?category_id=${catId}&difficulty=${difficulty}`
      );
      navigate("/question", {
        state: { question: q, catId, difficulty, slot, catName: categories.find(c => c.id === catId)?.name, turnTeam: currentTurn }
      });
    } catch {
      toast.error("لا يوجد أسئلة متاحة لهذه الفئة!");
    } finally {
      setClickingTile(null);
    }
  };

  const handleEndGame = () => { fireConfetti(); setShowEndConfirm(false); setShowWinner(true); };

  if (loading) return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: `linear-gradient(rgba(8,4,10,0.88),rgba(6,2,8,0.95)),url("${ROMAN_BG_IMG}")`,
      backgroundSize: "cover",
      backgroundPosition: "center 20%",
    }}>
      <div style={{ color: "#d4a820", fontFamily: "Cairo,sans-serif", fontSize: "1.1rem", fontWeight: 800, opacity: 0.85 }}>
        جاري تحميل اللوحة...
      </div>
    </div>
  );

  const allUsed = categories.every(c =>
    DIFFICULTIES.every(d => isTileUsed(`${c.id}_${d}_1`) && isTileUsed(`${c.id}_${d}_2`))
  );
  const winner = allUsed || showWinner
    ? teamScores.team1 > teamScores.team2 ? team1Name
    : teamScores.team2 > teamScores.team1 ? team2Name : "تعادل"
    : null;

  return (
    <div
      style={{
        height: "100svh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(255,200,80,0.06) 0%, transparent 55%), linear-gradient(180deg, rgba(8,4,10,0.84) 0%, rgba(6,2,8,0.94) 100%), url("${ROMAN_BG_IMG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        backgroundAttachment: "fixed",
      }}
    >
      <style>{`
        @keyframes fall {
          to { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
        @keyframes boardIn {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-soft {
          0%,100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 20px 2px var(--pulse-color,rgba(212,168,32,0.3)); }
        }
        .board-grid { animation: boardIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .category-card {
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
          transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease !important;
        }
        .category-card:nth-child(1) { animation-delay:0.04s }
        .category-card:nth-child(2) { animation-delay:0.09s }
        .category-card:nth-child(3) { animation-delay:0.14s }
        .category-card:nth-child(4) { animation-delay:0.19s }
        .category-card:nth-child(5) { animation-delay:0.24s }
        .category-card:nth-child(6) { animation-delay:0.29s }
        .category-card:hover {
          transform: translateY(-5px) scale(1.012) !important;
          box-shadow: 0 20px 48px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,215,130,0.28), inset 0 1px 0 rgba(255,230,150,0.12) !important;
        }
        .score-chip {
          transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease;
        }
        .score-chip:not(:disabled):hover {
          transform: scale(1.1) translateY(-1px) !important;
        }
        .team-block { transition: all 0.4s ease; }
        .team-block.active {
          --pulse-color: var(--team-glow);
          animation: pulse-soft 2s ease-in-out infinite;
        }
      `}</style>

      {/* ══════════ SCORE BAR ══════════ */}
      <div style={{
        flexShrink: 0,
        background: "rgba(6,2,8,0.88)",
        borderBottom: "1px solid rgba(255,215,130,0.14)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px,1.5vw,20px)",
          padding: "clamp(8px,1.2vh,14px) clamp(12px,2vw,28px)",
          maxWidth: "min(98vw,1540px)",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}>

          {/* Team 1 */}
          <TeamBlock
            name={team1Name}
            score={teamScores.team1}
            active={currentTurn === 1}
            side="left"
            color="#ef4444"
            glow="rgba(239,68,68,0.35)"
          />

          {/* Center controls */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "clamp(3px,0.5vh,7px)",
            flexShrink: 0,
          }}>
            {/* Logo */}
            <div style={{
              fontFamily: "Cairo,sans-serif",
              fontWeight: 900,
              fontSize: "clamp(0.85rem,1.4vw,1.15rem)",
              color: "#d4a820",
              letterSpacing: "0.06em",
              textShadow: "0 2px 8px rgba(212,168,32,0.4)",
            }}>حُجّة</div>

            {/* Turn pill */}
            <div
              data-testid="turn-indicator"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(4px,0.5vw,8px)",
                padding: "clamp(3px,0.5vh,6px) clamp(10px,1.2vw,18px)",
                borderRadius: "999px",
                fontFamily: "Cairo,sans-serif",
                fontWeight: 800,
                fontSize: "clamp(0.6rem,1.1vw,0.88rem)",
                background: currentTurn === 1
                  ? "rgba(180,30,40,0.25)"
                  : "rgba(30,80,200,0.25)",
                border: `1.5px solid ${currentTurn === 1 ? "rgba(220,50,60,0.75)" : "rgba(59,130,246,0.75)"}`,
                color: currentTurn === 1 ? "#fca5a5" : "#93c5fd",
                boxShadow: currentTurn === 1
                  ? "0 0 16px rgba(220,50,60,0.32)"
                  : "0 0 16px rgba(59,130,246,0.32)",
                whiteSpace: "nowrap",
              }}
            >
              <span>{currentTurn === 1 ? "🔴" : "🔵"}</span>
              <span>دور {currentTurn === 1 ? team1Name : team2Name}</span>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(5px,0.6vw,10px)" }}>
              <button
                data-testid="dark-mode-toggle"
                onClick={toggleDarkMode}
                style={{
                  padding: "clamp(2px,0.4vh,5px) clamp(8px,0.9vw,14px)",
                  borderRadius: "999px",
                  fontFamily: "Cairo,sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(0.55rem,0.9vw,0.72rem)",
                  background: "rgba(255,215,130,0.08)",
                  border: "1px solid rgba(255,215,130,0.20)",
                  color: "rgba(255,215,130,0.65)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "opacity 0.15s",
                }}
              >
                <span>{darkMode ? "☀️" : "🌙"}</span>
                <span>{darkMode ? "فاتح" : "داكن"}</span>
              </button>
              <button
                data-testid="end-game-btn"
                onClick={() => setShowEndConfirm(true)}
                style={{
                  padding: "clamp(2px,0.4vh,5px) clamp(8px,0.9vw,14px)",
                  borderRadius: "999px",
                  fontFamily: "Cairo,sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(0.55rem,0.9vw,0.72rem)",
                  background: "transparent",
                  border: "1px solid rgba(255,215,130,0.16)",
                  color: "rgba(255,215,130,0.42)",
                  cursor: "pointer",
                }}
              >إنهاء</button>
            </div>
          </div>

          {/* Team 2 */}
          <TeamBlock
            name={team2Name}
            score={teamScores.team2}
            active={currentTurn === 2}
            side="right"
            color="#3b82f6"
            glow="rgba(59,130,246,0.35)"
          />
        </div>
      </div>

      {/* ══════════ BOARD ══════════ */}
      <div
        className="board-grid"
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          gridTemplateRows: "repeat(2, minmax(0,1fr))",
          gap: "clamp(8px,1.1vw,16px)",
          padding: "clamp(10px,1.4vw,22px)",
          maxWidth: "min(98vw,1540px)",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          minHeight: 0,
          alignSelf: "stretch",
          overflow: "hidden",
        }}
      >
        {categories.slice(0, 6).map(cat => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            session={session}
            isTileUsed={isTileUsed}
            clickingTile={clickingTile}
            onTileClick={handleTileClick}
          />
        ))}
      </div>

      {/* ══════════ LEGEND ══════════ */}
      <div style={{
        flexShrink: 0,
        display: "flex",
        justifyContent: "center",
        gap: "clamp(12px,2vw,28px)",
        padding: "clamp(3px,0.5vh,7px) 0 clamp(5px,0.7vh,10px)",
      }}>
        {[
          { name: team1Name, team: 1, color: "#ef4444", textColor: "#fca5a5" },
          { name: team2Name, team: 2, color: "#3b82f6", textColor: "#93c5fd" },
        ].map(({ name, team, color, textColor }) => (
          <div
            key={team}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(5px,0.5vw,8px)",
              padding: "clamp(2px,0.4vh,5px) clamp(10px,1vw,16px)",
              borderRadius: "999px",
              background: currentTurn === team ? `${color}14` : "transparent",
              transition: "background 0.35s ease",
            }}
          >
            <div style={{
              width: "8px", height: "8px",
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
              boxShadow: currentTurn === team ? `0 0 6px ${color}` : "none",
            }} />
            <span style={{
              fontFamily: "Cairo,sans-serif",
              fontWeight: 700,
              fontSize: "clamp(0.62rem,1.1vw,0.82rem)",
              color: currentTurn === team ? textColor : "rgba(212,168,32,0.45)",
              transition: "color 0.35s ease",
            }}>{name}</span>
            {currentTurn === team && (
              <span style={{
                fontFamily: "Cairo,sans-serif",
                fontWeight: 800,
                fontSize: "clamp(0.55rem,0.9vw,0.7rem)",
                color: textColor,
                opacity: 0.8,
              }}>← دوره</span>
            )}
          </div>
        ))}
      </div>

      {/* ══════════ ALL USED BANNER ══════════ */}
      {allUsed && !showWinner && (
        <div style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          padding: "16px",
          textAlign: "center",
          zIndex: 40,
          background: "linear-gradient(135deg,rgba(91,14,20,0.96),rgba(139,21,32,0.96))",
          borderTop: "1px solid rgba(212,168,32,0.4)",
          backdropFilter: "blur(14px)",
        }}>
          <div style={{ fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "1.15rem", color: "#d4a820", marginBottom: "10px" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "10px 32px",
              borderRadius: "999px",
              fontFamily: "Cairo,sans-serif",
              fontWeight: 900,
              fontSize: "1rem",
              background: "linear-gradient(135deg,#d4a820,#f0c530)",
              color: "#2a0d10",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(212,168,32,0.4)",
            }}
          >عرض النتيجة النهائية</button>
        </div>
      )}

      {/* ══════════ END CONFIRM ══════════ */}
      {showEndConfirm && (
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: "16px",
          background: "rgba(4,1,6,0.82)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{
            borderRadius: "24px",
            padding: "clamp(24px,3vw,40px)",
            maxWidth: "360px",
            width: "100%",
            textAlign: "center",
            background: "rgba(10,4,14,0.94)",
            border: "1px solid rgba(255,215,130,0.22)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          }}>
            <div style={{ fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "1.4rem", color: "#d4a820", marginBottom: "8px" }}>إنهاء اللعبة؟</div>
            <div style={{ fontFamily: "Cairo,sans-serif", fontSize: "0.85rem", color: "rgba(212,168,32,0.5)", marginBottom: "24px" }}>سيتم إعلان الفائز الحالي</div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleEndGame}
                style={{
                  padding: "10px 24px", borderRadius: "999px",
                  fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "0.95rem",
                  background: "linear-gradient(135deg,#5b0e14,#8b1520)",
                  color: "#d4a820", border: "1px solid rgba(212,168,32,0.28)",
                  cursor: "pointer",
                }}
              >نعم، إنهاء</button>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: "10px 24px", borderRadius: "999px",
                  fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: "0.95rem",
                  background: "transparent",
                  color: "rgba(212,168,32,0.5)",
                  border: "1px solid rgba(212,168,32,0.18)",
                  cursor: "pointer",
                }}
              >رجوع</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ WINNER SCREEN ══════════ */}
      {showWinner && (
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: "24px",
          textAlign: "center",
          backgroundImage: `linear-gradient(rgba(6,2,8,0.90),rgba(4,1,6,0.96)),url("${ROMAN_BG_IMG}")`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
        }}>
          <div style={{ fontSize: "clamp(3.5rem,7vw,6rem)", marginBottom: "8px" }}>🏆</div>
          <div style={{ fontFamily: "Cairo,sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "rgba(212,168,32,0.55)", marginBottom: "6px" }}>الفائز</div>
          <div style={{
            fontFamily: "Cairo,sans-serif",
            fontWeight: 900,
            fontSize: "clamp(2.2rem,5vw,4.5rem)",
            color: "#d4a820",
            textShadow: "0 4px 24px rgba(212,168,32,0.45), 0 0 60px rgba(212,168,32,0.15)",
            marginBottom: "28px",
            lineHeight: 1.1,
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
            {[
              { name: team1Name, score: teamScores.team1, color: "#ef4444", textColor: "#fca5a5" },
              { name: team2Name, score: teamScores.team2, color: "#3b82f6", textColor: "#93c5fd" },
            ].map(({ name, score, color, textColor }) => (
              <div key={name} style={{
                textAlign: "center",
                borderRadius: "18px",
                padding: "16px 24px",
                background: `${color}18`,
                border: `1px solid ${color}44`,
              }}>
                <div style={{ fontFamily: "Cairo,sans-serif", fontWeight: 700, fontSize: "0.85rem", color: textColor, marginBottom: "6px" }}>{name}</div>
                <div style={{ fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: "2.2rem", color: "#d4a820" }}>{score}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (gameMode === "tournament") {
                const ref = tournamentState?.currentMatchRef;
                if (ref) {
                  const winnerId = teamScores.team1 >= teamScores.team2 ? ref.team1Id : ref.team2Id;
                  navigate("/tournament/bracket", { state: { autoRecord: { roundIdx: ref.roundIdx, matchIdx: ref.matchIdx, winnerId } } });
                } else {
                  navigate("/tournament/bracket");
                }
              } else {
                resetGame(); navigate("/");
              }
            }}
            style={{
              padding: "clamp(12px,1.5vh,18px) clamp(32px,4vw,56px)",
              borderRadius: "999px",
              fontFamily: "Cairo,sans-serif",
              fontWeight: 900,
              fontSize: "clamp(1rem,1.5vw,1.2rem)",
              background: "linear-gradient(135deg,#c09820,#f0d045)",
              color: "#1a0a0b",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 32px rgba(192,152,32,0.45)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Team Block (score bar panel) ── */
function TeamBlock({ name, score, active, side, color, glow }) {
  return (
    <div
      className={`team-block${active ? " active" : ""}`}
      style={{
        "--team-glow": glow,
        flex: 1,
        maxWidth: "clamp(120px,18vw,260px)",
        borderRadius: "14px",
        padding: "clamp(7px,1vh,12px) clamp(10px,1.5vw,20px)",
        background: active
          ? `linear-gradient(145deg, ${color}28, ${color}12)`
          : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${active ? color + "99" : "rgba(255,215,130,0.12)"}`,
        display: "flex",
        flexDirection: "column",
        alignItems: side === "right" ? "flex-end" : "flex-start",
        gap: "2px",
        transition: "all 0.4s ease",
      }}
    >
      {/* Team name */}
      <div style={{
        fontFamily: "Cairo,sans-serif",
        fontWeight: 800,
        fontSize: "clamp(0.62rem,1.2vw,0.98rem)",
        color: active ? (color === "#ef4444" ? "#fca5a5" : "#93c5fd") : "rgba(244,239,230,0.65)",
        lineHeight: 1.2,
        letterSpacing: "0.01em",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        flexDirection: side === "right" ? "row-reverse" : "row",
      }}>
        <span style={{ fontSize: "0.8em" }}>{color === "#ef4444" ? "🔴" : "🔵"}</span>
        <span style={{
          maxWidth: "clamp(70px,12vw,160px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>{name}</span>
      </div>

      {/* Score */}
      <div
        data-testid={color === "#ef4444" ? "team1-score" : "team2-score"}
        style={{
          fontFamily: "Cairo,sans-serif",
          fontWeight: 900,
          fontSize: "clamp(1.3rem,2.8vw,2.4rem)",
          lineHeight: 1,
          color: "#d4a820",
          textShadow: active ? "0 2px 10px rgba(212,168,32,0.45)" : "none",
          letterSpacing: "-0.02em",
        }}
      >
        <ScoreCounter value={score} />
      </div>

      {/* Active label */}
      {active && (
        <div style={{
          fontFamily: "Cairo,sans-serif",
          fontWeight: 700,
          fontSize: "clamp(0.52rem,0.85vw,0.68rem)",
          color: color === "#ef4444" ? "rgba(252,165,165,0.7)" : "rgba(147,197,253,0.7)",
          letterSpacing: "0.03em",
        }}>دوره الآن</div>
      )}
    </div>
  );
}
