import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  ArrowLeft,
  CalendarCheck,
  History
} from 'lucide-react';
import { StatCard } from '../../../components/shared/StatCard';
import { DateRangeFilter, DateFilterRange } from '../../../components/shared/DateRangeFilter';
import { DashboardCharts } from '../components/DashboardCharts';
import { QuickActions } from '../components/QuickActions';
import { AttendanceDayStatusBadge } from '../../../components/shared/StatusBadge';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { dashboardService } from '../services/dashboardService';
import { formatArabicDateTime } from '../../../lib/date-utils';
import { CreateAttendanceDayDialog } from '../../attendance-days/components/CreateAttendanceDayDialog';
import { CreateEventDialog } from '../../events/components/CreateEventDialog';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Date range state
  const [dateRange, setDateRange] = useState<DateFilterRange>({
    key: '30days',
    label: 'آخر 30 يومًا',
    from: undefined,
    to: undefined,
  });

  // Modal dialog states
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);

  // Queries
  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['dashboard-summary', dateRange.from, dateRange.to],
    queryFn: () => dashboardService.getSummary(dateRange.from, dateRange.to),
  });

  const { data: trendData, isLoading: isTrendLoading, refetch: refetchTrend } = useQuery({
    queryKey: ['dashboard-trend', dateRange.from, dateRange.to],
    queryFn: () => dashboardService.getAttendanceTrend(dateRange.from, dateRange.to),
  });

  const { data: recentDays, isLoading: isRecentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ['dashboard-recent-days'],
    queryFn: () => dashboardService.getRecentAttendanceDays(5),
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['dashboard-audit-logs'],
    queryFn: () => dashboardService.getAuditLogs(5),
  });

  const handleRefreshAll = () => {
    refetchSummary();
    refetchTrend();
    refetchRecent();
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Greeting & Date Filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-[#30333E]/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F1F2F7] tracking-tight">
            صباح الخير، مرحبًا بك في إدارة الحضور
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#A5A8B5]">
            لوحة قياس ومتابعة حضور المخدومين والاجتماعات والفعاليات الكنسية
          </p>
        </div>

        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="الأعضاء النشطون"
          value={summary?.totalUsers ?? '—'}
          subtitle="مؤهلون لتسجيل الحضور"
          icon={Users}
          color="mint"
        />

        <StatCard
          title="طلبات معلقة"
          value={summary?.totalPendingUsers ?? '—'}
          subtitle="بحاجة لموافقة المدير"
          icon={UserCheck}
          color="amber"
        />

        <StatCard
          title="جلسات الفترة"
          value={summary?.totalAttendanceDays ?? '—'}
          subtitle="اجتماعات خلال النطاق"
          icon={Calendar}
          color="purple"
        />

        <StatCard
          title="مرات الحضور"
          value={summary?.totalAttendees ?? '—'}
          subtitle="للجلسات المعتمدة"
          icon={CheckCircle2}
          color="mint"
        />

        <StatCard
          title="الغياب المؤكد"
          value={summary?.totalAbsentees ?? '—'}
          subtitle="للجلسات المعتمدة"
          icon={XCircle}
          color="coral"
        />

        <StatCard
          title="نسبة الحضور"
          value={summary ? `${summary.attendancePercentage}%` : '—'}
          subtitle="معدل المشاركة العام"
          icon={Percent}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions
        pendingCount={summary?.totalPendingUsers}
        onCreateSessionClick={() => setCreateSessionOpen(true)}
        onCreateEventClick={() => setCreateEventOpen(true)}
      />

      {/* Attendance Trend Chart */}
      <DashboardCharts data={trendData || []} isLoading={isTrendLoading} />

      {/* Grid: Recent Sessions Table + Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Sessions (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="hover:border-[#454958] transition-colors h-full flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-[#695CFF]" />
                    أحدث جلسات الحضور
                  </CardTitle>
                  <CardDescription className="text-xs">
                    متابعة حالة الاجتماعات المسجلة ونسب الحضور الأخيرة
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/attendance-days')}
                  className="gap-1 text-xs text-[#9D94FF] hover:text-[#695CFF]"
                >
                  <span>عرض الكل</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#20232B]/60 text-[#A5A8B5] border-b border-[#30333E] font-semibold">
                      <tr>
                        <th className="px-4 py-3">اسم الاجتماع</th>
                        <th className="px-4 py-3">التاريخ والوقت</th>
                        <th className="px-4 py-3">الحالة</th>
                        <th className="px-4 py-3 text-center">حاضر</th>
                        <th className="px-4 py-3 text-center">غائب</th>
                        <th className="px-4 py-3 text-center">النسبة</th>
                        <th className="px-4 py-3 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30333E]/50">
                      {isRecentLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-[#A5A8B5]">
                            جاري تحميل أحدث الجلسات...
                          </td>
                        </tr>
                      ) : !recentDays || recentDays.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-[#A5A8B5]">
                            لا توجد جلسات حضور مسجلة حتى الآن
                          </td>
                        </tr>
                      ) : (
                        recentDays.map((day) => (
                          <tr
                            key={day.id}
                            className="hover:bg-[#20232B]/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-semibold text-[#F1F2F7] max-w-[180px] truncate">
                              {day.title}
                            </td>
                            <td className="px-4 py-3 text-[#A5A8B5] whitespace-nowrap">
                              {formatArabicDateTime(day.startAt)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <AttendanceDayStatusBadge
                                status={day.status}
                                isOpen={day.isOpen}
                              />
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-[#27CFA5]">
                              {day.totalAttendees}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-[#E85D75]">
                              {day.status === 'Finalized' ? day.totalAbsentees : '—'}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-[#9D94FF]">
                              {day.status === 'Finalized' || day.totalAttendees > 0
                                ? `${day.attendancePercentage}%`
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/attendance-days/${day.id}`)}
                                className="h-7 px-2.5 text-[11px]"
                              >
                                التفاصيل
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </div>

            <div className="p-4 border-t border-[#30333E]/60 bg-[#17191F]/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/attendance-days')}
                className="text-xs gap-1.5"
              >
                <span>عرض جميع جلسات الحضور</span>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Activity Audit Log (1 col) */}
        <div>
          <Card className="hover:border-[#454958] transition-colors h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-[#DDAA48]" />
                سجل النشاط الإداري
              </CardTitle>
              <CardDescription className="text-xs">
                آخر الإجراءات المسجلة بالنظام محليًا
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-0">
              {!auditLogs || auditLogs.length === 0 ? (
                <p className="text-xs text-[#A5A8B5] text-center py-6">
                  لا توجد سجلات نشاط حتى الآن
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#20232B]/60 border border-[#30333E]/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[#A5A8B5]">
                      <span className="font-semibold text-[#F1F2F7]">{log.action}</span>
                      <span className="text-[10px] text-[#6C7080]">
                        {formatArabicDateTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-[#A5A8B5] text-[11px] leading-relaxed line-clamp-2">
                      {log.details}
                    </p>
                    <div className="pt-1 text-[10px] text-[#9D94FF]">
                      بواسطة: {log.performedBy}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <CreateAttendanceDayDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        onSuccess={handleRefreshAll}
      />
      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
};
