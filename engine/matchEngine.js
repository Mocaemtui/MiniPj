// ============================================================
// MATCH ENGINE – Simulates a 90-minute football match
// ============================================================
import { gameState } from "./gameState.js";

const FORMATIONS = {
  "4-4-2":  { GK:1, CB:2, LB:1, RB:1, CM:2, LM:1, RM:1, ST:2 },
  "4-3-3":  { GK:1, CB:2, LB:1, RB:1, CM:3, LW:1, RW:1, ST:1 },
  "3-5-2":  { GK:1, CB:3, LB:1, RB:1, CM:3, ST:2 },
  "4-2-3-1":{ GK:1, CB:2, LB:1, RB:1, CDM:2, CAM:1, LW:1, RW:1, ST:1 },
  "5-3-2":  { GK:1, CB:3, LB:1, RB:1, CM:3, ST:2 },
};

export class MatchEngine {
  constructor(homeTeamId, awayTeamId) {
    this.homeTeamId = homeTeamId;
    this.awayTeamId = awayTeamId;
    this.homeScore = 0;
    this.awayScore = 0;
    this.minute = 0;
    this.events = [];       // { minute, type, teamId, playerId, text }
    this.commentary = [];
    this.stats = {
      home: { shots: 0, shotsOnTarget: 0, possession: 50, fouls: 0, corners: 0, yellowCards: 0, redCards: 0, passes: 0, passAccuracy: 0, tackles: 0, saves: 0, xG: 0.0 },
      away: { shots: 0, shotsOnTarget: 0, possession: 50, fouls: 0, corners: 0, yellowCards: 0, redCards: 0, passes: 0, passAccuracy: 0, tackles: 0, saves: 0, xG: 0.0 },
    };
    this._running = false;
    this._intervalId = null;
    this.onEvent = null;   // Callback for live updates
    this.onFinish = null;  // Callback when match ends
  }

  // ---- Team metrics calculation ----
  _calcMetrics(teamId) {
    const isPlayerTeam = teamId === gameState.playerTeamId;
    let players;

    if (isPlayerTeam) {
      players = gameState.lineup
        .map((id) => gameState.getPlayerById(id))
        .filter(Boolean);
    } else {
      players = gameState.players
        .filter((p) => p.teamId === teamId && !p.injured)
        .slice(0, 11);
    }

    if (!players.length) return { attack: 60, midfield: 60, defense: 60, goalkeeping: 60 };

    const gks = players.filter(p => p.pos === "GK");
    const gk = gks.length ? gks[0] : players[0];

    const defs = players.filter(p => ["CB", "LB", "RB"].includes(p.pos));
    const mids = players.filter(p => ["CM", "CAM", "CDM", "LM", "RM"].includes(p.pos));
    const atts = players.filter(p => ["ST", "LW", "RW"].includes(p.pos));

    const avg = (arr, cat, attr) => arr.length 
      ? arr.reduce((sum, p) => sum + p.attributes[cat][attr], 0) / arr.length 
      : 60;

    let attackStr = avg(atts.length ? atts : players, "technical", "finishing") * 0.5 + avg(atts.length ? atts : players, "physical", "pace") * 0.3 + avg(atts.length ? atts : players, "mental", "positioning") * 0.2;
    let midfieldStr = avg(mids.length ? mids : players, "technical", "passing") * 0.4 + avg(mids.length ? mids : players, "mental", "vision") * 0.4 + avg(mids.length ? mids : players, "mental", "decisions") * 0.2;
    let defenseStr = avg(defs.length ? defs : players, "technical", "tackling") * 0.5 + avg(defs.length ? defs : players, "mental", "positioning") * 0.3 + avg(defs.length ? defs : players, "physical", "strength") * 0.2;
    
    let gkStr = 60;
    if (gk.attributes.technical) {
      gkStr = (gk.attributes.technical.diving + gk.attributes.technical.reflexes + gk.attributes.mental.positioning) / 3;
    }

    // Apply fitness & morale
    const fitnessMod = players.reduce((sum, p) => sum + p.fitness, 0) / players.length / 100;
    const moraleMod = players.reduce((sum, p) => sum + p.morale, 0) / players.length / 100;

    return { 
      attack: attackStr * fitnessMod * moraleMod, 
      midfield: midfieldStr * fitnessMod * moraleMod, 
      defense: defenseStr * fitnessMod * moraleMod, 
      goalkeeping: gkStr * fitnessMod * moraleMod 
    };
  }

  // ---- Simulate single minute ----
  _simulateMinute() {
    this.minute++;

    if (!this.homeMetrics) {
      this.homeMetrics = this._calcMetrics(this.homeTeamId);
      this.awayMetrics = this._calcMetrics(this.awayTeamId);
      this.homeTotalStats = { successfulPasses: 0, totalPasses: 0 };
      this.awayTotalStats = { successfulPasses: 0, totalPasses: 0 };
    }

    const home = this.homeMetrics;
    const away = this.awayMetrics;
    const totalMidfield = home.midfield + away.midfield;

    // Possession
    this.stats.home.possession = Math.round((home.midfield / totalMidfield) * 100);
    this.stats.away.possession = 100 - this.stats.home.possession;

    // Passing
    const homePassesAttempted = Math.floor((home.midfield / 10) + Math.random() * 5);
    const awayPassesAttempted = Math.floor((away.midfield / 10) + Math.random() * 5);
    
    this.homeTotalStats.totalPasses += homePassesAttempted;
    this.awayTotalStats.totalPasses += awayPassesAttempted;
    
    const homePassAcc = Math.min(0.95, (home.midfield / 100) * 0.9 + Math.random() * 0.1);
    const awayPassAcc = Math.min(0.95, (away.midfield / 100) * 0.9 + Math.random() * 0.1);

    this.homeTotalStats.successfulPasses += Math.floor(homePassesAttempted * homePassAcc);
    this.awayTotalStats.successfulPasses += Math.floor(awayPassesAttempted * awayPassAcc);

    this.stats.home.passes = this.homeTotalStats.totalPasses;
    this.stats.away.passes = this.awayTotalStats.totalPasses;
    this.stats.home.passAccuracy = Math.round((this.homeTotalStats.successfulPasses / this.homeTotalStats.totalPasses) * 100) || 0;
    this.stats.away.passAccuracy = Math.round((this.awayTotalStats.successfulPasses / this.awayTotalStats.totalPasses) * 100) || 0;

    // Tackles
    if (Math.random() < (home.defense / 100) * 0.1) this.stats.home.tackles++;
    if (Math.random() < (away.defense / 100) * 0.1) this.stats.away.tackles++;

    // Random events
    const rand = Math.random();
    const homeProb = home.attack / (home.attack + away.attack);

    // Shot / Attack Event
    if (rand < 0.08) {
      const isHome = Math.random() < homeProb;
      const side = isHome ? "home" : "away";
      const oppSide = isHome ? "away" : "home";
      const teamId = isHome ? this.homeTeamId : this.awayTeamId;
      const oppTeamId = isHome ? this.awayTeamId : this.homeTeamId;
      
      const attacker = this._randomPlayer(teamId, ["ST", "LW", "RW", "CAM", "CM"]);
      const defender = this._randomPlayer(oppTeamId, ["CB", "LB", "RB", "CDM"]);
      const gk = this._randomPlayer(oppTeamId, ["GK"]);
      const assist = this._randomPlayer(teamId, ["CAM", "CM", "LW", "RW", "RM", "LM", "LB", "RB"], attacker?.id);

      if (attacker && defender && gk) {
        // Duel 1: Attacker Dribbling/Pace vs Defender Tackling/Strength
        const attScore = (attacker.attributes.technical.dribbling + attacker.attributes.physical.pace + attacker.attributes.physical.acceleration) / 3;
        const defScore = (defender.attributes.technical.tackling + defender.attributes.physical.strength + defender.attributes.mental.positioning) / 3;
        const duelWin = attScore + Math.random() * 25 > defScore + Math.random() * 25;

        if (duelWin) {
          // Attacker wins the duel!
          let duelText = `${attacker.name} vượt qua ${defender.name} nhờ kỹ thuật và tốc độ (Drib ${attacker.attributes.technical.dribbling})!`;
          if (attacker.attributes.physical.pace > defender.attributes.physical.pace + 5) {
            duelText = `${attacker.name} bứt tốc kinh hoàng bỏ lại ${defender.name} nhờ tốc độ ${attacker.attributes.physical.pace}!`;
          }
          if (assist) duelText = `Đường chuyền sắc lẹm (Vis ${assist.attributes.mental.vision}) của ${assist.name}. ${duelText}`;

          this.stats[side].shots++;
          
          // Duel 2: Attacker Finishing vs GK Reflexes/Diving
          const shotScore = attacker.attributes.technical.finishing;
          const saveScore = (gk.attributes.technical.diving + gk.attributes.technical.reflexes) / 2;
          const xG = Math.min(0.9, Math.max(0.05, (shotScore - saveScore + 20) / 100));
          this.stats[side].xG += xG;

          // On Target check
          if (Math.random() * 100 < shotScore + 25) {
            this.stats[side].shotsOnTarget++;
            
            // Goal check
            if (Math.random() < xG) {
              if (isHome) this.homeScore++;
              else this.awayScore++;

              const event = {
                minute: this.minute,
                type: "goal",
                teamId,
                playerId: attacker.id,
                assistId: assist?.id,
                text: `⚽ VÀOOOOO! ${duelText} Cú sút búa bổ (Fin ${shotScore}) hạ gục ${gk.name}!`
              };
              this.events.push(event);
              attacker.goals++;
              if (assist) assist.assists++;
              if (this.onEvent) this.onEvent(event, this.homeScore, this.awayScore);
            } else {
              this.stats[oppSide].saves++;
              const event = { 
                minute: this.minute, 
                type: "save", 
                teamId, 
                text: `🧤 ${duelText} Nhưng ${gk.name} bay người cản phá khó tin (Ref ${gk.attributes.technical.reflexes})!` 
              };
              this.events.push(event);
              if (this.onEvent) this.onEvent(event, this.homeScore, this.awayScore);
            }
          } else {
            const event = { 
              minute: this.minute, 
              type: "miss", 
              teamId, 
              text: `❌ ${duelText} Đáng tiếc cú dứt điểm lại đi ra ngoài!` 
            };
            if (Math.random() > 0.5) {
              this.events.push(event);
              if (this.onEvent) this.onEvent(event, this.homeScore, this.awayScore);
            }
          }
        } else {
          // Defender wins the duel
          this.stats[side].tackles++;
          if (Math.random() > 0.7) {
            let defText = `🛡 ${defender.name} (Tac ${defender.attributes.technical.tackling}) tắc bóng chuẩn xác chặn đứng ${attacker.name}.`;
            if (defender.attributes.physical.strength > attacker.attributes.physical.strength + 5) {
              defText = `💪 ${defender.name} dùng sức mạnh (Str ${defender.attributes.physical.strength}) tì đè cướp bóng từ ${attacker.name}.`;
            }
            const event = { minute: this.minute, type: "tackle", teamId, text: defText };
            this.events.push(event);
            if (this.onEvent) this.onEvent(event, this.homeScore, this.awayScore);
          }
        }
      }
    }

    // Foul / yellow card
    if (rand > 0.95) {
      const isHome = Math.random() < homeProb;
      const side = isHome ? "home" : "away";
      const oppTeamId = isHome ? this.awayTeamId : this.homeTeamId;
      const defender = this._randomPlayer(oppTeamId, ["CB", "LB", "RB", "CDM", "CM"]);
      
      this.stats[side].fouls++;
      if (Math.random() < 0.25 && defender) {
        this.stats[side].yellowCards++;
        const event = { minute: this.minute, type: "yellow", teamId: oppTeamId, text: `🟨 ${defender.name} nhận thẻ vàng vì pha phạm lỗi nguy hiểm.` };
        this.events.push(event);
        if (this.onEvent) this.onEvent(event, this.homeScore, this.awayScore);
      }
    }

    // Corner
    if (rand > 0.93 && rand < 0.95) {
      const isHome = Math.random() < homeProb;
      this.stats[isHome ? "home" : "away"].corners++;
    }
  }

  _randomPlayer(teamId, preferredPos, excludeId = null) {
    const isPlayerTeam = teamId === gameState.playerTeamId;
    let pool = isPlayerTeam 
      ? gameState.lineup.map((id) => gameState.getPlayerById(id)).filter(Boolean)
      : gameState.players.filter((p) => p.teamId === teamId && !p.injured).slice(0, 11);
    
    if (excludeId) pool = pool.filter(p => p.id !== excludeId);
    
    const candidates = pool.sort((a, b) => (preferredPos.includes(b.pos) ? 1 : 0) - (preferredPos.includes(a.pos) ? 1 : 0));
    return candidates[Math.floor(Math.random() * Math.min(3, candidates.length))] || pool[0];
  }

  // ---- Run full simulation instantly ----
  simulateFull() {
    for (let m = 1; m <= 90; m++) {
      this.minute = m - 1;
      this._simulateMinute();
    }
    // Add stoppage time (1-5 min)
    const stoppage = Math.floor(Math.random() * 5) + 1;
    for (let s = 0; s < stoppage; s++) this._simulateMinute();
    this._finish();
    
    // Round xG for final result
    this.stats.home.xG = parseFloat(this.stats.home.xG.toFixed(2));
    this.stats.away.xG = parseFloat(this.stats.away.xG.toFixed(2));
    
    return { homeScore: this.homeScore, awayScore: this.awayScore, events: this.events, stats: this.stats };
  }

  // ---- Run live (minute by minute with interval) ----
  simulateLive(speedMs = 800) {
    this._running = true;
    this._intervalId = setInterval(() => {
      if (!this._running) return;
      this._simulateMinute();

      // Half time
      if (this.minute === 45) {
        const htEvent = { minute: 45, type: "halftime", text: "🔔 HIỆP MỘT KẾT THÚC" };
        this.events.push(htEvent);
        if (this.onEvent) this.onEvent(htEvent, this.homeScore, this.awayScore);
      }

      if (this.minute >= 90) {
        clearInterval(this._intervalId);
        this._finish();
      }
    }, speedMs);
  }

  stop() {
    this._running = false;
    if (this._intervalId) clearInterval(this._intervalId);
  }

  _finish() {
    const match = this._findMatch();
    if (match) gameState.updateMatchResult(match, this.homeScore, this.awayScore);

    const result = this.homeTeamId === gameState.playerTeamId
      ? (this.homeScore > this.awayScore ? "win" : this.homeScore < this.awayScore ? "loss" : "draw")
      : (this.awayScore > this.homeScore ? "win" : this.awayScore < this.homeScore ? "loss" : "draw");

    const homeTeam = gameState.getTeamById(this.homeTeamId);
    const awayTeam = gameState.getTeamById(this.awayTeamId);
    const resultText = `${homeTeam?.name || "?"} ${this.homeScore} – ${this.awayScore} ${awayTeam?.name || "?"}`;

    const emoji = result === "win" ? "🏆" : result === "loss" ? "💔" : "🤝";
    gameState.addNews(`${emoji} Kết quả trận đấu`, resultText);

    // Update player appearances & fitness
    gameState.lineup.forEach((id) => {
      const p = gameState.getPlayerById(id);
      if (p) {
        p.appearances++;
        p.fitness = Math.max(40, p.fitness - Math.floor(Math.random() * 20) - 10);
        // Chance of injury
        if (Math.random() < 0.05 && !p.injured) {
          p.injured = true;
          p.injuryDays = Math.floor(Math.random() * 28) + 7;
          gameState.addNews("🚑 Chấn thương", `${p.name} bị chấn thương và sẽ vắng mặt ${p.injuryDays} ngày.`);
        }
      }
    });

    if (this.onFinish) {
      this.onFinish({ homeScore: this.homeScore, awayScore: this.awayScore, events: this.events, stats: this.stats, result });
    }
  }

  _findMatch() {
    for (const round of gameState.schedule) {
      for (const m of round) {
        if (!m.played && m.home === this.homeTeamId && m.away === this.awayTeamId) return m;
      }
    }
    return null;
  }
}
