import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import axios from "axios";
import { toast } from "sonner";

const API          = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const DIFFICULTIES = [300, 600, 900];

function ScoreCounter({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const delta = value - prev.current, steps = 14;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(Math.round(prev.current + (delta * i) / steps));
      if (i >= steps) { clearInterval(t); setDisplay(value); prev.current = value; }
    }, 30);
    return () => clearInterval(t);
  }, [value]);
  return <span>{display}</span>;
}

function fireConfetti() {
  const colors = ["#d4af37","#f1c40f","#e74c3c","#27ae60","#a78bfa","#fff"];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position:"fixed", top:"-10px", left:Math.random()*100+"vw",
      width:(Math.random()*8+4)+"px", height:(Math.random()*8+4)+"px",
      background:colors[Math.floor(Math.random()*colors.length)],
      borderRadius:Math.random()>.5?"50%":"2px",
      animation:`fall ${Math.random()*3+2}s ${Math.random()}s linear forwards`,
      zIndex:9999, pointerEvents:"none",
    });
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),5500);
  }
}

/* ─── CATEGORY CARD ───────────────────────────────────────────────────
   Layout: image fills entire card as background
   ┌────────────────────────────────┐
   │  ✦ Category Name ✦            │  ← name overlay top
   │                                │
   │       [full image bg]          │
   │                                │
   │  ┌──────────┬──────────────┐   │
   │  │ T1  btns │  T2  btns   │   │  ← button strip bottom
   │  │ 300│600│900 │ 300│600│900 │  │
   │  └──────────┴──────────────┘   │
   └────────────────────────────────┘
─────────────────────────────────────────────────────────────────────── */
function CategoryCard({ cat, isTileUsed, clickingTile, onTileClick, currentTurn }) {
  const [imgErr, setImgErr] = useState(false);

  const key     = (d, s) => `${cat.id}_${d}_${s}`;
  const used    = (d, s) => isTileUsed(key(d, s));
  const bothOut = (d)    => used(d,1) && used(d,2);
  const allDone = DIFFICULTIES.every(d => bothOut(d));

  const diffColor = {
    300: { bg:"#16543a", border:"#27ae60", text:"#7effc2", glow:"rgba(39,174,96,.6)" },
    600: { bg:"#5c3a00", border:"#c97d0a", text:"#ffd07a", glow:"rgba(201,125,10,.6)" },
    900: { bg:"#5c1010", border:"#c0392b", text:"#ff9d9d", glow:"rgba(192,57,43,.6)" },
  };

  function Btn({ diff, slot }) {
    const k        = key(diff, slot);
    const isUsed   = used(diff, slot);
    const allGone  = bothOut(diff);
    const clicking = clickingTile === k;
    const isMyTurn = currentTurn === slot;
    const disabled = isUsed || allGone || !!clickingTile || !isMyTurn;
    const c        = diffColor[diff];

    const style = isUsed || allGone
      ? { background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.18)", cursor:"default" }
      : !isMyTurn
      ? { background:"rgba(0,0,0,.4)", border:`1px solid ${c.border}33`, color:`${c.text}44`, cursor:"not-allowed" }
      : { background:c.bg, border:`1px solid ${c.border}`, color:c.text, cursor:"pointer",
          boxShadow:`0 0 14px ${c.glow}, inset 0 1px 0 rgba(255,255,255,.12)` };

    return (
      <button
        data-testid={`tile-${cat.id}-${diff}-${slot}`}
        disabled={disabled}
        onClick={() => isMyTurn && !isUsed && !allGone && onTileClick(cat.id, diff, slot)}
        style={{
          ...style,
          flex:1, height:"100%",
          border:"none",
          borderRadius:8,
          fontFamily:"'Cairo',sans-serif",
          fontWeight:900,
          fontSize:"clamp(.75rem,1vw,.95rem)",
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"transform .15s, filter .15s",
          ...((isMyTurn && !isUsed && !allGone) ? {} : {}),
        }}
        onMouseEnter={e => { if (isMyTurn && !isUsed && !allGone) { e.currentTarget.style.transform="scale(1.08)"; e.currentTarget.style.filter="brightness(1.15)"; }}}
        onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.filter=""; }}
        onMouseDown={e  => { if (isMyTurn && !isUsed && !allGone) e.currentTarget.style.transform="scale(.93)"; }}
        onMouseUp={e    => { e.currentTarget.style.transform=""; }}
      >
        {clicking ? "·" : isUsed ? "✓" : diff}
      </button>
    );
  }

  return (
    <div style={{
      position:"relative",
      borderRadius:18,
      overflow:"hidden",
      border: allDone ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(212,175,55,.28)",
      opacity: allDone ? .35 : 1,
      display:"flex", flexDirection:"column",
      boxShadow:"0 4px 32px rgba(0,0,0,.55)",
      transition:"transform .25s, box-shadow .25s",
    }}
    onMouseEnter={e => { if(!allDone){ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 48px rgba(0,0,0,.65), 0 0 0 1px rgba(212,175,55,.38)"; }}}
    onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 32px rgba(0,0,0,.55)"; }}
    >

      {/* ── IMAGE fills card ── */}
      <div style={{ position:"absolute", inset:0, zIndex:0 }}>
        {cat.image_url && !imgErr ? (
          <img src={cat.image_url} alt={cat.name} onError={()=>setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(.55) saturate(.75)" }} />
        ) : (
          <div style={{
            width:"100%", height:"100%",
            background:`linear-gradient(160deg,#1a1a2e,#12101a)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"3.5rem",
          }}>{cat.icon || "🎯"}</div>
        )}
        {/* gradient overlays */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(0,0,0,.52) 0%,transparent 38%,transparent 48%,rgba(0,0,0,.82) 100%)" }} />
      </div>

      {/* ── CATEGORY NAME ── top overlay */}
      <div style={{
        position:"relative", zIndex:1,
        padding:"14px 16px 10px",
        textAlign:"center",
        fontFamily:"'Cairo',sans-serif",
        fontWeight:900,
        fontSize:"clamp(.85rem,1.2vw,1.05rem)",
        color:"#f5e090",
        textShadow:"0 0 14px rgba(212,175,55,.6), 0 2px 6px rgba(0,0,0,.9)",
        letterSpacing:".04em",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      }}>
        <span style={{ color:"rgba(212,175,55,.5)", fontSize:".65em" }}>✦</span>
        {cat.name}
        <span style={{ color:"rgba(212,175,55,.5)", fontSize:".65em" }}>✦</span>
      </div>

      {/* spacer — pushes buttons to bottom */}
      <div style={{ flex:1 }} />

      {/* ── BUTTON STRIP ── bottom */}
      <div style={{
        position:"relative", zIndex:1,
        padding:"10px 12px 12px",
        display:"grid",
        gridTemplateColumns:"1fr 1px 1fr",
        gap:0,
      }}>
        {/* Team 1 — slot 1 */}
        <div style={{ display:"flex", flexDirection:"column", gap:5, paddingRight:8 }}>
          <div style={{ fontSize:".58rem", fontWeight:700, color:"rgba(231,76,60,.7)", textAlign:"center", letterSpacing:".08em", marginBottom:2, fontFamily:"Cairo,sans-serif" }}>
            {currentTurn===1 ? "● دورك" : "الفريق 1"}
          </div>
          <div style={{ display:"flex", gap:4, height:38 }}>
            {DIFFICULTIES.map(d => <Btn key={d} diff={d} slot={1} />)}
          </div>
        </div>

        {/* divider */}
        <div style={{ background:"rgba(212,175,55,.18)", margin:"0 0" }} />

        {/* Team 2 — slot 2 */}
        <div style={{ display:"flex", flexDirection:"column", gap:5, paddingLeft:8 }}>
          <div style={{ fontSize:".58rem", fontWeight:700, color:"rgba(39,174,96,.7)", textAlign:"center", letterSpacing:".08em", marginBottom:2, fontFamily:"Cairo,sans-serif" }}>
            {currentTurn===2 ? "● دورك" : "الفريق 2"}
          </div>
          <div style={{ display:"flex", gap:4, height:38 }}>
            {DIFFICULTIES.map(d => <Btn key={d} diff={d} slot={2} />)}
          </div>
        </div>
      </div>

      {allDone && (
        <div style={{
          position:"absolute", inset:0, zIndex:3,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(0,0,0,.55)", backdropFilter:"blur(4px)",
          borderRadius:18,
        }}>
          <div style={{
            width:52, height:52, borderRadius:"50%",
            border:"2px solid rgba(212,175,55,.5)",
            background:"rgba(212,175,55,.08)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"1.4rem", color:"#d4af37",
          }}>✓</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════ */
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
    setCategories(allIds.map(id=>all.find(c=>c.id===id)).filter(Boolean));
    setLoading(false);
  };

  const refreshScores = useCallback(async () => {
    if (!session?.id) return;
    try {
      const { data } = await axios.get(`${API}/game/session/${session.id}`);
      saveSession({ ...session, team1_score:data.team1_score, team2_score:data.team2_score });
    } catch {}
  }, [session, saveSession]);

  useEffect(() => { const iv=setInterval(refreshScores,4000); return ()=>clearInterval(iv); }, [refreshScores]);
  useEffect(() => { const h=()=>refreshScores(); window.addEventListener("scoreUpdated",h); return ()=>window.removeEventListener("scoreUpdated",h); }, [refreshScores]);

  const handleTileClick = async (catId, difficulty, slot) => {
    const k = `${catId}_${difficulty}_${slot}`;
    if (isTileUsed(k) || clickingTile) return;
    setClickingTile(k); markTileUsed(k);
    try {
      const { data: q } = await axios.post(`${API}/game/session/${session.id}/question?category_id=${catId}&difficulty=${difficulty}`);
      navigate("/question", { state:{ question:q, catId, difficulty, slot, catName:categories.find(c=>c.id===catId)?.name, turnTeam:currentTurn } });
    } catch { toast.error("لا يوجد أسئلة متاحة لهذه الفئة!"); }
    finally { setClickingTile(null); }
  };

  const handleEndGame = () => { fireConfetti(); setShowEndConfirm(false); setShowWinner(true); };

  if (loading) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0b10", fontFamily:"Cairo,sans-serif" }}>
      <span style={{ color:"#d4af37", fontSize:"1.1rem", fontWeight:700 }}>جاري التحميل…</span>
    </div>
  );

  const allUsed = categories.every(c=>DIFFICULTIES.every(d=>isTileUsed(`${c.id}_${d}_1`)&&isTileUsed(`${c.id}_${d}_2`)));
  const winner  = allUsed||showWinner ? (teamScores.team1>teamScores.team2?team1Name:teamScores.team2>teamScores.team1?team2Name:"تعادل") : null;

  /* ── inline modal/winner helpers ── */
  const Modal = ({ children }) => (
    <div style={{ position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(4,4,8,.88)",backdropFilter:"blur(18px)" }}>
      <div style={{ background:"#0e0f1a",border:"1px solid rgba(212,175,55,.22)",borderRadius:20,padding:"clamp(24px,3.5vw,42px)",maxWidth:380,width:"100%",textAlign:"center",boxShadow:"0 30px 90px rgba(0,0,0,.8)",fontFamily:"Cairo,sans-serif" }}>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" />
      <style>{`
        @keyframes fall { to { transform:translateY(110vh) rotate(540deg); opacity:0; } }
        @keyframes fadein { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.28} }
        @keyframes winner-in { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:none} }
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body { height:100%; }
      `}</style>

      <div style={{
        height:"100vh", display:"flex", flexDirection:"column",
        background:"#0a0b10",
        backgroundImage:"radial-gradient(ellipse 70% 45% at 50% 0%,rgba(212,175,55,.07) 0%,transparent 60%), radial-gradient(ellipse 55% 35% at 80% 100%,rgba(99,102,241,.05) 0%,transparent 55%)",
        direction:"rtl", fontFamily:"Cairo,sans-serif", color:"#f0ece0",
        position:"relative",
      }}>

        {/* Roman background */}
        <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
          backgroundImage:"url('/roman-bg.jpg')",backgroundSize:"cover",backgroundPosition:"center",
          opacity:.055, filter:"blur(6px) grayscale(70%)",
        }} />

        {/* ── HEADER ── */}
        <div style={{
          position:"relative", zIndex:10,
          display:"grid", gridTemplateColumns:"1fr auto 1fr",
          alignItems:"center", gap:16,
          padding:"12px 28px",
          background:"rgba(10,11,16,.96)",
          borderBottom:"1px solid rgba(212,175,55,.14)",
          backdropFilter:"blur(20px)",
          boxShadow:"0 8px 40px rgba(0,0,0,.5)",
          flexShrink:0,
        }}>

          {/* Team 1 */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{
              background:"rgba(231,76,60,.08)", border:`1.5px solid ${currentTurn===1?"rgba(231,76,60,.55)":"rgba(231,76,60,.18)"}`,
              borderRadius:14, padding:"10px 18px",
              display:"flex", alignItems:"center", gap:12,
              transition:"border-color .3s, box-shadow .3s",
              boxShadow:currentTurn===1?"0 0 22px rgba(231,76,60,.18)":"none",
            }}>
              {currentTurn===1 && <span style={{ width:8,height:8,borderRadius:"50%",background:"#e74c3c",boxShadow:"0 0 10px #e74c3c",animation:"pulse 1.5s infinite",flexShrink:0 }} />}
              <div>
                <div style={{ fontSize:".7rem",fontWeight:700,color:"rgba(231,76,60,.65)",letterSpacing:".06em" }}>{team1Name}</div>
                <div data-testid="team1-score" style={{ fontSize:"1.7rem",fontWeight:900,color:"#f0ece0",lineHeight:1 }}><ScoreCounter value={teamScores.team1} /></div>
              </div>
            </div>
          </div>

          {/* Center */}
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
            <div style={{
              fontFamily:"Cairo,sans-serif", fontWeight:900,
              fontSize:"clamp(1.8rem,2.8vw,3rem)",
              background:"linear-gradient(160deg,#f5e090 0%,#d4af37 50%,#8b6a10 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              backgroundClip:"text", letterSpacing:".05em", lineHeight:1,
              filter:"drop-shadow(0 0 16px rgba(212,175,55,.45))",
            }}>حُجّة</div>
            <div data-testid="turn-indicator" style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"3px 14px", borderRadius:99,
              background:"rgba(255,255,255,.04)",
              border:"1px solid rgba(212,175,55,.2)",
              fontSize:".75rem",fontWeight:700,color:"rgba(212,175,55,.8)",
              letterSpacing:".04em",whiteSpace:"nowrap",
            }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:currentTurn===1?"#e74c3c":"#27ae60",animation:"pulse 1.5s infinite" }} />
              دور {currentTurn===1?team1Name:team2Name}
            </div>
          </div>

          {/* Team 2 + End */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"flex-end",gap:12 }}>
            <div style={{
              background:"rgba(39,174,96,.08)", border:`1.5px solid ${currentTurn===2?"rgba(39,174,96,.55)":"rgba(39,174,96,.18)"}`,
              borderRadius:14, padding:"10px 18px",
              display:"flex", alignItems:"center", gap:12,
              transition:"border-color .3s, box-shadow .3s",
              boxShadow:currentTurn===2?"0 0 22px rgba(39,174,96,.18)":"none",
            }}>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:".7rem",fontWeight:700,color:"rgba(39,174,96,.65)",letterSpacing:".06em" }}>{team2Name}</div>
                <div data-testid="team2-score" style={{ fontSize:"1.7rem",fontWeight:900,color:"#f0ece0",lineHeight:1 }}><ScoreCounter value={teamScores.team2} /></div>
              </div>
              {currentTurn===2 && <span style={{ width:8,height:8,borderRadius:"50%",background:"#27ae60",boxShadow:"0 0 10px #27ae60",animation:"pulse 1.5s infinite",flexShrink:0 }} />}
            </div>
            <button data-testid="end-game-btn"
              onClick={()=>setShowEndConfirm(true)}
              style={{
                padding:"9px 16px",borderRadius:10,
                background:"rgba(192,57,43,.08)",
                border:"1px solid rgba(192,57,43,.35)",
                color:"rgba(231,76,60,.8)",
                fontFamily:"Cairo,sans-serif",fontWeight:700,fontSize:".82rem",
                cursor:"pointer",whiteSpace:"nowrap",
                transition:"all .2s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(192,57,43,.18)";e.currentTarget.style.color="#e74c3c";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(192,57,43,.08)";e.currentTarget.style.color="rgba(231,76,60,.8)";}}
            >✕ إنهاء</button>
          </div>
        </div>

        {/* ── BOARD ── */}
        <div style={{
          position:"relative", zIndex:1,
          flex:1, minHeight:0,
          display:"grid",
          gridTemplateColumns:"repeat(3,minmax(0,1fr))",
          gridTemplateRows:"repeat(2,minmax(0,1fr))",
          gap:14, padding:"16px 20px 20px",
        }}>
          {categories.slice(0,6).map((cat,i)=>(
            <div key={cat.id} style={{ animation:`fadein .4s ${i*.07}s cubic-bezier(.22,1,.36,1) both` }}>
              <CategoryCard
                cat={cat}
                isTileUsed={isTileUsed}
                clickingTile={clickingTile}
                currentTurn={currentTurn}
                onTileClick={handleTileClick}
              />
            </div>
          ))}
        </div>

        {/* ── ALL DONE BANNER ── */}
        {allUsed && !showWinner && (
          <div style={{
            position:"fixed",bottom:0,left:0,right:0,zIndex:40,
            padding:"14px",textAlign:"center",
            background:"rgba(10,11,16,.97)",
            borderTop:"1px solid rgba(212,175,55,.2)",
            backdropFilter:"blur(14px)",
          }}>
            <div style={{ fontWeight:900,fontSize:"1.05rem",color:"#d4af37",marginBottom:10 }}>
              {winner==="تعادل"?"🤝 تعادل!": `🏆 ${winner} فاز!`}
            </div>
            <button
              onClick={()=>{fireConfetti();setShowWinner(true);}}
              style={{ padding:"11px 28px",borderRadius:12,fontFamily:"Cairo,sans-serif",fontWeight:700,fontSize:".95rem",background:"linear-gradient(135deg,#d4af37,#8b6a10)",color:"#0a0900",border:"none",cursor:"pointer",boxShadow:"0 6px 24px rgba(212,175,55,.35)" }}
            >عرض النتيجة النهائية</button>
          </div>
        )}

        {/* ── END CONFIRM ── */}
        {showEndConfirm && (
          <Modal>
            <div style={{ fontSize:"2rem",marginBottom:10 }}>⚔️</div>
            <div style={{ fontWeight:900,fontSize:"1.25rem",color:"#f0ece0",marginBottom:8 }}>إنهاء اللعبة؟</div>
            <div style={{ fontSize:".82rem",color:"rgba(240,236,224,.35)",marginBottom:24 }}>سيتم إعلان الفائز الحالي</div>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <button onClick={handleEndGame}
                style={{ padding:"10px 24px",borderRadius:10,fontFamily:"Cairo,sans-serif",fontWeight:700,fontSize:".92rem",background:"rgba(192,57,43,.12)",color:"#e74c3c",border:"1px solid rgba(192,57,43,.45)",cursor:"pointer" }}>
                نعم، إنهاء
              </button>
              <button onClick={()=>setShowEndConfirm(false)}
                style={{ padding:"10px 24px",borderRadius:10,fontFamily:"Cairo,sans-serif",fontWeight:700,fontSize:".92rem",background:"transparent",color:"rgba(240,236,224,.35)",border:"1px solid rgba(255,255,255,.1)",cursor:"pointer" }}>
                رجوع
              </button>
            </div>
          </Modal>
        )}

        {/* ── WINNER ── */}
        {showWinner && (
          <div style={{ position:"fixed",inset:0,zIndex:70,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center",background:"rgba(8,9,14,.97)",backdropFilter:"blur(28px)",animation:"winner-in .5s cubic-bezier(.22,1,.36,1) both",fontFamily:"Cairo,sans-serif" }}>
            <div style={{ fontSize:"clamp(3.5rem,8vw,6rem)",marginBottom:8 }}>🏆</div>
            <div style={{ fontSize:".85rem",fontWeight:700,color:"rgba(212,175,55,.45)",marginBottom:6,letterSpacing:".07em" }}>الفائز</div>
            <div style={{ fontWeight:900,fontSize:"clamp(2rem,5vw,4.5rem)",background:"linear-gradient(160deg,#f5e090,#d4af37,#8b6a10)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",marginBottom:28,lineHeight:1.1,filter:"drop-shadow(0 0 22px rgba(212,175,55,.5))" }}>
              {winner==="تعادل"?"🤝 تعادل!":winner}
            </div>
            <div style={{ display:"flex",gap:18,marginBottom:32 }}>
              {[{name:team1Name,score:teamScores.team1,c:"#e74c3c"},{name:team2Name,score:teamScores.team2,c:"#27ae60"}].map(({name,score,c})=>(
                <div key={name} style={{ textAlign:"center",borderRadius:16,padding:"16px 24px",background:"rgba(255,255,255,.04)",border:`1px solid ${c}33` }}>
                  <div style={{ fontSize:".75rem",fontWeight:700,color:c,marginBottom:6,letterSpacing:".05em" }}>{name}</div>
                  <div style={{ fontSize:"2rem",fontWeight:900,color:"#f0ece0" }}>{score}</div>
                </div>
              ))}
            </div>
            <button
              onClick={()=>{ if(gameMode==="tournament"){const ref=tournamentState?.currentMatchRef;if(ref){const w=teamScores.team1>=teamScores.team2?ref.team1Id:ref.team2Id;navigate("/tournament/bracket",{state:{autoRecord:{roundIdx:ref.roundIdx,matchIdx:ref.matchIdx,winnerId:w}}});}else navigate("/tournament/bracket");}else{resetGame();navigate("/");}}}
              style={{ padding:"13px 44px",borderRadius:12,fontFamily:"Cairo,sans-serif",fontWeight:700,fontSize:"1rem",background:"linear-gradient(135deg,#d4af37,#8b6a10)",color:"#0a0900",border:"none",cursor:"pointer",boxShadow:"0 6px 28px rgba(212,175,55,.35)" }}
            >{gameMode==="tournament"?"🏆 العودة للبطولة":"🎮 لعبة جديدة"}</button>
          </div>
        )}
      </div>
    </>
  );
}
