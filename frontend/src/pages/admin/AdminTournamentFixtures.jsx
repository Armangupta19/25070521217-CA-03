import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  Zap,
  Edit3,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trophy,
  MapPin,
  X,
} from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";
import { ScoreModal } from "../../components/ScoreModal";

export function AdminTournamentFixtures() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modals
  const [selectedScoreMatch, setSelectedScoreMatch] = useState(null);
  const [selectedScheduleMatch, setSelectedScheduleMatch] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleVenue, setScheduleVenue] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, mRes] = await Promise.all([
        api.tournaments.getById(id),
        api.matches.getAll({ tournament: id }),
      ]);
      if (tRes.success) setTournament(tRes.tournament);
      if (mRes.success) setMatches(mRes.matches || []);
    } catch (err) {
      console.error("Failed to load fixtures:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateFixtures = async () => {
    const hasMatches = matches.length > 0;
    if (
      hasMatches &&
      !window.confirm(
        "Regenerating fixtures will reset any existing scheduled/completed matches for this tournament. Continue?"
      )
    ) {
      return;
    }

    try {
      setGenerating(true);
      setError("");
      const res = await api.tournaments.generateFixtures(id);
      setMessage(res.message || "Fixtures generated successfully!");
      setTimeout(() => setMessage(""), 4000);
      fetchData();
    } catch (err) {
      setError(err.message || "Failed to generate fixtures");
    } finally {
      setGenerating(false);
    }
  };

  const openScheduleModal = (m) => {
    setSelectedScheduleMatch(m);
    setScheduleDate(
      m.scheduledDate
        ? new Date(m.scheduledDate).toISOString().slice(0, 16)
        : ""
    );
    setScheduleVenue(m.venue || "");
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.matches.updateSchedule(selectedScheduleMatch._id, {
        scheduledDate: scheduleDate,
        venue: scheduleVenue,
      });
      setSelectedScheduleMatch(null);
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to update schedule");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="card loading-skeleton" style={{ height: 300 }} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="empty-state">
          <div className="empty-title">Tournament Not Found</div>
          <Link to="/admin/tournaments" className="btn btn-primary" style={{ marginTop: 16 }}>
            Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  const approvedTeams = (tournament.registeredTeams || []).filter((r) => r.status === "approved");

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* Back Link */}
      <div style={{ marginBottom: 18 }}>
        <Link
          to={`/admin/tournaments`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          <ArrowLeft size={14} /> Back to Tournament Management
        </Link>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Calendar size={20} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Manage Fixtures & Match Operations</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {tournament.name} • {tournament.sport} (<strong>{tournament.format}</strong>)
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link to={`/tournaments/${tournament._id}`} className="btn btn-secondary">
            <Eye size={16} /> Public Bracket View
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateFixtures}
            disabled={generating || approvedTeams.length < 2}
          >
            <Zap size={16} /> {generating ? "Generating Fixtures..." : "Auto-Generate Fixtures"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--error-light)",
            border: "1px solid rgba(251, 113, 133, 0.3)",
            color: "var(--error)",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--success-light)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            color: "var(--success)",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* Generator Prompt Banner if < 2 teams approved */}
      {approvedTeams.length < 2 && (
        <div
          style={{
            background: "var(--warning-light)",
            border: "1px solid rgba(251, 191, 36, 0.25)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={20} style={{ color: "var(--warning)" }} />
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                At least 2 approved teams are required to generate fixtures.
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Currently approved: {approvedTeams.length} of {tournament.registeredTeams?.length || 0} registered teams.
              </div>
            </div>
          </div>
          <Link to={`/admin/tournaments/${tournament._id}/teams`} className="btn btn-secondary btn-sm">
            Approve Teams First
          </Link>
        </div>
      )}

      {/* Matches Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-box">
              <Calendar size={28} />
            </div>
            <div className="empty-title">No Fixtures Generated Yet</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
              Click "Auto-Generate Fixtures" to provision matchdays or single-elimination bracket slots.
            </p>
            {approvedTeams.length >= 2 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGenerateFixtures}
                disabled={generating}
              >
                Generate Fixtures Now
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sportsync-table">
              <thead>
                <tr>
                  <th>Match #</th>
                  <th>Round</th>
                  <th>Matchup & Score</th>
                  <th>Status</th>
                  <th>Schedule & Venue</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const teamA = m.teamA?.team;
                  const teamB = m.teamB?.team;
                  const isCompleted = m.status === "completed";

                  return (
                    <tr key={m._id}>
                      <td style={{ fontWeight: 700, color: "var(--text-muted)" }}>
                        #{m.matchNumber}
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.roundName || `Round ${m.round}`}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 600, color: m.winner?._id === teamA?._id ? "var(--primary)" : "var(--text-primary)" }}>
                            {teamA?.name || "TBD"}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "var(--radius-sm)",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                            }}
                          >
                            {isCompleted ? `${m.teamA?.score ?? 0} - ${m.teamB?.score ?? 0}` : "vs"}
                          </span>
                          <span style={{ fontWeight: 600, color: m.winner?._id === teamB?._id ? "var(--primary)" : "var(--text-primary)" }}>
                            {teamB?.name || "TBD"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={m.status} />
                      </td>
                      <td style={{ fontSize: 12 }}>
                        <div>{m.scheduledDate ? new Date(m.scheduledDate).toLocaleString() : "Date TBD"}</div>
                        <div style={{ color: "var(--text-muted)" }}>{m.venue}</div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openScheduleModal(m)}
                            title="Edit schedule and venue"
                          >
                            <Clock size={13} /> Reschedule
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setSelectedScoreMatch(m)}
                            title="Enter or update match score"
                          >
                            <Edit3 size={13} /> Enter Score
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Score Modal Hookup */}
      {selectedScoreMatch && (
        <ScoreModal
          match={selectedScoreMatch}
          onClose={() => setSelectedScoreMatch(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Reschedule Modal */}
      {selectedScheduleMatch && (
        <div className="modal-overlay" onClick={() => setSelectedScheduleMatch(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={20} style={{ color: "var(--primary)" }} />
                <div className="modal-title">Edit Match Schedule</div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => setSelectedScheduleMatch(null)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule}>
              <div className="modal-body">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Match #{selectedScheduleMatch.matchNumber}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {selectedScheduleMatch.teamA?.team?.name || "TBD"} vs {selectedScheduleMatch.teamB?.team?.name || "TBD"}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Venue / Court</label>
                  <input
                    type="text"
                    value={scheduleVenue}
                    onChange={(e) => setScheduleVenue(e.target.value)}
                    placeholder="e.g. Court A / Pitch 1"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedScheduleMatch(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
