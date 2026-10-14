import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[#695CFF]/15 text-[#9D94FF] border border-[#695CFF]/30',
        mint:
          'bg-[#27CFA5]/15 text-[#27CFA5] border border-[#27CFA5]/30',
        amber:
          'bg-[#DDAA48]/15 text-[#E6BC64] border border-[#DDAA48]/30',
        coral:
          'bg-[#E85D75]/15 text-[#F28296] border border-[#E85D75]/30',
        gray:
          'bg-[#20232B] text-[#A5A8B5] border border-[#30333E]',
        outline:
          'text-[#F1F2F7] border border-[#30333E]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'mint' && 'bg-[#27CFA5]',
            variant === 'amber' && 'bg-[#DDAA48]',
            variant === 'coral' && 'bg-[#E85D75]',
            variant === 'default' && 'bg-[#695CFF]',
            (!variant || variant === 'gray' || variant === 'outline') && 'bg-[#A5A8B5]'
          )}
        />
      )}
      {children}
    </div>
  );
}
