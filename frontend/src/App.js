import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/context/GameContext";
import { Toaster } from "sonner";
import CommunityPage from "@/pages/CommunityPage";

const BASE  = process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app";
const API   = `${BASE}/api`;

// Warm up server + preload categories on app start
function useBackendWarmup() {
  useEffect(() => {
    // Wake server & prime category cache immediately on first load
    fetch(`${BASE}/health`).catch(() => {});
    fetch(`${API}/categories`).catch(() => {});
    fetch(`${API}/free-categories`).catch(() => {});
    // Keep-alive ping every 4 min — prevents Railway cold start
    const iv = setInterval(() => fetch(`${BASE}/health`).catch(() => {}), 4 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);
}

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import PricingPage from "@/pages/PricingPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import GameModeSelectPage from "@/pages/GameModeSelectPage";
import TeamSetupPage from "@/pages/TeamSetupPage";
import TournamentSetupPage from "@/pages/TournamentSetupPage";
import TournamentBracketPage from "@/pages/TournamentBracketPage";
import CategorySelectPage from "@/pages/CategorySelectPage";
import GameBoardPage from "@/pages/GameBoardPage";
import QuestionPage from "@/pages/QuestionPage";
import SecretWordPage from "@/pages/SecretWordPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ProfilePage from "@/pages/ProfilePage";

function App() {
  useBackendWarmup();
  return (
    <GameProvider>
      <div className="App" dir="rtl">
        <BrowserRouter>
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
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </GameProvider>
  );
}

export default App;
