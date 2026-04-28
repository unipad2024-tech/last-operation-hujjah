import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════════════
   HUJJAH — GameBoardPage
   Navy glass UI · Immersive category cards · All logic preserved
   ═══════════════════════════════════════════════════════════════════════════ */

const API         = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];

/* pill styles */
const PILL = {
  300: { bg: "linear-gradient(135deg,#1db954,#17a348)", shadow: "rgba(29,185,84,0.42)",  color: "#fff",    label: "٣٠٠" },
  600: { bg: "linear-gradient(135deg,#f5c842,#e5a800)", shadow: "rgba(245,200,66,0.42)", color: "#1a1a2e", label: "٦٠٠" },
  900: { bg: "linear-gradient(135deg,#ff6b6b,#e03e3e)", shadow: "rgba(255,107,107,0.42)", color: "#fff",   label: "٩٠٠" },
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
    <span style={{
      display: "inline-block",
      transform: pop ? "scale(1.22)" : "scale(1)",
      transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {display}
    </span>
  );
}

/* ── Confetti ── */
function fireConfetti() {
  const colors = ["#f5c842","#ff6b6b","#43e97b","#4facfe","#a78bfa","#fff"];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed", top: "-10px",
      left: Math.random() * 100 + "vw",
      width:  (Math.random() * 9 + 5) + "px",
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

/* ── Category Card ── */
function CategoryCard({ cat, session, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const t1Cats   = session?.team1_categories || [];
  const isT1     = t1Cats.includes(cat.id);
  const teamName  = isT1 ? session?.team1_name  : session?.team2_name;
  const teamColor = isT1 ? "#ff6b6b" : "#4facfe";
  const teamDot   = isT1 ? "active-red" : "active-blue";
  const [imgErr, setImgErr] = useState(false);

  /* check used state for both slots */
  const slotUsed = (diff, slot) => isTileUsed(`${cat.id}_${diff}_${slot}`);
  const bothUsed = (diff) => slotUsed(diff, 1) && slotUsed(diff, 2);
  const mySlot   = currentTurn; /* slot = current team's turn */
  const myUsed   = (diff) => slotUsed(diff, mySlot);

  /* all 6 tiles used = card fully answered */
  const allDone = DIFFICULTIES.every(d => bothUsed(d));

  return (
    <div
      className="category-card"
      style={{ position: "relative", opacity: allDone ? 0.42 : 1 }}
    >
      {/* ── Image area (full-width cover, top 55%) ── */}
      <div className="card-image-wrap">
        {cat.image_url && !imgErr ? (
          <img
            src={cat.image_url}
            alt={cat.name}
            onError={() => setImgErr(true)}
          />
        ) : (
          /* fallback: colored gradient with icon */
          <div style={{
            width: "100%", height: "100%",
            background: `linear-gradient(135deg, ${cat.color || "#302b63"}cc, ${cat.color || "#0f0c29"}44)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "clamp(2.5rem,5vw,4rem)",
          }}>
            {cat.icon || "🎯"}
          </div>
        )}
        {/* gradient overlay */}
        <div className="card-img-gradient" />

        {/* team label overlaid on image bottom */}
        <div style={{
          position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: "5px", zIndex: 2,
          padding: "3px 12px", borderRadius: "50px",
          background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)",
          border: `1px solid ${teamColor}55`,
          whiteSpace: "nowrap",
        }}>
          <span className={`player-dot ${teamDot}`} />
          <span style={{
            fontFamily: "Tajawal, Cairo, sans-serif",
            fontSize: "0.72rem", fontWeight: 700,
            color: teamColor,
            maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis",
          }}>{teamName}</span>
        </div>

        {/* all-used overlay */}
        {allDone && (
          <div className="answered-overlay">
            <div className="answered-check">✓</div>
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div className="card-body">
        {/* Category name */}
        <div className="category-name">{cat.name}</div>

        {/* Point pills row */}
        <div className="points-row">
          {DIFFICULTIES.map(diff => {
            const p       = PILL[diff];
            const used    = myUsed(diff);
            const allGone = bothUsed(diff);
            const key     = `${cat.id}_${diff}_${mySlot}`;
            const clicking = clickingTile === key;

            return (
              <button
                key={diff}
                data-testid={`tile-${cat.id}-${diff}-${mySlot}`}
                className={`point-pill p${diff}${used || allGone ? " used" : ""}`}
                disabled={used || allGone || !!clickingTile}
                onClick={() => !used && !allGone && onTileClick(cat.id, diff, mySlot)}
                style={used || allGone ? {} : {
                  background: p.bg,
                  color: p.color,
                  boxShadow: `0 3px 14px ${p.shadow}`,
                }}
              >
                {clicking ? "⏳" : used ? "✓" : diff}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════ Main Board ═══ */
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

  /* ── Loading ── */
  if (loading) return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
      fontFamily: "Tajawal, Cairo, sans-serif",
    }}>
      <div style={{ color: "#f5c842", fontSize: "1.1rem", fontWeight: 700, opacity: 0.85 }}>
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
    <div style={{
      minHeight: "100svh",
      background: "linear-gradient(135deg,#0f0c29 0%,#302b63 55%,#24243e 100%)",
      fontFamily: "Tajawal, Cairo, sans-serif",
      display: "flex",
      flexDirection: "column",
      padding: "10px",
      gap: "10px",
      boxSizing: "border-box",
      overflow: "hidden",
      height: "100svh",
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" />

      <style>{`
        /* ── Confetti ── */
        @keyframes fall { to { transform: translateY(110vh) rotate(540deg); opacity: 0; } }

        /* ── Board card animations ── */
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.35; transform:scale(0.65); }
        }

        /* ── Category card ── */
        .category-card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 285px;
          cursor: default;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }
        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 44px rgba(0,0,0,0.52);
        }
        .category-card:nth-child(1) { animation-delay: 0.04s }
        .category-card:nth-child(2) { animation-delay: 0.09s }
        .category-card:nth-child(3) { animation-delay: 0.14s }
        .category-card:nth-child(4) { animation-delay: 0.19s }
        .category-card:nth-child(5) { animation-delay: 0.24s }
        .category-card:nth-child(6) { animation-delay: 0.29s }

        /* ── Image area ── */
        .card-image-wrap {
          position: relative;
          width: 100%;
          height: clamp(145px,18vh,195px);
          flex-shrink: 0;
          overflow: hidden;
        }
        .card-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: transform 0.4s ease;
        }
        .category-card:hover .card-image-wrap img { transform: scale(1.06); }
        .card-img-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 38%, rgba(12,10,36,0.88) 100%);
          pointer-events: none;
        }

        /* ── Card body ── */
        .card-body {
          padding: 10px 12px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        /* ── Category name ── */
        .category-name {
          font-size: clamp(1rem,1.5vw,1.25rem);
          font-weight: 800;
          color: #ffffff;
          text-align: center;
          font-family: 'Tajawal', Cairo, sans-serif;
          line-height: 1.25;
          text-shadow: 0 1px 6px rgba(0,0,0,0.45);
        }

        /* ── Points row ── */
        .points-row {
          display: flex;
          gap: 6px;
          width: 100%;
          justify-content: center;
        }
        .point-pill {
          flex: 1;
          text-align: center;
          padding: clamp(5px,0.8vh,9px) 4px;
          border-radius: 50px;
          font-size: clamp(0.82rem,1.1vw,1rem);
          font-weight: 800;
          font-family: 'Tajawal', Cairo, sans-serif;
          cursor: pointer;
          border: none;
          transition: transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.01em;
        }
        .point-pill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.15s;
        }
        .point-pill:not(.used):hover::after { background: rgba(255,255,255,0.14); }
        .point-pill:not(.used):hover { transform: translateY(-2px) scale(1.04); }
        .point-pill:not(.used):active { transform: scale(0.93); }
        .point-pill.used {
          opacity: 0.28;
          filter: grayscale(1);
          cursor: default;
          background: rgba(255,255,255,0.10) !important;
          box-shadow: none !important;
        }

        /* pill colors */
        .point-pill.p300:not(.used) {
          background: linear-gradient(135deg,#1db954,#17a348);
          color: #fff;
          box-shadow: 0 3px 12px rgba(29,185,84,0.42);
        }
        .point-pill.p600:not(.used) {
          background: linear-gradient(135deg,#f5c842,#e5a800);
          color: #1a1a2e;
          box-shadow: 0 3px 12px rgba(245,200,66,0.42);
        }
        .point-pill.p900:not(.used) {
          background: linear-gradient(135deg,#ff6b6b,#e03e3e);
          color: #fff;
          box-shadow: 0 3px 12px rgba(255,107,107,0.42);
        }

        /* ── Player dot ── */
        .player-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .player-dot.active-red  { background: #ff6b6b; box-shadow: 0 0 5px #ff6b6b; animation: pulseDot 1.4s infinite; }
        .player-dot.active-blue { background: #4facfe; box-shadow: 0 0 5px #4facfe; animation: pulseDot 1.4s infinite; }
        .player-dot.active-gold { background: #f5c842; box-shadow: 0 0 5px #f5c842; }

        /* ── Answered overlay ── */
        .answered-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(12,10,36,0.55);
          backdrop-filter: blur(3px);
        }
        .answered-check {
          width: 48px; height: 48px;
          background: rgba(67,233,123,0.14);
          border: 2px solid #43e97b;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; color: #43e97b;
        }

        /* ── Turn badge ── */
        .turn-badge {
          display: flex; align-items: center; gap: 6px;
          border-radius: 50px; padding: 5px 14px;
          font-family: 'Tajawal', Cairo, sans-serif;
          font-size: 0.88rem; font-weight: 700;
        }
        .turn-dot {
          width: 7px; height: 7px; border-radius: 50%;
          animation: pulseDot 1.4s infinite;
        }

        /* ── Control button ── */
        .ctrl-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.70);
          border-radius: 50px;
          padding: 5px 16px;
          font-family: 'Tajawal', Cairo, sans-serif;
          font-size: 0.82rem;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: background 0.2s;
          white-space: nowrap;
        }
        .ctrl-btn:hover { background: rgba(255,255,255,0.15); }
        .ctrl-btn.end  { border-color: rgba(255,107,107,0.38); color: #ff9a9a; }

        /* ── Modal backdrop ── */
        .modal-bg {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          background: rgba(10,8,28,0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .modal-box {
          background: linear-gradient(155deg,rgba(26,22,62,0.98),rgba(10,8,28,0.99));
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 22px;
          padding: clamp(22px,3vw,36px);
          max-width: 360px; width: 100%;
          text-align: center;
          box-shadow: 0 24px 70px rgba(0,0,0,0.70);
          font-family: 'Tajawal', Cairo, sans-serif;
        }

        /* ── Winner screen ── */
        @keyframes winnerIn {
          from { opacity:0; transform:scale(0.88) translateY(20px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .winner-screen {
          position: fixed; inset: 0; z-index: 60;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px; text-align: center;
          background: linear-gradient(135deg,rgba(12,10,30,0.97),rgba(6,5,18,0.99));
          backdrop-filter: blur(20px);
          animation: winnerIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
          font-family: 'Tajawal', Cairo, sans-serif;
        }

        /* ── Responsive ── */
        @media (max-width: 800px) {
          .board-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 520px) {
          .board-grid { grid-template-columns: 1fr !important; }
          .game-header { grid-template-columns: 1fr !important; height: auto !important; gap: 8px !important; }
        }
      `}</style>

      {/* ══════════ HEADER ══════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: "10px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "16px",
        padding: "8px 16px",
        height: "62px",
        flexShrink: 0,
        className: "game-header",
      }}>

        {/* Team 1 */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: currentTurn === 1 ? "rgba(255,107,107,0.10)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${currentTurn === 1 ? "rgba(255,107,107,0.35)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "12px", padding: "6px 14px",
          backdropFilter: "blur(12px)",
          boxShadow: currentTurn === 1 ? "0 0 16px rgba(255,107,107,0.18)" : "none",
          transition: "all 0.35s ease",
          minWidth: 0,
        }}>
          {currentTurn === 1 && (
            <span className="turn-dot" style={{ background: "#ff6b6b", flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              🔴 {team1Name}
            </div>
            <div data-testid="team1-score" style={{ fontSize: "1.7rem", fontWeight: 900, color: "#f5c842", lineHeight: 1 }}>
              <ScoreCounter value={teamScores.team1} />
            </div>
          </div>
        </div>

        {/* Center: title + turn + controls */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <div style={{
            fontSize: "clamp(0.9rem,1.6vw,1.25rem)", fontWeight: 900,
            color: "#f5c842", letterSpacing: "0.04em",
            textShadow: "0 0 20px rgba(245,200,66,0.40)",
          }}>
            حُجّة
          </div>

          <div
            data-testid="turn-indicator"
            className="turn-badge"
            style={{
              background: currentTurn === 1 ? "rgba(255,107,107,0.12)" : "rgba(79,172,254,0.12)",
              border: `1px solid ${currentTurn === 1 ? "rgba(255,107,107,0.32)" : "rgba(79,172,254,0.32)"}`,
              color: currentTurn === 1 ? "#ff9a9a" : "#93c5fd",
            }}
          >
            <span className="turn-dot" style={{ background: currentTurn === 1 ? "#ff6b6b" : "#4facfe" }} />
            <span>دور {currentTurn === 1 ? team1Name : team2Name}</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              data-testid="dark-mode-toggle"
              className="ctrl-btn"
              onClick={toggleDarkMode}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              data-testid="end-game-btn"
              className="ctrl-btn end"
              onClick={() => setShowEndConfirm(true)}
            >
              إنهاء
            </button>
          </div>
        </div>

        {/* Team 2 */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          justifyContent: "flex-end",
          background: currentTurn === 2 ? "rgba(79,172,254,0.10)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${currentTurn === 2 ? "rgba(79,172,254,0.35)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "12px", padding: "6px 14px",
          backdropFilter: "blur(12px)",
          boxShadow: currentTurn === 2 ? "0 0 16px rgba(79,172,254,0.18)" : "none",
          transition: "all 0.35s ease",
          minWidth: 0,
        }}>
          <div style={{ textAlign: "right", minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              🔵 {team2Name}
            </div>
            <div data-testid="team2-score" style={{ fontSize: "1.7rem", fontWeight: 900, color: "#f5c842", lineHeight: 1, textAlign: "right" }}>
              <ScoreCounter value={teamScores.team2} />
            </div>
          </div>
          {currentTurn === 2 && (
            <span className="turn-dot" style={{ background: "#4facfe", flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* ══════════ BOARD GRID ══════════ */}
      <div
        className="board-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "12px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {categories.slice(0, 6).map(cat => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            session={session}
            isTileUsed={isTileUsed}
            clickingTile={clickingTile}
            currentTurn={currentTurn}
            onTileClick={handleTileClick}
          />
        ))}
      </div>

      {/* ══════════ LEGEND ══════════ */}
      <div style={{
        flexShrink: 0,
        display: "flex", justifyContent: "center", gap: "18px",
        padding: "2px 0 4px",
      }}>
        {[
          { name: team1Name, turn: 1, color: "#ff6b6b", dot: "active-red" },
          { name: team2Name, turn: 2, color: "#4facfe", dot: "active-blue" },
        ].map(({ name, turn, color, dot }) => (
          <div key={turn} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "3px 12px", borderRadius: "50px",
            background: currentTurn === turn ? `rgba(255,255,255,0.06)` : "transparent",
          }}>
            <span className={`player-dot ${dot}`} />
            <span style={{
              fontFamily: "Tajawal, Cairo, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(0.65rem,1vw,0.82rem)",
              color: currentTurn === turn ? color : "rgba(255,255,255,0.35)",
              transition: "color 0.3s",
            }}>
              {name}
              {currentTurn === turn && <span style={{ marginRight: "4px" }}>← دوره</span>}
            </span>
          </div>
        ))}
      </div>

      {/* ══════════ ALL USED BANNER ══════════ */}
      {allUsed && !showWinner && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
          padding: "14px", textAlign: "center",
          background: "rgba(15,12,41,0.94)", backdropFilter: "blur(14px)",
          borderTop: "1px solid rgba(245,200,66,0.30)",
        }}>
          <div style={{ fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "#f5c842", marginBottom: "10px" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "10px 28px", borderRadius: "50px",
              fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.95rem",
              background: "linear-gradient(135deg,#f5c842,#e5a800)",
              color: "#1a1a2e", border: "none", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(245,200,66,0.42)",
            }}
          >
            عرض النتيجة النهائية
          </button>
        </div>
      )}

      {/* ══════════ END CONFIRM ══════════ */}
      {showEndConfirm && (
        <div className="modal-bg">
          <div className="modal-box">
            <div style={{ fontWeight: 900, fontSize: "1.35rem", color: "#f5c842", marginBottom: "8px" }}>إنهاء اللعبة؟</div>
            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.42)", marginBottom: "24px" }}>سيتم إعلان الفائز الحالي</div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleEndGame}
                style={{
                  padding: "10px 24px", borderRadius: "50px",
                  fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.95rem",
                  background: "linear-gradient(135deg,rgba(255,107,107,0.85),rgba(224,62,62,0.90))",
                  color: "#fff", border: "1px solid rgba(255,107,107,0.50)",
                  cursor: "pointer", boxShadow: "0 4px 18px rgba(255,107,107,0.30)",
                }}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: "10px 24px", borderRadius: "50px",
                  fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 700, fontSize: "0.95rem",
                  background: "transparent", color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                }}
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ WINNER SCREEN ══════════ */}
      {showWinner && (
        <div className="winner-screen">
          <div style={{ fontSize: "clamp(3.5rem,7vw,6rem)", marginBottom: "8px" }}>🏆</div>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "rgba(245,200,66,0.55)", marginBottom: "6px" }}>الفائز</div>
          <div style={{
            fontWeight: 900, fontSize: "clamp(2.2rem,5vw,4.5rem)",
            color: "#f5c842", marginBottom: "28px", lineHeight: 1.1,
            textShadow: "0 4px 28px rgba(245,200,66,0.45)",
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div style={{ display: "flex", gap: "20px", marginBottom: "32px" }}>
            {[
              { name: team1Name, score: teamScores.team1, color: "#ff6b6b" },
              { name: team2Name, score: teamScores.team2, color: "#4facfe" },
            ].map(({ name, score, color }) => (
              <div key={name} style={{
                textAlign: "center", borderRadius: "18px", padding: "16px 24px",
                background: `${color}14`, border: `1px solid ${color}40`,
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color, marginBottom: "6px" }}>{name}</div>
                <div style={{ fontWeight: 900, fontSize: "2.2rem", color: "#f5c842" }}>{score}</div>
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
                } else { navigate("/tournament/bracket"); }
              } else { resetGame(); navigate("/"); }
            }}
            style={{
              padding: "clamp(12px,1.5vh,18px) clamp(32px,4vw,56px)",
              borderRadius: "50px",
              fontFamily: "Tajawal, Cairo, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(1rem,1.5vw,1.2rem)",
              background: "linear-gradient(135deg,#f5c842,#e5a800)",
              color: "#1a1208", border: "none", cursor: "pointer",
              boxShadow: "0 6px 32px rgba(245,200,66,0.42)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
