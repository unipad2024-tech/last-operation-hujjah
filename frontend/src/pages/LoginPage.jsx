import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

const ROMAN_BG = "https://images.pexels.com/photos/159862/art-school-of-athens-raphael-italian-painter-fresco-159862.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080&w=1920";

function extractError(err) {
  // FastAPI detail
  const detail = err?.response?.data?.detail;
  if (detail) return detail;
  // HTTP status fallbacks
  const status = err?.response?.status;
  if (status === 429) return "محاولات كثيرة، انتظر دقيقتين وحاول مجدداً";
  if (status === 401) return "البريد أو كلمة المرور غلط";
  if (status === 403) return "الحساب موقوف، تواصل مع الدعم";
  if (status === 409) return "البريد مسجّل مسبقاً";
  // Network / timeout
  if (!err?.response) return "تعذّر الوصول للخادم — تأكد من الاتصال وحاول مجدداً";
  return "خطأ غير متوقع، حاول مجدداً";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useGame();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");

  const set = (k) => (e) => { setError(""); setForm(p => ({ ...p, [k]: e.target.value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim())    { setError("أدخل البريد الإلكتروني"); return; }
    if (!form.password.trim()) { setError("أدخل كلمة المرور"); return; }
    setLoading(true);
    try {
      await loginUser(form.email.trim(), form.password);
      toast.success("أهلاً بعودتك!");
      navigate("/mode");
    } catch (err) {
      const msg = extractError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `linear-gradient(rgba(10,0,0,0.75), rgba(4,0,1,0.92)), url("${ROMAN_BG}")`,
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="relative z-10 w-full max-w-sm" style={{ animation: "fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .auth-input {
            width: 100%;
            background: rgba(0,0,0,0.45);
            border: 1.5px solid rgba(241,225,148,0.18);
            color: #F1E194;
            padding: 12px 16px;
            border-radius: 12px;
            outline: none;
            font-family: Cairo, sans-serif;
            font-size: 0.95rem;
            transition: border-color 0.2s;
            direction: ltr;
          }
          .auth-input:focus { border-color: rgba(241,225,148,0.6); }
          .auth-input::placeholder { color: rgba(241,225,148,0.25); }
          .auth-label {
            display: block;
            color: rgba(241,225,148,0.6);
            font-size: 0.75rem;
            font-weight: 700;
            margin-bottom: 6px;
            font-family: Cairo, sans-serif;
          }
        `}</style>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="font-black text-5xl mb-1" style={{ color: "#F1E194", fontFamily: "Cairo, sans-serif", textShadow: "0 0 40px rgba(241,225,148,0.35)" }}>
            حُجّة
          </div>
          <div style={{ color: "rgba(241,225,148,0.45)", fontSize: "0.85rem", fontFamily: "Cairo, sans-serif" }}>
            سجّل دخولك وانطلق
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-7"
          style={{
            background: "rgba(6,0,2,0.82)",
            border: "1.5px solid rgba(241,225,148,0.14)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">

            {/* Email */}
            <div>
              <label className="auth-label">البريد الإلكتروني</label>
              <input
                data-testid="login-email-input"
                className="auth-input"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="auth-label">كلمة المرور</label>
              <div className="relative">
                <input
                  data-testid="login-password-input"
                  className="auth-input"
                  style={{ paddingLeft: "44px", direction: "ltr" }}
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  data-testid="login-pw-toggle"
                  tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                  style={{ color: "rgba(241,225,148,0.4)" }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Inline error */}
            {error && (
              <div
                className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", fontSize: "0.82rem", fontFamily: "Cairo, sans-serif" }}
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full font-black py-3 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "rgba(241,225,148,0.2)"
                  : "linear-gradient(135deg, #C09820, #F0D045)",
                color: "#1A0A0B",
                fontSize: "1.05rem",
                fontFamily: "Cairo, sans-serif",
                boxShadow: loading ? "none" : "0 0 28px rgba(241,225,148,0.25)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  جاري الدخول...
                </span>
              ) : "دخول"}
            </button>
          </form>

          {/* Signup link */}
          <div className="text-center mt-5" style={{ color: "rgba(241,225,148,0.4)", fontSize: "0.85rem", fontFamily: "Cairo, sans-serif" }}>
            ما عندك حساب؟{" "}
            <Link data-testid="signup-link" to="/signup" style={{ color: "#F1E194", fontWeight: 700 }}>
              سجّل الحين
            </Link>
          </div>
        </div>

        {/* Guest divider */}
        <div className="flex items-center gap-3 my-4">
          <div style={{ flex: 1, height: "1px", background: "rgba(241,225,148,0.12)" }} />
          <span style={{ color: "rgba(241,225,148,0.3)", fontSize: "0.75rem", fontFamily: "Cairo, sans-serif" }}>أو</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(241,225,148,0.12)" }} />
        </div>

        {/* Guest play — prominent CTA */}
        <button
          data-testid="guest-play-btn"
          onClick={() => navigate("/mode")}
          className="w-full font-bold py-3 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95"
          style={{
            background: "rgba(241,225,148,0.06)",
            border: "1.5px solid rgba(241,225,148,0.25)",
            color: "rgba(241,225,148,0.7)",
            fontSize: "0.95rem",
            fontFamily: "Cairo, sans-serif",
          }}
        >
          🎮 العب بدون حساب
        </button>
      </div>
    </div>
  );
}
