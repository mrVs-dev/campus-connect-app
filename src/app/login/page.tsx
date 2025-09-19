
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { auth, firebaseConfig, isFirebaseConfigured } from "@/lib/firebase/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/icons/logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MissingFirebaseConfig() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Firebase Configuration Missing</CardTitle>
          <CardDescription>
            Your application is not connected to Firebase. Please configure your environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            To get started, you need to create a Firebase project and add its configuration to this application.
          </p>
          <p>
            Please follow the instructions in the <code className="bg-muted px-2 py-1 rounded-md text-sm">README.md</code> file
            to set up your <code className="bg-muted px-2 py-1 rounded-md text-sm">.env.local</code> file with the necessary Firebase keys.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = React.useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    async function handleRedirectResult() {
      if (!isFirebaseConfigured) {
        setIsProcessingRedirect(false);
        return;
      }
      try {
        await getRedirectResult(auth);
        // The onAuthStateChanged listener in useAuth will handle the user state update and redirect.
      } catch (error: any) {
        console.error("Authentication failed during redirect:", error);
        setError(`Failed to sign in. Error: ${error.message || error.code}`);
      } finally {
        setIsProcessingRedirect(false);
      }
    }
    handleRedirectResult();
  }, []);

  React.useEffect(() => {
    // Wait until both auth state is resolved and redirect is processed
    if (!authLoading && !isProcessingRedirect && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, isProcessingRedirect, router]);

  const handleSignIn = async () => {
    if (!isFirebaseConfigured) {
      setError("Firebase is not configured. Please check your .env.local file.");
      return;
    }
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Authentication failed:", error);
      setError(`Failed to sign in. Error: ${error.message || error.code}`);
    }
  };

  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }

  // Show a loading screen while auth is in progress or redirect is being processed.
  if (authLoading || isProcessingRedirect) {
    return <div className="flex min-h-screen items-center justify-center">Authenticating...</div>;
  }

  // Only render the login card if we are done loading and there is no user.
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Welcome to CampusConnect</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full" onClick={handleSignIn}>
                <GoogleIcon />
                <span className="ml-2">Sign in with Google</span>
            </Button>
          </CardContent>
          <CardFooter className="flex-col items-start text-xs text-muted-foreground">
            <div className="border-t pt-2 mt-2 w-full text-center">
               <p><strong>App's Project ID:</strong></p>
               <p className="font-mono break-all">{firebaseConfig.projectId || "Not Found in .env.local"}</p>
               <p className="mt-2 text-balance">Please ensure this Project ID matches the one in your Firebase Console.</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If there is a user, show a redirecting message while the effect above runs.
  return (
    <div className="flex min-h-screen items-center justify-center">
        Redirecting to dashboard...
    </div>
  );
}
