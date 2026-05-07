import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

/* ── Prestige colors (quick lookup) ──────────────────────────────────────── */
const PRESTIGE_COLORS = [
  "#4ade80","#f97316","#ca8a04","#71717a","#7c3aed",
  "#3b82f6","#a8a29e","#c2410c","#4b5563","#6b7280","#f2b85b",
];
const PRESTIGE_NAMES = [
  "المُجنَّد","المقاتل","المحارب","الفارس","الحامي",
  "البطل","الأسطورة","النخبة","نخبة الأساطير","قائد الأبطال","ماستر",
];

function getPrestigeColor(p) { return PRESTIGE_COLORS[Math.min(p - 1, 10)] || "#f2b85b"; }
function getPrestigeName(p)  { return PRESTIGE_NAMES[Math.min(p - 1, 10)] || ""; }

function Avatar({ url, username, size = 48, color = "#f2b85b" }) {
  const colors = ["#5B0E14","#7c3aed","#0369a1","#065f46","#92400e","#1e40af","#be185d"];
  const bg = colors[(username?.charCodeAt(0) || 0) % colors.length];
  const style = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    border: `2px solid ${color}55`, objectFit: "cover",
  };
  if (url) return <img src={url} alt={username} style={style} onError={e => { e.target.style.display = "none"; }} />;
  return (
    <div style={{ ...style, background: `linear-gradient(135deg, ${bg}, ${bg}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 900, color: "#fff", fontFamily: "Cairo, sans-serif" }}>
      {username?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function SearchPage() {
  const navigate  = useNavigate();
  const { userToken } = useGame();

  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/users/search`, { params: { q: q.trim(), limit: 15 } });
      setResults(data);
      setSearched(true);
    } catch { setResults([]); setSearched(true); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 350);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    search(query);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#09070b", fontFamily: "Cairo, sans-serif",
      direction: "rtl", color: "#f8f2e7",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(9,7,11,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)",
          cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 700,
          flexShrink: 0,
        }}>← رجوع</button>

        {/* Search bar */}
        <form onSubmit={handleSubmit} style={{ flex: 1 }}>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, color: "rgba(255,255,255,0.35)", pointerEvents: "none",
            }}>🔍</span>
            <input
              autoFocus
              value={query}
              onChange={handleChange}
              placeholder="ابحث باسم المستخدم..."
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.07)",
                border: "1.5px solid rgba(255,255,255,0.15)",
                borderRadius: 12, padding: "11px 44px 11px 16px",
                color: "#f8f2e7", fontSize: 15, fontFamily: "Cairo, sans-serif",
                outline: "none", direction: "rtl",
              }}
              onFocus={e => { e.target.style.borderColor = "rgba(241,225,148,0.45)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
            />
          </div>
        </form>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 12px 60px" }}>

        {/* Empty state */}
        {!searched && !loading && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🔍</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
              ابحث عن أصدقائك
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
              اكتب اسم المستخدم للبحث عنه
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", paddingTop: 40, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
            جاري البحث...
          </div>
        )}

        {/* No results */}
        {searched && !loading && results.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
              لا يوجد مستخدم بهذا الاسم
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 4, fontWeight: 700 }}>
              {results.length} نتيجة
            </div>
            {results.map(user => {
              const pColor = user.prestige > 0 ? getPrestigeColor(user.prestige) : "#f2b85b";
              const pName  = user.prestige > 0 ? getPrestigeName(user.prestige)  : null;
              return (
                <div
                  key={user.id}
                  onClick={() => navigate(`/profile/${user.username}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 18, padding: "14px 16px",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = `${pColor}33`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  <Avatar url={user.avatar_url} username={user.username} size={52} color={pColor} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#f8f2e7" }}>
                        {user.username}
                      </span>
                      {user.subscription_type === "premium" && (
                        <span style={{ fontSize: 10, background: "rgba(234,179,8,0.15)", color: "#f59e0b", padding: "2px 8px", borderRadius: 999, fontWeight: 800, border: "1px solid rgba(234,179,8,0.3)" }}>
                          ⭐ Premium
                        </span>
                      )}
                      {pName && (
                        <span style={{ fontSize: 10, background: `${pColor}18`, color: pColor, padding: "2px 8px", borderRadius: 999, fontWeight: 800, border: `1px solid ${pColor}30` }}>
                          {pName}
                        </span>
                      )}
                    </div>
                    {user.bio && (
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.bio}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                      @{user.username}
                    </div>
                  </div>

                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 18, flexShrink: 0 }}>←</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
