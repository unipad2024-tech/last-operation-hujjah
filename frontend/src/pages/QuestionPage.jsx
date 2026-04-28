import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { X, ZoomIn, Pause, Play, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   ALL LOGIC PRESERVED — UI REBUILT WITH 3-COLUMN GRID + INLINE ANSWER REVEAL
   ═══════════════════════════════════════════════════════════════════════════ */

const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";

export default function QuestionPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { session, updateScore, gameSettings, switchTurn, teamScores } = useGame();
  const { question, catName, slot, turnTeam } = state || {};

  const isWordCat = question?.category_id === "cat_word" || question?.question_type === "secret_word";
  const diff      = question?.difficulty || 300;
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
  const [ansImgLoaded, setAnsImgLoaded] = useState(false);
  const timerRef = useRef(null);

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

  const playTension = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const schedule = (freq, t, dur) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "triangle"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + dur + 0.01);
      };
      for (let i = 0; i < 10; i++) schedule(i % 2 === 0 ? 830 : 600, i * 0.85, 0.35);
    } catch {}
  };

  const playBuzz = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth"; osc.frequency.value = 150;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
    } catch {}
  };

  const playCorrect = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const schedule = (freq, t, dur) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + dur + 0.01);
      };
      [523, 659, 784, 1047].forEach((f, i) => schedule(f, i * 0.12, 0.25));
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

  const handleSkip = () => setAssigned(true);
  const handleBack = () => { switchTurn(); navigate("/game"); };

  if (!question) { navigate("/game"); return null; }

  /* ── Derived values ── */
  const pct      = (timeLeft / TIMER_DURATION) * 100;
  const R        = 38;
  const circ     = 2 * Math.PI * R;
  const dash     = circ * (1 - pct / 100);
  const timerCol = timeLeft > 20 ? "#ffb347" : timeLeft > 10 ? "#f59e0b" : "#ef4444";
  const isSecret = question.question_type === "secret_word";
  const secretUrl = `${window.location.origin}/secret/${question.id}`;
  const isTeam1  = slot === 1;

  const diffBadge = (
    question.difficulty === 300
      ? { label: "سهل",   color: "#6ee7b7", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.28)"  }
      : question.difficulty === 600
      ? { label: "متوسط", color: "#fcd34d", bg: "rgba(252,211,77,0.12)",  border: "rgba(252,211,77,0.28)"  }
      : { label: "صعب",   color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)" }
  );

  /* Answer type: image | text | mixed */
  const answerType = (question.answer_image_url && question.answer)
    ? "mixed"
    : question.answer_image_url
    ? "image"
    : "text";

  return (
    <div
      style={{
        minHeight: "100svh",
        overflow: "auto",
        fontFamily: "Cairo, sans-serif",
        color: "var(--q-text)",
        background: `
          linear-gradient(180deg, rgba(8,5,12,0.87) 0%, rgba(6,3,10,0.95) 100%),
          url("${ROMAN_BG}")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        backgroundAttachment: "fixed",
      }}
    >
      <style>{`
        :root {
          --q-bg: #09070c;
          --q-panel: rgba(20,15,28,0.85);
          --q-panel-2: rgba(32,26,42,0.90);
          --q-stroke: rgba(255,151,87,0.30);
          --q-stroke-2: rgba(255,201,130,0.20);
          --q-text: #f7f1e8;
          --q-muted: rgba(247,241,232,0.65);
          --q-accent: #ff7a2f;
          --q-accent-2: #ffb347;
          --q-shadow: 0 18px 50px rgba(0,0,0,0.45);
        }

        /* ── Grid layout ── */
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

        /* ── Top bar (spans all 3 cols) ── */
        .q-top-bar {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 20px;
          background: rgba(10,7,16,0.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,180,80,0.12);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        /* ── Team pill ── */
        .q-team-pill {
          min-width: 150px;
          padding: 12px 18px;
          border-radius: 16px;
          background: var(--q-panel);
          border: 1.5px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .q-team-pill.active-t1 {
          background: rgba(239,68,68,0.13);
          border-color: rgba(239,68,68,0.45);
          box-shadow: 0 0 18px rgba(239,68,68,0.15);
        }
        .q-team-pill.active-t2 {
          background: rgba(59,130,246,0.13);
          border-color: rgba(59,130,246,0.45);
          box-shadow: 0 0 18px rgba(59,130,246,0.15);
        }
        .q-team-pill .pill-name {
          font-weight: 800;
          font-size: clamp(0.72rem,1.2vw,0.95rem);
          line-height: 1.1;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .q-team-pill .pill-score {
          font-size: clamp(1.4rem,2.8vw,2.2rem);
          font-weight: 900;
          color: #d4a820;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .q-team-pill .pill-turn {
          font-size: 0.65rem;
          font-weight: 700;
          opacity: 0.75;
          letter-spacing: 0.03em;
        }

        /* ── Timer area (center of top bar) ── */
        .q-timer-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .q-timer-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .q-timer-pill {
          width: clamp(90px,10vw,120px);
          height: clamp(90px,10vw,120px);
          flex-shrink: 0;
        }
        .q-controls {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .q-ctrl-btn {
          border-radius: 10px;
          padding: 4px 10px;
          font-family: Cairo, sans-serif;
          font-weight: 700;
          font-size: 0.68rem;
          cursor: pointer;
          border: 1px solid;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: transform 0.15s, opacity 0.15s;
        }
        .q-ctrl-btn:hover { transform: scale(1.06); }
        .q-ctrl-btn:active { transform: scale(0.93); }

        /* ── Sidebar ── */
        .q-sidebar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .q-helper-card {
          padding: 14px 14px;
          border-radius: 18px;
          background: var(--q-panel);
          border: 1px solid rgba(255,180,80,0.10);
          box-shadow: var(--q-shadow);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .q-helper-title {
          font-weight: 800;
          font-size: 0.72rem;
          color: var(--q-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .q-helper-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .q-helper-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,180,80,0.14);
          background: rgba(255,255,255,0.05);
          color: var(--q-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .q-helper-btn:hover { background: rgba(255,180,80,0.10); transform: scale(1.08); }

        /* ── Question panel (center) ── */
        .q-panel {
          position: relative;
          border-radius: 28px;
          padding: clamp(18px,2vw,28px);
          background:
            linear-gradient(175deg, rgba(255,130,55,0.10) 0%, rgba(16,12,22,0.92) 45%),
            rgba(16,12,22,0.90);
          border: 2px solid rgba(255,130,55,0.60);
          box-shadow:
            0 0 0 1px rgba(255,180,80,0.06) inset,
            0 24px 70px rgba(0,0,0,0.55);
          overflow: hidden;
        }
        .q-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at top right, rgba(255,185,115,0.10), transparent 36%),
            radial-gradient(ellipse at bottom left, rgba(255,120,60,0.09), transparent 34%);
          pointer-events: none;
        }
        .q-panel-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 62vh;
        }

        /* meta row */
        .q-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-shrink: 0;
        }
        .q-points-badge {
          padding: 10px 16px;
          border-radius: 14px;
          background: linear-gradient(175deg, rgba(255,207,93,0.95), rgba(255,158,61,0.95));
          color: #1a1208;
          font-size: clamp(1.5rem,3vw,2.4rem);
          font-weight: 900;
          text-align: center;
          min-width: 80px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.28);
          line-height: 1;
        }
        .q-points-label {
          font-size: 0.58rem;
          font-weight: 700;
          color: rgba(26,18,8,0.7);
          text-align: center;
          margin-top: 3px;
        }
        .q-active-team {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 12px;
        }

        /* image */
        .q-image-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }
        .q-image {
          width: min(100%, 380px);
          aspect-ratio: 16/10;
          object-fit: cover;
          border-radius: 18px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,180,80,0.16);
          box-shadow: 0 14px 44px rgba(0,0,0,0.40);
          cursor: zoom-in;
          transition: transform 0.25s;
        }
        .q-image:hover { transform: scale(1.015); }

        /* question text */
        .q-text {
          margin: 0 auto;
          max-width: 900px;
          font-size: clamp(1.4rem,2.8vw,3rem);
          line-height: 1.2;
          font-weight: 900;
          text-align: center;
          color: var(--q-text);
          text-shadow: 0 2px 18px rgba(0,0,0,0.50);
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* reveal button */
        .q-reveal-btn {
          align-self: center;
          font-family: Cairo, sans-serif;
          font-weight: 900;
          border-radius: 999px;
          font-size: clamp(1rem,1.8vw,1.3rem);
          padding: clamp(12px,1.8vw,18px) clamp(36px,6vw,72px);
          background: linear-gradient(135deg, rgba(92,14,20,0.90), rgba(61,8,16,0.95));
          border: 2px solid rgba(241,225,148,0.55);
          color: #F1E194;
          letter-spacing: 0.04em;
          text-shadow: 0 0 16px rgba(241,225,148,0.40);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: revealPulse 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .q-reveal-btn:hover { transform: scale(1.05); }
        .q-reveal-btn:active { transform: scale(0.95); }

        /* answer area (slides in) */
        .q-answer-area {
          display: flex;
          justify-content: center;
          flex-shrink: 0;
          animation: answerSlideIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .q-answer-card {
          width: min(100%, 620px);
          padding: clamp(18px,2.5vw,28px) clamp(20px,2.5vw,32px);
          border-radius: 22px;
          background: linear-gradient(175deg, rgba(255,255,255,0.09), rgba(255,255,255,0.05));
          border: 1.5px solid rgba(255,225,140,0.22);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 12px 48px rgba(0,0,0,0.38);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .q-answer-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(241,225,148,0.45);
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .q-answer-img {
          width: 100%;
          max-height: clamp(140px,22vh,260px);
          object-fit: contain;
          border-radius: 14px;
          cursor: zoom-in;
        }
        .q-answer-text {
          font-size: clamp(1.8rem,4.5vw,3.4rem);
          font-weight: 900;
          text-align: center;
          color: var(--q-text);
          line-height: 1.1;
          animation: answerGlow 2.5s ease-in-out infinite;
        }

        /* score buttons */
        .q-score-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          flex-shrink: 0;
          animation: scoreRowIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
          animation-delay: 0.15s;
        }
        .q-score-btn {
          font-family: Cairo, sans-serif;
          font-weight: 900;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: clamp(130px,16vw,200px);
          padding: clamp(10px,1.5vw,16px) clamp(16px,2.5vw,28px);
          cursor: pointer;
          border: 1.5px solid;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
        }
        .q-score-btn:hover { transform: scale(1.05) translateY(-3px); }
        .q-score-btn:active { transform: scale(0.95); }
        .q-skip-btn {
          font-family: Cairo, sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          border-radius: 14px;
          padding: 10px 20px;
          cursor: pointer;
          background: transparent;
          border: 1.5px solid rgba(241,225,148,0.18);
          color: rgba(241,225,148,0.40);
          align-self: center;
          transition: opacity 0.2s;
        }
        .q-skip-btn:hover { opacity: 0.8; }

        /* post-assign */
        .q-post-assign {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          animation: scoreRowIn 0.4s ease both;
        }
        .q-continue-btn {
          font-family: Cairo, sans-serif;
          font-weight: 900;
          font-size: clamp(1rem,1.6vw,1.2rem);
          padding: clamp(10px,1.4vw,14px) clamp(28px,4.5vw,52px);
          border-radius: 999px;
          background: linear-gradient(135deg, #c09820, #f0d045);
          color: #1a0a0b;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 28px rgba(192,152,32,0.40);
          transition: transform 0.2s;
        }
        .q-continue-btn:hover { transform: scale(1.05); }
        .q-continue-btn:active { transform: scale(0.95); }

        /* diff tag */
        .q-diff-tag {
          padding: 6px 14px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.82rem;
          letter-spacing: 0.02em;
        }

        /* back btn */
        .q-back-btn {
          font-family: Cairo, sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,180,80,0.14);
          color: rgba(255,225,140,0.55);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .q-back-btn:hover { background: rgba(255,180,80,0.08); }

        /* Keyframes */
        @keyframes answerSlideIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scoreRowIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes answerGlow {
          0%,100% { text-shadow: 0 0 24px rgba(241,225,148,0.45), 0 0 70px rgba(241,225,148,0.16); }
          50%      { text-shadow: 0 0 50px rgba(241,225,148,0.80), 0 0 120px rgba(241,225,148,0.30); }
        }
        @keyframes revealPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(241,225,148,0.0), 0 0 20px rgba(241,225,148,0.10); }
          50%     { box-shadow: 0 0 0 7px rgba(241,225,148,0.10), 0 0 36px rgba(241,225,148,0.22); }
        }
        @keyframes goldShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .question-layout { grid-template-columns: 170px minmax(0,1fr) 170px; }
        }
        @media (max-width: 820px) {
          .question-layout {
            grid-template-columns: 1fr;
            padding: 10px 12px 16px;
          }
          .q-sidebar { order: 3; }
          .q-sidebar.left-side { order: 2; }
          .q-panel-inner { min-height: auto; }
        }
      `}</style>

      {/* ════════════ ZOOM MODAL ════════════ */}
      {zoomedImage && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.94)", backdropFilter: "blur(8px)",
          }}
          onClick={() => setZoomedImage(null)}
        >
          <div
            style={{ position: "relative", maxWidth: "min(90vw,1100px)", width: "100%", padding: "0 16px" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{
                position: "absolute", top: "-36px", right: "16px",
                color: "rgba(255,255,255,0.55)", background: "none", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                fontSize: "0.85rem", fontFamily: "Cairo, sans-serif",
              }}
              onClick={() => setZoomedImage(null)}
            >
              <X size={18} /> إغلاق
            </button>
            <img
              src={zoomedImage} alt="zoomed"
              style={{
                maxWidth: "100%", maxHeight: "85vh", objectFit: "contain",
                borderRadius: "18px", display: "block", margin: "0 auto",
                boxShadow: "0 0 80px rgba(0,0,0,0.9)",
              }}
            />
          </div>
        </div>
      )}

      {/* ════════════ 3-COLUMN GRID ════════════ */}
      <div className="question-layout">

        {/* ══════ TOP BAR ══════ */}
        <div className="q-top-bar">

          {/* Team 1 pill */}
          <div className={`q-team-pill${isTeam1 ? " active-t1" : ""}`}>
            <div className="pill-name" style={{ color: isTeam1 ? "#fca5a5" : "rgba(247,241,232,0.65)" }}>
              <span>🔴</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "110px" }}>
                {session?.team1_name || "الفريق الأول"}
              </span>
              {isTeam1 && (
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1.2s ease-in-out infinite", flexShrink: 0 }} />
              )}
            </div>
            <div className="pill-score">{teamScores.team1}</div>
            {isTeam1 && <div className="pill-turn" style={{ color: "#fca5a5" }}>دوره الآن</div>}
          </div>

          {/* Timer center */}
          <div className="q-timer-center">
            {/* Game name + category */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <button className="q-back-btn" onClick={handleBack}>
                ← اللوحة
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  color: "rgba(212,168,32,0.75)", fontWeight: 900,
                  fontSize: "clamp(0.7rem,1.3vw,0.95rem)", lineHeight: 1.1,
                }}>
                  {catName || "حُجّة"}
                </div>
              </div>
            </div>

            {/* Timer + controls */}
            <div className="q-timer-row">
              <div className="q-timer-pill">
                <svg width="100%" height="100%" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r={R} fill="rgba(0,0,0,0.55)" stroke="rgba(255,180,80,0.10)" strokeWidth="8" />
                  <circle
                    cx="45" cy="45" r={R}
                    fill="none" stroke={timerCol} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={dash}
                    transform="rotate(-90 45 45)"
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
                  />
                  <text
                    x="45" y="45" textAnchor="middle" dominantBaseline="central"
                    fill={timerCol} fontSize="22" fontWeight="900" fontFamily="Cairo,sans-serif"
                  >
                    {timeLeft}
                  </text>
                </svg>
              </div>

              <div className="q-controls">
                <button
                  data-testid="timer-pause-resume-btn"
                  className="q-ctrl-btn"
                  onClick={() => setTimerOn(t => !t)}
                  style={{
                    background: timerOn ? "rgba(251,191,36,0.12)" : "rgba(34,197,94,0.12)",
                    borderColor: timerOn ? "rgba(251,191,36,0.38)" : "rgba(34,197,94,0.38)",
                    color: timerOn ? "#fbbf24" : "#4ade80",
                  }}
                >
                  {timerOn ? <Pause size={11} /> : <Play size={11} />}
                  {timerOn ? "إيقاف" : "تشغيل"}
                </button>
                <button
                  data-testid="timer-reset-btn"
                  className="q-ctrl-btn"
                  onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(false); setTensionDone(false); }}
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.14)", color: "rgba(209,213,219,0.65)" }}
                >
                  <RotateCcw size={11} />
                </button>
                <button
                  data-testid="timer-start-btn"
                  className="q-ctrl-btn"
                  onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(true); setTensionDone(false); }}
                  style={{ background: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.28)", color: "rgba(74,222,128,0.85)" }}
                >
                  <Play size={11} />ابدأ
                </button>
              </div>
            </div>
          </div>

          {/* Team 2 pill */}
          <div className={`q-team-pill${!isTeam1 ? " active-t2" : ""}`} style={{ textAlign: "right" }}>
            <div className="pill-name" style={{ color: !isTeam1 ? "#93c5fd" : "rgba(247,241,232,0.65)", justifyContent: "flex-end" }}>
              {!isTeam1 && (
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#3b82f6", animation: "pulse 1.2s ease-in-out infinite", flexShrink: 0 }} />
              )}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "110px" }}>
                {session?.team2_name || "الفريق الثاني"}
              </span>
              <span>🔵</span>
            </div>
            <div className="pill-score" style={{ textAlign: "right" }}>{teamScores.team2}</div>
            {!isTeam1 && <div className="pill-turn" style={{ color: "#93c5fd", textAlign: "right" }}>دوره الآن</div>}
          </div>
        </div>

        {/* ══════ LEFT SIDEBAR ══════ */}
        <div className="q-sidebar left-side">
          {/* Active team indicator */}
          <div
            className="q-helper-card"
            style={{
              background: isTeam1 ? "rgba(239,68,68,0.12)" : "rgba(59,130,246,0.12)",
              borderColor: isTeam1 ? "rgba(239,68,68,0.32)" : "rgba(59,130,246,0.32)",
            }}
          >
            <div className="q-helper-title">يجيب الآن</div>
            <div style={{
              fontWeight: 900,
              fontSize: "clamp(0.85rem,1.4vw,1.1rem)",
              color: isTeam1 ? "#fca5a5" : "#93c5fd",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: isTeam1 ? "#ef4444" : "#3b82f6",
                animation: "pulse 1.2s ease-in-out infinite",
              }} />
              {isTeam1 ? (session?.team1_name || "الفريق الأول") : (session?.team2_name || "الفريق الثاني")}
            </div>
          </div>

          {/* Category + difficulty */}
          <div className="q-helper-card">
            <div className="q-helper-title">التصنيف</div>
            <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "rgba(212,168,32,0.9)", marginBottom: "8px", lineHeight: 1.2 }}>
              {catName || "—"}
            </div>
            <div
              className="q-diff-tag"
              style={{ background: diffBadge.bg, border: `1px solid ${diffBadge.border}`, color: diffBadge.color, display: "inline-block" }}
            >
              {diffBadge.label}
            </div>
          </div>

          {/* Points badge */}
          <div className="q-helper-card" style={{ textAlign: "center" }}>
            <div className="q-helper-title">النقاط</div>
            <div style={{ fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 900, color: "#d4a820", lineHeight: 1 }}>
              {question.difficulty}
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(212,168,32,0.55)", fontWeight: 700, marginTop: "3px" }}>نقطة</div>
          </div>
        </div>

        {/* ══════ QUESTION CENTER ══════ */}
        <div className="question-center">
          <div className="q-panel">
            <div className="q-panel-inner">

              {/* ── Secret word path ── */}
              {isSecret ? (
                <div style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "16px",
                }}>
                  <div style={{ fontWeight: 900, fontSize: "clamp(1.2rem,2.5vw,1.8rem)", color: "var(--q-text)", textAlign: "center" }}>
                    وصّف الكلمة السرية
                  </div>
                  <div style={{ color: "rgba(247,241,232,0.45)", fontSize: "0.88rem", textAlign: "center" }}>
                    الملاعب يمسح الـ QR — بس هو يشوف الكلمة!
                  </div>
                  <div style={{ background: "#fff", padding: "16px", borderRadius: "18px", boxShadow: "0 0 40px rgba(241,225,148,0.20)" }}>
                    <QRCodeSVG value={secretUrl} size={Math.min(window.innerWidth - 120, 200)} data-testid="qr-code" />
                  </div>
                  <p style={{ color: "rgba(247,241,232,0.20)", fontSize: "0.68rem", fontFamily: "monospace", wordBreak: "break-all", maxWidth: "280px", textAlign: "center" }}>
                    {secretUrl}
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Question image ── */}
                  {question.image_url && (
                    <div className="q-image-wrap" data-testid="question-image-container">
                      {!imgLoaded && (
                        <div style={{
                          width: "min(100%, 380px)", aspectRatio: "16/10",
                          borderRadius: "18px", background: "rgba(255,255,255,0.04)",
                          border: "1.5px dashed rgba(255,180,80,0.14)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          animation: "pulse 1.5s ease-in-out infinite",
                        }}>
                          <span style={{ color: "rgba(247,241,232,0.22)", fontSize: "0.85rem" }}>تحميل الصورة...</span>
                        </div>
                      )}
                      <div style={{ position: "relative", display: imgLoaded ? "inline-flex" : "none" }}>
                        <img
                          src={question.image_url}
                          alt="question"
                          data-testid="question-image"
                          className="q-image"
                          onLoad={() => setImgLoaded(true)}
                          onError={e => { e.target.style.display = "none"; setImgLoaded(true); }}
                          onClick={() => setZoomedImage(question.image_url)}
                        />
                        <div style={{
                          position: "absolute", inset: 0, borderRadius: "18px",
                          opacity: 0, background: "rgba(0,0,0,0.35)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "zoom-in", transition: "opacity 0.2s",
                        }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "0"}
                          onClick={() => setZoomedImage(question.image_url)}
                        >
                          <ZoomIn size={28} style={{ color: "#fff" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Question text ── */}
                  <p
                    data-testid="question-text"
                    className="q-text"
                    style={{
                      fontSize: question.image_url
                        ? "clamp(1.2rem,2.4vw,2.4rem)"
                        : "clamp(1.5rem,3.2vw,3rem)",
                    }}
                  >
                    {question.text}
                  </p>

                  {/* ── Reveal button ── */}
                  {!showAnswer && (
                    <button
                      data-testid="reveal-answer-btn"
                      className="q-reveal-btn"
                      onClick={handleReveal}
                    >
                      ◆ كشف الإجابة ◆
                    </button>
                  )}

                  {/* ── Answer reveal (inline) ── */}
                  {showAnswer && (
                    <>
                      <div className="q-answer-area">
                        <div className="q-answer-card">
                          <div className="q-answer-label">◆ الإجابة ◆</div>

                          {/* image type */}
                          {(answerType === "image" || answerType === "mixed") && question.answer_image_url && (
                            <img
                              src={question.answer_image_url}
                              alt="answer"
                              data-testid="answer-image"
                              className="q-answer-img"
                              style={{
                                border: "1.5px solid rgba(241,225,148,0.22)",
                                boxShadow: "0 8px 40px rgba(0,0,0,0.50)",
                                opacity: ansImgLoaded ? 1 : 0,
                                transition: "opacity 0.3s",
                              }}
                              onLoad={() => setAnsImgLoaded(true)}
                              onClick={() => setZoomedImage(question.answer_image_url)}
                              onError={e => { e.target.style.display = "none"; }}
                            />
                          )}

                          {/* text type */}
                          {(answerType === "text" || answerType === "mixed") && question.answer && (
                            <div
                              data-testid="answer-text"
                              className="q-answer-text"
                            >
                              {question.answer}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Points shimmer badge */}
                      {!assigned && (
                        <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
                          <div style={{
                            background: "linear-gradient(135deg,#92400e,#d97706,#fbbf24,#d97706,#92400e)",
                            backgroundSize: "200% auto",
                            animation: "goldShimmer 3s linear infinite",
                            color: "#000",
                            fontWeight: 900,
                            fontSize: "clamp(0.82rem,1.3vw,0.98rem)",
                            padding: "7px 22px",
                            borderRadius: "999px",
                            boxShadow: "0 0 24px rgba(251,191,36,0.35), 0 4px 16px rgba(0,0,0,0.35)",
                            letterSpacing: "0.04em",
                          }}>
                            {question.difficulty} نقطة
                          </div>
                        </div>
                      )}

                      {/* Score assignment */}
                      {!assigned && (
                        <>
                          <div style={{
                            textAlign: "center", flexShrink: 0,
                            color: "rgba(241,225,148,0.35)", fontSize: "0.78rem",
                            fontWeight: 700, letterSpacing: "0.1em",
                          }}>
                            من أجاب صح؟
                          </div>
                          <div className="q-score-row">
                            <button
                              data-testid="assign-team1-btn"
                              className="q-score-btn"
                              onClick={() => handleAssign(1)}
                              style={{
                                background: "linear-gradient(160deg,rgba(220,38,38,0.92),rgba(153,27,27,0.97))",
                                borderColor: "rgba(248,113,113,0.50)",
                                boxShadow: "0 6px 28px rgba(239,68,68,0.32)",
                              }}
                            >
                              <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 900, fontSize: "clamp(0.82rem,1.4vw,1.05rem)" }}>
                                🔴 {session?.team1_name}
                              </span>
                              <span style={{ color: "#fecaca", fontWeight: 900, fontSize: "clamp(1.4rem,2.6vw,2rem)", lineHeight: 1 }}>
                                +{question.difficulty}
                              </span>
                            </button>

                            <button
                              data-testid="assign-team2-btn"
                              className="q-score-btn"
                              onClick={() => handleAssign(2)}
                              style={{
                                background: "linear-gradient(160deg,rgba(29,78,216,0.92),rgba(30,58,138,0.97))",
                                borderColor: "rgba(96,165,250,0.50)",
                                boxShadow: "0 6px 28px rgba(59,130,246,0.32)",
                              }}
                            >
                              <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 900, fontSize: "clamp(0.82rem,1.4vw,1.05rem)" }}>
                                🔵 {session?.team2_name}
                              </span>
                              <span style={{ color: "#bfdbfe", fontWeight: 900, fontSize: "clamp(1.4rem,2.6vw,2rem)", lineHeight: 1 }}>
                                +{question.difficulty}
                              </span>
                            </button>

                            <button
                              data-testid="skip-points-btn"
                              className="q-skip-btn"
                              onClick={handleSkip}
                            >
                              لا أحد
                            </button>
                          </div>
                        </>
                      )}

                      {/* Post-assign */}
                      {assigned && (
                        <div className="q-post-assign">
                          {scoredTeam && (
                            <div style={{
                              color: "var(--q-text)", fontWeight: 900,
                              fontSize: "clamp(0.95rem,1.8vw,1.3rem)",
                              textShadow: "0 0 20px rgba(241,225,148,0.35)",
                              textAlign: "center",
                            }}>
                              ✓ +{question.difficulty} ← {scoredTeam === 1 ? session?.team1_name : session?.team2_name}
                            </div>
                          )}
                          <button
                            data-testid="continue-btn"
                            className="q-continue-btn"
                            onClick={handleBack}
                          >
                            العودة للوحة ←
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══════ RIGHT SIDEBAR ══════ */}
        <div className="q-sidebar">
          {/* Lifelines */}
          <div className="q-helper-card">
            <div className="q-helper-title">وسائل المساعدة</div>
            <div className="q-helper-buttons">
              {[
                { icon: "⏱️", label: "مزيد وقت" },
                { icon: "🔄", label: "تغيير السؤال" },
                { icon: "🎯", label: "مساعدة الجمهور" },
              ].map((h, i) => (
                <button
                  key={i}
                  className="q-helper-btn"
                  title={h.label}
                >
                  {h.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Team 1 mini score */}
          <div
            className="q-helper-card"
            style={{
              background: isTeam1 ? "rgba(239,68,68,0.10)" : "rgba(12,6,18,0.70)",
              borderColor: isTeam1 ? "rgba(239,68,68,0.30)" : "rgba(255,180,80,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.7rem" }}>🔴</span>
              <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "#fca5a5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.team1_name || "الفريق الأول"}
              </span>
            </div>
            <div style={{ fontWeight: 900, fontSize: "clamp(1.4rem,2.2vw,1.9rem)", color: "#d4a820", lineHeight: 1 }}>
              {teamScores.team1}
            </div>
            <div style={{ fontSize: "0.6rem", color: "rgba(212,168,32,0.45)", fontWeight: 700, marginTop: "2px" }}>نقطة</div>
          </div>

          {/* Team 2 mini score */}
          <div
            className="q-helper-card"
            style={{
              background: !isTeam1 ? "rgba(59,130,246,0.10)" : "rgba(12,6,18,0.70)",
              borderColor: !isTeam1 ? "rgba(59,130,246,0.30)" : "rgba(255,180,80,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.7rem" }}>🔵</span>
              <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "#93c5fd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.team2_name || "الفريق الثاني"}
              </span>
            </div>
            <div style={{ fontWeight: 900, fontSize: "clamp(1.4rem,2.2vw,1.9rem)", color: "#d4a820", lineHeight: 1 }}>
              {teamScores.team2}
            </div>
            <div style={{ fontSize: "0.6rem", color: "rgba(212,168,32,0.45)", fontWeight: 700, marginTop: "2px" }}>نقطة</div>
          </div>

          {/* Continue button (after assign) - also visible in sidebar for easy reach */}
          {assigned && (
            <button
              className="q-continue-btn"
              onClick={handleBack}
              style={{ width: "100%" }}
            >
              العودة ←
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
