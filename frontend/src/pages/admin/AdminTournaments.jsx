import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Plus,
  Users,
  Calendar,
  Settings,
  Trash2,
  Edit,
  X,
  Check,
  AlertCircle,
  Eye,
} from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";

export function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [sport, setSport] = useState("Football");
  const [format, setFormat] = useState("knockout");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [venue, setVenue] = useState("");
  const [maxTeams, setMaxTeams] = useState(8);
  const [status, setStatus] = useState("registration_open");
  const [rules, setRules] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const sportsList = ["Football", "Basketball", "Cricket", "Badminton", "Volleyball", "Tennis"];

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await api.tournaments.getAll();
      if (res.success) {
        setTournaments(res.tournaments || []);
      }
    } catch (err) {
      console.error("Failed to load tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const openCreateModal = () => {
    setEditingTournament(null);
    setName("");
    setSport("Football");
    setFormat("knockout");
    setStartDate(new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0]);
    setRegistrationDeadline(new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0]);
    setVenue("University Main Complex");
    setMaxTeams(8);
    setStatus("registration_open");
    setRules("Standard tournament regulations apply. Fair play is strictly enforced.");
    setBannerImage("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTournament(t);
    setName(t.name);
    setSport(t.sport);
    setFormat(t.format);
    setStartDate(t.startDate ? new Date(t.startDate).toISOString().split("T")[0] : "");
    setEndDate(t.endDate ? new Date(t.endDate).toISOString().split("T")[0] : "");
    setRegistrationDeadline(t.registrationDeadline ? new Date(t.registrationDeadline).toISOString().split("T")[0] : "");
    setVenue(t.venue);
    setMaxTeams(t.maxTeams || 8);
    setStatus(t.status || "registration_open");
    setRules(t.rules || "");
    setBannerImage(t.bannerImage || "");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError("");

      const payload = {
        name,
        sport,
        format,
        startDate,
        endDate,
        registrationDeadline,
        venue,
        maxTeams: Number(maxTeams),
        status,
        rules,
        bannerImage,
      };

      if (editingTournament) {
        await api.tournaments.update(editingTournament._id, payload);
      } else {
        await api.tournaments.create(payload);
      }

      setIsCreateModalOpen(false);
      fetchTournaments();
    } catch (err) {
      setFormError(err.message || "Failed to save tournament");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}" and all its fixtures? This cannot be undone.`)) {
      try {
        await api.tournaments.delete(id);
        fetchTournaments();
      } catch (err) {
        alert(err.message || "Failed to delete tournament");
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
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            Tournament Management
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Create, configure, publish, and oversee tournament fixtures.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Create New Tournament
        </button>
      </div>

      {/* Tournaments Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            Loading tournaments...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-box">
              <Trophy size={28} />
            </div>
            <div className="empty-title">No Tournaments Created Yet</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
              Get started by creating your first tournament competition.
            </p>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              Create Tournament
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sportsync-table">
              <thead>
                <tr>
                  <th>Tournament Name</th>
                  <th>Sport</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Teams</th>
                  <th>Schedule</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => {
                  const approvedCount = (t.registeredTeams || []).filter(
                    (r) => r.status === "approved"
                  ).length;

                  return (
                    <tr key={t._id}>
                      <td>
                        <Link
                          to={`/tournaments/${t._id}`}
                          style={{ fontWeight: 700, color: "var(--text-primary)" }}
                        >
                          {t.name}
                        </Link>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {t.venue}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.sport}</td>
                      <td>
                        <StatusBadge format={t.format} type="format" />
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{approvedCount}</span> / {t.maxTeams}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(t.startDate).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <Link
                            to={`/tournaments/${t._id}`}
                            className="btn btn-outline btn-icon"
                            title="View public page"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            to={`/admin/tournaments/${t._id}/teams`}
                            className="btn btn-secondary btn-icon"
                            title="Review teams & registrations"
                          >
                            <Users size={14} />
                          </Link>
                          <Link
                            to={`/admin/tournaments/${t._id}/fixtures`}
                            className="btn btn-secondary btn-icon"
                            title="Manage & generate fixtures"
                          >
                            <Settings size={14} />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon"
                            onClick={() => openEditModal(t)}
                            title="Edit details"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            onClick={() => handleDelete(t._id, t.name)}
                            title="Delete tournament"
                          >
                            <Trash2 size={14} />
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

      {/* Create / Edit Tournament Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Trophy size={20} style={{ color: "var(--primary)" }} />
                <div className="modal-title">
                  {editingTournament ? "Edit Tournament" : "Create New Tournament"}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-icon"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
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
                  <label className="form-label">Tournament Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. National Collegiate Football Championship"
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
                    <label className="form-label">Tournament Format</label>
                    <select value={format} onChange={(e) => setFormat(e.target.value)}>
                      <option value="knockout">Knockout / Single Elimination</option>
                      <option value="league">League / Round-Robin</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Registration Deadline</label>
                    <input
                      type="date"
                      required
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Teams Capacity</label>
                    <input
                      type="number"
                      min="2"
                      max="64"
                      required
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Venue / Stadium</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Grand Central Stadium Main Arena"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="registration_open">Registration Open</option>
                    <option value="registration_closed">Registration Closed</option>
                    <option value="in_progress">In Progress / Live</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Banner Image URL</label>
                  <input
                    type="url"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rules & Regulations</label>
                  <textarea
                    rows="3"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
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
                  <Check size={16} /> {formLoading ? "Saving..." : "Save Tournament"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
