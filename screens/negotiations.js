// ============================================================
// NEGOTIATIONS SCREEN – Manage ongoing talks & squad contracts
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";

export function renderNegotiations(container, router) {
  let activeTab = "active"; // "active" | "squad"

  function draw() {
    const activeNegs = gameState.negotiations;
    const squad = gameState.getMyPlayers();

    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">🤝 Trung Tâm Đàm Phán</h1>
          <p class="screen-subtitle">Quản lý các cuộc thương thảo chuyển nhượng và hợp đồng</p>
        </div>
      </div>

      <div class="neg-tabs" style="display:flex; gap:10px; margin-bottom:20px;">
        <button class="btn-secondary tab-btn ${activeTab === "active" ? "active" : ""}" data-tab="active" style="${activeTab === "active" ? "border-color:var(--primary); color:var(--primary)" : ""}">
          🔥 Đang đàm phán (${activeNegs.length})
        </button>
        <button class="btn-secondary tab-btn ${activeTab === "squad" ? "active" : ""}" data-tab="squad" style="${activeTab === "squad" ? "border-color:var(--primary); color:var(--primary)" : ""}">
          📋 Hợp đồng đội bóng (${squad.length})
        </button>
      </div>

      <div class="neg-content" style="flex:1; overflow:hidden; display:flex; flex-direction:column;">
        ${activeTab === "active" ? renderActiveTab(activeNegs) : renderSquadTab(squad)}
      </div>
    `;

    // Attach Tab Listeners
    container.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        draw();
      });
    });

    // Attach Negotiation Actions
    container.querySelectorAll(".btn-continue-neg").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const neg = activeNegs.find(n => n.id === id);
        if (neg) openNegotiationModal(neg);
      });
    });

    container.querySelectorAll(".btn-cancel-neg").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        if (confirm("Hủy bỏ cuộc đàm phán này?")) {
          gameState.negotiations = gameState.negotiations.filter(n => n.id !== id);
          draw();
        }
      });
    });
    
    // Squad actions
    container.querySelectorAll(".btn-renew-contract").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = parseInt(btn.dataset.id);
        const player = gameState.getPlayerById(pid);
        const neg = gameState.startNegotiation(pid);
        neg.phase = "contract"; // Skip transfer fee for own players
        neg.history.push({ type: "success", msg: "Bắt đầu đàm phán gia hạn hợp đồng." });
        openNegotiationModal(neg);
      });
    });
  }

  function renderActiveTab(negs) {
    if (negs.length === 0) return `<div class="glass-card" style="text-align:center; padding:50px">Không có cuộc đàm phán nào đang diễn ra.</div>`;

    return `
      <div class="glass-card" style="padding:0; flex:1; overflow-y:auto;">
        <table class="league-table-mini">
          <thead>
            <tr>
              <th>Cầu thủ</th>
              <th>Đối tác</th>
              <th>Trạng thái</th>
              <th>Tiến độ</th>
              <th style="text-align:right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${negs.map(n => `
              <tr>
                <td><strong>${n.player.name}</strong><br><small style="color:var(--text-dim)">${n.player.pos} · ${n.player.overall} OVR</small></td>
                <td>${n.team?.name || "Tự do"}</td>
                <td>
                  <span style="color:${n.status === "accepted" ? "#00ff88" : n.status === "rejected" ? "#ff4444" : "#fbbf24"}">
                    ${n.status === "accepted" ? "✅ Thành công" : n.status === "rejected" ? "❌ Thất bại" : "⏳ Đang thương thảo"}
                  </span>
                </td>
                <td>
                  <div style="font-size:0.8rem; color:var(--text-dim)">
                    ${n.phase === "transfer" ? "Đàm phán phí chuyển nhượng" : "Đàm phán hợp đồng cá nhân"}
                  </div>
                </td>
                <td style="text-align:right">
                  <button class="btn-primary btn-continue-neg" data-id="${n.id}" style="padding:6px 12px; font-size:0.8rem">Chi tiết</button>
                  <button class="btn-secondary btn-cancel-neg" data-id="${n.id}" style="padding:6px 12px; font-size:0.8rem">Hủy</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderSquadTab(players) {
    return `
      <div class="glass-card" style="padding:0; flex:1; overflow-y:auto;">
        <table class="league-table-mini">
          <thead>
            <tr>
              <th>Cầu thủ</th>
              <th>Lương tuần</th>
              <th>Giá trị</th>
              <th>Tình trạng</th>
              <th style="text-align:right">Gia hạn</th>
            </tr>
          </thead>
          <tbody>
            ${players.map(p => `
              <tr>
                <td><strong>${p.name}</strong><br><small style="color:var(--text-dim)">${p.pos} · ${p.age} tuổi</small></td>
                <td>${formatCurrency(p.wage)}</td>
                <td>${formatCurrency(p.value)}</td>
                <td><span style="color:#00ff88">Hợp đồng dài hạn</span></td>
                <td style="text-align:right">
                  <button class="btn-secondary btn-renew-contract" data-id="${p.id}" style="padding:6px 12px; font-size:0.8rem">Gia hạn</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function openNegotiationModal(neg) {
    const player = neg.player;
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:2000;backdrop-filter:blur(5px);";
    
    function renderModal() {
      modal.innerHTML = `
        <div class="glass-card negotiation-card" style="width:500px; max-height:90vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
            <h2>🤝 Đàm Phán Chi Tiết</h2>
            <button class="btn-close-modal" style="background:none;border:none;color:white;font-size:1.5rem;cursor:pointer">&times;</button>
          </div>

          <div style="text-align:center; margin-bottom:20px">
            <div style="font-size:2rem">${player.pos === "GK" ? "🧤" : "⚽"}</div>
            <h3 style="margin:0">${player.name}</h3>
            <p style="color:var(--text-dim);font-size:0.9rem">${neg.team?.name || "🆓 Tự do"}</p>
          </div>

          <div class="neg-history" style="background:rgba(0,0,0,0.2); padding:15px; border-radius:10px; margin-bottom:20px; font-size:0.9rem; max-height:200px; overflow-y:auto;">
            ${neg.history.map(h => `<div style="margin-bottom:5px; color:${h.type === "success" ? "#00ff88" : h.type === "error" ? "#ff4444" : "#fbbf24"}">${h.msg}</div>`).join("")}
          </div>

          ${neg.status !== "ongoing" ? `
            <div style="text-align:center; padding:20px;">
              <h3 style="color:${neg.status === "accepted" ? "#00ff88" : "#ff4444"}">${neg.status === "accepted" ? "🎉 THÀNH CÔNG!" : "❌ THẤT BẠI!"}</h3>
              <p>${neg.status === "accepted" ? "Mọi thỏa thuận đã được ký kết." : "Cuộc đàm phán đã kết thúc."}</p>
              <button class="btn-primary btn-close-modal" style="margin-top:10px">Đóng</button>
            </div>
          ` : `
            ${neg.phase === "transfer" ? `
              <div class="neg-transfer">
                <label style="display:block;margin-bottom:10px;font-size:0.9rem">Đề nghị phí chuyển nhượng (Yêu cầu: ${formatCurrency(neg.aiDemands.fee)})</label>
                <input type="number" id="neg-fee-input" value="${neg.currentFeeOffer || player.value}" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);padding:12px;border-radius:10px;color:white;margin-bottom:15px;" />
                <button class="btn-primary btn-full" id="btn-submit-fee">Gửi đề nghị cho CLB</button>
              </div>
            ` : `
              <div class="neg-contract">
                <div style="margin-bottom:15px">
                  <label style="display:block;margin-bottom:5px;font-size:0.9rem">Mức lương tuần (Yêu cầu: ${formatCurrency(neg.aiDemands.wage)})</label>
                  <input type="number" id="neg-wage-input" value="${neg.currentWageOffer || neg.aiDemands.wage}" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);padding:10px;border-radius:8px;color:white;" />
                </div>
                <div style="margin-bottom:20px">
                  <label style="display:block;margin-bottom:5px;font-size:0.9rem">Vai trò đề nghị</label>
                  <select id="neg-role-input" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border);padding:10px;border-radius:8px;color:white;">
                    <option value="Key" ${neg.currentRoleOffer === "Key" ? "selected" : ""}>⭐ Cầu thủ chủ chốt</option>
                    <option value="First Team" ${neg.currentRoleOffer === "First Team" ? "selected" : ""}>🏃 Đội một</option>
                    <option value="Rotation" ${neg.currentRoleOffer === "Rotation" ? "selected" : ""}>🔄 Xoay tua</option>
                    <option value="Backup" ${neg.currentRoleOffer === "Backup" ? "selected" : ""}>🪑 Dự bị</option>
                  </select>
                </div>
                <button class="btn-primary btn-full" id="btn-submit-contract">Gửi đề nghị cho Cầu thủ</button>
              </div>
            `}
          `}
        </div>
      `;

      modal.querySelectorAll(".btn-close-modal").forEach(b => b.addEventListener("click", () => {
        modal.remove();
        draw();
      }));

      const feeBtn = modal.querySelector("#btn-submit-fee");
      if (feeBtn) {
        feeBtn.addEventListener("click", () => {
          const fee = parseInt(modal.querySelector("#neg-fee-input").value);
          gameState.processTransferOffer(neg, fee);
          renderModal();
        });
      }

      const contractBtn = modal.querySelector("#btn-submit-contract");
      if (contractBtn) {
        contractBtn.addEventListener("click", () => {
          const wage = parseInt(modal.querySelector("#neg-wage-input").value);
          const role = modal.querySelector("#neg-role-input").value;
          gameState.processContractOffer(neg, wage, role);
          renderModal();
        });
      }
    }

    document.body.appendChild(modal);
    renderModal();
  }

  draw();
}
