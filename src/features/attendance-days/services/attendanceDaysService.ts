import { AttendanceDay, AttendanceDayStatus, PagedResponse } from '../../../types/common';
import { CreateAttendanceDayDto, UpdateAttendanceDayDto } from '../../../types/api';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import {
  supabase,
  isSupabaseEnabled,
  mapDbAttendanceDay,
  insertSupabaseAuditLog,
} from '../../../lib/supabase';

export interface GetAttendanceDaysParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AttendanceDayStatus | 'all';
  from?: string;
  to?: string;
}

function generateDemoQrToken(prefix: string): string {
  const rand = Math.random().toString(36).substring(2, 9).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `ECC-${prefix}-${time}-${rand}`;
}

export const attendanceDaysService = {
  async getAttendanceDays(params: GetAttendanceDaysParams = {}): Promise<PagedResponse<AttendanceDay>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      status,
      from,
      to,
    } = params;

    let days: AttendanceDay[] = [];

    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('attendance_days')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      days = (data || []).map(r => mapDbAttendanceDay(r as Record<string, unknown>));
    } else {
      await simulateNetworkDelay();
      days = mockStorage.getAttendanceDays();
      days = days.map(d => mockStorage.recomputeDayMetrics(d.id) || d);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      days = days.filter(
        d =>
          d.title.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          (d.sessionCode && d.sessionCode.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'all') {
      days = days.filter(d => d.status === status);
    }

    if (from) {
      days = days.filter(d => d.date >= from);
    }
    if (to) {
      days = days.filter(d => d.date <= to);
    }

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
    if (isSupabaseEnabled()) {
      await supabase.rpc('recompute_day_metrics', { p_day_id: id });
      const { data, error } = await supabase
        .from('attendance_days')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapDbAttendanceDay(data as Record<string, unknown>) : null;
    }
    await simulateNetworkDelay();
    const day = mockStorage.recomputeDayMetrics(id);
    return day || null;
  },

  async createAttendanceDay(dto: CreateAttendanceDayDto): Promise<AttendanceDay> {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (end <= start) {
      throw new Error('وقت نهاية الاجتماع يجب أن يكون بعد وقت البداية');
    }

    const isNowOpen = !!dto.isOpen;
    const qrToken = generateDemoQrToken('SESSION');
    const sessionCode = dto.sessionCode || `#${Math.floor(400 + Math.random() * 500)}`;

    if (isSupabaseEnabled()) {
      const id = `att-day-${Date.now()}`;
      const { data, error } = await supabase
        .from('attendance_days')
        .insert({
          id,
          title: dto.title,
          date: dto.date,
          start_at: dto.startAt,
          end_at: dto.endAt,
          status: isNowOpen ? 'Open' : 'Scheduled',
          is_open: isNowOpen,
          location: dto.location,
          notes: dto.notes || null,
          meeting_type: dto.meetingType || 'youth',
          session_code: sessionCode,
          points_reward: dto.pointsReward ?? 10,
          qr_token: qrToken,
          qr_token_expires_at_utc: isNowOpen
            ? new Date(Date.now() + 4 * 3600 * 1000).toISOString()
            : null,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      await supabase.rpc('recompute_day_metrics', { p_day_id: id });

      const { data: refreshed } = await supabase
        .from('attendance_days')
        .select('*')
        .eq('id', id)
        .single();

      const created = mapDbAttendanceDay((refreshed || data) as Record<string, unknown>);

      await insertSupabaseAuditLog({
        action: 'إنشاء جلسة حضور',
        targetType: 'AttendanceDay',
        targetId: created.id,
        details: `تم إنشاء جلسة «${created.title}» (${created.sessionCode}) لتاريخ ${created.date}`,
        performedBy: 'المدير العام (أدمن)',
      });

      return created;
    }

    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const eligibleUsers = mockStorage.getEligibleActiveUsers();

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
      meetingType: dto.meetingType || 'youth',
      sessionCode,
      pointsReward: dto.pointsReward ?? 10,
      totalEligibleUsers: eligibleUsers.length,
      totalAttendees: 0,
      totalAbsentees: 0,
      attendancePercentage: 0,
      qrToken,
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
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (end <= start) {
      throw new Error('وقت النهاية يجب أن يكون بعد وقت البداية');
    }

    if (isSupabaseEnabled()) {
      const updatePayload: Record<string, unknown> = {
        title: dto.title,
        date: dto.date,
        start_at: dto.startAt,
        end_at: dto.endAt,
        location: dto.location,
        notes: dto.notes ?? null,
      };
      if (dto.meetingType) updatePayload.meeting_type = dto.meetingType;
      if (dto.sessionCode) updatePayload.session_code = dto.sessionCode;
      if (dto.pointsReward !== undefined) updatePayload.points_reward = dto.pointsReward;

      const { data, error } = await supabase
        .from('attendance_days')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return mapDbAttendanceDay(data as Record<string, unknown>);
    }

    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const index = days.findIndex(d => d.id === id);
    if (index === -1) throw new Error('جلسة الحضور غير موجودة');

    days[index] = {
      ...days[index],
      title: dto.title,
      date: dto.date,
      startAt: dto.startAt,
      endAt: dto.endAt,
      location: dto.location,
      notes: dto.notes,
      meetingType: dto.meetingType || days[index].meetingType,
      sessionCode: dto.sessionCode || days[index].sessionCode,
      pointsReward: dto.pointsReward !== undefined ? dto.pointsReward : days[index].pointsReward,
    };

    mockStorage.saveAttendanceDays(days);
    return days[index];
  },

  async openAttendanceDay(id: string): Promise<AttendanceDay> {
    const newQrToken = generateDemoQrToken('LIVE');
    const expiresAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    if (isSupabaseEnabled()) {
      const { error } = await supabase
        .from('attendance_days')
        .update({
          is_open: true,
          status: 'Open',
          qr_token: newQrToken,
          qr_token_expires_at_utc: expiresAt,
        })
        .eq('id', id);

      if (error) throw new Error(error.message);

      await supabase.rpc('recompute_day_metrics', { p_day_id: id });
      const updated = await this.getAttendanceDayById(id);
      if (!updated) throw new Error('الجلسة غير موجودة');

      await supabase.from('notifications').insert({
        id: `notif-${Date.now()}`,
        user_id: null,
        title: `فتح باب تسجيل الحضور: ${updated.title}`,
        body: `بدأ الآن استقبال تسجيل الحضور في ${updated.location}. افتح الكاميرا وامسح رمز QR للحصول على +${updated.pointsReward || 10} نقطة.`,
        type: 'attendance',
        is_read: false,
        created_at_utc: new Date().toISOString(),
      });

      await insertSupabaseAuditLog({
        action: 'فتح تسجيل الحضور',
        targetType: 'AttendanceDay',
        targetId: id,
        details: `تم فتح استقبال تسجيل الحضور وتحديث رمز QR لجلسة «${updated.title}»`,
        performedBy: 'المدير العام (أدمن)',
      });

      return updated;
    }

    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === id);
    if (!day) throw new Error('الجلسة غير موجودة');

    day.isOpen = true;
    day.status = 'Open';
    day.qrToken = newQrToken;
    day.qrTokenExpiresAtUtc = expiresAt;

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
    if (isSupabaseEnabled()) {
      const { error } = await supabase
        .from('attendance_days')
        .update({
          is_open: false,
          status: 'Closed',
        })
        .eq('id', id);

      if (error) throw new Error(error.message);
      await supabase.rpc('recompute_day_metrics', { p_day_id: id });
      const updated = await this.getAttendanceDayById(id);
      if (!updated) throw new Error('الجلسة غير موجودة');

      await insertSupabaseAuditLog({
        action: 'إغلاق تسجيل الحضور',
        targetType: 'AttendanceDay',
        targetId: id,
        details: `تم إغلاق استقبال الحضور لجلسة «${updated.title}» (لم تُعتمد النتائج النهائية بعد)`,
        performedBy: 'المدير العام (أدمن)',
      });

      return updated;
    }

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
    if (isSupabaseEnabled()) {
      const { error } = await supabase
        .from('attendance_days')
        .update({
          is_open: false,
          status: 'Finalized',
          finalized_at_utc: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw new Error(error.message);
      await supabase.rpc('recompute_day_metrics', { p_day_id: id });
      const updated = await this.getAttendanceDayById(id);
      if (!updated) throw new Error('الجلسة غير موجودة');

      await insertSupabaseAuditLog({
        action: 'اعتماد نتائج الجلسة نهائيًا',
        targetType: 'AttendanceDay',
        targetId: id,
        details: `تم اعتماد نتائج جلسة «${updated.title}» — حاضرين: ${updated.totalAttendees}، غائبين: ${updated.totalAbsentees} (${updated.attendancePercentage}%)`,
        performedBy: 'المدير العام (أدمن)',
      });

      return updated;
    }

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
    const newToken = generateDemoQrToken('REFRESHED');
    const expiresAt = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

    if (isSupabaseEnabled()) {
      const existing = await this.getAttendanceDayById(id);
      if (!existing) throw new Error('الجلسة غير موجودة');

      const { error } = await supabase
        .from('attendance_days')
        .update({
          qr_token: newToken,
          qr_token_expires_at_utc: expiresAt,
        })
        .eq('id', id);

      if (error) throw new Error(error.message);

      await insertSupabaseAuditLog({
        action: 'تجديد رمز QR',
        targetType: 'AttendanceDay',
        targetId: id,
        details: `تم تجديد رمز الاستجابة السريع لجلسة «${existing.title}»`,
        performedBy: 'المدير العام (أدمن)',
      });

      return newToken;
    }

    await simulateNetworkDelay();
    const days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === id);
    if (!day) throw new Error('الجلسة غير موجودة');

    day.qrToken = newToken;
    day.qrTokenExpiresAtUtc = expiresAt;

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
    if (isSupabaseEnabled()) {
      const existing = await this.getAttendanceDayById(id);
      if (!existing) throw new Error('الجلسة غير موجودة');

      const { error } = await supabase
        .from('attendance_days')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);

      await insertSupabaseAuditLog({
        action: 'حذف جلسة حضور',
        targetType: 'AttendanceDay',
        targetId: id,
        details: `تم حذف جلسة «${existing.title}» وسجلاتها المرتبطة`,
        performedBy: 'المدير العام (أدمن)',
      });
      return;
    }

    await simulateNetworkDelay();
    let days = mockStorage.getAttendanceDays();
    const day = days.find(d => d.id === id);
    if (!day) throw new Error('الجلسة غير موجودة');

    days = days.filter(d => d.id !== id);
    mockStorage.saveAttendanceDays(days);

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
