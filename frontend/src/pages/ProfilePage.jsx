import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

/* ── Prestige System (mirrors backend: 11 prestiges × 55 levels) ────────────── */
const XP_PER_PRESTIGE = 10_000;

const PRESTIGE_META = [
  { name: "مُجنَّد",        color: "#4ade80", glow: "#4ade8044" },  // P1  Green
  { name: "مقاتل",          color: "#fb923c", glow: "#fb923c44" },  // P2  Orange
  { name: "محارب",          color: "#facc15", glow: "#facc1544" },  // P3  Yellow
  { name: "فارس",           color: "#f87171", glow: "#f8717144" },  // P4  Red
  { name: "حامٍ",           color: "#c084fc", glow: "#c084fc44" },  // P5  Purple
  { name: "بطل",            color: "#60a5fa", glow: "#60a5fa44" },  // P6  Blue
  { name: "أسطورة",         color: "#22d3ee", glow: "#22d3ee44" },  // P7  Cyan
  { name: "نخبة",           color: "#f472b6", glow: "#f472b644" },  // P8  Pink
  { name: "أسطورة النخبة",  color: "#94a3b8", glow: "#94a3b844" },  // P9  Silver
  { name: "بطل الأبطال",    color: "#f59e0b", glow: "#f59e0b55" },  // P10 Gold
  { name: "ماستر",          color: "#f2b85b", glow: "#f2b85b77" },  // P11 Master
];

function getPrestigeMeta(prestige) {
  const p = Math.max(1, Math.min(11, prestige || 1));
  return PRESTIGE_META[p - 1];
}

/* ── Prestige Badge SVG ──────────────────────────────────────────────────────── */
function PrestigeBadge({ prestige, size = 40 }) {
  const p = Math.max(1, Math.min(11, prestige || 1));
  const m = PRESTIGE_META[p - 1];
  const c = m.color;
  const id = `pbf${p}`;
  const lg = `pblg${p}`;
  const num = p < 11 ? String(p) : "M";

  const glowFilter = (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  );

  const numLabel = (x, y, fs = 11) => (
    <text x={x} y={y} textAnchor="middle" fontSize={fs} fontWeight="900"
      fill="rgba(0,0,0,0.55)" fontFamily="sans-serif" letterSpacing="-0.5">{num}</text>
  );

  const shapes = {
    1: <>  {/* Shield */}
      <defs>{glowFilter}</defs>
      <path d="M20 3 L34 8 L34 24 C34 32 28 38 20 41 C12 38 6 32 6 24 L6 8 Z" fill={c} filter={`url(#${id})`} opacity="0.95"/>
      <path d="M20 8 L28 12 L28 24 C28 29 25 33 20 35 C15 33 12 29 12 24 L12 12 Z" fill="rgba(255,255,255,0.13)"/>
      {numLabel(20, 27)}
    </>,
    2: <>  {/* Diamond */}
      <defs>{glowFilter}</defs>
      <polygon points="20,3 37,20 20,37 3,20" fill={c} filter={`url(#${id})`} opacity="0.95"/>
      <polygon points="20,9 31,20 20,31 9,20" fill="rgba(255,255,255,0.13)"/>
      {numLabel(20, 24)}
    </>,
    3: <>  {/* 5-Pointed Star */}
      <defs>{glowFilter}</defs>
      <polygon points="20,2 23.5,13 35,13 26,20.5 29.5,32 20,25.5 10.5,32 14,20.5 5,13 16.5,13" fill={c} filter={`url(#${id})`} opacity="0.95"/>
      {numLabel(20, 25, 10)}
    </>,
    4: <>  {/* Kite / Arrow */}
      <defs>{glowFilter}</defs>
      <path d="M20 2 L38 15 L20 38 L2 15 Z" fill={c} filter={`url(#${id})`} opacity="0.95"/>
      <path d="M20 8 L31 17 L20 32 L9 17 Z" fill="rgba(255,255,255,0.13)"/>
      {numLabel(20, 24)}
    </>,
    5: <>  {/* Hexagon */}
      <defs>{glowFilter}</defs>
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill={c} filter={`url(#${id})`} opacity="0.95"/>
      <polygon points="20,7 31,13.5 31,26.5 20,33 9,26.5 9,13.5" fill="rgba(255,255,255,0.13)"/>
      {numLabel(20, 24)}
    </>,
    6: <>  {/* Sunburst Circle */}
      <defs>{glowFilter}</defs>
      {[0,45,90,135,180,225,270,315].map(deg => {
        const r = deg * Math.PI / 180;
        return <line key={deg} x1={20+15*Math.cos(r)} y1={20+15*Math.sin(r)} x2={20+20*Math.cos(r)} y2={20+20*Math.sin(r)} stroke={c} strokeWidth="2.5" opacity="0.75"/>;
      })}
      <circle cx="20" cy="20" r="13" fill={c} filter={`url(#${id})`} opacity="0.95"/>
      {numLabel(20, 24)}
    </>,
    7: <>  {/* Octagon Gem */}
      <defs>{glowFilter}</defs>
      <polygon points="13,2 27,2 38,13 38,27 27,38 13,38 2,27 2,13" fill={c} filter={`url(#${id})`} opacity="0.95"/>
      <polygon points="14,6 26,6 34,14 34,26 26,34 14,34 6,26 6,14" fill="rgba(255,255,255,0.13)"/>
      {numLabel(20, 24)}
    </>,
    8: <>  {/* Crown */}
      <defs>{glowFilter}</defs>
      <path d="M4 34 L4 19 L11 28 L20 12 L29 28 L36 19 L36 34 Z" fill={c} filter={`url(#${id})`} opacity="0.95"/>
      <circle cx="20" cy="12" r="2.5" fill="rgba(255,255,255,0.9)"/>
      <circle cx="4"  cy="19" r="2"   fill="rgba(255,255,255,0.7)"/>
      <circle cx="36" cy="19" r="2"   fill="rgba(255,255,255,0.7)"/>
      {numLabel(20, 31)}
    </>,
    9: <>  {/* Wings */}
      <defs>{glowFilter}</defs>
      <path d="M20 21 C18 13 6 9 2 16 C7 19 14 17 17 21 Z" fill={c} opacity="0.9" filter={`url(#${id})`}/>
      <path d="M20 21 C22 13 34 9 38 16 C33 19 26 17 23 21 Z" fill={c} opacity="0.9"/>
      <path d="M20 21 C16 25 3 24 2 31 C8 31 15 26 17 23 Z" fill={c} opacity="0.65"/>
      <path d="M20 21 C24 25 37 24 38 31 C32 31 25 26 23 23 Z" fill={c} opacity="0.65"/>
      <circle cx="20" cy="22" r="4.5" fill={c} filter={`url(#${id})`}/>
      {numLabel(20, 25.5, 7)}
    </>,
    10: <>  {/* 8-Pointed Ornate Star */}
      <defs>
        {glowFilter}
        <linearGradient id={lg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35"/>
          <stop offset="100%" stopColor={c}/>
        </linearGradient>
      </defs>
      <polygon points="20,2 22.7,12.5 33,9 26,19 37,20 26,21 33,31 22.7,27.5 20,38 17.3,27.5 7,31 14,21 3,20 14,19 7,9 17.3,12.5" fill={`url(#${lg})`} filter={`url(#${id})`}/>
      {numLabel(20, 24, 10)}
    </>,
    11: <>  {/* Master Crown + Ring */}
      <defs>
        {glowFilter}
        <linearGradient id={lg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5"/>
          <stop offset="100%" stopColor={c}/>
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="none" stroke={c} strokeWidth="1.5" opacity="0.45"/>
      <circle cx="20" cy="20" r="15" fill="none" stroke={c} strokeWidth="0.5" opacity="0.25"/>
      <path d="M6 33 L6 18 L12.5 27 L20 10 L27.5 27 L34 18 L34 33 Z" fill={`url(#${lg})`} filter={`url(#${id})`}/>
      <circle cx="20"   cy="10" r="2.5" fill="#fff" opacity="0.95"/>
      <circle cx="6"    cy="18" r="2"   fill="#fff" opacity="0.8"/>
      <circle cx="34"   cy="18" r="2"   fill="#fff" opacity="0.8"/>
      {numLabel(20, 31, 9)}
    </>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 0 ${size/6}px ${m.glow})`, flexShrink: 0 }}>
      {shapes[p]}
    </svg>
  );
}

/* ── Banner presets ─────────────────────────────────────────────────────────── */
const BANNERS = [
  { id: "burgundy", label: "أحمر",    gradient: "linear-gradient(135deg, #5B0E14 0%, #1a0505 60%, #2d0a0a 100%)" },
  { id: "purple",   label: "بنفسجي",  gradient: "linear-gradient(135deg, #1a0f28 0%, #2d1a4a 50%, #3b1d6e 100%)" },
  { id: "midnight", label: "ليلي",    gradient: "linear-gradient(135deg, #0a0710 0%, #0d0d1a 50%, #1a1035 100%)" },
  { id: "forest",   label: "غابة",    gradient: "linear-gradient(135deg, #0a1f0f 0%, #0d2718 50%, #1a3d20 100%)" },
  { id: "ocean",    label: "بحري",    gradient: "linear-gradient(135deg, #0a1428 0%, #0a1e3d 50%, #0d2d50 100%)" },
  { id: "fire",     label: "ناري",    gradient: "linear-gradient(135deg, #1a0800 0%, #3d1200 50%, #5c1a00 100%)" },
  { id: "gold",     label: "ذهبي",    gradient: "linear-gradient(135deg, #1a1200 0%, #2e1f00 50%, #3d2c00 100%)" },
  { id: "cosmic",   label: "كوني",    gradient: "linear-gradient(135deg, #0a0014 0%, #14001e 50%, #1a0a28 100%)" },
];

/* ── Accent colors ──────────────────────────────────────────────────────────── */
const ACCENTS = [
  { color: "#f2b85b", label: "ذهبي" },
  { color: "#73f0a8", label: "أخضر" },
  { color: "#60a5fa", label: "أزرق" },
  { color: "#f87171", label: "أحمر" },
  { color: "#a78bfa", label: "بنفسجي" },
  { color: "#fb923c", label: "برتقالي" },
  { color: "#f472b6", label: "وردي" },
  { color: "#34d399", label: "زمرد" },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n ?? 0);
}

function Avatar({ url, username, size = 80, accent = "#f2b85b", pulse = false }) {
  const colors = ["#5B0E14","#7c3aed","#0369a1","#065f46","#92400e","#1e40af","#be185d"];
  const bg     = colors[(username?.charCodeAt(0) || 0) % colors.length];
  const style  = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    border: `3px solid ${accent}`,
    boxShadow: `0 0 ${pulse ? 20 : 10}px ${accent}55`,
    transition: "box-shadow 0.3s",
    cursor: "default",
  };
  if (url) {
    return <img src={url} alt={username} style={{ ...style, objectFit: "cover" }} onError={e => { e.target.style.display="none"; }} />;
  }
  return (
    <div style={{ ...style, background: `linear-gradient(135deg, ${bg}, ${bg}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 900, color: "#fff", fontFamily: "Cairo, sans-serif" }}>
      {username?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function XPBar({ progress, accent, level, prestige }) {
  const { percent, current_xp, needed_xp, can_prestige } = progress || {};
  const pct = Math.min(100, percent || 0);
  const isMax = can_prestige;
  return (
    <div style={{ padding: "0 20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>
          {isMax ? (prestige < 11 ? "✨ جاهز للبرستيج!" : "👑 ماستر") : `Lv.${level} → Lv.${level + 1}`}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: isMax ? accent : "rgba(255,255,255,0.5)" }}>
          {isMax ? "MAX" : `${current_xp} / ${needed_xp} XP`}
        </span>
      </div>
      <div style={{ height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 999,
          background: isMax
            ? `linear-gradient(90deg, ${accent}, #fff8, ${accent})`
            : `linear-gradient(90deg, ${accent}66, ${accent})`,
          width: `${pct}%`,
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 10px ${accent}88`,
          backgroundSize: isMax ? "200% 100%" : "100% 100%",
          animation: isMax ? "shimmer 2s linear infinite" : "none",
        }} />
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, accent, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "14px 12px", textAlign: "center", flex: "1 1 80px",
        cursor: onClick ? "pointer" : "default", transition: "background 0.2s",
        minWidth: 80,
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
    >
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: accent, lineHeight: 1 }}>{fmtNumber(value)}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ── Image uploader ─────────────────────────────────────────────────────────── */
function ImageUploader({ label, value, onChange, token, circle = false, placeholder = "" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { toast.error("JPG / PNG / WEBP فقط"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("الحجم الأقصى 5 ميغابايت"); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append("file", file);
      const { data } = await axios.post(`${API}/community/upload`, form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      onChange(data.url); toast.success("✓ تم رفع الصورة");
    } catch (e) { toast.error(e?.response?.data?.detail || "فشل الرفع"); }
    finally { setBusy(false); }
  };
  return (
    <div>
      {label && <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 700 }}>{label}</label>}
      {value && (
        <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
          <img src={value} alt="" style={{ height: circle ? 60 : 56, width: circle ? 60 : 120, objectFit: "cover", borderRadius: circle ? "50%" : 10, border: "1px solid rgba(255,255,255,0.15)" }} />
          <button onClick={() => onChange("")} style={{ position:"absolute",top:-5,right:-5,background:"#ff5f6d",border:"none",borderRadius:"50%",width:18,height:18,color:"#fff",cursor:"pointer",fontSize:10,lineHeight:"18px",textAlign:"center" }}>✕</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 12px", color:"#f8f2e7", fontSize:12, fontFamily:"Cairo,sans-serif", outline:"none", direction:"ltr", minWidth:0 }}
          value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder || "رابط أو ارفع صورة..."} />
        <button onClick={()=>inputRef.current?.click()} disabled={busy}
          style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 12px", color:"#f8f2e7", cursor:"pointer", fontSize:12, fontFamily:"Cairo,sans-serif", flexShrink:0, opacity:busy?0.6:1 }}>
          {busy ? "⏳" : "📁"}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>upload(e.target.files?.[0])} />
      </div>
    </div>
  );
}

const TABS_CONFIG = [
  { key: "about",     label: "الملف الشخصي" },
  { key: "cats",      label: "الفئات" },
  { key: "followers", label: "المتابعون" },
  { key: "following", label: "المتابَعون" },
];

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { username: paramUsername } = useParams();
  const navigate  = useNavigate();
  const { currentUser, userToken, refreshUser } = useGame();

  const viewingUsername = paramUsername || currentUser?.username;

  const [profile,        setProfile]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState("about");

  /* Edit state */
  const [editing,        setEditing]        = useState(false);
  const [eBio,           setEBio]           = useState("");
  const [eAvatar,        setEAvatar]        = useState("");
  const [eBanner,        setEBanner]        = useState("");
  const [eAccent,        setEAccent]        = useState("#f2b85b");
  const [eUsername,      setEUsername]      = useState("");
  const [eInterests,     setEInterests]     = useState("");
  const [saving,         setSaving]         = useState(false);

  /* Prestige */
  const [prestigeBusy,   setPrestigeBusy]   = useState(false);

  /* Follow */
  const [followBusy,     setFollowBusy]     = useState(false);

  /* Categories tab */
  const [cats,           setCats]           = useState([]);
  const [catsPage,       setCatsPage]       = useState(0);
  const [catsMore,       setCatsMore]       = useState(true);
  const [catsLoading,    setCatsLoading]    = useState(false);

  /* Social tabs */
  const [followers,      setFollowers]      = useState([]);
  const [followingList,  setFollowingList]  = useState([]);
  const [socialLoaded,   setSocialLoaded]   = useState(false);

  const h = userToken ? { headers: { Authorization: `Bearer ${userToken}` } } : {};

  /* ── Loaders ──────────────────────────────────────────────────────────────── */
  const loadProfile = useCallback(async () => {
    if (!viewingUsername) { navigate("/login"); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/profile/${viewingUsername}`, h);
      setProfile(data);
      setEBio(data.bio || "");
      setEAvatar(data.avatar_url || "");
      setEBanner(data.banner_url || "");
      setEAccent(data.accent_color || "#f2b85b");
      setEUsername(data.username || "");
      setEInterests((data.interests || []).join("، "));
    } catch (e) {
      if (e?.response?.status === 404) toast.error("المستخدم غير موجود");
      else toast.error("خطأ في التحميل");
    } finally { setLoading(false); }
  }, [viewingUsername, userToken]); // eslint-disable-line

  const loadCats = useCallback(async (page) => {
    if (!viewingUsername || catsLoading) return;
    setCatsLoading(true);
    try {
      const { data } = await axios.get(`${API}/profile/${viewingUsername}/categories`, {
        params: { skip: page * 12, limit: 12 },
      });
      if (data.length < 12) setCatsMore(false);
      setCats(prev => page === 0 ? data : [...prev, ...data]);
      setCatsPage(page + 1);
    } catch { /**/ }
    finally { setCatsLoading(false); }
  }, [viewingUsername, catsLoading]); // eslint-disable-line

  const loadSocial = useCallback(async () => {
    if (!viewingUsername || socialLoaded) return;
    try {
      const [frs, fng] = await Promise.all([
        axios.get(`${API}/profile/${viewingUsername}/followers`),
        axios.get(`${API}/profile/${viewingUsername}/following`),
      ]);
      setFollowers(frs.data); setFollowingList(fng.data); setSocialLoaded(true);
    } catch { /**/ }
  }, [viewingUsername, socialLoaded]); // eslint-disable-line

  useEffect(() => { loadProfile(); }, [viewingUsername]); // eslint-disable-line
  useEffect(() => {
    if (activeTab === "cats"      && cats.length === 0)      loadCats(0);
    if ((activeTab === "followers" || activeTab === "following") && !socialLoaded) loadSocial();
  }, [activeTab]); // eslint-disable-line

  /* ── Actions ──────────────────────────────────────────────────────────────── */
  const handleFollow = async () => {
    if (!userToken) { navigate("/login"); return; }
    setFollowBusy(true);
    try {
      if (profile.is_following) {
        await axios.delete(`${API}/profile/${profile.username}/follow`, h);
        setProfile(p => ({ ...p, is_following: false, followers_count: p.followers_count - 1 }));
        toast.success("تم إلغاء المتابعة");
      } else {
        await axios.post(`${API}/profile/${profile.username}/follow`, {}, h);
        setProfile(p => ({ ...p, is_following: true, followers_count: p.followers_count + 1 }));
        toast.success("تمت المتابعة ✓");
      }
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
    finally { setFollowBusy(false); }
  };

  const handlePrestige = async () => {
    if (!userToken) return;
    setPrestigeBusy(true);
    try {
      const { data } = await axios.post(`${API}/profile/${profile.username}/prestige`, {}, h);
      toast.success(`🎉 برستيج ${data.new_prestige} — مبروك!`);
      await loadProfile();
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
    finally { setPrestigeBusy(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const interestArr = eInterests.split(/[،,]/).map(s => s.trim()).filter(Boolean);
      await axios.put(`${API}/auth/me`, {
        bio:          eBio,
        avatar_url:   eAvatar,
        banner_url:   eBanner,
        accent_color: eAccent,
        interests:    interestArr,
        username:     eUsername !== profile.username ? eUsername : undefined,
      }, h);
      await refreshUser();
      await loadProfile();
      setEditing(false);
      toast.success("تم حفظ التغييرات ✓");
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ في الحفظ"); }
    finally { setSaving(false); }
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/profile/${profile.username}`;
    if (navigator.share) { navigator.share({ title: profile.username, url }).catch(()=>{}); }
    else { navigator.clipboard.writeText(url); toast.success("تم نسخ رابط البروفايل"); }
  };

  const shareCat = (cat) => {
    const url = `${window.location.origin}/categories?community=${cat.id}`;
    if (navigator.share) { navigator.share({ title: cat.name, url }).catch(()=>{}); }
    else { navigator.clipboard.writeText(url); toast.success("تم نسخ رابط الفئة"); }
  };

  /* ── Loading / Error states ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#09070b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Cairo, sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
        جاري التحميل...
      </div>
    );
  }
  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: "#09070b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Cairo, sans-serif" }}>
        <span style={{ fontSize: 48 }}>🔍</span>
        <span style={{ color: "#f8f2e7", fontSize: 18, fontWeight: 800 }}>المستخدم غير موجود</span>
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 20px", color: "#f8f2e7", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>رجوع</button>
      </div>
    );
  }

  const accent       = profile.accent_color || "#f2b85b";
  const prestige     = profile.prestige || 0;
  const prestigeMeta = prestige > 0 ? getPrestigeMeta(prestige) : null;
  const canPrestige  = profile.xp_progress?.can_prestige && profile.is_own;
  const prestigeColor = prestigeMeta ? prestigeMeta.color : accent;

  /* resolve banner */
  const bannerStyle = profile.banner_url
    ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: BANNERS.find(b => b.id === "burgundy")?.gradient || BANNERS[0].gradient };

  /* ── Render: HERO ─────────────────────────────────────────────────────────── */
  const renderHero = () => (
    <>
      {/* Banner */}
      <div style={{ height: 160, ...bannerStyle, position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(9,7,11,0.95) 100%)" }} />
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "6px 14px", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          ← رجوع
        </button>
        {/* Share */}
        <button onClick={shareProfile}
          style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "6px 14px", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          🔗 مشاركة
        </button>
      </div>

      {/* Avatar row */}
      <div style={{ padding: "0 20px", marginTop: -48, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <Avatar url={profile.avatar_url} username={profile.username} size={96} accent={prestigeColor} pulse={profile.is_own} />
          {/* Prestige badge OR level ring */}
          {prestige > 0 ? (
            <div style={{ position: "absolute", bottom: -10, right: -10 }}>
              <PrestigeBadge prestige={prestige} size={38} />
            </div>
          ) : (
            <div style={{
              position: "absolute", bottom: -6, right: -6,
              background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
              borderRadius: 999, padding: "3px 8px",
              fontSize: 11, fontWeight: 900, color: "#0a0710",
              boxShadow: `0 2px 8px ${accent}66`,
            }}>
              Lv.{profile.level}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 8 }}>
          {profile.is_own ? (
            <>
              <button onClick={() => setEditing(e => !e)}
                style={{ background: editing ? `${accent}22` : "rgba(255,255,255,0.08)", border: `1px solid ${editing ? accent : "rgba(255,255,255,0.15)"}`, borderRadius: 12, padding: "10px 18px", color: editing ? accent : "#f8f2e7", cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 800, transition: "all 0.2s" }}>
                {editing ? "✕ إغلاق" : "✏️ تعديل"}
              </button>
              {canPrestige && prestige < 11 && (
                <button onClick={handlePrestige} disabled={prestigeBusy}
                  style={{
                    background: `linear-gradient(135deg, ${prestigeMeta?.color || accent}, ${accent})`,
                    border: "none", borderRadius: 12, padding: "10px 18px",
                    color: "#0a0710", cursor: "pointer", fontSize: 13,
                    fontFamily: "Cairo, sans-serif", fontWeight: 900,
                    opacity: prestigeBusy ? 0.6 : 1, transition: "all 0.2s",
                    boxShadow: `0 4px 16px ${accent}55`,
                    animation: "pulse 2s infinite",
                  }}>
                  {prestigeBusy ? "..." : `⭐ برستيج ${prestige + 1}`}
                </button>
              )}
            </>
          ) : (
            <button onClick={handleFollow} disabled={followBusy}
              style={{
                background: profile.is_following ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                border: `1px solid ${profile.is_following ? "rgba(255,255,255,0.2)" : "transparent"}`,
                borderRadius: 12, padding: "10px 22px",
                color: profile.is_following ? "#f8f2e7" : "#0a0710",
                cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 800,
                opacity: followBusy ? 0.6 : 1, transition: "all 0.2s",
              }}>
              {followBusy ? "..." : profile.is_following ? "✓ تتابعه" : "+ متابعة"}
            </button>
          )}
        </div>
      </div>

      {/* Name + info */}
      <div style={{ padding: "12px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#f8f2e7" }}>{profile.username}</span>
          {profile.subscription_type === "premium" && (
            <span style={{ fontSize: 11, background: "rgba(234,179,8,0.15)", color: "#f59e0b", padding: "3px 9px", borderRadius: 999, fontWeight: 800, border: "1px solid rgba(234,179,8,0.3)" }}>⭐ Premium</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>@{profile.username}</div>

        {/* Level + Prestige badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {prestige > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${prestigeColor}14`, border: `1px solid ${prestigeColor}33`, borderRadius: 999, padding: "4px 12px" }}>
              <PrestigeBadge prestige={prestige} size={18} />
              <span style={{ fontSize: 12, fontWeight: 900, color: prestigeColor }}>{prestigeMeta.name}</span>
            </div>
          )}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${accent}12`, border: `1px solid ${accent}28`, borderRadius: 999, padding: "4px 12px" }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: accent }}>Lv.{profile.level}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>/55</span>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 10, lineHeight: 1.65, maxWidth: 480 }}>
            {profile.bio}
          </p>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {profile.interests.map(tag => (
              <span key={tag} style={{ fontSize: 11, background: `${accent}14`, color: accent, padding: "3px 10px", borderRadius: 999, fontWeight: 700, border: `1px solid ${accent}30` }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social counts */}
        <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 13 }}>
          <span onClick={() => setActiveTab("followers")} style={{ color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            <span style={{ color: accent, fontWeight: 900 }}>{fmtNumber(profile.followers_count)}</span> متابع
          </span>
          <span onClick={() => setActiveTab("following")} style={{ color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            <span style={{ color: accent, fontWeight: 900 }}>{fmtNumber(profile.following_count)}</span> يتابع
          </span>
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ marginTop: 14 }}>
        <XPBar progress={profile.xp_progress} accent={prestigeColor} level={profile.level} prestige={prestige} />
      </div>
    </>
  );

  /* ── Render: STATS ROW ────────────────────────────────────────────────────── */
  const renderStats = () => (
    <div style={{ padding: "0 12px 16px", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
        <StatCard icon="🎮" value={profile.game_count}          label="لعبة"     accent={accent} />
        <StatCard icon="📚" value={profile.approved_categories}  label="فئة"     accent={accent} onClick={() => setActiveTab("cats")} />
        <StatCard icon="❤️" value={profile.total_likes}          label="إعجاب"   accent={accent} />
        <StatCard icon="🎯" value={profile.total_plays}          label="تشغيل"   accent={accent} />
        <StatCard icon="👥" value={profile.followers_count}      label="متابع"   accent={accent} onClick={() => setActiveTab("followers")} />
        <StatCard icon="✨" value={profile.total_xp}             label="XP"      accent={accent} />
      </div>
    </div>
  );

  /* ── Render: EDIT PANEL ───────────────────────────────────────────────────── */
  const renderEdit = () => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: accent }}>✏️ تعديل البروفايل</div>

      {/* Username */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 700 }}>اسم المستخدم</label>
        <input style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "#f8f2e7", fontSize: 14, fontFamily: "Cairo, sans-serif", outline: "none", boxSizing: "border-box" }}
          value={eUsername} onChange={e => setEUsername(e.target.value)} />
      </div>

      {/* Bio */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 700 }}>Bio — وصف مختصر</label>
        <textarea style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "#f8f2e7", fontSize: 14, fontFamily: "Cairo, sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 80 }}
          value={eBio} onChange={e => setEBio(e.target.value)} maxLength={300} placeholder="اكتب شيئاً عن نفسك..." />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "left" }}>{eBio.length}/300</div>
      </div>

      {/* Interests */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 700 }}>الاهتمامات (مفصولة بفاصلة)</label>
        <input style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "#f8f2e7", fontSize: 14, fontFamily: "Cairo, sans-serif", outline: "none", boxSizing: "border-box" }}
          value={eInterests} onChange={e => setEInterests(e.target.value)} placeholder="مثال: أفلام، رياضة، علوم" />
      </div>

      {/* Avatar */}
      <ImageUploader label="صورة الملف الشخصي" value={eAvatar} onChange={setEAvatar} token={userToken} circle placeholder="رابط الصورة..." />

      {/* Banner */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8, fontWeight: 700 }}>خلفية البروفايل (Banner)</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {BANNERS.map(b => (
            <div key={b.id}
              onClick={() => setEBanner("")}
              style={{ width: 48, height: 32, borderRadius: 8, background: b.gradient, cursor: "pointer", border: `2px solid ${!eBanner && eBanner === "" ? accent : "transparent"}`, transition: "border 0.2s", flexShrink: 0 }}
              title={b.label}
            />
          ))}
        </div>
        <ImageUploader value={eBanner} onChange={setEBanner} token={userToken} placeholder="أو رابط صورة مخصصة..." />
      </div>

      {/* Accent color */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8, fontWeight: 700 }}>لون البروفايل</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ACCENTS.map(a => (
            <div key={a.color} onClick={() => setEAccent(a.color)}
              style={{ width: 32, height: 32, borderRadius: "50%", background: a.color, cursor: "pointer", border: `3px solid ${eAccent === a.color ? "#fff" : "transparent"}`, boxShadow: eAccent === a.color ? `0 0 10px ${a.color}` : "none", transition: "all 0.2s", flexShrink: 0 }}
              title={a.label}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: "#0a0710", border: "none", borderRadius: 12, padding: "11px 22px", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "Cairo, sans-serif", opacity: saving ? 0.6 : 1 }}>
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
        <button onClick={() => setEditing(false)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "11px 18px", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          إلغاء
        </button>
      </div>
    </div>
  );

  /* ── Render: ABOUT TAB ────────────────────────────────────────────────────── */
  const renderAbout = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {profile.is_own && editing && renderEdit()}

      {/* Earnings (own only) */}
      {profile.is_own && profile.wallet && (
        <div style={{ background: "rgba(64,212,140,0.05)", border: "1px solid rgba(64,212,140,0.2)", borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#73f0a8", marginBottom: 14 }}>💰 أرباحك</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { v: `${profile.wallet.balance?.toFixed(2)} ر`, l: "الرصيد المتاح", c: accent },
              { v: `${profile.wallet.monthly_pending_sar?.toFixed(2)} ر`, l: "هذا الشهر", c: "#73f0a8" },
              { v: `${profile.wallet.total_earned?.toFixed(2)} ر`, l: "إجمالي الأرباح", c: "rgba(255,255,255,0.6)" },
            ].map(({ v, l, c }) => (
              <div key={l} style={{ flex: "1 1 100px" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/community")}
            style={{ marginTop: 14, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: "#0a0710", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif" }}>
            إدارة الأرباح
          </button>
        </div>
      )}

      {/* Best category */}
      {profile.best_category && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>🏆 أفضل فئة</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {profile.best_category.image_url && (
              <img src={profile.best_category.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f8f2e7" }}>{profile.best_category.name}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                <span>🎮 {profile.best_category.play_count || 0}</span>
                <span>❤️ {profile.best_category.likes_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XP breakdown */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>⚡ مصادر الـ XP</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "الألعاب المُلعَبة",   value: profile.game_count,          mult: 10, icon: "🎮" },
            { label: "فئات معتمدة",         value: profile.approved_categories,  mult: 50, icon: "📚" },
            { label: "تشغيلات الفئات",      value: profile.total_plays,          mult: 2,  icon: "🎯" },
            { label: "الإعجابات المستلمة",  value: profile.total_likes,          mult: 5,  icon: "❤️" },
          ].map(({ label, value, mult, icon }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{icon} {label}</span>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 8 }}>{value} × {mult}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>{(value * mult)} XP</span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#f8f2e7" }}>الإجمالي</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: accent }}>{profile.total_xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Render: CATEGORIES TAB ───────────────────────────────────────────────── */
  const renderCats = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!catsLoading && cats.length === 0 && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
          <div style={{ color: "rgba(255,255,255,0.4)" }}>لا توجد فئات معتمدة</div>
        </div>
      )}
      {cats.map(cat => (
        <div key={cat.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {cat.image_url && (
              <img src={cat.image_url} alt={cat.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 12, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f8f2e7", marginBottom: 6 }}>
                {cat.icon && <span style={{ marginLeft: 6 }}>{cat.icon}</span>}{cat.name}
              </div>
              {cat.description && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.description}</div>}
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>🎮 {cat.play_count || 0}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>❤️ {cat.likes_count || 0}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>📝 {cat.questions_count}</span>
                {profile.is_own && cat.play_count > 0 && (
                  <span style={{ fontSize: 12, color: "#73f0a8" }}>+{Math.floor(cat.play_count * 2)} XP</span>
                )}
              </div>
            </div>
            <button onClick={() => shareCat(cat)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "7px 12px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12, fontFamily: "Cairo, sans-serif", fontWeight: 700, flexShrink: 0 }}>
              🔗
            </button>
          </div>
        </div>
      ))}
      {catsLoading && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 20 }}>جاري التحميل...</div>}
      {catsMore && !catsLoading && cats.length > 0 && (
        <button onClick={() => loadCats(catsPage)}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13 }}>
          تحميل المزيد
        </button>
      )}
    </div>
  );

  /* ── Render: USER LIST (followers/following) ──────────────────────────────── */
  const renderUserList = (list, empty) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.35)" }}>{empty}</div>
      )}
      {list.map(u => (
        <div key={u.id} onClick={() => navigate(`/profile/${u.username}`)}
          style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, cursor: "pointer", transition: "background 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        >
          <Avatar url={u.avatar_url} username={u.username} size={46} accent={accent} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#f8f2e7" }}>
              {u.username}
              {u.subscription_type === "premium" && <span style={{ marginRight: 6, fontSize: 11, background: "rgba(234,179,8,0.15)", color: "#f59e0b", padding: "2px 7px", borderRadius: 999 }}>⭐</span>}
            </div>
            {u.bio && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{u.bio}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  /* ── FINAL RENDER ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#09070b", fontFamily: "Cairo, sans-serif", direction: "rtl", color: "#f8f2e7" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Hero */}
        {renderHero()}

        {/* Stats row */}
        {renderStats()}

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px 16px" }} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "0 12px", marginBottom: 16, overflowX: "auto" }}>
          {TABS_CONFIG.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: "9px 16px", borderRadius: 10, border: "none", whiteSpace: "nowrap",
                fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer",
                transition: "all 0.2s",
                background: activeTab === t.key ? `${accent}22` : "transparent",
                color:      activeTab === t.key ? accent : "rgba(255,255,255,0.45)",
                borderBottom: activeTab === t.key ? `2px solid ${accent}` : "2px solid transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "0 12px 60px" }}>
          {activeTab === "about"     && renderAbout()}
          {activeTab === "cats"      && renderCats()}
          {activeTab === "followers" && renderUserList(followers,     "لا يوجد متابعون بعد")}
          {activeTab === "following" && renderUserList(followingList,  "لا يتابع أحداً بعد")}
        </div>
      </div>
    </div>
  );
}
