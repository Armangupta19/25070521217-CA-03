import React from "react";
import { Trophy, Calendar, MapPin, Edit3, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useAuth } from "../context/AuthContext";

export function KnockoutBracket({ matches = [], onOpenScoreModal }) {
  const { isAdmin } = useAuth();

  if (!matches || matches.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon-box">
          <Trophy size={28} />
        </div>
        <div className="empty-title">No Knockout Fixtures Generated Yet</div>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Once the registration is closed and teams are approved, administrators can generate the single-elimination bracket.
        </p>
      </div>
    );
  }

  // Group matches by round number
  const roundMap = new Map();
  matches.forEach((m) => {
    const r = m.round || 1;
    if (!roundMap.has(r)) {
      roundMap.set(r, {
        roundNumber: r,
        roundName: m.roundName || `Round ${r}`,
        matches: [],
      });
    }
    roundMap.get(r).matches.push(m);
  });

  const rounds = Array.from(roundMap.values()).sort((a, b) => a.roundNumber - b.roundNumber);
  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound?.matches?.[0];
  const champion = finalMatch?.status === "completed" ? finalMatch.winner : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Champion Banner if tournament is decided */}
      {champion && (
        <div
          style={{
            background: "linear-gradient(135deg, var(--bg-elevated) 0%, rgba(184, 243, 74, 0.08) 100%)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-xl)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-md)",
                background: "var(--warning)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0B1220",
              }}
            >
              <Trophy size={26} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Tournament Champion
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                {champion.name}
              </div>
            </div>
          </div>
          <span className="badge badge-completed" style={{ fontSize: 13, padding: "6px 14px" }}>
            <CheckCircle2 size={14} style={{ color: "var(--primary)" }} /> Tournament Decided
          </span>
        </div>
      )}

      {/* Bracket Tree Columns */}
      <div className="bracket-wrapper">
        <div className="bracket-container">
          {rounds.map((round) => (
            <div key={round.roundNumber} className="bracket-round-column">
              <div className="bracket-round-header">
                <div className="bracket-round-title">{round.roundName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  {round.matches.length} {round.matches.length === 1 ? "Match" : "Matches"}
                </div>
              </div>

              <div className="bracket-round-matches">
                {round.matches.map((match) => {
                  const teamA = match.teamA?.team;
                  const teamB = match.teamB?.team;
                  const isCompleted = match.status === "completed";
                  const isTeamAWinner = isCompleted && match.winner && match.winner._id === teamA?._id;
                  const isTeamBWinner = isCompleted && match.winner && match.winner._id === teamB?._id;

                  return (
                    <div
                      key={match._id}
                      className={`bracket-match-node ${isCompleted ? "completed" : ""}`}
                    >
                      {/* Match Header */}
                      <div className="bracket-match-meta">
                        <span>Match #{match.matchNumber}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <StatusBadge status={match.status} />
                          {isAdmin && onOpenScoreModal && (
                            <button
                              type="button"
                              onClick={() => onOpenScoreModal(match)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "2px 6px", fontSize: 11 }}
                              title="Enter / Edit Score"
                            >
                              <Edit3 size={11} /> Score
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Team A Slot */}
                      <div className={`bracket-team-row ${isTeamAWinner ? "winner" : ""}`}>
                        <div className="bracket-team-name">
                          {teamA ? (
                            <>
                              <span
                                className="team-color-dot"
                                style={{ backgroundColor: teamA.color || "var(--primary)" }}
                              />
                              <span title={teamA.name}>{teamA.name}</span>
                            </>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                              TBD (Winner SF/QF)
                            </span>
                          )}
                        </div>
                        <span className="bracket-score-badge">
                          {isCompleted ? match.teamA?.score ?? 0 : "-"}
                        </span>
                      </div>

                      {/* Team B Slot */}
                      <div className={`bracket-team-row ${isTeamBWinner ? "winner" : ""}`}>
                        <div className="bracket-team-name">
                          {teamB ? (
                            <>
                              <span
                                className="team-color-dot"
                                style={{ backgroundColor: teamB.color || "#3B82F6" }}
                              />
                              <span title={teamB.name}>{teamB.name}</span>
                            </>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                              TBD (Winner SF/QF)
                            </span>
                          )}
                        </div>
                        <span className="bracket-score-badge">
                          {isCompleted ? match.teamB?.score ?? 0 : "-"}
                        </span>
                      </div>

                      {/* Match Details footer */}
                      <div
                        style={{
                          padding: "6px 12px",
                          fontSize: 11,
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: "rgba(255, 255, 255, 0.01)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} /> {match.venue ? match.venue.split("(")[0] : "Arena"}
                        </span>
                        {match.scheduledDate && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Calendar size={11} />
                            {new Date(match.scheduledDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
