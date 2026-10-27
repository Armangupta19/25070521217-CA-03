import React, { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, ArrowLeft, AlertCircle, CheckCircle, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetData, setResetData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await api.auth.forgotPassword(email.trim());
      if (res.success) {
        setResetData(res);
        toast.success("Password reset instructions prepared!");
      }
    } catch (err) {
      setError(err.message || "Failed to process password reset.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Reset link copied to clipboard!");
  };

  return (
    <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-md)",
              background: "var(--primary-light)",
              border: "1px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              margin: "0 auto 16px",
            }}
          >
            <KeyRound size={26} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>
            Reset Your Password
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Enter your account email to generate a secure password reset link.
          </p>
        </div>

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

          {resetData ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(52, 211, 153, 0.1)",
                  border: "1px solid var(--success)",
                  color: "var(--success)",
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                <CheckCircle size={20} />
                <span>Password reset token generated for <strong>{resetData.email}</strong>.</span>
              </div>

              {resetData.resetToken && (
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Demo Environment Reset Link:
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      color: "var(--primary)",
                      wordBreak: "break-all",
                      marginBottom: "12px",
                      padding: "8px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "6px",
                    }}
                  >
                    {window.location.origin}/reset-password/{resetData.resetToken}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <Link
                      to={`/reset-password/${resetData.resetToken}`}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      Proceed to Reset
                    </Link>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => copyToClipboard(`${window.location.origin}/reset-password/${resetData.resetToken}`)}
                      title="Copy Link"
                    >
                      <Copy size={14} /> Copy
                    </button>
                  </div>
                </div>
              )}

              <Link
                to="/login"
                className="btn btn-outline"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <ArrowLeft size={16} /> Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. captain.alex@sportsync.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 10 }}
                disabled={loading}
              >
                {loading ? "Generating Link..." : "Send Reset Link"}
              </button>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Link
                  to="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-secondary)",
                    fontSize: "0.88rem",
                    textDecoration: "none",
                  }}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
export default ForgotPasswordPage;
