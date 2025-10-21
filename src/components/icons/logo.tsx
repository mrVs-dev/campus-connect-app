
import type { SVGProps } from "react";
import type { UserRole } from "@/lib/types";

function AdminLogo(props: SVGProps<SVGSVGElement>) {
  const { fill, ...otherProps } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      {...otherProps}
    >
      <path
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z"
        fill={fill || "hsl(var(--primary))"}
      />
      <path
        d="M168 80h-24a40 40 0 0 0-72 24v48a8 8 0 0 0 16 0v-48a24 24 0 0 1 48-16h-8a8 8 0 0 0 0 16h8a8 8 0 0 0 8-8V88a8 8 0 0 0-8-8Z"
        fill={fill || "hsl(var(--primary))"}
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
      viewBox="0 0 256 256"
      fill="currentColor"
      {...otherProps}
    >
      <path
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z"
        fill={fill || "hsl(var(--primary))"}
      />
      <path
        d="M168 80h-24a40 40 0 0 0-72 24v48a8 8 0 0 0 16 0v-48a24 24 0 0 1 48-16h-8a8 8 0 0 0 0 16h8a8 8 0 0 0 8-8V88a8 8 0 0 0-8-8Z"
        fill={fill || "hsl(var(--primary))"}
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
