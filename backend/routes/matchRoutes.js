import express from "express";
import Match from "../models/Match.js";
import Tournament from "../models/Tournament.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import { verifyToken, requireRole, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/matches - Query matches
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { tournament, round, status, team, limit = 100 } = req.query;
    const query = {};

    if (tournament) query.tournament = tournament;
    if (round) query.round = Number(round);
    if (status && status !== "all") query.status = status;

    if (team) {
      query.$or = [{ "teamA.team": team }, { "teamB.team": team }];
    }

    const matches = await Match.find(query)
      .populate("teamA.team", "name logo color sport")
      .populate("teamB.team", "name logo color sport")
      .populate("winner", "name logo color")
      .populate("tournament", "name sport format status")
      .sort({ round: 1, matchNumber: 1 })
      .limit(Number(limit));

    return res.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/matches/:id - Single match
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("teamA.team", "name logo color sport players")
      .populate("teamB.team", "name logo color sport players")
      .populate("winner", "name logo color")
      .populate("tournament", "name sport format status rules scoringConfig");

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found.",
      });
    }

    return res.json({
      success: true,
      match,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/matches/:id/score - Enter or update match score & auto-advance bracket (Admin only)
router.put("/:id/score", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const {
      scoreA,
      scoreB,
      penaltyA,
      penaltyB,
      winnerId,
      isDraw,
      status = "completed",
      notes,
      referee,
      sportDetails,
    } = req.body;

    const match = await Match.findById(req.params.id).populate("tournament");
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found.",
      });
    }

    const sA = scoreA !== undefined ? Number(scoreA) : match.teamA.score;
    const sB = scoreB !== undefined ? Number(scoreB) : match.teamB.score;

    match.teamA.score = sA;
    match.teamB.score = sB;

    if (penaltyA !== undefined) match.teamA.penaltyScore = penaltyA !== null ? Number(penaltyA) : null;
    if (penaltyB !== undefined) match.teamB.penaltyScore = penaltyB !== null ? Number(penaltyB) : null;

    if (notes !== undefined) match.matchDetails.notes = notes;
    if (referee !== undefined) match.matchDetails.referee = referee;
    if (sportDetails !== undefined) match.matchDetails.sportDetails = sportDetails;

    match.status = status;

    // Determine winner or draw
    let determinedWinner = null;
    let drawFlag = false;

    if (status === "completed") {
      match.completedAt = new Date();

      if (winnerId) {
        determinedWinner = winnerId;
      } else if (sA > sB) {
        determinedWinner = match.teamA.team;
      } else if (sB > sA) {
        determinedWinner = match.teamB.team;
      } else {
        // Equal scores
        if (
          match.teamA.penaltyScore !== null &&
          match.teamB.penaltyScore !== null &&
          match.teamA.penaltyScore !== match.teamB.penaltyScore
        ) {
          determinedWinner =
            match.teamA.penaltyScore > match.teamB.penaltyScore
              ? match.teamA.team
              : match.teamB.team;
        } else {
          // Draw (for league) or unspecified winner
          drawFlag = true;
        }
      }

      match.winner = determinedWinner;
      match.isDraw = drawFlag;
    } else {
      match.winner = null;
      match.isDraw = false;
      match.completedAt = null;
    }

    await match.save();

    // Automatic Knockout Bracket Advancement
    if (match.tournament?.format === "knockout" && status === "completed" && determinedWinner) {
      if (match.nextMatchId && match.nextMatchSlot) {
        const nextMatch = await Match.findById(match.nextMatchId);
        if (nextMatch) {
          if (match.nextMatchSlot === "teamA") {
            nextMatch.teamA.team = determinedWinner;
          } else if (match.nextMatchSlot === "teamB") {
            nextMatch.teamB.team = determinedWinner;
          }
          await nextMatch.save();
        }
      }
    }

    // Check if tournament is now completed (if this was the final or all matches completed)
    if (match.tournament?._id) {
      const remainingUnfinished = await Match.countDocuments({
        tournament: match.tournament._id,
        status: { $ne: "completed" },
      });

      if (remainingUnfinished === 0) {
        await Tournament.findByIdAndUpdate(match.tournament._id, { status: "completed" });
      }
    }

    const updated = await Match.findById(match._id)
      .populate("teamA.team", "name logo color captain")
      .populate("teamB.team", "name logo color captain")
      .populate("winner", "name logo color");

    // Socket.io real-time broadcast
    if (req.io) {
      req.io.to(`match:${match._id}`).emit("score:updated", updated);
      if (match.tournament?._id) {
        req.io.to(`tournament:${match.tournament._id}`).emit("score:updated", updated);
      }
      req.io.emit("score:updated", updated);
    }

    // Activity log
    await ActivityLog.create({
      user: req.user._id,
      action: "UPDATED_SCORE",
      entity: "Match",
      entityId: match._id,
      description: `Score recorded: ${updated?.teamA?.team?.name || "Team A"} (${sA}) vs (${sB}) ${updated?.teamB?.team?.name || "Team B"}`,
      ip: req.ip,
    }).catch(() => {});

    // Create notifications for team captains
    const captainsToNotify = [];
    if (updated?.teamA?.team?.captain) captainsToNotify.push(updated.teamA.team.captain);
    if (updated?.teamB?.team?.captain) captainsToNotify.push(updated.teamB.team.captain);

    for (const capId of captainsToNotify) {
      try {
        const notif = await Notification.create({
          user: capId,
          type: "score_updated",
          title: "Match Score Updated ⚽",
          message: `Match result: ${updated.teamA.team?.name} ${sA} - ${sB} ${updated.teamB.team?.name}`,
          match: match._id,
          tournament: match.tournament?._id,
          link: `/tournaments/${match.tournament?._id || ""}`,
        });
        if (req.io) {
          req.io.emit("notification:new", { userId: capId.toString(), notification: notif });
        }
      } catch (_e) {}
    }

    return res.json({
      success: true,
      message: "Match score recorded successfully.",
      match: updated,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/matches/:id/schedule - Update schedule and venue (Admin only)
router.put("/:id/schedule", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { scheduledDate, venue, status } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found.",
      });
    }

    if (scheduledDate) match.scheduledDate = new Date(scheduledDate);
    if (venue) match.venue = venue.trim();
    if (status) match.status = status;

    await match.save();

    return res.json({
      success: true,
      message: "Match schedule updated.",
      match,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
