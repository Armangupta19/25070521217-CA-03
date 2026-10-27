import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Shield, Plus, AlertCircle, Check } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function RegisterTeamModal({ tournament, onClose, onSuccess }) {
  const { user } = useAuth();
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMyTeams() {
      try {
        setLoading(true);
        const res = await api.teams.getAll({ captain: user?._id });
        if (res.success) {
          // Filter teams matching the tournament sport
          const matching = (res.teams || []).filter(
            (t) => t.sport.toLowerCase() === tournament.sport.toLowerCase()
          );
          setMyTeams(matching);
          if (matching.length > 0) {
            setSelectedTeamId(matching[0]._id);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load your teams");
      } finally {
        setLoading(false);
      }
    }

    if (user?._id) {
      fetchMyTeams();
    }
  }, [user?._id, tournament.sport]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setError("Please select a team to register.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await api.tournaments.registerTeam(tournament._id, selectedTeamId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to register team");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={20} style={{ color: "var(--primary)" }} />
            <div className="modal-title">Register Team for Tournament</div>
          </div>
          <button type="button" className="btn btn-outline btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Target Tournament</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                {tournament.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--primary)", marginTop: 2 }}>
                Sport: {tournament.sport} • Format: {tournament.format}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
                Checking your registered teams...
              </div>
            ) : myTeams.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px dashed var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 14 }}>
                  You don't currently have a registered <strong>{tournament.sport}</strong> team.
                </p>
                <Link to="/captain/teams" className="btn btn-primary btn-sm" onClick={onClose}>
                  <Plus size={14} /> Create a {tournament.sport} Team First
                </Link>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Select Your Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  required
                >
                  {myTeams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name} ({team.players?.length || 0} players registered)
                    </option>
                  ))}
                </select>
                <div className="form-hint">
                  Your registration will be submitted to the tournament administrator for roster verification and approval.
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            {myTeams.length > 0 && (
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Check size={16} /> {submitting ? "Submitting..." : "Submit Registration"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
