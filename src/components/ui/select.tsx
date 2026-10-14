import * as React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#A5A8B5]">
            {icon}
          </div>
        )}
        <select
          className={cn(
            'flex h-10 w-full appearance-none rounded-xl border border-[#30333E] bg-[#101116] px-3 py-2 text-sm text-[#F1F2F7] transition-colors focus-visible:outline-none focus-visible:border-[#695CFF] focus-visible:ring-1 focus-visible:ring-[#695CFF] disabled:cursor-not-allowed disabled:opacity-50 pl-8',
            icon && 'pr-9',
            error && 'border-[#E85D75]',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#A5A8B5]">
          <ChevronDown className="h-4 w-4" />
        </div>
        {error && <p className="mt-1 text-xs text-[#E85D75]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
