// ============================================================
// TRANSFER SYSTEM - Complete Transfer & Negotiation Framework
// ============================================================

// ==================== ENUMS ====================

export const TRANSFER_STATUS = {
  NOT_FOR_SALE: 'not_for_sale',
  LISTED: 'listed',
  LOAN_LISTED: 'loan_listed',
  UNSETTLED: 'unsettled',
  BLOCKED: 'blocked'
};

export const SQUAD_STATUS = {
  STAR_PLAYER: 'star_player',      // Trụ cột, không bán
  KEY_PLAYER: 'key_player',        // Quan trọng, giá cao
  FIRST_TEAM: 'first_team',        // Đội hình chính
  ROTATION: 'rotation',            // Dự bị
  HOT_PROSPECT: 'hot_prospect',    // Tài năng trẻ
  YOUNG_PROSPECT: 'young_prospect', // Tiềm năng
  DEADWOOD: 'deadwood'             // Thanh lý
};

export const OFFER_RESPONSE = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COUNTER_OFFER: 'counter_offer',
  PENDING: 'pending',
  EXPIRED: 'expired'
};

export const NEGOTIATION_PHASE = {
  CLUB_NEGOTIATION: 'club_negotiation',
  AGENT_MEETING: 'agent_meeting',
  CONTRACT_TERMS: 'contract_terms',
  MEDICAL: 'medical',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// ==================== TRANSFER OFFER CLASS ====================

export class TransferOffer {
  constructor({
    id,
    playerId,
    fromClubId,
    toClubId,
    upfrontFee = 0,
    installments = [],
    performanceBonuses = [],
    sellOnClause = 0, // Percentage (0-30)
    exchangePlayers = [],
    agentFee = 0,
    totalValue = 0,
    deadline = null,
    conditions = {}
  }) {
    this.id = id || `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.playerId = playerId;
    this.fromClubId = fromClubId; // Buying club
    this.toClubId = toClubId;     // Selling club
    
    // Financial structure
    this.financial = {
      upfrontFee,
      installments: installments || [], // [{ amount, months, startDate }]
      performanceBonuses: performanceBonuses || [], // [{ type, amount, condition }]
      sellOnClause: sellOnClause || 0, // % future sale
      exchangePlayers: exchangePlayers || [], // [{ playerId, value }]
      agentFee: agentFee || 0,
      get totalValue() {
        const installmentTotal = this.installments.reduce((sum, i) => sum + i.amount, 0);
        const bonusTotal = this.performanceBonuses.reduce((sum, b) => sum + b.amount, 0);
        const exchangeTotal = this.exchangePlayers.reduce((sum, p) => sum + p.value, 0);
        return this.upfrontFee + installmentTotal + bonusTotal + exchangeTotal;
      }
    };
    
    this.deadline = deadline || this._defaultDeadline();
    this.conditions = conditions; // Non-negotiable terms
    
    // Negotiation state
    this.response = OFFER_RESPONSE.PENDING;
    this.counterOffer = null; // Counter-offer amount
    this.rejectionReason = null;
    
    // Timeline
    this.submittedAt = new Date();
    this.respondedAt = null;
    this.negotiationHistory = [];
  }

  _defaultDeadline() {
    const d = new Date();
    d.setDate(d.getDate() + 7); // 7 days to respond
    return d;
  }

  addInstallment(amount, months, startDate) {
    this.financial.installments.push({ amount, months, startDate });
  }

  addPerformanceBonus(type, amount, condition) {
    this.financial.performanceBonuses.push({ type, amount, condition });
  }

  logHistory(action, message, by = 'system') {
    this.negotiationHistory.push({
      timestamp: new Date(),
      action,
      message,
      by
    });
  }
}

// ==================== CONTRACT NEGOTIATION CLASS ====================

export class ContractNegotiation {
  constructor({
    playerId,
    clubId,
    currentWage = 0,
    proposedWage = 0,
    contractLength = 3, // years
    squadRole = SQUAD_STATUS.ROTATION,
    releaseClause = null,
    loyaltyBonus = 0,
    yearlyWageRise = 0,
    appearanceBonus = 0,
    goalBonus = 0,
    agent = null
  }) {
    this.playerId = playerId;
    this.clubId = clubId;
    
    this.terms = {
      wage: proposedWage,
      contractLength,
      squadRole,
      releaseClause,
      loyaltyBonus,
      yearlyWageRise,
      bonuses: {
        appearance: appearanceBonus,
        goal: goalBonus,
        cleanSheet: 0,
        assist: 0
      }
    };
    
    this.agent = agent || new Agent(); // Default agent
    this.playerDemands = null; // Will be calculated
    this.negotiationPhase = NEGOTIATION_PHASE.AGENT_MEETING;
    
    this.meetings = [];
    this.finalTerms = null;
    this.isAccepted = false;
  }

  calculatePlayerDemands(player, club) {
    const baseWage = player.wage || 10000;
    const marketValue = player.value || 1000000;
    const age = player.age || 25;
    const overall = player.overall || 70;
    
    // Demands based on player profile
    const demands = {
      minWage: Math.round(baseWage * 1.1),
      idealWage: Math.round(baseWage * 1.3),
      maxWage: Math.round(baseWage * 1.5),
      contractLength: age > 30 ? 2 : age > 27 ? 3 : 4,
      squadRole: this._calculateExpectedRole(player, club),
      releaseClause: overall > 85 ? null : marketValue * 2,
      agentFee: Math.round(marketValue * 0.05) // 5% agent fee
    };
    
    // Adjust based on player personality
    if (player.morale && player.morale < 50) {
      demands.minWage *= 1.2; // Unhappy player demands more
    }
    
    this.playerDemands = demands;
    return demands;
  }

  _calculateExpectedRole(player, club) {
    const overall = player.overall || 70;
    const age = player.age || 25;
    
    if (overall >= 85 && age <= 30) return SQUAD_STATUS.STAR_PLAYER;
    if (overall >= 80) return SQUAD_STATUS.KEY_PLAYER;
    if (overall >= 75) return SQUAD_STATUS.FIRST_TEAM;
    if (age <= 21 && overall >= 70) return SQUAD_STATUS.HOT_PROSPECT;
    if (age <= 19) return SQUAD_STATUS.YOUNG_PROSPECT;
    return SQUAD_STATUS.ROTATION;
  }

  proposeTerms(terms) {
    const meeting = {
      date: new Date(),
      proposed: terms,
      agentReaction: this.agent.evaluateOffer(terms, this.playerDemands),
      playerReaction: null,
      counterProposal: null
    };
    
    // Agent generates counter-proposal if needed
    if (meeting.agentReaction === 'counter') {
      meeting.counterProposal = this.agent.generateCounter(this.playerDemands);
    }
    
    this.meetings.push(meeting);
    return meeting;
  }

  acceptTerms(finalTerms) {
    this.finalTerms = finalTerms;
    this.isAccepted = true;
    this.negotiationPhase = NEGOTIATION_PHASE.COMPLETED;
  }
}

// ==================== AGENT CLASS ====================

export class Agent {
  constructor({
    name = 'Agent',
    reputation = 50, // 0-100
    negotiationStyle = 'balanced', // 'easy', 'balanced', 'hard', 'greedy'
    greedFactor = 1.0 // Multiplier for demands
  }) {
    this.name = name;
    this.reputation = reputation;
    this.negotiationStyle = negotiationStyle;
    this.greedFactor = greedFactor;
    
    // Style modifiers
    this.styleConfig = {
      easy: { minThreshold: 0.8, counterRate: 0.3, patience: 5 },
      balanced: { minThreshold: 0.95, counterRate: 0.6, patience: 4 },
      hard: { minThreshold: 1.1, counterRate: 0.8, patience: 3 },
      greedy: { minThreshold: 1.3, counterRate: 0.9, patience: 2 }
    };
  }

  evaluateOffer(proposed, demands) {
    const config = this.styleConfig[this.negotiationStyle];
    
    // Check if wage meets minimum threshold
    const wageRatio = proposed.wage / demands.minWage;
    
    if (wageRatio < config.minThreshold) {
      return 'rejected';
    }
    
    if (wageRatio >= 1.0 && wageRatio < demands.idealWage / demands.minWage) {
      return Math.random() < config.counterRate ? 'counter' : 'accepted';
    }
    
    return 'accepted';
  }

  generateCounter(demands) {
    return {
      wage: Math.round(demands.idealWage * this.greedFactor),
      contractLength: demands.contractLength,
      squadRole: demands.squadRole,
      releaseClause: demands.releaseClause,
      agentFee: Math.round(demands.agentFee * this.greedFactor),
      reason: this._generateCounterReason()
    };
  }

  _generateCounterReason() {
    const reasons = [
      'Thân chủ của tôi cần mức lương xứng đáng hơn.',
      'Có CLB khác đang quan tâm với đề nghị tốt hơn.',
      'Cầu thủ cần đảm bảo vị trí trong đội hình.',
      'Phí đại diện cần được xem xét lại.'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }
}

// ==================== SCOUTING REPORT ====================

export class ScoutingReport {
  constructor({
    playerId,
    scoutId,
    assignments = 0, // Number of times scouted
    maxAssignments = 5,
    knowledgeLevel = 0 // 0-100, increases with each scout
  }) {
    this.playerId = playerId;
    this.scoutId = scoutId;
    this.assignments = assignments;
    this.maxAssignments = maxAssignments;
    this.knowledgeLevel = knowledgeLevel;
    this.lastScouted = null;
    
    // Revealed attributes based on knowledge
    this.revealedAttributes = {};
    
    // Assessment
    this.assessment = {
      fitRating: 0, // 0-100, how well they fit team's tactics
      adaptability: 0, // Cultural/language/work permit
      injuryRisk: 0,
      recommendation: 'scout_more' // 'sign', 'avoid', 'scout_more', 'monitor'
    };
  }

  // Fog of War - Calculate what attributes are visible
  getVisibleAttributes(playerAttributes) {
    const visibility = {};
    const k = this.knowledgeLevel / 100;
    
    // Technical attributes become visible at 20% knowledge
    if (k >= 0.2) {
      visibility.technical = this._revealWithVariance(playerAttributes.technical, k);
    }
    
    // Mental attributes at 40%
    if (k >= 0.4) {
      visibility.mental = this._revealWithVariance(playerAttributes.mental, k);
    }
    
    // Physical attributes at 30%
    if (k >= 0.3) {
      visibility.physical = this._revealWithVariance(playerAttributes.physical, k);
    }
    
    // Hidden traits at 80%
    if (k >= 0.8) {
      visibility.personality = playerAttributes.personality;
      visibility.consistency = playerAttributes.consistency;
    }
    
    return visibility;
  }

  _revealWithVariance(attributes, knowledge) {
    if (!attributes) return {};
    
    const revealed = {};
    const variance = Math.max(5, 20 - (knowledge * 15)); // Less variance with more knowledge
    
    for (const [key, value] of Object.entries(attributes)) {
      // Add random variance based on knowledge
      const actualValue = value || 50;
      const error = Math.floor((Math.random() - 0.5) * variance * 2);
      revealed[key] = Math.max(1, Math.min(99, actualValue + error));
    }
    
    return revealed;
  }

  scout() {
    if (this.assignments >= this.maxAssignments) return false;
    
    this.assignments++;
    this.lastScouted = new Date();
    this.knowledgeLevel = Math.min(100, this.knowledgeLevel + (100 / this.maxAssignments));
    
    return true;
  }
}

// ==================== TRANSFER DEADLINE DAY ====================

export class DeadlineDay {
  constructor(date) {
    this.date = date;
    this.isActive = false;
    this.hoursRemaining = 24;
    
    // Panic factors increase as deadline approaches
    this.panicFactors = {
      offerFrequency: 1.0, // Multiplier for AI offers
      priceInflation: 1.0, // Prices go up
      agentGreed: 1.0, // Agents demand more
      decisionSpeed: 1.0 // Faster responses
    };
  }

  start() {
    this.isActive = true;
    this.hoursRemaining = 24;
    this._updatePanicFactors();
  }

  advanceHour() {
    if (!this.isActive) return;
    
    this.hoursRemaining--;
    this._updatePanicFactors();
    
    if (this.hoursRemaining <= 0) {
      this.end();
    }
  }

  _updatePanicFactors() {
    const urgency = (24 - this.hoursRemaining) / 24;
    
    this.panicFactors = {
      offerFrequency: 1 + (urgency * 1.5), // Up to 2.5x more offers
      priceInflation: 1 + (urgency * 0.5), // Up to 1.5x prices
      agentGreed: 1 + (urgency * 0.8), // Up to 1.8x greed
      decisionSpeed: 1 + (urgency * 2) // Up to 3x faster
    };
  }

  end() {
    this.isActive = false;
    this.hoursRemaining = 0;
  }

  // Calculate modified offer value during deadline day
  getDeadlinePrice(basePrice, isPanicBuy = false) {
    let multiplier = this.panicFactors.priceInflation;
    if (isPanicBuy) multiplier *= 1.3; // 30% extra for panic buys
    return Math.round(basePrice * multiplier);
  }
}

// ==================== PLAYER TRANSFER PREFERENCE ====================

export class PlayerTransferPreference {
  constructor(player) {
    this.playerId = player.id;
    
    // Willingness to move
    this.wantsToLeave = false;
    this.preferredClubs = []; // Dream destinations
    this.avoidedClubs = []; // Rivals or undesirable
    
    // Financial expectations
    this.minWageIncrease = 1.2; // Expect at least 20% raise
    this.signingOnFee = 0;
    
    // Career considerations
    this.priorities = {
      playingTime: 70, // 0-100 importance
      wage: 60,
      winningTrophies: 50,
      location: 40,
      clubReputation: 55
    };
  }

  evaluateTransferOffer(club, wage, role) {
    let score = 0;
    const priorities = this.priorities;
    
    // Playing time expectation
    const roleScore = this._roleToPlayingTime(role);
    score += roleScore * (priorities.playingTime / 100);
    
    // Wage satisfaction
    const currentWage = this.player?.wage || 10000;
    const wageRatio = wage / currentWage;
    const wageScore = Math.min(100, (wageRatio - 1) * 100);
    score += wageScore * (priorities.wage / 100);
    
    // Club reputation
    const clubRep = club.prestige || 50;
    score += clubRep * (priorities.clubReputation / 100);
    
    // Check dream clubs
    if (this.preferredClubs.includes(club.id)) {
      score += 20;
    }
    
    // Check rivals (will refuse)
    if (this.avoidedClubs.includes(club.id)) {
      return -100; // Will refuse
    }
    
    return score;
  }

  _roleToPlayingTime(role) {
    const map = {
      [SQUAD_STATUS.STAR_PLAYER]: 100,
      [SQUAD_STATUS.KEY_PLAYER]: 90,
      [SQUAD_STATUS.FIRST_TEAM]: 75,
      [SQUAD_STATUS.ROTATION]: 50,
      [SQUAD_STATUS.YOUNG_PROSPECT]: 30
    };
    return map[role] || 50;
  }
}

// ==================== UTILITY FUNCTIONS ====================

export function calculateMarketValue(player, context = {}) {
  let baseValue = player.value || 1000000;
  
  // Age factor (peak at 25-28)
  const age = player.age || 25;
  let ageMultiplier = 1.0;
  if (age < 21) ageMultiplier = 0.7; // Potential not proven
  else if (age <= 28) ageMultiplier = 1.2; // Peak years
  else if (age <= 32) ageMultiplier = 0.8; // Declining
  else ageMultiplier = 0.5; // Old
  
  // Contract length factor
  const contractYears = context.contractYears || 2;
  const contractMultiplier = Math.min(1.5, contractYears / 2);
  
  // Performance factor
  const formMultiplier = (player.form || 50) / 50;
  
  // Potential factor for young players
  const potentialMultiplier = age < 23 ? (player.potential || player.overall) / player.overall : 1;
  
  return Math.round(baseValue * ageMultiplier * contractMultiplier * formMultiplier * potentialMultiplier);
}

export function generateSellOnClause(playerAge, playerPotential) {
  // Young players with high potential get higher sell-on clauses
  if (playerAge <= 21 && playerPotential >= 85) {
    return 15 + Math.floor(Math.random() * 15); // 15-30%
  }
  if (playerAge <= 23 && playerPotential >= 80) {
    return 10 + Math.floor(Math.random() * 10); // 10-20%
  }
  return 5 + Math.floor(Math.random() * 10); // 5-15%
}
