import React, { useState, useEffect } from "react";
import { Trophy, Database, CheckCircle2, ShieldCheck } from "lucide-react";
import { api } from "../services/api";

export function Footer() {
  const [dbStatus, setDbStatus] = useState("checking");

  useEffect(() => {
    async function checkDb() {
      try {
        const res = await api.health.check();
        if (res.database === "connected") {
          setDbStatus("connected");
        } else {
          setDbStatus("disconnected");
        }
      } catch (_e) {
        setDbStatus("offline");
      }
    }
    checkDb();
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Trophy size={18} style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>SportSync</span>
          <span>— Full-Stack Multi-Sport Tournament Management Platform</span>
        </div>

        <div className="footer-status-pill">
          <Database size={14} style={{ color: dbStatus === "connected" ? "var(--success)" : "var(--error)" }} />
          <span>MongoDB: <strong style={{ color: "var(--text-primary)" }}>sportsync</strong></span>
          {dbStatus === "connected" ? (
            <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <CheckCircle2 size={13} /> Connected
            </span>
          ) : (
            <span style={{ color: "var(--error)", fontSize: 12 }}>Disconnected</span>
          )}
        </div>
      </div>
    </footer>
  );
}
