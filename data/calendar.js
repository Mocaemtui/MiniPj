// ============================================================
// CALENDAR SYSTEM - Event Management & Scheduling
// Optimized for O(1) daily queries
// ============================================================

// Event types enumeration
export const EVENT_TYPES = {
  MATCH: 'match',
  TRAINING: 'training',
  TRANSFER_DEADLINE: 'transfer_deadline',
  INTERNATIONAL_BREAK: 'intl_break',
  NEWS: 'news',
  INJURY: 'injury',
  NEGOTIATION: 'negotiation',
  TRANSFER_OFFER: 'transfer_offer',
  PLAYER_COMPLAINT: 'player_complaint'
};

// Event priority levels
export const PRIORITY = {
  INFO: 1,
  WARNING: 2,
  CRITICAL: 3
};

// GameEvent Class
export class GameEvent {
  constructor({
    id,
    type,
    date, // "YYYY-MM-DD"
    priority = PRIORITY.INFO,
    title,
    description,
    relatedIds = {},
    data = {},
    autoResolve = false,
    requiresAction = false
  }) {
    this.id = id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.date = date;
    this.priority = priority;
    this.title = title;
    this.description = description;
    this.relatedIds = relatedIds; // { playerId, teamId, matchId, homeTeamId, awayTeamId }
    this.data = data;
    this.autoResolve = autoResolve;
    this.requiresAction = requiresAction;
    this.status = 'pending'; // pending, processing, completed, dismissed
    this.createdAt = new Date();
  }
}

// Calendar Manager - Singleton
class CalendarManager {
  constructor() {
    this.events = new Map();      // eventId -> GameEvent
    this.dateIndex = new Map();   // "YYYY-MM-DD" -> [eventIds]
    this.playerIndex = new Map(); // playerId -> [eventIds]
    this.teamIndex = new Map();   // teamId -> [eventIds]
    this.typeIndex = new Map();   // type -> [eventIds]
  }

  // Thêm sự kiện với multi-dimensional indexing
  addEvent(event) {
    if (!(event instanceof GameEvent)) {
      event = new GameEvent(event);
    }
    
    this.events.set(event.id, event);
    
    // Index by date
    if (!this.dateIndex.has(event.date)) {
      this.dateIndex.set(event.date, []);
    }
    if (!this.dateIndex.get(event.date).includes(event.id)) {
      this.dateIndex.get(event.date).push(event.id);
    }
    
    // Index by player
    if (event.relatedIds.playerId) {
      if (!this.playerIndex.has(event.relatedIds.playerId)) {
        this.playerIndex.set(event.relatedIds.playerId, []);
      }
      if (!this.playerIndex.get(event.relatedIds.playerId).includes(event.id)) {
        this.playerIndex.get(event.relatedIds.playerId).push(event.id);
      }
    }
    
    // Index by team (home or away)
    const teamIds = [
      event.relatedIds.teamId,
      event.relatedIds.homeTeamId,
      event.relatedIds.awayTeamId
    ].filter(Boolean);
    
    for (const teamId of teamIds) {
      if (!this.teamIndex.has(teamId)) {
        this.teamIndex.set(teamId, []);
      }
      if (!this.teamIndex.get(teamId).includes(event.id)) {
        this.teamIndex.get(teamId).push(event.id);
      }
    }
    
    // Index by type
    if (!this.typeIndex.has(event.type)) {
      this.typeIndex.set(event.type, []);
    }
    if (!this.typeIndex.get(event.type).includes(event.id)) {
      this.typeIndex.get(event.type).push(event.id);
    }
    
    return event;
  }

  // O(1) lookup - Get events by date
  getEventsByDate(date) {
    const eventIds = this.dateIndex.get(date) || [];
    return eventIds.map(id => this.events.get(id)).filter(Boolean);
  }

  // Get critical events that require action
  getCriticalEvents(date) {
    return this.getEventsByDate(date)
      .filter(e => e.priority === PRIORITY.CRITICAL && e.status === 'pending' && e.requiresAction);
  }

  // Get pending events by date
  getPendingEvents(date) {
    return this.getEventsByDate(date)
      .filter(e => e.status === 'pending');
  }

  // Query by player
  getPlayerEvents(playerId, status = null) {
    const eventIds = this.playerIndex.get(playerId) || [];
    const events = eventIds.map(id => this.events.get(id)).filter(Boolean);
    return status ? events.filter(e => e.status === status) : events;
  }

  // Query by team
  getTeamEvents(teamId, date = null) {
    const eventIds = this.teamIndex.get(teamId) || [];
    const events = eventIds.map(id => this.events.get(id)).filter(Boolean);
    return date ? events.filter(e => e.date === date) : events;
  }

  // Query by type
  getEventsByType(type) {
    const eventIds = this.typeIndex.get(type) || [];
    return eventIds.map(id => this.events.get(id)).filter(Boolean);
  }

  // Get event by ID
  getEvent(id) {
    return this.events.get(id);
  }

  // Update event status
  updateEventStatus(eventId, status) {
    const event = this.events.get(eventId);
    if (event) {
      event.status = status;
    }
    return event;
  }

  // Dismiss event
  dismissEvent(eventId) {
    return this.updateEventStatus(eventId, 'dismissed');
  }

  // Complete event
  completeEvent(eventId) {
    return this.updateEventStatus(eventId, 'completed');
  }

  // Remove event from all indexes
  removeEvent(eventId) {
    const event = this.events.get(eventId);
    if (!event) return false;
    
    // Remove from date index
    const dateEvents = this.dateIndex.get(event.date);
    if (dateEvents) {
      const idx = dateEvents.indexOf(eventId);
      if (idx > -1) dateEvents.splice(idx, 1);
    }
    
    // Remove from player index
    if (event.relatedIds.playerId) {
      const playerEvents = this.playerIndex.get(event.relatedIds.playerId);
      if (playerEvents) {
        const idx = playerEvents.indexOf(eventId);
        if (idx > -1) playerEvents.splice(idx, 1);
      }
    }
    
    // Remove from team index
    const teamIds = [
      event.relatedIds.teamId,
      event.relatedIds.homeTeamId,
      event.relatedIds.awayTeamId
    ].filter(Boolean);
    
    for (const teamId of teamIds) {
      const teamEvents = this.teamIndex.get(teamId);
      if (teamEvents) {
        const idx = teamEvents.indexOf(eventId);
        if (idx > -1) teamEvents.splice(idx, 1);
      }
    }
    
    // Remove from type index
    const typeEvents = this.typeIndex.get(event.type);
    if (typeEvents) {
      const idx = typeEvents.indexOf(eventId);
      if (idx > -1) typeEvents.splice(idx, 1);
    }
    
    // Remove from main map
    this.events.delete(eventId);
    return true;
  }

  // Get upcoming events (next N days)
  getUpcomingEvents(fromDate, days = 7) {
    const results = [];
    const from = new Date(fromDate);
    
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(from);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];
      results.push(...this.getEventsByDate(dateStr));
    }
    
    return results;
  }

  // Clear all events (for new game)
  clear() {
    this.events.clear();
    this.dateIndex.clear();
    this.playerIndex.clear();
    this.teamIndex.clear();
    this.typeIndex.clear();
  }

  // Serialize for save/load
  serialize() {
    return Array.from(this.events.values());
  }

  // Load from serialized data
  load(data) {
    this.clear();
    for (const eventData of data) {
      this.addEvent(new GameEvent(eventData));
    }
  }
}

// Export singleton instance
export const calendar = new CalendarManager();
