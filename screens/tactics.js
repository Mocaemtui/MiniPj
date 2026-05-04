// ============================================================
// TACTICS SCREEN – Formation + Lineup builder
// ============================================================
import { gameState } from "../engine/gameState.js";

const FORMATIONS = {
  "4-4-2": [
    { pos: "GK", x: 50, y: 88 },
    { pos: "RB", x: 85, y: 72 },
    { pos: "CB", x: 65, y: 72 },
    { pos: "CB", x: 35, y: 72 },
    { pos: "LB", x: 15, y: 72 },
    { pos: "RM", x: 85, y: 52 },
    { pos: "CM", x: 62, y: 52 },
    { pos: "CM", x: 38, y: 52 },
    { pos: "LM", x: 15, y: 52 },
    { pos: "ST", x: 65, y: 22 },
    { pos: "ST", x: 35, y: 22 },
  ],
  "4-3-3": [
    { pos: "GK", x: 50, y: 90 },
    { pos: "RB", x: 85, y: 75 },
    { pos: "CB", x: 65, y: 75 },
    { pos: "CB", x: 35, y: 75 },
    { pos: "LB", x: 15, y: 75 },
    { pos: "CM", x: 70, y: 55 },
    { pos: "CM", x: 50, y: 58 },
    { pos: "CM", x: 30, y: 55 },
    { pos: "RW", x: 82, y: 28 },
    { pos: "ST", x: 50, y: 20 },
    { pos: "LW", x: 18, y: 28 },
  ],
  "4-2-3-1": [
    { pos: "GK", x: 50, y: 90 },
    { pos: "RB", x: 85, y: 75 },
    { pos: "CB", x: 65, y: 75 },
    { pos: "CB", x: 35, y: 75 },
    { pos: "LB", x: 15, y: 75 },
    { pos: "CDM", x: 62, y: 60 },
    { pos: "CDM", x: 38, y: 60 },
    { pos: "RW", x: 78, y: 42 },
    { pos: "CAM", x: 50, y: 40 },
    { pos: "LW", x: 22, y: 42 },
    { pos: "ST", x: 50, y: 20 },
  ],
  "3-5-2": [
    { pos: "GK", x: 50, y: 90 },
    { pos: "CB", x: 72, y: 76 },
    { pos: "CB", x: 50, y: 78 },
    { pos: "CB", x: 28, y: 76 },
    { pos: "RM", x: 88, y: 55 },
    { pos: "CM", x: 68, y: 55 },
    { pos: "CM", x: 50, y: 58 },
    { pos: "CM", x: 32, y: 55 },
    { pos: "LM", x: 12, y: 55 },
    { pos: "ST", x: 65, y: 22 },
    { pos: "ST", x: 35, y: 22 },
  ],
};

const POS_COLOR_MAP = {
  GK: "#ffd700", CB: "#4488ff", LB: "#4488ff", RB: "#4488ff",
  CDM: "#00ff88", CM: "#00ff88", CAM: "#00c8ff", LM: "#00ff88", RM: "#00ff88",
  LW: "#ff9900", RW: "#ff9900", ST: "#ff4444"
};

export function renderTactics(container, router) {
  let formation = gameState.selectedFormation;
  let lineup = [...gameState.lineup];
  const myPlayers = gameState.getMyPlayers();

  // Use custom slots if they exist and match the lineup size, otherwise use default formation slots
  if (!gameState.tactics.customSlots || gameState.tactics.customSlots.length !== 11) {
    gameState.tactics.customSlots = JSON.parse(JSON.stringify(FORMATIONS[formation] || FORMATIONS["4-4-2"]));
  }
  let currentSlots = [...gameState.tactics.customSlots];
  let benchSort = "overall"; // "overall" | "pos" | "age"

  function getPlayerForSlot(slotIndex) {
    const pid = lineup[slotIndex];
    return pid ? gameState.getPlayerById(pid) : null;
  }

  function draw() {
    const bench = myPlayers.filter((p) => !lineup.includes(p.id));
    const sortedBench = [...bench].sort((a, b) => {
      if (benchSort === "overall") return b.overall - a.overall;
      if (benchSort === "age") return b.age - a.age;
      if (benchSort === "pos") {
        const order = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"];
        return order.indexOf(a.pos) - order.indexOf(b.pos);
      }
      return 0;
    });

    container.innerHTML = `
      <div class="screen-header">
        <h1 class="screen-title">🧠 Chiến Thuật & Đội Hình</h1>
        <p class="screen-subtitle">Kéo thả cầu thủ trên sân để tùy chỉnh vị trí tự do.</p>
      </div>

      <div class="tactics-layout" style="display:flex; gap:30px; height: auto; padding-bottom: 50px;">
        <!-- Pitch -->
        <div class="tactics-left" style="flex:1.5; display:flex; flex-direction:column; align-items:center; min-width: 600px;">
          <div class="formation-selector" style="margin-bottom:15px; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
            ${Object.keys(FORMATIONS).map((f) => `
              <button class="form-btn ${f === formation ? "active" : ""}" data-formation="${f}" style="padding:8px 16px; border-radius:8px;">${f}</button>
            `).join("")}
          </div>

          <div class="pitch-container" id="tactics-pitch" style="flex:1; width:100%; max-height:800px; position:relative; overflow:hidden;">
            <div class="pitch" style="position:absolute; inset:20px;">
              <div class="pitch-lines">
                <div class="pitch-center-circle"></div>
                <div class="pitch-halfway"></div>
              </div>

              ${currentSlots.map((slot, i) => {
      const player = getPlayerForSlot(i);
      return `
                <div class="pitch-player draggable"
                     style="left:${slot.x}%;top:${slot.y}%"
                     data-slot="${i}"
                     id="player-slot-${i}">
                  <div class="pitch-player-circle" style="border-color:${POS_COLOR_MAP[slot.pos] || "#fff"}">
                    <span class="pitch-player-number">${player ? player.overall : "?"}</span>
                  </div>
                  <div class="pitch-player-info">
                    <span class="pitch-player-pos" style="color:${POS_COLOR_MAP[slot.pos]}">${slot.pos}</span>
                    <span class="pitch-player-name">${player ? shortName(player.name) : "?"}</span>
                  </div>
                </div>`;
    }).join("")}
            </div>
          </div>
        </div>

        <!-- Right panel: Bench + Tactics -->
        <div class="tactics-right" style="flex:1; display:flex; flex-direction:column; gap:20px; overflow:hidden; min-width: 350px;">
          
          <!-- Bench Grid -->
          <div class="glass-card bench-card" style="flex:1.5; display:flex; flex-direction:column; overflow:hidden;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-shrink:0;">
              <h3 style="margin:0; font-size:1rem; letter-spacing:1px;">🛋️ HÀNG DỰ BỊ (${sortedBench.length})</h3>
              <div class="bench-sort-controls" style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.7rem; color:var(--text-dim)">Sắp xếp:</span>
                <select id="bench-sort" style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:#fff; border-radius:4px; font-size:0.7rem; padding:2px 4px;">
                  <option value="overall" ${benchSort === "overall" ? "selected" : ""}>Chỉ số</option>
                  <option value="pos" ${benchSort === "pos" ? "selected" : ""}>Vị trí</option>
                  <option value="age" ${benchSort === "age" ? "selected" : ""}>Tuổi</option>
                </select>
              </div>
            </div>

            <div class="bench-list" style="flex:1; overflow-y:auto; padding-bottom: 20px;">
              <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap:10px;">
                ${sortedBench.map((p) => `
                  <div class="bench-player-card glass-card bench-player ${p.injured ? "injured" : ""}" 
                       draggable="true" data-id="${p.id}" 
                       style="padding:10px; text-align:center; position:relative; cursor:grab; min-height:80px; display:flex; flex-direction:column; justify-content:center;">
                    <div class="bench-ov" style="position:absolute; top:5px; right:5px; font-size:0.7rem; font-weight:800; color:var(--primary);">${p.overall}</div>
                    <div class="bench-pos" style="font-size:0.65rem; color:${POS_COLOR_MAP[p.pos] || "#fff"}; font-weight:700; margin-bottom:5px;">${p.pos}</div>
                    <div class="bench-name" style="font-size:0.85rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${shortName(p.name)}</div>
                    <div class="bench-age" style="font-size:0.65rem; color:var(--text-dim); margin-top:3px;">${p.age} tuổi</div>
                    ${p.injured ? '<span class="bench-injured" style="position:absolute; top:5px; left:5px; font-size:0.8rem">🚑</span>' : ""}
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Tactics Settings -->
          <div class="glass-card tactics-sliders" style="flex:1; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
              <h3 style="margin:0; font-size:1rem; letter-spacing:1px;">⚙️ CHIẾN THUẬT</h3>
              <div style="display:flex; gap:5px;">
                <button class="btn-auto-pick" id="btn-auto-pick" title="Tự động chọn đội hình mạnh nhất">✨ Tự chọn</button>
                <button class="btn-secondary" id="btn-reset-formation" style="padding:4px 12px; font-size:0.7rem; border-radius:6px;">Reset</button>
              </div>
            </div>

            <div class="tactic-option" style="margin-bottom:12px;">
              <label style="font-size:0.75rem; color:var(--text-dim); display:block; margin-bottom:5px;">TINH THẦN THI ĐẤU</label>
              <div class="tactic-btns">
                <button class="tactic-btn ${gameState.tactics.mentality === 'defensive' ? "active" : ""}" data-key="mentality" data-val="defensive">🛡️ Thủ</button>
                <button class="tactic-btn ${gameState.tactics.mentality === 'balanced' ? "active" : ""}" data-key="mentality" data-val="balanced">⚖️ Vừa</button>
                <button class="tactic-btn ${gameState.tactics.mentality === 'attacking' ? "active" : ""}" data-key="mentality" data-val="attacking">⚔️ Công</button>
              </div>
            </div>

            <div class="tactic-option" style="margin-bottom:12px;">
              <label style="font-size:0.75rem; color:var(--text-dim); display:block; margin-bottom:5px;">LỐI CHƠI (PRESSING)</label>
              <div class="tactic-btns">
                <button class="tactic-btn ${gameState.tactics.pressing === 'low' ? "active" : ""}" data-key="pressing" data-val="low">🐢 Thấp</button>
                <button class="tactic-btn ${gameState.tactics.pressing === 'medium' ? "active" : ""}" data-key="pressing" data-val="medium">🚶 Vừa</button>
                <button class="tactic-btn ${gameState.tactics.pressing === 'high' ? "active" : ""}" data-key="pressing" data-val="high">🔥 Cao</button>
              </div>
            </div>

            <div class="tactic-option" style="margin-bottom:15px;">
              <label style="font-size:0.75rem; color:var(--text-dim); display:block; margin-bottom:5px;">NHỊP ĐỘ (TEMPO)</label>
              <div class="tactic-btns">
                <button class="tactic-btn ${gameState.tactics.tempo === 'slow' ? "active" : ""}" data-key="tempo" data-val="slow">🐌 Chậm</button>
                <button class="tactic-btn ${gameState.tactics.tempo === 'medium' ? "active" : ""}" data-key="tempo" data-val="medium">🚶 Vừa</button>
                <button class="tactic-btn ${gameState.tactics.tempo === 'fast' ? "active" : ""}" data-key="tempo" data-val="fast">💨 Nhanh</button>
              </div>
            </div>

            <button class="btn-primary btn-full" id="btn-save-tactics" style="margin-top:5px; height:40px; font-weight:700;">LƯU CHIẾN THUẬT</button>
          </div>
        </div>
      </div>

    `;

    // Attach Event Listeners

    // Formations
    container.querySelectorAll(".form-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.formation;
        formation = f;
        gameState.selectedFormation = f;
        currentSlots = JSON.parse(JSON.stringify(FORMATIONS[f])); // Reset custom slots to selected formation
        gameState.tactics.customSlots = currentSlots;
        const needed = currentSlots.length;
        while (lineup.length < needed) {
          const unused = myPlayers.find((p) => !lineup.includes(p.id));
          if (unused) lineup.push(unused.id);
          else break;
        }
        lineup = lineup.slice(0, needed);
        draw();
      });
    });

    // Pitch slots - Drag and Swap
    const pitchEl = container.querySelector(".pitch");
    const playerEls = container.querySelectorAll(".pitch-player");

    playerEls.forEach(playerEl => {
      setupDraggable(playerEl);
    });

    function setupDraggable(el) {
      let isDragging = false;
      let startX, startY;
      let initLeft, initTop;
      let sourceIdx = parseInt(el.dataset.slot);

      function onPointerDown(e) {
        if (e.button && e.button !== 0) return;
        isDragging = true;
        el.style.transition = "none";
        el.style.zIndex = "1000";
        el.classList.add("dragging");

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        startX = clientX;
        startY = clientY;

        const rect = el.getBoundingClientRect();
        const pitchRect = pitchEl.getBoundingClientRect();
        initLeft = ((rect.left + rect.width / 2 - pitchRect.left) / pitchRect.width) * 100;
        initTop = ((rect.top + rect.height / 2 - pitchRect.top) / pitchRect.height) * 100;

        document.addEventListener("mousemove", onPointerMove);
        document.addEventListener("touchmove", onPointerMove, { passive: false });
        document.addEventListener("mouseup", onPointerUp);
        document.addEventListener("touchend", onPointerUp);
      }

      function onPointerMove(e) {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        const pitchRect = pitchEl.getBoundingClientRect();

        let newLeft = initLeft + (deltaX / pitchRect.width) * 100;
        let newTop = initTop + (deltaY / pitchRect.height) * 100;

        // Clamping
        newLeft = Math.max(5, Math.min(95, newLeft));
        newTop = Math.max(5, Math.min(95, newTop));

        el.style.left = newLeft + "%";
        el.style.top = newTop + "%";

        // Dynamic Position Detection
        const detectedPos = getPositionFromCoords(newLeft, newTop);
        const posEl = el.querySelector(".pitch-player-pos");
        const circleEl = el.querySelector(".pitch-player-circle");
        if (posEl) {
          posEl.textContent = detectedPos;
          posEl.style.color = POS_COLOR_MAP[detectedPos] || "#fff";
        }
        if (circleEl) circleEl.style.borderColor = POS_COLOR_MAP[detectedPos] || "#fff";

        // Highlight potential swap target
        let targetIdx = findClosestSlot(newLeft, newTop);
        playerEls.forEach((other, idx) => {
          other.classList.toggle("swap-target", idx === targetIdx && idx !== sourceIdx);
        });
      }

      function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        el.style.transition = "";
        el.style.zIndex = "";
        el.classList.remove("dragging");

        document.removeEventListener("mousemove", onPointerMove);
        document.removeEventListener("touchmove", onPointerMove);
        document.removeEventListener("mouseup", onPointerUp);
        document.removeEventListener("touchend", onPointerUp);

        const currentLeft = parseFloat(el.style.left);
        const currentTop = parseFloat(el.style.top);
        const targetIdx = findClosestSlot(currentLeft, currentTop);

        if (targetIdx !== -1 && targetIdx !== sourceIdx) {
          // SWAP players
          const tmp = lineup[sourceIdx];
          lineup[sourceIdx] = lineup[targetIdx];
          lineup[targetIdx] = tmp;
          draw();
        } else if (Math.abs(currentLeft - initLeft) < 1 && Math.abs(currentTop - initTop) < 1) {
          // Just a click - do nothing
        } else {
          // Moved position -> Update Slot
          currentSlots[sourceIdx].x = currentLeft;
          currentSlots[sourceIdx].y = currentTop;
          currentSlots[sourceIdx].pos = getPositionFromCoords(currentLeft, currentTop);
          gameState.tactics.customSlots = currentSlots;
          draw();
        }
      }

      el.addEventListener("mousedown", onPointerDown);
      el.addEventListener("touchstart", onPointerDown, { passive: false });
    }

    function findClosestSlot(x, y) {
      let closestIdx = -1;
      let minDist = 10;
      currentSlots.forEach((slot, idx) => {
        const d = Math.sqrt(Math.pow(slot.x - x, 2) + Math.pow(slot.y - y, 2));
        if (d < minDist) {
          minDist = d;
          closestIdx = idx;
        }
      });
      return closestIdx;
    }

    // Bench Dragging
    container.querySelectorAll(".bench-player").forEach(benchEl => {
      let isDragging = false;
      let ghost = null;
      const pid = parseInt(benchEl.dataset.id);

      benchEl.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        
        // Create ghost
        ghost = document.createElement("div");
        ghost.className = "pitch-player dragging ghost";
        ghost.style.position = "fixed";
        ghost.style.zIndex = "2000";
        ghost.style.pointerEvents = "none"; // Important!
        ghost.innerHTML = `
          <div class="pitch-player-circle" style="border-color:var(--primary)">
            <span class="pitch-player-number">?</span>
          </div>
          <div class="pitch-player-info">
             <span class="pitch-player-name">${benchEl.querySelector(".bench-name").textContent}</span>
          </div>
        `;
        document.body.appendChild(ghost);
        moveGhost(e);

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      function moveGhost(e) {
        if (!ghost) return;
        ghost.style.left = e.clientX + "px";
        ghost.style.top = e.clientY + "px";
        
        // Highlight target on pitch
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const playerEl = target?.closest(".pitch-player");
        playerEls.forEach(el => el.classList.remove("swap-target"));
        if (playerEl) playerEl.classList.add("swap-target");
      }

      function onMouseMove(e) {
        if (!isDragging) return;
        moveGhost(e);
      }

      function onMouseUp(e) {
        if (!isDragging) return;
        isDragging = false;
        
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const playerEl = target?.closest(".pitch-player");
        
        if (playerEl) {
          const slotIdx = parseInt(playerEl.dataset.slot);
          lineup[slotIdx] = pid;
          draw();
        }

        if (ghost) ghost.remove();
        playerEls.forEach(el => el.classList.remove("swap-target"));
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }
    });

    container.querySelectorAll(".btn-close-swap").forEach(btn => {
      btn.addEventListener("click", () => {
        document.getElementById("swap-modal").style.display = "none";
      });
    });

    // Bench Sort
    container.querySelector("#bench-sort")?.addEventListener("change", (e) => {
      benchSort = e.target.value;
      draw();
    });

    // Tactical buttons
    container.querySelectorAll(".tactic-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        const val = btn.dataset.val;
        gameState.updateTactics({ [key]: val });
        draw();
      });
    });

    // Auto Pick (Smart position-aware)
    container.querySelector("#btn-auto-pick")?.addEventListener("click", () => {
      const available = [...myPlayers].filter(p => !p.injured).sort((a, b) => b.overall - a.overall);
      const newLineup = new Array(11).fill(null);
      const usedIds = new Set();

      const POS_GROUPS = {
        GK: ["GK"],
        DEF: ["CB", "LB", "RB", "LWB", "RWB"],
        MID: ["CM", "CDM", "CAM", "LM", "RM"],
        ATT: ["ST", "LW", "RW", "CF"]
      };

      function getGroup(pos) {
        for (const [group, members] of Object.entries(POS_GROUPS)) {
          if (members.includes(pos)) return group;
        }
        return null;
      }

      // Step 1: Exact Position Match
      currentSlots.forEach((slot, i) => {
        const bestMatch = available.find(p => p.pos === slot.pos && !usedIds.has(p.id));
        if (bestMatch) {
          newLineup[i] = bestMatch.id;
          usedIds.add(bestMatch.id);
        }
      });

      // Step 2: Group Match (e.g. any Defender for CB slot)
      currentSlots.forEach((slot, i) => {
        if (newLineup[i]) return;
        const group = getGroup(slot.pos);
        const bestGroupMatch = available.find(p => getGroup(p.pos) === group && !usedIds.has(p.id));
        if (bestGroupMatch) {
          newLineup[i] = bestGroupMatch.id;
          usedIds.add(bestGroupMatch.id);
        }
      });

      // Step 3: Best Remaining
      currentSlots.forEach((slot, i) => {
        if (newLineup[i]) return;
        const bestRemaining = available.find(p => !usedIds.has(p.id));
        if (bestRemaining) {
          newLineup[i] = bestRemaining.id;
          usedIds.add(bestRemaining.id);
        }
      });

      lineup = newLineup.filter(id => id !== null);
      showToast(`✨ Tự động chọn ${lineup.length} cầu thủ tốt nhất theo vị trí!`);
      draw();
    });

    // Save
    container.querySelector("#btn-save-tactics")?.addEventListener("click", () => {
      gameState.updateLineup(lineup);
      gameState.updateTactics({ customSlots: currentSlots });
      showToast("✅ Đã lưu chiến thuật và vị trí!");
    });
  }

  draw();
}

function shortName(name) {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function tacticLabel(key, val) {
  const labels = {
    mentality: { defensive: "🛡 Phòng thủ", balanced: "⚖ Cân bằng", attacking: "⚔ Tấn công" },
    pressing: { low: "🐢 Thấp", medium: "🚶 Vừa", high: "🔥 Cao" },
    tempo: { slow: "🐌 Chậm", medium: "🚶 Vừa", fast: "💨 Nhanh" },
    width: { narrow: "🔒 Hẹp", medium: "↔ Vừa", wide: "📐 Rộng" },
  };
  return labels[key]?.[val] || val;
}

function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

function getPositionFromCoords(x, y) {
  if (y > 82) return "GK";
  if (y > 62) {
    if (x < 25) return "LB";
    if (x > 75) return "RB";
    return "CB";
  }
  if (y > 38) {
    if (x < 20) return "LM";
    if (x > 80) return "RM";
    if (y > 52) return "CDM";
    return "CM";
  }
  if (y > 15) {
    if (x < 25) return "LW";
    if (x > 75) return "RW";
    return "CAM";
  }
  return "ST";
}
