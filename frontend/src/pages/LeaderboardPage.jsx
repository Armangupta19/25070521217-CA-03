import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Award, Flame, Users, Calendar, ArrowRight, Shield } from "lucide-react";
import { api } from "../services/api";

export function LeaderboardPage() {
  const [data, setData] = useState({ teamLeaderboard: [], popularTournaments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const res = await api.stats.getLeaderboard();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: "#FEF08A", text: "#854D0E", label: "🥇 1st" };
    if (rank === 2) return { bg: "#E2E8F0", text: "#334155", label: "🥈 2nd" };
    if (rank === 3) return { bg: "#FED7AA", text: "#9A3412", label: "🥉 3rd" };
    return { bg: "var(--bg-elevated)", text: "var(--text-secondary)", label: `#${rank}` };
  };

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              padding: 10,
              borderRadius: "10px",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
            }}
          >
            <Trophy size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Campus SportSync Leaderboard
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              Celebrate leading teams, match winners, and top-tier tournaments across university competitions.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
          Loading leaderboard standings...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }}>
          {/* Top Winning Teams Table */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Flame size={20} style={{ color: "var(--primary)" }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Top Teams by Tournament Match Victories
                </h2>
              </div>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Across all completed fixtures</span>
            </div>

            {data.teamLeaderboard?.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                No completed match results yet to calculate team rankings.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        textAlign: "left",
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                      }}
                    >
                      <th style={{ padding: "10px 12px", width: "80px" }}>Rank</th>
                      <th style={{ padding: "10px 12px" }}>Team Name</th>
                      <th style={{ padding: "10px 12px" }}>Sport</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Match Wins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.teamLeaderboard.map((team, idx) => {
                      const badge = getRankBadge(idx + 1);
                      return (
                        <tr
                          key={team._id}
                          style={{
                            borderBottom: "1px solid var(--border-subtle)",
                            transition: "var(--transition)",
                          }}
                        >
                          <td style={{ padding: "14px 12px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                background: badge.bg,
                                color: badge.text,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: "3px",
                                  backgroundColor: team.color || "var(--primary)",
                                }}
                              />
                              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                {team.name}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            {team.sport}
                          </td>
                          <td
                            style={{
                              padding: "14px 12px",
                              textAlign: "right",
                              fontWeight: 700,
                              fontSize: "1.1rem",
                              color: "var(--primary)",
                            }}
                          >
                            {team.wins} 🏆
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Popular Tournaments Section */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Award size={20} style={{ color: "var(--primary)" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                High-Participation Tournaments
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {data.popularTournaments?.map((tour) => (
                <div
                  key={tour._id}
                  className="card"
                  style={{
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "var(--primary-light)",
                          color: "var(--primary)",
                        }}
                      >
                        {tour.sport}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                        {tour.format}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                      {tour.name}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                        marginTop: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Users size={14} />
                        <span>{tour.teamCount} Teams Registered</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={14} />
                        <span>{new Date(tour.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                    <Link
                      to={`/tournaments/${tour._id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      View Tournament <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default LeaderboardPage;
