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

      <!-- Controls -->
      <div class="match-controls glass-card">
        ${!matchStarted ? `
          <button class="btn-primary btn-big" id="btn-live">
            ▶ Thi Đấu Trực Tiếp (Live)
          </button>
          <button class="btn-secondary btn-big" id="btn-sim-full">
            ⚡ Mô Phỏng Nhanh
          </button>
          <button class="btn-ghost" id="btn-goto-tactics">
            🧠 Điều chỉnh chiến thuật
          </button>
        ` : !matchFinished ? `
          <button class="btn-danger" id="btn-stop-match">⏹ Dừng</button>
        ` : `
          <button class="btn-primary" id="btn-finish-dash">🏠 Về Dashboard</button>
          <button class="btn-secondary" id="btn-view-squad">👥 Xem đội hình</button>
        `}
      </div>

      <!-- Commentary -->
      <div class="glass-card match-commentary">
        <h3>🎙 Bình Luận</h3>
        <div class="commentary-feed" id="commentary-feed">
          ${events.length ? [...events].reverse().map((e) => `
            <div class="commentary-item ${e.type}">
              <span class="comm-minute">${e.minute}'</span>
              <span class="comm-text">${e.text}</span>
            </div>
          `).join("") : '<div class="comm-placeholder">Chờ tiếng còi khai mạc... 🎺</div>'}
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
