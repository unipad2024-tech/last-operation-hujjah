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
  const colors = ["#c9a84c","#e8d08a","#ff6b6b","#43e97b","#fff"];
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
   Layout: [left-col team1 | center image+title | right-col team2]
   ══════════════════════════════════════════════════════ */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const [imgErr, setImgErr] = useState(false);

  const slotUsed = (diff, slot) => isTileUsed(`${cat.id}_${diff}_${slot}`);
  const bothUsed = (diff)       => slotUsed(diff, 1) && slotUsed(diff, 2);
  const allDone  = DIFFICULTIES.every(d => bothUsed(d));

  const renderBtn = (diff, slot) => {
    const used     = slotUsed(diff, slot);
    const allGone  = bothUsed(diff);
    const key      = `${cat.id}_${diff}_${slot}`;
    const clicking = clickingTile === key;
    const isMyTurn = currentTurn === slot;
    const disabled = used || allGone || !!clickingTile || !isMyTurn;

    let cls = "point-btn";
    if (used || allGone) cls += " used";
    else if (!isMyTurn)  cls += " waiting";

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

      {/* LEFT — Team 1 */}
      <div className="left-buttons">
        {DIFFICULTIES.map(d => renderBtn(d, 1))}
      </div>

      {/* CENTER — title + image */}
      <div className="card-center">
        <div className="category-name">{cat.name}</div>
        <div className="category-image-wrap">
          {cat.image_url && !imgErr ? (
            <img
              className="category-image"
              src={cat.image_url}
              alt={cat.name}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="category-fallback">
              <span style={{ fontSize: "2.2rem" }}>{cat.icon || "🎯"}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Team 2 */}
      <div className="right-buttons">
        {DIFFICULTIES.map(d => renderBtn(d, 2))}
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
      background: "#0d0a07", fontFamily: "Amiri, serif",
    }}>
      <div style={{ color: "#c9a84c", fontSize: "1.2rem", fontWeight: 700 }}>
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
        :root {
          --bg:          #0d0a07;
          --bg-card:     #12100a;
          --gold:        #c9a84c;
          --gold-light:  #e8d08a;
          --gold-border: #8b6914;
          --card-border: #6b4f10;
          --green-btn:   #0f2d0f;
          --text-cream:  #f5e6c8;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes gbFall { to { transform: translateY(110vh) rotate(540deg); opacity:0; } }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(16px) scale(0.97); }
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

        /* ── Page ── */
        .game-page {
          min-height: 100vh;
          background: var(--bg);
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(139,105,20,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 50%, rgba(139,105,20,0.08) 0%, transparent 60%);
          color: var(--text-cream);
          direction: rtl;
          font-family: 'Noto Naskh Arabic', 'Amiri', serif;
          position: relative;
        }

        /* Roman texture overlay */
        .game-page::before {
          content: "";
          position: fixed;
          inset: 0;
          background: url("/roman-bg.jpg") center/cover no-repeat;
          filter: blur(14px) grayscale(100%) sepia(30%);
          opacity: 0.07;
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
          padding: 14px 24px;
          background: linear-gradient(180deg, rgba(18,14,8,0.98), rgba(10,8,4,0.92));
          border-bottom: 1px solid var(--gold-border);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .topbar-left  { display:flex; align-items:center; justify-content:flex-start; }
        .topbar-right { display:flex; align-items:center; justify-content:flex-end; gap:10px; }
        .topbar-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        /* Title */
        .game-title {
          font-family: 'Amiri', serif;
          font-size: clamp(2rem, 3vw, 3rem);
          font-weight: 700;
          background: linear-gradient(180deg, #f0d070 0%, #c9a84c 50%, #8b6914 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
          letter-spacing: 0.05em;
          line-height: 1;
        }

        /* Turn indicator */
        .turn-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
          border: 1px solid var(--gold-border);
          color: var(--gold);
          background: rgba(201,168,76,0.06);
          white-space: nowrap;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .turn-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: pulseDot 1.4s infinite;
          flex-shrink: 0;
        }

        /* Score card */
        .score-card {
          background: linear-gradient(135deg, #1a1208, #0d0a07);
          border: 1.5px solid var(--gold-border);
          border-radius: 8px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: inset 0 1px 0 rgba(201,168,76,0.15), 0 4px 12px rgba(0,0,0,0.5);
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .score-card.active-t1 {
          border-color: #4a8c4a;
          box-shadow: 0 0 14px rgba(74,140,74,0.2), inset 0 1px 0 rgba(201,168,76,0.15);
        }
        .score-card.active-t2 {
          border-color: #8c4a4a;
          box-shadow: 0 0 14px rgba(140,74,74,0.2), inset 0 1px 0 rgba(201,168,76,0.15);
        }
        .score-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: rgba(232,208,138,0.65);
          white-space: nowrap;
          font-family: 'Noto Naskh Arabic', serif;
        }
        .score-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gold-light);
          line-height: 1;
          font-family: 'Amiri', serif;
          text-shadow: 0 0 10px rgba(201,168,76,0.4);
        }

        /* End btn */
        .end-game-btn {
          background: linear-gradient(160deg, #3a0f0f, #250909);
          border: 1.5px solid #6b2020;
          border-radius: 6px;
          color: #e8a0a0;
          font-family: 'Noto Naskh Arabic', serif;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .end-game-btn:hover {
          border-color: #a03030;
          background: linear-gradient(160deg, #4a1515, #350c0c);
          color: #ffc0c0;
        }

        /* ── Board ── */
        .game-board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 20px;
        }

        /* ── Category Card ── */
        .category-card {
          background: linear-gradient(160deg, #1c1508 0%, #100d06 100%);
          border: 2px solid var(--card-border);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          display: grid;
          grid-template-columns: 80px 1fr 80px;
          min-height: 220px;
          box-shadow:
            0 0 0 1px rgba(201,168,76,0.12),
            0 8px 32px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(201,168,76,0.08);
          animation: cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .category-card:hover {
          border-color: var(--gold);
          box-shadow:
            0 0 0 1px rgba(201,168,76,0.35),
            0 12px 40px rgba(0,0,0,0.7),
            0 0 22px rgba(201,168,76,0.08);
          transform: translateY(-2px);
        }
        .category-card:nth-child(1) { animation-delay:0.05s }
        .category-card:nth-child(2) { animation-delay:0.10s }
        .category-card:nth-child(3) { animation-delay:0.15s }
        .category-card:nth-child(4) { animation-delay:0.20s }
        .category-card:nth-child(5) { animation-delay:0.25s }
        .category-card:nth-child(6) { animation-delay:0.30s }

        /* Button columns */
        .left-buttons, .right-buttons {
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          align-items: center;
          padding: 12px 8px;
          gap: 8px;
          background: rgba(0,0,0,0.18);
        }
        .left-buttons  { border-left:  1px solid rgba(107,79,16,0.4); }
        .right-buttons { border-right: 1px solid rgba(107,79,16,0.4); }

        /* Center column */
        .card-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 10px 8px;
          gap: 8px;
        }

        /* Category name */
        .category-name {
          color: var(--gold-light);
          font-family: 'Amiri', serif;
          font-size: 1rem;
          font-weight: 700;
          text-align: center;
          text-shadow: 0 0 8px rgba(201,168,76,0.35);
          display: flex;
          align-items: center;
          gap: 6px;
          line-height: 1.3;
        }
        .category-name::before { content: '✦'; color: var(--gold-border); font-size: 0.65em; flex-shrink: 0; }
        .category-name::after  { content: '✦'; color: var(--gold-border); font-size: 0.65em; flex-shrink: 0; }

        /* Image */
        .category-image-wrap {
          flex: 1;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--gold-border);
          min-height: 0;
        }
        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: brightness(0.88) saturate(0.8) sepia(0.12);
        }
        .category-fallback {
          width: 100%;
          height: 100%;
          min-height: 100px;
          background: linear-gradient(135deg, #1c1508, #0d0a07);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Point buttons */
        .point-btn {
          background: linear-gradient(160deg, #1a3a1a 0%, #0f2510 100%);
          border: 1.5px solid var(--gold-border);
          border-radius: 8px;
          color: var(--gold-light);
          font-family: 'Noto Naskh Arabic', serif;
          font-size: 0.92rem;
          font-weight: 700;
          width: 64px;
          height: 44px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-shadow: 0 0 6px rgba(201,168,76,0.25);
          box-shadow: inset 0 1px 0 rgba(201,168,76,0.12), 0 2px 8px rgba(0,0,0,0.4);
          position: relative;
          overflow: hidden;
        }
        .point-btn::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent);
        }
        .point-btn:not(.used):not(.waiting):hover {
          background: linear-gradient(160deg, #2a5a2a 0%, #1a3a1a 100%);
          border-color: var(--gold);
          color: #fff;
          transform: scale(1.06);
          box-shadow: 0 0 12px rgba(201,168,76,0.25), inset 0 1px 0 rgba(201,168,76,0.25);
        }
        .point-btn:not(.used):not(.waiting):active {
          transform: scale(0.95);
        }
        .point-btn.waiting {
          opacity: 0.22;
          cursor: not-allowed;
          filter: saturate(0.1);
        }
        .point-btn.used {
          background: #0d0d0d !important;
          border-color: #2a2a2a !important;
          color: #333 !important;
          cursor: default;
          box-shadow: none;
        }
        .point-btn.used::before { display: none; }

        /* Answered overlay */
        .answered-overlay {
          position: absolute; inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          background: rgba(5,4,2,0.72);
          backdrop-filter: blur(3px);
        }
        .answered-check {
          width: 48px; height: 48px;
          background: rgba(201,168,76,0.1);
          border: 2px solid var(--gold-border);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem; color: var(--gold);
        }

        /* ── Modal ── */
        .modal-bg {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 16px;
          background: rgba(5,3,1,0.90);
          backdrop-filter: blur(10px);
        }
        .modal-box {
          background: linear-gradient(160deg, #1c1508, #100d06);
          border: 2px solid var(--card-border);
          border-radius: 14px;
          padding: clamp(22px,3vw,36px);
          max-width: 360px; width: 100%;
          text-align: center;
          box-shadow: 0 0 0 1px rgba(201,168,76,0.12), 0 24px 80px rgba(0,0,0,0.8);
          font-family: 'Noto Naskh Arabic', serif;
        }

        /* ── Winner screen ── */
        .winner-screen {
          position: fixed; inset: 0; z-index: 60;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px; text-align: center;
          background: radial-gradient(ellipse at center, #1a1208 0%, #0d0a07 100%);
          backdrop-filter: blur(24px);
          animation: winnerIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
          font-family: 'Amiri', serif;
        }

        /* ── Done banner ── */
        .done-banner {
          position: fixed; bottom:0; left:0; right:0; z-index:40;
          padding: 14px; text-align: center;
          background: rgba(10,8,4,0.97);
          border-top: 1px solid var(--gold-border);
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .game-board { grid-template-columns: repeat(2,1fr) !important; }
          .topbar { grid-template-columns: 1fr !important; }
          .topbar-left, .topbar-right { justify-content: center; }
        }
        @media (max-width: 700px) {
          .game-board { grid-template-columns: 1fr !important; }
          .category-card { grid-template-columns: 72px 1fr 72px; }
          .point-btn { width: 58px; font-size: 0.82rem; }
        }
      `}</style>

      {/* ════════════════ TOPBAR ════════════════ */}
      <div className="topbar">

        {/* Left — Team 1 */}
        <div className="topbar-left">
          <div className={`score-card ${currentTurn === 1 ? "active-t1" : ""}`}>
            {currentTurn === 1 && <span className="turn-dot" style={{ background: "#4a8c4a" }} />}
            <div>
              <div className="score-label">🔴 {team1Name}</div>
              <div data-testid="team1-score" className="score-value">
                <ScoreCounter value={teamScores.team1} />
              </div>
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="topbar-center">
          <div className="game-title">حُجّة</div>
          <div data-testid="turn-indicator" className="turn-badge">
            <span className="turn-dot" style={{ background: currentTurn === 1 ? "#4a8c4a" : "#8c4a4a" }} />
            دور {currentTurn === 1 ? team1Name : team2Name}
          </div>
        </div>

        {/* Right — Team 2 + End */}
        <div className="topbar-right">
          <div className={`score-card ${currentTurn === 2 ? "active-t2" : ""}`}>
            <div style={{ textAlign: "left" }}>
              <div className="score-label">🟢 {team2Name}</div>
              <div data-testid="team2-score" className="score-value" style={{ textAlign: "left" }}>
                <ScoreCounter value={teamScores.team2} />
              </div>
            </div>
            {currentTurn === 2 && <span className="turn-dot" style={{ background: "#8c4a4a" }} />}
          </div>
          <button data-testid="end-game-btn" className="end-game-btn" onClick={() => setShowEndConfirm(true)}>
            إنهاء
          </button>
        </div>
      </div>

      {/* ════════════════ BOARD ════════════════ */}
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

      {/* ════════════════ ALL DONE BANNER ════════════════ */}
      {allUsed && !showWinner && (
        <div className="done-banner">
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--gold-light)", marginBottom: "10px", fontFamily: "Amiri, serif" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "10px 28px", borderRadius: "8px",
              fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "0.95rem",
              background: "linear-gradient(160deg,#c9a84c,#8b6914)",
              color: "#0d0a07", border: "none", cursor: "pointer",
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
            <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--gold-light)", marginBottom: "8px", fontFamily: "Amiri, serif" }}>
              إنهاء اللعبة؟
            </div>
            <div style={{ fontSize: "0.85rem", color: "rgba(232,208,138,0.4)", marginBottom: "24px" }}>
              سيتم إعلان الفائز الحالي
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleEndGame}
                style={{
                  padding: "10px 24px", borderRadius: "8px",
                  fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "0.95rem",
                  background: "linear-gradient(160deg,#3a0f0f,#250909)",
                  color: "#e8a0a0", border: "1.5px solid #6b2020",
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
                  background: "transparent", color: "rgba(232,208,138,0.4)",
                  border: "1.5px solid rgba(107,79,16,0.4)", cursor: "pointer",
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
          <div style={{ fontWeight: 400, fontSize: "1rem", color: "rgba(232,208,138,0.5)", marginBottom: "6px", fontFamily: "Amiri, serif" }}>
            الفائز
          </div>
          <div style={{
            fontWeight: 700, fontSize: "clamp(2rem,5vw,4rem)",
            background: "linear-gradient(180deg,#f0d070,#c9a84c,#8b6914)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: "28px", lineHeight: 1.2,
            fontFamily: "Amiri, serif",
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div style={{ display: "flex", gap: "20px", marginBottom: "32px" }}>
            {[
              { name: team1Name, score: teamScores.team1, color: "#4a8c4a" },
              { name: team2Name, score: teamScores.team2, color: "#8c4a4a" },
            ].map(({ name, score, color }) => (
              <div key={name} style={{
                textAlign: "center", borderRadius: "10px", padding: "14px 24px",
                background: "linear-gradient(160deg,#1c1508,#100d06)",
                border: `1.5px solid ${color}55`,
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color, marginBottom: "6px", fontFamily: "Noto Naskh Arabic, serif" }}>{name}</div>
                <div style={{ fontWeight: 700, fontSize: "2rem", color: "var(--gold-light)", fontFamily: "Amiri, serif" }}>{score}</div>
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
              padding: "12px 44px", borderRadius: "8px",
              fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "1rem",
              background: "linear-gradient(160deg,#c9a84c,#8b6914)",
              color: "#0d0a07", border: "none", cursor: "pointer",
              boxShadow: "0 6px 24px rgba(201,168,76,0.3)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
