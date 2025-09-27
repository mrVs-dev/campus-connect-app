
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect once the auth state is no longer loading
    if (!loading) {
      if (user) {
        // For now, all authenticated users go to the main dashboard.
        // We will add logic here later to redirect teachers to /teacher/dashboard.
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Display a loading indicator while the auth state is being resolved.
  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
      Loading application...
    </div>
  );
}
