
import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative h-12 w-12', className)} {...props}>
      <Image
        src="/API_Round_Logo.svg"
        alt="API School Logo"
        layout="fill"
        objectFit="contain"
      />
    </div>
  );
}
