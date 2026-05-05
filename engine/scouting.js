// ============================================================
// SCOUTING SYSTEM - Fog of War & Knowledge Management
// Discover players gradually, work permits, cultural fit
// ============================================================

import { ScoutingReport } from '../data/transferSystem.js';

export class ScoutingManager {
  constructor(gameState) {
    this.gs = gameState;
    
    // All active scouting reports
    this.reports = new Map(); // playerId -> ScoutingReport
    
    // Scout assignments
    this.scoutAssignments = new Map(); // scoutId -> [{ playerId, startDate, duration }]
    
    // Work permit rules (for English league context)
    this.workPermitRules = {
      requiredForNonEU: true,
      autoQualified: {
        nationalTeamCaps: 75, // % of matches in last 2 years
        nationalTeamRanking: 50, // FIFA ranking threshold
        youthPlayerValue: 1000000 // Auto qualify if value > this
      }
    };
    
    // Cultural factors affecting adaptation
    this.culturalRegions = {
      western_europe: ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'NED', 'BEL', 'POR'],
      eastern_europe: ['POL', 'CZE', 'RUS', 'UKR', 'ROU', 'HUN'],
      south_america: ['BRA', 'ARG', 'URY', 'COL', 'CHL', 'PER'],
      africa: ['NGA', 'CIV', 'SEN', 'GHA', 'MAR', 'EGY'],
      asia: ['JPN', 'KOR', 'CHN', 'AUS', 'IRN', 'KSA'],
      scandinavia: ['SWE', 'NOR', 'DEN', 'FIN', 'ISL']
    };
  }

  // ==================== SCOUTING ACTIONS ====================

  // Start scouting a player
  assignScout(playerId, scoutId = 'default', duration = 1) {
    const player = this.gs.getPlayerById(playerId);
    if (!player) return null;
    
    // Check if already fully scouted
    const existingReport = this.reports.get(playerId);
    if (existingReport && existingReport.knowledgeLevel >= 100) {
      return {
        success: false,
        message: 'Cầu thủ này đã được theo dõi đầy đủ.',
        report: existingReport
      };
    }
    
    // Create or update report
    let report = existingReport;
    if (!report) {
      report = new ScoutingReport({
        playerId,
        scoutId,
        maxAssignments: 5
      });
      this.reports.set(playerId, report);
    }
    
    // Check assignment limit
    if (report.assignments >= report.maxAssignments) {
      return {
        success: false,
        message: 'Đã đạt giới hạn số lần theo dõi cho cầu thủ này.',
        report
      };
    }
    
    // Record assignment
    if (!this.scoutAssignments.has(scoutId)) {
      this.scoutAssignments.set(scoutId, []);
    }
    this.scoutAssignments.get(scoutId).push({
      playerId,
      startDate: new Date(this.gs.date),
      duration,
      completed: false
    });
    
    // Advance scouting (simulate observation)
    report.scout();
    
    // Generate report content
    const reportData = this._generateReportData(player, report);
    
    return {
      success: true,
      message: `Scout đang theo dõi ${player.name} (${duration} tuần).`,
      report: reportData,
      knowledgeLevel: report.knowledgeLevel,
      assignmentsRemaining: report.maxAssignments - report.assignments
    };
  }

  // Get visible attributes based on scouting knowledge
  getPlayerVisibility(playerId) {
    const player = this.gs.getPlayerById(playerId);
    if (!player) return null;
    
    const report = this.reports.get(playerId);
    const knowledge = report?.knowledgeLevel || 0;
    
    return {
      knowledgeLevel: knowledge,
      visibility: report?.getVisibleAttributes(player.attributes) || {},
      knownOverall: knowledge >= 60 ? player.overall : this._estimateOverall(knowledge, player),
      knownPotential: knowledge >= 80 ? player.potential : '???',
      workPermit: this._checkWorkPermit(player),
      culturalFit: this._assessCulturalFit(player),
      lastScouted: report?.lastScouted
    };
  }

  // Complete scouting assignment
  completeScouting(scoutId, playerId) {
    const assignments = this.scoutAssignments.get(scoutId);
    if (!assignments) return null;
    
    const assignment = assignments.find(a => a.playerId === playerId && !a.completed);
    if (!assignment) return null;
    
    assignment.completed = true;
    assignment.endDate = new Date(this.gs.date);
    
    const player = this.gs.getPlayerById(playerId);
    const report = this.reports.get(playerId);
    
    return this._generateFinalReport(player, report);
  }

  // ==================== REPORT GENERATION ====================

  _generateReportData(player, report) {
    const knowledge = report.knowledgeLevel;
    const visibleAttrs = report.getVisibleAttributes(player.attributes);
    
    return {
      player: {
        id: player.id,
        name: player.name,
        age: player.age,
        position: player.pos,
        club: this.gs.getTeamById(player.teamId)?.name
      },
      
      knowledge: {
        level: knowledge,
        status: this._knowledgeStatus(knowledge),
        assignmentsUsed: report.assignments,
        maxAssignments: report.maxAssignments
      },
      
      attributes: visibleAttrs,
      
      assessment: knowledge >= 40 ? this._generateAssessment(player, report) : null,
      
      recommendation: knowledge >= 60 ? this._generateRecommendation(player) : 'Cần theo dõi thêm',
      
      risks: knowledge >= 50 ? this._identifyRisks(player) : [],
      
      estimatedCost: knowledge >= 40 ? {
        marketValue: player.value,
        wageEstimate: player.wage,
        confidence: knowledge >= 80 ? 'high' : knowledge >= 60 ? 'medium' : 'low'
      } : null
    };
  }

  _generateFinalReport(player, report) {
    const assessment = this._generateAssessment(player, report);
    
    return {
      type: 'final_scouting_report',
      player: {
        id: player.id,
        name: player.name,
        age: player.age,
        nationality: player.nationality,
        position: player.pos,
        club: this.gs.getTeamById(player.teamId)?.name
      },
      
      attributes: report.getVisibleAttributes(player.attributes),
      
      overall: {
        current: player.overall,
        potential: player.potential,
        peakAge: 27 - (player.potential - player.overall) / 5
      },
      
      assessment: {
        fitRating: assessment.fitRating,
        roleRecommendation: assessment.recommendedRole,
        adaptability: assessment.adaptability,
        injuryRisk: assessment.injuryRisk,
        workPermit: this._checkWorkPermit(player),
        culturalFit: this._assessCulturalFit(player)
      },
      
      financial: {
        marketValue: player.value,
        wageDemands: player.wage,
        contractLength: 'Cần kiểm tra',
        sellOnPotential: player.age < 23 && player.potential >= 80 ? 'high' : 'medium'
      },
      
      recommendation: this._generateRecommendation(player),
      
      risks: this._identifyRisks(player),
      
      summary: this._generateSummary(player, assessment)
    };
  }

  _generateAssessment(player, report) {
    const myTeam = this.gs.getTeamById(this.gs.playerTeamId);
    const myPlayers = this.gs.getMyPlayers?.() || 
      this.gs.players.filter(p => p.teamId === this.gs.playerTeamId);
    
    // Calculate fit rating
    const fitRating = this._calculateFitRating(player, myPlayers);
    
    // Role recommendation
    const recommendedRole = this._recommendRole(player, myPlayers);
    
    // Adaptability score
    const adaptability = this._calculateAdaptability(player, myTeam);
    
    // Injury risk
    const injuryRisk = player.injuryProneness || 'unknown';
    
    return {
      fitRating,
      recommendedRole,
      adaptability,
      injuryRisk,
      summary: `${player.name} phù hợp ${fitRating}/100 với đội hình hiện tại.`
    };
  }

  _calculateFitRating(player, teamPlayers) {
    let score = 50; // Base score
    
    // Check position need
    const positionPlayers = teamPlayers.filter(p => p.pos === player.pos);
    if (positionPlayers.length < 2) score += 20; // Need this position
    else if (positionPlayers.every(p => p.overall < player.overall)) score += 15; // Would be best
    
    // Age fit
    if (player.age >= 24 && player.age <= 28) score += 10; // Peak years
    else if (player.age < 21 && player.potential >= 80) score += 15; // Hot prospect
    
    // Overall quality
    const teamAvg = teamPlayers.reduce((sum, p) => sum + p.overall, 0) / teamPlayers.length;
    if (player.overall > teamAvg + 5) score += 10;
    else if (player.overall < teamAvg - 10) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  _recommendRole(player, teamPlayers) {
    const positionPlayers = teamPlayers.filter(p => p.pos === player.pos);
    const sorted = positionPlayers.sort((a, b) => b.overall - a.overall);
    
    if (sorted.length === 0) return 'Đội hình chính (vị trí thiếu)';
    
    const bestInPosition = sorted[0];
    if (player.overall > bestInPosition.overall + 3) return 'Trụ cột mới';
    if (player.overall > bestInPosition.overall - 2) return 'Cạnh tranh vị trí';
    if (player.age <= 21) return 'Tiềm năng';
    return 'Dự bị chất lượng';
  }

  _calculateAdaptability(player, team) {
    let score = 50;
    
    // Language/culture
    const culturalFit = this._assessCulturalFit(player);
    score += (culturalFit.score - 50) / 2;
    
    // Age factor
    if (player.age <= 23) score -= 10; // Young players may struggle
    if (player.age >= 28) score += 10; // Experienced
    
    // League experience
    if (player.experience) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  _assessCulturalFit(player) {
    const myTeam = this.gs.getTeamById(this.gs.playerTeamId);
    const playerRegion = this._getRegion(player.nationality);
    const teamRegion = this._getRegion(myTeam?.country || 'ENG');
    
    const sameRegion = playerRegion === teamRegion;
    const sameLanguage = this._checkLanguageCompatibility(player.nationality, myTeam?.country);
    
    let score = sameRegion ? 80 : sameLanguage ? 70 : 50;
    
    // Specific challenges
    const challenges = [];
    if (!sameRegion) challenges.push('Khác vùng văn hóa');
    if (!sameLanguage) challenges.push('Rào cản ngôn ngữ');
    if (player.age < 21) challenges.push('Tuổi trẻ, cần hỗ trợ');
    
    return {
      score,
      sameRegion,
      sameLanguage,
      challenges,
      adaptationTime: sameRegion ? '3-6 tháng' : '6-12 tháng'
    };
  }

  _getRegion(countryCode) {
    for (const [region, countries] of Object.entries(this.culturalRegions)) {
      if (countries.includes(countryCode?.toUpperCase())) return region;
    }
    return 'other';
  }

  _checkLanguageCompatibility(playerNat, teamCountry) {
    // Simplified language check
    const languageGroups = {
      english: ['ENG', 'USA', 'AUS', 'CAN'],
      spanish: ['ESP', 'ARG', 'MEX', 'COL'],
      portuguese: ['POR', 'BRA'],
      french: ['FRA', 'BEL', 'CIV', 'SEN'],
      german: ['GER', 'AUT', 'SUI']
    };
    
    for (const [lang, countries] of Object.entries(languageGroups)) {
      if (countries.includes(playerNat?.toUpperCase()) && 
          countries.includes(teamCountry?.toUpperCase())) {
        return true;
      }
    }
    return false;
  }

  _checkWorkPermit(player) {
    // Simplified work permit check
    const myTeam = this.gs.getTeamById(this.gs.playerTeamId);
    const teamCountry = myTeam?.country || 'ENG';
    
    // Only relevant for certain leagues
    if (!['ENG', 'WAL'].includes(teamCountry)) {
      return { required: false, qualified: true };
    }
    
    const rules = this.workPermitRules;
    
    // Check auto-qualification criteria
    const caps = player.nationalTeamCaps || 0;
    const totalCaps = player.nationalTeamTotal || 1;
    const capPercentage = (caps / totalCaps) * 100;
    
    const autoQualified = 
      capPercentage >= rules.autoQualified.nationalTeamCaps ||
      (player.value || 0) >= rules.autoQualified.youthPlayerValue;
    
    return {
      required: true,
      qualified: autoQualified,
      capPercentage,
      appealPossible: !autoQualified && player.potential >= 80,
      notes: autoQualified 
        ? 'Đủ điều kiện tự động' 
        : 'Cần kháng cáo hoặc giấy phép đặc biệt'
    };
  }

  _identifyRisks(player) {
    const risks = [];
    
    if (player.injuryProneness && player.injuryProneness > 70) {
      risks.push({ type: 'injury', level: 'high', text: 'Nguy cơ chấn thương cao' });
    }
    
    if (player.morale && player.morale < 40) {
      risks.push({ type: 'personality', level: 'medium', text: 'Tinh thần đang thấp' });
    }
    
    if (player.age > 30) {
      risks.push({ type: 'age', level: 'medium', text: 'Tuổi cao, giá trị giảm' });
    }
    
    if (player.contractYears && player.contractYears < 1) {
      risks.push({ type: 'contract', level: 'high', text: 'Hợp đồng sắp hết hạn' });
    }
    
    return risks;
  }

  _generateRecommendation(player) {
    const overall = player.overall;
    const potential = player.potential;
    const age = player.age;
    const value = player.value || 1000000;
    
    if (overall >= 85) return { action: 'sign', priority: 'urgent', text: 'Chớp ngay - cầu thủ đẳng cấp' };
    if (potential >= 85 && age <= 21) return { action: 'sign', priority: 'high', text: 'Tiềm năng vượt trội, nên ký' };
    if (overall >= 80 && value < 15000000) return { action: 'sign', priority: 'medium', text: 'Giá hợp lý cho chất lượng' };
    if (potential >= 80 && age <= 23) return { action: 'monitor', priority: 'medium', text: 'Theo dõi và chờ thời cơ' };
    if (overall >= 75 && age <= 27) return { action: 'consider', priority: 'low', text: 'Lựa chọn ổn nếu giá tốt' };
    return { action: 'avoid', priority: 'low', text: 'Không phù hợp hoặc giá cao' };
  }

  _generateSummary(player, assessment) {
    const parts = [];
    
    parts.push(`${player.name} (${player.age} tuổi, ${player.pos}) - OVR ${player.overall}/${player.potential}`);
    parts.push(`Phù hợp: ${assessment.fitRating}/100 | Thích nghi: ${assessment.adaptability}/100`);
    parts.push(`Vai trò đề xuất: ${assessment.recommendedRole}`);
    parts.push(`Giá trị: €${((player.value || 0)/1000000).toFixed(1)}M`);
    
    return parts.join(' | ');
  }

  _knowledgeStatus(knowledge) {
    if (knowledge < 20) return 'Không rõ';
    if (knowledge < 40) return 'Sơ lược';
    if (knowledge < 60) return 'Cơ bản';
    if (knowledge < 80) return 'Tốt';
    return 'Đầy đủ';
  }

  _estimateOverall(knowledge, player) {
    // Estimate with uncertainty based on knowledge level
    const actual = player.overall;
    const uncertainty = Math.max(5, 15 - (knowledge / 10));
    
    return {
      estimate: actual,
      range: [actual - uncertainty, actual + uncertainty],
      confidence: knowledge >= 60 ? 'medium' : 'low'
    };
  }

  // ==================== UTILITY FUNCTIONS ====================

  searchPlayers(criteria) {
    const allPlayers = this.gs.players.filter(p => p.teamId !== this.gs.playerTeamId);
    
    return allPlayers.filter(player => {
      // Position filter
      if (criteria.positions && !criteria.positions.includes(player.pos)) return false;
      
      // Age filter
      if (criteria.minAge && player.age < criteria.minAge) return false;
      if (criteria.maxAge && player.age > criteria.maxAge) return false;
      
      // Overall filter
      if (criteria.minOverall && player.overall < criteria.minOverall) return false;
      if (criteria.maxOverall && player.overall > criteria.maxOverall) return false;
      
      // Value filter
      if (criteria.maxValue && (player.value || 0) > criteria.maxValue) return false;
      
      // Region filter
      if (criteria.regions) {
        const playerRegion = this._getRegion(player.nationality);
        if (!criteria.regions.includes(playerRegion)) return false;
      }
      
      return true;
    });
  }

  getScoutingSummary() {
    const reports = Array.from(this.reports.values());
    const assignments = Array.from(this.scoutAssignments.values()).flat();
    
    return {
      totalPlayersScouted: this.reports.size,
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter(a => !a.completed).length,
      completedAssignments: assignments.filter(a => a.completed).length,
      fullyScoutedPlayers: reports.filter(r => r.knowledgeLevel >= 100).length,
      
      byKnowledgeLevel: {
        minimal: reports.filter(r => r.knowledgeLevel < 40).length,
        basic: reports.filter(r => r.knowledgeLevel >= 40 && r.knowledgeLevel < 70).length,
        good: reports.filter(r => r.knowledgeLevel >= 70 && r.knowledgeLevel < 90).length,
        full: reports.filter(r => r.knowledgeLevel >= 90).length
      }
    };
  }

  // Save/load functionality
  serialize() {
    return {
      reports: Array.from(this.reports.entries()),
      assignments: Array.from(this.scoutAssignments.entries())
    };
  }

  load(data) {
    this.reports.clear();
    this.scoutAssignments.clear();
    
    if (data.reports) {
      for (const [playerId, reportData] of data.reports) {
        this.reports.set(playerId, new ScoutingReport(reportData));
      }
    }
    
    if (data.assignments) {
      for (const [scoutId, assignments] of data.assignments) {
        this.scoutAssignments.set(scoutId, assignments);
      }
    }
  }
}
