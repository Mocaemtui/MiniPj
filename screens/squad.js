// ============================================================
// SQUAD SCREEN
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";

const POS_ORDER = ["GK","CB","LB","RB","CDM","CM","CAM","LM","RM","LW","RW","ST"];
const POS_COLOR = {
  GK:"#ffd700", CB:"#00aaff", LB:"#00aaff", RB:"#00aaff",
  CDM:"#00ff88", CM:"#00ff88", CAM:"#00ff88", LM:"#00ff88", RM:"#00ff88",
  LW:"#ff6600", RW:"#ff6600", ST:"#ff3333"
};

export function renderSquad(container, router) {
  const myPlayers = gameState.getMyPlayers();
  const sorted = [...myPlayers].sort(
    (a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos)
  );

  let filterPos = "ALL";
  let sortBy = "overall";
  let selectedPlayerId = null;

  function draw() {
    const filtered = sorted.filter((p) => filterPos === "ALL" || p.pos === filterPos);
    const sortedFiltered = [...filtered].sort((a, b) => {
      if (sortBy === "pos") {
        const order = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"];
        return order.indexOf(a.pos) - order.indexOf(b.pos);
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
    container.querySelectorAll(".filter-btn-sq").forEach(btn => {
      btn.addEventListener("click", () => {
        filterPos = btn.dataset.pos;
        draw();
      });
    });

    container.querySelectorAll(".sortable").forEach(th => {
      th.addEventListener("click", () => {
        sortBy = th.dataset.sort;
        draw();
      });
    });

    container.querySelectorAll(".player-row-sq").forEach(row => {
      row.addEventListener("click", () => {
        selectedPlayerId = parseInt(row.dataset.id);
        draw();
      });
    });

    const viewBtn = container.querySelector("#btn-view-profile");
    if (viewBtn) {
      viewBtn.addEventListener("click", () => {
        const id = viewBtn.dataset.id;
        router.navigate(`player/${id}`);
      });
    }

    const sellBtn = container.querySelector("#btn-sell-player");
    if (sellBtn) {
      sellBtn.addEventListener("click", () => {
        const id = parseInt(sellBtn.dataset.id);
        const p = gameState.getPlayerById(id);
        if (confirm(`Bán ${p.name} với giá ${formatCurrency(p.value)}?`)) {
          gameState.sellPlayer(id, p.value);
          selectedPlayerId = null;
          draw();
        }
      });
    }
  }

  draw();
}
