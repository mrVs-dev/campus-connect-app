import Image from 'next/image';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative', className)} {...props}>
      <Image
        src="/logo.svg"
        alt="CampusConnect Logo"
        fill
        sizes="100%"
        priority
      />
    </div>
  );
}
