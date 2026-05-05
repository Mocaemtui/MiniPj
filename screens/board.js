// BOARD & OBJECTIVES SCREEN
import { gameState, formatCurrency } from "../engine/gameState.js";
import { OBJECTIVE_TYPES, OBJECTIVE_PRIORITY } from "../engine/boardSystem.js";

export function renderBoard(container, router) {
  let listeners = [];
  let currentTab = 'objectives'; // objectives, meetings, status

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
    const board = gameState.boardSystem;
    const objectives = board.objectives || [];
    const status = board.getJobStatus();
    const meetings = board.boardMeetings || [];

    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">🏛️ Ban Lãnh Đạo</h1>
          <p class="screen-subtitle">Mục tiêu và đánh giá hiệu quả</p>
        </div>
        <div class="job-status ${status.risk.toLowerCase()}">
          <span class="status-indicator"></span>
          <span>${getRiskText(status.risk)}</span>
        </div>
      </div>

      <div class="board-container">
        <div class="board-tabs">
          <button class="tab-btn ${currentTab === 'objectives' ? 'active' : ''}" data-tab="objectives">
            🎯 Mục tiêu (${objectives.length})
          </button>
          <button class="tab-btn ${currentTab === 'status' ? 'active' : ''}" data-tab="status">
            📊 Trạng thái
          </button>
          <button class="tab-btn ${currentTab === 'meetings' ? 'active' : ''}" data-tab="meetings">
            📅 Họp (${meetings.length})
          </button>
        </div>

        ${currentTab === 'objectives' ? renderObjectives(objectives, board) : ''}
        ${currentTab === 'status' ? renderStatus(status, board) : ''}
        ${currentTab === 'meetings' ? renderMeetings(meetings) : ''}
      </div>

      <style>
        .board-container { padding: 20px; }
        
        .board-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
          padding-bottom: 16px;
        }

        .tab-btn {
          background: rgba(30, 41, 59, 0.5);
          border: none;
          color: #94a3b8;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .tab-btn.active {
          background: #00ff88;
          color: #0f172a;
        }

        .job-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
        }

        .job-status.normal {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .job-status.high {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .job-status.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .objectives-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .objective-card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 20px;
          border-left: 4px solid #00ff88;
        }

        .objective-card.critical { border-left-color: #ef4444; }
        .objective-card.high { border-left-color: #fbbf24; }
        .objective-card.medium { border-left-color: #3b82f6; }

        .obj-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .obj-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f8fafc;
        }

        .obj-priority {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .obj-priority.critical {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .obj-priority.high {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .obj-description {
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .obj-progress {
          margin-bottom: 12px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .progress-bar {
          height: 8px;
          background: rgba(30, 41, 59, 0.8);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .progress-fill.completed { background: #00ff88; }
        .progress-fill.ontrack { background: #3b82f6; }
        .progress-fill.atrisk { background: #fbbf24; }

        .obj-rewards {
          display: flex;
          gap: 16px;
          font-size: 0.85rem;
        }

        .reward {
          color: #00ff88;
        }

        .penalty {
          color: #ef4444;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .status-card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 20px;
        }

        .status-card h3 {
          margin: 0 0 16px 0;
          color: #f8fafc;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .metric:last-child {
          border-bottom: none;
        }

        .metric-bar {
          width: 100px;
          height: 6px;
          background: rgba(30, 41, 59, 0.8);
          border-radius: 3px;
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          border-radius: 3px;
        }

        .warning-list {
          margin-top: 12px;
        }

        .warning-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: rgba(251, 191, 36, 0.1);
          border-radius: 6px;
          margin-bottom: 8px;
          color: #fbbf24;
        }

        .meetings-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .meeting-card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 16px;
        }

        .meeting-date {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 8px;
        }

        .meeting-reason {
          font-weight: 500;
          color: #f8fafc;
          margin-bottom: 8px;
        }

        .meeting-outcome {
          font-size: 0.9rem;
          color: #94a3b8;
        }
      </style>
    `;

    attachListeners();
  }

  function renderObjectives(objectives, board) {
    if (objectives.length === 0) {
      return '<div class="no-data">Chưa có mục tiêu cho mùa giải này</div>';
    }

    const reviews = board.reviewObjectives?.() || [];

    return `
      <div class="objectives-list">
        ${objectives.map((obj, i) => {
          const review = reviews[i] || { progress: 50, status: 'on_track' };
          return `
            <div class="objective-card ${obj.priority.weight === 3 ? 'critical' : obj.priority.weight === 2 ? 'high' : 'medium'}">
              <div class="obj-header">
                <span class="obj-title">${obj.title}</span>
                <span class="obj-priority ${obj.priority.weight === 3 ? 'critical' : obj.priority.weight === 2 ? 'high' : 'low'}">
                  ${obj.priority.label}
                </span>
              </div>
              <div class="obj-description">${obj.description}</div>
              <div class="obj-progress">
                <div class="progress-header">
                  <span>Tiến độ</span>
                  <span>${Math.round(review.progress)}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${review.status}" style="width: ${review.progress}%"></div>
                </div>
              </div>
              <div class="obj-rewards">
                <span class="reward">✓ Hoàn thành: +${obj.reward.reputation} danh tiếng, +${obj.reward.job_security}% an toàn</span>
                <span class="penalty">✗ Thất bại: ${obj.penalty.reputation} danh tiếng, ${obj.penalty.job_security}% an toàn</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderStatus(status, board) {
    return `
      <div class="status-grid">
        <div class="status-card">
          <h3>📊 Chỉ số HLV</h3>
          <div class="metric">
            <span>Danh tiếng</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${status.reputation}%; background: #00ff88;"></div>
            </div>
            <span>${status.reputation}/100</span>
          </div>
          <div class="metric">
            <span>An toàn công việc</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${status.security}%; background: ${status.security > 50 ? '#00ff88' : status.security > 30 ? '#fbbf24' : '#ef4444'};"></div>
            </div>
            <span>${status.security}/100</span>
          </div>
        </div>

        <div class="status-card">
          <h3>⚠️ Cảnh báo</h3>
          ${status.warnings.length > 0 ? `
            <div class="warning-list">
              ${status.warnings.map(w => `
                <div class="warning-item">⚠️ ${w}</div>
              `).join('')}
            </div>
          ` : '<p style="color: #64748b;">Không có cảnh báo</p>'}
        </div>
      </div>
    `;
  }

  function renderMeetings(meetings) {
    if (meetings.length === 0) {
      return '<div class="no-data">Chưa có cuộc họp nào</div>';
    }

    return `
      <div class="meetings-list">
        ${meetings.map(m => `
          <div class="meeting-card">
            <div class="meeting-date">${new Date(m.date).toLocaleDateString('vi-VN')}</div>
            <div class="meeting-reason">${getMeetingReason(m.reason)}</div>
            ${m.decisions.length > 0 ? `
              <div class="meeting-outcome">
                ${m.decisions.map(d => `• ${d.message}`).join('<br>')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function getRiskText(risk) {
    const texts = {
      'NORMAL': 'An toàn',
      'HIGH': 'Rủi ro cao',
      'CRITICAL': 'Nguy cấp'
    };
    return texts[risk] || risk;
  }

  function getMeetingReason(reason) {
    const reasons = {
      'regular': 'Họp định kỳ',
      'poor_performance': 'Hiệu quả kém',
      'end_of_season': 'Tổng kết mùa giải',
      'transfer_approval': 'Phê duyệt chuyển nhượng'
    };
    return reasons[reason] || reason;
  }

  function attachListeners() {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      addListener(btn, 'click', () => {
        currentTab = btn.dataset.tab;
        draw();
      });
    });
  }

  draw();
  return { destroy: removeListeners };
}
