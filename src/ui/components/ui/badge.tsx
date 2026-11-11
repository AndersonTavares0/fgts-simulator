import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'border-border text-muted-foreground inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium',
        className,
      )}
      {...props}
    />
  );
}
