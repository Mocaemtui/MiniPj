// ============================================================
// CLUB AI - Transfer Offer Evaluation & Negotiation Logic
// ============================================================

import { 
  TRANSFER_STATUS, 
  SQUAD_STATUS, 
  OFFER_RESPONSE, 
  TransferOffer,
  calculateMarketValue,
  generateSellOnClause
} from '../data/transferSystem.js';

export class ClubAI {
  constructor(club, gameState) {
    this.club = club;
    this.gs = gameState;
    
    // AI personality traits
    this.traits = {
      negotiationToughness: 0.5 + Math.random() * 0.5, // 0.5-1.0
      financialPressure: Math.random(), // 0-1, higher = need to sell
      rivalrySensitivity: 0.8 + Math.random() * 0.2, // 0.8-1.0
      deadlinePanic: Math.random() // How much they panic on deadline day
    };
    
    // Rivals list (clubs they won't sell to easily)
    this.rivals = this._identifyRivals();
  }

  // ==================== OFFER EVALUATION ====================

  evaluateOffer(player, offer, context = {}) {
    const { isDeadlineDay = false, isRival = false } = context;
    
    // Get player importance
    const importance = this._getPlayerImportance(player);
    const status = player.transferStatus || TRANSFER_STATUS.NOT_FOR_SALE;
    
    // Calculate minimum acceptable fee
    const minFee = this._calculateMinimumFee(player, importance, isRival);
    const offerValue = offer.financial?.totalValue || offer.upfrontFee || 0;
    
    // Check if offer meets minimum
    if (offerValue < minFee * 0.5) {
      return {
        response: OFFER_RESPONSE.REJECTED,
        reason: 'offer_too_low',
        message: `Đề nghị quá thấp. Chúng tôi định giá ${player.name} ít nhất €${(minFee/1000000).toFixed(1)}M.`,
        counterOffer: minFee
      };
    }
    
    // Check transfer status
    if (status === TRANSFER_STATUS.NOT_FOR_SALE && importance.level === 'crucial') {
      // Crucial players: only accept ridiculous offers (3x value)
      if (offerValue < minFee * 2) {
        return {
          response: OFFER_RESPONSE.REJECTED,
          reason: 'not_for_sale',
          message: `${player.name} là trụ cột và không phải để bán ở thời điểm này.`,
          counterOffer: minFee * 3 // Unrealistic counter to scare them off
        };
      }
    }
    
    // Listed players: accept if >= 90% of value
    if (status === TRANSFER_STATUS.LISTED) {
      if (offerValue >= minFee * 0.9) {
        return {
          response: OFFER_RESPONSE.ACCEPTED,
          reason: 'meets_expectation',
          message: `Chúng tôi chấp nhận đề nghị cho ${player.name}.`
        };
      }
    }
    
    // Deadline day panic
    if (isDeadlineDay && this.traits.deadlinePanic > 0.5) {
      if (offerValue >= minFee * 0.8) {
        return {
          response: OFFER_RESPONSE.ACCEPTED,
          reason: 'deadline_pressure',
          message: `Thời gian đang hết! Chúng tôi đồng ý bán ${player.name}.`
        };
      }
    }
    
    // Financial pressure - need to sell
    if (this.traits.financialPressure > 0.7) {
      if (offerValue >= minFee * 0.85) {
        return {
          response: OFFER_RESPONSE.ACCEPTED,
          reason: 'financial_need',
          message: `Vì lý do tài chính, chúng tôi chấp nhận đề nghị này.`
        };
      }
    }
    
    // Standard negotiation - counter offer
    const counterAmount = this._generateCounterOffer(minFee, offerValue, importance);
    
    return {
      response: OFFER_RESPONSE.COUNTER_OFFER,
      reason: 'negotiating',
      message: `Đề nghị chưa đạt yêu cầu. Chúng tôi muốn €${(counterAmount/1000000).toFixed(1)}M.`,
      counterOffer: counterAmount,
      suggestedTerms: this._suggestAdditionalTerms(player, offer)
    };
  }

  // ==================== INTERNAL HELPERS ====================

  _getPlayerImportance(player) {
    const squadRole = player.squadStatus || SQUAD_STATUS.ROTATION;
    const overall = player.overall || 70;
    const age = player.age || 25;
    
    const importanceMap = {
      [SQUAD_STATUS.STAR_PLAYER]: { level: 'crucial', multiplier: 3.0 },
      [SQUAD_STATUS.KEY_PLAYER]: { level: 'high', multiplier: 2.0 },
      [SQUAD_STATUS.FIRST_TEAM]: { level: 'medium', multiplier: 1.5 },
      [SQUAD_STATUS.ROTATION]: { level: 'low', multiplier: 1.0 },
      [SQUAD_STATUS.HOT_PROSPECT]: { level: 'high', multiplier: 1.8 },
      [SQUAD_STATUS.YOUNG_PROSPECT]: { level: 'medium', multiplier: 1.2 },
      [SQUAD_STATUS.DEADWOOD]: { level: 'none', multiplier: 0.5 }
    };
    
    const importance = importanceMap[squadRole] || { level: 'medium', multiplier: 1.0 };
    
    // Adjust for age
    if (age <= 21 && overall >= 75) {
      importance.multiplier *= 1.3; // Young talent premium
    }
    if (age >= 32) {
      importance.multiplier *= 0.7; // Older player discount
    }
    
    return importance;
  }

  _calculateMinimumFee(player, importance, isRival = false) {
    const baseValue = calculateMarketValue(player, { 
      contractYears: player.contractYears || 2 
    });
    
    let minFee = baseValue * importance.multiplier;
    
    // Rival tax - charge more to rivals
    if (isRival) {
      minFee *= (1.5 + this.traits.rivalrySensitivity);
    }
    
    // Adjust based on club finances
    const clubBudget = this.club.budget || 10000000;
    if (clubBudget < 5000000) {
      // Poor club - willing to sell for less
      minFee *= 0.85;
    } else if (clubBudget > 50000000) {
      // Rich club - don't need to sell, charge more
      minFee *= 1.1;
    }
    
    return Math.round(minFee);
  }

  _generateCounterOffer(minFee, offerValue, importance) {
    const gap = minFee - offerValue;
    
    // Calculate counter based on toughness
    let counter = minFee;
    
    if (importance.level === 'crucial') {
      // Hard negotiation for crucial players
      counter = Math.max(minFee, offerValue * 1.5);
    } else if (importance.level === 'high') {
      counter = Math.max(minFee * 0.95, offerValue * 1.2);
    } else {
      // Softer for less important players
      counter = Math.max(minFee * 0.9, offerValue * 1.1);
    }
    
    // Add toughness variation
    counter *= (0.9 + this.traits.negotiationToughness * 0.2);
    
    return Math.round(counter);
  }

  _suggestAdditionalTerms(player, offer) {
    const suggestions = [];
    const age = player.age || 25;
    const potential = player.potential || player.overall;
    
    // Suggest sell-on clause for young players
    if (age <= 23 && potential >= 80) {
      const sellOn = generateSellOnClause(age, potential);
      suggestions.push({
        type: 'sell_on_clause',
        value: sellOn,
        description: `Hưởng ${sellOn}% từ lần bán sau`
      });
    }
    
    // Suggest installments for large offers
    if (offer.financial?.totalValue > 20000000) {
      suggestions.push({
        type: 'installments',
        value: offer.financial.totalValue * 0.3,
        months: 12,
        description: 'Trả góp 30% trong 12 tháng'
      });
    }
    
    // Suggest performance bonuses
    if (player.overall >= 80) {
      suggestions.push({
        type: 'performance_bonus',
        conditions: [
          { trigger: 'goals_20', amount: 1000000 },
          { trigger: 'appearances_50', amount: 500000 },
          { trigger: 'international_cap', amount: 2000000 }
        ],
        description: 'Phụ phí theo thành tích'
      });
    }
    
    return suggestions;
  }

  _identifyRivals() {
    // Identify rival clubs based on league and geography
    const rivals = [];
    
    // Same city derbies
    const cityRivals = {
      'Manchester United': 'Manchester City',
      'Manchester City': 'Manchester United',
      'Liverpool': 'Everton',
      'Everton': 'Liverpool',
      'Real Madrid': 'Atletico Madrid',
      'Atletico Madrid': 'Real Madrid',
      'Inter Milan': 'AC Milan',
      'AC Milan': 'Inter Milan',
      'Roma': 'Lazio',
      'Lazio': 'Roma'
    };
    
    if (cityRivals[this.club.name]) {
      const rival = this.gs.teams.find(t => t.name === cityRivals[this.club.name]);
      if (rival) rivals.push(rival.id);
    }
    
    return rivals;
  }

  // ==================== TRANSFER STRATEGY ====================

  generateTransferStrategy() {
    const squad = this.gs.getPlayersByTeam(this.club.id);
    const budget = this.club.budget || 10000000;
    const wageBill = squad.reduce((sum, p) => sum + (p.wage || 0), 0);
    
    return {
      // Sell players
      sellList: this._identifyPlayersToSell(squad, wageBill),
      
      // Buy targets
      buyTargets: this._identifyBuyTargets(squad, budget),
      
      // Budget allocation
      maxTransferSpend: budget * 0.6,
      maxWageIncrease: budget * 0.1 / 52, // Weekly
      
      // Priority positions
      priorityPositions: this._identifyWeakPositions(squad)
    };
  }

  _identifyPlayersToSell(squad, totalWageBill) {
    const toSell = [];
    
    // Identify deadwood
    const deadwood = squad.filter(p => 
      (p.squadStatus === SQUAD_STATUS.DEADWOOD) ||
      (p.age >= 33 && p.squadStatus !== SQUAD_STATUS.STAR_PLAYER) ||
      (p.morale < 40 && p.overall < 80)
    );
    
    // Identify expensive underperformers
    const expensivePoor = squad.filter(p => {
      const wageRatio = (p.wage || 0) / (totalWageBill / squad.length);
      return wageRatio > 1.5 && p.overall < 75;
    });
    
    // Combine and sort by sale priority
    const candidates = [...deadwood, ...expensivePoor];
    
    return candidates.map(p => ({
      playerId: p.id,
      name: p.name,
      askingPrice: calculateMarketValue(p),
      urgency: p.squadStatus === SQUAD_STATUS.DEADWOOD ? 'high' : 'medium'
    }));
  }

  _identifyBuyTargets(squad, budget) {
    const targets = [];
    const weakPositions = this._identifyWeakPositions(squad);
    
    // Find players in weak positions from other teams
    const allPlayers = this.gs.players.filter(p => p.teamId !== this.club.id);
    
    for (const position of weakPositions) {
      // Find suitable players
      const candidates = allPlayers.filter(p => 
        p.pos === position && 
        p.overall >= 75 &&
        p.value <= budget * 0.5
      );
      
      // Sort by value for money
      const sorted = candidates
        .map(p => ({
          playerId: p.id,
          name: p.name,
          position: p.pos,
          overall: p.overall,
          age: p.age,
          value: p.value,
          valueForMoney: (p.potential || p.overall) / (p.value / 1000000)
        }))
        .sort((a, b) => b.valueForMoney - a.valueForMoney)
        .slice(0, 3);
      
      targets.push(...sorted);
    }
    
    return targets;
  }

  _identifyWeakPositions(squad) {
    const positionStrength = {};
    const positionCount = {};
    
    // Count players per position and calculate average overall
    for (const player of squad) {
      const pos = player.pos;
      if (!positionStrength[pos]) {
        positionStrength[pos] = 0;
        positionCount[pos] = 0;
      }
      positionStrength[pos] += player.overall;
      positionCount[pos]++;
    }
    
    // Calculate averages and identify weak spots
    const weaknesses = [];
    for (const [pos, total] of Object.entries(positionStrength)) {
      const avg = total / positionCount[pos];
      if (avg < 75 || positionCount[pos] < 2) {
        weaknesses.push(pos);
      }
    }
    
    return weaknesses;
  }

  // ==================== RESPONSE GENERATION ====================

  generateResponseMessage(responseType, player, offerValue) {
    const messages = {
      [OFFER_RESPONSE.ACCEPTED]: [
        `Chúng tôi đồng ý bán ${player.name} với giá này.`,
        `Thương vụ được chấp thuận. ${player.name} có thể đàm phán hợp đồng.`,
        `Đề nghị được chấp nhận. Chúng tôi chúc ${player.name} may mắn ở CLB mới.`
      ],
      [OFFER_RESPONSE.REJECTED]: [
        `Đề nghị không đủ hấp dẫn để chúng tôi xem xét bán ${player.name}.`,
        `Chúng tôi không có ý định bán ${player.name} ở thời điểm này.`,
        `Cầu thủ này là không thể thay thế với đội của chúng tôi.`
      ],
      [OFFER_RESPONSE.COUNTER_OFFER]: [
        `Đề nghị chưa đạt kỳ vọng. Chúng tôi muốn thảo luận về con số cao hơn.`,
        `Gần đạt yêu cầu, nhưng cần điều chỉnh một số điều khoản.`,
        `Chúng tôi quan tâm, nhưng cần cấu trúc thanh toán khác.`
      ]
    };
    
    const messageList = messages[responseType] || messages[OFFER_RESPONSE.REJECTED];
    return messageList[Math.floor(Math.random() * messageList.length)];
  }
}

// ==================== TRANSFER NEGOTIATION SESSION ====================

export class TransferNegotiation {
  constructor(buyingClub, sellingClub, player, initialOffer) {
    this.buyingClub = buyingClub;
    this.sellingClub = sellingClub;
    this.player = player;
    this.currentOffer = initialOffer;
    
    this.sellingClubAI = new ClubAI(sellingClub, buyingClub.gs);
    this.buyingClubAI = new ClubAI(buyingClub, buyingClub.gs);
    
    this.round = 0;
    this.maxRounds = 5;
    this.history = [];
    
    this.result = {
      status: 'ongoing',
      finalOffer: null,
      agreement: false,
      reason: null
    };
  }

  async negotiateRound(context = {}) {
    if (this.round >= this.maxRounds) {
      this.result.status = 'expired';
      this.result.reason = 'max_rounds_reached';
      return this.result;
    }
    
    this.round++;
    
    // Evaluate offer
    const evaluation = this.sellingClubAI.evaluateOffer(
      this.player, 
      this.currentOffer, 
      context
    );
    
    this.history.push({
      round: this.round,
      offer: { ...this.currentOffer },
      response: evaluation
    });
    
    switch (evaluation.response) {
      case OFFER_RESPONSE.ACCEPTED:
        this.result.status = 'accepted';
        this.result.agreement = true;
        this.result.finalOffer = this.currentOffer;
        break;
        
      case OFFER_RESPONSE.REJECTED:
        this.result.status = 'rejected';
        this.result.reason = evaluation.reason;
        break;
        
      case OFFER_RESPONSE.COUNTER_OFFER:
        // Continue negotiation
        this.result.counterOffer = evaluation.counterOffer;
        this.result.suggestedTerms = evaluation.suggestedTerms;
        break;
    }
    
    return { ...this.result, evaluation };
  }

  makeCounterOffer(offer) {
    this.currentOffer = offer;
    this.result.status = 'ongoing';
  }

  withdraw() {
    this.result.status = 'withdrawn';
    this.result.reason = 'buyer_withdrawn';
  }
}
