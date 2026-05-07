import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const PAGE_SIZE = 20;

export default function CategorySelectPage() {
  const navigate = useNavigate();
  const { session, updateSession, currentUser, darkMode, refreshUser, userToken } = useGame();

  const [categories, setCategories]         = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [freeData, setFreeData]             = useState(null);
  const [selected, setSelected]             = useState({ team1: [], team2: [] });
  const [step, setStep]                     = useState(1);
  const [loading, setLoading]               = useState(false);

  // Source: "regular" | "community"
  const [source, setSource]         = useState("regular");
  const [activeGroupId, setActiveGroupId] = useState("all");

  // Regular categories – client-side virtual scroll
  const [regVisible, setRegVisible] = useState(PAGE_SIZE);

  // Community categories – server-side infinite scroll
  const [commCats, setCommCats]         = useState([]);
  const [commPage, setCommPage]         = useState(0);
  const [commLoading, setCommLoading]   = useState(false);
  const [commHasMore, setCommHasMore]   = useState(true);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const isPremiumUser = currentUser?.subscription_type === "premium";
  const NEEDED = 3;

  // ── Load initial data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) { navigate("/setup"); return; }
    if (userToken) refreshUser();
    loadInitial();
  }, []); // eslint-disable-line

  const loadInitial = async () => {
    const [allRes, freeRes, groupsRes] = await Promise.all([
      axios.get(`${API}/categories`),
      axios.get(`${API}/free-categories`),
      axios.get(`${API}/category-groups`),
    ]);
    setCategories(allRes.data);
    setFreeData(freeRes.data);
    setCategoryGroups(groupsRes.data || []);
    if (!isPremiumUser) {
      setSelected({
        team1: freeRes.data.trial_team1_categories || [],
        team2: freeRes.data.trial_team2_categories || [],
      });
    }
  };

  // ── Community categories loader ───────────────────────────────────────────
  const loadCommunity = useCallback(async (page) => {
    if (commLoading) return;
    setCommLoading(true);
    try {
      const { data } = await axios.get(`${API}/community/categories`, {
        params: { skip: page * PAGE_SIZE, limit: PAGE_SIZE },
      });
      if (data.length < PAGE_SIZE) setCommHasMore(false);
      setCommCats(prev => page === 0 ? data : [...prev, ...data]);
      setCommPage(page + 1);
    } catch {
      /* silent */
    } finally {
      setCommLoading(false);
    }
  }, [commLoading]);

  // Switch to community tab
  useEffect(() => {
    if (source === "community" && commCats.length === 0 && commHasMore) {
      loadCommunity(0);
    }
  }, [source]); // eslint-disable-line

  // ── IntersectionObserver for infinite scroll ──────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (source === "community" && commHasMore && !commLoading) {
          loadCommunity(commPage);
        } else if (source === "regular") {
          const filtered = categories.filter(
            cat => activeGroupId === "all" || cat.group_id === activeGroupId
          );
          if (regVisible < filtered.length) {
            setRegVisible(v => Math.min(v + PAGE_SIZE, filtered.length));
          }
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [source, commHasMore, commLoading, commPage, regVisible, categories, activeGroupId, loadCommunity]);

  // Reset visible count when group filter changes
  useEffect(() => {
    setRegVisible(PAGE_SIZE);
  }, [activeGroupId]);

  // ── Category click ────────────────────────────────────────────────────────
  const handleCategoryClick = (cat) => {
    if (cat.is_premium && !isPremiumUser) {
      toast.error("هذه الفئة متاحة للمشتركين فقط — اشترك في Premium للوصول إليها!", {
        duration: 3000, icon: "🔒",
      });
      return;
    }
    const team    = step === 1 ? "team1" : "team2";
    const current = selected[team];
    if (current.includes(cat.id)) {
      setSelected(prev => ({ ...prev, [team]: prev[team].filter(id => id !== cat.id) }));
    } else {
      if (current.length >= NEEDED) {
        toast.error(`يمكنك اختيار ${NEEDED} فئات فقط لكل فريق`);
        return;
      }
      setSelected(prev => ({ ...prev, [team]: [...prev[team], cat.id] }));
    }
  };

  // ── Confirm / start ───────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!isPremiumUser) {
      await startGame(selected.team1, selected.team2);
      return;
    }
    if (step === 1) {
      if (selected.team1.length < NEEDED) { toast.error(`اختر ${NEEDED} فئات للفريق الأول`); return; }
      setStep(2);
      return;
    }
    if (selected.team2.length < NEEDED) { toast.error(`اختر ${NEEDED} فئات للفريق الثاني`); return; }
    const overlap = selected.team1.filter(id => selected.team2.includes(id));
    if (overlap.length > 0) { toast.error("لا يمكن اختيار نفس الفئة للفريقين!"); return; }
    await startGame(selected.team1, selected.team2);
  };

  const startGame = async (t1Cats, t2Cats) => {
    setLoading(true);
    try {
      const updated = await updateSession({ team1_categories: t1Cats, team2_categories: t2Cats });
      if (updated) navigate("/game");
    } catch {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const team1Sel    = selected.team1;
  const team2Sel    = selected.team2;
  const activeSel   = step === 1 ? team1Sel : team2Sel;
  const teamName    = step === 1 ? session?.team1_name : session?.team2_name;
  const teamColor   = step === 1 ? "#ef4444" : "#3b82f6";
  const otherSel    = step === 1 ? team2Sel : team1Sel;

  const bg      = darkMode
    ? "linear-gradient(155deg, #1A2B18 0%, #1C2E1A 35%, #1F3020 70%, #172715 100%)"
    : "linear-gradient(155deg, #F3EBD3 0%, #E4D9BB 35%, #C7D3A4 70%, #B5C592 100%)";
  const textMain = darkMode ? "#C7D3A4" : "#2C3A1A";
  const textSub  = darkMode ? "#8AAA68" : "#5A6A3A";

  const filteredReg = categories.filter(
    cat => activeGroupId === "all" || cat.group_id === activeGroupId
  );
  const visibleReg = filteredReg.slice(0, regVisible);

  if (!session) return null;

  // ── Cat card renderer ─────────────────────────────────────────────────────
  const renderCard = (cat) => {
    const isCommunity        = source === "community";
    const isLockedPremium    = cat.is_premium && !isPremiumUser;
    const isSelectedCurrent  = activeSel.includes(cat.id);
    const isSelectedOther    = otherSel.includes(cat.id);
    const isTrialT1 = !isPremiumUser && freeData?.trial_team1_categories?.includes(cat.id);
    const isTrialT2 = !isPremiumUser && freeData?.trial_team2_categories?.includes(cat.id);

    let ringColor = "transparent";
    let ringWidth = "0px";
    if (isSelectedCurrent)      { ringColor = teamColor; ringWidth = "3px"; }
    else if (isTrialT1)         { ringColor = "#ef4444"; ringWidth = "2.5px"; }
    else if (isTrialT2)         { ringColor = "#3b82f6"; ringWidth = "2.5px"; }

    return (
      <div
        key={cat.id}
        data-testid={`cat-card-${cat.id}`}
        onClick={() => {
          if (!isPremiumUser && !isCommunity) {
            if (isLockedPremium) toast.error("هذه الفئة متاحة للمشتركين فقط!", { icon: "🔒" });
            return;
          }
          if (isSelectedOther && isPremiumUser) {
            toast.error("هذه الفئة مختارة للفريق الآخر"); return;
          }
          handleCategoryClick(cat);
        }}
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 select-none"
        style={{
          border: `${ringWidth} solid ${ringColor}`,
          boxShadow: isSelectedCurrent
            ? `0 0 20px ${teamColor}55, 0 4px 12px rgba(0,0,0,0.15)`
            : "0 4px 12px rgba(0,0,0,0.1)",
          opacity: isLockedPremium ? 0.8 : isSelectedOther ? 0.5 : 1,
          transform: isSelectedCurrent ? "scale(1.03)" : "scale(1)",
          background: darkMode ? "rgba(28,42,26,0.95)" : "rgba(255,255,255,0.92)",
          minHeight: "clamp(160px, 24vw, 240px)",
        }}
      >
        {/* Lock overlay */}
        {isLockedPremium && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}>
            <Lock size={28} className="text-yellow-400" />
            <span className="text-yellow-300 font-black text-xs text-center px-2">Premium فقط</span>
          </div>
        )}

        {/* Trial badge */}
        {(isTrialT1 || isTrialT2) && !isPremiumUser && (
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-xs font-black"
            style={{ background: isTrialT1 ? "rgba(239,68,68,0.9)" : "rgba(59,130,246,0.9)", color: "white" }}>
            {isTrialT1 ? session?.team1_name : session?.team2_name}
          </div>
        )}

        {/* Selected check */}
        {isSelectedCurrent && isPremiumUser && (
          <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-sm"
            style={{ background: teamColor }}>✓</div>
        )}

        {/* Premium badge */}
        {cat.is_premium && !isCommunity && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-xs font-black"
            style={{ background: "rgba(234,179,8,0.9)", color: "white" }}>⭐ Premium</div>
        )}

        {/* Community badge */}
        {isCommunity && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-xs font-black"
            style={{ background: "rgba(139,92,246,0.85)", color: "white" }}>👥 مجتمع</div>
        )}

        {/* Image / icon */}
        <div className="w-full flex items-center justify-center overflow-hidden"
          style={{ height: "clamp(110px, 18vw, 180px)" }}>
          {cat.image_url ? (
            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover"
              onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${cat.color || "#5B0E14"}33, ${cat.color || "#5B0E14"}11)` }}>
              <span style={{ fontSize: "clamp(3rem, 7vw, 5rem)" }}>{cat.icon || "🎯"}</span>
            </div>
          )}
        </div>

        {/* Name + stats */}
        <div className="px-3 py-2.5">
          <div className="font-black text-center"
            style={{ color: textMain, fontSize: "clamp(0.9rem, 1.8vw, 1.15rem)", fontFamily: "Cairo, sans-serif" }}>
            {cat.icon && <span className="ml-1">{cat.icon}</span>}
            {cat.name}
          </div>
          {cat.description && (
            <div className="text-center mt-0.5 truncate" style={{ color: textSub, fontSize: "0.7rem" }}>
              {cat.description}
            </div>
          )}
          {isCommunity && (
            <div className="flex justify-center gap-3 mt-1" style={{ fontSize: "0.68rem", color: textSub }}>
              <span>🎮 {cat.play_count || 0}</span>
              <span>❤️ {cat.likes_count || 0}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: bg }}>

      {/* Header */}
      <div className="py-4 px-4 text-center border-b"
        style={{ borderColor: darkMode ? "rgba(120,170,90,0.2)" : "rgba(0,0,0,0.08)" }}>
        <h1 className="font-black text-3xl" style={{ color: textMain, fontFamily: "Cairo, sans-serif" }}>
          اختيار الفئات
        </h1>
        {!isPremiumUser && freeData?.trial_enabled ? (
          <p className="mt-1 text-sm font-bold" style={{ color: textSub }}>
            وضع التجربة — الفئات محددة مسبقاً. اشترك في Premium لاختيار فئاتك!
          </p>
        ) : (
          <p className="mt-1 text-sm font-bold" style={{ color: teamColor }}>
            {teamName} — اختر {NEEDED} فئات ({activeSel.length}/{NEEDED})
          </p>
        )}
      </div>

      {/* Teams progress */}
      {isPremiumUser && (
        <div className="flex gap-3 px-4 py-3">
          {[1, 2].map(t => {
            const tName  = t === 1 ? session?.team1_name : session?.team2_name;
            const tColor = t === 1 ? "#ef4444" : "#3b82f6";
            const tSel   = t === 1 ? team1Sel : team2Sel;
            const isAct  = step === t;
            return (
              <div key={t} className="flex-1 rounded-2xl px-4 py-2 flex items-center justify-between transition-all"
                style={{
                  background: isAct ? `${tColor}22` : darkMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
                  border: `2px solid ${isAct ? tColor : "transparent"}`,
                  opacity: step > t ? 0.6 : 1,
                }}>
                <span className="font-black" style={{ color: tColor, fontSize: "0.9rem" }}>{tName}</span>
                <div className="flex gap-1">
                  {Array.from({ length: NEEDED }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border-2"
                      style={{ background: i < tSel.length ? tColor : "transparent", borderColor: tColor }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Source tabs + Group filter */}
      <div className="flex-1 px-3 pb-4 overflow-y-auto">
        {/* Source: عادي / مجتمع */}
        <div className="flex gap-2 mb-3 px-1">
          {[
            { key: "regular",   label: "الفئات", icon: "📚" },
            { key: "community", label: "المجتمع", icon: "👥" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setSource(key); setActiveGroupId("all"); }}
              className="px-4 py-2 rounded-xl text-sm font-black transition-all border"
              style={{
                background: source === key
                  ? key === "community" ? "linear-gradient(135deg, #7c3aed, #9f46f5)" : "linear-gradient(135deg, #5B0E14, #9A1E28)"
                  : darkMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
                color: source === key ? "white" : textSub,
                border: source === key ? "2px solid transparent" : `2px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Group filter (only for regular) */}
        {source === "regular" && categoryGroups.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4 px-1">
            <button
              data-testid="group-filter-all"
              onClick={() => setActiveGroupId("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                activeGroupId === "all"
                  ? "bg-primary text-secondary border-primary"
                  : "bg-white/10 text-secondary/70 border-secondary/20 hover:border-secondary/50"
              }`}
            >
              الكل ({categories.length})
            </button>
            {categoryGroups.map(g => {
              const count = categories.filter(c => c.group_id === g.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={g.id}
                  data-testid={`group-filter-${g.id}`}
                  onClick={() => setActiveGroupId(g.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                    activeGroupId === g.id
                      ? "text-white border-transparent"
                      : "bg-white/10 text-secondary/70 border-secondary/20 hover:border-secondary/50"
                  }`}
                  style={activeGroupId === g.id ? { background: g.color, borderColor: g.color } : {}}
                >
                  {g.icon} {g.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(clamp(160px, 20vw, 240px), 1fr))" }}>
          {source === "regular"
            ? visibleReg.map(cat => renderCard(cat))
            : commCats.map(cat => renderCard(cat))
          }
        </div>

        {/* Community loading skeleton */}
        {source === "community" && commLoading && (
          <div className="flex justify-center py-6">
            <div className="text-sm font-bold" style={{ color: textSub }}>جاري تحميل المزيد...</div>
          </div>
        )}

        {/* Community empty */}
        {source === "community" && !commLoading && commCats.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-2">
            <span style={{ fontSize: "3rem" }}>👥</span>
            <div className="font-bold text-center" style={{ color: textSub }}>لا توجد فئات مجتمعية بعد</div>
          </div>
        )}

        {/* Community end */}
        {source === "community" && !commHasMore && commCats.length > 0 && (
          <div className="text-center py-4 text-xs font-bold" style={{ color: textSub }}>
            تم عرض جميع الفئات ({commCats.length})
          </div>
        )}

        {/* Regular end */}
        {source === "regular" && regVisible >= filteredReg.length && filteredReg.length > 0 && (
          <div className="text-center py-4 text-xs font-bold" style={{ color: textSub }}>
            تم عرض جميع الفئات ({filteredReg.length})
          </div>
        )}

        {/* Sentinel for IntersectionObserver */}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>

      {/* Bottom action */}
      <div className="shrink-0 px-4 pb-5 pt-3 border-t"
        style={{ borderColor: darkMode ? "rgba(120,170,90,0.2)" : "rgba(0,0,0,0.08)" }}>
        {isPremiumUser ? (
          <div className="flex gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl font-black text-lg transition-all"
                style={{
                  background: darkMode ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.7)",
                  color: textMain,
                  border: `2px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                }}>
                رجوع
              </button>
            )}
            <button
              data-testid="confirm-categories-btn"
              onClick={handleConfirm}
              disabled={loading || activeSel.length < NEEDED}
              className="flex-1 py-3 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ background: teamColor, color: "white" }}>
              {loading ? "جاري التحميل..." : step === 1 ? `التالي — ${session?.team2_name} ←` : "ابدأ اللعبة!"}
            </button>
          </div>
        ) : (
          <button
            data-testid="confirm-categories-btn"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #5B0E14, #9A1E28)", color: "#F1E194" }}>
            {loading ? "جاري التحميل..." : "ابدأ اللعبة! 🎮"}
          </button>
        )}
        {!isPremiumUser && (
          <p className="text-center mt-2 text-xs font-bold" style={{ color: textSub }}>
            <span className="cursor-pointer underline" onClick={() => navigate("/pricing")}
              style={{ color: "#B8860B" }}>اشترك في Premium</span>
            {" "}لاختيار فئاتك بحرية والوصول لـ 10 فئات إضافية
          </p>
        )}
      </div>
    </div>
  );
}
