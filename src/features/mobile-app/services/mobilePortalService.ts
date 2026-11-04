import { HelpRequest, MobileNotification } from '../../../types/common';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import { attendanceService } from '../../attendance-days/services/attendanceService';
import {
  supabase,
  isSupabaseEnabled,
  mapDbHelpRequest,
  mapDbNotification,
  insertSupabaseAuditLog,
} from '../../../lib/supabase';

export interface CreateNotificationDto {
  userId?: string | null;
  title: string;
  body: string;
  type: MobileNotification['type'];
}

export const mobilePortalService = {
  async getHelpRequests(): Promise<HelpRequest[]> {
    if (isSupabaseEnabled()) {
      const [{ data: helpData, error: helpErr }, { data: dayData }] = await Promise.all([
        supabase.from('help_requests').select('*').order('created_at_utc', { ascending: false }),
        supabase.from('attendance_days').select('id, title'),
      ]);

      if (helpErr) throw new Error(helpErr.message);

      const dayTitles = new Map<string, string>();
      for (const d of dayData || []) {
        const row = d as Record<string, unknown>;
        dayTitles.set(String(row.id), String(row.title));
      }

      return (helpData || []).map(r => {
        const row = r as Record<string, unknown>;
        const dayTitle = row.attendance_day_id ? dayTitles.get(String(row.attendance_day_id)) : undefined;
        return mapDbHelpRequest(row, dayTitle);
      });
    }

    await simulateNetworkDelay();
    return mockStorage.getHelpRequests();
  },

  async resolveHelpRequest(id: string, markAttendance = true): Promise<HelpRequest> {
    if (isSupabaseEnabled()) {
      const { data: reqRow, error: reqErr } = await supabase
        .from('help_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (reqErr || !reqRow) throw new Error('طلب المساعدة غير موجود');
      const req = mapDbHelpRequest(reqRow as Record<string, unknown>);

      if (markAttendance && req.userId && req.attendanceDayId) {
        try {
          await attendanceService.markManualAttendance(
            req.attendanceDayId,
            req.userId,
            'تسجيل حضور تلقائي بعد الاستجابة لطلب مساعدة من تطبيق الموبايل'
          );
        } catch {
          void 0;
        }
      }

      const nowIso = new Date().toISOString();
      const { data: updatedRow, error: updErr } = await supabase
        .from('help_requests')
        .update({
          status: 'Resolved',
          resolved_at_utc: nowIso,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updErr) throw new Error(updErr.message);

      if (req.userId) {
        await supabase.from('notifications').insert({
          id: `notif-${Date.now()}`,
          user_id: req.userId,
          title: 'تمت الاستجابة لطلب المساعدة',
          body: markAttendance
            ? 'قام خادم النظام بمراجعة طلبك وتسجيل حضورك في الاجتماع بنجاح.'
            : 'تمت مراجعة طلب المساعدة الخاص بك من خادم النظام بالقاعة.',
          type: 'attendance',
          is_read: false,
          created_at_utc: nowIso,
        });
      }

      await insertSupabaseAuditLog({
        action: 'حل طلب مساعدة بالقاعة',
        targetType: 'HelpRequest',
        targetId: id,
        details: `تمت الاستجابة لطلب المساعدة للطالب ${req.userName}${markAttendance ? ' مع تسجيل الحضور' : ''}`,
        performedBy: 'المدير العام (أدمن)',
      });

      return mapDbHelpRequest(updatedRow as Record<string, unknown>);
    }

    await simulateNetworkDelay();
    const list = mockStorage.getHelpRequests();
    const target = list.find(h => h.id === id);
    if (!target) throw new Error('طلب المساعدة غير موجود');

    if (markAttendance && target.userId && target.attendanceDayId) {
      try {
        await attendanceService.markManualAttendance(
          target.attendanceDayId,
          target.userId,
          'تسجيل حضور استجابة لطلب مساعدة'
        );
      } catch {
        void 0;
      }
    }

    target.status = 'Resolved';
    target.resolvedAtUtc = new Date().toISOString();
    mockStorage.saveHelpRequests(list);
    return target;
  },

  async dismissHelpRequest(id: string): Promise<HelpRequest> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('help_requests')
        .update({
          status: 'Dismissed',
          resolved_at_utc: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return mapDbHelpRequest(data as Record<string, unknown>);
    }

    await simulateNetworkDelay();
    const list = mockStorage.getHelpRequests();
    const target = list.find(h => h.id === id);
    if (!target) throw new Error('طلب المساعدة غير موجود');
    target.status = 'Dismissed';
    target.resolvedAtUtc = new Date().toISOString();
    mockStorage.saveHelpRequests(list);
    return target;
  },

  async getNotifications(): Promise<MobileNotification[]> {
    if (isSupabaseEnabled()) {
      const [{ data: notifData, error: notifErr }, { data: usrData }] = await Promise.all([
        supabase.from('notifications').select('*').order('created_at_utc', { ascending: false }),
        supabase.from('users').select('id, name'),
      ]);

      if (notifErr) throw new Error(notifErr.message);

      const userNames = new Map<string, string>();
      for (const u of usrData || []) {
        const row = u as Record<string, unknown>;
        userNames.set(String(row.id), String(row.name));
      }

      return (notifData || []).map(r => {
        const row = r as Record<string, unknown>;
        const userName = row.user_id ? userNames.get(String(row.user_id)) : 'جميع الطلاب (إشعار عام)';
        return mapDbNotification(row, userName);
      });
    }

    await simulateNetworkDelay();
    return mockStorage.getNotifications();
  },

  async sendNotification(dto: CreateNotificationDto): Promise<MobileNotification> {
    const nowIso = new Date().toISOString();
    const id = `notif-${Date.now()}`;

    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          id,
          user_id: dto.userId || null,
          title: dto.title,
          body: dto.body,
          type: dto.type || 'general',
          is_read: false,
          created_at_utc: nowIso,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);

      await insertSupabaseAuditLog({
        action: 'إرسال إشعار لتطبيق الموبايل',
        targetType: 'Notification',
        targetId: id,
        details: `إرسال إشعار «${dto.title}» (${dto.userId ? 'لطالب محدد' : 'عام لجميع الطلاب'})`,
        performedBy: 'المدير العام (أدمن)',
      });

      return mapDbNotification(
        data as Record<string, unknown>,
        dto.userId ? 'طالب محدد' : 'جميع الطلاب (إشعار عام)'
      );
    }

    await simulateNetworkDelay();
    const list = mockStorage.getNotifications();
    const created: MobileNotification = {
      id,
      userId: dto.userId || null,
      userName: dto.userId ? 'طالب محدد' : 'جميع الطلاب (إشعار عام)',
      title: dto.title,
      body: dto.body,
      type: dto.type || 'general',
      isRead: false,
      createdAtUtc: nowIso,
    };
    list.unshift(created);
    mockStorage.saveNotifications(list);
    return created;
  },

  async deleteNotification(id: string): Promise<void> {
    if (isSupabaseEnabled()) {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await simulateNetworkDelay();
    const list = mockStorage.getNotifications().filter(n => n.id !== id);
    mockStorage.saveNotifications(list);
  },
};
