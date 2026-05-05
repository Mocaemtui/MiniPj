// ============================================================
// DEADLINE DAY - Transfer Window Final Day Chaos
// Panic buys, inflated prices, agent greed
// ============================================================

import { ClubAI, TransferNegotiation } from './clubAI.js';
import { TransferOffer, DeadlineDay, PlayerTransferPreference } from '../data/transferSystem.js';

export class DeadlineDayManager {
  constructor(gameState) {
    this.gs = gameState;
    this.isActive = false;
    this.hoursRemaining = 24;
    this.currentDate = null;
    
    // Hourly events
    this.hourlyEvents = [];
    
    // Active negotiations during deadline day
    this.activeNegotiations = [];
    
    // Panic metrics
    this.panicLevel = 0; // 0-100
    this.completedDeals = 0;
    this.totalSpent = 0;
    
    // Transfer window dates
    this.transferWindows = {
      summer: { start: '07-01', end: '08-31' },
      winter: { start: '01-01', end: '01-31' }
    };
  }

  // Check if today is deadline day
  checkDeadlineDay() {
    const today = this._formatDate(this.gs.date);
    const month = today.substring(5, 7);
    const day = today.substring(8, 10);
    const dateStr = `${month}-${day}`;
    
    const isSummerDeadline = dateStr === '08-31';
    const isWinterDeadline = dateStr === '01-31';
    
    if (isSummerDeadline || isWinterDeadline) {
      return true;
    }
    
    // Also check if within 48 hours of deadline for buildup
    return this._isNearDeadline(dateStr);
  }

  _isNearDeadline(dateStr) {
    const deadlines = ['08-31', '01-31'];
    const [month, day] = dateStr.split('-').map(Number);
    
    for (const deadline of deadlines) {
      const [dMonth, dDay] = deadline.split('-').map(Number);
      if (month === dMonth && dDay - day <= 2 && dDay - day > 0) {
        return true;
      }
    }
    return false;
  }

  startDeadlineDay() {
    this.isActive = true;
    this.hoursRemaining = 24;
    this.panicLevel = 30; // Start with moderate panic
    this.completedDeals = 0;
    this.totalSpent = 0;
    this.hourlyEvents = [];
    this.activeNegotiations = [];
    
    // Generate initial rush of offers
    this._generateInitialRush();
    
    console.log('🚨 DEADLINE DAY STARTED - 24 hours of chaos!');
  }

  advanceHour() {
    if (!this.isActive) return null;
    
    this.hoursRemaining--;
    this._updatePanicLevel();
    
    const events = [];
    
    // Generate events based on panic level
    if (this.hoursRemaining > 0) {
      // More events as deadline approaches
      const eventCount = this._calculateEventCount();
      
      for (let i = 0; i < eventCount; i++) {
        const event = this._generateHourlyEvent();
        if (event) events.push(event);
      }
    }
    
    // Process active negotiations
    this._processNegotiations();
    
    // Check if deadline passed
    if (this.hoursRemaining <= 0) {
      this.endDeadlineDay();
    }
    
    // Store hourly summary
    this.hourlyEvents.push({
      hour: 24 - this.hoursRemaining,
      panicLevel: this.panicLevel,
      events: events.length,
      completedDeals: this.completedDeals
    });
    
    return {
      hour: 24 - this.hoursRemaining,
      hoursRemaining: this.hoursRemaining,
      panicLevel: this.panicLevel,
      events,
      stats: {
        completedDeals: this.completedDeals,
        totalSpent: this.totalSpent
      }
    };
  }

  _calculateEventCount() {
    // More events as deadline approaches
    const urgency = (24 - this.hoursRemaining) / 24;
    const baseCount = 1;
    const panicBonus = Math.floor(this.panicLevel / 25);
    
    return baseCount + panicBonus + Math.floor(urgency * 3);
  }

  _generateHourlyEvent() {
    const eventTypes = [
      { type: 'panic_offer', weight: 0.3 + (this.panicLevel / 200) },
      { type: 'medical_rush', weight: 0.1 },
      { type: 'agent_pressure', weight: 0.2 + (this.panicLevel / 300) },
      { type: 'breaking_news', weight: 0.15 },
      { type: 'last_minute_bid', weight: this.hoursRemaining < 4 ? 0.5 : 0.05 }
    ];
    
    // Select event type based on weights
    const totalWeight = eventTypes.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedType = eventTypes[0].type;
    for (const event of eventTypes) {
      random -= event.weight;
      if (random <= 0) {
        selectedType = event.type;
        break;
      }
    }
    
    // Generate specific event
    switch (selectedType) {
      case 'panic_offer':
        return this._generatePanicOffer();
      case 'medical_rush':
        return this._generateMedicalRush();
      case 'agent_pressure':
        return this._generateAgentPressure();
      case 'breaking_news':
        return this._generateBreakingNews();
      case 'last_minute_bid':
        return this._generateLastMinuteBid();
      default:
        return null;
    }
  }

  _generatePanicOffer() {
    // AI club makes a panic buy
    const aiClubs = this.gs.teams.filter(t => t.id !== this.gs.playerTeamId);
    const buyingClub = aiClubs[Math.floor(Math.random() * aiClubs.length)];
    
    // Find a target player
    const availablePlayers = this.gs.players.filter(p => 
      p.teamId !== buyingClub.id &&
      p.teamId !== this.gs.playerTeamId &&
      !p.injured
    );
    
    if (availablePlayers.length === 0) return null;
    
    const target = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    const sellingClub = this.gs.getTeamById(target.teamId);
    
    if (!sellingClub) return null;
    
    // Calculate inflated offer (1.5-2.5x value)
    const inflation = 1.5 + (this.panicLevel / 100);
    const offerValue = Math.round((target.value || 1000000) * inflation);
    
    const offer = new TransferOffer({
      playerId: target.id,
      fromClubId: buyingClub.id,
      toClubId: sellingClub.id,
      upfrontFee: offerValue,
      deadline: new Date(this.gs.date.getTime() + 3600000) // 1 hour deadline
    });
    
    // Try to complete deal immediately (deadline day urgency)
    const sellingAI = new ClubAI(sellingClub, this.gs);
    const evaluation = sellingAI.evaluateOffer(target, offer, { isDeadlineDay: true });
    
    let result = 'pending';
    if (evaluation.response === 'accepted') {
      this._completeDeal(offer, target, buyingClub, sellingClub);
      result = 'completed';
    }
    
    return {
      type: 'panic_offer',
      hour: 24 - this.hoursRemaining,
      buyingClub: buyingClub.name,
      sellingClub: sellingClub.name,
      player: target.name,
      offerValue,
      inflation: `${Math.round((inflation - 1) * 100)}%`,
      result,
      message: `${buyingClub.name} đưa ra đề nghị €${(offerValue/1000000).toFixed(1)}M cho ${target.name}!`
    };
  }

  _generateMedicalRush() {
    // Player undergoing medical examination
    const ongoingDeals = this.activeNegotiations.filter(n => 
      n.result.status === 'accepted' && !n.medicalCompleted
    );
    
    if (ongoingDeals.length === 0) return null;
    
    const deal = ongoingDeals[0];
    deal.medicalCompleted = true;
    
    return {
      type: 'medical_rush',
      hour: 24 - this.hoursRemaining,
      player: deal.player.name,
      buyingClub: deal.buyingClub.name,
      message: `Khám y tế khẩn cấp cho ${deal.player.name} tại ${deal.buyingClub.name}!`,
      urgency: 'high'
    };
  }

  _generateAgentPressure() {
    // Agent demanding higher fees
    const ongoingDeals = this.activeNegotiations.filter(n => 
      n.result.status === 'ongoing' || n.result.status === 'counter'
    );
    
    if (ongoingDeals.length === 0) return null;
    
    const deal = ongoingDeals[Math.floor(Math.random() * ongoingDeals.length)];
    
    // Increase agent fee due to deadline pressure
    const baseFee = deal.currentOffer?.financial?.agentFee || 500000;
    const deadlineMultiplier = 1 + (this.panicLevel / 100);
    const newFee = Math.round(baseFee * deadlineMultiplier);
    
    return {
      type: 'agent_pressure',
      hour: 24 - this.hoursRemaining,
      agent: 'Người đại diện',
      player: deal.player.name,
      originalFee: baseFee,
      newFee,
      increase: `${Math.round((deadlineMultiplier - 1) * 100)}%`,
      message: `Đại diện ${deal.player.name} tăng phí lót tay lên €${(newFee/1000000).toFixed(1)}M vì sắp hết giờ!`,
      urgency: 'high'
    };
  }

  _generateBreakingNews() {
    // Surprise transfer news
    const surprisePlayers = this.gs.players.filter(p => 
      p.overall >= 85 && 
      p.teamId !== this.gs.playerTeamId
    );
    
    if (surprisePlayers.length === 0) return null;
    
    const player = surprisePlayers[Math.floor(Math.random() * surprisePlayers.length)];
    const club = this.gs.getTeamById(player.teamId);
    
    return {
      type: 'breaking_news',
      hour: 24 - this.hoursRemaining,
      player: player.name,
      club: club?.name,
      overall: player.overall,
      message: `💥 BOM TẤN: ${player.name} (${player.overall} OVR) đang được nhiều CLB săn đón!`,
      urgency: 'breaking'
    };
  }

  _generateLastMinuteBid() {
    // Multiple clubs bidding for same player
    const hotProspects = this.gs.players.filter(p => 
      p.overall >= 80 && 
      p.age <= 25 &&
      p.teamId !== this.gs.playerTeamId
    );
    
    if (hotProspects.length === 0) return null;
    
    const target = hotProspects[Math.floor(Math.random() * hotProspects.length)];
    const sellingClub = this.gs.getTeamById(target.teamId);
    
    // Generate 2-3 fake competing bids
    const numBids = 2 + Math.floor(Math.random() * 2);
    const bids = [];
    
    for (let i = 0; i < numBids; i++) {
      const inflation = 1.8 + (Math.random() * 0.7); // 1.8-2.5x
      bids.push({
        value: Math.round((target.value || 1000000) * inflation),
        club: `CLB ${String.fromCharCode(65 + i)}`
      });
    }
    
    bids.sort((a, b) => b.value - a.value);
    
    return {
      type: 'last_minute_bid',
      hour: 24 - this.hoursRemaining,
      player: target.name,
      sellingClub: sellingClub?.name,
      bids: bids.map(b => ({
        club: b.club,
        value: `€${(b.value/1000000).toFixed(1)}M`
      })),
      highestBid: bids[0],
      message: `🔥 Cuộc đua giành ${target.name}: ${numBids} đề nghị đang được xem xét!`,
      urgency: 'critical'
    };
  }

  _updatePanicLevel() {
    // Panic increases as deadline approaches
    const timePressure = (24 - this.hoursRemaining) / 24;
    this.panicLevel = Math.min(100, 30 + (timePressure * 50) + (this.completedDeals * 2));
  }

  _generateInitialRush() {
    // Generate some initial activity
    for (let i = 0; i < 3; i++) {
      const event = this._generateHourlyEvent();
      if (event) {
        this.hourlyEvents.push({
          hour: 0,
          events: 1,
          eventData: event
        });
      }
    }
  }

  _processNegotiations() {
    // Update all active negotiations
    for (const negotiation of this.activeNegotiations) {
      if (negotiation.result.status === 'ongoing') {
        // Faster responses on deadline day
        negotiation.round++;
        
        // Auto-resolve if max rounds reached
        if (negotiation.round >= 3) {
          // 50% chance of deal collapsing
          if (Math.random() > 0.5) {
            negotiation.result.status = 'collapsed';
            negotiation.result.reason = 'time_expired';
          } else {
            // Rush through
            negotiation.result.status = 'accepted';
            this._completeDeal(
              negotiation.currentOffer,
              negotiation.player,
              negotiation.buyingClub,
              negotiation.sellingClub
            );
          }
        }
      }
    }
  }

  _completeDeal(offer, player, buyingClub, sellingClub) {
    // Execute transfer
    player.teamId = buyingClub.id;
    
    // Update finances
    const fee = offer.financial?.totalValue || offer.upfrontFee || 0;
    buyingClub.budget = (buyingClub.budget || 0) - fee;
    sellingClub.budget = (sellingClub.budget || 0) + fee;
    
    // Update stats
    this.completedDeals++;
    this.totalSpent += fee;
    
    // Create news
    this.gs.addNews?.(
      "✅ Chuyển nhượng Deadline Day",
      `${player.name} gia nhập ${buyingClub.name} với giá €${(fee/1000000).toFixed(1)}M!`
    );
  }

  endDeadlineDay() {
    this.isActive = false;
    
    // Close all pending negotiations
    for (const negotiation of this.activeNegotiations) {
      if (negotiation.result.status === 'ongoing') {
        negotiation.result.status = 'expired';
        negotiation.result.reason = 'window_closed';
      }
    }
    
    // Generate summary
    const summary = {
      totalDeals: this.completedDeals,
      totalSpent: this.totalSpent,
      averagePanic: this.hourlyEvents.reduce((sum, h) => sum + h.panicLevel, 0) / this.hourlyEvents.length,
      biggestDeal: this._findBiggestDeal()
    };
    
    console.log('🏁 Deadline Day ended:', summary);
    
    return summary;
  }

  _findBiggestDeal() {
    // Find largest deal from hourly events
    let biggest = null;
    for (const hour of this.hourlyEvents) {
      if (hour.eventData?.highestBid) {
        if (!biggest || hour.eventData.highestBid.value > biggest.value) {
          biggest = hour.eventData.highestBid;
        }
      }
    }
    return biggest;
  }

  _formatDate(date) {
    return date?.toISOString()?.split('T')[0] || '';
  }

  // UI Helper - Get current status for display
  getStatus() {
    if (!this.isActive) {
      return {
        active: false,
        nextDeadline: this._getNextDeadline()
      };
    }
    
    return {
      active: true,
      hoursRemaining: this.hoursRemaining,
      panicLevel: this.panicLevel,
      panicDescription: this._getPanicDescription(),
      completedDeals: this.completedDeals,
      totalSpent: this.totalSpent,
      recentEvents: this.hourlyEvents.slice(-3).map(h => h.eventData).filter(Boolean)
    };
  }

  _getPanicDescription() {
    if (this.panicLevel < 30) return "Bình tĩnh";
    if (this.panicLevel < 50) return "Hồi hộp";
    if (this.panicLevel < 70) return "Căng thẳng";
    if (this.panicLevel < 90) return "Hỗn loạn";
    return "Tổng hỗn loạn!";
  }

  _getNextDeadline() {
    // Calculate next transfer deadline
    const today = this.gs.date;
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    // Summer window ends Aug 31
    if (month < 8 || (month === 8 && day < 31)) {
      return `31/08/${today.getFullYear()}`;
    }
    
    // Winter window ends Jan 31
    if (month > 1 || (month === 1 && day >= 31)) {
      return `31/01/${today.getFullYear() + 1}`;
    }
    
    return `31/01/${today.getFullYear()}`;
  }
}
