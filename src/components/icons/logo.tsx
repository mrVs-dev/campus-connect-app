
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative h-12 w-12', className)} {...props}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="translate(25, 60) scale(1.2)">
          {/* Shape 1 (left) - dark blue */}
          <path d="M 53.5,69.25 C 57,65.5 61.25,62.75 66.5,61.25 C 71.75,59.75 77,59 82.5,59 C 85,59 87,60.75 93.25,64" fill="none" stroke="#1c5f90" strokeWidth="6" />
          
          {/* Shape 2 (right) - dark blue */}
          <path d="M 141.5,112.5 C 148,121.25 142.75,124.75 136.75,127.25 C 130.75,129.75 124.25,131 117.5,131 C 110.5,131 104.25,129.75 98.5,127.25" fill="none" stroke="#1c5f90" strokeWidth="6" />

          {/* "API" letters - black */}
          <text x="50" y="85" fontFamily="Arial, Helvetica, sans-serif" fontSize="40" fill="#000000">A</text>
          <text x="70" y="85" fontFamily="Arial, Helvetica, sans-serif" fontSize="40" fill="#000000">P</text>
          <text x="95" y="85" fontFamily="Arial, Helvetica, sans-serif" fontSize="40" fill="#000000">I</text>
        </g>
      </svg>
    </div>
  );
}
