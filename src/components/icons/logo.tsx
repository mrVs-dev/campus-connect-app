
import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative h-12 w-12', className)} {...props}>
      <Image
        src="/API_Round_Logo.svg"
        alt="API School Logo"
        width={1080}
        height={1080}
        style={{
          filter: 'hue-rotate(180deg) saturate(2) brightness(0.8)',
        }}
      />
    </div>
  );
}
