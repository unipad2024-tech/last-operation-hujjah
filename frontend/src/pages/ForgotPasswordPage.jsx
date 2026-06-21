import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;
const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("أدخل بريدك الإلكتروني"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: email.trim() });
      setSent(true);
    } catch {
      toast.error("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#060001" }} dir="rtl">
      {/* Art background */}
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
            نسيت كلمة المرور؟
          </h2>

          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📧</div>
              <p style={{ color: "rgba(241,225,148,0.7)", fontSize: "0.92rem", lineHeight: 1.75, marginBottom: "28px" }}>
                إذا كان البريد مسجلاً، ستصلك رسالة إعادة تعيين كلمة المرور خلال دقائق.
              </p>
              <button
                onClick={() => navigate("/login")}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #F5E99A, #D4BC30)",
                  color: "#130104", fontWeight: 900, fontSize: "1rem",
                  padding: "14px", borderRadius: "999px", border: "none", cursor: "pointer",
                  fontFamily: "Cairo, sans-serif",
                  boxShadow: "0 0 28px rgba(241,225,148,0.22)",
                }}
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <p style={{ color: "rgba(241,225,148,0.45)", fontSize: "0.82rem", lineHeight: 1.65, marginBottom: "8px" }}>
                أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.
              </p>
              <div>
                <label style={{ color: "rgba(241,225,148,0.55)", fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
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
                {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
              </button>
            </form>
          )}
        </div>

        {/* Back */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link
            to="/login"
            style={{ color: "rgba(241,225,148,0.28)", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", fontFamily: "Cairo, sans-serif" }}
          >
            ← رجوع لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
