// ============================================================
// LEAGUES DATA
// ============================================================
import { TEAMS } from "./teams.js";

export const LEAGUES = [
  {
    id: 1,
    name: "Global Super League",
    country: "Thế giới",
    season: "2025–2026",
    teams: TEAMS.map((t) => t.id),
    rounds: 38,
    currentRound: 1,
    matchDay: [],
    table: [],
  },
];

// Generate a round-robin schedule
export function generateSchedule(teamIds) {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push(null); // Bye
  const numRounds = teams.length - 1;
  const rounds = [];

  for (let round = 0; round < numRounds; round++) {
    const matches = [];
    for (let i = 0; i < teams.length / 2; i++) {
      const home = teams[i];
      const away = teams[teams.length - 1 - i];
      if (home !== null && away !== null) {
        matches.push({ home, away, played: false, homeGoals: null, awayGoals: null });
      }
    }
    rounds.push(matches);
    // Rotate
    teams.splice(1, 0, teams.pop());
  }

  // Return (home + away)
  const allRounds = [...rounds];
  rounds.forEach((r) => {
    allRounds.push(r.map((m) => ({ ...m, home: m.away, away: m.home })));
  });

  return allRounds;
}

export function initLeagueTable(teamIds) {
  return teamIds.map((id) => ({
    teamId: id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  }));
}

export function sortTable(table) {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}
