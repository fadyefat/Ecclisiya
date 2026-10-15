import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { AttendanceTrendItemDto } from '../../../types/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { useTheme } from '../../../lib/theme-context';

interface DashboardChartsProps {
  data: AttendanceTrendItemDto[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="rounded-xl border border-[#30333E] bg-[#17191F] p-3 shadow-xl text-right text-xs space-y-1.5">
        <p className="font-bold text-[#F1F2F7]">{item.title}</p>
        <p className="text-[#A5A8B5]">{label}</p>
        <div className="pt-2 border-t border-[#30333E]/60 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#27CFA5] flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#27CFA5]" />
              الحاضرون:
            </span>
            <span className="font-bold text-[#F1F2F7]">{item.attendees}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#E85D75] flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-[#E85D75]" />
              الغياب المؤكد:
            </span>
            <span className="font-bold text-[#F1F2F7]">{item.absentees}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#30333E]/40">
            <span className="text-[#9D94FF] font-medium">نسبة الحضور:</span>
            <span className="font-bold text-[#F1F2F7]">{item.attendancePercentage}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data, isLoading }) => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  // Exact client design colors in Light Mode, crisp high-contrast in Dark Mode
  const gridStroke = isLight ? '#EEE7E4' : '#30333E';
  const axisStroke = isLight ? '#78686B' : '#6C7080';
  const attendeesColor = isLight ? '#36825C' : '#27CFA5';
  const absenteesColor = isLight ? '#C33636' : '#E85D75';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-[#20232B] animate-pulse rounded-lg" />
          <div className="h-4 w-72 bg-[#20232B] animate-pulse rounded-lg mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full bg-[#20232B]/50 animate-pulse rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>إحصائيات الحضور والغياب</CardTitle>
          <CardDescription>مقارنة أعداد الحاضرين والغائبين للجلسات المكتملة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-xs text-[#A5A8B5] border border-dashed border-[#30333E] rounded-xl">
            لا توجد بيانات جلسات كافية في الفترة المحددة لعرض الرسم البياني
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-[#454958] transition-colors">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base sm:text-lg">إحصائيات الحضور والغياب</CardTitle>
          <CardDescription className="text-xs">
            توزيع أعداد الحضور والغياب ونسب المشاركة عبر الجلسات المعتمدة
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: attendeesColor }}
            />
            <span className="text-[#A5A8B5]">حاضر</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: absenteesColor }}
            />
            <span className="text-[#A5A8B5]">غائب</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.7} vertical={false} />
              <XAxis
                dataKey="date"
                stroke={axisStroke}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
              />
              <YAxis
                stroke={axisStroke}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                formatter={(val) => (
                  <span className="text-[#A5A8B5] mr-1">
                    {val === 'attendees' ? 'الحاضرون' : 'الغياب المؤكد'}
                  </span>
                )}
              />
              <Bar
                dataKey="attendees"
                name="attendees"
                fill={attendeesColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
              <Bar
                dataKey="absentees"
                name="absentees"
                fill={absenteesColor}
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
