import * as React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative h-12 w-12', className)} {...props}>
      {/* This is a placeholder. The real logo component was causing issues. */}
    </div>
  );
}
