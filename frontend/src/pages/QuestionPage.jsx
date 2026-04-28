import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { X, ZoomIn, Pause, Play, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   HUJJAH ROMAN EDITION — QuestionPage
   Navy glass UI · Tajawal font · Full answer modal · All logic preserved
   ═══════════════════════════════════════════════════════════════════════════ */

export default function QuestionPage() {
  const navigate  = useNavigate();
  const { state } = useLocation();
  const { session, updateScore, gameSettings, switchTurn, teamScores } = useGame();
  const { question, catName, slot } = state || {};

  const isWordCat = question?.category_id === "cat_word" || question?.question_type === "secret_word";
  const diff      = question?.difficulty || 300;
  let TIMER_DURATION = gameSettings?.default_timer || 65;
  if (isWordCat && gameSettings?.word_timers) {
    TIMER_DURATION = gameSettings.word_timers[String(diff)] ?? TIMER_DURATION;
  }

  const [timeLeft, setTimeLeft]         = useState(TIMER_DURATION);
  const [timerOn, setTimerOn]           = useState(true);
  const [showAnswer, setShowAnswer]     = useState(false);
  const [assigned, setAssigned]         = useState(false);
  const [scoredTeam, setScoredTeam]     = useState(null); // 1 | 2 | "skip"
  const [tensionDone, setTensionDone]   = useState(false);
  const [zoomedImage, setZoomedImage]   = useState(null);
  const [imgLoaded, setImgLoaded]       = useState(false);
  const timerRef = useRef(null);

  /* ── Timer ── */
  useEffect(() => {
    if (!timerOn || timeLeft <= 0) return;
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, timerOn]);

  useEffect(() => {
    if (timeLeft === 10 && !tensionDone && timerOn) { setTensionDone(true); playTension(); }
    if (timeLeft === 0 && timerOn) {
      setTimerOn(false);
      playBuzz();
      toast.error("⏰ انتهى الوقت!", { duration: 3000 });
    }
  }, [timeLeft, timerOn, tensionDone]);

  /* ── Audio ── */
  const playTension = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const schedule = (freq, t, dur) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "triangle"; osc.frequency.value = freq;
        g.gain.setValueAtTime(0.22, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + dur + 0.01);
      };
      for (let i = 0; i < 10; i++) schedule(i % 2 === 0 ? 830 : 600, i * 0.85, 0.35);
    } catch {}
  };
  const playBuzz = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "sawtooth"; osc.frequency.value = 150;
      g.gain.setValueAtTime(0.4, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };
  const playCorrect = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const s = (freq, t, dur) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        g.gain.setValueAtTime(0.28, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + dur + 0.01);
      };
      [523, 659, 784, 1047].forEach((f, i) => s(f, i * 0.12, 0.25));
    } catch {}
  };

  /* ── Actions ── */
  const handleReveal  = () => { setTimerOn(false); setShowAnswer(true); };
  const handleAssign  = async (team) => {
    if (assigned) return;
    const pts = question?.difficulty || 300;
    await updateScore(team, pts);
    setScoredTeam(team);
    setAssigned(true);
    playCorrect();
    window.dispatchEvent(new Event("scoreUpdated"));
    toast.success(`+${pts} ✓`, { duration: 2000 });
  };
  const handleSkip    = () => { setScoredTeam("skip"); setAssigned(true); };
  const handleBack    = () => { switchTurn(); navigate("/game"); };

  if (!question) { navigate("/game"); return null; }

  /* ── Derived ── */
  const pct       = (timeLeft / TIMER_DURATION) * 100;
  const r         = 28;
  const circ      = 2 * Math.PI * r;
  const timerStroke = timeLeft > 20 ? "#43e97b" : timeLeft > 10 ? "#f5c842" : "#ff6b6b";
  const isTeam1   = slot === 1;
  const isSecret  = question.question_type === "secret_word";
  const secretUrl = `${window.location.origin}/secret/${question.id}`;

  const answerType = (question.answer_image_url && question.answer)
    ? "mixed" : question.answer_image_url ? "image" : "text";

  const diffMeta = {
    300: { label: "سهل",   color: "#43e97b", bg: "rgba(67,233,123,0.12)",  border: "rgba(67,233,123,0.28)"  },
    600: { label: "متوسط", color: "#f5c842", bg: "rgba(245,200,66,0.12)",  border: "rgba(245,200,66,0.28)"  },
    900: { label: "صعب",   color: "#ff6b6b", bg: "rgba(255,107,107,0.12)", border: "rgba(255,107,107,0.28)" },
  }[question.difficulty] || { label: "متوسط", color: "#f5c842", bg: "rgba(245,200,66,0.12)", border: "rgba(245,200,66,0.28)" };

  const modalClass = assigned
    ? (scoredTeam !== "skip" ? "answer-modal correct" : "answer-modal wrong")
    : "answer-modal";

  return (
    <div
      className="question-page-root"
      style={{
        minHeight: "100svh",
        background: "linear-gradient(135deg,#0f0c29 0%,#302b63 55%,#24243e 100%)",
        fontFamily: "'Tajawal', 'Cairo', sans-serif",
        color: "#fff",
        overflow: "auto",
      }}
    >
      {/* ── Google Font Tajawal ── */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
      />

      <style>{`
        /* ── Variables ── */
        :root {
          --gold:  #f5c842;
          --coral: #ff6b6b;
          --mint:  #43e97b;
          --glass-bg:     rgba(255,255,255,0.07);
          --glass-border: rgba(255,255,255,0.12);
          --glass-blur:   blur(16px);
          --radius: 16px;
          --shadow: 0 8px 32px rgba(0,0,0,0.40);
        }

        /* ── Question layout grid ── */
        .q-grid {
          display: grid;
          grid-template-columns: 220px minmax(0,1fr) 220px;
          gap: 14px;
          max-width: 1500px;
          margin: 0 auto;
          padding: 14px 16px 20px;
          box-sizing: border-box;
        }
        .q-topbar {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 18px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          box-shadow: var(--shadow);
        }

        /* ── Player panel ── */
        .player-panel {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-radius: var(--radius);
          border-right: 4px solid var(--gold);
          padding: 14px 16px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .player-panel.team1-active {
          border-right-color: var(--coral);
          background: rgba(255,107,107,0.08);
          box-shadow: 0 0 22px rgba(255,107,107,0.20);
        }
        .player-panel.team2-active {
          border-right-color: var(--mint);
          background: rgba(67,233,123,0.08);
          box-shadow: 0 0 22px rgba(67,233,123,0.20);
        }
        .player-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: rgba(255,255,255,0.78);
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .player-score {
          font-size: 2rem;
          font-weight: 800;
          color: var(--gold);
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .player-turn-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          opacity: 0.8;
        }

        /* ── Timer in topbar ── */
        .timer-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .timer-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .timer-circle {
          position: relative;
          width: 66px;
          height: 66px;
          flex-shrink: 0;
        }
        .timer-number {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 800;
        }
        .timer-controls {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .timer-btn {
          font-family: 'Tajawal', sans-serif;
          font-weight: 700;
          font-size: 0.68rem;
          padding: 4px 10px;
          border-radius: 9px;
          cursor: pointer;
          border: 1px solid;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: transform 0.15s;
          backdrop-filter: blur(8px);
        }
        .timer-btn:hover { transform: scale(1.07); }
        .timer-btn:active { transform: scale(0.92); }

        /* ── Back + cat labels ── */
        .topbar-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .back-btn {
          font-family: 'Tajawal', sans-serif;
          font-weight: 700;
          font-size: 0.72rem;
          padding: 5px 12px;
          border-radius: 9px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.2s;
        }
        .back-btn:hover { background: rgba(255,255,255,0.12); }

        /* ── Sidebar ── */
        .q-sidebar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .glass-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 14px;
        }
        .card-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: rgba(255,255,255,0.42);
          letter-spacing: 0.10em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }
        .points-badge {
          background: linear-gradient(135deg,var(--gold),#ff8c42);
          color: #1a1208;
          font-weight: 800;
          font-size: clamp(1.5rem,3vw,2.4rem);
          border-radius: 50px;
          padding: 5px 18px;
          display: inline-block;
          box-shadow: 0 4px 18px rgba(245,200,66,0.40);
          line-height: 1;
        }
        .category-badge {
          display: inline-block;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: rgba(255,255,255,0.7);
          font-size: 0.82rem;
          border-radius: 50px;
          padding: 4px 14px;
          backdrop-filter: blur(8px);
        }
        .diff-badge {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 4px 14px;
          border-radius: 50px;
        }
        .helper-btns {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .helper-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1px solid var(--glass-border);
          background: var(--glass-bg);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem;
          transition: background 0.2s, transform 0.15s;
        }
        .helper-btn:hover { background: rgba(255,255,255,0.14); transform: scale(1.1); }

        /* ── Question card (center) ── */
        .question-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-radius: 24px;
          padding: clamp(22px,2.5vw,34px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
          min-height: 62vh;
          box-shadow: 0 12px 50px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.04) inset;
          position: relative;
          overflow: hidden;
        }
        .question-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at top,   rgba(245,200,66,0.07), transparent 50%),
            radial-gradient(ellipse at bottom, rgba(67,233,123,0.05), transparent 50%);
          pointer-events: none;
        }

        /* ── Question image: CENTERED ── */
        .question-image {
          display: block;
          margin: 0 auto;
          width: auto;
          max-width: 100%;
          height: 265px;
          object-fit: contain;
          border-radius: 16px;
          box-shadow: 0 0 0 2.5px rgba(245,200,66,0.30), 0 12px 44px rgba(0,0,0,0.55);
          cursor: zoom-in;
          transition: transform 0.25s ease;
        }
        .question-image:hover { transform: scale(1.015); }

        /* ── Question text ── */
        .question-text {
          font-size: clamp(1.5rem,2.8vw,2.8rem);
          font-weight: 700;
          color: #fff;
          text-align: center;
          line-height: 1.55;
          text-shadow: 0 2px 14px rgba(0,0,0,0.35);
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Reveal button ── */
        .reveal-btn {
          background: linear-gradient(135deg,#f5c842,#ff8c42);
          border: none;
          border-radius: 50px;
          padding: clamp(12px,1.6vw,16px) clamp(32px,5vw,56px);
          font-size: clamp(1rem,1.7vw,1.2rem);
          font-weight: 700;
          color: #1a1a2e;
          cursor: pointer;
          font-family: 'Tajawal', sans-serif;
          box-shadow: 0 6px 24px rgba(245,200,66,0.38);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          animation: btnPulse 2.2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .reveal-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(245,200,66,0.52);
        }
        .reveal-btn:active { transform: scale(0.95); }

        /* ── Answer modal overlay ── */
        .answer-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          animation: fadeIn 0.25s ease both;
          padding: 16px;
        }
        .answer-modal {
          background: linear-gradient(160deg,rgba(30,27,75,0.97),rgba(12,10,36,0.99));
          border: 1.5px solid var(--glass-border);
          border-radius: 24px;
          padding: clamp(28px,4vw,44px);
          width: min(580px,92vw);
          text-align: center;
          box-shadow: 0 30px 80px rgba(0,0,0,0.65);
          animation: scaleIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        .answer-modal.correct {
          border-color: var(--mint);
          box-shadow: 0 0 48px rgba(67,233,123,0.28), 0 30px 80px rgba(0,0,0,0.65);
        }
        .answer-modal.wrong {
          border-color: var(--coral);
          box-shadow: 0 0 48px rgba(255,107,107,0.28), 0 30px 80px rgba(0,0,0,0.65);
        }
        .answer-modal-image {
          display: block;
          margin: 0 auto;
          height: 190px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          border-radius: 14px;
          box-shadow: 0 8px 36px rgba(0,0,0,0.55);
        }
        .answer-modal-label {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.42);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .answer-modal-text {
          font-size: clamp(1.5rem,4vw,2.4rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.35;
          animation: answerGlow 2.5s ease-in-out infinite;
        }
        .answer-modal-text.correct { color: #a7f3d0; }
        .answer-modal-text.wrong   { color: #fecaca; }

        /* Score assignment buttons */
        .assign-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          width: 100%;
        }
        .assign-btn {
          font-family: 'Tajawal', sans-serif;
          font-weight: 800;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: clamp(120px,15vw,180px);
          padding: clamp(10px,1.5vw,14px) clamp(14px,2.5vw,24px);
          cursor: pointer;
          border: 1.5px solid;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
        }
        .assign-btn:hover { transform: scale(1.06) translateY(-3px); }
        .assign-btn:active { transform: scale(0.94); }
        .assign-btn.t1 {
          background: linear-gradient(155deg,rgba(220,38,38,0.90),rgba(153,27,27,0.96));
          border-color: rgba(248,113,113,0.55);
          box-shadow: 0 6px 26px rgba(239,68,68,0.30);
        }
        .assign-btn.t2 {
          background: linear-gradient(155deg,rgba(29,78,216,0.90),rgba(30,58,138,0.96));
          border-color: rgba(96,165,250,0.55);
          box-shadow: 0 6px 26px rgba(59,130,246,0.30);
        }
        .skip-btn {
          font-family: 'Tajawal', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          border-radius: 14px;
          padding: 10px 18px;
          cursor: pointer;
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.42);
          transition: opacity 0.2s;
        }
        .skip-btn:hover { opacity: 0.75; }

        /* Post-assign result display */
        .result-chip {
          padding: 10px 24px;
          border-radius: 50px;
          font-weight: 800;
          font-size: 1.05rem;
          animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .result-chip.correct {
          background: rgba(67,233,123,0.15);
          border: 1.5px solid rgba(67,233,123,0.45);
          color: #a7f3d0;
          box-shadow: 0 0 20px rgba(67,233,123,0.20);
        }
        .result-chip.wrong {
          background: rgba(255,107,107,0.12);
          border: 1.5px solid rgba(255,107,107,0.35);
          color: #fecaca;
        }

        .next-btn {
          font-family: 'Tajawal', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: #fff;
          border-radius: 50px;
          padding: 12px 36px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: background 0.22s, transform 0.18s;
        }
        .next-btn:hover { background: rgba(255,255,255,0.14); transform: translateY(-1px); }

        /* ── Keyframes ── */
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn {
          from { opacity:0; transform:scale(0.85); }
          to   { opacity:1; transform:scale(1);    }
        }
        @keyframes answerGlow {
          0%,100% { text-shadow: 0 0 24px rgba(255,255,255,0.30); }
          50%      { text-shadow: 0 0 48px rgba(255,255,255,0.60); }
        }
        @keyframes btnPulse {
          0%,100% { box-shadow: 0 6px 24px rgba(245,200,66,0.38); }
          50%      { box-shadow: 0 6px 36px rgba(245,200,66,0.65); }
        }
        @keyframes imgSkeleton {
          0%,100% { opacity:0.5; }
          50%      { opacity:1; }
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .q-grid { grid-template-columns: 180px minmax(0,1fr) 180px; }
        }
        @media (max-width: 820px) {
          .q-grid { grid-template-columns: 1fr; padding: 10px 12px 16px; }
          .q-sidebar { order: 3; }
          .q-sidebar.left-side { order: 2; }
          .question-card { min-height: auto; }
          .question-image { height: 200px; }
        }
      `}</style>

      {/* ════════════ ZOOM MODAL ════════════ */}
      {zoomedImage && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.95)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setZoomedImage(null)}
        >
          <div style={{ position: "relative", maxWidth: "min(90vw,1100px)", padding: "0 16px" }} onClick={e => e.stopPropagation()}>
            <button
              style={{
                position: "absolute", top: "-36px", right: "16px",
                color: "rgba(255,255,255,0.6)", background: "none", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem",
                fontFamily: "Tajawal, sans-serif",
              }}
              onClick={() => setZoomedImage(null)}
            >
              <X size={18} /> إغلاق
            </button>
            <img
              src={zoomedImage} alt="zoomed"
              style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "16px", display: "block", margin: "0 auto" }}
            />
          </div>
        </div>
      )}

      {/* ════════════ ANSWER MODAL ════════════ */}
      {showAnswer && (
        <div className="answer-modal-overlay">
          <div className={modalClass}>

            {/* Diff + category */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
              <span
                className="diff-badge"
                style={{ background: diffMeta.bg, border: `1px solid ${diffMeta.border}`, color: diffMeta.color }}
              >
                {diffMeta.label}
              </span>
              <span className="category-badge">{catName || "السؤال"}</span>
            </div>

            {/* "الإجابة" label */}
            <div className="answer-modal-label">◆ الإجابة ◆</div>

            {/* Answer image */}
            {(answerType === "image" || answerType === "mixed") && question.answer_image_url && (
              <img
                src={question.answer_image_url}
                alt="answer"
                data-testid="answer-image"
                className="answer-modal-image"
                onClick={() => setZoomedImage(question.answer_image_url)}
                onError={e => { e.target.style.display = "none"; }}
              />
            )}

            {/* Answer text */}
            {(answerType === "text" || answerType === "mixed") && question.answer && (
              <div
                data-testid="answer-text"
                className={`answer-modal-text${assigned ? (scoredTeam !== "skip" ? " correct" : " wrong") : ""}`}
              >
                {question.answer}
              </div>
            )}

            {/* Gold points shimmer */}
            {!assigned && (
              <div style={{
                background: "linear-gradient(135deg,#92400e,#d97706,#fbbf24,#d97706,#92400e)",
                backgroundSize: "200% auto",
                animation: "btnPulse 3s linear infinite",
                color: "#1a0a0b",
                fontWeight: 800,
                fontSize: "0.92rem",
                padding: "7px 22px",
                borderRadius: "50px",
                letterSpacing: "0.04em",
              }}>
                {question.difficulty} نقطة
              </div>
            )}

            {/* Score assignment */}
            {!assigned && (
              <>
                <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.1em" }}>
                  من أجاب صح؟
                </div>
                <div className="assign-row">
                  <button
                    data-testid="assign-team1-btn"
                    className="assign-btn t1"
                    onClick={() => handleAssign(1)}
                  >
                    <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 800, fontSize: "clamp(0.82rem,1.4vw,1rem)" }}>
                      🔴 {session?.team1_name}
                    </span>
                    <span style={{ color: "#fecaca", fontWeight: 900, fontSize: "clamp(1.3rem,2.4vw,1.9rem)", lineHeight: 1 }}>
                      +{question.difficulty}
                    </span>
                  </button>
                  <button
                    data-testid="assign-team2-btn"
                    className="assign-btn t2"
                    onClick={() => handleAssign(2)}
                  >
                    <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 800, fontSize: "clamp(0.82rem,1.4vw,1rem)" }}>
                      🔵 {session?.team2_name}
                    </span>
                    <span style={{ color: "#bfdbfe", fontWeight: 900, fontSize: "clamp(1.3rem,2.4vw,1.9rem)", lineHeight: 1 }}>
                      +{question.difficulty}
                    </span>
                  </button>
                  <button
                    data-testid="skip-points-btn"
                    className="skip-btn"
                    onClick={handleSkip}
                  >
                    لا أحد
                  </button>
                </div>
              </>
            )}

            {/* Post-assign: result + next */}
            {assigned && (
              <>
                <div className={`result-chip${scoredTeam !== "skip" ? " correct" : " wrong"}`}>
                  {scoredTeam !== "skip"
                    ? `✓ +${question.difficulty} → ${scoredTeam === 1 ? session?.team1_name : session?.team2_name}`
                    : "لا نقاط — سؤال مفتوح"}
                </div>
                <button
                  data-testid="continue-btn"
                  className="next-btn"
                  onClick={handleBack}
                >
                  التالي — العودة للوحة ←
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* ════════════ 3-COLUMN GRID ════════════ */}
      <div className="q-grid">

        {/* ══ TOP BAR ══ */}
        <div className="q-topbar">

          {/* Team 1 pill */}
          <div className={`player-panel${isTeam1 ? " team1-active" : ""}`} style={{ minWidth: "140px" }}>
            <div className="player-name" style={{ color: isTeam1 ? "#fca5a5" : "rgba(255,255,255,0.70)" }}>
              🔴
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>
                {session?.team1_name || "الفريق الأول"}
              </span>
              {isTeam1 && (
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "btnPulse 1.2s ease-in-out infinite" }} />
              )}
            </div>
            <div className="player-score">{teamScores.team1}</div>
            {isTeam1 && <div className="player-turn-label" style={{ color: "var(--coral)" }}>دوره الآن</div>}
          </div>

          {/* Timer center */}
          <div className="timer-center">
            <div className="topbar-meta">
              <button className="back-btn" onClick={handleBack}>← اللوحة</button>
              <span style={{ color: "rgba(245,200,66,0.70)", fontWeight: 700, fontSize: "0.78rem" }}>
                {catName || "حُجّة"}
              </span>
            </div>

            <div className="timer-wrap">
              {/* Timer SVG */}
              <div className="timer-circle">
                <svg width="66" height="66" viewBox="0 0 66 66">
                  <circle cx="33" cy="33" r="28" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                  <circle
                    cx="33" cy="33" r="28"
                    fill="none"
                    stroke={timerStroke}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - pct / 100)}
                    transform="rotate(-90 33 33)"
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                  />
                </svg>
                <div className="timer-number" style={{ color: timerStroke }}>{timeLeft}</div>
              </div>

              {/* Controls */}
              <div className="timer-controls">
                <button
                  data-testid="timer-pause-resume-btn"
                  className="timer-btn"
                  onClick={() => setTimerOn(t => !t)}
                  style={{
                    background: timerOn ? "rgba(251,191,36,0.12)" : "rgba(34,197,94,0.12)",
                    borderColor: timerOn ? "rgba(251,191,36,0.40)" : "rgba(34,197,94,0.40)",
                    color: timerOn ? "#fbbf24" : "#4ade80",
                  }}
                >
                  {timerOn ? <Pause size={11} /> : <Play size={11} />}
                  {timerOn ? "إيقاف" : "تشغيل"}
                </button>
                <button
                  data-testid="timer-reset-btn"
                  className="timer-btn"
                  onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(false); setTensionDone(false); }}
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)", color: "rgba(209,213,219,0.7)" }}
                >
                  <RotateCcw size={11} />
                </button>
                <button
                  data-testid="timer-start-btn"
                  className="timer-btn"
                  onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(true); setTensionDone(false); }}
                  style={{ background: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.30)", color: "rgba(74,222,128,0.85)" }}
                >
                  <Play size={11} />ابدأ
                </button>
              </div>
            </div>
          </div>

          {/* Team 2 pill */}
          <div className={`player-panel${!isTeam1 ? " team2-active" : ""}`} style={{ minWidth: "140px" }}>
            <div className="player-name" style={{ color: !isTeam1 ? "#93c5fd" : "rgba(255,255,255,0.70)", justifyContent: "flex-end" }}>
              {!isTeam1 && (
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#3b82f6", flexShrink: 0, animation: "btnPulse 1.2s ease-in-out infinite" }} />
              )}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>
                {session?.team2_name || "الفريق الثاني"}
              </span>
              🔵
            </div>
            <div className="player-score" style={{ textAlign: "right" }}>{teamScores.team2}</div>
            {!isTeam1 && <div className="player-turn-label" style={{ color: "var(--mint)", textAlign: "right" }}>دوره الآن</div>}
          </div>
        </div>

        {/* ══ LEFT SIDEBAR ══ */}
        <div className="q-sidebar left-side">
          {/* Active team card */}
          <div
            className="glass-card"
            style={{
              borderRight: `4px solid ${isTeam1 ? "var(--coral)" : "var(--mint)"}`,
              background: isTeam1 ? "rgba(255,107,107,0.07)" : "rgba(67,233,123,0.07)",
            }}
          >
            <div className="card-label">يجيب الآن</div>
            <div style={{
              fontWeight: 800, fontSize: "0.95rem",
              color: isTeam1 ? "#fca5a5" : "#86efac",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isTeam1 ? "#ef4444" : "#3b82f6", animation: "btnPulse 1.5s ease-in-out infinite" }} />
              {isTeam1 ? (session?.team1_name || "الفريق الأول") : (session?.team2_name || "الفريق الثاني")}
            </div>
          </div>

          {/* Category */}
          <div className="glass-card">
            <div className="card-label">التصنيف</div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "rgba(245,200,66,0.90)", marginBottom: "8px" }}>
              {catName || "—"}
            </div>
            <span
              className="diff-badge"
              style={{ background: diffMeta.bg, border: `1px solid ${diffMeta.border}`, color: diffMeta.color }}
            >
              {diffMeta.label}
            </span>
          </div>

          {/* Points */}
          <div className="glass-card" style={{ textAlign: "center" }}>
            <div className="card-label">النقاط</div>
            <div className="points-badge">{question.difficulty}</div>
            <div style={{ fontSize: "0.62rem", color: "rgba(245,200,66,0.50)", marginTop: "5px", fontWeight: 600 }}>نقطة</div>
          </div>
        </div>

        {/* ══ QUESTION CENTER ══ */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="question-card">

            {/* Secret word path */}
            {isSecret ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "18px",
              }}>
                <div style={{ fontWeight: 800, fontSize: "clamp(1.2rem,2.4vw,1.8rem)", textAlign: "center" }}>
                  وصّف الكلمة السرية
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", textAlign: "center" }}>
                  الملاعب يمسح الـ QR — بس هو يشوف الكلمة!
                </div>
                <div style={{ background: "#fff", padding: "16px", borderRadius: "18px", boxShadow: "0 0 40px rgba(245,200,66,0.20)" }}>
                  <QRCodeSVG value={secretUrl} size={Math.min(window.innerWidth - 120, 200)} data-testid="qr-code" />
                </div>
                <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.65rem", fontFamily: "monospace", wordBreak: "break-all", maxWidth: "280px", textAlign: "center" }}>
                  {secretUrl}
                </p>
              </div>
            ) : (
              <>
                {/* Question image — CENTERED */}
                {question.image_url && (
                  <div data-testid="question-image-container" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    {!imgLoaded && (
                      <div style={{
                        width: "auto", maxWidth: "100%", height: "265px",
                        borderRadius: "16px", background: "rgba(255,255,255,0.04)",
                        border: "1.5px dashed rgba(255,255,255,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        animation: "imgSkeleton 1.5s ease-in-out infinite",
                      }}>
                        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>تحميل الصورة...</span>
                      </div>
                    )}
                    <div style={{ position: "relative", display: imgLoaded ? "inline-block" : "none" }}>
                      <img
                        src={question.image_url}
                        alt="question"
                        data-testid="question-image"
                        className="question-image"
                        onLoad={() => setImgLoaded(true)}
                        onError={e => { e.target.style.display = "none"; setImgLoaded(true); }}
                        onClick={() => setZoomedImage(question.image_url)}
                      />
                      <div style={{
                        position: "absolute", inset: 0, borderRadius: "16px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, background: "rgba(0,0,0,0.30)", cursor: "zoom-in",
                        transition: "opacity 0.2s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0"}
                        onClick={() => setZoomedImage(question.image_url)}
                      >
                        <ZoomIn size={30} style={{ color: "#fff" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Question text */}
                <p
                  data-testid="question-text"
                  className="question-text"
                  style={{
                    fontSize: question.image_url
                      ? "clamp(1.3rem,2.3vw,2.2rem)"
                      : "clamp(1.5rem,2.8vw,2.8rem)",
                  }}
                >
                  {question.text}
                </p>

                {/* Reveal button */}
                {!showAnswer && (
                  <button
                    data-testid="reveal-answer-btn"
                    className="reveal-btn"
                    onClick={handleReveal}
                  >
                    ◆ كشف الإجابة ◆
                  </button>
                )}

                {/* After reveal: waiting state (modal is open) */}
                {showAnswer && !assigned && (
                  <div style={{ color: "rgba(245,200,66,0.55)", fontSize: "0.85rem", fontWeight: 600 }}>
                    انتظر نافذة الإجابة…
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ══ RIGHT SIDEBAR ══ */}
        <div className="q-sidebar">
          {/* Lifelines */}
          <div className="glass-card">
            <div className="card-label">وسائل المساعدة</div>
            <div className="helper-btns">
              {[
                { icon: "⏱️", label: "مزيد وقت" },
                { icon: "🔄", label: "تغيير السؤال" },
                { icon: "🎯", label: "مساعدة الجمهور" },
              ].map((h, i) => (
                <button key={i} className="helper-btn" title={h.label}>{h.icon}</button>
              ))}
            </div>
          </div>

          {/* Team 1 mini */}
          <div className="glass-card" style={{
            borderRight: `4px solid rgba(255,107,107,${isTeam1 ? "0.65" : "0.20"})`,
            background: isTeam1 ? "rgba(255,107,107,0.07)" : "var(--glass-bg)",
          }}>
            <div className="player-name" style={{ color: "#fca5a5", marginBottom: "5px" }}>
              🔴 {session?.team1_name || "الفريق الأول"}
            </div>
            <div className="player-score">{teamScores.team1}</div>
            <div style={{ fontSize: "0.6rem", color: "rgba(245,200,66,0.42)", fontWeight: 600, marginTop: "2px" }}>نقطة</div>
          </div>

          {/* Team 2 mini */}
          <div className="glass-card" style={{
            borderRight: `4px solid rgba(67,233,123,${!isTeam1 ? "0.65" : "0.20"})`,
            background: !isTeam1 ? "rgba(67,233,123,0.07)" : "var(--glass-bg)",
          }}>
            <div className="player-name" style={{ color: "#93c5fd", marginBottom: "5px" }}>
              🔵 {session?.team2_name || "الفريق الثاني"}
            </div>
            <div className="player-score">{teamScores.team2}</div>
            <div style={{ fontSize: "0.6rem", color: "rgba(245,200,66,0.42)", fontWeight: 600, marginTop: "2px" }}>نقطة</div>
          </div>

          {/* Quick continue (after assign) */}
          {assigned && (
            <button className="next-btn" onClick={handleBack} style={{ width: "100%" }}>
              العودة ←
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
