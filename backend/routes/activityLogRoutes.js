import express from "express";
import ActivityLog from "../models/ActivityLog.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/activity-logs - Admin only, view audit logs
router.get("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.entity) {
      query.entity = req.query.entity;
    }
    if (req.query.action) {
      query.action = req.query.action;
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name username email role"),
      ActivityLog.countDocuments(query),
    ]);

    return res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
