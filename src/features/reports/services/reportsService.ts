import { AttendanceDay } from '../../../types/common';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';

export interface ReportsFilterParams {
  from?: string;
  to?: string;
  sessionTitle?: string;
  status?: string;
  levelId?: string;
}

export interface MemberAttendanceReportItem {
  userId: string;
  name: string;
  phoneNumber: string;
  levelName?: string;
  confessionFather?: string;
  totalFinalizedSessions: number;
  attendedSessions: number;
  absentSessions: number;
  attendanceRate: number;
  needsReview: boolean; // low attendance rate
}

export interface ReportsSummary {
  totalFinalizedSessions: number;
  totalAttendances: number;
  totalConfirmedAbsences: number;
  overallAttendanceRate: number;
  sessions: AttendanceDay[];
  memberReports: MemberAttendanceReportItem[];
}

export const reportsService = {
  async getReportsSummary(filters: ReportsFilterParams = {}): Promise<ReportsSummary> {
    await simulateNetworkDelay();
    let days = mockStorage.getAttendanceDays();
    days = days.map(d => mockStorage.recomputeDayMetrics(d.id) || d);

    if (filters.from) {
      days = days.filter(d => d.date >= filters.from!);
    }
    if (filters.to) {
      days = days.filter(d => d.date <= filters.to!);
    }
    if (filters.sessionTitle && filters.sessionTitle.trim()) {
      const q = filters.sessionTitle.trim().toLowerCase();
      days = days.filter(d => d.title.toLowerCase().includes(q));
    }
    if (filters.status && filters.status !== 'all') {
      days = days.filter(d => d.status === filters.status);
    }

    const finalizedDays = days.filter(d => d.status === 'Finalized');
    const totalFinalizedSessions = finalizedDays.length;
    const totalAttendances = finalizedDays.reduce((sum, d) => sum + d.totalAttendees, 0);
    const totalConfirmedAbsences = finalizedDays.reduce((sum, d) => sum + d.totalAbsentees, 0);

    const totalPossible = totalAttendances + totalConfirmedAbsences;
    const overallAttendanceRate = totalPossible > 0 
      ? Math.round((totalAttendances / totalPossible) * 1000) / 10 
      : 0;

    // Per-member attendance breakdown across finalized days
    let eligibleUsers = mockStorage.getEligibleActiveUsers();
    if (filters.levelId && filters.levelId !== 'all') {
      eligibleUsers = eligibleUsers.filter(u => u.levelId === filters.levelId);
    }

    const attendances = mockStorage.getAttendances();
    const finalizedDayIds = new Set(finalizedDays.map(d => d.id));

    const memberReports: MemberAttendanceReportItem[] = eligibleUsers.map(user => {
      // Find attendances in finalized days
      const userAttendances = attendances.filter(
        a => a.userId === user.id && finalizedDayIds.has(a.attendanceDayId)
      );
      const attendedSessions = userAttendances.length;
      const absentSessions = Math.max(0, totalFinalizedSessions - attendedSessions);
      const rate = totalFinalizedSessions > 0 
        ? Math.round((attendedSessions / totalFinalizedSessions) * 1000) / 10 
        : 100;

      return {
        userId: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        levelName: user.levelName,
        confessionFather: user.confessionFather,
        totalFinalizedSessions,
        attendedSessions,
        absentSessions,
        attendanceRate: rate,
        needsReview: totalFinalizedSessions >= 2 && rate < 75,
      };
    });

    // Sort: Members needing review first, then by attendance rate ascending
    memberReports.sort((a, b) => {
      if (a.needsReview !== b.needsReview) return a.needsReview ? -1 : 1;
      return a.attendanceRate - b.attendanceRate;
    });

    return {
      totalFinalizedSessions,
      totalAttendances,
      totalConfirmedAbsences,
      overallAttendanceRate,
      sessions: days,
      memberReports,
    };
  },
};
