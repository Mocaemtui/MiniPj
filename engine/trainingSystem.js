// ============================================================
// TRAINING SYSTEM - Player Development & Attribute Growth
// ============================================================

import { POSITION_ATTRIBUTE_WEIGHTS } from '../data/playerAttributes.js';

export const TRAINING_TYPES = {
  TECHNICAL: 'technical',
  PHYSICAL: 'physical', 
  MENTAL: 'mental',
  TACTICAL: 'tactical',
  GK_SPECIFIC: 'goalkeeping'
};

export const TRAINING_INTENSITY = {
  LIGHT: { name: 'Nhẹ', fatigue: 2, growth: 0.5 },
  NORMAL: { name: 'Bình thường', fatigue: 5, growth: 1.0 },
  INTENSE: { name: 'Cường độ cao', fatigue: 10, growth: 1.5 },
  DOUBLE: { name: 'Double session', fatigue: 15, growth: 2.0 }
};

export class TrainingManager {
  constructor(gameState) {
    this.gs = gameState;
    
    // Training schedules per team
    this.schedules = new Map(); // teamId -> {day -> trainingType}
    
    // Individual focus per player
    this.playerFocus = new Map(); // playerId -> {attribute, priority}
    
    // Training history
    this.history = [];
    
    // Training effectiveness modifiers
    this.modifiers = {
      staffQuality: 1.0,      // HLV thể lực, trợ lý
      facilities: 1.0,        // Trung tâm huấn luyện
      agePenalty: 0.02,      // -2% mỗi năm sau 25 tuổi
      potentialBonus: 0.1     // +10% nếu PA > CA nhiều
    };
  }

  // Set team training schedule
  setTeamSchedule(teamId, weeklySchedule) {
    // weeklySchedule: { mon: 'technical', tue: 'physical', ... }
    this.schedules.set(teamId, weeklySchedule);
  }

  // Set individual focus for player
  setPlayerFocus(playerId, attribute, priority = 1) {
    this.playerFocus.set(playerId, { attribute, priority, daysFocused: 0 });
  }

  // Execute daily training for all players
  processDailyTraining(date = new Date()) {
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = dayNames[dayOfWeek];
    
    const results = [];
    
    for (const player of this.gs.players) {
      if (!player || player.injured) continue;
      
      const teamId = player.teamId;
      const schedule = this.schedules.get(teamId);
      
      // Get training type for today
      let trainingType = schedule?.[dayName] || TRAINING_TYPES.TECHNICAL;
      
      // Match day = light training only
      const hasMatch = this._checkMatchDay(teamId, date);
      if (hasMatch) {
        trainingType = 'match_preparation';
      }
      
      // Process training
      const result = this._trainPlayer(player, trainingType, hasMatch);
      if (result) results.push(result);
    }
    
    return results;
  }

  _checkMatchDay(teamId, date) {
    // Check if team has match today
    const dateStr = date.toISOString().split('T')[0];
    // Would check against schedule
    return false; // Simplified
  }

  _trainPlayer(player, trainingType, isMatchDay) {
    const intensity = isMatchDay ? TRAINING_INTENSITY.LIGHT : TRAINING_INTENSITY.NORMAL;
    
    // Calculate growth chance
    const baseGrowth = intensity.growth * 0.01; // 1-2% chance per attribute
    const ageMod = Math.max(0, 1 - (Math.max(0, player.age - 25) * this.modifiers.agePenalty));
    const potentialMod = 1 + (player.potential - player.overall) / 100 * this.modifiers.potentialBonus;
    const finalMod = ageMod * potentialMod * this.modifiers.staffQuality * this.modifiers.facilities;
    
    const improvements = [];
    
    // Determine which attributes to train based on type
    const attributesToTrain = this._getAttributesForTraining(trainingType, player.pos);
    
    for (const attr of attributesToTrain) {
      if (Math.random() < baseGrowth * finalMod) {
        const improvement = this._improveAttribute(player, attr);
        if (improvement) improvements.push(improvement);
      }
    }
    
    // Apply fatigue
    const fitnessLoss = intensity.fatigue * (1 - (player.attributes?.physical?.stamina || 50) / 100 * 0.3);
    player.fitness = Math.max(40, player.fitness - fitnessLoss);
    
    // Update sharpness
    player.matchSharpness = Math.min(100, (player.matchSharpness || 80) + 0.5);
    
    // Check individual focus
    const focus = this.playerFocus.get(player.id);
    if (focus && Math.random() < 0.3) {
      const focusImprovement = this._improveAttribute(player, focus.attribute, 1.5);
      if (focusImprovement) {
        focusImprovement.isFocus = true;
        improvements.push(focusImprovement);
        focus.daysFocused++;
      }
    }
    
    if (improvements.length > 0) {
      return {
        playerId: player.id,
        playerName: player.name,
        improvements,
        fatigue: fitnessLoss
      };
    }
    
    return null;
  }

  _getAttributesForTraining(type, position) {
    const positionWeights = POSITION_ATTRIBUTE_WEIGHTS[position] || POSITION_ATTRIBUTE_WEIGHTS.CM;
    
    switch(type) {
      case TRAINING_TYPES.TECHNICAL:
        return Object.keys(positionWeights.technical || {});
      case TRAINING_TYPES.PHYSICAL:
        return Object.keys(positionWeights.physical || {});
      case TRAINING_TYPES.MENTAL:
        return Object.keys(positionWeights.mental || {});
      case TRAINING_TYPES.TACTICAL:
        return ['positioning', 'vision', 'decisions', 'teamwork', 'offTheBall'];
      case TRAINING_TYPES.GK_SPECIFIC:
        return position === 'GK' ? 
          ['reflexes', 'handling', 'positioning', 'oneOnOnes', 'aerialReach'] : 
          ['positioning', 'marking', 'tackling'];
      default:
        return ['passing', 'stamina', 'positioning'];
    }
  }

  _improveAttribute(player, attr, multiplier = 1) {
    // Find which category this attribute belongs to
    let category = null;
    let currentValue = 10;
    
    if (player.stats?.technical && attr in player.stats.technical) {
      category = 'technical';
      currentValue = player.stats.technical[attr];
    } else if (player.stats?.physical && attr in player.stats.physical) {
      category = 'physical';
      currentValue = player.stats.physical[attr];
    } else if (player.stats?.mental && attr in player.stats.mental) {
      category = 'mental';
      currentValue = player.stats.mental[attr];
    } else if (player.stats?.goalkeeping && attr in player.stats.goalkeeping) {
      category = 'goalkeeping';
      currentValue = player.stats.goalkeeping[attr];
    }
    
    if (!category || currentValue >= 20) return null;
    
    // Calculate improvement (0.1 to 0.5 points)
    const improvement = Math.min(20 - currentValue, 0.1 + Math.random() * 0.4 * multiplier);
    
    // Update value
    if (category === 'technical') player.stats.technical[attr] += improvement;
    else if (category === 'physical') player.stats.physical[attr] += improvement;
    else if (category === 'mental') player.stats.mental[attr] += improvement;
    else if (category === 'goalkeeping') player.stats.goalkeeping[attr] += improvement;
    
    // Round for display
    const roundedImprovement = Math.round(improvement * 10) / 10;
    
    if (roundedImprovement >= 0.1) {
      return {
        attribute: attr,
        category,
        oldValue: currentValue,
        newValue: Math.round((currentValue + roundedImprovement) * 10) / 10,
        improvement: roundedImprovement
      };
    }
    
    return null;
  }

  // Get training report for team
  getTeamTrainingReport(teamId, days = 7) {
    const teamPlayers = this.gs.players.filter(p => p.teamId === teamId);
    
    return {
      totalPlayers: teamPlayers.length,
      injuredPlayers: teamPlayers.filter(p => p.injured).length,
      averageFitness: teamPlayers.reduce((sum, p) => sum + p.fitness, 0) / teamPlayers.length,
      averageSharpness: teamPlayers.reduce((sum, p) => sum + (p.matchSharpness || 80), 0) / teamPlayers.length,
      topImprovers: this._getTopImprovers(teamPlayers, days),
      concernPlayers: this._getPlayersNeedingRest(teamPlayers)
    };
  }

  _getTopImprovers(players, days) {
    // Would track from history
    return players
      .filter(p => p.potential > p.overall + 5)
      .slice(0, 5)
      .map(p => ({ id: p.id, name: p.name, potential: p.potential }));
  }

  _getPlayersNeedingRest(players) {
    return players
      .filter(p => p.fitness < 60 || p.matchSharpness > 95)
      .map(p => ({ id: p.id, name: p.name, fitness: p.fitness, reason: p.fitness < 60 ? 'fatigue' : 'overtraining' }));
  }

  // Rest day - recover fitness
  processRestDay() {
    for (const player of this.gs.players) {
      if (!player.injured) {
        const recovery = 15 + (player.attributes?.physical?.naturalFitness || 10) / 10;
        player.fitness = Math.min(100, player.fitness + recovery);
        player.matchSharpness = Math.max(50, (player.matchSharpness || 80) - 5);
      }
    }
  }

  // Holiday break
  processHolidayBreak(weeks = 2) {
    for (const player of this.gs.players) {
      player.fitness = 100;
      player.matchSharpness = 70; // Reset after long break
      // Small fitness loss for older players
      if (player.age > 30 && Math.random() < 0.1) {
        player.attributes.physical.pace = Math.max(1, player.attributes.physical.pace - 0.5);
      }
    }
  }
}

// Youth Academy for generating young players
export class YouthAcademy {
  constructor(gameState) {
    this.gs = gameState;
    this.intakeHistory = [];
    this.graduates = [];
    
    // Academy levels affect quality
    this.levels = {
      1: { cost: 0, minPA: 80, maxPA: 120 },
      2: { cost: 500000, minPA: 90, maxPA: 140 },
      3: { cost: 2000000, minPA: 100, maxPA: 160 },
      4: { cost: 5000000, minPA: 110, maxPA: 180 },
      5: { cost: 10000000, minPA: 120, maxPA: 200 }
    };
    
    this.currentLevel = 1;
    this.nextIntakeDate = this._calculateNextIntake();
  }

  _calculateNextIntake() {
    const now = new Date(this.gs.date);
    // Youth intake typically in March (season end) or July (pre-season)
    const intakeMonth = now.getMonth() < 6 ? 6 : 2; // July or March
    const nextIntake = new Date(now.getFullYear(), intakeMonth, 1);
    if (nextIntake < now) {
      nextIntake.setFullYear(nextIntake.getFullYear() + 1);
    }
    return nextIntake;
  }

  upgradeLevel() {
    const nextLevel = this.currentLevel + 1;
    if (nextLevel > 5) return { success: false, message: 'Đã đạt cấp độ tối đa' };
    
    const cost = this.levels[nextLevel].cost;
    const team = this.gs.getMyTeam();
    
    if (team.budget < cost) {
      return { success: false, message: `Cần ${cost.toLocaleString()} để nâng cấp` };
    }
    
    team.budget -= cost;
    this.currentLevel = nextLevel;
    
    return { 
      success: true, 
      level: nextLevel,
      message: `Học viện trẻ đã được nâng cấp lên cấp ${nextLevel}!`
    };
  }

  // Generate youth intake
  generateYouthIntake() {
    const settings = this.levels[this.currentLevel];
    const numPlayers = 3 + Math.floor(Math.random() * 3); // 3-5 players
    
    const prospects = [];
    const positions = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'LW', 'RW', 'ST'];
    
    for (let i = 0; i < numPlayers; i++) {
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const age = 15 + Math.floor(Math.random() * 3); // 15-17
      const pa = settings.minPA + Math.floor(Math.random() * (settings.maxPA - settings.minPA));
      const ca = Math.floor(pa * (0.3 + Math.random() * 0.4)); // 30-70% of PA
      
      const prospect = this._createYouthPlayer(pos, age, ca, pa);
      prospects.push(prospect);
    }
    
    this.intakeHistory.push({
      date: new Date(this.gs.date),
      prospects: prospects.map(p => p.id),
      level: this.currentLevel
    });
    
    // Add to game players
    for (const p of prospects) {
      this.gs.players.push(p);
    }
    
    this.nextIntakeDate = this._calculateNextIntake();
    
    return {
      prospects,
      count: prospects.length,
      quality: this._assessQuality(prospects)
    };
  }

  _createYouthPlayer(pos, age, ca, pa) {
    const names = [
      'Nguyễn Văn A', 'Trần Văn B', 'Lê Văn C', 'Phạm Văn D', 'Hoàng Văn E',
      'Vũ Văn F', 'Đặng Văn G', 'Bùi Văn H', 'Đỗ Văn I', 'Hồ Văn K'
    ];
    const name = names[Math.floor(Math.random() * names.length)] + ' Jr.';
    
    // Create player using existing system
    const { createPlayer } = require('../data/players.js');
    const player = createPlayer(
      name,
      pos,
      age,
      Math.floor(ca / 2), // Convert 1-200 to 1-100
      Math.floor(pa / 2),
      this.gs.playerTeamId,
      500, // Youth wage
      ca * 10000, // Value based on CA
      'VIE'
    );
    
    // Mark as youth player
    player.isYouth = true;
    player.graduationYear = new Date(this.gs.date).getFullYear();
    
    return player;
  }

  _assessQuality(prospects) {
    const avgPA = prospects.reduce((sum, p) => sum + p.potential, 0) / prospects.length;
    if (avgPA >= 160) return 'exceptional';
    if (avgPA >= 140) return 'good';
    if (avgPA >= 120) return 'average';
    return 'poor';
  }

  // Promote youth player to first team
  promotePlayer(playerId) {
    const player = this.gs.getPlayerById(playerId);
    if (!player || !player.isYouth) return { success: false };
    
    player.isYouth = false;
    this.graduates.push({
      playerId,
      date: new Date(this.gs.date),
      age: player.age
    });
    
    // Sign professional contract
    player.wage = Math.max(5000, player.overall * 200);
    
    return {
      success: true,
      message: `${player.name} đã được đôn lên đội một!`,
      newWage: player.wage
    };
  }

  // Get academy status
  getStatus() {
    return {
      level: this.currentLevel,
      nextIntake: this.nextIntakeDate,
      daysUntilIntake: Math.ceil((this.nextIntakeDate - new Date(this.gs.date)) / (1000 * 60 * 60 * 24)),
      graduatesCount: this.graduates.length,
      currentYouth: this.gs.players.filter(p => p.isYouth && p.teamId === this.gs.playerTeamId).length,
      upgradeCost: this.levels[this.currentLevel + 1]?.cost || null
    };
  }
}

export default TrainingManager;
