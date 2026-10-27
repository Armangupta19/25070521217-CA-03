import express from "express";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import { verifyToken, requireRole, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/teams - List teams
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { sport, captain, search, limit = 50 } = req.query;
    const query = { isActive: true };

    if (sport && sport !== "all") {
      query.sport = new RegExp(`^${sport}$`, "i");
    }

    if (captain) {
      query.captain = captain;
    }

    if (search && search.trim()) {
      query.name = new RegExp(search.trim(), "i");
    }

    const teams = await Team.find(query)
      .populate("captain", "name email phone avatar")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:id - Single team with roster and tournament history
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).populate("captain", "name email phone avatar");
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    // Find tournaments this team is registered in
    const tournaments = await Tournament.find({
      "registeredTeams.team": team._id,
    }).select("name sport format status startDate endDate venue registeredTeams.$");

    // Find recent matches for this team
    const matches = await Match.find({
      $or: [{ "teamA.team": team._id }, { "teamB.team": team._id }],
    })
      .populate("teamA.team", "name logo color")
      .populate("teamB.team", "name logo color")
      .populate("winner", "name logo color")
      .populate("tournament", "name sport format")
      .sort({ scheduledDate: -1 })
      .limit(20);

    return res.json({
      success: true,
      team,
      tournaments,
      matches,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams - Create team (Captain or Admin)
router.post("/", verifyToken, requireRole("captain", "admin"), async (req, res, next) => {
  try {
    const { name, sport, logo, color, description, contactEmail, contactPhone, players } = req.body;

    if (!name || !sport) {
      return res.status(400).json({
        success: false,
        message: "Team name and sport are required.",
      });
    }

    // Default captain is current user, or admin can specify captainId
    let captainId = req.user._id;
    if (req.user.role === "admin" && req.body.captainId) {
      captainId = req.body.captainId;
    }

    const newTeam = new Team({
      name: name.trim(),
      sport: sport.trim(),
      captain: captainId,
      logo: logo || "",
      color: color || "#10B981",
      description: description || "",
      contactEmail: contactEmail || req.user.email,
      contactPhone: contactPhone || req.user.phone || "",
      players: Array.isArray(players) ? players : [],
    });

    await newTeam.save();

    return res.status(201).json({
      success: true,
      message: "Team created successfully.",
      team: newTeam,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/teams/:id - Update team (Owner Captain or Admin)
router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    // Authorization: Must be the captain or an admin
    if (req.user.role !== "admin" && team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only edit teams you manage.",
      });
    }

    const { name, sport, logo, color, description, contactEmail, contactPhone } = req.body;

    if (name) team.name = name.trim();
    if (sport) team.sport = sport.trim();
    if (logo !== undefined) team.logo = logo;
    if (color !== undefined) team.color = color;
    if (description !== undefined) team.description = description;
    if (contactEmail !== undefined) team.contactEmail = contactEmail;
    if (contactPhone !== undefined) team.contactPhone = contactPhone;

    await team.save();

    return res.json({
      success: true,
      message: "Team updated successfully.",
      team,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id - Delete / deactivate team (Owner Captain or Admin)
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    if (req.user.role !== "admin" && team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete teams you manage.",
      });
    }

    // Check if team is in an active tournament
    const activeTournaments = await Tournament.countDocuments({
      "registeredTeams.team": team._id,
      status: "in_progress",
    });

    if (activeTournaments > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete team while it is participating in an active in-progress tournament.",
      });
    }

    await Team.findByIdAndDelete(team._id);

    return res.json({
      success: true,
      message: "Team deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:id/players - Add player to roster
router.post("/:id/players", verifyToken, async (req, res, next) => {
  try {
    const { name, jerseyNumber, position, email, phone } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Player name is required.",
      });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    if (req.user.role !== "admin" && team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only manage roster for your own teams.",
      });
    }

    team.players.push({
      name: name.trim(),
      jerseyNumber: jerseyNumber !== undefined && jerseyNumber !== "" ? Number(jerseyNumber) : null,
      position: position ? position.trim() : "Player",
      email: email ? email.trim() : "",
      phone: phone ? phone.trim() : "",
    });

    await team.save();

    return res.status(201).json({
      success: true,
      message: "Player added to roster successfully.",
      team,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id/players/:playerId - Remove player from roster
router.delete("/:id/players/:playerId", verifyToken, async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    if (req.user.role !== "admin" && team.captain.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only manage roster for your own teams.",
      });
    }

    team.players = team.players.filter((p) => p._id.toString() !== req.params.playerId);
    await team.save();

    return res.json({
      success: true,
      message: "Player removed from roster.",
      team,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
