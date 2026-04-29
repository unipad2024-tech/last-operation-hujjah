import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API          = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];

/* ── Animated score counter ── */
function ScoreCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (value === prev.current) return;
    setPop(true);
    const diff  = value - prev.current;
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
  const colors = ["#b7950b","#f1c40f","#e74c3c","#2ecc71","#fff"];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed", top: "-10px",
      left: Math.random() * 100 + "vw",
      width:  (Math.random() * 9 + 5) + "px",
      height: (Math.random() * 9 + 5) + "px",
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      animation: `gbFall ${Math.random() * 3 + 2}s ${Math.random()}s linear forwards`,
      zIndex: 9999, pointerEvents: "none",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5500);
  }
}

/* ══════════════════════════════════════════════════════
   Category Card
   Layout: [point-column-right | center-visual | point-column-left]
   right = slot 1 (team 1), left = slot 2 (team 2)  [RTL direction]
   ══════════════════════════════════════════════════════ */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const [imgErr, setImgErr] = useState(false);

  const slotUsed = (diff, slot) => isTileUsed(`${cat.id}_${diff}_${slot}`);
  const bothUsed = (diff)       => slotUsed(diff, 1) && slotUsed(diff, 2);
  const allDone  = DIFFICULTIES.every(d => bothUsed(d));

  // color class per difficulty
  const diffClass = { 300: "btn-green", 600: "btn-orange", 900: "btn-red" };

  const renderBtn = (diff, slot) => {
    const used     = slotUsed(diff, slot);
    const allGone  = bothUsed(diff);
    const key      = `${cat.id}_${diff}_${slot}`;
    const clicking = clickingTile === key;
    const isMyTurn = currentTurn === slot;
    const disabled = used || allGone || !!clickingTile || !isMyTurn;

    let cls = `point-button ${diffClass[diff]}`;
    if (used || allGone) cls += " btn-used";
    else if (!isMyTurn)  cls += " btn-waiting";

    return (
      <button
        key={key}
        data-testid={`tile-${cat.id}-${diff}-${slot}`}
        className={cls}
        disabled={disabled}
        onClick={() => isMyTurn && !used && !allGone && onTileClick(cat.id, diff, slot)}
      >
        {clicking ? "…" : used ? "✓" : diff}
      </button>
    );
  };

  return (
    <div className="category-card" style={{ opacity: allDone ? 0.45 : 1 }}>

      {allDone && (
        <div className="answered-overlay">
          <span className="answered-check">✓</span>
        </div>
      )}

      <div className="card-header">{cat.name}</div>

      <div className="card-body">

        {/* Right column — slot 1 (team 1) — in RTL this renders on the right */}
        <div className="point-column point-column-right">
          {DIFFICULTIES.map(d => renderBtn(d, 1))}
        </div>

        {/* Center image */}
        <div className="center-visual-wrapper">
          {cat.image_url && !imgErr ? (
            <img
              className="center-image"
              src={cat.image_url}
              alt={cat.name}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="center-fallback">
              <span style={{ fontSize: "2.8rem" }}>{cat.icon || "🎯"}</span>
            </div>
          )}
        </div>

        {/* Left column — slot 2 (team 2) */}
        <div className="point-column point-column-left">
          {DIFFICULTIES.map(d => renderBtn(d, 2))}
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════ */
export default function GameBoardPage() {
  const navigate = useNavigate();
  const {
    session, resetGame, currentTurn,
    markTileUsed, isTileUsed, teamScores, saveSession,
    gameMode, tournamentState,
  } = useGame();

  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWinner,     setShowWinner]     = useState(false);
  const [clickingTile,   setClickingTile]   = useState(null);

  const team1Name = session?.team1_name || "الفريق الأحمر";
  const team2Name = session?.team2_name || "الفريق الأخضر";

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
    const iv = setInterval(refreshScores, 4000);
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
    try {
      const { data: q } = await axios.post(
        `${API}/game/session/${session.id}/question?category_id=${catId}&difficulty=${difficulty}`
      );
      navigate("/question", {
        state: {
          question: q, catId, difficulty, slot,
          catName: categories.find(c => c.id === catId)?.name,
          turnTeam: currentTurn,
        },
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
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#1a1a2e", fontFamily: "Amiri, serif",
    }}>
      <div style={{ color: "#f1c40f", fontSize: "1.3rem", fontWeight: 700 }}>
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
    <div className="game-page">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" />

      {/* ════════════════ ALL STYLES ════════════════ */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes gbFall { to { transform: translateY(110vh) rotate(540deg); opacity:0; } }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(18px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.3; transform:scale(0.5); }
        }
        @keyframes winnerIn {
          from { opacity:0; transform:scale(0.88) translateY(20px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        @keyframes shimmer {
          0%   { opacity: 0.7; }
          50%  { opacity: 1.0; }
          100% { opacity: 0.7; }
        }

        /* ── Page ── */
        .game-page {
          min-height: 100vh;
          background-color: #1a1a2e;
          background-image: url('/roman-bg.jpg');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          background-blend-mode: overlay;
          font-family: 'Amiri', serif;
          direction: rtl;
          color: #e6e6e6;
          position: relative;
        }

        /* warm dark overlay */
        .game-page::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 0%,  rgba(183,149,11,0.10), transparent 55%),
            radial-gradient(ellipse at 20% 80%, rgba(183,149,11,0.06), transparent 40%),
            rgba(10, 8, 4, 0.72);
          z-index: 0;
          pointer-events: none;
        }

        .game-page > * { position: relative; z-index: 1; }

        /* ── Topbar ── */
        .topbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 16px;
          align-items: center;
          padding: 12px 24px;
          background: linear-gradient(180deg, rgba(18,14,6,0.98), rgba(10,8,3,0.92));
          border-bottom: 2px solid rgba(183,149,11,0.45);
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 4px 24px rgba(0,0,0,0.6);
        }

        .topbar-left  { display:flex; align-items:center; justify-content:flex-start; }
        .topbar-right { display:flex; align-items:center; justify-content:flex-end; gap:10px; }
        .topbar-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        /* Title */
        .game-title {
          font-family: 'Amiri', serif;
          font-size: clamp(2.2rem, 3.2vw, 3.4rem);
          font-weight: 700;
          color: #f1c40f;
          text-shadow:
            0 0 30px rgba(241,196,15,0.5),
            0 2px 4px rgba(0,0,0,0.9);
          letter-spacing: 0.06em;
          line-height: 1;
          animation: shimmer 3s ease-in-out infinite;
        }

        /* Turn badge */
        .turn-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 14px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          border: 1px solid rgba(183,149,11,0.4);
          color: #d4ac0d;
          background: rgba(183,149,11,0.08);
          white-space: nowrap;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .turn-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: pulseDot 1.4s infinite;
          flex-shrink: 0;
        }

        /* Score panel */
        .score-panel {
          background: linear-gradient(135deg, rgba(44,44,84,0.92), rgba(20,18,8,0.95));
          border: 2px solid #b7950b;
          border-radius: 10px;
          padding: 10px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow:
            inset 0 1px 0 rgba(241,196,15,0.18),
            0 4px 16px rgba(0,0,0,0.55);
          transition: border-color 0.3s, box-shadow 0.3s;
          min-width: 190px;
        }
        .score-panel.active {
          border-color: #f1c40f;
          box-shadow:
            inset 0 1px 0 rgba(241,196,15,0.3),
            0 0 18px rgba(241,196,15,0.18),
            0 4px 16px rgba(0,0,0,0.55);
        }
        .team-icon { font-size: 1.8rem; line-height: 1; flex-shrink: 0; }
        .team-info { display: flex; flex-direction: column; gap: 2px; }
        .team-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(241,196,15,0.65);
          font-family: 'Noto Naskh Arabic', serif;
          white-space: nowrap;
        }
        .team-score {
          font-size: 1.6rem;
          font-weight: 700;
          color: #f1c40f;
          font-family: 'Amiri', serif;
          line-height: 1;
          text-shadow: 0 0 12px rgba(241,196,15,0.4);
        }

        /* End button */
        .end-game-btn {
          background: linear-gradient(160deg, #4a0f0f, #300909);
          border: 1.5px solid rgba(183,49,49,0.7);
          border-radius: 8px;
          color: #f0a0a0;
          font-family: 'Noto Naskh Arabic', serif;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 9px 18px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: inset 0 1px 0 rgba(255,100,100,0.1);
        }
        .end-game-btn:hover {
          border-color: #e74c3c;
          background: linear-gradient(160deg, #5e1515, #400c0c);
          color: #ffcccc;
        }

        /* ── Board grid ── */
        .gameboard-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 25px;
          padding: 20px;
        }

        /* ── Category Card ── */
        .category-card {
          background-color: rgba(44, 44, 84, 0.88);
          border: 3px solid #b7950b;
          border-radius: 15px;
          box-shadow:
            0 5px 20px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(241,196,15,0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          animation: cardIn 0.42s cubic-bezier(0.22,1,0.36,1) both;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .category-card:hover {
          border-color: #f1c40f;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.65),
            0 0 22px rgba(241,196,15,0.12),
            inset 0 1px 0 rgba(241,196,15,0.14);
          transform: translateY(-2px);
        }
        .category-card:nth-child(1) { animation-delay:0.05s }
        .category-card:nth-child(2) { animation-delay:0.10s }
        .category-card:nth-child(3) { animation-delay:0.15s }
        .category-card:nth-child(4) { animation-delay:0.20s }
        .category-card:nth-child(5) { animation-delay:0.25s }
        .category-card:nth-child(6) { animation-delay:0.30s }

        /* Card header */
        .card-header {
          background-color: rgba(183,149,11,0.12);
          color: #f1c40f;
          text-align: center;
          font-weight: 700;
          padding: 10px 12px;
          border-bottom: 2px solid rgba(183,149,11,0.45);
          font-size: 1.1rem;
          font-family: 'Amiri', serif;
          letter-spacing: 0.03em;
          text-shadow: 0 0 10px rgba(241,196,15,0.35);
        }

        /* Card body */
        .card-body {
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex: 1;
          padding: 12px 10px;
          gap: 8px;
        }

        /* Point columns */
        .point-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Center visual */
        .center-visual-wrapper {
          flex: 0 0 46%;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 110px;
        }
        .center-image {
          width: 100%;
          height: 130px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid rgba(183,149,11,0.5);
          filter: brightness(0.88) saturate(0.82) sepia(0.1) drop-shadow(0 0 6px rgba(183,149,11,0.25));
          display: block;
        }
        .center-fallback {
          width: 100%;
          height: 130px;
          border-radius: 10px;
          border: 1px solid rgba(183,149,11,0.4);
          background: linear-gradient(135deg, rgba(44,44,84,0.9), rgba(20,18,8,0.95));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Point buttons */
        .point-button {
          width: 60px;
          height: 38px;
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.22);
          border-radius: 7px;
          cursor: pointer;
          font-size: 0.88rem;
          font-weight: 700;
          font-family: 'Noto Naskh Arabic', serif;
          box-shadow: inset 0 2px 3px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.35);
          transition: transform 0.18s, filter 0.18s, opacity 0.18s;
          position: relative;
          overflow: hidden;
        }
        .point-button::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 40%;
          background: rgba(255,255,255,0.08);
          border-radius: 7px 7px 0 0;
        }
        .point-button:not(.btn-used):not(.btn-waiting):hover {
          transform: scale(1.07);
          filter: brightness(1.15);
        }
        .point-button:not(.btn-used):not(.btn-waiting):active {
          transform: scale(0.94);
        }

        /* Colors */
        .btn-green  { background: linear-gradient(180deg, #27ae60, #1e8449); border-color: rgba(39,174,96,0.5); }
        .btn-orange { background: linear-gradient(180deg, #e67e22, #ca6f1e); border-color: rgba(230,126,34,0.5); }
        .btn-red    { background: linear-gradient(180deg, #e74c3c, #c0392b); border-color: rgba(231,76,60,0.5); }

        .btn-waiting {
          opacity: 0.20;
          cursor: not-allowed;
          filter: saturate(0.1) brightness(0.7);
        }
        .btn-used {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.18) !important;
          cursor: default;
          box-shadow: none;
        }
        .btn-used::after { display: none; }

        /* Answered overlay */
        .answered-overlay {
          position: absolute; inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          background: rgba(5,4,2,0.70);
          backdrop-filter: blur(3px);
        }
        .answered-check {
          width: 52px; height: 52px;
          background: rgba(183,149,11,0.12);
          border: 2px solid #b7950b;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; color: #f1c40f;
        }

        /* ── Bottom control bar ── */
        .bottom-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 24px;
          background: linear-gradient(180deg, rgba(10,8,3,0.92), rgba(18,14,6,0.98));
          border-top: 2px solid rgba(183,149,11,0.35);
          position: sticky;
          bottom: 0;
          z-index: 10;
        }
        .control-btn {
          background: linear-gradient(135deg, rgba(44,44,84,0.9), rgba(20,18,8,0.95));
          border: 1.5px solid rgba(183,149,11,0.5);
          border-radius: 8px;
          color: #d4ac0d;
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.82rem;
          font-weight: 700;
          padding: 8px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: inset 0 1px 0 rgba(241,196,15,0.1);
        }
        .control-btn:hover {
          border-color: #f1c40f;
          color: #f1c40f;
          background: linear-gradient(135deg, rgba(55,55,100,0.92), rgba(28,24,10,0.95));
        }
        .control-btn.danger {
          border-color: rgba(183,49,49,0.55);
          color: #e09090;
        }
        .control-btn.danger:hover {
          border-color: #e74c3c;
          color: #ffcccc;
          background: linear-gradient(135deg, rgba(80,20,20,0.9), rgba(40,10,10,0.95));
        }

        /* ── Modal ── */
        .modal-bg {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 16px;
          background: rgba(5,3,1,0.88);
          backdrop-filter: blur(10px);
        }
        .modal-box {
          background: linear-gradient(160deg, rgba(44,44,84,0.97), rgba(20,18,8,0.98));
          border: 2px solid #b7950b;
          border-radius: 16px;
          padding: clamp(22px,3vw,36px);
          max-width: 360px; width: 100%;
          text-align: center;
          box-shadow:
            0 0 0 1px rgba(241,196,15,0.1),
            0 24px 80px rgba(0,0,0,0.8);
          font-family: 'Noto Naskh Arabic', serif;
        }

        /* ── Winner screen ── */
        .winner-screen {
          position: fixed; inset: 0; z-index: 60;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px; text-align: center;
          background:
            radial-gradient(ellipse at center, rgba(44,44,84,0.95) 0%, rgba(10,8,3,0.99) 100%);
          backdrop-filter: blur(24px);
          animation: winnerIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
          font-family: 'Amiri', serif;
        }

        /* ── Done banner ── */
        .done-banner {
          position: fixed; bottom:0; left:0; right:0; z-index:40;
          padding: 14px; text-align: center;
          background: rgba(10,8,3,0.97);
          border-top: 2px solid rgba(183,149,11,0.45);
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .gameboard-grid { grid-template-columns: repeat(2,1fr) !important; grid-template-rows: repeat(3,1fr); }
          .topbar { grid-template-columns: 1fr !important; gap:8px; }
          .topbar-left, .topbar-right { justify-content: center; }
        }
        @media (max-width: 700px) {
          .gameboard-grid { grid-template-columns: 1fr !important; }
          .point-button { width: 52px; font-size: 0.8rem; }
          .center-image, .center-fallback { height: 100px; }
        }
      `}</style>

      {/* ════════════════ TOPBAR ════════════════ */}
      <div className="topbar">

        {/* Right — Team 1 (Amiri أحمر / النسر) [RTL: renders on right] */}
        <div className="topbar-left">
          <div className={`score-panel ${currentTurn === 1 ? "active" : ""}`}>
            <div className="team-icon">🦅</div>
            <div className="team-info">
              <div className="team-name">🔴 {team1Name}</div>
              <div data-testid="team1-score" className="team-score">
                <ScoreCounter value={teamScores.team1} />
              </div>
            </div>
            {currentTurn === 1 && (
              <span className="turn-dot" style={{ background: "#f1c40f", marginRight: "auto" }} />
            )}
          </div>
        </div>

        {/* Center */}
        <div className="topbar-center">
          <div className="game-title">حُجّة</div>
          <div data-testid="turn-indicator" className="turn-badge">
            <span className="turn-dot" style={{ background: currentTurn === 1 ? "#e74c3c" : "#2ecc71" }} />
            دور {currentTurn === 1 ? team1Name : team2Name}
          </div>
        </div>

        {/* Left — Team 2 (الأسد) */}
        <div className="topbar-right">
          <div className={`score-panel ${currentTurn === 2 ? "active" : ""}`} style={{ flexDirection: "row-reverse" }}>
            <div className="team-icon">🦁</div>
            <div className="team-info" style={{ textAlign: "left" }}>
              <div className="team-name">🟢 {team2Name}</div>
              <div data-testid="team2-score" className="team-score" style={{ textAlign: "left" }}>
                <ScoreCounter value={teamScores.team2} />
              </div>
            </div>
            {currentTurn === 2 && (
              <span className="turn-dot" style={{ background: "#f1c40f", marginLeft: "auto" }} />
            )}
          </div>
        </div>
      </div>

      {/* ════════════════ BOARD ════════════════ */}
      <div className="gameboard-grid">
        {categories.slice(0, 6).map(cat => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            isTileUsed={isTileUsed}
            clickingTile={clickingTile}
            currentTurn={currentTurn}
            onTileClick={handleTileClick}
          />
        ))}
      </div>

      {/* ════════════════ BOTTOM CONTROLS ════════════════ */}
      <div className="bottom-bar">
        <button className="control-btn">🏆 لوحة النتائج</button>
        <button className="control-btn">⚙️ الإعدادات</button>
        <button className="control-btn">🔄 تبديل الأدوار</button>
        <button
          data-testid="end-game-btn"
          className="control-btn danger"
          onClick={() => setShowEndConfirm(true)}
        >
          🚪 إنهاء اللعبة
        </button>
      </div>

      {/* ════════════════ ALL DONE BANNER ════════════════ */}
      {allUsed && !showWinner && (
        <div className="done-banner">
          <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "#f1c40f", marginBottom: "10px", fontFamily: "Amiri, serif" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "10px 30px", borderRadius: "8px",
              fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "0.95rem",
              background: "linear-gradient(160deg,#b7950b,#7d6608)",
              color: "#fff9e6", border: "none", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(183,149,11,0.35)",
            }}
          >
            عرض النتيجة النهائية
          </button>
        </div>
      )}

      {/* ════════════════ END CONFIRM ════════════════ */}
      {showEndConfirm && (
        <div className="modal-bg">
          <div className="modal-box">
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⚔️</div>
            <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "#f1c40f", marginBottom: "8px", fontFamily: "Amiri, serif" }}>
              إنهاء اللعبة؟
            </div>
            <div style={{ fontSize: "0.85rem", color: "rgba(241,196,15,0.38)", marginBottom: "24px", fontFamily: "Noto Naskh Arabic, serif" }}>
              سيتم إعلان الفائز الحالي
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleEndGame}
                style={{
                  padding: "10px 24px", borderRadius: "8px",
                  fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "0.95rem",
                  background: "linear-gradient(160deg,#4a0f0f,#300909)",
                  color: "#f0a0a0", border: "1.5px solid rgba(183,49,49,0.7)",
                  cursor: "pointer",
                }}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: "10px 24px", borderRadius: "8px",
                  fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "0.95rem",
                  background: "transparent", color: "rgba(241,196,15,0.4)",
                  border: "1.5px solid rgba(183,149,11,0.3)", cursor: "pointer",
                }}
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ WINNER SCREEN ════════════════ */}
      {showWinner && (
        <div className="winner-screen">
          <div style={{ fontSize: "clamp(3.5rem,7vw,6rem)", marginBottom: "8px" }}>🏆</div>
          <div style={{ fontWeight: 400, fontSize: "1rem", color: "rgba(241,196,15,0.5)", marginBottom: "6px", fontFamily: "Amiri, serif" }}>
            الفائز
          </div>
          <div style={{
            fontWeight: 700, fontSize: "clamp(2rem,5vw,4rem)",
            color: "#f1c40f", marginBottom: "28px", lineHeight: 1.2,
            fontFamily: "Amiri, serif",
            textShadow: "0 0 30px rgba(241,196,15,0.45)",
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div style={{ display: "flex", gap: "20px", marginBottom: "32px" }}>
            {[
              { name: team1Name, score: teamScores.team1, icon: "🦅" },
              { name: team2Name, score: teamScores.team2, icon: "🦁" },
            ].map(({ name, score, icon }) => (
              <div key={name} style={{
                textAlign: "center", borderRadius: "12px", padding: "16px 24px",
                background: "rgba(44,44,84,0.85)",
                border: "2px solid rgba(183,149,11,0.5)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "rgba(241,196,15,0.65)", marginBottom: "6px", fontFamily: "Noto Naskh Arabic, serif" }}>{name}</div>
                <div style={{ fontWeight: 700, fontSize: "2rem", color: "#f1c40f", fontFamily: "Amiri, serif", textShadow: "0 0 12px rgba(241,196,15,0.35)" }}>{score}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              if (gameMode === "tournament") {
                const ref = tournamentState?.currentMatchRef;
                if (ref) {
                  const winnerId = teamScores.team1 >= teamScores.team2 ? ref.team1Id : ref.team2Id;
                  navigate("/tournament/bracket", {
                    state: { autoRecord: { roundIdx: ref.roundIdx, matchIdx: ref.matchIdx, winnerId } },
                  });
                } else { navigate("/tournament/bracket"); }
              } else { resetGame(); navigate("/"); }
            }}
            style={{
              padding: "13px 48px", borderRadius: "10px",
              fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "1rem",
              background: "linear-gradient(160deg,#b7950b,#7d6608)",
              color: "#fff9e6", border: "none", cursor: "pointer",
              boxShadow: "0 6px 24px rgba(183,149,11,0.4)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
