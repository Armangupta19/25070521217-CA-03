import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Shield,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";

export function AdminTournamentTeams() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTeamRoster, setSelectedTeamRoster] = useState(null);
  const [rejectionModalTeam, setRejectionModalTeam] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const fetchTournament = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.tournaments.getById(id);
      if (res.success) {
        setTournament(res.tournament);
      }
    } catch (err) {
      console.error("Failed to load tournament:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  const handleUpdateStatus = async (teamId, status, reason = "") => {
    try {
      setActionLoading(true);
      await api.tournaments.updateTeamStatus(id, teamId, status, reason);
      setStatusMessage(`Team status successfully updated to '${status}'.`);
      setTimeout(() => setStatusMessage(""), 3500);
      setRejectionModalTeam(null);
      setRejectionReason("");
      fetchTournament();
    } catch (err) {
      alert(err.message || "Failed to update team status");
    } finally {
      setActionLoading(false);
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

  const registered = tournament.registeredTeams || [];
  const approvedCount = registered.filter((r) => r.status === "approved").length;
  const pendingCount = registered.filter((r) => r.status === "pending").length;

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
            <Users size={20} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Review Team Registrations</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Tournament: <strong style={{ color: "var(--text-primary)" }}>{tournament.name}</strong> • {tournament.sport} ({tournament.format})
          </p>
        </div>

        {/* Capacity Indicator */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Capacity</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
              {approvedCount} / {tournament.maxTeams} Teams Approved
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="badge badge-registration_closed">
              {pendingCount} Pending
            </span>
          )}
        </div>
      </div>

      {statusMessage && (
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
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Teams Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {registered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-box">
              <Users size={28} />
            </div>
            <div className="empty-title">No Teams Registered Yet</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              When team captains submit their teams for this tournament, they will appear here for review.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sportsync-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Captain</th>
                  <th>Roster Size</th>
                  <th>Registered Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registered.map((reg) => {
                  const team = reg.team;
                  if (!team) return null;

                  return (
                    <tr key={reg._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            className="team-color-dot"
                            style={{ backgroundColor: team.color || "var(--primary)" }}
                          />
                          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                            {team.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {team.captain?.name || "Captain"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {team.captain?.email}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedTeamRoster(team)}
                        >
                          <Eye size={12} /> {team.players?.length || 0} Players
                        </button>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(reg.registrationDate).toLocaleDateString()}
                      </td>
                      <td>
                        <StatusBadge status={reg.status} />
                        {reg.status === "rejected" && reg.rejectionReason && (
                          <div style={{ fontSize: 11, color: "var(--error)", marginTop: 4 }}>
                            {reg.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          {reg.status !== "approved" && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateStatus(team._id, "approved")}
                              disabled={actionLoading || approvedCount >= tournament.maxTeams}
                              title="Approve team for tournament"
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                          )}
                          {reg.status !== "rejected" && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setRejectionModalTeam(team)}
                              disabled={actionLoading}
                              title="Reject team"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}
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

      {/* Team Roster Modal */}
      {selectedTeamRoster && (
        <div className="modal-overlay" onClick={() => setSelectedTeamRoster(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  className="team-color-dot"
                  style={{ backgroundColor: selectedTeamRoster.color || "var(--primary)", width: 14, height: 14 }}
                />
                <div className="modal-title">{selectedTeamRoster.name} Roster</div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => setSelectedTeamRoster(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {selectedTeamRoster.players?.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                  No players currently registered on this team.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="sportsync-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60, textAlign: "center" }}>#</th>
                        <th>Player Name</th>
                        <th>Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTeamRoster.players.map((p) => (
                        <tr key={p._id}>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "var(--primary)" }}>
                            {p.jerseyNumber !== null && p.jerseyNumber !== undefined ? p.jerseyNumber : "—"}
                          </td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>{p.position || "Athlete"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTeamRoster(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectionModalTeam && (
        <div className="modal-overlay" onClick={() => setRejectionModalTeam(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <XCircle size={20} style={{ color: "var(--error)" }} />
                <div className="modal-title">Reject Team Registration</div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => setRejectionModalTeam(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
                Please provide a reason for rejecting{" "}
                <strong style={{ color: "var(--text-primary)" }}>{rejectionModalTeam.name}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete roster, eligibility requirements not met"
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectionModalTeam(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleUpdateStatus(rejectionModalTeam._id, "rejected", rejectionReason)}
                disabled={actionLoading}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
