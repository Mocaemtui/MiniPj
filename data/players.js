// ============================================================
// PLAYERS DATA (2025-2026 FotMob based)
// ============================================================

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

const createPlayer = (name, pos, age, overall, potential, teamId, wage, value, nationality, attributes) => {
  const isGk = pos === "GK";
  
  // Default values for new detailed schema
  const defaultTechnical = isGk 
    ? { diving: 70, handling: 70, kicking: 70, reflexes: 70 }
    : { finishing: 70, passing: 70, dribbling: 70, tackling: 70, crossing: 70, firstTouch: 70, heading: 70 };
  
  const defaultMental = isGk
    ? { positioning: 70, communication: 70, composure: 70, decisions: 70 }
    : { positioning: 70, vision: 70, composure: 70, aggression: 70, workRate: 70, decisions: 70 };

  const defaultPhysical = { pace: 70, acceleration: 70, strength: 70, stamina: 70, jumping: 70, agility: 70 };

  return {
    id: playerIdCounter++,
    name, pos, age, overall, potential, teamId, wage, value, nationality,
    number: Math.floor(Math.random() * 99) + 1,
    morale: 85 + Math.floor(Math.random() * 15),
    fitness: 90 + Math.floor(Math.random() * 10),
    injured: false, injuryDays: 0, goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0,
    attributes: {
      technical: { ...defaultTechnical, ...(attributes?.technical || {}) },
      mental: { ...defaultMental, ...(attributes?.mental || {}) },
      physical: { ...defaultPhysical, ...(attributes?.physical || {}) },
    },
  };
};

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
    
    // Generate detailed position-specific attributes
    const attr = generateAttributes(pos, ovr, age);

    PLAYERS.push(createPlayer(name, pos, age, ovr, pot, tId, wage, val, "XX", attr));
  });
}

// Advanced attribute generator based on position and overall rating
function generateAttributes(pos, ovr, age) {
  const attr = { technical: {}, mental: {}, physical: {} };
  
  // Age factor: younger players have better physical, older have better mental
  const ageFactor = (30 - age) / 30; // 1.0 at age 20, 0 at age 50
  
  // Helper to generate fixed stat based on overall rating and position
  const genStat = (base, min = 1, max = 99) => {
    return Math.min(max, Math.max(min, Math.round(base)));
  };
  
  // Position-specific attribute templates
  const templates = {
    GK: {
      technical: { diving: 1.0, handling: 1.0, kicking: 0.7, reflexes: 1.0, passing: 0.5, firstTouch: 0.5 },
      mental: { positioning: 1.0, communication: 0.9, composure: 0.9, decisions: 0.8, vision: 0.4, aggression: 0.3 },
      physical: { jumping: 0.9, agility: 0.8, reflexes: 1.0, pace: 0.4, acceleration: 0.4, strength: 0.7, stamina: 0.5 }
    },
    CB: {
      technical: { tackling: 1.0, heading: 0.9, passing: 0.6, firstTouch: 0.6, dribbling: 0.4, crossing: 0.3, finishing: 0.3 },
      mental: { positioning: 1.0, decisions: 0.9, aggression: 0.9, composure: 0.8, vision: 0.5, workRate: 0.7 },
      physical: { strength: 1.0, jumping: 0.9, stamina: 0.7, pace: 0.6, acceleration: 0.5, agility: 0.6 }
    },
    LB: {
      technical: { crossing: 0.9, tackling: 0.8, dribbling: 0.8, passing: 0.7, firstTouch: 0.7, heading: 0.5, finishing: 0.4 },
      mental: { positioning: 0.8, workRate: 0.9, vision: 0.7, decisions: 0.8, aggression: 0.7, composure: 0.7 },
      physical: { pace: 0.9, stamina: 0.9, acceleration: 0.9, agility: 0.8, strength: 0.6, jumping: 0.6 }
    },
    RB: {
      technical: { tackling: 0.9, crossing: 0.8, passing: 0.7, dribbling: 0.7, firstTouch: 0.7, heading: 0.5, finishing: 0.4 },
      mental: { positioning: 0.9, workRate: 0.9, vision: 0.6, decisions: 0.8, aggression: 0.8, composure: 0.7 },
      physical: { pace: 0.9, stamina: 0.9, acceleration: 0.8, strength: 0.7, agility: 0.7, jumping: 0.6 }
    },
    CDM: {
      technical: { passing: 0.9, tackling: 0.9, firstTouch: 0.8, dribbling: 0.7, heading: 0.6, crossing: 0.4, finishing: 0.4 },
      mental: { positioning: 0.9, decisions: 0.9, vision: 0.8, workRate: 0.9, aggression: 0.8, composure: 0.9 },
      physical: { strength: 0.8, stamina: 0.9, pace: 0.6, acceleration: 0.5, agility: 0.6, jumping: 0.6 }
    },
    CM: {
      technical: { passing: 0.9, firstTouch: 0.9, dribbling: 0.8, tackling: 0.6, crossing: 0.6, heading: 0.5, finishing: 0.5 },
      mental: { vision: 0.9, decisions: 0.9, workRate: 0.9, positioning: 0.8, composure: 0.8, aggression: 0.6 },
      physical: { stamina: 0.9, pace: 0.7, strength: 0.6, acceleration: 0.7, agility: 0.8, jumping: 0.5 }
    },
    CAM: {
      technical: { passing: 0.9, dribbling: 0.9, firstTouch: 0.9, finishing: 0.7, crossing: 0.6, tackling: 0.3, heading: 0.3 },
      mental: { vision: 1.0, decisions: 0.9, composure: 0.9, positioning: 0.8, aggression: 0.4, workRate: 0.6 },
      physical: { agility: 0.9, acceleration: 0.9, pace: 0.7, stamina: 0.7, strength: 0.4, jumping: 0.4 }
    },
    LW: {
      technical: { dribbling: 1.0, crossing: 0.8, finishing: 0.8, passing: 0.7, firstTouch: 0.9, tackling: 0.3, heading: 0.4 },
      mental: { vision: 0.8, composure: 0.8, decisions: 0.8, positioning: 0.7, aggression: 0.4, workRate: 0.7 },
      physical: { pace: 1.0, acceleration: 1.0, agility: 1.0, stamina: 0.8, strength: 0.4, jumping: 0.5 }
    },
    RW: {
      technical: { dribbling: 1.0, crossing: 0.9, finishing: 0.8, passing: 0.7, firstTouch: 0.9, tackling: 0.3, heading: 0.4 },
      mental: { vision: 0.8, composure: 0.8, decisions: 0.8, positioning: 0.7, aggression: 0.4, workRate: 0.7 },
      physical: { pace: 1.0, acceleration: 1.0, agility: 0.9, stamina: 0.8, strength: 0.4, jumping: 0.5 }
    },
    ST: {
      technical: { finishing: 1.0, firstTouch: 0.8, dribbling: 0.7, heading: 0.8, passing: 0.5, crossing: 0.3, tackling: 0.3 },
      mental: { positioning: 0.9, composure: 0.9, decisions: 0.8, vision: 0.5, aggression: 0.6, workRate: 0.6 },
      physical: { strength: 0.8, jumping: 0.8, pace: 0.7, acceleration: 0.8, stamina: 0.7, agility: 0.7 }
    }
  };
  
  const tmpl = templates[pos] || templates.CM;
  
  // Generate Technical Attributes
  if (pos === "GK") {
    attr.technical.diving = genStat(ovr * tmpl.technical.diving);
    attr.technical.handling = genStat(ovr * tmpl.technical.handling);
    attr.technical.kicking = genStat(ovr * tmpl.technical.kicking);
    attr.technical.reflexes = genStat(ovr * tmpl.technical.reflexes);
    attr.technical.passing = genStat(ovr * tmpl.technical.passing);
    attr.technical.firstTouch = genStat(ovr * tmpl.technical.firstTouch);
  } else {
    attr.technical.finishing = genStat(ovr * tmpl.technical.finishing);
    attr.technical.passing = genStat(ovr * tmpl.technical.passing);
    attr.technical.dribbling = genStat(ovr * tmpl.technical.dribbling);
    attr.technical.tackling = genStat(ovr * tmpl.technical.tackling);
    attr.technical.crossing = genStat(ovr * tmpl.technical.crossing);
    attr.technical.firstTouch = genStat(ovr * tmpl.technical.firstTouch);
    attr.technical.heading = genStat(ovr * tmpl.technical.heading);
  }
  
  // Generate Mental Attributes
  attr.mental.positioning = genStat(ovr * tmpl.mental.positioning);
  attr.mental.vision = genStat(ovr * tmpl.mental.vision);
  attr.mental.composure = genStat(ovr * tmpl.mental.composure + (1 - ageFactor) * 5); // Older players calmer
  attr.mental.aggression = genStat(ovr * tmpl.mental.aggression);
  attr.mental.workRate = genStat(ovr * tmpl.mental.workRate);
  attr.mental.decisions = genStat(ovr * tmpl.mental.decisions + (1 - ageFactor) * 5); // Older players wiser
  
  if (pos === "GK") {
    attr.mental.communication = genStat(ovr * tmpl.mental.communication);
  }
  
  // Generate Physical Attributes
  attr.physical.pace = genStat(ovr * tmpl.physical.pace + ageFactor * 10); // Younger faster
  attr.physical.acceleration = genStat(ovr * tmpl.physical.acceleration + ageFactor * 10);
  attr.physical.strength = genStat(ovr * tmpl.physical.strength + (1 - ageFactor) * 5); // Older stronger
  attr.physical.stamina = genStat(ovr * tmpl.physical.stamina);
  attr.physical.jumping = genStat(ovr * tmpl.physical.jumping);
  attr.physical.agility = genStat(ovr * tmpl.physical.agility + ageFactor * 5);
  
  if (pos === "GK") {
    attr.physical.reflexes = genStat(ovr * tmpl.physical.reflexes + ageFactor * 10);
  }
  
  return attr;
}

export const getPlayerById = (id) => PLAYERS.find((p) => p.id === id);
export const getPlayersByTeam = (teamId) => PLAYERS.filter((p) => p.teamId === teamId);
export const getFreeAgents = () => PLAYERS.filter((p) => p.teamId === null);
