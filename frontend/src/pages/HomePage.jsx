import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Calendar,
  Users,
  Shield,
  ArrowRight,
  Flame,
  Activity,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { MatchCard } from "../components/MatchCard";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";

export function HomePage() {
  const { user, quickLogin } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState("all");

  const sports = [
    { id: "all", name: "All Sports" },
    { id: "Football", name: "Football" },
    { id: "Basketball", name: "Basketball" },
    { id: "Cricket", name: "Cricket" },
    { id: "Badminton", name: "Badminton" },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [tRes, mRes] = await Promise.all([
          api.tournaments.getAll({ limit: 6 }),
          api.matches.getAll({ limit: 4 }),
        ]);

        if (tRes.success) setTournaments(tRes.tournaments || []);
        if (mRes.success) setMatches(mRes.matches || []);
      } catch (err) {
        console.error("Failed to load homepage data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredTournaments =
    activeSport === "all"
      ? tournaments
      : tournaments.filter(
          (t) => t.sport.toLowerCase() === activeSport.toLowerCase()
        );

  return (
    <div className="container" style={{ paddingTop: 40 }}>
      {/* Hero Section */}
      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(27, 41, 64, 0.7) 0%, rgba(11, 18, 32, 0.95) 100%)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          padding: "48px 36px",
          marginBottom: 48,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              background: "var(--primary-light)",
              border: "1px solid rgba(184, 243, 74, 0.25)",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 16,
            }}
          >
            <Activity size={14} /> Full-Stack Multi-Sport Tournament Management
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: 18,
              color: "#fff",
            }}
          >
            Precision Brackets. Live Standings.{" "}
            <span style={{ color: "var(--primary)" }}>Flawless Operations.</span>
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            SportSync empowers university athletic departments, clubs, and sports
            organizers with automated single-elimination knockout brackets,
            round-robin league tables, roster registrations, and real-time scorekeeping.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Link to="/tournaments" className="btn btn-primary btn-lg">
              <Trophy size={18} /> Explore Tournaments
            </Link>
            {!user ? (
              <Link to="/register" className="btn btn-secondary btn-lg">
                Create Free Account
              </Link>
            ) : user.role === "admin" ? (
              <Link to="/admin/tournaments" className="btn btn-secondary btn-lg">
                <Shield size={18} /> Manage Tournaments
              </Link>
            ) : (
              <Link to="/captain/teams" className="btn btn-secondary btn-lg">
                <Users size={18} /> My Teams Roster
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Demo Credentials Quick-Launch Banner */}
      <section
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          marginBottom: 48,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Sparkles size={22} style={{ color: "var(--primary)" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
              Interactive Demonstration Suite Ready
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              One-click instant login credentials for testing workflows:
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DEMO_ACCOUNTS.map((acc, i) => (
            <button
              key={i}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => quickLogin(acc.email, acc.password)}
              title={acc.desc}
            >
              <strong>{acc.label}</strong> ({acc.email.split("@")[0]})
            </button>
          ))}
        </div>
      </section>

      {/* Featured Tournaments Header & Sport Filter Pills */}
      <section style={{ marginBottom: 48 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Active Competitions
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>Featured Tournaments</h2>
          </div>

          {/* Sport Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sports.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`btn btn-sm ${
                  activeSport === s.id ? "btn-primary" : "btn-secondary"
                }`}
                onClick={() => setActiveSport(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="tournament-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card loading-skeleton" style={{ height: 320 }} />
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "var(--text-muted)" }}>
              No tournaments found for the selected category.
            </p>
          </div>
        ) : (
          <div className="tournament-grid">
            {filteredTournaments.map((t) => (
              <div key={t._id} className="tournament-card">
                <div
                  className="t-card-banner"
                  style={{
                    backgroundImage: t.bannerImage
                      ? `url(${t.bannerImage})`
                      : "none",
                  }}
                >
                  <div className="t-card-badge-row">
                    <StatusBadge status={t.status} />
                    <StatusBadge format={t.format} type="format" />
                  </div>
                </div>

                <div className="t-card-body">
                  <h3 className="t-card-title">{t.name}</h3>
                  <p className="t-card-desc">{t.description || "Official tournament series."}</p>

                  <div className="t-card-meta">
                    <div className="t-meta-item">
                      <Trophy size={14} style={{ color: "var(--primary)" }} />
                      <span>{t.sport}</span>
                    </div>
                    <div className="t-meta-item">
                      <Users size={14} style={{ color: "var(--primary)" }} />
                      <span>
                        {t.registeredTeams?.filter((r) => r.status === "approved").length || 0} /{" "}
                        {t.maxTeams} Teams
                      </span>
                    </div>
                    <div className="t-meta-item" style={{ gridColumn: "span 2" }}>
                      <Calendar size={14} style={{ color: "var(--primary)" }} />
                      <span>
                        {new Date(t.startDate).toLocaleDateString()} —{" "}
                        {new Date(t.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="t-card-footer">
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {t.venue}
                    </span>
                    <Link to={`/tournaments/${t._id}`} className="btn btn-outline btn-sm">
                      View Details <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Matches & Fixture Highlights */}
      {matches.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Action Center
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>Recent Match Activity</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {matches.map((m) => (
              <MatchCard key={m._id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
