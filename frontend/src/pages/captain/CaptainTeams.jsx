import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  Shield,
  X,
  Check,
  AlertCircle,
  Eye,
  Trophy,
} from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export function CaptainTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Create Team Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [sport, setSport] = useState("Football");
  const [color, setColor] = useState("#10B981");
  const [description, setDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Add Player Form
  const [playerName, setPlayerName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [position, setPosition] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState("");

  const sportsList = ["Football", "Basketball", "Cricket", "Badminton", "Volleyball", "Tennis"];

  const fetchTeams = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await api.teams.getAll({ captain: user._id });
      if (res.success) {
        setTeams(res.teams || []);
        if (res.teams && res.teams.length > 0 && !selectedTeam) {
          setSelectedTeam(res.teams[0]);
        } else if (selectedTeam) {
          const updated = res.teams.find((t) => t._id === selectedTeam._id);
          if (updated) setSelectedTeam(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user?._id]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError("");
      const res = await api.teams.create({
        name: teamName,
        sport,
        color,
        description,
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        setTeamName("");
        setDescription("");
        fetchTeams();
      }
    } catch (err) {
      setFormError(err.message || "Failed to create team");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      setPlayerLoading(true);
      setPlayerError("");
      const res = await api.teams.addPlayer(selectedTeam._id, {
        name: playerName,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
        position,
      });

      if (res.success) {
        setPlayerName("");
        setJerseyNumber("");
        setPosition("");
        fetchTeams();
      }
    } catch (err) {
      setPlayerError(err.message || "Failed to add player");
    } finally {
      setPlayerLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!selectedTeam) return;
    if (window.confirm("Remove this player from the team roster?")) {
      try {
        await api.teams.removePlayer(selectedTeam._id, playerId);
        fetchTeams();
      } catch (err) {
        alert(err.message || "Failed to remove player");
      }
    }
  };

  const handleDeleteTeam = async (teamId, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      try {
        await api.teams.delete(teamId);
        setSelectedTeam(null);
        fetchTeams();
      } catch (err) {
        alert(err.message || "Failed to delete team");
      }
    }
  };

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
            <Users size={20} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>My Teams & Athlete Rosters</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Create sports teams, register athletes, assign jersey numbers, and manage rosters.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} /> Create New Team
        </button>
      </div>

      {loading ? (
        <div className="card loading-skeleton" style={{ height: 350 }} />
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-box">
            <Users size={28} />
          </div>
          <div className="empty-title">You Have Not Created Any Teams Yet</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
            Create your team roster first so you can register for open tournaments.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Team Now
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 28, alignItems: "start" }}>
          {/* Left Column: Teams List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              My Teams ({teams.length})
            </h2>

            {teams.map((t) => {
              const isSelected = selectedTeam?._id === t._id;

              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTeam(t)}
                  className="card"
                  style={{
                    cursor: "pointer",
                    padding: 16,
                    border: isSelected
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border-subtle)",
                    backgroundColor: isSelected ? "var(--bg-card)" : "var(--bg-surface)",
                    boxShadow: isSelected ? "0 0 15px var(--primary-glow)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        className="team-color-dot"
                        style={{ backgroundColor: t.color || "var(--primary)", width: 12, height: 12 }}
                      />
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>
                        {t.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--primary)",
                        backgroundColor: "var(--primary-light)",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      {t.sport}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                    <span>{t.players?.length || 0} Registered Players</span>
                    <Link
                      to={`/teams/${t._id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: "var(--text-secondary)", textDecoration: "underline" }}
                    >
                      Public Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Team Roster Management */}
          {selectedTeam && (
            <div className="card">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 20,
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: 16,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      className="team-color-dot"
                      style={{ backgroundColor: selectedTeam.color || "var(--primary)", width: 16, height: 16 }}
                    />
                    <h2 style={{ fontSize: 22, fontWeight: 800 }}>{selectedTeam.name}</h2>
                    <span className="badge badge-knockout">{selectedTeam.sport}</span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
                    {selectedTeam.description || "Official sports club roster."}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Link to="/tournaments" className="btn btn-secondary btn-sm">
                    <Trophy size={13} /> Find Tournaments
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteTeam(selectedTeam._id, selectedTeam.name)}
                    title="Delete Team"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Add Player Form */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <UserPlus size={16} style={{ color: "var(--primary)" }} /> Add Athlete to Roster
                </div>

                {playerError && (
                  <div style={{ color: "#EF4444", fontSize: 12, marginBottom: 10 }}>
                    {playerError}
                  </div>
                )}

                <form onSubmit={handleAddPlayer} style={{ display: "grid", gridTemplateColumns: "1fr 100px 140px auto", gap: 10, alignItems: "center" }}>
                  <input
                    type="text"
                    required
                    placeholder="Player full name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="Jersey #"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Position/Role"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={playerLoading}>
                    <Plus size={14} /> {playerLoading ? "Adding..." : "Add Player"}
                  </button>
                </form>
              </div>

              {/* Roster Table */}
              <div className="table-responsive">
                <table className="sportsync-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60, textAlign: "center" }}>Jersey</th>
                      <th>Player Name</th>
                      <th>Position / Role</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeam.players?.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                          No players added yet. Use the form above to add athletes to this team.
                        </td>
                      </tr>
                    ) : (
                      selectedTeam.players.map((p) => (
                        <tr key={p._id}>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                            {p.jerseyNumber !== null && p.jerseyNumber !== undefined ? p.jerseyNumber : "—"}
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {p.name}
                          </td>
                          <td style={{ color: "var(--text-secondary)" }}>
                            {p.position || "Athlete"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemovePlayer(p._id)}
                              title="Remove player from roster"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Users size={20} style={{ color: "var(--primary)" }} />
                <div className="modal-title">Create New Team</div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div className="modal-body">
                {formError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      color: "#EF4444",
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thunderbolts FC"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sport</label>
                    <select value={sport} onChange={(e) => setSport(e.target.value)}>
                      {sportsList.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Team Theme Color</label>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{ height: 42, padding: "2px 6px", cursor: "pointer" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Bio</label>
                  <textarea
                    rows="3"
                    placeholder="Describe your team's background, ethos, or training..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  <Check size={16} /> {formLoading ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
