// ============================================================
// PROCESSING SCREEN - Rich Loading Experience
// World News, Stats, Progress
// ============================================================

import { calendar, PRIORITY } from '../data/calendar.js';

export const processingScreen = {
  container: null,
  progress: null,
  newsContainer: null,
  abortCallback: null,

  render(initialProgress = {}) {
    const progress = {
      step: 0,
      total: 4,
      percent: 0,
      message: 'Khởi tạo...',
      detail: '',
      playersProcessed: 0,
      totalPlayers: 0,
      matchesSimulated: 0,
      eventsGenerated: 0,
      currentDate: '',
      ...initialProgress
    };
    
    const worldNews = this.generateWorldNews(progress);
    
    return `
      <div id="processing-overlay" class="processing-overlay">
        <div class="processing-container">
          <!-- Header -->
          <div class="processing-header">
            <div class="spinner"></div>
            <h2>Đang xử lý ngày ${progress.currentDate || '...'}</h2>
            <p class="processing-subtitle">Thế giới bóng đá đang vận hành</p>
          </div>
          
          <!-- Progress Section -->
          <div class="progress-section">
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: ${progress.percent}%"></div>
            </div>
            <div class="progress-info">
              <span class="progress-step">Bước ${progress.step}/${progress.total}</span>
              <span class="progress-percent">${Math.round(progress.percent)}%</span>
            </div>
            <p class="progress-message">${progress.message}</p>
            <p class="progress-detail">${progress.detail || ''}</p>
          </div>
          
          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">👤</div>
              <div class="stat-value" id="stat-players">${progress.playersProcessed}</div>
              <div class="stat-label">Cầu thủ</div>
              <div class="stat-sub">/${progress.totalPlayers}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⚽</div>
              <div class="stat-value" id="stat-matches">${progress.matchesSimulated}</div>
              <div class="stat-label">Trận đấu</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📰</div>
              <div class="stat-value" id="stat-events">${progress.eventsGenerated}</div>
              <div class="stat-label">Sự kiện</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⏱️</div>
              <div class="stat-value" id="stat-time">0s</div>
              <div class="stat-label">Thời gian</div>
            </div>
          </div>
          
          <!-- World News Ticker -->
          <div class="world-news-section">
            <div class="section-header">
              <span class="section-icon">🌍</span>
              <h3>Tin nóng thế giới</h3>
            </div>
            <div class="news-ticker" id="news-ticker">
              ${worldNews.map((news, i) => `
                <div class="news-item ${news.urgency}" style="animation-delay: ${i * 0.1}s">
                  <span class="news-badge">${news.icon}</span>
                  <span class="news-category">${news.category}</span>
                  <span class="news-text">${news.text}</span>
                  <span class="news-time">${news.time}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Tips Section -->
          <div class="tips-section">
            <div class="tip-item" id="game-tip">
              <span class="tip-icon">💡</span>
              <span class="tip-text">${this.getRandomTip()}</span>
            </div>
          </div>
          
          <!-- Cancel Button -->
          <button id="cancel-processing" class="btn-cancel">
            <span>⏹</span> Hủy xử lý
          </button>
        </div>
      </div>
      
      <style>
        .processing-overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .processing-container {
          width: 90%;
          max-width: 700px;
          padding: 40px;
          background: rgba(30, 41, 59, 0.9);
          border-radius: 20px;
          border: 1px solid rgba(74, 222, 128, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }
        
        .processing-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .spinner {
          width: 60px;
          height: 60px;
          margin: 0 auto 20px;
          border: 4px solid rgba(74, 222, 128, 0.2);
          border-top-color: #4ade80;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .processing-header h2 {
          color: #4ade80;
          font-size: 24px;
          margin: 0 0 8px;
        }
        
        .processing-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin: 0;
        }
        
        /* Progress Section */
        .progress-section {
          margin-bottom: 30px;
        }
        
        .progress-bar-container {
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22c55e, #16a34a);
          border-radius: 6px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
        }
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        
        .progress-message {
          color: #e2e8f0;
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 4px;
        }
        
        .progress-detail {
          color: #64748b;
          font-size: 13px;
          margin: 0;
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 15px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: transform 0.2s, border-color 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(74, 222, 128, 0.3);
        }
        
        .stat-icon {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #4ade80;
        }
        
        .stat-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-sub {
          font-size: 12px;
          color: #64748b;
        }
        
        /* World News Section */
        .world-news-section {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .section-icon {
          font-size: 20px;
        }
        
        .section-header h3 {
          color: #e2e8f0;
          font-size: 16px;
          margin: 0;
        }
        
        .news-ticker {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 150px;
          overflow-y: auto;
        }
        
        .news-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          border-left: 3px solid #4ade80;
          animation: slideIn 0.5s ease forwards;
          opacity: 0;
          transform: translateX(-20px);
        }
        
        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .news-item.urgent {
          border-left-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        .news-item.warning {
          border-left-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }
        
        .news-badge {
          font-size: 16px;
        }
        
        .news-category {
          font-size: 11px;
          padding: 2px 8px;
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .news-text {
          flex: 1;
          color: #e2e8f0;
          font-size: 13px;
        }
        
        .news-time {
          font-size: 11px;
          color: #64748b;
        }
        
        /* Tips Section */
        .tips-section {
          background: rgba(74, 222, 128, 0.1);
          border-radius: 8px;
          padding: 12px 15px;
          margin-bottom: 20px;
        }
        
        .tip-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .tip-icon {
          font-size: 16px;
        }
        
        .tip-text {
          color: #94a3b8;
          font-size: 13px;
          font-style: italic;
        }
        
        /* Cancel Button */
        .btn-cancel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background: rgba(239, 68, 68, 0.3);
        }
        
        /* Scrollbar */
        .news-ticker::-webkit-scrollbar {
          width: 6px;
        }
        
        .news-ticker::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .news-ticker::-webkit-scrollbar-thumb {
          background: rgba(74, 222, 128, 0.3);
          border-radius: 3px;
        }
      </style>
    `;
  },

  update(progress) {
    // Update progress bar
    const bar = document.querySelector('.progress-bar');
    if (bar) bar.style.width = `${progress.percent}%`;
    
    // Update stats
    const playersEl = document.getElementById('stat-players');
    const matchesEl = document.getElementById('stat-matches');
    const eventsEl = document.getElementById('stat-events');
    
    if (playersEl) playersEl.textContent = progress.playersProcessed;
    if (matchesEl) matchesEl.textContent = progress.matchesSimulated;
    if (eventsEl) eventsEl.textContent = progress.eventsGenerated;
    
    // Update messages
    const stepEl = document.querySelector('.progress-step');
    const percentEl = document.querySelector('.progress-percent');
    const msgEl = document.querySelector('.progress-message');
    const detailEl = document.querySelector('.progress-detail');
    
    if (stepEl) stepEl.textContent = `Bước ${progress.step}/${progress.total}`;
    if (percentEl) percentEl.textContent = `${Math.round(progress.percent)}%`;
    if (msgEl) msgEl.textContent = progress.message;
    if (detailEl) detailEl.textContent = progress.detail || '';
  },

  generateWorldNews(progress) {
    const news = [];
    
    // Recent match results (simulated)
    const sampleMatches = [
      { home: 'Manchester City', away: 'Arsenal', hg: 3, ag: 1 },
      { home: 'Real Madrid', away: 'Barcelona', hg: 2, ag: 2 },
      { home: 'Bayern Munich', away: 'Dortmund', hg: 4, ag: 2 }
    ];
    
    sampleMatches.forEach(match => {
      news.push({
        icon: '⚽',
        category: 'FT',
        text: `${match.home} ${match.hg}-${match.ag} ${match.away}`,
        time: '90\'',
        urgency: match.hg + match.ag > 4 ? 'urgent' : 'normal'
      });
    });
    
    // Transfer rumors
    const players = ['Erling Haaland', 'Kylian Mbappé', 'Jude Bellingham'];
    const randomPlayer = players[Math.floor(Math.random() * players.length)];
    news.push({
      icon: '🔥',
      category: 'TIN ĐỒN',
      text: `${randomPlayer} được liên hệ bởi nhiều CLB lớn`,
      time: 'NEW',
      urgency: 'warning'
    });
    
    // Manager news
    news.push({
      icon: '📋',
      category: 'BỔ NHIỆM',
      text: 'Chelsea bổ nhiệm HLV mới sau chuỗi trận tệ hại',
      time: '2h',
      urgency: 'normal'
    });
    
    return news;
  },

  getRandomTip() {
    const tips = [
      'Cầu thủ trẻ có tiềm năng phát triển tốt hơn khi được thi đấu thường xuyên',
      'Thể lực thấp ảnh hưởng đến hiệu suất thi đấu - cho cầu thủ nghỉ ngơi khi cần',
      'Tin bóng đá thế giới cập nhật liên tục trong quá trình xử lý',
      'Giá trị chuyển nhượng thay đổi dựa trên phong độ và tuổi tác',
      'Chấn thương nghiêm trọng có thể giảm 50% giá trị cầu thủ',
      'Sự kiện Critical sẽ dừng game để bạn xử lý ngay lập tức',
      'Quan sát thông số thể lực trước mỗi trận đấu quan trọng'
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  },

  bindEvents(abortCallback) {
    const cancelBtn = document.getElementById('cancel-processing');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        if (confirm('Hủy xử lý? Tiến trình sẽ không được lưu.')) {
          abortCallback?.();
        }
      };
    }
  },

  hide() {
    const overlay = document.getElementById('processing-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }
  }
};
