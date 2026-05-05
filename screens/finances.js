// ============================================================
// FINANCES SCREEN - Detailed Financial Management
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";

export function renderFinances(container, router) {
  let listeners = [];
  let currentView = 'overview'; // overview, income, expenses, projections
  let selectedPeriod = 'month'; // week, month, season
  
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
    const finance = gameState.getMyFinance();
    const players = gameState.getMyPlayers();
    
    // Calculate financial details
    const weeklyWage = players.reduce((sum, p) => sum + (p.wage || 0), 0);
    const monthlyWage = weeklyWage * 4;
    const transferSpent = finance.expenses?.transfers || 0;
    const transferReceived = finance.income?.transfers || 0;
    
    // Projections
    const remainingMatches = 30; // Rough estimate
    const projectedMatchdayIncome = remainingMatches * (team?.stadium?.capacity || 30000) * 15; // €15 average ticket
    const projectedSponsorship = finance.income?.sponsorship || 50000;
    
    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">💰 Tài Chính</h1>
          <p class="screen-subtitle">Quản lý ngân sách và dòng tiền CLB</p>
        </div>
        <div class="finance-summary">
          <div class="balance-card">
            <span class="balance-label">Số dư hiện tại</span>
            <span class="balance-value ${finance.balance < 0 ? 'negative' : ''}">${formatCurrency(finance.balance || 0)}</span>
          </div>
        </div>
      </div>

      <div class="finances-container">
        <!-- Navigation Tabs -->
        <div class="finance-tabs">
          <button class="tab-btn ${currentView === 'overview' ? 'active' : ''}" data-view="overview">Tổng quan</button>
          <button class="tab-btn ${currentView === 'income' ? 'active' : ''}" data-view="income">Thu nhập</button>
          <button class="tab-btn ${currentView === 'expenses' ? 'active' : ''}" data-view="expenses">Chi phí</button>
          <button class="tab-btn ${currentView === 'projections' ? 'active' : ''}" data-view="projections">Dự báo</button>
          <button class="tab-btn ${currentView === 'wages' ? 'active' : ''}" data-view="wages">Lương</button>
        </div>

        ${currentView === 'overview' ? renderOverview(finance, weeklyWage, team) : ''}
        ${currentView === 'income' ? renderIncome(finance, projectedMatchdayIncome, projectedSponsorship) : ''}
        ${currentView === 'expenses' ? renderExpenses(finance, weeklyWage, monthlyWage, players) : ''}
        ${currentView === 'projections' ? renderProjections(finance, weeklyWage, projectedMatchdayIncome, projectedSponsorship) : ''}
        ${currentView === 'wages' ? renderWageStructure(players) : ''}
      </div>

      <style>
        .finances-container {
          padding: 20px;
          max-width: 1200px;
        }

        .finance-summary {
          text-align: right;
        }

        .balance-card {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.05));
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 12px;
          padding: 16px 24px;
        }

        .balance-label {
          display: block;
          font-size: 0.85rem;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .balance-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #00ff88;
        }

        .balance-value.negative {
          color: #ef4444;
        }

        .finance-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
          padding-bottom: 16px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: #f8fafc;
          background: rgba(30, 41, 59, 0.5);
        }

        .tab-btn.active {
          background: #00ff88;
          color: #0f172a;
        }

        .finance-card {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .finance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-label {
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-value {
          font-weight: 600;
          color: #f8fafc;
        }

        .stat-value.positive {
          color: #00ff88;
        }

        .stat-value.negative {
          color: #ef4444;
        }

        .finance-chart {
          height: 200px;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          display: flex;
          align-items: flex-end;
          padding: 20px;
          gap: 8px;
        }

        .chart-bar {
          flex: 1;
          background: linear-gradient(to top, #00ff88, rgba(0, 255, 136, 0.3));
          border-radius: 4px 4px 0 0;
          min-height: 20px;
          position: relative;
        }

        .chart-bar.negative {
          background: linear-gradient(to top, #ef4444, rgba(239, 68, 68, 0.3));
        }

        .chart-label {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          color: #64748b;
        }

        .wage-table {
          width: 100%;
          border-collapse: collapse;
        }

        .wage-table th,
        .wage-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .wage-table th {
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.85rem;
        }

        .wage-table td {
          color: #f8fafc;
        }

        .wage-player {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .wage-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00ff88, #00cc6a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #0f172a;
        }

        .wage-info {
          display: flex;
          flex-direction: column;
        }

        .wage-name {
          font-weight: 500;
        }

        .wage-pos {
          font-size: 0.8rem;
          color: #64748b;
        }

        .wage-amount {
          font-weight: 600;
          color: #fbbf24;
        }

        .progress-bar {
          width: 100%;
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

        .progress-fill.high {
          background: #ef4444;
        }

        .progress-fill.medium {
          background: #fbbf24;
        }

        .progress-fill.low {
          background: #00ff88;
        }

        .projection-warning {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-top: 20px;
        }

        .projection-warning.critical {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }
      </style>
    `;

    attachListeners();
  }

  function renderOverview(finance, weeklyWage, team) {
    const monthlyIncome = (finance.income?.matchday || 0) + (finance.income?.sponsorship || 0) + (finance.income?.prize || 0);
    const monthlyExpenses = weeklyWage * 4 + (finance.expenses?.transfers || 0) + (finance.expenses?.facilities || 0);
    const netMonthly = monthlyIncome - monthlyExpenses;
    
    return `
      <div class="finance-grid">
        <div class="finance-card">
          <h3>📊 Tổng quan tháng này</h3>
          <div class="stat-row">
            <span class="stat-label">💰 Tổng thu nhập</span>
            <span class="stat-value positive">+${formatCurrency(monthlyIncome)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">💸 Tổng chi phí</span>
            <span class="stat-value negative">-${formatCurrency(monthlyExpenses)}</span>
          </div>
          <div class="stat-row" style="border-top: 2px solid rgba(148, 163, 184, 0.2); margin-top: 12px; padding-top: 16px;">
            <span class="stat-label">📈 Lãi/lỗ ròng</span>
            <span class="stat-value ${netMonthly >= 0 ? 'positive' : 'negative'}">${netMonthly >= 0 ? '+' : ''}${formatCurrency(netMonthly)}</span>
          </div>
        </div>

        <div class="finance-card">
          <h3>⚽ Thu nhập thi đấu</h3>
          <div class="stat-row">
            <span class="stat-label">🎫 Vé trận đấu</span>
            <span class="stat-value">${formatCurrency(finance.income?.matchday || 0)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">🤝 Tài trợ</span>
            <span class="stat-value">${formatCurrency(finance.income?.sponsorship || 0)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">🏆 Thưởng giải</span>
            <span class="stat-value">${formatCurrency(finance.income?.prize || 0)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">🔄 Bán cầu thủ</span>
            <span class="stat-value">${formatCurrency(finance.income?.transfers || 0)}</span>
          </div>
        </div>

        <div class="finance-card">
          <h3>💵 Chi phí vận hành</h3>
          <div class="stat-row">
            <span class="stat-label">💼 Lương cầu thủ (tháng)</span>
            <span class="stat-value negative">-${formatCurrency(weeklyWage * 4)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">🔄 Mua cầu thủ</span>
            <span class="stat-value">${formatCurrency(finance.expenses?.transfers || 0)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">🏗️ Cơ sở vật chất</span>
            <span class="stat-value">${formatCurrency(finance.expenses?.facilities || 0)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">👔 Lương nhân viên</span>
            <span class="stat-value">${formatCurrency(finance.expenses?.staff || 0)}</span>
          </div>
        </div>

        <div class="finance-card">
          <h3>📈 Biến động số dư</h3>
          <div class="finance-chart">
            ${generateBalanceHistory().map((val, i) => `
              <div class="chart-bar ${val < 0 ? 'negative' : ''}" style="height: ${Math.abs(val) / 100}%">
                <span class="chart-label">T${i + 1}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderIncome(finance, projectedMatchday, projectedSponsorship) {
    return `
      <div class="finance-grid">
        <div class="finance-card">
          <h3>🎫 Doanh thu vé</h3>
          <div class="stat-row">
            <span class="stat-label">Sức chứa sân</span>
            <span class="stat-value">${(40000).toLocaleString()} chỗ</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Giá vé trung bình</span>
            <span class="stat-value">€15</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Lấp đầy trung bình</span>
            <span class="stat-value">75%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Thu nhập/trận (TB)</span>
            <span class="stat-value positive">€450,000</span>
          </div>
        </div>

        <div class="finance-card">
          <h3>🤝 Hợp đồng tài trợ</h3>
          <div class="stat-row">
            <span class="stat-label">Nhà tài trợ chính</span>
            <span class="stat-value">TechCorp Vietnam</span>
          </div>
            <div class="stat-row">
            <span class="stat-label">Giá trị hợp đồng</span>
            <span class="stat-value">${formatCurrency(2000000)}/năm</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Thời hạn còn lại</span>
            <span class="stat-value">2 năm</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Thưởng thành tích</span>
            <span class="stat-value">€500,000 nếu vô địch</span>
          </div>
        </div>

        <div class="finance-card">
          <h3>🏆 Tiền thưởng giải đấu</h3>
          <div class="stat-row">
            <span class="stat-label">Vô địch V.League</span>
            <span class="stat-value positive">€2,000,000</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Á quân</span>
            <span class="stat-value">€1,000,000</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Top 3</span>
            <span class="stat-value">€500,000</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Thăng hạng C1</span>
            <span class="stat-value positive">€3,000,000</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderExpenses(finance, weeklyWage, monthlyWage, players) {
    const highestEarner = [...players].sort((a, b) => (b.wage || 0) - (a.wage || 0))[0];
    const avgWage = players.length > 0 ? weeklyWage / players.length : 0;
    
    return `
      <div class="finance-grid">
        <div class="finance-card">
          <h3>💼 Quỹ lương</h3>
          <div class="stat-row">
            <span class="stat-label">Tổng lương/tuần</span>
            <span class="stat-value negative">-${formatCurrency(weeklyWage)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Tổng lương/tháng</span>
            <span class="stat-value negative">-${formatCurrency(monthlyWage)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Lương TB/cầu thủ</span>
            <span class="stat-value">${formatCurrency(avgWage)}/tuần</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Cầu thủ lương cao nhất</span>
            <span class="stat-value">${highestEarner?.name || 'N/A'} (${formatCurrency(highestEarner?.wage || 0)})</span>
          </div>
        </div>

        <div class="finance-card">
          <h3>📊 Phân bổ ngân sách</h3>
          <div class="stat-row">
            <span class="stat-label">Lương cầu thủ</span>
            <span class="stat-value">${Math.round((monthlyWage / (monthlyWage + 1000000)) * 100)}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Chuyển nhượng</span>
            <span class="stat-value">${Math.round(((finance.expenses?.transfers || 0) / Math.max(finance.balance, 1)) * 100)}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Cơ sở vật chất</span>
            <span class="stat-value">5%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Nhân viên & khác</span>
            <span class="stat-value">10%</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderProjections(finance, weeklyWage, projectedMatchday, projectedSponsorship) {
    const monthlyWage = weeklyWage * 4;
    const remainingMonths = 6; // Rough estimate
    const totalProjectedIncome = projectedMatchday + projectedSponsorship;
    const totalProjectedExpenses = monthlyWage * remainingMonths;
    const projectedEndBalance = finance.balance + totalProjectedIncome - totalProjectedExpenses;
    
    return `
      <div class="finance-grid">
        <div class="finance-card">
          <h3>🔮 Dự báo cuối mùa</h3>
          <div class="stat-row">
            <span class="stat-label">Số dư hiện tại</span>
            <span class="stat-value">${formatCurrency(finance.balance || 0)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Thu nhập dự kiến</span>
            <span class="stat-value positive">+${formatCurrency(totalProjectedIncome)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Chi phí dự kiến</span>
            <span class="stat-value negative">-${formatCurrency(totalProjectedExpenses)}</span>
          </div>
          <div class="stat-row" style="border-top: 2px solid rgba(148, 163, 184, 0.2); margin-top: 12px; padding-top: 16px;">
            <span class="stat-label">Dự báo số dư</span>
            <span class="stat-value ${projectedEndBalance >= 0 ? 'positive' : 'negative'}">${formatCurrency(projectedEndBalance)}</span>
          </div>
        </div>

        <div class="finance-card">
          <h3>⚠️ Cảnh báo tài chính</h3>
          ${projectedEndBalance < 0 ? `
            <div class="projection-warning critical">
              <strong>🚨 Nguy cơ phá sản!</strong>
              <p>Dự báo số dư âm ${formatCurrency(Math.abs(projectedEndBalance))}. Cần giảm lương hoặc bán cầu thủ.</p>
            </div>
          ` : projectedEndBalance < monthlyWage * 3 ? `
            <div class="projection-warning">
              <strong>⚠️ Cảnh báo</strong>
              <p>Số dư dự báo thấp. Nên giữ quỹ dự phòng tối thiểu 3 tháng lương.</p>
            </div>
          ` : `
            <div class="stat-row">
              <span class="stat-label">Tình trạng</span>
              <span class="stat-value positive">✅ Ổn định</span>
            </div>
          `}
          
          <div class="stat-row">
            <span class="stat-label">Quỹ dự phòng (tháng)</span>
            <span class="stat-value">${Math.floor((finance.balance || 0) / monthlyWage)} tháng lương</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderWageStructure(players) {
    const sortedPlayers = [...players].sort((a, b) => (b.wage || 0) - (a.wage || 0));
    const totalWage = players.reduce((sum, p) => sum + (p.wage || 0), 0);
    
    return `
      <div class="finance-card">
        <h3>💰 Bảng lương cầu thủ</h3>
        <table class="wage-table">
          <thead>
            <tr>
              <th>Cầu thủ</th>
              <th>Lương/tuần</th>
              <th>Lương/năm</th>
              <th>% Quỹ lương</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${sortedPlayers.map(p => {
              const yearly = (p.wage || 0) * 52;
              const percentage = totalWage > 0 ? ((p.wage || 0) / totalWage * 100) : 0;
              return `
                <tr>
                  <td>
                    <div class="wage-player">
                      <div class="wage-avatar">${p.name.charAt(0)}</div>
                      <div class="wage-info">
                        <span class="wage-name">${p.name}</span>
                        <span class="wage-pos">${p.pos} · ${p.age} tuổi</span>
                      </div>
                    </div>
                  </td>
                  <td class="wage-amount">${formatCurrency(p.wage || 0)}</td>
                  <td>${formatCurrency(yearly)}</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill ${percentage > 20 ? 'high' : percentage > 10 ? 'medium' : 'low'}" style="width: ${percentage}%"></div>
                    </div>
                    ${percentage.toFixed(1)}%
                  </td>
                  <td>${p.injured ? '🚑 Chấn thương' : '✅ Bình thường'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function generateBalanceHistory() {
    // Mock data for chart
    return [80, 65, 90, 70, 85, 60, 95, 75, 88, 72, 92, 68];
  }

  function attachListeners() {
    // Tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      addListener(btn, 'click', () => {
        currentView = btn.dataset.view;
        draw();
      });
    });
  }

  draw();
  return { destroy: removeListeners };
}
