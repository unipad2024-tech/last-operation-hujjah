import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

const LEVEL_TITLES = [
  { min: 1,  max: 4,  title: "مبتدئ",     color: "#9ca3af" },
  { min: 5,  max: 9,  title: "متحمس",     color: "#60a5fa" },
  { min: 10, max: 19, title: "متمرس",     color: "#34d399" },
  { min: 20, max: 34, title: "خبير",      color: "#f59e0b" },
  { min: 35, max: 49, title: "بطل",       color: "#f97316" },
  { min: 50, max: 99, title: "أسطورة",   color: "#a855f7" },
  { min: 100, max: Infinity, title: "نخبة", color: "#f2b85b" },
];

function getLevelInfo(level) {
  return LEVEL_TITLES.find(l => level >= l.min && level <= l.max) || LEVEL_TITLES[0];
}

function Avatar({ url, username, size = 80 }) {
  const colors = ["#5B0E14","#7c3aed","#0369a1","#065f46","#92400e","#1e40af","#be185d"];
  const color  = colors[(username?.charCodeAt(0) || 0) % colors.length];
  if (url) {
    return (
      <img src={url} alt={username}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(242,184,91,0.5)" }}
        onError={e => { e.target.style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 900, color: "#fff",
      border: "3px solid rgba(242,184,91,0.4)", flexShrink: 0,
      fontFamily: "Cairo, sans-serif",
    }}>
      {username?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #281525 0%, #120d14 60%, #09070b 100%)",
    color: "#f8f2e7",
    padding: "24px 16px 60px",
    fontFamily: "Cairo, sans-serif",
    direction: "rtl",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: 18,
    backdropFilter: "blur(16px)",
  },
  btnPrimary: {
    background: "linear-gradient(90deg,#f2b85b,#ff8f3d)",
    color: "#1a0f10", border: "none", borderRadius: 12,
    padding: "10px 20px", fontWeight: 800, cursor: "pointer",
    fontSize: 14, fontFamily: "Cairo, sans-serif", transition: "transform 0.15s",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.08)",
    color: "#f8f2e7", border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12, padding: "10px 20px",
    fontWeight: 700, cursor: "pointer", fontSize: 14,
    fontFamily: "Cairo, sans-serif",
  },
  input: {
    width: "100%", background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
    padding: "11px 14px", color: "#f8f2e7", fontSize: 14,
    fontFamily: "Cairo, sans-serif", outline: "none", boxSizing: "border-box",
  },
  label: { fontSize: 12, color: "#d8cdb8", marginBottom: 5, display: "block", fontWeight: 700 },
};

const TABS = ["الملف", "الفئات", "المتابعون", "المتابَعون"];

export default function ProfilePage() {
  const { username: paramUsername } = useParams();
  const navigate  = useNavigate();
  const { currentUser, userToken, refreshUser } = useGame();

  const viewingUsername = paramUsername || currentUser?.username;

  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState(0);
  const [editing,       setEditing]       = useState(false);
  const [editBio,       setEditBio]       = useState("");
  const [editAvatar,    setEditAvatar]    = useState("");
  const [editUsername,  setEditUsername]  = useState("");
  const [saving,        setSaving]        = useState(false);
  const [following,     setFollowing]     = useState(false);

  // Cats
  const [cats,          setCats]          = useState([]);
  const [catsPage,      setCatsPage]      = useState(0);
  const [catsHasMore,   setCatsHasMore]   = useState(true);
  const [catsLoading,   setCatsLoading]   = useState(false);

  // Followers / Following
  const [followers,     setFollowers]     = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [socialLoaded,  setSocialLoaded]  = useState(false);

  const h = userToken ? { headers: { Authorization: `Bearer ${userToken}` } } : {};

  const loadProfile = useCallback(async () => {
    if (!viewingUsername) { navigate("/login"); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/profile/${viewingUsername}`, h);
      setProfile(data);
      setEditBio(data.bio || "");
      setEditAvatar(data.avatar_url || "");
      setEditUsername(data.username || "");
    } catch (e) {
      if (e?.response?.status === 404) toast.error("المستخدم غير موجود");
      else toast.error("خطأ في تحميل الملف");
    } finally {
      setLoading(false);
    }
  }, [viewingUsername, userToken]); // eslint-disable-line

  const loadCats = useCallback(async (page) => {
    if (!viewingUsername || catsLoading) return;
    setCatsLoading(true);
    try {
      const { data } = await axios.get(`${API}/profile/${viewingUsername}/categories`, {
        params: { skip: page * 12, limit: 12 },
      });
      if (data.length < 12) setCatsHasMore(false);
      setCats(prev => page === 0 ? data : [...prev, ...data]);
      setCatsPage(page + 1);
    } catch { /* silent */ }
    finally { setCatsLoading(false); }
  }, [viewingUsername, catsLoading]); // eslint-disable-line

  const loadSocial = useCallback(async () => {
    if (!viewingUsername || socialLoaded) return;
    try {
      const [frs, fng] = await Promise.all([
        axios.get(`${API}/profile/${viewingUsername}/followers`),
        axios.get(`${API}/profile/${viewingUsername}/following`),
      ]);
      setFollowers(frs.data);
      setFollowingList(fng.data);
      setSocialLoaded(true);
    } catch { /* silent */ }
  }, [viewingUsername, socialLoaded]); // eslint-disable-line

  useEffect(() => {
    loadProfile();
  }, [viewingUsername]); // eslint-disable-line

  useEffect(() => {
    if (tab === 1 && cats.length === 0) loadCats(0);
    if ((tab === 2 || tab === 3) && !socialLoaded) loadSocial();
  }, [tab]); // eslint-disable-line

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleFollow = async () => {
    if (!userToken) { navigate("/login"); return; }
    setFollowing(true);
    try {
      if (profile.is_following) {
        await axios.delete(`${API}/profile/${profile.username}/follow`, h);
        setProfile(p => ({ ...p, is_following: false, followers_count: p.followers_count - 1 }));
        toast.success("تم إلغاء المتابعة");
      } else {
        await axios.post(`${API}/profile/${profile.username}/follow`, {}, h);
        setProfile(p => ({ ...p, is_following: true, followers_count: p.followers_count + 1 }));
        toast.success("تمت المتابعة");
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ");
    } finally {
      setFollowing(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/auth/me`, {
        bio: editBio,
        avatar_url: editAvatar,
        username: editUsername !== profile.username ? editUsername : undefined,
      }, h);
      await refreshUser();
      await loadProfile();
      setEditing(false);
      toast.success("تم حفظ التغييرات");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const shareCategory = (cat) => {
    const url = `${window.location.origin}/categories?community=${cat.id}`;
    if (navigator.share) {
      navigator.share({ title: cat.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط!");
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#d8cdb8", fontSize: 16 }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ ...S.page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>المستخدم غير موجود</div>
        <button style={S.btnSecondary} onClick={() => navigate("/")}>رجوع للرئيسية</button>
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile.level);

  const renderProfileTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Edit form */}
      {editing && profile.is_own && (
        <div style={{ ...S.card, borderColor: "rgba(242,184,91,0.3)", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#f2b85b", marginBottom: 4 }}>تعديل الملف الشخصي</div>
          <div>
            <label style={S.label}>اسم المستخدم</label>
            <input style={S.input} value={editUsername} onChange={e => setEditUsername(e.target.value)} />
          </div>
          <div>
            <label style={S.label}>نبذة عنك (Bio)</label>
            <textarea
              style={{ ...S.input, resize: "vertical", minHeight: 80 }}
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              maxLength={300}
              placeholder="اكتب شيئاً عن نفسك..."
            />
            <div style={{ fontSize: 11, color: "#d8cdb8", textAlign: "left" }}>{editBio.length}/300</div>
          </div>
          <div>
            <label style={S.label}>رابط صورة الملف (URL)</label>
            <input style={{ ...S.input, direction: "ltr" }} value={editAvatar}
              onChange={e => setEditAvatar(e.target.value)} placeholder="https://..." />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={S.btnPrimary} onClick={handleSaveProfile} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button style={S.btnSecondary} onClick={() => setEditing(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { v: profile.approved_categories, l: "فئة", icon: "📚" },
          { v: profile.total_plays,         l: "لعبة", icon: "🎮" },
          { v: profile.total_likes,         l: "إعجاب", icon: "❤️" },
          { v: profile.game_count,          l: "كويز", icon: "🎯" },
        ].map(({ v, l, icon }) => (
          <div key={l} style={{ ...S.card, flex: "1 1 100px", textAlign: "center", padding: "14px 10px" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#f2b85b", lineHeight: 1 }}>{v ?? 0}</div>
            <div style={{ fontSize: 12, color: "#d8cdb8", marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Earnings (own only) */}
      {profile.is_own && profile.wallet && (
        <div style={{ ...S.card, borderColor: "rgba(64,212,140,0.2)", background: "rgba(64,212,140,0.03)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#73f0a8", marginBottom: 12 }}>💰 أرباحك</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#f2b85b", lineHeight: 1 }}>
                {profile.wallet.balance?.toFixed(2) ?? "0.00"}
                <span style={{ fontSize: 14, fontWeight: 700 }}> ريال</span>
              </div>
              <div style={{ fontSize: 11, color: "#d8cdb8", marginTop: 3 }}>الرصيد المتاح</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#73f0a8" }}>
                {profile.wallet.monthly_pending_sar?.toFixed(2) ?? "0.00"} ريال
              </div>
              <div style={{ fontSize: 11, color: "#d8cdb8", marginTop: 3 }}>هذا الشهر</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f2b85b" }}>
                {profile.wallet.total_earned?.toFixed(2) ?? "0.00"} ريال
              </div>
              <div style={{ fontSize: 11, color: "#d8cdb8", marginTop: 3 }}>إجمالي الأرباح</div>
            </div>
          </div>
          <button style={{ ...S.btnPrimary, marginTop: 14, fontSize: 13 }}
            onClick={() => navigate("/community")}>
            إدارة الأرباح والسحب
          </button>
        </div>
      )}
    </div>
  );

  const renderCatsTab = () => (
    <div>
      {cats.length === 0 && !catsLoading && (
        <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
          <div style={{ color: "#d8cdb8" }}>لا توجد فئات معتمدة بعد</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cats.map(cat => (
          <div key={cat.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>
                  {cat.icon && <span style={{ marginLeft: 6 }}>{cat.icon}</span>}
                  {cat.name}
                </div>
                {cat.description && (
                  <div style={{ fontSize: 12, color: "#d8cdb8", marginBottom: 8 }}>{cat.description}</div>
                )}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#d8cdb8" }}>🎮 {cat.play_count || 0} لعبة</span>
                  <span style={{ fontSize: 12, color: "#d8cdb8" }}>❤️ {cat.likes_count || 0} إعجاب</span>
                  <span style={{ fontSize: 12, color: "#d8cdb8" }}>📝 {cat.questions_count} سؤال</span>
                </div>
              </div>
              <button
                style={{ ...S.btnSecondary, padding: "8px 14px", fontSize: 12, flexShrink: 0 }}
                onClick={() => shareCategory(cat)}
              >
                مشاركة 🔗
              </button>
            </div>
          </div>
        ))}
      </div>
      {catsLoading && (
        <div style={{ textAlign: "center", padding: 20, color: "#d8cdb8" }}>جاري التحميل...</div>
      )}
      {catsHasMore && !catsLoading && cats.length > 0 && (
        <button style={{ ...S.btnSecondary, width: "100%", marginTop: 12, textAlign: "center" }}
          onClick={() => loadCats(catsPage)}>
          تحميل المزيد
        </button>
      )}
    </div>
  );

  const renderUserList = (list, emptyMsg) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 40, color: "#d8cdb8" }}>{emptyMsg}</div>
      )}
      {list.map(u => (
        <div key={u.id} style={{ ...S.card, cursor: "pointer" }}
          onClick={() => navigate(`/profile/${u.username}`)}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar url={u.avatar_url} username={u.username} size={46} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                {u.username}
                {u.subscription_type === "premium" && (
                  <span style={{ marginRight: 6, fontSize: 11, background: "rgba(234,179,8,0.2)", color: "#f59e0b", padding: "2px 7px", borderRadius: 999 }}>⭐ Premium</span>
                )}
              </div>
              {u.bio && <div style={{ fontSize: 12, color: "#d8cdb8", marginTop: 2 }}>{u.bio}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Back */}
        <button onClick={() => navigate(-1)}
          style={{ color: "rgba(242,184,91,0.5)", background: "none", border: "none", cursor: "pointer", marginBottom: 20, fontSize: 14, fontFamily: "Cairo, sans-serif" }}>
          ← رجوع
        </button>

        {/* Profile header */}
        <div style={{ ...S.card, marginBottom: 20, borderColor: "rgba(242,184,91,0.2)" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Avatar url={profile.avatar_url} username={profile.username} size={80} />
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{profile.username}</div>
                {profile.subscription_type === "premium" && (
                  <span style={{ fontSize: 11, background: "rgba(234,179,8,0.15)", color: "#f59e0b", padding: "3px 9px", borderRadius: 999, fontWeight: 700 }}>⭐ Premium</span>
                )}
              </div>

              {/* Level badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${levelInfo.color}18`, border: `1px solid ${levelInfo.color}40`, borderRadius: 999, padding: "4px 12px", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: levelInfo.color }}>Lv.{profile.level}</span>
                <span style={{ fontSize: 11, color: levelInfo.color, fontWeight: 700 }}>{levelInfo.title}</span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div style={{ fontSize: 13, color: "#d8cdb8", marginBottom: 8, lineHeight: 1.6 }}>{profile.bio}</div>
              )}

              {/* Social counts */}
              <div style={{ display: "flex", gap: 18, fontSize: 13 }}>
                <span style={{ color: "#f8f2e7", fontWeight: 700 }}>
                  <span style={{ color: "#f2b85b", fontWeight: 900 }}>{profile.followers_count}</span> متابع
                </span>
                <span style={{ color: "#f8f2e7", fontWeight: 700 }}>
                  <span style={{ color: "#f2b85b", fontWeight: 900 }}>{profile.following_count}</span> يتابع
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              {profile.is_own ? (
                <button style={{ ...S.btnPrimary, fontSize: 13, padding: "8px 16px" }}
                  onClick={() => setEditing(e => !e)}>
                  {editing ? "✕ إغلاق" : "✏️ تعديل"}
                </button>
              ) : userToken ? (
                <button
                  style={{
                    ...profile.is_following ? S.btnSecondary : S.btnPrimary,
                    fontSize: 13, padding: "8px 16px",
                    opacity: following ? 0.6 : 1,
                  }}
                  onClick={handleFollow} disabled={following}>
                  {following ? "..." : profile.is_following ? "إلغاء المتابعة" : "+ متابعة"}
                </button>
              ) : (
                <button style={{ ...S.btnPrimary, fontSize: 13, padding: "8px 16px" }}
                  onClick={() => navigate("/login")}>
                  + متابعة
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 5 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              style={{
                flex: "1 1 60px", padding: "9px 8px", borderRadius: 10, border: "none",
                fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer",
                transition: "all 0.2s",
                background: tab === i ? "linear-gradient(90deg,#f2b85b,#ff8f3d)" : "transparent",
                color: tab === i ? "#1a0f10" : "#d8cdb8",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 0 && renderProfileTab()}
        {tab === 1 && renderCatsTab()}
        {tab === 2 && renderUserList(followers, "لا يوجد متابعون بعد")}
        {tab === 3 && renderUserList(followingList, "لا يتابع أحداً بعد")}
      </div>
    </div>
  );
}
