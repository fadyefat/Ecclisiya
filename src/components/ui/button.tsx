import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#695CFF] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#695CFF] text-[#F1F2F7] shadow-sm hover:bg-[#7A70FF] active:scale-[0.98]',
        secondary:
          'bg-[#20232B] text-[#F1F2F7] border border-[#30333E] hover:bg-[#262A34] hover:border-[#454958]',
        outline:
          'border border-[#30333E] bg-transparent text-[#F1F2F7] hover:bg-[#17191F] hover:border-[#695CFF]/60',
        ghost:
          'text-[#A5A8B5] hover:text-[#F1F2F7] hover:bg-[#20232B]',
        destructive:
          'bg-[#E85D75] text-[#F1F2F7] hover:bg-[#E85D75]/90 active:scale-[0.98]',
        success:
          'bg-[#27CFA5] text-[#101116] font-semibold hover:bg-[#27CFA5]/90 active:scale-[0.98]',
        amber:
          'bg-[#DDAA48] text-[#101116] font-semibold hover:bg-[#DDAA48]/90 active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'h-10 w-10',
        iconSm: 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
