import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import Notification from "../models/Notification.js";
import Comment from "../models/Comment.js";
import ActivityLog from "../models/ActivityLog.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sportsync";

async function seed() {
  console.log("==========================================");
  console.log("   SPORTSYNC DATABASE SEEDING UTILITY    ");
  console.log("==========================================");
  console.log(`Target MongoDB URI: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB successfully.");

    // Clean existing records in sportsync database
    console.log("Clearing existing collections...");
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Tournament.deleteMany({}),
      Match.deleteMany({}),
      Notification.deleteMany({}),
      Comment.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);
    console.log("Cleaned collections successfully.");

    // 1. Create Users - All passwords standardized to Demo@1234
    console.log("Creating administrative, captain, and viewer accounts...");
    const demoPasswordHash = await User.hashPassword("Demo@1234");

    const [adminUser, captainAlex, captainSarah, captainRohit, captainMarcus, viewerUser] =
      await User.insertMany([
        {
          name: "Tournament Administrator",
          username: "admin",
          email: "admin@sportsync.com",
          passwordHash: demoPasswordHash,
          role: "admin",
          phone: "+1 (555) 019-2831",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        },
        {
          name: "Alex Rivera",
          username: "captain.alex",
          email: "captain.alex@sportsync.com",
          passwordHash: demoPasswordHash,
          role: "captain",
          phone: "+1 (555) 014-9982",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        },
        {
          name: "Sarah Connor",
          username: "captain.sarah",
          email: "captain.sarah@sportsync.com",
          passwordHash: demoPasswordHash,
          role: "captain",
          phone: "+1 (555) 017-3341",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        },
        {
          name: "Rohit Sharma",
          username: "captain.rohit",
          email: "captain.rohit@sportsync.com",
          passwordHash: demoPasswordHash,
          role: "captain",
          phone: "+1 (555) 018-4421",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        },
        {
          name: "Marcus Vance",
          username: "captain.marcus",
          email: "captain.marcus@sportsync.com",
          passwordHash: demoPasswordHash,
          role: "captain",
          phone: "+1 (555) 011-8829",
          avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
        },
        {
          name: "Elena Rostova",
          username: "viewer",
          email: "viewer@sportsync.com",
          passwordHash: demoPasswordHash,
          role: "viewer",
          phone: "+1 (555) 012-7711",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
        },
      ]);

    console.log("Users created with password 'Demo@1234'.");

    // 2. Create Teams with full rosters across sports
    console.log("Creating teams and player rosters across multiple sports...");

    // Football Teams
    const teamThunderbolts = await Team.create({
      name: "Thunderbolts FC",
      sport: "Football",
      captain: captainAlex._id,
      color: "#10B981", // Emerald
      description: "Reigning regional champions known for lightning counter-attacks.",
      contactEmail: captainAlex.email,
      contactPhone: captainAlex.phone,
      players: [
        { name: "Alex Rivera", jerseyNumber: 10, position: "Striker / Captain", email: captainAlex.email },
        { name: "David Silva", jerseyNumber: 7, position: "Winger" },
        { name: "Julian Brandt", jerseyNumber: 8, position: "Midfielder" },
        { name: "Carlos Puyol", jerseyNumber: 4, position: "Center Back" },
        { name: "Manuel Neuer", jerseyNumber: 1, position: "Goalkeeper" },
        { name: "Luca Modric", jerseyNumber: 11, position: "Playmaker" },
        { name: "Sergio Ramos", jerseyNumber: 3, position: "Defender" },
        { name: "Gareth Bale", jerseyNumber: 9, position: "Winger" },
        { name: "Toni Kroos", jerseyNumber: 6, position: "Midfielder" },
        { name: "Jordi Alba", jerseyNumber: 5, position: "Left Back" },
        { name: "Trent Arnold", jerseyNumber: 2, position: "Right Back" },
      ],
    });

    const teamApexStrikers = await Team.create({
      name: "Apex Strikers",
      sport: "Football",
      captain: captainSarah._id,
      color: "#3B82F6", // Blue
      description: "Tactical defense and high-pressing collegiate football club.",
      contactEmail: captainSarah.email,
      contactPhone: captainSarah.phone,
      players: [
        { name: "Sarah Connor", jerseyNumber: 9, position: "Forward / Captain", email: captainSarah.email },
        { name: "Maya Lin", jerseyNumber: 1, position: "Goalkeeper" },
        { name: "Rachel Green", jerseyNumber: 5, position: "Center Back" },
        { name: "Chloe Decker", jerseyNumber: 8, position: "Central Midfielder" },
        { name: "Kaitlyn Cruz", jerseyNumber: 11, position: "Left Winger" },
        { name: "Sonia Patel", jerseyNumber: 7, position: "Right Winger" },
        { name: "Jessica Taylor", jerseyNumber: 4, position: "Defender" },
        { name: "Emma Watson", jerseyNumber: 6, position: "Defensive Mid" },
      ],
    });

    const teamCyberTitans = await Team.create({
      name: "Cyber Titans",
      sport: "Football",
      captain: captainMarcus._id,
      color: "#8B5CF6", // Purple
      description: "Engineering varsity powerhouse with relentless stamina.",
      contactEmail: captainMarcus.email,
      players: [
        { name: "Marcus Vance", jerseyNumber: 1, position: "Goalkeeper / Captain", email: captainMarcus.email },
        { name: "Devon Scott", jerseyNumber: 10, position: "Striker" },
        { name: "Liam Chen", jerseyNumber: 7, position: "Attacking Mid" },
        { name: "Noah Jensen", jerseyNumber: 3, position: "Fullback" },
        { name: "Aaron Brooks", jerseyNumber: 5, position: "Stopper" },
      ],
    });

    const teamVanguardElite = await Team.create({
      name: "Vanguard Elite",
      sport: "Football",
      captain: captainRohit._id,
      color: "#F59E0B", // Amber
      description: "Athletics academy varsity football squad.",
      contactEmail: captainRohit.email,
      players: [
        { name: "Rohit Sharma", jerseyNumber: 11, position: "Striker / Captain", email: captainRohit.email },
        { name: "Vikram Seth", jerseyNumber: 1, position: "Goalkeeper" },
        { name: "Arjun Rao", jerseyNumber: 4, position: "Center Back" },
        { name: "Sameer Khan", jerseyNumber: 8, position: "Midfielder" },
      ],
    });

    // Basketball Teams
    const teamMetroHawks = await Team.create({
      name: "Metro Hawks",
      sport: "Basketball",
      captain: captainAlex._id,
      color: "#EF4444", // Red
      description: "High-flying dunkers and fast-break basketball varsity team.",
      players: [
        { name: "Alex Rivera", jerseyNumber: 23, position: "Shooting Guard" },
        { name: "Jason Tatum", jerseyNumber: 0, position: "Small Forward" },
        { name: "Chris Paul", jerseyNumber: 3, position: "Point Guard" },
        { name: "Bam Adebayo", jerseyNumber: 13, position: "Center" },
        { name: "Draymond Green", jerseyNumber: 23, position: "Power Forward" },
      ],
    });

    const teamSolarFlares = await Team.create({
      name: "Solar Flares",
      sport: "Basketball",
      captain: captainSarah._id,
      color: "#F97316", // Orange
      description: "Deadly three-point shooting and precision perimeter squad.",
      players: [
        { name: "Sarah Connor", jerseyNumber: 30, position: "Point Guard" },
        { name: "Diana Taurasi", jerseyNumber: 3, position: "Shooting Guard" },
        { name: "Sue Bird", jerseyNumber: 10, position: "Point Guard" },
        { name: "Breanna Stewart", jerseyNumber: 30, position: "Forward" },
        { name: "Brittney Griner", jerseyNumber: 42, position: "Center" },
      ],
    });

    const teamIronRhinos = await Team.create({
      name: "Iron Rhinos",
      sport: "Basketball",
      captain: captainMarcus._id,
      color: "#64748B", // Slate
      description: "Heavy rebounding and lockdown inside defensive wall.",
      players: [
        { name: "Marcus Vance", jerseyNumber: 34, position: "Center" },
        { name: "Goran Dragic", jerseyNumber: 7, position: "Point Guard" },
        { name: "Jimmy Butler", jerseyNumber: 22, position: "Small Forward" },
        { name: "Kyle Lowry", jerseyNumber: 7, position: "Guard" },
      ],
    });

    const teamBlazeCity = await Team.create({
      name: "Blaze City",
      sport: "Basketball",
      captain: captainRohit._id,
      color: "#EC4899", // Pink
      description: "Dynamic transition offense and clutch shooting squad.",
      players: [
        { name: "Rohit Sharma", jerseyNumber: 1, position: "Point Guard" },
        { name: "Damian Lillard", jerseyNumber: 0, position: "Guard" },
        { name: "CJ McCollum", jerseyNumber: 3, position: "Shooting Guard" },
        { name: "Jusuf Nurkic", jerseyNumber: 27, position: "Center" },
      ],
    });

    // Cricket Teams
    const teamRoyalChallengers = await Team.create({
      name: "Royal Challengers Campus",
      sport: "Cricket",
      captain: captainRohit._id,
      color: "#DC2626",
      description: "Explosive batting lineup with international coaching support.",
      players: [
        { name: "Rohit Sharma", jerseyNumber: 45, position: "Opening Batsman / Captain" },
        { name: "Virat Kohli", jerseyNumber: 18, position: "Top Order Batsman" },
        { name: "Jasprit Bumrah", jerseyNumber: 93, position: "Fast Bowler" },
        { name: "Hardik Pandya", jerseyNumber: 33, position: "All Rounder" },
        { name: "Ravindra Jadeja", jerseyNumber: 8, position: "Spin All Rounder" },
      ],
    });

    const teamSuperKings = await Team.create({
      name: "Super Kings CC",
      sport: "Cricket",
      captain: captainAlex._id,
      color: "#EAB308",
      description: "Calm finishers and seasoned collegiate spin specialists.",
      players: [
        { name: "Alex Rivera", jerseyNumber: 7, position: "Wicketkeeper / Captain" },
        { name: "Shane Watson", jerseyNumber: 33, position: "All Rounder" },
        { name: "Dwayne Bravo", jerseyNumber: 47, position: "Fast Bowler" },
        { name: "Suresh Raina", jerseyNumber: 48, position: "Middle Order" },
      ],
    });

    // Volleyball Teams
    const teamSpikeStorm = await Team.create({
      name: "Spike Storm",
      sport: "Volleyball",
      captain: captainSarah._id,
      color: "#06B6D4", // Cyan
      description: "Aggressive front line blockers and precision servers.",
      players: [
        { name: "Sarah Connor", jerseyNumber: 4, position: "Outside Hitter / Captain" },
        { name: "Karch Kiraly", jerseyNumber: 1, position: "Setter" },
        { name: "Giba Rezende", jerseyNumber: 7, position: "Opposite" },
        { name: "Matt Anderson", jerseyNumber: 12, position: "Middle Blocker" },
      ],
    });

    const teamNetNinjas = await Team.create({
      name: "Net Ninjas",
      sport: "Volleyball",
      captain: captainAlex._id,
      color: "#14B8A6", // Teal
      description: "Quick tempo attacks and outstanding libero digging.",
      players: [
        { name: "Alex Rivera", jerseyNumber: 10, position: "Libero / Captain" },
        { name: "Wilfredo Leon", jerseyNumber: 9, position: "Outside Hitter" },
        { name: "Bruno Rezende", jerseyNumber: 2, position: "Setter" },
        { name: "Robertlandy Simon", jerseyNumber: 11, position: "Middle Blocker" },
      ],
    });

    // Table Tennis Teams
    const teamSpinMasters = await Team.create({
      name: "Spin Masters",
      sport: "Table Tennis",
      captain: captainMarcus._id,
      color: "#84CC16", // Lime
      description: "Unstoppable topspin loops and close-table reflex play.",
      players: [
        { name: "Marcus Vance", jerseyNumber: 8, position: "Singles Ace / Captain" },
        { name: "Ma Long", jerseyNumber: 1, position: "Left Hand Attacker" },
      ],
    });

    const teamSmashSquad = await Team.create({
      name: "Smash Squad",
      sport: "Table Tennis",
      captain: captainRohit._id,
      color: "#F43F5E", // Rose
      description: "Lightning backhand drives and strategic pen-hold chop play.",
      players: [
        { name: "Rohit Sharma", jerseyNumber: 5, position: "Captain / Attacker" },
        { name: "Fan Zhendong", jerseyNumber: 7, position: "Power Driver" },
      ],
    });

    console.log("Teams and rosters created.");

    // 3. Create Tournaments & Matches
    console.log("Setting up tournaments (6 total across different formats & sports)...");

    // Tournament 1: Football Knockout Cup
    const tFootball = await Tournament.create({
      name: "National Collegiate Football Championship",
      sport: "Football",
      format: "knockout",
      status: "in_progress",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-11-15"),
      registrationDeadline: new Date("2026-10-28"),
      venue: "Grand Central Arena Stadium",
      maxTeams: 4,
      minTeams: 4,
      organizer: adminUser._id,
      rules: "90 minutes standard regulation. Penalty shootout decider if tied. Single elimination bracket.",
      scoringConfig: { pointsPerWin: 3, pointsPerDraw: 1, pointsPerLoss: 0, allowDraws: false },
      bannerImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
      publishedAt: new Date("2026-10-15"),
      registeredTeams: [
        { team: teamThunderbolts._id, status: "approved", approvedAt: new Date() },
        { team: teamApexStrikers._id, status: "approved", approvedAt: new Date() },
        { team: teamCyberTitans._id, status: "approved", approvedAt: new Date() },
        { team: teamVanguardElite._id, status: "approved", approvedAt: new Date() },
      ],
    });

    // Final Match (Round 2)
    const finalFootballMatch = await Match.create({
      tournament: tFootball._id,
      round: 2,
      roundName: "Final",
      matchNumber: 3,
      teamA: { team: teamThunderbolts._id, score: 0 },
      teamB: { team: teamCyberTitans._id, score: 0 },
      status: "scheduled",
      venue: "Grand Central Arena Stadium (Pitch 1)",
      scheduledDate: new Date("2026-11-15T18:00:00Z"),
      nextMatchId: null,
      nextMatchSlot: null,
    });

    // Semi-Final 1 (Round 1) - Completed
    const sf1 = await Match.create({
      tournament: tFootball._id,
      round: 1,
      roundName: "Semi-Final",
      matchNumber: 1,
      teamA: { team: teamThunderbolts._id, score: 3 },
      teamB: { team: teamApexStrikers._id, score: 1 },
      winner: teamThunderbolts._id,
      isDraw: false,
      status: "completed",
      venue: "Grand Central Arena Stadium (Pitch 1)",
      scheduledDate: new Date("2026-11-05T14:00:00Z"),
      completedAt: new Date("2026-11-05T16:00:00Z"),
      nextMatchId: finalFootballMatch._id,
      nextMatchSlot: "teamA",
      matchDetails: {
        notes: "Dominant second-half performance by Thunderbolts FC.",
        referee: "Howard Webb",
      },
    });

    // Semi-Final 2 (Round 1) - Completed
    const sf2 = await Match.create({
      tournament: tFootball._id,
      round: 1,
      roundName: "Semi-Final",
      matchNumber: 2,
      teamA: { team: teamCyberTitans._id, score: 2 },
      teamB: { team: teamVanguardElite._id, score: 0 },
      winner: teamCyberTitans._id,
      isDraw: false,
      status: "completed",
      venue: "Grand Central Arena Stadium (Pitch 2)",
      scheduledDate: new Date("2026-11-06T14:00:00Z"),
      completedAt: new Date("2026-11-06T16:00:00Z"),
      nextMatchId: finalFootballMatch._id,
      nextMatchSlot: "teamB",
      matchDetails: {
        notes: "Cyber Titans defense kept a clean sheet throughout the match.",
        referee: "Pierluigi Collina",
      },
    });

    // Tournament 2: Basketball League
    const tBasketball = await Tournament.create({
      name: "Varsity Premier Hoops League",
      sport: "Basketball",
      format: "league",
      status: "in_progress",
      startDate: new Date("2026-11-10"),
      endDate: new Date("2026-12-05"),
      registrationDeadline: new Date("2026-11-01"),
      venue: "East Campus Sports Dome",
      maxTeams: 4,
      minTeams: 4,
      organizer: adminUser._id,
      rules: "4 quarters of 10 minutes. FIBA rules. 2 points for a win, 0 for a loss.",
      scoringConfig: { pointsPerWin: 2, pointsPerDraw: 1, pointsPerLoss: 0, allowDraws: false },
      bannerImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
      publishedAt: new Date("2026-10-18"),
      registeredTeams: [
        { team: teamMetroHawks._id, status: "approved", approvedAt: new Date() },
        { team: teamSolarFlares._id, status: "approved", approvedAt: new Date() },
        { team: teamIronRhinos._id, status: "approved", approvedAt: new Date() },
        { team: teamBlazeCity._id, status: "approved", approvedAt: new Date() },
      ],
    });

    // League Matches
    await Match.create({
      tournament: tBasketball._id,
      round: 1,
      roundName: "Matchday 1",
      matchNumber: 1,
      teamA: { team: teamMetroHawks._id, score: 88 },
      teamB: { team: teamSolarFlares._id, score: 79 },
      winner: teamMetroHawks._id,
      isDraw: false,
      status: "completed",
      venue: "Court A",
      scheduledDate: new Date("2026-11-10T16:00:00Z"),
      completedAt: new Date("2026-11-10T18:00:00Z"),
    });

    await Match.create({
      tournament: tBasketball._id,
      round: 1,
      roundName: "Matchday 1",
      matchNumber: 2,
      teamA: { team: teamIronRhinos._id, score: 72 },
      teamB: { team: teamBlazeCity._id, score: 85 },
      winner: teamBlazeCity._id,
      isDraw: false,
      status: "completed",
      venue: "Court B",
      scheduledDate: new Date("2026-11-10T18:00:00Z"),
      completedAt: new Date("2026-11-10T20:00:00Z"),
    });

    await Match.create({
      tournament: tBasketball._id,
      round: 2,
      roundName: "Matchday 2",
      matchNumber: 3,
      teamA: { team: teamMetroHawks._id, score: 0 },
      teamB: { team: teamIronRhinos._id, score: 0 },
      status: "scheduled",
      venue: "Court A",
      scheduledDate: new Date("2026-11-17T16:00:00Z"),
    });

    await Match.create({
      tournament: tBasketball._id,
      round: 2,
      roundName: "Matchday 2",
      matchNumber: 4,
      teamA: { team: teamSolarFlares._id, score: 0 },
      teamB: { team: teamBlazeCity._id, score: 0 },
      status: "scheduled",
      venue: "Court B",
      scheduledDate: new Date("2026-11-17T18:00:00Z"),
    });

    // Tournament 3: Cricket T20 Championship (Open for registration)
    const tCricket = await Tournament.create({
      name: "All-Stars T20 Cricket Trophy",
      sport: "Cricket",
      format: "league",
      status: "registration_open",
      startDate: new Date("2026-12-01"),
      endDate: new Date("2026-12-20"),
      registrationDeadline: new Date("2026-11-25"),
      venue: "University Oval Ground",
      maxTeams: 8,
      minTeams: 4,
      organizer: adminUser._id,
      rules: "20 overs per side. White ball, colored clothing. DLS method in case of rain interruptions.",
      scoringConfig: { pointsPerWin: 2, pointsPerDraw: 1, pointsPerLoss: 0, allowDraws: true },
      bannerImage: "https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=1200&q=80",
      publishedAt: new Date("2026-10-20"),
      registeredTeams: [
        {
          team: teamRoyalChallengers._id,
          status: "approved",
          approvedAt: new Date(),
        },
        {
          team: teamSuperKings._id,
          status: "pending",
          registrationDate: new Date(),
        },
      ],
    });

    // Tournament 4: Campus Badminton Smash Open (Knockout open for registration)
    const tBadminton = await Tournament.create({
      name: "Inter-University Badminton Open",
      sport: "Badminton",
      format: "knockout",
      status: "registration_open",
      startDate: new Date("2026-12-10"),
      endDate: new Date("2026-12-14"),
      registrationDeadline: new Date("2026-12-05"),
      venue: "Student Recreation Center Hall 3",
      maxTeams: 8,
      minTeams: 4,
      organizer: adminUser._id,
      rules: "Best of 3 sets to 21 points. BWF rules apply.",
      scoringConfig: { pointsPerWin: 1, pointsPerDraw: 0, pointsPerLoss: 0, allowDraws: false },
      bannerImage: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
      publishedAt: new Date("2026-10-22"),
      registeredTeams: [],
    });

    // Tournament 5: Volleyball Knockout Cup (In Progress)
    const tVolleyball = await Tournament.create({
      name: "National Collegiate Volleyball Championship",
      sport: "Volleyball",
      format: "knockout",
      status: "in_progress",
      startDate: new Date("2026-11-20"),
      endDate: new Date("2026-11-28"),
      registrationDeadline: new Date("2026-11-15"),
      venue: "Metro Arena Volleyball Center",
      maxTeams: 4,
      minTeams: 2,
      organizer: adminUser._id,
      rules: "Best of 5 sets to 25 points (deciding 5th set to 15 points). Rally scoring.",
      scoringConfig: { pointsPerWin: 3, pointsPerDraw: 0, pointsPerLoss: 0, allowDraws: false },
      bannerImage: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80",
      publishedAt: new Date("2026-10-24"),
      registeredTeams: [
        { team: teamSpikeStorm._id, status: "approved", approvedAt: new Date() },
        { team: teamNetNinjas._id, status: "approved", approvedAt: new Date() },
      ],
    });

    // Volleyball Final Match
    await Match.create({
      tournament: tVolleyball._id,
      round: 1,
      roundName: "Championship Final",
      matchNumber: 1,
      teamA: { team: teamSpikeStorm._id, score: 3 },
      teamB: { team: teamNetNinjas._id, score: 2 },
      winner: teamSpikeStorm._id,
      isDraw: false,
      status: "completed",
      venue: "Metro Arena Center Court",
      scheduledDate: new Date("2026-11-22T15:00:00Z"),
      completedAt: new Date("2026-11-22T17:30:00Z"),
      matchDetails: {
        notes: "Thrilling 5-set nailbiter decided 15-13 in the final tiebreak!",
        referee: "Elena Garcia",
      },
    });

    // Tournament 6: Table Tennis Masters (League - Registration Open)
    const tTableTennis = await Tournament.create({
      name: "Grand Slam Table Tennis Masters",
      sport: "Table Tennis",
      format: "league",
      status: "registration_open",
      startDate: new Date("2026-12-15"),
      endDate: new Date("2026-12-22"),
      registrationDeadline: new Date("2026-12-10"),
      venue: "University Indoor Complex Table 1-4",
      maxTeams: 6,
      minTeams: 2,
      organizer: adminUser._id,
      rules: "Best of 5 games to 11 points. ITTF standard tournament regulations.",
      scoringConfig: { pointsPerWin: 2, pointsPerDraw: 0, pointsPerLoss: 0, allowDraws: false },
      bannerImage: "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=1200&q=80",
      publishedAt: new Date("2026-10-25"),
      registeredTeams: [
        { team: teamSpinMasters._id, status: "approved", approvedAt: new Date() },
        { team: teamSmashSquad._id, status: "pending", registrationDate: new Date() },
      ],
    });

    // 4. Set Favourites for users
    captainAlex.favourites = [tFootball._id, tBasketball._id];
    await captainAlex.save();

    viewerUser.favourites = [tFootball._id, tVolleyball._id];
    await viewerUser.save();

    // 5. Create Sample Notifications
    console.log("Creating demo notifications...");
    await Notification.insertMany([
      {
        user: captainAlex._id,
        type: "team_approved",
        title: "Team Approved! 🎉",
        message: 'Your team "Thunderbolts FC" has been approved for "National Collegiate Football Championship".',
        tournament: tFootball._id,
        team: teamThunderbolts._id,
        link: `/tournaments/${tFootball._id}`,
        isRead: false,
      },
      {
        user: captainAlex._id,
        type: "score_updated",
        title: "Semi-Final Match Result ⚽",
        message: "Thunderbolts FC 3 - 1 Apex Strikers. Thunderbolts advance to the Final!",
        tournament: tFootball._id,
        link: `/tournaments/${tFootball._id}`,
        isRead: true,
      },
      {
        user: captainSarah._id,
        type: "team_approved",
        title: "Registration Confirmed! 🎉",
        message: 'Your team "Solar Flares" is ready to compete in "Varsity Premier Hoops League".',
        tournament: tBasketball._id,
        team: teamSolarFlares._id,
        link: `/tournaments/${tBasketball._id}`,
        isRead: false,
      },
      {
        user: adminUser._id,
        type: "general",
        title: "New Team Registration Pending 📝",
        message: '"Super Kings CC" registered for "All-Stars T20 Cricket Trophy". Review pending approval.',
        tournament: tCricket._id,
        link: `/admin/teams`,
        isRead: false,
      },
      {
        user: viewerUser._id,
        type: "general",
        title: "Welcome to SportSync! 🏆",
        message: "Browse live tournaments, follow brackets, and track your favourite campus teams.",
        link: `/tournaments`,
        isRead: true,
      },
    ]);

    // 6. Create Sample Comments on matches
    console.log("Creating match discussion comments...");
    await Comment.insertMany([
      {
        match: sf1._id,
        tournament: tFootball._id,
        user: captainAlex._id,
        text: "Incredible effort from the squad today! On to the finals! ⚡",
      },
      {
        match: sf1._id,
        tournament: tFootball._id,
        user: viewerUser._id,
        text: "That second goal by Alex was world class! What a match!",
      },
      {
        match: sf2._id,
        tournament: tFootball._id,
        user: captainMarcus._id,
        text: "Defense was rock solid today. See you in the final, Thunderbolts!",
      },
    ]);

    // 7. Create Sample Activity Logs for admin audit trail
    console.log("Creating audit activity logs...");
    await ActivityLog.insertMany([
      {
        user: adminUser._id,
        action: "CREATED_TOURNAMENT",
        entity: "Tournament",
        entityId: tFootball._id,
        description: 'Created tournament "National Collegiate Football Championship"',
        ip: "127.0.0.1",
      },
      {
        user: adminUser._id,
        action: "APPROVED_TEAM",
        entity: "Team",
        entityId: teamThunderbolts._id,
        description: 'Approved team "Thunderbolts FC" for football championship',
        ip: "127.0.0.1",
      },
      {
        user: adminUser._id,
        action: "UPDATED_SCORE",
        entity: "Match",
        entityId: sf1._id,
        description: "Recorded score: Thunderbolts FC (3) vs (1) Apex Strikers",
        ip: "127.0.0.1",
      },
      {
        user: adminUser._id,
        action: "CREATED_TOURNAMENT",
        entity: "Tournament",
        entityId: tVolleyball._id,
        description: 'Created tournament "National Collegiate Volleyball Championship"',
        ip: "127.0.0.1",
      },
    ]);

    console.log("==========================================");
    console.log("   SPORTSYNC SEEDING COMPLETE!           ");
    console.log("==========================================");
    console.log("Demo Accounts (ALL use password: Demo@1234):");
    console.log("  ADMIN:    admin@sportsync.com          (username: admin)");
    console.log("  CAPTAIN:  captain.alex@sportsync.com   (username: captain.alex)");
    console.log("  CAPTAIN:  captain.sarah@sportsync.com  (username: captain.sarah)");
    console.log("  CAPTAIN:  captain.rohit@sportsync.com  (username: captain.rohit)");
    console.log("  CAPTAIN:  captain.marcus@sportsync.com (username: captain.marcus)");
    console.log("  VIEWER:   viewer@sportsync.com         (username: viewer)");
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  }
}

seed();
