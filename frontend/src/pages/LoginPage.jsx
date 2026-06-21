import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";
import { Eye, EyeOff } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import AppleSignin from "react-apple-signin-auth";

const APPLE_CLIENT_ID = process.env.REACT_APP_APPLE_CLIENT_ID || "";
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1400";

function GoogleLoginBtn({ onSuccess, loading }) {
  const doLogin = useGoogleLogin({
    onSuccess,
    onError: () => toast.error("فشل الدخول بجوجل"),
    flow: "implicit",
  });
  return (
    <button
      onClick={() => doLogin()}
      disabled={loading}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
        background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.14)",
        borderRadius: "999px", padding: "12px", cursor: loading ? "not-allowed" : "pointer",
        color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: "0.9rem",
        fontFamily: "Cairo, sans-serif", transition: "all 0.2s", opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      {loading ? "جاري الدخول..." : "الدخول بجوجل"}
    </button>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser, loginWithGoogle, loginWithApple } = useGame();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) { toast.error("أكمل جميع الحقول"); return; }
    setLoading(true);
    try {
      await loginUser(form.email, form.password);
      toast.success("أهلاً بعودتك!");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "البريد أو كلمة المرور غلط");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#060001" }}>
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
      {/* Vignette */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, zIndex: 2,
        background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(2,0,0,0.55) 80%, rgba(0,0,0,0.88) 100%)",
      }} />

      <div className="relative w-full max-w-sm" style={{ zIndex: 10 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            style={{
              fontFamily: "Cairo, sans-serif",
              fontSize: "clamp(3rem,8vw,4rem)",
              fontWeight: 900,
              color: "#F1E194",
              margin: 0,
              lineHeight: 1,
              textShadow: "0 0 60px rgba(241,225,148,0.35), 0 4px 32px rgba(0,0,0,0.80)",
              letterSpacing: "-0.02em",
            }}
          >
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
            تسجيل الدخول
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label style={{ color: "rgba(241,225,148,0.55)", fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                البريد الإلكتروني
              </label>
              <input
                data-testid="login-email-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
                autoComplete="email"
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

            <div>
              <label style={{ color: "rgba(241,225,148,0.55)", fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                كلمة المرور
              </label>
              <div style={{ position: "relative" }}>
                <input
                  data-testid="login-password-input"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                <button
                  type="button"
                  data-testid="login-pw-toggle"
                  tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(241,225,148,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              data-testid="login-submit-btn"
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
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Link to="/forgot-password" style={{ color: "rgba(241,225,148,0.40)", fontSize: "0.78rem", textDecoration: "none", letterSpacing: "0.03em" }}>
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(241,225,148,0.10)" }} />
            <span style={{ color: "rgba(241,225,148,0.28)", fontSize: "0.72rem", fontWeight: 700 }}>أو</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(241,225,148,0.10)" }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Google */}
            {GOOGLE_CLIENT_ID && (
              <GoogleLoginBtn
                loading={googleLoading}
                onSuccess={async (tokenResponse) => {
                  setGoogleLoading(true);
                  try {
                    await loginWithGoogle(tokenResponse);
                    navigate("/");
                  } catch (err) {
                    toast.error(err?.response?.data?.detail || "فشل الدخول بجوجل");
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
              />
            )}

            {/* Apple */}
            {APPLE_CLIENT_ID && (
              <AppleSignin
                authOptions={{
                  clientId: APPLE_CLIENT_ID,
                  scope: "email name",
                  redirectURI: window.location.origin,
                  usePopup: true,
                }}
                onSuccess={async (res) => {
                  setAppleLoading(true);
                  try {
                    await loginWithApple(res);
                    navigate("/");
                  } catch (err) {
                    toast.error(err?.response?.data?.detail || "فشل الدخول بـ Apple");
                  } finally {
                    setAppleLoading(false);
                  }
                }}
                onError={() => toast.error("فشل الدخول بـ Apple")}
                render={(props) => (
                  <button
                    {...props}
                    disabled={appleLoading}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.14)",
                      borderRadius: "999px", padding: "12px", cursor: appleLoading ? "not-allowed" : "pointer",
                      color: "rgba(255,255,255,0.75)", fontWeight: 700, fontSize: "0.9rem",
                      fontFamily: "Cairo, sans-serif", transition: "all 0.2s", opacity: appleLoading ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!appleLoading) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    {appleLoading ? "جاري الدخول..." : "الدخول بـ Apple"}
                  </button>
                )}
              />
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: "20px", color: "rgba(241,225,148,0.35)", fontSize: "0.85rem" }}>
            ما عندك حساب؟{" "}
            <Link data-testid="signup-link" to="/signup" style={{ color: "rgba(241,225,148,0.80)", fontWeight: 800, textDecoration: "none" }}>
              سجّل الحين
            </Link>
          </div>
        </div>

        {/* Back */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/")}
            style={{ color: "rgba(241,225,148,0.28)", fontSize: "0.8rem", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "Cairo, sans-serif" }}
          >
            ← رجوع للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
