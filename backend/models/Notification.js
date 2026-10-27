import mongoose from "mongoose";

/**
 * Notification model
 * Stores per-user platform notifications (team approvals, match alerts, etc.)
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "team_approved",
        "team_rejected",
        "match_upcoming",
        "score_updated",
        "tournament_created",
        "tournament_updated",
        "general",
      ],
      default: "general",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Optional references for context
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      default: null,
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
