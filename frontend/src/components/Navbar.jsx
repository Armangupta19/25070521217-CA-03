import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Trophy,
  Shield,
  Users,
  Calendar,
  Award,
  LogOut,
  User as UserIcon,
  LogIn,
  UserPlus,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import NotificationBell from "./NotificationBell";

export function Navbar() {
  const { user, isAdmin, isCaptain, logout, quickLogin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleDemoSwitch = async (account) => {
    try {
      setSwitching(true);
      await quickLogin(account.email, account.password);
      if (account.role === "admin") navigate("/admin/dashboard");
      else if (account.role === "captain") navigate("/captain/dashboard");
      else navigate("/tournaments");
    } catch (err) {
      console.error("Demo switch failed:", err);
    } finally {
      setSwitching(false);
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  return (
    <header className="navbar" style={{ position: "sticky", top: 0, zIndex: 999 }}>
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/" className="brand-link" onClick={() => setMobileOpen(false)}>
          <div className="brand-logo-icon">
            <Trophy size={20} />
          </div>
          <div className="brand-text">
            Sport<span>Sync</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Home
          </NavLink>
          <NavLink to="/tournaments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Calendar size={16} /> Tournaments
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Schedule
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Award size={16} /> Leaderboard
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Shield size={16} /> Admin Portal
              </NavLink>
              <NavLink to="/admin/tournaments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                Manage
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Users size={16} /> Users
              </NavLink>
            </>
          )}

          {isCaptain && (
            <>
              <NavLink to="/captain/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Shield size={16} /> Captain Portal
              </NavLink>
              <NavLink to="/captain/teams" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Users size={16} /> My Teams
              </NavLink>
            </>
          )}
        </nav>

        {/* Right Actions & Demo Switcher */}
        <div className="nav-actions">
          {/* Quick Demo Switcher */}
          <div className="demo-switcher-pill" title="Click to test different roles instantly during demo">
            <Sparkles size={14} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Demo:</span>
            <div className="demo-btn-group">
              <button
                type="button"
                className={`demo-role-btn ${isAdmin ? "active" : ""}`}
                onClick={() => handleDemoSwitch(DEMO_ACCOUNTS[0])}
                disabled={switching}
                title="Switch to Administrator"
              >
                Admin
              </button>
              <button
                type="button"
                className={`demo-role-btn ${isCaptain ? "active" : ""}`}
                onClick={() => handleDemoSwitch(DEMO_ACCOUNTS[1])}
                disabled={switching}
                title="Switch to Team Captain"
              >
                Captain
              </button>
              <button
                type="button"
                className={`demo-role-btn ${user?.role === "viewer" ? "active" : ""}`}
                onClick={() => handleDemoSwitch(DEMO_ACCOUNTS[3])}
                disabled={switching}
                title="Switch to Public Viewer"
              >
                Viewer
              </button>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="btn btn-outline btn-icon"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            style={{ width: "36px", height: "36px", padding: 0 }}
          >
            {isDark ? <Sun size={17} style={{ color: "#FBBF24" }} /> : <Moon size={17} />}
          </button>

          {/* Real-time Notification Bell */}
          {user && <NotificationBell />}

          {/* User Status / Login */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link to="/profile" className="user-menu-btn" title="View Profile">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                ) : (
                  <div className="user-avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <UserIcon size={16} />
                  </div>
                )}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name.split(" ")[0]}</span>
                <StatusBadge role={user.role} type="role" />
              </Link>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={handleLogout}
                title="Log Out"
                style={{ width: "36px", height: "36px", padding: 0 }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={14} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={14} /> Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            style={{
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              padding: "6px",
              cursor: "pointer",
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            style={{ color: "var(--text-primary)", textDecoration: "none", padding: "8px 0" }}
          >
            Home
          </NavLink>
          <NavLink
            to="/tournaments"
            onClick={() => setMobileOpen(false)}
            style={{ color: "var(--text-primary)", textDecoration: "none", padding: "8px 0" }}
          >
            Tournaments
          </NavLink>
          <NavLink
            to="/calendar"
            onClick={() => setMobileOpen(false)}
            style={{ color: "var(--text-primary)", textDecoration: "none", padding: "8px 0" }}
          >
            Fixture Calendar
          </NavLink>
          <NavLink
            to="/leaderboard"
            onClick={() => setMobileOpen(false)}
            style={{ color: "var(--text-primary)", textDecoration: "none", padding: "8px 0" }}
          >
            Leaderboard
          </NavLink>

          {isAdmin && (
            <>
              <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 0" }} />
              <NavLink
                to="/admin/dashboard"
                onClick={() => setMobileOpen(false)}
                style={{ color: "var(--primary)", textDecoration: "none", padding: "8px 0", fontWeight: 600 }}
              >
                Admin Portal
              </NavLink>
              <NavLink
                to="/admin/tournaments"
                onClick={() => setMobileOpen(false)}
                style={{ color: "var(--text-primary)", textDecoration: "none", padding: "8px 0" }}
              >
                Manage Tournaments
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={() => setMobileOpen(false)}
                style={{ color: "var(--text-primary)", textDecoration: "none", padding: "8px 0" }}
              >
                Manage Users
              </NavLink>
            </>
          )}

          {isCaptain && (
            <>
              <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 0" }} />
              <NavLink
                to="/captain/dashboard"
                onClick={() => setMobileOpen(false)}
                style={{ color: "var(--primary)", textDecoration: "none", padding: "8px 0", fontWeight: 600 }}
              >
                Captain Portal
              </NavLink>
              <NavLink
                to="/captain/teams"
                onClick={() => setMobileOpen(false)}
                style={{ color: "var(--text-primary)", textDecoration: "none", padding: "8px 0" }}
              >
                My Teams
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
