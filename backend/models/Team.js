import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Player name is required"],
      trim: true,
    },
    jerseyNumber: {
      type: Number,
      min: [0, "Jersey number cannot be negative"],
      max: [999, "Jersey number too high"],
      default: null,
    },
    position: {
      type: String,
      trim: true,
      default: "Player",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true, timestamps: true }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [100, "Team name cannot exceed 100 characters"],
      index: true,
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team captain is required"],
      index: true,
    },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      trim: true,
      index: true,
    },
    logo: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#10B981", // Emerald default
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    contactEmail: {
      type: String,
      trim: true,
      default: "",
    },
    contactPhone: {
      type: String,
      trim: true,
      default: "",
    },
    players: [playerSchema],
    isActive: {
      type: Boolean,
      default: true,
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

// Virtual for player count
teamSchema.virtual("playerCount").get(function () {
  return this.players ? this.players.length : 0;
});

const Team = mongoose.model("Team", teamSchema);

export default Team;
