import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  Trophy,
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { MatchCard } from "../components/MatchCard";
import { useAuth } from "../context/AuthContext";

export function TeamDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [team, setTeam] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);
        const res = await api.teams.getById(id);
        if (res.success) {
          setTeam(res.team);
          setTournaments(res.tournaments || []);
          setMatches(res.matches || []);
        }
      } catch (err) {
        console.error("Failed to load team:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card loading-skeleton" style={{ height: 260, marginBottom: 24 }} />
        <div className="card loading-skeleton" style={{ height: 350 }} />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <div className="empty-icon-box">
            <Users size={28} />
          </div>
          <div className="empty-title">Team Not Found</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
            The requested team does not exist or has been removed.
          </p>
          <Link to="/tournaments" className="btn btn-primary">
            Explore Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = isAdmin || (user && team.captain && team.captain._id === user._id);

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* Back Link */}
      <div style={{ marginBottom: 18 }}>
        <Link
          to="/tournaments"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          <ArrowLeft size={14} /> Back to Tournaments
        </Link>
      </div>

      {/* Team Header Card */}
      <div
        style={{
          background: "linear-gradient(145deg, var(--bg-surface), var(--bg-card))",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-xl)",
          padding: 32,
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span
                className="team-color-dot"
                style={{ backgroundColor: team.color || "var(--primary)", width: 18, height: 18 }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--primary)",
                  backgroundColor: "var(--primary-light)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                }}
              >
                {team.sport}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {team.players?.length || 0} Registered Athletes
              </span>
            </div>

            <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, marginBottom: 10 }}>
              {team.name}
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 680, lineHeight: 1.6, marginBottom: 20 }}>
              {team.description || "Official sports team roster."}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={15} style={{ color: "var(--primary)" }} />
                Captain: <strong style={{ color: "var(--text-primary)" }}>{team.captain?.name || "Captain"}</strong>
              </span>
              {team.contactEmail && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail size={15} style={{ color: "var(--text-muted)" }} /> {team.contactEmail}
                </span>
              )}
              {team.contactPhone && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Phone size={15} style={{ color: "var(--text-muted)" }} /> {team.contactPhone}
                </span>
              )}
            </div>
          </div>

          {isOwnerOrAdmin && (
            <Link to="/captain/teams" className="btn btn-secondary">
              <Users size={16} /> Manage Team & Players
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Player Roster & Tournament History */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 32 }}>
        {/* Active Player Roster */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Official Player Roster</h2>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {team.players?.length || 0} Players
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {team.players?.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                No players added to the roster yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="sportsync-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60, textAlign: "center" }}>#</th>
                      <th>Player Name</th>
                      <th>Position / Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.players.map((p) => (
                      <tr key={p._id}>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                          {p.jerseyNumber !== null && p.jerseyNumber !== undefined ? p.jerseyNumber : "—"}
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {p.name}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {p.position || "Athlete"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Tournament Participation History */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Tournaments</h2>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {tournaments.length} Participations
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tournaments.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                This team has not registered in any tournaments yet.
              </div>
            ) : (
              tournaments.map((t) => (
                <div key={t._id} className="card card-elevated" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Link to={`/tournaments/${t._id}`} style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                      {t.name}
                    </Link>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      {t.sport} • {t.format} • {t.venue}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))
            )}
          </div>

          {/* Recent Match Performance */}
          {matches.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Recent Matches</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {matches.slice(0, 3).map((m) => (
                  <MatchCard key={m._id} match={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
