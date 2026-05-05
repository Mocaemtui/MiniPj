// ============================================================
// TRANSFER SCREEN V2 - Full Transfer System Integration
// Uses ScoutingManager, ClubAI, TransferOffer, DeadlineDayManager
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";
import { POS_COLOR } from "../data/constants.js";
import { 
  TransferOffer, 
  TRANSFER_STATUS, 
  SQUAD_STATUS,
  OFFER_RESPONSE 
} from "../data/transferSystem.js";

export function renderTransfer(container, router) {
  let listeners = [];
  let selectedPlayer = null;
  let viewMode = 'market'; // market, scouting, offers, deadline
  let searchQuery = '';
  let filterPos = 'ALL';
  let sortBy = 'overall';
  let offerInProgress = null;

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
    const fin = gameState.getMyFinance();
    const pendingOffers = gameState.activeTransferOffers || [];
    const isDeadlineDay = gameState.checkDeadlineDay?.() || false;
    
    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">🔄 Thị Trường Chuyển Nhượng</h1>
          <p class="screen-subtitle">
            Ngân sách: <strong style="color:#00ff88">${formatCurrency(fin?.balance || 0)}</strong>
            ${isDeadlineDay ? '<span class="deadline-badge">🔥 DEADLINE DAY</span>' : ''}
          </p>
        </div>
        <div class="transfer-tabs">
          <button class="tab-btn ${viewMode === 'market' ? 'active' : ''}" data-view="market">
            🔍 Thị trường
          </button>
          <button class="tab-btn ${viewMode === 'scouting' ? 'active' : ''}" data-view="scouting">
            👁️ Trinh sát ${getScoutingCount() > 0 ? `<span class="badge">${getScoutingCount()}</span>` : ''}
          </button>
          <button class="tab-btn ${viewMode === 'offers' ? 'active' : ''}" data-view="offers">
            📋 Đề nghị ${pendingOffers.length > 0 ? `<span class="badge">${pendingOffers.length}</span>` : ''}
          </button>
          ${isDeadlineDay ? `
            <button class="tab-btn deadline ${viewMode === 'deadline' ? 'active' : ''}" data-view="deadline">
              ⏰ Deadline
            </button>
          ` : ''}
        </div>
      </div>

      <div class="transfer-container">
        ${viewMode === 'market' ? renderMarketView(fin) : ''}
        ${viewMode === 'scouting' ? renderScoutingView() : ''}
        ${viewMode === 'offers' ? renderOffersView(pendingOffers) : ''}
        ${viewMode === 'deadline' && isDeadlineDay ? renderDeadlineView() : ''}
      </div>

      ${selectedPlayer ? renderPlayerModal() : ''}
      ${offerInProgress ? renderOfferModal() : ''}

      <style>
        .transfer-tabs {
          display: flex;
          gap: 8px;
        }

        .tab-btn {
          background: rgba(30, 41, 59, 0.5);
          border: none;
          color: #94a3b8;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          position: relative;
        }

        .tab-btn:hover {
          background: rgba(30, 41, 59, 0.8);
          color: #f8fafc;
        }

        .tab-btn.active {
          background: #00ff88;
          color: #0f172a;
        }

        .tab-btn.deadline {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          animation: pulse 2s infinite;
        }

        .tab-btn.deadline.active {
          background: #ef4444;
          color: white;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }

        .badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .deadline-badge {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          margin-left: 12px;
          animation: pulse 2s infinite;
        }

        .transfer-container {
          padding: 20px;
        }

        .transfer-filters {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-box input {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #f8fafc;
          padding: 10px 16px;
          border-radius: 8px;
          width: 300px;
        }

        .filter-select {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #f8fafc;
          padding: 10px 16px;
          border-radius: 8px;
        }

        .pos-filters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .pos-filter {
          background: rgba(30, 41, 59, 0.5);
          border: none;
          color: #94a3b8;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .pos-filter.active {
          background: #00ff88;
          color: #0f172a;
        }

        .transfer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .transfer-card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          cursor: pointer;
          transition: all 0.2s;
        }

        .transfer-card:hover {
          border-color: #00ff88;
          transform: translateY(-2px);
        }

        .tc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .tc-pos {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .tc-interest {
          font-size: 0.75rem;
          color: #64748b;
        }

        .tc-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 4px;
        }

        .tc-team {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 12px;
        }

        .tc-attrs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .tc-attr {
          text-align: center;
          padding: 8px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 6px;
        }

        .tc-attr-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #00ff88;
        }

        .tc-attr-label {
          font-size: 0.75rem;
          color: #64748b;
        }

        .tc-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }

        .tc-value {
          font-weight: 600;
          color: #fbbf24;
        }

        .tc-scout-status {
          font-size: 0.8rem;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .tc-scout-status.none {
          background: rgba(100, 116, 139, 0.2);
          color: #64748b;
        }

        .tc-scout-status.scouted {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .tc-scout-status.full {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          border-radius: 16px;
          padding: 24px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
        }

        .modal-close {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .player-detail-header {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
        }

        .player-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
        }

        .player-info h3 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          color: #f8fafc;
        }

        .player-meta {
          display: flex;
          gap: 16px;
          color: #94a3b8;
          margin-bottom: 16px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-action {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-scout {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .btn-offer {
          background: #00ff88;
          color: #0f172a;
        }

        .btn-offer:disabled {
          background: rgba(100, 116, 139, 0.3);
          color: #64748b;
          cursor: not-allowed;
        }

        .scouting-section, .offer-section {
          margin-top: 24px;
          padding: 20px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 12px;
        }

        .fog-attributes {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .fog-attr {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 6px;
        }

        .fog-attr.known {
          color: #f8fafc;
        }

        .fog-attr.unknown {
          color: #64748b;
          font-style: italic;
        }

        .offer-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .offer-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .offer-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .offer-field label {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .offer-field input, .offer-field select {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #f8fafc;
          padding: 10px;
          border-radius: 6px;
        }

        .offer-total {
          text-align: center;
          padding: 16px;
          background: rgba(0, 255, 136, 0.1);
          border-radius: 8px;
          margin: 16px 0;
        }

        .offer-total-label {
          color: #94a3b8;
        }

        .offer-total-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #00ff88;
        }

        .offer-history {
          margin-top: 20px;
        }

        .offer-history-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .offer-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .offer-status.pending {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .offer-status.accepted {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .offer-status.rejected {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .deadline-panel {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 24px;
        }

        .deadline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .countdown-timer {
          font-size: 2rem;
          font-weight: 700;
          color: #ef4444;
          font-family: monospace;
        }

        .panic-level {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .panic-bar {
          width: 200px;
          height: 12px;
          background: rgba(30, 41, 59, 0.8);
          border-radius: 6px;
          overflow: hidden;
        }

        .panic-fill {
          height: 100%;
          background: linear-gradient(90deg, #fbbf24, #ef4444);
          border-radius: 6px;
          transition: width 0.3s;
        }
      </style>
    `;

    attachListeners();
  }

  function renderMarketView(fin) {
    const players = getFilteredPlayers();
    
    return `
      <div class="transfer-filters">
        <div class="search-box">
          <input type="text" id="search-player" placeholder="🔍 Tìm cầu thủ..." value="${searchQuery}">
        </div>
        
        <div class="pos-filters">
          ${['ALL', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'].map(pos => `
            <button class="pos-filter ${filterPos === pos ? 'active' : ''}" data-pos="${pos}">${pos}</button>
          `).join('')}
        </div>
        
        <select class="filter-select" id="sort-players">
          <option value="overall" ${sortBy === 'overall' ? 'selected' : ''}>Tổng điểm</option>
          <option value="value" ${sortBy === 'value' ? 'selected' : ''}>Giá trị</option>
          <option value="potential" ${sortBy === 'potential' ? 'selected' : ''}>Tiềm năng</option>
          <option value="age" ${sortBy === 'age' ? 'selected' : ''}>Tuổi (trẻ→già)</option>
        </select>
      </div>

      <div class="transfer-grid">
        ${players.map(p => {
          const team = gameState.getTeamById(p.teamId);
          const scoutReport = gameState.scoutingManager?.getScoutingReport(p.id);
          const canAfford = (fin?.balance || 0) >= (p.value || 0);
          const interest = getTransferInterest(p);
          
          return `
            <div class="transfer-card ${!canAfford ? 'cant-afford' : ''}" data-player-id="${p.id}">
              <div class="tc-header">
                <span class="tc-pos" style="background:${POS_COLOR[p.pos]}22;color:${POS_COLOR[p.pos]}">${p.pos}</span>
                <span class="tc-interest">${interest}</span>
              </div>
              <div class="tc-name">${p.name}</div>
              <div class="tc-team">${team?.name || 'Unknown'}</div>
              
              <div class="tc-attrs">
                <div class="tc-attr">
                  <div class="tc-attr-value">${p.overall}</div>
                  <div class="tc-attr-label">OVR</div>
                </div>
                <div class="tc-attr">
                  <div class="tc-attr-value">${p.potential}</div>
                  <div class="tc-attr-label">POT</div>
                </div>
                <div class="tc-attr">
                  <div class="tc-attr-value">${p.age}</div>
                  <div class="tc-attr-label">AGE</div>
                </div>
              </div>
              
              <div class="tc-footer">
                <span class="tc-value">${formatCurrency(p.value || 0)}</span>
                <span class="tc-scout-status ${getScoutStatusClass(scoutReport)}">
                  ${getScoutStatusText(scoutReport)}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderScoutingView() {
    const reports = gameState.scoutingManager?.getAllReports?.() || [];
    
    return `
      <div class="scouting-container">
        <div class="scouting-header">
          <h3>👁️ Báo cáo trinh sát (${reports.length})</h3>
          <button class="btn-scout-new" onclick="showScoutAssignment()">
            ➕ Giao nhiệm vụ mới
          </button>
        </div>
        
        <div class="scouting-grid">
          ${reports.map(report => {
            const player = gameState.getPlayerById(report.playerId);
            if (!player) return '';
            
            return `
              <div class="scouting-card">
                <div class="sc-player-header">
                  <span class="sc-pos" style="background:${POS_COLOR[player.pos]}22;color:${POS_COLOR[player.pos]}">${player.pos}</span>
                  <span class="sc-completion">${Math.round(report.completion * 100)}%</span>
                </div>
                <div class="sc-name">${player.name}</div>
                <div class="sc-team">${gameState.getTeamById(player.teamId)?.name}</div>
                
                <div class="sc-attrs">
                  ${renderScoutedAttributes(report, player)}
                </div>
                
                <div class="sc-recommendation">
                  <strong>Đề xuất:</strong> ${report.recommendation || 'Chưa có'}
                </div>
              </div>
            `;
          }).join('') || '<p class="no-reports">Chưa có báo cáo trinh sát</p>'}
        </div>
      </div>
    `;
  }

  function renderOffersView(pendingOffers) {
    return `
      <div class="offers-container">
        <h3>📋 Đề nghị đang chờ xử lý (${pendingOffers.length})</h3>
        
        <div class="offers-list">
          ${pendingOffers.map(offer => {
            const player = gameState.getPlayerById(offer.playerId);
            const fromTeam = gameState.getTeamById(offer.fromClubId);
            
            return `
              <div class="offer-card ${offer.response}">
                <div class="offer-header">
                  <div class="offer-player">
                    <span class="offer-pos" style="background:${POS_COLOR[player?.pos]}22;color:${POS_COLOR[player?.pos]}">${player?.pos}</span>
                    <span class="offer-name">${player?.name}</span>
                  </div>
                  <span class="offer-status ${offer.response}">${getOfferStatusText(offer.response)}</span>
                </div>
                
                <div class="offer-details">
                  <div class="offer-from">Từ: ${fromTeam?.name || 'Unknown'}</div>
                  <div class="offer-value">
                    <span>Giá trị đề nghị:</span>
                    <strong>${formatCurrency(offer.financial?.totalValue || 0)}</strong>
                  </div>
                  ${offer.financial?.installments?.length > 0 ? `
                    <div class="offer-installments">
                      Trả góp: ${offer.financial.installments.length} đợt
                    </div>
                  ` : ''}
                </div>
                
                <div class="offer-actions">
                  ${offer.response === 'pending' ? `
                    <button class="btn-accept" data-offer="${offer.id}">✓ Chấp nhận</button>
                    <button class="btn-reject" data-offer="${offer.id}">✗ Từ chối</button>
                    <button class="btn-counter" data-offer="${offer.id}">⇄ Phản đề nghị</button>
                  ` : `
                    <span class="offer-resolved">Đã xử lý</span>
                  `}
                </div>
              </div>
            `;
          }).join('') || '<p class="no-offers">Không có đề nghị nào đang chờ</p>'}
        </div>
      </div>
    `;
  }

  function renderDeadlineView() {
    const status = gameState.getDeadlineDayStatus?.() || { hoursRemaining: 24, panicLevel: 0 };
    
    return `
      <div class="deadline-panel">
        <div class="deadline-header">
          <div>
            <h2>🔥 DEADLINE DAY</h2>
            <p>Thị trường chuyển nhượng sẽ đóng sau:</p>
          </div>
          <div class="countdown-timer">${formatHours(status.hoursRemaining || 24)}</div>
        </div>
        
        <div class="panic-level">
          <span>Mức độ hỗn loạn:</span>
          <div class="panic-bar">
            <div class="panic-fill" style="width: ${(status.panicLevel || 0)}%"></div>
          </div>
          <span>${status.panicLevel || 0}%</span>
        </div>
        
        <div class="deadline-deals">
          <h4>💥 Giao dịch gần đây</h4>
          <div class="deals-list">
            ${(status.hourlyEvents || []).map(event => `
              <div class="deal-item">
                <span class="deal-time">${event.hour}:00</span>
                <span class="deal-text">${event.description}</span>
              </div>
            `).join('') || '<p>Chưa có giao dịch nào hôm nay</p>'}
          </div>
        </div>
        
        <div class="deadline-tips">
          <h4>💡 Mẹo Deadline Day</h4>
          <ul>
            <li>Giá cầu thủ tăng 20-50% do áp lực thời gian</li>
            <li>Đại diện cầu thủ đòi lương cao hơn</li>
            <li>CLB dễ chấp nhận đề nghị hơn trong giờ cuối</li>
          </ul>
        </div>
      </div>
    `;
  }

  function renderPlayerModal() {
    const player = selectedPlayer;
    const team = gameState.getTeamById(player.teamId);
    const scoutReport = gameState.scoutingManager?.getScoutingReport(player.id);
    const canAfford = (gameState.getMyFinance()?.balance || 0) >= (player.value || 0);
    
    return `
      <div class="modal-overlay" id="player-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Chi tiết cầu thủ</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          
          <div class="player-detail-header">
            <div class="player-avatar">${player.name.charAt(0)}</div>
            <div class="player-info">
              <h3>${player.name}</h3>
              <div class="player-meta">
                <span>${player.pos}</span>
                <span>${player.age} tuổi</span>
                <span>${team?.name}</span>
              </div>
              <div class="action-buttons">
                <button class="btn-action btn-scout" onclick="scoutPlayer(${player.id})">
                  👁️ Trinh sát
                </button>
                <button class="btn-action btn-offer" ${!canAfford ? 'disabled' : ''} onclick="makeOffer(${player.id})">
                  💰 Đề nghị mua
                </button>
              </div>
            </div>
          </div>
          
          <div class="scouting-section">
            <h4>📊 Thông tin trinh sát</h4>
            ${scoutReport ? renderDetailedScoutReport(scoutReport) : `
              <p class="no-scout">Chưa có báo cáo trinh sát. Hãy cử scout để biết thêm thông tin.</p>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderOfferModal() {
    const player = offerInProgress;
    const team = gameState.getTeamById(player.teamId);
    const suggestedValue = player.value || 10000000;
    
    return `
      <div class="modal-overlay" id="offer-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">💰 Đề nghị chuyển nhượng</h2>
            <button class="modal-close" onclick="closeOfferModal()">&times;</button>
          </div>
          
          <div class="offer-section">
            <p>Mua <strong>${player.name}</strong> từ <strong>${team?.name}</strong></p>
            <p class="suggested-price">Giá đề xuất: ${formatCurrency(suggestedValue)}</p>
            
            <form class="offer-form" onsubmit="submitOffer(event)">
              <div class="offer-row">
                <div class="offer-field">
                  <label>Phí chuyển nhượng ban đầu</label>
                  <input type="number" id="upfront-fee" value="${Math.round(suggestedValue * 0.7)}" min="0" step="100000">
                </div>
                <div class="offer-field">
                  <label>Số đợt trả góp</label>
                  <select id="installment-count">
                    <option value="0">Không trả góp</option>
                    <option value="1">1 đợt</option>
                    <option value="2">2 đợt</option>
                    <option value="3">3 đợt</option>
                  </select>
                </div>
              </div>
              
              <div class="offer-row" id="installment-details" style="display:none;">
                <div class="offer-field">
                  <label>Số tiền mỗi đợt</label>
                  <input type="number" id="installment-amount" value="${Math.round(suggestedValue * 0.1)}" min="0" step="100000">
                </div>
                <div class="offer-field">
                  <label>Thời gian giữa các đợt (tháng)</label>
                  <select id="installment-months">
                    <option value="6">6 tháng</option>
                    <option value="12">12 tháng</option>
                  </select>
                </div>
              </div>
              
              <div class="offer-row">
                <div class="offer-field">
                  <label>Thưởng thành tích</label>
                  <input type="number" id="bonus-amount" value="0" min="0" step="100000">
                </div>
                <div class="offer-field">
                  <label>Điều kiện thưởng</label>
                  <select id="bonus-condition">
                    <option value="">Không có</option>
                    <option value="appearances">Số lần ra sân</option>
                    <option value="goals">Bàn thắng</option>
                    <option value="international">Cap tuyển quốc gia</option>
                  </select>
                </div>
              </div>
              
              <div class="offer-row">
                <div class="offer-field">
                  <label>Phần trăm bán lại (%)</label>
                  <input type="number" id="sell-on-clause" value="0" min="0" max="30" step="5">
                </div>
              </div>
              
              <div class="offer-total">
                <div class="offer-total-label">Tổng giá trị đề nghị</div>
                <div class="offer-total-value" id="offer-total">${formatCurrency(suggestedValue)}</div>
              </div>
              
              <div class="offer-actions">
                <button type="button" class="btn-cancel" onclick="closeOfferModal()">Hủy</button>
                <button type="submit" class="btn-submit-offer">Gửi đề nghị</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // Helper functions
  function getFilteredPlayers() {
    return gameState.players
      .filter(p => p.teamId !== gameState.playerTeamId)
      .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(p => filterPos === 'ALL' || p.pos === filterPos)
      .sort((a, b) => {
        if (sortBy === 'age') return a.age - b.age;
        return (b[sortBy] || 0) - (a[sortBy] || 0);
      });
  }

  function getScoutingCount() {
    return gameState.scoutingManager?.getAllReports?.()?.length || 0;
  }

  function getTransferInterest(player) {
    // Simplified - would check actual interest from AI clubs
    const interests = ['🔥 Hot', '👁️ Theo dõi', '❄️ Lạnh', '🔒 Không bán'];
    return interests[Math.floor(Math.random() * interests.length)];
  }

  function getScoutStatusClass(report) {
    if (!report) return 'none';
    if (report.completion >= 1) return 'full';
    return 'scouted';
  }

  function getScoutStatusText(report) {
    if (!report) return 'Chưa trinh sát';
    if (report.completion >= 1) return 'Trinh sát đầy đủ';
    return `Trinh sát ${Math.round(report.completion * 100)}%`;
  }

  function renderScoutedAttributes(report, player) {
    if (!report || !report.visibleAttributes) return '<p>Chưa có thông tin</p>';
    
    return Object.entries(report.visibleAttributes).map(([attr, value]) => `
      <div class="sc-attr">
        <span class="sc-attr-name">${attr}</span>
        <span class="sc-attr-value">${value}</span>
      </div>
    `).join('');
  }

  function renderDetailedScoutReport(report) {
    return `
      <div class="fog-attributes">
        ${Object.entries(report.visibleAttributes || {}).map(([attr, value]) => `
          <div class="fog-attr known">
            <span>${attr}</span>
            <strong>${value}/20</strong>
          </div>
        `).join('')}
        ${Array(5).fill(0).map(() => `
          <div class="fog-attr unknown">
            <span>???</span>
            <span>Ẩn</span>
          </div>
        `).join('')}
      </div>
      
      <div class="scout-assessment">
        <h5>Đánh giá</h5>
        <p><strong>Điểm mạnh:</strong> ${report.strengths?.join(', ') || 'Chưa xác định'}</p>
        <p><strong>Điểm yếu:</strong> ${report.weaknesses?.join(', ') || 'Chưa xác định'}</p>
        <p><strong>Đề xuất:</strong> ${report.recommendation || 'Chưa có'}</p>
      </div>
    `;
  }

  function getOfferStatusText(response) {
    const texts = {
      'pending': 'Đang chờ',
      'accepted': 'Đã chấp nhận',
      'rejected': 'Bị từ chối',
      'counter_offer': 'Phản đề nghị'
    };
    return texts[response] || response;
  }

  function formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  function attachListeners() {
    // View tabs
    container.querySelectorAll('.tab-btn').forEach(btn => {
      addListener(btn, 'click', () => {
        viewMode = btn.dataset.view;
        draw();
      });
    });

    // Player cards
    container.querySelectorAll('.transfer-card').forEach(card => {
      addListener(card, 'click', () => {
        const playerId = parseInt(card.dataset.playerId);
        selectedPlayer = gameState.getPlayerById(playerId);
        draw();
      });
    });

    // Filters
    const searchInput = container.querySelector('#search-player');
    if (searchInput) {
      addListener(searchInput, 'input', (e) => {
        searchQuery = e.target.value;
        draw();
      });
    }

    container.querySelectorAll('.pos-filter').forEach(btn => {
      addListener(btn, 'click', () => {
        filterPos = btn.dataset.pos;
        draw();
      });
    });

    const sortSelect = container.querySelector('#sort-players');
    if (sortSelect) {
      addListener(sortSelect, 'change', (e) => {
        sortBy = e.target.value;
        draw();
      });
    }

    // Close modals
    container.querySelectorAll('.modal-close').forEach(btn => {
      addListener(btn, 'click', () => {
        selectedPlayer = null;
        offerInProgress = null;
        draw();
      });
    });

    // Offer form calculations
    const upfrontInput = container.querySelector('#upfront-fee');
    const installmentCount = container.querySelector('#installment-count');
    const installmentDetails = container.querySelector('#installment-details');
    
    if (installmentCount) {
      addListener(installmentCount, 'change', (e) => {
        installmentDetails.style.display = e.target.value > 0 ? 'grid' : 'none';
        updateOfferTotal();
      });
    }

    // Update total when inputs change
    ['#upfront-fee', '#installment-amount', '#installment-count', '#bonus-amount'].forEach(id => {
      const el = container.querySelector(id);
      if (el) addListener(el, 'input', updateOfferTotal);
    });

    function updateOfferTotal() {
      const upfront = parseInt(container.querySelector('#upfront-fee')?.value || 0);
      const numInstallments = parseInt(container.querySelector('#installment-count')?.value || 0);
      const installmentAmount = parseInt(container.querySelector('#installment-amount')?.value || 0);
      const bonus = parseInt(container.querySelector('#bonus-amount')?.value || 0);
      
      const total = upfront + (numInstallments * installmentAmount) + bonus;
      const totalEl = container.querySelector('#offer-total');
      if (totalEl) totalEl.textContent = formatCurrency(total);
    }

    // Modal overlay click to close
    container.querySelectorAll('.modal-overlay').forEach(overlay => {
      addListener(overlay, 'click', (e) => {
        if (e.target === overlay) {
          selectedPlayer = null;
          offerInProgress = null;
          draw();
        }
      });
    });
  }

  // Expose functions to window for inline onclick handlers
  window.closeModal = () => { selectedPlayer = null; draw(); };
  window.closeOfferModal = () => { offerInProgress = null; draw(); };
  window.scoutPlayer = (playerId) => {
    const duration = 2; // 2 weeks
    gameState.scoutPlayer(playerId, 'scout1', duration);
    alert('Đã gửi scout đi trinh sát! Báo cáo sẽ về sau ' + duration + ' tuần.');
  };
  window.makeOffer = (playerId) => {
    offerInProgress = gameState.getPlayerById(playerId);
    selectedPlayer = null;
    draw();
  };
  window.submitOffer = (e) => {
    e.preventDefault();
    const upfront = parseInt(document.getElementById('upfront-fee').value);
    const numInstallments = parseInt(document.getElementById('installment-count').value);
    const installmentAmount = parseInt(document.getElementById('installment-amount')?.value || 0);
    const installmentMonths = parseInt(document.getElementById('installment-months')?.value || 12);
    const sellOn = parseInt(document.getElementById('sell-on-clause').value);
    
    const installments = numInstallments > 0 ? [{
      amount: installmentAmount,
      months: numInstallments * installmentMonths,
      startDate: new Date()
    }] : [];

    const result = gameState.makeTransferOffer(offerInProgress.id, offerInProgress.teamId, {
      upfrontFee: upfront,
      installments,
      sellOnClause: sellOn
    });

    if (result.success) {
      alert(`Đã gửi đề nghị! ${result.evaluation.message}`);
      offerInProgress = null;
      draw();
    } else {
      alert('Không thể gửi đề nghị: ' + result.message);
    }
  };

  draw();
  return { destroy: removeListeners };
}
