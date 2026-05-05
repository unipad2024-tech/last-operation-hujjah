import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

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
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    backdropFilter: "blur(16px)",
  },
  statBox: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: "18px 20px",
    flex: "1 1 160px",
  },
  statValue: { fontSize: 34, fontWeight: 900, color: "#f2b85b", lineHeight: 1 },
  statLabel: { fontSize: 13, color: "#d8cdb8", marginTop: 5 },
  btnPrimary: {
    background: "linear-gradient(90deg, #f2b85b 0%, #ff8f3d 100%)",
    color: "#1a0f10",
    border: "none",
    borderRadius: 14,
    padding: "12px 20px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "Cairo, sans-serif",
    transition: "transform 0.2s, opacity 0.2s",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.08)",
    color: "#f8f2e7",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 14,
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "Cairo, sans-serif",
  },
  btnDanger: {
    background: "rgba(255,95,109,0.12)",
    color: "#ff8b95",
    border: "1px solid rgba(255,95,109,0.25)",
    borderRadius: 10,
    padding: "8px 14px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "Cairo, sans-serif",
  },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: "12px 16px",
    color: "#f8f2e7",
    fontSize: 14,
    fontFamily: "Cairo, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  label: { fontSize: 13, color: "#d8cdb8", marginBottom: 6, display: "block", fontWeight: 700 },
  sectionTitle: { fontSize: 22, fontWeight: 800, color: "#f8f2e7", marginBottom: 4 },
  sectionSub: { fontSize: 14, color: "#d8cdb8", marginBottom: 20 },
};

const BADGE = {
  draft:          { bg: "rgba(255,255,255,0.08)", color: "#d8cdb8",   label: "مسودة" },
  pending_review: { bg: "rgba(255,204,102,0.15)", color: "#ffd86b",   label: "قيد المراجعة" },
  approved:       { bg: "rgba(64,212,140,0.15)",  color: "#73f0a8",   label: "معتمدة" },
  rejected:       { bg: "rgba(255,95,109,0.15)",  color: "#ff8b95",   label: "مرفوضة" },
};

const PAYOUT_BADGE = {
  pending:  { bg: "rgba(255,204,102,0.15)", color: "#ffd86b", label: "معلق" },
  approved: { bg: "rgba(64,212,140,0.15)",  color: "#73f0a8", label: "موافق عليه" },
  paid:     { bg: "rgba(64,212,140,0.20)",  color: "#40d48c", label: "تم التحويل" },
  rejected: { bg: "rgba(255,95,109,0.15)",  color: "#ff8b95", label: "مرفوض" },
};

function Badge({ map, status }) {
  const b = map[status] || { bg: "rgba(255,255,255,0.08)", color: "#d8cdb8", label: status };
  return (
    <span style={{ background: b.bg, color: b.color, padding: "5px 12px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>
      {b.label}
    </span>
  );
}

const TABS = ["لوحتي", "فئاتي", "السحب", "الإشعارات"];

export default function CommunityPage() {
  const navigate = useNavigate();
  const { currentUser, userToken } = useGame();
  const [tab, setTab] = useState(0);

  // Wallet
  const [wallet, setWallet] = useState(null);
  // Categories
  const [cats, setCats] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  // Create category
  const [showCreate, setShowCreate] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [creating, setCreating] = useState(false);
  // Manage category questions
  const [selectedCat, setSelectedCat] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qText, setQText] = useState("");
  const [qAnswer, setQAnswer] = useState("");
  const [qDiff, setQDiff] = useState("medium");
  const [addingQ, setAddingQ] = useState(false);
  // Payouts
  const [payouts, setPayouts] = useState([]);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payIban, setPayIban] = useState("");
  const [payName, setPayName] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);
  // Notifications
  const [notifs, setNotifs] = useState([]);

  const h = { headers: { Authorization: `Bearer ${userToken}` } };

  const loadWallet = useCallback(async () => {
    try { const { data } = await axios.get(`${API}/community/wallet`, h); setWallet(data); }
    catch { /* silent */ }
  }, [userToken]);

  const loadCats = useCallback(async () => {
    setLoadingCats(true);
    try { const { data } = await axios.get(`${API}/community/categories/mine`, h); setCats(data); }
    catch { /* silent */ }
    finally { setLoadingCats(false); }
  }, [userToken]);

  const loadPayouts = useCallback(async () => {
    try { const { data } = await axios.get(`${API}/community/payouts`, h); setPayouts(data); }
    catch { /* silent */ }
  }, [userToken]);

  const loadNotifs = useCallback(async () => {
    try { const { data } = await axios.get(`${API}/community/notifications`, h); setNotifs(data); }
    catch { /* silent */ }
  }, [userToken]);

  const loadQuestions = useCallback(async (cat) => {
    try { const { data } = await axios.get(`${API}/community/categories/${cat.id}/questions`, h); setQuestions(data); }
    catch { /* silent */ }
  }, [userToken]);

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    loadWallet();
    loadCats();
    loadPayouts();
    loadNotifs();
  }, [currentUser]);

  const handleCreateCat = async () => {
    if (!catName.trim()) { toast.error("ادخل اسم الفئة"); return; }
    setCreating(true);
    try {
      const { data } = await axios.post(`${API}/community/categories`, { name: catName, description: catDesc }, h);
      setCats(p => [data, ...p]);
      toast.success("تم إنشاء الفئة");
      setCatName(""); setCatDesc(""); setShowCreate(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ");
    } finally { setCreating(false); }
  };

  const handleDeleteCat = async (cat) => {
    if (!window.confirm(`حذف فئة "${cat.name}"؟`)) return;
    try {
      await axios.delete(`${API}/community/categories/${cat.id}`, h);
      setCats(p => p.filter(c => c.id !== cat.id));
      toast.success("تم الحذف");
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
  };

  const handleOpenCat = async (cat) => {
    setSelectedCat(cat);
    await loadQuestions(cat);
  };

  const handleAddQuestion = async () => {
    if (!qText.trim() || !qAnswer.trim()) { toast.error("السؤال والجواب مطلوبان"); return; }
    setAddingQ(true);
    try {
      const { data } = await axios.post(
        `${API}/community/categories/${selectedCat.id}/questions`,
        { text: qText, answer: qAnswer, difficulty: qDiff }, h
      );
      setQuestions(p => [...p, data]);
      setCats(p => p.map(c => c.id === selectedCat.id ? { ...c, questions_count: c.questions_count + 1 } : c));
      setSelectedCat(p => ({ ...p, questions_count: p.questions_count + 1 }));
      setQText(""); setQAnswer(""); setQDiff("medium");
      toast.success("تمت إضافة السؤال");
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
    finally { setAddingQ(false); }
  };

  const handleDeleteQuestion = async (q) => {
    try {
      await axios.delete(`${API}/community/categories/${selectedCat.id}/questions/${q.id}`, h);
      setQuestions(p => p.filter(x => x.id !== q.id));
      setCats(p => p.map(c => c.id === selectedCat.id ? { ...c, questions_count: c.questions_count - 1 } : c));
      setSelectedCat(p => ({ ...p, questions_count: p.questions_count - 1 }));
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
  };

  const handleSubmit = async (cat) => {
    if (cat.questions_count < 24) {
      toast.error(`يجب إضافة 24 سؤالاً على الأقل (لديك ${cat.questions_count})`);
      return;
    }
    try {
      await axios.post(`${API}/community/categories/${cat.id}/submit`, {}, h);
      setCats(p => p.map(c => c.id === cat.id ? { ...c, status: "pending_review" } : c));
      if (selectedCat?.id === cat.id) setSelectedCat(p => ({ ...p, status: "pending_review" }));
      toast.success("تم الإرسال للمراجعة!");
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
  };

  const handlePayoutRequest = async () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt < 50) { toast.error("الحد الأدنى للسحب 50 ريال"); return; }
    if (!payIban.trim() || !payName.trim()) { toast.error("الآيبان واسم الحساب مطلوبان"); return; }
    setRequestingPayout(true);
    try {
      const { data } = await axios.post(`${API}/community/payouts`,
        { amount: amt, iban: payIban, account_name: payName }, h);
      setPayouts(p => [data, ...p]);
      loadWallet();
      setShowPayoutForm(false);
      setPayAmount(""); setPayIban(""); setPayName("");
      toast.success("تم إرسال طلب السحب");
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
    finally { setRequestingPayout(false); }
  };

  const handleMarkRead = async () => {
    await axios.patch(`${API}/community/notifications/read`, {}, h);
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
  };

  const isPremium = currentUser?.subscription_type === "premium";

  // ── Render ────────────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>لوحة الإنشاء</div>
        <div style={S.sectionSub}>أرباحك ونشاطك كمنشئ محتوى</div>
      </div>

      {/* Wallet Card */}
      <div style={{
        ...S.card,
        marginBottom: 20,
        background: "rgba(10,5,12,0.55)",
        borderColor: "rgba(242,184,91,0.35)",
        position: "relative",
        overflow: "hidden",
        minHeight: 160,
      }}>
        {/* white/parchment bg image */}
        <img src="https://i.pinimg.com/1200x/13/e0/e8/13e0e8fb92e5ab693aee15803c70cac0.jpg"
          alt="" aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: 0.13, borderRadius: 22, pointerEvents: "none", userSelect: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,5,12,0.6)", borderRadius: 22, pointerEvents: "none" }} />

        {/* content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 13, color: "#d8cdb8", marginBottom: 6, fontWeight: 700 }}>الرصيد المتاح</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: "#f2b85b", lineHeight: 1 }}>
            {wallet ? wallet.balance?.toFixed(2) : "—"} <span style={{ fontSize: 20, fontWeight: 700 }}>ريال</span>
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "#d8cdb8" }}>إجمالي الأرباح</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f2b85b" }}>{wallet?.total_earned?.toFixed(2) || "0.00"} ر</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#d8cdb8" }}>تم سحبه</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#73f0a8" }}>{wallet?.total_withdrawn?.toFixed(2) || "0.00"} ر</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#d8cdb8" }}>النقاط</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f2b85b" }}>{wallet?.points || 0}</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button style={S.btnPrimary} onClick={() => setTab(2)}>طلب سحب</button>
          </div>
        </div>
      </div>

      {/* Monthly earnings card */}
      <div style={{ ...S.card, marginBottom: 20, borderColor: "rgba(115,240,168,0.2)", background: "rgba(64,212,140,0.04)" }}>
        <div style={{ fontSize: 13, color: "#d8cdb8", fontWeight: 700, marginBottom: 6 }}>
          هذا الشهر ({wallet?.month || "—"})
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#73f0a8", lineHeight: 1 }}>
              {wallet?.monthly_unique_players ?? 0}
            </div>
            <div style={{ fontSize: 12, color: "#d8cdb8", marginTop: 4 }}>لاعب فريد هذا الشهر</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f2b85b" }}>
              {wallet?.monthly_pending_sar?.toFixed(2) ?? "0.00"} ريال
            </div>
            <div style={{ fontSize: 12, color: "#d8cdb8", marginTop: 4 }}>تُضاف لرصيدك آخر الشهر</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#d8cdb8", marginTop: 12, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
          كل لاعع فريد = نقطة واحدة هذا الشهر — يتجدد العداد أول كل شهر
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { v: wallet?.cats_approved ?? "—", l: "فئات معتمدة", c: "#73f0a8" },
          { v: wallet?.cats_pending ?? "—", l: "قيد المراجعة", c: "#ffd86b" },
          { v: wallet?.cats_draft ?? "—", l: "مسودات", c: "#d8cdb8" },
        ].map(({ v, l, c }) => (
          <div key={l} style={S.statBox}>
            <div style={{ ...S.statValue, color: c }}>{v}</div>
            <div style={S.statLabel}>{l}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ ...S.card }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: "#f2b85b" }}>كيف تكسب؟</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["🎯", "أنشئ فئة أسئلة من 24 سؤالاً فأكثر"],
            ["📤", "أرسلها للمراجعة — تُقبل خلال 48 ساعة"],
            ["✅", "بعد القبول تحصل على 5 نقاط لكل سؤال"],
            ["🎮", "كل لاعب فريد يلعب فئتك = نقطة واحدة لهذا الشهر"],
            ["🔄", "عداد اللاعبين يتجدد أول كل شهر (لا تتراكم)"],
            ["💰", "100 نقطة = 1 ريال سعودي"],
            ["💳", "اطلب السحب عند 50 ريال فأكثر"],
          ].map(([ic, txt]) => (
            <div key={txt} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18 }}>{ic}</span>
              <span style={{ fontSize: 14, color: "#d8cdb8", lineHeight: 1.5 }}>{txt}</span>
            </div>
          ))}
        </div>
      </div>

      {!isPremium && (
        <div style={{ ...S.card, marginTop: 16, borderColor: "rgba(242,184,91,0.3)", textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>هذه الميزة للمشتركين المميزين</div>
          <div style={{ fontSize: 13, color: "#d8cdb8", marginBottom: 14 }}>اشترك لتبدأ في إنشاء الفئات وكسب الأرباح</div>
          <button style={S.btnPrimary} onClick={() => navigate("/pricing")}>اشترك الحين</button>
        </div>
      )}
    </div>
  );

  const renderCategories = () => {
    if (selectedCat) return renderCategoryDetail();
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={S.sectionTitle}>فئاتي</div>
            <div style={S.sectionSub}>أنشئ وأدر فئات الأسئلة</div>
          </div>
          {isPremium && (
            <button style={S.btnPrimary} onClick={() => setShowCreate(true)}>+ فئة جديدة</button>
          )}
        </div>

        {showCreate && (
          <div style={{ ...S.card, marginBottom: 20, borderColor: "rgba(242,184,91,0.3)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: "#f2b85b" }}>إنشاء فئة جديدة</div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>اسم الفئة *</label>
              <input style={S.input} value={catName} onChange={e => setCatName(e.target.value)} placeholder="مثال: أفلام هوليوود" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>وصف مختصر</label>
              <input style={S.input} value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="ماذا تتوقع في هذه الفئة؟" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={S.btnPrimary} onClick={handleCreateCat} disabled={creating}>{creating ? "جاري الإنشاء..." : "إنشاء"}</button>
              <button style={S.btnSecondary} onClick={() => { setShowCreate(false); setCatName(""); setCatDesc(""); }}>إلغاء</button>
            </div>
          </div>
        )}

        {loadingCats ? (
          <div style={{ textAlign: "center", color: "#d8cdb8", padding: 40 }}>جاري التحميل...</div>
        ) : cats.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 16, color: "#d8cdb8" }}>لا توجد فئات بعد</div>
            {isPremium && <div style={{ fontSize: 13, color: "#d8cdb8", marginTop: 6 }}>ابدأ بإنشاء فئتك الأولى</div>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {cats.map(cat => (
              <div key={cat.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => handleOpenCat(cat)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>{cat.name}</span>
                      <Badge map={BADGE} status={cat.status} />
                    </div>
                    {cat.description && <div style={{ fontSize: 13, color: "#d8cdb8", marginBottom: 8 }}>{cat.description}</div>}
                    {cat.status === "rejected" && cat.rejection_reason && (
                      <div style={{ fontSize: 12, color: "#ff8b95", marginBottom: 8 }}>السبب: {cat.rejection_reason}</div>
                    )}
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "#d8cdb8" }}>📝 {cat.questions_count} سؤال</span>
                      <span style={{ fontSize: 13, color: "#d8cdb8" }}>🎮 {cat.play_count} لعبة</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                    {(cat.status === "draft" || cat.status === "rejected") && (
                      <>
                        {cat.questions_count >= 24 && (
                          <button style={{ ...S.btnPrimary, padding: "8px 14px", fontSize: 12 }} onClick={() => handleSubmit(cat)}>إرسال للمراجعة</button>
                        )}
                        <button style={S.btnDanger} onClick={() => handleDeleteCat(cat)}>حذف</button>
                      </>
                    )}
                  </div>
                </div>
                {(cat.status === "draft" || cat.status === "rejected") && cat.questions_count < 24 && (
                  <div style={{ marginTop: 10, background: "rgba(255,204,102,0.08)", borderRadius: 10, padding: "8px 12px" }}>
                    <div style={{ fontSize: 12, color: "#ffd86b" }}>
                      تحتاج {24 - cat.questions_count} سؤال إضافي للإرسال للمراجعة
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginTop: 6 }}>
                      <div style={{ height: "100%", background: "#f2b85b", borderRadius: 4, width: `${Math.min(100, (cat.questions_count / 24) * 100)}%`, transition: "width 0.3s" }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCategoryDetail = () => (
    <div>
      <button style={{ ...S.btnSecondary, marginBottom: 20, padding: "8px 16px", fontSize: 13 }}
        onClick={() => { setSelectedCat(null); setQuestions([]); }}>
        ← رجوع للفئات
      </button>

      <div style={{ ...S.card, marginBottom: 20, borderColor: selectedCat.status === "approved" ? "rgba(64,212,140,0.3)" : "rgba(242,184,91,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{selectedCat.name}</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Badge map={BADGE} status={selectedCat.status} />
              <span style={{ fontSize: 13, color: "#d8cdb8" }}>{selectedCat.questions_count} سؤال</span>
            </div>
          </div>
          {(selectedCat.status === "draft" || selectedCat.status === "rejected") && selectedCat.questions_count >= 24 && (
            <button style={S.btnPrimary} onClick={() => handleSubmit(selectedCat)}>إرسال للمراجعة</button>
          )}
        </div>
        {selectedCat.status === "rejected" && selectedCat.rejection_reason && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,95,109,0.08)", borderRadius: 10, fontSize: 13, color: "#ff8b95" }}>
            سبب الرفض: {selectedCat.rejection_reason}
          </div>
        )}
        {(selectedCat.status === "draft" || selectedCat.status === "rejected") && selectedCat.questions_count < 24 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#ffd86b", marginBottom: 6 }}>
              {24 - selectedCat.questions_count} سؤال متبقٍ للإرسال
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
              <div style={{ height: "100%", background: "#f2b85b", borderRadius: 4, width: `${Math.min(100, (selectedCat.questions_count / 24) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {(selectedCat.status === "draft" || selectedCat.status === "rejected") && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, color: "#f2b85b" }}>إضافة سؤال</div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>السؤال *</label>
            <input style={S.input} value={qText} onChange={e => setQText(e.target.value)} placeholder="اكتب السؤال هنا..." />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>الجواب *</label>
            <input style={S.input} value={qAnswer} onChange={e => setQAnswer(e.target.value)} placeholder="الجواب الصحيح" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>الصعوبة</label>
            <select style={{ ...S.input }} value={qDiff} onChange={e => setQDiff(e.target.value)}>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
          </div>
          <button style={S.btnPrimary} onClick={handleAddQuestion} disabled={addingQ}>
            {addingQ ? "جاري الإضافة..." : "+ إضافة السؤال"}
          </button>
        </div>
      )}

      <div style={{ ...S.card }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>الأسئلة ({questions.length})</div>
        {questions.length === 0 ? (
          <div style={{ textAlign: "center", color: "#d8cdb8", padding: 30, fontSize: 14 }}>لا توجد أسئلة بعد</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: "#f2b85b", marginLeft: 6 }}>{i + 1}.</span>{q.text}
                  </div>
                  <div style={{ fontSize: 12, color: "#73f0a8" }}>✓ {q.answer}</div>
                  <div style={{ fontSize: 11, color: "#d8cdb8", marginTop: 2 }}>
                    {{ easy: "سهل", medium: "متوسط", hard: "صعب" }[q.difficulty] || q.difficulty}
                  </div>
                </div>
                {(selectedCat.status === "draft" || selectedCat.status === "rejected") && (
                  <button style={S.btnDanger} onClick={() => handleDeleteQuestion(q)}>حذف</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderPayouts = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={S.sectionTitle}>السحب</div>
          <div style={S.sectionSub}>اطلب تحويل أرباحك لحسابك البنكي</div>
        </div>
        {!showPayoutForm && (
          <button style={S.btnPrimary} onClick={() => setShowPayoutForm(true)}>+ طلب سحب</button>
        )}
      </div>

      {/* Balance */}
      <div style={{ ...S.card, marginBottom: 20, borderColor: "rgba(242,184,91,0.25)", background: "rgba(242,184,91,0.04)" }}>
        <div style={{ fontSize: 13, color: "#d8cdb8", marginBottom: 4 }}>رصيدك الحالي</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#f2b85b" }}>
          {wallet?.balance?.toFixed(2) || "0.00"} <span style={{ fontSize: 18 }}>ريال</span>
        </div>
        <div style={{ fontSize: 12, color: "#d8cdb8", marginTop: 6 }}>الحد الأدنى للسحب: 50 ريال</div>
      </div>

      {showPayoutForm && (
        <div style={{ ...S.card, marginBottom: 20, borderColor: "rgba(242,184,91,0.3)" }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: "#f2b85b" }}>طلب سحب جديد</div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>المبلغ (ريال) *</label>
            <input style={S.input} type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="50" min="50" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>رقم الآيبان *</label>
            <input style={{ ...S.input, direction: "ltr" }} value={payIban} onChange={e => setPayIban(e.target.value)} placeholder="SA0000000000000000000000" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>اسم صاحب الحساب *</label>
            <input style={S.input} value={payName} onChange={e => setPayName(e.target.value)} placeholder="الاسم كما في البنك" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={S.btnPrimary} onClick={handlePayoutRequest} disabled={requestingPayout}>
              {requestingPayout ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
            <button style={S.btnSecondary} onClick={() => setShowPayoutForm(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {payouts.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: 15, color: "#d8cdb8" }}>لا توجد طلبات سحب بعد</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {payouts.map(p => (
            <div key={p.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#f2b85b" }}>{p.amount} ريال</div>
                  <div style={{ fontSize: 12, color: "#d8cdb8", marginTop: 4 }}>
                    {new Date(p.created_at).toLocaleDateString("ar-SA")}
                  </div>
                  {p.admin_note && <div style={{ fontSize: 12, color: "#d8cdb8", marginTop: 4 }}>{p.admin_note}</div>}
                </div>
                <Badge map={PAYOUT_BADGE} status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNotifications = () => {
    const unread = notifs.filter(n => !n.is_read).length;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={S.sectionTitle}>الإشعارات {unread > 0 && <span style={{ background: "#f2b85b", color: "#1a0f10", borderRadius: 999, padding: "2px 10px", fontSize: 13, marginRight: 8 }}>{unread}</span>}</div>
            <div style={S.sectionSub}>آخر التحديثات على فئاتك وطلبات السحب</div>
          </div>
          {unread > 0 && <button style={S.btnSecondary} onClick={handleMarkRead}>تعليم الكل كمقروء</button>}
        </div>
        {notifs.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 15, color: "#d8cdb8" }}>لا توجد إشعارات بعد</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notifs.map(n => (
              <div key={n.id} style={{ ...S.card, borderColor: n.is_read ? "rgba(255,255,255,0.08)" : "rgba(242,184,91,0.35)", background: n.is_read ? S.card.background : "rgba(242,184,91,0.04)" }}>
                <div style={{ fontSize: 14, fontWeight: n.is_read ? 400 : 700 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "#d8cdb8", marginTop: 6 }}>{new Date(n.created_at).toLocaleString("ar-SA")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <div style={S.page}>
      {/* Page background — images 1 & 2 fixed behind everything */}
      <img src="https://i.pinimg.com/736x/21/e4/7b/21e47bbf1c1ba178e0a16e50f3565e99.jpg"
        alt="" aria-hidden="true"
        style={{ position: "fixed", inset: 0, width: "50%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: 0.18, pointerEvents: "none", zIndex: 0 }} />
      <img src="https://i.pinimg.com/736x/a0/be/c2/a0bec239e77e424ecca7f30bfd8a29d1.jpg"
        alt="" aria-hidden="true"
        style={{ position: "fixed", top: 0, right: 0, width: "50%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: 0.18, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "rgba(9,7,11,0.78)", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <button onClick={() => navigate("/")} style={{ color: "rgba(242,184,91,0.5)", background: "none", border: "none", cursor: "pointer", marginBottom: 20, fontSize: 14, fontFamily: "Cairo, sans-serif" }}>
          ← رجوع
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#f8f2e7", margin: 0, textShadow: "0 0 30px rgba(242,184,91,0.3)" }}>
            مجتمع حُجّة
          </h1>
          <p style={{ color: "#d8cdb8", margin: "6px 0 0", fontSize: 15 }}>أنشئ أسئلة، اكسب نقاط، احصل على أرباح</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 6, flexWrap: "wrap" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => { setTab(i); if (i === 1) setSelectedCat(null); }}
              style={{
                flex: "1 1 80px",
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                fontFamily: "Cairo, sans-serif",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
                background: tab === i ? "linear-gradient(90deg,#f2b85b,#ff8f3d)" : "transparent",
                color: tab === i ? "#1a0f10" : "#d8cdb8",
                position: "relative",
              }}>
              {t}
              {i === 3 && unreadCount > 0 && (
                <span style={{ position: "absolute", top: 4, left: 4, background: "#ff5f6d", color: "#fff", borderRadius: 999, fontSize: 10, padding: "1px 5px", fontWeight: 900 }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 0 && renderDashboard()}
        {tab === 1 && renderCategories()}
        {tab === 2 && renderPayouts()}
        {tab === 3 && renderNotifications()}
      </div>
    </div>
  );
}
