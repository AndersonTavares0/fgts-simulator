import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'border-border bg-card text-foreground placeholder:text-muted-foreground min-h-11 w-full min-w-0 rounded-xl border px-3 py-2 text-[16px] transition-colors',
        'hover:border-input aria-invalid:border-destructive/70 aria-invalid:ring-destructive/15 aria-invalid:ring-4',
        className,
      )}
      {...props}
    />
  );
}
