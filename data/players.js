// ============================================================
// PLAYERS DATA (2025-2026 FotMob based)
// Full FM-style attributes (1-20 scale)
// ============================================================

import { 
  PlayerStats, 
  generateAttributesForPosition,
  calculateCA,
  POSITIONS
} from './playerAttributes.js';

let playerIdCounter = 1;

// Helper functions for managing player ID counter
export const getPlayerIdCounter = () => playerIdCounter;
export const setPlayerIdCounter = (value) => {
  playerIdCounter = Math.max(1, Math.floor(value));
};
export const resetPlayerIdCounter = (players = []) => {
  if (players.length > 0) {
    const maxId = Math.max(...players.map(p => p.id || 0));
    playerIdCounter = maxId + 1;
  } else {
    playerIdCounter = 1;
  }
};

const createPlayer = (name, pos, age, overall, potential, teamId, wage, value, nationality, attributes = {}) => {
  // Generate full FM-style attributes (scale 1-20)
  const generatedAttrs = generateAttributesForPosition(pos, overall, age);
  
  // Create PlayerStats instance with generated + custom attributes
  const playerStats = new PlayerStats({
    position: pos,
    currentAbility: overall * 2, // Convert 0-100 to 1-200
    potentialAbility: potential * 2,
    ...generatedAttrs,
    ...attributes
  });

  // Generate personality description
  const personality = playerStats.getPersonality();
  const preferredFoot = playerStats.getPreferredFoot();

  return {
    id: playerIdCounter++,
    name, pos, age, overall, potential, teamId, wage, value, nationality,
    number: Math.floor(Math.random() * 99) + 1,
    morale: 85 + Math.floor(Math.random() * 15),
    fitness: 90 + Math.floor(Math.random() * 10),
    injured: false, injuryDays: 0, goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0,
    
    // FM-style full attributes (scale 1-20)
    stats: playerStats,
    
    // Legacy compatibility - convert to old format for existing code
    attributes: {
      technical: _convertToLegacyScale(playerStats.technical),
      mental: _convertToLegacyScale(playerStats.mental),
      physical: _convertToLegacyScale(playerStats.physical),
      goalkeeping: playerStats.goalkeeping ? _convertToLegacyScale(playerStats.goalkeeping) : null
    },
    
    // Meta info
    personality,
    preferredFoot,
    hiddenAttributes: playerStats.hidden,
    consistency: playerStats.hidden.consistency,
    injuryProneness: playerStats.hidden.injuryProneness,
    
    // Squad status
    squadStatus: _determineSquadStatus(overall, age, potential),
    transferStatus: 'not_for_sale',
    
    // Position familiarity
    positionalFamiliarity: playerStats.positionalFamiliarity
  };
};

// Helper: Convert 1-20 scale to 1-100 scale for backward compatibility
function _convertToLegacyScale(attrs) {
  if (!attrs) return {};
  const legacy = {};
  for (const [key, value] of Object.entries(attrs)) {
    legacy[key] = Math.round((value / 20) * 100);
  }
  return legacy;
}

// Helper: Determine squad status based on profile
function _determineSquadStatus(overall, age, potential) {
  if (overall >= 85) return 'star_player';
  if (overall >= 80) return 'key_player';
  if (overall >= 75) return 'first_team';
  if (age <= 21 && potential >= 80) return 'hot_prospect';
  if (age <= 19) return 'young_prospect';
  if (overall < 70 && age > 30) return 'deadwood';
  return 'rotation';
}

export const PLAYERS = [];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Compact Data: Name,Position,Age,Overall,Value(M)
import { team1 } from './rosters/team1.js';
import { team2 } from './rosters/team2.js';
import { team3 } from './rosters/team3.js';
import { team4 } from './rosters/team4.js';
import { team5 } from './rosters/team5.js';
import { team6 } from './rosters/team6.js';
import { team7 } from './rosters/team7.js';
import { team8 } from './rosters/team8.js';
import { team9 } from './rosters/team9.js';
import { team10 } from './rosters/team10.js';
import { team11 } from './rosters/team11.js';
import { team12 } from './rosters/team12.js';
import { team13 } from './rosters/team13.js';
import { team14 } from './rosters/team14.js';
import { team15 } from './rosters/team15.js';
import { team16 } from './rosters/team16.js';
import { team17 } from './rosters/team17.js';
import { team18 } from './rosters/team18.js';
import { team19 } from './rosters/team19.js';
import { team20 } from './rosters/team20.js';

const RAW_ROSTERS = {
  1: team1, 2: team2, 3: team3, 4: team4, 5: team5,
  6: team6, 7: team7, 8: team8, 9: team9, 10: team10,
  11: team11, 12: team12, 13: team13, 14: team14, 15: team15,
  16: team16, 17: team17, 18: team18, 19: team19, 20: team20
};

// Parse the raw strings into complete player objects
for (let tId = 1; tId <= 20; tId++) {
  const teamDataStr = RAW_ROSTERS[tId];
  if (!teamDataStr) continue;

  const playerStrings = teamDataStr.split("|");
  playerStrings.forEach(pStr => {
    const [name, pos, ageStr, ovrStr, valStr] = pStr.split(",");
    const age = parseInt(ageStr);
    const ovr = parseInt(ovrStr);
    const valM = parseInt(valStr);

    const val = valM * 1000000;
    const pot = Math.min(99, ovr + (30 - age > 0 ? randInt(1, Math.max(2, 32 - age)) : 0));
    const wage = randInt(Math.max(20, valM), valM * 3) * 1000;
    
    // Player attributes will be auto-generated by createPlayer using generateAttributesForPosition
    PLAYERS.push(createPlayer(name, pos, age, ovr, pot, tId, wage, val, "XX"));
  });
}

export const getPlayerById = (id) => PLAYERS.find((p) => p.id === id);
export const getPlayersByTeam = (teamId) => PLAYERS.filter((p) => p.teamId === teamId);
export const getFreeAgents = () => PLAYERS.filter((p) => p.teamId === null);

// Re-export FM-style attribute system
export { 
  PlayerStats,
  generateAttributesForPosition,
  calculateCA,
  POSITIONS,
  TECHNICAL_ATTRIBUTES,
  MENTAL_ATTRIBUTES,
  PHYSICAL_ATTRIBUTES,
  GOALKEEPING_ATTRIBUTES,
  HIDDEN_ATTRIBUTES,
  PERSONALITY_ATTRIBUTES,
  POSITION_ATTRIBUTE_WEIGHTS,
  comparePlayers
} from './playerAttributes.js';
