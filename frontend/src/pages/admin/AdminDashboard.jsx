import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Shield,
  Activity,
  ArrowRight,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  FileText,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "../../services/api";
import { MatchCard } from "../../components/MatchCard";

const CHART_COLORS = ["#B8F34A", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#10B981"];

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, chartsRes, logsRes] = await Promise.all([
        api.stats.getOverview().catch(() => ({})),
        api.stats.getCharts().catch(() => ({})),
        api.activityLogs.getAll({ limit: 10 }).catch(() => ({})),
      ]);

      if (overviewRes.success) setStats(overviewRes.stats);
      if (chartsRes.success) setCharts(chartsRes.charts);
      if (logsRes.success) setActivityLogs(logsRes.logs || []);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickApprove = async (tournamentId, teamId) => {
    try {
      setActionLoading(true);
      await api.tournaments.updateTeamStatus(tournamentId, teamId, "approved");
      setMessage("Team registration approved successfully!");
      setTimeout(() => setMessage(""), 3000);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card loading-skeleton" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
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
            <Shield size={22} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Tournament Operations Hub</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Platform analytics, visual metrics, team verification, and system audit logs.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/admin/tournaments" className="btn btn-primary">
            <Plus size={16} /> Manage Tournaments
          </Link>
          <Link to="/admin/users" className="btn btn-secondary">
            <Users size={16} /> User Directory
          </Link>
        </div>
      </div>

      {message && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--success-light)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            color: "var(--success)",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Tournaments</span>
            <div className="stat-icon-box" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
              <Trophy size={20} />
            </div>
          </div>
          <div className="stat-card-value">{stats?.totalTournaments ?? 0}</div>
          <div className="stat-card-desc">{stats?.activeTournaments ?? 0} active in-progress</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Registered Teams</span>
            <div className="stat-icon-box" style={{ background: "rgba(125, 211, 252, 0.12)", color: "var(--link)" }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-card-value">{stats?.totalTeams ?? 0}</div>
          <div className="stat-card-desc">Across all sport categories</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Matches Played</span>
            <div className="stat-icon-box" style={{ background: "rgba(129, 140, 248, 0.12)", color: "#A5B4FC" }}>
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-card-value">{stats?.completedMatches ?? 0}</div>
          <div className="stat-card-desc">Out of {stats?.totalMatches ?? 0} total fixtures</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Approvals</span>
            <div className="stat-icon-box" style={{ background: "var(--warning-light)", color: "var(--warning)" }}>
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: stats?.pendingApprovalsCount > 0 ? "var(--warning)" : "var(--text-primary)" }}>
            {stats?.pendingApprovalsCount ?? 0}
          </div>
          <div className="stat-card-desc">Awaiting administrator verification</div>
        </div>
      </div>

      {/* Visual Analytics Charts with Recharts */}
      {charts && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 20, marginBottom: 32 }}>
          {/* Chart 1: Tournaments by Sport (Pie Chart) */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <PieIcon size={18} style={{ color: "var(--primary)" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Tournaments by Sport
              </h3>
            </div>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.bySport || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(charts.bySport || []).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Match Progress by Sport (Bar Chart) */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <BarChart3 size={18} style={{ color: "var(--primary)" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Matches Progress by Sport
              </h3>
            </div>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.matchesBySport || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="sport" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total Matches" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals Table */}
      {stats?.pendingList && stats.pendingList.length > 0 && (
        <div className="card" style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={18} style={{ color: "var(--warning)" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Team Registrations Awaiting Approval
              </h2>
            </div>
          </div>

          <div className="table-responsive">
            <table className="sportsync-table">
              <thead>
                <tr>
                  <th>Tournament</th>
                  <th>Submitted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.pendingList.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.tournamentName}
                    </td>
                    <td>{new Date(item.registrationDate).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleQuickApprove(item.tournamentId, item.teamId)}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <Link
                          to={`/admin/tournaments`}
                          className="btn btn-outline btn-sm"
                        >
                          Review <ArrowRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Log Audit Trail */}
      {activityLogs.length > 0 && (
        <div className="card" style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Activity size={18} style={{ color: "var(--primary)" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Recent Administrative Activity Logs
            </h2>
          </div>

          <div className="table-responsive">
            <table className="sportsync-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Description</th>
                  <th>Admin User</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "var(--primary-light)",
                          color: "var(--primary)",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{log.entity}</td>
                    <td style={{ color: "var(--text-primary)" }}>{log.description}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{log.user?.name || "System"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Match Activity */}
      {stats?.recentMatches && stats.recentMatches.length > 0 && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
            Recently Completed Matches
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
            {stats.recentMatches.map((m) => (
              <MatchCard key={m._id} match={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminDashboard;
