import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Edit3, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "../context/AuthContext";

export function MatchCard({ match, onOpenScoreModal }) {
  const { isAdmin } = useAuth();

  const teamA = match.teamA?.team;
  const teamB = match.teamB?.team;
  const isCompleted = match.status === "completed";
  const isTeamAWinner = isCompleted && match.winner && match.winner._id === teamA?._id;
  const isTeamBWinner = isCompleted && match.winner && match.winner._id === teamB?._id;

  return (
    <div className="match-card">
      <div className="match-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            {match.roundName || `Round ${match.round}`}
          </span>
          <span>• Match #{match.matchNumber}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusBadge status={match.status} />
          {isAdmin && onOpenScoreModal && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenScoreModal(match)}
              title="Record or modify score"
            >
              <Edit3 size={13} /> Record Score
            </button>
          )}
        </div>
      </div>

      <div className="match-teams-box">
        {/* Team A */}
        <div className="match-team">
          {teamA ? (
            <>
              <span
                className="team-color-dot"
                style={{ backgroundColor: teamA.color || "var(--primary)" }}
              />
              <Link to={`/teams/${teamA._id}`} className={`match-team-name ${isTeamAWinner ? "winner" : ""}`}>
                {teamA.name}
              </Link>
            </>
          ) : (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: 14 }}>
              To Be Determined
            </span>
          )}
        </div>

        {/* Score Board */}
        <div className="match-score-board">
          {isCompleted ? (
            <>
              <div className="match-score-display">
                {match.teamA?.score ?? 0} - {match.teamB?.score ?? 0}
              </div>
              {match.teamA?.penaltyScore !== null && match.teamB?.penaltyScore !== null && (
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Pen: ({match.teamA.penaltyScore} - {match.teamB.penaltyScore})
                </div>
              )}
            </>
          ) : (
            <span className="match-vs-tag">VS</span>
          )}
        </div>

        {/* Team B */}
        <div className="match-team away">
          {teamB ? (
            <>
              <span
                className="team-color-dot"
                style={{ backgroundColor: teamB.color || "#3B82F6" }}
              />
              <Link to={`/teams/${teamB._id}`} className={`match-team-name ${isTeamBWinner ? "winner" : ""}`}>
                {teamB.name}
              </Link>
            </>
          ) : (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: 14 }}>
              To Be Determined
            </span>
          )}
        </div>
      </div>

      <div className="match-card-footer">
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <MapPin size={13} /> {match.venue || "Stadium Main Arena"}
        </span>
        {match.scheduledDate && (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Calendar size={13} />
            {new Date(match.scheduledDate).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        )}
      </div>

      {match.matchDetails?.notes && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", borderTop: "1px dashed var(--border-subtle)", paddingTop: 8 }}>
          Note: {match.matchDetails.notes}
        </div>
      )}
    </div>
  );
}
