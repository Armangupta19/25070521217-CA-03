import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Search,
  Filter,
  Calendar,
  Users,
  ArrowRight,
  FilterX,
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const sportsList = ["Football", "Basketball", "Cricket", "Badminton", "Volleyball", "Tennis"];

  useEffect(() => {
    async function fetchTournaments() {
      try {
        setLoading(true);
        const params = {
          search: search || undefined,
          sport: sportFilter !== "all" ? sportFilter : undefined,
          format: formatFilter !== "all" ? formatFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        };
        const res = await api.tournaments.getAll(params);
        if (res.success) {
          setTournaments(res.tournaments || []);
        }
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchTournaments();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, sportFilter, formatFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setSportFilter("all");
    setFormatFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    search !== "" || sportFilter !== "all" || formatFilter !== "all" || statusFilter !== "all";

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Browse Tournaments
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Explore collegiate championships, competitive leagues, knockout brackets, and fixture schedules.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: 18,
          marginBottom: 32,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search tournament name, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Sport */}
        <div style={{ flex: "0 1 170px" }}>
          <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}>
            <option value="all">All Sports</option>
            {sportsList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div style={{ flex: "0 1 160px" }}>
          <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
            <option value="all">All Formats</option>
            <option value="knockout">Knockout Bracket</option>
            <option value="league">Round-Robin League</option>
          </select>
        </div>

        {/* Status */}
        <div style={{ flex: "0 1 180px" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="in_progress">Live / In Progress</option>
            <option value="registration_open">Registration Open</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetFilters}
            title="Reset filters"
          >
            <FilterX size={14} /> Clear
          </button>
        )}
      </div>

      {/* Tournament Cards Grid */}
      {loading ? (
        <div className="tournament-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card loading-skeleton" style={{ height: 320 }} />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-box">
            <Trophy size={28} />
          </div>
          <div className="empty-title">No Tournaments Match Your Search</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>
            Try adjusting your search query, sport, or format filters.
          </p>
          <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="tournament-grid">
          {tournaments.map((t) => (
            <div key={t._id} className="tournament-card">
              <div
                className="t-card-banner"
                style={{
                  backgroundImage: t.bannerImage ? `url(${t.bannerImage})` : "none",
                }}
              >
                <div className="t-card-badge-row">
                  <StatusBadge status={t.status} />
                  <StatusBadge format={t.format} type="format" />
                </div>
              </div>

              <div className="t-card-body">
                <h3 className="t-card-title">{t.name}</h3>
                <p className="t-card-desc">{t.description || "Official tournament series."}</p>

                <div className="t-card-meta">
                  <div className="t-meta-item">
                    <Trophy size={14} style={{ color: "var(--primary)" }} />
                    <span>{t.sport}</span>
                  </div>
                  <div className="t-meta-item">
                    <Users size={14} style={{ color: "var(--primary)" }} />
                    <span>
                      {t.registeredTeams?.filter((r) => r.status === "approved").length || 0} /{" "}
                      {t.maxTeams} Teams
                    </span>
                  </div>
                  <div className="t-meta-item" style={{ gridColumn: "span 2" }}>
                    <Calendar size={14} style={{ color: "var(--primary)" }} />
                    <span>
                      {new Date(t.startDate).toLocaleDateString()} —{" "}
                      {new Date(t.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="t-card-footer">
                  <span style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.venue}
                  </span>
                  <Link to={`/tournaments/${t._id}`} className="btn btn-outline btn-sm">
                    View Details <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
