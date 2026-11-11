import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from '@heroicons/react/24/outline';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'border-input bg-card size-[18px] shrink-0 cursor-pointer rounded-[4px] border',
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-primary-foreground grid place-items-center">
        <CheckIcon className="size-3.5" strokeWidth={3} aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
