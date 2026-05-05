// ============================================================
// MAIN – App Entry Point, Router, Sidebar
// ============================================================
import { gameState } from "./engine/gameState.js";

// Global error handling
window.onerror = function(msg, url, line, col, error) {
  console.error("App Error:", msg, "at", url, ":", line);
  const container = document.getElementById("screen-content");
  if (container) {
    container.innerHTML = `
      <div style="padding: 50px; text-align: center; color: white; background: #0f172a; height: 100vh;">
        <h1 style="color: #ff4444;">🚨 Đã xảy ra lỗi hệ thống</h1>
        <p style="color: #94a3b8; margin: 20px 0;">Ứng dụng gặp sự cố không mong muốn. Thử tải lại trang hoặc xóa dữ liệu duyệt web.</p>
        <code style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; display: inline-block; text-align: left; font-size: 0.8rem; max-width: 80%; overflow: auto;">
          ${msg}<br>at ${line}:${col}
        </code><br><br>
        <button onclick="location.reload()" style="background: #00ff88; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Tải lại trang 🔄</button>
      </div>
    `;
  }
  return false;
};
import { renderMenu } from "./screens/menu.js";
import { renderDashboard } from "./screens/dashboard.js";
import { renderSquad } from "./screens/squad.js";
import { renderTactics } from "./screens/tactics.js";
import { renderMatch } from "./screens/match.js";
import { renderTransfer } from "./screens/transfer.js";
import { renderNegotiations } from "./screens/negotiations.js";
import { renderStandings } from "./screens/standings.js";
import { renderPlayerDetails } from "./screens/playerDetails.js";
import { renderTraining } from "./screens/training.js";
import { renderYouth } from "./screens/youth.js";
import { renderFinances } from "./screens/finances.js";

// ---- Router ----
class Router {
  constructor() {
    this.currentScreen = "menu";
    this.container = document.getElementById("screen-content");
    this.routes = {
      menu: renderMenu,
      dashboard: renderDashboard,
      standings: renderStandings,
      squad: renderSquad,
      tactics: renderTactics,
      match: renderMatch,
      transfer: renderTransfer,
      negotiations: renderNegotiations,
      training: renderTraining,
      youth: renderYouth,
      finances: renderFinances,
      player: renderPlayerDetails
    };
  }

  navigate(path) {
    const parts = path.split("/");
    const screen = parts[0];
    const params = { id: parts[1] };

    if (!this.routes[screen]) return;
    this.currentScreen = screen;

    // Update sidebar active state
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.screen === screen);
    });

    // Show/hide sidebar & header
    const sidebar = document.getElementById("sidebar");
    const topHeader = document.getElementById("top-header");
    if (screen === "menu") {
      sidebar.style.display = "none";
      if (topHeader) topHeader.style.display = "none";
    } else {
      sidebar.style.display = "flex";
      if (topHeader) topHeader.style.display = "flex";
    }

    // Render
    this.container.innerHTML = "";
    this.container.scrollTop = 0;
    this.routes[screen](this.container, this, params);

    // Update header info
    this.updateHeader();
  }

  updateHeader() {
    if (!gameState.initialized) return;
    const team = gameState.getMyTeam();
    if (!team) return;
    
    const entry = gameState.getMyTableEntry();
    const fin = gameState.getMyFinance();
    const sortedTable = gameState.getSortedTable();
    const pos = (sortedTable && team) ? (sortedTable.findIndex((e) => e.teamId === team.id) + 1) : 0;

    document.getElementById("header-team").textContent = `${team.logo} ${team.name}`;
    document.getElementById("header-pos").textContent = `#${pos}`;
    document.getElementById("header-pts").textContent = `${entry?.points || 0} điểm`;
    document.getElementById("header-balance").textContent = formatCurrencyLocal(fin?.balance || 0);
    document.getElementById("header-date").textContent = gameState.getFormattedDate();
    document.getElementById("header-coach").textContent = `HLV: ${gameState.coach?.name || ""}`;

    // Unread news badge
    const unread = gameState.news.filter((n) => !n.read).length;
    const badge = document.getElementById("news-badge");
    if (badge) badge.textContent = unread > 0 ? unread : "";
  }
}

function formatCurrencyLocal(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

// ---- Bootstrap ----
const router = new Router();
window.router = router;
window.gameState = gameState; // Expose for inline handlers (e.g. Save button)

// Listen for state changes to update header
gameState.on("stateChanged", () => router.updateHeader());

// Listen for notifications
gameState.on("notification", ({ msg, type }) => {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3000);
});

// Start on menu
router.navigate("menu");
