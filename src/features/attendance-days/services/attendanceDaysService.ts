import { AttendanceDay, AttendanceDayStatus, PagedResponse } from '../../../types/common';
import { CreateAttendanceDayDto, UpdateAttendanceDayDto } from '../../../types/api';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';

export interface GetAttendanceDaysParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AttendanceDayStatus | 'all';
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

function generateDemoQrToken(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 9).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `ECC-${prefix}-${time}-${rand}`;
}

export const attendanceDaysService = {
  async getAttendanceDays(params: GetAttendanceDaysParams = {}): Promise<PagedResponse<AttendanceDay>> {
    await simulateNetworkDelay();
    const {
      page = 1,
      pageSize = 10,
      search = '',
      status,
      from,
      to,
    } = params;

    let days = mockStorage.getAttendanceDays();

    // Recompute metrics for each day
    days = days.map(d => mockStorage.recomputeDayMetrics(d.id) || d);

    // Filter by search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      days = days.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.location.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (status && status !== 'all') {
      days = days.filter(d => d.status === status);
    }

    // Filter by date range
    if (from) {
      days = days.filter(d => d.date >= from);
    }
    if (to) {
      days = days.filter(d => d.date <= to);
    }

    // Sort by date descending (latest first)
    days.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCount = days.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIdx = (page - 1) * pageSize;
    const items = days.slice(startIdx, startIdx + pageSize);

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages,
    };
  },

  async getAttendanceDayById(id: string): Promise<AttendanceDay | null> {
    await simulateNetworkDelay();
    const day = mockStorage.recomputeDayMetrics(id);
    return day || null;
  },

  async createAttendanceDay(dto: CreateAttendanceDayDto): Promise<AttendanceDay> {
    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();

    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (end <= start) {
      throw new Error('وقت نهاية الاجتماع يجب أن يكون بعد وقت البداية');
    }

    const eligibleUsers = mockStorage.getEligibleActiveUsers();
    const isNowOpen = !!dto.isOpen;

    const newDay: AttendanceDay = {
      id: `att-day-${Date.now()}`,
      title: dto.title,
      date: dto.date,
      startAt: dto.startAt,
      endAt: dto.endAt,
      status: isNowOpen ? 'Open' : 'Scheduled',
      isOpen: isNowOpen,
      location: dto.location,
      notes: dto.notes,
      totalEligibleUsers: eligibleUsers.length,
      totalAttendees: 0,
      totalAbsentees: 0,
      attendancePercentage: 0,
      qrToken: generateDemoQrToken('SESSION'),
      qrTokenExpiresAtUtc: isNowOpen ? new Date(Date.now() + 3 * 3600 * 1000).toISOString() : undefined,
    };

    days.unshift(newDay);
    mockStorage.saveAttendanceDays(days);

    mockStorage.addAuditLog({
      action: 'إنشاء جلسة حضور',
      targetType: 'AttendanceDay',
      targetId: newDay.id,
      details: `تم إنشاء جلسة «${newDay.title}» لتاريخ ${newDay.date}`,
      performedBy: 'المدير العام (أدمن)',
    });

    return newDay;
  },

  async updateAttendanceDay(id: string, dto: UpdateAttendanceDayDto): Promise<AttendanceDay> {
    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const index = days.findIndex(d => d.id === id);
    if (index === -1) throw new Error('جلسة الحضور غير موجودة');

    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (end <= start) {
      throw new Error('وقت النهاية يجب أن يكون بعد وقت البداية');
    }

    days[index] = {
      ...days[index],
      title: dto.title,
      date: dto.date,
      startAt: dto.startAt,
      endAt: dto.endAt,
      location: dto.location,
      notes: dto.notes,
    };

    mockStorage.saveAttendanceDays(days);
    return days[index];
  },

  async openAttendanceDay(id: string): Promise<AttendanceDay> {
    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === id);
    if (!day) throw new Error('الجلسة غير موجودة');

    day.isOpen = true;
    day.status = 'Open';
    day.qrToken = generateDemoQrToken('LIVE');
    day.qrTokenExpiresAtUtc = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    mockStorage.saveAttendanceDays(days);
    mockStorage.recomputeDayMetrics(id);

    mockStorage.addAuditLog({
      action: 'فتح تسجيل الحضور',
      targetType: 'AttendanceDay',
      targetId: id,
      details: `تم فتح استقبال تسجيل الحضور وتحديث رمز QR لجلسة «${day.title}»`,
      performedBy: 'المدير العام (أدمن)',
    });

    return day;
  },

  async closeAttendanceDay(id: string): Promise<AttendanceDay> {
    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === id);
    if (!day) throw new Error('الجلسة غير موجودة');

    day.isOpen = false;
    day.status = 'Closed';

    mockStorage.saveAttendanceDays(days);
    mockStorage.recomputeDayMetrics(id);

    mockStorage.addAuditLog({
      action: 'إغلاق تسجيل الحضور',
      targetType: 'AttendanceDay',
      targetId: id,
      details: `تم إغلاق استقبال الحضور لجلسة «${day.title}» (لم تُعتمد النتائج النهائية بعد)`,
      performedBy: 'المدير العام (أدمن)',
    });

    return day;
  },

  async finalizeAttendanceDay(id: string): Promise<AttendanceDay> {
    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === id);
    if (!day) throw new Error('الجلسة غير موجودة');

    day.isOpen = false;
    day.status = 'Finalized';
    day.finalizedAtUtc = new Date().toISOString();

    mockStorage.saveAttendanceDays(days);
    const updated = mockStorage.recomputeDayMetrics(id)!;

    mockStorage.addAuditLog({
      action: 'اعتماد نتائج الجلسة نهائيًا',
      targetType: 'AttendanceDay',
      targetId: id,
      details: `تم اعتماد نتائج جلسة «${day.title}» — حاضرين: ${updated.totalAttendees}، غائبين: ${updated.totalAbsentees} (${updated.attendancePercentage}%)`,
      performedBy: 'المدير العام (أدمن)',
    });

    return updated;
  },

  async refreshQrToken(id: string): Promise<string> {
    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === id);
    if (!day) throw new Error('الجلسة غير موجودة');

    const newToken = generateDemoQrToken('REFRESHED');
    day.qrToken = newToken;
    day.qrTokenExpiresAtUtc = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    mockStorage.saveAttendanceDays(days);

    mockStorage.addAuditLog({
      action: 'تجديد رمز QR',
      targetType: 'AttendanceDay',
      targetId: id,
      details: `تم تجديد رمز الاستجابة السريع لجلسة «${day.title}»`,
      performedBy: 'المدير العام (أدمن)',
    });

    return newToken;
  },

  async deleteAttendanceDay(id: string): Promise<void> {
    await simulateNetworkDelay();
    let days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === id);
    if (!day) throw new Error('الجلسة غير موجودة');

    // Remove day
    days = days.filter(d => d.id !== id);
    mockStorage.saveAttendanceDays(days);

    // Remove associated attendances
    let attendances = mockStorage.getAttendances();
    attendances = attendances.filter(a => a.attendanceDayId !== id);
    mockStorage.saveAttendances(attendances);

    mockStorage.addAuditLog({
      action: 'حذف جلسة حضور',
      targetType: 'AttendanceDay',
      targetId: id,
      details: `تم حذف جلسة «${day.title}» وسجلاتها المرتبطة`,
      performedBy: 'المدير العام (أدمن)',
    });
  },
};
