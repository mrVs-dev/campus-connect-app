import * as React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative h-12 w-12', className)} {...props}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="API School Logo"
      >
        {/* Background and Border */}
        <rect
          x="1"
          y="1"
          width="118"
          height="118"
          rx="12"
          ry="12"
          fill="#000000"
          stroke="#4B5563"
          strokeWidth="2"
        />

        {/* API Text */}
        <text
          x="50%"
          y="45%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#000000"
          fontSize="40"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          API
        </text>

        {/* Blue Swoosh Shapes */}
        <g fill="#1c5f90">
          <path d="M25,105 C40,80 50,75 70,80 L70,105 L25,105 Z" />
          <path d="M70,80 C90,85 100,95 110,105 L70,105 L70,80 Z" />
        </g>
      </svg>
    </div>
  );
}
