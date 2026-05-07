import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

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

function Section({ title, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 20, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1, fontSize: 11 }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6, fontWeight: 700 }}>{label}</label>
      {children}
    </div>
  );
}

const INPUT = {
  width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.13)",
  borderRadius: 10, padding: "11px 14px", color: "#f8f2e7", fontSize: 14,
  fontFamily: "Cairo, sans-serif", outline: "none", boxSizing: "border-box",
  transition: "border 0.2s",
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, userToken, refreshUser } = useGame();

  const [username,   setUsername]   = useState(currentUser?.username || "");
  const [bio,        setBio]        = useState(currentUser?.bio || "");
  const [interests,  setInterests]  = useState((currentUser?.interests || []).join("، "));
  const [accent,     setAccent]     = useState(currentUser?.accent_color || "#f2b85b");
  const [avatarUrl,  setAvatarUrl]  = useState(currentUser?.avatar_url || "");
  const [bannerUrl,  setBannerUrl]  = useState(currentUser?.banner_url || "");
  const [oldPw,      setOldPw]      = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw,      setSavingPw]      = useState(false);
  const [uploadingAv,   setUploadingAv]   = useState(false);
  const [uploadingBn,   setUploadingBn]   = useState(false);

  const avatarRef = useRef(null);
  const bannerRef = useRef(null);

  if (!currentUser) { navigate("/login"); return null; }

  const h = { headers: { Authorization: `Bearer ${userToken}` } };

  /* ── Upload helper ── */
  const uploadImage = async (file, setter, setLoading) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { toast.error("JPG / PNG / WEBP فقط"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("الحجم الأقصى 5 ميغابايت"); return; }
    setLoading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const { data } = await axios.post(`${API}/community/upload`, form, {
        headers: { Authorization: `Bearer ${userToken}`, "Content-Type": "multipart/form-data" },
      });
      setter(data.url);
      toast.success("تم رفع الصورة ✓");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "فشل الرفع");
    } finally { setLoading(false); }
  };

  /* ── Save profile ── */
  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const interestArr = interests.split(/[،,]/).map(s => s.trim()).filter(Boolean);
      await axios.put(`${API}/auth/me`, {
        username:     username !== currentUser.username ? username : undefined,
        bio,
        interests:    interestArr,
        accent_color: accent,
        avatar_url:   avatarUrl,
        banner_url:   bannerUrl,
      }, h);
      await refreshUser();
      toast.success("تم حفظ الملف الشخصي ✓");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ في الحفظ");
    } finally { setSavingProfile(false); }
  };

  /* ── Change password ── */
  const changePassword = async () => {
    if (!oldPw) { toast.error("ادخل كلمة المرور الحالية"); return; }
    if (newPw.length < 6) { toast.error("كلمة المرور الجديدة قصيرة (6 أحرف كحد أدنى)"); return; }
    if (newPw !== confirmPw) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setSavingPw(true);
    try {
      await axios.put(`${API}/auth/me`, { password: newPw }, h);
      setOldPw(""); setNewPw(""); setConfirmPw("");
      toast.success("تم تغيير كلمة المرور ✓");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ");
    } finally { setSavingPw(false); }
  };

  const isPremium = currentUser.subscription_type === "premium";

  return (
    <div style={{ minHeight: "100vh", background: "#09070b", fontFamily: "Cairo, sans-serif", direction: "rtl", color: "#f8f2e7" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, background: "rgba(9,7,11,0.95)", backdropFilter: "blur(12px)", zIndex: 10 }}>
        <button onClick={() => navigate(-1)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13 }}>
          ← رجوع
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>إعدادات الحساب</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>@{currentUser.username}</div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* ── PROFILE PICTURE ─────────────────────────────────── */}
        <Section title="الصورة الشخصية">
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            {/* Preview */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.15)" }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(241,225,148,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#F1E194", border: "2px solid rgba(241,225,148,0.2)" }}>
                  {(currentUser.username || "؟")[0].toUpperCase()}
                </div>
              )}
              {avatarUrl && (
                <button onClick={() => setAvatarUrl("")}
                  style={{ position:"absolute",top:-4,right:-4,background:"#ff5f6d",border:"none",borderRadius:"50%",width:20,height:20,color:"#fff",cursor:"pointer",fontSize:11,lineHeight:"20px",textAlign:"center" }}>✕</button>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => avatarRef.current?.click()} disabled={uploadingAv}
                  style={{ background: "linear-gradient(135deg,#f2b85b,#ff8f3d)", color: "#1a0f10", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", opacity: uploadingAv ? 0.6 : 1 }}>
                  {uploadingAv ? "⏳ جاري الرفع..." : "📁 رفع صورة"}
                </button>
                <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                  onChange={e => uploadImage(e.target.files?.[0], setAvatarUrl, setUploadingAv)} />
              </div>
              <input style={{ ...INPUT, fontSize: 12, padding: "8px 12px", direction: "ltr" }}
                value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="أو الصق رابط صورة..." />
            </div>
          </div>
        </Section>

        {/* ── PROFILE INFO ─────────────────────────────────────── */}
        <Section title="معلومات الملف الشخصي">
          <Field label="اسم المستخدم">
            <input style={INPUT} value={username} onChange={e => setUsername(e.target.value)} />
          </Field>
          <Field label="Bio — نبذة عنك">
            <textarea style={{ ...INPUT, resize: "vertical", minHeight: 80 }}
              value={bio} onChange={e => setBio(e.target.value)} maxLength={300}
              placeholder="اكتب شيئاً عن نفسك..." />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "left", marginTop: 4 }}>{bio.length}/300</div>
          </Field>
          <Field label="الاهتمامات (مفصولة بفاصلة)">
            <input style={INPUT} value={interests} onChange={e => setInterests(e.target.value)}
              placeholder="مثال: أفلام، رياضة، علوم، تقنية" />
          </Field>
        </Section>

        {/* ── APPEARANCE ───────────────────────────────────────── */}
        <Section title="المظهر">
          {/* Accent color */}
          <Field label="لون البروفايل">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {ACCENTS.map(a => (
                <button key={a.color} onClick={() => setAccent(a.color)} title={a.label}
                  style={{
                    width: 36, height: 36, borderRadius: "50%", background: a.color, border: "none", cursor: "pointer",
                    border: `3px solid ${accent === a.color ? "#fff" : "transparent"}`,
                    boxShadow: accent === a.color ? `0 0 12px ${a.color}` : "none",
                    transition: "all 0.2s", flexShrink: 0,
                  }} />
              ))}
            </div>
          </Field>

          {/* Banner */}
          <Field label="صورة الخلفية (Banner)">
            {bannerUrl && (
              <div style={{ position: "relative", marginBottom: 8, display: "inline-block" }}>
                <img src={bannerUrl} alt="" style={{ height: 60, width: 180, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }} />
                <button onClick={() => setBannerUrl("")}
                  style={{ position:"absolute",top:-5,right:-5,background:"#ff5f6d",border:"none",borderRadius:"50%",width:18,height:18,color:"#fff",cursor:"pointer",fontSize:10,lineHeight:"18px",textAlign:"center" }}>✕</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => bannerRef.current?.click()} disabled={uploadingBn}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "9px 14px", color: "#f8f2e7", cursor: "pointer", fontSize: 12, fontFamily: "Cairo, sans-serif", fontWeight: 700, flexShrink: 0, opacity: uploadingBn ? 0.6 : 1 }}>
                {uploadingBn ? "⏳" : "📁 رفع"}
              </button>
              <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                onChange={e => uploadImage(e.target.files?.[0], setBannerUrl, setUploadingBn)} />
              <input style={{ ...INPUT, fontSize: 12, padding: "8px 12px", direction: "ltr", flex: 1 }}
                value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="أو رابط صورة..." />
            </div>
          </Field>
        </Section>

        {/* Save profile */}
        <button onClick={saveProfile} disabled={savingProfile}
          style={{ width: "100%", background: "linear-gradient(135deg,#f2b85b,#ff8f3d)", color: "#1a0f10", border: "none", borderRadius: 14, padding: "14px", fontWeight: 900, cursor: "pointer", fontSize: 15, fontFamily: "Cairo, sans-serif", marginBottom: 20, opacity: savingProfile ? 0.7 : 1, transition: "opacity 0.2s" }}>
          {savingProfile ? "⏳ جاري الحفظ..." : "حفظ الملف الشخصي"}
        </button>

        {/* ── SECURITY ─────────────────────────────────────────── */}
        <Section title="الأمان — تغيير كلمة المرور">
          <Field label="كلمة المرور الحالية">
            <input style={INPUT} type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="••••••" />
          </Field>
          <Field label="كلمة المرور الجديدة">
            <input style={INPUT} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="6 أحرف على الأقل" />
          </Field>
          <Field label="تأكيد كلمة المرور">
            <input style={INPUT} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="أعد كتابة كلمة المرور الجديدة" />
          </Field>
          <button onClick={changePassword} disabled={savingPw}
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "11px 20px", color: "#f8f2e7", cursor: "pointer", fontSize: 14, fontFamily: "Cairo, sans-serif", fontWeight: 800, opacity: savingPw ? 0.6 : 1, transition: "opacity 0.2s" }}>
            {savingPw ? "⏳ جاري التغيير..." : "تغيير كلمة المرور"}
          </button>
        </Section>

        {/* ── SUBSCRIPTION ─────────────────────────────────────── */}
        <Section title="الاشتراك">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: isPremium ? "#f59e0b" : "#f8f2e7" }}>
                {isPremium ? "✦ عضو مميز (Premium)" : "الخطة المجانية"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                {isPremium
                  ? currentUser.subscription_expires_at
                    ? `تنتهي في: ${new Date(currentUser.subscription_expires_at).toLocaleDateString("ar-SA")}`
                    : "اشتراك نشط"
                  : "مع Premium تحصل على فئات غير محدودة وميزة إنشاء المحتوى"
                }
              </div>
            </div>
            {!isPremium && (
              <button onClick={() => navigate("/pricing")}
                style={{ background: "linear-gradient(135deg,#f2b85b,#ff8f3d)", color: "#1a0f10", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 900, cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", flexShrink: 0 }}>
                ترقية ✦
              </button>
            )}
          </div>
        </Section>

        {/* View profile */}
        <button onClick={() => navigate(`/profile/${currentUser.username}`)}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "13px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14, fontFamily: "Cairo, sans-serif", fontWeight: 700, marginTop: 6 }}>
          👤 عرض بروفايلي العام
        </button>
      </div>
    </div>
  );
}
