import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowRight, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  Search, 
  Download, 
  UserCheck, 
  MapPin, 
  Clock, 
  Calendar,
  CheckCheck,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { attendanceDaysService } from '../services/attendanceDaysService';
import { attendanceService } from '../services/attendanceService';
import { AttendanceDayStatusBadge, AttendanceMethodBadge } from '../../../components/shared/StatusBadge';
import { StatCard } from '../../../components/shared/StatCard';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { DataTable, Column } from '../../../components/shared/DataTable';
import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';
import { QrCodePanel } from '../components/QrCodePanel';
import { ManualAttendanceModal } from '../components/ManualAttendanceModal';
import { AttendanceUserItemDto } from '../../../types/api';
import { formatArabicDate, formatArabicTime, formatArabicDateTime } from '../../../lib/date-utils';
import { formatPhoneNumber, exportToCsv } from '../../../lib/formatters';
import { toast } from 'sonner';

export const AttendanceDayDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'attendees' | 'absentees'>('attendees');
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [absenteeSearch, setAbsenteeSearch] = useState('');
  const [attendeePage, setAttendeePage] = useState(1);
  const [absenteePage, setAbsenteePage] = useState(1);

  // Modals
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [userToRemoveAttendance, setUserToRemoveAttendance] = useState<AttendanceUserItemDto | null>(null);

  // Queries
  const { data: day, isLoading: isDayLoading, refetch: refetchDay } = useQuery({
    queryKey: ['attendance-day', id],
    queryFn: () => (id ? attendanceDaysService.getAttendanceDayById(id) : null),
    enabled: !!id,
  });

  const { data: attendees = [], isLoading: isAttendeesLoading, refetch: refetchAttendees } = useQuery({
    queryKey: ['attendance-attendees', id, attendeeSearch],
    queryFn: () => (id ? attendanceService.getAttendeesForDay(id, attendeeSearch) : []),
    enabled: !!id,
  });

  const { data: absentees = [], isLoading: isAbsenteesLoading, refetch: refetchAbsentees } = useQuery({
    queryKey: ['attendance-absentees', id, absenteeSearch],
    queryFn: () => (id ? attendanceService.getAbsenteesForDay(id, absenteeSearch) : []),
    enabled: !!id,
  });

  const handleRefreshAll = () => {
    refetchDay();
    refetchAttendees();
    refetchAbsentees();
  };

  const handleFinalizeSession = async () => {
    if (!day) return;
    try {
      await attendanceDaysService.finalizeAttendanceDay(day.id);
      toast.success('تم اعتماد نتائج الجلسة واحتساب الغياب النهائي بنجاح');
      handleRefreshAll();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء اعتماد الجلسة');
    }
  };

  const handleRemoveAttendance = async () => {
    if (!day || !userToRemoveAttendance) return;
    try {
      await attendanceService.removeAttendanceRecord(day.id, userToRemoveAttendance.userId);
      toast.success(`تم إلغاء تسجيل حضور ${userToRemoveAttendance.name}`);
      setUserToRemoveAttendance(null);
      handleRefreshAll();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إلغاء الحضور');
    }
  };

  const handleExportAttendeesCsv = () => {
    if (!day || attendees.length === 0) return;
    const headers = ['اسم العضو', 'رقم الهاتف', 'المرحلة', 'وقت التسجيل', 'طريقة التسجيل'];
    const rows = attendees.map(a => [
      a.name,
      a.phoneNumber,
      a.levelName || 'عام',
      formatArabicDateTime(a.markedAtUtc),
      a.method === 1 ? 'رمز QR' : 'يدوي',
    ]);
    exportToCsv(`حاضرو_${day.title}_${day.date}`, headers, rows);
    toast.success('تم تصدير قائمة الحاضرين بصيغة CSV بنجاح');
  };

  const handleExportAbsenteesCsv = () => {
    if (!day || absentees.length === 0) return;
    const headers = ['اسم العضو', 'رقم الهاتف', 'المرحلة'];
    const rows = absentees.map(a => [
      a.name,
      a.phoneNumber,
      a.levelName || 'عام',
    ]);
    exportToCsv(`غائبون_${day.title}_${day.date}`, headers, rows);
    toast.success('تم تصدير قائمة الغائبين بصيغة CSV بنجاح');
  };

  if (isDayLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-[#A5A8B5]">
        جاري تحميل تفاصيل جلسة الحضور...
      </div>
    );
  }

  if (!day) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-[#E85D75]">جلسة الحضور المطلوبة غير موجودة أو تم حذفها</p>
        <Button onClick={() => navigate('/attendance-days')}>
          العودة لجلسات الحضور
        </Button>
      </div>
    );
  }

  // Attendees table columns
  const attendeeColumns: Column<AttendanceUserItemDto>[] = [
    {
      header: 'اسم العضو',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#F1F2F7]">{item.name}</span>
          <span className="text-[11px] text-[#A5A8B5]">{item.levelName || 'عام'}</span>
        </div>
      ),
    },
    {
      header: 'رقم الهاتف',
      cell: (item) => (
        <span dir="ltr" className="text-xs font-mono text-[#A5A8B5]">
          {formatPhoneNumber(item.phoneNumber)}
        </span>
      ),
    },
    {
      header: 'وقت التسجيل',
      cell: (item) => (
        <span className="text-xs text-[#A5A8B5] whitespace-nowrap">
          {formatArabicTime(item.markedAtUtc)}
        </span>
      ),
    },
    {
      header: 'طريقة التسجيل',
      cell: (item) => <AttendanceMethodBadge method={item.method} />,
    },
    {
      header: 'إجراء',
      className: 'text-left',
      cell: (item) => (
        <Button
          size="iconSm"
          variant="ghost"
          className="text-[#E85D75] hover:bg-[#E85D75]/10"
          onClick={() => setUserToRemoveAttendance(item)}
          title="إلغاء تسجيل الحضور"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  // Absentees table columns
  const absenteeColumns: Column<AttendanceUserItemDto>[] = [
    {
      header: 'اسم العضو',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#F1F2F7]">{item.name}</span>
          <span className="text-[11px] text-[#A5A8B5]">{item.levelName || 'عام'}</span>
        </div>
      ),
    },
    {
      header: 'رقم الهاتف',
      cell: (item) => (
        <span dir="ltr" className="text-xs font-mono text-[#A5A8B5]">
          {formatPhoneNumber(item.phoneNumber)}
        </span>
      ),
    },
    {
      header: 'المرحلة',
      cell: (item) => (
        <span className="text-xs text-[#F1F2F7] bg-[#20232B] px-2 py-0.5 rounded-lg border border-[#30333E]">
          {item.levelName || 'عام'}
        </span>
      ),
    },
    {
      header: 'إجراء استثنائي',
      className: 'text-left',
      cell: () => (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs text-[#27CFA5] border-[#27CFA5]/40 hover:bg-[#27CFA5]/10"
          onClick={() => {
            setManualModalOpen(true);
          }}
        >
          <UserCheck className="h-3.5 w-3.5 mr-1" />
          تسجيل حضور
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Session Header */}
      <div className="space-y-3 pb-4 border-b border-[#30333E]/60">
        <button
          onClick={() => navigate('/attendance-days')}
          className="flex items-center gap-1.5 text-xs text-[#A5A8B5] hover:text-[#F1F2F7] transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة لجميع جلسات الحضور</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#F1F2F7]">{day.title}</h1>
              <AttendanceDayStatusBadge status={day.status} isOpen={day.isOpen} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#A5A8B5] mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#695CFF]" />
                {formatArabicDate(day.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#695CFF]" />
                {formatArabicTime(day.startAt)} - {formatArabicTime(day.endAt)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#DDAA48]" />
                {day.location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {day.status === 'Closed' && (
              <Button
                onClick={() => setFinalizeConfirmOpen(true)}
                className="gap-2 bg-[#695CFF] hover:bg-[#7A70FF] text-white shadow-md shadow-[#695CFF]/20"
              >
                <CheckCheck className="h-4 w-4" />
                <span>اعتماد نتائج الجلسة واحتساب الغياب</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setManualModalOpen(true)}
              className="gap-1.5 text-xs text-[#27CFA5] border-[#27CFA5]/40 hover:bg-[#27CFA5]/10"
            >
              <UserCheck className="h-4 w-4" />
              <span>تسجيل يدوي</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="الأعضاء المؤهلون"
          value={day.totalEligibleUsers}
          subtitle="الأعضاء النشطون المسجلون"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="إجمالي الحاضرين"
          value={day.totalAttendees}
          subtitle="تم تسجيل حضورهم بنجاح"
          icon={CheckCircle2}
          color="mint"
        />
        <StatCard
          title="الغياب المؤكد"
          value={day.status === 'Finalized' ? day.totalAbsentees : 'قيد التسجيل'}
          subtitle={day.status === 'Finalized' ? 'تم تأكيد غيابهم' : 'يحسب بعد اعتماد الجلسة'}
          icon={XCircle}
          color="coral"
        />
        <StatCard
          title="نسبة الحضور"
          value={day.status === 'Finalized' || day.totalAttendees > 0 ? `${day.attendancePercentage}%` : '—'}
          subtitle="معدل مشاركة الجلسة"
          icon={Percent}
          color="amber"
        />
      </div>

      {/* Main Grid: QR Code Panel on side + Attendees/Absentees Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* QR Code Panel (5 cols on large screens) */}
        <div className="lg:col-span-5">
          <QrCodePanel day={day} onRefresh={handleRefreshAll} />
        </div>

        {/* Attendance Records & Absentees (7 cols on large screens) */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30333E] pb-3">
              <TabsList>
                <TabsTrigger value="attendees" badge={attendees.length}>
                  الحاضرون
                </TabsTrigger>
                <TabsTrigger value="absentees" badge={absentees.length}>
                  الغائبون ({day.status === 'Finalized' ? 'المؤكد' : 'المحتمل'})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                {activeTab === 'attendees' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportAttendeesCsv}
                    className="text-xs gap-1.5 h-9"
                    disabled={attendees.length === 0}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>تصدير الحاضرين CSV</span>
                  </Button>
                )}
                {activeTab === 'absentees' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportAbsenteesCsv}
                    className="text-xs gap-1.5 h-9"
                    disabled={absentees.length === 0}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>تصدير الغائبين CSV</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Attendees Tab Content */}
            <TabsContent value="attendees" className="space-y-4">
              <div className="w-full sm:w-72">
                <Input
                  placeholder="بحث في الحاضرين بالاسم أو الهاتف..."
                  icon={<Search className="h-4 w-4" />}
                  value={attendeeSearch}
                  onChange={(e) => {
                    setAttendeeSearch(e.target.value);
                    setAttendeePage(1);
                  }}
                />
              </div>

              <DataTable
                columns={attendeeColumns}
                data={attendees}
                isLoading={isAttendeesLoading}
                emptyTitle="لم يسجل أي عضو حضوره حتى الآن"
                emptyDescription="قم بعرض رمز QR بالقاعة أو سجّل حضورًا يدويًا للأعضاء الحاضرين"
                page={attendeePage}
                pageSize={10}
                totalPages={Math.max(1, Math.ceil(attendees.length / 10))}
                totalCount={attendees.length}
                onPageChange={setAttendeePage}
                keyExtractor={(item) => item.userId}
              />
            </TabsContent>

            {/* Absentees Tab Content */}
            <TabsContent value="absentees" className="space-y-4">
              {day.status !== 'Finalized' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#DDAA48]/10 border border-[#DDAA48]/25 text-xs text-[#E6BC64]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    هذه القائمة تضم الأعضاء المؤهلين الذين لم يسجلوا حضورهم حتى اللحظة. لن يُعد الغياب مؤكدًا ورسميًا إلا بعد إغلاق الجلسة واعتمادها نهائيًا.
                  </span>
                </div>
              )}

              <div className="w-full sm:w-72">
                <Input
                  placeholder="بحث في الغائبين بالاسم أو الهاتف..."
                  icon={<Search className="h-4 w-4" />}
                  value={absenteeSearch}
                  onChange={(e) => {
                    setAbsenteeSearch(e.target.value);
                    setAbsenteePage(1);
                  }}
                />
              </div>

              <DataTable
                columns={absenteeColumns}
                data={absentees}
                isLoading={isAbsenteesLoading}
                emptyTitle="لا يوجد غائبون — نسبة الحضور 100%!"
                emptyDescription="جميع الأعضاء المؤهلين قاموا بتسجيل الحضور في هذه الجلسة"
                page={absenteePage}
                pageSize={10}
                totalPages={Math.max(1, Math.ceil(absentees.length / 10))}
                totalCount={absentees.length}
                onPageChange={setAbsenteePage}
                keyExtractor={(item) => item.userId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      <ManualAttendanceModal
        dayId={day.id}
        dayTitle={day.title}
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
        onSuccess={handleRefreshAll}
      />

      {/* Confirm Finalize Session Dialog */}
      <ConfirmDialog
        open={finalizeConfirmOpen}
        onOpenChange={setFinalizeConfirmOpen}
        title="اعتماد نتائج الجلسة واحتساب الغياب النهائي"
        description={`سيتم اعتماد الحضور لـ ${day.totalAttendees} عضو، وتثبيت الغياب المؤكد لـ ${day.totalEligibleUsers - day.totalAttendees} عضو. لن يقبل النظام أي عمليات مسح إضافية بعد الاعتماد.`}
        confirmText="تأكيد واعتماد"
        cancelText="تراجع"
        variant="default"
        onConfirm={handleFinalizeSession}
      />

      {/* Confirm Remove Attendance Dialog */}
      <ConfirmDialog
        open={!!userToRemoveAttendance}
        onOpenChange={(open) => !open && setUserToRemoveAttendance(null)}
        title="إلغاء تسجيل الحضور"
        description={`هل أنت متأكد من إلغاء تسجيل حضور العضو (${userToRemoveAttendance?.name})؟ سيتم حذفه من سجل الحاضرين وإعادته لقائمة الغائبين.`}
        confirmText="إلغاء الحضور"
        cancelText="تراجع"
        variant="destructive"
        onConfirm={handleRemoveAttendance}
      />
    </div>
  );
};
