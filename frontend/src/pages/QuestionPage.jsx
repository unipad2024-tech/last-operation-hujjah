import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { X, ZoomIn, Pause, Play, RotateCcw } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   ALL LOGIC PRESERVED — ONLY UI / LAYOUT REDESIGNED
   ═══════════════════════════════════════════════════════════════════════════ */

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

  /* ── Derived display values ── */
  const pct      = (timeLeft / TIMER_DURATION) * 100;
  const R        = 38;
  const circ     = 2 * Math.PI * R;
  const dash     = circ * (1 - pct / 100);
  const timerCol = timeLeft > 20 ? "#F1E194" : timeLeft > 10 ? "#f59e0b" : "#ef4444";
  const isSecret = question.question_type === "secret_word";
  const secretUrl = `${window.location.origin}/secret/${question.id}`;
  const isTeam1  = slot === 1;
  const activeTeamName  = isTeam1 ? session?.team1_name  : session?.team2_name;
  const activeTeamColor = isTeam1 ? "#f87171"             : "#60a5fa";
  const activeBg        = isTeam1 ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)";
  const activeBorder    = isTeam1 ? "rgba(239,68,68,0.45)" : "rgba(59,130,246,0.45)";

  const diffBadge = {
    300: { label: "سهل",   color: "#6ee7b7", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" },
    600: { label: "متوسط", color: "#fcd34d", bg: "rgba(252,211,77,0.12)",  border: "rgba(252,211,77,0.3)"  },
    900: { label: "صعب",   color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
  }[question.difficulty] || diffBadge?.[300];

  /* ── Assistance tools (visual only) ── */
  const LIFELINES = ["⏱️", "🔄", "🎯"];

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{
        minHeight: "100svh",
        background: "radial-gradient(ellipse 110% 60% at 50% 0%, #3D0810 0%, #1a0205 45%, #0a0101 100%)",
        fontFamily: "Cairo, sans-serif",
      }}
    >
      {/* ════════════ IMAGE ZOOM MODAL ════════════ */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.94)", backdropFilter: "blur(8px)" }}
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl w-full px-4" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-4 text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm"
              onClick={() => setZoomedImage(null)}
            >
              <X size={18} /> إغلاق
            </button>
            <img
              src={zoomedImage}
              alt="zoomed"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl mx-auto block"
              style={{ boxShadow: "0 0 80px rgba(0,0,0,0.9)" }}
            />
          </div>
        </div>
      )}

      {/* ════════════ TOP BAR ════════════ */}
      <header
        className="shrink-0 flex items-center justify-between px-4 md:px-6"
        style={{
          height: "clamp(52px, 7vh, 68px)",
          background: "rgba(5,0,1,0.7)",
          borderBottom: "1px solid rgba(241,225,148,0.10)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Left: back */}
        <button
          data-testid="back-to-board"
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all hover:bg-secondary/10 hover:text-secondary group"
          style={{ color: "rgba(241,225,148,0.45)", fontSize: "clamp(0.75rem,1.3vw,0.9rem)", fontWeight: 700 }}
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>اللوحة</span>
        </button>

        {/* Center: session name + category */}
        <div className="flex flex-col items-center leading-tight">
          <span
            className="font-black text-secondary/80"
            style={{ fontSize: "clamp(0.8rem,1.6vw,1.1rem)" }}
          >
            {session?.name || "كأس حُجّة"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-secondary/40 font-medium" style={{ fontSize: "clamp(0.62rem,1.1vw,0.78rem)" }}>
              {catName}
            </span>
            <span className="text-secondary/20 text-xs">·</span>
            <span
              className="font-black"
              style={{ color: diffBadge?.color, fontSize: "clamp(0.62rem,1.1vw,0.78rem)" }}
            >
              {diffBadge?.label}
            </span>
          </div>
        </div>

        {/* Right: scores */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Team 1 */}
          <div
            className="flex flex-col items-center rounded-xl px-3 py-1.5 transition-all"
            style={{
              background: isTeam1 ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.06)",
              border: `1.5px solid ${isTeam1 ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.15)"}`,
              boxShadow: isTeam1 ? "0 0 12px rgba(239,68,68,0.2)" : "none",
            }}
          >
            <span className="text-red-300/80 font-bold leading-none truncate" style={{ fontSize: "clamp(0.6rem,1vw,0.75rem)", maxWidth: "80px" }}>
              🔴 {session?.team1_name}
            </span>
            <span className="text-secondary font-black leading-none tabular-nums" style={{ fontSize: "clamp(1.2rem,2.2vw,1.8rem)" }}>
              {teamScores.team1}
            </span>
          </div>

          <span className="text-secondary/20 font-bold text-xs">VS</span>

          {/* Team 2 */}
          <div
            className="flex flex-col items-center rounded-xl px-3 py-1.5 transition-all"
            style={{
              background: !isTeam1 ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.06)",
              border: `1.5px solid ${!isTeam1 ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.15)"}`,
              boxShadow: !isTeam1 ? "0 0 12px rgba(59,130,246,0.2)" : "none",
            }}
          >
            <span className="text-blue-300/80 font-bold leading-none truncate" style={{ fontSize: "clamp(0.6rem,1vw,0.75rem)", maxWidth: "80px" }}>
              {session?.team2_name} 🔵
            </span>
            <span className="text-secondary font-black leading-none tabular-nums" style={{ fontSize: "clamp(1.2rem,2.2vw,1.8rem)" }}>
              {teamScores.team2}
            </span>
          </div>
        </div>
      </header>

      {/* ════════════ MAIN BODY ════════════ */}
      <div className="flex-1 flex gap-3 p-3 md:p-4 overflow-hidden min-h-0">

        {/* ── QUESTION CARD (main area) ── */}
        <div
          className="flex-1 flex flex-col rounded-3xl overflow-hidden"
          style={{
            background: "rgba(15,2,5,0.88)",
            border: "1.5px solid rgba(241,225,148,0.14)",
            boxShadow: "0 0 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(241,225,148,0.07)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* ── CARD HEADER: Team | Timer | Points ── */}
          <div
            className="shrink-0 flex items-center justify-between px-5 py-3"
            style={{
              background: activeBg,
              borderBottom: `1px solid ${activeBorder}`,
            }}
          >
            {/* Active team badge */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                style={{ background: activeTeamColor, boxShadow: `0 0 8px ${activeTeamColor}` }}
              />
              <div>
                <div className="text-secondary/45 font-bold" style={{ fontSize: "clamp(0.58rem,1vw,0.7rem)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  يجيب الآن
                </div>
                <div
                  className="font-black leading-none truncate"
                  style={{ color: activeTeamColor, fontSize: "clamp(0.9rem,1.8vw,1.25rem)", maxWidth: "clamp(80px,15vw,180px)", textShadow: `0 0 12px ${activeTeamColor}60` }}
                >
                  {activeTeamName}
                </div>
              </div>
            </div>

            {/* Timer — circular, compact */}
            <div className="flex flex-col items-center gap-1.5">
              <div style={{ width: "clamp(86px,10vw,110px)", height: "clamp(86px,10vw,110px)" }}>
                <svg width="100%" height="100%" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r={R} fill="rgba(0,0,0,0.5)" stroke="rgba(241,225,148,0.08)" strokeWidth="8" />
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
                    className={timeLeft <= 10 ? "animate-countdown" : ""}
                  >
                    {timeLeft}
                  </text>
                </svg>
              </div>
              {/* Timer micro-controls */}
              <div className="flex gap-1.5 items-center">
                <button
                  data-testid="timer-pause-resume-btn"
                  onClick={() => setTimerOn(t => !t)}
                  className="rounded-lg px-2 py-1 font-black transition-all hover:scale-110 active:scale-95 flex items-center gap-1"
                  style={{
                    background: timerOn ? "rgba(251,191,36,0.15)" : "rgba(34,197,94,0.15)",
                    border: `1px solid ${timerOn ? "rgba(251,191,36,0.4)" : "rgba(34,197,94,0.4)"}`,
                    color: timerOn ? "#fbbf24" : "#4ade80",
                    fontSize: "clamp(0.55rem,0.9vw,0.72rem)",
                  }}
                >
                  {timerOn ? <Pause size={10} /> : <Play size={10} />}
                  {timerOn ? "إيقاف" : "تشغيل"}
                </button>
                <button
                  data-testid="timer-reset-btn"
                  onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(false); setTensionDone(false); }}
                  className="rounded-lg p-1.5 transition-all hover:scale-110 active:scale-95"
                  style={{ background: "rgba(156,163,175,0.12)", border: "1px solid rgba(156,163,175,0.25)", color: "rgba(209,213,219,0.7)" }}
                  title="إعادة"
                >
                  <RotateCcw size={10} />
                </button>
                <button
                  data-testid="timer-start-btn"
                  onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(true); setTensionDone(false); }}
                  className="rounded-lg px-2 py-1 font-black transition-all hover:scale-110 active:scale-95 flex items-center gap-1"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "rgba(74,222,128,0.8)", fontSize: "clamp(0.55rem,0.9vw,0.72rem)" }}
                >
                  <Play size={10} />ابدأ
                </button>
              </div>
            </div>

            {/* Points badge */}
            <div
              className="flex flex-col items-center rounded-2xl px-4 py-2"
              style={{ background: diffBadge?.bg, border: `1.5px solid ${diffBadge?.border}` }}
            >
              <span className="font-black tabular-nums" style={{ color: diffBadge?.color, fontSize: "clamp(1.5rem,3vw,2.4rem)", lineHeight: 1 }}>
                {question.difficulty}
              </span>
              <span style={{ color: diffBadge?.color, fontSize: "clamp(0.58rem,0.9vw,0.7rem)", fontWeight: 700, opacity: 0.7 }}>
                نقطة
              </span>
            </div>
          </div>

          {/* ── CARD BODY: Question text + Image ── */}
          <div className="flex-1 flex flex-col justify-center overflow-y-auto px-5 md:px-8 py-4 min-h-0">
            {isSecret ? (
              /* Secret word QR */
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="text-secondary font-black text-center" style={{ fontSize: "clamp(1.2rem,2.5vw,1.8rem)" }}>
                  وصّف الكلمة السرية
                </div>
                <div className="text-secondary/50 text-sm text-center">الملاعب يمسح الـ QR — بس هو يشوف الكلمة!</div>
                <div className="bg-white p-4 rounded-2xl" style={{ boxShadow: "0 0 40px rgba(241,225,148,0.25)" }}>
                  <QRCodeSVG value={secretUrl} size={Math.min(window.innerWidth - 100, 200)} data-testid="qr-code" />
                </div>
                <p className="text-secondary/20 text-[10px] font-mono break-all max-w-xs text-center">{secretUrl}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5">

                {/* ── QUESTION IMAGE — always rendered if url exists ── */}
                {question.image_url && (
                  <div
                    className="relative group w-full flex justify-center shrink-0"
                    data-testid="question-image-container"
                  >
                    <div className="relative inline-flex flex-col items-center gap-2">
                      {!imgLoaded && (
                        <div
                          className="animate-pulse rounded-2xl flex items-center justify-center"
                          style={{
                            width: "clamp(160px,30vw,320px)",
                            height: "clamp(100px,18vh,200px)",
                            background: "rgba(241,225,148,0.05)",
                            border: "1.5px dashed rgba(241,225,148,0.15)",
                          }}
                        >
                          <span className="text-secondary/25 text-sm">تحميل الصورة...</span>
                        </div>
                      )}
                      <img
                        src={question.image_url}
                        alt="question"
                        data-testid="question-image"
                        onLoad={() => setImgLoaded(true)}
                        onError={e => {
                          e.target.style.display = "none";
                          // Show fallback text
                          const fb = e.target.nextSibling;
                          if (fb) fb.style.display = "flex";
                        }}
                        className="object-contain rounded-2xl cursor-zoom-in transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          maxHeight: "clamp(120px,22vh,260px)",
                          maxWidth: "min(100%,480px)",
                          border: "1.5px solid rgba(241,225,148,0.18)",
                          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
                          display: imgLoaded ? "block" : "none",
                        }}
                        onClick={() => setZoomedImage(question.image_url)}
                      />
                      {/* Fallback shown on error */}
                      <div
                        className="hidden rounded-2xl items-center justify-center text-secondary/25 text-sm"
                        style={{
                          width: "clamp(160px,28vw,300px)",
                          height: "clamp(80px,14vh,140px)",
                          background: "rgba(241,225,148,0.04)",
                          border: "1.5px dashed rgba(241,225,148,0.1)",
                        }}
                      >
                        صورة السؤال
                      </div>
                      {/* Zoom overlay */}
                      {imgLoaded && (
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl cursor-zoom-in"
                          style={{ background: "rgba(0,0,0,0.35)" }}
                          onClick={() => setZoomedImage(question.image_url)}
                        >
                          <ZoomIn size={28} className="text-white" />
                        </div>
                      )}
                      {/* Zoom hint */}
                      {imgLoaded && (
                        <span className="text-secondary/25 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          انقر للتكبير
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── QUESTION TEXT ── */}
                <p
                  data-testid="question-text"
                  className="text-secondary font-bold text-center leading-relaxed"
                  style={{
                    fontSize: question.image_url
                      ? "clamp(1.25rem, 3vw, 2.4rem)"
                      : "clamp(1.5rem, 3.8vw, 3rem)",
                    textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                    maxWidth: "720px",
                    margin: "0 auto",
                  }}
                >
                  {question.text}
                </p>

              </div>
            )}
          </div>

          {/* ── CARD FOOTER: Reveal / Answer section ── */}
          <div
            className="shrink-0 px-5 py-4"
            style={{ borderTop: "1px solid rgba(241,225,148,0.08)" }}
          >
            {/* Reveal button */}
            {!showAnswer && (
              <div className="flex justify-center">
                <button
                  data-testid="reveal-answer-btn"
                  onClick={handleReveal}
                  className="font-black rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: "rgba(241,225,148,0.10)",
                    border: "2px solid rgba(241,225,148,0.45)",
                    color: "#F1E194",
                    fontSize: "clamp(0.9rem,1.8vw,1.2rem)",
                    padding: "clamp(10px,1.5vw,16px) clamp(28px,5vw,56px)",
                    boxShadow: "0 0 24px rgba(241,225,148,0.12)",
                  }}
                >
                  كشف الإجابة
                </button>
              </div>
            )}

            {/* Answer revealed */}
            {showAnswer && (
              <div className="animate-fade-in-up">
                {/* Answer image */}
                {question.answer_image_url && (
                  <div className="flex justify-center mb-3 group relative">
                    <img
                      src={question.answer_image_url}
                      alt="answer"
                      data-testid="answer-image"
                      className="object-contain rounded-xl cursor-zoom-in transition-transform hover:scale-[1.02]"
                      style={{
                        maxHeight: "clamp(70px,13vh,140px)",
                        maxWidth: "min(100%,360px)",
                        border: "1.5px solid rgba(241,225,148,0.18)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                      }}
                      onClick={() => setZoomedImage(question.answer_image_url)}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  </div>
                )}

                {/* Answer text */}
                <div className="text-secondary/45 text-xs text-center uppercase tracking-widest mb-1.5">
                  الإجابة
                </div>
                <div
                  data-testid="answer-text"
                  className="text-secondary font-black text-center"
                  style={{
                    fontSize: "clamp(1.8rem,4.5vw,3.2rem)",
                    textShadow: "0 0 30px rgba(241,225,148,0.4)",
                    lineHeight: 1.1,
                  }}
                >
                  {question.answer}
                </div>

                {/* Score assignment */}
                {!assigned && (
                  <div className="mt-4">
                    <div className="text-secondary/40 text-xs text-center mb-3 tracking-wider uppercase">من أجاب صح؟</div>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <button
                        data-testid="assign-team1-btn"
                        onClick={() => handleAssign(1)}
                        className="flex flex-col items-center justify-center rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: "linear-gradient(135deg,rgba(185,28,28,0.9),rgba(127,29,29,0.95))",
                          border: "2px solid rgba(248,113,113,0.5)",
                          padding: "clamp(10px,1.8vw,18px) clamp(20px,4vw,48px)",
                          minWidth: "clamp(140px,18vw,220px)",
                          boxShadow: "0 4px 20px rgba(239,68,68,0.3)",
                        }}
                      >
                        <span className="text-white/90 font-black leading-tight" style={{ fontSize: "clamp(0.9rem,1.6vw,1.2rem)" }}>
                          🔴 {session?.team1_name}
                        </span>
                        <span className="text-red-200 font-black tabular-nums leading-none" style={{ fontSize: "clamp(2rem,4vw,3.5rem)" }}>
                          +{question.difficulty}
                        </span>
                      </button>

                      <button
                        data-testid="assign-team2-btn"
                        onClick={() => handleAssign(2)}
                        className="flex flex-col items-center justify-center rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: "linear-gradient(135deg,rgba(29,78,216,0.9),rgba(30,58,138,0.95))",
                          border: "2px solid rgba(96,165,250,0.5)",
                          padding: "clamp(10px,1.8vw,18px) clamp(20px,4vw,48px)",
                          minWidth: "clamp(140px,18vw,220px)",
                          boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
                        }}
                      >
                        <span className="text-white/90 font-black leading-tight" style={{ fontSize: "clamp(0.9rem,1.6vw,1.2rem)" }}>
                          🔵 {session?.team2_name}
                        </span>
                        <span className="text-blue-200 font-black tabular-nums leading-none" style={{ fontSize: "clamp(2rem,4vw,3.5rem)" }}>
                          +{question.difficulty}
                        </span>
                      </button>

                      <button
                        data-testid="skip-points-btn"
                        onClick={handleSkip}
                        className="rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 self-center"
                        style={{
                          border: "1.5px solid rgba(241,225,148,0.18)",
                          color: "rgba(241,225,148,0.35)",
                          padding: "clamp(10px,1.8vw,18px) clamp(14px,2.5vw,24px)",
                        }}
                      >
                        لا أحد
                      </button>
                    </div>
                  </div>
                )}

                {/* Post-assignment CTA */}
                {assigned && (
                  <div className="mt-4 flex flex-col items-center gap-3 animate-fade-in-up">
                    {scoredTeam && (
                      <div
                        className="text-secondary font-black text-center"
                        style={{ fontSize: "clamp(1rem,2vw,1.4rem)", textShadow: "0 0 20px rgba(241,225,148,0.4)" }}
                      >
                        ✓ +{question.difficulty} ← {scoredTeam === 1 ? session?.team1_name : session?.team2_name}
                      </div>
                    )}
                    <button
                      data-testid="continue-btn"
                      onClick={handleBack}
                      className="bg-secondary text-primary font-black rounded-full transition-all hover:scale-105 active:scale-95 animate-pulse-glow"
                      style={{
                        fontSize: "clamp(1rem,1.8vw,1.3rem)",
                        padding: "clamp(10px,1.5vw,16px) clamp(28px,5vw,52px)",
                        boxShadow: "0 0 32px rgba(241,225,148,0.3)",
                      }}
                    >
                      العودة للوحة ←
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ════════════ SIDE PANEL ════════════ */}
        <aside
          className="shrink-0 flex flex-col gap-3 overflow-y-auto"
          style={{ width: "clamp(160px, 18vw, 220px)" }}
        >
          {/* Header label */}
          <div
            className="text-center rounded-2xl py-2.5 shrink-0"
            style={{
              background: "rgba(241,225,148,0.06)",
              border: "1px solid rgba(241,225,148,0.12)",
              color: "rgba(241,225,148,0.55)",
              fontSize: "clamp(0.62rem,1vw,0.75rem)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            وسائل المساعدة
          </div>

          {/* Team 1 panel */}
          <div
            className="rounded-2xl p-3 flex flex-col gap-2.5 shrink-0"
            style={{
              background: isTeam1 ? "rgba(239,68,68,0.10)" : "rgba(15,2,5,0.7)",
              border: `1.5px solid ${isTeam1 ? "rgba(239,68,68,0.35)" : "rgba(241,225,148,0.10)"}`,
              boxShadow: isTeam1 ? "0 0 16px rgba(239,68,68,0.12)" : "none",
              transition: "all 0.3s",
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isTeam1 ? "animate-pulse" : ""}`}
                style={{ background: "#f87171", boxShadow: isTeam1 ? "0 0 6px #f87171" : "none" }}
              />
              <span className="font-black truncate" style={{ color: "#f87171", fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}>
                {session?.team1_name || "الفريق الأول"}
              </span>
            </div>
            {isTeam1 && (
              <div className="text-center py-1 rounded-xl" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <span style={{ color: "#f87171", fontSize: "0.65rem", fontWeight: 700 }}>دور الإجابة</span>
              </div>
            )}
            <div className="text-center">
              <span className="text-secondary font-black tabular-nums" style={{ fontSize: "clamp(1.4rem,2.2vw,1.8rem)" }}>
                {teamScores.team1}
              </span>
              <span className="text-secondary/30 text-xs font-medium block">نقطة</span>
            </div>
            <div className="flex justify-center gap-2">
              {LIFELINES.map((icon, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-xl transition-all"
                  style={{
                    width: "clamp(28px,3vw,38px)",
                    height: "clamp(28px,3vw,38px)",
                    background: "rgba(241,225,148,0.06)",
                    border: "1px solid rgba(241,225,148,0.12)",
                    fontSize: "clamp(0.75rem,1.3vw,1rem)",
                    cursor: "default",
                  }}
                  title={["مزيد وقت","تغيير سؤال","مساعدة"][i]}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(241,225,148,0.07)" }} />

          {/* Team 2 panel */}
          <div
            className="rounded-2xl p-3 flex flex-col gap-2.5 shrink-0"
            style={{
              background: !isTeam1 ? "rgba(59,130,246,0.10)" : "rgba(15,2,5,0.7)",
              border: `1.5px solid ${!isTeam1 ? "rgba(59,130,246,0.35)" : "rgba(241,225,148,0.10)"}`,
              boxShadow: !isTeam1 ? "0 0 16px rgba(59,130,246,0.12)" : "none",
              transition: "all 0.3s",
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${!isTeam1 ? "animate-pulse" : ""}`}
                style={{ background: "#60a5fa", boxShadow: !isTeam1 ? "0 0 6px #60a5fa" : "none" }}
              />
              <span className="font-black truncate" style={{ color: "#60a5fa", fontSize: "clamp(0.7rem,1.1vw,0.85rem)" }}>
                {session?.team2_name || "الفريق الثاني"}
              </span>
            </div>
            {!isTeam1 && (
              <div className="text-center py-1 rounded-xl" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                <span style={{ color: "#60a5fa", fontSize: "0.65rem", fontWeight: 700 }}>دور الإجابة</span>
              </div>
            )}
            <div className="text-center">
              <span className="text-secondary font-black tabular-nums" style={{ fontSize: "clamp(1.4rem,2.2vw,1.8rem)" }}>
                {teamScores.team2}
              </span>
              <span className="text-secondary/30 text-xs font-medium block">نقطة</span>
            </div>
            <div className="flex justify-center gap-2">
              {LIFELINES.map((icon, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-xl transition-all"
                  style={{
                    width: "clamp(28px,3vw,38px)",
                    height: "clamp(28px,3vw,38px)",
                    background: "rgba(241,225,148,0.06)",
                    border: "1px solid rgba(241,225,148,0.12)",
                    fontSize: "clamp(0.75rem,1.3vw,1rem)",
                    cursor: "default",
                  }}
                  title={["مزيد وقت","تغيير سؤال","مساعدة"][i]}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty reminder */}
          <div
            className="rounded-2xl p-3 text-center shrink-0"
            style={{ background: diffBadge?.bg, border: `1px solid ${diffBadge?.border}` }}
          >
            <div style={{ color: diffBadge?.color, fontSize: "clamp(1.6rem,2.8vw,2.4rem)", fontWeight: 900, lineHeight: 1 }}>
              {question.difficulty}
            </div>
            <div style={{ color: diffBadge?.color, fontSize: "0.65rem", fontWeight: 700, opacity: 0.7 }}>
              {diffBadge?.label}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
