import { AttendanceUserItemDto } from '../../../types/api';
import { AttendanceMethod, Attendance, UserStatus, UserRole } from '../../../types/common';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import {
  supabase,
  isSupabaseEnabled,
  mapDbUser,
  mapDbAttendance,
  mapDbAttendanceDay,
  insertSupabaseAuditLog,
} from '../../../lib/supabase';

export const attendanceService = {
  async getAttendeesForDay(dayId: string, search = ''): Promise<AttendanceUserItemDto[]> {
    if (isSupabaseEnabled()) {
      const [{ data: attData, error: attErr }, { data: usrData, error: usrErr }] = await Promise.all([
        supabase.from('attendances').select('*').eq('attendance_day_id', dayId),
        supabase.from('users').select('*').eq('is_deleted', false),
      ]);

      if (attErr) throw new Error(attErr.message);
      if (usrErr) throw new Error(usrErr.message);

      const users = (usrData || []).map(r => mapDbUser(r as Record<string, unknown>));
      const attendances = (attData || []).map(r => mapDbAttendance(r as Record<string, unknown>));

      const result: AttendanceUserItemDto[] = [];

      for (const record of attendances) {
        const user = users.find(u => u.id === record.userId);
        if (!user) continue;

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          if (
            !user.name.toLowerCase().includes(q) &&
            !user.phoneNumber.includes(q) &&
            !(user.university && user.university.toLowerCase().includes(q))
          ) {
            continue;
          }
        }

        result.push({
          userId: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          gender: user.gender,
          levelName: user.levelName,
          university: user.university,
          studyYear: user.studyYear,
          isAttended: true,
          isExcused: record.isExcused,
          markedAtUtc: record.markedAtUtc,
          method: record.method,
        });
      }

      result.sort((a, b) => {
        const tA = a.markedAtUtc ? new Date(a.markedAtUtc).getTime() : 0;
        const tB = b.markedAtUtc ? new Date(b.markedAtUtc).getTime() : 0;
        return tB - tA;
      });

      return result;
    }

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
        university: user.university,
        studyYear: user.studyYear,
        isAttended: true,
        isExcused: record.isExcused,
        markedAtUtc: record.markedAtUtc,
        method: record.method,
      });
    }

    result.sort((a, b) => {
      const tA = a.markedAtUtc ? new Date(a.markedAtUtc).getTime() : 0;
      const tB = b.markedAtUtc ? new Date(b.markedAtUtc).getTime() : 0;
      return tB - tA;
    });

    return result;
  },

  async getAbsenteesForDay(dayId: string, search = ''): Promise<AttendanceUserItemDto[]> {
    if (isSupabaseEnabled()) {
      const [{ data: dayData }, { data: usrData, error: usrErr }, { data: attData, error: attErr }] =
        await Promise.all([
          supabase.from('attendance_days').select('id').eq('id', dayId).maybeSingle(),
          supabase
            .from('users')
            .select('*')
            .eq('is_deleted', false)
            .eq('status', UserStatus.Active)
            .eq('role', UserRole.User),
          supabase.from('attendances').select('user_id').eq('attendance_day_id', dayId),
        ]);

      if (!dayData) return [];
      if (usrErr) throw new Error(usrErr.message);
      if (attErr) throw new Error(attErr.message);

      const eligibleUsers = (usrData || []).map(r => mapDbUser(r as Record<string, unknown>));
      const attendedUserIds = new Set((attData || []).map(a => String((a as Record<string, unknown>).user_id)));

      let absentees = eligibleUsers.filter(u => !attendedUserIds.has(u.id));

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        absentees = absentees.filter(
          u =>
            u.name.toLowerCase().includes(q) ||
            u.phoneNumber.includes(q) ||
            (u.levelName && u.levelName.toLowerCase().includes(q)) ||
            (u.university && u.university.toLowerCase().includes(q))
        );
      }

      return absentees.map(u => ({
        userId: u.id,
        name: u.name,
        phoneNumber: u.phoneNumber,
        gender: u.gender,
        levelName: u.levelName,
        university: u.university,
        studyYear: u.studyYear,
        isAttended: false,
        markedAtUtc: null,
        method: null,
      }));
    }

    await simulateNetworkDelay();
    const day = mockStorage.getAttendanceDays().find(d => d.id === dayId);
    if (!day) return [];

    const eligibleUsers = mockStorage.getEligibleActiveUsers();
    const attendances = mockStorage.getAttendances().filter(a => a.attendanceDayId === dayId);
    const attendedUserIds = new Set(attendances.map(a => a.userId));

    let absentees = eligibleUsers.filter(u => !attendedUserIds.has(u.id));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      absentees = absentees.filter(
        u =>
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
      university: u.university,
      studyYear: u.studyYear,
      isAttended: false,
      markedAtUtc: null,
      method: null,
    }));
  },

  async markManualAttendance(
    dayId: string,
    userId: string,
    notes?: string,
    isExcused = false
  ): Promise<Attendance> {
    if (isSupabaseEnabled()) {
      const [{ data: dayRow }, { data: userRow }, { data: existingAtt }] = await Promise.all([
        supabase.from('attendance_days').select('*').eq('id', dayId).maybeSingle(),
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('attendances')
          .select('id')
          .eq('attendance_day_id', dayId)
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      if (!dayRow) throw new Error('جلسة الحضور غير موجودة');
      if (!userRow) throw new Error('العضو غير موجود');

      const day = mapDbAttendanceDay(dayRow as Record<string, unknown>);
      const user = mapDbUser(userRow as Record<string, unknown>);

      if (user.status !== UserStatus.Active || user.isDeleted) {
        throw new Error('لا يمكن تسجيل حضور لعضو غير نشط أو معلق');
      }

      if (existingAtt) {
        throw new Error('تم تسجيل حضور هذا العضو مسبقًا في هذه الجلسة');
      }

      const id = `at-${Date.now()}`;
      const method = isExcused ? AttendanceMethod.Excused : AttendanceMethod.Manual;
      const pointsAwarded = isExcused ? 0 : day.pointsReward ?? 10;

      const { data: insertedRow, error } = await supabase
        .from('attendances')
        .insert({
          id,
          user_id: userId,
          attendance_day_id: dayId,
          marked_at_utc: new Date().toISOString(),
          method,
          is_excused: isExcused,
          points_awarded: pointsAwarded,
          notes: notes || (isExcused ? 'غياب بعذر مقبول' : 'تسجيل يدوي بواسطة الإدارة'),
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);

      if (pointsAwarded > 0) {
        await supabase
          .from('users')
          .update({ points: (user.points || 0) + pointsAwarded })
          .eq('id', userId);
      }

      await supabase.rpc('recompute_day_metrics', { p_day_id: dayId });

      const created = mapDbAttendance(insertedRow as Record<string, unknown>);

      await insertSupabaseAuditLog({
        action: isExcused ? 'تسجيل غياب بعذر' : 'تسجيل حضور يدوي',
        targetType: 'Attendance',
        targetId: created.id,
        details: `${isExcused ? 'تسجيل عذر' : 'تسجيل حضور يدوي'} للعضو ${user.name} في جلسة «${day.title}» — السبب: ${notes || 'غير محدد'}`,
        performedBy: 'المدير العام (أدمن)',
      });

      return created;
    }

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
      method: isExcused ? AttendanceMethod.Excused : AttendanceMethod.Manual,
      isExcused,
      pointsAwarded: isExcused ? 0 : day.pointsReward ?? 10,
      notes: notes || 'تسجيل يدوي بواسطة الإدارة',
    };

    attendances.push(newAttendance);
    mockStorage.saveAttendances(attendances);
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
    if (isSupabaseEnabled()) {
      const [{ data: targetRow }, { data: userRow }] = await Promise.all([
        supabase
          .from('attendances')
          .select('*')
          .eq('attendance_day_id', dayId)
          .eq('user_id', userId)
          .maybeSingle(),
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      ]);

      if (!targetRow) throw new Error('سجل الحضور غير موجود');
      const target = mapDbAttendance(targetRow as Record<string, unknown>);
      const user = userRow ? mapDbUser(userRow as Record<string, unknown>) : null;

      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('id', target.id);

      if (error) throw new Error(error.message);

      if (user && (target.pointsAwarded || 0) > 0) {
        const nextPoints = Math.max(0, (user.points || 0) - (target.pointsAwarded || 0));
        await supabase.from('users').update({ points: nextPoints }).eq('id', userId);
      }

      await supabase.rpc('recompute_day_metrics', { p_day_id: dayId });

      await insertSupabaseAuditLog({
        action: 'إلغاء تسجيل حضور',
        targetType: 'Attendance',
        targetId: target.id,
        details: `تم إلغاء حضور ${user ? user.name : userId} — السبب: ${reason || 'تصحيح خطأ'}`,
        performedBy: 'المدير العام (أدمن)',
      });
      return;
    }

    await simulateNetworkDelay();
    let attendances = mockStorage.getAttendances();
    const target = attendances.find(a => a.attendanceDayId === dayId && a.userId === userId);
    if (!target) throw new Error('سجل الحضور غير موجود');

    const user = mockStorage.getUsers().find(u => u.id === userId);

    attendances = attendances.filter(a => a.id !== target.id);
    mockStorage.saveAttendances(attendances);
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
