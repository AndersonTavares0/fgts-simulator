import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'border-border bg-card text-foreground placeholder:text-muted-foreground min-h-12 w-full min-w-0 rounded-lg border px-3 py-2 text-[16px] transition-colors',
        'hover:border-input aria-invalid:border-destructive aria-invalid:border-2',
        className,
      )}
      {...props}
    />
  );
}
