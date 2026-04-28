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
  const colors = ["#d8b15a","#ff6b6b","#43e97b","#4facfe","#a78bfa","#fff"];
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
   Layout: [title] → [left-col (300/600/900) | image | right-col (300/600/900)]
   left  = slot 1 (team 1)
   right = slot 2 (team 2)
   ══════════════════════════════════════════════════════ */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const [imgErr, setImgErr] = useState(false);

  const slotUsed = (diff, slot) => isTileUsed(`${cat.id}_${diff}_${slot}`);
  const bothUsed = (diff)       => slotUsed(diff, 1) && slotUsed(diff, 2);
  const allDone  = DIFFICULTIES.every(d => bothUsed(d));

  const renderValueBtn = (diff, slot) => {
    const used     = slotUsed(diff, slot);
    const allGone  = bothUsed(diff);
    const key      = `${cat.id}_${diff}_${slot}`;
    const clicking = clickingTile === key;
    const isMyTurn = currentTurn === slot;
    const disabled = used || allGone || !!clickingTile || !isMyTurn;
    const cls      = `value-btn p${diff}${used || allGone ? " used" : isMyTurn ? "" : " waiting"}`;

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
    <div className="category-card" style={{ opacity: allDone ? 0.44 : 1 }}>

      {/* Completed overlay */}
      {allDone && (
        <div className="answered-overlay">
          <div className="answered-check">✓</div>
        </div>
      )}

      {/* Title */}
      <div className="category-header">
        <h3 className="category-title">{cat.name}</h3>
      </div>

      {/* Body: left col | image | right col */}
      <div className="category-body">

        {/* Left — slot 1 (team 1) */}
        <div className="value-col">
          {DIFFICULTIES.map(d => renderValueBtn(d, 1))}
        </div>

        {/* Center image */}
        <div className="center-image">
          {cat.image_url && !imgErr ? (
            <img
              src={cat.image_url}
              alt={cat.name}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg,${cat.color || "#1d1b4b"}cc,${cat.color || "#080520"}55)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.6rem",
            }}>
              {cat.icon || "🎯"}
            </div>
          )}
        </div>

        {/* Right — slot 2 (team 2) */}
        <div className="value-col">
          {DIFFICULTIES.map(d => renderValueBtn(d, 2))}
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
      background: "#080b14", fontFamily: "Tajawal, Cairo, sans-serif",
    }}>
      <div style={{ color: "#d8b15a", fontSize: "1.1rem", fontWeight: 700, opacity: 0.85 }}>
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
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
      />

      {/* ════════════════ ALL STYLES ════════════════ */}
      <style>{`
        :root {
          --bg:          #080b14;
          --panel:       rgba(16, 19, 33, 0.82);
          --panel-2:     rgba(21, 25, 42, 0.78);
          --border:      rgba(214, 175, 83, 0.38);
          --border-soft: rgba(255, 255, 255, 0.08);
          --text:        #f5f0e6;
          --muted:       rgba(245, 240, 230, 0.72);
          --gold:        #d8b15a;
          --gold-soft:   #f1d28d;
          --emerald:     #2fbd6d;
          --amber:       #c9922c;
          --rose:        #b94a57;
          --shadow:      0 18px 60px rgba(0,0,0,0.42);
          --radius-xl:   28px;
          --radius-lg:   22px;
          --radius-md:   16px;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes gbFall { to { transform: translateY(110vh) rotate(540deg); opacity:0; } }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(20px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)   scale(1);    }
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.28; transform:scale(0.58); }
        }
        @keyframes winnerIn {
          from { opacity:0; transform:scale(0.88) translateY(20px); }
          to   { opacity:1; transform:scale(1)    translateY(0);   }
        }

        /* ── Page ── */
        .game-page {
          min-height: 100svh;
          height: 100svh;
          overflow: hidden;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg);
          color: var(--text);
          direction: rtl;
          font-family: 'Tajawal', Cairo, sans-serif;
          position: relative;
        }

        /* Roman full-page background */
        .game-page::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(8,11,20,0.66), rgba(8,11,20,0.92)),
            url("/roman-art-bg.jpg") center/cover no-repeat;
          filter: blur(12px) grayscale(100%) saturate(0.55) brightness(0.72);
          opacity: 0.18;
          transform: scale(1.08);
          z-index: 0;
          pointer-events: none;
        }

        /* Ambient color glows */
        .game-page::after {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(circle at top left,     rgba(216,177,90,0.14),  transparent 26%),
            radial-gradient(circle at top right,    rgba(111,87,255,0.10),  transparent 30%),
            radial-gradient(circle at bottom left,  rgba(216,177,90,0.08),  transparent 24%),
            radial-gradient(circle at bottom right, rgba(53,208,127,0.06),  transparent 24%);
          z-index: 0;
          pointer-events: none;
        }

        .game-page > * { position: relative; z-index: 1; }

        /* ── Topbar ── */
        .topbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          align-items: center;
          padding: 12px 16px;
          border-radius: var(--radius-xl);
          background: linear-gradient(180deg, rgba(20,23,38,0.90), rgba(10,13,24,0.78));
          border: 1px solid var(--border-soft);
          border-bottom-color: rgba(214,175,83,0.18);
          box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          flex-shrink: 0;
        }

        .topbar-left  { display:flex; align-items:center; gap:10px; justify-content:flex-start; }
        .topbar-right { display:flex; align-items:center; gap:10px; justify-content:flex-end; }
        .topbar-center {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          text-align: center;
          flex-shrink: 0;
        }

        .game-title {
          font-size: clamp(1.6rem, 2.2vw, 2.4rem);
          font-weight: 900;
          color: var(--gold-soft);
          line-height: 1;
          letter-spacing: 0.5px;
          text-shadow: 0 0 28px rgba(241,210,141,0.35);
        }

        /* Score card (left/right panels) */
        .score-card {
          padding: 9px 16px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(22,26,44,0.94), rgba(12,15,27,0.82));
          border: 1px solid rgba(214,175,83,0.20);
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.22);
          transition: all 0.32s ease;
        }
        .score-card.active-t1 {
          border-color: rgba(47,189,109,0.34);
          box-shadow: 0 0 20px rgba(47,189,109,0.14), 0 10px 28px rgba(0,0,0,0.22);
        }
        .score-card.active-t2 {
          border-color: rgba(79,172,254,0.34);
          box-shadow: 0 0 20px rgba(79,172,254,0.14), 0 10px 28px rgba(0,0,0,0.22);
        }

        .score-label {
          font-size: 0.80rem;
          font-weight: 700;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }
        .score-value {
          font-size: 1.7rem;
          font-weight: 900;
          color: var(--gold-soft);
          line-height: 1;
        }

        /* Turn dot */
        .turn-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: pulseDot 1.4s infinite;
        }

        /* Turn badge (center) */
        .turn-badge {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 14px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .turn-badge.t1 {
          background: rgba(47,189,109,0.10);
          border: 1px solid rgba(47,189,109,0.28);
          color: #6febb0;
        }
        .turn-badge.t2 {
          background: rgba(79,172,254,0.10);
          border: 1px solid rgba(79,172,254,0.28);
          color: #93c5fd;
        }

        /* End game button */
        .end-game-btn {
          border: none;
          cursor: pointer;
          padding: 10px 18px;
          border-radius: 999px;
          font-family: 'Tajawal', Cairo, sans-serif;
          font-weight: 800;
          font-size: 0.88rem;
          color: #fff;
          background: linear-gradient(180deg, rgba(176,65,77,0.95), rgba(130,43,54,0.95));
          box-shadow: 0 10px 26px rgba(176,65,77,0.20);
          transition: transform 0.16s ease, filter 0.16s ease;
          white-space: nowrap;
        }
        .end-game-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }

        /* ── Board ── */
        .board-wrap {
          flex: 1;
          min-height: 0;
          display: flex;
        }

        .game-board {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 16px;
          align-content: stretch;
        }

        /* ── Category Card ── */
        .category-card {
          border-radius: var(--radius-xl);
          background: linear-gradient(180deg, rgba(22,26,46,0.94), rgba(11,14,26,0.90));
          border: 1px solid rgba(214,175,83,0.20);
          box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          overflow: hidden;
          animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
          transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
        }

        /* subtle inner radial glow */
        .category-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 40%),
            linear-gradient(180deg, rgba(214,175,83,0.03), transparent 50%);
          pointer-events: none;
        }

        .category-card:hover {
          transform: translateY(-3px);
          border-color: rgba(214,175,83,0.34);
          box-shadow:
            0 24px 72px rgba(0,0,0,0.54),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .category-card:nth-child(1) { animation-delay:0.05s }
        .category-card:nth-child(2) { animation-delay:0.10s }
        .category-card:nth-child(3) { animation-delay:0.15s }
        .category-card:nth-child(4) { animation-delay:0.20s }
        .category-card:nth-child(5) { animation-delay:0.25s }
        .category-card:nth-child(6) { animation-delay:0.30s }

        /* Card header */
        .category-header {
          text-align: center;
          position: relative;
          z-index: 1;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(214,175,83,0.14);
        }

        .category-title {
          font-size: clamp(0.92rem,1.3vw,1.12rem);
          font-weight: 900;
          color: var(--text);
          line-height: 1.3;
          text-shadow: 0 2px 10px rgba(0,0,0,0.55);
        }

        /* Card body: [82px | 1fr | 82px] */
        .category-body {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 82px minmax(0,1fr) 82px;
          gap: 10px;
          align-items: stretch;
          position: relative;
          z-index: 1;
        }

        /* Value columns */
        .value-col {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
        }

        /* Center image */
        .center-image {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          min-height: 190px;
        }

        .center-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          opacity: 0.70;
          filter: grayscale(0.14) brightness(0.82) contrast(1.03);
          transform: scale(1.03);
          transition: transform 0.42s ease;
        }
        .category-card:hover .center-image img { transform: scale(1.08); }

        .center-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.22));
          pointer-events: none;
        }

        /* Value buttons */
        .value-btn {
          flex: 1;
          min-height: 0;
          border: none;
          border-radius: 13px;
          font-size: clamp(0.85rem,1.1vw,1rem);
          font-weight: 900;
          font-family: 'Tajawal', Cairo, sans-serif;
          color: #fff;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(0,0,0,0.18);
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), filter 0.18s, box-shadow 0.18s;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.01em;
        }
        .value-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.14s;
        }
        .value-btn:not(.used):not(.waiting):hover::after { background: rgba(255,255,255,0.14); }
        .value-btn:not(.used):not(.waiting):hover  { transform: translateY(-2px) scale(1.04); }
        .value-btn:not(.used):not(.waiting):active { transform: scale(0.91); }

        .value-btn.p300 {
          background: linear-gradient(180deg, rgba(47,189,109,0.98), rgba(31,153,87,0.98));
          box-shadow: 0 6px 16px rgba(47,189,109,0.32);
        }
        .value-btn.p600 {
          background: linear-gradient(180deg, rgba(201,146,44,0.98), rgba(161,113,26,0.98));
          box-shadow: 0 6px 16px rgba(201,146,44,0.32);
        }
        .value-btn.p900 {
          background: linear-gradient(180deg, rgba(185,74,87,0.98), rgba(143,50,61,0.98));
          box-shadow: 0 6px 16px rgba(185,74,87,0.32);
        }

        .value-btn.waiting {
          opacity: 0.28;
          filter: saturate(0.25);
          cursor: not-allowed;
          box-shadow: none;
        }
        .value-btn.used {
          background: rgba(255,255,255,0.06) !important;
          box-shadow: none !important;
          color: rgba(255,255,255,0.20);
          cursor: default;
          opacity: 1;
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* Answered overlay */
        .answered-overlay {
          position: absolute; inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          background: rgba(7,5,20,0.65);
          backdrop-filter: blur(4px);
        }
        .answered-check {
          width: 52px; height: 52px;
          background: rgba(47,189,109,0.12);
          border: 2px solid #2fbd6d;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; color: #2fbd6d;
          font-family: sans-serif;
        }

        /* ── Modal ── */
        .modal-bg {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 16px;
          background: rgba(8,6,20,0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .modal-box {
          background: linear-gradient(155deg, rgba(22,18,56,0.98), rgba(8,6,22,0.99));
          border: 1px solid rgba(214,175,83,0.22);
          border-radius: 24px;
          padding: clamp(22px,3vw,36px);
          max-width: 360px; width: 100%;
          text-align: center;
          box-shadow: 0 24px 80px rgba(0,0,0,0.72);
          font-family: 'Tajawal', Cairo, sans-serif;
        }

        /* ── Winner ── */
        .winner-screen {
          position: fixed; inset: 0; z-index: 60;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px; text-align: center;
          background: linear-gradient(135deg,rgba(8,6,20,0.97),rgba(4,3,12,0.99));
          backdrop-filter: blur(24px);
          animation: winnerIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
          font-family: 'Tajawal', Cairo, sans-serif;
        }

        /* ── Done banner ── */
        .done-banner {
          position: fixed; bottom:0; left:0; right:0; z-index:40;
          padding: 14px; text-align: center;
          background: rgba(8,6,20,0.96);
          backdrop-filter: blur(14px);
          border-top: 1px solid rgba(214,175,83,0.26);
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .game-board { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          .topbar { grid-template-columns: 1fr !important; text-align: center; }
          .topbar-left, .topbar-right { justify-content: center; }
        }
        @media (max-width: 700px) {
          .game-board { grid-template-columns: 1fr !important; }
          .category-body { grid-template-columns: 68px minmax(0,1fr) 68px; gap:8px; }
        }
      `}</style>

      {/* ════════════════ TOPBAR ════════════════ */}
      <div className="topbar">

        {/* Left — Team 1 */}
        <div className="topbar-left">
          <div className={`score-card ${currentTurn === 1 ? "active-t1" : ""}`}>
            {currentTurn === 1 && (
              <span className="turn-dot" style={{ background: "#2fbd6d" }} />
            )}
            <div>
              <div className="score-label">🔴 {team1Name}</div>
              <div data-testid="team1-score" className="score-value">
                <ScoreCounter value={teamScores.team1} />
              </div>
            </div>
          </div>
        </div>

        {/* Center — Title + turn */}
        <div className="topbar-center">
          <div className="game-title">حُجّة</div>
          <div
            data-testid="turn-indicator"
            className={`turn-badge ${currentTurn === 1 ? "t1" : "t2"}`}
          >
            <span
              className="turn-dot"
              style={{ background: currentTurn === 1 ? "#2fbd6d" : "#4facfe" }}
            />
            دور {currentTurn === 1 ? team1Name : team2Name}
          </div>
        </div>

        {/* Right — Team 2 + End */}
        <div className="topbar-right">
          <div className={`score-card ${currentTurn === 2 ? "active-t2" : ""}`}>
            <div style={{ textAlign: "left" }}>
              <div className="score-label">🔵 {team2Name}</div>
              <div data-testid="team2-score" className="score-value" style={{ textAlign: "left" }}>
                <ScoreCounter value={teamScores.team2} />
              </div>
            </div>
            {currentTurn === 2 && (
              <span className="turn-dot" style={{ background: "#4facfe" }} />
            )}
          </div>
          <button
            data-testid="end-game-btn"
            className="end-game-btn"
            onClick={() => setShowEndConfirm(true)}
          >
            إنهاء
          </button>
        </div>
      </div>

      {/* ════════════════ BOARD ════════════════ */}
      <div className="board-wrap">
        <div className="game-board">
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
      </div>

      {/* ════════════════ ALL DONE BANNER ════════════════ */}
      {allUsed && !showWinner && (
        <div className="done-banner">
          <div style={{
            fontWeight: 900, fontSize: "1.1rem",
            color: "var(--gold-soft)", marginBottom: "10px",
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "10px 28px", borderRadius: "50px",
              fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.95rem",
              background: "linear-gradient(135deg,#d8b15a,#b0902a)",
              color: "#0d0900", border: "none", cursor: "pointer",
              boxShadow: "0 4px 22px rgba(216,177,90,0.40)",
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
            <div style={{ fontWeight: 900, fontSize: "1.35rem", color: "var(--gold-soft)", marginBottom: "8px" }}>
              إنهاء اللعبة؟
            </div>
            <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.38)", marginBottom: "24px" }}>
              سيتم إعلان الفائز الحالي
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleEndGame}
                style={{
                  padding: "10px 24px", borderRadius: "50px",
                  fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 900, fontSize: "0.95rem",
                  background: "linear-gradient(135deg,rgba(185,74,87,0.92),rgba(143,50,61,0.95))",
                  color: "#fff", border: "1px solid rgba(185,74,87,0.44)",
                  cursor: "pointer", boxShadow: "0 4px 18px rgba(185,74,87,0.28)",
                }}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: "10px 24px", borderRadius: "50px",
                  fontFamily: "Tajawal, Cairo, sans-serif", fontWeight: 700, fontSize: "0.95rem",
                  background: "transparent", color: "rgba(255,255,255,0.40)",
                  border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer",
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
          <div style={{
            fontWeight: 600, fontSize: "0.95rem",
            color: "rgba(241,210,141,0.52)", marginBottom: "6px",
          }}>
            الفائز
          </div>
          <div style={{
            fontWeight: 900, fontSize: "clamp(2.2rem,5vw,4.5rem)",
            color: "var(--gold-soft)", marginBottom: "28px", lineHeight: 1.1,
            textShadow: "0 4px 30px rgba(241,210,141,0.42)",
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div style={{ display: "flex", gap: "20px", marginBottom: "32px" }}>
            {[
              { name: team1Name, score: teamScores.team1, color: "#2fbd6d" },
              { name: team2Name, score: teamScores.team2, color: "#4facfe" },
            ].map(({ name, score, color }) => (
              <div key={name} style={{
                textAlign: "center", borderRadius: "18px", padding: "16px 28px",
                background: `${color}10`, border: `1px solid ${color}32`,
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color, marginBottom: "6px" }}>{name}</div>
                <div style={{ fontWeight: 900, fontSize: "2.2rem", color: "var(--gold-soft)" }}>{score}</div>
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
              padding: "clamp(12px,1.5vh,18px) clamp(32px,4vw,56px)",
              borderRadius: "50px",
              fontFamily: "Tajawal, Cairo, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(1rem,1.5vw,1.2rem)",
              background: "linear-gradient(135deg,#d8b15a,#b0902a)",
              color: "#0a0700", border: "none", cursor: "pointer",
              boxShadow: "0 6px 32px rgba(216,177,90,0.42)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
