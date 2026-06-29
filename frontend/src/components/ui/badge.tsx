import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)]',
        secondary:
          'border-transparent bg-[color:var(--color-secondary)] text-[color:var(--color-secondary-foreground)]',
        outline:
          'border-[color:var(--color-border)] text-[color:var(--color-foreground)]',
        success:
          'border-transparent bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]',
        warning:
          'border-transparent bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]',
        destructive:
          'border-transparent bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };