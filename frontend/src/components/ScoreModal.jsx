import React, { useState, useEffect } from "react";
import { X, Trophy, Check, AlertCircle } from "lucide-react";
import { api } from "../services/api";

export function ScoreModal({ match, onClose, onSuccess }) {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [penaltyA, setPenaltyA] = useState("");
  const [penaltyB, setPenaltyB] = useState("");
  const [status, setStatus] = useState("completed");
  const [notes, setNotes] = useState("");
  const [referee, setReferee] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (match) {
      setScoreA(match.teamA?.score ?? 0);
      setScoreB(match.teamB?.score ?? 0);
      setPenaltyA(match.teamA?.penaltyScore !== null && match.teamA?.penaltyScore !== undefined ? match.teamA.penaltyScore : "");
      setPenaltyB(match.teamB?.penaltyScore !== null && match.teamB?.penaltyScore !== undefined ? match.teamB.penaltyScore : "");
      setStatus(match.status || "completed");
      setNotes(match.matchDetails?.notes || "");
      setReferee(match.matchDetails?.referee || "");
      setError("");
    }
  }, [match]);

  if (!match) return null;

  const teamA = match.teamA?.team;
  const teamB = match.teamB?.team;

  const isKnockout = match.tournament?.format === "knockout";

  // Projected winner calculation
  let projectedWinner = null;
  const numA = Number(scoreA);
  const numB = Number(scoreB);
  if (numA > numB) {
    projectedWinner = teamA?.name || "Team A";
  } else if (numB > numA) {
    projectedWinner = teamB?.name || "Team B";
  } else if (penaltyA !== "" && penaltyB !== "") {
    if (Number(penaltyA) > Number(penaltyB)) projectedWinner = `${teamA?.name || "Team A"} (via penalties)`;
    else if (Number(penaltyB) > Number(penaltyA)) projectedWinner = `${teamB?.name || "Team B"} (via penalties)`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamA || !teamB) {
      setError("Cannot record scores for a match where participating teams are not yet determined.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        penaltyA: penaltyA !== "" ? Number(penaltyA) : null,
        penaltyB: penaltyB !== "" ? Number(penaltyB) : null,
        status,
        notes,
        referee,
      };

      await api.matches.updateScore(match._id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update match score");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Trophy size={20} style={{ color: "var(--primary)" }} />
            <div className="modal-title">Record Match Score</div>
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

            <div
              style={{
                textAlign: "center",
                padding: "8px 0 16px",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Match #{match.matchNumber} • {match.roundName || `Round ${match.round}`}
            </div>

            {/* Score Inputs Side by Side */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {/* Team A */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--text-primary)" }}>
                  {teamA?.name || "TBD"}
                </div>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={scoreA}
                  onChange={(e) => setScoreA(e.target.value)}
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    height: 60,
                  }}
                  required
                />
              </div>

              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-muted)" }}>VS</div>

              {/* Team B */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--text-primary)" }}>
                  {teamB?.name || "TBD"}
                </div>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    height: 60,
                  }}
                  required
                />
              </div>
            </div>

            {/* Penalty Shootout (for ties in Knockout) */}
            {isKnockout && numA === numB && (
              <div
                style={{
                  background: "var(--warning-light)",
                  border: "1px solid rgba(251, 191, 36, 0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: 14,
                  marginBottom: 18,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--warning)", marginBottom: 8 }}>
                  Tied Scores: Penalty Shootout Decider Required
                </div>
                <div className="form-row">
                  <div>
                    <label className="form-label">{teamA?.name} Penalties</label>
                    <input
                      type="number"
                      min="0"
                      value={penaltyA}
                      onChange={(e) => setPenaltyA(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="form-label">{teamB?.name} Penalties</label>
                    <input
                      type="number"
                      min="0"
                      value={penaltyB}
                      onChange={(e) => setPenaltyB(e.target.value)}
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Outcome Preview */}
            <div
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>Determined Outcome:</span>
              <span style={{ fontWeight: 700, color: projectedWinner ? "var(--primary)" : "var(--text-muted)" }}>
                {projectedWinner ? `Winner: ${projectedWinner}` : numA === numB ? "Draw / Tied" : "Pending"}
              </span>
            </div>

            {/* Status Select */}
            <div className="form-group">
              <label className="form-label">Match Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="completed">Completed (Final Result & Advance Bracket)</option>
                <option value="in_progress">In Progress (Live)</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Referee & Notes */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Match Official / Referee</label>
                <input
                  type="text"
                  value={referee}
                  onChange={(e) => setReferee(e.target.value)}
                  placeholder="e.g. Chief Umpire / Referee"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Summary / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Extra time goal in 94th min"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Check size={16} /> {loading ? "Saving Result..." : "Save Result"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
