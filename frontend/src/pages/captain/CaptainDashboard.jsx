import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Users,
  Trophy,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";
import { MatchCard } from "../../components/MatchCard";
import { useAuth } from "../../context/AuthContext";

export function CaptainDashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCaptainData() {
      if (!user?._id) return;
      try {
        setLoading(true);
        // Load teams owned by captain
        const teamRes = await api.teams.getAll({ captain: user._id });
        const myTeams = teamRes.teams || [];
        setTeams(myTeams);

        // Find tournaments registered by these teams
        const allTournamentsRes = await api.tournaments.getAll();
        const allTournaments = allTournamentsRes.tournaments || [];

        const myTeamIds = myTeams.map((t) => t._id);
        const myTournaments = allTournaments.filter((tourn) =>
          tourn.registeredTeams?.some((r) => {
            const regTeamId = r.team?._id || r.team;
            return myTeamIds.includes(regTeamId);
          })
        );
        setTournaments(myTournaments);

        // Find matches for these teams
        if (myTeamIds.length > 0) {
          const matchPromises = myTeamIds.map((tId) => api.matches.getAll({ team: tId }));
          const matchResults = await Promise.all(matchPromises);
          const allMatches = matchResults.flatMap((r) => r.matches || []);
          // Deduplicate
          const uniqueMatches = Array.from(
            new Map(allMatches.map((m) => [m._id, m])).values()
          );
          setMatches(uniqueMatches);
        }
      } catch (err) {
        console.error("Failed to load captain dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCaptainData();
  }, [user?._id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card loading-skeleton" style={{ height: 110 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Shield size={20} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Team Captain Portal</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Manage your rosters, register for competitions, and review upcoming fixtures.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/captain/teams" className="btn btn-primary">
            <Plus size={16} /> Manage Teams & Rosters
          </Link>
          <Link to="/tournaments" className="btn btn-secondary">
            <Trophy size={16} /> Open Tournaments
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 36,
        }}
      >
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">My Teams</span>
            <div className="stat-icon-box" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-card-value">{teams.length}</div>
          <div className="stat-card-desc">Active teams managed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Tournament Entries</span>
            <div className="stat-icon-box" style={{ background: "rgba(125, 211, 252, 0.12)", color: "var(--link)" }}>
              <Trophy size={20} />
            </div>
          </div>
          <div className="stat-card-value">{tournaments.length}</div>
          <div className="stat-card-desc">Registered competitions</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Upcoming Fixtures</span>
            <div className="stat-icon-box" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B" }}>
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-card-value">
            {matches.filter((m) => m.status === "scheduled" || m.status === "in_progress").length}
          </div>
          <div className="stat-card-desc">Scheduled matches</div>
        </div>
      </div>

      {/* My Tournaments & Registration Status */}
      <div className="card" style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>My Tournament Registrations</h2>
          <Link to="/tournaments" className="btn btn-outline btn-sm">
            Browse More <ArrowRight size={13} />
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
            <p style={{ marginBottom: 12 }}>You have not registered your teams for any tournaments yet.</p>
            <Link to="/tournaments" className="btn btn-primary btn-sm">
              Register for an Open Tournament
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sportsync-table">
              <thead>
                <tr>
                  <th>Tournament Name</th>
                  <th>Sport & Format</th>
                  <th>Dates</th>
                  <th>Venue</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <Link to={`/tournaments/${t._id}`} style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {t.name}
                      </Link>
                    </td>
                    <td>
                      {t.sport} • <StatusBadge format={t.format} type="format" />
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {new Date(t.startDate).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.venue}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link to={`/tournaments/${t._id}`} className="btn btn-secondary btn-sm">
                        View Schedule <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming Matches */}
      {matches.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Team Matches</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {matches.map((m) => (
              <MatchCard key={m._id} match={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
