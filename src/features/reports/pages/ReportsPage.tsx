import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  Download, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  AlertTriangle
} from 'lucide-react';
import { PageHeader } from '../../../components/shared/PageHeader';
import { StatCard } from '../../../components/shared/StatCard';
import { AttendanceDayStatusBadge } from '../../../components/shared/StatusBadge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { reportsService, ReportsFilterParams } from '../services/reportsService';
import { CHURCH_LEVELS } from '../../../lib/constants';
import { formatArabicDate } from '../../../lib/date-utils';
import { formatPhoneNumber, exportToCsv } from '../../../lib/formatters';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const [filters, setFilters] = useState<ReportsFilterParams>({
    from: undefined,
    to: undefined,
    sessionTitle: '',
    status: 'all',
    levelId: 'all',
  });

  const [activeTab, setActiveTab] = useState<'sessions' | 'members'>('sessions');

  const { data: report, isLoading } = useQuery({
    queryKey: ['reports-summary', filters],
    queryFn: () => reportsService.getReportsSummary(filters),
  });

  const handleResetFilters = () => {
    setFilters({
      from: undefined,
      to: undefined,
      sessionTitle: '',
      status: 'all',
      levelId: 'all',
    });
  };

  const handleExportSessionsCsv = () => {
    if (!report || report.sessions.length === 0) return;
    const headers = ['اسم الاجتماع', 'التاريخ', 'المكان', 'الحالة', 'الأعضاء المؤهلون', 'الحاضرون', 'الغياب المؤكد', 'نسبة الحضور'];
    const rows = report.sessions.map(s => [
      s.title,
      s.date,
      s.location,
      s.status,
      s.totalEligibleUsers,
      s.totalAttendees,
      s.totalAbsentees,
      `${s.attendancePercentage}%`,
    ]);
    exportToCsv('تقرير_جلسات_الحضور_المصفاة', headers, rows);
    toast.success('تم تصدير تقرير الجلسات المصفى بنجاح بصيغة CSV');
  };

  const handleExportMembersCsv = () => {
    if (!report || report.memberReports.length === 0) return;
    const headers = ['اسم العضو', 'رقم الهاتف', 'المرحلة', 'أب الاعتراف', 'الجلسات المعتمدة', 'مرات الحضور', 'مرات الغياب', 'نسبة الحضور', 'حالة المتابعة'];
    const rows = report.memberReports.map(m => [
      m.name,
      m.phoneNumber,
      m.levelName || 'عام',
      m.confessionFather || '—',
      m.totalFinalizedSessions,
      m.attendedSessions,
      m.absentSessions,
      `${m.attendanceRate}%`,
      m.needsReview ? 'بحاجة لمتابعة رعوية' : 'منتظم',
    ]);
    exportToCsv('تقرير_حضور_الأعضاء_والمتابعة_الرعوية', headers, rows);
    toast.success('تم تصدير تقرير متابعة الأعضاء بصيغة CSV بنجاح');
  };

  const membersNeedingReview = report?.memberReports.filter(m => m.needsReview) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="تقارير الحضور والتحليلات الرعوية"
        description="مراجعة شاملة لنسب الحضور، تقييم انتظام المخدومين، وتحديد من يحتاجون إلى متابعة وافتقاد"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={activeTab === 'sessions' ? handleExportSessionsCsv : handleExportMembersCsv}
              className="gap-1.5 text-xs h-10 border-[#30333E] hover:border-[#695CFF]/60"
            >
              <Download className="h-4 w-4 text-[#27CFA5]" />
              <span>تصدير البيانات المصفاة CSV</span>
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#17191F] border border-[#30333E] space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#A5A8B5] mb-1">
          <Filter className="h-3.5 w-3.5" />
          <span>تصفية ومعايير التقرير:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* From Date */}
          <div>
            <label className="block text-[11px] text-[#A5A8B5] mb-1">من تاريخ:</label>
            <Input
              type="date"
              value={filters.from || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value || undefined }))}
              className="h-9 text-xs"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] text-[#A5A8B5] mb-1">إلى تاريخ:</label>
            <Input
              type="date"
              value={filters.to || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value || undefined }))}
              className="h-9 text-xs"
            />
          </div>

          {/* Session Search */}
          <div>
            <label className="block text-[11px] text-[#A5A8B5] mb-1">اسم الجلسة:</label>
            <Input
              placeholder="ابحث بعنوان الاجتماع..."
              value={filters.sessionTitle || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, sessionTitle: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-[11px] text-[#A5A8B5] mb-1">المرحلة الكنسية:</label>
            <Select
              value={filters.levelId}
              onChange={(e) => setFilters(prev => ({ ...prev, levelId: e.target.value }))}
              className="h-9 text-xs"
            >
              <option value="all">جميع المراحل</option>
              {CHURCH_LEVELS.map(lvl => (
                <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
              ))}
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] text-[#A5A8B5] mb-1">حالة الجلسة:</label>
            <Select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="h-9 text-xs"
            >
              <option value="all">جميع الحالات</option>
              <option value="Finalized">مكتملة ومعتمدة فقط</option>
              <option value="Open">مفتوحة للتسجيل</option>
              <option value="Closed">مغلقة</option>
            </Select>
          </div>
        </div>

        {(filters.from || filters.to || filters.sessionTitle || filters.status !== 'all' || filters.levelId !== 'all') && (
          <div className="flex justify-end pt-2 border-t border-[#30333E]/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-[#A5A8B5] hover:text-[#F1F2F7] gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              إعادة ضبط الفلاتر
            </Button>
          </div>
        )}
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          title="الجلسات المعتمدة"
          value={report?.totalFinalizedSessions ?? '—'}
          subtitle="خلال نطاق التقرير"
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="مرات الحضور"
          value={report?.totalAttendances ?? '—'}
          subtitle="مجموع الحاضرين"
          icon={CheckCircle2}
          color="mint"
        />
        <StatCard
          title="الغياب المؤكد"
          value={report?.totalConfirmedAbsences ?? '—'}
          subtitle="مجموع الغائبين"
          icon={XCircle}
          color="coral"
        />
        <StatCard
          title="نسبة الحضور الإجمالية"
          value={report ? `${report.overallAttendanceRate}%` : '—'}
          subtitle="معدل الفترة المختارة"
          icon={Percent}
          color="amber"
        />
        <StatCard
          title="بحاجة لافتقاد ومتابعة"
          value={membersNeedingReview.length}
          subtitle="نسبة حضور أقل من 75%"
          icon={AlertTriangle}
          color="coral"
        />
      </div>

      {/* Report Tabs: Sessions Breakdown vs Members Attendance Analysis */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="mb-4">
          <TabsTrigger value="sessions" badge={report?.sessions.length}>
            تفاصيل جلسات الحضور
          </TabsTrigger>
          <TabsTrigger value="members" badge={membersNeedingReview.length ? `${membersNeedingReview.length} بحاجة لمتابعة` : undefined}>
            متابعة انتظام الأعضاء والافتقاد
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Sessions Details */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">سجل الجلسات المشمولة بالتقرير</CardTitle>
                <CardDescription className="text-xs">
                  أرقام الحضور والغياب المحسوبة بدقة لكل جلسة
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#20232B] text-[#A5A8B5] border-b border-[#30333E] font-semibold">
                    <tr>
                      <th className="px-4 py-3">اسم الاجتماع</th>
                      <th className="px-4 py-3">التاريخ</th>
                      <th className="px-4 py-3">الحالة</th>
                      <th className="px-4 py-3 text-center">المؤهلون</th>
                      <th className="px-4 py-3 text-center">الحاضرون</th>
                      <th className="px-4 py-3 text-center">الغياب</th>
                      <th className="px-4 py-3 text-center">نسبة الحضور</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30333E]/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-[#A5A8B5]">
                          جاري احتساب أرقام التقرير...
                        </td>
                      </tr>
                    ) : !report?.sessions || report.sessions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-[#A5A8B5]">
                          لا توجد جلسات مطابقة لمعايير البحث المحددة
                        </td>
                      </tr>
                    ) : (
                      report.sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-[#20232B]/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-[#F1F2F7]">{s.title}</td>
                          <td className="px-4 py-3 text-[#A5A8B5] whitespace-nowrap">{formatArabicDate(s.date)}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <AttendanceDayStatusBadge status={s.status} isOpen={s.isOpen} />
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-[#A5A8B5]">{s.totalEligibleUsers}</td>
                          <td className="px-4 py-3 text-center font-bold text-[#27CFA5]">{s.totalAttendees}</td>
                          <td className="px-4 py-3 text-center font-bold text-[#E85D75]">
                            {s.status === 'Finalized' ? s.totalAbsentees : '—'}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-[#9D94FF]">
                            {s.status === 'Finalized' || s.totalAttendees > 0 ? `${s.attendancePercentage}%` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Members Pastoral Analysis */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">تحليل انتظام المخدومين ومتابعة الافتقاد</CardTitle>
                <CardDescription className="text-xs">
                  تحديد الأعضاء ذوي نسب الغياب المرتفعة لمساعدة الخدام في الافتقاد والرعاية
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#20232B] text-[#A5A8B5] border-b border-[#30333E] font-semibold">
                    <tr>
                      <th className="px-4 py-3">اسم العضو</th>
                      <th className="px-4 py-3">رقم الهاتف</th>
                      <th className="px-4 py-3">المرحلة</th>
                      <th className="px-4 py-3">أب الاعتراف</th>
                      <th className="px-4 py-3 text-center">حضور</th>
                      <th className="px-4 py-3 text-center">غياب</th>
                      <th className="px-4 py-3 text-center">النسبة</th>
                      <th className="px-4 py-3 text-center">حالة الافتقاد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30333E]/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-[#A5A8B5]">
                          جاري تحليل بيانات المخدومين...
                        </td>
                      </tr>
                    ) : !report?.memberReports || report.memberReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-[#A5A8B5]">
                          لا توجد بيانات حضور معتمدة كافية لإجراء التحليل
                        </td>
                      </tr>
                    ) : (
                      report.memberReports.map((m) => (
                        <tr
                          key={m.userId}
                          className={`hover:bg-[#20232B]/30 transition-colors ${
                            m.needsReview ? 'bg-[#E85D75]/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-bold text-[#F1F2F7]">{m.name}</td>
                          <td className="px-4 py-3 text-[#A5A8B5] font-mono whitespace-nowrap" dir="ltr">
                            {formatPhoneNumber(m.phoneNumber)}
                          </td>
                          <td className="px-4 py-3 text-[#A5A8B5]">{m.levelName || 'عام'}</td>
                          <td className="px-4 py-3 text-[#A5A8B5]">{m.confessionFather || '—'}</td>
                          <td className="px-4 py-3 text-center font-bold text-[#27CFA5]">
                            {m.attendedSessions}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-[#E85D75]">
                            {m.absentSessions}
                          </td>
                          <td className="px-4 py-3 text-center font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-lg ${
                                m.attendanceRate >= 80
                                  ? 'text-[#27CFA5] bg-[#27CFA5]/15'
                                  : m.attendanceRate >= 60
                                  ? 'text-[#DDAA48] bg-[#DDAA48]/15'
                                  : 'text-[#E85D75] bg-[#E85D75]/15'
                              }`}
                            >
                              {m.attendanceRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {m.needsReview ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E85D75]/15 text-[#E85D75] border border-[#E85D75]/30">
                                <AlertTriangle className="h-3 w-3" />
                                يحتاج افتقاد
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#27CFA5]/15 text-[#27CFA5]">
                                منتظم
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
