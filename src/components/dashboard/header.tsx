
"use client";

import Link from "next/link";
import { UserNav } from "./user-nav";
import { Logo } from "../icons/logo";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "./notification-bell";
import type { UserRole } from "@/lib/types";

export function Header({ userRole }: { userRole: UserRole | null }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAdmin = userRole === 'Admin';
  const isTeacherDashboard = pathname.startsWith('/teacher');
  const isStudentPortal = pathname.startsWith('/student') || pathname.startsWith('/guardian');
  const isGenericPortal = isTeacherDashboard || isStudentPortal;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex-1">
        {/* The logo is now part of the WelcomeHeader component */}
      </div>
      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
        {isAdmin && isGenericPortal && (
           <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">View as Admin</Link>
          </Button>
        )}
      </div>
      {isStudentPortal && <NotificationBell />}
      <UserNav userRole={userRole} />
    </header>
  );
}
