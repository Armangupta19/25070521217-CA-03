import React from "react";

export function StatusBadge({ status, format, role, type = "status" }) {
  if (type === "format") {
    return (
      <span className={`badge badge-${format}`}>
        {format === "knockout" ? "Knockout" : "League"}
      </span>
    );
  }

  if (type === "role") {
    return (
      <span className={`user-role-badge role-${role}`}>
        {role}
      </span>
    );
  }

  // Tournament / Match / Registration status
  const formatLabel = (s) => {
    switch (s) {
      case "in_progress":
        return "Live / In Progress";
      case "registration_open":
        return "Registration Open";
      case "registration_closed":
        return "Registration Closed";
      case "completed":
        return "Completed";
      case "draft":
        return "Draft";
      case "scheduled":
        return "Scheduled";
      case "approved":
        return "Approved";
      case "pending":
        return "Pending Approval";
      case "rejected":
        return "Rejected";
      default:
        return s;
    }
  };

  const isLive = status === "in_progress";

  return (
    <span className={`badge badge-${status}`}>
      {isLive && <span className="pulse-dot" />}
      {formatLabel(status)}
    </span>
  );
}
