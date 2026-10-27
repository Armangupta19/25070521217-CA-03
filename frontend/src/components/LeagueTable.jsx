import React from "react";
import { Link } from "react-router-dom";
import { Trophy, ArrowUpRight } from "lucide-react";

export function LeagueTable({ standings = [], tournamentId }) {
  if (!standings || standings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon-box">
          <Trophy size={28} />
        </div>
        <div className="empty-title">No Standings Available Yet</div>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Standings will be automatically calculated as match results are recorded for this league tournament.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="table-responsive">
        <table className="sportsync-table">
          <thead>
            <tr>
              <th style={{ width: 50, textAlign: "center" }}>Pos</th>
              <th>Team</th>
              <th style={{ textAlign: "center" }} title="Played">P</th>
              <th style={{ textAlign: "center" }} title="Won">W</th>
              <th style={{ textAlign: "center" }} title="Drawn">D</th>
              <th style={{ textAlign: "center" }} title="Lost">L</th>
              <th style={{ textAlign: "center" }} title="Goals/Points For">GF</th>
              <th style={{ textAlign: "center" }} title="Goals/Points Against">GA</th>
              <th style={{ textAlign: "center" }} title="Goal Difference">GD</th>
              <th style={{ textAlign: "center" }} title="Points">PTS</th>
              <th style={{ textAlign: "center" }}>Recent Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => {
              const team = row.team;
              const gd = row.goalDifference;
              const gdColor = gd > 0 ? "var(--success)" : gd < 0 ? "var(--error)" : "var(--text-muted)";
              const rankClass = row.rank === 1 ? "rank-1" : row.rank === 2 ? "rank-2" : row.rank === 3 ? "rank-3" : "";

              return (
                <tr key={team._id}>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span className={`rank-badge ${rankClass}`}>{row.rank}</span>
                    </div>
                  </td>
                  <td>
                    <Link
                      to={`/teams/${team._id}`}
                      className="table-team-cell"
                      title="View team profile"
                    >
                      <span
                        className="team-color-dot"
                        style={{ backgroundColor: team.color || "var(--primary)" }}
                      />
                      <span>{team.name}</span>
                      <ArrowUpRight size={13} style={{ opacity: 0.5 }} />
                    </Link>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{row.played}</td>
                  <td style={{ textAlign: "center" }}>{row.won}</td>
                  <td style={{ textAlign: "center" }}>{row.drawn}</td>
                  <td style={{ textAlign: "center" }}>{row.lost}</td>
                  <td style={{ textAlign: "center" }}>{row.goalsFor}</td>
                  <td style={{ textAlign: "center" }}>{row.goalsAgainst}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: gdColor }}>
                    {gd > 0 ? `+${gd}` : gd}
                  </td>
                  <td style={{ textAlign: "center" }} className="pts-highlight">
                    {row.points}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="form-guide" style={{ justifyContent: "center" }}>
                      {row.form && row.form.length > 0 ? (
                        row.form.map((res, idx) => (
                          <span key={idx} className={`form-pill form-${res}`}>
                            {res}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
