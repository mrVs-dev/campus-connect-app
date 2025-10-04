
"use client";

import Link from "next/link";
import { UserNav } from "./user-nav";
import { Logo } from "../icons/logo";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAdmin = user?.email === "vannak@api-school.com";
  const isTeacherDashboard = pathname.startsWith('/teacher');
  const isStudentPortal = pathname.startsWith('/student') || pathname.startsWith('/guardian');

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-lg font-semibold text-primary"
      >
        <Logo className="h-6 w-6" />
        <span className="font-headline">CampusConnect</span>
      </Link>
      <div className="relative ml-auto flex-1 md:grow-0">
        {isAdmin && isStudentPortal && (
           <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">View as Admin</Link>
          </Button>
        )}
        {!isTeacherDashboard && !isStudentPortal && (
          <Button asChild variant="outline" size="sm">
            <Link href="/teacher/dashboard">View as Teacher</Link>
          </Button>
        )}
      </div>
      <UserNav />
    </header>
  );
}
