import type { LabelHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  // Consumers always pass htmlFor; the lint rule only inspects this file.
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  return <label className={cn('text-[13.5px] font-medium', className)} {...props} />;
}
