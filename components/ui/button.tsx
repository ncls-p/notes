import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary via-primary to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:from-primary/90 hover:to-primary/80',
        destructive:
          'bg-gradient-to-r from-destructive to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 hover:from-destructive/90 hover:to-red-500',
        outline:
          'border-2 bg-background/50 backdrop-blur-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] hover:bg-accent hover:text-accent-foreground hover:border-accent/50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50 dark:hover:border-input/70',
        secondary:
          'bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] hover:from-secondary/90 hover:to-secondary/70',
        ghost:
          'hover:bg-accent/80 hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98] dark:hover:bg-accent/50 transition-all duration-200',
        link: 'text-primary underline-offset-4 hover:underline hover:scale-[1.05] active:scale-[0.95]',
        primary:
          'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:from-purple-600 hover:via-pink-600 hover:to-red-600 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200',
        success:
          'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:from-green-600 hover:to-emerald-600',
        warning:
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:from-amber-600 hover:to-orange-600',
      },
      size: {
        default: 'h-10 px-6 py-2 has-[>svg]:px-4',
        sm: 'h-8 rounded-md gap-1.5 px-4 has-[>svg]:px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 has-[>svg]:px-6 text-base font-semibold',
        xl: 'h-14 rounded-xl px-10 has-[>svg]:px-8 text-lg font-semibold',
        icon: 'size-10',
        'icon-sm': 'size-8',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  if (asChild) {
    // When using asChild, we can't add the ripple effect as it would create multiple children
    // The Slot component expects exactly one React element child
    return (
      <Comp
        data-slot='button'
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      {/* Ripple effect overlay - only when not using asChild */}
      <span className='absolute inset-0 rounded-md overflow-hidden'>
        <span className='absolute inset-0 bg-white/20 transform scale-0 group-active:scale-100 rounded-full transition-transform duration-200 ease-out origin-center'></span>
      </span>
    </Comp>
  );
}

export { Button, buttonVariants };
