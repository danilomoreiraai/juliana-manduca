import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../lib/cn';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }
>;

export const Button = ({ className, variant = 'primary', children, ...props }: ButtonProps) => (
  <button
    className={cn(
      'inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'primary' && 'bg-gold-500 text-ink-950 hover:bg-gold-300',
      variant === 'secondary' &&
        'border border-ivory-200/20 bg-transparent text-ivory-100 hover:bg-white/5',
      variant === 'danger' && 'bg-red-950/80 text-red-100 hover:bg-red-900',
      className,
    )}
    {...props}
  >
    {children}
  </button>
);
