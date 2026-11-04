import { AdminDashboardSummaryDto, AttendanceTrendItemDto } from '../../../types/api';
import { AttendanceDay, AuditLog, UserStatus } from '../../../types/common';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import { formatArabicDate } from '../../../lib/date-utils';
import {
  supabase,
  isSupabaseEnabled,
  mapDbUser,
  mapDbAttendanceDay,
  mapDbAuditLog,
} from '../../../lib/supabase';

export const dashboardService = {
  async getSummary(from?: string, to?: string): Promise<AdminDashboardSummaryDto> {
    if (isSupabaseEnabled()) {
      const [{ data: usrData, error: usrErr }, { data: dayData, error: dayErr }] = await Promise.all([
        supabase.from('users').select('*').eq('is_deleted', false),
        supabase.from('attendance_days').select('*'),
      ]);

      if (usrErr) throw new Error(usrErr.message);
      if (dayErr) throw new Error(dayErr.message);

      const allUsers = (usrData || []).map(r => mapDbUser(r as Record<string, unknown>));
      const totalUsers = allUsers.filter(u => u.status === UserStatus.Active).length;
      const totalPendingUsers = allUsers.filter(u => u.status === UserStatus.Pending).length;

      let days = (dayData || []).map(r => mapDbAttendanceDay(r as Record<string, unknown>));

      if (from) {
        days = days.filter(d => d.date >= from);
      }
      if (to) {
        days = days.filter(d => d.date <= to);
      }

      const totalAttendanceDays = days.length;
      const finalizedDays = days.filter(d => d.status === 'Finalized');
      const totalAttendees = finalizedDays.reduce((acc, d) => acc + d.totalAttendees, 0);
      const totalAbsentees = finalizedDays.reduce((acc, d) => acc + d.totalAbsentees, 0);

      const totalPossible = totalAttendees + totalAbsentees;
      const attendancePercentage =
        totalPossible > 0 ? Math.round((totalAttendees / totalPossible) * 1000) / 10 : 0;

      const sortedDays = [...days].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
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
    }

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
    const finalizedDays = days.filter(d => d.status === 'Finalized');
    const totalAttendees = finalizedDays.reduce((acc, d) => acc + d.totalAttendees, 0);
    const totalAbsentees = finalizedDays.reduce((acc, d) => acc + d.totalAbsentees, 0);

    const totalPossible = totalAttendees + totalAbsentees;
    const attendancePercentage =
      totalPossible > 0 ? Math.round((totalAttendees / totalPossible) * 1000) / 10 : 0;

    const sortedDays = [...days].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
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
    let days: AttendanceDay[] = [];

    if (isSupabaseEnabled()) {
      const { data, error } = await supabase.from('attendance_days').select('*');
      if (error) throw new Error(error.message);
      days = (data || []).map(r => mapDbAttendanceDay(r as Record<string, unknown>));
    } else {
      await simulateNetworkDelay();
      days = mockStorage.getAttendanceDays();
      days = days.map(d => mockStorage.recomputeDayMetrics(d.id) || d);
    }

    if (from) {
      days = days.filter(d => d.date >= from);
    }
    if (to) {
      days = days.filter(d => d.date <= to);
    }

    const trendDays = days.filter(d => d.status === 'Finalized' || d.status === 'Open');
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
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('attendance_days')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data || []).map(r => mapDbAttendanceDay(r as Record<string, unknown>));
    }

    await simulateNetworkDelay();
    let days = mockStorage.getAttendanceDays();
    days = days.map(d => mockStorage.recomputeDayMetrics(d.id) || d);
    days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return days.slice(0, limit);
  },

  async getAuditLogs(limit = 10): Promise<AuditLog[]> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data || []).map(r => mapDbAuditLog(r as Record<string, unknown>));
    }

    await simulateNetworkDelay();
    return mockStorage.getAuditLogs().slice(0, limit);
  },
};
