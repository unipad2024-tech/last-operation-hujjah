import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DIFFICULTIES = [300, 600, 900];

/* ── Color palettes ── */
const LIGHT = {
  boardBg:    "linear-gradient(155deg, #F5EDD8 0%, #EDE0C0 40%, #D4C8A8 100%)",
  cardBg:     "rgba(255,250,240,0.90)",
  cardBorder: "rgba(91,14,20,0.10)",
  textMain:   "#2A0D10",
  textSub:    "#7A3A28",
  scoreBg:    "rgba(20,6,8,0.94)",
  scoreBorder:"rgba(212,160,23,0.28)",
};
const DARK = {
  boardBg:    "rgba(6,2,3,1)",
  cardBg:     "rgba(10,3,4,0.62)",
  cardBorder: "rgba(212,160,23,0.14)",
  textMain:   "#EDE0C8",
  textSub:    "rgba(212,160,23,0.72)",
  scoreBg:    "rgba(4,1,2,0.95)",
  scoreBorder:"rgba(212,160,23,0.20)",
};

const ROMAN_BG_IMG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";

/* ── Score button colors (imperial gold → amber → crimson) ── */
const DIFF_STYLE = {
  300: { bg: "linear-gradient(145deg,#C09820,#F0D045)", shadow: "rgba(192,152,32,0.65)", darkBg: "linear-gradient(145deg,#A07A18,#D4B030)" },
  600: { bg: "linear-gradient(145deg,#C45C0A,#F07830)", shadow: "rgba(196,92,10,0.65)",  darkBg: "linear-gradient(145deg,#A84C08,#D06428)" },
  900: { bg: "linear-gradient(145deg,#6E0F18,#A82030)", shadow: "rgba(110,15,24,0.70)",  darkBg: "linear-gradient(145deg,#5B0E14,#8B1A28)" },
};

function ScoreCounter({ value, dark }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (value === prev.current) return;
    setPop(true);
    const diff = value - prev.current;
    const steps = 12;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (diff * i) / steps));
      if (i >= steps) { clearInterval(t); setDisplay(value); setPop(false); prev.current = value; }
    }, 40);
    return () => clearInterval(t);
  }, [value]);

  return (
    <span className={`font-black tabular-nums inline-block transition-transform ${pop ? "scale-125" : ""}`}
      style={{ color: "#D4A820", textShadow: "0 2px 8px rgba(212,168,32,0.35)" }}>
      {display}
    </span>
  );
}

function fireConfetti() {
  const colors = ["#F1E194","#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6"];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = Math.random() * 100 + "vw";
    el.style.width = (Math.random() * 10 + 5) + "px";
    el.style.height = (Math.random() * 10 + 5) + "px";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
    el.style.animationDuration = (Math.random() * 3 + 2) + "s";
    el.style.animationDelay = Math.random() * 1 + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }
}

/* ── Score Button ── */
function ScoreBtn({ catId, diff, slot, used, clicking, onClick, dark }) {
  const ds  = DIFF_STYLE[diff];
  const key = `${catId}_${diff}_${slot}`;
  const isClicking = clicking === key;

  return (
    <button
      data-testid={`tile-${catId}-${diff}-${slot}`}
      onClick={onClick}
      disabled={used || !!clicking}
      className={`
        w-full rounded-2xl font-black text-center select-none transition-all duration-200
        ${used
          ? "opacity-20 cursor-default"
          : "hover:scale-[1.08] active:scale-95 cursor-pointer hover:-translate-y-1"}
      `}
      style={{
        background: used
          ? (dark ? "rgba(60,20,24,0.25)" : "rgba(180,160,140,0.3)")
          : (dark ? ds.darkBg : ds.bg),
        boxShadow: used ? "none" : `0 6px 18px ${ds.shadow}, 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)`,
        padding: "clamp(8px,1.5vh,18px) clamp(4px,0.8vw,10px)",
        fontSize: "clamp(1.6rem, 3.8vw, 3.5rem)",
        color: used ? (dark ? "rgba(212,160,23,0.25)" : "rgba(80,60,50,0.3)") : "#fff",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        border: used ? `1px solid rgba(212,160,23,0.08)` : "1px solid rgba(255,255,255,0.22)",
        textShadow: used ? "none" : "0 2px 6px rgba(0,0,0,0.5)",
      }}
    >
      {isClicking ? "⏳" : used ? "✓" : diff}
    </button>
  );
}

/* ── Category Card ── */
function CategoryCard({ cat, session, isTileUsed, clickingTile, onTileClick, dark }) {
  const P = dark ? DARK : LIGHT;
  const t1Cats   = session?.team1_categories || [];
  const isT1     = t1Cats.includes(cat.id);
  const teamName = isT1 ? session?.team1_name : session?.team2_name;
  const teamColor= isT1 ? "#ef4444" : "#3b82f6";

  return (
    <div
      className="category-card rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: P.cardBg,
        backdropFilter: dark ? "blur(14px)" : "blur(6px)",
        WebkitBackdropFilter: dark ? "blur(14px)" : "blur(6px)",
        border: `1.5px solid ${P.cardBorder}`,
        boxShadow: dark
          ? "0 6px 28px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,160,23,0.06)"
          : "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Team indicator strip */}
      <div className="h-1 w-full shrink-0" style={{
        background: isT1
          ? "linear-gradient(90deg, #ef4444, #c0392b)"
          : "linear-gradient(90deg, #3b82f6, #2563eb)",
        opacity: 0.9
      }} />

      {/* Content: [left buttons | center image | right buttons] */}
      <div className="flex-1 flex flex-row items-stretch gap-1.5 px-1.5 py-2">

        {/* Left column: slot 1 buttons */}
        <div className="flex flex-col justify-around gap-1.5 shrink-0" style={{ minWidth: "clamp(65px,11vw,140px)" }}>
          {DIFFICULTIES.map(diff => (
            <ScoreBtn
              key={`${cat.id}_${diff}_1`}
              catId={cat.id} diff={diff} slot={1}
              used={isTileUsed(`${cat.id}_${diff}_1`)}
              clicking={clickingTile}
              onClick={() => onTileClick(cat.id, diff, 1)}
              dark={dark}
            />
          ))}
        </div>

        {/* Center: large image + title */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 py-1">
          <div
            className="rounded-xl overflow-hidden flex items-center justify-center mb-2"
            style={{
              width:  "clamp(90px, 16vw, 230px)",
              height: "clamp(90px, 16vw, 230px)",
              background: `linear-gradient(135deg, ${cat.color || "#5B0E14"}44, ${cat.color || "#5B0E14"}11)`,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          >
            {cat.image_url ? (
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <span style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}>{cat.icon || "🎯"}</span>
            )}
          </div>

          {/* Category name */}
          <div
            className="font-black text-center leading-tight"
            style={{
              color: dark ? "#EDE0C8" : "#2A0D10",
              fontSize: "clamp(0.85rem, 1.8vw, 1.3rem)",
              fontFamily: "Cairo, sans-serif",
              maxWidth: "200px",
              textShadow: dark ? "0 1px 4px rgba(0,0,0,0.5)" : "none",
            }}
          >
            {cat.name}
          </div>

          {/* Team badge */}
          <div
            className="mt-0.5 font-bold px-3 py-0.5 rounded-full"
            style={{
              background: isT1 ? "rgba(239,68,68,0.18)" : "rgba(59,130,246,0.18)",
              color: isT1 ? "#fca5a5" : "#93c5fd",
              border: `1px solid ${isT1 ? "rgba(239,68,68,0.35)" : "rgba(59,130,246,0.35)"}`,
              fontSize: "clamp(0.65rem, 1.2vw, 0.88rem)",
              letterSpacing: "0.02em",
            }}
          >
            {teamName}
          </div>
        </div>

        {/* Right column: slot 2 buttons */}
        <div className="flex flex-col justify-around gap-1.5 shrink-0" style={{ minWidth: "clamp(65px,11vw,140px)" }}>
          {DIFFICULTIES.map(diff => (
            <ScoreBtn
              key={`${cat.id}_${diff}_2`}
              catId={cat.id} diff={diff} slot={2}
              used={isTileUsed(`${cat.id}_${diff}_2`)}
              clicking={clickingTile}
              onClick={() => onTileClick(cat.id, diff, 2)}
              dark={dark}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ QUICK HOST BAR ════════════════════════ */
function QuickHostBar({ session, currentTurn, switchTurn, adjustScoreDelta, dark }) {
  const [busy, setBusy] = useState(false);
  const P = dark ? DARK : LIGHT;

  const adj = async (team, val) => {
    if (busy) return;
    setBusy(true);
    await adjustScoreDelta(team, val);
    const tname = team === 1 ? session?.team1_name : session?.team2_name;
    toast.success(`+${val} → ${tname}`, { duration: 1200 });
    setBusy(false);
  };

  return (
    <div
      className="shrink-0 flex items-center justify-between px-3 py-1.5 gap-2"
      style={{
        background: dark
          ? "rgba(4,1,2,0.88)"
          : "rgba(20,6,8,0.85)",
        borderBottom: `1px solid ${dark ? "rgba(212,160,23,0.12)" : "rgba(212,160,23,0.2)"}`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* Team 1 quick +points */}
      <div className="flex items-center gap-1">
        <span className="font-black text-xs mr-1 hidden sm:inline" style={{ color: "rgba(252,165,165,0.85)", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          🔴 {session?.team1_name}
        </span>
        {[300, 600, 900].map(v => (
          <button
            key={`q1-${v}`}
            data-testid={`quick-t1-plus-${v}`}
            onClick={() => adj(1, v)}
            disabled={busy}
            className="rounded-lg font-black transition-all hover:scale-110 active:scale-90 disabled:opacity-40"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.40)",
              color: "#fca5a5",
              fontSize: "clamp(0.6rem,1.1vw,0.75rem)",
              padding: "clamp(3px,0.5vh,6px) clamp(5px,0.9vw,10px)",
            }}
          >
            +{v}
          </button>
        ))}
      </div>

      {/* Center: switch turn */}
      <button
        data-testid="quick-switch-turn"
        onClick={() => { switchTurn(); toast.success("تبديل الدور ⇄", { duration: 900 }); }}
        className="rounded-full font-black transition-all hover:scale-105 active:scale-95"
        style={{
          background: currentTurn === 1 ? "rgba(239,68,68,0.20)" : "rgba(59,130,246,0.20)",
          border: `1.5px solid ${currentTurn === 1 ? "rgba(239,68,68,0.65)" : "rgba(59,130,246,0.65)"}`,
          color: "#D4A820",
          fontSize: "clamp(0.65rem,1.2vw,0.85rem)",
          padding: "clamp(4px,0.6vh,8px) clamp(10px,1.5vw,18px)",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 10px rgba(212,168,32,0.15)",
        }}
      >
        ⇄ تبديل الدور
      </button>

      {/* Team 2 quick +points */}
      <div className="flex items-center gap-1">
        {[300, 600, 900].map(v => (
          <button
            key={`q2-${v}`}
            data-testid={`quick-t2-plus-${v}`}
            onClick={() => adj(2, v)}
            disabled={busy}
            className="rounded-lg font-black transition-all hover:scale-110 active:scale-90 disabled:opacity-40"
            style={{
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.40)",
              color: "#93c5fd",
              fontSize: "clamp(0.6rem,1.1vw,0.75rem)",
              padding: "clamp(3px,0.5vh,6px) clamp(5px,0.9vw,10px)",
            }}
          >
            +{v}
          </button>
        ))}
        <span className="font-black text-xs ml-1 hidden sm:inline" style={{ color: "rgba(147,197,253,0.85)", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {session?.team2_name} 🔵
        </span>
      </div>
    </div>
  );
}

/* ════════════════════════ GAME MASTER PANEL ════════════════════════ */
function GameMasterPanel({ session, teamScores, currentTurn, selectedQuestions,
  categories, adjustScoreDelta, setExactScore, setTurn, switchTurn, restoreTile, dark }) {

  const [open, setOpen]           = useState(false);
  const [adjTeam, setAdjTeam]     = useState(1);
  const [adjValue, setAdjValue]   = useState("");
  const [adjBusy, setAdjBusy]     = useState(false);
  const [editScore, setEditScore] = useState(null); // null | 1 | 2
  const [editVal, setEditVal]     = useState("");
  const [activeTab, setActiveTab] = useState("score"); // score | turn | restore

  const BG     = dark ? "rgba(8,16,6,0.98)"      : "rgba(255,252,245,0.98)";
  const TXT    = dark ? "#C7D3A4"                 : "#1a2208";
  const SUB    = dark ? "rgba(199,211,164,0.55)"  : "rgba(26,34,8,0.45)";
  const CARD   = dark ? "rgba(28,42,26,0.8)"      : "rgba(240,235,220,0.9)";
  const BORDER = dark ? "rgba(120,170,90,0.2)"    : "rgba(0,0,0,0.1)";

  const tileList = [...selectedQuestions].slice(-20).reverse();

  const parseTile = (key) => {
    const parts = key.split("_");
    const slot  = parts.pop();
    const diff  = parts.pop();
    const catId = parts.join("_");
    const cat   = categories.find(c => c.id === catId);
    return { catId, diff, slot, catName: cat?.name || catId, icon: cat?.icon || "" };
  };

  const handleAdjust = async (val) => {
    const n = parseInt(val ?? adjValue, 10);
    if (isNaN(n)) { toast.error("أدخل رقماً مثل +300 أو -200"); return; }
    setAdjBusy(true);
    await adjustScoreDelta(adjTeam, n);
    const tname = adjTeam === 1 ? session?.team1_name : session?.team2_name;
    toast.success(`${n >= 0 ? "+" : ""}${n} ← ${tname}`, { duration: 2000 });
    if (val === undefined) setAdjValue("");
    setAdjBusy(false);
  };

  const handleSetScore = async () => {
    const v = parseInt(editVal, 10);
    if (isNaN(v)) { toast.error("رقم غير صالح"); return; }
    await setExactScore(editScore, v);
    toast.success("تم تحديث النقاط مباشرة", { duration: 1500 });
    setEditScore(null); setEditVal("");
  };

  const QUICK_VALS = [300, 600, 900];
  const tabStyle = (tab) => ({
    flex: 1, padding: "7px 4px", borderRadius: "8px", fontWeight: 900,
    fontSize: "0.78rem", cursor: "pointer", transition: "all 0.15s",
    background: activeTab === tab ? "#5B0E14" : "transparent",
    color: activeTab === tab ? "#F1E194" : SUB,
    border: "none",
  });

  return (
    <>
      {/* ── Game Master Toggle Button ── */}
      <button
        data-testid="gmp-toggle-btn"
        onClick={() => setOpen(o => !o)}
        title="لوحة تحكم المضيف"
        className="fixed z-[10000] flex items-center gap-2 rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95"
        style={{
          bottom: "clamp(16px,2.5vh,28px)",
          right: "clamp(16px,2vw,28px)",
          background: open
            ? "linear-gradient(135deg,#5B0E14,#8B1520)"
            : "linear-gradient(135deg,#7A1020,#A8192A)",
          border: "2.5px solid rgba(241,225,148,0.6)",
          color: "#F1E194",
          padding: "clamp(12px,1.8vh,20px) clamp(18px,2.5vw,32px)",
          boxShadow: open
            ? "0 6px 32px rgba(91,14,20,0.65), 0 2px 8px rgba(0,0,0,0.4)"
            : "0 0 0 4px rgba(241,225,148,0.15), 0 8px 32px rgba(91,14,20,0.8), 0 2px 8px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          minWidth: "clamp(150px,15vw,200px)",
          animation: open ? "none" : "gmpPulse 2s ease-in-out infinite",
        }}
      >
        <span style={{ fontSize: "clamp(1.2rem,2vw,1.6rem)" }}>⚙</span>
        <div className="flex flex-col items-start leading-tight">
          <span style={{ fontSize: "clamp(0.85rem,1.4vw,1.05rem)", fontWeight: 900 }}>
            {open ? "إغلاق اللوحة" : "لوحة المضيف"}
          </span>
          {!open && (
            <span style={{ fontSize: "clamp(0.6rem,0.9vw,0.72rem)", opacity: 0.7, fontWeight: 600 }}>نقاط · الدور · استعادة</span>
          )}
        </div>
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.25)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Panel ── */}
      <div
        data-testid="gmp-panel"
        className="fixed top-0 right-0 h-full z-[10001] flex flex-col overflow-hidden"
        style={{
          width: "clamp(300px,28vw,360px)",
          background: BG,
          borderLeft: `2px solid ${BORDER}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.35)" : "none",
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 shrink-0 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <div className="font-black" style={{ color: TXT, fontSize: "1rem" }}>⚙ لوحة المضيف</div>
            <div style={{ color: SUB, fontSize: "0.7rem" }}>تحكم كامل في اللعبة</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 font-black transition-all hover:scale-110"
            style={{ color: SUB, fontSize: "1.1rem" }}
          >
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex px-3 py-2 gap-1 shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {[
            { id: "score",   label: "نقاط" },
            { id: "turn",    label: "الدور" },
            { id: "restore", label: "استعادة" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

          {/* ═══ TAB: SCORE ADJUSTMENT ═══ */}
          {activeTab === "score" && (
            <>
              {/* Live Score Edit */}
              <div className="rounded-xl p-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="font-black mb-2" style={{ color: TXT, fontSize: "0.8rem" }}>تعديل مباشر للنقاط</div>
                <div className="flex gap-2">
                  {[1, 2].map(t => {
                    const score  = t === 1 ? teamScores.team1 : teamScores.team2;
                    const tname  = t === 1 ? session?.team1_name : session?.team2_name;
                    const tcolor = t === 1 ? "#ef4444" : "#3b82f6";
                    return (
                      <div key={t} className="flex-1 text-center">
                        <div className="font-black truncate mb-1" style={{ color: tcolor, fontSize: "0.75rem" }}>{tname}</div>
                        {editScore === t ? (
                          <div className="flex gap-1">
                            <input
                              data-testid={`score-edit-input-t${t}`}
                              type="number"
                              autoFocus
                              value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleSetScore(); if (e.key === "Escape") setEditScore(null); }}
                              className="w-full rounded-lg px-2 py-1 font-black text-center outline-none"
                              style={{ background: "rgba(241,225,148,0.1)", border: `1px solid ${tcolor}`, color: TXT, fontSize: "1rem" }}
                              placeholder={String(score)}
                            />
                            <button
                              data-testid={`score-edit-confirm-t${t}`}
                              onClick={handleSetScore}
                              className="rounded-lg px-2 font-black text-white transition-all hover:scale-110"
                              style={{ background: tcolor, fontSize: "0.8rem" }}
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            data-testid={`score-edit-btn-t${t}`}
                            onClick={() => { setEditScore(t); setEditVal(String(score)); }}
                            className="w-full rounded-xl py-2 font-black transition-all hover:scale-105"
                            style={{
                              background: `${tcolor}18`,
                              border: `2px solid ${tcolor}55`,
                              color: tcolor,
                              fontSize: "1.4rem",
                            }}
                          >
                            {score}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delta Adjustment */}
              <div className="rounded-xl p-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="font-black mb-2" style={{ color: TXT, fontSize: "0.8rem" }}>إضافة / خصم نقاط</div>

                {/* Team selector */}
                <div className="flex gap-2 mb-3">
                  {[1, 2].map(t => {
                    const tcolor = t === 1 ? "#ef4444" : "#3b82f6";
                    const tname  = t === 1 ? session?.team1_name : session?.team2_name;
                    return (
                      <button
                        key={t}
                        data-testid={`adj-team-${t}-btn`}
                        onClick={() => setAdjTeam(t)}
                        className="flex-1 py-2 rounded-xl font-black transition-all text-sm"
                        style={{
                          background: adjTeam === t ? `${tcolor}` : `${tcolor}15`,
                          border: `2px solid ${tcolor}`,
                          color: adjTeam === t ? "white" : tcolor,
                        }}
                      >
                        {tname}
                      </button>
                    );
                  })}
                </div>

                {/* Quick buttons + / - */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {QUICK_VALS.map(v => (
                    <button
                      key={`+${v}`}
                      data-testid={`adj-plus-${v}-btn`}
                      onClick={() => handleAdjust(`+${v}`)}
                      disabled={adjBusy}
                      className="py-2 rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80" }}
                    >
                      +{v}
                    </button>
                  ))}
                  {QUICK_VALS.map(v => (
                    <button
                      key={`-${v}`}
                      data-testid={`adj-minus-${v}-btn`}
                      onClick={() => handleAdjust(`-${v}`)}
                      disabled={adjBusy}
                      className="py-2 rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}
                    >
                      -{v}
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div className="flex gap-2">
                  <input
                    data-testid="adj-custom-input"
                    type="text"
                    value={adjValue}
                    onChange={e => setAdjValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAdjust(); }}
                    placeholder="مثال: +500 أو -150"
                    className="flex-1 rounded-xl px-3 py-2 font-bold outline-none"
                    style={{
                      background: dark ? "rgba(120,170,90,0.08)" : "rgba(0,0,0,0.04)",
                      border: `1px solid ${BORDER}`,
                      color: TXT,
                      fontSize: "0.85rem",
                      textAlign: "center",
                    }}
                  />
                  <button
                    data-testid="adj-apply-btn"
                    onClick={() => handleAdjust()}
                    disabled={adjBusy}
                    className="px-4 rounded-xl font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    style={{ background: "#5B0E14", color: "#F1E194", fontSize: "0.85rem" }}
                  >
                    تطبيق
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══ TAB: TURN CONTROL ═══ */}
          {activeTab === "turn" && (
            <div className="rounded-xl p-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="font-black mb-3" style={{ color: TXT, fontSize: "0.8rem" }}>التحكم في الدور</div>

              {/* Current turn indicator */}
              <div
                className="rounded-xl px-3 py-2 text-center font-black mb-4"
                style={{
                  background: currentTurn === 1 ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
                  border: `1.5px solid ${currentTurn === 1 ? "#ef4444" : "#3b82f6"}`,
                  color: currentTurn === 1 ? "#fca5a5" : "#93c5fd",
                  fontSize: "0.9rem",
                }}
              >
                الدور الحالي: {currentTurn === 1 ? `🔴 ${session?.team1_name}` : `🔵 ${session?.team2_name}`}
              </div>

              {/* Manual set turn buttons */}
              <div className="space-y-2">
                <button
                  data-testid="set-turn-1-btn"
                  onClick={() => { setTurn(1); toast.success(`الدور: ${session?.team1_name}`, { duration: 1500 }); }}
                  className="w-full py-3 rounded-xl font-black text-base transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: currentTurn === 1 ? "#ef4444" : "rgba(239,68,68,0.15)",
                    border: "2px solid #ef4444",
                    color: currentTurn === 1 ? "white" : "#fca5a5",
                  }}
                >
                  🔴 دور {session?.team1_name}
                </button>
                <button
                  data-testid="set-turn-2-btn"
                  onClick={() => { setTurn(2); toast.success(`الدور: ${session?.team2_name}`, { duration: 1500 }); }}
                  className="w-full py-3 rounded-xl font-black text-base transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: currentTurn === 2 ? "#3b82f6" : "rgba(59,130,246,0.15)",
                    border: "2px solid #3b82f6",
                    color: currentTurn === 2 ? "white" : "#93c5fd",
                  }}
                >
                  🔵 دور {session?.team2_name}
                </button>
                <button
                  data-testid="next-turn-btn"
                  onClick={() => { switchTurn(); toast.success("تبديل الدور", { duration: 1000 }); }}
                  className="w-full py-3 rounded-xl font-black text-base transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: dark ? "rgba(120,170,90,0.15)" : "rgba(0,0,0,0.06)",
                    border: `1.5px solid ${BORDER}`,
                    color: TXT,
                  }}
                >
                  ⇄ تبديل الدور
                </button>
              </div>
            </div>
          )}

          {/* ═══ TAB: RESTORE TILE ═══ */}
          {activeTab === "restore" && (
            <div>
              <div className="font-black mb-2" style={{ color: TXT, fontSize: "0.8rem" }}>
                استعادة سؤال (يعيد البطاقة للوحة)
              </div>
              {tileList.length === 0 ? (
                <div className="text-center py-6" style={{ color: SUB, fontSize: "0.8rem" }}>
                  لا توجد أسئلة مستخدمة حتى الآن
                </div>
              ) : (
                <div className="space-y-1.5">
                  {tileList.map((key, i) => {
                    const { catName, diff, slot, icon } = parseTile(key);
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-xl px-3 py-2"
                        style={{ background: CARD, border: `1px solid ${BORDER}` }}
                      >
                        <div>
                          <div className="font-bold" style={{ color: TXT, fontSize: "0.8rem" }}>
                            {icon} {catName}
                          </div>
                          <div style={{ color: SUB, fontSize: "0.7rem" }}>
                            {diff} نقطة — فتحة {slot}
                          </div>
                        </div>
                        <button
                          data-testid={`restore-tile-${key}`}
                          onClick={() => {
                            restoreTile(key);
                            toast.success(`تمت استعادة السؤال`, { duration: 1500 });
                          }}
                          className="px-3 py-1.5 rounded-lg font-black transition-all hover:scale-110 active:scale-95"
                          style={{
                            background: "rgba(34,197,94,0.15)",
                            border: "1px solid rgba(34,197,94,0.4)",
                            color: "#4ade80",
                            fontSize: "0.75rem",
                          }}
                        >
                          استعادة
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════ Main Board ═══ */
export default function GameBoardPage() {
  const navigate = useNavigate();
  const {
    session, resetGame, darkMode, toggleDarkMode, currentTurn, switchTurn,
    markTileUsed, isTileUsed, selectedQuestions, teamScores, saveSession,
    adjustScoreDelta, setExactScore, setTurn, restoreTile, gameMode, tournamentState
  } = useGame();
  const [categories, setCategories]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWinner, setShowWinner]         = useState(false);
  const [clickingTile, setClickingTile]     = useState(null);

  const P = darkMode ? DARK : LIGHT;

  useEffect(() => {
    if (!session) { navigate("/"); return; }
    loadBoard();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!session) return;
    // selectedQuestions and teamScores are managed by GameContext
  }, [session]);

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

  useEffect(() => { const iv = setInterval(refreshScores, 4000); return () => clearInterval(iv); }, [refreshScores]);
  useEffect(() => {
    const h = () => refreshScores();
    window.addEventListener("scoreUpdated", h);
    return () => window.removeEventListener("scoreUpdated", h);
  }, [refreshScores]);

  const handleTileClick = async (catId, difficulty, slot) => {
    const key = `${catId}_${difficulty}_${slot}`;
    if (isTileUsed(key) || clickingTile) return;
    setClickingTile(key);
    // Mark tile immediately to prevent race conditions
    markTileUsed(key);
    try {
      const { data: q } = await axios.post(
        `${API}/game/session/${session.id}/question?category_id=${catId}&difficulty=${difficulty}`
      );
      navigate("/question", {
        state: { question: q, catId, difficulty, slot, catName: categories.find(c => c.id === catId)?.name, turnTeam: currentTurn }
      });
    } catch {
      toast.error("لا يوجد أسئلة متاحة لهذه الفئة!");
    } finally {
      setClickingTile(null);
    }
  };

  const handleEndGame = () => { fireConfetti(); setShowEndConfirm(false); setShowWinner(true); };

  if (loading) return (
    <div
      className="h-screen flex items-center justify-center"
      style={darkMode ? {
        backgroundImage: `linear-gradient(to bottom, rgba(6,2,3,0.85) 0%, rgba(4,1,2,0.92) 100%), url("${ROMAN_BG_IMG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
      } : { background: P.boardBg }}
    >
      <div className="text-xl font-bold animate-pulse" style={{ color: "#D4A820", fontFamily: "Cairo, sans-serif" }}>جاري تحميل اللوحة...</div>
    </div>
  );

  const allUsed = categories.every(c =>
    DIFFICULTIES.every(d => isTileUsed(`${c.id}_${d}_1`) && isTileUsed(`${c.id}_${d}_2`))
  );
  const winner = allUsed || showWinner
    ? teamScores.team1 > teamScores.team2 ? session?.team1_name
    : teamScores.team2 > teamScores.team1 ? session?.team2_name : "تعادل"
    : null;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={darkMode ? {
        minHeight: "100svh",
        backgroundImage: `linear-gradient(to bottom, rgba(6,2,3,0.82) 0%, rgba(4,1,2,0.90) 100%), url("${ROMAN_BG_IMG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 20%",
        backgroundAttachment: "fixed",
      } : {
        minHeight: "100svh",
        background: P.boardBg,
      }}
    >
      <style>{`
        .category-card { transition: transform 0.28s ease, box-shadow 0.28s ease !important; }
        .category-card:hover { transform: translateY(-5px) !important; box-shadow: 0 14px 42px rgba(212,160,23,0.22), 0 6px 18px rgba(0,0,0,0.5) !important; }
        @keyframes gmpPulse { 0%,100% { box-shadow: 0 0 0 4px rgba(241,225,148,0.12), 0 8px 32px rgba(91,14,20,0.8); } 50% { box-shadow: 0 0 0 8px rgba(241,225,148,0.22), 0 8px 40px rgba(91,14,20,0.95); } }
      `}</style>

      {/* ── Score Bar ── */}
      <div
        className="shrink-0 border-b"
        style={{
          background: P.scoreBg,
          borderColor: P.scoreBorder,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between px-3 md:px-5 py-2 md:py-3 gap-2 md:gap-4">

          {/* ── Team 1 Score Block ── */}
          <div
            data-testid="team1-score"
            className="flex flex-col items-center justify-center rounded-2xl px-3 md:px-6 py-2 md:py-3 transition-all duration-500 flex-1"
            style={{
              background:  currentTurn === 1 ? "rgba(180,30,40,0.22)" : "rgba(180,30,40,0.07)",
              border:      `2px solid ${currentTurn === 1 ? "rgba(220,50,60,0.80)" : "rgba(180,30,40,0.20)"}`,
              boxShadow:   currentTurn === 1 ? "0 0 24px rgba(220,50,60,0.40), 0 0 50px rgba(180,30,40,0.15)" : "none",
              minWidth:    "clamp(120px,18vw,260px)",
              maxWidth:    "300px",
            }}
          >
            <span
              className="font-black leading-tight text-center truncate w-full mb-0.5"
              style={{ fontSize: "clamp(1.1rem, 2.8vw, 2.2rem)", color: "#fca5a5", maxWidth: "260px", fontFamily: "Cairo, sans-serif" }}
            >
              🔴 {session?.team1_name}
            </span>
            <span
              className="font-black tabular-nums leading-none"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4.2rem)", color: "#D4A820", textShadow: "0 2px 10px rgba(212,168,32,0.4)" }}
            >
              <ScoreCounter value={teamScores.team1} dark={darkMode} />
            </span>
          </div>

          {/* ── Center: Logo + LARGE Turn Indicator + Controls ── */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {/* Game title */}
            <div
              className="font-black leading-none"
              style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)", fontFamily: "Cairo, sans-serif", color: "#D4A820", textShadow: "0 2px 8px rgba(212,168,32,0.35)" }}
            >
              حُجّة
            </div>

            {/* ═══ LARGE TURN INDICATOR ═══ */}
            <div
              data-testid="turn-indicator"
              className="flex items-center gap-2 rounded-xl font-black transition-all duration-500 text-center"
              style={{
                background:   currentTurn === 1 ? "rgba(180,30,40,0.28)" : "rgba(37,99,235,0.28)",
                border:       `2px solid ${currentTurn === 1 ? "rgba(220,50,60,0.85)" : "rgba(59,130,246,0.85)"}`,
                color:        currentTurn === 1 ? "#fca5a5" : "#93c5fd",
                fontSize:     "clamp(0.8rem, 2vw, 1.3rem)",
                padding:      "clamp(5px,0.9vh,12px) clamp(12px,1.8vw,24px)",
                boxShadow:    currentTurn === 1
                  ? "0 0 20px rgba(220,50,60,0.50), 0 0 40px rgba(180,30,40,0.18)"
                  : "0 0 20px rgba(59,130,246,0.50), 0 0 40px rgba(37,99,235,0.18)",
                whiteSpace:   "nowrap",
                animation:    "pulse 1.8s ease-in-out infinite",
              }}
            >
              <span style={{ fontSize: "clamp(1rem, 1.8vw, 1.4rem)" }}>{currentTurn === 1 ? "🔴" : "🔵"}</span>
              <span>دور {currentTurn === 1 ? session?.team1_name : session?.team2_name}</span>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 mt-0.5">
              <button
                data-testid="dark-mode-toggle"
                onClick={toggleDarkMode}
                title={darkMode ? "الوضع الفاتح" : "الوضع الداكن"}
                className="flex items-center gap-1.5 font-bold rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: darkMode ? "rgba(120,170,90,0.3)" : "rgba(200,200,150,0.2)",
                  color:      darkMode ? "#C7D3A4" : "#F1E194",
                  border:     `1.5px solid ${darkMode ? "rgba(120,170,90,0.5)" : "rgba(241,225,148,0.3)"}`,
                  fontSize:   "clamp(0.65rem, 1.2vw, 0.85rem)",
                  padding:    "clamp(3px,0.5vh,7px) clamp(8px,1.2vw,14px)",
                }}
              >
                <span>{darkMode ? "☀️" : "🌙"}</span>
                <span>{darkMode ? "فاتح" : "داكن"}</span>
              </button>
              <button
                data-testid="end-game-btn"
                onClick={() => setShowEndConfirm(true)}
                className="font-bold rounded-full transition-all duration-200 hover:scale-105 hover:opacity-80"
                style={{
                  color:    "rgba(241,225,148,0.4)",
                  border:   "1px solid rgba(241,225,148,0.15)",
                  fontSize: "clamp(0.6rem, 1vw, 0.75rem)",
                  padding:  "clamp(3px,0.4vh,6px) clamp(6px,1vw,12px)",
                }}
              >
                إنهاء
              </button>
            </div>
          </div>

          {/* ── Team 2 Score Block ── */}
          <div
            data-testid="team2-score"
            className="flex flex-col items-center justify-center rounded-2xl px-3 md:px-6 py-2 md:py-3 transition-all duration-500 flex-1"
            style={{
              background:  currentTurn === 2 ? "rgba(37,99,235,0.22)" : "rgba(37,99,235,0.07)",
              border:      `2px solid ${currentTurn === 2 ? "rgba(59,130,246,0.80)" : "rgba(37,99,235,0.20)"}`,
              boxShadow:   currentTurn === 2 ? "0 0 24px rgba(59,130,246,0.40), 0 0 50px rgba(37,99,235,0.15)" : "none",
              minWidth:    "clamp(120px,18vw,260px)",
              maxWidth:    "300px",
            }}
          >
            <span
              className="font-black leading-tight text-center truncate w-full mb-0.5"
              style={{ fontSize: "clamp(1.1rem, 2.8vw, 2.2rem)", color: "#93c5fd", maxWidth: "260px", fontFamily: "Cairo, sans-serif" }}
            >
              {session?.team2_name} 🔵
            </span>
            <span
              className="font-black tabular-nums leading-none"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4.2rem)", color: "#D4A820", textShadow: "0 2px 10px rgba(212,168,32,0.4)" }}
            >
              <ScoreCounter value={teamScores.team2} dark={darkMode} />
            </span>
          </div>

        </div>
      </div>

      {/* ── Quick Host Bar (always visible) ── */}
      <QuickHostBar
        session={session}
        currentTurn={currentTurn}
        switchTurn={switchTurn}
        adjustScoreDelta={adjustScoreDelta}
        dark={darkMode}
      />

      {/* ── Game Board: responsive grid ── */}
      <div
        className="flex-1 p-2 md:p-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridAutoRows: "1fr",
          gap: "clamp(6px, 1.2vw, 16px)",
          overflow: "hidden",
        }}
      >
        {categories.slice(0, 6).map(cat => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            session={session}
            isTileUsed={isTileUsed}
            clickingTile={clickingTile}
            onTileClick={handleTileClick}
            dark={darkMode}
          />
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="shrink-0 flex justify-center gap-6 pb-1.5 pt-0.5">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-500 ${currentTurn === 1 ? "bg-red-500/10" : ""}`}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }} />
          <span className="font-bold" style={{ color: currentTurn === 1 ? "#fca5a5" : "rgba(212,160,23,0.55)", fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)", fontFamily: "Cairo, sans-serif" }}>{session?.team1_name}</span>
          {currentTurn === 1 && <span className="font-black" style={{ color: "#fca5a5", fontSize: "clamp(0.55rem, 1vw, 0.7rem)" }}>← دوره</span>}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-500 ${currentTurn === 2 ? "bg-blue-500/10" : ""}`}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }} />
          <span className="font-bold" style={{ color: currentTurn === 2 ? "#93c5fd" : "rgba(212,160,23,0.55)", fontSize: "clamp(0.65rem, 1.2vw, 0.85rem)", fontFamily: "Cairo, sans-serif" }}>{session?.team2_name}</span>
          {currentTurn === 2 && <span className="font-black" style={{ color: "#93c5fd", fontSize: "clamp(0.55rem, 1vw, 0.7rem)" }}>← دوره</span>}
        </div>
      </div>

      {/* ── All-used banner ── */}
      {allUsed && !showWinner && (
        <div
          className="fixed bottom-0 inset-x-0 p-4 text-center z-40 border-t-2"
          style={{
            background: "linear-gradient(135deg, #5B0E14, #8B1520)",
            borderColor: "rgba(212,160,23,0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="font-black text-xl mb-3" style={{ color: "#D4A820" }}>
            {winner === "تعادل" ? "🤝 تعادل!" : `🏆 ${winner} فاز!`}
          </div>
          <button
            onClick={() => { fireConfetti(); setShowWinner(true); }}
            className="px-8 py-3 rounded-full font-black text-lg hover:scale-105 transition-all"
            style={{ background: "linear-gradient(135deg,#D4A820,#F0C530)", color: "#2A0D10" }}
          >
            عرض النتيجة النهائية
          </button>
        </div>
      )}

      {/* ── End Confirm ── */}
      {showEndConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(4,1,2,0.85)", backdropFilter: "blur(10px)" }}>
          <div
            className="rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            style={{
              background: "rgba(12,4,6,0.92)",
              border: "1px solid rgba(212,160,23,0.25)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,160,23,0.1)",
            }}
          >
            <div className="text-2xl font-black mb-2" style={{ color: "#D4A820", fontFamily: "Cairo, sans-serif" }}>إنهاء اللعبة؟</div>
            <div className="mb-6 text-sm" style={{ color: "rgba(212,160,23,0.55)" }}>سيتم إعلان الفائز الحالي</div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleEndGame}
                className="px-6 py-3 rounded-full font-black hover:scale-105 transition-all"
                style={{ background: "linear-gradient(135deg,#5B0E14,#8B1520)", color: "#D4A820", border: "1px solid rgba(212,160,23,0.3)" }}
              >
                نعم، إنهاء
              </button>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="px-6 py-3 rounded-full font-bold transition-all hover:bg-white/5"
                style={{ border: "1px solid rgba(212,160,23,0.2)", color: "rgba(212,160,23,0.55)" }}
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Winner Screen ── */}
      {showWinner && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center z-50 px-6 text-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(6,2,3,0.90) 0%, rgba(4,1,2,0.95) 100%), url("${ROMAN_BG_IMG}")`,
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
          }}
        >
          <div style={{ fontSize: "clamp(4rem,8vw,7rem)" }} className="mb-4">🏆</div>
          <div className="text-lg font-bold mb-2" style={{ color: "rgba(212,160,23,0.55)", fontFamily: "Cairo, sans-serif" }}>الفائز</div>
          <div
            className="text-5xl md:text-7xl font-black mb-4"
            style={{
              color: "#D4A820",
              fontFamily: "Cairo,sans-serif",
              textShadow: "0 4px 20px rgba(212,168,32,0.45), 0 0 60px rgba(212,168,32,0.15)",
            }}
          >
            {winner === "تعادل" ? "🤝 تعادل!" : winner}
          </div>
          <div className="flex gap-8 mb-8">
            <div
              className="text-center rounded-2xl px-6 py-4"
              style={{ background: "rgba(180,30,40,0.15)", border: "1px solid rgba(220,50,60,0.30)" }}
            >
              <div className="text-sm font-bold mb-1" style={{ color: "#fca5a5", fontFamily: "Cairo, sans-serif" }}>{session?.team1_name}</div>
              <div className="text-3xl font-black" style={{ color: "#D4A820" }}>{teamScores.team1}</div>
            </div>
            <div className="flex items-center font-black" style={{ color: "rgba(212,160,23,0.35)", fontSize: "1.5rem" }}>VS</div>
            <div
              className="text-center rounded-2xl px-6 py-4"
              style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(59,130,246,0.30)" }}
            >
              <div className="text-sm font-bold mb-1" style={{ color: "#93c5fd", fontFamily: "Cairo, sans-serif" }}>{session?.team2_name}</div>
              <div className="text-3xl font-black" style={{ color: "#D4A820" }}>{teamScores.team2}</div>
            </div>
          </div>
          <button
            onClick={() => {
              if (gameMode === "tournament") {
                const ref = tournamentState?.currentMatchRef;
                if (ref) {
                  const winnerId = teamScores.team1 >= teamScores.team2 ? ref.team1Id : ref.team2Id;
                  navigate("/tournament/bracket", { state: { autoRecord: { roundIdx: ref.roundIdx, matchIdx: ref.matchIdx, winnerId } } });
                } else {
                  navigate("/tournament/bracket");
                }
              } else {
                resetGame(); navigate("/");
              }
            }}
            className="px-10 py-4 rounded-full font-black text-xl hover:scale-105 transition-all"
            style={{
              background: "linear-gradient(135deg,#C09820,#F0D045)",
              color: "#1A0A0B",
              boxShadow: "0 6px 30px rgba(192,152,32,0.45)",
            }}
          >
            {gameMode === "tournament" ? "🏆 العودة للبطولة" : "🎮 لعبة جديدة"}
          </button>
        </div>
      )}
    </div>
  );
}
