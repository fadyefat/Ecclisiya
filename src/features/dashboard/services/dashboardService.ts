import { AdminDashboardSummaryDto, AttendanceTrendItemDto } from '../../../types/api';
import { AttendanceDay, UserStatus } from '../../../types/common';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import { formatArabicDate } from '../../../lib/date-utils';

export const dashboardService = {
  async getSummary(from?: string, to?: string): Promise<AdminDashboardSummaryDto> {
    await simulateNetworkDelay();
    const allUsers = mockStorage.getUsers().filter(u => !u.isDeleted);
    const totalUsers = allUsers.filter(u => u.status === UserStatus.Active).length;
    const totalPendingUsers = allUsers.filter(u => u.status === UserStatus.Pending).length;

    let days = mockStorage.getAttendanceDays();
    days = days.map(d => mockStorage.recomputeDayMetrics(d.id) || d);

    if (from) {
      days = days.filter(d => d.date >= from);
    }
    if (to) {
      days = days.filter(d => d.date <= to);
    }

    const totalAttendanceDays = days.length;

    // Rule from PDF: Define TotalAttendees and TotalAbsentees across finalized attendance days
    const finalizedDays = days.filter(d => d.status === 'Finalized');
    const totalAttendees = finalizedDays.reduce((acc, d) => acc + d.totalAttendees, 0);
    const totalAbsentees = finalizedDays.reduce((acc, d) => acc + d.totalAbsentees, 0);

    const totalPossible = totalAttendees + totalAbsentees;
    const attendancePercentage = totalPossible > 0 
      ? Math.round((totalAttendees / totalPossible) * 1000) / 10 
      : 0;

    // Last attendance day
    const sortedDays = [...days].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDay = sortedDays[0];

    return {
      totalUsers,
      totalPendingUsers,
      totalAttendanceDays,
      totalAttendees,
      totalAbsentees,
      lastAttendanceDayDate: lastDay ? lastDay.date : null,
      lastDayAttendees: lastDay ? lastDay.totalAttendees : 0,
      lastDayAbsentees: lastDay ? lastDay.totalAbsentees : 0,
      attendancePercentage,
    };
  },

  async getAttendanceTrend(from?: string, to?: string): Promise<AttendanceTrendItemDto[]> {
    await simulateNetworkDelay();
    let days = mockStorage.getAttendanceDays();
    days = days.map(d => mockStorage.recomputeDayMetrics(d.id) || d);

    if (from) {
      days = days.filter(d => d.date >= from);
    }
    if (to) {
      days = days.filter(d => d.date <= to);
    }

    // Trend only on completed/finalized days or include current open session
    const trendDays = days.filter(d => d.status === 'Finalized' || d.status === 'Open');

    // Sort ascending for chart x-axis
    trendDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return trendDays.map(d => ({
      date: formatArabicDate(d.date),
      title: d.title,
      attendees: d.totalAttendees,
      absentees: d.totalAbsentees,
      attendancePercentage: d.attendancePercentage,
    }));
  },

  async getRecentAttendanceDays(limit = 5): Promise<AttendanceDay[]> {
    await simulateNetworkDelay();
    let days = mockStorage.getAttendanceDays();
    days = days.map(d => mockStorage.recomputeDayMetrics(d.id) || d);

    // Sort latest first
    days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return days.slice(0, limit);
  },

  async getAuditLogs(limit = 10) {
    await simulateNetworkDelay();
    return mockStorage.getAuditLogs().slice(0, limit);
  },
};
