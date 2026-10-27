import express from "express";
import Comment from "../models/Comment.js";
import Match from "../models/Match.js";
import { verifyToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/comments?match=:matchId - Get comments for a match
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { match } = req.query;
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Match query parameter is required.",
      });
    }

    const comments = await Comment.find({ match, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate("user", "name username avatar role");

    return res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/comments - Add comment to a match
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { match: matchId, tournament: tournamentId, text } = req.body;

    if (!matchId || !text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Match ID and comment text are required.",
      });
    }

    let tournament = tournamentId;
    if (!tournament) {
      const matchDoc = await Match.findById(matchId);
      if (!matchDoc) {
        return res.status(404).json({
          success: false,
          message: "Match not found.",
        });
      }
      tournament = matchDoc.tournament;
    }

    const comment = new Comment({
      match: matchId,
      tournament,
      user: req.user._id,
      text: text.trim(),
    });

    await comment.save();
    await comment.populate("user", "name username avatar role");

    // Emit live comment via socket if available
    if (req.io) {
      req.io.to(`match:${matchId}`).emit("comment:new", comment);
    }

    return res.status(201).json({
      success: true,
      message: "Comment posted successfully.",
      comment,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/comments/:id - Soft-delete own comment or admin delete
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    // Only creator or admin can delete
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments.",
      });
    }

    comment.isDeleted = true;
    await comment.save();

    if (req.io) {
      req.io.to(`match:${comment.match}`).emit("comment:deleted", { commentId: comment._id });
    }

    return res.json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
