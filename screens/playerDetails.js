import { gameState, formatCurrency } from "../engine/gameState.js";

export function renderPlayerDetails(container, router, params) {
  const playerId = parseInt(params.id);
  const player = gameState.getPlayerById(playerId);

  if (!player) {
    container.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">❌ Không tìm thấy cầu thủ</h1>
      </div>
      <div class="glass-card">
        <p>Cầu thủ bạn tìm kiếm không tồn tại hoặc đã giải nghệ.</p>
        <button class="btn-primary" onclick="router.navigate('dashboard')">Quay lại Dashboard</button>
      </div>
    `;
    return;
  }

  const isMyPlayer = player.teamId === gameState.playerTeamId;
  const team = gameState.getTeamById(player.teamId);

  container.innerHTML = `
    <div class="screen-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h1 class="screen-title">${player.name}</h1>
        <p class="screen-subtitle">${player.pos} | ${team ? team.name : "Tự do"} | ${player.age} tuổi</p>
      </div>
      <button class="btn-secondary" id="btn-back-prev">⬅ Quay lại</button>
    </div>

    <div class="player-details-grid" style="display:grid; grid-template-columns: 380px 1fr; gap:25px; height: calc(100vh - 180px); overflow:hidden;">
      
      <!-- Left Column: Card & Basic Info -->
      <div class="player-sidebar" style="overflow-y:auto; padding-right:5px;">
        <div class="glass-card player-main-card" style="text-align:center; padding:30px 20px;">
          <div class="player-avatar-large" style="font-size:4rem; margin-bottom:15px;">👤</div>
          
          <!-- Radar Chart SVG -->
          <div class="radar-container" style="width:200px; height:200px; margin: 0 auto 20px; position:relative;">
            ${renderRadarChart(player)}
          </div>

          <div class="player-ov-badge" style="font-size:2.5rem; font-weight:900; color:var(--primary); margin-bottom:5px;">${player.overall}</div>
          <h2 style="margin:0; font-size:1.4rem;">${player.name}</h2>
          <div style="margin:10px 0; display:flex; justify-content:center; gap:8px; font-size:0.8rem;">
            <span class="tag-pos" style="background:var(--primary); color:#000; padding:3px 10px; border-radius:20px; font-weight:700;">${player.pos}</span>
            <span class="tag-nat" style="background:rgba(255,255,255,0.1); padding:3px 10px; border-radius:20px;">🇻🇳 ${player.nationality || "VN"}</span>
          </div>
          
          <div class="player-market-info" style="margin-top:20px; padding-top:15px; border-top:1px solid var(--border); font-size:0.9rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:var(--text-dim)">Giá trị:</span>
              <span style="font-weight:700; color:var(--accent-gold)">${formatCurrency(player.value)}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--text-dim)">Lương:</span>
              <span style="font-weight:700; color:var(--primary)">${formatCurrency(player.wage)} / tuần</span>
            </div>
          </div>
        </div>

        <div class="glass-card" style="margin-top:20px;">
          <h3>📊 Thống kê mùa giải</h3>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:15px; text-align:center;">
            <div class="stat-box">
              <div style="font-size:1.4rem; font-weight:800;">${player.appearances || 0}</div>
              <div style="font-size:0.6rem; color:var(--text-dim)">TRẬN</div>
            </div>
            <div class="stat-box">
              <div style="font-size:1.4rem; font-weight:800; color:var(--primary);">${player.goals || 0}</div>
              <div style="font-size:0.6rem; color:var(--text-dim)">BÀN</div>
            </div>
            <div class="stat-box">
              <div style="font-size:1.4rem; font-weight:800; color:var(--secondary);">${player.assists || 0}</div>
              <div style="font-size:0.6rem; color:var(--text-dim)">KIẾN TẠO</div>
            </div>
          </div>
        </div>

        ${!isMyPlayer ? `
          <button class="btn-primary btn-full" id="btn-negotiate" style="margin-top:20px; padding:15px; font-weight:700;">🤝 ĐÀM PHÁN</button>
        ` : ""}
      </div>

      <!-- Right Column: Detailed Attributes -->
      <div class="player-attributes-col" style="overflow-y:auto;">
        <div class="glass-card" style="height:100%">
          <h3 style="margin-bottom:25px; border-bottom:1px solid var(--border); padding-bottom:10px;">📉 Chỉ số chi tiết</h3>
          
          <div class="attributes-container" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:30px;">
            
            <!-- Technical -->
            <div class="attr-group">
              <h4 style="color:var(--primary); border-bottom:2px solid var(--primary); padding-bottom:5px; margin-bottom:15px;">KỸ THUẬT</h4>
              ${Object.entries(player.attributes.technical).map(([key, val]) => `
                <div class="attr-row" style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.9rem;">
                  <span style="color:var(--text-dim); text-transform:capitalize;">${translateAttr(key)}</span>
                  <span class="attr-val ${val >= 80 ? "elite" : val >= 70 ? "good" : ""}" style="font-weight:700; color:${val >= 80 ? "var(--primary)" : val >= 70 ? "var(--secondary)" : "#fff"}">${val}</span>
                </div>
              `).join("")}
            </div>

            <!-- Mental -->
            <div class="attr-group">
              <h4 style="color:var(--secondary); border-bottom:2px solid var(--secondary); padding-bottom:5px; margin-bottom:15px;">TÂM LÝ</h4>
              ${Object.entries(player.attributes.mental).map(([key, val]) => `
                <div class="attr-row" style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.9rem;">
                  <span style="color:var(--text-dim); text-transform:capitalize;">${translateAttr(key)}</span>
                  <span class="attr-val" style="font-weight:700;">${val}</span>
                </div>
              `).join("")}
            </div>

            <!-- Physical -->
            <div class="attr-group">
              <h4 style="color:var(--accent-gold); border-bottom:2px solid var(--accent-gold); padding-bottom:5px; margin-bottom:15px;">THỂ CHẤT</h4>
              ${Object.entries(player.attributes.physical).map(([key, val]) => `
                <div class="attr-row" style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.9rem;">
                  <span style="color:var(--text-dim); text-transform:capitalize;">${translateAttr(key)}</span>
                  <span class="attr-val" style="font-weight:700;">${val}</span>
                </div>
              `).join("")}
            </div>

          </div>

          <div class="player-history-dummy" style="margin-top:40px; padding-top:20px; border-top:1px solid var(--border);">
            <h4 style="margin-bottom:15px;">🕒 Lịch sử chuyển nhượng</h4>
            <div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:12px; font-size:0.85rem; color:var(--text-dim);">
              Chưa có dữ liệu lịch sử cho cầu thủ này trong mùa giải hiện tại.
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Listeners
  container.querySelector("#btn-back-prev")?.addEventListener("click", () => {
    window.history.back();
  });

  container.querySelector("#btn-negotiate")?.addEventListener("click", () => {
    router.navigate(`negotiations/${player.id}`);
  });
}

function renderRadarChart(p) {
  const stats = getRadarStats(p);
  const size = 200;
  const center = size / 2;
  const radius = center - 20;
  const labels = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
  
  const points = stats.map((val, i) => {
    const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
    const r = (val / 100) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(" ");

  const gridPoints = [20, 40, 60, 80, 100].map(val => {
    const r = (val / 100) * radius;
    return Array.from({length: 6}).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");
  });

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <!-- Grid -->
      ${gridPoints.map(p => `<polygon points="${p}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />`).join("")}
      ${Array.from({length: 6}).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        return `<line x1="${center}" y1="${center}" x2="${center + radius * Math.cos(angle)}" y2="${center + radius * Math.sin(angle)}" stroke="rgba(255,255,255,0.1)" />`;
      }).join("")}
      
      <!-- Labels -->
      ${labels.map((l, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const x = center + (radius + 15) * Math.cos(angle);
        const y = center + (radius + 15) * Math.sin(angle);
        return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="var(--text-dim)" font-size="10" font-weight="700">${l}</text>`;
      }).join("")}

      <!-- Shape -->
      <polygon points="${points}" fill="rgba(0, 255, 136, 0.3)" stroke="var(--primary)" stroke-width="2" />
    </svg>
  `;
}

function getRadarStats(p) {
  if (p.pos === "GK") {
    return [
      p.attributes.physical.pace,
      p.attributes.technical.reflexes,
      p.attributes.technical.diving,
      p.attributes.mental.positioning,
      p.attributes.technical.passing,
      p.attributes.physical.strength
    ];
  }
  return [
    (p.attributes.physical.pace + p.attributes.physical.acceleration) / 2,
    p.attributes.technical.finishing,
    (p.attributes.technical.passing + p.attributes.mental.vision) / 2,
    p.attributes.technical.dribbling,
    (p.attributes.technical.tackling + p.attributes.mental.positioning) / 2,
    (p.attributes.physical.strength + p.attributes.physical.stamina) / 2
  ];
}

function translateAttr(key) {
  const dict = {
    finishing: "Dứt điểm",
    dribbling: "Rê bóng",
    passing: "Chuyền bóng",
    tackling: "Tắc bóng",
    diving: "Đổ người",
    reflexes: "Phản xạ",
    positioning: "Vị trí",
    vision: "Tầm nhìn",
    decisions: "Quyết định",
    pace: "Tốc độ",
    acceleration: "Gia tốc",
    strength: "Sức mạnh",
    stamina: "Thể lực"
  };
  return dict[key] || key;
}
