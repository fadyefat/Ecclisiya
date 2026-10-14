import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Sparkles, 
  BarChart3, 
  Settings, 
  Church, 
  ChevronRight, 
  ChevronLeft,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { APP_NAME, APP_SUBTITLE } from '../../lib/constants';
import { settingsService } from '../../features/settings/services/settingsService';
import { toast } from 'sonner';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
  onItemClick?: () => void; // For mobile drawer close
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  className = '',
  onItemClick,
}) => {
  const location = useLocation();

  const navItems = [
    {
      to: '/dashboard',
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      to: '/members',
      label: 'الأعضاء',
      icon: Users,
      badge: '3 معلق',
    },
    {
      to: '/attendance-days',
      label: 'جلسات الحضور',
      icon: CalendarCheck,
      badge: 'مفتوح',
    },
    {
      to: '/events',
      label: 'الفعاليات',
      icon: Sparkles,
      badge: undefined,
    },
    {
      to: '/reports',
      label: 'التقارير',
      icon: BarChart3,
      badge: undefined,
    },
    {
      to: '/settings',
      label: 'الإعدادات',
      icon: Settings,
      badge: undefined,
    },
  ];

  const handleResetDemoData = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة تعيين جميع البيانات التجريبية إلى حالتها الأصلية؟')) {
      await settingsService.resetAllData();
      toast.success('تمت إعادة تعيين البيانات التجريبية بنجاح');
      window.location.reload();
    }
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col justify-between border-l border-[#30333E] bg-[#17191F] transition-all duration-300 h-screen select-none z-30',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#30333E]/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#695CFF] text-white shadow-lg shadow-[#695CFF]/30">
              <Church className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-base text-[#F1F2F7] tracking-tight">
                  {APP_NAME}
                </span>
                <span className="text-[11px] text-[#A5A8B5] truncate">
                  {APP_SUBTITLE}
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-[#30333E] bg-[#20232B] text-[#A5A8B5] hover:text-[#F1F2F7] hover:bg-[#262A34] transition-colors"
            title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Demo Mode Notice Pill */}
        {!collapsed && (
          <div className="mx-4 mt-4 p-2.5 rounded-xl bg-[#695CFF]/10 border border-[#695CFF]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#9D94FF] font-medium">
              <span className="h-2 w-2 rounded-full bg-[#27CFA5] animate-pulse" />
              <span>وضع المعاينة التجريبي</span>
            </div>
            <button
              onClick={handleResetDemoData}
              className="text-[#A5A8B5] hover:text-white transition-colors p-1"
              title="إعادة تعيين البيانات"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="mt-4 px-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#695CFF] text-white shadow-md shadow-[#695CFF]/25 font-semibold'
                    : 'text-[#A5A8B5] hover:bg-[#20232B] hover:text-[#F1F2F7]'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-transform group-hover:scale-110',
                    isActive ? 'text-white' : 'text-[#A5A8B5] group-hover:text-[#F1F2F7]'
                  )}
                />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {item.badge && !isActive && (
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-medium',
                        item.badge === 'مفتوح'
                          ? 'bg-[#27CFA5]/15 text-[#27CFA5] border border-[#27CFA5]/30'
                          : 'bg-[#DDAA48]/15 text-[#DDAA48] border border-[#DDAA48]/30'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Admin User Profile Section */}
      <div className="p-3 border-t border-[#30333E]/60">
        <div className={cn(
          'flex items-center gap-3 rounded-xl bg-[#20232B] p-2.5 border border-[#30333E]',
          collapsed && 'justify-center p-2'
        )}>
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#695CFF] to-[#7A70FF] text-white font-bold text-xs shadow-sm">
              أدمن
            </div>
            <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-[#27CFA5] border-2 border-[#17191F]" />
          </div>

          {!collapsed && (
            <div className="flex flex-col truncate flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#F1F2F7] truncate">
                  أبونا / المشرف العام
                </span>
                <ShieldCheck className="h-3.5 w-3.5 text-[#695CFF]" />
              </div>
              <span className="text-[11px] text-[#A5A8B5]">مدير النظام (Admin)</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
