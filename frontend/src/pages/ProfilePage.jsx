import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Shield, Lock, Check, AlertCircle, LogOut, Upload, Heart, Trophy, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Profile fields
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      setProfileError("");
      setProfileMessage("");
      const res = await api.auth.updateProfile({ name, username, phone, avatar });
      if (res.success && res.user) {
        updateUser(res.user);
        toast.success("Profile updated successfully!");
        setProfileMessage("Profile updated successfully!");
        setTimeout(() => setProfileMessage(""), 3500);
      }
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
      toast.error(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      const res = await api.upload.uploadImage(file);
      if (res.success && res.url) {
        setAvatar(res.url);
        toast.success("Avatar uploaded! Save profile to keep changes.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError("");
      setPasswordMessage("");
      await api.auth.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setPasswordMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordMessage(""), 3500);
    } catch (err) {
      setPasswordError(err.message || "Failed to change password");
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: "var(--text-primary)" }}>
            Account Settings & Preferences
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Manage your personal profile, avatar, credentials, and saved tournaments.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 32 }}>
        {/* Profile Details Form */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="user-avatar"
                style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <div
                className="user-avatar"
                style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
              >
                <User size={28} />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)" }}>{user?.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <StatusBadge role={user?.role} type="role" />
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>@{user?.username || "no-handle"}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{user?.email}</div>
            </div>
          </div>

          {/* Avatar Upload Button */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
            >
              <Upload size={14} /> {uploadLoading ? "Uploading..." : "Upload New Avatar Image"}
            </button>
          </div>

          {profileMessage && (
            <div style={{ color: "var(--primary)", fontSize: 13, marginBottom: 16 }}>
              {profileMessage}
            </div>
          )}
          {profileError && (
            <div style={{ color: "var(--error, #FB7185)", fontSize: 13, marginBottom: 16 }}>
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username Handle</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                placeholder="e.g. alex.rivera"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avatar Image URL (or upload above)</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={profileLoading} style={{ marginTop: 8 }}>
              <Check size={16} /> {profileLoading ? "Updating..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Lock size={20} style={{ color: "var(--primary)" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Security & Password</h2>
          </div>

          {passwordMessage && (
            <div style={{ color: "var(--primary)", fontSize: 13, marginBottom: 16 }}>
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div style={{ color: "var(--error, #FB7185)", fontSize: 13, marginBottom: 16 }}>
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                required
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Re-type new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-secondary" disabled={passwordLoading} style={{ marginTop: 8 }}>
              <Check size={16} /> {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Saved / Favourite Tournaments Section */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <Heart size={20} style={{ color: "var(--primary)" }} fill="currentColor" />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            My Favourite Tournaments
          </h2>
        </div>

        {user?.favourites?.length === 0 || !user?.favourites ? (
          <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <Trophy size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
            <p>You haven't added any tournaments to your favourites yet.</p>
            <Link to="/tournaments" className="btn btn-primary btn-sm" style={{ marginTop: 12, display: "inline-flex" }}>
              Explore Tournaments
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {user.favourites.map((fav) => {
              const favId = fav._id || fav;
              const favTitle = fav.name || fav.title || "Tournament";
              return (
                <div key={favId} className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                      {fav.sport || "Competition"}
                    </span>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
                      {favTitle}
                    </h3>
                  </div>
                  <Link to={`/tournaments/${favId}`} className="btn btn-secondary btn-sm">
                    View <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
export default ProfilePage;
