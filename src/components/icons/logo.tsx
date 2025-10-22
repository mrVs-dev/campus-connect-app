
import type { SVGProps } from "react";
import type { UserRole } from "@/lib/types";

function AdminLogo(props: SVGProps<SVGSVGElement>) {
  const { fill, ...otherProps } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      {...otherProps}
    >
      <rect width="100" height="100" rx="15" ry="15" fill="hsl(var(--primary))" />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="50"
        fill="hsl(var(--primary-foreground))"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        API
      </text>
    </svg>
  );
}

function TeacherLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function StudentLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function GuardianLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function DefaultLogo(props: SVGProps<SVGSVGElement>) {
  const { fill, ...otherProps } = props;
    return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      {...otherProps}
    >
      <rect width="100" height="100" rx="15" ry="15" fill="hsl(var(--primary))" />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="50"
        fill="hsl(var(--primary-foreground))"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        API
      </text>
    </svg>
  );
}

const roleToLogoMap: Record<string, React.FC<SVGProps<SVGSVGElement>>> = {
  Admin: AdminLogo,
  Teacher: TeacherLogo,
  Student: StudentLogo,
  Guardian: GuardianLogo,
};

export function Logo({
  userRole,
  ...props
}: SVGProps<SVGSVGElement> & { userRole?: UserRole | null }) {
  const LogoComponent =
    userRole && roleToLogoMap[userRole] ? roleToLogoMap[userRole] : DefaultLogo;

  return <LogoComponent {...props} />;
}
