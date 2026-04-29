import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API          = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];

/* ─────────────────────────────────────────────
   Animated score roll-up
───────────────────────────────────────────── */
function ScoreCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const [pop, setPop]   = useState(false);

  useEffect(() => {
    if (value === prev.current) return;
    setPop(true);
    const delta = value - prev.current, steps = 16;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (delta * i) / steps));
      if (i >= steps) { clearInterval(t); setDisplay(value); setPop(false); prev.current = value; }
    }, 30);
    return () => clearInterval(t);
  }, [value]);

  return (
    <span style={{
      display: "inline-block",
      transform: pop ? "scale(1.18)" : "scale(1)",
      transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
    }}>{display}</span>
  );
}

/* ─────────────────────────────────────────────
   Confetti
───────────────────────────────────────────── */
function fireConfetti() {
  const colors = ["#c9a227","#e8c14a","#ff6b6b","#43e97b","#a78bfa","#fff"];
  for (let i = 0; i < 100; i++) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position:"fixed", top:"-12px",
      left: Math.random()*100+"vw",
      width: (Math.random()*10+4)+"px",
      height:(Math.random()*10+4)+"px",
      background: colors[Math.floor(Math.random()*colors.length)],
      borderRadius: Math.random()>.5?"50%":"3px",
      animation:`gbFall ${Math.random()*3+2}s ${Math.random()}s linear forwards`,
      zIndex:9999, pointerEvents:"none",
    });
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 5600);
  }
}

/* ─────────────────────────────────────────────
   Point Capsule Button
───────────────────────────────────────────── */
function PointBtn({ diff, slot, catId, isTileUsed, bothUsed, clickingTile, currentTurn, onTileClick }) {
  const key      = `${catId}_${diff}_${slot}`;
  const used     = isTileUsed(key);
  const allGone  = bothUsed(diff);
  const clicking = clickingTile === key;
  const isMyTurn = currentTurn === slot;
  const disabled = used || allGone || !!clickingTile || !isMyTurn;

  // gradient per difficulty
  const gradient =
    diff === 300 ? "linear-gradient(135deg,#1a9e5c,#0d7a43)"
  : diff === 600 ? "linear-gradient(135deg,#c97d0a,#a05f06)"
  :                "linear-gradient(135deg,#c0392b,#922b21)";

  const glowColor =
    diff === 300 ? "rgba(26,158,92,0.55)"
  : diff === 600 ? "rgba(201,125,10,0.55)"
  :                "rgba(192,57,43,0.55)";

  let state = "idle";
  if (used || allGone) state = "used";
  else if (!isMyTurn)  state = "waiting";

  return (
    <button
      data-testid={`tile-${catId}-${diff}-${slot}`}
      className={`pcap pcap-${state}`}
      disabled={disabled}
      style={state === "idle" ? { background: gradient, "--glow": glowColor } : {}}
      onClick={() => isMyTurn && !used && !allGone && onTileClick(catId, diff, slot)}
    >
      {clicking ? "·" : used ? "✓" : diff}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Category Card
   LEFT col (slot 2) | IMAGE + LABEL | RIGHT col (slot 1)
   In RTL: slot-1 column renders on the visual right
───────────────────────────────────────────── */
function CategoryCard({ cat, isTileUsed: isTU, clickingTile, onTileClick, currentTurn }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);

  const slotUsed = (d, s) => isTU(`${cat.id}_${d}_${s}`);
  const bothUsed = (d)     => slotUsed(d, 1) && slotUsed(d, 2);
  const allDone  = DIFFICULTIES.every(d => bothUsed(d));

  const sharedProps = { catId: cat.id, isTileUsed: isTU, bothUsed, clickingTile, currentTurn, onTileClick };

  return (
    <div
      className="cat-card"
      style={{ opacity: allDone ? 0.38 : 1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* glass shimmer line */}
      <div className="card-shimmer" />

      {allDone && (
        <div className="done-veil">
          <div className="done-badge">✓</div>
        </div>
      )}

      {/* ── body: [col | image | col] ── */}
      <div className="card-body">

        {/* Left col — slot 1 (RTL: renders right) */}
        <div className="pcap-col">
          {DIFFICULTIES.map(d => <PointBtn key={d} diff={d} slot={1} {...sharedProps} />)}
        </div>

        {/* Center */}
        <div className="card-center" style={{ transform: hovered ? "translateY(-3px)" : "translateY(0)", transition: "transform 0.3s ease" }}>
          <div className="card-img-wrap">
            {cat.image_url && !imgErr ? (
              <img src={cat.image_url} alt={cat.name} onError={() => setImgErr(true)} />
            ) : (
              <div className="card-img-fallback">
                <span>{cat.icon || "🎯"}</span>
              </div>
            )}
            <div className="img-overlay" />
          </div>
          <div className="card-label">{cat.name}</div>
        </div>

        {/* Right col — slot 2 (RTL: renders left) */}
        <div className="pcap-col">
          {DIFFICULTIES.map(d => <PointBtn key={d} diff={d} slot={2} {...sharedProps} />)}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Team Score Panel
───────────────────────────────────────────── */
function TeamPanel({ name, score, isActive, side, color }) {
  return (
    <div className={`team-panel ${isActive ? "team-panel--active" : ""}`}
      style={{ "--tc": color }}
    >
      {side === "left" && isActive && <span className="team-pulse" />}
      <div className="team-info">
        <div className="team-name">{name}</div>
        <div className="team-score"><ScoreCounter value={score} /></div>
      </div>
      {side === "right" && isActive && <span className="team-pulse" />}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function GameBoardPage() {
  const navigate = useNavigate();
  const { session, resetGame, currentTurn, markTileUsed, isTileUsed, teamScores, saveSession, gameMode, tournamentState } = useGame();

  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWinner,     setShowWinner]     = useState(false);
  const [clickingTile,   setClickingTile]   = useState(null);

  const team1Name = session?.team1_name || "الفريق الأحمر";
  const team2Name = session?.team2_name || "الفريق الأخضر";

  useEffect(() => { if (!session) { navigate("/"); return; } loadBoard(); }, []); // eslint-disable-line

  const loadBoard = async () => {
    const allIds = [...(session?.team1_categories||[]), ...(session?.team2_categories||[])];
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
  useEffect(() => { const h = () => refreshScores(); window.addEventListener("scoreUpdated", h); return () => window.removeEventListener("scoreUpdated", h); }, [refreshScores]);

  const handleTileClick = async (catId, difficulty, slot) => {
    const key = `${catId}_${difficulty}_${slot}`;
    if (isTileUsed(key) || clickingTile) return;
    setClickingTile(key);
    markTileUsed(key);
    try {
      const { data: q } = await axios.post(`${API}/game/session/${session.id}/question?category_id=${catId}&difficulty=${difficulty}`);
      navigate("/question", { state: { question: q, catId, difficulty, slot, catName: categories.find(c=>c.id===catId)?.name, turnTeam: currentTurn } });
    } catch {
      toast.error("لا يوجد أسئلة متاحة لهذه الفئة!");
    } finally {
      setClickingTile(null);
    }
  };

  const handleEndGame = () => { fireConfetti(); setShowEndConfirm(false); setShowWinner(true); };

  if (loading) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#08090f", fontFamily:"'Cairo',sans-serif" }}>
      <div style={{ color:"#c9a227", fontSize:"1.1rem", fontWeight:700, letterSpacing:"0.06em" }}>جاري تحميل اللوحة…</div>
    </div>
  );

  const allUsed = categories.every(c => DIFFICULTIES.every(d => isTileUsed(`${c.id}_${d}_1`) && isTileUsed(`${c.id}_${d}_2`)));
  const winner  = allUsed || showWinner
    ? teamScores.team1 > teamScores.team2 ? team1Name
    : teamScores.team2 > teamScores.team1 ? team2Name : "تعادل"
    : null;

  return (
    <div className="gb-root">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" />

      {/* ═══════════ STYLES ═══════════ */}
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        @keyframes gbFall    { to { transform:translateY(110vh) rotate(540deg); opacity:0; } }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.3;transform:scale(.5);} }
        @keyframes winnerIn  { from{opacity:0;transform:scale(.88) translateY(20px);} to{opacity:1;transform:none;} }
        @keyframes shimmerX  { from{transform:translateX(-100%);} to{transform:translateX(200%);} }
        @keyframes capPress  { 0%{transform:scale(1);} 50%{transform:scale(.91);} 100%{transform:scale(1);} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 18px var(--glow,rgba(201,162,39,.5));} 50%{box-shadow:0 0 32px var(--glow,rgba(201,162,39,.8));} }

        /* ── ROOT ── */
        .gb-root {
          min-height: 100vh;
          background: #08090f;
          direction: rtl;
          font-family: 'Cairo', sans-serif;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
          color: #f0ece0;
        }

        /* Dark cinematic overlay + Roman art */
        .gb-root::before {
          content:"";
          position:fixed; inset:0; z-index:0;
          background:
            url('/roman-bg.jpg') center/cover no-repeat,
            linear-gradient(160deg,#08090f 0%,#0e0f1a 100%);
          background-blend-mode: luminosity;
          opacity:.07;
          filter:blur(8px) grayscale(60%);
          pointer-events:none;
        }

        /* Subtle ambient glow blobs */
        .gb-root::after {
          content:"";
          position:fixed; inset:0; z-index:0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 10%, rgba(201,162,39,.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 35% at 80% 90%, rgba(99,102,241,.06) 0%, transparent 55%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(255,255,255,.015) 0%, transparent 70%);
          pointer-events:none;
        }

        .gb-root > * { position:relative; z-index:1; }

        /* ── HEADER ── */
        .gb-header {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 20px;
          padding: 14px 32px;
          background: rgba(8,9,15,0.96);
          border-bottom: 1px solid rgba(201,162,39,0.16);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 1px 0 rgba(255,255,255,0.03), 0 8px 40px rgba(0,0,0,0.5);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .gb-header-left  { display:flex; align-items:center; }
        .gb-header-right { display:flex; align-items:center; justify-content:flex-end; gap:12px; }
        .gb-header-center {
          display:flex; flex-direction:column; align-items:center; gap:6px;
          flex-shrink:0;
        }

        /* Brand */
        .gb-brand {
          font-size: clamp(2rem, 3.2vw, 3.2rem);
          font-weight: 900;
          background: linear-gradient(160deg, #f5e090 0%, #c9a227 45%, #8b6a10 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: .04em;
          line-height: 1;
          filter: drop-shadow(0 0 18px rgba(201,162,39,.45));
        }

        /* Turn badge */
        .turn-badge {
          display:flex; align-items:center; gap:7px;
          padding: 4px 16px;
          border-radius: 99px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,162,39,0.22);
          font-size: .78rem;
          font-weight: 700;
          color: rgba(201,162,39,.85);
          letter-spacing:.03em;
          white-space:nowrap;
        }
        .t-dot {
          width:7px; height:7px; border-radius:50%;
          animation: pulse 1.6s infinite;
          flex-shrink:0;
        }

        /* ── TEAM PANEL ── */
        .team-panel {
          position:relative;
          display:flex; align-items:center; gap:14px;
          padding: 10px 20px;
          border-radius: 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
          transition: border-color .3s, box-shadow .3s;
          overflow:hidden;
        }
        .team-panel::before {
          content:"";
          position:absolute; inset:0;
          background: linear-gradient(135deg, rgba(255,255,255,0.025), transparent 60%);
          pointer-events:none;
        }
        .team-panel--active {
          border-color: color-mix(in srgb, var(--tc) 55%, transparent);
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--tc) 25%, transparent),
                      0 0 30px color-mix(in srgb, var(--tc) 18%, transparent);
        }
        .team-info { display:flex; flex-direction:column; gap:1px; }
        .team-name {
          font-size:.72rem; font-weight:700;
          color:rgba(240,236,224,.5);
          letter-spacing:.05em;
          text-transform:uppercase;
        }
        .team-score {
          font-size:1.7rem; font-weight:900;
          color:#f0ece0;
          line-height:1;
          letter-spacing:-.01em;
        }
        .team-pulse {
          width:8px; height:8px; border-radius:50%;
          background: var(--tc);
          box-shadow: 0 0 10px var(--tc);
          animation: pulse 1.4s infinite;
          flex-shrink:0;
        }

        /* End button */
        .end-btn {
          display:flex; align-items:center; gap:6px;
          padding: 9px 18px;
          border-radius: 10px;
          background: rgba(192,57,43,0.08);
          border: 1px solid rgba(192,57,43,0.35);
          color: rgba(231,76,60,.85);
          font-family:'Cairo',sans-serif;
          font-weight:700; font-size:.82rem;
          cursor:pointer;
          transition: all .2s;
          white-space:nowrap;
          letter-spacing:.02em;
        }
        .end-btn:hover {
          background: rgba(192,57,43,0.16);
          border-color: rgba(231,76,60,.65);
          color: #e74c3c;
          transform: translateY(-1px);
        }

        /* ── BOARD ── */
        .gb-board {
          flex:1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          grid-template-rows: repeat(2, minmax(0,1fr));
          gap: 18px;
          padding: 20px 28px 24px;
          min-height: 0;
        }

        /* ── CATEGORY CARD ── */
        .cat-card {
          position: relative;
          border-radius: 22px;
          background: rgba(18,20,32,0.78);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.04) inset,
            0 24px 60px rgba(0,0,0,0.48);
          overflow: hidden;
          animation: fadeUp .42s cubic-bezier(.22,1,.36,1) both;
          transition: border-color .28s, box-shadow .28s, transform .28s;
          display:flex; flex-direction:column;
        }
        .cat-card:hover {
          border-color: rgba(201,162,39,0.28);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 28px 70px rgba(0,0,0,0.55),
            0 0 0 1px rgba(201,162,39,0.12);
          transform: translateY(-3px) scale(1.012);
        }
        .cat-card:nth-child(1){animation-delay:.04s}
        .cat-card:nth-child(2){animation-delay:.09s}
        .cat-card:nth-child(3){animation-delay:.14s}
        .cat-card:nth-child(4){animation-delay:.19s}
        .cat-card:nth-child(5){animation-delay:.24s}
        .cat-card:nth-child(6){animation-delay:.29s}

        /* Shimmer highlight on top edge */
        .card-shimmer {
          position:absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg, transparent 0%, rgba(201,162,39,.5) 50%, transparent 100%);
          overflow:hidden;
          pointer-events:none;
          z-index:2;
        }
        .cat-card:hover .card-shimmer::after {
          content:"";
          position:absolute; inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);
          animation: shimmerX .9s ease;
        }

        /* Card body: [col | center | col] */
        .card-body {
          flex:1;
          display: grid;
          grid-template-columns: 72px minmax(0,1fr) 72px;
          gap: 10px;
          padding: 14px 12px;
          align-items: center;
          min-height:0;
        }

        /* Point capsule column */
        .pcap-col {
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          gap:8px;
          height:100%;
        }

        /* ── POINT CAPSULE ── */
        .pcap {
          width:100%;
          flex:1;
          border:none;
          border-radius:12px;
          font-family:'Cairo',sans-serif;
          font-weight:900;
          font-size:.9rem;
          cursor:pointer;
          color:#fff;
          position:relative;
          overflow:hidden;
          transition: transform .16s cubic-bezier(.34,1.56,.64,1), filter .16s, opacity .16s;
        }
        /* inner shimmer streak */
        .pcap::before {
          content:"";
          position:absolute; top:0; left:-60%; width:40%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
          transform:skewX(-20deg);
          transition: left .4s;
        }
        .pcap:not(.pcap-used):not(.pcap-waiting):hover::before { left:130%; }
        .pcap:not(.pcap-used):not(.pcap-waiting):hover {
          transform:scale(1.07) translateY(-1px);
          filter:brightness(1.12);
          animation: glowPulse .8s ease;
        }
        .pcap:not(.pcap-used):not(.pcap-waiting):active {
          animation: capPress .22s ease;
          filter:brightness(.92);
        }

        .pcap-waiting {
          opacity:.18;
          filter:saturate(.08);
          cursor:not-allowed;
          background:rgba(255,255,255,0.05) !important;
          box-shadow:none !important;
        }
        .pcap-used {
          background:rgba(255,255,255,0.04) !important;
          color:rgba(255,255,255,.18) !important;
          cursor:default;
          border:1px solid rgba(255,255,255,.06);
          box-shadow:none !important;
        }
        .pcap-used::before { display:none; }

        /* ── CARD CENTER ── */
        .card-center {
          display:flex;
          flex-direction:column;
          gap:10px;
          height:100%;
        }

        .card-img-wrap {
          flex:1;
          border-radius:14px;
          overflow:hidden;
          position:relative;
          border:1px solid rgba(255,255,255,0.08);
          min-height:0;
        }
        .card-img-wrap img {
          width:100%; height:100%;
          object-fit:cover;
          display:block;
          filter:brightness(.82) saturate(.85);
          transition:transform .45s ease;
        }
        .cat-card:hover .card-img-wrap img { transform:scale(1.06); }
        .img-overlay {
          position:absolute; inset:0;
          background:linear-gradient(180deg,transparent 55%,rgba(8,9,15,.62) 100%);
          pointer-events:none;
        }
        .card-img-fallback {
          width:100%; height:100%; min-height:100px;
          background:linear-gradient(135deg,rgba(30,32,50,.9),rgba(14,15,24,.95));
          display:flex; align-items:center; justify-content:center;
          font-size:2.6rem;
        }

        /* Category label */
        .card-label {
          text-align:center;
          font-size:.85rem;
          font-weight:700;
          color:rgba(240,236,224,.75);
          letter-spacing:.03em;
          line-height:1.2;
          padding:2px 4px 0;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        /* ── DONE VEIL ── */
        .done-veil {
          position:absolute; inset:0; z-index:4;
          display:flex; align-items:center; justify-content:center;
          background:rgba(8,9,15,.72);
          backdrop-filter:blur(6px);
          border-radius:22px;
        }
        .done-badge {
          width:52px; height:52px;
          border-radius:50%;
          background:rgba(201,162,39,.1);
          border:2px solid rgba(201,162,39,.45);
          display:flex; align-items:center; justify-content:center;
          font-size:1.4rem; color:#c9a227;
        }

        /* ── MODAL ── */
        .modal-bg {
          position:fixed; inset:0; z-index:50;
          display:flex; align-items:center; justify-content:center; padding:16px;
          background:rgba(4,4,8,.88);
          backdrop-filter:blur(18px);
          -webkit-backdrop-filter:blur(18px);
        }
        .modal-box {
          background:rgba(14,15,24,.98);
          border:1px solid rgba(201,162,39,.22);
          border-radius:22px;
          padding:clamp(24px,3.5vw,42px);
          max-width:380px; width:100%;
          text-align:center;
          box-shadow:0 0 0 1px rgba(255,255,255,.03), 0 30px 90px rgba(0,0,0,.8);
        }
        .modal-title { font-size:1.3rem; font-weight:900; color:#f0ece0; margin-bottom:8px; }
        .modal-sub   { font-size:.82rem; color:rgba(240,236,224,.38); margin-bottom:28px; }
        .modal-btns  { display:flex; gap:12px; justify-content:center; }
        .modal-btn {
          padding:10px 26px; border-radius:10px;
          font-family:'Cairo',sans-serif; font-weight:700; font-size:.92rem;
          cursor:pointer; transition:all .2s;
        }
        .modal-btn-confirm {
          background:rgba(192,57,43,.12);
          color:#e74c3c; border:1px solid rgba(192,57,43,.4);
        }
        .modal-btn-confirm:hover { background:rgba(192,57,43,.22); border-color:#e74c3c; }
        .modal-btn-cancel {
          background:transparent;
          color:rgba(240,236,224,.35); border:1px solid rgba(255,255,255,.1);
        }
        .modal-btn-cancel:hover { color:rgba(240,236,224,.6); border-color:rgba(255,255,255,.22); }

        /* ── WINNER ── */
        .winner-screen {
          position:fixed; inset:0; z-index:60;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:24px; text-align:center;
          background:rgba(8,9,15,.97);
          backdrop-filter:blur(28px);
          animation: winnerIn .5s cubic-bezier(.22,1,.36,1) both;
        }
        .winner-name {
          font-size:clamp(2.2rem,5.5vw,5rem);
          font-weight:900;
          background:linear-gradient(160deg,#f5e090 0%,#c9a227 50%,#8b6a10 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          line-height:1.1; margin-bottom:32px;
          filter:drop-shadow(0 0 24px rgba(201,162,39,.5));
        }
        .winner-cards { display:flex; gap:20px; margin-bottom:36px; }
        .winner-card {
          border-radius:16px; padding:18px 28px; text-align:center;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
        }

        /* ── DONE BANNER ── */
        .done-banner {
          position:fixed; bottom:0; left:0; right:0; z-index:40;
          padding:14px; text-align:center;
          background:rgba(8,9,15,.97);
          border-top:1px solid rgba(201,162,39,.2);
          backdrop-filter:blur(14px);
        }
        .action-btn {
          padding:11px 30px; border-radius:12px;
          font-family:'Cairo',sans-serif; font-weight:700; font-size:.95rem;
          background:linear-gradient(135deg,#c9a227,#8b6a10);
          color:#0e0d08; border:none; cursor:pointer;
          box-shadow:0 6px 28px rgba(201,162,39,.32);
          transition:all .2s;
        }
        .action-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }

        /* ── RESPONSIVE ── */
        @media (max-width:1100px) {
          .gb-board { grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:repeat(3,minmax(0,1fr)); }
          .gb-header { grid-template-columns:1fr !important; gap:8px; }
          .gb-header-left,.gb-header-right { justify-content:center; }
        }
        @media (max-width:700px) {
          .gb-board { grid-template-columns:1fr; grid-template-rows:none; padding:12px; gap:12px; }
          .card-body { grid-template-columns:60px minmax(0,1fr) 60px; }
          .pcap { font-size:.78rem; }
        }
      `}</style>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="gb-header">

        {/* Team 1 — right in RTL */}
        <div className="gb-header-left">
          <TeamPanel
            name={team1Name}
            score={teamScores.team1}
            isActive={currentTurn === 1}
            side="left"
            color="#e74c3c"
          />
        </div>

        {/* Center */}
        <div className="gb-header-center">
          <div className="gb-brand">حُجّة</div>
          <div data-testid="turn-indicator" className="turn-badge">
            <span className="t-dot" style={{ background: currentTurn===1 ? "#e74c3c" : "#27ae60" }} />
            دور {currentTurn===1 ? team1Name : team2Name}
          </div>
        </div>

        {/* Team 2 + End */}
        <div className="gb-header-right">
          <TeamPanel
            name={team2Name}
            score={teamScores.team2}
            isActive={currentTurn === 2}
            side="right"
            color="#27ae60"
          />
          <button data-testid="end-game-btn" className="end-btn" onClick={() => setShowEndConfirm(true)}>
            ✕ إنهاء
          </button>
        </div>
      </header>

      {/* ═══════════ BOARD ═══════════ */}
      <div className="gb-board">
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

      {/* ═══════════ ALL DONE ═══════════ */}
      {allUsed && !showWinner && (
        <div className="done-banner">
          <div style={{ fontWeight:900, fontSize:"1.05rem", color:"#c9a227", marginBottom:"10px" }}>
            {winner==="تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button className="action-btn" onClick={() => { fireConfetti(); setShowWinner(true); }}>
            عرض النتيجة النهائية
          </button>
        </div>
      )}

      {/* ═══════════ END CONFIRM ═══════════ */}
      {showEndConfirm && (
        <div className="modal-bg">
          <div className="modal-box">
            <div style={{ fontSize:"2.2rem", marginBottom:"10px" }}>⚔️</div>
            <div className="modal-title">إنهاء اللعبة؟</div>
            <div className="modal-sub">سيتم إعلان الفائز الحالي</div>
            <div className="modal-btns">
              <button className="modal-btn modal-btn-confirm" onClick={handleEndGame}>نعم، إنهاء</button>
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowEndConfirm(false)}>رجوع</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ WINNER ═══════════ */}
      {showWinner && (
        <div className="winner-screen">
          <div style={{ fontSize:"clamp(3.5rem,8vw,6.5rem)", marginBottom:"8px" }}>🏆</div>
          <div style={{ fontSize:".9rem", fontWeight:700, color:"rgba(240,236,224,.4)", marginBottom:"8px", letterSpacing:".06em" }}>
            الفائز
          </div>
          <div className="winner-name">
            {winner==="تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div className="winner-cards">
            {[
              { name:team1Name, score:teamScores.team1, color:"#e74c3c" },
              { name:team2Name, score:teamScores.team2, color:"#27ae60" },
            ].map(({name,score,color})=>(
              <div key={name} className="winner-card" style={{ borderColor:`${color}22` }}>
                <div style={{ fontWeight:700, fontSize:".78rem", color, marginBottom:"6px", letterSpacing:".04em" }}>{name}</div>
                <div style={{ fontWeight:900, fontSize:"2.2rem", color:"#f0ece0" }}>{score}</div>
              </div>
            ))}
          </div>
          <button className="action-btn" onClick={() => {
            if (gameMode==="tournament") {
              const ref = tournamentState?.currentMatchRef;
              if (ref) {
                const winnerId = teamScores.team1>=teamScores.team2 ? ref.team1Id : ref.team2Id;
                navigate("/tournament/bracket",{state:{autoRecord:{roundIdx:ref.roundIdx,matchIdx:ref.matchIdx,winnerId}}});
              } else navigate("/tournament/bracket");
            } else { resetGame(); navigate("/"); }
          }}>
            {gameMode==="tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
