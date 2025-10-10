
'use client';

import * as React from 'react';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// This is a client-side component that should be rendered once in your layout.
// It listens for custom permission errors and displays them.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  React.useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error('Caught Firestore Permission Error:', error.message);
      
      // In a real app, you might use a more sophisticated error display
      // than the browser's default toast. For development, this is effective.
       toast({
        variant: "destructive",
        title: "Firestore Permission Error",
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{error.message}</code>
          </pre>
        ),
        duration: Infinity, // Keep the toast open until manually closed
      });

      // You can also throw the error to make it appear in the Next.js dev overlay
      throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything itself.
}
