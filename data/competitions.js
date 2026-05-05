// COMPETITIONS - Cup, Champions League, Europa League
export const COMPETITION_TYPES = {
  DOMESTIC_CUP: 'domestic_cup',
  CHAMPIONS_LEAGUE: 'champions_league',
  EUROPA_LEAGUE: 'europa_league'
};

export const COMPETITIONS = [
  {
    id: 'vn_cup',
    name: 'Cúp Quốc gia Vietnam',
    type: COMPETITION_TYPES.DOMESTIC_CUP,
    prize_money: { winner: 500000, runner_up: 250000, semi: 100000 },
    rounds: [
      { name: 'Vòng 1/16', teams: 16, legs: 1 },
      { name: 'Tứ kết', teams: 8, legs: 1 },
      { name: 'Bán kết', teams: 4, legs: 2 },
      { name: 'Chung kết', teams: 2, legs: 1 }
    ],
    start_month: 3, end_month: 9
  },
  {
    id: 'afc_champions',
    name: 'AFC Champions League',
    type: COMPETITION_TYPES.CHAMPIONS_LEAGUE,
    prize_money: { winner: 5000000, runner_up: 2500000, group_stage: 200000 },
    group_stage: { groups: 8, teams_per_group: 4, advance: 2 },
    rounds: [
      { name: 'Vòng 1/8', teams: 16, legs: 2 },
      { name: 'Tứ kết', teams: 8, legs: 2 },
      { name: 'Bán kết', teams: 4, legs: 2 },
      { name: 'Chung kết', teams: 2, legs: 1 }
    ],
    start_month: 2, end_month: 11
  }
];

export class CompetitionManager {
  constructor(gameState) {
    this.gs = gameState;
    this.activeCompetitions = new Map();
    this.fixtures = [];
    this.currentRound = new Map();
  }

  initializeSeason() {
    this.activeCompetitions.clear();
    COMPETITIONS.forEach(comp => {
      if (this._shouldInclude(comp)) {
        this.activeCompetitions.set(comp.id, {
          ...comp,
          status: 'upcoming',
          participants: [],
          currentRound: 0
        });
      }
    });
    return this.activeCompetitions.size;
  }

  _shouldInclude(comp) {
    return true; // Simplified
  }

  setupParticipants(compId) {
    const comp = this.activeCompetitions.get(compId);
    if (!comp) return;

    const allTeams = this.gs.teams;
    if (comp.type === COMPETITION_TYPES.DOMESTIC_CUP) {
      comp.participants = [...allTeams];
    }
  }

  generateFixtures(compId) {
    const comp = this.activeCompetitions.get(compId);
    if (!comp || comp.participants.length === 0) return;

    const round = comp.rounds[comp.currentRound];
    const fixtures = [];

    for (let i = 0; i < round.teams; i += 2) {
      const home = comp.participants[i];
      const away = comp.participants[i + 1];
      if (home && away) {
        fixtures.push({
          competitionId: compId,
          round: comp.currentRound,
          leg: 1,
          homeTeamId: home.id || home,
          awayTeamId: away.id || away,
          played: false
        });
      }
    }

    this.fixtures.push(...fixtures);
    return fixtures;
  }

  simulateRound(compId) {
    const comp = this.activeCompetitions.get(compId);
    if (!comp) return;

    const roundFixtures = this.fixtures.filter(f => 
      f.competitionId === compId && f.round === comp.currentRound && !f.played
    );

    const winners = [];
    roundFixtures.forEach(fixture => {
      const homeTeam = this.gs.getTeamById(fixture.homeTeamId);
      const awayTeam = this.gs.getTeamById(fixture.awayTeamId);
      
      // Simple simulation
      const homeWin = Math.random() > 0.5;
      const winner = homeWin ? fixture.homeTeamId : fixture.awayTeamId;
      winners.push(winner);

      fixture.played = true;
      fixture.homeScore = Math.floor(Math.random() * 4);
      fixture.awayScore = Math.floor(Math.random() * 4);
    });

    // Advance winners to next round
    comp.participants = winners.map(id => this.gs.getTeamById(id)).filter(Boolean);
    comp.currentRound++;

    if (comp.currentRound >= comp.rounds.length) {
      comp.status = 'completed';
      comp.winner = winners[0];
    }

    return { fixtures: roundFixtures, winners };
  }

  getActiveCompetitions() {
    return Array.from(this.activeCompetitions.values())
      .filter(c => c.status !== 'completed');
  }

  getFixturesForDate(date) {
    return this.fixtures.filter(f => {
      const fixtureDate = new Date(f.date);
      return fixtureDate.toDateString() === date.toDateString() && !f.played;
    });
  }
}

export default CompetitionManager;
