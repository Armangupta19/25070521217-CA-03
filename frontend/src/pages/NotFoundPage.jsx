import React from "react";
import { Link } from "react-router-dom";
import { Trophy, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.15)",
          color: "#EF4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <Trophy size={32} />
      </div>

      <h1 style={{ fontSize: 56, fontWeight: 900, marginBottom: 8, color: "var(--text-primary)" }}>
        404
      </h1>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Page Not Found</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 460, margin: "0 auto 28px" }}>
        The tournament page, fixture, or resource you are looking for does not exist or may have been moved.
      </p>

      <Link to="/" className="btn btn-primary">
        <ArrowLeft size={16} /> Return to Homepage
      </Link>
    </div>
  );
}
