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
  const colors = ["#d4af37","#f39c12","#e74c3c","#27ae60","#fff"];
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
   Category Card  —  exact spec layout:
   [✧ عنوان ✧] header
   [col | image | col]  content, height 180px
   left col  = slot 2 (team 2)   right col = slot 1 (team 1)
   ══════════════════════════════════════════════════════ */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const [imgErr, setImgErr] = useState(false);

  const slotUsed = (diff, slot) => isTileUsed(`${cat.id}_${diff}_${slot}`);
  const bothUsed = (diff)       => slotUsed(diff, 1) && slotUsed(diff, 2);
  const allDone  = DIFFICULTIES.every(d => bothUsed(d));

  const btnColor = { 300: "btn-green", 600: "btn-gold", 900: "btn-red" };

  const renderBtn = (diff, slot) => {
    const used     = slotUsed(diff, slot);
    const allGone  = bothUsed(diff);
    const key      = `${cat.id}_${diff}_${slot}`;
    const clicking = clickingTile === key;
    const isMyTurn = currentTurn === slot;
    const disabled = used || allGone || !!clickingTile || !isMyTurn;

    let cls = `btn ${btnColor[diff]}`;
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
    <div className="hujah-card" style={{ opacity: allDone ? 0.45 : 1 }}>

      {allDone && (
        <div className="answered-overlay">
          <span className="answered-check">✓</span>
        </div>
      )}

      {/* Title */}
      <div className="card-title">
        <span>✧</span>
        {cat.name}
        <span>✧</span>
      </div>

      {/* Body */}
      <div className="card-content">

        {/* Right col — slot 1 (team 1) */}
        <div className="points-col">
          {DIFFICULTIES.map(d => renderBtn(d, 1))}
        </div>

        {/* Center image */}
        <div className="card-image">
          {cat.image_url && !imgErr ? (
            <img
              src={cat.image_url}
              alt={cat.name}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg,#1a1a24,#111116)",
              fontSize: "2.8rem",
            }}>
              {cat.icon || "🎯"}
            </div>
          )}
        </div>

        {/* Left col — slot 2 (team 2) */}
        <div className="points-col">
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
      background: "#0b0c10", fontFamily: "Amiri, serif",
    }}>
      <div style={{ color: "#d4af37", fontSize: "1.3rem", fontWeight: 700 }}>
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
    <div className="page-wrap">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes gbFall  { to { transform: translateY(110vh) rotate(540deg); opacity:0; } }
        @keyframes cardIn  { from { opacity:0; transform:translateY(14px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes pulseDot { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes winnerIn { from { opacity:0; transform:scale(0.88) translateY(20px); } to { opacity:1; transform:none; } }

        /* ── Page wrap ── */
        .page-wrap {
          min-height: 100vh;
          background-color: #0b0c10;
          background-image: url('/roman-bg.jpg');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          background-blend-mode: overlay;
          direction: rtl;
          font-family: 'Amiri', serif;
          color: #e6e6e6;
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .gb-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          padding: 14px 40px;
          background: rgba(11,12,16,0.96);
          border-bottom: 1px solid #8b6b32;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .gb-header-left  { display:flex; align-items:center; justify-content:flex-start; }
        .gb-header-right { display:flex; align-items:center; justify-content:flex-end; gap:10px; }
        .gb-header-center { display:flex; flex-direction:column; align-items:center; gap:5px; }

        /* Title */
        .gb-title {
          font-family: 'Amiri', serif;
          font-size: clamp(2rem, 3vw, 3rem);
          font-weight: 700;
          color: #d4af37;
          text-shadow: 0 0 28px rgba(212,175,55,0.5), 0 2px 4px rgba(0,0,0,0.9);
          letter-spacing: 0.05em;
          line-height: 1;
        }

        /* Turn pill */
        .turn-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 3px 14px;
          border-radius: 20px;
          font-size: 0.8rem; font-weight: 700;
          border: 1px solid #8b6b32;
          color: #d4af37;
          background: rgba(139,107,50,0.08);
          font-family: 'Noto Naskh Arabic', serif;
          white-space: nowrap;
        }
        .turn-dot {
          width: 6px; height: 6px; border-radius: 50%;
          animation: pulseDot 1.4s infinite;
          flex-shrink: 0;
        }

        /* Score card */
        .score-card {
          background: linear-gradient(145deg, #1a1a24, #111116);
          border: 2px solid #8b6b32;
          border-radius: 10px;
          padding: 10px 18px;
          display: flex; align-items: center; gap: 10px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.55), inset 0 0 10px rgba(139,107,50,0.15);
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .score-card.active {
          border-color: #d4af37;
          box-shadow: 0 0 16px rgba(212,175,55,0.2), 0 4px 14px rgba(0,0,0,0.55), inset 0 0 10px rgba(139,107,50,0.2);
        }
        .score-icon  { font-size: 1.7rem; line-height: 1; flex-shrink: 0; }
        .score-label { font-size: 0.75rem; font-weight: 700; color: rgba(212,175,55,0.6); font-family: 'Noto Naskh Arabic', serif; white-space: nowrap; }
        .score-val   { font-size: 1.5rem; font-weight: 700; color: #d4af37; font-family: 'Amiri', serif; line-height: 1; text-shadow: 0 0 10px rgba(212,175,55,0.35); }

        /* End btn */
        .end-btn {
          background: #111;
          border: 2px solid #c0392b;
          border-radius: 6px;
          color: #c0392b;
          font-family: 'Noto Naskh Arabic', serif;
          font-weight: 700; font-size: 0.88rem;
          padding: 8px 18px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .end-btn:hover { background: rgba(192,57,43,0.12); color: #e74c3c; border-color: #e74c3c; transform: scale(1.04); }

        /* ── Game container / grid ── */
        .game-container {
          background-color: transparent;
          padding: 40px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          flex: 1;
        }

        /* ── Card ── */
        .hujah-card {
          background: linear-gradient(145deg, #1a1a24, #111116);
          border: 2px solid #8b6b32;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 8px 15px rgba(0,0,0,0.6), inset 0 0 10px rgba(139,107,50,0.2);
          position: relative;
          overflow: hidden;
          animation: cardIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
        }
        .hujah-card:hover {
          border-color: #d4af37;
          box-shadow: 0 10px 28px rgba(0,0,0,0.7), 0 0 18px rgba(212,175,55,0.1), inset 0 0 10px rgba(139,107,50,0.25);
          transform: translateY(-2px);
        }
        .hujah-card:nth-child(1) { animation-delay:0.05s }
        .hujah-card:nth-child(2) { animation-delay:0.10s }
        .hujah-card:nth-child(3) { animation-delay:0.15s }
        .hujah-card:nth-child(4) { animation-delay:0.20s }
        .hujah-card:nth-child(5) { animation-delay:0.25s }
        .hujah-card:nth-child(6) { animation-delay:0.30s }

        /* Card title */
        .card-title {
          color: #d4af37;
          text-align: center;
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(139,107,50,0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          font-family: 'Amiri', serif;
          letter-spacing: 0.03em;
        }

        /* Card content */
        .card-content {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          gap: 10px;
          height: 180px;
        }

        /* Points column */
        .points-col {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 60px;
          flex-shrink: 0;
        }

        /* Buttons */
        .btn {
          background: #111;
          border: 2px solid;
          border-radius: 6px;
          padding: 8px 0;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          font-family: 'Noto Naskh Arabic', serif;
          transition: all 0.2s ease-in-out;
          width: 100%;
        }
        .btn:not(.btn-used):not(.btn-waiting):hover {
          transform: scale(1.06);
          background: rgba(255,255,255,0.07);
        }
        .btn:not(.btn-used):not(.btn-waiting):active { transform: scale(0.94); }

        .btn-green { border-color: #27ae60; color: #27ae60; }
        .btn-gold  { border-color: #f39c12; color: #f39c12; }
        .btn-red   { border-color: #c0392b; color: #c0392b; }

        .btn-waiting {
          opacity: 0.18;
          cursor: not-allowed;
          filter: saturate(0);
        }
        .btn-used {
          border-color: #2a2a2a !important;
          color: #333 !important;
          cursor: default;
          background: #0d0d0d !important;
        }

        /* Center image */
        .card-image {
          flex: 1;
          border: 1px solid #8b6b32;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
        }
        .card-image img {
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.82;
          display: block;
        }

        /* Answered overlay */
        .answered-overlay {
          position: absolute; inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          background: rgba(5,4,2,0.72);
          backdrop-filter: blur(3px);
          border-radius: 10px;
        }
        .answered-check {
          width: 52px; height: 52px;
          background: rgba(212,175,55,0.1);
          border: 2px solid #8b6b32;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; color: #d4af37;
        }

        /* ── Modal ── */
        .modal-bg {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 16px;
          background: rgba(5,3,1,0.90);
          backdrop-filter: blur(10px);
        }
        .modal-box {
          background: linear-gradient(145deg, #1a1a24, #111116);
          border: 2px solid #8b6b32;
          border-radius: 14px;
          padding: clamp(22px,3vw,36px);
          max-width: 360px; width: 100%;
          text-align: center;
          box-shadow: 0 8px 15px rgba(0,0,0,0.7), inset 0 0 10px rgba(139,107,50,0.15);
          font-family: 'Noto Naskh Arabic', serif;
        }

        /* ── Winner ── */
        .winner-screen {
          position: fixed; inset: 0; z-index: 60;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px; text-align: center;
          background: rgba(11,12,16,0.97);
          backdrop-filter: blur(24px);
          animation: winnerIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
          font-family: 'Amiri', serif;
        }

        /* ── Done banner ── */
        .done-banner {
          position: fixed; bottom:0; left:0; right:0; z-index:40;
          padding: 14px; text-align: center;
          background: rgba(11,12,16,0.97);
          border-top: 1px solid #8b6b32;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .game-container { grid-template-columns: repeat(2,1fr) !important; padding: 20px; }
          .gb-header { grid-template-columns: 1fr !important; gap:8px; }
          .gb-header-left, .gb-header-right { justify-content: center; }
        }
        @media (max-width: 700px) {
          .game-container { grid-template-columns: 1fr !important; padding: 12px; }
          .points-col { width: 52px; }
          .card-content { height: 150px; }
        }
      `}</style>

      {/* ════════════════ HEADER ════════════════ */}
      <div className="gb-header">

        {/* Right — Team 1 */}
        <div className="gb-header-left">
          <div className={`score-card ${currentTurn === 1 ? "active" : ""}`}>
            <div className="score-icon">🦅</div>
            <div>
              <div className="score-label">🔴 {team1Name}</div>
              <div data-testid="team1-score" className="score-val">
                <ScoreCounter value={teamScores.team1} />
              </div>
            </div>
            {currentTurn === 1 && <span className="turn-dot" style={{ background: "#d4af37", marginRight: "4px" }} />}
          </div>
        </div>

        {/* Center */}
        <div className="gb-header-center">
          <div className="gb-title">حُجّة</div>
          <div data-testid="turn-indicator" className="turn-pill">
            <span className="turn-dot" style={{ background: currentTurn === 1 ? "#e74c3c" : "#27ae60" }} />
            دور {currentTurn === 1 ? team1Name : team2Name}
          </div>
        </div>

        {/* Left — Team 2 + end btn */}
        <div className="gb-header-right">
          <div className={`score-card ${currentTurn === 2 ? "active" : ""}`} style={{ flexDirection: "row-reverse" }}>
            {currentTurn === 2 && <span className="turn-dot" style={{ background: "#d4af37", marginLeft: "4px" }} />}
            <div style={{ textAlign: "left" }}>
              <div className="score-label">🟢 {team2Name}</div>
              <div data-testid="team2-score" className="score-val" style={{ textAlign: "left" }}>
                <ScoreCounter value={teamScores.team2} />
              </div>
            </div>
            <div className="score-icon">🦁</div>
          </div>
          <button
            data-testid="end-game-btn"
            className="end-btn"
            onClick={() => setShowEndConfirm(true)}
          >
            إنهاء اللعبة
          </button>
        </div>
      </div>

      {/* ════════════════ BOARD ════════════════ */}
      <div className="game-container">
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
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#d4af37", marginBottom: "10px", fontFamily: "Amiri, serif" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "10px 28px", borderRadius: "6px",
              fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "0.95rem",
              background: "#111", color: "#d4af37",
              border: "2px solid #8b6b32", cursor: "pointer",
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
            <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "#d4af37", marginBottom: "8px", fontFamily: "Amiri, serif" }}>
              إنهاء اللعبة؟
            </div>
            <div style={{ fontSize: "0.85rem", color: "rgba(212,175,55,0.4)", marginBottom: "24px" }}>
              سيتم إعلان الفائز الحالي
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleEndGame}
                style={{
                  padding: "10px 24px", borderRadius: "6px",
                  fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "0.95rem",
                  background: "#111", color: "#c0392b",
                  border: "2px solid #c0392b", cursor: "pointer",
                }}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: "10px 24px", borderRadius: "6px",
                  fontFamily: "Noto Naskh Arabic, serif", fontWeight: 700, fontSize: "0.95rem",
                  background: "#111", color: "rgba(212,175,55,0.5)",
                  border: "2px solid rgba(139,107,50,0.4)", cursor: "pointer",
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
          <div style={{ fontWeight: 400, fontSize: "1rem", color: "rgba(212,175,55,0.5)", marginBottom: "6px" }}>الفائز</div>
          <div style={{
            fontWeight: 700, fontSize: "clamp(2rem,5vw,4rem)",
            color: "#d4af37", marginBottom: "28px", lineHeight: 1.2,
            textShadow: "0 0 30px rgba(212,175,55,0.4)",
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
                background: "linear-gradient(145deg,#1a1a24,#111116)",
                border: "2px solid #8b6b32",
                boxShadow: "0 4px 14px rgba(0,0,0,0.5), inset 0 0 10px rgba(139,107,50,0.15)",
              }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "rgba(212,175,55,0.6)", marginBottom: "6px", fontFamily: "Noto Naskh Arabic, serif" }}>{name}</div>
                <div style={{ fontWeight: 700, fontSize: "2rem", color: "#d4af37", fontFamily: "Amiri, serif" }}>{score}</div>
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
              background: "#111", color: "#d4af37",
              border: "2px solid #8b6b32", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
