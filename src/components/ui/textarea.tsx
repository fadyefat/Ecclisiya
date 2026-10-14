import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-[#30333E] bg-[#101116] px-3 py-2 text-sm text-[#F1F2F7] placeholder:text-[#6C7080] transition-colors focus-visible:outline-none focus-visible:border-[#695CFF] focus-visible:ring-1 focus-visible:ring-[#695CFF] disabled:cursor-not-allowed disabled:opacity-50',
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
Textarea.displayName = 'Textarea';
