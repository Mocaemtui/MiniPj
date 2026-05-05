// ============================================================
// TRANSFER SCREEN
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";
import { POS_COLOR } from "../data/constants.js";

export function renderTransfer(container, router) {
  let searchQuery = "";
  let filterPos = "ALL";
  let sortBy = "overall";
  let viewMode = "market"; // "market" | "myteam"
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

  function getMarketPlayers() {
    return gameState.players
      .filter((p) => p.teamId !== gameState.playerTeamId)
      .filter((p) => {
        if (!searchQuery) return true;
        return p.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .filter((p) => filterPos === "ALL" || p.pos === filterPos)
      .sort((a, b) => b[sortBy] - a[sortBy]);
  }

  function draw() {
    const fin = gameState.getMyFinance();
    const marketPlayers = getMarketPlayers();

    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">🔄 Chợ Chuyển Nhượng</h1>
          <p class="screen-subtitle">Ngân sách: <strong style="color:#00ff88">${formatCurrency(fin?.balance || 0)}</strong></p>
        </div>
      </div>

      <div class="transfer-layout" style="display:flex; gap:25px; flex:1; overflow:hidden;">
        <div class="transfer-main" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <!-- Search & Filter -->
          <div class="transfer-toolbar" style="flex-shrink:0;">
            <div class="search-box">
              <input type="text" id="search-player" placeholder="🔍 Tìm cầu thủ..."
                value="${searchQuery}" />
            </div>

            <div class="filter-bar">
              ${["ALL","GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST"].map((pos) => `
                <button class="filter-btn filter-btn-tr ${filterPos === pos ? "active" : ""}"
                  data-pos="${pos}">${pos}</button>
              `).join("")}
            </div>

            <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap">
              <div class="sort-control">
                Sắp xếp:
                <select id="sort-players">
                  <option value="overall" ${sortBy==="overall"?"selected":""}>Tổng điểm</option>
                  <option value="potential" ${sortBy==="potential"?"selected":""}>Tiềm năng</option>
                  <option value="value" ${sortBy==="value"?"selected":""}>Giá trị</option>
                  <option value="age" ${sortBy==="age"?"selected":""}>Tuổi</option>
                </select>
              </div>

              <div class="filter-group">
                Độ tuổi:
                <select id="filter-age">
                  <option value="all">Tất cả</option>
                  <option value="young">Trẻ (< 23)</option>
                  <option value="prime">Đỉnh cao (23-29)</option>
                  <option value="vet">Kinh nghiệm (> 29)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Player cards grid -->
          <div class="transfer-grid" style="flex:1; overflow-y:auto; padding-right:10px;">
            ${marketPlayers.length ? marketPlayers.map((p) => {
              const team = p.teamId ? gameState.getTeamById(p.teamId) : null;
              const canAfford = (fin?.balance || 0) >= p.value;
              return `
                <div class="transfer-card glass-card ${canAfford ? "" : "cant-afford"}">
                  <div class="tc-header">
                    <div class="tc-pos" style="background:${POS_COLOR[p.pos]}22;color:${POS_COLOR[p.pos]}">${p.pos}</div>
                    <div class="tc-team">${team ? `${team.logo} ${team.name}` : "🆓 Tự do"}</div>
                  </div>

                  <div class="tc-overall">${p.overall}</div>
                  <div class="tc-name">${p.name}</div>
                  <div class="tc-nat">${p.nationality} · ${p.age} tuổi</div>

                  <div class="tc-attrs" style="display: grid; grid-template-columns: 1fr; gap: 4px; margin-bottom: 10px; font-size: 0.75rem;">
                    ${(() => {
                      const avg = (obj) => {
                        const vals = Object.values(obj);
                        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                      };
                      return `
                        <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px">
                          <span style="color:var(--primary)">Technical</span> <strong>${avg(p.attributes.technical)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px">
                          <span style="color:#00ff88">Mental</span> <strong>${avg(p.attributes.mental)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px">
                          <span style="color:#ff6600">Physical</span> <strong>${avg(p.attributes.physical)}</strong>
                        </div>
                      `;
                    })()}
                  </div>

                  <div class="tc-potential">
                    Tiềm năng: <strong>${p.potential}</strong>
                  </div>

                  <div class="tc-footer">
                    <div class="tc-value">💰 ${formatCurrency(p.value)}</div>
                    <div class="tc-wage">💵 ${formatCurrency(p.wage)}/tuần</div>
                  </div>

                  <button class="btn-primary btn-full tc-buy btn-buy-tr ${!canAfford ? "disabled" : ""}"
                    data-id="${p.id}">
                    ${canAfford ? "💳 Mua ngay" : "❌ Không đủ tiền"}
                  </button>
                </div>
              `;
            }).join("") : '<div class="empty-results">Không tìm thấy cầu thủ phù hợp</div>'}
          </div>
        </div>

        <!-- My players for sale -->
        <div class="transfer-sidebar glass-card" style="width:350px; display:flex; flex-direction:column; overflow:hidden;">
          <h3>💸 Bán Cầu Thủ</h3>
          <p style="color:var(--text-dim);font-size:0.8rem">Click để đặt giá và bán</p>
          <div class="sell-list" style="flex:1; overflow-y:auto; padding-right:10px;">
            ${gameState.getMyPlayers().map((p) => `
              <div class="sell-row">
                <div class="sell-info">
                  <span class="bench-pos" style="color:${POS_COLOR[p.pos]}">${p.pos}</span>
                  <span class="sell-name">${p.name}</span>
                  <span class="bench-ov">${p.overall}</span>
                </div>
                <button class="btn-sell btn-sell-tr" data-id="${p.id}">
                  ${formatCurrency(p.value)}
                </button>
              </div>
            `).join("")}
          </div>

          <div class="budget-summary">
            <h4>💼 Tài chính</h4>
            <div class="budget-item"><span>Ngân sách hiện tại</span><strong style="color:#00ff88">${formatCurrency(fin?.balance || 0)}</strong></div>
            <div class="budget-item"><span>Quỹ lương/tuần</span><strong>${formatCurrency(gameState.getMyPlayers().reduce((s,p) => s+p.wage, 0))}</strong></div>
          </div>
        </div>
      </div>
    `;

    // Attach Event Listeners
    try {
      removeListeners(); // Clean up old listeners
      
      const searchInput = container.querySelector("#search-player");
      if (searchInput) {
        const handler = (e) => {
          searchQuery = e.target.value;
          draw();
        };
        addListener(searchInput, "input", handler);
      }

      container.querySelectorAll(".filter-btn-tr").forEach(btn => {
        const handler = () => {
          filterPos = btn.dataset.pos;
          draw();
        };
        addListener(btn, "click", handler);
      });

      const sortSelect = container.querySelector("#sort-players");
      if (sortSelect) {
        const handler = (e) => {
          sortBy = e.target.value;
          draw();
        };
        addListener(sortSelect, "change", handler);
      }

      container.querySelectorAll(".btn-buy-tr").forEach(btn => {
        const handler = () => {
          try {
            const id = parseInt(btn.dataset.id);
            const player = gameState.getPlayerById(id);
            if (!player) {
              alert("❌ Không tìm thấy cầu thủ!");
              return;
            }
            
            gameState.startNegotiation(player.id);
            router.navigate("negotiations");
          } catch (e) {
            console.error("Error starting negotiation:", e);
            alert("❌ Lỗi khi bắt đầu thương thảo!");
          }
        };
        addListener(btn, "click", handler);
      });

      container.querySelectorAll(".btn-sell-tr").forEach(btn => {
        const handler = () => {
          try {
            const id = parseInt(btn.dataset.id);
            const p = gameState.getPlayerById(id);
            if (!p) {
              alert("❌ Không tìm thấy cầu thủ!");
              return;
            }
            if (confirm(`Bán ${p.name} với giá ${formatCurrency(p.value)}?`)) {
              gameState.sellPlayer(id, p.value);
              showToast(`💰 Đã bán ${p.name}!`);
              draw();
            }
          } catch (e) {
            console.error("Error selling player:", e);
            alert("❌ Lỗi khi bán cầu thủ!");
          }
        };
        addListener(btn, "click", handler);
      });
    } catch (e) {
      console.error("Error attaching event listeners in transfer:", e);
    }
  }

  draw();
}

function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3000);
}
