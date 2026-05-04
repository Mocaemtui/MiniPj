// ============================================================
// CONSTANTS - Global configuration and constants
// ============================================================

// ============================================================
// CONSTANTS - Global configuration and constants
// ============================================================

export const POSITIONS = {
  GOALKEEPER: "GK",
  DEFENDER: ["CB", "LB", "RB"],
  MIDFIELDER: ["CDM", "CM", "CAM", "LM", "RM"],
  FORWARD: ["LW", "RW", "ST"],
};

export const POS_ORDER = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"];

export const POS_COLOR = {
  GK: "#ffd700",    // Gold
  CB: "#4488ff",    // Blue
  LB: "#4488ff",    // Blue
  RB: "#4488ff",    // Blue
  CDM: "#00ff88",   // Green
  CM: "#00ff88",    // Green
  CAM: "#00ff88",   // Green
  LM: "#00ff88",    // Green
  RM: "#00ff88",    // Green
  LW: "#ff9900",    // Orange
  RW: "#ff9900",    // Orange
  ST: "#ff4444",    // Red
};

export const FORMATIONS = {
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
  "5-3-2": [
    { pos: "GK", x: 50, y: 90 },
    { pos: "CB", x: 78, y: 76 },
    { pos: "CB", x: 60, y: 80 },
    { pos: "CB", x: 42, y: 80 },
    { pos: "CB", x: 24, y: 76 },
    { pos: "RM", x: 88, y: 55 },
    { pos: "CM", x: 50, y: 58 },
    { pos: "LM", x: 12, y: 55 },
    { pos: "ST", x: 65, y: 22 },
    { pos: "ST", x: 35, y: 22 },
  ],
};

export const FORMATION_NAMES = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2"];

export const DEFAULT_FORMATION = "4-4-2";

export const TACTICS = {
  MENTALITY: ["attacking", "balanced", "defensive"],
  PRESSING: ["low", "medium", "high"],
  TEMPO: ["slow", "medium", "fast"],
  WIDTH: ["narrow", "medium", "wide"],
  SET_PIECES: ["default", "aggressive", "defensive"],
};

export const DEFAULT_TACTICS = {
  mentality: "balanced",
  pressing: "medium",
  tempo: "medium",
  width: "medium",
  setpieces: "default",
};

export const PROBABILITY = {
  TRANSFER_OFFER: 0.2,
  PLAYER_GROWTH: 0.1,
  PLAYER_DECLINE: 0.05,
  INJURY: 0.02,
  PLAYER_MORALE_CHANGE: 0.15,
};

export const WAGE_CONFIG = {
  MIN_WAGE: 20,
  MAX_FACTOR: 3,
};

export const PLAYER_ATTRIBUTES = {
  GK: {
    technical: ["diving", "handling", "kicking", "reflexes"],
    mental: ["positioning", "communication", "composure", "decisions"],
    physical: ["pace", "acceleration", "strength", "stamina", "jumping", "agility"],
  },
  OUTFIELD: {
    technical: ["finishing", "passing", "dribbling", "tackling", "crossing", "firstTouch", "heading"],
    mental: ["positioning", "vision", "composure", "aggression", "workRate", "decisions"],
    physical: ["pace", "acceleration", "strength", "stamina", "jumping", "agility"],
  },
};

export const POSITION_BOOST = {
  ST: { finishing: 5, positioning: 5 },
  CB: { tackling: 5, strength: 5, heading: 5 },
  "CM,CAM": { passing: 5, vision: 5, decisions: 5 },
  "LW,RW": { pace: 5, dribbling: 5, acceleration: 5 },
  GK: { reflexes: 5, diving: 5 },
};

export const MATCH_SIMULATION = {
  INJURY_CHANCE: 0.02,
  GOAL_FACTOR_LOW: 0.5,
  GOAL_FACTOR_HIGH: 2.0,
  EVENT_CHANCE: 0.08,
  YELLOW_CARD_CHANCE: 0.05,
  RED_CARD_CHANCE: 0.008,
};

export const UI = {
  NOTIFICATION_TIMEOUT: 3000,
  ANIMATION_DURATION: 300,
  SORT_DEBOUNCE: 100,
};

export const VALIDATION = {
  COACH_NAME_MIN: 2,
  COACH_NAME_MAX: 50,
  CUSTOM_FORMATION_SLOTS: 11,
};

export const SEASON = {
  START_MONTH: 0,
  START_DAY: 15,
  START_YEAR: 2025,
};

export const FINANCE = {
  WEEKLY_SPONSOR: 50000,
  DEFAULT_WEEKLY_WAGE: 100000,
};

// Colors and styles
export const COLORS = {
  PRIMARY: "var(--primary)",
  SUCCESS: "#00ff88",
  WARNING: "#ff9900",
  ERROR: "#ff4444",
  INFO: "#00c8ff",
  NEUTRAL: "#888888",
};

export const MESSAGES = {
  COACH_NAME_REQUIRED: "Tên huấn luyện viên không được để trống",
  COACH_NAME_TOO_SHORT: "Tên phải có ít nhất 2 ký tự",
  COACH_NAME_TOO_LONG: "Tên không được vượt quá 50 ký tự",
  TEAM_REQUIRED: "Vui lòng chọn đội bóng",
  GAME_STARTED_SUCCESS: "🎉 Chào mừng bạn trở thành HLV mới!",
  SAVE_SUCCESS: "💾 Đã lưu game thành công!",
  LOAD_SUCCESS: "📂 Đã tải game thành công!",
  LOAD_FAILED: "❌ Không thể tải game. File lưu có thể bị hỏng.",
  STORAGE_QUOTA_EXCEEDED: "💾 Bộ nhớ trình duyệt đầy. Vui lòng xóa một số file lưu cũ.",
};
// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value (default 1)
 * @param {number} max - Maximum value (default 99)
 * @returns {number} Clamped value
 */
export const clamp = (value, min = 1, max = 99) => {
  if (typeof value !== 'number' || isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
};

/**
 * Safely parse integer from input with validation
 * @param {string|number} value - Value to parse
 * @param {number} defaultValue - Default if parse fails (default 0)
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Parsed and validated integer
 */
export const parseIntSafe = (value, defaultValue = 0, min = -Infinity, max = Infinity) => {
  try {
    const num = parseInt(value);
    if (isNaN(num)) return defaultValue;
    return clamp(num, min, max);
  } catch (e) {
    console.error('Error parsing integer:', e);
    return defaultValue;
  }
};

/**
 * Validate lineup has exactly 11 unique player IDs
 * @param {Array} lineup - Array of player IDs
 * @returns {boolean} True if valid lineup
 */
export const isValidLineup = (lineup) => {
  if (!Array.isArray(lineup)) return false;
  if (lineup.length !== 11) return false;
  const uniqueIds = new Set(lineup);
  return uniqueIds.size === 11 && lineup.every(id => typeof id === 'number' && id > 0);
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Debounce function to prevent rapid calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId = null;
  return function(...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

/**
 * Remove duplicate event listeners from DOM element
 * @param {Element} element - Element to clean
 * @param {string} eventType - Type of event
 */
export const removeAllListeners = (element, eventType) => {
  if (!element) return;
  const clone = element.cloneNode(true);
  element.parentNode?.replaceChild(clone, element);
  return clone;
};