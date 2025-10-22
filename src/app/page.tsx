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
      try {
        const staffMember: Teacher | null = await getTeacherForUser(user.uid);
        
        // This is a special case for the initial admin user who might not have a teacher record yet.
        if (user.email === 'vannak@api-school.com') {
          router.replace('/dashboard');
          return;
        }

        if (staffMember?.role === 'Admin') {
            router.replace('/dashboard');
        } else if (staffMember?.role === 'Teacher') {
            router.replace('/teacher/dashboard');
        } else if (user.email?.endsWith('@guardian.campusconnect.edu')) {
            router.replace('/guardian/dashboard');
        } else if (user.email?.endsWith('@student.campusconnect.edu')) {
            router.replace('/student/dashboard');
        } else {
          // Default to the main admin/staff dashboard for all other roles or if no specific role is found.
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error("Error determining user role, defaulting to main dashboard:", error);
        router.replace('/dashboard');
      }
    };

    determineRedirect();

  }, [router, user, loading]);

  // Display a full-screen loading indicator while checking auth and role state.
  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
      Loading...
    </div>
  );
}
