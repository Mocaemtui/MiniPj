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

export const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2"];

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
