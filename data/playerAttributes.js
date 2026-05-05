// ============================================================
// PLAYER ATTRIBUTES - Complete FM-Style Attribute System
// Scale 1-20 for all attributes
// ============================================================

// ==================== TECHNICAL ATTRIBUTES ====================
export const TECHNICAL_ATTRIBUTES = {
  corners: 'Corners',           // Đá phạt góc
  crossing: 'Crossing',         // Tạt bóng (Fullback/Wing-back)
  dribbling: 'Dribbling',       // Rê dắt
  finishing: 'Finishing',       // Dứt điểm
  firstTouch: 'First Touch',    // Đỡ bước 1
  freeKicks: 'Free Kicks',    // Đá phạt trực tiếp
  heading: 'Heading',         // Đánh đầu (chính xác)
  longShots: 'Long Shots',    // Sút xa
  longThrows: 'Long Throws',  // Ném biên
  marking: 'Marking',         // Kèm người
  passing: 'Passing',         // Chuyền bóng
  penaltyTaking: 'Penalty Taking', // Đá phạt đền
  tackling: 'Tackling',       // Tắc bóng
  technique: 'Technique'      // Kỹ thuật nền tảng
};

// ==================== MENTAL ATTRIBUTES ====================
export const MENTAL_ATTRIBUTES = {
  aggression: 'Aggression',       // Máu lửa (dễ ăn thẻ)
  anticipation: 'Anticipation',   // Đọc tình huống
  bravery: 'Bravery',             // Dũng cảm
  composure: 'Composure',         // Điềm tĩnh
  concentration: 'Concentration', // Tập trung
  decisions: 'Decisions',         // Ra quyết định (AI core)
  determination: 'Determination', // Quyết tâm
  flair: 'Flair',                 // Ngẫu hứng
  leadership: 'Leadership',     // Thủ lĩnh
  offTheBall: 'Off The Ball',     // Di chuyển không bóng
  positioning: 'Positioning',     // Chọn vị trí (phòng ngự)
  teamwork: 'Teamwork',           // Đồng đội
  vision: 'Vision',               // Nhãn quan
  workRate: 'Work Rate'           // Chăm chỉ/pressing
};

// ==================== PHYSICAL ATTRIBUTES ====================
export const PHYSICAL_ATTRIBUTES = {
  acceleration: 'Acceleration',   // Gia tốc
  agility: 'Agility',             // Nhanh nhẹn
  balance: 'Balance',             // Thăng bằng
  jumpingReach: 'Jumping Reach', // Sức bật
  naturalFitness: 'Natural Fitness', // Thể lực bẩm sinh
  pace: 'Pace',                   // Tốc độ tối đa
  stamina: 'Stamina',             // Sức bền
  strength: 'Strength'            // Sức mạnh
};

// ==================== GOALKEEPING ATTRIBUTES ====================
export const GOALKEEPING_ATTRIBUTES = {
  aerialReach: 'Aerial Reach',        // Tầm với trên không
  commandOfArea: 'Command Of Area',   // Làm chủ vòng cấm
  communication: 'Communication',     // Giao tiếp
  eccentricity: 'Eccentricity',       // Lập dị (Neuer style)
  handling: 'Handling',               // Bắt dính
  kicking: 'Kicking',                 // Phát bóng chân
  oneOnOnes: 'One On Ones',           // Đối mặt 1-1
  punching: 'Punching',               // Xu hướng đấm bóng
  reflexes: 'Reflexes',                 // Phản xạ
  rushingOut: 'Rushing Out',          // Xu hướng băng ra
  throwing: 'Throwing'                  // Ném bóng
};

// ==================== HIDDEN ATTRIBUTES ====================
export const HIDDEN_ATTRIBUTES = {
  consistency: 'Consistency',         // Ổn định phong độ
  dirtiness: 'Dirtiness',             // Chơi bẩn
  importantMatches: 'Important Matches', // Tỏa sáng trận lớn
  injuryProneness: 'Injury Proneness', // Mẫn cảm chấn thương
  versatility: 'Versatility',         // Đa năng vị trí
  adaptability: 'Adaptability'        // Thích nghi môi trường
};

// ==================== PERSONALITY ATTRIBUTES ====================
export const PERSONALITY_ATTRIBUTES = {
  professionalism: 'Professionalism',   // Chuyên nghiệp
  ambition: 'Ambition',               // Tham vọng
  loyalty: 'Loyalty',                 // Trung thành
  pressure: 'Pressure',               // Chịu áp lực
  sportsmanship: 'Sportsmanship',     // Tinh thần thể thao
  temperament: 'Temperament',         // Kiểm soát tức giận
  controversy: 'Controversy'            // Gây tranh cãi
};

// ==================== POSITION FAMILIARITY ====================
export const POSITIONS = {
  GK: 'Thủ môn',
  DL: 'Hậu vệ trái',
  DR: 'Hậu vệ phải',
  DC: 'Trung vệ',
  WBL: 'Wing-back trái',
  WBR: 'Wing-back phải',
  DM: 'Tiền vệ phòng ngự',
  ML: 'Tiền vệ trái',
  MR: 'Tiền vệ phải',
  MC: 'Tiền vệ trung tâm',
  AMC: 'Tiền vệ tấn công',
  AML: 'Tiền vệ tấn công trái',
  AMR: 'Tiền vệ tấn công phải',
  ST: 'Tiền đạo'
};

export const POSITION_FAMILIARITY = {
  NATURAL: 20,      // Thi đấu tự nhiên
  ACCOMPLISHED: 15, // Thành thạo
  COMPETENT: 10,    // Có thể đá được
  UNCONVINCING: 5,  // Không thuyết phục
  INEFFECTIVE: 1    // Vô dụng
};

// ==================== FOOTEDNESS ====================
export const FOOTEDNESS = {
  LEFT: { foot: 'left', strength: 20 },
  RIGHT: { foot: 'right', strength: 20 },
  BOTH_WEAK: { left: 10, right: 10 },
  BOTH_STRONG: { left: 15, right: 15 }
};

// ==================== PLAYER STATS CLASS ====================

export class PlayerStats {
  constructor(data = {}) {
    // Technical (1-20)
    this.technical = {
      corners: data.corners || 10,
      crossing: data.crossing || 10,
      dribbling: data.dribbling || 10,
      finishing: data.finishing || 10,
      firstTouch: data.firstTouch || 10,
      freeKicks: data.freeKicks || 10,
      heading: data.heading || 10,
      longShots: data.longShots || 10,
      longThrows: data.longThrows || 10,
      marking: data.marking || 10,
      passing: data.passing || 10,
      penaltyTaking: data.penaltyTaking || 10,
      tackling: data.tackling || 10,
      technique: data.technique || 10
    };

    // Mental (1-20)
    this.mental = {
      aggression: data.aggression || 10,
      anticipation: data.anticipation || 10,
      bravery: data.bravery || 10,
      composure: data.composure || 10,
      concentration: data.concentration || 10,
      decisions: data.decisions || 10,
      determination: data.determination || 10,
      flair: data.flair || 10,
      leadership: data.leadership || 10,
      offTheBall: data.offTheBall || 10,
      positioning: data.positioning || 10,
      teamwork: data.teamwork || 10,
      vision: data.vision || 10,
      workRate: data.workRate || 10
    };

    // Physical (1-20)
    this.physical = {
      acceleration: data.acceleration || 10,
      agility: data.agility || 10,
      balance: data.balance || 10,
      jumpingReach: data.jumpingReach || 10,
      naturalFitness: data.naturalFitness || 10,
      pace: data.pace || 10,
      stamina: data.stamina || 10,
      strength: data.strength || 10
    };

    // Goalkeeping (1-20) - For GKs
    this.goalkeeping = data.position === 'GK' ? {
      aerialReach: data.aerialReach || 10,
      commandOfArea: data.commandOfArea || 10,
      communication: data.communication || 10,
      eccentricity: data.eccentricity || 10,
      handling: data.handling || 10,
      kicking: data.kicking || 10,
      oneOnOnes: data.oneOnOnes || 10,
      punching: data.punching || 10,
      reflexes: data.reflexes || 10,
      rushingOut: data.rushingOut || 10,
      throwing: data.throwing || 10
    } : null;

    // Hidden (1-20)
    this.hidden = {
      consistency: data.consistency || 10,
      dirtiness: data.dirtiness || 10,
      importantMatches: data.importantMatches || 10,
      injuryProneness: data.injuryProneness || 10,
      versatility: data.versatility || 10,
      adaptability: data.adaptability || 10
    };

    // Personality (1-20)
    this.personality = {
      professionalism: data.professionalism || 10,
      ambition: data.ambition || 10,
      loyalty: data.loyalty || 10,
      pressure: data.pressure || 10,
      sportsmanship: data.sportsmanship || 10,
      temperament: data.temperament || 10,
      controversy: data.controversy || 10
    };

    // Meta stats
    this.currentAbility = data.currentAbility || 100; // CA (1-200)
    this.potentialAbility = data.potentialAbility || 120; // PA (1-200)
    
    // Dynamic stats
    this.fitness = data.fitness || 100; // %
    this.matchSharpness = data.matchSharpness || 100; // %
    this.morale = data.morale || 50; // 1-100
    
    // Physical attributes
    this.footedness = data.footedness || FOOTEDNESS.RIGHT;
    
    // Position familiarity { position: level (1-20) }
    this.positionalFamiliarity = data.positionalFamiliarity || {};
  }

  // Calculate overall rating for specific position
  getPositionRating(position) {
    const weights = POSITION_ATTRIBUTE_WEIGHTS[position];
    if (!weights) return this.currentAbility;

    let totalWeight = 0;
    let weightedSum = 0;

    // Calculate weighted average
    for (const [category, attrs] of Object.entries(weights)) {
      for (const [attr, weight] of Object.entries(attrs)) {
        const value = this[category]?.[attr] || 10;
        weightedSum += value * weight;
        totalWeight += weight;
      }
    }

    // Position familiarity bonus
    const familiarity = this.positionalFamiliarity[position] || 10;
    const familiarityBonus = (familiarity - 10) * 0.5;

    return Math.round((weightedSum / totalWeight) * 10 + familiarityBonus);
  }

  // Get personality string
  getPersonality() {
    const p = this.personality;
    
    if (p.professionalism >= 16 && p.ambition >= 14) return 'Model Citizen';
    if (p.ambition >= 16 && p.loyalty <= 10) return 'Mercenary';
    if (p.leadership >= 15 && p.determination >= 14) return 'Leader';
    if (p.professionalism >= 15) return 'Professional';
    if (p.sportsmanship >= 15 && p.temperament >= 14) return 'Fairly Good Sportsman';
    if (p.controversy >= 15) return 'Media Darling';
    if (p.temperament <= 8 && p.aggression >= 14) return 'Temperamental';
    if (p.loyalty >= 16) return 'Very Loyal';
    
    return 'Balanced';
  }

  // Get preferred foot string
  getPreferredFoot() {
    if (typeof this.footedness === 'object' && this.footedness.foot) {
      return this.footedness.foot === 'left' ? 'Left' : 'Right';
    }
    if (typeof this.footedness === 'object' && this.footedness.left && this.footedness.right) {
      if (this.footedness.left >= 15 && this.footedness.right >= 15) return 'Either';
      if (this.footedness.left > this.footedness.right) return 'Left';
    }
    return 'Right';
  }

  // Get best positions
  getBestPositions(count = 3) {
    const ratings = Object.keys(POSITIONS).map(pos => ({
      position: pos,
      rating: this.getPositionRating(pos),
      familiarity: this.positionalFamiliarity[pos] || 10
    }));

    return ratings
      .sort((a, b) => b.rating - a.rating)
      .slice(0, count);
  }

  // Serialize for save/load
  serialize() {
    return {
      technical: this.technical,
      mental: this.mental,
      physical: this.physical,
      goalkeeping: this.goalkeeping,
      hidden: this.hidden,
      personality: this.personality,
      currentAbility: this.currentAbility,
      potentialAbility: this.potentialAbility,
      fitness: this.fitness,
      matchSharpness: this.matchSharpness,
      morale: this.morale,
      footedness: this.footedness,
      positionalFamiliarity: this.positionalFamiliarity
    };
  }
}

// ==================== POSITION ATTRIBUTE WEIGHTS ====================
// Defines which attributes matter most for each position
export const POSITION_ATTRIBUTE_WEIGHTS = {
  GK: {
    goalkeeping: {
      reflexes: 2.0,
      handling: 1.5,
      oneOnOnes: 1.5,
      positioning: 1.0,
      commandOfArea: 1.0,
      communication: 0.8,
      aerialReach: 0.8
    },
    mental: {
      concentration: 1.5,
      decisions: 1.0,
      composure: 1.0,
      anticipation: 0.8
    },
    physical: {
      agility: 1.0,
      jumpingReach: 0.8
    }
  },
  
  DC: {
    technical: {
      tackling: 1.5,
      heading: 1.2,
      marking: 1.2,
      passing: 0.8
    },
    mental: {
      positioning: 2.0,
      decisions: 1.5,
      concentration: 1.2,
      bravery: 1.0,
      anticipation: 1.0
    },
    physical: {
      jumpingReach: 1.5,
      strength: 1.5,
      balance: 1.0
    }
  },
  
  DL: {
    technical: {
      crossing: 1.5,
      tackling: 1.2,
      dribbling: 1.0,
      passing: 1.0
    },
    mental: {
      positioning: 1.2,
      decisions: 1.0,
      workRate: 1.5,
      teamwork: 1.0
    },
    physical: {
      pace: 1.5,
      acceleration: 1.5,
      stamina: 1.2,
      agility: 1.0
    }
  },
  
  DR: {
    technical: {
      crossing: 1.5,
      tackling: 1.2,
      dribbling: 1.0,
      passing: 1.0
    },
    mental: {
      positioning: 1.2,
      decisions: 1.0,
      workRate: 1.5,
      teamwork: 1.0
    },
    physical: {
      pace: 1.5,
      acceleration: 1.5,
      stamina: 1.2,
      agility: 1.0
    }
  },
  
  DM: {
    technical: {
      tackling: 1.5,
      passing: 1.5,
      marking: 1.2,
      firstTouch: 1.0
    },
    mental: {
      positioning: 1.8,
      decisions: 1.8,
      concentration: 1.2,
      workRate: 1.5,
      anticipation: 1.2
    },
    physical: {
      strength: 1.5,
      stamina: 1.5,
      balance: 1.0
    }
  },
  
  MC: {
    technical: {
      passing: 2.0,
      firstTouch: 1.5,
      tackling: 0.8,
      longShots: 0.8
    },
    mental: {
      decisions: 1.8,
      vision: 1.8,
      positioning: 1.2,
      teamwork: 1.5,
      workRate: 1.2
    },
    physical: {
      stamina: 1.5,
      balance: 1.0,
      agility: 0.8
    }
  },
  
  AMC: {
    technical: {
      passing: 1.8,
      firstTouch: 1.8,
      dribbling: 1.5,
      finishing: 1.2,
      technique: 1.2
    },
    mental: {
      decisions: 1.8,
      vision: 2.0,
      flair: 1.5,
      offTheBall: 1.5,
      composure: 1.2
    },
    physical: {
      agility: 1.5,
      balance: 1.2,
      acceleration: 1.0
    }
  },
  
  AML: {
    technical: {
      dribbling: 2.0,
      crossing: 1.5,
      passing: 1.2,
      finishing: 1.2,
      firstTouch: 1.5
    },
    mental: {
      flair: 1.8,
      offTheBall: 1.8,
      decisions: 1.0,
      acceleration: 0.8
    },
    physical: {
      pace: 2.0,
      acceleration: 2.0,
      agility: 1.5,
      stamina: 1.2
    }
  },
  
  AMR: {
    technical: {
      dribbling: 2.0,
      crossing: 1.5,
      passing: 1.2,
      finishing: 1.2,
      firstTouch: 1.5
    },
    mental: {
      flair: 1.8,
      offTheBall: 1.8,
      decisions: 1.0
    },
    physical: {
      pace: 2.0,
      acceleration: 2.0,
      agility: 1.5,
      stamina: 1.2
    }
  },
  
  ST: {
    technical: {
      finishing: 2.5,
      firstTouch: 1.5,
      heading: 1.5,
      technique: 1.2,
      passing: 0.8
    },
    mental: {
      composure: 2.0,
      offTheBall: 2.0,
      decisions: 1.5,
      anticipation: 1.5,
      concentration: 1.0
    },
    physical: {
      strength: 1.5,
      balance: 1.5,
      jumpingReach: 1.2,
      pace: 1.0
    }
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Generate random attributes based on position and overall
export function generateAttributesForPosition(position, overall, age) {
  const weights = POSITION_ATTRIBUTE_WEIGHTS[position];
  if (!weights) return {};

  const attributes = {};
  const baseLevel = Math.max(1, Math.min(20, overall / 10));

  // Generate technical
  attributes.technical = {};
  for (const [attr, weight] of Object.entries(weights.technical || {})) {
    const variance = Math.floor(Math.random() * 6) - 3; // -3 to +3
    attributes.technical[attr] = Math.max(1, Math.min(20, baseLevel + variance));
  }

  // Generate mental
  attributes.mental = {};
  for (const [attr, weight] of Object.entries(weights.mental || {})) {
    const variance = Math.floor(Math.random() * 6) - 3;
    attributes.mental[attr] = Math.max(1, Math.min(20, baseLevel + variance));
  }

  // Generate physical with age factor
  attributes.physical = {};
  const ageFactor = age < 25 ? 1.2 : age > 30 ? 0.8 : 1.0;
  for (const [attr, weight] of Object.entries(weights.physical || {})) {
    const variance = Math.floor(Math.random() * 6) - 3;
    let value = (baseLevel * ageFactor) + variance;
    attributes.physical[attr] = Math.max(1, Math.min(20, Math.round(value)));
  }

  // Goalkeeping if applicable
  if (position === 'GK') {
    attributes.goalkeeping = {};
    for (const attr of Object.keys(GOALKEEPING_ATTRIBUTES)) {
      const variance = Math.floor(Math.random() * 6) - 3;
      attributes.goalkeeping[attr] = Math.max(1, Math.min(20, baseLevel + variance));
    }
  }

  // Hidden attributes
  attributes.hidden = {
    consistency: 8 + Math.floor(Math.random() * 9), // 8-16
    dirtiness: 1 + Math.floor(Math.random() * 10),
    importantMatches: 8 + Math.floor(Math.random() * 9),
    injuryProneness: Math.floor(Math.random() * 12), // 0-12 (lower is better)
    versatility: 5 + Math.floor(Math.random() * 12),
    adaptability: 5 + Math.floor(Math.random() * 12)
  };

  // Personality
  attributes.personality = {
    professionalism: 8 + Math.floor(Math.random() * 9),
    ambition: 8 + Math.floor(Math.random() * 9),
    loyalty: 8 + Math.floor(Math.random() * 9),
    pressure: 8 + Math.floor(Math.random() * 9),
    sportsmanship: 8 + Math.floor(Math.random() * 9),
    temperament: 8 + Math.floor(Math.random() * 9),
    controversy: 1 + Math.floor(Math.random() * 10)
  };

  return attributes;
}

// Calculate CA (Current Ability) from attributes
export function calculateCA(attributes, position) {
  const weights = POSITION_ATTRIBUTE_WEIGHTS[position] || POSITION_ATTRIBUTE_WEIGHTS.MC;
  
  let totalScore = 0;
  let totalWeight = 0;

  // Technical
  for (const [attr, weight] of Object.entries(weights.technical || {})) {
    totalScore += (attributes.technical?.[attr] || 10) * weight;
    totalWeight += weight;
  }

  // Mental
  for (const [attr, weight] of Object.entries(weights.mental || {})) {
    totalScore += (attributes.mental?.[attr] || 10) * weight;
    totalWeight += weight;
  }

  // Physical
  for (const [attr, weight] of Object.entries(weights.physical || {})) {
    totalScore += (attributes.physical?.[attr] || 10) * weight;
    totalWeight += weight;
  }

  // GK specific
  if (position === 'GK' && attributes.goalkeeping) {
    for (const [attr, value] of Object.entries(attributes.goalkeeping)) {
      totalScore += value * 1.0;
      totalWeight += 1.0;
    }
  }

  // Convert to 1-200 scale
  const average = totalScore / totalWeight;
  return Math.round((average / 20) * 200);
}

// Get attribute category
export function getAttributeCategory(attrName) {
  if (TECHNICAL_ATTRIBUTES[attrName]) return 'technical';
  if (MENTAL_ATTRIBUTES[attrName]) return 'mental';
  if (PHYSICAL_ATTRIBUTES[attrName]) return 'physical';
  if (GOALKEEPING_ATTRIBUTES[attrName]) return 'goalkeeping';
  if (HIDDEN_ATTRIBUTES[attrName]) return 'hidden';
  if (PERSONALITY_ATTRIBUTES[attrName]) return 'personality';
  return null;
}

// Compare two players
export function comparePlayers(player1, player2, position) {
  const rating1 = player1.getPositionRating?.(position) || player1.overall || 70;
  const rating2 = player2.getPositionRating?.(position) || player2.overall || 70;

  const differences = {};

  // Compare key attributes for position
  const weights = POSITION_ATTRIBUTE_WEIGHTS[position];
  if (weights) {
    for (const [category, attrs] of Object.entries(weights)) {
      for (const attr of Object.keys(attrs)) {
        const val1 = player1[category]?.[attr] || 10;
        const val2 = player2[category]?.[attr] || 10;
        if (Math.abs(val1 - val2) >= 3) {
          differences[attr] = {
            player1: val1,
            player2: val2,
            diff: val1 - val2,
            winner: val1 > val2 ? 'player1' : 'player2'
          };
        }
      }
    }
  }

  return {
    overallDiff: rating1 - rating2,
    winner: rating1 > rating2 ? 'player1' : rating1 < rating2 ? 'player2' : 'tie',
    keyDifferences: differences
  };
}
