// ============================================================
// MATCH SCREEN – Live match simulation with commentary
// ============================================================
import { gameState, formatCurrency } from "../engine/gameState.js";
import { MatchEngine } from "../engine/matchEngine.js";

export function renderMatch(container, router) {
  const next = gameState.getNextMatch();

  if (!next) {
    container.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">⚽ Thi Đấu</h1>
      </div>
      <div class="glass-card empty-state">
        <span style="font-size:4rem">🏆</span>
        <h2>Mùa giải đã kết thúc!</h2>
        <p>Tất cả các trận đấu đã được hoàn thành.</p>
        <button class="btn-primary" id="btn-back-dash">Về Dashboard</button>
      </div>
    `;
    window.router = router;
    return;
  }

  const homeTeam = gameState.getTeamById(next.home);
  const awayTeam = gameState.getTeamById(next.away);
  const isHome = next.home === gameState.playerTeamId;
  const myTeam = isHome ? homeTeam : awayTeam;
  const oppTeam = isHome ? awayTeam : homeTeam;

  let engine = null;
  let matchStarted = false;
  let matchFinished = false;

  function draw(homeScore = 0, awayScore = 0, events = [], stats = null, result = null) {
    const st = stats || {
      home: { shots: 0, shotsOnTarget: 0, possession: 50, corners: 0, yellowCards: 0 },
      away: { shots: 0, shotsOnTarget: 0, possession: 50, corners: 0, yellowCards: 0 },
    };

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">⚽ Thi Đấu Trực Tiếp</h1>
        ${matchFinished ? `<button class="btn-primary" id="btn-finish-dash">Về Dashboard</button>` : ""}
      </div>

      <!-- Scoreboard -->
      <div class="match-scoreboard glass-card">
        <div class="match-team-info">
          <div class="match-team-logo">${homeTeam.logo}</div>
          <div class="match-team-label">${homeTeam.name}</div>
          <div class="match-team-rating">Sức mạnh: ${homeTeam.overallRating}</div>
        </div>

        <div class="match-score-center">
          <div class="match-score">${homeScore} – ${awayScore}</div>
          <div class="match-minute" id="match-minute">${matchStarted && !matchFinished ? `<span class="live-dot"></span> Đang đấu...` : matchFinished ? "⏱ KẾT THÚC" : "⏳ Chuẩn bị"}</div>
          ${result ? `<div class="match-result ${result}">${resultText(result)}</div>` : ""}
        </div>

        <div class="match-team-info" style="text-align:right">
          <div class="match-team-logo">${awayTeam.logo}</div>
          <div class="match-team-label">${awayTeam.name}</div>
          <div class="match-team-rating">Sức mạnh: ${awayTeam.overallRating}</div>
        </div>
      </div>

      <!-- Match Body -->
      <div class="match-body" style="display:grid; grid-template-columns: 1fr 300px; gap:20px;">
        <div class="match-main-col" style="display:flex; flex-direction:column; gap:20px;">
          <!-- Stats -->
          ${matchStarted ? `
          <div class="match-stats glass-card">
            <h3>📊 Thống Kê</h3>
            <div class="stats-grid">
              ${renderStat("Bàn thắng kỳ vọng (xG)", st.home.xG?.toFixed(2) || "0.00", st.away.xG?.toFixed(2) || "0.00")}
              ${renderStat("Kiểm soát bóng", st.home.possession + "%", st.away.possession + "%", true)}
              ${renderStat("Cú sút", st.home.shots, st.away.shots)}
              ${renderStat("Trúng khung", st.home.shotsOnTarget, st.away.shotsOnTarget)}
              ${renderStat("Đường chuyền", st.home.passes, st.away.passes)}
              ${renderStat("Chuyền chính xác", st.home.passAccuracy + "%", st.away.passAccuracy + "%", true)}
              ${renderStat("Tắc bóng", st.home.tackles, st.away.tackles)}
              ${renderStat("Cứu thua", st.home.saves, st.away.saves)}
              ${renderStat("Phạt góc", st.home.corners, st.away.corners)}
              ${renderStat("Phạm lỗi", st.home.fouls, st.away.fouls)}
              ${renderStat("Thẻ vàng", st.home.yellowCards, st.away.yellowCards)}
            </div>
          </div>` : ""}

          <!-- Commentary -->
          <div class="glass-card match-commentary" style="flex:1;">
            <h3>🎙 Bình Luận</h3>
            <div class="commentary-feed" id="commentary-feed" style="max-height:400px; overflow-y:auto;">
              ${events.length ? [...events].reverse().map((e) => `
                <div class="commentary-item ${e.type}">
                  <span class="comm-minute">${e.minute}'</span>
                  <span class="comm-text">${e.text}</span>
                </div>
              `).join("") : '<div class="comm-placeholder">Chờ tiếng còi khai mạc... 🎺</div>'}
            </div>
          </div>
        </div>

        <div class="match-side-col" style="display:flex; flex-direction:column; gap:20px;">
          <!-- Controls -->
          <div class="match-controls glass-card">
            ${!matchStarted ? `
              <button class="btn-primary btn-big btn-full" id="btn-live">▶ Thi Đấu (Live)</button>
              <button class="btn-secondary btn-big btn-full" id="btn-sim-full" style="margin-top:10px">⚡ Mô Phỏng Nhanh</button>
              <button class="btn-ghost btn-full" id="btn-goto-tactics" style="margin-top:10px">🧠 Đội hình</button>
            ` : !matchFinished ? `
              <button class="btn-danger btn-full" id="btn-stop-match">⏹ Dừng</button>
            ` : `
              <button class="btn-primary btn-full" id="btn-finish-dash">🏠 Dashboard</button>
            `}
          </div>

          <!-- Quick Tactics -->
          ${matchStarted && !matchFinished ? `
          <div class="glass-card quick-tactics">
            <h3 style="font-size:0.9rem; margin-bottom:15px;">🧠 CHIẾN THUẬT LIVE</h3>
            
            <div class="live-tactic-group" style="margin-bottom:15px;">
              <label style="font-size:0.7rem; color:var(--text-dim); display:block; margin-bottom:5px;">TINH THẦN</label>
              <div class="tactic-btns">
                <button class="tactic-btn mini ${gameState.tactics.mentality === 'defensive' ? 'active' : ''}" data-key="mentality" data-val="defensive">🛡️</button>
                <button class="tactic-btn mini ${gameState.tactics.mentality === 'balanced' ? 'active' : ''}" data-key="mentality" data-val="balanced">⚖️</button>
                <button class="tactic-btn mini ${gameState.tactics.mentality === 'attacking' ? 'active' : ''}" data-key="mentality" data-val="attacking">⚔️</button>
              </div>
            </div>

            <div class="live-tactic-group" style="margin-bottom:15px;">
              <label style="font-size:0.7rem; color:var(--text-dim); display:block; margin-bottom:5px;">PRESSING</label>
              <div class="tactic-btns">
                <button class="tactic-btn mini ${gameState.tactics.pressing === 'low' ? 'active' : ''}" data-key="pressing" data-val="low">🐢</button>
                <button class="tactic-btn mini ${gameState.tactics.pressing === 'medium' ? 'active' : ''}" data-key="pressing" data-val="medium">🚶</button>
                <button class="tactic-btn mini ${gameState.tactics.pressing === 'high' ? 'active' : ''}" data-key="pressing" data-val="high">🔥</button>
              </div>
            </div>

            <div class="live-tactic-group">
              <label style="font-size:0.7rem; color:var(--text-dim); display:block; margin-bottom:5px;">NHỊP ĐỘ</label>
              <div class="tactic-btns">
                <button class="tactic-btn mini ${gameState.tactics.tempo === 'slow' ? 'active' : ''}" data-key="tempo" data-val="slow">🐌</button>
                <button class="tactic-btn mini ${gameState.tactics.tempo === 'medium' ? 'active' : ''}" data-key="tempo" data-val="medium">🚶</button>
                <button class="tactic-btn mini ${gameState.tactics.tempo === 'fast' ? 'active' : ''}" data-key="tempo" data-val="fast">💨</button>
              </div>
            </div>
          </div>
          ` : ""}
        </div>
      </div>
    `;

    // Attach Event Listeners
    container.querySelector("#btn-back-dash")?.addEventListener("click", () => router.navigate("dashboard"));
    
    if (!matchStarted) {
      container.querySelector("#btn-live")?.addEventListener("click", () => {
        matchStarted = true;
        engine = new MatchEngine(next.home, next.away);
        const allEvents = [];
        engine.onEvent = (evt, hs, as) => {
          allEvents.push(evt);
          draw(hs, as, allEvents, engine.stats, null);
        };
        engine.onFinish = ({ homeScore: hs, awayScore: as, events: evts, stats: st, result: r }) => {
          matchFinished = true;
          draw(hs, as, evts, st, r);
        };
        engine.simulateLive(600);
        draw(0, 0, [], null, null);
      });

      container.querySelector("#btn-sim-full")?.addEventListener("click", () => {
        matchStarted = true;
        matchFinished = true;
        const tempEngine = new MatchEngine(next.home, next.away);
        const res = tempEngine.simulateFull();
        const myIsHome = next.home === gameState.playerTeamId;
        const r = myIsHome
          ? (res.homeScore > res.awayScore ? "win" : res.homeScore < res.awayScore ? "loss" : "draw")
          : (res.awayScore > res.homeScore ? "win" : res.awayScore < res.homeScore ? "loss" : "draw");
        draw(res.homeScore, res.awayScore, res.events, res.stats, r);
      });

      container.querySelector("#btn-goto-tactics")?.addEventListener("click", () => router.navigate("tactics"));
    } else if (!matchFinished) {
      container.querySelector("#btn-stop-match")?.addEventListener("click", () => {
        if (engine) engine.stop();
        matchFinished = true;
        draw(engine.homeScore, engine.awayScore, engine.events, engine.stats, "draw");
      });
    } else {
      container.querySelector("#btn-finish-dash")?.addEventListener("click", () => router.navigate("dashboard"));
      container.querySelector("#btn-view-squad")?.addEventListener("click", () => router.navigate("squad"));
    }

    // Live Tactic Buttons
    container.querySelectorAll(".tactic-btn.mini").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        const val = btn.dataset.val;
        gameState.updateTactics({ [key]: val });
        if (engine) engine.updateTactics();
        draw(engine ? engine.homeScore : 0, engine ? engine.awayScore : 0, engine ? engine.events : [], engine ? engine.stats : null, null);
      });
    });
  }

  draw();
}

function renderStat(label, home, away, isPercent = false) {
  const h = parseInt(home) || 0;
  const a = parseInt(away) || 0;
  const total = h + a || 1;
  const hPct = (h / total) * 100;
  const aPct = (a / total) * 100;

  return `
    <div class="stat-row">
      <span class="stat-home-val">${home}</span>
      <div class="stat-bar-center">
        <div class="stat-bar-label">${label}</div>
        <div class="stat-bar-bg">
          <div class="stat-bar-home" style="width:${hPct}%"></div>
          <div class="stat-bar-away" style="width:${aPct}%"></div>
        </div>
      </div>
      <span class="stat-away-val">${away}</span>
    </div>
  `;
}

function resultText(result) {
  if (result === "win") return "🏆 CHIẾN THẮNG!";
  if (result === "loss") return "💔 Thất bại";
  return "🤝 Hòa";
}
