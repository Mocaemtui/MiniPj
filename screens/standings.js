// ============================================================
// STANDINGS SCREEN – League Table & Top Scorers
// ============================================================
import { gameState } from "../engine/gameState.js";

export function renderStandings(container, router) {
  let activeTab = "table"; // "table" | "stats"
  let sortBy = "points";

  function draw() {
    let sortedTable = [...gameState.getSortedTable()];
    
    if (sortBy !== "points") {
      sortedTable.sort((a, b) => {
        if (sortBy === "teamName") {
          const nameA = gameState.getTeamById(a.teamId)?.name || "";
          const nameB = gameState.getTeamById(b.teamId)?.name || "";
          return nameA.localeCompare(nameB);
        }
        if (sortBy === "rank") return 0; // Default rank sorting
        return b[sortBy] - a[sortBy];
      });
    }

    const team = gameState.getMyTeam();
    const topScorers = [...gameState.players]
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);
      
    const topAssists = [...gameState.players]
      .filter((p) => p.assists > 0)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 20);

    container.innerHTML = `
      <div class="screen-header">
        <div>
          <h1 class="screen-title">🏆 Giải Đấu</h1>
          <p class="screen-subtitle">Bảng xếp hạng và thống kê Global Super League 2026</p>
        </div>
      </div>

      <div class="standings-layout" style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
        <!-- Tabs -->
        <div class="neg-tabs" style="display:flex; gap:10px; margin-bottom:20px; flex-shrink:0">
          <button class="btn-secondary tab-btn ${activeTab === "table" ? "active" : ""}" data-tab="table" style="${activeTab === "table" ? "border-color:var(--primary); color:var(--primary)" : ""}">
            Bảng Xếp Hạng
          </button>
          <button class="btn-secondary tab-btn ${activeTab === "stats" ? "active" : ""}" data-tab="stats" style="${activeTab === "stats" ? "border-color:var(--primary); color:var(--primary)" : ""}">
            Thống Kê Cầu Thủ
          </button>
        </div>

        <!-- Content -->
        <div class="standings-content" style="flex:1; overflow:hidden; display:flex;">
          ${activeTab === "table" ? renderTable(sortedTable, team) : renderStats(topScorers, topAssists)}
        </div>
      </div>
    `;

    // Attach Listeners
    container.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        draw();
      });
    });

    container.querySelectorAll(".sortable").forEach(th => {
      th.addEventListener("click", () => {
        sortBy = th.dataset.sort;
        draw();
      });
    });
  }

  function renderTable(sortedTable, myTeam) {
    return `
      <div class="glass-card" style="padding:0; flex:1; display:flex; flex-direction:column; overflow:hidden;">
        <div style="overflow-y:auto; flex:1;">
          <table class="league-table-mini" style="width:100%; text-align:center;">
            <thead>
              <tr style="position:sticky; top:0; background:var(--bg-card); z-index:10; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                <th class="sortable" data-sort="rank" style="text-align:center; padding:15px">#</th>
                <th class="sortable" data-sort="teamName" style="text-align:left">Đội Bóng</th>
                <th class="sortable" data-sort="played" title="Trận đã đấu">Trận</th>
                <th class="sortable" data-sort="won" title="Thắng">T</th>
                <th class="sortable" data-sort="drawn" title="Hòa">H</th>
                <th class="sortable" data-sort="lost" title="Thua">B</th>
                <th class="sortable" data-sort="gf" title="Bàn thắng">BT</th>
                <th class="sortable" data-sort="ga" title="Bàn thua">BB</th>
                <th class="sortable" data-sort="gd" title="Hiệu số">HS</th>
                <th class="sortable" data-sort="points" title="Điểm số" style="color:var(--primary); font-weight:bold; font-size:1.1rem">Điểm</th>
              </tr>
            </thead>
            <tbody>
              ${sortedTable.map((e, i) => {
                const t = gameState.getTeamById(e.teamId);
                const isMe = e.teamId === myTeam.id;
                
                // Highlight champions league spots (1-4), europa (5-6), relegation (18-20)
                let rankColor = "var(--text-dim)";
                if (i < 4) rankColor = "#00aaff"; // UCL
                else if (i < 6) rankColor = "#ff9900"; // UEL
                else if (i >= sortedTable.length - 3) rankColor = "#ff4444"; // Relegation
                
                return `
                  <tr class="${isMe ? "my-row" : ""}" style="transition:background 0.2s">
                    <td style="font-weight:bold; color:${rankColor}">${i + 1}</td>
                    <td style="text-align:left; display:flex; align-items:center; gap:10px; padding:12px 10px;">
                      <span style="font-size:1.5rem">${t?.logo}</span>
                      <strong style="${isMe ? "color:var(--primary)" : ""}">${t?.name}</strong>
                    </td>
                    <td>${e.played}</td>
                    <td>${e.won}</td>
                    <td>${e.drawn}</td>
                    <td>${e.lost}</td>
                    <td>${e.gf}</td>
                    <td>${e.ga}</td>
                    <td style="color:${e.gd > 0 ? '#00ff88' : e.gd < 0 ? '#ff4444' : 'inherit'}">${e.gd > 0 ? '+' : ''}${e.gd}</td>
                    <td style="font-weight:900; font-size:1.2rem; color:${isMe ? 'var(--primary)' : 'inherit'}">${e.points}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderStats(topScorers, topAssists) {
    return `
      <div style="display:flex; gap:20px; flex:1; overflow:hidden;">
        <!-- Vua phá lưới -->
        <div class="glass-card" style="padding:0; flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <h3 style="padding:20px; margin:0; border-bottom:1px solid var(--border)">⚽ Vua Phá Lưới</h3>
          <div style="overflow-y:auto; flex:1;">
            <table class="league-table-mini" style="width:100%">
              <thead style="position:sticky; top:0; background:var(--bg-card); z-index:10;">
                <tr>
                  <th style="padding-left:20px">#</th>
                  <th>Cầu thủ</th>
                  <th>Đội bóng</th>
                  <th style="text-align:right; padding-right:20px">Bàn thắng</th>
                </tr>
              </thead>
              <tbody>
                ${topScorers.length ? topScorers.map((p, i) => {
                  const t = gameState.getTeamById(p.teamId);
                  return `
                    <tr>
                      <td style="padding-left:20px; font-weight:bold; color:${i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-dim)'}">${i + 1}</td>
                      <td><strong>${p.name}</strong><br><small style="color:var(--text-dim)">${p.pos}</small></td>
                      <td>${t ? `${t.logo} ${t.name}` : "Tự do"}</td>
                      <td style="text-align:right; padding-right:20px; font-size:1.2rem; font-weight:bold; color:var(--primary)">${p.goals}</td>
                    </tr>
                  `;
                }).join("") : '<tr><td colspan="4" style="text-align:center; padding:30px">Chưa có bàn thắng nào.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Vua kiến tạo -->
        <div class="glass-card" style="padding:0; flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <h3 style="padding:20px; margin:0; border-bottom:1px solid var(--border)">👟 Vua Kiến Tạo</h3>
          <div style="overflow-y:auto; flex:1;">
            <table class="league-table-mini" style="width:100%">
              <thead style="position:sticky; top:0; background:var(--bg-card); z-index:10;">
                <tr>
                  <th style="padding-left:20px">#</th>
                  <th>Cầu thủ</th>
                  <th>Đội bóng</th>
                  <th style="text-align:right; padding-right:20px">Kiến tạo</th>
                </tr>
              </thead>
              <tbody>
                ${topAssists.length ? topAssists.map((p, i) => {
                  const t = gameState.getTeamById(p.teamId);
                  return `
                    <tr>
                      <td style="padding-left:20px; font-weight:bold; color:${i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-dim)'}">${i + 1}</td>
                      <td><strong>${p.name}</strong><br><small style="color:var(--text-dim)">${p.pos}</small></td>
                      <td>${t ? `${t.logo} ${t.name}` : "Tự do"}</td>
                      <td style="text-align:right; padding-right:20px; font-size:1.2rem; font-weight:bold; color:#00aaff">${p.assists}</td>
                    </tr>
                  `;
                }).join("") : '<tr><td colspan="4" style="text-align:center; padding:30px">Chưa có kiến tạo nào.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  draw();
}
