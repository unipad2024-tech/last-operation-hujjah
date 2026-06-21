import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400";

const BG_LAYERS = (
  <>
    <div aria-hidden="true" style={{
      position: "fixed", inset: 0, zIndex: 0,
      backgroundImage: `url("${ROMAN_BG}")`,
      backgroundSize: "cover", backgroundPosition: "center 30%",
      filter: "brightness(0.28) saturate(0.6) sepia(0.18)",
    }} />
    <div aria-hidden="true" style={{
      position: "fixed", inset: 0, zIndex: 1,
      background: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(61,8,16,0.82) 0%, rgba(6,0,1,0.70) 100%)",
    }} />
    <div aria-hidden="true" style={{
      position: "fixed", inset: 0, zIndex: 2,
      background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(2,0,0,0.55) 80%, rgba(0,0,0,0.88) 100%)",
    }} />
  </>
);

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm]       = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [done, setDone]       = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#060001" }} dir="rtl">
        {BG_LAYERS}
        <div className="relative" style={{ zIndex: 10, textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
          <p style={{ color: "rgba(241,225,148,0.75)", fontFamily: "Cairo, sans-serif", fontSize: "1rem", marginBottom: "24px" }}>
            رابط غير صالح أو منتهي الصلاحية.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            style={{
              background: "linear-gradient(135deg,#F5E99A,#D4BC30)", color: "#130104",
              fontWeight: 900, padding: "13px 36px", borderRadius: "999px",
              border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif",
              boxShadow: "0 0 28px rgba(241,225,148,0.22)",
            }}
          >
            طلب رابط جديد
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (form.password !== form.confirm) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token, new_password: form.password });
      setDone(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "الرابط منتهي الصلاحية، اطلب رابطاً جديداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#060001" }} dir="rtl">
      {BG_LAYERS}

      <div className="relative w-full max-w-sm" style={{ zIndex: 10 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 style={{
            fontFamily: "Cairo, sans-serif",
            fontSize: "clamp(3rem,8vw,4rem)",
            fontWeight: 900,
            color: "#F1E194",
            margin: 0,
            lineHeight: 1,
            textShadow: "0 0 60px rgba(241,225,148,0.35), 0 4px 32px rgba(0,0,0,0.80)",
            letterSpacing: "-0.02em",
          }}>
            حُجّة
          </h1>
          <p style={{ color: "rgba(241,225,148,0.42)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.22em", marginTop: "6px" }}>
            HUJJAH · لعبة الأسئلة
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(10,1,2,0.72)",
          border: "1.5px solid rgba(241,225,148,0.14)",
          borderRadius: "1.5rem",
          padding: "clamp(24px,5vw,40px)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 80px rgba(0,0,0,0.6), 0 0 32px rgba(91,14,20,0.25)",
        }}>
          <h2 style={{ color: "rgba(241,225,148,0.90)", fontWeight: 900, fontSize: "1.15rem", marginBottom: "1.5rem", textAlign: "center" }}>
            تعيين كلمة مرور جديدة
          </h2>

          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✅</div>
              <p style={{ color: "rgba(241,225,148,0.7)", fontSize: "0.92rem", lineHeight: 1.75, marginBottom: "28px" }}>
                تم تغيير كلمة مرورك بنجاح!<br />
                <span style={{ color: "rgba(241,225,148,0.4)", fontSize: "0.82rem" }}>يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</span>
              </p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #F5E99A, #D4BC30)",
                  color: "#130104", fontWeight: 900, fontSize: "1rem",
                  padding: "14px", borderRadius: "999px", border: "none", cursor: "pointer",
                  fontFamily: "Cairo, sans-serif",
                  boxShadow: "0 0 28px rgba(241,225,148,0.22)",
                }}
              >
                تسجيل الدخول
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label style={{ color: "rgba(241,225,148,0.55)", fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  كلمة المرور الجديدة
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="6 أحرف على الأقل"
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.05)",
                      border: "1.5px solid rgba(241,225,148,0.18)",
                      borderRadius: "0.875rem", padding: "12px 16px", paddingLeft: "46px",
                      color: "#F1E194", fontSize: "0.95rem", outline: "none",
                      fontFamily: "Cairo, sans-serif", boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(241,225,148,0.55)"}
                    onBlur={e => e.target.style.borderColor = "rgba(241,225,148,0.18)"}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(241,225,148,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ color: "rgba(241,225,148,0.55)", fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••"
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)",
                    border: "1.5px solid rgba(241,225,148,0.18)",
                    borderRadius: "0.875rem", padding: "12px 16px",
                    color: "#F1E194", fontSize: "0.95rem", outline: "none",
                    fontFamily: "Cairo, sans-serif", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(241,225,148,0.55)"}
                  onBlur={e => e.target.style.borderColor = "rgba(241,225,148,0.18)"}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", marginTop: "8px",
                  background: loading ? "rgba(241,225,148,0.45)" : "linear-gradient(135deg, #F5E99A, #D4BC30)",
                  color: "#130104", fontWeight: 900, fontSize: "1rem",
                  padding: "14px", borderRadius: "999px", border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "Cairo, sans-serif",
                  boxShadow: "0 0 28px rgba(241,225,148,0.22)",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "جاري الحفظ..." : "تعيين كلمة المرور"}
              </button>
            </form>
          )}
        </div>

        {/* Back */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/forgot-password")}
            style={{ color: "rgba(241,225,148,0.28)", fontSize: "0.8rem", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif" }}
          >
            ← طلب رابط جديد
          </button>
        </div>
      </div>
    </div>
  );
}
