// ============================================================
// GAME STATE – Singleton global state manager
// ============================================================
import { TEAMS } from "../data/teams.js";
import { PLAYERS } from "../data/players.js";
import { LEAGUES, generateSchedule, initLeagueTable, sortTable } from "../data/leagues.js";

class GameState {
  constructor() {
    this.initialized = false;
    this.coach = null;          // { name, nationality, reputation }
    this.playerTeamId = null;   // Team the user manages
    this.season = 1;
    this.week = 1;
    this.date = new Date(2025, 0, 15); // Jan 15, 2025
    this.teams = JSON.parse(JSON.stringify(TEAMS));
    this.players = JSON.parse(JSON.stringify(PLAYERS));
    this.leagues = JSON.parse(JSON.stringify(LEAGUES));
    this.schedule = [];
    this.leagueTable = [];
    this.finance = {};
    this.news = [];
    this.notifications = [];
    this.selectedFormation = "4-4-2";
    this.lineup = [];           // Array of player ids
    this.tactics = {
      mentality: "balanced",    // attacking, balanced, defensive
      pressing: "medium",
      tempo: "medium",
      width: "medium",
      setpieces: "default",
    };
    this.negotiations = [];     // Active negotiations
    this._listeners = {};
  }

  // ---- Initialization ----
  init(coachName, teamId) {
    this.coach = { name: coachName, nationality: "VN", reputation: 50 };
    this.playerTeamId = teamId;
    this.negotiations = []; // Clear on new game
    const team = this.getMyTeam();

    // Setup finance
    this.finance[teamId] = {
      balance: team.budget,
      weeklyWage: team.wage,
      income: { matchday: 0, sponsorship: 50000, prize: 0 },
      expenses: { wages: 0, transfers: 0, facilities: 0 },
      history: [],
    };

    // Generate schedule
    const teamIds = this.leagues[0].teams;
    this.schedule = generateSchedule(teamIds);
    this.leagueTable = initLeagueTable(teamIds);

    // Default lineup: first 11 players of team
    const myPlayers = this.players.filter((p) => p.teamId === teamId);
    this.lineup = myPlayers.slice(0, 11).map((p) => p.id);

    this.initialized = true;
    this.addNews("🎉 Chào mừng bạn trở thành HLV mới!", `Bạn đã được bổ nhiệm làm huấn luyện viên trưởng của ${team.name}.`);
    this.emit("stateChanged");
  }

  // ---- Getters ----
  getMyTeam() {
    return this.teams.find((t) => t.id === this.playerTeamId);
  }

  getMyPlayers() {
    return this.players.filter((p) => p.teamId === this.playerTeamId);
  }

  getTeamById(id) {
    return this.teams.find((t) => t.id === id);
  }

  getPlayerById(id) {
    return this.players.find((p) => p.id === id);
  }

  getMyFinance() {
    return this.finance[this.playerTeamId];
  }

  getMySchedule() {
    return this.schedule.map((round, idx) => ({
      round: idx + 1,
      matches: round.filter(
        (m) => m.home === this.playerTeamId || m.away === this.playerTeamId
      ),
    })).filter((r) => r.matches.length > 0);
  }

  getSortedTable() {
    return sortTable(this.leagueTable);
  }

  getMyTableEntry() {
    return this.leagueTable.find((e) => e.teamId === this.playerTeamId);
  }

  getNextMatch() {
    for (const round of this.schedule) {
      for (const match of round) {
        if (!match.played && (match.home === this.playerTeamId || match.away === this.playerTeamId)) {
          return match;
        }
      }
    }
    return null;
  }

  // ---- Mutations ----
  addNews(title, body) {
    this.news.unshift({
      id: Date.now(),
      title,
      body,
      date: this.getFormattedDate(),
      read: false,
    });
    this.emit("stateChanged");
  }

  addNotification(msg, type = "info") {
    this.notifications.push({ id: Date.now(), msg, type });
    this.emit("notification", { msg, type });
    setTimeout(() => {
      this.notifications = this.notifications.filter((n) => n.id !== Date.now());
    }, 3000);
  }

  advanceWeek() {
    this.week++;
    this.date.setDate(this.date.getDate() + 7);

    // Weekly finance
    const fin = this.getMyFinance();
    const wages = this.getMyPlayers().reduce((sum, p) => sum + p.wage, 0);
    fin.balance += fin.income.sponsorship - wages;
    fin.history.push({ week: this.week, balance: fin.balance });
    fin.expenses.wages += wages;

    // Player fitness recovery
    this.players.forEach((p) => {
      if (p.fitness < 100) p.fitness = Math.min(100, p.fitness + 15);
      if (p.injured) {
        p.injuryDays -= 7;
        if (p.injuryDays <= 0) {
          p.injured = false;
          p.injuryDays = 0;
          if (p.teamId === this.playerTeamId) {
            this.addNews("✅ Cầu thủ bình phục chấn thương", `${p.name} đã trở lại tập luyện bình thường.`);
          }
        }
      }
    });

    // AI Transfer Offers for my players
    if (Math.random() < 0.2) {
      const myPlayers = this.getMyPlayers();
      const p = myPlayers[Math.floor(Math.random() * myPlayers.length)];
      if (p && !p.injured) {
        const otherTeams = this.teams.filter(t => t.id !== this.playerTeamId);
        const buyingTeam = otherTeams[Math.floor(Math.random() * otherTeams.length)];
        const offerFee = Math.round(p.value * (0.8 + Math.random() * 0.4));
        
        this.addNews("📩 Đề nghị chuyển nhượng", `${buyingTeam.name} muốn mua ${p.name} với giá ${formatCurrency(offerFee)}. Bạn có thể bán cầu thủ này trong màn hình Đội Hình.`);
      }
    }

    this.emit("stateChanged");
  }

  updateLineup(newLineup) {
    this.lineup = newLineup;
    this.emit("stateChanged");
  }

  updateTactics(tactics) {
    this.tactics = { ...this.tactics, ...tactics };
    this.emit("stateChanged");
  }

  updatePlayerNumber(playerId, newNumber) {
    const p = this.getPlayerById(playerId);
    if (p) {
      p.number = parseInt(newNumber);
      this.emit("stateChanged");
    }
  }

  // ---- Mutations ----
  startNegotiation(playerId) {
    const existing = this.negotiations.find(n => n.playerId === playerId);
    if (existing) return existing;

    const player = this.getPlayerById(playerId);
    const team = this.getTeamById(player.teamId);
    
    // Initial AI demands
    const demands = {
      fee: Math.round(player.value * (1.1 + Math.random() * 0.4)),
      wage: Math.round(player.wage * (1.05 + Math.random() * 0.2)),
      role: player.overall > 85 ? "Key" : player.overall > 80 ? "First Team" : "Rotation"
    };

    const neg = {
      id: Date.now(),
      playerId,
      player,
      team,
      phase: "transfer", // "transfer" | "contract" | "completed"
      currentFeeOffer: 0,
      currentWageOffer: 0,
      currentRoleOffer: "",
      aiDemands: demands,
      status: "ongoing", // "ongoing" | "accepted" | "rejected"
      history: []
    };

    this.negotiations.push(neg);
    this.emit("stateChanged");
    return neg;
  }

  processTransferOffer(neg, offerFee) {
    neg.currentFeeOffer = offerFee;
    const minAccept = neg.aiDemands.fee * 0.9;
    
    if (offerFee >= neg.aiDemands.fee) {
      neg.phase = "contract";
      neg.history.push({ type: "success", msg: "Câu lạc bộ chủ quản đã chấp nhận mức phí!" });
    } else if (offerFee >= minAccept) {
      // Small gap, maybe they accept or counter
      if (Math.random() > 0.5) {
        neg.phase = "contract";
        neg.history.push({ type: "success", msg: "Sau một hồi thương thảo, họ đã đồng ý bán!" });
      } else {
        neg.aiDemands.fee = Math.round((neg.aiDemands.fee + offerFee) / 2);
        neg.history.push({ type: "counter", msg: `Họ muốn ít nhất ${formatCurrency(neg.aiDemands.fee)}.` });
      }
    } else {
      neg.history.push({ type: "error", msg: "Mức giá quá thấp, họ đã từ chối thẳng thừng!" });
      if (Math.random() > 0.7) neg.status = "rejected";
    }
  }

  processContractOffer(neg, wage, role) {
    neg.currentWageOffer = wage;
    neg.currentRoleOffer = role;
    
    const minWage = neg.aiDemands.wage * 0.95;
    const roleMatch = neg.aiDemands.role === role || (neg.aiDemands.role === "First Team" && role === "Key");

    if (wage >= neg.aiDemands.wage && roleMatch) {
      neg.status = "accepted";
      this.completeNegotiation(neg, wage);
    } else if (wage >= minWage) {
      if (Math.random() > 0.5 && roleMatch) {
        neg.status = "accepted";
        this.completeNegotiation(neg, wage);
      } else {
        neg.aiDemands.wage = Math.round((neg.aiDemands.wage + wage) / 2);
        neg.history.push({ type: "counter", msg: `${neg.player.name} muốn mức lương ${formatCurrency(neg.aiDemands.wage)} và vai trò ${neg.aiDemands.role}.` });
      }
    } else {
      neg.history.push({ type: "error", msg: "Cầu thủ cảm thấy không được tôn trọng với mức đãi ngộ này!" });
    }
  }

  completeNegotiation(neg, wage) {
    const isRenewal = neg.player.teamId === this.playerTeamId;
    if (isRenewal) {
      neg.player.wage = wage;
      this.addNews("📝 Gia hạn hợp đồng", `${neg.player.name} đã ký hợp đồng mới với mức lương ${formatCurrency(wage)}.`);
    } else {
      this.buyPlayer(neg.playerId, neg.currentFeeOffer, wage);
    }
    this.emit("stateChanged");
  }

  buyPlayer(playerId, fee, finalWage = null) {
    const player = this.getPlayerById(playerId);
    const fin = this.getMyFinance();
    if (!player || fin.balance < fee) return false;
    
    fin.balance -= fee;
    fin.expenses.transfers += fee;
    player.teamId = this.playerTeamId;
    if (finalWage) player.wage = finalWage;
    
    this.addNews("📋 Chuyển nhượng thành công", `${player.name} đã gia nhập đội!`);
    this.emit("stateChanged");
    return true;
  }

  sellPlayer(playerId, fee) {
    const player = this.getPlayerById(playerId);
    const fin = this.getMyFinance();
    if (!player) return false;
    fin.balance += fee;
    fin.income.transfers = (fin.income.transfers || 0) + fee;
    player.teamId = null;
    this.lineup = this.lineup.filter((id) => id !== playerId);
    this.addNews("💰 Bán cầu thủ", `${player.name} đã rời đội với phí ${formatCurrency(fee)}.`);
    this.emit("stateChanged");
    return true;
  }

  updateMatchResult(match, homeGoals, awayGoals) {
    match.played = true;
    match.homeGoals = homeGoals;
    match.awayGoals = awayGoals;

    const homeEntry = this.leagueTable.find((e) => e.teamId === match.home);
    const awayEntry = this.leagueTable.find((e) => e.teamId === match.away);

    [homeEntry, awayEntry].forEach((e) => {
      if (e) e.played++;
    });

    homeEntry.gf += homeGoals;
    homeEntry.ga += awayGoals;
    awayEntry.gf += awayGoals;
    awayEntry.ga += homeGoals;
    homeEntry.gd = homeEntry.gf - homeEntry.ga;
    awayEntry.gd = awayEntry.gf - awayEntry.ga;

    if (homeGoals > awayGoals) {
      homeEntry.won++;
      homeEntry.points += 3;
      awayEntry.lost++;
    } else if (homeGoals < awayGoals) {
      awayEntry.won++;
      awayEntry.points += 3;
      homeEntry.lost++;
    } else {
      homeEntry.drawn++;
      awayEntry.drawn++;
      homeEntry.points++;
      awayEntry.points++;
    }

    this.emit("stateChanged");
  }

  // ---- Event system ----
  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  off(event, cb) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter((f) => f !== cb);
    }
  }

  emit(event, data) {
    (this._listeners[event] || []).forEach((cb) => cb(data));
  }

  // ---- Helpers ----
  getFormattedDate() {
    return new Date(this.date).toLocaleDateString("vi-VN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  }

  // ---- Save/Load System ----
  saveGame() {
    const saveData = {
      initialized: this.initialized,
      coach: this.coach,
      playerTeamId: this.playerTeamId,
      season: this.season,
      week: this.week,
      date: this.date.toISOString(),
      teams: this.teams,
      players: this.players,
      leagues: this.leagues,
      schedule: this.schedule,
      leagueTable: this.leagueTable,
      finance: this.finance,
      news: this.news,
      selectedFormation: this.selectedFormation,
      lineup: this.lineup,
      tactics: this.tactics,
    };
    try {
      localStorage.setItem("fm26_save", JSON.stringify(saveData));
      this.addNotification("💾 Đã lưu game thành công!", "success");
      return true;
    } catch (e) {
      console.error("Save failed", e);
      this.addNotification("❌ Lỗi khi lưu game!", "error");
      return false;
    }
  }

  loadGame() {
    try {
      const dataStr = localStorage.getItem("fm26_save");
      if (!dataStr) return false;
      
      const data = JSON.parse(dataStr);
      this.initialized = data.initialized;
      this.coach = data.coach;
      this.playerTeamId = data.playerTeamId;
      this.season = data.season;
      this.week = data.week;
      this.date = new Date(data.date);
      this.teams = data.teams;
      this.players = data.players;
      this.leagues = data.leagues;
      this.schedule = data.schedule;
      this.leagueTable = data.leagueTable;
      this.finance = data.finance;
      this.news = data.news || [];
      this.selectedFormation = data.selectedFormation;
      this.lineup = data.lineup;
      this.tactics = data.tactics;
      this.negotiations = [];
      this.notifications = [];
      
      this.emit("stateChanged");
      return true;
    } catch (e) {
      console.error("Load failed", e);
      return false;
    }
  }

  static hasSave() {
    return !!localStorage.getItem("fm26_save");
  }
}

export function formatCurrency(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

export const gameState = new GameState();
