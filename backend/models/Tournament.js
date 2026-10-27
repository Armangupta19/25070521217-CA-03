import mongoose from "mongoose";

const tournamentRegistrationSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tournament name is required"],
      trim: true,
      maxlength: [120, "Tournament name cannot exceed 120 characters"],
      index: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      trim: true,
      index: true,
    },
    format: {
      type: String,
      enum: {
        values: ["knockout", "league"],
        message: "Format must be either knockout or league",
      },
      required: [true, "Tournament format is required"],
      index: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "registration_open",
        "registration_closed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "draft",
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"],
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    maxTeams: {
      type: Number,
      required: [true, "Maximum number of teams is required"],
      min: [2, "A tournament must allow at least 2 teams"],
      max: [64, "A tournament can support at most 64 teams"],
      default: 8,
    },
    minTeams: {
      type: Number,
      min: [2, "A tournament requires at least 2 teams"],
      default: 2,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer reference is required"],
    },
    rules: {
      type: String,
      default: "Standard sport tournament rules apply. Fair play is strictly enforced.",
    },
    scoringConfig: {
      pointsPerWin: {
        type: Number,
        default: 3,
      },
      pointsPerDraw: {
        type: Number,
        default: 1,
      },
      pointsPerLoss: {
        type: Number,
        default: 0,
      },
      allowDraws: {
        type: Boolean,
        default: true,
      },
    },
    bannerImage: {
      type: String,
      default: "",
    },
    publishedAt: {
      type: Date,
    },
    registeredTeams: [tournamentRegistrationSchema],
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

// Virtual for approved team count
tournamentSchema.virtual("approvedTeamCount").get(function () {
  if (!this.registeredTeams) return 0;
  return this.registeredTeams.filter((r) => r.status === "approved").length;
});

// Pre-save hook to generate slug
tournamentSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

const Tournament = mongoose.model("Tournament", tournamentSchema);

export default Tournament;
