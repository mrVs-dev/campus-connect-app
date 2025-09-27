
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getTeachers } from '@/lib/firebase/firestore';
import type { Teacher } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    // Only check role once auth is resolved and we have a user
    if (!loading && user) {
      const checkUserRole = async () => {
        try {
          const teachers = await getTeachers();
          const isUserTeacher = teachers.some(teacher => teacher.email === user.email);
          setIsTeacher(isUserTeacher);
        } catch (error) {
          console.error("Failed to check user role:", error);
          // Default to non-teacher role on error
          setIsTeacher(false);
        } finally {
          setCheckingRole(false);
        }
      };
      checkUserRole();
    } else if (!loading && !user) {
      // If no user, no need to check role, just redirect to login
      setCheckingRole(false);
    }
  }, [user, loading]);

  useEffect(() => {
    // Redirect only when all loading states are resolved
    if (!loading && !checkingRole) {
      if (user) {
        if (isTeacher) {
          router.replace('/teacher/dashboard');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, checkingRole, isTeacher, router]);

  // Display a loading indicator while the auth state and role are being resolved.
  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
      Loading application...
    </div>
  );
}
