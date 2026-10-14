import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { PlusCircle, Sparkles, Users, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  pendingCount?: number;
  onCreateSessionClick: () => void;
  onCreateEventClick: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  pendingCount = 0,
  onCreateSessionClick,
  onCreateEventClick,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'إنشاء جلسة حضور',
      description: 'بدء تسجيل حضور جديد وتوليد رمز QR',
      icon: PlusCircle,
      onClick: onCreateSessionClick,
      color: 'purple',
    },
    {
      title: 'إنشاء فعالية جديدة',
      description: 'تنظيم مؤتمر، قداس خاص أو يوم رياضي',
      icon: Sparkles,
      onClick: onCreateEventClick,
      color: 'amber',
    },
    {
      title: 'إدارة الأعضاء',
      description: 'استعراض وتعديل بيانات المخدومين والمستويات',
      icon: Users,
      onClick: () => navigate('/members'),
      color: 'mint',
    },
    {
      title: 'طلبات العضوية المعلقة',
      description: `مراجعة ${pendingCount} طلب تسجيل جديد بحاجة لموافقة`,
      icon: UserCheck,
      onClick: () => navigate('/members?status=1'),
      color: 'coral',
      badge: pendingCount > 0 ? `${pendingCount} طلب` : undefined,
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-[#695CFF]/10 text-[#695CFF] border-[#695CFF]/20 group-hover:bg-[#695CFF] group-hover:text-white';
      case 'amber':
        return 'bg-[#DDAA48]/10 text-[#DDAA48] border-[#DDAA48]/20 group-hover:bg-[#DDAA48] group-hover:text-[#101116]';
      case 'mint':
        return 'bg-[#27CFA5]/10 text-[#27CFA5] border-[#27CFA5]/20 group-hover:bg-[#27CFA5] group-hover:text-[#101116]';
      case 'coral':
        return 'bg-[#E85D75]/10 text-[#E85D75] border-[#E85D75]/20 group-hover:bg-[#E85D75] group-hover:text-white';
      default:
        return 'bg-[#20232B] text-[#A5A8B5]';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#A5A8B5]">إجراءات سريعة</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <Card
              key={i}
              onClick={act.onClick}
              className="cursor-pointer group hover:border-[#695CFF]/50 hover:bg-[#17191F]/90 transition-all duration-200"
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${getColorClasses(
                    act.color
                  )}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-bold text-[#F1F2F7] group-hover:text-[#695CFF] transition-colors truncate">
                      {act.title}
                    </span>
                    {act.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E85D75]/20 text-[#E85D75] border border-[#E85D75]/30">
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A5A8B5] mt-1 line-clamp-1">{act.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
