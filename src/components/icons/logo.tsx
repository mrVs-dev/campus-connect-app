
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
      {/* Frame/Border */}
      <rect x="0" y="0" width="100" height="100" rx="15" ry="15" fill="#808080" />

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
      
      {/* Blue shape */}
      <path d="M 5,95 C 35,75 65,95 95,75 L 95,95 Z" fill="#206193" />
    </svg>
  );
}
