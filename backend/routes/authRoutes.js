import express from "express";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import { generateToken, verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Strong password regex: min 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Register validation rules
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Full Name is required.")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("username")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters.")
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage("Username can only contain letters, numbers, underscores, dots, and hyphens."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage("Password must include at least 1 uppercase letter, 1 number, and 1 special character."),
];

// Register new user (Captain or Viewer only; Admin role blocked from public registration)
router.post("/register", registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { name, email, username, password, role, phone } = req.body;

    // Role check: Admin cannot be chosen via public registration
    let userRole = "viewer";
    if (role === "captain") {
      userRole = "captain";
    } else if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Security restriction: Administrator accounts cannot be created via public registration.",
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    // Check duplicate username if provided
    let cleanUsername = null;
    if (username && username.trim()) {
      cleanUsername = username.toLowerCase().trim();
      const existingUsername = await User.findOne({ username: cleanUsername });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: "This username is already taken. Please choose another.",
        });
      }
    }

    const passwordHash = await User.hashPassword(password);
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      username: cleanUsername || undefined,
      passwordHash,
      role: userRole,
      phone: phone || "",
    });

    await user.save();
    const token = generateToken(user);

    // Audit log
    await ActivityLog.create({
      user: user._id,
      action: "REGISTERED",
      entity: "User",
      entityId: user._id,
      description: `New ${userRole} account registered: ${user.name} (${user.email})`,
      ip: req.ip,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to SportSync.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// Login (supports email OR username)
router.post("/login", async (req, res, next) => {
  try {
    const { email, identifier, password, rememberMe } = req.body;
    const loginIdentifier = (identifier || email || "").toLowerCase().trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email or username and password.",
      });
    }

    // Query by email OR username
    const user = await User.findOne({
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact an administrator.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    // Save rememberMe preference if provided
    if (typeof rememberMe === "boolean") {
      user.rememberMe = rememberMe;
      await user.save();
    }

    const token = generateToken(user);

    // Audit log
    await ActivityLog.create({
      user: user._id,
      action: "LOGIN",
      entity: "User",
      entityId: user._id,
      description: `User logged in: ${user.name} (${user.role})`,
      ip: req.ip,
    }).catch(() => {});

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
});

// Forgot Password - Generates reset token
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered email address.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Security practice: don't reveal if user exists, or return friendly demo info
      return res.json({
        success: true,
        message: "If that email is registered, password reset instructions have been generated.",
      });
    }

    const rawToken = user.generateResetToken();
    await user.save();

    const resetUrl = `/reset-password/${rawToken}`;
    console.log(`[PASSWORD RESET] Token generated for ${user.email}: ${rawToken}`);
    console.log(`[PASSWORD RESET] Reset link: ${resetUrl}`);

    return res.json({
      success: true,
      message: "Password reset link generated successfully.",
      resetToken: rawToken,
      resetUrl,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
});

// Reset Password - Verifies token and updates password
router.post("/reset-password/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is missing.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide a new password.",
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include uppercase, number, and special character.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or has expired. Please request a new one.",
      });
    }

    user.passwordHash = await User.hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await ActivityLog.create({
      user: user._id,
      action: "RESET_PASSWORD",
      entity: "User",
      entityId: user._id,
      description: `Password reset completed for ${user.email}`,
      ip: req.ip,
    }).catch(() => {});

    return res.json({
      success: true,
      message: "Password has been successfully reset! You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
});

// Logout endpoint
router.post("/logout", (_req, res) => {
  return res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

// Get current logged-in user profile
router.get("/me", verifyToken, async (req, res) => {
  const user = await User.findById(req.user._id).populate("favourites", "title sport status startDate endDate bannerImage");
  return res.json({
    success: true,
    user: user || req.user,
  });
});

// Update profile
router.put("/profile", verifyToken, async (req, res, next) => {
  try {
    const { name, phone, avatar, username } = req.body;
    const user = req.user;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    if (username && username.trim() && username.toLowerCase().trim() !== user.username) {
      const cleanUsername = username.toLowerCase().trim();
      const existing = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Username already taken.",
        });
      }
      user.username = cleanUsername;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
});

// Update password
router.put("/password", verifyToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters and include uppercase, number, and special character.",
      });
    }

    const userWithPw = await User.findById(req.user._id).select("+passwordHash");
    const isMatch = await userWithPw.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match.",
      });
    }

    userWithPw.passwordHash = await User.hashPassword(newPassword);
    await userWithPw.save();

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
