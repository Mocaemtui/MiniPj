// ============================================================
// EVENT SYSTEM - Observer Pattern Implementation
// Priority-based event handling
// ============================================================

import { GameEvent, calendar, PRIORITY } from '../data/calendar.js';

// Event Bus - Central pub/sub system
export class EventBus {
  constructor() {
    this.listeners = new Map(); // eventType -> [{callback, priority, once}]
  }

  // Subscribe to event
  subscribe(eventType, callback, priority = 0, once = false) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const handlers = this.listeners.get(eventType);
    handlers.push({ callback, priority, once });
    
    // Sort by priority (higher first)
    handlers.sort((a, b) => b.priority - a.priority);
    
    // Return unsubscribe function
    return () => this.unsubscribe(eventType, callback);
  }

  // Subscribe once
  once(eventType, callback, priority = 0) {
    return this.subscribe(eventType, callback, priority, true);
  }

  // Unsubscribe
  unsubscribe(eventType, callback) {
    const handlers = this.listeners.get(eventType);
    if (!handlers) return;
    
    const idx = handlers.findIndex(h => h.callback === callback);
    if (idx > -1) handlers.splice(idx, 1);
  }

  // Emit event
  emit(eventType, payload) {
    const handlers = this.listeners.get(eventType) || [];
    const toRemove = [];
    
    for (const handler of handlers) {
      try {
        const result = handler.callback(payload);
        
        // Mark once handlers for removal
        if (handler.once) {
          toRemove.push(handler);
        }
        
        // Stop propagation if handler returns false
        if (result === false) break;
      } catch (err) {
        console.error(`Event handler error for ${eventType}:`, err);
      }
    }
    
    // Remove once handlers
    for (const handler of toRemove) {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    }
  }

  // Clear all listeners
  clear() {
    this.listeners.clear();
  }
}

// ============================================================
// INJURY EVENT MANAGER
// ============================================================
export class InjuryEventManager {
  constructor(gameState, eventBus) {
    this.gs = gameState;
    this.bus = eventBus;
    
    // Subscribe with HIGH priority
    this.unsubscribe = this.bus.subscribe('player_injured', 
      this.handleInjury.bind(this), 
      100
    );
  }

  handleInjury({ playerId, severity, duration, cause }) {
    const player = this.gs.getPlayerById(playerId);
    if (!player) return true;
    
    // 1. Update player status
    player.injured = true;
    player.injuryDays = duration;
    player.morale = Math.max(30, player.morale - 15);
    
    // 2. Decrease transfer value (30-50%)
    const valueLoss = severity === 'major' ? 0.5 : severity === 'medium' ? 0.35 : 0.2;
    const oldValue = player.value || 10000000;
    player.value = Math.round(oldValue * (1 - valueLoss));
    
    // 3. Create event
    const priority = severity === 'major' ? PRIORITY.CRITICAL : PRIORITY.WARNING;
    const event = new GameEvent({
      type: 'injury',
      date: this._formatDate(this.gs.date),
      priority,
      title: severity === 'major' ? '🚑 Chấn thương nghiêm trọng!' : '🤕 Chấn thương',
      description: `${player.name} bị chấn thương ${duration} ngày.${cause ? ' Nguyên nhân: ' + cause : ''} Giá trị giảm ${Math.round(valueLoss * 100)}%`,
      relatedIds: { playerId: player.id, teamId: player.teamId },
      requiresAction: severity === 'major',
      data: { 
        severity, 
        duration, 
        oldValue,
        newValue: player.value,
        valueLoss: oldValue - player.value
      }
    });
    
    calendar.addEvent(event);
    this.gs.notifications?.push(event);
    
    // 4. Emit for UI update
    this.bus.emit('notification_added', event);
    
    // Stop propagation if CRITICAL (pause game)
    if (priority === PRIORITY.CRITICAL) {
      this.bus.emit('critical_event', { type: 'injury', event });
      return false;
    }
    
    return true;
  }

  _formatDate(date) {
    return date?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0];
  }

  destroy() {
    this.unsubscribe?.();
  }
}

// ============================================================
// TRANSFER EVENT MANAGER
// ============================================================
export class TransferEventManager {
  constructor(gameState, eventBus) {
    this.gs = gameState;
    this.bus = eventBus;
    
    this.unsubscribeCompleted = this.bus.subscribe('transfer_completed', 
      this.handleTransfer.bind(this), 90);
    this.unsubscribeOffer = this.bus.subscribe('transfer_offer_received',
      this.handleTransferOffer.bind(this), 80);
  }

  handleTransfer({ playerId, fromTeamId, toTeamId, fee, wage }) {
    const player = this.gs.getPlayerById(playerId);
    if (!player) return;
    
    // Update team
    player.teamId = toTeamId;
    player.value = Math.round(fee * 1.1); // Increase value after transfer
    player.wage = wage || player.wage;
    
    // Update budgets
    const fromTeam = this.gs.getTeamById(fromTeamId);
    const toTeam = this.gs.getTeamById(toTeamId);
    
    if (fromTeam) fromTeam.budget = (fromTeam.budget || 0) + fee;
    if (toTeam) toTeam.budget = (toTeam.budget || 0) - fee;
    
    // Create event
    const event = new GameEvent({
      type: 'transfer',
      date: this._formatDate(this.gs.date),
      priority: PRIORITY.INFO,
      title: "✅ Chuyển nhượng hoàn tất",
      description: `${player.name} chuyển từ ${fromTeam?.name || 'CLB cũ'} đến ${toTeam?.name || 'CLB mới'} với giá €${(fee/1000000).toFixed(1)}M`,
      relatedIds: { playerId, fromTeamId, toTeamId },
      data: { fee, wage }
    });
    
    calendar.addEvent(event);
    this.bus.emit('notification_added', event);
  }

  handleTransferOffer({ playerId, teamId, offerAmount, offeringTeamId, offeringTeamName }) {
    const player = this.gs.getPlayerById(playerId);
    if (!player) return;
    
    const event = new GameEvent({
      type: 'transfer_offer',
      date: this._formatDate(this.gs.date),
      priority: PRIORITY.WARNING,
      title: "📩 Đề nghị chuyển nhượng",
      description: `${offeringTeamName || 'Một CLB'} đề nghị mua ${player.name} với giá €${(offerAmount/1000000).toFixed(1)}M`,
      relatedIds: { playerId, teamId, offeringTeamId },
      requiresAction: true,
      data: { offerAmount, offeringTeamId, offeringTeamName, playerId }
    });
    
    calendar.addEvent(event);
    this.gs.notifications?.push(event);
    this.bus.emit('notification_added', event);
  }

  _formatDate(date) {
    return date?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0];
  }

  destroy() {
    this.unsubscribeCompleted?.();
    this.unsubscribeOffer?.();
  }
}

// ============================================================
// MATCH EVENT MANAGER
// ============================================================
export class MatchEventManager {
  constructor(gameState, eventBus) {
    this.gs = gameState;
    this.bus = eventBus;
    
    this.unsubscribe = this.bus.subscribe('match_completed',
      this.handleMatchComplete.bind(this), 70);
  }

  handleMatchComplete({ matchId, homeTeamId, awayTeamId, homeScore, awayScore, events }) {
    const homeTeam = this.gs.getTeamById(homeTeamId);
    const awayTeam = this.gs.getTeamById(awayTeamId);
    
    // Update stats
    this._updateTeamStats(homeTeam, homeScore, awayScore, true);
    this._updateTeamStats(awayTeam, awayScore, homeScore, false);
    
    // Create match event
    const event = new GameEvent({
      type: 'match',
      date: this._formatDate(this.gs.date),
      priority: PRIORITY.INFO,
      title: "⚽ Kết thúc trận đấu",
      description: `${homeTeam?.name} ${homeScore}-${awayScore} ${awayTeam?.name}`,
      relatedIds: { homeTeamId, awayTeamId },
      data: { matchId, homeScore, awayScore, events }
    });
    
    calendar.addEvent(event);
    
    // Create highlight event for big scores
    if (homeScore + awayScore > 5 || Math.abs(homeScore - awayScore) > 3) {
      const highlightEvent = new GameEvent({
        type: 'news',
        date: this._formatDate(this.gs.date),
        priority: PRIORITY.INFO,
        title: "🔥 Trận cầu đáng chú ý",
        description: `Tỷ số hấp dẫn: ${homeTeam?.name} ${homeScore}-${awayScore} ${awayTeam?.name}`,
        relatedIds: { homeTeamId, awayTeamId }
      });
      calendar.addEvent(highlightEvent);
      this.bus.emit('notification_added', highlightEvent);
    }
  }

  _updateTeamStats(team, gf, ga, isHome) {
    if (!team) return;
    if (!team.stats) {
      team.stats = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
    }
    
    team.stats.played++;
    team.stats.gf += gf;
    team.stats.ga += ga;
    
    if (gf > ga) {
      team.stats.won++;
      team.stats.points += 3;
    } else if (gf === ga) {
      team.stats.drawn++;
      team.stats.points += 1;
    } else {
      team.stats.lost++;
    }
  }

  _formatDate(date) {
    return date?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0];
  }

  destroy() {
    this.unsubscribe?.();
  }
}

// ============================================================
// INITIALIZATION
// ============================================================
export function initEventSystem(gameState) {
  const bus = new EventBus();
  
  const injuryMgr = new InjuryEventManager(gameState, bus);
  const transferMgr = new TransferEventManager(gameState, bus);
  const matchMgr = new MatchEventManager(gameState, bus);
  
  return { 
    bus, 
    managers: { injuryMgr, transferMgr, matchMgr },
    destroy() {
      injuryMgr.destroy();
      transferMgr.destroy();
      matchMgr.destroy();
      bus.clear();
    }
  };
}
