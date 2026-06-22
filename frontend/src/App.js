import React, { useEffect, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/context/GameContext";
import { Toaster } from "sonner";

const BASE  = process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app";
const API   = `${BASE}/api`;

// Warm up server + preload categories on app start
function useBackendWarmup() {
  useEffect(() => {
    fetch(`${BASE}/health`).catch(() => {});
    fetch(`${API}/categories`).catch(() => {});
    fetch(`${API}/free-categories`).catch(() => {});
    const iv = setInterval(() => fetch(`${BASE}/health`).catch(() => {}), 4 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);
}

// Error boundary for catching render crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("App error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#09070b", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "#f1e194", fontFamily: "Cairo, sans-serif", direction: "rtl" }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>حدث خطأ غير متوقع</div>
          <button onClick={() => window.location.href = "/"} style={{ padding: "10px 24px", background: "#5B0E14", color: "#f1e194", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 16 }}>
            العودة للرئيسية
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Eagerly loaded: pages users hit immediately on first visit
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import GameModeSelectPage from "@/pages/GameModeSelectPage";
import TeamSetupPage from "@/pages/TeamSetupPage";
import CategorySelectPage from "@/pages/CategorySelectPage";
import GameBoardPage from "@/pages/GameBoardPage";
import QuestionPage from "@/pages/QuestionPage";

// Lazily loaded: less-visited pages that don't need to block initial bundle
const PricingPage          = lazy(() => import("@/pages/PricingPage"));
const PaymentSuccessPage   = lazy(() => import("@/pages/PaymentSuccessPage"));
const TournamentSetupPage  = lazy(() => import("@/pages/TournamentSetupPage"));
const TournamentBracketPage= lazy(() => import("@/pages/TournamentBracketPage"));
const SecretWordPage       = lazy(() => import("@/pages/SecretWordPage"));
const CommunityPage        = lazy(() => import("@/pages/CommunityPage"));
const ProfilePage          = lazy(() => import("@/pages/ProfilePage"));
const SettingsPage         = lazy(() => import("@/pages/SettingsPage"));
const SearchPage           = lazy(() => import("@/pages/SearchPage"));
const ForgotPasswordPage   = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage    = lazy(() => import("@/pages/ResetPasswordPage"));
const AdminLoginPage       = lazy(() => import("@/pages/AdminLoginPage"));
const AdminDashboard       = lazy(() => import("@/pages/AdminDashboard")); // heaviest page — ~3300 lines

const PageLoader = () => (
  <div style={{ minHeight: "100vh", background: "#09070b", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: 40, height: 40, border: "3px solid #5B0E14", borderTop: "3px solid #f1e194", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  useBackendWarmup();
  return (
    <ErrorBoundary>
      <GameProvider>
        <div className="App" dir="rtl">
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/canceled" element={<PaymentSuccessPage />} />
                <Route path="/mode" element={<GameModeSelectPage />} />
                <Route path="/setup" element={<TeamSetupPage />} />
                <Route path="/tournament" element={<TournamentSetupPage />} />
                <Route path="/tournament/bracket" element={<TournamentBracketPage />} />
                <Route path="/categories" element={<CategorySelectPage />} />
                <Route path="/game" element={<GameBoardPage />} />
                <Route path="/question" element={<QuestionPage />} />
                <Route path="/secret/:questionId" element={<SecretWordPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </div>
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;
