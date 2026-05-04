// ============================================================
// SQUAD SCREEN
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";
import { POS_ORDER, POS_COLOR } from "../data/constants.js";

export function renderSquad(container, router) {
  const myPlayers = gameState.getMyPlayers();
  const sorted = [...myPlayers].sort(
    (a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos)
  );

  let filterPos = "ALL";
  let sortBy = "overall";
  let selectedPlayerId = null;
  let listeners = []; // Store listeners for cleanup

  function removeListeners() {
    listeners.forEach(({ element, handler, type }) => {
      if (element) {
        element.removeEventListener(type, handler);
      }
    });
    listeners = [];
  }

  function addListener(element, type, handler) {
    if (element) {
      element.addEventListener(type, handler);
      listeners.push({ element, handler, type });
    }
  }

  function draw() {
    removeListeners(); // Clean up old listeners
    
    const filtered = sorted.filter((p) => filterPos === "ALL" || p.pos === filterPos);
    const sortedFiltered = [...filtered].sort((a, b) => {
      if (sortBy === "pos") {
        return POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos);
      }
      if (typeof a[sortBy] === 'string') {
        return a[sortBy].localeCompare(b[sortBy]);
      }
      return b[sortBy] - a[sortBy];
    });
    const selectedPlayer = selectedPlayerId ? gameState.getPlayerById(selectedPlayerId) : null;

    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">👥 Đội Hình</h1>
          <p class="screen-subtitle">${myPlayers.length} cầu thủ · Quỹ lương: ${formatCurrency(gameState.getMyFinance()?.weeklyWage || 0)}/tuần</p>
        </div>
      </div>

      <div class="squad-layout" style="display:flex; gap:25px; flex:1; overflow: hidden;">
        <div class="squad-main" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <!-- Filters -->
          <div class="filter-bar" style="margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap; flex-shrink:0;">
            ${["ALL","GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST"].map((pos) => `
              <button class="btn-secondary filter-btn-sq ${filterPos === pos ? "active" : ""}" 
                style="padding:5px 12px; font-size:0.8rem; ${filterPos === pos ? "border-color:var(--primary)" : ""}" 
                data-pos="${pos}">${pos}</button>
            `).join("")}
          </div>

          <!-- Player list -->
          <div class="glass-card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; flex:1;">
            <div style="overflow-y:auto; flex:1;">
              <table class="league-table-mini">
                <thead>
                  <tr style="position:sticky; top:0; background:var(--bg-card); box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                    <th class="sortable" data-sort="name">Tên</th>
                    <th class="sortable" data-sort="pos">Vị trí</th>
                    <th class="sortable" data-sort="age">Tuổi</th>
                    <th class="sortable" data-sort="overall">Chỉ số</th>
                    <th class="sortable" data-sort="fitness">Thể lực</th>
                    <th class="sortable" data-sort="wage">Lương</th>
                    <th class="sortable" data-sort="value">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  ${sortedFiltered.map((p) => `
                    <tr class="player-row-sq ${p.id === selectedPlayerId ? "my-row" : ""}" 
                      style="cursor:pointer" data-id="${p.id}">
                      <td>${p.name}</td>
                      <td><span style="color:${POS_COLOR[p.pos]}">${p.pos}</span></td>
                      <td>${p.age}</td>
                      <td><strong style="color:var(--primary)">${p.overall}</strong></td>
                      <td>${p.fitness}%</td>
                      <td style="color:var(--primary)">${formatCurrency(p.wage)}</td>
                      <td>${formatCurrency(p.value)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Detail Panel -->
        <div class="player-detail-panel glass-card" style="width:350px; ${selectedPlayer ? "" : "display:none"}">
          ${selectedPlayer ? `
            <div style="text-align:center">
              <div style="font-size:3rem; margin-bottom:10px">${selectedPlayer.pos === "GK" ? "🧤" : "⚽"}</div>
              <h2>${selectedPlayer.name}</h2>
              <p style="color:var(--text-dim)">${selectedPlayer.nationality} · ${selectedPlayer.age} tuổi</p>
            </div>
            <hr style="margin:20px 0; border:0; border-top:1px solid var(--border)">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom: 20px;">
              <div><span>Tổng điểm:</span> <strong style="color:var(--primary)">${selectedPlayer.overall}</strong></div>
              <div><span>Tiềm năng:</span> <strong>${selectedPlayer.potential}</strong></div>
              <div><span>Bàn thắng:</span> <strong>${selectedPlayer.goals}</strong></div>
              <div><span>Kiến tạo:</span> <strong>${selectedPlayer.assists}</strong></div>
            </div>
            
            <h4 style="margin-bottom: 10px; color: var(--primary); text-transform: uppercase; font-size: 0.75rem;">Kỹ thuật</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px 15px; font-size: 0.85rem; margin-bottom: 15px;">
              ${Object.entries(selectedPlayer.attributes.technical).map(([k, v]) => `
                <div style="display:flex; justify-content:space-between">
                  <span style="color:var(--text-dim)">${k.charAt(0).toUpperCase() + k.slice(1)}:</span> 
                  <strong>${v}</strong>
                </div>
              `).join("")}
            </div>

            <h4 style="margin-bottom: 10px; color: #00ff88; text-transform: uppercase; font-size: 0.75rem;">Trí tuệ</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px 15px; font-size: 0.85rem; margin-bottom: 15px;">
              ${Object.entries(selectedPlayer.attributes.mental).map(([k, v]) => `
                <div style="display:flex; justify-content:space-between">
                  <span style="color:var(--text-dim)">${k.charAt(0).toUpperCase() + k.slice(1)}:</span> 
                  <strong>${v}</strong>
                </div>
              `).join("")}
            </div>

            <h4 style="margin-bottom: 10px; color: #ff6600; text-transform: uppercase; font-size: 0.75rem;">Thể chất</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px 15px; font-size: 0.85rem; margin-bottom: 15px;">
              ${Object.entries(selectedPlayer.attributes.physical).map(([k, v]) => `
                <div style="display:flex; justify-content:space-between">
                  <span style="color:var(--text-dim)">${k.charAt(0).toUpperCase() + k.slice(1)}:</span> 
                  <strong>${v}</strong>
                </div>
              `).join("")}
            </div>

            <div style="margin-top:20px; display:flex; gap:10px;">
              <button class="btn-primary" id="btn-view-profile" data-id="${selectedPlayer.id}" style="flex:1">🔍 Chi tiết</button>
              <button class="btn-danger" id="btn-sell-player" data-id="${selectedPlayer.id}" style="flex:1">💰 Bán</button>
            </div>
          ` : ""}
        </div>
      </div>
    `;

    // Attach Event Listeners
    try {
      container.querySelectorAll(".filter-btn-sq").forEach(btn => {
        const handler = () => {
          filterPos = btn.dataset.pos;
          draw();
        };
        addListener(btn, "click", handler);
      });

      container.querySelectorAll(".sortable").forEach(th => {
        const handler = () => {
          sortBy = th.dataset.sort;
          draw();
        };
        addListener(th, "click", handler);
      });

      container.querySelectorAll(".player-row-sq").forEach(row => {
        const handler = () => {
          selectedPlayerId = parseInt(row.dataset.id);
          draw();
        };
        addListener(row, "click", handler);
      });

      const viewBtn = container.querySelector("#btn-view-profile");
      if (viewBtn) {
        const handler = () => {
          try {
            const id = viewBtn.dataset.id;
            router.navigate(`player/${id}`);
          } catch (e) {
            console.error("Error navigating to player profile:", e);
            alert("❌ Lỗi khi xem chi tiết cầu thủ!");
          }
        };
        addListener(viewBtn, "click", handler);
      }

      const sellBtn = container.querySelector("#btn-sell-player");
      if (sellBtn) {
        const handler = () => {
          try {
            const id = parseInt(sellBtn.dataset.id);
            const p = gameState.getPlayerById(id);
            if (!p) {
              alert("❌ Không tìm thấy cầu thủ!");
              return;
            }
            if (confirm(`Bán ${p.name} với giá ${formatCurrency(p.value)}?`)) {
              gameState.sellPlayer(id, p.value);
              selectedPlayerId = null;
              draw();
            }
          } catch (e) {
            console.error("Error selling player:", e);
            alert("❌ Lỗi khi bán cầu thủ!");
          }
        };
        addListener(sellBtn, "click", handler);
      }
    } catch (e) {
      console.error("Error attaching event listeners in squad:", e);
    }
  }

  draw();
}
