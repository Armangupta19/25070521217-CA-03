import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Trophy, LogIn, AlertCircle, Sparkles, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";

export function LoginPage() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please provide both email/username and password.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const user = await login(identifier.trim(), password, rememberMe);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "captain") navigate("/captain/dashboard");
      else navigate(from === "/login" ? "/tournaments" : from);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = async (acc) => {
    try {
      setLoading(true);
      setError("");
      setIdentifier(acc.username || acc.email);
      setPassword(acc.password);
      const user = await quickLogin(acc.username || acc.email, acc.password);
      toast.success(`Logged in as ${acc.label}!`);
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "captain") navigate("/captain/dashboard");
      else navigate("/tournaments");
    } catch (err) {
      setError(err.message || "Demo login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-md)",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary-text)",
              margin: "0 auto 16px",
              boxShadow: "0 2px 10px var(--primary-glow)",
            }}
          >
            <Trophy size={28} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>
            Welcome Back to SportSync
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Sign in to manage tournaments, register teams, and record match results.
          </p>
        </div>

        {/* Demo Accounts Card */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 10,
            }}
          >
            <Sparkles size={14} /> One-Click Demonstration Accounts (Password: Demo@1234)
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DEMO_ACCOUNTS.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ textAlign: "left", justifyContent: "flex-start", padding: "8px 10px" }}
                onClick={() => handleDemoFill(acc)}
                disabled={loading}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-primary)" }}>
                    {acc.label}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    @{acc.username || acc.email.split("@")[0]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="card">
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--error-light)",
                border: "1px solid rgba(251, 113, 133, 0.3)",
                color: "var(--error)",
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <input
                type="text"
                required
                placeholder="name@sportsync.com or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: "0.82rem", color: "var(--primary)", textDecoration: "none" }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "40px" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "4px",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "14px 0" }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 6 }}
              disabled={loading}
            >
              <LogIn size={16} /> {loading ? "Signing in..." : "Sign In to Account"}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--border-subtle)",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            Don't have an account yet?{" "}
            <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
