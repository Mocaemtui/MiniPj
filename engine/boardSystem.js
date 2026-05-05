// BOARD & OBJECTIVES SYSTEM
export const OBJECTIVE_TYPES = {
  LEAGUE_POSITION: 'league_position',
  DOMESTIC_CUP: 'domestic_cup',
  CONTINENTAL: 'continental',
  FINANCIAL: 'financial',
  YOUTH_DEVELOPMENT: 'youth_development',
  PLAYER_SIGNING: 'player_signing'
};

export const OBJECTIVE_PRIORITY = {
  CRITICAL: { weight: 3, label: 'Tối quan trọng' },
  HIGH: { weight: 2, label: 'Quan trọng' },
  MEDIUM: { weight: 1, label: 'Bình thường' }
};

export class BoardSystem {
  constructor(gameState) {
    this.gs = gameState;
    this.objectives = [];
    this.reputation = 50; // 0-100
    this.jobSecurity = 100; // 0-100, if 0 = fired
    this.boardMeetings = [];
    this.lastReview = null;
  }

  // Generate season objectives
  generateSeasonObjectives() {
    const team = this.gs.getMyTeam();
    const teamPrestige = team?.prestige || 50;
    
    this.objectives = [
      // Primary objective - League position
      {
        id: 'obj_league_1',
        type: OBJECTIVE_TYPES.LEAGUE_POSITION,
        title: 'Thành tích giải VĐQG',
        description: `Kết thúc mùa giải trong top ${this._getExpectedPosition(teamPrestige)}`,
        target: this._getExpectedPosition(teamPrestige),
        priority: OBJECTIVE_PRIORITY.CRITICAL,
        deadline: 'end_of_season',
        reward: { reputation: 10, job_security: 10 },
        penalty: { reputation: -15, job_security: -20 }
      },
      
      // Secondary - Domestic Cup
      {
        id: 'obj_cup_1',
        type: OBJECTIVE_TYPES.DOMESTIC_CUP,
        title: 'Cúp Quốc gia',
        description: 'Vào đến ít nhất bán kết Cúp Quốc gia',
        target: 'semi_final',
        priority: OBJECTIVE_PRIORITY.HIGH,
        deadline: 'end_of_cup',
        reward: { reputation: 5, job_security: 5 },
        penalty: { reputation: -5, job_security: -5 }
      },
      
      // Financial
      {
        id: 'obj_finance_1',
        type: OBJECTIVE_TYPES.FINANCIAL,
        title: 'Quản lý tài chính',
        description: 'Không để lỗ quá 2 triệu EUR trong mùa',
        target: -2000000,
        priority: OBJECTIVE_PRIORITY.MEDIUM,
        deadline: 'end_of_season',
        reward: { reputation: 3, job_security: 5 },
        penalty: { reputation: -5, job_security: -10 }
      }
    ];

    // Add continental objective if qualified
    if (this._isQualifiedForContinental()) {
      this.objectives.push({
        id: 'obj_continental_1',
        type: OBJECTIVE_TYPES.CONTINENTAL,
        title: 'Đấu trường châu Á',
        description: 'Vượt qua vòng bảng AFC Champions League',
        target: 'group_stage_advance',
        priority: OBJECTIVE_PRIORITY.HIGH,
        deadline: 'end_of_group_stage',
        reward: { reputation: 8, job_security: 10 },
        penalty: { reputation: -8, job_security: -10 }
      });
    }

    return this.objectives;
  }

  _getExpectedPosition(prestige) {
    if (prestige >= 80) return 1;  // Expected to win
    if (prestige >= 70) return 3;  // Top 3
    if (prestige >= 60) return 5;  // Top 5
    if (prestige >= 50) return 8;  // Top half
    return 12; // Avoid relegation
  }

  _isQualifiedForContinental() {
    const table = this.gs.getSortedTable?.() || [];
    const myPos = table.findIndex(e => e.teamId === this.gs.playerTeamId) + 1;
    return myPos <= 3; // Top 3 qualify
  }

  // Review objective progress
  reviewObjectives() {
    const results = [];
    
    for (const obj of this.objectives) {
      const progress = this._checkProgress(obj);
      results.push({
        objective: obj,
        progress,
        status: progress >= 100 ? 'completed' : progress > 50 ? 'on_track' : 'at_risk'
      });
    }

    return results;
  }

  _checkProgress(objective) {
    switch (objective.type) {
      case OBJECTIVE_TYPES.LEAGUE_POSITION:
        const table = this.gs.getSortedTable?.() || [];
        const pos = table.findIndex(e => e.teamId === this.gs.playerTeamId) + 1;
        // Higher progress if position is better than target
        return pos <= objective.target ? 100 : Math.max(0, 100 - (pos - objective.target) * 20);
        
      case OBJECTIVE_TYPES.FINANCIAL:
        const finance = this.gs.getMyFinance();
        const seasonLoss = (finance.expenses?.transfers || 0) - (finance.income?.transfers || 0);
        return seasonLoss > objective.target ? 100 : 50;
        
      default:
        return 50; // Unknown progress
    }
  }

  // Season-end evaluation
  evaluateSeasonEnd() {
    const results = [];
    let totalRepChange = 0;
    let totalJobSecChange = 0;

    for (const obj of this.objectives) {
      const success = this._checkObjectiveSuccess(obj);
      
      if (success) {
        totalRepChange += obj.reward.reputation;
        totalJobSecChange += obj.reward.job_security;
      } else {
        totalRepChange += obj.penalty.reputation;
        totalJobSecChange += obj.penalty.job_security;
      }

      results.push({
        objective: obj,
        success,
        reputationChange: success ? obj.reward.reputation : obj.penalty.reputation,
        jobSecurityChange: success ? obj.reward.job_security : obj.penalty.job_security
      });
    }

    // Apply changes
    this.reputation = Math.max(0, Math.min(100, this.reputation + totalRepChange));
    this.jobSecurity = Math.max(0, Math.min(100, this.jobSecurity + totalJobSecChange));

    this.lastReview = {
      date: new Date(this.gs.date),
      results,
      finalReputation: this.reputation,
      finalJobSecurity: this.jobSecurity
    };

    return this.lastReview;
  }

  _checkObjectiveSuccess(objective) {
    const progress = this._checkProgress(objective);
    return progress >= 100;
  }

  // Get job status
  getJobStatus() {
    return {
      security: this.jobSecurity,
      reputation: this.reputation,
      risk: this.jobSecurity < 30 ? 'CRITICAL' : this.jobSecurity < 50 ? 'HIGH' : 'NORMAL',
      warnings: this._getWarnings()
    };
  }

  _getWarnings() {
    const warnings = [];
    if (this.jobSecurity < 30) warnings.push('Nguy cơ bị sa thải cao!');
    if (this.reputation < 30) warnings.push('Danh tiếng đang suy giảm');
    
    // Check failing objectives
    const failing = this.objectives.filter(obj => this._checkProgress(obj) < 50);
    if (failing.length > 0) {
      warnings.push(`${failing.length} mục tiêu đang gặp nguy cơ`);
    }
    
    return warnings;
  }

  // Board meeting
  callBoardMeeting(reason = 'regular') {
    const meeting = {
      id: Date.now(),
      date: new Date(this.gs.date),
      reason,
      outcomes: [],
      decisions: []
    };

    if (reason === 'poor_performance') {
      if (this.jobSecurity < 20) {
        meeting.decisions.push({
          type: 'final_warning',
          message: 'Cảnh báo cuối cùng: Cải thiện ngay hoặc bị sa thải'
        });
      }
    }

    this.boardMeetings.push(meeting);
    return meeting;
  }

  // Check if should be fired
  checkSackable() {
    return this.jobSecurity <= 0;
  }
}

export default BoardSystem;
