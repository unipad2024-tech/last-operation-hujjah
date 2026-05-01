import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { X, ZoomIn, Pause, Play, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   CSS SPEC LAYOUT — Orange-panel · Roman BG · Big centered answer modal
   ═══════════════════════════════════════════════════════════════════════════ */

const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;700;800;900&display=swap";

export default function QuestionPage() {
  const navigate  = useNavigate();
  const { state } = useLocation();
  const { session, updateScore, gameSettings, switchTurn, teamScores } = useGame();
  const { question, catName, slot } = state || {};

  const isWordCat = question?.category_id === "cat_word" || question?.question_type === "secret_word";
  const diff = question?.difficulty || 300;
  let TIMER_DURATION = gameSettings?.default_timer || 65;
  if (isWordCat && gameSettings?.word_timers) {
    TIMER_DURATION = gameSettings.word_timers[String(diff)] ?? TIMER_DURATION;
  }

  const [timeLeft, setTimeLeft]       = useState(TIMER_DURATION);
  const [timerOn, setTimerOn]         = useState(true);
  const [showAnswer, setShowAnswer]   = useState(false);
  const [assigned, setAssigned]       = useState(false);
  const [scoredTeam, setScoredTeam]   = useState(null);
  const [tensionDone, setTensionDone] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [imgLoaded, setImgLoaded]     = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!timerOn || timeLeft <= 0) return;
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, timerOn]);

  useEffect(() => {
    if (timeLeft === 10 && !tensionDone && timerOn) { setTensionDone(true); playTension(); }
    if (timeLeft === 0 && timerOn) { setTimerOn(false); playBuzz(); toast.error("⏰ انتهى الوقت!", { duration: 3000 }); }
  }, [timeLeft, timerOn, tensionDone]);

  const playTension = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const s = (f, t, d) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0.22, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d + 0.01); };
      for (let i = 0; i < 10; i++) s(i % 2 === 0 ? 830 : 600, i * 0.85, 0.35);
    } catch {}
  };
  const playBuzz = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = "sawtooth"; o.frequency.value = 150; g.gain.setValueAtTime(0.4, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.8);
    } catch {}
  };
  const playCorrect = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const s = (f, t, d) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.28, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d + 0.01); };
      [523, 659, 784, 1047].forEach((f, i) => s(f, i * 0.12, 0.25));
    } catch {}
  };

  const handleReveal = () => { setTimerOn(false); setShowAnswer(true); };
  const handleAssign = async (team) => {
    if (assigned) return;
    const pts = question?.difficulty || 300;
    await updateScore(team, pts);
    setScoredTeam(team);
    setAssigned(true);
    playCorrect();
    window.dispatchEvent(new Event("scoreUpdated"));
    toast.success(`+${pts} ✓`, { duration: 2000 });
  };
  const handleSkip = () => { setScoredTeam("skip"); setAssigned(true); };
  const handleBack = () => { switchTurn(); navigate("/game"); };

  if (!question) { navigate("/game"); return null; }

  const pct   = (timeLeft / TIMER_DURATION) * 100;
  const R     = 38; const circ = 2 * Math.PI * R;
  const tCol  = timeLeft > 20 ? "#ffb347" : timeLeft > 10 ? "#f59e0b" : "#ef4444";
  const isTeam1  = slot === 1;
  const isSecret = question.question_type === "secret_word";
  const secretUrl = `${window.location.origin}/secret/${question.id}`;

  const diffBadge = {
    300: { label: "سهل",   color: "#6ee7b7", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.28)"  },
    600: { label: "متوسط", color: "#fcd34d", bg: "rgba(252,211,77,0.12)",  border: "rgba(252,211,77,0.28)"  },
    900: { label: "صعب",   color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)" },
  }[question.difficulty] || { label: "متوسط", color: "#fcd34d", bg: "rgba(252,211,77,0.12)", border: "rgba(252,211,77,0.28)" };

  const answerType = question.answer_image_url && question.answer ? "mixed"
    : question.answer_image_url ? "image" : "text";

  return (
    <div style={{
      minHeight: "100svh",
      background: `linear-gradient(180deg,rgba(8,6,12,0.70),rgba(8,6,12,0.80)),url("${ROMAN_BG}")`,
      backgroundSize: "cover", backgroundPosition: "center 30%", backgroundAttachment: "fixed",
      fontFamily: "'Cairo', 'Tajawal', sans-serif", color: "#f7f1e8", overflowX: "hidden",
    }}>
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        :root {
          --accent: #ff7a2f; --accent-2: #ffb347;
          --panel: rgba(255,255,255,0.07); --panel-2: rgba(255,255,255,0.10);
          --stroke: rgba(255,151,87,0.30); --stroke-2: rgba(255,201,130,0.20);
          --text: #f7f1e8; --muted: rgba(247,241,232,0.65);
          --shadow: 0 18px 50px rgba(0,0,0,0.40);
        }

        /* ── 3-col grid ── */
        .question-layout {
          display: grid;
          grid-template-columns: 220px minmax(0,1fr) 220px;
          gap: 14px;
          align-items: start;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 14px 16px 20px;
          box-sizing: border-box;
        }

        /* ── Top bar ── */
        .top-bar {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 18px;
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.11);
          box-shadow: var(--shadow);
        }

        /* ── Team pill ── */
        .team-pill {
          min-width: 150px;
          padding: 12px 16px;
          border-radius: 18px;
          background: var(--panel);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.3s;
        }
        .team-pill.t1-active, .team-pill.t2-active { background: rgba(255,255,255,0.11); border-color: rgba(255,255,255,0.28); box-shadow: 0 0 18px rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.06); }
        .team-pill .team-name { font-weight: 800; font-size: clamp(0.75rem,1.2vw,0.98rem); line-height: 1.15; display: flex; align-items: center; gap: 5px; }
        .team-pill .team-score { margin-top: 5px; font-size: clamp(1.5rem,2.8vw,2.2rem); font-weight: 900; color: var(--accent-2); line-height: 1; letter-spacing: -0.02em; }
        .team-pill .team-turn  { font-size: 0.62rem; font-weight: 700; opacity: 0.75; letter-spacing: 0.04em; margin-top: 2px; }

        /* ── Timer center ── */
        .timer-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .timer-wrap   { display: flex; align-items: center; gap: 10px; }
        .timer-controls { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; }
        .tcbtn {
          font-family: Cairo, sans-serif; font-weight: 700; font-size: 0.67rem;
          padding: 4px 10px; border-radius: 9px; cursor: pointer; border: 1px solid;
          display: flex; align-items: center; gap: 4px;
          transition: transform 0.13s;
        }
        .tcbtn:hover { transform: scale(1.07); } .tcbtn:active { transform: scale(0.92); }

        /* ── Sidebar ── */
        .sidebar { display: flex; flex-direction: column; gap: 11px; min-width: 0; }
        .helper-card {
          padding: 13px 14px; border-radius: 18px;
          background: var(--panel); border: 1px solid rgba(255,255,255,0.07);
          box-shadow: var(--shadow); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        }
        .helper-title { font-weight: 800; font-size: 0.68rem; color: var(--muted); letter-spacing: 0.10em; text-transform: uppercase; margin-bottom: 8px; }
        .hbtn { width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,180,80,0.14); background: rgba(255,255,255,0.05); color: var(--text); display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer; transition: background 0.2s, transform 0.13s; }
        .hbtn:hover { background: rgba(255,180,80,0.10); transform: scale(1.1); }

        /* ── Question panel ── */
        .question-panel {
          position: relative;
          min-height: 68vh;
          border-radius: 28px;
          padding: clamp(18px,2vw,28px);
          background: linear-gradient(180deg,rgba(255,126,52,0.10),rgba(255,255,255,0.06));
          border: 2px solid rgba(255,126,52,0.65);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .question-panel::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(circle at top right,rgba(255,184,116,0.10),transparent 34%),
                      radial-gradient(circle at bottom left,rgba(255,120,60,0.10),transparent 32%);
        }
        .question-inner {
          position: relative; z-index: 1;
          min-height: calc(68vh - 56px);
          display: flex; flex-direction: column; gap: 14px; align-items: stretch;
        }

        /* meta row */
        .question-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; }
        .points-badge {
          min-width: 86px; padding: 10px 14px; border-radius: 16px;
          background: linear-gradient(180deg,rgba(255,207,93,0.96),rgba(255,156,61,0.96));
          color: #1a1208; font-size: clamp(1.5rem,3vw,2.4rem); font-weight: 900; text-align: center; line-height: 1;
          box-shadow: 0 8px 24px rgba(0,0,0,0.26);
        }

        /* image */
        .question-image-wrap { display: block; width: 100%; flex-shrink: 0; }
        .question-image {
          width: min(100%,380px); aspect-ratio: 16/10; object-fit: cover; border-radius: 18px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,180,80,0.16);
          box-shadow: 0 14px 44px rgba(0,0,0,0.40); cursor: zoom-in; transition: transform 0.25s;
        }
        .question-image:hover { transform: scale(1.015); }

        /* text */
        .question-text {
          margin: 0 auto; max-width: 900px;
          font-size: clamp(1.4rem,2.8vw,3rem); line-height: 1.2; font-weight: 900;
          text-align: center; color: var(--text); text-shadow: 0 2px 18px rgba(0,0,0,0.50);
          flex: 1; display: flex; align-items: center; justify-content: center;
        }

        /* reveal btn */
        .reveal-btn {
          align-self: center; font-family: Cairo, sans-serif; font-weight: 900; border-radius: 999px;
          font-size: clamp(1rem,1.8vw,1.3rem); padding: clamp(12px,1.8vw,18px) clamp(36px,6vw,72px);
          background: linear-gradient(135deg,rgba(92,14,20,0.90),rgba(61,8,16,0.95));
          border: 2px solid rgba(241,225,148,0.55); color: #F1E194;
          letter-spacing: 0.04em; text-shadow: 0 0 16px rgba(241,225,148,0.40);
          cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
          animation: revealPulse 2.2s ease-in-out infinite; flex-shrink: 0;
        }
        .reveal-btn:hover { transform: scale(1.05); }
        .reveal-btn:active { transform: scale(0.94); }

        /* ── ANSWER MODAL — zooms toward viewer ── */
        .answer-overlay {
          position: fixed; inset: 0; z-index: 200;
          display: flex; align-items: center; justify-content: center;
          background: rgba(4,2,8,0.82);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          animation: overlayIn 0.28s ease both;
          padding: 16px;
        }
        .answer-modal {
          width: min(620px,94vw);
          background: rgba(255,255,255,0.08); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border: 1.5px solid rgba(255,126,52,0.45);
          border-radius: 26px;
          padding: clamp(26px,3.5vw,42px);
          box-shadow: 0 0 0 1px rgba(255,180,80,0.06) inset, 0 30px 80px rgba(0,0,0,0.70);
          display: flex; flex-direction: column; align-items: center; gap: 18px;
          animation: modalZoomIn 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
          text-align: center;
          position: relative; overflow: hidden;
        }
        .answer-modal::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at top,rgba(255,126,52,0.08),transparent 55%);
        }
        .answer-modal.correct { border-color: rgba(110,231,183,0.55); box-shadow: 0 0 48px rgba(52,211,153,0.20), 0 30px 80px rgba(0,0,0,0.70); }
        .answer-modal.wrong   { border-color: rgba(248,113,113,0.45); box-shadow: 0 0 40px rgba(248,113,113,0.16), 0 30px 80px rgba(0,0,0,0.70); }

        .ans-label { font-size: 0.72rem; font-weight: 700; color: rgba(241,225,148,0.40); letter-spacing: 0.16em; text-transform: uppercase; }
        .ans-img   { max-height: clamp(140px,22vh,260px); max-width: 100%; object-fit: contain; border-radius: 16px; border: 1.5px solid rgba(241,225,148,0.18); box-shadow: 0 8px 36px rgba(0,0,0,0.55); cursor: zoom-in; }
        .ans-text  {
          font-size: clamp(1.8rem,4.5vw,3.4rem); font-weight: 900;
          color: #f7f1e8; line-height: 1.15; text-align: center;
          animation: ansGlow 2.6s ease-in-out infinite;
        }
        .ans-text.correct { color: #a7f3d0; }
        .ans-text.wrong   { color: #fecaca; }

        /* assign buttons */
        .assign-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; width: 100%; }
        .assign-btn {
          font-family: Cairo, sans-serif; font-weight: 900; border-radius: 18px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-width: clamp(130px,16vw,200px);
          padding: clamp(10px,1.5vw,15px) clamp(14px,2.5vw,28px);
          cursor: pointer; border: 1.5px solid;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
        }
        .assign-btn:hover  { transform: scale(1.06) translateY(-3px); }
        .assign-btn:active { transform: scale(0.93); }
        .assign-btn.t1 { background: linear-gradient(155deg,rgba(220,38,38,0.92),rgba(153,27,27,0.97)); border-color: rgba(248,113,113,0.52); box-shadow: 0 6px 26px rgba(239,68,68,0.28); }
        .assign-btn.t2 { background: linear-gradient(155deg,rgba(29,78,216,0.92),rgba(30,58,138,0.97)); border-color: rgba(96,165,250,0.52); box-shadow: 0 6px 26px rgba(59,130,246,0.28); }
        .skip-btn {
          font-family: Cairo, sans-serif; font-weight: 600; font-size: 0.88rem;
          border-radius: 14px; padding: 10px 20px; cursor: pointer;
          background: transparent; border: 1.5px solid rgba(241,225,148,0.16);
          color: rgba(241,225,148,0.38); transition: opacity 0.2s;
        }
        .skip-btn:hover { opacity: 0.72; }

        .result-chip {
          padding: 10px 24px; border-radius: 50px; font-weight: 800; font-size: 1rem;
          animation: chipIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .result-chip.correct { background: rgba(52,211,153,0.14); border: 1.5px solid rgba(52,211,153,0.40); color: #a7f3d0; box-shadow: 0 0 18px rgba(52,211,153,0.18); }
        .result-chip.wrong   { background: rgba(248,113,113,0.10); border: 1.5px solid rgba(248,113,113,0.30); color: #fecaca; }

        .next-btn {
          font-family: Cairo, sans-serif; font-weight: 900;
          font-size: clamp(1rem,1.6vw,1.2rem);
          padding: clamp(10px,1.4vw,14px) clamp(28px,4.5vw,52px);
          border-radius: 999px;
          background: linear-gradient(135deg,#c09820,#f0d045);
          color: #1a0a0b; border: none; cursor: pointer;
          box-shadow: 0 0 28px rgba(192,152,32,0.38);
          transition: transform 0.2s;
        }
        .next-btn:hover { transform: scale(1.05); } .next-btn:active { transform: scale(0.94); }

        .back-btn {
          font-family: Cairo, sans-serif; font-weight: 700; font-size: 0.72rem;
          padding: 5px 12px; border-radius: 9px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,180,80,0.14);
          color: rgba(255,225,140,0.52); cursor: pointer; display: flex; align-items: center; gap: 5px;
          transition: background 0.2s; white-space: nowrap;
        }
        .back-btn:hover { background: rgba(255,180,80,0.08); }

        /* ── Keyframes ── */
        @keyframes revealPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(241,225,148,0), 0 0 20px rgba(241,225,148,0.10); }
          50%      { box-shadow: 0 0 0 7px rgba(241,225,148,0.10), 0 0 36px rgba(241,225,148,0.22); }
        }
        @keyframes overlayIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalZoomIn {
          from { opacity:0; transform:scale(0.78) translateY(20px); }
          to   { opacity:1; transform:scale(1)    translateY(0); }
        }
        @keyframes ansGlow {
          0%,100% { text-shadow:0 0 24px rgba(241,225,148,0.40),0 0 70px rgba(241,225,148,0.14); }
          50%      { text-shadow:0 0 50px rgba(241,225,148,0.75),0 0 120px rgba(241,225,148,0.28); }
        }
        @keyframes chipIn {
          from { opacity:0; transform:scale(0.82); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes goldShimmer { 0% { background-position:200% center } 100% { background-position:-200% center } }

        /* ── Responsive ── */
        @media (max-width:1100px) { .question-layout { grid-template-columns:180px minmax(0,1fr) 180px; } }
        @media (max-width:820px)  {
          .question-layout { grid-template-columns:1fr; padding:10px 12px 16px; }
          .sidebar { order:3; } .sidebar.left-side { order:2; }
          .question-panel { min-height:auto; }
        }
      `}</style>

      {/* ════ ZOOM MODAL ════ */}
      {zoomedImage && (
        <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.94)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setZoomedImage(null)}>
          <div style={{ position:"relative", maxWidth:"min(92vw,1100px)", padding:"0 16px" }} onClick={e => e.stopPropagation()}>
            <button style={{ position:"absolute", top:"-34px", right:"16px", color:"rgba(255,255,255,0.55)", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", fontSize:"0.85rem", fontFamily:"Cairo,sans-serif" }} onClick={() => setZoomedImage(null)}><X size={18}/> إغلاق</button>
            <img src={zoomedImage} alt="zoomed" style={{ maxWidth:"100%", maxHeight:"86vh", objectFit:"contain", borderRadius:"16px", display:"block", margin:"0 auto" }} />
          </div>
        </div>
      )}

      {/* ════ ANSWER MODAL — zooms in toward viewer ════ */}
      {showAnswer && (
        <div className="answer-overlay">
          <div className={`answer-modal${assigned ? (scoredTeam !== "skip" ? " correct" : " wrong") : ""}`} style={{ position:"relative", zIndex:1 }}>

            {/* diff + cat */}
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", justifyContent:"center" }}>
              <span style={{ background:diffBadge.bg, border:`1px solid ${diffBadge.border}`, color:diffBadge.color, fontSize:"0.78rem", fontWeight:700, padding:"4px 14px", borderRadius:"50px" }}>{diffBadge.label}</span>
              <span style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)", color:"rgba(247,241,232,0.65)", fontSize:"0.78rem", padding:"4px 14px", borderRadius:"50px" }}>{catName}</span>
            </div>

            <div className="ans-label">◆ الإجابة ◆</div>

            {/* Answer image */}
            {(answerType === "image" || answerType === "mixed") && question.answer_image_url && (
              <img src={question.answer_image_url} alt="answer" data-testid="answer-image" className="ans-img" onClick={() => setZoomedImage(question.answer_image_url)} onError={e => { e.target.style.display="none"; }} />
            )}

            {/* Answer text — centered, no tilt */}
            {(answerType === "text" || answerType === "mixed") && question.answer && (
              <div data-testid="answer-text" className={`ans-text${assigned ? (scoredTeam !== "skip" ? " correct" : " wrong") : ""}`}>
                {question.answer}
              </div>
            )}

            {/* Gold points shimmer */}
            {!assigned && (
              <div style={{ background:"linear-gradient(135deg,#92400e,#d97706,#fbbf24,#d97706,#92400e)", backgroundSize:"200% auto", animation:"goldShimmer 3s linear infinite", color:"#000", fontWeight:800, fontSize:"0.92rem", padding:"7px 22px", borderRadius:"50px", letterSpacing:"0.04em" }}>
                {question.difficulty} نقطة
              </div>
            )}

            {/* Assign */}
            {!assigned && (
              <>
                <div style={{ color:"rgba(241,225,148,0.35)", fontSize:"0.78rem", fontWeight:700, letterSpacing:"0.1em" }}>من أجاب صح؟</div>
                <div className="assign-row">
                  <button data-testid="assign-team1-btn" className="assign-btn t1" onClick={() => handleAssign(1)}>
                    <span style={{ color:"rgba(255,255,255,0.88)", fontWeight:800, fontSize:"clamp(0.82rem,1.4vw,1rem)" }}>🔴 {session?.team1_name}</span>
                    <span style={{ color:"#fecaca", fontWeight:900, fontSize:"clamp(1.3rem,2.5vw,2rem)", lineHeight:1 }}>+{question.difficulty}</span>
                  </button>
                  <button data-testid="assign-team2-btn" className="assign-btn t2" onClick={() => handleAssign(2)}>
                    <span style={{ color:"rgba(255,255,255,0.88)", fontWeight:800, fontSize:"clamp(0.82rem,1.4vw,1rem)" }}>🔵 {session?.team2_name}</span>
                    <span style={{ color:"#bfdbfe", fontWeight:900, fontSize:"clamp(1.3rem,2.5vw,2rem)", lineHeight:1 }}>+{question.difficulty}</span>
                  </button>
                  <button data-testid="skip-points-btn" className="skip-btn" onClick={handleSkip}>لا أحد</button>
                </div>
              </>
            )}

            {/* Post-assign */}
            {assigned && (
              <>
                <div className={`result-chip${scoredTeam !== "skip" ? " correct" : " wrong"}`}>
                  {scoredTeam !== "skip" ? `✓ +${question.difficulty} → ${scoredTeam === 1 ? session?.team1_name : session?.team2_name}` : "لا نقاط — سؤال مفتوح"}
                </div>
                <button data-testid="continue-btn" className="next-btn" onClick={handleBack}>العودة للوحة ←</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════ 3-COL GRID ════ */}
      <div className="question-layout">

        {/* ══ TOP BAR ══ */}
        <div className="top-bar">
          {/* Team 1 */}
          <div className={`team-pill${isTeam1 ? " t1-active" : ""}`}>
            <div className="team-name" style={{ color:"rgba(247,241,232,0.88)" }}>
              <span style={{ width:"9px", height:"9px", borderRadius:"50%", background:"#ef4444", flexShrink:0, boxShadow: isTeam1?"0 0 8px #ef4444":"none" }} />
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"110px" }}>{session?.team1_name || "الفريق الأول"}</span>
            </div>
            <div className="team-score">{teamScores.team1}</div>
            {isTeam1 && <div className="team-turn" style={{ color:"rgba(247,241,232,0.60)" }}>دوره الآن</div>}
          </div>

          {/* Timer center */}
          <div className="timer-center">
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <button className="back-btn" onClick={handleBack}>← اللوحة</button>
              <span style={{ color:"rgba(212,168,32,0.72)", fontWeight:800, fontSize:"clamp(0.7rem,1.2vw,0.92rem)" }}>{catName || "حُجّة"}</span>
            </div>
            <div className="timer-wrap">
              <div style={{ width:"clamp(86px,10vw,112px)", height:"clamp(86px,10vw,112px)", flexShrink:0 }}>
                <svg width="100%" height="100%" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r={R} fill="rgba(0,0,0,0.50)" stroke="rgba(255,180,80,0.10)" strokeWidth="8" />
                  <circle cx="45" cy="45" r={R} fill="none" stroke={tCol} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                    transform="rotate(-90 45 45)" style={{ transition:"stroke-dashoffset 1s linear, stroke 0.5s" }} />
                  <text x="45" y="45" textAnchor="middle" dominantBaseline="central" fill={tCol} fontSize="22" fontWeight="900" fontFamily="Cairo,sans-serif">{timeLeft}</text>
                </svg>
              </div>
              <div className="timer-controls">
                <button data-testid="timer-pause-resume-btn" className="tcbtn" onClick={() => setTimerOn(t => !t)}
                  style={{ background:timerOn?"rgba(251,191,36,0.12)":"rgba(34,197,94,0.12)", borderColor:timerOn?"rgba(251,191,36,0.38)":"rgba(34,197,94,0.38)", color:timerOn?"#fbbf24":"#4ade80" }}>
                  {timerOn ? <Pause size={11}/> : <Play size={11}/>} {timerOn ? "إيقاف" : "تشغيل"}
                </button>
                <button data-testid="timer-reset-btn" className="tcbtn" onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(false); setTensionDone(false); }}
                  style={{ background:"rgba(255,255,255,0.05)", borderColor:"rgba(255,255,255,0.14)", color:"rgba(209,213,219,0.65)" }}>
                  <RotateCcw size={11}/>
                </button>
                <button data-testid="timer-start-btn" className="tcbtn" onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(true); setTensionDone(false); }}
                  style={{ background:"rgba(34,197,94,0.10)", borderColor:"rgba(34,197,94,0.28)", color:"rgba(74,222,128,0.85)" }}>
                  <Play size={11}/>ابدأ
                </button>
              </div>
            </div>
          </div>

          {/* Team 2 */}
          <div className={`team-pill${!isTeam1 ? " t2-active" : ""}`} style={{ textAlign:"right" }}>
            <div className="team-name" style={{ color:"rgba(247,241,232,0.88)", justifyContent:"flex-end" }}>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"110px" }}>{session?.team2_name || "الفريق الثاني"}</span>
              <span style={{ width:"9px", height:"9px", borderRadius:"50%", background:"#3b82f6", flexShrink:0, boxShadow:!isTeam1?"0 0 8px #3b82f6":"none" }} />
            </div>
            <div className="team-score" style={{ textAlign:"right" }}>{teamScores.team2}</div>
            {!isTeam1 && <div className="team-turn" style={{ color:"rgba(247,241,232,0.60)", textAlign:"right" }}>دوره الآن</div>}
          </div>
        </div>

        {/* ══ LEFT SIDEBAR ══ */}
        <div className="sidebar left-side">
          <div className="helper-card" style={{ background:isTeam1?"rgba(239,68,68,0.11)":"rgba(59,130,246,0.11)", borderColor:isTeam1?"rgba(239,68,68,0.30)":"rgba(59,130,246,0.30)" }}>
            <div className="helper-title">يجيب الآن</div>
            <div style={{ fontWeight:900, fontSize:"clamp(0.85rem,1.4vw,1.1rem)", color:isTeam1?"#fca5a5":"#93c5fd", display:"flex", alignItems:"center", gap:"6px" }}>
              <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:isTeam1?"#ef4444":"#3b82f6", animation:"revealPulse 1.5s ease-in-out infinite" }} />
              {isTeam1 ? (session?.team1_name||"الفريق الأول") : (session?.team2_name||"الفريق الثاني")}
            </div>
          </div>
          <div className="helper-card">
            <div className="helper-title">التصنيف</div>
            <div style={{ fontWeight:700, fontSize:"0.9rem", color:"rgba(212,168,32,0.90)", marginBottom:"8px" }}>{catName || "—"}</div>
            <span style={{ background:diffBadge.bg, border:`1px solid ${diffBadge.border}`, color:diffBadge.color, fontSize:"0.78rem", fontWeight:700, padding:"4px 14px", borderRadius:"50px" }}>{diffBadge.label}</span>
          </div>
          <div className="helper-card" style={{ textAlign:"center" }}>
            <div className="helper-title">النقاط</div>
            <div style={{ background:"linear-gradient(175deg,rgba(255,207,93,0.96),rgba(255,156,61,0.96))", color:"#1a1208", fontSize:"clamp(1.8rem,3.2vw,2.8rem)", fontWeight:900, borderRadius:"14px", padding:"8px 16px", lineHeight:1, boxShadow:"0 6px 20px rgba(0,0,0,0.24)" }}>{question.difficulty}</div>
          </div>
        </div>

        {/* ══ QUESTION CENTER ══ */}
        <div className="question-center">
          <div className="question-panel">
            <div className="question-inner">

              {isSecret ? (
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"18px" }}>
                  <div style={{ fontWeight:900, fontSize:"clamp(1.2rem,2.5vw,1.8rem)", textAlign:"center" }}>وصّف الكلمة السرية</div>
                  <div style={{ color:"rgba(247,241,232,0.42)", fontSize:"0.88rem", textAlign:"center" }}>الملاعب يمسح الـ QR — بس هو يشوف الكلمة!</div>
                  <div style={{ background:"#fff", padding:"16px", borderRadius:"18px", boxShadow:"0 0 40px rgba(241,225,148,0.22)" }}>
                    <QRCodeSVG value={secretUrl} size={Math.min(window.innerWidth - 120, 200)} data-testid="qr-code" />
                  </div>
                  <p style={{ color:"rgba(247,241,232,0.18)", fontSize:"0.65rem", fontFamily:"monospace", wordBreak:"break-all", maxWidth:"280px", textAlign:"center" }}>{secretUrl}</p>
                </div>
              ) : (
                <>
                  {/* Question meta row */}
                  <div className="question-meta">
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"7px 14px", borderRadius:"12px", background:isTeam1?"rgba(239,68,68,0.12)":"rgba(59,130,246,0.12)", border:`1px solid ${isTeam1?"rgba(239,68,68,0.28)":"rgba(59,130,246,0.28)"}` }}>
                      <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:isTeam1?"#ef4444":"#3b82f6", animation:"revealPulse 1.2s ease-in-out infinite" }} />
                      <span style={{ color:isTeam1?"#fca5a5":"#93c5fd", fontWeight:800, fontSize:"clamp(0.72rem,1.1vw,0.88rem)" }}>
                        {isTeam1 ? (session?.team1_name||"الفريق الأول") : (session?.team2_name||"الفريق الثاني")}
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <span style={{ background:diffBadge.bg, border:`1px solid ${diffBadge.border}`, color:diffBadge.color, fontSize:"0.72rem", fontWeight:700, padding:"3px 12px", borderRadius:"50px" }}>{diffBadge.label}</span>
                    </div>
                  </div>

                  {/* Question image */}
                  {question.image_url && (
                    <div className="question-image-wrap" data-testid="question-image-container">
                      {!imgLoaded && (
                        <div style={{ width:"min(100%,380px)", aspectRatio:"16/10", borderRadius:"18px", background:"rgba(255,255,255,0.04)", border:"1.5px dashed rgba(255,180,80,0.14)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ color:"rgba(247,241,232,0.22)", fontSize:"0.85rem" }}>تحميل الصورة...</span>
                        </div>
                      )}
                      <div style={{ position:"relative", display:imgLoaded?"block":"none", width:"min(100%, 380px)", marginLeft:"auto", marginRight:"auto" }}>
                        <img src={question.image_url} alt="question" data-testid="question-image" className="question-image"
                          onLoad={() => setImgLoaded(true)} onError={e => { e.target.style.display="none"; setImgLoaded(true); }}
                          onClick={() => setZoomedImage(question.image_url)} />
                        <div style={{ position:"absolute", inset:0, borderRadius:"18px", opacity:0, background:"rgba(0,0,0,0.30)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-in", transition:"opacity 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.opacity="1"} onMouseLeave={e => e.currentTarget.style.opacity="0"}
                          onClick={() => setZoomedImage(question.image_url)}>
                          <ZoomIn size={28} style={{ color:"#fff" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question text — centered */}
                  <p data-testid="question-text" className="question-text"
                    style={{ fontSize: question.image_url ? "clamp(1.2rem,2.3vw,2.3rem)" : "clamp(1.5rem,2.8vw,3rem)" }}>
                    {question.text}
                  </p>

                  {/* Reveal button */}
                  {!showAnswer && (
                    <button data-testid="reveal-answer-btn" className="reveal-btn" onClick={handleReveal}>
                      ◆ كشف الإجابة ◆
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══ RIGHT SIDEBAR ══ */}
        <div className="sidebar">
          <div className="helper-card">
            <div className="helper-title">وسائل المساعدة</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"7px" }}>
              {[["⏱️","مزيد وقت"],["🔄","تغيير السؤال"],["🎯","مساعدة الجمهور"]].map(([icon, label], i) => (
                <button key={i} className="hbtn" title={label}>{icon}</button>
              ))}
            </div>
          </div>

          {/* Team 1 score */}
          <div className="helper-card" style={{ background:isTeam1?"rgba(239,68,68,0.09)":"rgba(12,6,18,0.70)", borderColor:isTeam1?"rgba(239,68,68,0.28)":"rgba(255,180,80,0.07)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"6px" }}>
              <span>🔴</span>
              <span style={{ fontWeight:800, fontSize:"0.82rem", color:"#fca5a5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session?.team1_name||"الفريق الأول"}</span>
            </div>
            <div style={{ fontWeight:900, fontSize:"clamp(1.4rem,2.2vw,1.9rem)", color:"rgba(255,179,71,0.95)", lineHeight:1 }}>{teamScores.team1}</div>
            <div style={{ fontSize:"0.6rem", color:"rgba(212,168,32,0.40)", fontWeight:700, marginTop:"2px" }}>نقطة</div>
          </div>

          {/* Team 2 score */}
          <div className="helper-card" style={{ background:!isTeam1?"rgba(59,130,246,0.09)":"rgba(12,6,18,0.70)", borderColor:!isTeam1?"rgba(59,130,246,0.28)":"rgba(255,180,80,0.07)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"6px" }}>
              <span>🔵</span>
              <span style={{ fontWeight:800, fontSize:"0.82rem", color:"#93c5fd", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session?.team2_name||"الفريق الثاني"}</span>
            </div>
            <div style={{ fontWeight:900, fontSize:"clamp(1.4rem,2.2vw,1.9rem)", color:"rgba(255,179,71,0.95)", lineHeight:1 }}>{teamScores.team2}</div>
            <div style={{ fontSize:"0.6rem", color:"rgba(212,168,32,0.40)", fontWeight:700, marginTop:"2px" }}>نقطة</div>
          </div>

          {/* Quick continue */}
          {assigned && (
            <button className="next-btn" onClick={handleBack} style={{ width:"100%", fontSize:"0.9rem", padding:"10px 16px" }}>العودة ←</button>
          )}
        </div>

      </div>
    </div>
  );
}
