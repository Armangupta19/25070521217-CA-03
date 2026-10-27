import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, MapPin, Filter, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../services/api";

export function CalendarPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        const res = await api.matches.getAll({ limit: 100 });
        if (res.success) {
          setMatches(res.matches || []);
        }
      } catch (err) {
        console.error("Failed to load match calendar:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  // Filter matches
  const filteredMatches = matches.filter((m) => {
    if (selectedSport !== "all" && m.tournament?.sport?.toLowerCase() !== selectedSport.toLowerCase()) {
      return false;
    }
    if (statusFilter !== "all" && m.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Group matches by scheduled date (or created date if unscheduled)
  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const rawDate = match.scheduledDate || match.createdAt;
    const dateKey = new Date(rawDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(match);
    return groups;
  }, {});

  const sports = ["all", "Football", "Basketball", "Cricket", "Badminton", "Volleyball", "Table Tennis"];

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              padding: 8,
              borderRadius: "8px",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
            }}
          >
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Tournament Fixture Schedule
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              Track all scheduled fixtures, match venues, and final tournament results in one unified calendar.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          padding: 16,
        }}
      >
        {/* Sport filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Sport:</span>
          {sports.map((sport) => (
            <button
              key={sport}
              type="button"
              className={`btn btn-sm ${selectedSport === sport ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedSport(sport)}
              style={{ textTransform: "capitalize", fontSize: "0.8rem", padding: "4px 10px" }}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.85rem",
            }}
          >
            <option value="all">All Matches</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Match List Grouped by Date */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          Loading fixture calendar...
        </div>
      ) : Object.keys(groupedMatches).length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <Trophy size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            No matches found
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Try adjusting your sport or status filters, or check open tournament registrations.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(groupedMatches).map(([dateStr, matchGroup]) => (
            <div key={dateStr}>
              {/* Date Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                  paddingBottom: 6,
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    boxShadow: "0 0 8px var(--primary-glow)",
                  }}
                />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {dateStr}
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  ({matchGroup.length} {matchGroup.length === 1 ? "match" : "matches"})
                </span>
              </div>

              {/* Match Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                {matchGroup.map((match) => (
                  <div
                    key={match._id}
                    className="card"
                    style={{
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "var(--transition)",
                      border: match.status === "completed" ? "1px solid var(--border-subtle)" : "1px solid rgba(184, 243, 74, 0.25)",
                    }}
                  >
                    {/* Header: Tournament & Round */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Link
                        to={`/tournaments/${match.tournament?._id}`}
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "var(--primary)",
                          textDecoration: "none",
                        }}
                      >
                        {match.tournament?.name || "Tournament"}
                      </Link>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: 600,
                          background:
                            match.status === "completed"
                              ? "rgba(52, 211, 153, 0.15)"
                              : "rgba(184, 243, 74, 0.15)",
                          color: match.status === "completed" ? "var(--success)" : "var(--primary)",
                        }}
                      >
                        {match.status === "completed" ? "Completed" : "Scheduled"}
                      </span>
                    </div>

                    {/* Teams & Scores */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "8px 0" }}>
                      {/* Team A */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontWeight: match.winner === match.teamA?.team?._id ? 700 : 500,
                          color:
                            match.winner === match.teamA?.team?._id
                              ? "var(--primary)"
                              : "var(--text-primary)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "2px",
                              backgroundColor: match.teamA?.team?.color || "#10B981",
                            }}
                          />
                          <span>{match.teamA?.team?.name || "TBD"}</span>
                        </div>
                        <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                          {match.status === "completed" ? match.teamA?.score : "-"}
                        </span>
                      </div>

                      {/* Team B */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontWeight: match.winner === match.teamB?.team?._id ? 700 : 500,
                          color:
                            match.winner === match.teamB?.team?._id
                              ? "var(--primary)"
                              : "var(--text-primary)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "2px",
                              backgroundColor: match.teamB?.team?.color || "#3B82F6",
                            }}
                          />
                          <span>{match.teamB?.team?.name || "TBD"}</span>
                        </div>
                        <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                          {match.status === "completed" ? match.teamB?.score : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Venue & Time */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: "1px solid var(--border-subtle)",
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={13} />
                        <span>{match.venue || match.tournament?.venue || "Main Court"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={13} />
                        <span>
                          {match.scheduledDate
                            ? new Date(match.scheduledDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default CalendarPage;
