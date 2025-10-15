
import type { SVGProps } from "react";
import Image from "next/image";
import type { UserRole } from "@/lib/types";

// This component now loads logos from the /public/logos/ directory.
// To add your logos, place files like 'admin-logo.png', 'teacher-logo.png', etc.
// in the 'public/logos' folder. Recommended size is at least 64x64 pixels.

const LOGO_BASE_PATH = "/logos";
const LOGO_SIZE = 64; // The base size for the logos, they will be scaled as needed.

const logoConfig: Record<UserRole | 'default', { src: string, alt: string }> = {
  Admin: {
    src: `${LOGO_BASE_PATH}/admin-logo.png`,
    alt: "Admin Logo"
  },
  Teacher: {
    src: `${LOGO_BASE_PATH}/teacher-logo.png`,
    alt: "Teacher Logo"
  },
  Student: {
    src: `${LOGO_BASE_PATH}/student-logo.png`,
    alt: "Student Logo"
  },
  Guardian: {
    src: `${LOGO_BASE_PATH}/guardian-logo.png`,
    alt: "Guardian Logo"
  },
  // A default logo if the role is not found or for general use.
  default: {
    src: `${LOGO_BASE_PATH}/default-logo.png`,
    alt: "CampusConnect Logo"
  },
};

// Fallback SVG to display if an image is missing
function FallbackLogo(props: SVGProps<SVGSVGElement>) {
  return (
     <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

interface LogoProps {
  userRole?: UserRole | null;
  className?: string;
}

export function Logo({ userRole, className, ...props }: LogoProps) {
  const roleKey = userRole && (userRole in logoConfig) ? userRole : 'default';
  const { src, alt } = logoConfig[roleKey] || logoConfig.default;

  return (
    <div className={className} style={{ width: props.width, height: props.height }}>
       <Image
          src={src}
          alt={alt}
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          // In case the logo is missing, show a fallback and log an error
          onError={(e) => {
            e.currentTarget.style.display = 'none'; // Hide the broken image
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) {
              fallback.style.display = 'block';
            }
          }}
       />
       <div style={{ display: 'none' }}>
         <FallbackLogo {...props} />
       </div>
    </div>
  );
}
