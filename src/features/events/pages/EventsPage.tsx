import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Link as LinkIcon, 
  Trash2, 
  LayoutGrid, 
  List
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { EventStatusBadge } from '../../../components/shared/StatusBadge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { CreateEventDialog } from '../components/CreateEventDialog';
import { eventsService } from '../services/eventsService';
import { SpecialEvent, EventStatus } from '../../../types/common';
import { formatArabicDate, formatArabicTime } from '../../../lib/date-utils';
import { toast } from 'sonner';

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEventToDelete, setSelectedEventToDelete] = useState<SpecialEvent | null>(null);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsService.getEvents(),
  });

  const handleToggleStatus = async (evt: SpecialEvent) => {
    const nextStatus: EventStatus = evt.status === 'Published' ? 'Draft' : 'Published';
    try {
      await eventsService.updateEventStatus(evt.id, nextStatus);
      toast.success(
        nextStatus === 'Published'
          ? `تم نشر الفعالية «${evt.title}» لتظهر في تطبيق المخدومين`
          : `تم تحويل الفعالية «${evt.title}» إلى مسودة`
      );
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تعديل حالة الفعالية');
    }
  };

  const handleDelete = async () => {
    if (!selectedEventToDelete) return;
    try {
      await eventsService.deleteEvent(selectedEventToDelete.id);
      toast.success(`تم حذف الفعالية «${selectedEventToDelete.title}»`);
      setSelectedEventToDelete(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حذف الفعالية');
    }
  };

  const getTimingStatus = (startAt: string, endAt?: string) => {
    const now = new Date().getTime();
    const start = new Date(startAt).getTime();
    const end = endAt ? new Date(endAt).getTime() : start + 4 * 3600 * 1000;

    if (now < start) {
      return { label: 'فعالية قادمة', color: 'text-[#695CFF] bg-[#695CFF]/15 border-[#695CFF]/30' };
    }
    if (now >= start && now <= end) {
      return { label: 'جارية الآن', color: 'text-[#27CFA5] bg-[#27CFA5]/15 border-[#27CFA5]/30' };
    }
    return { label: 'منتهية', color: 'text-[#A5A8B5] bg-[#20232B] border-[#30333E]' };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الفعاليات والمناسبات الكنسية"
        description="تنظيم المؤتمرات، النهضات الروحية، الأيام الرياضية واللقاءات الاستثنائية وربطها بجلسات الحضور"
        action={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-xl border border-[#30333E] bg-[#17191F] p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#20232B] text-white shadow-sm' : 'text-[#A5A8B5] hover:text-white'
                }`}
                title="عرض شبكي"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#20232B] text-white shadow-sm' : 'text-[#A5A8B5] hover:text-white'
                }`}
                title="عرض جدولي"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 shadow-md shadow-[#695CFF]/20">
              <Plus className="h-4 w-4" />
              <span>إضافة فعالية جديدة</span>
            </Button>
          </div>
        }
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#17191F] border border-[#30333E] animate-pulse p-6" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#30333E] bg-[#17191F]/50">
          <Sparkles className="h-10 w-10 text-[#A5A8B5] mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[#F1F2F7]">لا توجد فعاليات مسجلة</h3>
          <p className="text-xs text-[#A5A8B5] mt-1">ابدأ بإضافة مؤتمر روحي أو فعالية كنسية جديدة</p>
          <Button onClick={() => setCreateDialogOpen(true)} className="mt-4" size="sm">
            إضافة فعالية
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => {
            const timing = getTimingStatus(evt.startAt, evt.endAt);
            return (
              <Card
                key={evt.id}
                className="overflow-hidden hover:border-[#454958] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {evt.imageUrl && (
                    <div className="h-40 w-full overflow-hidden relative">
                      <img
                        src={evt.imageUrl}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#17191F] to-transparent" />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${timing.color}`}>
                          {timing.label}
                        </span>
                        <EventStatusBadge status={evt.status} />
                      </div>
                    </div>
                  )}

                  <CardContent className={evt.imageUrl ? 'p-5 pt-2' : 'p-5'}>
                    {!evt.imageUrl && (
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${timing.color}`}>
                          {timing.label}
                        </span>
                        <EventStatusBadge status={evt.status} />
                      </div>
                    )}

                    <h3 className="text-base font-bold text-[#F1F2F7] leading-snug">
                      {evt.title}
                    </h3>

                    {evt.description && (
                      <p className="text-xs text-[#A5A8B5] mt-2 line-clamp-3 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-2 text-xs text-[#A5A8B5] border-t border-[#30333E]/60 pt-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-[#695CFF]" />
                        <span>{formatArabicDate(evt.startAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#695CFF]" />
                        <span>
                          {formatArabicTime(evt.startAt)}
                          {evt.endAt ? ` - ${formatArabicTime(evt.endAt)}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#DDAA48]" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>

                    {evt.linkedAttendanceDayId && (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#695CFF]/10 border border-[#695CFF]/25 flex items-center justify-between text-xs text-[#9D94FF]">
                        <span className="flex items-center gap-1.5 font-medium">
                          <LinkIcon className="h-3.5 w-3.5" />
                          مرتبطة بجلسة حضور
                        </span>
                        <button
                          onClick={() => navigate(`/attendance-days/${evt.linkedAttendanceDayId}`)}
                          className="text-[11px] font-bold underline hover:text-white"
                        >
                          عرض الجلسة
                        </button>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 border-t border-[#30333E]/60 bg-[#20232B]/30 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(evt)}
                    className="text-xs h-8"
                  >
                    {evt.status === 'Published' ? 'تحويل لمسودة' : 'نشر الفعالية'}
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="iconSm"
                      variant="ghost"
                      className="text-[#E85D75] hover:bg-[#E85D75]/10"
                      onClick={() => setSelectedEventToDelete(evt)}
                      title="حذف الفعالية"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl border border-[#30333E] bg-[#17191F]">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#20232B] text-[#A5A8B5] border-b border-[#30333E] font-semibold">
              <tr>
                <th className="px-4 py-3">عنوان الفعالية</th>
                <th className="px-4 py-3">التاريخ والتوقيت</th>
                <th className="px-4 py-3">المكان</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">جلسة الحضور</th>
                <th className="px-4 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30333E]/50">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#20232B]/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-[#F1F2F7]">
                    {evt.title}
                  </td>
                  <td className="px-4 py-3 text-[#A5A8B5] whitespace-nowrap">
                    {formatArabicDate(evt.startAt)} ({formatArabicTime(evt.startAt)})
                  </td>
                  <td className="px-4 py-3 text-[#A5A8B5]">{evt.location}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EventStatusBadge status={evt.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {evt.linkedAttendanceDayId ? (
                      <button
                        onClick={() => navigate(`/attendance-days/${evt.linkedAttendanceDayId}`)}
                        className="text-xs text-[#9D94FF] hover:underline flex items-center gap-1"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span>جلسة مرتبطة</span>
                      </button>
                    ) : (
                      <span className="text-[#6C7080]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(evt)}
                        className="h-7 text-xs"
                      >
                        {evt.status === 'Published' ? 'مسودة' : 'نشر'}
                      </Button>
                      <Button
                        size="iconSm"
                        variant="ghost"
                        className="text-[#E85D75] hover:bg-[#E85D75]/10"
                        onClick={() => setSelectedEventToDelete(evt)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* Confirm Delete Event Dialog */}
      <ConfirmDialog
        open={!!selectedEventToDelete}
        onOpenChange={(open) => !open && setSelectedEventToDelete(null)}
        title="حذف الفعالية"
        description={`هل أنت متأكد من حذف الفعالية «${selectedEventToDelete?.title}»؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
