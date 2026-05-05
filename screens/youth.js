// ============================================================
// YOUTH ACADEMY SCREEN - Young Player Development
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";
import { YouthAcademy } from "../engine/trainingSystem.js";

export function renderYouth(container, router) {
  let listeners = [];
  let academy = gameState.youthAcademy || new YouthAcademy(gameState);
  
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
    const status = academy.getStatus();
    const youthPlayers = gameState.players.filter(p => p.isYouth && p.teamId === gameState.playerTeamId);
    
    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">🌟 Học Viện Trẻ</h1>
          <p class="screen-subtitle">Phát hiện và phát triển tài năng trẻ cho tương lai</p>
        </div>
        <div class="academy-status">
          <div class="level-badge">Cấp ${status.level}</div>
          <div class="intake-countdown">
            ${status.daysUntilIntake > 0 
              ? `⏰ ${status.daysUntilIntake} ngày đến khóa tuyển` 
              : '<button class="btn-intake">🎯 Tuyển sinh ngay!</button>'}
          </div>
        </div>
      </div>

      <div class="youth-container">
        <!-- Academy Overview -->
        <div class="academy-overview card">
          <div class="academy-header">
            <h3>🏫 Tổng quan học viện</h3>
            ${status.upgradeCost ? `
              <button class="btn-upgrade" onclick="upgradeAcademy()">
                ⬆️ Nâng cấp (${formatCurrency(status.upgradeCost)})
              </button>
            ` : '<span class="max-level">Đã đạt cấp tối đa</span>'}
          </div>
          
          <div class="academy-stats">
            <div class="academy-stat">
              <div class="stat-icon">📊</div>
              <div class="stat-info">
                <div class="stat-value">${status.level}/5</div>
                <div class="stat-label">Cấp độ học viện</div>
              </div>
            </div>
            <div class="academy-stat">
              <div class="stat-icon">👶</div>
              <div class="stat-info">
                <div class="stat-value">${status.currentYouth}</div>
                <div class="stat-label">Cầu thủ trẻ hiện tại</div>
              </div>
            </div>
            <div class="academy-stat">
              <div class="stat-icon">🎓</div>
              <div class="stat-info">
                <div class="stat-value">${status.graduatesCount}</div>
                <div class="stat-label">Tốt nghiệp</div>
              </div>
            </div>
            <div class="academy-stat">
              <div class="stat-icon">⭐</div>
              <div class="stat-info">
                <div class="stat-value">${status.level >= 4 ? 'Cao' : status.level >= 2 ? 'TB' : 'Thấp'}</div>
                <div class="stat-label">Chất lượng đào tạo</div>
              </div>
            </div>
          </div>

          <div class="intake-timeline">
            <h4>📅 Lịch tuyển sinh tiếp theo</h4>
            <div class="timeline-info">
              <div class="timeline-date">${status.nextIntake.toLocaleDateString('vi-VN')}</div>
              <div class="timeline-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.max(0, 100 - (status.daysUntilIntake / 365 * 100))}%"></div>
                </div>
                <span>${status.daysUntilIntake} ngày</span>
              </div>
            </div>
            <p class="intake-note">
              Khóa tuyển sẽ mang đến 3-5 cầu thủ trẻ (15-17 tuổi) với tiềm năng phù hợp cấp độ học viện.
            </p>
          </div>
        </div>

        <!-- Current Youth Players -->
        <div class="youth-players card">
          <div class="card-header">
            <h3>👶 Cầu thủ trẻ hiện tại (${youthPlayers.length})</h3>
            <div class="view-toggle">
              <button class="toggle-btn active" data-view="grid">⊞</button>
              <button class="toggle-btn" data-view="list">☰</button>
            </div>
          </div>

          <div class="youth-list">
            ${youthPlayers.length === 0 
              ? `<div class="empty-youth">
                  <div class="empty-icon">🌱</div>
                  <p>Chưa có cầu thủ trẻ nào</p>
                  <span>Đợt tuyển sinh tiếp theo sẽ bắt đầu sau ${status.daysUntilIntake} ngày</span>
                </div>`
              : youthPlayers.map(player => `
                <div class="youth-card" data-player-id="${player.id}">
                  <div class="youth-header">
                    <div class="youth-avatar">👶</div>
                    <div class="youth-info">
                      <div class="youth-name">${player.name}</div>
                      <div class="youth-meta">
                        <span class="youth-pos" style="background: ${getPosColor(player.pos)}">${player.pos}</span>
                        <span class="youth-age">${player.age} tuổi</span>
                        <span class="intake-year">Khóa ${player.graduationYear}</span>
                      </div>
                    </div>
                    <div class="potential-badge ${getPotentialClass(player.potential)}">
                      PA: ${player.potential}
                    </div>
                  </div>

                  <div class="youth-attributes">
                    <div class="attr-row">
                      <span>CA</span>
                      <div class="attr-bar">
                        <div class="attr-fill ca-fill" style="width: ${player.overall}%"></div>
                      </div>
                      <span>${player.overall}</span>
                    </div>
                    <div class="attr-row">
                      <span>PA</span>
                      <div class="attr-bar">
                        <div class="attr-fill pa-fill" style="width: ${player.potential}%"></div>
                      </div>
                      <span>${player.potential}</span>
                    </div>
                  </div>

                  <div class="youth-progress">
                    <div class="progress-header">
                      <span>Tiến độ phát triển</span>
                      <span class="progress-percent">${Math.round((player.overall / player.potential) * 100)}%</span>
                    </div>
                    <div class="overall-progress">
                      <div class="overall-fill" style="width: ${(player.overall / player.potential) * 100}%"></div>
                    </div>
                  </div>

                  <div class="youth-actions">
                    <button class="btn-view" data-action="view" data-player="${player.id}">
                      👁️ Xem chi tiết
                    </button>
                    <button class="btn-promote ${player.age >= 17 ? '' : 'disabled'}" 
                            data-action="promote" data-player="${player.id}"
                            ${player.age < 17 ? 'disabled' : ''}>
                      ⬆️ Đôn lên đội 1
                    </button>
                    <button class="btn-sell" data-action="sell" data-player="${player.id}">
                      💰 Bán (€${(player.value / 1000000).toFixed(1)}M)
                    </button>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Academy History -->
        <div class="academy-history card">
          <h3>📜 Lịch sử học viện</h3>
          <div class="history-list">
            ${academy.graduates.slice(-5).map(grad => {
              const player = gameState.getPlayerById(grad.playerId);
              return player ? `
                <div class="history-item">
                  <div class="history-icon">🎓</div>
                  <div class="history-info">
                    <div class="history-player">${player.name}</div>
                    <div class="history-date">Tốt nghiệp năm ${grad.date.getFullYear()} - ${grad.age} tuổi</div>
                  </div>
                  <div class="history-status ${player.teamId === gameState.playerTeamId ? 'promoted' : 'left'}">
                    ${player.teamId === gameState.playerTeamId ? 'Đội 1' : 'Đã ra đi'}
                  </div>
                </div>
              ` : '';
            }).join('') || '<p class="no-history">Chưa có cầu thủ tốt nghiệp</p>'}
          </div>
        </div>

        <!-- Level Benefits -->
        <div class="level-benefits card">
          <h3>⭐ Quyền lợi từng cấp độ</h3>
          <div class="benefits-list">
            ${[
              { level: 1, cost: 0, benefit: 'PA 80-120, 3-5 cầu thủ/khóa' },
              { level: 2, cost: '500K', benefit: 'PA 90-140, tài năng tốt hơn' },
              { level: 3, cost: '2M', benefit: 'PA 100-160, wonderkid potential' },
              { level: 4, cost: '5M', benefit: 'PA 110-180, châu Âu quality' },
              { level: 5, cost: '10M', benefit: 'PA 120-200, world class potential' }
            ].map(b => `
              <div class="benefit-item ${b.level === status.level ? 'current' : ''} ${b.level < status.level ? 'unlocked' : ''}">
                <div class="benefit-level">Cấp ${b.level}</div>
                <div class="benefit-cost">${b.cost === 0 ? 'Miễn phí' : formatCurrency(parseCost(b.cost))}</div>
                <div class="benefit-desc">${b.benefit}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <style>
        .youth-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 20px;
        }

        @media (max-width: 1024px) {
          .youth-container {
            grid-template-columns: 1fr;
          }
        }

        .academy-status {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .level-badge {
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          color: #0f172a;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .intake-countdown {
          color: #94a3b8;
        }

        .btn-intake {
          background: #00ff88;
          color: #0f172a;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(0, 255, 136, 0); }
        }

        .card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .academy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .academy-header h3 {
          margin: 0;
          color: #f8fafc;
        }

        .btn-upgrade {
          background: #f59e0b;
          color: #0f172a;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .max-level {
          color: #00ff88;
          font-weight: 600;
        }

        .academy-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .academy-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
        }

        .stat-icon {
          font-size: 1.5rem;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #00ff88;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .intake-timeline {
          border-top: 1px solid rgba(148, 163, 184, 0.1);
          padding-top: 20px;
        }

        .intake-timeline h4 {
          margin: 0 0 12px 0;
          color: #f8fafc;
        }

        .timeline-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .timeline-date {
          font-weight: 600;
          color: #00ff88;
        }

        .timeline-progress {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: rgba(30, 41, 59, 0.8);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ff88, #00cc6a);
          border-radius: 4px;
          transition: width 0.3s;
        }

        .intake-note {
          color: #64748b;
          font-size: 0.9rem;
          margin-top: 12px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-header h3 {
          margin: 0;
          color: #f8fafc;
        }

        .view-toggle {
          display: flex;
          gap: 4px;
        }

        .toggle-btn {
          background: rgba(30, 41, 59, 0.5);
          border: none;
          color: #94a3b8;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
        }

        .toggle-btn.active {
          background: #00ff88;
          color: #0f172a;
        }

        .youth-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 500px;
          overflow-y: auto;
        }

        .empty-youth {
          text-align: center;
          padding: 40px;
          color: #64748b;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .youth-card {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
          padding: 16px;
          border-left: 4px solid #f59e0b;
        }

        .youth-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .youth-avatar {
          font-size: 2rem;
        }

        .youth-info {
          flex: 1;
        }

        .youth-name {
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 4px;
        }

        .youth-meta {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .youth-pos {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .youth-age, .intake-year {
          color: #64748b;
          font-size: 0.85rem;
        }

        .potential-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .potential-badge.exceptional {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .potential-badge.good {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .potential-badge.average {
          background: rgba(148, 163, 184, 0.2);
          color: #94a3b8;
        }

        .youth-attributes {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .attr-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
        }

        .attr-row span:first-child {
          color: #64748b;
          min-width: 30px;
        }

        .attr-bar {
          flex: 1;
          height: 6px;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
          overflow: hidden;
        }

        .attr-fill {
          height: 100%;
          border-radius: 3px;
        }

        .ca-fill {
          background: #3b82f6;
        }

        .pa-fill {
          background: #00ff88;
        }

        .youth-progress {
          margin-bottom: 12px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #94a3b8;
          margin-bottom: 6px;
        }

        .progress-percent {
          color: #00ff88;
          font-weight: 600;
        }

        .overall-progress {
          height: 8px;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
          overflow: hidden;
        }

        .overall-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #00ff88);
          border-radius: 4px;
          transition: width 0.3s;
        }

        .youth-actions {
          display: flex;
          gap: 8px;
        }

        .youth-actions button {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          border: none;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-view {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .btn-promote {
          background: #00ff88;
          color: #0f172a;
        }

        .btn-promote.disabled {
          background: rgba(100, 116, 139, 0.2);
          color: #64748b;
          cursor: not-allowed;
        }

        .btn-sell {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
        }

        .history-icon {
          font-size: 1.5rem;
        }

        .history-info {
          flex: 1;
        }

        .history-player {
          font-weight: 500;
          color: #f8fafc;
        }

        .history-date {
          font-size: 0.8rem;
          color: #64748b;
        }

        .history-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .history-status.promoted {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .history-status.left {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .no-history {
          color: #64748b;
          text-align: center;
          padding: 20px;
        }

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .benefit-item {
          display: grid;
          grid-template-columns: 80px 100px 1fr;
          gap: 16px;
          padding: 12px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          opacity: 0.5;
        }

        .benefit-item.current {
          opacity: 1;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid #00ff88;
        }

        .benefit-item.unlocked {
          opacity: 0.8;
        }

        .benefit-level {
          font-weight: 600;
          color: #f8fafc;
        }

        .benefit-cost {
          color: #f59e0b;
          font-weight: 500;
        }

        .benefit-desc {
          color: #94a3b8;
          font-size: 0.9rem;
        }
      </style>
    `;

    attachListeners();
  }

  function getPosColor(pos) {
    const colors = {
      GK: '#ef4444', CB: '#3b82f6', LB: '#60a5fa', RB: '#60a5fa',
      CM: '#10b981', CAM: '#34d399', CDM: '#059669',
      LW: '#f59e0b', RW: '#f59e0b', ST: '#f97316'
    };
    return colors[pos] || '#64748b';
  }

  function getPotentialClass(pa) {
    if (pa >= 85) return 'exceptional';
    if (pa >= 75) return 'good';
    return 'average';
  }

  function parseCost(costStr) {
    if (costStr === 'Miễn phí') return 0;
    if (costStr.includes('M')) return parseFloat(costStr) * 1000000;
    if (costStr.includes('K')) return parseFloat(costStr) * 1000;
    return 0;
  }

  function attachListeners() {
    // Promote buttons
    container.querySelectorAll('.btn-promote:not(.disabled)').forEach(btn => {
      addListener(btn, 'click', () => {
        const playerId = parseInt(btn.dataset.player);
        const result = academy.promotePlayer(playerId);
        if (result.success) {
          alert(result.message);
          draw();
        }
      });
    });

    // View player
    container.querySelectorAll('.btn-view').forEach(btn => {
      addListener(btn, 'click', () => {
        const playerId = btn.dataset.player;
        router.navigate(`player/${playerId}`);
      });
    });

    // Intake button
    const intakeBtn = container.querySelector('.btn-intake');
    if (intakeBtn) {
      addListener(intakeBtn, 'click', () => {
        const result = academy.generateYouthIntake();
        alert(`Khóa tuyển sinh hoàn tất! ${result.count} cầu thủ trẻ đã gia nhập học viện.`);
        draw();
      });
    }

    // Upgrade button
    const upgradeBtn = container.querySelector('.btn-upgrade');
    if (upgradeBtn) {
      addListener(upgradeBtn, 'click', () => {
        const result = academy.upgradeLevel();
        alert(result.message);
        if (result.success) draw();
      });
    }
  }

  draw();
  return { destroy: removeListeners };
}
