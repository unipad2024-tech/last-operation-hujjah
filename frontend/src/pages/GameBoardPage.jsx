import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DIFFICULTIES = [300, 600, 900];

/* ── Color palettes ── */
const LIGHT = {
  boardBg:    "linear-gradient(155deg, #F5EDD8 0%, #EDE0C0 40%, #D4C8A8 100%)",
  cardBg:     "rgba(255,250,240,0.90)",
  cardBorder: "rgba(91,14,20,0.10)",
  textMain:   "#2A0D10",
  textSub:    "#7A3A28",
  scoreBg:    "rgba(20,6,8,0.94)",
  scoreBorder:"rgba(212,160,23,0.28)",
};
const DARK = {
  boardBg:    "rgba(6,2,3,1)",
  cardBg:     "rgba(10,3,4,0.62)",
  cardBorder: "rgba(212,160,23,0.14)",
  textMain:   "#EDE0C8",
  textSub:    "rgba(212,160,23,0.72)",
  scoreBg:    "rgba(4,1,2,0.95)",
  scoreBorder:"rgba(212,160,23,0.20)",
};

const ROMAN_BG_IMG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";

/* ── Score button colors (imperial gold → amber → crimson) ── */
const DIFF_STYLE = {
  300: { bg: "linear-gradient(145deg,#C09820,#F0D045)", shadow: "rgba(192,152,32,0.65)", darkBg: "linear-gradient(145deg,#A07A18,#D4B030)" },
  600: { bg: "linear-gradient(145deg,#C45C0A,#F07830)", shadow: "rgba(196,92,10,0.65)",  darkBg: "linear-gradient(145deg,#A84C08,#D06428)" },
  900: { bg: "linear-gradient(145deg,#6E0F18,#A82030)", shadow: "rgba(110,15,24,0.70)",  darkBg: "linear-gradient(145deg,#5B0E14,#8B1A28)" },
};

function ScoreCounter({ value, dark }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (value === prev.current) return;
    setPop(true);
    const diff = value - prev.current;
    const steps = 12;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (diff * i) / steps));
      if (i >= steps) { clearInterval(t); setDisplay(value); setPop(false); prev.current = value; }
    }, 40);
    return () => clearInterval(t);
  }, [value]);

  return (
    <span className={`font-black tabular-nums inline-block transition-transform ${pop ? "scale-125" : ""}`}
      style={{ color: "#D4A820", textShadow: "0 2px 8px rgba(212,168,32,0.35)" }}>
      {display}
    </span>
  );
}

function fireConfetti() {
  const colors = ["#F1E194","#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6"];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = Math.random() * 100 + "vw";
    el.style.width = (Math.random() * 10 + 5) + "px";
    el.style.height = (Math.random() * 10 + 5) + "px";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
    el.style.animationDuration = (Math.random() * 3 + 2) + "s";
    el.style.animationDelay = Math.random() * 1 + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
}

/* ── Score Button ── */
function ScoreBtn({ catId, diff, slot, used, clicking, onClick, dark }) {
  const ds  = DIFF_STYLE[diff];
  const key = `${catId}_${diff}_${slot}`;
  const isClicking = clicking === key;

  return (
    <button
      data-testid={`tile-${catId}-${diff}-${slot}`}
      onClick={onClick}
      disabled={used || !!clicking}
      className={`
        score-btn-tile w-full rounded-2xl font-black text-center select-none transition-all duration-200
        ${used
          ? "opacity-20 cursor-default"
          : "hover:scale-[1.08] active:scale-95 cursor-pointer hover:-translate-y-1"}
      `}
      style={{
        background: used
          ? (dark ? "rgba(60,20,24,0.25)" : "rgba(180,160,140,0.3)")
          : (dark ? ds.darkBg : ds.bg),
        boxShadow: used ? "none" : `0 4px 12px ${ds.shadow}, 0 2px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)`,
        padding: "clamp(4px,0.8vh,10px) clamp(2px,0.4vw,6px)",
        fontSize: "clamp(0.7rem, 1.3vw, 1.25rem)",
        color: used ? (dark ? "rgba(212,160,23,0.25)" : "rgba(80,60,50,0.3)") : "#fff",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        border: used ? `1px solid rgba(212,160,23,0.08)` : "1px solid rgba(255,255,255,0.22)",
        textShadow: used ? "none" : "0 1px 4px rgba(0,0,0,0.5)",
      }}
    >
      {isClicking ? "⏳" : used ? "✓" : diff}
    </button>
  );
}

/* ── Category Card ── */
function CategoryCard({ cat, session, isTileUsed, clickingTile, onTileClick, dark }) {
  const P = dark ? DARK : LIGHT;
  const t1Cats   = session?.team1_categories || [];
  const isT1     = t1Cats.includes(cat.id);
  const teamName = isT1 ? session?.team1_name : session?.team2_name;
  const teamColor= isT1 ? "#ef4444" : "#3b82f6";

  return (
    <div
      className="category-card rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: P.cardBg,
        backdropFilter: dark ? "blur(14px)" : "blur(6px)",
        WebkitBackdropFilter: dark ? "blur(14px)" : "blur(6px)",
        border: `1.5px solid ${P.cardBorder}`,
        boxShadow: dark
          ? "0 6px 28px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,160,23,0.06)"
          : "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Team indicator strip */}
      <div className="h-1 w-full shrink-0" style={{
        background: isT1
          ? "linear-gradient(90deg, #ef4444, #c0392b)"
          : "linear-gradient(90deg, #3b82f6, #2563eb)",
        opacity: 0.9
      }} />

      {/* Content: [left buttons | center image | right buttons] */}
      <div className="flex-1 flex flex-row items-stretch gap-1 px-1 py-1" style={{ minHeight: 0, overflow: "hidden" }}>

        {/* Left column: slot 1 buttons */}
        <div className="card-btn-col flex flex-col justify-around gap-1 shrink-0" style={{ width: "clamp(40px,5.5vw,80px)" }}>
          {DIFFICULTIES.map(diff => (
            <ScoreBtn
              key={`${cat.id}_${diff}_1`}
              catId={cat.id} diff={diff} slot={1}
              used={isTileUsed(`${cat.id}_${diff}_1`)}
              clicking={clickingTile}
              onClick={() => onTileClick(cat.id, diff, 1)}
              dark={dark}
            />
          ))}
        </div>

        {/* Center: large image + title */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 py-1">
          <div
            className="rounded-xl overflow-hidden flex items-center justify-center mb-1.5"
            style={{
              width:  "clamp(38px, 6.5vw, 100px)",
              height: "clamp(38px, 6.5vw, 100px)",
              background: `linear-gradient(135deg, ${cat.color || "#5B0E14"}44, ${cat.color || "#5B0E14"}11)`,
              boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
              flexShrink: 0,
            }}
          >
            {cat.image_url ? (
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <span style={{ fontSize: "clamp(1.2rem, 2.8vw, 2.4rem)" }}>{cat.icon || "🎯"}</span>
            )}
          </div>

          {/* Category name */}
          <div
            className="font-black text-center leading-tight"
            style={{
              color: dark ? "#EDE0C8" : "#2A0D10",
              fontSize: "clamp(0.72rem, 1.4vw, 1.1rem)",
              fontFamily: "Cairo, sans-serif",
              maxWidth: "160px",
              textShadow: dark ? "0 1px 4px rgba(0,0,0,0.5)" : "none",
            }}
          >
            {cat.name}
          </div>

          {/* Team badge */}
          <div
            className="mt-0.5 font-bold px-3 py-0.5 rounded-full"
            style={{
              background: isT1 ? "rgba(239,68,68,0.18)" : "rgba(59,130,246,0.18)",
              color: isT1 ? "#fca5a5" : "#93c5fd",
              border: `1px solid ${isT1 ? "rgba(239,68,68,0.35)" : "rgba(59,130,246,0.35)"}`,
              fontSize: "clamp(0.65rem, 1.2vw, 0.88rem)",
              letterSpacing: "0.02em",
            }}
          >
            {teamName}
          </div>
        </div>

        {/* Right column: slot 2 buttons */}
        <div className="card-btn-col flex flex-col justify-around gap-1 shrink-0" style={{ width: "clamp(40px,5.5vw,80px)" }}>
          {DIFFICULTIES.map(diff => (
            <ScoreBtn
              key={`${cat.id}_${diff}_2`}
              catId={cat.id} diff={diff} slot={2}
              used={isTileUsed(`${cat.id}_${diff}_2`)}
              clicking={clickingTile}
              onClick={() => onTileClick(cat.id, diff, 2)}
              dark={dark}
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

  const P = darkMode ? DARK : LIGHT;
  const team1Name = session?.team1_name || "الفريق الأحمر";
  const team2Name = session?.team2_name || "الفريق الأزرق";

  useEffect(() => {
    if (!session) { navigate("/"); return; }
    loadBoard();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!session) return;
    // selectedQuestions and teamScores are managed by GameContext
  }, [session]);

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
    // Mark tile immediately to prevent race conditions
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
    <div
      className="h-screen flex items-center justify-center"
      style={darkMode ? {
        backgroundImage: `radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.65) 100%), linear-gradient(to bottom, rgba(6,2,3,0.84) 0%, rgba(4,1,2,0.93) 100%), url("${ROMAN_BG_IMG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
      } : { background: P.boardBg }}
    >
      <div className="text-xl font-bold animate-pulse" style={{ color: "#D4A820", fontFamily: "Cairo, sans-serif" }}>جاري تحميل اللوحة...</div>
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
      className="h-screen flex flex-col overflow-hidden"
      style={darkMode ? {
        minHeight: "100svh",
        backgroundImage: `radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.62) 100%), linear-gradient(to bottom, rgba(6,2,3,0.80) 0%, rgba(4,1,2,0.91) 100%), url("${ROMAN_BG_IMG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        backgroundAttachment: "fixed",
      } : {
        minHeight: "100svh",
        background: P.boardBg,
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(22px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
@keyframes boardLoad {
          from { opacity: 0; transform: scale(0.985); }
          to   { opacity: 1; transform: scale(1); }
        }
        html, body { overflow-x: hidden; }
        .game-board-grid {
          animation: boardLoad 0.45s cubic-bezier(0.22,1,0.36,1) both;
          overflow: hidden;
          min-height: 0;
        }
        .category-card {
          min-height: 0;
          min-width: 0;
          overflow: hidden;
          transition: transform 0.32s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.32s ease !important;
          animation: fadeInUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .category-card:nth-child(1) { animation-delay: 0.04s; }
        .category-card:nth-child(2) { animation-delay: 0.09s; }
        .category-card:nth-child(3) { animation-delay: 0.14s; }
        .category-card:nth-child(4) { animation-delay: 0.19s; }
        .category-card:nth-child(5) { animation-delay: 0.24s; }
        .category-card:nth-child(6) { animation-delay: 0.29s; }
        .category-card:hover {
          transform: translateY(-6px) scale(1.01) !important;
          box-shadow: 0 18px 50px rgba(212,160,23,0.28), 0 6px 18px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.10) !important;
        }
        .card-btn-col { flex-shrink: 0; }
        .score-btn-tile {
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, opacity 0.18s ease !important;
        }
        .score-btn-tile:not(:disabled):hover {
          transform: scale(1.08) translateY(-2px) !important;
        }
      `}</style>

      {/* ── Score Bar ── */}
      <div
        className="shrink-0 border-b"
        style={{
          background: P.scoreBg,
          borderColor: P.scoreBorder,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between px-3 md:px-4 py-1.5 md:py-2 gap-2 md:gap-3">

          {/* ── Team 1 Score Block ── */}
          <div
            data-testid="team1-score"
            className="flex flex-col items-center justify-center rounded-xl px-2 md:px-4 py-1.5 md:py-2 transition-all duration-500 flex-1"
            style={{
              background:  currentTurn === 1 ? "rgba(180,30,40,0.22)" : "rgba(180,30,40,0.07)",
              border:      `2px solid ${currentTurn === 1 ? "rgba(220,50,60,0.80)" : "rgba(180,30,40,0.20)"}`,
              boxShadow:   currentTurn === 1 ? "0 0 18px rgba(220,50,60,0.35), 0 0 36px rgba(180,30,40,0.12)" : "none",
              minWidth:    "clamp(80px,12vw,180px)",
              maxWidth:    "200px",
            }}
          >
            <span
              className="font-black leading-tight text-center truncate w-full"
              style={{ fontSize: "clamp(0.65rem, 1.4vw, 1.1rem)", color: "#fca5a5", maxWidth: "180px", fontFamily: "Cairo, sans-serif" }}
            >
              🔴 {team1Name}
            </span>
            <span
              className="font-black tabular-nums leading-none"
              style={{ fontSize: "clamp(1.2rem, 2.6vw, 2.2rem)", color: "#D4A820", textShadow: "0 2px 8px rgba(212,168,32,0.4)" }}
            >
              <ScoreCounter value={teamScores.team1} dark={darkMode} />
            </span>
          </div>

          {/* ── Center: Logo + LARGE Turn Indicator + Controls ── */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            {/* Game title */}
            <div
              className="font-black leading-none"
              style={{ fontSize: "clamp(0.8rem, 1.3vw, 1.1rem)", fontFamily: "Cairo, sans-serif", color: "#D4A820", textShadow: "0 2px 6px rgba(212,168,32,0.35)" }}
            >
              حُجّة
            </div>

            {/* Turn indicator */}
            <div
              data-testid="turn-indicator"
              className="flex items-center gap-1.5 rounded-lg font-black transition-all duration-500 text-center"
              style={{
                background:   currentTurn === 1 ? "rgba(180,30,40,0.28)" : "rgba(37,99,235,0.28)",
                border:       `1.5px solid ${currentTurn === 1 ? "rgba(220,50,60,0.85)" : "rgba(59,130,246,0.85)"}`,
                color:        currentTurn === 1 ? "#fca5a5" : "#93c5fd",
                fontSize:     "clamp(0.6rem, 1.2vw, 0.9rem)",
                padding:      "clamp(3px,0.5vh,6px) clamp(8px,1.1vw,14px)",
                boxShadow:    currentTurn === 1
                  ? "0 0 14px rgba(220,50,60,0.40)"
                  : "0 0 14px rgba(59,130,246,0.40)",
                whiteSpace:   "nowrap",
                animation:    "pulse 1.8s ease-in-out infinite",
              }}
            >
              <span style={{ fontSize: "clamp(0.7rem, 1.2vw, 0.95rem)" }}>{currentTurn === 1 ? "🔴" : "🔵"}</span>
              <span>دور {currentTurn === 1 ? team1Name : team2Name}</span>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                data-testid="dark-mode-toggle"
                onClick={toggleDarkMode}
                title={darkMode ? "الوضع الفاتح" : "الوضع الداكن"}
                className="flex items-center gap-1 font-bold rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: darkMode ? "rgba(120,170,90,0.3)" : "rgba(200,200,150,0.2)",
                  color:      darkMode ? "#C7D3A4" : "#F1E194",
                  border:     `1px solid ${darkMode ? "rgba(120,170,90,0.5)" : "rgba(241,225,148,0.3)"}`,
                  fontSize:   "clamp(0.55rem, 1vw, 0.75rem)",
                  padding:    "clamp(2px,0.4vh,5px) clamp(6px,1vw,12px)",
                }}
              >
                <span>{darkMode ? "☀️" : "🌙"}</span>
                <span>{darkMode ? "فاتح" : "داكن"}</span>
              </button>
              <button
                data-testid="end-game-btn"
                onClick={() => setShowEndConfirm(true)}
                className="font-bold rounded-full transition-all duration-200 hover:scale-105 hover:opacity-80"
                style={{
                  color:    "rgba(241,225,148,0.4)",
                  border:   "1px solid rgba(241,225,148,0.15)",
                  fontSize: "clamp(0.55rem, 0.9vw, 0.7rem)",
                  padding:  "clamp(2px,0.35vh,5px) clamp(5px,0.8vw,10px)",
                }}
              >
                إنهاء
              </button>
            </div>
          </div>

          {/* ── Team 2 Score Block ── */}
          <div
            data-testid="team2-score"
            className="flex flex-col items-center justify-center rounded-xl px-2 md:px-4 py-1.5 md:py-2 transition-all duration-500 flex-1"
            style={{
              background:  currentTurn === 2 ? "rgba(37,99,235,0.22)" : "rgba(37,99,235,0.07)",
              border:      `2px solid ${currentTurn === 2 ? "rgba(59,130,246,0.80)" : "rgba(37,99,235,0.20)"}`,
              boxShadow:   currentTurn === 2 ? "0 0 18px rgba(59,130,246,0.35), 0 0 36px rgba(37,99,235,0.12)" : "none",
              minWidth:    "clamp(80px,12vw,180px)",
              maxWidth:    "200px",
            }}
          >
            <span
              className="font-black leading-tight text-center truncate w-full"
              style={{ fontSize: "clamp(0.65rem, 1.4vw, 1.1rem)", color: "#93c5fd", maxWidth: "180px", fontFamily: "Cairo, sans-serif" }}
            >
              {team2Name} 🔵
            </span>
            <span
              className="font-black tabular-nums leading-none"
              style={{ fontSize: "clamp(1.2rem, 2.6vw, 2.2rem)", color: "#D4A820", textShadow: "0 2px 8px rgba(212,168,32,0.4)" }}
            >
              <ScoreCounter value={teamScores.team2} dark={darkMode} />
            </span>
          </div>

        </div>
      </div>

      {/* ── Game Board: responsive grid ── */}
      <div
        className="flex-1 game-board-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          gap: "clamp(6px, 1.2vw, 16px)",
          padding: "clamp(8px, 1.4vw, 20px)",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          overflow: "hidden",
          minHeight: 0,
          alignSelf: "stretch",
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
            dark={darkMode}
          />
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="shrink-0 flex justify-center gap-4 pb-1 pt-0">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-500 ${currentTurn === 1 ? "bg-red-500/10" : ""}`}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }} />
          <span className="font-bold" style={{ color: currentTurn === 1 ? "#fca5a5" : "rgba(212,160,23,0.55)", fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)", fontFamily: "Cairo, sans-serif" }}>{team1Name}</span>
          {currentTurn === 1 && <span className="font-black" style={{ color: "#fca5a5", fontSize: "clamp(0.55rem, 1vw, 0.7rem)" }}>← دوره</span>}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-500 ${currentTurn === 2 ? "bg-blue-500/10" : ""}`}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }} />
          <span className="font-bold" style={{ color: currentTurn === 2 ? "#93c5fd" : "rgba(212,160,23,0.55)", fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)", fontFamily: "Cairo, sans-serif" }}>{team2Name}</span>
          {currentTurn === 2 && <span className="font-black" style={{ color: "#93c5fd", fontSize: "clamp(0.55rem, 1vw, 0.7rem)" }}>← دوره</span>}
        </div>
      </div>

      {/* ── All-used banner ── */}
      {allUsed && !showWinner && (
        <div
          className="fixed bottom-0 inset-x-0 p-4 text-center z-40 border-t-2"
          style={{
            background: "linear-gradient(135deg, #5B0E14, #8B1520)",
            borderColor: "rgba(212,160,23,0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="font-black text-xl mb-3" style={{ color: "#D4A820" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            className="px-8 py-3 rounded-full font-black text-lg hover:scale-105 transition-all"
            style={{ background: "linear-gradient(135deg,#D4A820,#F0C530)", color: "#2A0D10" }}
          >
            عرض النتيجة النهائية
          </button>
        </div>
      )}

      {/* ── End Confirm ── */}
      {showEndConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(4,1,2,0.85)", backdropFilter: "blur(10px)" }}>
          <div
            className="rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            style={{
              background: "rgba(12,4,6,0.92)",
              border: "1px solid rgba(212,160,23,0.25)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,160,23,0.1)",
            }}
          >
            <div className="text-2xl font-black mb-2" style={{ color: "#D4A820", fontFamily: "Cairo, sans-serif" }}>إنهاء اللعبة؟</div>
            <div className="mb-6 text-sm" style={{ color: "rgba(212,160,23,0.55)" }}>سيتم إعلان الفائز الحالي</div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleEndGame}
                className="px-6 py-3 rounded-full font-black hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg,#5B0E14,#8B1520)", color: "#D4A820", border: "1px solid rgba(212,160,23,0.3)" }}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-6 py-3 rounded-full font-bold transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(212,160,23,0.2)", color: "rgba(212,160,23,0.55)" }}
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Winner Screen ── */}
      {showWinner && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 text-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(6,2,3,0.90) 0%, rgba(4,1,2,0.95) 100%), url("${ROMAN_BG_IMG}")`,
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
          }}
        >
          <div style={{ fontSize: "clamp(4rem,8vw,7rem)" }} className="mb-4">🏆</div>
          <div className="text-lg font-bold mb-2" style={{ color: "rgba(212,160,23,0.55)", fontFamily: "Cairo, sans-serif" }}>الفائز</div>
          <div
            className="text-5xl md:text-7xl font-black mb-4"
            style={{
              color: "#D4A820",
              fontFamily: "Cairo,sans-serif",
              textShadow: "0 4px 20px rgba(212,168,32,0.45), 0 0 60px rgba(212,168,32,0.15)",
            }}
          >
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div className="flex gap-8 mb-8">
            <div
              className="text-center rounded-2xl px-6 py-4"
              style={{ background: "rgba(180,30,40,0.15)", border: "1px solid rgba(220,50,60,0.30)" }}
            >
              <div className="text-sm font-bold mb-1" style={{ color: "#fca5a5", fontFamily: "Cairo, sans-serif" }}>{team1Name}</div>
              <div className="text-3xl font-black" style={{ color: "#D4A820" }}>{teamScores.team1}</div>
            </div>
            <div className="flex items-center font-black" style={{ color: "rgba(212,160,23,0.35)", fontSize: "1.5rem" }}>VS</div>
            <div
              className="text-center rounded-2xl px-6 py-4"
              style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.30)" }}
            >
              <div className="text-sm font-bold mb-1" style={{ color: "#93c5fd", fontFamily: "Cairo, sans-serif" }}>{team2Name}</div>
              <div className="text-3xl font-black" style={{ color: "#D4A820" }}>{teamScores.team2}</div>
            </div>
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
            className="px-10 py-4 rounded-full font-black text-xl hover:scale-105 transition-all"
            style={{
              background: "linear-gradient(135deg,#C09820,#F0D045)",
              color: "#1A0A0B",
              boxShadow: "0 6px 30px rgba(192,152,32,0.45)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
