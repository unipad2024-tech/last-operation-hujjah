import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { X, ZoomIn, Pause, Play, RotateCcw, RefreshCw, Zap, Clock } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

/* ═══════════════════════════════════════════════════════════════════════════
   ALL LOGIC PRESERVED — UI redesigned: deep navy + glass morphism + Tajawal
   ═══════════════════════════════════════════════════════════════════════════ */

export default function QuestionPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { session, updateScore, gameSettings, switchTurn, teamScores } = useGame();
  const { question, catName, slot } = state || {};

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
  const [currentQuestion, setCurrentQuestion] = useState(question);
  const [doubleActive, setDoubleActive]       = useState(false);
  const [changingQ, setChangingQ]             = useState(false);
  const [lifelines, setLifelines]             = useState({
    1: { changeQuestion: true, doublePoints: true, extraTime: true },
    2: { changeQuestion: true, doublePoints: true, extraTime: true },
  });
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

  const handleReveal  = () => { setTimerOn(false); setShowAnswer(true); };
  const handleAssign  = async (team) => {
    if (assigned) return;
    const pts = (currentQuestion?.difficulty || 300) * (doubleActive ? 2 : 1);
    await updateScore(team, pts);
    setScoredTeam(team);
    setAssigned(true);
    playCorrect();
    window.dispatchEvent(new Event("scoreUpdated"));
    toast.success(`+${pts} ✓${doubleActive ? " ×2 🔥" : ""}`, { duration: 2000 });
  };
  const handleSkip    = () => setAssigned(true);
  const handleBack    = () => { navigate("/game"); };

  const handleChangeQuestion = async () => {
    if (!lifelines[slot]?.changeQuestion || assigned || changingQ) return;
    setChangingQ(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API}/game/session/${session?.id}/question?category_id=${currentQuestion.category_id}&difficulty=${currentQuestion.difficulty}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      const newQ = await res.json();
      setCurrentQuestion(newQ);
      setImgLoaded(false);
      setLifelines(prev => ({ ...prev, [slot]: { ...prev[slot], changeQuestion: false } }));
      toast.success("🔄 تم تغيير السؤال");
    } catch {
      toast.error("تعذّر تغيير السؤال");
    } finally {
      setChangingQ(false);
    }
  };

  const handleDoublePoints = () => {
    if (!lifelines[slot]?.doublePoints || assigned) return;
    setDoubleActive(true);
    setLifelines(prev => ({ ...prev, [slot]: { ...prev[slot], doublePoints: false } }));
    toast.success("⚡ النقاط مضاعفة عند الإجابة الصحيحة!");
  };

  const handleExtraTime = () => {
    if (!lifelines[slot]?.extraTime || assigned) return;
    setTimeLeft(prev => prev * 2);
    setLifelines(prev => ({ ...prev, [slot]: { ...prev[slot], extraTime: false } }));
    toast.success("⏱ تم مضاعفة الوقت!");
  };

  if (!question) { navigate("/game"); return null; }

  /* ── Derived ── */
  const pct      = (timeLeft / TIMER_DURATION) * 100;
  const R        = 30;
  const circ     = 2 * Math.PI * R;
  const dash     = circ * (1 - pct / 100);
  const timerCol = timeLeft > 20 ? "#43e97b" : timeLeft > 10 ? "#f5c842" : "#ff6b6b";
  const isSecret = currentQuestion?.question_type === "secret_word";
  const secretUrl = `${window.location.origin}/secret/${currentQuestion?.id}`;
  const isTeam1  = slot === 1;
  const activeTeamName = isTeam1 ? session?.team1_name : session?.team2_name;

  const diffBadge = question.difficulty === 300
    ? { label:"سهل",   color:"#43e97b", bg:"rgba(67,233,123,0.12)", border:"rgba(67,233,123,0.30)" }
    : question.difficulty === 600
    ? { label:"متوسط", color:"#f5c842", bg:"rgba(245,200,66,0.12)",  border:"rgba(245,200,66,0.30)"  }
    : { label:"صعب",   color:"#ff6b6b", bg:"rgba(255,107,107,0.12)", border:"rgba(255,107,107,0.30)" };

  const hasAnswerImg = !!currentQuestion?.answer_image_url;
  const hasAnswerTxt = !!currentQuestion?.answer;
  const answerType   = hasAnswerImg && hasAnswerTxt ? "mixed" : hasAnswerImg ? "image" : "text";

  /* ── Reusable glass style ── */
  const glass = {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{
        minHeight: "100svh",
        background: "linear-gradient(rgba(10,0,0,0.62), rgba(10,0,0,0.80)), url('https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920') center/cover fixed no-repeat",
        fontFamily: "'Tajawal', 'Cairo', sans-serif",
        direction: "rtl",
        position: "relative",
      }}
    >
      {/* Tajawal font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" />

      <style>{`
        @keyframes fadeInScale {
          from { opacity:0; transform:scale(0.88); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes answerPop {
          0%  { opacity:0; transform:scale(0.80); }
          70% { transform:scale(1.04); opacity:1; }
          100%{ transform:scale(1);   opacity:1; }
        }
        @keyframes glowPulse {
          0%,100%{ box-shadow:0 0 20px rgba(67,233,123,0.3); }
          50%    { box-shadow:0 0 40px rgba(67,233,123,0.6); }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .answer-modal-wrap  { animation: fadeIn 0.25s ease forwards; }
        .answer-modal-box   { animation: fadeInScale 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .answer-pop         { animation: answerPop 0.50s cubic-bezier(0.34,1.56,0.64,1) 0.12s both; }
        .reveal-btn:hover   { transform:translateY(-2px) !important; }
        .next-btn:hover     { background:rgba(255,255,255,0.15) !important; transform:translateY(-1px); }
      `}</style>

      {/* ════════════ ZOOM MODAL ════════════ */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background:"rgba(0,0,0,0.96)", backdropFilter:"blur(10px)" }}
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl w-full px-4" onClick={e => e.stopPropagation()}>
            <button
              style={{ position:"absolute", top:"-40px", left:"16px", color:"rgba(255,255,255,0.6)", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", fontSize:"0.9rem" }}
              onClick={() => setZoomedImage(null)}
            >
              <X size={18}/> إغلاق
            </button>
            <img src={zoomedImage} alt="zoomed" style={{ maxWidth:"100%", maxHeight:"88vh", objectFit:"contain", borderRadius:"18px", margin:"0 auto", display:"block", boxShadow:"0 0 100px rgba(0,0,0,0.95)" }} />
          </div>
        </div>
      )}

      {/* ════════════ ANSWER MODAL — full centered ════════════ */}
      {showAnswer && (
        <div
          className="answer-modal-wrap"
          style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.80)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
        >
          <div
            className="answer-modal-box"
            style={{
              background: "linear-gradient(160deg, rgba(30,27,75,0.97), rgba(15,12,41,0.99))",
              border: `1.5px solid ${scoredTeam ? "rgba(67,233,123,0.55)" : assigned ? "rgba(255,107,107,0.45)" : "rgba(255,255,255,0.14)"}`,
              borderRadius: "24px",
              padding: "clamp(28px,5vh,48px) clamp(24px,5vw,52px)",
              width: "min(580px,92vw)",
              textAlign: "center",
              boxShadow: scoredTeam
                ? "0 0 50px rgba(67,233,123,0.22), 0 30px 80px rgba(0,0,0,0.65)"
                : assigned
                ? "0 0 50px rgba(255,107,107,0.18), 0 30px 80px rgba(0,0,0,0.65)"
                : "0 30px 80px rgba(0,0,0,0.65)",
              backdropFilter: "blur(24px)",
              position: "relative",
            }}
          >
            {/* Answer label */}
            <div style={{ color:"rgba(255,255,255,0.40)", fontSize:"0.8rem", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"12px" }}>
              ✦  الإجابة  ✦
            </div>

            {/* Answer image (if any) */}
            {hasAnswerImg && (
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"16px" }}>
                <div style={{ position:"relative", display:"inline-block" }}>
                  <img
                    src={currentQuestion.answer_image_url}
                    alt="answer"
                    data-testid="answer-image"
                    onClick={() => setZoomedImage(currentQuestion.answer_image_url)}
                    onError={e => { e.target.parentElement.style.display="none"; }}
                    style={{
                      display:"block",
                      width:"clamp(120px,18vw,200px)",
                      height:"clamp(90px,14vw,150px)",
                      objectFit:"cover",
                      borderRadius:"14px",
                      border:"1.5px solid rgba(245,200,66,0.35)",
                      boxShadow:"0 0 0 3px rgba(245,200,66,0.10), 0 10px 32px rgba(0,0,0,0.65)",
                      cursor:"zoom-in",
                      transition:"transform 0.22s",
                    }}
                    onMouseEnter={e => e.target.style.transform="scale(1.04)"}
                    onMouseLeave={e => e.target.style.transform="scale(1)"}
                  />
                  <div style={{ position:"absolute", bottom:"6px", left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", borderRadius:"6px", padding:"2px 8px", color:"rgba(245,200,66,0.75)", fontSize:"0.58rem", fontWeight:800, letterSpacing:"0.06em", pointerEvents:"none", whiteSpace:"nowrap" }}>
                    اضغط للتكبير
                  </div>
                </div>
              </div>
            )}

            {/* Answer text */}
            {hasAnswerTxt && (
              <div
                className="answer-pop"
                data-testid="answer-text"
                style={{
                  fontSize: "clamp(1.8rem,4.5vw,3.2rem)",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.15,
                  marginBottom: "20px",
                  textShadow: "0 0 50px rgba(245,200,66,0.45), 0 3px 14px rgba(0,0,0,0.8)",
                }}
              >
                {currentQuestion.answer}
              </div>
            )}

            {/* Points badge */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"clamp(16px,3vh,28px)" }}>
              <div style={{
                background: "linear-gradient(135deg,#f5c842,#ff8c42)",
                color:"#1a1208", fontWeight:900,
                fontSize:"clamp(1rem,2vw,1.4rem)",
                borderRadius:"50px", padding:"8px 28px",
                boxShadow:"0 6px 20px rgba(245,200,66,0.40)",
                display:"inline-flex", alignItems:"center", gap:"6px",
              }}>
                <span>+{currentQuestion.difficulty}{doubleActive ? " ×2" : ""}</span>
                <span style={{ fontWeight:700, fontSize:"0.75em", opacity:0.75 }}>نقطة</span>
              </div>
            </div>

            {/* Assignment buttons or continue */}
            {!assigned ? (
              <div>
                <div style={{ color:"rgba(255,255,255,0.30)", fontSize:"0.78rem", fontWeight:700, letterSpacing:"0.10em", textTransform:"uppercase", marginBottom:"14px" }}>من أجاب صح؟</div>
                <div style={{ display:"flex", gap:"clamp(8px,1.5vw,14px)", justifyContent:"center", flexWrap:"wrap" }}>
                  <button
                    data-testid="assign-team1-btn"
                    onClick={() => handleAssign(1)}
                    style={{
                      background:"linear-gradient(135deg,rgba(185,28,28,0.95),rgba(100,20,20,0.98))",
                      border:"2px solid rgba(248,113,113,0.50)", borderRadius:"18px",
                      padding:"clamp(10px,1.8vh,16px) clamp(20px,3.5vw,44px)",
                      minWidth:"clamp(130px,18vw,200px)",
                      cursor:"pointer", transition:"transform 0.18s, box-shadow 0.18s",
                      display:"flex", flexDirection:"column", alignItems:"center",
                      fontFamily:"'Tajawal','Cairo',sans-serif",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}
                  >
                    <span style={{ color:"rgba(255,200,200,0.90)", fontWeight:800, fontSize:"clamp(0.85rem,1.4vw,1.05rem)", lineHeight:1.2 }}>🔴 {session?.team1_name}</span>
                    <span style={{ color:"#fca5a5", fontWeight:900, fontSize:"clamp(1.8rem,3.2vw,2.6rem)", lineHeight:1 }}>+{currentQuestion.difficulty}{doubleActive?" ×2":""}</span>
                  </button>

                  <button
                    data-testid="assign-team2-btn"
                    onClick={() => handleAssign(2)}
                    style={{
                      background:"linear-gradient(135deg,rgba(29,78,216,0.95),rgba(20,40,130,0.98))",
                      border:"2px solid rgba(96,165,250,0.50)", borderRadius:"18px",
                      padding:"clamp(10px,1.8vh,16px) clamp(20px,3.5vw,44px)",
                      minWidth:"clamp(130px,18vw,200px)",
                      cursor:"pointer", transition:"transform 0.18s",
                      display:"flex", flexDirection:"column", alignItems:"center",
                      fontFamily:"'Tajawal','Cairo',sans-serif",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}
                  >
                    <span style={{ color:"rgba(190,220,255,0.90)", fontWeight:800, fontSize:"clamp(0.85rem,1.4vw,1.05rem)", lineHeight:1.2 }}>{session?.team2_name} 🔵</span>
                    <span style={{ color:"#93c5fd", fontWeight:900, fontSize:"clamp(1.8rem,3.2vw,2.6rem)", lineHeight:1 }}>+{currentQuestion.difficulty}{doubleActive?" ×2":""}</span>
                  </button>

                  <button
                    data-testid="skip-points-btn"
                    onClick={handleSkip}
                    className="next-btn"
                    style={{
                      background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
                      color:"rgba(255,255,255,0.45)", borderRadius:"50px",
                      padding:"clamp(10px,1.8vh,16px) clamp(14px,2.2vw,22px)",
                      fontSize:"clamp(0.82rem,1.2vw,0.98rem)", fontWeight:700,
                      cursor:"pointer", transition:"all 0.22s",
                      alignSelf:"center", fontFamily:"'Tajawal','Cairo',sans-serif",
                    }}
                  >
                    لا أحد
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"14px" }}>
                {scoredTeam && (
                  <div style={{ color:"#43e97b", fontWeight:800, fontSize:"clamp(0.92rem,1.6vw,1.2rem)", textShadow:"0 0 20px rgba(67,233,123,0.5)" }}>
                    ✓ +{question.difficulty} نقطة ← {scoredTeam === 1 ? session?.team1_name : session?.team2_name}
                  </div>
                )}
                <button
                  data-testid="continue-btn"
                  onClick={handleBack}
                  style={{
                    background:"linear-gradient(135deg,#f5c842,#ff8c42)",
                    color:"#1a1208", fontWeight:800,
                    fontSize:"clamp(1rem,1.8vw,1.25rem)",
                    padding:"clamp(12px,1.8vh,18px) clamp(36px,6vw,68px)",
                    borderRadius:"50px", border:"none", cursor:"pointer",
                    boxShadow:"0 6px 28px rgba(245,200,66,0.45)",
                    transition:"transform 0.18s, box-shadow 0.18s",
                    fontFamily:"'Tajawal','Cairo',sans-serif",
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 38px rgba(245,200,66,0.60)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 6px 28px rgba(245,200,66,0.45)";}}
                >
                  العودة للوحة ←
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ TOP BAR ════════════ */}
      <header
        data-testid="question-header"
        style={{
          flexShrink:0, position:"relative", zIndex:10,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 clamp(12px,2vw,24px)",
          height:"clamp(48px,6.5vh,62px)",
          background:"rgba(255,255,255,0.07)",
          borderBottom:"1px solid rgba(255,255,255,0.09)",
          backdropFilter:"blur(14px)",
        }}
      >
        <button
          data-testid="back-to-board"
          onClick={handleBack}
          style={{ display:"flex", alignItems:"center", gap:"6px", color:"rgba(255,255,255,0.40)", fontWeight:700, fontSize:"clamp(0.72rem,1.2vw,0.88rem)", background:"none", border:"none", cursor:"pointer", transition:"color 0.18s", fontFamily:"'Tajawal','Cairo',sans-serif" }}
          onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.80)"}
          onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.40)"}
        >
          <span>←</span><span>اللوحة</span>
        </button>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"1px" }}>
          <span style={{ color:"rgba(245,200,66,0.85)", fontWeight:800, fontSize:"clamp(0.78rem,1.4vw,1rem)" }}>
            {session?.name || "حُجّة"}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ color:"rgba(255,255,255,0.38)", fontSize:"clamp(0.6rem,0.95vw,0.74rem)", fontWeight:600 }}>{catName}</span>
            <span style={{ color:"rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ color:diffBadge.color, fontSize:"clamp(0.6rem,0.95vw,0.74rem)", fontWeight:800 }}>{diffBadge.label}</span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"clamp(8px,1.4vw,14px)" }}>
          {[
            { name:session?.team1_name, score:teamScores.team1, active:isTeam1, color:"rgba(255,107,107,0.75)", activeBg:"rgba(255,107,107,0.12)", activeBorder:"rgba(255,107,107,0.40)", emoji:"🔴" },
            { name:session?.team2_name, score:teamScores.team2, active:!isTeam1, color:"rgba(96,165,250,0.75)", activeBg:"rgba(96,165,250,0.12)", activeBorder:"rgba(96,165,250,0.40)", emoji:"🔵" },
          ].map((t, i) => (
            <div key={i} style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              background: t.active ? t.activeBg : "rgba(255,255,255,0.07)",
              border:`1.5px solid ${t.active ? t.activeBorder : "rgba(255,255,255,0.20)"}`,
              borderRadius:"14px", padding:"clamp(4px,0.8vh,8px) clamp(8px,1.2vw,14px)",
              boxShadow: t.active
                ? `0 0 20px ${t.activeBorder}, 0 0 40px ${t.color.replace("0.75","0.18")}, 0 4px 14px rgba(0,0,0,0.35)`
                : "0 2px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)",
              transition:"all 0.3s",
            }}>
              <span style={{ color:t.color, fontWeight:700, fontSize:"clamp(0.58rem,0.9vw,0.72rem)", whiteSpace:"nowrap" }}>{t.emoji} {t.name}</span>
              <span style={{ color:"#f5c842", fontWeight:900, fontSize:"clamp(1.1rem,2vw,1.6rem)", lineHeight:1 }}>{t.score}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ════════════ MAIN BODY — 3-column ════════════ */}
      <div
        style={{
          flex:1, display:"grid",
          gridTemplateColumns:"clamp(155px,17vw,220px) minmax(0,1fr) clamp(155px,17vw,220px)",
          gridTemplateRows:"minmax(0, clamp(486px,85.1vh,789px))",
          gap:"clamp(8px,1vw,14px)",
          padding:"clamp(10px,1.4vw,16px)",
          overflow:"hidden", minHeight:0,
          alignContent:"start",
          position:"relative", zIndex:10,
        }}
      >
        {/* ── LEFT: Team 1 panel ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {/* Team 1 */}
          <div style={{
            ...glass,
            borderRight: `4px solid ${isTeam1 ? "#43e97b" : "#f5c842"}`,
            borderRadius:"16px",
            padding:"16px",
            background: isTeam1 ? "rgba(67,233,123,0.08)" : "rgba(255,255,255,0.07)",
            boxShadow: isTeam1 ? "0 0 24px rgba(67,233,123,0.18), 0 8px 32px rgba(0,0,0,0.35)" : "0 8px 32px rgba(0,0,0,0.35)",
            transition:"all 0.35s",
            display:"flex", flexDirection:"column", gap:"8px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
              <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#ff6b6b", boxShadow:isTeam1?"0 0 8px #ff6b6b":"none", animation:isTeam1?"pulse 2s infinite":"none", flexShrink:0 }} />
              <span style={{ color:isTeam1?"rgba(255,255,255,0.90)":"rgba(255,255,255,0.50)", fontWeight:800, fontSize:"clamp(0.78rem,1.1vw,0.95rem)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {session?.team1_name || "الفريق الأول"}
              </span>
            </div>
            {isTeam1 && (
              <div style={{ background:"rgba(67,233,123,0.14)", border:"1px solid rgba(67,233,123,0.28)", borderRadius:"8px", padding:"3px 8px", textAlign:"center", color:"#43e97b", fontSize:"0.64rem", fontWeight:800, letterSpacing:"0.04em" }}>
                يجيب الآن
              </div>
            )}
            <div style={{ textAlign:"center" }}>
              <div style={{ color:"#f5c842", fontSize:"clamp(1.9rem,3vw,2.6rem)", fontWeight:900, lineHeight:1, textShadow:"0 2px 12px rgba(245,200,66,0.4)" }}>{teamScores.team1}</div>
              <div style={{ color:"rgba(255,255,255,0.28)", fontSize:"0.62rem", fontWeight:700, marginTop:"2px" }}>نقطة</div>
            </div>
          </div>

          {/* Difficulty */}
          <div style={{ ...glass, padding:"12px", textAlign:"center", background:diffBadge.bg, border:`1px solid ${diffBadge.border}` }}>
            <div style={{ color:diffBadge.color, fontSize:"clamp(1.5rem,2.5vw,2.1rem)", fontWeight:900, lineHeight:1 }}>{question.difficulty}</div>
            <div style={{ color:diffBadge.color, fontSize:"0.62rem", fontWeight:700, opacity:0.75, marginTop:"3px" }}>{diffBadge.label}</div>
          </div>
        </div>

        {/* ── CENTER: Question panel ── */}
        <div style={{
          ...glass,
          borderRadius:"24px",
          border:"2px solid rgba(245,200,66,0.35)",
          boxShadow:"0 0 60px rgba(245,200,66,0.08), 0 20px 60px rgba(0,0,0,0.55)",
          display:"flex", flexDirection:"column",
          overflow:"hidden", minHeight:0,
        }}>

          {/* Panel header */}
          <div style={{
            flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"clamp(10px,1.4vh,16px) clamp(14px,2vw,22px)",
            background: isTeam1 ? "rgba(255,107,107,0.10)" : "rgba(96,165,250,0.10)",
            borderBottom:`1px solid ${isTeam1 ? "rgba(255,107,107,0.20)" : "rgba(96,165,250,0.20)"}`,
          }}>
            {/* Active team */}
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <div style={{ width:"10px", height:"10px", borderRadius:"50%", background: isTeam1?"#ff6b6b":"#60a5fa", boxShadow:`0 0 10px ${isTeam1?"#ff6b6b":"#60a5fa"}`, flexShrink:0 }} />
              <div>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:"0.58rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em" }}>يجيب الآن</div>
                <div style={{ color: isTeam1?"#ff6b6b":"#60a5fa", fontSize:"clamp(0.88rem,1.6vw,1.15rem)", fontWeight:900 }}>{activeTeamName}</div>
              </div>
            </div>

            {/* Timer */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"6px" }}>
              <div style={{ position:"relative", width:"clamp(72px,8.5vw,96px)", height:"clamp(72px,8.5vw,96px)" }}>
                <svg width="100%" height="100%" viewBox="0 0 70 70" style={{ overflow:"visible" }}>
                  <circle cx="35" cy="35" r={R} fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                  <circle
                    cx="35" cy="35" r={R}
                    fill="none" stroke={timerCol} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={dash}
                    transform="rotate(-90 35 35)"
                    style={{ transition:"stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                  />
                  <text x="35" y="35" textAnchor="middle" dominantBaseline="central" fill={timerCol} fontSize="17" fontWeight="900" fontFamily="Tajawal,Cairo,sans-serif">
                    {timeLeft}
                  </text>
                </svg>
              </div>
              <div style={{ display:"flex", gap:"5px" }}>
                <button
                  data-testid="timer-pause-resume-btn"
                  onClick={() => setTimerOn(t => !t)}
                  style={{ display:"flex", alignItems:"center", gap:"3px", background:timerOn?"rgba(245,200,66,0.13)":"rgba(67,233,123,0.13)", border:`1px solid ${timerOn?"rgba(245,200,66,0.35)":"rgba(67,233,123,0.35)"}`, color:timerOn?"#f5c842":"#43e97b", borderRadius:"8px", padding:"3px 7px", cursor:"pointer", fontSize:"0.58rem", fontWeight:800, fontFamily:"Tajawal,Cairo,sans-serif" }}
                >
                  {timerOn ? <Pause size={9}/> : <Play size={9}/>}
                  {timerOn?"إيقاف":"تشغيل"}
                </button>
                <button
                  data-testid="timer-reset-btn"
                  onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(false); setTensionDone(false); }}
                  style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.55)", borderRadius:"8px", padding:"4px 5px", cursor:"pointer" }}
                  title="إعادة"
                >
                  <RotateCcw size={9}/>
                </button>
                <button
                  data-testid="timer-start-btn"
                  onClick={() => { setTimeLeft(TIMER_DURATION); setTimerOn(true); setTensionDone(false); }}
                  style={{ display:"flex", alignItems:"center", gap:"3px", background:"rgba(67,233,123,0.10)", border:"1px solid rgba(67,233,123,0.28)", color:"rgba(67,233,123,0.80)", borderRadius:"8px", padding:"3px 7px", cursor:"pointer", fontSize:"0.58rem", fontWeight:800, fontFamily:"Tajawal,Cairo,sans-serif" }}
                >
                  <Play size={9}/>ابدأ
                </button>
              </div>
            </div>

            {/* Points badge */}
            <div style={{ background:"linear-gradient(135deg,#f5c842,#ff8c42)", color:"#1a1208", fontWeight:900, fontSize:"clamp(1.3rem,2.6vw,2.1rem)", borderRadius:"50px", padding:"8px 18px", textAlign:"center", boxShadow:"0 4px 16px rgba(245,200,66,0.40)", lineHeight:1 }}>
              {question.difficulty}
              <div style={{ fontSize:"0.55em", fontWeight:700, opacity:0.7, marginTop:"2px" }}>نقطة</div>
            </div>
          </div>

          {/* Panel body: image + text */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(8px,1.2vh,14px) clamp(10px,1.5vw,20px)", overflowY:"auto", minHeight:0, gap:"clamp(6px,1vh,12px)" }}>
            {isSecret ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px" }}>
                <div style={{ color:"#f5c842", fontWeight:900, textAlign:"center", fontSize:"clamp(1.2rem,2.4vw,1.8rem)" }}>وصّف الكلمة السرية</div>
                <div style={{ color:"rgba(255,255,255,0.45)", fontSize:"0.85rem", textAlign:"center" }}>الملاعب يمسح الـ QR — بس هو يشوف الكلمة!</div>
                <div style={{ background:"white", padding:"16px", borderRadius:"18px", boxShadow:"0 0 50px rgba(245,200,66,0.30)" }}>
                  <QRCodeSVG value={secretUrl} size={Math.min(window.innerWidth - 100, 200)} data-testid="qr-code" />
                </div>
                <p style={{ color:"rgba(255,255,255,0.18)", fontSize:"10px", fontFamily:"monospace", wordBreak:"break-all", maxWidth:"280px", textAlign:"center" }}>{secretUrl}</p>
              </div>
            ) : (
              <>
                {/* ── QUESTION TEXT ── */}
                <p
                  data-testid="question-text"
                  style={{
                    margin: "0 auto",
                    textAlign: "center",
                    color: "#ffffff",
                    fontWeight: 700,
                    lineHeight: 1.5,
                    textShadow: "0 2px 16px rgba(0,0,0,0.55)",
                    maxWidth: "760px",
                    flexShrink: 0,
                    fontSize: currentQuestion?.image_url
                      ? "clamp(0.95rem,2vw,1.55rem)"
                      : "clamp(1.6rem,3.8vw,3rem)",
                  }}
                >
                  {currentQuestion?.text}
                </p>

                {/* ── QUESTION IMAGE — fills remaining space ── */}
                {currentQuestion?.image_url && (
                  <div
                    data-testid="question-image-container"
                    style={{ flex:1, minHeight:0, width:"100%", display:"flex", justifyContent:"center", alignItems:"center" }}
                  >
                    <div style={{ position:"relative", maxHeight:"100%", display:"flex", alignItems:"center" }}>
                      <img
                        src={currentQuestion.image_url}
                        alt="question"
                        data-testid="question-image"
                        onLoad={() => setImgLoaded(true)}
                        onError={e => { e.target.parentElement.parentElement.style.display="none"; }}
                        onClick={() => setZoomedImage(currentQuestion.image_url)}
                        style={{
                          display: "block",
                          maxHeight: "clamp(320px,62vh,720px)",
                          maxWidth: "100%",
                          width: "100%",
                          objectFit: "contain",
                          borderRadius: "16px",
                          border: "1.5px solid rgba(245,200,66,0.28)",
                          boxShadow: "0 0 0 3px rgba(245,200,66,0.08), 0 16px 50px rgba(0,0,0,0.65)",
                          cursor: "zoom-in",
                          transition: "transform 0.25s",
                        }}
                        onMouseEnter={e=>e.target.style.transform="scale(1.015)"}
                        onMouseLeave={e=>e.target.style.transform="scale(1)"}
                      />
                      <div style={{ position:"absolute", bottom:"8px", left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.60)", backdropFilter:"blur(4px)", borderRadius:"6px", padding:"3px 10px", color:"rgba(245,200,66,0.75)", fontSize:"0.6rem", fontWeight:800, pointerEvents:"none", whiteSpace:"nowrap" }}>
                        <ZoomIn size={10} style={{ display:"inline", marginLeft:"3px", verticalAlign:"middle" }} />
                        اضغط للتكبير
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel footer: reveal button */}
          <div style={{ flexShrink:0, padding:"clamp(10px,1.5vh,16px) clamp(16px,3vw,32px)", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", justifyContent:"center" }}>
            {!showAnswer ? (
              <button
                data-testid="reveal-answer-btn"
                className="reveal-btn"
                onClick={handleReveal}
                style={{
                  background:"linear-gradient(135deg,#f5c842,#ff8c42)",
                  border:"none", borderRadius:"50px",
                  padding:"clamp(10px,1.5vh,15px) clamp(32px,5.5vw,56px)",
                  fontSize:"clamp(0.92rem,1.6vw,1.12rem)",
                  fontWeight:800, color:"#1a1208",
                  cursor:"pointer",
                  boxShadow:"0 6px 22px rgba(245,200,66,0.38)",
                  transition:"transform 0.22s, box-shadow 0.22s",
                  fontFamily:"'Tajawal','Cairo',sans-serif",
                }}
              >
                كشف الإجابة
              </button>
            ) : (
              <div style={{ color:"rgba(255,255,255,0.28)", fontSize:"clamp(0.7rem,1.1vw,0.82rem)", fontWeight:700 }}>
                ↑ الإجابة ظاهرة أعلاه
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Team 2 panel + lifelines ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {/* Team 2 */}
          <div style={{
            ...glass,
            borderRight: `4px solid ${!isTeam1 ? "#43e97b" : "#f5c842"}`,
            borderRadius:"16px",
            padding:"16px",
            background: !isTeam1 ? "rgba(67,233,123,0.08)" : "rgba(255,255,255,0.07)",
            boxShadow: !isTeam1 ? "0 0 24px rgba(67,233,123,0.18), 0 8px 32px rgba(0,0,0,0.35)" : "0 8px 32px rgba(0,0,0,0.35)",
            transition:"all 0.35s",
            display:"flex", flexDirection:"column", gap:"8px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
              <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#60a5fa", boxShadow:!isTeam1?"0 0 8px #60a5fa":"none", flexShrink:0 }} />
              <span style={{ color:!isTeam1?"rgba(255,255,255,0.90)":"rgba(255,255,255,0.50)", fontWeight:800, fontSize:"clamp(0.78rem,1.1vw,0.95rem)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {session?.team2_name || "الفريق الثاني"}
              </span>
            </div>
            {!isTeam1 && (
              <div style={{ background:"rgba(67,233,123,0.14)", border:"1px solid rgba(67,233,123,0.28)", borderRadius:"8px", padding:"3px 8px", textAlign:"center", color:"#43e97b", fontSize:"0.64rem", fontWeight:800 }}>
                يجيب الآن
              </div>
            )}
            <div style={{ textAlign:"center" }}>
              <div style={{ color:"#f5c842", fontSize:"clamp(1.9rem,3vw,2.6rem)", fontWeight:900, lineHeight:1, textShadow:"0 2px 12px rgba(245,200,66,0.4)" }}>{teamScores.team2}</div>
              <div style={{ color:"rgba(255,255,255,0.28)", fontSize:"0.62rem", fontWeight:700, marginTop:"2px" }}>نقطة</div>
            </div>
          </div>

          {/* Lifelines */}
          <div style={{ ...glass, padding:"12px 12px" }}>
            <div style={{ textAlign:"center", color:"rgba(255,255,255,0.45)", fontSize:"0.62rem", fontWeight:800, letterSpacing:"0.10em", textTransform:"uppercase", marginBottom:"12px" }}>
              وسائل المساعدة
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {[
                { key:"changeQuestion", icon: changingQ ? <RefreshCw size={18} style={{animation:"spin 1s linear infinite"}} /> : <RefreshCw size={18} />, tooltip:"يغير لك السؤال الحالي", action:handleChangeQuestion, color:"#60a5fa", bg:"rgba(96,165,250,0.15)", border:"rgba(96,165,250,0.40)" },
                { key:"doublePoints",   icon:<Zap size={18}/>,   tooltip:"يضاعف النقاط عند الإجابة الصحيحة", action:handleDoublePoints, color:"#f5c842", bg: doubleActive?"rgba(245,200,66,0.25)":"rgba(245,200,66,0.13)", border:"rgba(245,200,66,0.40)" },
                { key:"extraTime",      icon:<Clock size={18}/>, tooltip:"يزيد الوقت المتبقي",               action:handleExtraTime,    color:"#43e97b", bg:"rgba(67,233,123,0.13)",  border:"rgba(67,233,123,0.38)" },
              ].map((ll) => {
                const used = !lifelines[slot]?.[ll.key];
                return (
                  <div key={ll.key} style={{ position:"relative" }}
                    onMouseEnter={e => { const t = e.currentTarget.querySelector(".ll-tip"); if (t) t.style.opacity="1"; t.style.transform="translateY(0)"; }}
                    onMouseLeave={e => { const t = e.currentTarget.querySelector(".ll-tip"); if (t) t.style.opacity="0"; t.style.transform="translateY(-4px)"; }}
                  >
                    <div style={{ ...glass, display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px", opacity: used ? 0.35 : 1, transition:"opacity 0.2s", borderRadius:"14px" }}>
                      <button
                        onClick={ll.action}
                        disabled={used || assigned}
                        style={{
                          width:"42px", height:"42px", borderRadius:"12px",
                          background: used ? "rgba(255,255,255,0.04)" : ll.bg,
                          border:`1.5px solid ${used ? "rgba(255,255,255,0.07)" : ll.border}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          color: used ? "rgba(255,255,255,0.20)" : ll.color,
                          cursor: used || assigned ? "not-allowed" : "pointer",
                          flexShrink:0, transition:"all 0.2s",
                          boxShadow: used ? "none" : `0 0 12px ${ll.bg}`,
                        }}
                        onMouseEnter={e => { if (!used && !assigned) e.currentTarget.style.transform="scale(1.10)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                      >
                        {ll.icon}
                      </button>
                      <span style={{ color: used ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.55)", fontSize:"0.68rem", fontWeight:700 }}>
                        {used ? "✗ مستخدمة" : ll.key==="doublePoints" && doubleActive ? "✓ مفعّلة" : "متاحة"}
                      </span>
                    </div>
                    <div className="ll-tip" style={{ position:"absolute", top:"calc(100% + 6px)", right:0, left:0, background:"rgba(8,4,18,0.97)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:"9px", padding:"6px 10px", fontSize:"0.65rem", color:"rgba(255,255,255,0.92)", fontWeight:700, textAlign:"center", pointerEvents:"none", opacity:0, transform:"translateY(-4px)", transition:"opacity 0.18s, transform 0.18s", zIndex:99, backdropFilter:"blur(12px)", whiteSpace:"nowrap" }}>
                      {ll.tooltip}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
