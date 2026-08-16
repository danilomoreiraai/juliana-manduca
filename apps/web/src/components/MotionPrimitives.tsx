import { m, useReducedMotion } from 'motion/react';
import type { PropsWithChildren } from 'react';
import { cn } from '../lib/cn';

type RevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'article';
  id?: string;
}>;

export const Reveal = ({ children, className, delay = 0, as = 'div', id }: RevealProps) => {
  const reduceMotion = useReducedMotion();
  const Component = m[as];

  return (
    <Component
      className={className}
      {...(id ? { id } : {})}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
};

export const SkeletonBlock = ({ className }: { className?: string }) => (
  <span className={cn('skeleton block', className)} aria-hidden="true" />
);

export const RouteSkeleton = () => (
  <div className="min-h-screen bg-ink-950 px-5 py-8" role="status" aria-label="Carregando página">
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between border-b border-ivory-100/15 pb-7">
        <SkeletonBlock className="h-12 w-56" />
        <SkeletonBlock className="h-10 w-72" />
      </div>
      <div className="grid gap-12 py-20 lg:grid-cols-2">
        <div>
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="mt-8 h-24 w-full" />
          <SkeletonBlock className="mt-3 h-24 w-4/5" />
          <SkeletonBlock className="mt-8 h-16 w-3/5" />
          <SkeletonBlock className="mt-9 h-12 w-64" />
        </div>
        <SkeletonBlock className="aspect-square w-full rounded-full" />
      </div>
    </div>
    <span className="sr-only">Carregando…</span>
  </div>
);

export const ContentSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-3" role="status" aria-label="Carregando conteúdo">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="border border-ivory-100/15 p-5">
        <SkeletonBlock className="h-4 w-2/5" />
        <SkeletonBlock className="mt-4 h-3 w-4/5" />
        <SkeletonBlock className="mt-2 h-3 w-3/5" />
      </div>
    ))}
    <span className="sr-only">Carregando…</span>
  </div>
);
