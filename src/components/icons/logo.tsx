
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative h-12 w-12', className)} {...props}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1080 1080"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2 }}
      >
        <g transform="matrix(1,0,0,1,-1470,-1930)">
          <g id="Artboard1" transform="matrix(1,0,0,1,1470,1930)">
            <rect x="0" y="0" width="1080" height="1080" style={{ fill: 'none' }} />
            <g transform="matrix(1,0,0,1,0,5.68434e-14)">
              <g transform="matrix(1,0,0,1,0,-240)">
                <g transform="matrix(1.58333,0,0,1.58333,-495.833,-1275.83)">
                  <path
                    d="M640,990C403.49,990 210,1183.49 210,1420C210,1656.51 403.49,1850 640,1850C876.51,1850 1070,1656.51 1070,1420C1070,1183.49 876.51,990 640,990ZM640,1022C859.35,1022 1038,1199.11 1038,1416.5C1038,1633.89 859.35,1811 640,1811C420.65,1811 242,1633.89 242,1416.5C242,1199.11 420.65,1022 640,1022Z"
                    style={{ fill: 'rgb(221,221,221)' }}
                  />
                </g>
                <g transform="matrix(1,0,0,1,0,240)">
                  <text
                    x="241.642"
                    y="556.741"
                    style={{ fontFamily: 'Arial, sans-serif', fontStretch: 'condensed', fontSize: '293.102px', fontWeight: 700, fill: '#000' }}
                  >
                    API
                  </text>
                </g>
              </g>
              <path
                d="M273.18,639.18C303.18,609.18 348.18,574.18 418.18,574.18C488.18,574.18 528.18,604.18 528.18,649.18C528.18,694.18 493.18,719.18 453.18,744.18C413.18,769.18 388.18,784.18 388.18,819.18"
                style={{ fill: 'none', stroke: '#1c5f90', strokeWidth: '35px' }}
              />
              <path
                d="M595.69,639.18C625.69,609.18 670.69,574.18 740.69,574.18C810.69,574.18 850.69,604.18 850.69,649.18C850.69,694.18 815.69,719.18 775.69,744.18C735.69,769.18 710.69,784.18 710.69,819.18"
                style={{ fill: 'none', stroke: '#1c5f90', strokeWidth: '35px' }}
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
