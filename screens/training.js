// ============================================================
// TRAINING SCREEN - Daily Training Management
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";
import { TrainingManager, TRAINING_TYPES, TRAINING_INTENSITY } from "../engine/trainingSystem.js";

export function renderTraining(container, router) {
  let listeners = [];
  let selectedDay = 'mon';
  let selectedIntensity = 'NORMAL';
  
  function addListener(element, type, handler) {
    if (element) {
      element.addEventListener(type, handler);
      listeners.push({ element, handler, type });
    }
  }

  function removeListeners() {
    listeners.forEach(({ element, handler, type }) => {
      if (element) element.removeEventListener(type, handler);
    });
    listeners = [];
  }

  function draw() {
    const team = gameState.getMyTeam();
    const players = gameState.getMyPlayers();
    const trainingMgr = gameState.trainingManager || new TrainingManager(gameState);
    
    // Get current schedule
    const schedule = trainingMgr.schedules.get(gameState.playerTeamId) || {
      mon: 'technical', tue: 'physical', wed: 'tactical',
      thu: 'technical', fri: 'physical', sat: 'match_preparation', sun: 'rest'
    };
    
    // Calculate team stats
    const avgFitness = players.reduce((sum, p) => sum + p.fitness, 0) / players.length;
    const avgSharpness = players.reduce((sum, p) => sum + (p.matchSharpness || 80), 0) / players.length;
    const injuredCount = players.filter(p => p.injured).length;
    
    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">💪 Huấn Luyện</h1>
          <p class="screen-subtitle">Quản lý chế độ tập luyện và phát triển cầu thủ</p>
        </div>
        <div style="text-align: right;">
          <div class="stat-pill">
            <span>⚡</span> Thể lực TB: <strong>${avgFitness.toFixed(1)}%</strong>
          </div>
          <div class="stat-pill">
            <span>🎯</span> Sharpness TB: <strong>${avgSharpness.toFixed(1)}%</strong>
          </div>
          ${injuredCount > 0 ? `<div class="stat-pill" style="background: rgba(239,68,68,0.2); color: #ef4444;">
            <span>🚑</span> Chấn thương: <strong>${injuredCount}</strong>
          </div>` : ''}
        </div>
      </div>

      <div class="training-container">
        <!-- Weekly Schedule -->
        <div class="training-schedule card">
          <div class="card-header">
            <h3>📅 Lịch tập luyện hàng tuần</h3>
            <button class="btn-save-schedule" onclick="saveSchedule()">💾 Lưu lịch</button>
          </div>
          <div class="schedule-grid">
            ${['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => {
              const dayNames = { mon: 'T2', tue: 'T3', wed: 'T4', thu: 'T5', fri: 'T6', sat: 'T7', sun: 'CN' };
              const currentType = schedule[day] || 'rest';
              const isSelected = day === selectedDay;
              return `
                <div class="schedule-day ${isSelected ? 'selected' : ''}" data-day="${day}">
                  <div class="day-label">${dayNames[day]}</div>
                  <div class="training-type ${currentType}">
                    ${getTrainingIcon(currentType)} ${getTrainingName(currentType)}
                  </div>
                  ${day !== 'sun' ? `
                    <select class="day-type-select" data-day="${day}">
                      ${Object.values(TRAINING_TYPES).map(type => `
                        <option value="${type}" ${currentType === type ? 'selected' : ''}>
                          ${getTrainingName(type)}
                        </option>
                      `).join('')}
                      <option value="match_preparation" ${currentType === 'match_preparation' ? 'selected' : ''}>Chuẩn bị trận đấu</option>
                      <option value="rest" ${currentType === 'rest' ? 'selected' : ''}>Nghỉ ngơi</option>
                    </select>
                  ` : '<div class="rest-day">Nghỉ</div>'}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Intensity Selector -->
        <div class="intensity-selector card">
          <h3>🔥 Cường độ tập luyện</h3>
          <div class="intensity-options">
            ${Object.entries(TRAINING_INTENSITY).map(([key, intensity]) => `
              <div class="intensity-option ${selectedIntensity === key ? 'selected' : ''}" data-intensity="${key}">
                <div class="intensity-name">${intensity.name}</div>
                <div class="intensity-stats">
                  <span>Mệt: -${intensity.fatigue}</span>
                  <span>Tăng: +${intensity.growth}x</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Player Development -->
        <div class="player-development card">
          <div class="card-header">
            <h3>📈 Phát triển cầu thủ</h3>
            <div class="filter-controls">
              <select id="dev-filter-pos">
                <option value="ALL">Tất cả vị trí</option>
                <option value="GK">Thủ môn</option>
                <option value="CB">Trung vệ</option>
                <option value="LB">Hậu vệ trái</option>
                <option value="RB">Hậu vệ phải</option>
                <option value="CM">Tiền vệ</option>
                <option value="CAM">Tiền vệ tấn công</option>
                <option value="LW">Cánh trái</option>
                <option value="RW">Cánh phải</option>
                <option value="ST">Tiền đạo</option>
              </select>
              <select id="dev-filter-potential">
                <option value="ALL">Tiềm năng</option>
                <option value="high">Cao (>85)</option>
                <option value="medium">Trung bình (70-85)</option>
              </select>
            </div>
          </div>
          
          <div class="players-dev-list">
            ${players.slice(0, 15).map(player => {
              const focus = trainingMgr.playerFocus.get(player.id);
              const paGap = player.potential - player.overall;
              const potentialClass = paGap > 15 ? 'high-potential' : paGap > 8 ? 'good-potential' : 'limited';
              
              return `
                <div class="player-dev-card ${potentialClass}" data-player-id="${player.id}">
                  <div class="dev-player-header">
                    <div class="dev-player-info">
                      <span class="dev-pos" style="background: ${getPosColor(player.pos)}">${player.pos}</span>
                      <span class="dev-name">${player.name}</span>
                      <span class="dev-age">${player.age} tuổi</span>
                    </div>
                    <div class="dev-potential-bar">
                      <div class="potential-fill" style="width: ${(player.overall / player.potential) * 100}%"></div>
                      <span>${player.overall} / ${player.potential} PA</span>
                    </div>
                  </div>
                  
                  <div class="dev-focus-section">
                    <label>Trọng tâm phát triển:</label>
                    <select class="focus-select" data-player="${player.id}">
                      <option value="">Tự động</option>
                      ${player.pos === 'GK' ? `
                        <option value="reflexes" ${focus?.attribute === 'reflexes' ? 'selected' : ''}>Phản xạ</option>
                        <option value="handling" ${focus?.attribute === 'handling' ? 'selected' : ''}>Bắt bóng</option>
                      ` : `
                        <option value="passing" ${focus?.attribute === 'passing' ? 'selected' : ''}>Chuyền bóng</option>
                        <option value="finishing" ${focus?.attribute === 'finishing' ? 'selected' : ''}>Dứt điểm</option>
                        <option value="tackling" ${focus?.attribute === 'tackling' ? 'selected' : ''}>Tắc bóng</option>
                        <option value="pace" ${focus?.attribute === 'pace' ? 'selected' : ''}>Tốc độ</option>
                        <option value="strength" ${focus?.attribute === 'strength' ? 'selected' : ''}>Sức mạnh</option>
                        <option value="vision" ${focus?.attribute === 'vision' ? 'selected' : ''}>Nhãn quan</option>
                      `}
                    </select>
                  </div>
                  
                  <div class="dev-status">
                    <div class="status-item">
                      <span class="status-label">Thể lực</span>
                      <div class="status-bar">
                        <div class="status-fill ${player.fitness < 60 ? 'warning' : ''}" style="width: ${player.fitness}%"></div>
                      </div>
                      <span class="status-value">${Math.round(player.fitness)}%</span>
                    </div>
                    <div class="status-item">
                      <span class="status-label">Sharpness</span>
                      <div class="status-bar">
                        <div class="status-fill" style="width: ${player.matchSharpness || 80}%"></div>
                      </div>
                      <span class="status-value">${Math.round(player.matchSharpness || 80)}%</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Training Report -->
        <div class="training-report card">
          <h3>📊 Báo cáo huấn luyện 7 ngày qua</h3>
          <div class="report-stats">
            <div class="report-stat">
              <div class="stat-number">${Math.floor(Math.random() * 15) + 5}</div>
              <div class="stat-label">Lần tiến bộ</div>
            </div>
            <div class="report-stat">
              <div class="stat-number">${players.filter(p => p.fitness > 90).length}</div>
              <div class="stat-label">Cầu thủ sung sức</div>
            </div>
            <div class="report-stat">
              <div class="stat-number">${players.filter(p => p.potential - p.overall > 10).length}</div>
              <div class="stat-label">Tiềm năng phát triển</div>
            </div>
          </div>
          
          <div class="recent-improvements">
            <h4>Tiến bộ gần đây</h4>
            ${generateMockImprovements(players)}
          </div>
        </div>
      </div>

      <style>
        .training-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 20px;
        }
        
        @media (max-width: 1024px) {
          .training-container {
            grid-template-columns: 1fr;
          }
        }
        
        .card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .card-header h3 {
          margin: 0;
          color: #f8fafc;
          font-size: 1.1rem;
        }
        
        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }
        
        .schedule-day {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          padding: 12px 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        
        .schedule-day:hover, .schedule-day.selected {
          border-color: #00ff88;
          background: rgba(0, 255, 136, 0.1);
        }
        
        .day-label {
          font-weight: 600;
          color: #94a3b8;
          font-size: 0.85rem;
          margin-bottom: 8px;
        }
        
        .training-type {
          font-size: 1.2rem;
          margin-bottom: 8px;
        }
        
        .day-type-select {
          width: 100%;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          border-radius: 4px;
          padding: 4px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        
        .rest-day {
          color: #64748b;
          font-size: 0.85rem;
        }
        
        .intensity-options {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        
        .intensity-option {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        
        .intensity-option:hover, .intensity-option.selected {
          border-color: #00ff88;
          background: rgba(0, 255, 136, 0.1);
        }
        
        .intensity-name {
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 8px;
        }
        
        .intensity-stats {
          font-size: 0.8rem;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .players-dev-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .player-dev-card {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #64748b;
        }
        
        .player-dev-card.high-potential {
          border-left-color: #00ff88;
        }
        
        .player-dev-card.good-potential {
          border-left-color: #fbbf24;
        }
        
        .dev-player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .dev-player-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .dev-pos {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }
        
        .dev-name {
          font-weight: 600;
          color: #f8fafc;
        }
        
        .dev-age {
          color: #64748b;
          font-size: 0.85rem;
        }
        
        .dev-potential-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 12px;
          padding: 4px 12px;
          font-size: 0.8rem;
        }
        
        .potential-fill {
          height: 6px;
          background: linear-gradient(90deg, #00ff88, #fbbf24);
          border-radius: 3px;
          transition: width 0.3s;
        }
        
        .dev-focus-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .dev-focus-section label {
          color: #94a3b8;
          font-size: 0.85rem;
        }
        
        .focus-select {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 0.85rem;
        }
        
        .dev-status {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-label {
          font-size: 0.8rem;
          color: #64748b;
          min-width: 60px;
        }
        
        .status-bar {
          flex: 1;
          height: 6px;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .status-fill {
          height: 100%;
          background: #00ff88;
          border-radius: 3px;
          transition: width 0.3s;
        }
        
        .status-fill.warning {
          background: #ef4444;
        }
        
        .status-value {
          font-size: 0.8rem;
          color: #94a3b8;
          min-width: 35px;
          text-align: right;
        }
        
        .report-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .report-stat {
          text-align: center;
          padding: 16px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #00ff88;
        }
        
        .stat-label {
          font-size: 0.85rem;
          color: #94a3b8;
        }
        
        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          margin-left: 8px;
        }
        
        .btn-save-schedule {
          background: #00ff88;
          color: #0f172a;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .filter-controls {
          display: flex;
          gap: 12px;
        }
        
        .filter-controls select {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.85rem;
        }
        
        .recent-improvements {
          margin-top: 20px;
        }
        
        .recent-improvements h4 {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-bottom: 12px;
        }
        
        .improvement-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .improvement-player {
          font-weight: 500;
          color: #f8fafc;
        }
        
        .improvement-attr {
          color: #00ff88;
          font-size: 0.85rem;
        }
        
        .improvement-value {
          margin-left: auto;
          color: #00ff88;
          font-weight: 600;
        }
      </style>
    `;
    
    attachListeners();
  }

  function getTrainingIcon(type) {
    const icons = {
      technical: '⚽',
      physical: '💪',
      mental: '🧠',
      tactical: '📋',
      goalkeeping: '🧤',
      match_preparation: '🏆',
      rest: '☕'
    };
    return icons[type] || '⚽';
  }

  function getTrainingName(type) {
    const names = {
      technical: 'Kỹ thuật',
      physical: 'Thể lực',
      mental: 'Tinh thần',
      tactical: 'Chiến thuật',
      goalkeeping: 'Thủ môn',
      match_preparation: 'Chuẩn bị',
      rest: 'Nghỉ'
    };
    return names[type] || type;
  }

  function getPosColor(pos) {
    const colors = {
      GK: '#ef4444', CB: '#3b82f6', LB: '#60a5fa', RB: '#60a5fa',
      CM: '#10b981', CAM: '#34d399', CDM: '#059669',
      LW: '#f59e0b', RW: '#f59e0b', ST: '#f97316'
    };
    return colors[pos] || '#64748b';
  }

  function generateMockImprovements(players) {
    const improvements = [];
    const attrs = ['Passing', 'Finishing', 'Tackling', 'Pace', 'Vision', 'Strength'];
    
    for (let i = 0; i < 5; i++) {
      const player = players[Math.floor(Math.random() * players.length)];
      if (player) {
        improvements.push({
          player: player.name,
          attr: attrs[Math.floor(Math.random() * attrs.length)],
          value: (0.1 + Math.random() * 0.4).toFixed(1)
        });
      }
    }
    
    return improvements.map(imp => `
      <div class="improvement-item">
        <span class="improvement-player">${imp.player}</span>
        <span class="improvement-attr">${imp.attr}</span>
        <span class="improvement-value">+${imp.value}</span>
      </div>
    `).join('');
  }

  function attachListeners() {
    // Day selection
    container.querySelectorAll('.schedule-day').forEach(day => {
      addListener(day, 'click', () => {
        selectedDay = day.dataset.day;
        draw();
      });
    });

    // Training type change
    container.querySelectorAll('.day-type-select').forEach(select => {
      addListener(select, 'change', (e) => {
        const day = e.target.dataset.day;
        const type = e.target.value;
        // Would update schedule in trainingManager
        console.log(`Set ${day} to ${type}`);
      });
    });

    // Intensity selection
    container.querySelectorAll('.intensity-option').forEach(opt => {
      addListener(opt, 'click', () => {
        selectedIntensity = opt.dataset.intensity;
        draw();
      });
    });

    // Focus selection
    container.querySelectorAll('.focus-select').forEach(select => {
      addListener(select, 'change', (e) => {
        const playerId = parseInt(e.target.dataset.player);
        const attribute = e.target.value;
        // Would set focus in trainingManager
        console.log(`Set focus for player ${playerId} to ${attribute}`);
      });
    });
  }

  draw();
  return { destroy: removeListeners };
}
