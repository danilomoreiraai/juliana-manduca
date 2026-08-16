import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../lib/cn';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }
>;

export const Button = ({ className, variant = 'primary', children, ...props }: ButtonProps) => (
  <button
    className={cn(
      'inline-flex min-h-11 items-center justify-center border px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'primary' &&
        'border-gold-500 bg-gold-500 text-white hover:border-ivory-100 hover:bg-ivory-100',
      variant === 'secondary' &&
        'border-ivory-100/30 bg-transparent text-ivory-100 hover:border-gold-300 hover:bg-plum-700/35',
      variant === 'danger' && 'bg-red-950/80 text-red-100 hover:bg-red-900',
      className,
    )}
    {...props}
  >
    {children}
  </button>
);
