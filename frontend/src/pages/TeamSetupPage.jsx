import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/context/GameContext";
import { toast } from "sonner";

const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";

export default function TeamSetupPage() {
  const navigate = useNavigate();
  const { createSession, loading } = useGame();
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");

  const handleStart = async () => {
    if (!team1.trim() || !team2.trim()) { toast.error("أدخل اسم الفريقين!"); return; }
    if (team1.trim() === team2.trim()) { toast.error("اسم الفريقين لازم يكون مختلف!"); return; }
    try {
      await createSession(team1.trim(), team2.trim());
      navigate("/categories");
    } catch {
      toast.error("حدث خطأ، حاول مرة ثانية");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `linear-gradient(rgba(10,0,0,0.72), rgba(4,0,1,0.88)), url("${ROMAN_BG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        backgroundAttachment: "fixed",
        fontFamily: "Cairo, sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .team-input {
          width: 100%;
          background: rgba(0,0,0,0.42);
          border: 1.5px solid rgba(241,225,148,0.18);
          color: #F1E194;
          padding: 14px 18px;
          border-radius: 14px;
          outline: none;
          font-family: Cairo, sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          transition: border-color 0.2s, box-shadow 0.2s;
          direction: rtl;
          text-align: right;
        }
        .team-input:focus {
          border-color: rgba(241,225,148,0.55);
          box-shadow: 0 0 0 3px rgba(241,225,148,0.07);
        }
        .team-input::placeholder { color: rgba(241,225,148,0.22); font-weight: 400; }
      `}</style>

      <div className="w-full max-w-md" style={{ animation: "fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>

        {/* Back */}
        <button
          data-testid="back-btn"
          onClick={() => navigate("/mode")}
          style={{ color: "rgba(241,225,148,0.45)", fontSize: "0.9rem", fontWeight: 700, marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer" }}
        >
          ← رجوع
        </button>

        {/* Header */}
        <div className="text-center" style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, color: "#F1E194", textShadow: "0 0 40px rgba(241,225,148,0.35)", lineHeight: 1.1, marginBottom: "8px" }}>
            سمّوا فرقكم
          </div>
          <div style={{ color: "rgba(241,225,148,0.42)", fontSize: "0.88rem" }}>
            اختاروا اسماً حماسياً لكل فريق
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(6,0,2,0.82)",
            border: "1.5px solid rgba(241,225,148,0.13)",
            borderRadius: "28px",
            padding: "clamp(28px,5vw,44px)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.60)",
          }}
        >
          {/* Team 1 */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(241,225,148,0.58)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "10px", letterSpacing: "0.08em" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", flexShrink: 0, boxShadow: "0 0 8px rgba(239,68,68,0.7)" }}/>
              الفريق الأول
            </label>
            <input
              data-testid="team1-input"
              className="team-input"
              type="text"
              value={team1}
              onChange={e => setTeam1(e.target.value)}
              placeholder="الفريق الأحمر"
              maxLength={20}
              onKeyDown={e => e.key === "Enter" && document.getElementById("team2-input")?.focus()}
            />
          </div>

          {/* VS divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "22px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(241,225,148,0.10)" }}/>
            <span style={{ color: "rgba(241,225,148,0.28)", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.12em" }}>VS</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(241,225,148,0.10)" }}/>
          </div>

          {/* Team 2 */}
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(241,225,148,0.58)", fontSize: "0.75rem", fontWeight: 700, marginBottom: "10px", letterSpacing: "0.08em" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", flexShrink: 0, boxShadow: "0 0 8px rgba(59,130,246,0.7)" }}/>
              الفريق الثاني
            </label>
            <input
              id="team2-input"
              data-testid="team2-input"
              className="team-input"
              type="text"
              value={team2}
              onChange={e => setTeam2(e.target.value)}
              placeholder="الفريق الأزرق"
              maxLength={20}
              onKeyDown={e => e.key === "Enter" && handleStart()}
            />
          </div>

          {/* Hint */}
          <div
            data-testid="team-size-recommendation"
            style={{ marginTop: "20px", padding: "10px 14px", borderRadius: "12px", background: "rgba(241,225,148,0.05)", border: "1px solid rgba(241,225,148,0.12)", color: "rgba(241,225,148,0.40)", fontSize: "0.8rem", textAlign: "center" }}
          >
            💡 يُنصح بلاعبين أو أكثر لكل فريق
          </div>

          {/* CTA */}
          <button
            data-testid="start-game-btn"
            onClick={handleStart}
            disabled={loading}
            style={{
              marginTop: "28px",
              width: "100%",
              padding: "15px",
              borderRadius: "999px",
              background: loading ? "rgba(241,225,148,0.20)" : "linear-gradient(135deg, #C09820, #F0D045)",
              color: "#1A0A0B",
              fontFamily: "Cairo, sans-serif",
              fontWeight: 900,
              fontSize: "1.1rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? "none" : "0 0 28px rgba(241,225,148,0.25)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            {loading ? "جاري التحضير..." : "التالي ←"}
          </button>
        </div>
      </div>
    </div>
  );
}
