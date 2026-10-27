import express from "express";
import User from "../models/User.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All user routes require Admin role
router.use(verifyToken, requireRole("admin"));

// GET /api/users - List all users with search and role filter
router.get("/", async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (role && role !== "all") {
      query.role = role;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      users,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/role - Change user role
router.put("/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "captain", "viewer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified. Must be 'admin', 'captain', or 'viewer'.",
      });
    }

    // Prevent admin from removing their own admin status accidentally
    if (req.user._id.toString() === req.params.id && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot revoke your own administrator role.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message: `User role updated to '${role}'.`,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id/status - Deactivate or reactivate user
router.put("/:id/status", async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value.",
      });
    }

    if (req.user._id.toString() === req.params.id && !isActive) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message: `User account ${isActive ? "activated" : "deactivated"}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
