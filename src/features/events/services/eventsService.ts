import { SpecialEvent, EventStatus } from '../../../types/common';
import { CreateSpecialEventDto } from '../../../types/api';
import { mockStorage } from '../../../mocks/mock-storage';
import { simulateNetworkDelay } from '../../../lib/api/api-config';
import { attendanceDaysService } from '../../attendance-days/services/attendanceDaysService';

export const eventsService = {
  async getEvents(): Promise<SpecialEvent[]> {
    await simulateNetworkDelay();
    const events = mockStorage.getEvents();
    // Sort upcoming first
    return [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  },

  async getEventById(id: string): Promise<SpecialEvent | null> {
    await simulateNetworkDelay();
    const evt = mockStorage.getEvents().find(e => e.id === id);
    return evt || null;
  },

  async createEvent(dto: CreateSpecialEventDto): Promise<SpecialEvent> {
    await simulateNetworkDelay();
    const events = mockStorage.getEvents();

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
