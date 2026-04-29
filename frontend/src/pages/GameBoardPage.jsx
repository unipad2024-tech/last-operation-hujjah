import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API          = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];

/* ─── Animated score counter ─── */
function ScoreCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const delta = value - prev.current, steps = 16;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (delta * i) / steps));
      if (i >= steps) { clearInterval(t); setDisplay(value); prev.current = value; }
    }, 28);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display}</span>;
}

/* ─── Confetti ─── */
function fireConfetti() {
  const colors = ["#d4af37","#f1c40f","#c9a84c","#8b6a10","#e8d4a0","#fff","#b8860b"];
  for (let i = 0; i < 100; i++) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position:"fixed", top:"-12px",
      left: Math.random()*100+"vw",
      width:  (Math.random()*9+4)+"px",
      height: (Math.random()*9+4)+"px",
      background: colors[Math.floor(Math.random()*colors.length)],
      borderRadius: Math.random()>.5?"50%":"3px",
      animation:`hj-fall ${Math.random()*3+2}s ${Math.random()}s linear forwards`,
      zIndex:9999, pointerEvents:"none",
    });
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),6000);
  }
}

/* ─────────────────────────────────────────────────────────────────────
   BRONZE COIN PALETTE — classical physical buttons
───────────────────────────────────────────────────────────────────── */
const COIN = {
  300: {
    active: {
      bg:     "linear-gradient(160deg,#7a5c3a 0%,#4a3225 55%,#3a2518 100%)",
      border: "#c9a84c",
      text:   "#fff8e1",
      shadow: "0 4px 14px rgba(60,30,10,.45), 0 1px 0 rgba(255,255,255,.18) inset, 0 -2px 0 rgba(0,0,0,.3) inset",
    },
    spent: {
      bg:     "#d8d0c4",
      border: "#b0a090",
      text:   "rgba(80,60,40,.35)",
      shadow: "inset 0 2px 4px rgba(0,0,0,.12)",
    },
  },
  600: {
    active: {
      bg:     "linear-gradient(160deg,#6a4a2e 0%,#3d2418 55%,#2e1a10 100%)",
      border: "#b8922a",
      text:   "#fff8e1",
      shadow: "0 4px 14px rgba(50,25,8,.5), 0 1px 0 rgba(255,255,255,.15) inset, 0 -2px 0 rgba(0,0,0,.3) inset",
    },
    spent: {
      bg:     "#d8d0c4",
      border: "#b0a090",
      text:   "rgba(80,60,40,.35)",
      shadow: "inset 0 2px 4px rgba(0,0,0,.12)",
    },
  },
  900: {
    active: {
      bg:     "linear-gradient(160deg,#5a3822 0%,#2d1a10 55%,#1e0e08 100%)",
      border: "#9a7520",
      text:   "#fff8e1",
      shadow: "0 4px 14px rgba(40,18,5,.55), 0 1px 0 rgba(255,255,255,.12) inset, 0 -2px 0 rgba(0,0,0,.35) inset",
    },
    spent: {
      bg:     "#d8d0c4",
      border: "#b0a090",
      text:   "rgba(80,60,40,.35)",
      shadow: "inset 0 2px 4px rgba(0,0,0,.12)",
    },
  },
};

/* ════════════════════════════════════════════════════════════════════
   CATEGORY CARD  —  parchment frame with bronze coin buttons
   [ T1 COINS ] | [ IMAGE + NAME ] | [ T2 COINS ]
════════════════════════════════════════════════════════════════════ */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const [imgErr, setImgErr] = useState(false);

  const tileKey  = (d, s) => `${cat.id}_${d}_${s}`;
  const isUsed   = (d, s) => isTileUsed(tileKey(d, s));
  const bothDone = (d)    => isUsed(d,1) && isUsed(d,2);
  const allDone  = DIFFICULTIES.every(d => bothDone(d));

  /* ── single bronze coin button ── */
  function CoinBtn({ diff, slot }) {
    const k        = tileKey(diff, slot);
    const used     = isUsed(diff, slot);
    const gone     = bothDone(diff);
    const loading  = clickingTile === k;
    const disabled = used || gone || !!clickingTile;
    const c        = used || gone ? COIN[diff].spent : COIN[diff].active;

    return (
      <button
        data-testid={`tile-${cat.id}-${diff}-${slot}`}
        disabled={disabled}
        onClick={() => !used && !gone && onTileClick(cat.id, diff, slot)}
        style={{
          width: "100%",
          height: 48,
          borderRadius: 24,
          background: c.bg,
          border: `2px solid ${c.border}`,
          color: c.text,
          boxShadow: c.shadow,
          fontFamily: "Cairo, sans-serif",
          fontWeight: 900,
          fontSize: "clamp(.76rem,.92vw,.9rem)",
          letterSpacing: ".03em",
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "transform .13s cubic-bezier(.34,1.56,.64,1), filter .13s, box-shadow .13s",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={e => {
          if (!used && !gone) {
            e.currentTarget.style.transform = "scale(1.06) translateY(-2px)";
            e.currentTarget.style.filter    = "brightness(1.18)";
            e.currentTarget.style.boxShadow = `${c.shadow}, 0 0 16px rgba(201,168,76,.4)`;
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.filter    = "";
          e.currentTarget.style.boxShadow = c.shadow;
        }}
        onMouseDown={e  => { if (!used && !gone) e.currentTarget.style.transform = "scale(.93) translateY(1px)"; }}
        onMouseUp={e    => { e.currentTarget.style.transform = ""; }}
      >
        {loading
          ? <span style={{ animation:"hj-spin .7s linear infinite", display:"inline-block" }}>◌</span>
          : used
          ? <span style={{ opacity:.4, fontSize:".9rem" }}>✓</span>
          : diff}
      </button>
    );
  }

  /* ── vertical coin column for one team ── */
  const TEAM_DOT = { 1:"#b33a3a", 2:"#2a5fa8" };

  function CoinColumn({ slot }) {
    const active = currentTurn === slot;
    const dot    = TEAM_DOT[slot];

    return (
      <div style={{
        display:"flex", flexDirection:"column",
        alignItems:"stretch", gap:7,
        width:68, flexShrink:0,
      }}>
        {/* team dot label */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"center",
          gap:4, height:18, marginBottom:1,
        }}>
          <span style={{
            width:5, height:5, borderRadius:"50%",
            background: active ? dot : "rgba(80,60,40,.25)",
            boxShadow: active ? `0 0 7px ${dot}` : "none",
            animation: active ? "hj-pulse 1.4s ease-in-out infinite" : "none",
            transition:"all .3s", flexShrink:0,
          }}/>
          <span style={{
            fontSize:".56rem", fontWeight:800,
            color: active ? dot : "rgba(80,60,40,.45)",
            fontFamily:"Cairo,sans-serif",
            letterSpacing:".05em",
            transition:"color .3s",
          }}>
            {slot===1?"الفريق ١":"الفريق ٢"}
          </span>
        </div>
        {DIFFICULTIES.map(d => <CoinBtn key={d} diff={d} slot={slot}/>)}
      </div>
    );
  }

  /* ── ornate gold frame shadow ── */
  const frameShadow = allDone
    ? "0 4px 18px rgba(100,70,30,.15)"
    : [
        "0 0 0 1px #8b6a10",
        "0 0 0 4px #c9a84c",
        "0 0 0 5px #8b6a10",
        "0 8px 32px rgba(80,50,20,.28)",
        "inset 0 1px 0 rgba(255,255,255,.55)",
      ].join(",");

  return (
    <div
      style={{
        position:"relative",
        height:"100%",
        borderRadius:20,
        overflow:"visible",
        border: allDone ? "2px solid #c8bfb0" : "2px solid #c9a84c",
        opacity: allDone ? .42 : 1,
        display:"flex", flexDirection:"row",
        alignItems:"stretch",
        background: allDone ? "#ede8e0" : "#faf9f5",
        boxShadow: frameShadow,
        transition:"transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s",
      }}
      onMouseEnter={e => {
        if (!allDone) {
          e.currentTarget.style.transform = "translateY(-4px) scale(1.012)";
          e.currentTarget.style.boxShadow = [
            "0 0 0 1px #8b6a10",
            "0 0 0 4px #c9a84c",
            "0 0 0 5px #8b6a10",
            "0 18px 48px rgba(80,50,20,.38)",
            "inset 0 1px 0 rgba(255,255,255,.55)",
          ].join(",");
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = frameShadow;
      }}
    >

      {/* ── LEFT COLUMN — Team 1 ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"14px 8px 14px 12px",
        borderRight:"1px solid rgba(201,168,76,.3)",
        flexShrink:0,
      }}>
        <CoinColumn slot={1}/>
      </div>

      {/* ── CENTER — Image + Name ── */}
      <div style={{
        flex:1, minWidth:0,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:"12px 8px", gap:8,
      }}>
        {/* image with antique frame */}
        <div style={{
          width:"100%", flex:1, minHeight:0,
          borderRadius:12, overflow:"hidden",
          position:"relative",
          border:"2px solid #c9a84c",
          boxShadow:"0 4px 20px rgba(80,50,20,.35), inset 0 0 0 2px rgba(255,255,255,.5)",
        }}>
          {cat.image_url && !imgErr ? (
            <img
              src={cat.image_url}
              alt={cat.name}
              onError={()=>setImgErr(true)}
              style={{
                width:"100%", height:"100%",
                objectFit:"cover",
                filter:"brightness(.9) saturate(.88) contrast(1.06) sepia(.08)",
                display:"block",
              }}
            />
          ) : (
            <div style={{
              width:"100%", height:"100%",
              background:"linear-gradient(160deg,#e8dfc8,#d5c8a8)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"2.6rem",
            }}>
              {cat.icon||"🎯"}
            </div>
          )}
          {/* subtle bottom vignette */}
          <div style={{
            position:"absolute", inset:0,
            background:"linear-gradient(180deg,transparent 55%,rgba(40,25,10,.22) 100%)",
          }}/>
        </div>

        {/* category name — dark on light */}
        <div style={{
          fontFamily:"Cairo, sans-serif",
          fontWeight:900,
          fontSize:"clamp(.7rem,.98vw,.9rem)",
          color:"#2c1810",
          textAlign:"center",
          letterSpacing:".04em",
          lineHeight:1.3,
          display:"flex", alignItems:"center", gap:6,
          flexShrink:0,
        }}>
          <span style={{ color:"#c9a84c", fontSize:".55em" }}>✦</span>
          {cat.name}
          <span style={{ color:"#c9a84c", fontSize:".55em" }}>✦</span>
        </div>
      </div>

      {/* ── RIGHT COLUMN — Team 2 ── */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"14px 12px 14px 8px",
        borderLeft:"1px solid rgba(201,168,76,.3)",
        flexShrink:0,
      }}>
        <CoinColumn slot={2}/>
      </div>

      {/* all-done veil */}
      {allDone && (
        <div style={{
          position:"absolute", inset:0, zIndex:10,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(240,235,225,.7)", backdropFilter:"blur(4px)",
          borderRadius:18,
        }}>
          <div style={{
            width:52, height:52, borderRadius:"50%",
            border:"2.5px solid #c9a84c",
            background:"rgba(201,168,76,.12)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"1.4rem", color:"#8b6a10",
          }}>✓</div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TEAM SCORE BADGE — solid metallic bronze
════════════════════════════════════════════════════════════════════ */
function ScoreBadge({ name, score, active, side, testId }) {
  const isRed  = side === "left";
  const accent = isRed ? "#b33a3a" : "#2a5fa8";
  const dimAcc = isRed ? "rgba(179,58,58,.6)" : "rgba(42,95,168,.6)";

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      alignItems: side==="left"?"flex-start":"flex-end",
      gap:3,
      padding:"10px 18px",
      borderRadius:16,
      background:"linear-gradient(155deg,#5c3d2a 0%,#3d2418 60%,#2a1610 100%)",
      border: active
        ? `2px solid ${accent}`
        : "2px solid #c9a84c",
      boxShadow: active
        ? `0 0 0 1px rgba(201,168,76,.3), 0 6px 24px rgba(40,20,8,.45), 0 0 18px ${accent}30, inset 0 1px 0 rgba(255,255,255,.14), inset 0 -2px 0 rgba(0,0,0,.25)`
        : "0 6px 20px rgba(40,20,8,.35), inset 0 1px 0 rgba(255,255,255,.1), inset 0 -2px 0 rgba(0,0,0,.25)",
      transition:"border-color .35s, box-shadow .35s",
      minWidth:148,
    }}>
      <div style={{
        display:"flex", alignItems:"center", gap:6,
        flexDirection: side==="left"?"row":"row-reverse",
      }}>
        <span style={{
          width:7, height:7, borderRadius:"50%",
          background: active ? accent : dimAcc,
          boxShadow: active ? `0 0 10px ${accent}` : "none",
          animation: active ? "hj-pulse 1.4s ease-in-out infinite" : "none",
          flexShrink:0, transition:"all .35s",
        }}/>
        <span style={{
          fontSize:".7rem", fontWeight:800,
          color: active ? "#f0d898" : "#c8a870",
          letterSpacing:".07em",
          fontFamily:"Cairo,sans-serif",
          transition:"color .35s",
          whiteSpace:"nowrap",
        }}>{name}</span>
      </div>
      <div
        data-testid={testId}
        style={{
          fontSize:"clamp(1.75rem,2.4vw,2.5rem)",
          fontWeight:900,
          color:"#f5e090",
          lineHeight:1,
          letterSpacing:"-.02em",
          fontFamily:"Cairo,sans-serif",
          textShadow: active ? "0 0 18px rgba(245,224,144,.45)" : "none",
          transition:"text-shadow .35s",
          textAlign: side==="left"?"left":"right",
        }}
      >
        <ScoreCounter value={score}/>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════ */
export default function GameBoardPage() {
  const navigate = useNavigate();
  const {
    session, resetGame, currentTurn, markTileUsed, isTileUsed,
    teamScores, saveSession, gameMode, tournamentState,
  } = useGame();

  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showWinner,     setShowWinner]     = useState(false);
  const [clickingTile,   setClickingTile]   = useState(null);

  const team1Name = session?.team1_name || "الفريق الأحمر";
  const team2Name = session?.team2_name || "الفريق الأخضر";

  // eslint-disable-next-line
  useEffect(()=>{ if(!session){navigate("/");return;} loadBoard(); },[]);

  const loadBoard = async () => {
    const allIds = [...(session?.team1_categories||[]),...(session?.team2_categories||[])];
    const { data:all } = await axios.get(`${API}/categories`);
    setCategories(allIds.map(id=>all.find(c=>c.id===id)).filter(Boolean));
    setLoading(false);
  };

  const refreshScores = useCallback(async () => {
    if (!session?.id) return;
    try {
      const { data } = await axios.get(`${API}/game/session/${session.id}`);
      saveSession({...session, team1_score:data.team1_score, team2_score:data.team2_score});
    } catch {}
  }, [session, saveSession]);

  useEffect(()=>{ const iv=setInterval(refreshScores,4000); return ()=>clearInterval(iv); },[refreshScores]);
  useEffect(()=>{
    const h=()=>refreshScores();
    window.addEventListener("scoreUpdated",h);
    return ()=>window.removeEventListener("scoreUpdated",h);
  },[refreshScores]);

  const handleTileClick = async (catId, difficulty, slot) => {
    const k = `${catId}_${difficulty}_${slot}`;
    if (isTileUsed(k)||clickingTile) return;
    setClickingTile(k); markTileUsed(k);
    try {
      const { data:q } = await axios.post(
        `${API}/game/session/${session.id}/question?category_id=${catId}&difficulty=${difficulty}`
      );
      navigate("/question",{state:{question:q,catId,difficulty,slot,catName:categories.find(c=>c.id===catId)?.name,turnTeam:currentTurn}});
    } catch {
      toast.error("لا يوجد أسئلة متاحة لهذه الفئة!");
    } finally {
      setClickingTile(null);
    }
  };

  const handleEndGame = () => { fireConfetti(); setShowEndConfirm(false); setShowWinner(true); };

  /* ── loading ── */
  if (loading) return (
    <div style={{
      height:"100vh", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      background:"#f2ede4", fontFamily:"Cairo,sans-serif", gap:16,
    }}>
      <div style={{
        width:44, height:44, borderRadius:"50%",
        border:"3px solid rgba(201,168,76,.25)",
        borderTop:"3px solid #c9a84c",
        animation:"hj-spin .9s linear infinite",
      }}/>
      <span style={{ color:"#8b6a10", fontSize:"1rem", fontWeight:700, letterSpacing:".06em" }}>
        جاري التحميل…
      </span>
    </div>
  );

  const allUsed = categories.every(c=>
    DIFFICULTIES.every(d=>isTileUsed(`${c.id}_${d}_1`)&&isTileUsed(`${c.id}_${d}_2`))
  );
  const winner = (allUsed||showWinner)
    ? (teamScores.team1>teamScores.team2?team1Name
       :teamScores.team2>teamScores.team1?team2Name:"تعادل")
    : null;

  /* ── modal ── */
  const Modal = ({ children }) => (
    <div style={{
      position:"fixed",inset:0,zIndex:60,
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:20,
      background:"rgba(30,20,10,.65)",
      backdropFilter:"blur(16px)",
    }}>
      <div style={{
        background:"linear-gradient(160deg,#faf6ee,#f0e8d5)",
        border:"2px solid #c9a84c",
        boxShadow:"0 0 0 1px #8b6a10, 0 32px 80px rgba(30,15,5,.55), inset 0 1px 0 rgba(255,255,255,.8)",
        borderRadius:22,
        padding:"clamp(24px,3.5vw,44px)",
        maxWidth:390, width:"100%",
        textAlign:"center",
        fontFamily:"Cairo,sans-serif",
        animation:"hj-fadein .28s cubic-bezier(.22,1,.36,1) both",
        color:"#2c1810",
      }}>
        {children}
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @keyframes hj-fall   { to{transform:translateY(110vh) rotate(560deg);opacity:0;} }
        @keyframes hj-fadein { from{opacity:0;transform:translateY(18px) scale(.96);}to{opacity:1;transform:none;} }
        @keyframes hj-pulse  { 0%,100%{opacity:1}50%{opacity:.22} }
        @keyframes hj-winner { from{opacity:0;transform:scale(.84)}to{opacity:1;transform:none;} }
        @keyframes hj-spin   { to{transform:rotate(360deg)} }
        @keyframes hj-card   { from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none;} }
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body { height:100%; }
      `}</style>

      <div style={{
        height:"100vh",
        display:"flex", flexDirection:"column",
        direction:"rtl",
        fontFamily:"Cairo,sans-serif",
        color:"#2c1810",
        position:"relative",
        overflow:"hidden",
        background:"#ede8df",
      }}>

        {/* ── Roman classical background — brighter, visible ── */}
        <div style={{
          position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
          backgroundImage:"url('/roman-bg.jpg')",
          backgroundSize:"cover", backgroundPosition:"center",
          opacity:.32,
          filter:"sepia(25%) brightness(1.08) contrast(.95)",
        }}/>
        {/* warm cream overlay — light not dark */}
        <div style={{
          position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
          background:"linear-gradient(180deg,rgba(242,235,218,.72) 0%,rgba(235,226,208,.62) 50%,rgba(228,218,198,.75) 100%)",
        }}/>
        {/* parchment paper noise */}
        <div style={{
          position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
          opacity:.04,
          backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize:"160px",
        }}/>

        {/* ══════════════════════════════════════════════════════════
            HEADER — classical parchment with gold border
        ══════════════════════════════════════════════════════════ */}
        <header style={{
          position:"relative", zIndex:10, flexShrink:0,
          display:"grid",
          gridTemplateColumns:"1fr auto 1fr",
          alignItems:"center",
          gap:12,
          padding:"10px 22px",
          background:"linear-gradient(180deg,rgba(250,245,232,.96),rgba(238,228,208,.98))",
          borderBottom:"3px solid #c9a84c",
          boxShadow:"0 4px 24px rgba(80,50,20,.22), 0 1px 0 #8b6a10, inset 0 1px 0 rgba(255,255,255,.9)",
        }}>

          {/* Team 1 */}
          <div style={{ display:"flex", alignItems:"center" }}>
            <ScoreBadge
              name={team1Name}
              score={teamScores.team1}
              active={currentTurn===1}
              side="left"
              testId="team1-score"
            />
          </div>

          {/* Center — ornate title emblem */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            {/* Emblem */}
            <div style={{
              background:"linear-gradient(145deg,#1a2a5c 0%,#0f1840 60%,#0a1230 100%)",
              border:"3px solid #c9a84c",
              boxShadow:"0 0 0 1px #8b6a10, 0 6px 22px rgba(10,18,48,.55), inset 0 1px 0 rgba(255,255,255,.15)",
              borderRadius:14,
              padding:"5px 26px 7px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            }}>
              <div style={{
                fontFamily:"Cairo,sans-serif",
                fontWeight:900,
                fontSize:"clamp(1.7rem,2.4vw,2.6rem)",
                color:"#f5e090",
                lineHeight:1.5,
                letterSpacing:".02em",
                padding:"0 4px",
                overflow:"visible",
                textShadow:"0 0 20px rgba(245,224,144,.55), 0 2px 4px rgba(0,0,0,.4)",
              }}>حُجّة</div>
              <div style={{
                fontSize:".56rem", fontWeight:700,
                color:"rgba(201,168,76,.7)",
                letterSpacing:".18em",
                textTransform:"uppercase",
                fontFamily:"Cairo,sans-serif",
                whiteSpace:"nowrap",
              }}>لعبة معرفية</div>
            </div>

            {/* Turn indicator */}
            <div
              data-testid="turn-indicator"
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"3px 14px", borderRadius:99,
                background:"rgba(201,168,76,.12)",
                border:"1px solid rgba(139,106,16,.35)",
                fontSize:".68rem", fontWeight:700,
                color:"#5c3d10",
                letterSpacing:".04em", whiteSpace:"nowrap",
              }}>
              <span style={{
                width:6, height:6, borderRadius:"50%",
                background:currentTurn===1?"#b33a3a":"#2a5fa8",
                animation:"hj-pulse 1.4s ease-in-out infinite",
              }}/>
              دور {currentTurn===1?team1Name:team2Name}
            </div>
          </div>

          {/* Team 2 + End */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10 }}>
            <ScoreBadge
              name={team2Name}
              score={teamScores.team2}
              active={currentTurn===2}
              side="right"
              testId="team2-score"
            />
            <button
              data-testid="end-game-btn"
              onClick={()=>setShowEndConfirm(true)}
              style={{
                padding:"8px 13px", borderRadius:10,
                background:"linear-gradient(145deg,#5c1a1a,#3a0e0e)",
                border:"1.5px solid rgba(179,58,58,.55)",
                color:"#f5c0c0",
                fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:".76rem",
                cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                boxShadow:"0 3px 10px rgba(80,20,20,.3), inset 0 1px 0 rgba(255,255,255,.1)",
                transition:"all .22s",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.filter="brightness(1.18)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.filter=""; }}
            >✕ إنهاء</button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════
            BOARD — 3 × 2 grid
        ══════════════════════════════════════════════════════════ */}
        <main style={{
          position:"relative", zIndex:1,
          flex:1, minHeight:0,
          display:"grid",
          gridTemplateColumns:"repeat(3,minmax(0,1fr))",
          gridTemplateRows:"repeat(2,minmax(0,1fr))",
          gap:16,
          padding:"16px 22px 20px",
        }}>
          {categories.slice(0,6).map((cat,i)=>(
            <div
              key={cat.id}
              style={{ animation:`hj-card .46s ${i*.07}s cubic-bezier(.22,1,.36,1) both`, height:"100%" }}
            >
              <CategoryCard
                cat={cat}
                isTileUsed={isTileUsed}
                clickingTile={clickingTile}
                currentTurn={currentTurn}
                onTileClick={handleTileClick}
              />
            </div>
          ))}
        </main>

        {/* ── all-done banner ── */}
        {allUsed && !showWinner && (
          <div style={{
            position:"fixed", bottom:0, left:0, right:0, zIndex:40,
            padding:"14px", textAlign:"center",
            background:"linear-gradient(0deg,rgba(245,238,220,.98),rgba(238,228,208,.98))",
            borderTop:"3px solid #c9a84c",
            boxShadow:"0 -6px 32px rgba(80,50,20,.2)",
          }}>
            <div style={{ fontWeight:900, fontSize:"1.05rem", color:"#5c3d10", marginBottom:10 }}>
              {winner==="تعادل"?"🤝 تعادل!":`🏆 ${winner} فاز!`}
            </div>
            <button
              onClick={()=>{ fireConfetti(); setShowWinner(true); }}
              style={{
                padding:"11px 30px", borderRadius:12,
                fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:".92rem",
                background:"linear-gradient(145deg,#5c3d2a,#3d2418)",
                color:"#f5e090", border:"2px solid #c9a84c",
                boxShadow:"0 4px 18px rgba(40,20,8,.35), inset 0 1px 0 rgba(255,255,255,.15)",
                cursor:"pointer",
              }}
            >عرض النتيجة النهائية</button>
          </div>
        )}

        {/* ── end-game confirm ── */}
        {showEndConfirm && (
          <Modal>
            <div style={{ fontSize:"2rem", marginBottom:10 }}>⚔️</div>
            <div style={{ fontWeight:900, fontSize:"1.22rem", color:"#2c1810", marginBottom:8 }}>إنهاء اللعبة؟</div>
            <div style={{ fontSize:".8rem", color:"rgba(44,24,16,.5)", marginBottom:24 }}>سيتم إعلان الفائز الحالي</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={handleEndGame} style={{
                padding:"10px 24px", borderRadius:10,
                fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:".9rem",
                background:"linear-gradient(145deg,#5c1a1a,#3a0e0e)",
                color:"#f5c0c0", border:"1.5px solid rgba(179,58,58,.5)",
                boxShadow:"0 3px 10px rgba(80,20,20,.3)", cursor:"pointer",
              }}>نعم، إنهاء</button>
              <button onClick={()=>setShowEndConfirm(false)} style={{
                padding:"10px 24px", borderRadius:10,
                fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:".9rem",
                background:"rgba(44,24,16,.07)", color:"rgba(44,24,16,.55)",
                border:"1px solid rgba(44,24,16,.2)", cursor:"pointer",
              }}>رجوع</button>
            </div>
          </Modal>
        )}

        {/* ── winner screen ── */}
        {showWinner && (
          <div style={{
            position:"fixed", inset:0, zIndex:70,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            padding:28, textAlign:"center",
            background:"rgba(242,235,218,.96)",
            backdropFilter:"blur(24px)",
            animation:"hj-winner .5s cubic-bezier(.22,1,.36,1) both",
            fontFamily:"Cairo,sans-serif",
          }}>
            {/* classical bg peek in winner */}
            <div style={{
              position:"absolute", inset:0, zIndex:0, pointerEvents:"none",
              backgroundImage:"url('/roman-bg.jpg')",
              backgroundSize:"cover", backgroundPosition:"center",
              opacity:.15, filter:"sepia(30%) brightness(1.1)",
            }}/>
            <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div style={{ fontSize:"clamp(3rem,7vw,5rem)", marginBottom:8 }}>🏆</div>
              <div style={{ fontSize:".78rem", fontWeight:700, color:"rgba(92,61,16,.5)", marginBottom:6, letterSpacing:".1em" }}>الفائز</div>
              <div style={{
                fontWeight:900, fontSize:"clamp(2rem,4.5vw,4rem)",
                color:"#5c3d10",
                textShadow:"0 2px 8px rgba(92,61,16,.2)",
                marginBottom:28, lineHeight:1.15,
              }}>
                {winner==="تعادل"?"🤝 تعادل!":winner}
              </div>
              <div style={{ display:"flex", gap:20, marginBottom:32 }}>
                {[{name:team1Name,score:teamScores.team1,c:"#b33a3a"},{name:team2Name,score:teamScores.team2,c:"#2a5fa8"}]
                  .map(({name,score,c})=>(
                    <div key={name} style={{
                      textAlign:"center", borderRadius:16,
                      padding:"16px 28px",
                      background:"linear-gradient(155deg,#5c3d2a,#3d2418)",
                      border:"2px solid #c9a84c",
                      boxShadow:"0 0 0 1px #8b6a10, 0 8px 28px rgba(40,20,8,.4)",
                    }}>
                      <div style={{ fontSize:".72rem", fontWeight:700, color:c==="b33a3a"?"#f5a0a0":"#90b8f0", marginBottom:6, letterSpacing:".05em" }}>{name}</div>
                      <div style={{ fontSize:"2.1rem", fontWeight:900, color:"#f5e090" }}>{score}</div>
                    </div>
                  ))}
              </div>
              <button
                onClick={()=>{
                  if(gameMode==="tournament"){
                    const ref=tournamentState?.currentMatchRef;
                    if(ref){
                      const w=teamScores.team1>=teamScores.team2?ref.team1Id:ref.team2Id;
                      navigate("/tournament/bracket",{state:{autoRecord:{roundIdx:ref.roundIdx,matchIdx:ref.matchIdx,winnerId:w}}});
                    }else{navigate("/tournament/bracket");}
                  }else{ resetGame(); navigate("/"); }
                }}
                style={{
                  padding:"13px 44px", borderRadius:12,
                  fontFamily:"Cairo,sans-serif", fontWeight:700, fontSize:".98rem",
                  background:"linear-gradient(145deg,#5c3d2a,#3d2418)",
                  color:"#f5e090", border:"2px solid #c9a84c",
                  boxShadow:"0 0 0 1px #8b6a10, 0 6px 24px rgba(40,20,8,.4), inset 0 1px 0 rgba(255,255,255,.15)",
                  cursor:"pointer",
                }}
              >
                {gameMode==="tournament"?"🏆 العودة للبطولة":"🎮 لعبة جديدة"}
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
