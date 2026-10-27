import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

// Public Pages
import { HomePage } from "./pages/HomePage";
import { TournamentsPage } from "./pages/TournamentsPage";
import { TournamentDetailPage } from "./pages/TournamentDetailPage";
import { TeamDetailPage } from "./pages/TeamDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { CalendarPage } from "./pages/CalendarPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminTournaments } from "./pages/admin/AdminTournaments";
import { AdminTournamentTeams } from "./pages/admin/AdminTournamentTeams";
import { AdminTournamentFixtures } from "./pages/admin/AdminTournamentFixtures";
import { AdminUsers } from "./pages/admin/AdminUsers";

// Captain Pages
import { CaptainDashboard } from "./pages/captain/CaptainDashboard";
import { CaptainTeams } from "./pages/captain/CaptainTeams";

// Route Guard: Any logged in user
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: "60px 20px" }}>
        <div className="card loading-skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Route Guard: Admin only
function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: "60px 20px" }}>
        <div className="card loading-skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Route Guard: Captain or Admin
function CaptainRoute({ children }) {
  const { user, isCaptain, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ padding: "60px 20px" }}>
        <div className="card loading-skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isCaptain && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Authenticated Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tournaments"
            element={
              <AdminRoute>
                <AdminTournaments />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tournaments/:id/teams"
            element={
              <AdminRoute>
                <AdminTournamentTeams />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tournaments/:id/fixtures"
            element={
              <AdminRoute>
                <AdminTournamentFixtures />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />

          {/* Captain Protected Routes */}
          <Route
            path="/captain/dashboard"
            element={
              <CaptainRoute>
                <CaptainDashboard />
              </CaptainRoute>
            }
          />
          <Route
            path="/captain/teams"
            element={
              <CaptainRoute>
                <CaptainTeams />
              </CaptainRoute>
            }
          />
          <Route
            path="/captain/teams/:id"
            element={
              <CaptainRoute>
                <CaptainTeams />
              </CaptainRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
