import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API         = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];

const BTN_COLORS = {
  300: { bg: "linear-gradient(160deg,#27ae60,#1e8449)", glow: "rgba(39,174,96,0.50)",   label: "٣٠٠" },
  600: { bg: "linear-gradient(160deg,#c8960a,#a67c00)", glow: "rgba(200,150,10,0.50)",  label: "٦٠٠" },
  900: { bg: "linear-gradient(160deg,#c0392b,#922b21)", glow: "rgba(192,57,43,0.50)",   label: "٩٠٠" },
};

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
  const colors = ["#d8b25c","#ff6b6b","#43e97b","#4facfe","#a78bfa","#fff"];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed", top: "-10px",
      left: Math.random() * 100 + "vw",
      width:  (Math.random() * 9 + 5)  + "px",
      height: (Math.random() * 9 + 5)  + "px",
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
   Layout:  [ title ]
            [ 300  300 ]   ← slot1 | slot2
            [ 600  600 ]
            [ 900  900 ]
   Category image = subtle blurred background of the card
   ══════════════════════════════════════════════════════ */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const slotUsed = (diff, slot) => isTileUsed(`${cat.id}_${diff}_${slot}`);
  const bothUsed = (diff)       => slotUsed(diff, 1) && slotUsed(diff, 2);
  const allDone  = DIFFICULTIES.every(d => bothUsed(d));

  const renderBtn = (diff, slot) => {
    const used     = slotUsed(diff, slot);
    const allGone  = bothUsed(diff);
    const key      = `${cat.id}_${diff}_${slot}`;
    const clicking = clickingTile === key;
    const isMyTurn = currentTurn === slot;
    const c        = BTN_COLORS[diff];
    const disabled = used || allGone || !!clickingTile || !isMyTurn;

    return (
      <button
        key={key}
        data-testid={`tile-${cat.id}-${diff}-${slot}`}
        className={`score-btn${used || allGone ? " s-used" : isMyTurn ? " s-active" : " s-wait"}`}
        disabled={disabled}
        onClick={() => isMyTurn && !used && !allGone && onTileClick(cat.id, diff, slot)}
        style={used || allGone ? {} : {
          background: c.bg,
          boxShadow:  isMyTurn ? `0 4px 16px ${c.glow}` : "none",
          opacity:    isMyTurn ? 1 : 0.28,
          filter:     isMyTurn ? "none" : "saturate(0.2)",
        }}
      >
        {clicking ? "…" : used ? "✓" : c.label}
      </button>
    );
  };

  return (
    <div className="category-card" style={{ opacity: allDone ? 0.44 : 1 }}>

      {/* Category image — blurred bg inside card */}
      {cat.image_url && (
        <div
          className="card-bg-img"
          style={{ backgroundImage: `url(${cat.image_url})` }}
        />
      )}

      {/* Completed overlay */}
      {allDone && (
        <div className="answered-overlay">
          <div className="answered-check">✓</div>
        </div>
      )}

      {/* Title */}
      <div className="cat-title">{cat.name}</div>

      {/* 2×3 points grid: left col = slot1, right col = slot2 */}
      <div className="points-grid">
        {DIFFICULTIES.map(diff => (
          <React.Fragment key={diff}>
            {renderBtn(diff, 1)}
            {renderBtn(diff, 2)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main Board Page
   ══════════════════════════════════════════════════════ */
export default function GameBoardPage() {
  const navigate = useNavigate();
  const {
    session, resetGame, currentTurn,
    markTileUsed, isTileUsed, teamScores, saveSession,
    gameMode, tournamentState,
  } = useGame();

  const [categories,      setCategories]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showEndConfirm,  setShowEndConfirm]  = useState(false);
  const [showWinner,      setShowWinner]      = useState(false);
  const [clickingTile,    setClickingTile]    = useState(null);

  const team1Name = session?.team1_name || "الفريق الأحمر";
  const team2Name = session?.team2_name || "الفريق الأزرق";

  useEffect(() => {
    if (!session) { navigate("/"); return; }
    loadBoard();
  }, []); // eslint-disable-line

  const loadBoard = async () => {
    const allIds    = [...(session?.team1_categories || []), ...(session?.team2_categories || [])];
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

  /* ── Loading ── */
  if (loading) return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#090b14", fontFamily: "Tajawal, Cairo, sans-serif",
    }}>
      <div style={{ color: "#d8b25c", fontSize: "1.1rem", fontWeight: 700, opacity: 0.85 }}>
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

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="gb-page">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
      />

      {/* ─────────── ALL STYLES ─────────── */}
      <style>{`
        /* ── Confetti ── */
        @keyframes gbFall { to { transform: translateY(110vh) rotate(540deg); opacity:0; } }

        /* ── Card entry ── */
        @keyframes cardIn {
          from { opacity:0; transform:translateY(22px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)  scale(1);    }
        }

        /* ── Dot pulse ── */
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.30; transform:scale(0.60); }
        }

        /* ── Page wrapper ── */
        .gb-page {
          min-height: 100svh;
          height: 100svh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
          box-sizing: border-box;
          font-family: 'Tajawal', Cairo, sans-serif;
          direction: rtl;
          position: relative;
          background: #090b14;
        }

        /* Classical dark background */
        .gb-page::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(9,11,20,0.78), rgba(9,11,20,0.94)),
            url("/background-art.jpg") center/cover no-repeat;
          filter: blur(14px) saturate(0.40) brightness(0.65);
          transform: scale(1.10);
          opacity: 0.14;
          z-index: 0;
          pointer-events: none;
        }

        /* Ambient color clouds */
        .gb-page::after {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 50% 0%,   rgba(111,87,255,0.13), transparent),
            radial-gradient(ellipse 40% 35% at 10% 100%, rgba(216,178,92,0.09), transparent),
            radial-gradient(ellipse 35% 30% at 90% 90%,  rgba(39,174,96,0.06),  transparent);
          z-index: 0;
          pointer-events: none;
        }

        /* Everything above pseudo-elements */
        .gb-page > * { position: relative; z-index: 1; }

        /* ─── HEADER ─── */
        .gb-header {
          display: grid;
          grid-template-columns: 1.1fr auto 1.1fr;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          padding: 10px 16px;
          background: linear-gradient(180deg, rgba(20,23,42,0.88), rgba(11,13,24,0.80));
          border: 1px solid rgba(255,255,255,0.08);
          border-bottom-color: rgba(216,178,92,0.14);
          border-radius: 18px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .team-block {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px;
          border-radius: 14px;
          transition: all 0.35s ease;
          min-width: 0;
        }
        .team-block.active-t1 {
          background: rgba(255,90,90,0.10);
          border: 1px solid rgba(255,90,90,0.32);
          box-shadow: 0 0 18px rgba(255,90,90,0.14);
        }
        .team-block.active-t2 {
          background: rgba(79,172,254,0.10);
          border: 1px solid rgba(79,172,254,0.32);
          box-shadow: 0 0 18px rgba(79,172,254,0.14);
        }
        .team-block.idle {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .team-block.right { justify-content: flex-end; }
        .team-block .team-label {
          font-size: 0.76rem;
          font-weight: 600;
          color: rgba(255,255,255,0.48);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .team-block .team-score {
          font-size: 1.85rem;
          font-weight: 900;
          color: #d8b25c;
          line-height: 1;
        }

        /* Turn dot */
        .turn-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          animation: pulseDot 1.4s infinite;
        }

        /* Header center */
        .hdr-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }
        .game-title {
          font-size: clamp(1.1rem,1.8vw,1.5rem);
          font-weight: 900;
          color: #d8b25c;
          letter-spacing: 0.06em;
          text-shadow: 0 0 24px rgba(216,178,92,0.40);
          line-height: 1;
        }
        .turn-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 14px;
          border-radius: 50px;
          font-size: 0.82rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .turn-badge.t1 {
          background: rgba(255,90,90,0.12);
          border: 1px solid rgba(255,90,90,0.28);
          color: #ff9a9a;
        }
        .turn-badge.t2 {
          background: rgba(79,172,254,0.12);
          border: 1px solid rgba(79,172,254,0.28);
          color: #93c5fd;
        }
        .end-btn {
          margin-top: 2px;
          padding: 5px 18px;
          border-radius: 50px;
          border: 1px solid rgba(255,90,90,0.32);
          background: rgba(255,90,90,0.10);
          color: #ff9a9a;
          font-family: 'Tajawal', Cairo, sans-serif;
          font-size: 0.80rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .end-btn:hover { background: rgba(255,90,90,0.20); }

        /* ─── BOARD GRID ─── */
        .board-grid {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 14px;
        }

        /* ─── CATEGORY CARD ─── */
        .category-card {
          height: 100%;
          min-height: 280px;
          border-radius: 22px;
          padding: 16px;
          background: rgba(18, 22, 44, 0.92);
          border: 1px solid rgba(216,178,92,0.14);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 18px 54px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
          transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
        }
        .category-card:hover {
          transform: translateY(-3px);
          border-color: rgba(216,178,92,0.28);
          box-shadow: 0 26px 68px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.07);
        }
        .category-card:nth-child(1) { animation-delay:0.05s }
        .category-card:nth-child(2) { animation-delay:0.10s }
        .category-card:nth-child(3) { animation-delay:0.15s }
        .category-card:nth-child(4) { animation-delay:0.20s }
        .category-card:nth-child(5) { animation-delay:0.25s }
        .category-card:nth-child(6) { animation-delay:0.30s }

        /* Category image as blurred card background */
        .card-bg-img {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.10;
          filter: blur(6px) grayscale(30%);
          transform: scale(1.08);
          z-index: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .category-card:hover .card-bg-img { opacity: 0.15; }

        /* All content above bg image */
        .cat-title,
        .points-grid { position: relative; z-index: 1; }

        /* Card title */
        .cat-title {
          text-align: center;
          font-size: clamp(0.92rem, 1.35vw, 1.12rem);
          font-weight: 900;
          color: #f5f1e8;
          line-height: 1.3;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(216,178,92,0.18);
          text-shadow: 0 2px 10px rgba(0,0,0,0.60);
          letter-spacing: 0.01em;
        }

        /* 2-col × 3-row points grid */
        .points-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
        }

        /* Score buttons */
        .score-btn {
          height: 52px;
          border: none;
          border-radius: 12px;
          font-size: clamp(1rem, 1.4vw, 1.15rem);
          font-weight: 900;
          font-family: 'Tajawal', Cairo, sans-serif;
          cursor: pointer;
          color: #fff;
          position: relative;
          overflow: hidden;
          transition:
            transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
            opacity 0.18s ease,
            box-shadow 0.18s ease;
        }
        .score-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.14s;
        }
        .score-btn.s-active:hover::after { background: rgba(255,255,255,0.14); }
        .score-btn.s-active:hover  { transform: translateY(-2px) scale(1.04); }
        .score-btn.s-active:active { transform: scale(0.91); }
        .score-btn.s-wait  { cursor: not-allowed; }
        .score-btn.s-used  {
          background: rgba(255,255,255,0.05) !important;
          box-shadow: none !important;
          opacity: 1 !important;
          filter: none !important;
          color: rgba(255,255,255,0.18);
          cursor: default;
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* Answered overlay */
        .answered-overlay {
          position: absolute; inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          background: rgba(8,6,22,0.65);
          backdrop-filter: blur(4px);
        }
        .answered-check {
          width: 50px; height: 50px;
          background: rgba(39,174,96,0.12);
          border: 2px solid #27ae60;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.45rem;
          color: #2ecc71;
          font-family: sans-serif;
        }

        /* ─── MODAL ─── */
        .modal-bg {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          background: rgba(8,6,20,0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .modal-box {
          background: linear-gradient(155deg,rgba(24,20,58,0.98),rgba(9,7,24,0.99));
          border: 1px solid rgba(216,178,92,0.22);
          border-radius: 24px;
          padding: clamp(22px,3vw,36px);
          max-width: 360px; width: 100%;
          text-align: center;
          box-shadow: 0 24px 80px rgba(0,0,0,0.72);
          font-family: 'Tajawal', Cairo, sans-serif;
        }

        /* ─── WINNER ─── */
        @keyframes winnerIn {
          from { opacity:0; transform:scale(0.86) translateY(22px); }
          to   { opacity:1; transform:scale(1)    translateY(0);   }
        }
        .winner-screen {
          position: fixed; inset: 0; z-index: 60;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 24px; text-align: center;
          background: linear-gradient(135deg,rgba(9,7,22,0.97),rgba(5,4,14,0.99));
          backdrop-filter: blur(24px);
          animation: winnerIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
          font-family: 'Tajawal', Cairo, sans-serif;
        }

        /* ─── ALL DONE BANNER ─── */
        .done-banner {
          position: fixed; bottom:0; left:0; right:0; z-index:40;
          padding: 14px; text-align: center;
          background: rgba(9,7,22,0.95);
          backdrop-filter: blur(14px);
          border-top: 1px solid rgba(216,178,92,0.28);
        }

        /* ─── Responsive ─── */
        @media (max-width: 900px) {
          .board-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 600px) {
          .board-grid { grid-template-columns: 1fr !important; }
          .gb-header  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══════════ HEADER ══════════ */}
      <header className="gb-header">

        {/* Team 1 */}
        <div className={`team-block ${currentTurn === 1 ? "active-t1" : "idle"}`}>
          {currentTurn === 1 && (
            <span className="turn-dot" style={{ background: "#ff6b6b" }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div className="team-label">🔴 {team1Name}</div>
            <div data-testid="team1-score" className="team-score">
              <ScoreCounter value={teamScores.team1} />
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="hdr-center">
          <div className="game-title">حُجّة</div>
          <div
            data-testid="turn-indicator"
            className={`turn-badge ${currentTurn === 1 ? "t1" : "t2"}`}
          >
            <span
              className="turn-dot"
              style={{ background: currentTurn === 1 ? "#ff6b6b" : "#4facfe" }}
            />
            دور {currentTurn === 1 ? team1Name : team2Name}
          </div>
          <button className="end-btn" onClick={() => setShowEndConfirm(true)}>
            إنهاء اللعبة
          </button>
        </div>

        {/* Team 2 */}
        <div className={`team-block right ${currentTurn === 2 ? "active-t2" : "idle"}`}>
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <div className="team-label">🔵 {team2Name}</div>
            <div
              data-testid="team2-score"
              className="team-score"
              style={{ textAlign: "left" }}
            >
              <ScoreCounter value={teamScores.team2} />
            </div>
          </div>
          {currentTurn === 2 && (
            <span className="turn-dot" style={{ background: "#4facfe" }} />
          )}
        </div>
      </header>

      {/* ══════════ BOARD ══════════ */}
      <div className="board-grid">
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

      {/* ══════════ ALL USED BANNER ══════════ */}
      {allUsed && !showWinner && (
        <div className="done-banner">
          <div style={{
            fontWeight: 900, fontSize: "1.1rem",
            color: "#d8b25c", marginBottom: "10px",
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            style={{
              padding: "10px 28px", borderRadius: "50px",
              fontFamily: "Tajawal, Cairo, sans-serif",
              fontWeight: 900, fontSize: "0.95rem",
              background: "linear-gradient(135deg,#d8b25c,#b8920a)",
              color: "#100c02", border: "none", cursor: "pointer",
              boxShadow: "0 4px 22px rgba(216,178,92,0.40)",
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
            <div style={{ fontWeight: 900, fontSize: "1.35rem", color: "#d8b25c", marginBottom: "8px" }}>
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
                  fontFamily: "Tajawal, Cairo, sans-serif",
                  fontWeight: 900, fontSize: "0.95rem",
                  background: "linear-gradient(135deg,rgba(192,57,43,0.90),rgba(146,43,33,0.92))",
                  color: "#fff",
                  border: "1px solid rgba(192,57,43,0.50)",
                  cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(192,57,43,0.30)",
                }}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: "10px 24px", borderRadius: "50px",
                  fontFamily: "Tajawal, Cairo, sans-serif",
                  fontWeight: 700, fontSize: "0.95rem",
                  background: "transparent",
                  color: "rgba(255,255,255,0.40)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  cursor: "pointer",
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
          <div style={{
            fontWeight: 600, fontSize: "0.95rem",
            color: "rgba(216,178,92,0.52)", marginBottom: "6px",
          }}>
            الفائز
          </div>
          <div style={{
            fontWeight: 900,
            fontSize: "clamp(2.2rem,5vw,4.5rem)",
            color: "#d8b25c", marginBottom: "28px", lineHeight: 1.1,
            textShadow: "0 4px 30px rgba(216,178,92,0.45)",
          }}>
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div style={{ display: "flex", gap: "20px", marginBottom: "32px" }}>
            {[
              { name: team1Name, score: teamScores.team1, color: "#ff6b6b" },
              { name: team2Name, score: teamScores.team2, color: "#4facfe" },
            ].map(({ name, score, color }) => (
              <div key={name} style={{
                textAlign: "center", borderRadius: "18px", padding: "16px 28px",
                background: `${color}12`,
                border: `1px solid ${color}36`,
              }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color, marginBottom: "6px" }}>
                  {name}
                </div>
                <div style={{ fontWeight: 900, fontSize: "2.2rem", color: "#d8b25c" }}>
                  {score}
                </div>
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
              background: "linear-gradient(135deg,#d8b25c,#b8920a)",
              color: "#0d0900",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 32px rgba(216,178,92,0.42)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
