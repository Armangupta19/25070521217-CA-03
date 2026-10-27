import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
} from "lucide-react";
import { api } from "../../services/api";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionMessage, setActionMessage] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.users.getAll({
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
      });
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.users.updateRole(userId, newRole);
      setActionMessage(`User role updated to '${newRole}'.`);
      setTimeout(() => setActionMessage(""), 3000);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.users.updateStatus(userId, !currentStatus);
      setActionMessage(`User account status updated.`);
      setTimeout(() => setActionMessage(""), 3000);
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="container" style={{ paddingTop: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Users size={20} style={{ color: "var(--primary)" }} />
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>User Accounts Directory</h1>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Manage platform participants, assign permitted access roles, and monitor account activity.
        </p>
      </div>

      {actionMessage && (
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
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div
        className="card"
        style={{
          padding: 16,
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
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
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        <div style={{ flex: "0 1 180px" }}>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="captain">Team Captain</option>
            <option value="viewer">Public Viewer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-box">
              <Users size={28} />
            </div>
            <div className="empty-title">No Users Found</div>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Try searching with different keywords or role filters.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sportsync-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Member Since</th>
                  <th style={{ textAlign: "right" }}>Manage Role & Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?._id === u._id;

                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="user-avatar" />
                          ) : (
                            <div className="user-avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Users size={14} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                              {u.name} {isSelf && <span style={{ color: "var(--primary)", fontSize: 11 }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {u.phone || "Not specified"}
                      </td>
                      <td>
                        <StatusBadge role={u.role} type="role" />
                      </td>
                      <td>
                        {u.isActive ? (
                          <span style={{ color: "var(--success)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={13} /> Active
                          </span>
                        ) : (
                          <span style={{ color: "var(--error)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                            <XCircle size={13} /> Deactivated
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                          {/* Role selector dropdown */}
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            disabled={isSelf}
                            style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
                            title={isSelf ? "You cannot modify your own role" : "Change user role"}
                          >
                            <option value="admin">Admin</option>
                            <option value="captain">Captain</option>
                            <option value="viewer">Viewer</option>
                          </select>

                          {/* Toggle Active status */}
                          <button
                            type="button"
                            className={`btn btn-sm ${u.isActive ? "btn-danger" : "btn-success"}`}
                            onClick={() => handleToggleStatus(u._id, u.isActive)}
                            disabled={isSelf}
                            title={isSelf ? "Cannot deactivate yourself" : u.isActive ? "Deactivate Account" : "Reactivate Account"}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
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
    </div>
  );
}
