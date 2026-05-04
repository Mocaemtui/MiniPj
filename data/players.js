// ============================================================
// PLAYERS DATA (2025-2026 FotMob based)
// ============================================================

let playerIdCounter = 1;

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
    
    const attr = { technical: {}, mental: {}, physical: {} };
    
    const gen = (category, keys) => {
      keys.forEach(k => {
        let base = ovr;
        // Logic boost based on position
        if (pos === "ST" && (k === "finishing" || k === "positioning")) base += 5;
        if (pos === "CB" && (k === "tackling" || k === "strength" || k === "heading")) base += 5;
        if (["CM", "CAM"].includes(pos) && (k === "passing" || k === "vision" || k === "decisions")) base += 5;
        if (["LW", "RW"].includes(pos) && (k === "pace" || k === "dribbling" || k === "acceleration")) base += 5;
        if (pos === "GK" && (k === "reflexes" || k === "diving")) base += 5;

        attr[category][k] = Math.min(99, Math.max(1, randInt(base - 5, base + 5)));
      });
    };

    if (pos === "GK") {
      gen("technical", ["diving", "handling", "kicking", "reflexes"]);
      gen("mental", ["positioning", "communication", "composure", "decisions"]);
    } else {
      gen("technical", ["finishing", "passing", "dribbling", "tackling", "crossing", "firstTouch", "heading"]);
      gen("mental", ["positioning", "vision", "composure", "aggression", "workRate", "decisions"]);
    }
    gen("physical", ["pace", "acceleration", "strength", "stamina", "jumping", "agility"]);

    PLAYERS.push(createPlayer(name, pos, age, ovr, pot, tId, wage, val, "XX", attr));
  });
}

export const getPlayerById = (id) => PLAYERS.find((p) => p.id === id);
export const getPlayersByTeam = (teamId) => PLAYERS.filter((p) => p.teamId === teamId);
export const getFreeAgents = () => PLAYERS.filter((p) => p.teamId === null);
