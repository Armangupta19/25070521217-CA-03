import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Determine socket server URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("[SocketContext] Connected to realtime server with ID:", newSocket.id);
    });

    newSocket.on("notification:new", (data) => {
      // If notification is for current user
      if (user && data.userId === user._id) {
        toast((t) => (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontWeight: 600, color: "var(--color-accent, #B6F03C)" }}>
              {data.notification.title || "New Notification"}
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text, #E2E8F0)" }}>
              {data.notification.message}
            </span>
          </div>
        ), {
          duration: 5000,
          position: "top-right",
          style: {
            background: "#152033",
            color: "#FFFFFF",
            border: "1px solid rgba(182, 240, 60, 0.3)",
            borderRadius: "8px",
          },
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
