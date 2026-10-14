import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarPlus, 
  Search, 
  Eye, 
  Play, 
  Square, 
  CheckCheck, 
  Trash2, 
  QrCode,
  MapPin,
  Clock
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { DataTable, Column } from '../../../components/shared/DataTable';
import { AttendanceDayStatusBadge } from '../../../components/shared/StatusBadge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { CreateAttendanceDayDialog } from '../components/CreateAttendanceDayDialog';
import { attendanceDaysService } from '../services/attendanceDaysService';
import { AttendanceDay, AttendanceDayStatus } from '../../../types/common';
import { formatArabicDate, formatArabicTime } from '../../../lib/date-utils';
import { toast } from 'sonner';

export const AttendanceDaysPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceDayStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmCloseDay, setConfirmCloseDay] = useState<AttendanceDay | null>(null);
  const [confirmFinalizeDay, setConfirmFinalizeDay] = useState<AttendanceDay | null>(null);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<AttendanceDay | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attendance-days', page, pageSize, search, statusFilter],
    queryFn: () =>
      attendanceDaysService.getAttendanceDays({
        page,
        pageSize,
        search,
        status: statusFilter,
      }),
  });

  const handleOpenSession = async (day: AttendanceDay) => {
    try {
      await attendanceDaysService.openAttendanceDay(day.id);
      toast.success(`تم فتح استقبال تسجيل الحضور لجلسة «${day.title}»`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء فتح الجلسة');
    }
  };

  const handleCloseSession = async () => {
    if (!confirmCloseDay) return;
    try {
      await attendanceDaysService.closeAttendanceDay(confirmCloseDay.id);
      toast.success(`تم إغلاق تسجيل الحضور لجلسة «${confirmCloseDay.title}»`);
      setConfirmCloseDay(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إغلاق الجلسة');
    }
  };

  const handleFinalizeSession = async () => {
    if (!confirmFinalizeDay) return;
    try {
      await attendanceDaysService.finalizeAttendanceDay(confirmFinalizeDay.id);
      toast.success(`تم اعتماد النتائج واحتساب الغياب النهائي بنجاح`);
      setConfirmFinalizeDay(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء اعتماد الجلسة');
    }
  };

  const handleDeleteSession = async () => {
    if (!confirmDeleteDay) return;
    try {
      await attendanceDaysService.deleteAttendanceDay(confirmDeleteDay.id);
      toast.success(`تم حذف الجلسة وسجلاتها بنجاح`);
      setConfirmDeleteDay(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حذف الجلسة');
    }
  };

  const columns: Column<AttendanceDay>[] = [
    {
      header: 'اسم الاجتماع / الخدمة',
      cell: (day) => (
        <div className="flex flex-col min-w-[200px]">
          <span className="font-bold text-[#F1F2F7] hover:text-[#695CFF] cursor-pointer transition-colors"
                onClick={() => navigate(`/attendance-days/${day.id}`)}>
            {day.title}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-[#A5A8B5] mt-1">
            <MapPin className="h-3 w-3 text-[#DDAA48]" />
            <span className="truncate">{day.location}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'التاريخ',
      cell: (day) => (
        <span className="text-xs text-[#F1F2F7] whitespace-nowrap">
          {formatArabicDate(day.date)}
        </span>
      ),
    },
    {
      header: 'التوقيت',
      cell: (day) => (
        <div className="flex items-center gap-1 text-xs text-[#A5A8B5] whitespace-nowrap">
          <Clock className="h-3 w-3 text-[#695CFF]" />
          <span>{formatArabicTime(day.startAt)} - {formatArabicTime(day.endAt)}</span>
        </div>
      ),
    },
    {
      header: 'حالة الجلسة',
      cell: (day) => (
        <AttendanceDayStatusBadge status={day.status} isOpen={day.isOpen} />
      ),
    },
    {
      header: 'الحاضرون',
      cell: (day) => (
        <span className="text-xs font-bold text-[#27CFA5]">
          {day.totalAttendees} <span className="text-[10px] font-normal text-[#A5A8B5]">عضو</span>
        </span>
      ),
    },
    {
      header: 'الغياب المؤكد',
      cell: (day) => (
        <span className="text-xs font-bold text-[#E85D75]">
          {day.status === 'Finalized' ? `${day.totalAbsentees} عضو` : '—'}
        </span>
      ),
    },
    {
      header: 'نسبة الحضور',
      cell: (day) => (
        <span className="text-xs font-semibold text-[#9D94FF]">
          {day.status === 'Finalized' || day.totalAttendees > 0
            ? `${day.attendancePercentage}%`
            : '—'}
        </span>
      ),
    },
    {
      header: 'الإجراءات',
      className: 'text-left',
      cell: (day) => (
        <div className="flex items-center justify-end gap-1">
          {/* View / QR details */}
          <Button
            size="iconSm"
            variant="outline"
            className="text-[#9D94FF] border-[#695CFF]/30 hover:bg-[#695CFF]/10"
            onClick={() => navigate(`/attendance-days/${day.id}`)}
            title="شاشة QR وإدارة الحضور"
          >
            <QrCode className="h-3.5 w-3.5" />
          </Button>

          {/* Open session toggle */}
          {!day.isOpen && day.status !== 'Finalized' && (
            <Button
              size="iconSm"
              variant="ghost"
              className="text-[#27CFA5] hover:bg-[#27CFA5]/10"
              onClick={() => handleOpenSession(day)}
              title="فتح تسجيل الحضور"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Close session toggle */}
          {day.isOpen && (
            <Button
              size="iconSm"
              variant="ghost"
              className="text-[#DDAA48] hover:bg-[#DDAA48]/10"
              onClick={() => setConfirmCloseDay(day)}
              title="إغلاق استقبال الحضور"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Finalize session */}
          {day.status === 'Closed' && (
            <Button
              size="iconSm"
              variant="ghost"
              className="text-[#9D94FF] hover:bg-[#695CFF]/10"
              onClick={() => setConfirmFinalizeDay(day)}
              title="اعتماد النتائج النهائية واحتساب الغياب"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="iconSm"
            variant="ghost"
            onClick={() => navigate(`/attendance-days/${day.id}`)}
            title="التفاصيل"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="iconSm"
            variant="ghost"
            className="text-[#E85D75] hover:bg-[#E85D75]/10"
            onClick={() => setConfirmDeleteDay(day)}
            title="حذف الجلسة"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="جلسات واجتماعات الحضور"
        description="إدارة جلسات الحضور الكنسي، توليد رموز QR، ومتابعة فتح وإغلاق التسجيل واعتماد النتائج"
        action={
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 shadow-md shadow-[#695CFF]/20">
            <CalendarPlus className="h-4 w-4" />
            <span>إنشاء جلسة حضور</span>
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#17191F] border border-[#30333E] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="بحث باسم الاجتماع أو المكان..."
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-full sm:w-60">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="all">جميع الحالات</option>
            <option value="Open">مفتوحة لتسجيل الحضور</option>
            <option value="Closed">مغلقة أمام التسجيل</option>
            <option value="Finalized">مكتملة ومعتمدة</option>
            <option value="Scheduled">مجدولة</option>
          </Select>
        </div>
      </div>

      {/* Sessions DataTable */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        emptyTitle="لا توجد جلسات حضور مسجلة"
        emptyDescription="قم بإنشاء جلسة حضور جديدة لبدء تسجيل الحضور وتوليد رمز QR"
        page={page}
        pageSize={pageSize}
        totalPages={data?.totalPages || 1}
        totalCount={data?.totalCount}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Create Dialog */}
      <CreateAttendanceDayDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* Confirm Close Session Dialog */}
      <ConfirmDialog
        open={!!confirmCloseDay}
        onOpenChange={(open) => !open && setConfirmCloseDay(null)}
        title="إغلاق استقبال الحضور"
        description={`هل أنت متأكد من رغبتك في إغلاق استقبال التسجيل لجلسة «${confirmCloseDay?.title}»؟ لن يتمكن المخدومون من مسح رمز QR بعد الإغلاق.`}
        confirmText="إغلاق التسجيل"
        cancelText="تراجع"
        variant="amber"
        onConfirm={handleCloseSession}
      />

      {/* Confirm Finalize Session Dialog */}
      <ConfirmDialog
        open={!!confirmFinalizeDay}
        onOpenChange={(open) => !open && setConfirmFinalizeDay(null)}
        title="اعتماد نتائج الجلسة نهائيًا"
        description={`عند اعتماد الجلسة، سيتم احتساب الغياب المؤكد لجميع الأعضاء النشطين الذين لم يسجلوا حضورهم، وحساب النسبة النهائية للجلسة.`}
        confirmText="اعتماد النتائج"
        cancelText="تراجع"
        variant="default"
        onConfirm={handleFinalizeSession}
      />

      {/* Confirm Delete Session Dialog */}
      <ConfirmDialog
        open={!!confirmDeleteDay}
        onOpenChange={(open) => !open && setConfirmDeleteDay(null)}
        title="حذف جلسة الحضور"
        description={`هل أنت متأكد من رغبتك في حذف جلسة «${confirmDeleteDay?.title}»؟ سيؤدي ذلك إلى حذف جميع سجلات الحضور المرتبطة بها.`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        variant="destructive"
        onConfirm={handleDeleteSession}
      />
    </div>
  );
};
