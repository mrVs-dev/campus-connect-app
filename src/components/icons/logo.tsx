
import type { SVGProps } from "react";
import type { UserRole } from "@/lib/types";

// This is a placeholder for your actual logos. 
// You can replace the SVG content for each role with your own.

function AdminLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function TeacherLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M18 22v-4a6 6 0 0 0-12 0v4" />
      <circle cx="12" cy="4" r="2" />
      <path d="M12 6v10" />
    </svg>
  );
}

function StudentLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 14.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z" />
        <path d="M18 20a6 6 0 0 0-12 0" />
    </svg>
  );
}

function GuardianLogo(props: SVGProps<SVGSVGElement>) {
  return (
     <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 20a5 5 0 0 0-10 0" />
      <path d="M12 14a5 5 0 0 0 5-5V7a5 5 0 0 0-10 0v2a5 5 0 0 0 5 5Z" />
      <path d="M12 4a2 2 0 0 1 2 2v0a2 2 0 0 1-4 0v0a2 2 0 0 1 2-2Z" />
      <path d="M8 20a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2" />
      <path d="M16 20a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2" />
    </svg>
  );
}


interface LogoProps extends SVGProps<SVGSVGElement> {
  userRole?: UserRole | null;
}

export function Logo({ userRole, ...props }: LogoProps) {
  switch (userRole) {
    case 'Teacher':
      return <TeacherLogo {...props} />;
    case 'Student':
      return <StudentLogo {...props} />;
    case 'Guardian':
      return <GuardianLogo {...props} />;
    case 'Admin':
    default:
      return <AdminLogo {...props} />;
  }
}
