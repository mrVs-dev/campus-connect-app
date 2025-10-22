
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
      <rect width="100" height="100" rx="15" ry="15" fill="#000000" />
      <path
        d="M0 85C0 76.7157 6.71573 70 15 70H85C93.2843 70 100 76.7157 100 85V100H0V85Z"
        fill="#808080"
        fillOpacity="0"
      />
      <rect x="2" y="2" width="96" height="96" rx="13" ry="13" fill="#000000" stroke="#808080" strokeWidth="4" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="40"
        fill="#404040"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        API
      </text>
      <path
        d="M0 100 L0 75 C 20 85, 40 65, 60 75 L60 100 Z"
        fill="hsl(var(--primary))"
      />
      <path
        d="M100 100 L100 80 C 80 90, 50 70, 40 80 L40 100 Z"
        fill="hsl(var(--primary))"
      />
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
      <rect width="100" height="100" rx="15" ry="15" fill="#000000" />
      <path
        d="M0 85C0 76.7157 6.71573 70 15 70H85C93.2843 70 100 76.7157 100 85V100H0V85Z"
        fill="#808080"
        fillOpacity="0"
      />
      <rect x="2" y="2" width="96" height="96" rx="13" ry="13" fill="#000000" stroke="#808080" strokeWidth="4" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="40"
        fill="#404040"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
      >
        API
      </text>
      <path
        d="M0 100 L0 75 C 20 85, 40 65, 60 75 L60 100 Z"
        fill="hsl(var(--primary))"
      />
      <path
        d="M100 100 L100 80 C 80 90, 50 70, 40 80 L40 100 Z"
        fill="hsl(var(--primary))"
      />
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
