import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getAll();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (_e) {}
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotif = (data) => {
      if (data.userId === user._id) {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on("notification:new", handleNewNotif);
    return () => {
      socket.off("notification:new", handleNewNotif);
    };
  }, [socket, user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_e) {}
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.notifications.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((c) => {
        const item = notifications.find((n) => n._id === id);
        return item && !item.isRead ? Math.max(0, c - 1) : c;
      });
    } catch (_e) {}
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        style={{
          position: "relative",
          background: "transparent",
          border: "1px solid var(--border-subtle, #29374D)",
          borderRadius: "8px",
          color: "var(--text-primary, #F8FAFC)",
          padding: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "var(--transition)",
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "var(--primary, #B8F34A)",
              color: "var(--primary-text, #0B1220)",
              fontSize: "0.68rem",
              fontWeight: 700,
              borderRadius: "9999px",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 0 8px var(--primary-glow, rgba(184, 243, 74, 0.4))",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "360px",
            maxHeight: "440px",
            background: "var(--bg-surface, #141F32)",
            border: "1px solid var(--border-subtle, #29374D)",
            borderRadius: "12px",
            boxShadow: "var(--shadow-lg, 0 12px 28px -4px rgba(0,0,0,0.55))",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-subtle, #29374D)",
              background: "var(--bg-elevated, #1B2940)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary, #B8F34A)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 500,
                }}
              >
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", maxHeight: "360px" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.88rem",
                }}
              >
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) handleMarkAsRead(n._id);
                    if (n.link) {
                      setIsOpen(false);
                      window.location.href = n.link;
                    }
                  }}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-subtle, #29374D)",
                    background: n.isRead ? "transparent" : "rgba(184, 243, 74, 0.05)",
                    cursor: n.link ? "pointer" : "default",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                    transition: "var(--transition)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: n.isRead ? 500 : 700,
                        color: n.isRead ? "var(--text-primary)" : "var(--primary, #B8F34A)",
                        marginBottom: "3px",
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {n.message}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        marginTop: "4px",
                      }}
                    >
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      • {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(n._id, e)}
                        title="Mark as read"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "2px",
                        }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(n._id, e)}
                      title="Delete"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "2px",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
