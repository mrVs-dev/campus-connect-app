
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <defs>
        <clipPath id="rounded-corners">
          <rect x="5" y="5" width="90" height="90" rx="10" ry="10" />
        </clipPath>
      </defs>
      
      {/* Frame/Border */}
      <rect x="0" y="0" width="100" height="100" rx="15" ry="15" fill="#808080" />

      {/* Content with transparent background */}
      <g clipPath="url(#rounded-corners)">
        <rect x="5" y="5" width="90" height="90" fill="transparent" />
        
        {/* API Text */}
        <text 
          x="50" 
          y="45" 
          fontFamily="Arial, sans-serif" 
          fontSize="40" 
          fill="#333333" 
          textAnchor="middle" 
          dominantBaseline="middle"
        >
          API
        </text>
        
        {/* Blue shapes */}
        <path d="M 5,95 C 25,65 55,85 95,55 L 95,95 Z" fill="#206193" />
        <path d="M 5,95 C 35,75 65,95 95,75 L 95,95 Z" fill="#206193" />
      </g>
    </svg>
  );
}
