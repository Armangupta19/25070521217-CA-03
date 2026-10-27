const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("sportsync_token") || sessionStorage.getItem("sportsync_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
    register: (userData) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
    forgotPassword: (email) =>
      request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (token, data) =>
      request(`/auth/reset-password/${token}`, { method: "POST", body: JSON.stringify(data) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
    updateProfile: (profileData) =>
      request("/auth/profile", { method: "PUT", body: JSON.stringify(profileData) }),
    changePassword: (passwords) =>
      request("/auth/password", { method: "PUT", body: JSON.stringify(passwords) }),
  },

  // Tournaments
  tournaments: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, val);
        }
      });
      const qs = searchParams.toString();
      return request(`/tournaments${qs ? `?${qs}` : ""}`);
    },
    getById: (id) => request(`/tournaments/${id}`),
    create: (data) =>
      request("/tournaments", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/tournaments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/tournaments/${id}`, { method: "DELETE" }),
    toggleFavourite: (id) =>
      request(`/tournaments/${id}/favourite`, { method: "POST" }),
    registerTeam: (tournamentId, teamId) =>
      request(`/tournaments/${tournamentId}/register`, {
        method: "POST",
        body: JSON.stringify({ teamId }),
      }),
    updateTeamStatus: (tournamentId, teamId, status, rejectionReason) =>
      request(`/tournaments/${tournamentId}/teams/${teamId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, rejectionReason }),
      }),
    generateFixtures: (tournamentId) =>
      request(`/tournaments/${tournamentId}/fixtures/generate`, { method: "POST" }),
    getStandings: (tournamentId) => request(`/tournaments/${tournamentId}/standings`),
  },

  // Matches
  matches: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, val);
        }
      });
      const qs = searchParams.toString();
      return request(`/matches${qs ? `?${qs}` : ""}`);
    },
    getById: (id) => request(`/matches/${id}`),
    updateScore: (id, scoreData) =>
      request(`/matches/${id}/score`, { method: "PUT", body: JSON.stringify(scoreData) }),
    updateSchedule: (id, scheduleData) =>
      request(`/matches/${id}/schedule`, { method: "PUT", body: JSON.stringify(scheduleData) }),
  },

  // Comments for match discussions
  comments: {
    getByMatch: (matchId) => request(`/comments?match=${matchId}`),
    add: (data) => request("/comments", { method: "POST", body: JSON.stringify(data) }),
    delete: (id) => request(`/comments/${id}`, { method: "DELETE" }),
  },

  // Notifications
  notifications: {
    getAll: () => request("/notifications"),
    markAsRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
    markAllAsRead: () => request("/notifications/read-all", { method: "PUT" }),
    delete: (id) => request(`/notifications/${id}`, { method: "DELETE" }),
  },

  // Teams
  teams: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, val);
        }
      });
      const qs = searchParams.toString();
      return request(`/teams${qs ? `?${qs}` : ""}`);
    },
    getById: (id) => request(`/teams/${id}`),
    create: (data) => request("/teams", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/teams/${id}`, { method: "DELETE" }),
    addPlayer: (teamId, playerData) =>
      request(`/teams/${teamId}/players`, { method: "POST", body: JSON.stringify(playerData) }),
    removePlayer: (teamId, playerId) =>
      request(`/teams/${teamId}/players/${playerId}`, { method: "DELETE" }),
  },

  // Users (Admin)
  users: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, val);
        }
      });
      const qs = searchParams.toString();
      return request(`/users${qs ? `?${qs}` : ""}`);
    },
    updateRole: (userId, role) =>
      request(`/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
    updateStatus: (userId, isActive) =>
      request(`/users/${userId}/status`, { method: "PUT", body: JSON.stringify({ isActive }) }),
  },

  // Stats, Charts & Leaderboards
  stats: {
    getOverview: () => request("/stats/overview"),
    getCharts: () => request("/stats/charts"),
    getLeaderboard: () => request("/stats/leaderboard"),
  },

  // Activity Logs (Admin)
  activityLogs: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, val);
        }
      });
      const qs = searchParams.toString();
      return request(`/activity-logs${qs ? `?${qs}` : ""}`);
    },
  },

  // Image upload
  upload: {
    uploadImage: async (file) => {
      const token = localStorage.getItem("sportsync_token") || sessionStorage.getItem("sportsync_token");
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload image.");
      }
      return data;
    },
  },

  // Health
  health: {
    check: () => request("/health"),
  },
};
