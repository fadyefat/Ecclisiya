import { AttendanceUserItemDto } from '../../../types/api';
import { AttendanceMethod, Attendance, UserStatus } from '../../../types/common';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';

export const attendanceService = {
  async getAttendeesForDay(dayId: string, search = ''): Promise<AttendanceUserItemDto[]> {
    await simulateNetworkDelay();
    const users = mockStorage.getUsers();
    const attendances = mockStorage.getAttendances().filter(a => a.attendanceDayId === dayId);

    const result: AttendanceUserItemDto[] = [];

    for (const record of attendances) {
      const user = users.find(u => u.id === record.userId);
      if (!user) continue;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!user.name.toLowerCase().includes(q) && !user.phoneNumber.includes(q)) {
          continue;
        }
      }

      result.push({
        userId: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        levelName: user.levelName,
        isAttended: true,
        markedAtUtc: record.markedAtUtc,
        method: record.method,
      });
    }

    // Sort by markedAtUtc descending
    result.sort((a, b) => {
      const tA = a.markedAtUtc ? new Date(a.markedAtUtc).getTime() : 0;
      const tB = b.markedAtUtc ? new Date(b.markedAtUtc).getTime() : 0;
      return tB - tA;
    });

    return result;
  },

  async getAbsenteesForDay(dayId: string, search = ''): Promise<AttendanceUserItemDto[]> {
    await simulateNetworkDelay();
    const day = mockStorage.getAttendanceDays().find(d => d.id === dayId);
    if (!day) return [];

    // Eligible active users only
    const eligibleUsers = mockStorage.getEligibleActiveUsers();
    const attendances = mockStorage.getAttendances().filter(a => a.attendanceDayId === dayId);
    const attendedUserIds = new Set(attendances.map(a => a.userId));

    let absentees = eligibleUsers.filter(u => !attendedUserIds.has(u.id));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      absentees = absentees.filter(u => 
        u.name.toLowerCase().includes(q) || 
        u.phoneNumber.includes(q) ||
        (u.levelName && u.levelName.toLowerCase().includes(q))
      );
    }

    return absentees.map(u => ({
      userId: u.id,
      name: u.name,
      phoneNumber: u.phoneNumber,
      gender: u.gender,
      levelName: u.levelName,
      isAttended: false,
      markedAtUtc: null,
      method: null,
    }));
  },

  async markManualAttendance(dayId: string, userId: string, notes?: string): Promise<Attendance> {
    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === dayId);
    if (!day) throw new Error('جلسة الحضور غير موجودة');

    const users = mockStorage.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('العضو غير موجود');

    if (user.status !== UserStatus.Active || user.isDeleted) {
      throw new Error('لا يمكن تسجيل حضور لعضو غير نشط أو معلق');
    }

    const attendances = mockStorage.getAttendances();
    const alreadyAttended = attendances.some(a => a.attendanceDayId === dayId && a.userId === userId);
    if (alreadyAttended) {
      throw new Error('تم تسجيل حضور هذا العضو مسبقًا في هذه الجلسة');
    }

    const newAttendance: Attendance = {
      id: `at-${Date.now()}`,
      userId,
      attendanceDayId: dayId,
      markedAtUtc: new Date().toISOString(),
      method: AttendanceMethod.Manual,
      notes: notes || 'تسجيل يدوي بواسطة الإدارة',
    };

    attendances.push(newAttendance);
    mockStorage.saveAttendances(attendances);

    // Recompute day stats
    mockStorage.recomputeDayMetrics(dayId);

    mockStorage.addAuditLog({
      action: 'تسجيل حضور يدوي',
      targetType: 'Attendance',
      targetId: newAttendance.id,
      details: `تسجيل حضور يدوي للعضو ${user.name} في جلسة «${day.title}» — السبب: ${notes || 'غير محدد'}`,
      performedBy: 'المدير العام (أدمن)',
    });

    return newAttendance;
  },

  async removeAttendanceRecord(dayId: string, userId: string, reason?: string): Promise<void> {
    await simulateNetworkDelay();
    let attendances = mockStorage.getAttendances();
    const target = attendances.find(a => a.attendanceDayId === dayId && a.userId === userId);
    if (!target) throw new Error('سجل الحضور غير موجود');

    const user = mockStorage.getUsers().find(u => u.id === userId);

    attendances = attendances.filter(a => a.id !== target.id);
    mockStorage.saveAttendances(attendances);

    // Recompute stats
    mockStorage.recomputeDayMetrics(dayId);

    mockStorage.addAuditLog({
      action: 'إلغاء تسجيل حضور',
      targetType: 'Attendance',
      targetId: target.id,
      details: `تم إلغاء حضور ${user ? user.name : userId} — السبب: ${reason || 'تصحيح خطأ'}`,
      performedBy: 'المدير العام (أدمن)',
    });
  },
};
