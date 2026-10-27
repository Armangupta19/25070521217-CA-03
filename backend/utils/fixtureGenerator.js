import Match from "../models/Match.js";

/**
 * Generate friendly round names based on round index and total rounds
 */
function getKnockoutRoundName(roundNumber, totalRounds) {
  const diffFromFinal = totalRounds - roundNumber;
  if (diffFromFinal === 0) return "Final";
  if (diffFromFinal === 1) return "Semi-Final";
  if (diffFromFinal === 2) return "Quarter-Final";
  if (diffFromFinal === 3) return "Round of 16";
  if (diffFromFinal === 4) return "Round of 32";
  return `Round ${roundNumber}`;
}

/**
 * Generates single-elimination knockout tournament fixtures.
 * Teams are paired in Round 1, and future rounds are provisioned with nextMatchId links.
 */
export async function generateKnockoutFixtures({
  tournamentId,
  teamIds,
  startDate,
  venue = "Main Stadium",
}) {
  if (!teamIds || teamIds.length < 2) {
    throw new Error("At least 2 teams are required to generate knockout fixtures.");
  }

  // Shuffle teams for fair random seeding
  const shuffledTeams = [...teamIds].sort(() => Math.random() - 0.5);

  // Determine bracket size: nearest power of 2 >= team count
  let bracketSize = 2;
  while (bracketSize < shuffledTeams.length) {
    bracketSize *= 2;
  }

  const totalRounds = Math.log2(bracketSize);
  const baseDate = startDate ? new Date(startDate) : new Date();

  // Create matches round by round from Final backwards to link nextMatchId properly
  // Or create placeholders, then link them.
  // Structure: roundsArray[roundIndex] = [matchDocs]
  // round 1 (index 0) has bracketSize / 2 matches
  // round totalRounds (index totalRounds - 1) has 1 match (Final)

  const createdMatchesByRound = [];
  let globalMatchNum = 1;

  // First pass: generate all match records without links
  for (let r = 1; r <= totalRounds; r++) {
    const roundMatchesCount = Math.pow(2, totalRounds - r);
    const roundName = getKnockoutRoundName(r, totalRounds);
    const roundMatches = [];

    for (let m = 0; m < roundMatchesCount; m++) {
      const matchDate = new Date(baseDate);
      matchDate.setDate(baseDate.getDate() + (r - 1) * 2 + Math.floor(m / 2));

      roundMatches.push({
        tournament: tournamentId,
        round: r,
        roundName,
        matchNumber: globalMatchNum++,
        teamA: { team: null, score: 0 },
        teamB: { team: null, score: 0 },
        status: "scheduled",
        venue,
        scheduledDate: matchDate,
        nextMatchId: null,
        nextMatchSlot: null,
      });
    }

    createdMatchesByRound.push(roundMatches);
  }

  // Now populate Round 1 teams
  const round1Matches = createdMatchesByRound[0];
  let teamIdx = 0;
  for (let i = 0; i < round1Matches.length; i++) {
    if (teamIdx < shuffledTeams.length) {
      round1Matches[i].teamA.team = shuffledTeams[teamIdx++];
    }
    if (teamIdx < shuffledTeams.length) {
      round1Matches[i].teamB.team = shuffledTeams[teamIdx++];
    }
  }

  // Save all matches to MongoDB starting from the Final (highest round) so we have IDs to link
  const savedMatchesByRound = new Array(totalRounds);

  // Save from Final down to Round 1
  for (let r = totalRounds - 1; r >= 0; r--) {
    const currentRoundMatches = createdMatchesByRound[r];

    // If not the final round, link to the next round match
    if (r < totalRounds - 1) {
      const nextRoundSaved = savedMatchesByRound[r + 1];
      for (let i = 0; i < currentRoundMatches.length; i++) {
        const nextMatchIndex = Math.floor(i / 2);
        const nextMatchSlot = i % 2 === 0 ? "teamA" : "teamB";
        currentRoundMatches[i].nextMatchId = nextRoundSaved[nextMatchIndex]._id;
        currentRoundMatches[i].nextMatchSlot = nextMatchSlot;
      }
    }

    const saved = await Match.insertMany(currentRoundMatches);
    savedMatchesByRound[r] = saved;
  }

  // Flatten and return all created matches
  return savedMatchesByRound.flat();
}

/**
 * Generates round-robin league fixtures using the Berger polygon method.
 * Each team plays every other team once.
 */
export async function generateLeagueFixtures({
  tournamentId,
  teamIds,
  startDate,
  venue = "Main Arena",
}) {
  if (!teamIds || teamIds.length < 2) {
    throw new Error("At least 2 teams are required to generate league fixtures.");
  }

  // Shuffle teams
  const teams = [...teamIds].sort(() => Math.random() - 0.5);

  // If odd number of teams, add null dummy for byes
  const isOdd = teams.length % 2 !== 0;
  if (isOdd) {
    teams.push(null);
  }

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  const matchesToInsert = [];
  const baseDate = startDate ? new Date(startDate) : new Date();
  let matchNumber = 1;

  for (let round = 0; round < numRounds; round++) {
    const roundNumber = round + 1;
    const roundName = `Matchday ${roundNumber}`;

    for (let match = 0; match < matchesPerRound; match++) {
      const home = (round + match) % (numTeams - 1);
      let away = (numTeams - 1 - match + round) % (numTeams - 1);

      if (match === 0) {
        away = numTeams - 1;
      }

      const teamAId = teams[home];
      const teamBId = teams[away];

      // Skip bye match if one team is dummy null
      if (!teamAId || !teamBId) {
        continue;
      }

      const matchDate = new Date(baseDate);
      matchDate.setDate(baseDate.getDate() + round * 3 + Math.floor(match / 2));

      matchesToInsert.push({
        tournament: tournamentId,
        round: roundNumber,
        roundName,
        matchNumber: matchNumber++,
        teamA: { team: teamAId, score: 0 },
        teamB: { team: teamBId, score: 0 },
        status: "scheduled",
        venue,
        scheduledDate: matchDate,
      });
    }
  }

  const savedMatches = await Match.insertMany(matchesToInsert);
  return savedMatches;
}
