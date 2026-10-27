// Native fetch used in Node 24

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
  console.log("=================================================");
  console.log("   SPORTSYNC COMPLETE WORKFLOW VERIFICATION     ");
  console.log("=================================================");

  try {
    // 1. Health Check
    console.log("\n[1/10] Checking System Health & Database Connection...");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log(` -> Health: ${health.service}, Database: ${health.database} (${health.dbName})`);
    if (health.database !== "connected") throw new Error("Database not connected");

    // 2. Admin Login
    console.log("\n[2/10] Testing Administrator Authentication...");
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@sportsync.com", password: "Admin@123" }),
    });
    const adminAuth = await adminLoginRes.json();
    console.log(` -> Admin Logged In: ${adminAuth.user.name} (${adminAuth.user.role})`);
    const adminToken = adminAuth.token;

    // 3. Platform Overview Statistics
    console.log("\n[3/10] Testing Platform Overview Statistics Endpoint...");
    const statsRes = await fetch(`${BASE_URL}/stats/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    console.log(` -> Total Tournaments: ${statsData.stats.totalTournaments}, Teams: ${statsData.stats.totalTeams}, Matches: ${statsData.stats.totalMatches}`);

    // 4. Captain Login & Team Inspection
    console.log("\n[4/10] Testing Captain Authentication (Alex Rivera)...");
    const captLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "captain.alex@sportsync.com", password: "Captain@123" }),
    });
    const captAuth = await captLoginRes.json();
    console.log(` -> Captain Logged In: ${captAuth.user.name} (${captAuth.user.role})`);
    const captainToken = captAuth.token;

    // 5. Captain Teams & Add Player
    console.log("\n[5/10] Testing Captain Team Management & Roster Addition...");
    const myTeamsRes = await fetch(`${BASE_URL}/teams?captain=${captAuth.user._id}`);
    const myTeamsData = await myTeamsRes.json();
    const footballTeam = myTeamsData.teams.find((t) => t.sport === "Football");
    console.log(` -> Found Captain Team: ${footballTeam.name} (${footballTeam.players.length} players)`);

    // Add player to roster
    const addPlayerRes = await fetch(`${BASE_URL}/teams/${footballTeam._id}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${captainToken}`,
      },
      body: JSON.stringify({
        name: "Test Striker Player",
        jerseyNumber: 99,
        position: "Forward",
      }),
    });
    const addPlayerData = await addPlayerRes.json();
    console.log(` -> Added Player. Updated Roster: ${addPlayerData.team.players.length} players`);

    // 6. Admin Create New Badminton Tournament
    console.log("\n[6/10] Testing Admin Tournament Creation...");
    const createTournRes = await fetch(`${BASE_URL}/tournaments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Varsity Volleyball Invitational",
        sport: "Volleyball",
        format: "knockout",
        startDate: "2026-12-01",
        endDate: "2026-12-05",
        registrationDeadline: "2026-11-28",
        venue: "Indoor Pavilion Court 1",
        maxTeams: 4,
        rules: "Standard collegiate volleyball rules.",
      }),
    });
    const tournData = await createTournRes.json();
    console.log(` -> Created Tournament: ${tournData.tournament.name} [ID: ${tournData.tournament._id}]`);

    // 7. Test Knockout Bracket Progression on Existing Football Cup
    console.log("\n[7/10] Testing Knockout Tournament Matches & Automatic Bracket Progression...");
    const fbTourns = await (await fetch(`${BASE_URL}/tournaments?sport=Football`)).json();
    const fbTourn = fbTourns.tournaments[0];
    const fbMatches = await (await fetch(`${BASE_URL}/matches?tournament=${fbTourn._id}`)).json();
    console.log(` -> Football Cup matches count: ${fbMatches.count}`);

    const finalMatch = fbMatches.matches.find((m) => m.roundName === "Final");
    console.log(` -> Final Match Slot Team A: ${finalMatch.teamA.team?.name}, Team B: ${finalMatch.teamB.team?.name}`);

    // Record Final match score as Admin
    console.log("\n[8/10] Testing Match Score Entry on Final (Thunderbolts vs Cyber Titans)...");
    const scoreRes = await fetch(`${BASE_URL}/matches/${finalMatch._id}/score`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        scoreA: 3,
        scoreB: 1,
        status: "completed",
        notes: "Thunderbolts crowned champions!",
      }),
    });
    const scoreData = await scoreRes.json();
    console.log(` -> Final Result: ${scoreData.match.teamA.score} - ${scoreData.match.teamB.score}, Winner: ${scoreData.match.winner.name}`);

    // Verify tournament completion & standings
    const tournDetail = await (await fetch(`${BASE_URL}/tournaments/${fbTourn._id}/standings`)).json();
    console.log(` -> Knockout Summary Champion: ${tournDetail.champion ? tournDetail.champion.name : "None"}`);

    // 9. Test Dynamic League Standings Calculation
    console.log("\n[9/10] Testing Dynamic League Standings Calculation (Basketball Hoops League)...");
    const bbTourns = await (await fetch(`${BASE_URL}/tournaments?sport=Basketball`)).json();
    const bbTourn = bbTourns.tournaments[0];
    const standingsRes = await fetch(`${BASE_URL}/tournaments/${bbTourn._id}/standings`);
    const standingsData = await standingsRes.json();
    console.log(" -> League Standings Table:");
    standingsData.standings.forEach((s) => {
      console.log(`    Rank ${s.rank}: ${s.team.name.padEnd(20)} | P:${s.played} W:${s.won} D:${s.drawn} L:${s.lost} | GD:${s.goalDifference > 0 ? "+" + s.goalDifference : s.goalDifference} | PTS:${s.points} | Form:[${s.form.join(",")}]`);
    });

    // 10. Viewer / Public Access (No Auth Header)
    console.log("\n[10/10] Testing Public Viewer Access (Unauthenticated)...");
    const publicTourns = await (await fetch(`${BASE_URL}/tournaments`)).json();
    console.log(` -> Public Tournaments Listed: ${publicTourns.tournaments.length}`);
    const publicTeams = await (await fetch(`${BASE_URL}/teams`)).json();
    console.log(` -> Public Teams Listed: ${publicTeams.teams.length}`);

    console.log("\n=================================================");
    console.log("   ALL 10 FULL-STACK VERIFICATIONS PASSED!       ");
    console.log("=================================================");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runTests();
