
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait until the auth state is fully determined.
    if (loading) {
      return; 
    }
    
    // Once loading is false, we can safely redirect.
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Display a loading indicator while the auth state is being resolved.
  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
      Loading...
    </div>
  );
}
