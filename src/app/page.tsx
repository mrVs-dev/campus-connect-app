"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Display a loading indicator while redirecting.
  return (
     <div className="flex min-h-screen w-full items-center justify-center bg-background">
      Loading application...
    </div>
  );
}
