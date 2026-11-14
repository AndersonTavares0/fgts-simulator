import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl text-[14px] font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] disabled:cursor-default disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:opacity-90',
        secondary: 'border-input bg-card text-foreground hover:bg-muted border',
        ghost: 'text-foreground hover:bg-muted',
        danger: 'border-input bg-card text-destructive hover:bg-muted border',
      },
      size: { default: 'min-h-12 px-5', sm: 'min-h-9 px-3 text-[13px]', icon: 'size-9 px-0' },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Component = asChild ? Slot : 'button';
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
