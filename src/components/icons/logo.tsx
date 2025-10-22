
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative h-12 w-12', className)} {...props}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <clipPath id="rounded-corners">
            <rect x="5" y="5" width="90" height="90" rx="15" ry="15" />
          </clipPath>
        </defs>
        
        {/* Background */}
        <rect x="5" y="5" width="90" height="90" rx="15" ry="15" fill="black" />

        {/* The two blue swooshes - using an embedded image for reliability */}
        <g clipPath="url(#rounded-corners)">
           <image 
              href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGggZD0iTSA1LDY1IEMgMjUsNTAgNjAsNjUgOTUsNTAgTCA5NSwxMDAgTCA1LDEwMCBaIiBmaWxsPSIjMWM1ZjkwIiAvPgogIDxwYXRoIGQ9Ik0gNSw4NSBDIDMwLDcwIDcwLDg1IDk1LDcwIEwgOTUsMTAwIEwgNSwxMDAgWiIgZmlsbD0iIzFjNWY5MCIgLz4KPC9zdmc+Cg=="
              x="0"
              y="0"
              height="100"
              width="100"
            />
        </g>
        
        {/* "API" letters */}
        <text 
            x="50" 
            y="45" 
            fontFamily="Arial, Helvetica, sans-serif" 
            fontSize="30" 
            fill="#000000" 
            textAnchor="middle" 
            dominantBaseline="middle"
            fontWeight="bold"
        >
            API
        </text>

        {/* Grey Border */}
        <rect x="5" y="5" width="90" height="90" rx="15" ry="15" fill="none" stroke="#808080" strokeWidth="3" />

      </svg>
    </div>
  );
}
