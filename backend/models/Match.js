import mongoose from "mongoose";

const matchParticipantSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    penaltyScore: {
      type: Number,
      default: null,
    },
    stats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: [true, "Tournament is required"],
      index: true,
    },
    round: {
      type: Number,
      required: [true, "Round number is required"],
      default: 1,
      index: true,
    },
    roundName: {
      type: String,
      default: "Round 1",
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    teamA: {
      type: matchParticipantSchema,
      default: () => ({ team: null, score: 0 }),
    },
    teamB: {
      type: matchParticipantSchema,
      default: () => ({ team: null, score: 0 }),
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    isDraw: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled", "postponed"],
      default: "scheduled",
      index: true,
    },
    scheduledDate: {
      type: Date,
    },
    venue: {
      type: String,
      default: "Main Arena",
    },
    nextMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
    },
    nextMatchSlot: {
      type: String,
      enum: ["teamA", "teamB", null],
      default: null,
    },
    matchDetails: {
      notes: { type: String, default: "" },
      referee: { type: String, default: "" },
      summary: { type: String, default: "" },
      sportDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    completedAt: {
      type: Date,
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

const Match = mongoose.model("Match", matchSchema);

export default Match;
