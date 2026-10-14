import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#A5A8B5]">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-xl border border-[#30333E] bg-[#101116] px-3 py-2 text-sm text-[#F1F2F7] placeholder:text-[#6C7080] transition-colors focus-visible:outline-none focus-visible:border-[#695CFF] focus-visible:ring-1 focus-visible:ring-[#695CFF] disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pr-9',
            error && 'border-[#E85D75] focus-visible:border-[#E85D75] focus-visible:ring-[#E85D75]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#E85D75]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
