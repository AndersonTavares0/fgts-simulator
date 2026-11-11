import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'border-border bg-card text-foreground min-h-12 w-full appearance-none rounded-lg border px-3 py-2 pr-9 text-[15.5px] transition-colors',
          'hover:border-input disabled:cursor-not-allowed disabled:opacity-40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
    </div>
  );
}
