
import * as React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
