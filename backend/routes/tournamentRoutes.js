import express from "express";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";
import { verifyToken, requireRole, optionalAuth } from "../middleware/auth.js";
import { generateKnockoutFixtures, generateLeagueFixtures } from "../utils/fixtureGenerator.js";

const router = express.Router();

// GET /api/tournaments - Public tournament listing with search & filters
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { sport, format, status, search, sort = "startDate", order = "asc", page = 1, limit = 20 } = req.query;

    const query = {};

    if (sport && sport !== "all") {
      query.sport = new RegExp(`^${sport}$`, "i");
    }

    if (format && format !== "all") {
      query.format = format;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ name: searchRegex }, { venue: searchRegex }, { sport: searchRegex }];
    }

    const sortOrder = order === "desc" ? -1 : 1;
    const sortField = sort === "createdAt" ? "createdAt" : "startDate";

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Tournament.countDocuments(query);

    const tournaments = await Tournament.find(query)
      .populate("organizer", "name email")
      .populate("registeredTeams.team", "name logo sport")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      tournaments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tournaments/:id - Tournament details
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate("organizer", "name email phone")
      .populate({
        path: "registeredTeams.team",
        populate: {
          path: "captain",
          select: "name email phone",
        },
      });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    return res.json({
      success: true,
      tournament,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tournaments - Create new tournament (Admin only)
router.post("/", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const {
      name,
      description,
      sport,
      format,
      startDate,
      endDate,
      registrationDeadline,
      venue,
      maxTeams,
      minTeams,
      rules,
      scoringConfig,
      bannerImage,
      status,
    } = req.body;

    if (!name || !sport || !format || !startDate || !endDate || !registrationDeadline || !venue) {
      return res.status(400).json({
        success: false,
        message: "Name, sport, format, start date, end date, registration deadline, and venue are required.",
      });
    }

    const newTournament = new Tournament({
      name: name.trim(),
      description: description || "",
      sport: sport.trim(),
      format,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadline: new Date(registrationDeadline),
      venue: venue.trim(),
      maxTeams: maxTeams ? Number(maxTeams) : 8,
      minTeams: minTeams ? Number(minTeams) : 2,
      organizer: req.user._id,
      rules: rules || "Standard tournament rules apply.",
      scoringConfig: scoringConfig || { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0 },
      bannerImage: bannerImage || "",
      status: status || "registration_open",
      publishedAt: status && status !== "draft" ? new Date() : null,
    });

    await newTournament.save();

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully.",
      tournament: newTournament,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tournaments/:id - Update tournament (Admin only)
router.put("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    const updateFields = [
      "name",
      "description",
      "sport",
      "format",
      "startDate",
      "endDate",
      "registrationDeadline",
      "venue",
      "maxTeams",
      "minTeams",
      "rules",
      "scoringConfig",
      "bannerImage",
      "status",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        tournament[field] = req.body[field];
      }
    });

    if (tournament.status !== "draft" && !tournament.publishedAt) {
      tournament.publishedAt = new Date();
    }

    await tournament.save();

    return res.json({
      success: true,
      message: "Tournament updated successfully.",
      tournament,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tournaments/:id - Delete tournament and its matches (Admin only)
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    // Delete all matches associated with this tournament
    await Match.deleteMany({ tournament: tournament._id });
    await Tournament.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Tournament and associated fixtures deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tournaments/:id/register - Register a team for tournament (Captain or Admin)
router.post("/:id/register", verifyToken, requireRole("captain", "admin"), async (req, res, next) => {
  try {
    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: "Team ID is required to register.",
      });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    if (tournament.status !== "registration_open") {
      return res.status(400).json({
        success: false,
        message: `Registration is currently closed for this tournament (Status: ${tournament.status}).`,
      });
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has already passed.",
      });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    // Verify ownership: must be captain of team or an admin
    if (req.user.role !== "admin" && team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only register teams that you own as captain.",
      });
    }

    // Check sport compatibility (case-insensitive)
    if (team.sport.toLowerCase() !== tournament.sport.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: `Sport mismatch: This tournament is for ${tournament.sport}, but your team plays ${team.sport}.`,
      });
    }

    // Check if team is already registered
    const alreadyRegistered = tournament.registeredTeams.some(
      (r) => r.team.toString() === team._id.toString()
    );

    if (alreadyRegistered) {
      return res.status(409).json({
        success: false,
        message: "This team is already registered for this tournament.",
      });
    }

    // Check max teams capacity
    const approvedCount = tournament.registeredTeams.filter((r) => r.status === "approved").length;
    if (approvedCount >= tournament.maxTeams) {
      return res.status(400).json({
        success: false,
        message: "Tournament has already reached its maximum approved team capacity.",
      });
    }

    tournament.registeredTeams.push({
      team: team._id,
      registrationDate: new Date(),
      status: "pending",
    });

    await tournament.save();

    return res.status(201).json({
      success: true,
      message: "Team registered successfully. Awaiting administrator approval.",
      registration: tournament.registeredTeams[tournament.registeredTeams.length - 1],
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tournaments/:id/teams/:teamId/status - Approve or reject team (Admin only)
router.put("/:id/teams/:teamId/status", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status ('approved', 'rejected', or 'pending') is required.",
      });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    const reg = tournament.registeredTeams.find(
      (r) => r.team.toString() === req.params.teamId
    );

    if (!reg) {
      return res.status(404).json({
        success: false,
        message: "Team registration record not found in this tournament.",
      });
    }

    if (status === "approved") {
      const currentApproved = tournament.registeredTeams.filter(
        (r) => r.status === "approved" && r.team.toString() !== req.params.teamId
      ).length;

      if (currentApproved >= tournament.maxTeams) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve: Tournament max capacity of ${tournament.maxTeams} teams has been reached.`,
        });
      }
      reg.approvedAt = new Date();
      reg.rejectionReason = "";
    } else if (status === "rejected") {
      reg.rejectionReason = rejectionReason || "Does not meet tournament eligibility requirements.";
      reg.approvedAt = null;
    }

    reg.status = status;
    await tournament.save();

    // Notify team captain
    const teamDoc = await Team.findById(req.params.teamId);
    if (teamDoc && teamDoc.captain) {
      const notif = await Notification.create({
        user: teamDoc.captain,
        type: status === "approved" ? "team_approved" : "team_rejected",
        title: status === "approved" ? "Team Approved! 🎉" : "Team Registration Update",
        message:
          status === "approved"
            ? `Great news! "${teamDoc.name}" has been approved for "${tournament.name}".`
            : `Registration update for "${teamDoc.name}": ${reg.rejectionReason}`,
        tournament: tournament._id,
        team: teamDoc._id,
        link: `/tournaments/${tournament._id}`,
      }).catch(() => null);

      if (req.io && notif) {
        req.io.emit("notification:new", { userId: teamDoc.captain.toString(), notification: notif });
      }
    }

    // Activity log
    await ActivityLog.create({
      user: req.user._id,
      action: status === "approved" ? "APPROVED_TEAM" : "REJECTED_TEAM",
      entity: "Team",
      entityId: req.params.teamId,
      description: `Admin updated team ${teamDoc?.name || req.params.teamId} status to '${status}' in tournament '${tournament.name}'`,
      ip: req.ip,
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Team registration status updated to '${status}'.`,
      registration: reg,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tournaments/:id/fixtures/generate - Generate fixtures (Admin only)
router.post("/:id/fixtures/generate", verifyToken, requireRole("admin"), async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    // Get approved teams
    const approvedTeamIds = tournament.registeredTeams
      .filter((r) => r.status === "approved")
      .map((r) => r.team);

    if (approvedTeamIds.length < (tournament.minTeams || 2)) {
      return res.status(400).json({
        success: false,
        message: `At least ${tournament.minTeams || 2} approved teams are required to generate fixtures. Currently approved: ${approvedTeamIds.length}.`,
      });
    }

    // Clean up existing matches if any
    await Match.deleteMany({ tournament: tournament._id });

    let createdMatches = [];
    if (tournament.format === "knockout") {
      createdMatches = await generateKnockoutFixtures({
        tournamentId: tournament._id,
        teamIds: approvedTeamIds,
        startDate: tournament.startDate,
        venue: tournament.venue,
      });
    } else {
      createdMatches = await generateLeagueFixtures({
        tournamentId: tournament._id,
        teamIds: approvedTeamIds,
        startDate: tournament.startDate,
        venue: tournament.venue,
      });
    }

    // Update tournament status to in_progress if not already
    if (tournament.status === "registration_open" || tournament.status === "registration_closed" || tournament.status === "draft") {
      tournament.status = "in_progress";
      await tournament.save();
    }

    // Return populated matches
    const populated = await Match.find({ tournament: tournament._id })
      .populate("teamA.team", "name logo color")
      .populate("teamB.team", "name logo color")
      .populate("winner", "name logo color")
      .sort({ round: 1, matchNumber: 1 });

    return res.status(201).json({
      success: true,
      message: `Generated ${createdMatches.length} fixtures for ${tournament.name} (${tournament.format}).`,
      count: createdMatches.length,
      matches: populated,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tournaments/:id/standings - Get live league standings or knockout summary
router.get("/:id/standings", optionalAuth, async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate("registeredTeams.team");
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    const matches = await Match.find({ tournament: tournament._id })
      .populate("teamA.team", "name logo color sport")
      .populate("teamB.team", "name logo color sport")
      .populate("winner", "name logo color")
      .sort({ round: 1, matchNumber: 1 });

    if (tournament.format === "league") {
      // Calculate real-time league table
      const approvedTeams = tournament.registeredTeams
        .filter((r) => r.status === "approved" && r.team)
        .map((r) => r.team);

      const statsMap = new Map();

      // Initialize team stats
      approvedTeams.forEach((t) => {
        statsMap.set(t._id.toString(), {
          team: {
            _id: t._id,
            name: t.name,
            logo: t.logo,
            color: t.color,
            sport: t.sport,
          },
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          form: [], // 'W', 'D', 'L'
        });
      });

      const winPts = tournament.scoringConfig?.pointsPerWin ?? 3;
      const drawPts = tournament.scoringConfig?.pointsPerDraw ?? 1;
      const lossPts = tournament.scoringConfig?.pointsPerLoss ?? 0;

      // Process completed matches
      const completedMatches = matches.filter((m) => m.status === "completed");

      completedMatches.forEach((m) => {
        const teamAId = m.teamA?.team?._id ? m.teamA.team._id.toString() : m.teamA?.team?.toString();
        const teamBId = m.teamB?.team?._id ? m.teamB.team._id.toString() : m.teamB?.team?.toString();

        const statA = statsMap.get(teamAId);
        const statB = statsMap.get(teamBId);

        if (!statA || !statB) return;

        const scoreA = Number(m.teamA?.score || 0);
        const scoreB = Number(m.teamB?.score || 0);

        statA.played += 1;
        statB.played += 1;

        statA.goalsFor += scoreA;
        statA.goalsAgainst += scoreB;
        statB.goalsFor += scoreB;
        statB.goalsAgainst += scoreA;

        if (scoreA > scoreB) {
          statA.won += 1;
          statA.points += winPts;
          statA.form.push("W");

          statB.lost += 1;
          statB.points += lossPts;
          statB.form.push("L");
        } else if (scoreB > scoreA) {
          statB.won += 1;
          statB.points += winPts;
          statB.form.push("W");

          statA.lost += 1;
          statA.points += lossPts;
          statA.form.push("L");
        } else {
          // Draw
          statA.drawn += 1;
          statA.points += drawPts;
          statA.form.push("D");

          statB.drawn += 1;
          statB.points += drawPts;
          statB.form.push("D");
        }
      });

      // Calculate goal differences and keep last 5 in form
      const standings = Array.from(statsMap.values()).map((s) => {
        s.goalDifference = s.goalsFor - s.goalsAgainst;
        s.form = s.form.slice(-5);
        return s;
      });

      // Sort: Points DESC -> Goal Difference DESC -> Goals For DESC -> Name ASC
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.team.name.localeCompare(b.team.name);
      });

      // Add position rank
      standings.forEach((s, idx) => {
        s.rank = idx + 1;
      });

      return res.json({
        success: true,
        format: "league",
        tournamentName: tournament.name,
        totalMatches: matches.length,
        completedMatches: completedMatches.length,
        standings,
      });
    } else {
      // Knockout bracket summary
      const totalRounds = Math.max(...matches.map((m) => m.round), 1);
      const finalMatch = matches.find((m) => m.round === totalRounds);
      const champion = finalMatch && finalMatch.status === "completed" ? finalMatch.winner : null;

      return res.json({
        success: true,
        format: "knockout",
        tournamentName: tournament.name,
        totalRounds,
        totalMatches: matches.length,
        completedMatches: matches.filter((m) => m.status === "completed").length,
        champion,
        matches,
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/tournaments/:id/favourite - Toggle favourite tournament for current user
router.post("/:id/favourite", verifyToken, async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    const user = await User.findById(req.user._id);
    const tourIdStr = tournament._id.toString();
    const existingIndex = user.favourites.findIndex(
      (fav) => fav.toString() === tourIdStr
    );

    let isFavourite = false;
    if (existingIndex > -1) {
      user.favourites.splice(existingIndex, 1);
      isFavourite = false;
    } else {
      user.favourites.push(tournament._id);
      isFavourite = true;
    }

    await user.save();

    return res.json({
      success: true,
      isFavourite,
      favourites: user.favourites,
      message: isFavourite ? "Added to your favourite tournaments." : "Removed from favourites.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
