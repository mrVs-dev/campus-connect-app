
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getTeacherForUser } from '@/lib/firebase/firestore';
import type { Teacher } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return; // Wait until authentication state is resolved
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    const determineRedirect = async () => {
      // This is a simple check for a student/guardian portal based on email format.
      // A more robust system might check for a specific student record.
      if (user.email?.includes('@student.campusconnect.edu')) {
         router.replace('/student/dashboard');
         return;
      }
      if (user.email?.includes('@guardian.campusconnect.edu')) {
         router.replace('/guardian/dashboard');
         return;
      }
      
      // Check if the user is a teacher and what their role is.
      try {
        const teacher: Teacher | null = await getTeacherForUser(user.uid);
        
        if (teacher?.role === 'Teacher') {
          router.replace('/teacher/dashboard');
        } else {
          // Default to the main admin/staff dashboard for all other roles
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error("Error determining user role, defaulting to main dashboard:", error);
        router.replace('/dashboard');
      }
    };

    determineRedirect();

  }, [router, user, loading]);

  // Display a loading indicator while checking auth and role state.
  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
      Loading...
    </div>
  );
}
