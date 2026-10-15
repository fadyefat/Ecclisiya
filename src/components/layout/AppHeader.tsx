import React from 'react';
import { Menu, Bell, Plus, Search, Sparkles, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../lib/theme-context';

interface AppHeaderProps {
  onOpenMobileMenu: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'لوحة التحكم';
    if (pathname.startsWith('/members')) return 'إدارة الأعضاء';
    if (pathname.startsWith('/attendance-days')) return 'جلسات الحضور';
    if (pathname.startsWith('/events')) return 'إدارة الفعاليات';
    if (pathname.startsWith('/reports')) return 'تقارير الحضور والغياب';
    if (pathname.startsWith('/settings')) return 'إعدادات الكنيسة والتطبيق';
    return 'لوحة التحكم';
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#30333E] bg-[#17191F]/90 backdrop-blur-md px-4 sm:px-6">
      {/* Right side: Mobile Menu Button & Current Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-[#30333E] bg-[#20232B] text-[#A5A8B5] hover:text-[#F1F2F7] transition-colors"
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-bold text-[#F1F2F7] tracking-tight">
            {getPageTitle(location.pathname)}
          </h2>
        </div>
      </div>

      {/* Center: Search Bar (Desktop) */}
      <div className="hidden md:flex items-center w-72 lg:w-80">
        <div className="relative w-full">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#A5A8B5]">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="بحث عام في النظام..."
            className="w-full rounded-xl border border-[#30333E] bg-[#101116] pr-9 pl-3 py-1.5 text-xs text-[#F1F2F7] placeholder:text-[#6C7080] focus:outline-none focus:border-[#695CFF] focus:ring-1 focus:ring-[#695CFF] transition-all"
          />
        </div>
      </div>

      {/* Left side: Quick actions, Theme Toggle, & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#20232B] border border-[#30333E] text-xs text-[#A5A8B5]">
          <Sparkles className="h-3.5 w-3.5 text-[#DDAA48]" />
          <span>نسخة النظام 1.0 (Demo)</span>
        </div>

        {/* Quick Theme Toggle Button (Sun / Moon) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#30333E] bg-[#20232B] text-[#A5A8B5] hover:text-[#F1F2F7] hover:bg-[#262A34] transition-colors"
          title={resolvedTheme === 'dark' ? 'التبديل إلى الوضع الفاتح (هوية الكنيسة)' : 'التبديل إلى الوضع الداكن'}
          aria-label="تبديل مظهر النظام"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-[#FCC260] transition-transform hover:rotate-45" />
          ) : (
            <Moon className="h-4 w-4 text-[#7A182B]" />
          )}
        </button>

        {/* Notifications Icon */}
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#30333E] bg-[#20232B] text-[#A5A8B5] hover:text-[#F1F2F7] hover:bg-[#262A34] transition-colors"
          title="الإشعارات"
          onClick={() => navigate('/members')}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 left-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E85D75] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E85D75]"></span>
          </span>
        </button>

        {/* Primary Action Button */}
        <Button
          size="sm"
          onClick={() => navigate('/attendance-days')}
          className="gap-1.5 font-medium shadow-md shadow-[#695CFF]/20"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">إنشاء اجتماع</span>
          <span className="sm:hidden">اجتماع</span>
        </Button>
      </div>
    </header>
  );
};
