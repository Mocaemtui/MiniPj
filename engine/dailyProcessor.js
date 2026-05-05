// ============================================================
// DAILY PROCESSOR - Next Day Processing Logic
// Async with non-blocking UI
// ============================================================

import { GameEvent, calendar, PRIORITY } from '../data/calendar.js';

export class DailyProcessor {
  constructor(gameState) {
    this.gs = gameState;
    this.isProcessing = false;
    this.abortController = null;
    this.progress = {
      step: 0,
      total: 4,
      message: '',
      detail: '',
      playersProcessed: 0,
      totalPlayers: 0,
      matchesSimulated: 0,
      eventsGenerated: 0
    };
  }

  async processNextDay(onProgress, onEvent) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.abortController = new AbortController();
    
    const dateStr = this._formatDate(this.gs.date);
    const allPlayers = this.gs.players;
    this.progress.totalPlayers = allPlayers.length;
    
    try {
      // Bước 1: Cập nhật cầu thủ
      this.progress.step = 1;
      this.progress.message = "Cập nhật thể lực và chấn thương...";
      onProgress?.({ ...this.progress });
      await this._updatePlayers(onEvent, onProgress);
      
      // Bước 2: Kiểm tra lịch thi đấu
      this.progress.step = 2;
      this.progress.message = "Kiểm tra lịch thi đấu...";
      onProgress?.({ ...this.progress });
      
      const todayEvents = calendar.getEventsByDate(dateStr);
      const matches = todayEvents.filter(e => e.type === 'match');
      
      // Bước 3: Xử lý trận đấu
      this.progress.step = 3;
      this.progress.message = `Xử lý ${matches.length} trận đấu...`;
      onProgress?.({ ...this.progress });
      
      for (const matchEvent of matches) {
        if (this.abortController.signal.aborted) break;
        
        if (this._isPlayerMatch(matchEvent)) {
          // Trận của người chơi - dừng để xử lý
          this.isProcessing = false;
          return { hasPlayerMatch: true, matchEvent };
        } else {
          // AI vs AI - simulate nhanh
          await this._simulateAIMatch(matchEvent);
          this.progress.matchesSimulated++;
          onProgress?.({ ...this.progress });
        }
      }
      
      // Bước 4: Tạo sự kiện ngẫu nhiên
      this.progress.step = 4;
      this.progress.message = "Tạo tin tức và sự kiện...";
      onProgress?.({ ...this.progress });
      await this._generateRandomEvents(onEvent);
      
      // Cập nhật ngày tiếp theo
      this.gs.date.setDate(this.gs.date.getDate() + 1);
      this.gs.week = Math.ceil(this.gs.date.getDate() / 7);
      this.gs.advanceWeek?.();
      
      return { success: true };
      
    } catch (err) {
      console.error('Daily processing error:', err);
      return { success: false, error: err.message };
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  _updatePlayers(onEvent, onProgress) {
    return new Promise((resolve) => {
      const players = this.gs.players;
      const chunkSize = 50;
      let processed = 0;
      
      const processChunk = (startIdx) => {
        if (this.abortController?.signal.aborted) {
          resolve();
          return;
        }
        
        const endIdx = Math.min(startIdx + chunkSize, players.length);
        
        for (let i = startIdx; i < endIdx; i++) {
          const p = players[i];
          
          // Hồi phục thể lực dựa trên stamina
          if (!p.injured && p.fitness < 100) {
            const stamina = p.attributes?.physical?.stamina || 70;
            const recoveryRate = stamina / 100;
            p.fitness = Math.min(100, p.fitness + (4 * recoveryRate));
          }
          
          // Hồi phục chấn thương
          if (p.injured && p.injuryDays > 0) {
            p.injuryDays--;
            if (p.injuryDays <= 0) {
              p.injured = false;
              p.fitness = 70;
              onEvent?.({ 
                type: 'injury_recovered', 
                player: p,
                message: `${p.name} đã bình phục chấn thương!`
              });
            }
          }
          
          // Tinh thần hồi phục nhẹ
          if (p.morale < 100) {
            p.morale = Math.min(100, p.morale + 1);
          }
        }
        
        processed += (endIdx - startIdx);
        this.progress.playersProcessed = processed;
        this.progress.detail = `${processed}/${players.length} cầu thủ`;
        onProgress?.({ ...this.progress });
        
        if (endIdx < players.length) {
          setTimeout(() => processChunk(endIdx), 0);
        } else {
          resolve();
        }
      };
      
      processChunk(0);
    });
  }

  _isPlayerMatch(matchEvent) {
    return matchEvent.relatedIds?.homeTeamId === this.gs.playerTeamId ||
           matchEvent.relatedIds?.awayTeamId === this.gs.playerTeamId;
  }

  async _simulateAIMatch(matchEvent) {
    // Import động để tránh circular dependency
    const { MatchEngine } = await import('./matchEngine.js');
    
    const { homeTeamId, awayTeamId, matchId } = matchEvent.data;
    const match = new MatchEngine(homeTeamId, awayTeamId, this.gs);
    
    // Simulate nhanh
    match.simulateInstant?.() || match._runMatchSimulation();
    
    // Cập nhật kết quả
    const homeTeam = this.gs.getTeamById(homeTeamId);
    const awayTeam = this.gs.getTeamById(awayTeamId);
    
    if (homeTeam && awayTeam) {
      this._updateTeamStats(homeTeam, match.homeScore, match.awayScore, true);
      this._updateTeamStats(awayTeam, match.awayScore, match.homeScore, false);
    }
    
    // Thêm tin tức nếu đáng chú ý
    if (match.homeScore + match.awayScore > 5) {
      this.gs.addNews?.("⚽ Trận cầu tâm điểm", 
        `${homeTeam?.name} ${match.homeScore}-${match.awayScore} ${awayTeam?.name}`);
    }
  }

  _updateTeamStats(team, goalsFor, goalsAgainst, isHome) {
    if (!team.stats) team.stats = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
    
    team.stats.played++;
    team.stats.gf += goalsFor;
    team.stats.ga += goalsAgainst;
    
    if (goalsFor > goalsAgainst) {
      team.stats.won++;
      team.stats.points += 3;
    } else if (goalsFor === goalsAgainst) {
      team.stats.drawn++;
      team.stats.points += 1;
    } else {
      team.stats.lost++;
    }
  }

  async _generateRandomEvents(onEvent) {
    const events = [];
    
    // 1. Tin chuyển nhượng (20% mỗi ngày)
    if (Math.random() < 0.2) {
      const myPlayers = this.gs.getMyPlayers?.() || 
        this.gs.players.filter(p => p.teamId === this.gs.playerTeamId);
      const valuablePlayers = myPlayers.filter(p => p.overall > 80 && !p.injured);
      
      if (valuablePlayers.length > 0) {
        const target = valuablePlayers[Math.floor(Math.random() * valuablePlayers.length)];
        const offer = Math.round((target.value || 10000000) * (0.8 + Math.random() * 0.4));
        
        const event = new GameEvent({
          type: 'transfer_offer',
          date: this._formatDate(this.gs.date),
          priority: PRIORITY.WARNING,
          title: "📩 Đề nghị chuyển nhượng",
          description: `Một đội bóng muốn mua ${target.name} với giá €${(offer/1000000).toFixed(1)}M`,
          relatedIds: { playerId: target.id, teamId: this.gs.playerTeamId },
          data: { offer, playerName: target.name },
          requiresAction: true
        });
        
        calendar.addEvent(event);
        events.push(event);
        this.progress.eventsGenerated++;
        onEvent?.({ type: 'transfer_offer', event });
      }
    }
    
    // 2. Cầu thủ bất mãn (10%)
    const myPlayers = this.gs.getMyPlayers?.() || 
      this.gs.players.filter(p => p.teamId === this.gs.playerTeamId);
    const unhappyPlayers = myPlayers.filter(p => p.morale < 50 && p.overall > 80);
    
    if (unhappyPlayers.length > 0 && Math.random() < 0.1) {
      const p = unhappyPlayers[0];
      
      const event = new GameEvent({
        type: 'player_complaint',
        date: this._formatDate(this.gs.date),
        priority: PRIORITY.WARNING,
        title: "😠 Cầu thủ bất mãn",
        description: `${p.name} không hài lòng với thời gian thi đấu và đang cân nhắc ra đi.`,
        relatedIds: { playerId: p.id, teamId: this.gs.playerTeamId },
        requiresAction: false
      });
      
      calendar.addEvent(event);
      events.push(event);
      this.progress.eventsGenerated++;
      onEvent?.({ type: 'player_complaint', event });
    }
    
    return events;
  }

  _formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  cancel() {
    this.abortController?.abort();
  }
}
