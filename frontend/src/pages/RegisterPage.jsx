import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, UserPlus, AlertCircle, Shield, Eye as EyeIcon, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("captain"); // Default: Team Captain
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

    if (score <= 2) {
      return { level: 1, label: "Weak", color: "#FB7185", width: "33%" };
    }
    if (score === 3) {
      return { level: 2, label: "Medium", color: "#FBBF24", width: "66%" };
    }
    return { level: 3, label: "Strong", color: "var(--primary, #B8F34A)", width: "100%" };
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError("Password must include at least 1 uppercase letter, 1 number, and 1 special character.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const user = await register({
        name: name.trim(),
        username: username.trim() || undefined,
        email: email.trim(),
        password,
        role,
        phone: phone.trim(),
      });

      toast.success("Account created successfully! Welcome to SportSync.");

      if (user.role === "captain") navigate("/captain/dashboard");
      else navigate("/tournaments");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 50, paddingBottom: 60 }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
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
            Create Your SportSync Account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Join collegiate tournaments as a Team Captain or follow live results as a Viewer.
          </p>
        </div>

        {/* Registration Card */}
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
            {/* Account Role Selector */}
            <div className="form-group">
              <label className="form-label">I am registering as:</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  className={`btn ${role === "captain" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setRole("captain")}
                  style={{ justifyContent: "center", padding: "12px 10px" }}
                >
                  <Shield size={16} /> Team Captain
                </button>
                <button
                  type="button"
                  className={`btn ${role === "viewer" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setRole("viewer")}
                  style={{ justifyContent: "center", padding: "12px 10px" }}
                >
                  <EyeIcon size={16} /> Public Viewer
                </button>
              </div>
              <div className="form-hint" style={{ marginTop: 6 }}>
                {role === "captain"
                  ? "Captains can build team rosters and register for open tournaments."
                  : "Viewers can browse schedules, view standings, and track live results."}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username (Unique handle)</label>
              <input
                type="text"
                placeholder="e.g. alex.rivera"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
              />
              <div className="form-hint">Used for quick login and player mentions.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "40px" }}
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
                    padding: "4px",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      height: "4px",
                      width: "100%",
                      backgroundColor: "var(--border-subtle, #29374D)",
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: passwordStrength.width,
                        backgroundColor: passwordStrength.color,
                        transition: "all 0.3s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>Strength:</span>
                    <span style={{ color: passwordStrength.color, fontWeight: 600 }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              disabled={loading}
            >
              <UserPlus size={16} /> {loading ? "Creating Account..." : "Complete Registration"}
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
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
