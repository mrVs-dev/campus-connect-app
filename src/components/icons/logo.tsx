
import type { SVGProps } from "react";
import type { UserRole } from "@/lib/types";

// To add your logos, replace the placeholder <svg> code inside each
// component (AdminLogo, TeacherLogo, etc.) with your own SVG code.

function AdminLogo(props: SVGProps<SVGSVGElement>) {
  return (
    // Replace this with your Admin logo SVG code
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function TeacherLogo(props: SVGProps<SVGSVGElement>) {
  return (
    // Replace this with your Teacher logo SVG code
     <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M18 10a6 6 0 1 0-12 0" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function StudentLogo(props: SVGProps<SVGSVGElement>) {
  return (
    // Replace this with your Student logo SVG code
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 14.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z" />
        <path d="M18 22h-1.42a4 4 0 0 0-3.16-1.44H9.58A4 4 0 0 0 6.42 22H5" />
    </svg>
  );
}

function GuardianLogo(props: SVGProps<SVGSVGElement>) {
  return (
     // Replace this with your Guardian logo SVG code
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2.5" />
      <path d="m21.2 13.2-1.4-1.4" />
      <path d="m16.8 17.6-1.4-1.4" />
      <path d="m19.6 14.8.4.4" />
      <path d="m18 16-1.4 1.4" />
      <circle cx="19" cy="16" r="3" />
    </svg>
  );
}

function DefaultLogo(props: SVGProps<SVGSVGElement>) {
  return (
    // This is the fallback logo. For your use case, it should be the same as the AdminLogo.
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

const logoMap: Record<UserRole | 'default', (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
  Admin: AdminLogo,
  Teacher: TeacherLogo,
  Student: StudentLogo,
  Guardian: GuardianLogo,
  default: DefaultLogo,
};

interface LogoProps {
  userRole?: UserRole | null;
  className?: string;
  [key: string]: any; 
}

export function Logo({ userRole, className, ...props }: LogoProps) {
  const roleKey = userRole && (userRole in logoMap) ? userRole : 'default';
  const LogoComponent = logoMap[roleKey] || DefaultLogo;
  return <LogoComponent className={className} {...props} />;
}
