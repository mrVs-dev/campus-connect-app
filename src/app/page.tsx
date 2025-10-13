"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  // const { user, loading } = useAuth();

  useEffect(() => {
    router.replace('/dashboard');
    // if (!loading) {
    //   if (user) {
    //     router.replace('/dashboard');
    //   } else {
    //     router.replace('/login');
    //   }
    // }
  }, [router]);

  // Display a loading indicator while checking auth state.
  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
      Redirecting to dashboard for testing...
    </div>
  );
}
