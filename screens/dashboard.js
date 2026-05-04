// ============================================================
// DASHBOARD SCREEN
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";

export function renderDashboard(container, router) {
  const team = gameState.getMyTeam();
  const entry = gameState.getMyTableEntry();
  const next = gameState.getNextMatch();
  const fin = gameState.getMyFinance();
  const myPlayers = gameState.getMyPlayers();
  const sortedTable = gameState.getSortedTable();
  const myPos = team ? sortedTable.findIndex((e) => e.teamId === team.id) + 1 : 0;

  const topScorers = [...gameState.players]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  const recentNews = gameState.news.slice(0, 5);

  const nextMatchTeamId = next && team ? (next.home === team.id ? next.away : next.home) : null;
  const nextMatchTeam = nextMatchTeamId ? gameState.getTeamById(nextMatchTeamId) : null;
  const isHome = next && team ? next.home === team.id : false;

  container.innerHTML = `
    <div class="screen-header">
      <div>
        <h1 class="screen-title">${team ? team.logo : '⚽'} ${team ? team.name : 'Chưa chọn đội'}</h1>
        <p class="screen-subtitle">${gameState.getFormattedDate()}</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" id="btn-calendar">📅 Lịch thi đấu</button>
        <button class="btn-primary" id="btn-match-next">▶ Thi đấu tiếp theo</button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Stat cards -->
      <div class="stat-cards">
        <div class="stat-card accent-green">
          <div class="stat-icon">🏅</div>
          <div class="stat-value">${myPos}${ordinal(myPos)}</div>
          <div class="stat-label">Thứ hạng</div>
        </div>
        <div class="stat-card accent-blue">
          <div class="stat-icon">⚽</div>
          <div class="stat-value">${entry?.points || 0}</div>
          <div class="stat-label">Điểm số</div>
        </div>
        <div class="stat-card accent-purple">
          <div class="stat-icon">🏟️</div>
          <div class="stat-value">${entry?.played || 0}</div>
          <div class="stat-label">Trận đã đấu</div>
        </div>
        <div class="stat-card accent-gold">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${formatCurrency(fin?.balance || 0)}</div>
          <div class="stat-label">Ngân sách</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid-main" style="display:flex; gap:20px; flex:1; margin-top: 20px;">
      <!-- Column 1: Next Match + Morale -->
      <div class="dashboard-col" style="flex:1; display:flex; flex-direction:column; gap:20px;">
        ${next ? `
        <div class="glass-card next-match-card">
          <h3>⚔️ Trận Tiếp Theo</h3>
          <div class="next-match">
            <div class="match-team">
              <span class="match-team-logo">${team ? team.logo : '⚽'}</span>
              <span class="match-team-name">${team ? team.name : 'Đội bóng'}</span>
            </div>
            <div class="match-vs">
              <span class="match-label">${isHome ? "Sân nhà" : "Sân khách"}</span>
              <span class="vs-text">VS</span>
            </div>
            <div class="match-team">
              <span class="match-team-logo">${nextMatchTeam?.logo || "🤜"}</span>
              <span class="match-team-name">${nextMatchTeam?.name || "?"}</span>
            </div>
          </div>
          <button class="btn-primary btn-full" id="btn-goto-match">Vào trận ⚽</button>
        </div>` : `<div class="glass-card"><p style="text-align:center;color:var(--text-dim)">Không còn trận đấu nào 🎉</p></div>`}

        <!-- Team morale -->
        <div class="glass-card" style="flex:1;">
          <h3>💪 Tinh Thần Đội</h3>
          <div class="morale-list">
            ${myPlayers.slice(0, 8).map((p) => `
              <div class="morale-row">
                <span class="morale-name">${p.name}</span>
                <div class="morale-bar-wrap">
                  <div class="morale-bar" style="width:${p.morale}%; background: ${moraleColor(p.morale)}"></div>
                </div>
                <span class="morale-val">${p.morale}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Column 2: League table -->
      <div class="dashboard-col" style="flex:1.2; display:flex; flex-direction:column;">
        <div class="glass-card" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="margin:0">🏆 Bảng Xếp Hạng</h3>
            <button class="btn-secondary" style="padding:4px 10px; font-size:0.8rem" id="btn-goto-standings">Xem chi tiết</button>
          </div>
          <div style="overflow-y:auto; flex:1;">
            <table class="league-table-mini">
              <thead>
                <tr style="position:sticky; top:0; background:var(--bg-card);">
                  <th>#</th><th>Đội</th><th>Đ</th><th>T</th><th>H</th><th>B</th><th>ĐM</th>
                </tr>
              </thead>
              <tbody>
                ${sortedTable.map((e, i) => {
                  const t = gameState.getTeamById(e.teamId);
                  const isMe = team && e.teamId === team.id;
                  return `<tr class="${isMe ? "my-row" : ""}">
                    <td>${i + 1}</td>
                    <td class="team-cell">${t?.logo} ${t?.name}</td>
                    <td>${e.played}</td>
                    <td>${e.won}</td>
                    <td>${e.drawn}</td>
                    <td>${e.lost}</td>
                    <td class="points-cell">${e.points}</td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Column 3: News + Top scorers -->
      <div class="dashboard-col" style="flex:1; display:flex; flex-direction:column; gap:20px;">
        <div class="glass-card" style="flex:1; overflow-y:auto;">
          <h3>📰 Tin Tức</h3>
          <div class="news-list">
            ${recentNews.length ? recentNews.map((n) => `
              <div class="news-item ${n.read ? "" : "unread"}">
                <div class="news-date">${n.date}</div>
                <div class="news-title">${n.title}</div>
                <div class="news-body">${n.body}</div>
              </div>
            `).join("") : '<p style="color:var(--text-dim)">Chưa có tin tức.</p>'}
          </div>
        </div>

        <div class="glass-card">
          <h3>🎯 Vua Phá Lưới</h3>
          ${topScorers.length ? `
          <div class="scorer-list">
            ${topScorers.map((p, i) => `
              <div class="scorer-row">
                <span class="scorer-rank">${["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</span>
                <span class="scorer-name">${p.name}</span>
                <span class="scorer-goals">⚽ ${p.goals}</span>
              </div>
            `).join("")}
          </div>` : '<p style="color:var(--text-dim)">Chưa có bàn thắng nào.</p>'}
        </div>
      </div>
    </div>

    <div class="week-action">
      <button class="btn-week" id="btn-advance-week">⏭ Bỏ qua tuần → Tuần ${gameState.week + 1}</button>
    </div>
  `;

  // Event Listeners
  container.querySelector("#btn-calendar")?.addEventListener("click", () => router.navigate("calendar"));
  container.querySelector("#btn-match-next")?.addEventListener("click", () => router.navigate("match"));
  container.querySelector("#btn-goto-match")?.addEventListener("click", () => router.navigate("match"));
  container.querySelector("#btn-goto-standings")?.addEventListener("click", () => router.navigate("standings"));
  container.querySelector("#btn-advance-week")?.addEventListener("click", () => {
    gameState.advanceWeek();
    renderDashboard(container, router);
  });
}

function ordinal(n) {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}

function moraleColor(val) {
  if (val >= 80) return "linear-gradient(90deg, #00ff88, #00cc66)";
  if (val >= 60) return "linear-gradient(90deg, #ffd700, #ff8c00)";
  return "linear-gradient(90deg, #ff4444, #cc0000)";
}
