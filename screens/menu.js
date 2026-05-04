// ============================================================
// MENU SCREEN
// ============================================================
import { TEAMS } from "../data/teams.js";
import { gameState } from "../engine/gameState.js";

export function renderMenu(container, router) {
  let view = "landing"; // 'landing' or 'setup'
  let selectedTeamId = TEAMS[0].id;

  function update() {
    container.innerHTML = `
      <div class="menu-screen">
        <div class="menu-bg-overlay"></div>
        <div class="menu-content">
          <div class="menu-logo">
            <span class="menu-logo-icon">⚽</span>
            <h1 class="menu-title">FOOTBALL<br><span class="menu-title-accent">MANAGER</span></h1>
            <p class="menu-subtitle">Global Edition 2026</p>
          </div>

          ${view === "landing" ? renderLandingView() : renderSetupView()}

          <div class="menu-features">
            <div class="feature-item">🏆 Quản lý đội bóng</div>
            <div class="feature-item">⚽ Mô phỏng trận đấu</div>
            <div class="feature-item">🔄 Chuyển nhượng</div>
            <div class="feature-item">📊 Chiến thuật thực chiến</div>
          </div>
        </div>
      </div>
    `;
    attachListeners();
  }

  function renderLandingView() {
    const hasSave = gameState.constructor.hasSave();
    return `
      <div class="menu-form glass-card landing-buttons" style="text-align: center; display: flex; flex-direction: column; gap: 20px; padding: 40px;">
        <h2 style="margin-bottom: 10px;">Sẵn Sàng Chưa?</h2>
        
        ${hasSave ? `
          <button class="btn-primary" id="btn-continue-game" style="width:100%; height: 60px; font-size: 1.2rem;">
            <span>▶ TIẾP TỤC SỰ NGHIỆP</span>
          </button>
        ` : ""}
        
        <button class="${hasSave ? 'btn-secondary' : 'btn-primary'}" id="btn-show-setup" style="width:100%; height: 60px; font-size: 1.2rem;">
          <span>🚀 BẮT ĐẦU MỚI</span>
        </button>
        
        ${hasSave ? `
          <p style="color: var(--text-dim); font-size: 0.9rem;">Lưu ý: Bắt đầu mới sẽ không xóa file lưu cũ cho đến khi bạn lưu đè.</p>
        ` : ""}
      </div>
    `;
  }

  function renderSetupView() {
    return `
      <div class="menu-form glass-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">Thiết Lập Sự Nghiệp</h2>
          <button class="filter-btn" id="btn-back" style="padding: 5px 15px;">← Quay Lại</button>
        </div>

        <div class="form-group">
          <label for="coach-name">Tên Huấn Luyện Viên</label>
          <input type="text" id="coach-name" placeholder="Nhập tên của bạn..." value="Nguyễn Văn An" />
        </div>

        <div class="form-group">
          <label>Chọn Đội Bóng</label>
          <div class="team-grid">
            ${TEAMS.map(
              (t) => `
              <div class="team-card ${t.id === selectedTeamId ? 'selected' : ''}" data-team-id="${t.id}" style="cursor:pointer">
                <div class="team-logo" style="background: linear-gradient(135deg, ${t.color}33, ${t.colorSecondary}22); pointer-events:none">
                  <span style="font-size:2rem">${t.logo}</span>
                </div>
                <div class="team-info" style="pointer-events:none">
                  <div class="team-name">${t.name}</div>
                  <div class="team-meta">${t.stadium}</div>
                  <div class="team-rating">
                    <div class="rating-bar" style="--val:${t.overallRating}%">
                      <span>${t.overallRating}</span>
                    </div>
                  </div>
                  <div class="team-budget">💰 $${(t.budget / 1000000).toFixed(1)}M</div>
                </div>
              </div>`
            ).join("")}
          </div>
        </div>

        <button class="btn-primary btn-start" id="btn-start-game" style="width:100%; justify-content:center; margin-top:10px">
          <span>🚀 Bắt Đầu Quản Lý</span>
        </button>
      </div>
    `;
  }

  function attachListeners() {
    // Landing View Listeners
    const continueBtn = container.querySelector("#btn-continue-game");
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        if (gameState.loadGame()) {
          router.navigate("dashboard");
        } else {
          alert("Không thể tải file lưu!");
        }
      });
    }

    const showSetupBtn = container.querySelector("#btn-show-setup");
    if (showSetupBtn) {
      showSetupBtn.addEventListener("click", () => {
        view = "setup";
        update();
      });
    }

    // Setup View Listeners
    const backBtn = container.querySelector("#btn-back");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        view = "landing";
        update();
      });
    }

    const teamCards = container.querySelectorAll(".team-card");
    teamCards.forEach(card => {
      card.addEventListener("click", () => {
        selectedTeamId = parseInt(card.dataset.teamId);
        teamCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
      });
    });

    const startBtn = container.querySelector("#btn-start-game");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        const coachName = document.getElementById("coach-name").value.trim() || "Huấn luyện viên";
        gameState.init(coachName, selectedTeamId);
        router.navigate("dashboard");
      });
    }
  }

  update();
}
