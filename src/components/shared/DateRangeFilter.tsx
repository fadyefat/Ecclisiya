import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Calendar, Filter } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export interface DateFilterRange {
  key: 'today' | '7days' | '30days' | 'thisMonth' | 'all' | 'custom';
  from?: string;
  to?: string;
  label: string;
}

interface DateRangeFilterProps {
  value: DateFilterRange;
  onChange: (val: DateFilterRange) => void;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [showCustom, setShowCustom] = React.useState(value.key === 'custom');
  const [customFrom, setCustomFrom] = React.useState(value.from || '');
  const [customTo, setCustomTo] = React.useState(value.to || '');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const options: { key: DateFilterRange['key']; label: string; getRange: () => { from?: string; to?: string } }[] = [
    {
      key: 'all',
      label: 'كل الفترات',
      getRange: () => ({ from: undefined, to: undefined }),
    },
    {
      key: 'today',
      label: 'اليوم',
      getRange: () => ({ from: todayStr, to: todayStr }),
    },
    {
      key: '7days',
      label: 'آخر 7 أيام',
      getRange: () => ({ from: format(subDays(new Date(), 7), 'yyyy-MM-dd'), to: todayStr }),
    },
    {
      key: '30days',
      label: 'آخر 30 يومًا',
      getRange: () => ({ from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), to: todayStr }),
    },
    {
      key: 'thisMonth',
      label: 'هذا الشهر',
      getRange: () => ({
        from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      }),
    },
  ];

  const handleSelectOption = (opt: typeof options[0]) => {
    setShowCustom(false);
    const range = opt.getRange();
    onChange({
      key: opt.key,
      label: opt.label,
      from: range.from,
      to: range.to,
    });
  };

  const handleApplyCustom = () => {
    onChange({
      key: 'custom',
      label: 'فترة مخصصة',
      from: customFrom || undefined,
      to: customTo || undefined,
    });
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#17191F] border border-[#30333E] w-fit">
        <div className="flex items-center gap-1.5 px-2.5 text-xs text-[#A5A8B5] font-medium border-l border-[#30333E] ml-1">
          <Filter className="h-3.5 w-3.5" />
          <span>الفترة:</span>
        </div>

        {options.map((opt) => {
          const isSelected = value.key === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#695CFF] text-[#F1F2F7] shadow-sm font-semibold'
                  : 'text-[#A5A8B5] hover:text-[#F1F2F7] hover:bg-[#20232B]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
            value.key === 'custom' || showCustom
              ? 'bg-[#20232B] text-[#9D94FF] border border-[#695CFF]/30 font-semibold'
              : 'text-[#A5A8B5] hover:text-[#F1F2F7] hover:bg-[#20232B]'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>مخصص...</span>
        </button>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#17191F] border border-[#30333E] animate-in fade-in-50 text-xs text-[#A5A8B5]">
          <span className="font-medium">من:</span>
          <Input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="w-36 h-8 text-xs bg-[#101116]"
          />
          <span className="font-medium">إلى:</span>
          <Input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="w-36 h-8 text-xs bg-[#101116]"
          />
          <Button size="sm" onClick={handleApplyCustom} className="h-8 text-xs">
            تطبيق
          </Button>
        </div>
      )}
    </div>
  );
};
