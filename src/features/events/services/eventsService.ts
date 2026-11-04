import { SpecialEvent, EventStatus } from '../../../types/common';
import { CreateSpecialEventDto } from '../../../types/api';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import { attendanceDaysService } from '../../attendance-days/services/attendanceDaysService';
import {
  supabase,
  isSupabaseEnabled,
  mapDbSpecialEvent,
  insertSupabaseAuditLog,
} from '../../../lib/supabase';

export const eventsService = {
  async getEvents(): Promise<SpecialEvent[]> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('special_events')
        .select('*')
        .order('start_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []).map(r => mapDbSpecialEvent(r as Record<string, unknown>));
    }
    await simulateNetworkDelay();
    const events = mockStorage.getEvents();
    return [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  },

  async getEventById(id: string): Promise<SpecialEvent | null> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('special_events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapDbSpecialEvent(data as Record<string, unknown>) : null;
    }
    await simulateNetworkDelay();
    const evt = mockStorage.getEvents().find(e => e.id === id);
    return evt || null;
  },

  async createEvent(dto: CreateSpecialEventDto): Promise<SpecialEvent> {
    let linkedDayId: string | null = null;

    if (dto.createLinkedAttendanceDay) {
      const createdDay = await attendanceDaysService.createAttendanceDay({
        title: `حضور فعالية: ${dto.title}`,
        date: dto.startAt.split('T')[0],
        startAt: dto.startAt,
        endAt: dto.endAt || new Date(new Date(dto.startAt).getTime() + 3 * 3600 * 1000).toISOString(),
        location: dto.location || 'كنيسة السيدة العذراء مريم',
        notes: `جلسة حضور تم توليدها تلقائيًا للفعالية: ${dto.title}`,
      });
      linkedDayId = createdDay.id;
    }

    if (isSupabaseEnabled()) {
      const id = `evt-${Date.now()}`;
      const { data, error } = await supabase
        .from('special_events')
        .insert({
          id,
          title: dto.title,
          description: dto.description || '',
          start_at: dto.startAt,
          end_at: dto.endAt || null,
          location: dto.location || 'مقر الكنيسة',
          status: dto.status,
          linked_attendance_day_id: linkedDayId,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      const created = mapDbSpecialEvent(data as Record<string, unknown>);

      if (created.status === 'Published') {
        await supabase.from('notifications').insert({
          id: `notif-${Date.now()}`,
          user_id: null,
          title: `فعالية جديدة: ${created.title}`,
          body: `${created.description || created.title} — المكان: ${created.location}`,
          type: 'event',
          is_read: false,
          created_at_utc: new Date().toISOString(),
        });
      }

      await insertSupabaseAuditLog({
        action: 'إنشاء فعالية جديدة',
        targetType: 'Event',
        targetId: created.id,
        details: `تم إنشاء الفعالية «${created.title}» بحالة ${created.status}${linkedDayId ? ' مع ربط جلسة حضور' : ''}`,
        performedBy: 'المدير العام (أدمن)',
      });

      return created;
    }

    await simulateNetworkDelay();
    const events = mockStorage.getEvents();

    const newEvent: SpecialEvent = {
      id: `evt-${Date.now()}`,
      title: dto.title,
      description: dto.description || '',
      startAt: dto.startAt,
      endAt: dto.endAt,
      location: dto.location || 'مقر الكنيسة',
      status: dto.status,
      linkedAttendanceDayId: linkedDayId,
    };

    events.push(newEvent);
    mockStorage.saveEvents(events);

    mockStorage.addAuditLog({
      action: 'إنشاء فعالية جديدة',
      targetType: 'Event',
      targetId: newEvent.id,
      details: `تم إنشاء الفعالية «${newEvent.title}» بحالة ${newEvent.status}${linkedDayId ? ' مع ربط جلسة حضور' : ''}`,
      performedBy: 'المدير العام (أدمن)',
    });

    return newEvent;
  },

  async updateEvent(id: string, dto: Partial<CreateSpecialEventDto>): Promise<SpecialEvent> {
    if (isSupabaseEnabled()) {
      const payload: Record<string, unknown> = {};
      if (dto.title !== undefined) payload.title = dto.title;
      if (dto.description !== undefined) payload.description = dto.description;
      if (dto.startAt !== undefined) payload.start_at = dto.startAt;
      if (dto.endAt !== undefined) payload.end_at = dto.endAt;
      if (dto.location !== undefined) payload.location = dto.location;
      if (dto.status !== undefined) payload.status = dto.status;

      const { data, error } = await supabase
        .from('special_events')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      const updated = mapDbSpecialEvent(data as Record<string, unknown>);

      await insertSupabaseAuditLog({
        action: 'تعديل فعالية',
        targetType: 'Event',
        targetId: id,
        details: `تم تحديث بيانات الفعالية «${updated.title}»`,
        performedBy: 'المدير العام (أدمن)',
      });

      return updated;
    }

    await simulateNetworkDelay();
    const events = mockStorage.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index === -1) throw new Error('الفعالية غير موجودة');

    events[index] = {
      ...events[index],
      ...dto,
    };

    mockStorage.saveEvents(events);

    mockStorage.addAuditLog({
      action: 'تعديل فعالية',
      targetType: 'Event',
      targetId: id,
      details: `تم تحديث بيانات الفعالية «${events[index].title}»`,
      performedBy: 'المدير العام (أدمن)',
    });

    return events[index];
  },

  async updateEventStatus(id: string, status: EventStatus): Promise<SpecialEvent> {
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('special_events')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      const updated = mapDbSpecialEvent(data as Record<string, unknown>);

      await insertSupabaseAuditLog({
        action: 'تغيير حالة فعالية',
        targetType: 'Event',
        targetId: id,
        details: `تم تعديل حالة الفعالية «${updated.title}» إلى ${status}`,
        performedBy: 'المدير العام (أدمن)',
      });

      return updated;
    }

    await simulateNetworkDelay();
    const events = mockStorage.getEvents();
    const evt = events.find(e => e.id === id);
    if (!evt) throw new Error('الفعالية غير موجودة');

    evt.status = status;
    mockStorage.saveEvents(events);

    mockStorage.addAuditLog({
      action: 'تغيير حالة فعالية',
      targetType: 'Event',
      targetId: id,
      details: `تم تعديل حالة الفعالية «${evt.title}» إلى ${status}`,
      performedBy: 'المدير العام (أدمن)',
    });

    return evt;
  },

  async deleteEvent(id: string): Promise<void> {
    if (isSupabaseEnabled()) {
      const existing = await this.getEventById(id);
      if (!existing) throw new Error('الفعالية غير موجودة');

      const { error } = await supabase.from('special_events').delete().eq('id', id);
      if (error) throw new Error(error.message);

      await insertSupabaseAuditLog({
        action: 'حذف فعالية',
        targetType: 'Event',
        targetId: id,
        details: `تم حذف الفعالية «${existing.title}»`,
        performedBy: 'المدير العام (أدمن)',
      });
      return;
    }

    await simulateNetworkDelay();
    let events = mockStorage.getEvents();
    const evt = events.find(e => e.id === id);
    if (!evt) throw new Error('الفعالية غير موجودة');

    events = events.filter(e => e.id !== id);
    mockStorage.saveEvents(events);

    mockStorage.addAuditLog({
      action: 'حذف فعالية',
      targetType: 'Event',
      targetId: id,
      details: `تم حذف الفعالية «${evt.title}»`,
      performedBy: 'المدير العام (أدمن)',
    });
  },
};
