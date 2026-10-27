import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", email: "admin@sportsync.com", username: "admin", password: "Demo@1234", desc: "Full tournament & team management" },
  { role: "captain", label: "Captain (Alex)", email: "captain.alex@sportsync.com", username: "captain.alex", password: "Demo@1234", desc: "Thunderbolts FC & Super Kings" },
  { role: "captain", label: "Captain (Sarah)", email: "captain.sarah@sportsync.com", username: "captain.sarah", password: "Demo@1234", desc: "Apex Strikers & Spike Storm" },
  { role: "viewer", label: "Public Viewer", email: "viewer@sportsync.com", username: "viewer", password: "Demo@1234", desc: "Explore tournaments & live match scores" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("sportsync_token") || sessionStorage.getItem("sportsync_token"));
  const [loading, setLoading] = useState(true);

  // Initialize auth on load
  const loadUser = useCallback(async () => {
    const savedToken = localStorage.getItem("sportsync_token") || sessionStorage.getItem("sportsync_token");
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        localStorage.removeItem("sportsync_token");
        sessionStorage.removeItem("sportsync_token");
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn("Failed to restore session:", err.message);
      localStorage.removeItem("sportsync_token");
      sessionStorage.removeItem("sportsync_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (identifier, password, rememberMe = true) => {
    const res = await api.auth.login({ identifier, password, rememberMe });
    if (res.success && res.token) {
      if (rememberMe) {
        localStorage.setItem("sportsync_token", res.token);
        sessionStorage.removeItem("sportsync_token");
      } else {
        sessionStorage.setItem("sportsync_token", res.token);
        localStorage.removeItem("sportsync_token");
      }
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || "Login failed");
  }, []);

  const register = useCallback(async (userData) => {
    const res = await api.auth.register(userData);
    if (res.success && res.token) {
      localStorage.setItem("sportsync_token", res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || "Registration failed");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (_e) {}
    localStorage.removeItem("sportsync_token");
    sessionStorage.removeItem("sportsync_token");
    setToken(null);
    setUser(null);
  }, []);

  const quickLogin = useCallback(
    async (emailOrUsername, password) => {
      return login(emailOrUsername, password, true);
    },
    [login]
  );

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAdmin: user?.role === "admin",
    isCaptain: user?.role === "captain",
    isViewer: user?.role === "viewer",
    login,
    register,
    logout,
    quickLogin,
    updateUser,
    reloadUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
