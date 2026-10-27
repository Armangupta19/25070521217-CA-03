import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,         // allows null/undefined without unique conflict
      lowercase: true,
      trim: true,
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, dots, and hyphens"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // excluded by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "captain", "viewer"],
        message: "{VALUE} is not a supported role",
      },
      default: "viewer",
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Password reset token fields
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    // Favourite tournaments (array of tournament IDs)
    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tournament",
      },
    ],
    // Remember-me flag
    rememberMe: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    throw new Error("Password hash not selected in query");
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

// Generate password reset token
userSchema.methods.generateResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  // Store hashed version
  this.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return rawToken; // return raw so we can send it in the link
};

const User = mongoose.model("User", userSchema);

export default User;
