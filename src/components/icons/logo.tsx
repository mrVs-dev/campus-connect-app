
import Image from 'next/image';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative', className)} {...props}>
      <Image
        src="/API_Round_Logo.svg"
        alt="API School Logo"
        fill
        sizes="100%"
        priority
        className="rounded-full"
      />
    </div>
  );
}
