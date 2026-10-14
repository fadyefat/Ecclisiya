import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'purple' | 'mint' | 'amber' | 'coral' | 'gray';
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'purple',
  trend,
}) => {
  const colorStyles = {
    purple: {
      bg: 'bg-[#695CFF]/10',
      border: 'border-[#695CFF]/20',
      text: 'text-[#695CFF]',
      bar: 'bg-[#695CFF]',
    },
    mint: {
      bg: 'bg-[#27CFA5]/10',
      border: 'border-[#27CFA5]/20',
      text: 'text-[#27CFA5]',
      bar: 'bg-[#27CFA5]',
    },
    amber: {
      bg: 'bg-[#DDAA48]/10',
      border: 'border-[#DDAA48]/20',
      text: 'text-[#DDAA48]',
      bar: 'bg-[#DDAA48]',
    },
    coral: {
      bg: 'bg-[#E85D75]/10',
      border: 'border-[#E85D75]/20',
      text: 'text-[#E85D75]',
      bar: 'bg-[#E85D75]',
    },
    gray: {
      bg: 'bg-[#20232B]',
      border: 'border-[#30333E]',
      text: 'text-[#A5A8B5]',
      bar: 'bg-[#A5A8B5]',
    },
  }[color];

  return (
    <Card className="relative overflow-hidden group hover:border-[#454958] transition-all duration-200">
      <div className={cn('absolute top-0 right-0 left-0 h-1', colorStyles.bar)} />
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-[#A5A8B5] line-clamp-1">{title}</span>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105',
              colorStyles.bg,
              colorStyles.border,
              colorStyles.text
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F2F7]">
            {value}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-[#A5A8B5] line-clamp-1">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive ? 'text-[#27CFA5]' : 'text-[#E85D75]'
                )}
              >
                {trend.value}
              </span>
              {trend.label && <span className="text-[#6C7080]">{trend.label}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
