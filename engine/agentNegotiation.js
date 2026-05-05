// ============================================================
// AGENT NEGOTIATION - Contract Talks with Player Representatives
// Wage structure, loyalty bonuses, release clauses
// ============================================================

import { 
  ContractNegotiation, 
  Agent, 
  SQUAD_STATUS,
  NEGOTIATION_PHASE 
} from '../data/transferSystem.js';

export class AgentNegotiationManager {
  constructor(gameState) {
    this.gs = gameState;
    this.activeNegotiations = new Map(); // playerId -> ContractNegotiation
    this.meetingHistory = []; // All meetings across time
    
    // Wage structure enforcement
    this.wageStructure = {
      star: { min: 200000, max: 500000 },
      key: { min: 120000, max: 200000 },
      firstTeam: { min: 70000, max: 120000 },
      rotation: { min: 40000, max: 70000 },
      prospect: { min: 20000, max: 40000 }
    };
    
    // Disruption tracking
    this.structureDisruptions = []; // Track when we break wage structure
  }

  // Start contract negotiation with a player
  startNegotiation(playerId, context = {}) {
    const player = this.gs.getPlayerById(playerId);
    if (!player) return null;
    
    // Check if negotiation already active
    if (this.activeNegotiations.has(playerId)) {
      return {
        success: false,
        message: 'Đang có đàm phán hoạt động với cầu thủ này.',
        negotiation: this.activeNegotiations.get(playerId)
      };
    }
    
    // Create negotiation instance
    const negotiation = new ContractNegotiation({
      playerId,
      clubId: this.gs.playerTeamId,
      currentWage: player.wage || 50000,
      agent: this._createAgentForPlayer(player)
    });
    
    // Calculate demands
    negotiation.calculatePlayerDemands(player, this.gs.getTeamById(this.gs.playerTeamId));
    
    this.activeNegotiations.set(playerId, negotiation);
    
    return {
      success: true,
      negotiation,
      initialDemands: negotiation.playerDemands,
      message: `Bắt đầu đàm phán với đại diện của ${player.name}.`
    };
  }

  // Conduct a meeting with agent
  conductMeeting(playerId, proposedTerms) {
    const negotiation = this.activeNegotiations.get(playerId);
    if (!negotiation) return null;
    
    const player = this.gs.getPlayerById(playerId);
    const club = this.gs.getTeamById(this.gs.playerTeamId);
    
    // Check wage structure disruption
    const structureCheck = this._checkWageStructure(proposedTerms, player, club);
    
    // Agent evaluates
    const agentReaction = negotiation.agent.evaluateOffer(
      proposedTerms, 
      negotiation.playerDemands
    );
    
    let result = {
      playerId,
      meetingNumber: negotiation.meetings.length + 1,
      proposedTerms,
      agentReaction,
      structureImpact: structureCheck,
      timestamp: new Date()
    };
    
    switch (agentReaction) {
      case 'accepted':
        result.outcome = 'ACCEPTED';
        result.message = `Đại diện chấp nhận điều khoản cho ${player.name}!`;
        result.finalTerms = proposedTerms;
        negotiation.acceptTerms(proposedTerms);
        this._finalizeContract(negotiation);
        break;
        
      case 'rejected':
        result.outcome = 'REJECTED';
        result.message = `Đại diện từ chối thẳng thừng. ${player.name} không hài lòng.`;
        result.playerMoraleImpact = -15;
        player.morale = Math.max(0, (player.morale || 70) - 15);
        this.activeNegotiations.delete(playerId);
        break;
        
      case 'counter':
        const counter = negotiation.agent.generateCounter(negotiation.playerDemands);
        result.outcome = 'COUNTER';
        result.counterOffer = counter;
        result.message = `Đại diện đưa ra phản đề nghị: €${(counter.wage/1000).toFixed(0)}K/tuần.`;
        result.reasoning = counter.reason;
        break;
    }
    
    // Record meeting
    negotiation.meetings.push({
      proposed: proposedTerms,
      result,
      agentReaction
    });
    
    this.meetingHistory.push(result);
    
    // Handle wage structure disruption consequences
    if (structureCheck.willDisrupt && result.outcome === 'ACCEPTED') {
      this._handleWageStructureDisruption(player, proposedTerms, structureCheck);
    }
    
    return result;
  }

  // Internal helper - Check wage structure impact
  _checkWageStructure(terms, player, club) {
    const role = terms.squadRole || SQUAD_STATUS.ROTATION;
    const proposedWage = terms.wage;
    
    // Get role wage range
    const roleKey = Object.keys(SQUAD_STATUS).find(
      k => SQUAD_STATUS[k] === role
    )?.toLowerCase() || 'rotation';
    
    const range = this.wageStructure[roleKey] || this.wageStructure.rotation;
    
    // Check if exceeds max for role
    const exceedsRole = proposedWage > range.max;
    
    // Check if exceeds any existing player
    const myPlayers = this.gs.getMyPlayers?.() || 
      this.gs.players.filter(p => p.teamId === this.gs.playerTeamId);
    const highestPaid = Math.max(...myPlayers.map(p => p.wage || 0));
    const exceedsStructure = proposedWage > highestPaid * 1.2;
    
    // Calculate affected players (those who will demand raises)
    const affectedPlayers = exceedsStructure 
      ? myPlayers.filter(p => 
          p.id !== player.id && 
          (p.wage || 0) > proposedWage * 0.8 &&
          (p.squadStatus === SQUAD_STATUS.STAR_PLAYER || 
           p.squadStatus === SQUAD_STATUS.KEY_PLAYER)
        )
      : [];
    
    return {
      willDisrupt: exceedsRole || exceedsStructure,
      exceedsRole,
      exceedsStructure,
      roleRange: range,
      proposedWage,
      highestCurrentWage: highestPaid,
      affectedPlayers: affectedPlayers.map(p => ({
        id: p.id,
        name: p.name,
        currentWage: p.wage,
        expectedDemand: Math.round(proposedWage * 1.1)
      })),
      warning: exceedsStructure 
        ? `Mức lương này sẽ phá vỡ cấu trúc và khiến ${affectedPlayers.length} cầu thủ đòi tăng lương!`
        : exceedsRole
        ? `Vượt quá mức lương cho vai trò ${role}.`
        : null
    };
  }

  // Handle consequences of breaking wage structure
  _handleWageStructureDisruption(newPlayer, terms, structureCheck) {
    // Record disruption
    this.structureDisruptions.push({
      date: new Date(this.gs.date),
      player: newPlayer.name,
      wage: terms.wage,
      affectedPlayers: structureCheck.affectedPlayers.map(p => p.name)
    });
    
    // Queue raise demands from affected players
    for (const affected of structureCheck.affectedPlayers) {
      const player = this.gs.getPlayerById(affected.id);
      if (player) {
        // Mark player as wanting raise
        player.wantsRaise = true;
        player.raiseDemand = affected.expectedDemand;
        player.raiseReason = `Phẫn nộ khi ${newPlayer.name} được trả €${(terms.wage/1000).toFixed(0)}K`;
        
        // Add news
        this.gs.addNews?.(
          "⚠️ Cầu thủ đòi tăng lương",
          `${player.name} yêu cầu tăng lương lên €${(affected.expectedDemand/1000).toFixed(0)}K sau khi ${newPlayer.name} gia nhập với mức lương cao.`
        );
      }
    }
    
    // Morale impact on squad
    const myPlayers = this.gs.getMyPlayers?.() || 
      this.gs.players.filter(p => p.teamId === this.gs.playerTeamId);
    
    for (const p of myPlayers) {
      if (p.id !== newPlayer.id && !structureCheck.affectedPlayers.find(a => a.id === p.id)) {
        p.morale = Math.max(0, (p.morale || 70) - 5);
      }
    }
  }

  // Finalize contract after acceptance
  _finalizeContract(negotiation) {
    const player = this.gs.getPlayerById(negotiation.playerId);
    if (!player) return;
    
    const terms = negotiation.finalTerms;
    
    // Update player contract
    player.wage = terms.wage;
    player.contractYears = terms.contractLength;
    player.squadStatus = terms.squadRole;
    player.releaseClause = terms.releaseClause;
    player.loyaltyBonus = terms.loyaltyBonus;
    player.yearlyWageRise = terms.yearlyWageRise;
    
    // Update bonuses
    if (terms.bonuses) {
      player.bonuses = {
        appearance: terms.bonuses.appearance,
        goal: terms.bonuses.goal,
        cleanSheet: terms.bonuses.cleanSheet,
        assist: terms.bonuses.assist
      };
    }
    
    // Update team wage bill
    const team = this.gs.getTeamById(negotiation.clubId);
    if (team) {
      team.weeklyWageBill = (team.weeklyWageBill || 0) + terms.wage;
    }
    
    // Pay agent fee
    const agentFee = negotiation.agent.greedFactor * (player.value || 1000000) * 0.05;
    team.budget = (team.budget || 0) - agentFee;
    
    // Remove from active negotiations
    this.activeNegotiations.delete(negotiation.playerId);
    
    // News
    this.gs.addNews?.(
      "✍️ Hợp đồng mới",
      `${player.name} ký hợp đồng ${terms.contractLength} năm với mức lương €${(terms.wage/1000).toFixed(0)}K/tuần.`
    );
  }

  // Create agent for player based on profile
  _createAgentForPlayer(player) {
    // Determine agent type based on player quality
    const overall = player.overall || 70;
    const value = player.value || 1000000;
    
    let style, greed, reputation;
    
    if (overall >= 85) {
      // Top players have tough agents
      style = Math.random() > 0.3 ? 'hard' : 'greedy';
      greed = 1.2 + Math.random() * 0.5;
      reputation = 70 + Math.random() * 30;
    } else if (overall >= 80) {
      // Good players
      style = Math.random() > 0.5 ? 'balanced' : 'hard';
      greed = 1.0 + Math.random() * 0.3;
      reputation = 50 + Math.random() * 30;
    } else if (player.age <= 21 && (player.potential || 0) >= 80) {
      // Young prospects - agents trying to prove themselves
      style = Math.random() > 0.5 ? 'balanced' : 'easy';
      greed = 0.9 + Math.random() * 0.3;
      reputation = 30 + Math.random() * 40;
    } else {
      // Standard players
      style = 'balanced';
      greed = 1.0;
      reputation = 40 + Math.random() * 40;
    }
    
    // Agent names
    const agentNames = [
      'Jorge Mendes Style', 'Mino Raiola Style', 'Jonathan Barnett Style',
      'Pini Zahavi Style', 'Volker Struth Style', 'Local Agent'
    ];
    
    return new Agent({
      name: agentNames[Math.floor(Math.random() * agentNames.length)],
      reputation,
      negotiationStyle: style,
      greedFactor: greed
    });
  }

  // ==================== AI GENERATED OFFERS ====================

  // When AI club signs a player, auto-generate contract
  generateAIContract(player, buyingClub) {
    const clubAI = new ClubAI(buyingClub, this.gs);
    const strategy = clubAI.generateTransferStrategy();
    
    // Determine squad role
    const myPlayers = this.gs.players.filter(p => p.teamId === buyingClub.id);
    const samePosition = myPlayers.filter(p => p.pos === player.pos);
    const sorted = samePosition.sort((a, b) => b.overall - a.overall);
    
    let role = SQUAD_STATUS.ROTATION;
    if (sorted.length === 0 || player.overall > sorted[0].overall) {
      role = player.overall >= 85 ? SQUAD_STATUS.STAR_PLAYER : SQUAD_STATUS.KEY_PLAYER;
    } else if (player.overall > (sorted[2]?.overall || 0)) {
      role = SQUAD_STATUS.FIRST_TEAM;
    }
    
    // Calculate wage based on role
    const wageMultipliers = {
      [SQUAD_STATUS.STAR_PLAYER]: 4.0,
      [SQUAD_STATUS.KEY_PLAYER]: 2.5,
      [SQUAD_STATUS.FIRST_TEAM]: 1.5,
      [SQUAD_STATUS.ROTATION]: 1.0
    };
    
    const baseWage = 30000;
    const wage = Math.round(baseWage * (wageMultipliers[role] || 1.0) * (1 + Math.random() * 0.2));
    
    // Contract length based on age
    const age = player.age || 25;
    const length = age > 30 ? 2 : age > 27 ? 3 : 4;
    
    // Release clause
    const releaseClause = role === SQUAD_STATUS.STAR_PLAYER 
      ? null 
      : Math.round((player.value || 1000000) * 2);
    
    return {
      wage,
      contractLength: length,
      squadRole: role,
      releaseClause,
      loyaltyBonus: Math.round(wage * 10), // 10 weeks wage
      yearlyWageRise: Math.round(wage * 0.05), // 5% yearly rise
      bonuses: {
        appearance: Math.round(wage * 0.1),
        goal: Math.round(wage * 0.2),
        cleanSheet: Math.round(wage * 0.15),
        assist: Math.round(wage * 0.15)
      }
    };
  }

  // ==================== PLAYER UNHAPPINESS SYSTEM ====================

  // Check and handle player unhappiness after rejecting offers
  checkPlayerHappinessAfterRejection(playerId, rejectedOffer) {
    const player = this.gs.getPlayerById(playerId);
    if (!player) return null;
    
    // Calculate attractiveness of rejected offer
    const buyingClub = this.gs.getTeamById(rejectedOffer.fromClubId);
    const offerAttractiveness = this._calculateOfferAttractiveness(player, buyingClub, rejectedOffer);
    
    // If very attractive offer rejected, player becomes unhappy
    if (offerAttractiveness > 70) {
      const unhappinessLevel = offerAttractiveness > 85 ? 'critical' : 'high';
      
      // Update morale
      const moraleDrop = unhappinessLevel === 'critical' ? 25 : 15;
      player.morale = Math.max(0, (player.morale || 70) - moraleDrop);
      
      // Mark as wanting to leave
      player.wantsToLeave = true;
      player.transferStatus = 'unsettled';
      
      // Add event
      const event = {
        type: 'player_unhappiness',
        priority: unhappinessLevel === 'critical' ? 3 : 2,
        playerId: player.id,
        playerName: player.name,
        reason: `Từ chối đề nghị từ ${buyingClub?.name}`,
        unhappinessLevel,
        consequences: unhappinessLevel === 'critical' 
          ? ['Có thể đình công', 'Giảm phong độ', 'Đòi ra đi'] 
          : ['Giảm tinh thần', 'Thi đấu kém cỏi hơn']
      };
      
      this.gs.addNews?.(
        unhappinessLevel === 'critical' ? '😡 Cầu thủ đình công!' : '😠 Cầu thủ bất mãn',
        `${player.name} không hài lòng khi CLB từ chối đề nghị từ ${buyingClub?.name}. Cầu thủ đang xem xét tương lai.`
      );
      
      return event;
    }
    
    return null;
  }

  _calculateOfferAttractiveness(player, buyingClub, offer) {
    let score = 0;
    
    // Club prestige
    const myClub = this.gs.getTeamById(player.teamId);
    const prestigeDiff = (buyingClub?.prestige || 50) - (myClub?.prestige || 50);
    score += prestigeDiff;
    
    // Wage increase
    const wageIncrease = (offer.wage || 0) / (player.wage || 1);
    score += (wageIncrease - 1) * 20;
    
    // Playing time expectation
    if (offer.squadRole === SQUAD_STATUS.STAR_PLAYER) score += 15;
    else if (offer.squadRole === SQUAD_STATUS.KEY_PLAYER) score += 10;
    
    // Champions League
    if (buyingClub?.inChampionsLeague) score += 10;
    
    return Math.max(0, Math.min(100, 50 + score));
  }

  // Handle player demanding raise
  handleRaiseDemand(playerId, response) {
    const player = this.gs.getPlayerById(playerId);
    if (!player || !player.wantsRaise) return null;
    
    const demand = {
      currentWage: player.wage,
      demandedWage: player.raiseDemand,
      reason: player.raiseReason
    };
    
    if (response === 'accept') {
      player.wage = player.raiseDemand;
      player.wantsRaise = false;
      player.raiseDemand = null;
      player.raiseReason = null;
      player.morale = Math.min(100, (player.morale || 70) + 10);
      
      return {
        success: true,
        outcome: 'ACCEPTED',
        message: `${player.name} hài lòng với mức lương mới.`,
        newWage: player.wage
      };
    } else if (response === 'reject') {
      player.morale = Math.max(0, (player.morale || 70) - 20);
      player.wantsRaise = false; // Will try again later
      
      return {
        success: false,
        outcome: 'REJECTED',
        message: `${player.name} không hài lòng và có thể xem xét ra đi.`,
        consequences: ['Morale giảm', 'Có thể tìm CLB khác']
      };
    } else if (response === 'negotiate') {
      // Counter offer
      const counterWage = Math.round((player.wage + player.raiseDemand) / 2);
      
      return {
        success: null,
        outcome: 'COUNTER',
        counterOffer: counterWage,
        message: `Đề nghị trung gian: €${(counterWage/1000).toFixed(0)}K/tuần.`
      };
    }
  }

  // ==================== STATUS & SUMMARY ====================

  getActiveNegotiations() {
    return Array.from(this.activeNegotiations.values()).map(n => ({
      playerId: n.playerId,
      playerName: this.gs.getPlayerById(n.playerId)?.name,
      phase: n.negotiationPhase,
      meetingsCount: n.meetings.length,
      demands: n.playerDemands,
      lastMeeting: n.meetings[n.meetings.length - 1] || null
    }));
  }

  getPendingRaiseDemands() {
    const myPlayers = this.gs.getMyPlayers?.() || 
      this.gs.players.filter(p => p.teamId === this.gs.playerTeamId);
    
    return myPlayers
      .filter(p => p.wantsRaise)
      .map(p => ({
        playerId: p.id,
        name: p.name,
        currentWage: p.wage,
        demandedWage: p.raiseDemand,
        reason: p.raiseReason,
        urgency: p.morale < 50 ? 'high' : 'medium'
      }));
  }

  getStructureDisruptions() {
    return this.structureDisruptions.map(d => ({
      date: d.date,
      player: d.player,
      wage: d.wage,
      affectedPlayers: d.affectedPlayers
    }));
  }

  // Save/load
  serialize() {
    return {
      activeNegotiations: Array.from(this.activeNegotiations.entries()).map(([id, n]) => ({
        playerId: id,
        data: {
          terms: n.terms,
          playerDemands: n.playerDemands,
          meetings: n.meetings,
          negotiationPhase: n.negotiationPhase,
          finalTerms: n.finalTerms,
          isAccepted: n.isAccepted
        }
      })),
      meetingHistory: this.meetingHistory,
      structureDisruptions: this.structureDisruptions
    };
  }

  load(data) {
    this.activeNegotiations.clear();
    this.meetingHistory = data.meetingHistory || [];
    this.structureDisruptions = data.structureDisruptions || [];
    
    for (const { playerId, data: nData } of (data.activeNegotiations || [])) {
      const negotiation = new ContractNegotiation({
        playerId,
        clubId: this.gs.playerTeamId
      });
      
      Object.assign(negotiation, nData);
      this.activeNegotiations.set(playerId, negotiation);
    }
  }
}
